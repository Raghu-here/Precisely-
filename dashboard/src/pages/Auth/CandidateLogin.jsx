import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowLeft, ChevronRight, User, ShieldCheck } from "lucide-react";
import axios from "axios";
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup } from 'firebase/auth';
import Footer from "../../components/Footer";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 1) return { label: "Weak", color: "#EF4444", width: "25%" };
  if (score === 2) return { label: "Fair", color: "#F59E0B", width: "50%" };
  if (score === 3) return { label: "Good", color: "#3B82F6", width: "75%" };
  return { label: "Strong", color: "#10B981", width: "100%" };
}

export default function CandidateLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [googleLoading, setGoogleLoading] = useState(false);

  const strength = getPasswordStrength(formData.password);

  React.useEffect(() => {
    if (timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timeLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === 'register') {
      if (!/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/.test(formData.password)) {
        setError("Password must be 8+ chars with 1 uppercase, 1 number, and 1 special character.");
        return;
      }
      if (!otpSent) {
        setLoading(true);
        try {
          await axios.post(`${API_URL}/api/auth/send-otp`, { email: formData.email });
          setOtpSent(true);
          setTimeLeft(600);
        } catch (err) {
          setError(err.response?.data?.error || "Failed to send OTP.");
        }
        setLoading(false);
        return;
      }
      if (otpSent && !otpVerified) {
        setLoading(true);
        try {
          await axios.post(`${API_URL}/api/auth/verify-otp`, { email: formData.email, otp: otpInput });
          setOtpVerified(true);
          await registerUser();
        } catch (err) {
          setError(err.response?.data?.error || "Invalid OTP.");
          setLoading(false);
        }
        return;
      }
    }
    await registerUser();
  };

  const registerUser = async () => {
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = { email: formData.email, password: formData.password, role: "Candidate" };
      await axios.post(`${API_URL}${endpoint}`, payload);
      navigate("/candidate/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      await axios.post(`${API_URL}/api/auth/google-firebase`,
        { idToken, role: 'Candidate' },
        { withCredentials: true }
      );
      navigate('/candidate/dashboard');
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: '#fff', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      
      {/* Premium Animated Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', filter: 'blur(100px)', animation: 'float 20s infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', filter: 'blur(100px)', animation: 'float 25s infinite alternate-reverse' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.4 }} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 20px', position: 'relative', zIndex: 10 }}>
        
        <motion.button 
          whileHover={{ x: -5 }}
          onClick={() => navigate("/")} 
          style={{ position: 'absolute', top: '40px', left: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '10px 18px', borderRadius: '12px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', backdropFilter: 'blur(10px)', transition: 'all 0.3s' }}
        >
          <ArrowLeft size={16} />
          Back to Terminal
        </motion.button>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ width: '100%', maxWidth: '440px', padding: '48px', background: 'var(--bg-card)', backdropFilter: 'blur(30px)', border: '1px solid var(--glass-border)', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
        >
          <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.05))', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--accent-primary)', boxShadow: '0 8px 32px rgba(59,130,246,0.2)' }}>
              <User size={32} />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: '8px', background: 'linear-gradient(to bottom, #fff, #94A3B8)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Candidate Hub</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{mode === 'login' ? 'Access your career mission control' : 'Initialize your professional profile'}</p>
          </motion.div>

          <motion.div variants={itemVariants} style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '16px', padding: '6px', marginBottom: '32px', border: '1px solid var(--glass-border)' }}>
            {['login', 'register'].map((m) => (
              <button key={m} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', background: mode === m ? 'rgba(255,255,255,0.08)' : 'transparent', color: mode === m ? '#fff' : 'var(--text-muted)', boxShadow: mode === m ? '0 4px 12px rgba(0,0,0,0.2)' : 'none' }} onClick={() => { setMode(m); setError(''); }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', padding: '14px 18px', borderRadius: '12px', fontSize: '13px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <ShieldCheck size={18} /> <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Google Sign-In Button */}
            <motion.button
              variants={itemVariants}
              whileHover={{ filter: 'brightness(1.1)', boxShadow: '0 4px 20px rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={googleLoading}
              onClick={handleGoogleLogin}
              style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', fontSize: '15px', fontWeight: 500, cursor: googleLoading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', transition: 'all 0.3s', opacity: googleLoading ? 0.6 : 1 }}
            >
              {googleLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              )}
              Continue with Google
            </motion.button>

            <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', margin: '4px 0 -8px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              <span style={{ margin: '0 12px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 500, marginLeft: '4px' }}>Corporate Identifier</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" required style={{ width: '100%', padding: '16px 16px 16px 48px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '14px', color: '#fff', fontSize: '15px', outline: 'none', transition: 'all 0.3s' }}
                  placeholder="name@nexus.com" value={formData.email} onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(0,0,0,0.4)'; }} onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'rgba(0,0,0,0.3)'; }} />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 500, marginLeft: '4px' }}>Access Protocol</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="password" required style={{ width: '100%', padding: '16px 16px 16px 48px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '14px', color: '#fff', fontSize: '15px', outline: 'none', transition: 'all 0.3s' }}
                  placeholder="••••••••" value={formData.password} onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(0,0,0,0.4)'; }} onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'rgba(0,0,0,0.3)'; }} />
              </div>
              
              {mode === 'register' && formData.password && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '14px', padding: '0 4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Strength</span>
                    <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: strength.width }} style={{ height: '100%', background: strength.color, transition: 'all 0.5s ease' }} />
                  </div>
                </motion.div>
              )}
            </motion.div>
            
            {mode === 'register' && otpSent && !otpVerified && (
              <motion.div variants={itemVariants} initial="hidden" animate="visible" style={{ marginTop: '0px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 500, marginLeft: '4px' }}>Authorization Code (OTP)</label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" required style={{ width: '100%', padding: '16px 16px 16px 48px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '14px', color: '#fff', fontSize: '15px', outline: 'none', transition: 'all 0.3s' }}
                    placeholder="123456" value={otpInput} onChange={(e) => setOtpInput(e.target.value)}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(0,0,0,0.4)'; }} onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'rgba(0,0,0,0.3)'; }} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
                  Resend in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              </motion.div>
            )}
            
            <motion.button 
              variants={itemVariants}
              whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(59,130,246,0.4)' }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading} 
              style={{ width: '100%', padding: '16px', marginTop: '12px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
            >
              {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> : <ChevronRight size={20} />}
              {loading ? 'Processing...' : mode === 'login' ? 'Initialize Access' : (otpSent && !otpVerified) ? 'Verify OTP' : !otpSent ? 'Send OTP' : 'Establish Profile'}
            </motion.button>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
