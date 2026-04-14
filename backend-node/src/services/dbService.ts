import { MongoClient, Db, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "precisely";

let client: MongoClient;
let db: Db;
let isMemoryMode = false;

const DB_FILE = path.join(process.cwd(), '.local-db.json');

// In-Memory Fallbacks
const defaultMemoryDB = {
    jobs: [] as any[],
    dossiers: [] as any[],
    users: [] as any[],
    profiles: [] as any[],
    applications: [] as any[],
    interviewResults: [] as any[],
};

let memoryDB = { ...defaultMemoryDB };

try {
    if (fs.existsSync(DB_FILE)) {
        memoryDB = { ...defaultMemoryDB, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) };
        // Retroactively fix legacy jobs missing an ID
        let modified = false;
        memoryDB.jobs.forEach(j => {
            if (!j.job_id && !j._id) {
                j.job_id = new ObjectId().toString();
                modified = true;
            }
        });
        if (modified) {
            fs.writeFileSync(DB_FILE, JSON.stringify(memoryDB, null, 2));
        }
    }
} catch (e) { console.error('Failed to parse local DB', e); }

const saveLocalDB = () => {
    if (isMemoryMode) {
        fs.writeFileSync(DB_FILE, JSON.stringify(memoryDB, null, 2));
    }
};

export const connectDB = async () => {
    if (isMemoryMode) return null;
    if (!db) {
        try {
            client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
            await client.connect();
            db = client.db(MONGO_DB_NAME);
            console.log("✅ MongoDB connected successfully.");
        } catch (err) {
            console.log("⚠️ MongoDB connection failed. Switching to IN-MEMORY Database (with file persistence).");
            isMemoryMode = true;
            return null;
        }
    }
    return db;
};

// ─── USER AUTH ────────────────────────────────────────────────────────────────

export const saveUser = async (email: string, role: string, passwordHash: string) => {
    const database = await connectDB();
    const user = { email, role, passwordHash, createdAt: new Date() };
    if (!database) {
        memoryDB.users.push(user);
        saveLocalDB();
        return "mock_user_id_" + Math.floor(Math.random() * 10000);
    }
    const result = await database.collection('users').insertOne(user);
    return result.insertedId.toString();
};

export const getUserByEmail = async (email: string) => {
    const database = await connectDB();
    if (!database) return memoryDB.users.find(u => u.email === email) || null;
    return await database.collection('users').findOne({ email });
};

// ─── JOBS ─────────────────────────────────────────────────────────────────────

export const saveJob = async (jobData: any) => {
    const database = await connectDB();
    // Generate a stable job_id that exists inside the document itself
    const job_id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const doc = { ...jobData, job_id, createdAt: new Date() };
    if (!database) {
        memoryDB.jobs.push(doc);
        saveLocalDB();
        return job_id;
    }
    await database.collection('job_descriptions').insertOne(doc);
    return job_id;
};

export const updateJob = async (jobId: string, recruiterId: string, updateData: any) => {
    const database = await connectDB();
    if (!database) {
        const idx = memoryDB.jobs.findIndex(j => (j.job_id === jobId || j._id === jobId) && j.recruiterId === recruiterId);
        if (idx < 0) return null;
        memoryDB.jobs[idx] = { ...memoryDB.jobs[idx], ...updateData, updatedAt: new Date() };
        saveLocalDB();
        return memoryDB.jobs[idx];
    }
    const result = await database.collection('job_descriptions').findOneAndUpdate(
        { job_id: jobId, recruiterId },
        { $set: { ...updateData, updatedAt: new Date() } },
        { returnDocument: 'after' }
    );
    return result;
};

export const deleteJob = async (jobId: string, recruiterId: string) => {
    const database = await connectDB();
    if (!database) {
        const idx = memoryDB.jobs.findIndex(j => (j.job_id === jobId || j._id === jobId) && j.recruiterId === recruiterId);
        if (idx < 0) return false;
        memoryDB.jobs.splice(idx, 1);
        saveLocalDB();
        return true;
    }
    const result = await database.collection('job_descriptions').deleteOne({ job_id: jobId, recruiterId });
    return result.deletedCount > 0;
};

export const getJobById = async (jobId: string) => {
    const database = await connectDB();
    if (!database) {
        return memoryDB.jobs.find(j => j.job_id === jobId || j._id === jobId || j._id?.toString() === jobId) || null;
    }
    // Try job_id field first (new format), fall back to _id for legacy documents
    let job = await database.collection('job_descriptions').findOne({ job_id: jobId });
    if (!job) {
        try {
            job = await database.collection('job_descriptions').findOne({ _id: new ObjectId(jobId) });
        } catch {
            // jobId was not a valid ObjectId, that's fine
        }
    }
    return job || null;
};

export const getAllJobs = async (page = 1, limit = 100) => {
    const database = await connectDB();
    const skip = (page - 1) * limit;
    if (!database) {
        const total = memoryDB.jobs.length;
        return { jobs: memoryDB.jobs.slice(skip, skip + limit), total };
    }
    const [jobs, total] = await Promise.all([
        database.collection('job_descriptions').find({}).skip(skip).limit(limit).toArray(),
        database.collection('job_descriptions').countDocuments()
    ]);
    return { jobs, total };
};

export const getJobsByRecruiter = async (recruiterId: string, page = 1, limit = 10) => {
    const database = await connectDB();
    const skip = (page - 1) * limit;
    if (!database) {
        const all = memoryDB.jobs.filter(j => j.recruiterId === recruiterId);
        const total = all.length;
        const jobs = all.slice(skip, skip + limit).map(job => ({
            ...job,
            applicationCount: memoryDB.applications.filter(a => a.job_id === job.job_id).length
        }));
        return { jobs, total };
    }
    const [jobs, total] = await Promise.all([
        database.collection('job_descriptions').find({ recruiterId }).skip(skip).limit(limit).toArray(),
        database.collection('job_descriptions').countDocuments({ recruiterId })
    ]);
    const jobsWithCount = await Promise.all(jobs.map(async (job) => {
        const count = await database.collection('applications').countDocuments({ job_id: job.job_id });
        return { ...job, applicationCount: count };
    }));
    return { jobs: jobsWithCount, total };
};

// ─── DOSSIERS / SCREENING ─────────────────────────────────────────────────────

export const saveDossier = async (dossierData: any) => {
    const database = await connectDB();
    if (!database) {
        memoryDB.dossiers.push(dossierData);
        saveLocalDB();
        return "mock_dossier_id_" + Math.floor(Math.random() * 1000);
    }
    const result = await database.collection('dossiers').insertOne(dossierData);
    return result.insertedId.toString();
};

export const getDossierByCandidate = async (candidateId: string) => {
    const database = await connectDB();
    if (!database) return memoryDB.dossiers.find(d => d.candidate_id === candidateId);
    return await database.collection('dossiers').findOne({ candidate_id: candidateId });
};

export const getAllDossiers = async (jobId?: string) => {
    const database = await connectDB();
    if (!database) {
        return jobId ? memoryDB.dossiers.filter(d => d.job_id === jobId) : memoryDB.dossiers;
    }
    const query = jobId ? { job_id: jobId } : {};
    return await database.collection('dossiers').find(query).toArray();
};

// ─── CANDIDATE PROFILE ────────────────────────────────────────────────────────

export const getCandidateProfile = async (email: string) => {
    const database = await connectDB();
    if (!database) return memoryDB.profiles.find(p => p.email === email) || null;
    return await database.collection('candidate_profiles').findOne({ email });
};

export const upsertCandidateProfile = async (email: string, profileData: any) => {
    const database = await connectDB();
    const update = { ...profileData, email, updatedAt: new Date() };
    if (!database) {
        const idx = memoryDB.profiles.findIndex(p => p.email === email);
        if (idx >= 0) memoryDB.profiles[idx] = { ...memoryDB.profiles[idx], ...update };
        else memoryDB.profiles.push(update);
        saveLocalDB();
        return memoryDB.profiles.find(p => p.email === email);
    }
    await database.collection('candidate_profiles').updateOne({ email }, { $set: update }, { upsert: true });
    return await database.collection('candidate_profiles').findOne({ email });
};

// ─── CANDIDATE APPLICATIONS ───────────────────────────────────────────────────

export const saveApplication = async (applicationData: any) => {
    const database = await connectDB();
    const app = { ...applicationData, status: 'Pending', appliedAt: new Date() };
    if (!database) {
        memoryDB.applications.push(app);
        saveLocalDB();
        return "mock_app_id_" + Math.floor(Math.random() * 1000);
    }
    const result = await database.collection('applications').insertOne(app);
    return result.insertedId.toString();
};

export const getApplicationsByCandidate = async (candidateEmail: string) => {
    const database = await connectDB();
    if (!database) return memoryDB.applications.filter(a => a.candidateEmail === candidateEmail);
    const apps = await database.collection('applications').find({ candidateEmail }).toArray();
    // Populate job data and match_score
    return await Promise.all(apps.map(async (app) => {
        let jobQuery: any = { job_id: app.job_id };
        if (typeof app.job_id === 'string' && app.job_id.length === 24 && /^[0-9a-fA-F]{24}$/.test(app.job_id)) {
            jobQuery = { $or: [{ job_id: app.job_id }, { _id: new ObjectId(app.job_id) }] };
        }
        const job = await database.collection('job_descriptions').findOne(jobQuery);
        const dossier = await database.collection('dossiers').findOne({ candidateEmail, job_id: app.job_id });
        return { 
            ...app, 
            jobTitle: job?.title || app.jobTitle, 
            company: job?.company || app.company || 'Precisely', 
            location: job?.location || '',
            match_score: dossier?.match_score || 0
        };
    }));
};

export const updateApplicationStatus = async (applicationId: string, status: string) => {
    const database = await connectDB();
    if (!database) {
        const idx = memoryDB.applications.findIndex(a => a._id?.toString() === applicationId || a.candidate_id === applicationId);
        if (idx >= 0) {
            memoryDB.applications[idx].status = status;
            saveLocalDB();
            return memoryDB.applications[idx];
        }
        return null;
    }
    let query: any;
    try { query = { _id: new ObjectId(applicationId) }; } catch { query = { candidate_id: applicationId }; }
    const result = await database.collection('applications').findOneAndUpdate(
        query, { $set: { status, updatedAt: new Date() } }, { returnDocument: 'after' }
    );
    return result;
};

export const getApplicationById = async (applicationId: string) => {
    const database = await connectDB();
    if (!database) return memoryDB.applications.find(a => a._id?.toString() === applicationId || a.candidate_id === applicationId) || null;
    let query: any;
    try { query = { _id: new ObjectId(applicationId) }; } catch { query = { candidate_id: applicationId }; }
    return await database.collection('applications').findOne(query);
};

export const applicationExists = async (candidateEmail: string, jobId: string) => {
    const database = await connectDB();
    if (!database) return memoryDB.applications.some(a => a.candidateEmail === candidateEmail && a.job_id === jobId);
    const found = await database.collection('applications').findOne({ candidateEmail, job_id: jobId });
    return !!found;
};

// ─── INTERVIEW RESULTS ────────────────────────────────────────────────────────

export const saveInterviewResult = async (resultData: any) => {
    const database = await connectDB();
    const doc = { ...resultData, completedAt: new Date() };
    if (!database) {
        memoryDB.interviewResults.push(doc);
        saveLocalDB();
        return "mock_result_id_" + Math.floor(Math.random() * 1000);
    }
    const result = await database.collection('interview_results').insertOne(doc);
    return result.insertedId.toString();
};

export const getInterviewResults = async (candidateEmail: string) => {
    const database = await connectDB();
    if (!database) return memoryDB.interviewResults.filter(r => r.candidateEmail === candidateEmail);
    return await database.collection('interview_results').find({ candidateEmail }).toArray();
};
