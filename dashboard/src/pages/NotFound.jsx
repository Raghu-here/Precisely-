import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', padding: '24px', textAlign: 'center', animation: 'fadeIn 300ms ease' }}>
      <div style={{ fontSize: '100px', fontWeight: 800, letterSpacing: '-4px', background: 'linear-gradient(135deg, var(--accent-primary), #1D4ED8)', WebkitBackgroundClip: 'text', color: 'transparent', marginBottom: '8px', lineHeight: 1 }}>
        404
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Protocol Terminated</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '400px', lineHeight: 1.6, marginBottom: '32px' }}>
        The requested module could not be located in our systems. It may have been moved, deleted, or you might not have the required clearance level.
      </p>
      <button 
        className="primary-btn" 
        onClick={() => navigate('/')}
        style={{ padding: '14px 32px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Return to Safety
      </button>

      {/* Decorative Grid Lines */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: -1, opacity: 0.05, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    </div>
  );
}
