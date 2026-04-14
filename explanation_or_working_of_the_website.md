# 🚀 Precisely AI - Complete Platform Overview

Welcome to the central documentation for **Precisely AI**. This document explains exactly how the platform works, the technology behind it, and how you as the owner can manage its operations seamlessly.

---

## 🏗️ 1. The Technology Stack (MERN + Gemini AI)

This platform is built using industry-standard technologies to ensure it is fast, secure, and easily scalable to thousands of users.

*   **MongoDB (The Database)**: The brain's memory. It securely stores your jobs, candidates, their resumes, and the interview performance data.
*   **Express & Node.js (The Backend / Server)**: The engine. This lives on a remote server and handles all the heavy lifting—like routing requests, communicating with the AI, securely processing files, and verifying users.
*   **React + Vite (The Frontend / Website)**: The face. This is the beautiful, interactive dashboard you and your users see in the browser.
*   **Gemini 2.0-Flash (The AI Brain)**: The intelligence matrix. This handles all the logical decision-making for reading resumes, generating questions, and scoring interviews.

---

## 🛡️ 2. How the Platform is Secured

### JWT Authentication (Keycards)
Whenever an HR or Candidate logs in, the server generates a cryptographically signed "JSON Web Token" (JWT). Think of this as a digital access keycard. 
*   This keycard is securely saved in their browser cookies. 
*   If a Candidate tries to access an HR link, the server reads the keycard, realizes they don't have clearance, and denies them entry.

### Express Rate-Limiter (Spam Protection)
To stop malicious bots or hackers from overwhelming your system with millions of login attempts, we have deployed an **IP Rate Limiter**. If someone tries to rapidly blast your authentication portals, they are temporarily blocked after 20 attempts.

---

## ⚙️ 3. The Core Workflow (How the AI Works)

### Stage 1: The Gatekeeper (Resume Screening)
When an HR posts a "Requisition" (a job), they list the Must-Have Technical Skills. When a candidate uploads their PDF/Word resume, the backend extracts the raw text and sends it to the Gemini AI alongside the job description.
*   **Decision**: If the skills align strongly, the AI flags them as `Approved` and generates a specific `interview_key`. If they lack the skills, they are immediately and politely rejected, saving HR countless hours of reading.

### Stage 2: The Evaluator (Live Interview Generation)
If the candidate passes Stage 1, they enter the live AI interview. The backend tells Gemini: *"Here is their resume, and here is what the job needs. Generate exactly 5 highly-targeted technical questions."*
*   The questions aren't generic—they are specific to the applicant's experience, making the interview feel highly personalized and rigorous.

### Stage 3: The Analyst (Final Verdict)
Once the candidate submits their 5 answers, the entire transcript is sent back to Gemini. The AI Analyst mathematically scores their technical accuracy (x/10 for different skills) and provides a **Sentiment Analysis** (e.g., "Confident", "Articulate"). 
*   Finally, it gives a stark recommendation: `Highly Recommend`, `Consider`, or `Reject`, alongside an "Evidence Log" quoting directly from the interview to justify its decision.

---

## 👨‍💼 4. Management Guide (For the Owner)

As the owner, you will be fielding inquiries and overseeing the platform's database. Because the architecture separates the frontend from the backend, it is incredibly easy to manage without touching a line of code.

### Using MongoDB Compass (Desktop Application)
You do not need to write database queries. To view all your data:
1.  Download **MongoDB Compass** on your computer.
2.  Paste in your `MONGO_URI` (the connection string from your backend `.env` file).
3.  Click **Connect**.

You will instantly see a graphical folder structure of your platform:
*   **`users`**: See every person who has registered (their emails and roles).
*   **`job_descriptions`**: See all the active job requisitions your HR clients have published.
*   **`applications` & `candidate_profiles`**: Click here to instantly see the Base64 URLs of candidate resumes, or track their progress in the pipeline.
*   **`dossiers`**: Read the raw JSON of the AI verdicts before they are ever rendered on the frontend.

By keeping an eye on MongoDB Compass, you have full omnipotence over the data pipeline without ever disturbing the live servers.

---
*Document formulated for commercial deployment and operational hand-off.*
