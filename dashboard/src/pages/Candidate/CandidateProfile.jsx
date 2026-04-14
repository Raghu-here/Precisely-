import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Toast = ({ msg, type }) => (
  <div style={{
    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
    background: type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
    border: `1px solid ${type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
    color: type === 'success' ? '#34D399' : '#FCA5A5',
    borderRadius: '12px', padding: '12px 20px', fontSize: '14px', fontWeight: 600,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'fadeIn 200ms ease'
  }}>
    {type === 'success' ? '✓ ' : '✗ '}{msg}
  </div>
);

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', padding: '12px 14px', color: '#fff', fontSize: '14px', outline: 'none',
  transition: 'border-color 0.2s', fontFamily: 'Inter, sans-serif'
};
const labelStyle = { fontSize: '13px', fontWeight: 600, color: '#9CA3AF', marginBottom: '6px', display: 'block' };

export default function CandidateProfile({ userEmail }) {
  const [form, setForm] = useState({
    fullName: '', phone: '', location: '', linkedin: '', github: '', portfolio: '', currentJobTitle: '',
    skills: [], experience: '', bio: ''
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    axios.get(`${API_URL}/api/candidates/profile`)
      .then(res => {
        const p = res.data;
        if (p) setForm({
          fullName: p.fullName || '',
          phone: p.phone || '',
          location: p.location || '',
          linkedin: p.linkedin || '',
          github: p.github || '',
          portfolio: p.portfolio || '',
          currentJobTitle: p.currentJobTitle || '',
          skills: p.skills || [],
          experience: p.experience || '',
          bio: p.bio || ''
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSkillKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
      e.preventDefault();
      const skill = skillInput.trim().replace(/,$/, '');
      if (skill && !form.skills.includes(skill)) {
        setForm(f => ({ ...f, skills: [...f.skills, skill] }));
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }));

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required.';
    if (form.linkedin && !/^https?:\/\//.test(form.linkedin)) e.linkedin = 'LinkedIn URL must start with http:// or https://';
    if (form.github && !/^https?:\/\//.test(form.github)) e.github = 'GitHub URL must start with http:// or https://';
    if (form.portfolio && !/^https?:\/\//.test(form.portfolio)) e.portfolio = 'Portfolio URL must start with http:// or https://';
    if (form.experience && (isNaN(form.experience) || form.experience < 0)) e.experience = 'Enter a valid number of years.';
    if (form.bio.length > 500) e.bio = 'Bio must be under 500 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await axios.patch(`${API_URL}/api/candidates/profile`, form);
      showToast('Profile saved successfully!', 'success');
    } catch {
      showToast('Failed to save profile. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
      <span className="loader" style={{ width: '28px', height: '28px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ maxWidth: '640px', animation: 'fadeIn 300ms ease' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>My Profile</h1>
      <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '32px' }}>Keep your profile up-to-date to improve your match scores.</p>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Email — read only */}
        <div>
          <label style={labelStyle}>Email (read-only)</label>
          <input style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} value={userEmail || ''} readOnly />
        </div>

        {/* Full Name */}
        <div>
          <label style={labelStyle}>Full Name <span style={{color:'#EF4444'}}>*</span></label>
          <input style={{ ...inputStyle, borderColor: errors.fullName ? '#EF4444' : undefined }}
            value={form.fullName} onChange={e => setForm(f => ({...f, fullName: e.target.value}))}
            placeholder="Jane Doe" />
          {errors.fullName && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.fullName}</p>}
        </div>

        {/* Phone + Location */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} value={form.phone}
              onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <input style={inputStyle} value={form.location}
              onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="Bangalore, India" />
          </div>
        </div>

        {/* Social Links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '12px' }}>
          <div>
            <label style={labelStyle}>LinkedIn URL</label>
            <input type="url" style={{ ...inputStyle, borderColor: errors.linkedin ? '#EF4444' : undefined }}
              value={form.linkedin} onChange={e => setForm(f => ({...f, linkedin: e.target.value}))}
              placeholder="https://linkedin.com/..." className="neo-input" />
          </div>
          <div>
            <label style={labelStyle}>GitHub URL</label>
            <input type="url" style={{ ...inputStyle, borderColor: errors.github ? '#EF4444' : undefined }}
              value={form.github} onChange={e => setForm(f => ({...f, github: e.target.value}))}
              placeholder="https://github.com/..." className="neo-input" />
          </div>
          <div>
            <label style={labelStyle}>Portfolio URL</label>
            <input type="url" style={{ ...inputStyle, borderColor: errors.portfolio ? '#EF4444' : undefined }}
              value={form.portfolio} onChange={e => setForm(f => ({...f, portfolio: e.target.value}))}
              placeholder="https://yourwebsite.com" className="neo-input" />
          </div>
        </div>
        {(errors.linkedin || errors.github || errors.portfolio) && (
          <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '-12px' }}>Check your URLs (must start with http:// or https://)</p>
        )}

        {/* Skills tag input */}
        <div>
          <label style={labelStyle}>Skills (press Enter or comma to add)</label>
          <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', background: 'rgba(255,255,255,0.04)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', minHeight: '50px' }}>
            {form.skills.map(skill => (
              <span key={skill} style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#93C5FD', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {skill}
                <button type="button" onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', lineHeight: 1, fontSize: '14px' }}>×</button>
              </span>
            ))}
            <input
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder={form.skills.length === 0 ? 'Type a skill and press Enter...' : ''}
              style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '13px', flex: 1, minWidth: '120px' }}
            />
          </div>
        </div>

        {/* Experience & Title */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Years of Experience</label>
            <input type="number" min="0" max="50" style={{ ...inputStyle, borderColor: errors.experience ? '#EF4444' : undefined }}
              value={form.experience} onChange={e => setForm(f => ({...f, experience: e.target.value}))}
              placeholder="e.g. 3" className="neo-input" />
            {errors.experience && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.experience}</p>}
          </div>
          <div>
            <label style={labelStyle}>Current Job Title</label>
            <input style={inputStyle} value={form.currentJobTitle}
              onChange={e => setForm(f => ({...f, currentJobTitle: e.target.value}))} placeholder="e.g. Frontend Engineer" className="neo-input" />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label style={labelStyle}>Bio / Summary</label>
          <textarea
            style={{ ...inputStyle, resize: 'vertical', minHeight: '96px', borderColor: errors.bio ? '#EF4444' : undefined }}
            value={form.bio}
            onChange={e => setForm(f => ({...f, bio: e.target.value}))}
            placeholder="A brief summary of your background and what you're looking for..."
            maxLength={500}
          />
          <p style={{ fontSize: '11px', color: form.bio.length > 450 ? '#F59E0B' : '#6B7280', textAlign: 'right', marginTop: '4px' }}>
            {form.bio.length}/500
          </p>
          {errors.bio && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '2px' }}>{errors.bio}</p>}
        </div>

        <button type="submit" disabled={saving} className="primary-btn"
          style={{ padding: '14px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '15px', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: saving ? 0.6 : 1 }}>
          {saving && <span className="loader" style={{width:'18px',height:'18px',border:'2px solid transparent',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
