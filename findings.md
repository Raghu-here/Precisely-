# Findings

## Research
- Resume Parsers: PyResparser or Gemini API
- Database: PostgreSQL or MongoDB
- Communication: Twilio (SMS) / SendGrid (Email)
- Real-time Interaction: Gemini Live / WebRTC

## Discoveries
- The Job Description (JD) is the single Source of Truth.
- Resumes under 70% match get immediately rejected before interviewing.

## Constraints
- Strictly professional and unbiased (no discriminatory questions).
- Never reveal the internal score to the candidate.
- API keys must not be stored in environment, manage purely in backend `.env`.
