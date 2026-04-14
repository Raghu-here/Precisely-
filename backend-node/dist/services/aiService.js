"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestJobSkills = exports.evaluateInterview = exports.generateQuestions = exports.screenResume = void 0;
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = new openai_1.default({
    apiKey: process.env.GROQ_API_KEY || '',
    baseURL: 'https://api.groq.com/openai/v1',
});
const MODEL = 'llama-3.3-70b-versatile';
// Safe JSON parser — strips markdown fences if Groq wraps its output
const parseJson = (raw) => {
    let text = raw.trim();
    if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(text);
};
// Helper to call Groq and get a text response
const callGroq = async (systemPrompt, userPrompt) => {
    const res = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 1500,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]
    });
    return res.choices[0]?.message?.content || '';
};
// ─── 1. RESUME SCREENING ─────────────────────────────────────────────────────
const screenResume = async (resumeText, jd) => {
    const system = `You are a precise technical recruiter AI. Your only job is to evaluate candidate resumes against job descriptions and return a structured JSON assessment. You MUST respond with valid JSON only — no preamble, no explanation, no markdown fences.`;
    const user = `Evaluate this candidate resume against the job description below.

JOB DESCRIPTION:
${JSON.stringify(jd, null, 2)}

RESUME TEXT:
${resumeText || 'No resume text provided.'}

Rules:
- If the candidate matches 70% or more of the Must-Have skills, pass them.
- Look for "hidden gems": strong projects or experience that compensate for missing years.
- If below 70%, set interview_key to null and write a polite encouraging ai_recommendation.
- Generate interview_key as "INT-XX-YYYY" format only if match_score >= 70.

Respond ONLY with this JSON structure, no other text:
{
  "match_score": <number 0-100>,
  "interview_key": "<string like INT-AB-1234 or null>",
  "technical_skills": [{"skill": "<name>", "rating": <0-10>}],
  "pros": [{"text": "<strength>", "clip_url": null}],
  "concerns": [{"text": "<concern>", "clip_url": null}],
  "ai_recommendation": "<Highly Recommend | Consider | Reject | Not a fit at this time>",
  "decision_reasoning": "<2-3 sentence explanation>"
}`;
    const raw = await callGroq(system, user);
    return parseJson(raw);
};
exports.screenResume = screenResume;
// ─── 2. GENERATE INTERVIEW QUESTIONS ─────────────────────────────────────────
const generateQuestions = async (jd, screeningResult) => {
    const system = `You are a senior technical interviewer. Generate exactly 5 interview questions as a JSON array of strings. No preamble. No markdown. Only the JSON array.`;
    const user = `Generate 5 technical interview questions for this role and candidate profile.

JOB DESCRIPTION:
${JSON.stringify(jd, null, 2)}

CANDIDATE SCREENING RESULT:
${JSON.stringify(screeningResult, null, 2)}

Rules:
- Mix technical and behavioral questions
- Tailor questions to the must-have skills in the JD
- Make questions open-ended and conversational
- No code-writing questions

Respond ONLY with a JSON array of 5 strings:
["Question 1 text", "Question 2 text", "Question 3 text", "Question 4 text", "Question 5 text"]`;
    const raw = await callGroq(system, user);
    const parsed = parseJson(raw);
    // Handle both array format and { questions: [] } format
    return Array.isArray(parsed) ? parsed : (parsed.questions || []);
};
exports.generateQuestions = generateQuestions;
// ─── 3. EVALUATE INTERVIEW ────────────────────────────────────────────────────
const evaluateInterview = async (jd, transcript) => {
    const system = `You are an expert interview analyst. Evaluate this interview transcript and produce a structured JSON dossier. Respond with valid JSON only — no preamble, no markdown fences.`;
    const user = `Evaluate this interview for the role below.

JOB DESCRIPTION:
${JSON.stringify(jd, null, 2)}

INTERVIEW TRANSCRIPT:
${JSON.stringify(transcript, null, 2)}

Deliverables:
- match_score: 0-100 based on answer quality vs role requirements
- sentiment_analysis: one of "Confident", "Defensive", "Nervous", "Articulate"
- sentiment_trend: one of "Improving", "Declining", "Stable"
- evidence_log: a direct quote or paraphrase from the candidate that best justifies the verdict
- breakdown: per-question score array
- coachability_flag: true if the candidate showed willingness to learn/adapt

Respond ONLY with this JSON:
{
  "match_score": <number 0-100>,
  "sentiment_analysis": "<string>",
  "sentiment_trend": "<Improving | Declining | Stable>",
  "coachability_flag": <true | false>,
  "evidence_log": "<quote from interview>",
  "technical_skills": [{"skill": "<name>", "rating": <0-10>}],
  "pros": [{"text": "<strength>", "clip_url": null}],
  "concerns": [{"text": "<concern>", "clip_url": null}],
  "ai_recommendation": "<Highly Recommend | Consider | Reject>",
  "decision_reasoning": "<2-3 sentence explanation>",
  "breakdown": [{"question": "<q>", "answer": "<a>", "score": <0-10>}]
}`;
    const raw = await callGroq(system, user);
    return parseJson(raw);
};
exports.evaluateInterview = evaluateInterview;
// ─── 4. SUGGEST JOB SKILLS ────────────────────────────────────────────────────
const suggestJobSkills = async (title) => {
    const system = `You are a technical recruiting assistant. Return only a JSON array of strings. No preamble. No markdown.`;
    const user = `Suggest exactly 5 must-have technical skills for the job title: "${title}".
Respond ONLY with a JSON array: ["skill1", "skill2", "skill3", "skill4", "skill5"]`;
    const raw = await callGroq(system, user);
    return parseJson(raw);
};
exports.suggestJobSkills = suggestJobSkills;
