# Interview Engine SOP (Standard Operating Procedure)

## Goal
Conduct a structured 5-question AI interview and evaluate the candidate's responses to produce a complete Candidate Dossier.

## Inputs
- **Candidate ID**: Must have a prior screening dossier with `match_score >= 70`.
- **Job Description**: Retrieved from DB by `job_id`.
- **Transcript**: List of `{question, answer}` pairs from the interview session.

## Process

### Step 1: Generate Questions
1. Client calls `GET /api/candidates/interview-questions/{candidate_id}`.
2. Route fetches the candidate's screening dossier and JD from DB.
3. Calls `tools/interview_engine.py :: generate_questions()`.
4. Gemini produces 5 questions: 2 Technical, 2 Behavioral (STAR), 1 Culture Fit.
5. Questions are returned to the client for the real-time interview session.

### Step 2: Evaluate Responses
1. After the interview, client sends the transcript via `POST /api/candidates/interview`.
2. Route calls `tools/interview_engine.py :: evaluate_interview()`.
3. Gemini analyzes the full transcript and returns:
   - `sentiment_analysis` (e.g., "Nervous → Confident")
   - `sentiment_trend` ("Improving" / "Declining" / "Stable")
   - `coachability_flag` (boolean)
   - Updated `technical_skills`, `pros`, `concerns`
   - Final `ai_recommendation` and `decision_reasoning`
4. The existing dossier in MongoDB is updated with these fields.

## Rules
- **Tone**: Professional, unbiased, encouraging.
- **Follow-ups**: If a candidate gives a vague answer, the AI must probe deeper.
- **Do NOT**: Ask discriminatory questions or reveal scores to the candidate.

## Edge Cases
- Candidate with `match_score < 70` → return "Interview not recommended" without generating questions.
- Gemini returns malformed JSON → catch error, log, return 500.

## Output
A fully complete Candidate Dossier with all fields populated, ready for the HR Dashboard.
