import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useToast, Spinner, Pagination } from './ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function JobExplorer({ onApplyTarget }) {
  const { showToast, ToastContainer } = useToast();
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [expLevel, setExpLevel] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchJobsAndApplications();
  }, []);

  const fetchJobsAndApplications = async () => {
    setLoading(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([
        axios.get(`${API_URL}/api/jobs?limit=200`), // Fetch all for strict client side filtering per instructions, or we can paginated later
        axios.get(`${API_URL}/api/candidates/applications`)
      ]);
      setJobs(jobsRes.data.jobs || []);
      const appliedSet = new Set(appsRes.data.map(a => a.job_id));
      setAppliedJobIds(appliedSet);
    } catch {
      showToast('Failed to load requisitions. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    let result = jobs.filter(j => j.status !== 'Closed');

    if (keyword) {
      const k = keyword.toLowerCase();
      result = result.filter(j => (j.title || '').toLowerCase().includes(k) || (j.description || '').toLowerCase().includes(k) || (j.must_have_skills || []).some(s => s.toLowerCase().includes(k)));
    }
    if (location) {
      result = result.filter(j => (j.location || '').toLowerCase().includes(location.toLowerCase()));
    }
    if (jobType) {
      result = result.filter(j => j.job_type === jobType);
    }
    if (expLevel) {
      result = result.filter(j => j.experience_level === expLevel);
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    }

    return result;
  }, [jobs, keyword, location, jobType, expLevel, sortBy]);

  const [page, setPage] = useState(1);
  const LIMIT = 10;
  const totalPages = Math.ceil(filteredJobs.length / LIMIT);
  const paginatedJobs = filteredJobs.slice((page - 1) * LIMIT, page * LIMIT);

  const clearFilters = () => {
    setKeyword(''); setLocation(''); setJobType(''); setExpLevel(''); setSortBy('newest');
  };

  const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', outline: 'none', fontFamily: 'Inter', fontSize: '13px', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Spinner size={32} /></div>;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <ToastContainer />
      
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        
        {/* Advanced Filters Sidebar */}
        <div style={{ width: '300px', flexShrink: 0, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px', backdropFilter: 'blur(20px)', position: 'sticky', top: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>Intelligence Filters</h3>
            <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '12px', cursor: 'pointer', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reset</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={labelStyle}>Keyword Search</label>
              <input style={inputStyle} className="neo-input" placeholder="Title, skills, keywords" value={keyword} onChange={e => setKeyword(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Operational Base</label>
              <input style={inputStyle} className="neo-input" placeholder="City or remote" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Engagement Type</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} className="neo-input" value={jobType} onChange={e => setJobType(e.target.value)}>
                <option value="">Any</option>
                <option>Full-time</option><option>Contract</option><option>Part-time</option><option>Internship</option><option>Advisory</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Seniority Level</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} className="neo-input" value={expLevel} onChange={e => setExpLevel(e.target.value)}>
                <option value="">Any</option>
                <option>Entry Level</option><option>Mid Level</option><option>Senior</option><option>Lead / Manager</option><option>Principal</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Prioritization</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} className="neo-input" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">Latest Deployment</option>
                <option value="oldest">Legacy listings</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Stream */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            System detected {filteredJobs.length} {filteredJobs.length === 1 ? 'Opportunity' : 'Opportunities'}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
            {paginatedJobs.map((job, i) => {
              const jobId = job.job_id || job._id;
              const hasApplied = appliedJobIds.has(jobId);
              return (
                <div key={jobId || i} className="candidate-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', padding: '28px', borderRadius: '24px', backdropFilter: 'blur(20px)', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                >
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'radial-gradient(circle at top right, rgba(59,130,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
                  
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px', color: '#fff', letterSpacing: '-0.02em' }}>{job.title || `REQ-${jobId}`}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      <span style={{ color: 'var(--accent-primary)' }}>{job.company || 'Nexus Systems'}</span>
                      {job.location && <span>· {job.location}</span>}
                      {job.salary && <span style={{ color: 'var(--success)' }}>· {job.salary}</span>}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '14px', color: '#CBD5E1', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>
                    {job.description || 'No strategic description provided for this requisition.'}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {(job.must_have_skills || []).slice(0, 3).map(s => (
                      <span key={s} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>{s}</span>
                    ))}
                  </div>
                  
                  <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                    {hasApplied ? (
                      <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--success)', borderRadius: '12px', padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', textTransform: 'uppercase' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Authenticated
                      </div>
                    ) : (
                      <button className="primary-btn" style={{ width: '100%', borderRadius: '12px', padding: '14px', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'linear-gradient(135deg, var(--accent-primary), #1D4ED8)', border: 'none', boxShadow: '0 8px 20px -5px rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => onApplyTarget(job)}>
                        Initiate Assessment
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredJobs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '100px 48px', background: 'rgba(255,255,255,0.01)', borderRadius: '32px', border: '1px solid var(--glass-border)', marginTop: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '24px', opacity: 0.5 }}>📡</div>
              <p style={{ color: '#fff', fontSize: '18px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>No Resonance Detected</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Adjust your intelligence filters to synchronize with available requisitions.</p>
            </div>
          )}

          <div style={{ marginTop: '48px' }}>
            <Pagination page={page} totalPages={totalPages} total={filteredJobs.length} limit={LIMIT} onPage={p => { setPage(p); window.scrollTo(0, 0); }} />
          </div>
        </div>
      </div>
    </div>
  );
}
