import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Spinner, StatusBadge } from '../../components/ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─── Voice-mode waveform + mic animations ────────────────────────────────────
const VOICE_STYLES = `
@keyframes micPulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
  70% { transform: scale(1.08); box-shadow: 0 0 0 14px rgba(59,130,246,0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59,130,246,0); }
}
@keyframes bar0 { 0%,100%{height:4px} 50%{height:22px} }
@keyframes bar1 { 0%,100%{height:4px} 50%{height:18px} }
@keyframes bar2 { 0%,100%{height:4px} 50%{height:24px} }
@keyframes bar3 { 0%,100%{height:4px} 50%{height:14px} }
@keyframes bar4 { 0%,100%{height:4px} 50%{height:20px} }
@keyframes bar5 { 0%,100%{height:4px} 50%{height:16px} }
@keyframes bar6 { 0%,100%{height:4px} 50%{height:22px} }
@keyframes bar7 { 0%,100%{height:4px} 50%{height:12px} }
@keyframes bar8 { 0%,100%{height:4px} 50%{height:20px} }
@keyframes bar9 { 0%,100%{height:4px} 50%{height:18px} }
@keyframes bar10 { 0%,100%{height:4px} 50%{height:24px} }
@keyframes bar11 { 0%,100%{height:4px} 50%{height:16px} }
`;

const BAR_DELAYS = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.1];
const BAR_ANIMS = ['bar0','bar1','bar2','bar3','bar4','bar5','bar6','bar7','bar8','bar9','bar10','bar11'];

function Waveform({ active }) {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '28px' }}>
      {BAR_DELAYS.map((delay, i) => (
        <div key={i} style={{
          width: '4px',
          height: '4px',
          borderRadius: '4px',
          background: 'var(--accent-primary)',
          animation: active ? `${BAR_ANIMS[i]} 0.9s ${delay}s ease-in-out infinite` : 'none',
          transition: 'height 0.3s ease',
          alignSelf: 'flex-end',
        }} />
      ))}
    </div>
  );
}

function Modal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'rgba(5,8,17,0.97)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '40px', maxWidth: '420px', width: '90%', animation: 'fadeIn 200ms ease' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '32px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>{cancelLabel}</button>
          <button onClick={onConfirm} className="primary-btn" style={{ padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function AIInterview() {
  const [phase, setPhase] = useState('job-select'); // job-select | prep | active | result
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Feature 2: Session timer + modals
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  // Feature 3: Transcript
  const [transcript, setTranscript] = useState([]);
  const transcriptEndRef = useRef(null);

  // Feature 1: Voice mode
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Idle'); // Idle | Recording… | Processing… | AI Speaking…
  const [voiceError, setVoiceError] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const timerRef = useRef(null);
  const sessionTimerRef = useRef(null);

  // 1. Fetch only jobs the candidate has passed screening for
  useEffect(() => {
    axios.get(`${API_URL}/api/candidates/applications`, { withCredentials: true })
      .then(res => {
        const passedApps = (res.data || []).filter(app => app.match_score >= 70);
        setJobs(passedApps);
      })
      .catch(() => {});
  }, []);

  // Per-question countdown timer
  useEffect(() => {
    if (phase === 'active' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (phase === 'active' && timeLeft === 0) {
      handleNext();
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, phase]);

  // Session elapsed timer
  useEffect(() => {
    if (phase === 'active') {
      sessionTimerRef.current = setInterval(() => setSessionElapsed(s => s + 1), 1000);
    } else {
      clearInterval(sessionTimerRef.current);
    }
    return () => clearInterval(sessionTimerRef.current);
  }, [phase]);

  // Transcript auto-scroll
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollTop = transcriptEndRef.current.scrollHeight;
    }
  }, [transcript]);

  // Add AI question to transcript whenever currentIndex changes in active phase
  useEffect(() => {
    if (phase === 'active' && questions[currentIndex]) {
      const qText = typeof questions[currentIndex] === 'object' ? questions[currentIndex].text : questions[currentIndex];
      setTranscript(prev => {
        // Avoid duplicates
        if (prev.length > 0 && prev[prev.length - 1].speaker === 'AI' && prev[prev.length - 1].text === qText) return prev;
        return [...prev, { speaker: 'AI', text: qText }];
      });
      // TTS: play question aloud if voiceMode
      if (voiceMode) {
        speakQuestion(qText);
      }
    }
  }, [currentIndex, phase]);

  const speakQuestion = async (text) => {
    try {
      setVoiceStatus('AI Speaking…');
      const res = await fetch(`${API_URL}/api/interview/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        setVoiceStatus('Idle');
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setVoiceStatus('Idle');
      };
      await audio.play();
    } catch {
      setVoiceError('Voice unavailable — please type your answer.');
      setVoiceStatus('Idle');
      setVoiceMode(false);
    }
  };

  const handleStartInterview = async () => {
    if (!selectedJob) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/interview/generate-questions`, { jobId: selectedJob }, { withCredentials: true });
      const generated = res.data.questions?.filter(q => q && (q.text || q).toString().trim()) || [];
      if (generated.length === 0) throw new Error('No questions generated');
      setQuestions(generated.slice(0, 5));
      setAnswers(new Array(generated.slice(0, 5).length).fill(''));
      setPhase('prep');
    } catch {
      alert('Failed to generate interview questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmStartInterview = () => {
    setShowStartModal(false);
    setSessionElapsed(0);
    setTranscript([]);
    setCurrentIndex(0);
    setCurrentAnswer('');
    setTimeLeft(60);
    setPhase('active');
  };

  const handleNext = async (overrideAnswer) => {
    const answer = overrideAnswer !== undefined ? overrideAnswer : currentAnswer;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answer;
    setAnswers(newAnswers);

    // Add candidate answer to transcript
    if (answer.trim()) {
      setTranscript(prev => [...prev, { speaker: 'You', text: answer }]);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentAnswer(newAnswers[currentIndex + 1] || '');
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(60);
    } else {
      // Last question: show confirmation modal
      if (!overrideAnswer) {
        setShowEndModal(true);
        return;
      }
      await submitInterview(newAnswers);
    }
  };

  const submitInterview = async (finalAnswers) => {
    setShowEndModal(false);
    setPhase('result');
    setLoading(true);
    try {
      const payload = {
        jobId: selectedJob,
        answers: questions.map((q, i) => ({ question: typeof q === 'object' ? q.text : q, answer: finalAnswers[i] }))
      };
      const res = await axios.post(`${API_URL}/api/interview/evaluate`, payload, { withCredentials: true });
      setResult(res.data);
    } catch {
      alert('Failed to evaluate interview. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  // ── Voice recording ──────────────────────────────────────────────────────────
  const toggleVoiceMode = async () => {
    if (voiceMode) { setVoiceMode(false); setVoiceError(''); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // just a permission check
      setVoiceMode(true);
      setVoiceError('');
    } catch {
      alert('Microphone access denied. Please allow microphone access in your browser settings.');
    }
  };

  const startRecording = async () => {
    if (voiceStatus !== 'Idle') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => e.data.size > 0 && audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setVoiceStatus('Processing…');
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          const fd = new FormData();
          fd.append('audio', blob, 'recording.webm');
          const res = await fetch(`${API_URL}/api/interview/transcribe`, {
            method: 'POST',
            credentials: 'include',
            body: fd
          });
          if (!res.ok) throw new Error('Transcription failed');
          const data = await res.json();
          setCurrentAnswer(data.text || '');
          setVoiceStatus('Idle');
          // Auto-submit
          handleNext(data.text || '');
        } catch {
          setVoiceError('Voice unavailable — please type your answer.');
          setVoiceStatus('Idle');
          setVoiceMode(false);
        }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setVoiceStatus('Recording…');
    } catch {
      setVoiceError('Voice unavailable — please type your answer.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && voiceStatus === 'Recording…') {
      mediaRecorderRef.current.stop();
    }
  };

  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;

  // ── Render: Job Select ──
  if (phase === 'job-select') {
    if (jobs.length === 0) {
      return (
        <div style={{ maxWidth: '640px', margin: '60px auto', animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="candidate-card" style={{ padding: '64px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '32px', backdropFilter: 'blur(30px)', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '24px' }}>🛡️</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '-0.02em' }}>Interview Protocol Locked</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '40px', lineHeight: 1.6 }}>
              The Gatekeeper AI requires an authenticated match score of <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>70+</span> to initiate the directive. <br/>
              Please synchronize your profile with an active requisition first.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: '640px', margin: '60px auto', animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div className="candidate-card" style={{ padding: '54px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '32px', backdropFilter: 'blur(30px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Initialize Assessment</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI-Led Technical Screening</p>
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Target Requisition Module</label>
            <div style={{ position: 'relative' }}>
              <select
                className="neo-input"
                value={selectedJob}
                onChange={e => setSelectedJob(e.target.value)}
                style={{ width: '100%', padding: '18px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '16px', outline: 'none', fontSize: '15px', cursor: 'pointer', appearance: 'none' }}
              >
                <option value="">Select active link...</option>
                {jobs.map(j => {
                  const jobId = j.job_id || j._id;
                  return <option key={jobId} value={jobId}>{j.jobTitle || j.title}</option>;
                })}
              </select>
              <div style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>

          <button
            className="primary-btn"
            style={{ width: '100%', padding: '18px', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', background: 'linear-gradient(135deg, var(--accent-primary), #1D4ED8)', border: 'none', boxShadow: '0 10px 20px -5px rgba(59,130,246,0.4)', transition: 'all 0.3s' }}
            disabled={!selectedJob || loading}
            onClick={handleStartInterview}
          >
            {loading ? <div className="loader" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
            {loading ? 'CALIBRATING AI...' : 'START ASSESSMENT'}
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Prep ──
  if (phase === 'prep') {
    return (
      <>
        {showStartModal && (
          <Modal
            title="Ready to Begin?"
            message="Ensure you are in a quiet environment. The session timer starts immediately."
            confirmLabel="Start Interview"
            cancelLabel="Cancel"
            onConfirm={confirmStartInterview}
            onCancel={() => setShowStartModal(false)}
          />
        )}
        <div style={{ maxWidth: '640px', margin: '60px auto', animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="candidate-card" style={{ padding: '64px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '32px', backdropFilter: 'blur(30px)', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px', animation: 'float 3s infinite ease-in-out' }}>⌛</div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '16px', letterSpacing: '-0.02em' }}>Sub-Routine Calibration</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '48px', lineHeight: 1.8, background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
              The Gatekeeper AI has prepared <span style={{ color: '#fff', fontWeight: 700 }}>{questions.length} specialized probes</span>. <br/>
              Response window: <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>60s per module</span> <br/>
              Density requirement: <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>20+ words</span>
            </div>
            <button className="primary-btn" onClick={() => setShowStartModal(true)} style={{ width: '100%', padding: '18px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--accent-primary), #1D4ED8)', border: 'none', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Begin First Question
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Render: Active Interview ──
  if (phase === 'active') {
    const isCriticalTime = timeLeft <= 10;
    const isWaveformActive = voiceStatus === 'Recording…' || voiceStatus === 'AI Speaking…';

    return (
      <>
        <style>{VOICE_STYLES}</style>
        {showEndModal && (
          <Modal
            title="Submit Evaluation?"
            message="Are you sure you want to submit? This cannot be undone."
            confirmLabel="Submit"
            cancelLabel="Go Back"
            onConfirm={() => {
              const finalAnswers = [...answers];
              finalAnswers[currentIndex] = currentAnswer;
              submitInterview(finalAnswers);
            }}
            onCancel={() => setShowEndModal(false)}
          />
        )}

        <div style={{ maxWidth: '1160px', margin: '20px auto', animation: 'fadeIn 0.5s ease-out', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
          {/* ── Main Interview Column ── */}
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', padding: '0 4px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>Active Transmission</div>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Module {currentIndex + 1} <span style={{ color: 'rgba(255,255,255,0.2)' }}>/ {questions.length}</span></h2>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* Session timer */}
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '6px 14px', color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  Session: {formatTime(sessionElapsed)}
                </div>
                {/* Per-question countdown */}
                <div style={{ background: isCriticalTime ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isCriticalTime ? 'rgba(239,68,68,0.3)' : 'var(--glass-border)'}`, borderRadius: '16px', padding: '10px 20px', color: isCriticalTime ? '#F87171' : '#fff', fontWeight: 800, transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px', animation: isCriticalTime ? 'pulse 1s infinite' : 'none' }}>{timeLeft}s</span>
                  <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Left</span>
                </div>
                {/* Voice mode toggle */}
                <button
                  onClick={toggleVoiceMode}
                  style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                >
                  {voiceMode ? '⌨ Text Mode' : '🎤 Voice Mode'}
                </button>
              </div>
            </div>

            {/* Question card */}
            <div className="candidate-card" style={{ padding: '48px', marginBottom: '24px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '32px', backdropFilter: 'blur(40px)', borderLeft: '4px solid var(--accent-primary)' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 600, lineHeight: 1.6, color: '#fff', letterSpacing: '-0.01em' }}>
                {typeof questions[currentIndex] === 'object' ? questions[currentIndex].text : questions[currentIndex]}
              </h2>
            </div>

            {/* Voice error */}
            {voiceError && (
              <div style={{ color: 'var(--danger)', fontSize: '12px', marginBottom: '12px', paddingLeft: '4px' }}>{voiceError}</div>
            )}

            {/* Text mode OR Voice mode UI */}
            {!voiceMode ? (
              <div style={{ position: 'relative' }}>
                <textarea
                  className="neo-input"
                  style={{ width: '100%', minHeight: '280px', padding: '32px', fontSize: '16px', lineHeight: 1.7, background: 'rgba(5, 6, 8, 0.6)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '24px', outline: 'none', resize: 'none', backdropFilter: 'blur(20px)', transition: 'all 0.3s' }}
                  placeholder="Type your strategic response here..."
                  value={currentAnswer}
                  onChange={e => setCurrentAnswer(e.target.value)}
                  disabled={timeLeft === 0}
                  autoFocus
                  onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 24px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  <div style={{ color: wordCount < 20 ? '#64748B' : 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: wordCount < 20 ? '#475569' : 'var(--success)' }} />
                    Density: {wordCount} / 20 words
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.2)' }}>Continuous Sync Active</div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="primary-btn"
                    onClick={() => handleNext()}
                    disabled={wordCount < 20 && timeLeft > 0}
                    style={{ padding: '16px 44px', borderRadius: '16px', opacity: (wordCount < 20 && timeLeft > 0) ? 0.4 : 1, transition: 'all 0.4s', fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'var(--accent-primary)', border: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}
                  >
                    {currentIndex === questions.length - 1 ? 'Submit Evaluation' : 'Next Transmission'}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            ) : (
              /* ── Voice Mode Panel ── */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: '24px', background: 'rgba(5,6,8,0.5)', border: '1px solid var(--glass-border)', borderRadius: '24px', backdropFilter: 'blur(20px)' }}>
                {/* Microphone button */}
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={voiceStatus === 'Processing…' || voiceStatus === 'AI Speaking…'}
                  style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: voiceStatus === 'Recording…' ? 'rgba(239,68,68,0.15)' : 'rgba(96,165,250,0.1)',
                    border: `2px solid ${voiceStatus === 'Recording…' ? 'var(--danger)' : 'var(--accent-primary)'}`,
                    cursor: voiceStatus === 'Idle' ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    animation: voiceStatus === 'Recording…' ? 'micPulse 1.2s ease-in-out infinite' : 'none',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={voiceStatus === 'Recording…' ? 'var(--danger)' : 'var(--accent-primary)'} strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </button>

                {/* Waveform */}
                <Waveform active={isWaveformActive} />

                {/* Status label */}
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{voiceStatus}</div>

                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                  {voiceStatus === 'Idle' ? 'Hold mic button to record — release to submit' : voiceStatus === 'Recording…' ? 'Recording… Release to submit your answer' : voiceStatus === 'Processing…' ? 'Transcribing your answer…' : 'AI is speaking the next question…'}
                </div>
              </div>
            )}
          </div>

          {/* ── Transcript Side Panel ── */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', position: 'sticky', top: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Session Transcript</div>
            <div ref={transcriptEndRef} style={{ overflowY: 'auto', maxHeight: '500px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {transcript.length === 0 && (
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '20px 0' }}>No entries yet…</div>
              )}
              {transcript.map((entry, i) => (
                <div key={i}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: entry.speaker === 'AI' ? 'var(--accent-primary)' : '#34D399', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{entry.speaker}</div>
                  <div style={{ fontSize: '13px', color: '#fff', lineHeight: 1.5 }}>{entry.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hide transcript panel on narrow screens */}
        <style>{`
          @media (max-width: 900px) {
            .ai-interview-grid { grid-template-columns: 1fr !important; }
            .ai-interview-grid > div:last-child { display: none !important; }
          }
        `}</style>
      </>
    );
  }

  // ── Render: Results ──
  if (phase === 'result') {
    if (loading || !result) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '32px' }}>
          <div className="loader" style={{ width: '64px', height: '64px', border: '4px solid rgba(59,130,246,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1.5s linear infinite' }} />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>SYNCHRONIZING ANALYSIS</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>Gatekeeper AI is extracting technical resonance patterns...</p>
          </div>
        </div>
      );
    }

    const { sentiment_analysis, technical_skills, ai_recommendation, decision_reasoning } = result;
    const avgScore = technical_skills?.length
      ? Math.round(technical_skills.reduce((sum, ts) => sum + (ts.rating || 0), 0) / technical_skills.length * 10)
      : 0;
    const match_score = result.match_score || avgScore;
    const isPass = ai_recommendation === 'Highly Recommend' || ai_recommendation === 'Consider';

    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.8s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>Directive Concluded</div>
          <h1 style={{ fontSize: '40px', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>Evaluation Dossier</h1>
        </div>

        <div className="candidate-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0px', padding: '0px', marginBottom: '32px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '32px', overflow: 'hidden', backdropFilter: 'blur(30px)' }}>
          <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid var(--glass-border)' }}>
            <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="16" fill="none" stroke={isPass ? 'var(--success)' : 'var(--danger)'} strokeWidth="2.5" strokeDasharray={`${match_score}, 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 2s cubic-bezier(0.16, 1, 0.3, 1)' }} />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{match_score}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Score</div>
              </div>
            </div>
            <StatusBadge status={isPass ? 'Shortlisted' : 'Rejected'} />
          </div>

          <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '-0.02em' }}>{isPass ? 'Technical Alignment Confirmed' : 'Alignment Variance Detected'}</h3>
              <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
                {isPass
                  ? 'Your responses exhibit a high degree of technical resonance with the requisition core goals. The Gatekeeper AI recommends immediate progression.'
                  : 'Variance detected in technical depth requirements. Your profile has been archived for future requisition cycles.'}
              </p>
            </div>
            <div style={{ background: 'rgba(59,130,246,0.03)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(59,130,246,0.1)' }}>
              <div style={{ fontSize: '10px', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800, marginBottom: '8px' }}>Intelligence Sentiment</div>
              <div style={{ fontSize: '14px', color: '#fff', fontWeight: 600, lineHeight: 1.5 }}>{sentiment_analysis || 'Confidence and technical precision noted.'}</div>
            </div>
          </div>
        </div>

        {technical_skills && technical_skills.length > 0 && (
          <div className="candidate-card" style={{ padding: '48px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '32px', backdropFilter: 'blur(30px)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '32px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Competency Matrix</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 48px' }}>
              {technical_skills.map((ts, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px', fontWeight: 700 }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{ts.skill}</span>
                    <span style={{ color: ts.rating >= 7 ? 'var(--success)' : 'var(--danger)' }}>{ts.rating}/10</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${ts.rating * 10}%`, background: ts.rating >= 7 ? 'var(--success)' : 'var(--danger)', borderRadius: '3px', transition: 'width 1.5s ease-out' }} />
                  </div>
                </div>
              ))}
            </div>
            {decision_reasoning && (
              <div style={{ marginTop: '48px', padding: '32px', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800, marginBottom: '12px' }}>Directive Logic</div>
                <p style={{ fontSize: '15px', color: '#CBD5E1', lineHeight: 1.7, margin: 0 }}>{decision_reasoning}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
