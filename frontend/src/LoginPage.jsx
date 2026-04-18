import { useRef, useState } from 'react';
import {
  Mail, Lock, Eye, EyeOff, Building2, Calendar,
  AlertTriangle, ShieldCheck, User, Shield,
  CheckCircle, ArrowLeft, RefreshCw
} from 'lucide-react';
import { sendOtp, verifyOtp } from './api';

/* ── Step indicator ─────────────────────────────────────────── */
function StepBar({ step }) {
  const steps = ['Details', 'Verify Email', 'Done'];
  return (
    <div className="reg-steps">
      {steps.map((label, i) => (
        <div key={label} className={`reg-step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
          <div className="reg-step-circle">
            {i < step ? <CheckCircle size={14} /> : i + 1}
          </div>
          <span>{label}</span>
          {i < steps.length - 1 && <div className="reg-step-line" />}
        </div>
      ))}
    </div>
  );
}

/* ── 4-box OTP input ────────────────────────────────────────── */
function OtpBoxes({ value, onChange }) {
  const refs = [useRef(), useRef(), useRef(), useRef()];
  const digits = (value + '    ').slice(0, 4).split('');

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = value.slice(0, i) + value.slice(i + 1);
      onChange(next);
      if (i > 0) refs[i - 1].current.focus();
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const next = (value.slice(0, i) + e.key + value.slice(i + 1)).slice(0, 4);
    onChange(next);
    if (i < 3) refs[i + 1].current.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    onChange(pasted);
    refs[Math.min(pasted.length, 3)].current?.focus();
    e.preventDefault();
  };

  return (
    <div className="otp-boxes">
      {[0, 1, 2, 3].map(i => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i].trim()}
          className={`otp-box ${digits[i].trim() ? 'filled' : ''}`}
          onChange={() => {}}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function LoginPage({
  mode, setMode,
  loginForm, setLoginForm, onLogin,
  registerForm, setRegisterForm, onRegister,
  loading, onForgotPassword,
  ROLES = ['STUDENT', 'USER', 'TECHNICIAN', 'ADMIN']
}) {
  const [showPw, setShowPw]     = useState(false);
  const [panelRight, setPanelRight] = useState(true);

  // OTP state
  const [regStep, setRegStep]       = useState(0); // 0=form 1=otp 2=done
  const [otp, setOtp]               = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError]     = useState('');
  const [countdown, setCountdown]   = useState(0);
  const timerRef = useRef(null);

  const switchMode = (next) => {
    if (next === mode) return;
    setPanelRight(next === 'login');
    setRegStep(0); setOtp(''); setOtpError('');
    setMode(next);
  };

  const googleLogin = () => {
    window.location.href = `http://${window.location.hostname || 'localhost'}:8082/oauth2/authorization/google`;
  };

  const startCountdown = () => {
    setCountdown(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(timerRef.current); return 0; } return c - 1; });
    }, 1000);
  };

  /* Step 0 → 1: send OTP */
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!registerForm.email) return;
    setOtpLoading(true); setOtpError('');
    try {
      await sendOtp(registerForm.email);
      setRegStep(1);
      setOtp('');
      startCountdown();
    } catch (err) {
      setOtpError(err.message);
    } finally { setOtpLoading(false); }
  };

  /* Step 1: verify OTP */
  const handleVerifyOtp = async () => {
    if (otp.length !== 4) return;
    setOtpLoading(true); setOtpError('');
    try {
      await verifyOtp(registerForm.email, otp);
      setRegStep(2);
    } catch (err) {
      setOtpError(err.message);
      setOtp('');
    } finally { setOtpLoading(false); }
  };

  /* Step 2: final register */
  const handleRegister = async (e) => {
    e.preventDefault();
    await onRegister(e);
  };

  return (
    <div className="login-container">
      {/* Hero */}
      <div className="login-hero">
        <div className="float-shape shape-1"/>
        <div className="float-shape shape-2"/>
        <div className="float-shape shape-3"/>
        <div className="hero-content">
          <h2 className="brand-title">CampusX</h2>
          <h1 className="hero-heading">Welcome to<br/>CampusX</h1>
          <p className="hero-description">
            Manage facilities, bookings, incidents, notifications, and role-based operations — all in one platform.
          </p>
          <div className="feature-list">
            {[
              [<Building2 size={22}/>, 'Facilities Management'],
              [<Calendar size={22}/>, 'Smart Bookings'],
              [<AlertTriangle size={22}/>, 'Incident Tracking'],
              [<ShieldCheck size={22}/>, 'Role-Based Security'],
            ].map(([icon, label]) => (
              <div className="feature-item" key={label}>
                <div className="feature-icon">{icon}</div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sliding panel */}
      <div className={`login-sidebar ${panelRight ? 'pos-right' : 'pos-left'}`}>
        <div className="login-card">

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <>
              <div className="card-header">
                <h2>Welcome Back 👋</h2>
                <p>Sign in to continue</p>
              </div>
              <button type="button" className="google-btn" onClick={googleLogin}>
                <GoogleIcon/> Continue with Google
              </button>
              <div className="divider"><span>OR</span></div>
              <form onSubmit={onLogin} className="login-form">
                <div className="input-with-icon">
                  <Mail className="input-icon" size={20}/>
                  <input type="email" placeholder="Email" value={loginForm.email}
                    onChange={e => setLoginForm({...loginForm, email: e.target.value})} required/>
                </div>
                <div className="input-with-icon">
                  <Lock className="input-icon" size={20}/>
                  <input type={showPw ? 'text' : 'password'} placeholder="Password"
                    value={loginForm.password}
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})} required/>
                  <button type="button" className="icon-btn" onClick={() => setShowPw(p => !p)}>
                    {showPw ? <EyeOff size={20}/> : <Eye size={20}/>}
                  </button>
                </div>
                <div className="form-options">
                  <button type="button" className="text-link" onClick={onForgotPassword}>
                    Forgot Password?
                  </button>
                </div>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
              <div className="auth-footer">
                <p>No account?{' '}
                  <button type="button" className="text-link bold" onClick={() => switchMode('register')}>
                    Register
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ── REGISTER ── */}
          {mode === 'register' && (
            <>
              <div className="card-header">
                <h2>Join CampusX 🚀</h2>
                <p>Create your account</p>
              </div>

              <StepBar step={regStep} />

              {/* Step 0 — fill details */}
              {regStep === 0 && (
                <>
                  <button type="button" className="google-btn" onClick={googleLogin}>
                    <GoogleIcon/> Continue with Google
                  </button>
                  <div className="divider"><span>OR</span></div>
                  <form onSubmit={handleSendOtp} className="login-form">
                    <div className="input-with-icon">
                      <User className="input-icon" size={20}/>
                      <input type="text" placeholder="Full name" value={registerForm.fullName}
                        onChange={e => setRegisterForm({...registerForm, fullName: e.target.value})} required/>
                    </div>
                    <div className="input-with-icon">
                      <Mail className="input-icon" size={20}/>
                      <input type="email" placeholder="Email address" value={registerForm.email}
                        onChange={e => setRegisterForm({...registerForm, email: e.target.value})} required/>
                    </div>
                    <div className="input-with-icon">
                      <Lock className="input-icon" size={20}/>
                      <input type={showPw ? 'text' : 'password'} placeholder="Password (min 6 chars)"
                        value={registerForm.password}
                        onChange={e => setRegisterForm({...registerForm, password: e.target.value})}
                        minLength={6} required/>
                      <button type="button" className="icon-btn" onClick={() => setShowPw(p => !p)}>
                        {showPw ? <EyeOff size={20}/> : <Eye size={20}/>}
                      </button>
                    </div>
                    <div className="input-with-icon">
                      <Shield className="input-icon" size={20}/>
                      <select value={registerForm.role}
                        onChange={e => setRegisterForm({...registerForm, role: e.target.value})} required>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    {otpError && <div className="otp-error">{otpError}</div>}
                    <button type="submit" className="primary-btn" disabled={otpLoading}>
                      {otpLoading
                        ? <span className="btn-spinner"><RefreshCw size={16}/>Sending OTP…</span>
                        : 'Continue — Verify Email'}
                    </button>
                  </form>
                </>
              )}

              {/* Step 1 — enter OTP */}
              {regStep === 1 && (
                <div className="otp-panel">
                  <div className="otp-icon-wrap">
                    <Mail size={32} />
                  </div>
                  <h3 className="otp-title">Check your inbox</h3>
                  <p className="otp-subtitle">
                    We sent a 4-digit code to<br/>
                    <strong>{registerForm.email}</strong>
                  </p>

                  <OtpBoxes value={otp} onChange={setOtp} />

                  {otpError && <div className="otp-error">{otpError}</div>}

                  <button
                    type="button"
                    className="primary-btn"
                    style={{ marginTop: '20px' }}
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 4 || otpLoading}
                  >
                    {otpLoading
                      ? <span className="btn-spinner"><RefreshCw size={16}/>Verifying…</span>
                      : 'Verify Code'}
                  </button>

                  <div className="otp-resend">
                    {countdown > 0
                      ? <span>Resend in <strong>{countdown}s</strong></span>
                      : <button type="button" className="text-link" onClick={handleSendOtp} disabled={otpLoading}>
                          Resend code
                        </button>
                    }
                  </div>

                  <button type="button" className="otp-back-btn" onClick={() => { setRegStep(0); setOtpError(''); }}>
                    <ArrowLeft size={14}/> Change email
                  </button>
                </div>
              )}

              {/* Step 2 — complete registration */}
              {regStep === 2 && (
                <div className="otp-verified-panel">
                  <div className="otp-verified-badge">
                    <CheckCircle size={28}/>
                  </div>
                  <p className="otp-verified-label">Email verified</p>
                  <p className="otp-verified-email">{registerForm.email}</p>
                  <form onSubmit={handleRegister} className="login-form" style={{ marginTop: '20px' }}>
                    <button type="submit" className="primary-btn" disabled={loading}>
                      {loading ? 'Creating account…' : 'Create Account 🎉'}
                    </button>
                  </form>
                  <button type="button" className="otp-back-btn" onClick={() => { setRegStep(0); }}>
                    <ArrowLeft size={14}/> Edit details
                  </button>
                </div>
              )}

              <div className="auth-footer">
                <p>Have an account?{' '}
                  <button type="button" className="text-link bold" onClick={() => switchMode('login')}>
                    Sign In
                  </button>
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
