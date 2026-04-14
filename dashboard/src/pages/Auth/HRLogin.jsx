import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Shield, ArrowLeft, ChevronRight, Briefcase, Lock } from "lucide-react";
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
  if (score <= 1) return { label: "Standard", color: "#EF4444", width: "25%" };
  if (score === 2) return { label: "Secure", color: "#F59E0B", width: "50%" };
  if (score === 3) return { label: "Elevated", color: "#8B5CF6", width: "75%" };
  return { label: "Encrypted", color: "#10B981", width: "100%" };
}

export default function HRLogin() {
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
        setError("Compliance failure: Password must meet enterprise security standards.");
        return;
      }
      if (!otpSent) {
        setLoading(true);
        try {
          await axios.post(`${API_URL}/api/auth/send-otp`, { email: formData.email });
          setOtpSent(true);
          setTimeLeft(600);
        } catch (err) {
          setError(err.response?.data?.error || "Failed to send authorization code.");
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
          setError(err.response?.data?.error || "Invalid authorization code.");
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
      const payload = { email: formData.email, password: formData.password, role: "HR" };
      await axios.post(`${API_URL}${endpoint}`, payload);
      navigate("/hr/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Authorization failed. Verify corporate credentials.");
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
        { idToken, role: 'HR' },
        { withCredentials: true }
      );
      navigate('/hr/dashboard');
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: '#fff', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      
      {/* Recruiter Terminal Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', right: '-5%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', filter: 'blur(120px)', animation: 'float 22s infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: '0%', left: '-10%', width: '45vw', height: '45vw', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', filter: 'blur(100px)', animation: 'float 18s infinite alternate-reverse' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.3 }} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 20px', position: 'relative', zIndex: 10 }}>
        
        <motion.button 
          whileHover={{ x: -5, background: 'rgba(255,255,255,0.06)' }}
          onClick={() => navigate("/")} 
          style={{ position: 'absolute', top: '40px', left: '40px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '10px 18px', borderRadius: '14px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', backdropFilter: 'blur(12px)', transition: 'all 0.3s', fontWeight: 500 }}
        >
          <ArrowLeft size={16} />
          Nexus Exit
        </motion.button>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ width: '100%', maxWidth: '460px', padding: '54px', background: 'rgba(10, 11, 14, 0.7)', backdropFilter: 'blur(40px)', border: '1px solid var(--glass-border)', borderRadius: '24px', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6)', borderTop: '1px solid rgba(255,255,255,0.12)' }}
        >
          <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(124,58,237,0.05))', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--accent-secondary)', boxShadow: '0 0 30px rgba(139,92,246,0.15)', transform: 'rotate(5deg)' }}>
              <Briefcase size={28} />
            </div>
            <h2 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '10px', background: 'linear-gradient(to right, #fff, #A78BFA)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Recruiter Terminal</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', letterSpacing: '0.01em' }}>{mode === 'login' ? 'Authenticate authority credentials' : 'Establish new administrative node'}</p>
          </motion.div>

          <motion.div variants={itemVariants} style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderRadius: '14px', padding: '5px', marginBottom: '36px', border: '1px solid rgba(255,255,255,0.06)' }}>
            {['login', 'register'].map((m) => (
              <button key={m} style={{ flex: 1, padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.4s ease', background: mode === m ? 'var(--accent-secondary)' : 'transparent', color: mode === m ? '#fff' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => { setMode(m); setError(''); }}>
                {m === 'login' ? 'Command access' : 'Join Nexus'}
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', padding: '14px 18px', borderRadius: '12px', fontSize: '13px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Shield size={18} /> <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            {/* Google Sign-In Button */}
            <motion.button
              variants={itemVariants}
              whileHover={{ filter: 'brightness(1.1)', boxShadow: '0 4px 20px rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={googleLoading}
              onClick={handleGoogleLogin}
              style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: googleLoading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', transition: 'all 0.3s', opacity: googleLoading ? 0.6 : 1 }}
            >
              {googleLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              )}
              Continue with Google
            </motion.button>

            <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', margin: '0px 0 -10px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
              <span style={{ margin: '0 12px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: '2px' }}>Corporate Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
                <input type="email" required style={{ width: '100%', padding: '16px 16px 16px 52px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none', transition: 'all 0.3s' }}
                  placeholder="hr@nexus.ai" value={formData.email} onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent-secondary)'; e.target.style.boxShadow = '0 0 15px rgba(139,92,246,0.1)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: '2px' }}>Access Cipher</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
                <input type="password" required style={{ width: '100%', padding: '16px 16px 16px 52px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none', transition: 'all 0.3s' }}
                  placeholder="••••••••" value={formData.password} onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent-secondary)'; e.target.style.boxShadow = '0 0 15px rgba(139,92,246,0.1)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
              </div>
              
              {mode === 'register' && formData.password && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 700 }}>
                    <span>Encryption Level</span>
                    <span style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: strength.width }} style={{ height: '100%', background: strength.color, transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                  </div>
                </motion.div>
              )}
            </motion.div>
            
            {mode === 'register' && otpSent && !otpVerified && (
              <motion.div variants={itemVariants} initial="hidden" animate="visible" style={{ marginTop: '0px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: '2px' }}>Authorization Code (OTP)</label>
                <div style={{ position: 'relative' }}>
                  <Shield size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
                  <input type="text" required style={{ width: '100%', padding: '16px 16px 16px 52px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none', transition: 'all 0.3s' }}
                    placeholder="123456" value={otpInput} onChange={(e) => setOtpInput(e.target.value)}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent-secondary)'; e.target.style.boxShadow = '0 0 15px rgba(139,92,246,0.1)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'right', fontWeight: 600 }}>
                  Resend in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              </motion.div>
            )}
            
            <motion.button 
              variants={itemVariants}
              whileHover={{ scale: 1.01, background: 'var(--accent-secondary)' }}
              whileTap={{ scale: 0.99 }}
              type="submit" 
              disabled={loading} 
              style={{ width: '100%', padding: '16px', marginTop: '10px', background: 'var(--accent-secondary)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            >
              {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> : <ChevronRight size={18} />}
              {loading ? 'Decrypting...' : mode === 'login' ? 'Initialize Interface' : (otpSent && !otpVerified) ? 'Verify Protocol' : !otpSent ? 'Send Auth Code' : 'Authorize Node'}
            </motion.button>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
