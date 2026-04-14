# Resume Screening SOP (Standard Operating Procedure)

## Goal
Deterministically screen a candidate's resume against a Job Description and produce a partial Candidate Dossier.

## Inputs
- **Candidate Resume** (`raw_text`): Plain text extracted from PDF/DOCX.
- **Job Description** (`jd`): JSON object matching the `gemini.md` JD schema.

## Process
1. Receive resume text and JD via `POST /api/candidates/screen`.
2. Call `tools/resume_parser.py :: screen_resume()`.
3. The tool sends a structured prompt to Gemini AI with the JD and resume.
4. Gemini returns JSON with `match_score`, `technical_skills`, `pros`, `concerns`, `ai_recommendation`, and `decision_reasoning`.
5. The tool wraps the result in a Dossier envelope and returns it.

## Decision Gate
- If `match_score < 70`: Flag as **"Low Fit"**, store the dossier, and **do not proceed** to interview.
- If `match_score >= 70`: Store the dossier and mark candidate as **interview-ready**.

## Edge Cases
- If Gemini returns invalid JSON → catch `json.JSONDecodeError`, log to `.tmp/errors.log`, return a 500.
- If Gemini API key is invalid → handshake test will catch this before any screening occurs.

## Output
A partial Candidate Dossier (sentiment fields are "N/A" until the interview phase).
