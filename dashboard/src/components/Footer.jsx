import React from 'react';

const Footer = () => {
    return (
        <footer style={{ padding: '60px 20px', background: 'var(--bg-dark)', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
                
                {/* Brand Column */}
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '16px', letterSpacing: '1px' }}>Precisely.</h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
                        The Future of Automated Recruitment. Calibrating human potential with Gemini 2.0-Flash AI.
                    </p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <a href="https://www.linkedin.com/in/raghuraj-singh-rathore/" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                        </a>
                        <a href="https://github.com/Raghu-here" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                        </a>
                    </div>
                </div>

                {/* Contact Column */}
                <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Inquiries</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <a href="mailto:raghurajsingh15007@gmail.com" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            raghurajsingh15007@gmail.com
                        </a>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            +91 9817679706
                        </div>
                    </div>
                </div>

                {/* Platform Column */}
                <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Platform</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)', cursor: 'default' }}>Privacy Policy</span>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)', cursor: 'default' }}>Terms of Service</span>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)', cursor: 'default' }}>Industry Compliance</span>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '40px auto 0', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} Precisely. All rights reserved.</p>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', display: 'flex', gap: '20px' }}>
                    <span>Candidate Portal</span>
                    <span>HR Terminal</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
