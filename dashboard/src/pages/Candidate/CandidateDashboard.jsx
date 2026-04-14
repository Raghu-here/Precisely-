import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CandidateProfile from './CandidateProfile';
import ResumeHub from './ResumeHub';
import AIInterview from './AIInterview';
import JobExplorer from '../../components/JobExplorer';
import { useToast } from '../../components/ui';
import Footer from '../../components/Footer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const NAV_ITEMS = [
  { id: 'job-board', label: 'Job Explorer', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
  { id: 'applications', label: 'My Applications', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg> },
  { id: 'profile',   label: 'My Profile',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { id: 'resume',    label: 'Resume Hub',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { id: 'interview', label: 'AI Interview', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> },
];

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState('job-board');
  const [userEmail, setUserEmail] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('precisely_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('precisely_theme', theme);
  }, [theme]);

  const [selectedJob, setSelectedJob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [appStatus, setAppStatus] = useState('Browsing Roles');
  const [phase, setPhase] = useState('job-board'); // for the apply flow
  const [screeningResult, setScreeningResult] = useState(null); // holds the full AI screening result
  const fileInputRef = useRef(null);

  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/auth/me`)
      .then(res => setUserEmail(res.data.email || ''))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'applications') {
      setAppsLoading(true);
      axios.get(`${API_URL}/api/candidates/applications`, { withCredentials: true })
        .then(res => setApplications(res.data.applications || []))
        .catch(() => {})
        .finally(() => setAppsLoading(false));
    }
  }, [activeTab]);

  const handleLogout = async () => {
    try { await axios.post(`${API_URL}/api/auth/logout`); } catch (_) {}
    navigate('/');
  };

  const proceedToApply = (job) => {
    setSelectedJob(job);
    setPhase('apply');
    setAppStatus('Preparing Application');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setAppStatus('Under Review by Gatekeeper');

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_id', selectedJob.job_id || selectedJob._id);

    try {
      const res = await axios.post(`${API_URL}/api/candidates/screen`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
        onUploadProgress: (p) => {
          setUploadProgress(Math.round((p.loaded * 100) / p.total));
        }
      });
      const result = res.data.result;
      setScreeningResult(result);

      if (result.match_score >= 70) {
        setAppStatus(`Approved (${result.match_score}%) — Interview Pending`);
      } else {
        setAppStatus('Not shortlisted');
      }
      setPhase('screening-result');
    } catch (err) {
      showToast('Upload Failed: ' + (err.response?.data?.error || 'Server error'), 'error');
      setAppStatus('Upload Error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: '#fff', display: 'flex' }}>
      <ToastContainer />

      {/* Premium Candidate Sidebar */}
      <div className="sidebar" style={{ width: '280px', background: 'rgba(10, 11, 14, 0.8)', backdropFilter: 'blur(40px)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '40px 32px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--accent-primary), #1D4ED8)', borderRadius: '8px', boxShadow: '0 0 15px rgba(59,130,246,0.3)' }} />
            <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>Precisely.</h1>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Candidate Terminal</p>
        </div>

        <div style={{ padding: '0 16px', flex: 1 }}>
          <div style={{ marginBottom: '12px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 800, padding: '0 16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Core Navigation</div>
          {NAV_ITEMS.map(item => (
            <div 
              key={item.id} 
              onClick={() => { setActiveTab(item.id); if (item.id === 'job-board') setPhase('job-board'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s', background: activeTab === item.id ? 'rgba(59,130,246,0.1)' : 'transparent', color: activeTab === item.id ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: activeTab === item.id ? 700 : 500, marginBottom: '6px' }}
            >
              {item.icon}
              <span style={{ fontSize: '14px' }}>{item.label}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: '32px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{userEmail.split('@')[0]}</div>
              <div style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>Verified Profile</div>
            </div>
          </div>
          <button
            style={{ width: '100%', padding: '12px 0px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          >
            <span style={{ fontSize: '16px' }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button 
            style={{ width: '100%', padding: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
            onClick={handleLogout}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Leave Terminal
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content" style={{ flex: 1, padding: '48px 60px', overflowY: 'auto', background: 'transparent' }}>

        {/* ── JOB EXPLORER TAB ── */}
        {activeTab === 'job-board' && phase === 'job-board' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: '8px' }}>Opportunity Nexus</h2>
              <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Explore high-impact roles vetted by Precisely Intelligence.</p>
            </div>
            <JobExplorer onApplyTarget={proceedToApply} />
          </div>
        )}

        {/* ── APPLY PHASE (Gatekeeper AI Screening) ── */}
        {activeTab === 'job-board' && phase === 'apply' && (
          <div style={{ maxWidth: '640px', margin: '60px auto', animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="candidate-card" style={{ textAlign: 'center', padding: '64px 48px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '32px', backdropFilter: 'blur(30px)', position: 'relative', overflow: 'hidden' }}>
              {/* Decorative Glow */}
              <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '56px', marginBottom: '24px', animation: 'float 3s infinite ease-in-out' }}>📄</div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>Intelligence Screening</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '40px', lineHeight: 1.6 }}>
                  Our <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>Gatekeeper AI</span> will now evaluate your technical trajectory against the requirements for <br/> <strong style={{ color: '#fff' }}>{selectedJob?.title}</strong>
                </p>
                
                <input type="file" accept="application/pdf,.doc,.docx" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                
                <div onClick={() => !isUploading && fileInputRef.current?.click()}
                  style={{ border: '2px dashed var(--glass-border)', padding: '48px', borderRadius: '24px', marginBottom: '32px', cursor: isUploading ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.02)', position: 'relative', transition: 'all 0.3s' }}
                  onMouseEnter={e => !isUploading && (e.currentTarget.style.borderColor = 'var(--accent-primary)', e.currentTarget.style.background = 'rgba(59,130,246,0.04)')}
                  onMouseLeave={e => !isUploading && (e.currentTarget.style.borderColor = 'var(--glass-border)', e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                >
                  {isUploading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,11,14,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '24px', gap: '20px', zIndex: 10 }}>
                      <div className="loader" style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Analyzing via Gatekeeper AI...</div>
                      <div style={{ width: '60%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.7 }}>📤</div>
                  <div style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {isUploading ? 'Decrypting Resume Artifacts...' : 'Select PDF or DOCX to initiate screening'}
                  </div>
                </div>

                <button style={{ background: 'transparent', color: 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'color 0.2s' }}
                  onClick={() => { setPhase('job-board'); setAppStatus('Browsing Roles'); }}
                  onMouseEnter={e => e.target.style.color = '#fff'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
                >
                  Abort Extraction
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SCREENING RESULT PHASE ── */}
        {activeTab === 'job-board' && phase === 'screening-result' && screeningResult && (() => {
          const { match_score, ai_recommendation, decision_reasoning, technical_skills, pros, concerns } = screeningResult;
          const passed = match_score >= 70;
          return (
            <div style={{ maxWidth: '680px', margin: '0 auto', marginTop: '40px', animation: 'fadeIn 300ms ease' }}>
              {/* Score Card */}
              <div className="candidate-card" style={{ padding: '40px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '160px 1fr', gap: '40px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <path stroke="var(--border-color)" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path stroke={passed ? 'var(--accent-primary)' : 'var(--danger)'} strokeWidth="3" strokeDasharray={`${match_score}, 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style={{ transition: 'stroke-dasharray 1s ease-out' }} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <span style={{ fontSize: '28px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{match_score}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 100</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 10px', borderRadius: '20px', background: passed ? 'rgba(52,211,153,0.1)' : 'rgba(229,62,62,0.1)', color: passed ? 'var(--success)' : 'var(--danger)', border: `1px solid ${passed ? 'rgba(52,211,153,0.3)' : 'rgba(229,62,62,0.3)'}` }}>
                    {passed ? 'Shortlisted' : 'Not Shortlisted'}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Gatekeeper Verdict</div>
                  <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#fff', marginBottom: '10px' }}>{ai_recommendation}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{decision_reasoning}</p>
                </div>
              </div>

              {/* Skills Breakdown */}
              {technical_skills && technical_skills.length > 0 && (
                <div className="candidate-card" style={{ padding: '24px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', fontWeight: 600 }}>Skill Ratings</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {technical_skills.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#fff', width: '140px', flexShrink: 0 }}>{s.skill}</span>
                        <div style={{ flex: 1, height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${(s.rating / 10) * 100}%`, height: '100%', background: s.rating >= 7 ? 'var(--accent-primary)' : s.rating >= 4 ? '#F59E0B' : 'var(--danger)', borderRadius: '2px', transition: 'width 0.8s ease-out' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '32px', textAlign: 'right' }}>{s.rating}/10</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pros & Concerns */}
              {((pros && pros.length > 0) || (concerns && concerns.length > 0)) && (
                <div className="candidate-card" style={{ padding: '24px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  {pros && pros.length > 0 && (
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: 600 }}>Strengths</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {pros.map((p, i) => (<div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span><span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{p.text}</span></div>))}
                      </div>
                    </div>
                  )}
                  {concerns && concerns.length > 0 && (
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: 600 }}>Concerns</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {concerns.map((c, i) => (<div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ color: 'var(--danger)', flexShrink: 0 }}>!</span><span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{c.text}</span></div>))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {passed ? (
                  <button className="primary-btn" style={{ flex: 1, padding: '14px', fontWeight: 700, fontSize: '15px' }}
                    onClick={() => { setActiveTab('interview'); setPhase('job-board'); }}>
                    Proceed to AI Interview →
                  </button>
                ) : (
                  <button className="primary-btn" style={{ flex: 1, padding: '14px', background: 'rgba(96,165,250,0.1)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                    onClick={() => { setPhase('job-board'); setSelectedJob(null); setScreeningResult(null); }}>
                    Back to Job Explorer
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {activeTab === 'job-board' && phase === 'interview' && (
          <div style={{ maxWidth: '640px', margin: '60px auto', animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="candidate-card" style={{ textAlign: 'center', padding: '64px 48px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '32px', backdropFilter: 'blur(30px)', borderTop: '2px solid var(--success)' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>🛡️</div>
              <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.02em' }}>Shield Authenticated</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '40px', lineHeight: 1.6 }}>
                Your technical profile matches the corporate requirements. <br/>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>Protocol V-10 Initiate:</span> Live AI Interview is now available.
              </p>
              <button 
                className="primary-btn" 
                onClick={() => setActiveTab('interview')} 
                style={{ padding: '18px 40px', fontWeight: 800, fontSize: '15px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--success), #059669)', boxShadow: '0 10px 25px -5px rgba(16,185,129,0.4)', border: 'none' }}
              >
                Commence AI Interview →
              </button>
            </div>
          </div>
        )}

        {/* ── MY APPLICATIONS TAB ── */}
        {activeTab === 'applications' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: '8px' }}>My Applications</h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '32px' }}>Track your active application statuses.</p>
            
            {appsLoading ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div className="loader" style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            ) : applications.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📫</div>
                <h3 style={{ fontSize: '18px', color: '#fff', fontWeight: 600 }}>No applications filed</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>Explore the Job Board to find your next opportunity.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {applications.map((app, i) => (
                  <div key={i} className="candidate-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', color: '#fff', fontWeight: 700, marginBottom: '6px' }}>{app.title || "Software Engineer"}</h4>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span>Score: <strong style={{ color: app.match_score >= 70 ? 'var(--success)' : '#F59E0B' }}>{app.match_score}%</strong></span>
                        <span style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%' }} />
                        <span>Status: {app.ai_recommendation || "Under Review"}</span>
                      </div>
                    </div>
                    <div style={{ padding: '6px 14px', background: app.status === 'Hold' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: app.status === 'Hold' ? '#EF4444' : '#10B981', border: `1px solid ${app.status === 'Hold' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: '20px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {app.status || "Pending"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── OTHER TABS ── */}
        {activeTab === 'profile'   && <CandidateProfile userEmail={userEmail} />}
        {activeTab === 'resume'    && <ResumeHub />}
        {activeTab === 'interview' && <AIInterview />}
        
        <div style={{ marginTop: '100px', marginInline: '-60px', marginBottom: '-40px' }}>
          <Footer />
        </div>
      </div>
    </div>
  );
}
