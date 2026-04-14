import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast, ConfirmModal, EmptyState, StatusBadge, Pagination, Spinner } from '../components/ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─── Edit Job Modal ─────────────────────────────────────────────────────────

function EditJobModal({ job, onSave, onClose, showToast }) {
  const [form, setForm] = useState({
    title: job.title || '',
    description: job.description || '',
    must_have_skills: (job.must_have_skills || []).join(', '),
    salary: job.salary || '',
    location: job.location || '',
    job_type: job.job_type || '',
    experience_level: job.experience_level || '',
    deadline: job.deadline || '',
    status: job.status || 'Active',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim()) { showToast('Job title is required', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        must_have_skills: form.must_have_skills.split(',').map(s => s.trim()).filter(Boolean)
      };
      await axios.patch(`${API_URL}/api/jobs/${job.job_id}`, payload);
      showToast('Job updated successfully', 'success');
      onSave({ ...job, ...payload });
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update job', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', outline: 'none', fontFamily: 'Inter', fontSize: '13px', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '32px', maxWidth: '560px', width: '95%', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>Edit Job Posting</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Job Title *</label>
            <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Senior Frontend Engineer" className="neo-input" />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the role..." className="neo-input" />
          </div>
          <div>
            <label style={labelStyle}>Must-Have Tech Stack (comma separated)</label>
            <input style={inputStyle} value={form.must_have_skills} onChange={e => setForm(f => ({ ...f, must_have_skills: e.target.value }))} placeholder="React, TypeScript, Node.js" className="neo-input" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Salary Range</label>
              <input style={inputStyle} value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} placeholder="$120k – $150k" className="neo-input" />
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input style={inputStyle} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Remote / Bangalore" className="neo-input" />
            </div>
            <div>
              <label style={labelStyle}>Job Type</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.job_type} onChange={e => setForm(f => ({ ...f, job_type: e.target.value }))} className="neo-input">
                <option value="">Select</option>
                <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Experience Level</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.experience_level} onChange={e => setForm(f => ({ ...f, experience_level: e.target.value }))} className="neo-input">
                <option value="">Select</option>
                <option>Entry Level</option><option>Mid Level</option><option>Senior</option><option>Lead / Manager</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Application Deadline</label>
              <input type="date" style={inputStyle} value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="neo-input" />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="neo-input">
                <option>Active</option><option>Closed</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.6 : 1 }}>
            {saving && <Spinner size={14} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Posted Jobs Tab ─────────────────────────────────────────────────────────

export default function PostedJobsTab({ onPostJob }) {
  const { showToast, ToastContainer } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;
  const [editJob, setEditJob] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchJobs = async (p = page) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/recruiter/jobs?page=${p}&limit=${LIMIT}`);
      setJobs(res.data.jobs || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      showToast('Failed to load your posted jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(page); }, [page]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/jobs/${deleteTarget.job_id}`);
      setJobs(prev => prev.filter(j => j.job_id !== deleteTarget.job_id));
      setTotal(t => t - 1);
      showToast('Job deleted successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete job', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleSaveEdit = (updatedJob) => {
    setJobs(prev => prev.map(j => j.job_id === updatedJob.job_id ? updatedJob : j));
    setEditJob(null);
  };

  const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '14px 16px', fontSize: '13px', color: 'var(--text-main)', borderBottom: '1px solid rgba(58,58,58,0.5)', verticalAlign: 'middle' };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size={28} /></div>
  );

  if (jobs.length === 0) return (
    <>
      <ToastContainer />
      <EmptyState icon="📋" title="No jobs posted yet" subtitle="Start by posting your first job requisition to attract candidates." actionLabel="Post Your First Job" onAction={onPostJob} />
    </>
  );

  return (
    <div style={{ animation: 'fadeIn 300ms ease' }}>
      <ToastContainer />
      {editJob && <EditJobModal job={editJob} onSave={handleSaveEdit} onClose={() => setEditJob(null)} showToast={showToast} />}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Job Posting"
        message="Are you sure you want to delete this job posting? This action cannot be undone."
        confirmLabel="Delete"
        confirmDanger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
            <tr>
              {['Job Title', 'Date Posted', 'Applications', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ ...thStyle, textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, i) => (
              <tr key={job.job_id || i} style={{ transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600 }}>{job.title || `REQ-${job.job_id}`}</div>
                  {job.location && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{job.location}</div>}
                </td>
                <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>
                  {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{job.applicationCount || 0}</td>
                <td style={tdStyle}><StatusBadge status={job.status || 'Active'} /></td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditJob(job)}
                      style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                    <button onClick={() => setDeleteTarget(job)}
                      style={{ padding: '6px 12px', background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.3)', borderRadius: '4px', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,62,62,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(229,62,62,0.1)'}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/></svg>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPage={(p) => { setPage(p); window.scrollTo(0, 0); }} />
    </div>
  );
}
