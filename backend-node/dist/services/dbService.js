"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInterviewResults = exports.saveInterviewResult = exports.applicationExists = exports.getApplicationById = exports.updateApplicationStatus = exports.getApplicationsByCandidate = exports.saveApplication = exports.upsertCandidateProfile = exports.getCandidateProfile = exports.getAllDossiers = exports.getDossierByCandidate = exports.saveDossier = exports.getJobsByRecruiter = exports.getAllJobs = exports.getJobById = exports.deleteJob = exports.updateJob = exports.saveJob = exports.getUserByEmail = exports.saveUser = exports.connectDB = void 0;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "precisely";
let client;
let db;
let isMemoryMode = false;
const DB_FILE = path_1.default.join(process.cwd(), '.local-db.json');
// In-Memory Fallbacks
const defaultMemoryDB = {
    jobs: [],
    dossiers: [],
    users: [],
    profiles: [],
    applications: [],
    interviewResults: [],
};
let memoryDB = { ...defaultMemoryDB };
try {
    if (fs_1.default.existsSync(DB_FILE)) {
        memoryDB = { ...defaultMemoryDB, ...JSON.parse(fs_1.default.readFileSync(DB_FILE, 'utf-8')) };
        // Retroactively fix legacy jobs missing an ID
        let modified = false;
        memoryDB.jobs.forEach(j => {
            if (!j.job_id && !j._id) {
                j.job_id = new mongodb_1.ObjectId().toString();
                modified = true;
            }
        });
        if (modified) {
            fs_1.default.writeFileSync(DB_FILE, JSON.stringify(memoryDB, null, 2));
        }
    }
}
catch (e) {
    console.error('Failed to parse local DB', e);
}
const saveLocalDB = () => {
    if (isMemoryMode) {
        fs_1.default.writeFileSync(DB_FILE, JSON.stringify(memoryDB, null, 2));
    }
};
const connectDB = async () => {
    if (isMemoryMode)
        return null;
    if (!db) {
        try {
            client = new mongodb_1.MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
            await client.connect();
            db = client.db(MONGO_DB_NAME);
            console.log("✅ MongoDB connected successfully.");
        }
        catch (err) {
            console.log("⚠️ MongoDB connection failed. Switching to IN-MEMORY Database (with file persistence).");
            isMemoryMode = true;
            return null;
        }
    }
    return db;
};
exports.connectDB = connectDB;
// ─── USER AUTH ────────────────────────────────────────────────────────────────
const saveUser = async (email, role, passwordHash) => {
    const database = await (0, exports.connectDB)();
    const user = { email, role, passwordHash, createdAt: new Date() };
    if (!database) {
        memoryDB.users.push(user);
        saveLocalDB();
        return "mock_user_id_" + Math.floor(Math.random() * 10000);
    }
    const result = await database.collection('users').insertOne(user);
    return result.insertedId.toString();
};
exports.saveUser = saveUser;
const getUserByEmail = async (email) => {
    const database = await (0, exports.connectDB)();
    if (!database)
        return memoryDB.users.find(u => u.email === email) || null;
    return await database.collection('users').findOne({ email });
};
exports.getUserByEmail = getUserByEmail;
// ─── JOBS ─────────────────────────────────────────────────────────────────────
const saveJob = async (jobData) => {
    const database = await (0, exports.connectDB)();
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
exports.saveJob = saveJob;
const updateJob = async (jobId, recruiterId, updateData) => {
    const database = await (0, exports.connectDB)();
    if (!database) {
        const idx = memoryDB.jobs.findIndex(j => (j.job_id === jobId || j._id === jobId) && j.recruiterId === recruiterId);
        if (idx < 0)
            return null;
        memoryDB.jobs[idx] = { ...memoryDB.jobs[idx], ...updateData, updatedAt: new Date() };
        saveLocalDB();
        return memoryDB.jobs[idx];
    }
    const result = await database.collection('job_descriptions').findOneAndUpdate({ job_id: jobId, recruiterId }, { $set: { ...updateData, updatedAt: new Date() } }, { returnDocument: 'after' });
    return result;
};
exports.updateJob = updateJob;
const deleteJob = async (jobId, recruiterId) => {
    const database = await (0, exports.connectDB)();
    if (!database) {
        const idx = memoryDB.jobs.findIndex(j => (j.job_id === jobId || j._id === jobId) && j.recruiterId === recruiterId);
        if (idx < 0)
            return false;
        memoryDB.jobs.splice(idx, 1);
        saveLocalDB();
        return true;
    }
    const result = await database.collection('job_descriptions').deleteOne({ job_id: jobId, recruiterId });
    return result.deletedCount > 0;
};
exports.deleteJob = deleteJob;
const getJobById = async (jobId) => {
    const database = await (0, exports.connectDB)();
    if (!database) {
        return memoryDB.jobs.find(j => j.job_id === jobId || j._id === jobId || j._id?.toString() === jobId) || null;
    }
    // Try job_id field first (new format), fall back to _id for legacy documents
    let job = await database.collection('job_descriptions').findOne({ job_id: jobId });
    if (!job) {
        try {
            job = await database.collection('job_descriptions').findOne({ _id: new mongodb_1.ObjectId(jobId) });
        }
        catch {
            // jobId was not a valid ObjectId, that's fine
        }
    }
    return job || null;
};
exports.getJobById = getJobById;
const getAllJobs = async (page = 1, limit = 100) => {
    const database = await (0, exports.connectDB)();
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
exports.getAllJobs = getAllJobs;
const getJobsByRecruiter = async (recruiterId, page = 1, limit = 10) => {
    const database = await (0, exports.connectDB)();
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
exports.getJobsByRecruiter = getJobsByRecruiter;
// ─── DOSSIERS / SCREENING ─────────────────────────────────────────────────────
const saveDossier = async (dossierData) => {
    const database = await (0, exports.connectDB)();
    if (!database) {
        memoryDB.dossiers.push(dossierData);
        saveLocalDB();
        return "mock_dossier_id_" + Math.floor(Math.random() * 1000);
    }
    const result = await database.collection('dossiers').insertOne(dossierData);
    return result.insertedId.toString();
};
exports.saveDossier = saveDossier;
const getDossierByCandidate = async (candidateId) => {
    const database = await (0, exports.connectDB)();
    if (!database)
        return memoryDB.dossiers.find(d => d.candidate_id === candidateId);
    return await database.collection('dossiers').findOne({ candidate_id: candidateId });
};
exports.getDossierByCandidate = getDossierByCandidate;
const getAllDossiers = async (jobId) => {
    const database = await (0, exports.connectDB)();
    if (!database) {
        return jobId ? memoryDB.dossiers.filter(d => d.job_id === jobId) : memoryDB.dossiers;
    }
    const query = jobId ? { job_id: jobId } : {};
    return await database.collection('dossiers').find(query).toArray();
};
exports.getAllDossiers = getAllDossiers;
// ─── CANDIDATE PROFILE ────────────────────────────────────────────────────────
const getCandidateProfile = async (email) => {
    const database = await (0, exports.connectDB)();
    if (!database)
        return memoryDB.profiles.find(p => p.email === email) || null;
    return await database.collection('candidate_profiles').findOne({ email });
};
exports.getCandidateProfile = getCandidateProfile;
const upsertCandidateProfile = async (email, profileData) => {
    const database = await (0, exports.connectDB)();
    const update = { ...profileData, email, updatedAt: new Date() };
    if (!database) {
        const idx = memoryDB.profiles.findIndex(p => p.email === email);
        if (idx >= 0)
            memoryDB.profiles[idx] = { ...memoryDB.profiles[idx], ...update };
        else
            memoryDB.profiles.push(update);
        saveLocalDB();
        return memoryDB.profiles.find(p => p.email === email);
    }
    await database.collection('candidate_profiles').updateOne({ email }, { $set: update }, { upsert: true });
    return await database.collection('candidate_profiles').findOne({ email });
};
exports.upsertCandidateProfile = upsertCandidateProfile;
// ─── CANDIDATE APPLICATIONS ───────────────────────────────────────────────────
const saveApplication = async (applicationData) => {
    const database = await (0, exports.connectDB)();
    const app = { ...applicationData, status: 'Pending', appliedAt: new Date() };
    if (!database) {
        memoryDB.applications.push(app);
        saveLocalDB();
        return "mock_app_id_" + Math.floor(Math.random() * 1000);
    }
    const result = await database.collection('applications').insertOne(app);
    return result.insertedId.toString();
};
exports.saveApplication = saveApplication;
const getApplicationsByCandidate = async (candidateEmail) => {
    const database = await (0, exports.connectDB)();
    if (!database)
        return memoryDB.applications.filter(a => a.candidateEmail === candidateEmail);
    const apps = await database.collection('applications').find({ candidateEmail }).toArray();
    // Populate job data and match_score
    return await Promise.all(apps.map(async (app) => {
        let jobQuery = { job_id: app.job_id };
        if (typeof app.job_id === 'string' && app.job_id.length === 24 && /^[0-9a-fA-F]{24}$/.test(app.job_id)) {
            jobQuery = { $or: [{ job_id: app.job_id }, { _id: new mongodb_1.ObjectId(app.job_id) }] };
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
exports.getApplicationsByCandidate = getApplicationsByCandidate;
const updateApplicationStatus = async (applicationId, status) => {
    const database = await (0, exports.connectDB)();
    if (!database) {
        const idx = memoryDB.applications.findIndex(a => a._id?.toString() === applicationId || a.candidate_id === applicationId);
        if (idx >= 0) {
            memoryDB.applications[idx].status = status;
            saveLocalDB();
            return memoryDB.applications[idx];
        }
        return null;
    }
    let query;
    try {
        query = { _id: new mongodb_1.ObjectId(applicationId) };
    }
    catch {
        query = { candidate_id: applicationId };
    }
    const result = await database.collection('applications').findOneAndUpdate(query, { $set: { status, updatedAt: new Date() } }, { returnDocument: 'after' });
    return result;
};
exports.updateApplicationStatus = updateApplicationStatus;
const getApplicationById = async (applicationId) => {
    const database = await (0, exports.connectDB)();
    if (!database)
        return memoryDB.applications.find(a => a._id?.toString() === applicationId || a.candidate_id === applicationId) || null;
    let query;
    try {
        query = { _id: new mongodb_1.ObjectId(applicationId) };
    }
    catch {
        query = { candidate_id: applicationId };
    }
    return await database.collection('applications').findOne(query);
};
exports.getApplicationById = getApplicationById;
const applicationExists = async (candidateEmail, jobId) => {
    const database = await (0, exports.connectDB)();
    if (!database)
        return memoryDB.applications.some(a => a.candidateEmail === candidateEmail && a.job_id === jobId);
    const found = await database.collection('applications').findOne({ candidateEmail, job_id: jobId });
    return !!found;
};
exports.applicationExists = applicationExists;
// ─── INTERVIEW RESULTS ────────────────────────────────────────────────────────
const saveInterviewResult = async (resultData) => {
    const database = await (0, exports.connectDB)();
    const doc = { ...resultData, completedAt: new Date() };
    if (!database) {
        memoryDB.interviewResults.push(doc);
        saveLocalDB();
        return "mock_result_id_" + Math.floor(Math.random() * 1000);
    }
    const result = await database.collection('interview_results').insertOne(doc);
    return result.insertedId.toString();
};
exports.saveInterviewResult = saveInterviewResult;
const getInterviewResults = async (candidateEmail) => {
    const database = await (0, exports.connectDB)();
    if (!database)
        return memoryDB.interviewResults.filter(r => r.candidateEmail === candidateEmail);
    return await database.collection('interview_results').find({ candidateEmail }).toArray();
};
exports.getInterviewResults = getInterviewResults;
