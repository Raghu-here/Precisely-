# Data Schema & Operations

## JSON Data Schema

### Input Shape: Job Description (JD)
```json
{
  "job_id": "string",
  "title": "string",
  "must_have_skills": ["string"],
  "nice_to_have_skills": ["string"],
  "experience_years": "integer",
  "responsibilities": ["string"]
}
```

### Input Shape: Candidate Raw Resume
```json
{
  "candidate_id": "string",
  "job_id": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "raw_text": "string"
}
```

### Output/Payload Shape: Candidate Dossier
```json
{
  "candidate_id": "string",
  "job_id": "string",
  "interview_key": "string (generated if score >= 70)",
  "match_score": "number (0-100)",
  "technical_skills": [{"skill": "string", "rating": "number (0-10)"}],
  "sentiment_analysis": "string (e.g., Confident, Nervous)",
  "sentiment_trend": "string (e.g., Improving, Declining, Stable)",
  "coachability_flag": "boolean",
  "ai_recommendation": "string (Hire/Reject/Hold)",
  "evidence_log": "string (Quote justifying the verdict)",
  "pros": [{"text": "string", "clip_url": "string"}],
  "concerns": [{"text": "string", "clip_url": "string"}],
  "decision_reasoning": "string"
}
```

## Maintenance Log

### Cloud Deployment (Trigger Phase)
- **Containerization**: The system is fully containerized using Docker. To deploy the entire suite (MongoDB Database, Node.js Backend, and Vite Frontend Dashboard), run `docker-compose up --build` from the root directory.
- **Triggers/Automation**: Standard deployment should map to GitHub Actions executing Webhook payloads on Master branch merge.
- **Ports Mapping**:
  - MongoDB runs internally on `27017`.
  - Backend API runs on `3001`.
  - Frontend UI runs on `5173`.

### Scaling & Security
- Ensure `GEMINI_API_KEY` is injected securely on cloud deployments. The `.env` variables are tightly scoped in the docker-compose YAML.
- **Model Maintenance:** Uses `gemini-1.5-flash`. To switch context logic, replace instructions inside `backend-node/src/services/aiService.ts`.
