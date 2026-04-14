import React from "react";

const CandidateCard = ({ candidate, delay }) => {
  const isPass = candidate.match_score >= 70;
  const barColor = isPass ? "var(--accent-primary)" : "var(--danger)";

  return (
    <div
      className="candidate-card"
      style={{
        animationDelay: `${delay}ms`,
        opacity: 0,
        animation: `fadeIn 300ms ease-in-out ${delay}ms forwards`,
      }}
    >
      {/* Header Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "0.5px solid var(--border-color)",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#fff",
              letterSpacing: "0.5px",
            }}
          >
            {candidate.candidate_id}
          </h3>
          {candidate.interview_key && (
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "6px",
                fontFamily: "monospace",
              }}
            >
              Key Node: {candidate.interview_key}
            </p>
          )}
        </div>

        {/* Status Top Right & Circular Graph */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: isPass ? "var(--accent-primary)" : "var(--danger)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {isPass ? "Screening Passed" : "Screening Failed"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
               {isPass ? "Interview Protocol: Pending" : "Rejected at Node 01"}
            </div>
            <div style={{ fontSize: "10px", color: "#888", marginTop: "4px", fontStyle: "italic" }}>
               Sys. Recommendation: {candidate.ai_recommendation}
            </div>
          </div>

          <div style={{ width: "32px", height: "32px" }}>
            <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%" }}>
              <path
                stroke="var(--border-color)"
                strokeWidth="2"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                stroke={barColor}
                strokeWidth="2"
                strokeDasharray={`${candidate.match_score}, 100`}
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Body Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(250px, 1fr) minmax(300px, 1fr)",
          gap: "40px",
        }}
      >
        {/* Left Column: Tech Skills Component */}
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "16px",
            }}
          >
            Technical Profile
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {candidate.technical_skills.map((ts, i) => (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    marginBottom: "6px",
                  }}
                >
                  <span>{ts.skill}</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {ts.rating}/10
                  </span>
                </div>
                <div className="linear-progress-container">
                  <div
                    className="linear-progress-bar"
                    style={{
                      width: `${ts.rating * 10}%`,
                      backgroundColor: barColor,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "32px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "12px",
              }}
            >
              Sentiment Flags
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  background: "#242424",
                  color: "#D1D1D1",
                  padding: "4px 8px",
                  borderRadius: "2px",
                  fontSize: "11px",
                  fontWeight: "500",
                }}
              >
                {candidate.sentiment_analysis}
              </span>
              {candidate.coachability_flag && (
                <span
                  style={{
                    background: "#242424",
                    color: "#D1D1D1",
                    padding: "4px 8px",
                    borderRadius: "2px",
                    fontSize: "11px",
                    fontWeight: "500",
                  }}
                >
                  COACHABLE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Pros/Cons & Evidence */}
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "16px",
            }}
          >
            Evaluation Schema
          </div>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {candidate.pros.map((pro, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  fontSize: "13px",
                  color: "#E2E8F0",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth="2.5"
                  style={{ marginTop: "2px", flexShrink: 0 }}
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {pro.text}
              </li>
            ))}
            {candidate.concerns.map((con, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  fontSize: "13px",
                  color: "#E2E8F0",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--danger)"
                  strokeWidth="2.5"
                  style={{ marginTop: "2px", flexShrink: 0 }}
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                {con.text}
              </li>
            ))}
          </ul>

          <div
            style={{
              marginTop: "24px",
              background: "#111418",
              padding: "16px",
              borderRadius: "4px",
              borderLeft: "2px solid #5B21B6",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "6px",
              }}
            >
              Evidence Log Recording
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "#CBD5E1",
                margin: 0,
                lineHeight: "1.6",
              }}
            >
              "{candidate.evidence_log}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateCard;
