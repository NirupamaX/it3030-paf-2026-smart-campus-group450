import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import { forgotPassword, resetPassword } from './api';

export default function ForgotPasswordPage({ onBack }) {
  const [step, setStep] = useState('request'); // 'request' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await forgotPassword(email);
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setLoading(true);
    try {
      await resetPassword({ token, newPassword: password });
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="login-container">
      {/* Hero — same as LoginPage */}
      <div className="login-hero">
        <div className="float-shape shape-1"/>
        <div className="float-shape shape-2"/>
        <div className="float-shape shape-3"/>
        <div className="hero-content">
          <h2 className="brand-title">CampusX</h2>
          <h1 className="hero-heading">Reset Your<br/>Password</h1>
          <p className="hero-description">
            Enter your email to receive a reset token, then set a new password to regain access.
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="login-sidebar pos-right">
        <div className="login-card">

          {step === 'request' && (
            <>
              <div className="card-header">
                <h2>Forgot Password 🔑</h2>
                <p>We'll send a reset token to your email</p>
              </div>
              {error && <div className="fp-error">{error}</div>}
              <form onSubmit={handleRequest} className="login-form">
                <div className="form-group">
                  <div className="input-with-icon">
                    <Mail className="input-icon" size={20}/>
                    <input
                      type="email"
                      placeholder="Your email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Sending…' : 'Send Reset Token'}
                </button>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <div className="card-header">
                <h2>Set New Password 🔒</h2>
                <p>Enter the token sent to <strong>{email}</strong></p>
              </div>
              {error && <div className="fp-error">{error}</div>}
              <form onSubmit={handleReset} className="login-form">
                <div className="form-group">
                  <div className="input-with-icon">
                    <KeyRound className="input-icon" size={20}/>
                    <input
                      type="text"
                      placeholder="Reset token"
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={20}/>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="New password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" className="icon-btn" onClick={() => setShowPw(p => !p)}>
                      {showPw ? <EyeOff size={20}/> : <Eye size={20}/>}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={20}/>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
                <button type="button" className="ghost fp-back-btn" onClick={() => setStep('request')}>
                  ← Back
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <div className="fp-success">
              <CheckCircle size={48} className="fp-success-icon"/>
              <h2>Password Reset!</h2>
              <p>Your password has been updated. You can now sign in with your new password.</p>
              <button type="button" className="primary-btn" onClick={onBack}>
                Back to Sign In
              </button>
            </div>
          )}

          {step !== 'done' && (
            <div className="auth-footer">
              <p>
                Remember it?{' '}
                <button type="button" className="text-link bold" onClick={onBack}>
                  <ArrowLeft size={13} style={{ verticalAlign: 'middle' }}/> Sign In
                </button>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
