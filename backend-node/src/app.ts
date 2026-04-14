import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import * as admin from 'firebase-admin';
// @ts-ignore
import pdf from 'pdf-parse';
import { rateLimit } from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';
import { authenticate, requireRole, AuthRequest } from './middlewares/authMiddleware';
import {
    saveJob, getJobById, connectDB, saveDossier, getAllDossiers, getAllJobs,
    saveUser, getUserByEmail, getCandidateProfile, upsertCandidateProfile,
    saveApplication, getApplicationsByCandidate, applicationExists,
    updateJob, deleteJob, getJobsByRecruiter, updateApplicationStatus,
    getApplicationById, saveInterviewResult, getInterviewResults
} from './services/dbService';
import { screenResume, generateQuestions, evaluateInterview, suggestJobSkills } from './services/aiService';
import OpenAI from 'openai';

const groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || '',
    baseURL: 'https://api.groq.com/openai/v1',
});

dotenv.config();

const app = express();

// ── CORS: allow Vercel deployment + local dev origins ─────────────────────────
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    process.env.FRONTEND_URL,          // e.g. https://precisely-xi.vercel.app
    'https://precisely-xi.vercel.app', // hardcoded fallback in case env var missing
].filter(Boolean) as string[];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Also allow any *.vercel.app for preview deployments
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        return callback(new Error(`CORS: origin ${origin} is not allowed`));
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('INVALID_FILE_TYPE'));
    }
});

const JWT_SECRET = process.env.JWT_SECRET || "fallback_default_jwt_secret_precisely_123";
const IS_PROD = process.env.NODE_ENV === 'production';

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ─── NODEMAILER SETUP (Gmail App Password) ────────────────────────────────────
// SMTP_PASS must be a 16-character Gmail App Password.
// Go to Google Account > Security > 2-Step Verification > App Passwords to generate one.

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Startup SMTP check
transporter.verify((err) => {
    if (err) {
        console.error('❌ SMTP failed:', err.message);
    } else {
        console.log('✅ SMTP ready: Gmail transporter connected.');
    }
});

const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        // In development/staging without SMTP configured, print to server log
        // so the magic link / OTP can be retrieved from Render logs
        console.log(`\n[EMAIL FALLBACK — SMTP NOT CONFIGURED]`);
        console.log(`  To:      ${to}`);
        console.log(`  Subject: ${subject}`);
        // Extract any URLs from the HTML so magic links are visible in logs
        const urlMatch = html.match(/href="(https?:\/\/[^"]+)"/);
        if (urlMatch) console.log(`  Link:    ${urlMatch[1]}`);
        console.log(`[END EMAIL FALLBACK]\n`);
        return;
    }
    await transporter.sendMail({
        from: `"Precisely AI" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
    });
};

// ─── PUBLIC ROUTES & AUTH MIDDLEWARES ─────────────────────────────────────────

app.get('/', (req, res) => res.json({ status: 'ok', service: 'Precisely API' }));

// ─── FIREBASE ADMIN INIT ─────────────────────────────────────────────────────

try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
        : undefined;
    if (serviceAccount) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        console.log('✅ Firebase Admin initialized.');
    } else {
        admin.initializeApp();
        console.warn('⚠️  Firebase Admin initialized without service account (using default credentials).');
    }
} catch (err: any) {
    console.error('❌ Firebase Admin init failed:', err.message);
}

// ─── GOOGLE FIREBASE SIGN-IN ─────────────────────────────────────────────────

app.post('/api/auth/google-firebase', asyncHandler(async (req: Request, res: Response) => {
    const { idToken, role } = req.body;
    if (!idToken) return res.status(400).json({ error: 'Firebase ID token is required.' });
    if (role !== 'HR' && role !== 'Candidate') return res.status(400).json({ error: 'Invalid role.' });

    // Verify the Firebase ID token
    let decoded;
    try {
        decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err: any) {
        console.error('[Firebase Token Verify FAIL]', err.message);
        return res.status(401).json({ error: 'Invalid or expired Google token. Please try again.' });
    }

    const email = decoded.email;
    if (!email) return res.status(400).json({ error: 'No email found in Google account.' });

    // Find or create the user
    let user = await getUserByEmail(email);
    if (!user) {
        const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
        await saveUser(email, role, passwordHash);
        user = await getUserByEmail(email);
    }

    const jwtPayload = { id: user?._id?.toString() || user?.id || email, email, role: user?.role || role };
    const jwtToken = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', jwtToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, role: user?.role || role, email });
}));


// ─── OTP REGISTRATION FLOW ────────────────────────────────────────────────────

const otpStore = new Map<string, { otp: string, expires: number, verified: boolean }>();

app.post('/api/auth/send-otp', asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (await getUserByEmail(email)) return res.status(400).json({ error: 'An account with this email already exists' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000, verified: false });

    try {
        await sendEmail(
            email,
            'Your Precisely AI Registration OTP',
            `<div style="font-family:sans-serif; text-align:center;">
               <h2>Welcome to Precisely</h2>
               <p>Your authorization code is:</p>
               <h1 style="font-size:32px; letter-spacing:4px; color:#3B82F6">${otp}</h1>
               <p>This code expires in 10 minutes.</p>
             </div>`
        );
        res.json({ message: 'OTP sent' });
    } catch (err: any) {
        otpStore.delete(email); // clean up on failure
        console.error('[OTP EMAIL FAIL]', err);
        res.status(500).json({ error: `Failed to send OTP: ${err.message}` });
    }
}));

app.post('/api/auth/verify-otp', asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const record = otpStore.get(email);
    if (!record) return res.status(400).json({ error: 'No OTP requested for this email' });
    if (Date.now() > record.expires) {
        otpStore.delete(email);
        return res.status(400).json({ error: 'OTP expired' });
    }
    if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    
    otpStore.set(email, { ...record, verified: true });
    res.json({ message: 'Email verified successfully' });
}));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

app.post('/api/auth/register', authLimiter, asyncHandler(async (req: Request, res: Response) => {
    const { email, password, role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: 'Email, password, and role are required.' });
    if (role !== 'HR' && role !== 'Candidate') return res.status(400).json({ error: 'Invalid role.' });

    // Validate OTP status
    const otpRecord = otpStore.get(email);
    if (!otpRecord?.verified) return res.status(403).json({ error: 'Email must be verified via OTP first.' });
    
    const strongPassword = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!strongPassword.test(password)) return res.status(400).json({ error: 'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.' });

    const existing = await getUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = await saveUser(email, role, passwordHash);
    
    // Clear OTP memory
    otpStore.delete(email);

    const token = jwt.sign({ id: userId || email, email, role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ role, email });
}));

app.post('/api/auth/login', authLimiter, asyncHandler(async (req: Request, res: Response) => {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await getUserByEmail(email);
    const DUMMY_HASH = '$2b$12$dummyhashvaluetopreventtimingattackslolXXXXXXXXXXXXXX';
    const hashToCompare = user?.passwordHash || DUMMY_HASH;
    const isValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !isValid) return res.status(401).json({ error: 'Invalid credentials.' });
    if (role && user.role !== role) {
        return res.status(403).json({ error: `Security failure: This account belongs to a ${user.role}. Please use the correct login portal.` });
    }

    const token = jwt.sign({ id: user._id?.toString() || user.id || user.email, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ role: user.role, email: user.email });
}));

app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ message: 'Logged out successfully.' });
});

app.get('/api/auth/me', authenticate, (req: AuthRequest, res: Response) => {
    res.json({ role: req.user?.role, email: req.user?.email, id: req.user?.id });
});

// ─── JOB SUGGEST ─────────────────────────────────────────────────────────────

app.post('/api/jobs/suggest', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const suggestions = await suggestJobSkills(title);
    res.json({ suggestions });
}));

// ─── JOBS (public read with pagination) ────────────────────────────────────────

app.get('/api/jobs', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 100));
    const { jobs, total } = await getAllJobs(page, limit);
    const totalPages = Math.ceil(total / limit);
    res.json({ jobs, total, page, totalPages, limit });
}));

app.post('/api/jobs', authenticate, requireRole('HR'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const jobData = { ...req.body, recruiterId: req.user!.id as string, recruiterEmail: req.user!.email as string, status: 'Active' };
    const docId = await saveJob(jobData);
    res.json({ message: 'Job created', id: docId });
}));

app.patch('/api/jobs/:jobId', authenticate, requireRole('HR'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { jobId } = req.params;
    const job = await getJobById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    if (job.recruiterId !== req.user!.id as string) return res.status(403).json({ error: 'Forbidden: You do not own this job.' });

    const allowed = ['title', 'description', 'must_have_skills', 'nice_to_have_skills', 'salary', 'location', 'job_type', 'experience_level', 'deadline', 'status'];
    const updateData: any = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) updateData[key] = req.body[key]; });

    const updated = await updateJob(jobId, req.user!.id as string, updateData);
    if (!updated) return res.status(404).json({ error: 'Job not found or not authorized.' });
    res.json({ message: 'Job updated successfully', job: updated });
}));

app.delete('/api/jobs/:jobId', authenticate, requireRole('HR'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { jobId } = req.params;
    const job = await getJobById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    if (job.recruiterId !== req.user!.id as string) return res.status(403).json({ error: 'Forbidden: You do not own this job.' });

    const deleted = await deleteJob(jobId, req.user!.id as string);
    if (!deleted) return res.status(404).json({ error: 'Job not found or not authorized.' });
    res.json({ message: 'Job deleted successfully' });
}));

// ─── RECRUITER ROUTES ─────────────────────────────────────────────────────────

app.get('/api/recruiter/jobs', authenticate, requireRole('HR'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const { jobs, total } = await getJobsByRecruiter(req.user!.id as string, page, limit);
    const totalPages = Math.ceil(total / limit);
    res.json({ jobs, total, page, totalPages, limit });
}));

app.get('/api/recruiter/applicants/:applicationId/resume', authenticate, requireRole('HR'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { applicationId } = req.params;
    const application = await getApplicationById(applicationId);
    if (!application) return res.status(404).json({ error: 'Application not found.' });

    // Get the candidate profile for resume metadata
    const profile = await getCandidateProfile(application.candidateEmail);
    if (!profile?.resume) return res.status(404).json({ error: 'No resume uploaded by this candidate.' });

    res.json({
        filename: profile.resume.filename,
        uploadedAt: profile.resume.uploadedAt,
        size: profile.resume.size,
        url: profile.resume.url,
        candidateName: profile.fullName || application.candidateEmail
    });
}));

// ─── APPLICATION STATUS ────────────────────────────────────────────────────────

app.patch('/api/applications/:applicationId/status', authenticate, requireRole('HR'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { applicationId } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Reviewed', 'Shortlisted', 'Rejected'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });

    const updated = await updateApplicationStatus(applicationId, status);
    if (!updated) return res.status(404).json({ error: 'Application not found.' });

    // Send email notification on key status changes
    const application = await getApplicationById(applicationId);
    if (application?.candidateEmail) {
        if (status === 'Shortlisted') {
            await sendEmail(
                application.candidateEmail,
                '🎉 You have been shortlisted — Precisely AI',
                `<p>Congratulations! Your application for <strong>${application.jobTitle || 'the position'}</strong> has been reviewed and you've been shortlisted. The HR team will be in touch soon.</p>`
            );
        } else if (status === 'Rejected') {
            await sendEmail(
                application.candidateEmail,
                'Application Update — Precisely AI',
                `<p>Thank you for your interest in <strong>${application.jobTitle || 'the position'}</strong>. After careful consideration, we've decided to move forward with other candidates. We encourage you to apply again in the future.</p>`
            );
        }
    }

    res.json({ message: `Status updated to ${status}`, status });
}));

// ─── DUPLICATE APPLICATION CHECK ──────────────────────────────────────────────

app.get('/api/applications/check', authenticate, requireRole('Candidate'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const jobId = req.query.jobId as string;
    if (!jobId) return res.status(400).json({ error: 'jobId query param required.' });
    const applied = await applicationExists(req.user!.email as string, jobId);
    res.json({ applied });
}));

// ─── CANDIDATE ROUTES ─────────────────────────────────────────────────────────

app.post('/api/candidates/screen', authenticate, requireRole('Candidate'), upload.single('resume'), asyncHandler(async (req: AuthRequest, res: Response) => {
    // Resolve job_id — accept either field name from client
    const job_id = req.body.job_id || req.body.jobId;
    if (!job_id) return res.status(400).json({ error: 'jobId is required. Please select a job before uploading.' });
    const candidateEmail = req.user!.email as string;

    // Prevent duplicate applications
    const alreadyApplied = await applicationExists(candidateEmail, job_id);
    if (alreadyApplied) return res.status(409).json({ error: 'You have already applied to this job.' });

    let raw_text = req.body.raw_text || "";
    let dataUrl = "";
    if (req.file) {
        try {
            const parsed = await pdf(req.file.buffer);
            raw_text = parsed.text;
            
            // Generate DataURL for storing the actual file for recruiter to download later
            const base64Data = req.file.buffer.toString('base64');
            dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;
            const resumeMeta = {
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                uploadedAt: new Date().toISOString(),
                size: req.file.size,
                url: dataUrl
            };
            // Associate the full resume with the candidate's profile
            await upsertCandidateProfile(candidateEmail, { resume: resumeMeta });
        } catch { raw_text = ""; }
    }

    const jd = await getJobById(job_id);
    if (!jd) return res.status(404).json({ error: 'Job not found' });

    const screeningResult = await screenResume(raw_text, jd);
    const candidate_id = `cand_${candidateEmail.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`;
    const payload = { candidate_id, job_id, candidateEmail, ...screeningResult };

    await saveDossier(payload);
    await saveApplication({ candidateEmail, candidate_id, job_id, jobTitle: jd.title || 'Unknown', company: jd.company || 'Precisely', location: jd.location || '' });

    res.json({ message: 'Screening complete', result: payload });
}));

app.get('/api/candidates/applications', authenticate, requireRole('Candidate'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const applications = await getApplicationsByCandidate(req.user!.email as string);
    res.json(applications);
}));

app.get('/api/candidates/profile', authenticate, requireRole('Candidate'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await getCandidateProfile(req.user!.email as string);
    res.json(profile || { email: req.user!.email as string });
}));

app.patch('/api/candidates/profile', authenticate, requireRole('Candidate'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const updated = await upsertCandidateProfile(req.user!.email as string, req.body);
    res.json({ message: 'Profile updated', profile: updated });
}));

app.post('/api/candidates/resume', authenticate, requireRole('Candidate'), upload.single('resume'), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const base64Data = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;

    const resumeMeta = {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        uploadedAt: new Date().toISOString(),
        size: req.file.size,
        url: dataUrl
    };
    await upsertCandidateProfile(req.user!.email as string, { resume: resumeMeta });
    res.json({ message: 'Resume uploaded', resume: { ...resumeMeta, url: '[stored]' } });
}));

app.get('/api/candidates/resume', authenticate, requireRole('Candidate'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await getCandidateProfile(req.user!.email as string);
    if (!profile?.resume) return res.status(404).json({ error: 'No resume on file.' });
    res.json(profile.resume);
}));

// ─── AI INTERVIEW ROUTES ──────────────────────────────────────────────────────

// REMOVED /api/candidates/interview/questions

app.post('/api/interview/generate-questions', authenticate, requireRole('Candidate'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ error: 'jobId is required' });
    const jd = await getJobById(jobId);
    if (!jd) return res.status(404).json({ error: 'Job not found' });
    const questions = await generateQuestions(jd, {});
    res.json({ questions });
}));

app.post('/api/interview/evaluate', authenticate, requireRole('Candidate'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { jobId, answers } = req.body;
    if (!jobId || !answers) return res.status(400).json({ error: 'jobId and answers are required' });

    const jd = await getJobById(jobId);
    if (!jd) return res.status(404).json({ error: 'Job not found' });

    const transcript = answers.map((a: any) => ({ question: a.question, answer: a.answer }));
    const evaluation = await evaluateInterview(jd, transcript);

    const resultId = await saveInterviewResult({ candidateEmail: req.user!.email as string, jobId, evaluation, completedAt: new Date() });

    res.json({ ...evaluation, resultId });
}));

// ─── STT / TTS ROUTES ─────────────────────────────────────────────────────────

// POST /api/interview/transcribe — accepts audio blob, returns { text }
app.post('/api/interview/transcribe', authenticate, upload.single('audio'), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) return res.status(400).json({ error: 'Audio file is required.' });
    if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'STT unavailable: GROQ_API_KEY not configured.' });

    const { toFile } = await import('openai');
    const audioFile = await toFile(req.file.buffer, 'audio.webm', { type: req.file.mimetype || 'audio/webm' });

    const transcription = await groqClient.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3-turbo',
    });

    res.json({ text: transcription.text });
}));

// POST /api/interview/speak — accepts { text }, returns audio/wav buffer
app.post('/api/interview/speak', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required.' });
    if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'TTS unavailable' });

    try {
        const response = await groqClient.audio.speech.create({
            model: 'playai-tts',
            voice: 'Celeste-PlayAI',
            input: text,
            response_format: 'wav',
        } as any);

        const buffer = Buffer.from(await response.arrayBuffer());
        res.set('Content-Type', 'audio/wav');
        res.send(buffer);
    } catch (err: any) {
        console.error('[TTS Error]', err?.message);
        res.status(503).json({ error: 'TTS unavailable' });
    }
}));

// ─── HR DOSSIER / PIPELINE ────────────────────────────────────────────────────

app.get('/api/candidates/dossiers', authenticate, requireRole('HR'), asyncHandler(async (req: AuthRequest, res: Response) => {
    // 1. Fetch only the jobs owned by this specific HR to isolate data
    const myJobsData = await getJobsByRecruiter(req.user!.id as string, 1, 10000);
    const myJobIds = myJobsData.jobs.map((j: any) => j.job_id);

    // 2. Filter the dossiers against jobs the HR actually owns
    const allDossiers = await getAllDossiers();
    const isolatedDossiers = allDossiers.filter((d: any) => myJobIds.includes(d.job_id));

    // Join with applications to get the real application _id for status updates
    const database = await connectDB();
    const enriched = await Promise.all(isolatedDossiers.map(async (d: any) => {
        if (!database) {
            // @ts-ignore
            const app = memoryDB.applications.find(a => a.candidateEmail === d.candidateEmail && a.job_id === d.job_id);
            return { ...d, applicationId: app?.candidate_id || null, status: app?.status || 'Pending' };
        }
        const app = await database.collection('applications').findOne({ candidateEmail: d.candidateEmail, job_id: d.job_id });
        return { ...d, applicationId: app?._id?.toString() || null, status: app?.status || 'Pending' };
    }));
    res.json(enriched);
}));

app.post('/api/candidates/interview', authenticate, requireRole('HR'), asyncHandler(async (req: Request, res: Response) => {
    res.json({ message: 'Interview evaluated' });
}));

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ error: 'Invalid file type. Only PDF and DOCX are accepted.' });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 5 MB.' });
    }
    errorHandler(err, req, res, next);
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
    app.listen(PORT, async () => {
        try {
            await connectDB();
            console.log(`🚀 Precisely API running on port ${PORT}`);
        } catch (error) {
            console.log(`🚀 Precisely API running on port ${PORT} [DB Disconnected - Local Mode]`);
        }
    });
}

export default app;
