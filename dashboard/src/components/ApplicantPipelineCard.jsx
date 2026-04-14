import React, { useState } from 'react';
import axios from 'axios';
import { StatusBadge, useToast } from './ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const STATUSES = ['Pending', 'Reviewed', 'Shortlisted', 'Rejected'];

export default function ApplicantPipelineCard({ candidate, onStatusChange }) {
  const { showToast, ToastContainer } = useToast();
  const isPass = candidate.match_score >= 70;
  const barColor = isPass ? 'var(--accent-primary)' : 'var(--danger)';
  const [status, setStatus] = useState(candidate.status || 'Pending');
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const applicationId = candidate.applicationId || candidate._id?.toString() || candidate.candidate_id;

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    const prev = status;
    setStatus(newStatus);
    try {
      await axios.patch(`${API_URL}/api/applications/${applicationId}/status`, { status: newStatus });
      showToast(`Status updated to ${newStatus}`, 'success');
      onStatusChange?.(candidate.candidate_id, newStatus);
    } catch (err) {
      setStatus(prev);
      showToast(err.response?.data?.error || 'Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadResume = async () => {
    setDownloading(true);
    try {
      const res = await axios.get(`${API_URL}/api/recruiter/applicants/${applicationId}/resume`);
      const { url, filename, candidateName } = res.data;
      if (url && !url.startsWith('#')) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${candidateName || 'Candidate'}_Resume.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        showToast('Resume file URL not available (local mode)', 'warning');
      }
    } catch (err) {
      if (err.response?.status === 404) showToast('No resume uploaded by this candidate', 'warning');
      else showToast('Failed to fetch resume', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="candidate-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '28px', borderRadius: '24px', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', animation: 'fadeIn 0.5s ease-out' }} 
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0,0,0,0.5)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <ToastContainer />
      
      {/* Decorative Glow based on Score */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: `radial-gradient(circle at top right, ${barColor}15 0%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' }}>{candidate.candidateName || candidate.fullName || 'Anonymous Node'}</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {candidate.candidateEmail && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{candidate.candidateEmail}</span>}
          </div>
        </div>
        <div style={{ position: 'relative', width: '44px', height: '44px' }}>
          <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
            <circle cx="18" cy="18" r="16" fill="none" stroke={barColor} strokeWidth="3" strokeDasharray={`${candidate.match_score}, 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease-out' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#fff' }}>
            {candidate.match_score}
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '16px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <span>AI Vetting Log</span>
          <span style={{ color: isPass ? 'var(--success)' : 'var(--danger)' }}>{candidate.ai_recommendation}</span>
        </div>
        <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>"{candidate.evidence_log}"</p>
      </div>

      {/* Skills Matrix */}
      {candidate.technical_skills?.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {candidate.technical_skills.slice(0, 4).map((ts, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {ts.skill} <span style={{ color: barColor, marginLeft: '4px' }}>{ts.rating}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer / Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={status}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={updating}
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <StatusBadge status={status} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onOpenDrawer}
            style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: 'var(--accent-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
          >
            Review Profile
          </button>
          
          {candidate.candidateEmail && (
            <button
              onClick={handleDownloadResume}
              disabled={downloading}
              style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              {downloading ? <span className="loader" style={{ width: '16px', height: '16px', border: '2px solid transparent', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : 
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
