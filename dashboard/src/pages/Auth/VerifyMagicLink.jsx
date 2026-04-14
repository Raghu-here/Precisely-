import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function VerifyMagicLink() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMsg('No token found in URL. Please request a new magic link.');
      return;
    }

    axios.post(`${API_URL}/api/auth/verify-magic-link`, { token }, { withCredentials: true })
      .then(res => {
        setStatus('success');
        const role = res.data.role;
        setTimeout(() => {
          navigate(role === 'HR' ? '/hr/dashboard' : '/candidate/dashboard');
        }, 1500);
      })
      .catch(err => {
        setStatus('error');
        setErrorMsg(err.response?.data?.error || 'Verification failed. Please request a new magic link.');
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '48px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '24px', backdropFilter: 'blur(30px)' }}>

        {status === 'verifying' && (
          <>
            <div style={{ width: '48px', height: '48px', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Verifying your link...</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Hang tight, we're logging you in.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: '#10B981' }}>Access Granted!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Redirecting you to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: '#EF4444' }}>Link Invalid</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>{errorMsg}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => navigate('/auth/candidate')} style={{ padding: '12px 20px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '10px', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
                Candidate Login
              </button>
              <button onClick={() => navigate('/auth/hr')} style={{ padding: '12px 20px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: '10px', color: 'var(--accent-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
                HR Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
