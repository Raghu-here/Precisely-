import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CandidateCard from '../../components/CandidateCard';
import ApplicantPipelineCard from '../../components/ApplicantPipelineCard';
import PostedJobsTab from '../../components/PostedJobsTab';
import { useToast, Spinner, EmptyState, Pagination } from '../../components/ui';
import Footer from '../../components/Footer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const HRDashboard = () => {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [userEmail, setUserEmail] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('precisely_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('precisely_theme', theme);
  }, [theme]);

  // Pipeline Data
  const [candidates, setCandidates] = useState([]);
  const [loadingPipeline, setLoadingPipeline] = useState(true);
  const [pipelinePage, setPipelinePage] = useState(1);
  const PIPELINE_LIMIT = 50; // Typically we want to see all in pipeline or a large number

  // Drawer & Selection
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [resumeDrawerOpen, setResumeDrawerOpen] = useState(false);
  const [activeResumeBase64, setActiveResumeBase64] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);

  // Post Job Form
  const [jobPosting, setJobPosting] = useState({
    title: '', company: '', description: '', must_have_skills: '', nice_to_have_skills: '', salary: '', location: '', job_type: '', experience_level: '', deadline: ''
  });
  const [postingLoading, setPostingLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/auth/me`)
      .then(res => setUserEmail(res.data.email || ''))
      .catch(() => {});
    fetchPipeline();
  }, []);

  const fetchPipeline = () => {
    setLoadingPipeline(true);
    axios.get(`${API_URL}/api/candidates/dossiers`)
      .then(res => setCandidates(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoadingPipeline(false));
  };

  const handleLogout = async () => {
    try { await axios.post(`${API_URL}/api/auth/logout`); } catch (_) {}
    navigate('/');
  };

  const submitJobPosting = async (e) => {
    e.preventDefault();
    setPostingLoading(true);
    try {
      const payload = {
        title: jobPosting.title,
        company: jobPosting.company,
        description: jobPosting.description,
        must_have_skills: jobPosting.must_have_skills.split(',').map(s => s.trim()).filter(Boolean),
        nice_to_have_skills: jobPosting.nice_to_have_skills.split(',').map(s => s.trim()).filter(Boolean),
        salary: jobPosting.salary,
        location: jobPosting.location,
        job_type: jobPosting.job_type,
        experience_level: jobPosting.experience_level,
        deadline: jobPosting.deadline,
      };
      await axios.post(`${API_URL}/api/jobs`, payload);
      showToast('Position published to internal career portal successfully.', 'success');
      setJobPosting({ title: '', company: '', description: '', must_have_skills: '', nice_to_have_skills: '', salary: '', location: '', job_type: '', experience_level: '', deadline: '' });
      setActiveTab('jobs'); // Navigate to posted jobs
    } catch (err) {
      showToast('Failed to post position.', 'error');
    } finally {
      setPostingLoading(false);
    }
  };

  const handlePipelineStatusChange = (candidateId, newStatus) => {
    setCandidates(prev => prev.map(c =>
        (c.candidate_id === candidateId) ? { ...c, status: newStatus } : c
    ));
  };

  const handleOpenDrawer = (cand) => {
    setSelectedCandidate(cand);
    setResumeDrawerOpen(true);
    setActiveResumeBase64(null);
    setResumeLoading(true);

    const appId = cand.applicationId || cand._id?.toString() || cand.candidate_id;
    axios.get(`${API_URL}/api/recruiter/applicants/${appId}/resume`)
      .then(res => {
        if (res.data.url && res.data.url.startsWith('data:')) {
          setActiveResumeBase64(res.data.url);
        }
      })
      .catch(() => {})
      .finally(() => setResumeLoading(false));
  };

  const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', outline: 'none', fontFamily: 'Inter', fontSize: '13px', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 };

  return (
    <div className="app-container" style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: '#fff', display: 'flex' }}>
      <ToastContainer />

      {/* Modern Glassmorphic Sidebar */}
      <div className="sidebar" style={{ width: '280px', background: 'rgba(10, 11, 14, 0.8)', backdropFilter: 'blur(40px)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '40px 32px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--accent-secondary), #6D28D9)', borderRadius: '8px', boxShadow: '0 0 15px rgba(139,92,246,0.3)' }} />
            <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>Precisely.</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Intelligence Terminal</p>
        </div>

        <div style={{ padding: '0 16px', flex: 1 }}>
          <div style={{ marginBottom: '8px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, padding: '0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operations</div>
          <div className={`nav-item ${activeTab === 'pipeline' ? 'active' : ''}`} 
            onClick={() => setActiveTab('pipeline')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s', background: activeTab === 'pipeline' ? 'rgba(139,92,246,0.1)' : 'transparent', color: activeTab === 'pipeline' ? 'var(--accent-secondary)' : 'var(--text-muted)', fontWeight: activeTab === 'pipeline' ? 700 : 500, marginBottom: '4px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="10"/></svg>
            Evaluation Pipeline
          </div>
          <div className={`nav-item ${activeTab === 'post-job' ? 'active' : ''}`} 
            onClick={() => setActiveTab('post-job')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s', background: activeTab === 'post-job' ? 'rgba(139,92,246,0.1)' : 'transparent', color: activeTab === 'post-job' ? 'var(--accent-secondary)' : 'var(--text-muted)', fontWeight: activeTab === 'post-job' ? 700 : 500, marginBottom: '4px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Create Requisition
          </div>
          <div className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`} 
            onClick={() => setActiveTab('jobs')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s', background: activeTab === 'jobs' ? 'rgba(139,92,246,0.1)' : 'transparent', color: activeTab === 'jobs' ? 'var(--accent-secondary)' : 'var(--text-muted)', fontWeight: activeTab === 'jobs' ? 700 : 500 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            Active Listings
          </div>
        </div>

        <div style={{ marginTop: 'auto', padding: '32px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Admin Panel</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{userEmail.split('@')[0]}</div>
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
            style={{ width: '100%', padding: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, transition: 'all 0.3s', textTransform: 'uppercase', letterSpacing: '0.05em' }} 
            onClick={handleLogout}
            onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.15)'}
            onMouseLeave={e => e.target.style.background = 'rgba(239,68,68,0.08)'}
          >
            Terminate Session
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ flex: 1, padding: '48px 60px', background: 'transparent' }}>
        
        {/* PIPELINE TAB */}
        {activeTab === 'pipeline' && (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="header" style={{ border: 'none', marginBottom: '40px', padding: 0 }}>
              <div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: '8px' }}>Recruitment Pipeline</h2>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Monitor system-vetted candidates and manage hiring workflows.</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 10px var(--success)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Analyst AI: Online</span>
              </div>
            </div>

            {/* Quick Stats Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
              {[
                { label: 'Total Applicants', value: candidates.length, icon: '📊', color: 'var(--accent-primary)' },
                { label: 'In Review', value: candidates.filter(c => c.status === 'Applied' || !c.status).length, icon: '🔍', color: 'var(--accent-secondary)' },
                { label: 'Interviewed', value: candidates.filter(c => c.status === 'Interviewing').length, icon: '🎤', color: 'var(--success)' },
                { label: 'Offers Sent', value: candidates.filter(c => c.status === 'Hired').length, icon: '✉️', color: '#F59E0B' },
              ].map((stat, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', padding: '24px', borderRadius: '20px', backdropFilter: 'blur(20px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '24px' }}>{stat.icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: stat.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Metrics</span>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>{stat.value}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {loadingPipeline ? (
               <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
                 {[1,2,3,4,5,6].map(i => (
                   <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '28px', borderRadius: '24px', height: '280px', animation: 'pulse 1.5s infinite' }} />
                 ))}
               </div>
            ) : candidates.length === 0 ? (
               <EmptyState icon="📬" title="System Standby" subtitle="No active dossiers found. Deploy a new requisition to initiate the Gatekeeper AI." actionLabel="Create Requisition" onAction={() => setActiveTab('post-job')} />
            ) : (
              <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
                {candidates.map((cand, idx) => (
                  <ApplicantPipelineCard 
                    key={cand.candidate_id || idx} 
                    candidate={cand} 
                    onStatusChange={handlePipelineStatusChange}
                    onOpenDrawer={() => handleOpenDrawer(cand)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* POST JOB TAB */}
        {activeTab === 'post-job' && (
          <div style={{ maxWidth: '800px', animation: 'fadeIn 0.5s ease-out' }}>
            <div className="header" style={{ border: 'none', marginBottom: '40px', padding: 0 }}>
              <div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: '8px' }}>Launch Requisition</h2>
                <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Configure technical parameters to calibrate the Gatekeeper AI.</p>
              </div>
            </div>

            <form onSubmit={submitJobPosting} style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', padding: '40px', borderRadius: '24px', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={labelStyle}>Requisition Title</label>
                  <input style={inputStyle} required value={jobPosting.title} onChange={e => setJobPosting(p => ({...p, title: e.target.value}))} placeholder="e.g. Senior Backend Architect" className="neo-input" />
                </div>
                <div>
                  <label style={labelStyle}>Hiring Entity</label>
                  <input style={inputStyle} required value={jobPosting.company} onChange={e => setJobPosting(p => ({...p, company: e.target.value}))} placeholder="e.g. Nexus Systems" className="neo-input" />
                </div>
              </div>
              
              <div>
                <label style={labelStyle}>Executive Summary</label>
                <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} value={jobPosting.description} onChange={e => setJobPosting(p => ({...p, description: e.target.value}))} placeholder="Outline the strategic impact and technical requirements of this role..." className="neo-input" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.1)', padding: '20px', borderRadius: '16px' }}>
                  <label style={{ ...labelStyle, color: 'var(--accent-primary)' }}>Must-Have Architecture (CSV)</label>
                  <input style={{ ...inputStyle, background: 'transparent', border: 'none', padding: '8px 0', borderBottom: '1px solid rgba(59,130,246,0.2)' }} required value={jobPosting.must_have_skills} onChange={e => setJobPosting(p => ({...p, must_have_skills: e.target.value}))} placeholder="React, Node.js, PostgreSQL" />
                </div>
                <div style={{ background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.1)', padding: '20px', borderRadius: '16px' }}>
                  <label style={{ ...labelStyle, color: 'var(--accent-secondary)' }}>Bonus Competencies (CSV)</label>
                  <input style={{ ...inputStyle, background: 'transparent', border: 'none', padding: '8px 0', borderBottom: '1px solid rgba(139,92,246,0.2)' }} value={jobPosting.nice_to_have_skills} onChange={e => setJobPosting(p => ({...p, nice_to_have_skills: e.target.value}))} placeholder="Docker, AWS, Redis" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                <div>
                  <label style={labelStyle}>Compensation</label>
                  <input style={inputStyle} value={jobPosting.salary} onChange={e => setJobPosting(p => ({...p, salary: e.target.value}))} placeholder="$140k - $180k" className="neo-input" />
                </div>
                <div>
                  <label style={labelStyle}>Operational Base</label>
                  <input style={inputStyle} value={jobPosting.location} onChange={e => setJobPosting(p => ({...p, location: e.target.value}))} placeholder="Remote / Global" className="neo-input" />
                </div>
                <div>
                  <label style={labelStyle}>Project Structure</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={jobPosting.job_type} onChange={e => setJobPosting(p => ({...p, job_type: e.target.value}))} className="neo-input">
                    <option value="">Select Level</option>
                    <option>Full-time</option><option>Venture-based</option><option>Strategy Advisor</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
                <button type="submit" disabled={postingLoading} className="primary-btn" style={{ padding: '16px 32px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--accent-secondary), #6D28D9)', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 20px -5px rgba(139,92,246,0.4)', border: 'none' }}>
                  {postingLoading ? <Spinner size={16} /> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                  {postingLoading ? 'Calibrating AI...' : 'Deploy Requisition'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* POSTED JOBS TAB */}
        {activeTab === 'jobs' && (
          <div>
            <div className="header">
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#fff' }}>My Posted Jobs</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>Manage your active and closed job requisitions.</p>
              </div>
              <button className="primary-btn" onClick={() => setActiveTab('post-job')}>Post New Job</button>
            </div>
            <PostedJobsTab onPostJob={() => setActiveTab('post-job')} />
          </div>
        )}
        
        
        <div style={{ marginTop: '80px', marginInline: '-40px', marginBottom: '-40px' }}>
          <Footer />
        </div>
      </div>

      {/* VIEW CANDIDATE PROFILE DRAWER */}
      {resumeDrawerOpen && selectedCandidate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s' }}>
          <div style={{ width: '640px', maxWidth: '100vw', background: 'var(--bg-dark)', borderLeft: '1px solid var(--glass-border)', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{selectedCandidate.candidateName || selectedCandidate.fullName || 'Candidate Profile'}</h3>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedCandidate.candidateEmail || 'No contact documented'}</div>
              </div>
              <button 
                onClick={() => setResumeDrawerOpen(false)} 
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              <div style={{ marginBottom: '32px', display: 'flex', gap: '24px' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '20px', borderRadius: '16px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>Fit Score</div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: selectedCandidate.match_score >= 70 ? 'var(--success)' : '#F59E0B' }}>
                    {selectedCandidate.match_score}<span style={{ fontSize: '16px', opacity: 0.5 }}>%</span>
                  </div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '20px', borderRadius: '16px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>AI Sentiment</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{selectedCandidate.ai_recommendation || 'Standard Review'}</div>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginBottom: '12px' }}>Verdict Justification</h4>
                <div style={{ padding: '20px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '16px', fontSize: '14px', lineHeight: 1.6, fontStyle: 'italic', color: '#E2E8F0' }}>
                  "{selectedCandidate.evidence_log || 'No detailed log extracted.'}"
                </div>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Source Document</span>
                  {activeResumeBase64 && (
                    <a href={activeResumeBase64} download={`${selectedCandidate.candidateName || 'Candidate'}_Resume.pdf`} style={{ color: 'var(--accent-secondary)', textDecoration: 'none' }}>Download PDF</a>
                  )}
                </h4>
                
                {resumeLoading ? (
                  <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '16px', flexDirection: 'column', gap: '16px' }}>
                    <Spinner size={32} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>Decrypting Artifact...</span>
                  </div>
                ) : activeResumeBase64 ? (
                  <div style={{ height: '600px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)', background: '#fff' }}>
                     <iframe src={activeResumeBase64} width="100%" height="100%" title="Resume" style={{ border: 'none' }} />
                  </div>
                ) : (
                  <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--glass-border)', borderRadius: '16px', flexDirection: 'column', gap: '16px' }}>
                     <span style={{ fontSize: '40px', opacity: 0.5 }}>📄</span>
                     <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, textAlign: 'center', maxWidth: '80%' }}>No embedded PDF available.<br/>They may have not completed the screening phase or used an alternative method.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default HRDashboard;
