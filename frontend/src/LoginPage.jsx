import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Building2, Calendar, AlertTriangle, ShieldCheck, User, Shield } from 'lucide-react';

export default function LoginPage({ mode, setMode, loginForm, setLoginForm, onLogin,
  registerForm, setRegisterForm, onRegister, loading, ROLES = ['USER','TECHNICIAN','ADMIN'] }) {

  const [showPw, setShowPw] = useState(false);
  const [panelRight, setPanelRight] = useState(true);

  const switchMode = (next) => {
    if (next === mode) return;
    setPanelRight(next === 'login');
    setMode(next);
  };

  const googleLogin = () => {
    window.location.href = `http://${window.location.hostname || 'localhost'}:8082/oauth2/authorization/google`;
  };

  return (
    <div className="login-container">
      {/* Hero background */}
      <div className="login-hero">
        <div className="float-shape shape-1"/><div className="float-shape shape-2"/><div className="float-shape shape-3"/>
        <div className="hero-content">
          <h2 className="brand-title">CampusX</h2>
          <h1 className="hero-heading">Welcome to<br/>CampusX</h1>
          <p className="hero-description">Manage facilities, bookings, incidents, notifications, and role-based operations — all in one platform.</p>
          <div className="feature-list">
            {[
              [<Building2 size={22}/>, 'Facilities Management'],
              [<Calendar size={22}/>, 'Smart Bookings'],
              [<AlertTriangle size={22}/>, 'Incident Tracking'],
              [<ShieldCheck size={22}/>, 'Role-Based Security'],
            ].map(([icon, label]) => (
              <div className="feature-item" key={label}>
                <div className="feature-icon">{icon}</div><span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sliding panel */}
      <div className={`login-sidebar ${panelRight ? 'pos-right' : 'pos-left'}`}>
        <div className="login-card">
          <div className="card-header">
            <h2>{mode === 'login' ? 'Welcome Back 👋' : 'Join CampusX 🚀'}</h2>
            <p>{mode === 'login' ? 'Sign in to continue' : 'Create your account'}</p>
          </div>

          <button type="button" className="google-btn" onClick={googleLogin}>
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
          <div className="divider"><span>OR</span></div>

          {mode === 'login' ? (
            <form onSubmit={onLogin} className="login-form">
              <div className="form-group">
                <div className="input-with-icon">
                  <Mail className="input-icon" size={20}/>
                  <input type="email" placeholder="Email" value={loginForm.email}
                    onChange={e => setLoginForm({...loginForm, email: e.target.value})} required/>
                </div>
              </div>
              <div className="form-group">
                <div className="input-with-icon">
                  <Lock className="input-icon" size={20}/>
                  <input type={showPw ? 'text' : 'password'} placeholder="Password" value={loginForm.password}
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})} required/>
                  <button type="button" className="icon-btn" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={20}/> : <Eye size={20}/>}
                  </button>
                </div>
              </div>
              <div className="form-options"><button type="button" className="text-link">Forgot Password?</button></div>
              <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
            </form>
          ) : (
            <form onSubmit={onRegister} className="login-form">
              <div className="form-group">
                <div className="input-with-icon">
                  <User className="input-icon" size={20}/>
                  <input type="text" placeholder="Full name" value={registerForm.fullName}
                    onChange={e => setRegisterForm({...registerForm, fullName: e.target.value})} required/>
                </div>
              </div>
              <div className="form-group">
                <div className="input-with-icon">
                  <Mail className="input-icon" size={20}/>
                  <input type="email" placeholder="Email" value={registerForm.email}
                    onChange={e => setRegisterForm({...registerForm, email: e.target.value})} required/>
                </div>
              </div>
              <div className="form-group">
                <div className="input-with-icon">
                  <Lock className="input-icon" size={20}/>
                  <input type={showPw ? 'text' : 'password'} placeholder="Password" value={registerForm.password}
                    onChange={e => setRegisterForm({...registerForm, password: e.target.value})} required/>
                  <button type="button" className="icon-btn" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={20}/> : <Eye size={20}/>}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <div className="input-with-icon">
                  <Shield className="input-icon" size={20}/>
                  <select value={registerForm.role} onChange={e => setRegisterForm({...registerForm, role: e.target.value})} required>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Creating…' : 'Create Account'}</button>
            </form>
          )}

          <div className="auth-footer">
            {mode === 'login'
              ? <p>No account? <button type="button" className="text-link bold" onClick={() => switchMode('register')}>Register</button></p>
              : <p>Have an account? <button type="button" className="text-link bold" onClick={() => switchMode('login')}>Sign In</button></p>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
