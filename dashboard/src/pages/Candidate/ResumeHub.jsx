import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../../components/ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ResumeHub() {
  const { showToast, ToastContainer } = useToast();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/candidates/resume`)
      .then(res => setResume(res.data))
      .catch(() => {}) // 404 normal if no resume
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      showToast('Invalid format. Please upload PDF or DOCX.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('File too large. Maximum size is 5MB.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await axios.post(`${API_URL}/api/candidates/resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      setUploadProgress(100);
      
      setTimeout(() => {
        setResume(res.data.resume);
        showToast('Resume linked to your candidate profile successfully.', 'success');
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      setIsUploading(false);
      setUploadProgress(0);
      showToast(err.response?.data?.error || 'Failed to upload resume', 'error');
    }
  };

  const onDragOver = e => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = e => { e.preventDefault(); setIsDragging(false); };
  const onDrop = e => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files[0]); };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
      <span className="loader" style={{ width: '28px', height: '28px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ maxWidth: '640px', animation: 'fadeIn 300ms ease' }}>
      <ToastContainer />
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Resume Hub</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>Upload your master resume. This will be automatically evaluated by the Gatekeeper AI for future applications.</p>

      {/* Upload Zone */}
      <div 
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-color)'}`,
          background: isDragging ? 'rgba(0,115,177,0.04)' : 'var(--bg-card)',
          borderRadius: '8px', padding: '56px 32px', textAlign: 'center', cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s', marginBottom: '32px', position: 'relative', overflow: 'hidden'
        }}
      >
        <input 
          type="file" ref={fileInputRef} style={{ display: 'none' }} 
          accept="application/pdf,.doc,.docx"
          onChange={e => handleUpload(e.target.files[0])}
        />
        
        {isUploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <span className="loader" style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ color: '#fff', fontWeight: 600 }}>Analyzing Document...</div>
            
            {/* Progress Bar */}
            <div style={{ width: '60%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
            </div>
            
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Extracting core technical skills</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.8 }}>📄</div>
            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              {isDragging ? 'Drop resume here' : 'Click or drag resume to upload'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Supported formats: PDF, DOCX (Max 5MB)</p>
          </>
        )}
      </div>

      {resume && (
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Active Document</h3>
          <div className="candidate-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'rgba(0,115,177,0.1)', border: '1px solid rgba(0,115,177,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{resume.filename || 'Resume.pdf'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Uploaded on {new Date(resume.uploadedAt).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}
                  {resume.size && ` · ${(resume.size / 1024 / 1024).toFixed(2)} MB`}
                </div>
              </div>
            </div>
            {resume.url && (
              <a href={resume.url} download={resume.filename || 'Resume.pdf'} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '12px', fontWeight: 500 }}>
                Download
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
