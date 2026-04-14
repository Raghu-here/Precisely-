import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { StatusBadge, Spinner, EmptyState } from '../../components/ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AppliedJobs() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, status

  useEffect(() => {
    axios.get(`${API_URL}/api/candidates/applications`)
      .then(res => setApplications(res.data || []))
      .catch(() => setError('Failed to load applications. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  const sortedApplications = useMemo(() => {
    const arr = [...applications];
    if (sortBy === 'date-desc') {
      arr.sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0));
    } else if (sortBy === 'date-asc') {
      arr.sort((a, b) => new Date(a.appliedAt || 0) - new Date(b.appliedAt || 0));
    } else if (sortBy === 'status') {
      const order = { 'Shortlisted': 1, 'Reviewed': 2, 'Pending': 3, 'Rejected': 4 };
      arr.sort((a, b) => (order[a.status] || 5) - (order[b.status] || 5));
    }
    return arr;
  }, [applications, sortBy]);

  const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '16px', fontSize: '13px', color: 'var(--text-main)', borderBottom: '1px solid rgba(58,58,58,0.5)', verticalAlign: 'middle' };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Spinner size={32} /></div>;

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Applied Jobs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Track the status of every role you've applied to.</p>
        </div>
        {applications.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sort by:</span>
            <select className="neo-input" style={{ width: '150px', padding: '8px 12px', fontSize: '12px' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="status">Status Priority</option>
            </select>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.3)', borderRadius: '8px', padding: '14px 18px', color: 'var(--danger)', fontSize: '14px', marginBottom: '24px' }}>
          ⚠️ {error}
        </div>
      )}

      {applications.length === 0 && !error ? (
        <EmptyState icon="📋" title="No Applications Yet" subtitle="You haven't applied to any jobs yet. Browse open roles and take the next step." actionLabel="Browse Open Roles" onAction={() => window.location.reload()} />
      ) : (
        <>
          {/* Desktop table */}
          <div style={{ display: 'none', '@media(minWidth: 768px)': { display: 'block' } }} className="desktop-table">
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <tr>
                    <th style={thStyle}>Job Title</th>
                    <th style={thStyle}>Company</th>
                    <th style={thStyle}>Location</th>
                    <th style={thStyle}>Applied Date</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedApplications.map((app, i) => (
                    <tr key={i} style={{ transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{app.jobTitle || 'Unknown Role'}</td>
                      <td style={tdStyle}>{app.company || 'Precisely'}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{app.location || 'Remote'}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
                      <td style={tdStyle}><StatusBadge status={app.status || 'Pending'} /></td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <a href="#" onClick={e => e.preventDefault()} style={{ color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 500, textDecoration: 'none' }}>View Job →</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile-responsive card list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="mobile-list">
            {sortedApplications.map((app, i) => (
              <div key={i} className="candidate-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ color: '#fff', fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{app.jobTitle || 'Unknown Role'}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{app.company || 'Precisely'} • {app.location || 'Remote'}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>
                      Applied: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'}) : '—'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                    <StatusBadge status={app.status || 'Pending'} />
                    <a href="#" onClick={e => e.preventDefault()} style={{ color: 'var(--accent-primary)', fontSize: '12px', fontWeight: 500, textDecoration: 'none' }}>View Job →</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
