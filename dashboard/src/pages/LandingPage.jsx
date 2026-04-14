import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

export default function LandingPage() {
  const [theme, setTheme] = useState('dark');
  const [themeHint, setThemeHint] = useState('Click to Switch Mode');
  const navigate = useNavigate();

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    setThemeHint(newTheme === 'light' ? 'Switched to Light mode' : 'Switched to Dark mode');
    setTimeout(() => setThemeHint('Click to Switch Mode'), 2500);
  };

  return (
    <div className={`landing-wrapper theme-${theme}`}>
      <div className="bg-grid"></div>

      <header className="landing-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="logo cursor-pointer" onClick={toggleTheme} title="Toggle Theme">PRECISELY</div>
          <div style={{ fontFamily: '"Caveat", "Comic Sans MS", cursive', fontSize: '15px', color: 'var(--text-muted)', opacity: 0.8, userSelect: 'none', transform: 'rotate(-2deg)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
              <path d="M9 14l-4-4 4-4"></path>
              <path d="M5 10h11a4 4 0 1 1 0 8h-1"></path>
            </svg>
            {themeHint}
          </div>
        </div>
        <nav className="desktop-nav">
          <span onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</span>
          <span onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</span>
          <span onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}>Reviews</span>
        </nav>
      </header>

      <main className="hero-section">
        <div className="floating-node node-1">
          <div className="node-icon">🧠</div>
          <div className="node-content">
            <p className="node-title">AI Gatekeeper</p>
            <p className="node-subtitle">100% Automated Resume Screening</p>
          </div>
        </div>

        <div className="floating-node node-2">
          <div className="node-icon">🎙️</div>
          <div className="node-content">
            <p className="node-title">Live Evaluator Node</p>
            <p className="node-subtitle">Dynamic Technical Assessments</p>
          </div>
        </div>

        <div className="floating-node node-3">
          <div className="node-icon">⚡</div>
          <div className="node-content">
            <p className="node-title">Evidence Dossiers</p>
            <p className="node-subtitle">Instant Pipeline Sync & Analytics</p>
          </div>
        </div>

        <h1 className="hero-title">
          Find Your <span className="text-highlight">Strategic</span><br/>
          Workforce Partners<br/>
          From Today
        </h1>
        <p className="hero-description">
          Empower your hiring team with data-driven AI protocols to attract,<br/>
          assess, and retain top engineering talent efficiently.
        </p>

        <div className="hero-ctas">
          <button className="landing-btn-primary" onClick={() => navigate('/auth/candidate')}>Currently Open Position</button>
          <button className="landing-btn-secondary" onClick={() => navigate('/auth/hr')}>Login as Recruiter</button>
        </div>
      </main>

      <section id="features" className="landing-features" style={{ position: 'relative', zIndex: 10, padding: '100px 20px', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-head)' }}>
        <h2 style={{ fontSize: '48px', fontWeight: '700', textAlign: 'center', marginBottom: '16px', letterSpacing: '-1px' }}>The Autonomous Flow</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-body)', fontSize: '18px', maxWidth: '600px', margin: '0 auto 60px auto', lineHeight: '1.6' }}>
           Replace legacy hiring lines with three structurally distinct AI nodes designed to vet, interview, and sync high-signal engineers instantly.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            <div className="feature-card" style={{ background: 'var(--bg-panel)', padding: '40px', borderRadius: '16px', border: '1px solid var(--panel-border)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #0073B1, transparent)' }}></div>
              <div style={{ fontSize: '12px', color: '#0073B1', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Node 01</div>
              <div className="feature-icon-badge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(0, 115, 177, 0.1)', color: '#0073B1', marginBottom: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px' }}>The Gatekeeper Matrix</h3>
              <p style={{ color: 'var(--text-body)', lineHeight: '1.7', fontSize: '15px' }}>Candidates securely submit structurally complex resumes. Our engine maps technical vectors heavily against your strict organizational constraints before unlocking entry.</p>
            </div>

            <div className="feature-card" style={{ background: 'var(--bg-panel)', padding: '40px', borderRadius: '16px', border: '1px solid var(--panel-border)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #7C3AED, transparent)' }}></div>
              <div style={{ fontSize: '12px', color: '#7C3AED', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Node 02</div>
              <div className="feature-icon-badge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', marginBottom: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px' }}>Persistent Assessment</h3>
              <p style={{ color: 'var(--text-body)', lineHeight: '1.7', fontSize: '15px' }}>Approved candidates traverse dynamic assessment simulations. The system evaluates logical adaptability over heavy text arrays, rendering a true coachability factor.</p>
            </div>

            <div className="feature-card" style={{ background: 'var(--bg-panel)', padding: '40px', borderRadius: '16px', border: '1px solid var(--panel-border)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #2F855A, transparent)' }}></div>
              <div style={{ fontSize: '12px', color: '#2F855A', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Node 03</div>
              <div className="feature-icon-badge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(47, 133, 90, 0.1)', color: '#2F855A', marginBottom: '24px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px' }}>Evidence Integration</h3>
              <p style={{ color: 'var(--text-body)', lineHeight: '1.7', fontSize: '15px' }}>The framework serializes interaction history into an Evidence Log. It safely synchronizes deterministic verdicts and transcripts directly into the HR network.</p>
            </div>
        </div>
      </section>

      <section className="landing-faqs" style={{ position: 'relative', zIndex: 10, padding: '80px 20px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-head)' }}>
        <h2 style={{ fontSize: '36px', textAlign: 'center', marginBottom: '40px' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--bg-panel)', padding: '24px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
            <h4 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>How does the AI determine a match?</h4>
            <p style={{ color: 'var(--text-body)', fontSize: '15px' }}>The AI matrix checks candidate payloads and history specifically against your established "Must-Have" JSON criteria, disregarding ambiguous formatting.</p>
          </div>
          <div style={{ background: 'var(--bg-panel)', padding: '24px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
            <h4 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>Is the Live Interview mandatory?</h4>
            <p style={{ color: 'var(--text-body)', fontSize: '15px' }}>Yes. Passing the Gatekeeper resume screening is insufficient. All matching candidates traverse the automated technical interview protocol before dossier submission.</p>
          </div>
          <div style={{ background: 'var(--bg-panel)', padding: '24px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
            <h4 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600' }}>Can we rely on the Evidence Log?</h4>
            <p style={{ color: 'var(--text-body)', fontSize: '15px' }}>Absolutely. The Evidence Log cites direct quotes and patterns from the transcript. The evaluation runs statelessly without historical bias.</p>
          </div>
        </div>
      </section>

      <section id="reviews" className="landing-reviews" style={{ position: 'relative', zIndex: 10, padding: '80px 20px', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-head)' }}>
         <h2 style={{ fontSize: '36px', textAlign: 'center', marginBottom: '40px' }}>Ecosystem Feedback</h2>
         <div style={{ background: 'var(--bg-panel)', padding: '60px', borderRadius: '16px', border: '1px solid var(--panel-border)', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.5 }}>📝</div>
            <h3 style={{ fontSize: '20px', color: 'var(--text-head)', fontWeight: '600' }}>No reviews yet.</h3>
            <p style={{ color: 'var(--text-body)', marginTop: '8px', lineHeight: '1.6' }}>Be the first organization to deploy the autonomous pipeline.</p>
         </div>
      </section>

      <Footer />
    </div>
  );
}
