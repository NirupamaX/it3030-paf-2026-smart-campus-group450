import BookingSystem from './BookingSystem';
import './App.css';
import {
  LayoutDashboard, Building2, Calendar as CalIcon, AlertTriangle,
  Bell, Shield, LogOut, RefreshCw, AlertCircle, CheckCircle, Menu,
  MessageSquare, Upload, X
} from 'lucide-react';
import LoginPage from './LoginPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addIncidentComment, assignIncident, bookingDecision, cancelBooking,
  createBooking, createFacility, createIncident, deleteFacility, getMe,
  getUnreadCount, listAllBookings, listAssignedIncidents,
  listFacilities, listIncidentComments, listMyBookings, listMyIncidents,
  listNotifications, listTechnicians, listUsers, login, markNotificationRead,
  register, updateFacility, updateIncidentStatus, uploadIncidentImages,
} from './api';

const ROLES = ['STUDENT', 'USER', 'TECHNICIAN', 'ADMIN'];
const TABS  = ['Facilities', 'Bookings', 'Incidents', 'Notifications', 'Admin'];

function Badge({ status }) {
  const map = {
    APPROVED: 'badge-green', RESOLVED: 'badge-green', CLOSED: 'badge-green', ACTIVE: 'badge-green', AVAILABLE: 'badge-green',
    REJECTED: 'badge-red', OUT_OF_SERVICE: 'badge-red', CRITICAL: 'badge-red',
    PENDING: 'badge-yellow', IN_PROGRESS: 'badge-yellow', UNDER_MAINTENANCE: 'badge-yellow',
    CANCELLED: 'badge-indigo',
  };
  return <span className={`badge ${map[status] || 'badge-indigo'}`}>{status}</span>;
}

function Empty({ text }) {
  return <p className="empty">{text}</p>;
}

function fmt(v) {
  if (!v) return '—';
  return new Date(v).toLocaleString();
}

function App() {
  const [mode, setMode]   = useState('login');
  const [tab, setTab]     = useState('Facilities');
  const [token, setToken] = useState(() => {
    // Check for OAuth token in URL first (?token=...)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('campusx_token', urlToken);
      // Clean the token from the URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
      return urlToken;
    }
    return localStorage.getItem('campusx_token');
  });
  const [user, setUser]   = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data
  const [facilities, setFacilities]           = useState([]);
  const [facilitySearch, setFacilitySearch]   = useState('');
  const [bookings, setBookings]               = useState([]);
  const [allBookings, setAllBookings]         = useState([]);
  const [incidents, setIncidents]             = useState([]);
  const [assignedIncidents, setAssignedIncidents] = useState([]);
  const [notifications, setNotifications]     = useState([]);
  const [unread, setUnread]                   = useState(0);
  const [users, setUsers]                     = useState([]);
  const [technicians, setTechnicians]         = useState([]);

  // Forms
  const [loginForm, setLoginForm]     = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ fullName: '', email: '', password: '', role: 'STUDENT' });
  const [facilityForm, setFacilityForm] = useState({
    name: '', type: '', location: '', capacity: 1, description: '',
    available: true, status: 'AVAILABLE', operatingHours: '08:00-20:00',
    openingTime: '08:00', closingTime: '20:00',
  });
  const [editingFacilityId, setEditingFacilityId] = useState(null);
  const [incidentForm, setIncidentForm] = useState({
    title: '', description: '', location: '', category: 'OTHER',
    priority: 'MEDIUM', preferredContact: '', imageUrls: [],
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const imageInputRef = useRef(null);

  // Incident detail / comments
  const [openIncident, setOpenIncident]   = useState(null);
  const [comments, setComments]           = useState([]);
  const [commentText, setCommentText]     = useState('');
  const [incidentAction, setIncidentAction] = useState({});

  const role    = user?.role;
  const isAdmin = role === 'ADMIN';
  const isTech  = role === 'TECHNICIAN';

  const visibleTabs = useMemo(() => {
    if (isAdmin) return TABS;
    if (isTech)  return ['Facilities', 'Incidents', 'Notifications'];
    return ['Facilities', 'Bookings', 'Incidents', 'Notifications'];
  }, [isAdmin, isTech]);

  const clear = () => { setError(''); setInfo(''); };

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadFacilities = useCallback(async (q = '') => {
    const data = await listFacilities(q ? { q } : {});
    setFacilities(data);
  }, []);

  const loadBookings = useCallback(async () => {
    try { setBookings(await listMyBookings()); } catch {}
    try { setAllBookings(await listAllBookings()); } catch {}
  }, []);

  const loadIncidents = useCallback(async (currentRole) => {
    try { setIncidents(await listMyIncidents()); } catch {}
    if (currentRole === 'ADMIN' || currentRole === 'TECHNICIAN') {
      try { setAssignedIncidents(await listAssignedIncidents()); } catch {}
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const [list, cnt] = await Promise.all([listNotifications(), getUnreadCount()]);
      setNotifications(list);
      setUnread(cnt?.unread || 0);
    } catch {}
  }, []);

  const loadAdminData = useCallback(async () => {
    try {
      const [u, t] = await Promise.all([listUsers(), listTechnicians()]);
      setUsers(u); setTechnicians(t);
    } catch {}
  }, []);

  const loadAll = useCallback(async (currentUser) => {
    if (!token) return;
    setLoading(true); clear();
    try {
      let me = currentUser;
      if (!me) { me = await getMe(); setUser(me); }
      await Promise.all([
        loadFacilities(facilitySearch),
        loadBookings(),
        loadIncidents(me.role),
        loadNotifications(),
        ...(me.role === 'ADMIN' ? [loadAdminData()] : []),
      ]);
    } catch (e) {
      if (e.message.includes('401') || e.message.includes('403')) {
        localStorage.removeItem('campusx_token');
        setToken(null); setUser(null);
      }
      setError(e.message);
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { loadAll(null); }, [token]); // eslint-disable-line

  useEffect(() => {
    if (!visibleTabs.includes(tab)) setTab(visibleTabs[0]);
  }, [visibleTabs, tab]);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const onLogin = async (e) => {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const p = await login(loginForm);
      localStorage.setItem('campusx_token', p.token);
      setToken(p.token);
      setInfo('Welcome to CampusX!');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const onRegister = async (e) => {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const p = await register(registerForm);
      localStorage.setItem('campusx_token', p.token);
      setToken(p.token);
      setInfo('Account created. Welcome!');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const onLogout = () => {
    localStorage.removeItem('campusx_token');
    setToken(null); setUser(null); setInfo('Logged out.');
  };

  // ── Facilities ─────────────────────────────────────────────────────────────
  const submitFacility = async (e) => {
    e.preventDefault(); clear();
    try {
      const payload = {
        ...facilityForm,
        capacity: Number(facilityForm.capacity),
        available: facilityForm.status === 'AVAILABLE' || facilityForm.status === 'ACTIVE',
      };
      if (editingFacilityId) {
        await updateFacility(editingFacilityId, payload);
        setInfo('Facility updated.');
      } else {
        await createFacility(payload);
        setInfo('Facility created.');
      }
      resetFacilityForm();
      await loadFacilities(facilitySearch);
    } catch (err) { setError(err.message); }
  };

  const resetFacilityForm = () => {
    setFacilityForm({ name: '', type: '', location: '', capacity: 1, description: '',
      available: true, status: 'AVAILABLE', operatingHours: '08:00-20:00',
      openingTime: '08:00', closingTime: '20:00' });
    setEditingFacilityId(null);
  };

  const startEditFacility = (f) => {
    setEditingFacilityId(f.id);
    setFacilityForm({
      name: f.name || '', type: f.type || '', location: f.location || '',
      capacity: f.capacity || 1, description: f.description || '',
      available: Boolean(f.available), status: f.status || 'AVAILABLE',
      operatingHours: f.operatingHours || '08:00-20:00',
      openingTime: f.openingTime || '08:00', closingTime: f.closingTime || '20:00',
    });
  };

  const removeFacility = async (id) => {
    if (!window.confirm('Delete this facility?')) return;
    clear();
    try { await deleteFacility(id); setInfo('Deleted.'); await loadFacilities(facilitySearch); }
    catch (err) { setError(err.message); }
  };

  // ── Bookings ───────────────────────────────────────────────────────────────
  const onSubmitBooking = async (params) => {
    clear();
    try {
      await createBooking(params);
      setInfo('Booking request submitted.');
      await loadBookings();
      await loadNotifications();
    } catch (err) { setError(err.message); }
  };

  const onApproveBooking = async (id) => {
    clear();
    try {
      await bookingDecision(id, { status: 'APPROVED' });
      setInfo('Booking approved.');
      await loadBookings();
    } catch (err) { setError(err.message); }
  };

  const onRejectBooking = async (id) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason?.trim()) return;
    clear();
    try {
      await bookingDecision(id, { status: 'REJECTED', rejectionReason: reason.trim() });
      setInfo('Booking rejected.');
      await loadBookings();
    } catch (err) { setError(err.message); }
  };

  const onCancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    clear();
    try { await cancelBooking(id); setInfo('Booking cancelled.'); await loadBookings(); }
    catch (err) { setError(err.message); }
  };

  // ── Incidents ──────────────────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const urls = await uploadIncidentImages(files);
      setIncidentForm(f => ({ ...f, imageUrls: [...(f.imageUrls || []), ...urls].slice(0, 3) }));
    } catch (err) { setError(err.message); }
    finally { setUploadingImages(false); }
  };

  const removeImage = (url) =>
    setIncidentForm(f => ({ ...f, imageUrls: f.imageUrls.filter(u => u !== url) }));

  const submitIncident = async (e) => {
    e.preventDefault(); clear();
    try {
      await createIncident(incidentForm);
      setInfo('Incident reported.');
      setIncidentForm({ title: '', description: '', location: '', category: 'OTHER',
        priority: 'MEDIUM', preferredContact: '', imageUrls: [] });
      await loadIncidents(role);
      await loadNotifications();
    } catch (err) { setError(err.message); }
  };

  const openIncidentDetail = async (incident) => {
    setOpenIncident(incident);
    try { setComments(await listIncidentComments(incident.id)); } catch {}
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !openIncident) return;
    try {
      await addIncidentComment(openIncident.id, { content: commentText.trim() });
      setCommentText('');
      setComments(await listIncidentComments(openIncident.id));
    } catch (err) { setError(err.message); }
  };

  const assignToTech = async (incidentId) => {
    const techId = incidentAction[incidentId]?.technicianId;
    if (!techId) { setError('Select a technician first.'); return; }
    clear();
    try {
      await assignIncident(incidentId, { technicianId: Number(techId) });
      setInfo('Technician assigned.');
      await loadIncidents(role);
    } catch (err) { setError(err.message); }
  };

  const saveIncidentStatus = async (incidentId) => {
    const payload = incidentAction[incidentId];
    if (!payload?.status) { setError('Select a status.'); return; }
    clear();
    try {
      await updateIncidentStatus(incidentId, {
        status: payload.status,
        resolutionNote: payload.resolutionNote || '',
        rejectionReason: payload.rejectionReason || '',
      });
      setInfo('Incident updated.');
      await loadIncidents(role);
    } catch (err) { setError(err.message); }
  };

  // ── Notifications ──────────────────────────────────────────────────────────
  const readNotification = async (id) => {
    clear();
    try { await markNotificationRead(id); await loadNotifications(); }
    catch (err) { setError(err.message); }
  };

  // ── Auth screen ────────────────────────────────────────────────────────────
  if (!token) {
    if (mode === 'forgot') {
      return (
        <div className="login-root">
          <ForgotPasswordPage onBack={() => setMode('login')} />
        </div>
      );
    }
    return (
      <div className="login-root">
        {error && <div className="alert error toast">{error}</div>}
        {info  && <div className="alert success toast">{info}</div>}
        <LoginPage
          mode={mode} setMode={setMode}
          loginForm={loginForm} setLoginForm={setLoginForm} onLogin={onLogin}
          registerForm={registerForm} setRegisterForm={setRegisterForm} onRegister={onRegister}
          loading={loading} ROLES={ROLES}
          onForgotPassword={() => setMode('forgot')}
        />
      </div>
    );
  }

  const tabIcon = (t) => {
    const icons = { Facilities: <Building2 size={18}/>, Bookings: <CalIcon size={18}/>,
      Incidents: <AlertTriangle size={18}/>, Notifications: <Bell size={18}/>, Admin: <Shield size={18}/> };
    return icons[t] || <LayoutDashboard size={18}/>;
  };

  // ── Main layout ────────────────────────────────────────────────────────────
  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <LayoutDashboard size={24}/>
          <h2>CampusX</h2>
        </div>
        <nav className="sidebar-nav">
          {visibleTabs.map(t => (
            <button key={t} type="button"
              className={`nav-item ${tab === t ? 'active' : ''}`}
              onClick={() => { setTab(t); setSidebarOpen(false); }}>
              <div className="nav-item-content">{tabIcon(t)}{t}</div>
              {t === 'Notifications' && unread > 0 && <span className="badge badge-red">{unread}</span>}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {user?.fullName}<br/>
            <span className="badge badge-indigo" style={{ marginTop: '4px' }}>{user?.role}</span>
          </div>
          <button className="ghost" style={{ width: '100%', color: 'var(--danger)' }}
            onClick={onLogout} type="button">
            <LogOut size={16} style={{ marginRight: '8px' }}/> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn btn-ghost" style={{ display: 'none' }}
              id="menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20}/></button>
            <h3 style={{ margin: 0, fontWeight: 600 }}>{tab}</h3>
          </div>
          <div className="topbar-right">
            <button onClick={() => loadAll(user)} className="ghost" type="button" title="Refresh">
              <RefreshCw size={18}/>
            </button>
          </div>
        </header>

        <div className="page-content-scroll">
          {error && <div className="alert error"><AlertCircle size={18}/> {error}</div>}
          {info  && <div className="alert success"><CheckCircle size={18}/> {info}</div>}

          {/* ── FACILITIES ─────────────────────────────────────────────── */}
          {tab === 'Facilities' && (
            <section className="panel-grid">
              <article className="panel">
                <h2>Facilities</h2>
                <div className="row" style={{ marginBottom: '16px' }}>
                  <input className="input" placeholder="Search by name, type, location…"
                    value={facilitySearch}
                    onChange={e => setFacilitySearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadFacilities(facilitySearch)}
                  />
                  <button className="ghost" type="button"
                    onClick={() => loadFacilities(facilitySearch)}>Search</button>
                </div>
                {facilities.length === 0 ? <Empty text="No facilities found."/> : (
                  <div className="content-grid">
                    {facilities.map(f => (
                      <div className="card" key={f.id}>
                        {/* Image placeholder */}
                        <div style={{
                          width: '100%', height: '140px', borderRadius: '8px',
                          background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.8rem',
                          border: '2px dashed var(--border-color)'
                        }}>
                          <Building2 size={32} style={{ opacity: 0.3 }}/>
                        </div>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h3 style={{ margin: 0 }}>{f.name}</h3>
                          <Badge status={f.status}/>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '8px' }}>
                          {f.description || 'No description.'}
                        </p>
                        <div className="meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span>📍 {f.location}</span>
                          <span>🏷 {f.type}</span>
                          <span>👥 Cap: {f.capacity}</span>
                          <span>🕐 {f.openingTime}–{f.closingTime}</span>
                        </div>
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button className="ghost" type="button" onClick={() => startEditFacility(f)}>Edit</button>
                            <button className="btn btn-danger" type="button" onClick={() => removeFacility(f.id)}>Delete</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>

              {isAdmin && (
                <article className="panel">
                  <h2>{editingFacilityId ? 'Edit Facility' : 'Add Facility'}</h2>
                  <form onSubmit={submitFacility}>
                    {[
                      ['Facility Name', 'name', 'text'],
                      ['Type (e.g. Lab, Hall)', 'type', 'text'],
                      ['Location', 'location', 'text'],
                      ['Capacity', 'capacity', 'number'],
                      ['Opening Time (HH:mm)', 'openingTime', 'text'],
                      ['Closing Time (HH:mm)', 'closingTime', 'text'],
                    ].map(([label, field, type]) => (
                      <div className="form-group" key={field}>
                        <label>{label}</label>
                        <input className="input" type={type} min={type === 'number' ? 1 : undefined}
                          value={facilityForm[field]}
                          onChange={e => setFacilityForm({ ...facilityForm, [field]: e.target.value })}
                          required/>
                      </div>
                    ))}
                    <div className="form-group">
                      <label>Status</label>
                      <select className="input" value={facilityForm.status}
                        onChange={e => setFacilityForm({ ...facilityForm, status: e.target.value })}>
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                        <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea className="input" rows={3}
                        value={facilityForm.description}
                        onChange={e => setFacilityForm({ ...facilityForm, description: e.target.value })}/>
                    </div>
                    <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                      {editingFacilityId ? 'Update Facility' : 'Save Facility'}
                    </button>
                    {editingFacilityId && (
                      <button className="ghost" type="button" style={{ width: '100%', marginTop: '8px' }}
                        onClick={resetFacilityForm}>Cancel Edit</button>
                    )}
                  </form>
                </article>
              )}
            </section>
          )}

          {/* ── BOOKINGS ───────────────────────────────────────────────── */}
          {tab === 'Bookings' && (
            <BookingSystem
              facilities={facilities}
              userBookings={bookings}
              allBookings={allBookings}
              isAdmin={isAdmin}
              onSubmitBooking={onSubmitBooking}
              onApproveBooking={onApproveBooking}
              onRejectBooking={onRejectBooking}
              onCancelBooking={onCancelBooking}
            />
          )}

          {/* ── INCIDENTS ──────────────────────────────────────────────── */}
          {tab === 'Incidents' && (
            <section className="panel-grid">
              {/* Report form */}
              <article className="panel">
                <h2>Report an Incident</h2>
                <form onSubmit={submitIncident}>
                  <div className="form-group">
                    <label>Title</label>
                    <input className="input" placeholder="Brief title"
                      value={incidentForm.title}
                      onChange={e => setIncidentForm({ ...incidentForm, title: e.target.value })} required/>
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input className="input" placeholder="Where did it happen?"
                      value={incidentForm.location}
                      onChange={e => setIncidentForm({ ...incidentForm, location: e.target.value })} required/>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label>Category</label>
                      <select className="input" value={incidentForm.category}
                        onChange={e => setIncidentForm({ ...incidentForm, category: e.target.value })}>
                        {['ELECTRICAL','NETWORK','PLUMBING','HARDWARE','SOFTWARE','OTHER'].map(c =>
                          <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <select className="input" value={incidentForm.priority}
                        onChange={e => setIncidentForm({ ...incidentForm, priority: e.target.value })}>
                        {['LOW','MEDIUM','HIGH','CRITICAL'].map(p =>
                          <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea className="input" rows={3} placeholder="Describe the issue…"
                      value={incidentForm.description}
                      onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })} required/>
                  </div>
                  <div className="form-group">
                    <label>Preferred Contact (optional)</label>
                    <input className="input" placeholder="Phone or email"
                      value={incidentForm.preferredContact}
                      onChange={e => setIncidentForm({ ...incidentForm, preferredContact: e.target.value })}/>
                  </div>
                  {/* Image upload */}
                  <div className="form-group">
                    <label>Attach Images (up to 3)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      {(incidentForm.imageUrls || []).map(url => (
                        <div key={url} style={{ position: 'relative', width: '80px', height: '80px' }}>
                          <img src={`http://localhost:8082${url}`} alt="attachment"
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                            onError={e => { e.target.style.display = 'none'; }}/>
                          <button type="button" onClick={() => removeImage(url)}
                            style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)',
                              color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={12}/>
                          </button>
                        </div>
                      ))}
                      {(incidentForm.imageUrls || []).length < 3 && (
                        <button type="button"
                          style={{ width: '80px', height: '80px', border: '2px dashed var(--border-color)',
                            borderRadius: '8px', background: 'var(--bg-body)', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-muted)', fontSize: '0.7rem', gap: '4px' }}
                          onClick={() => imageInputRef.current?.click()}
                          disabled={uploadingImages}>
                          <Upload size={20}/>
                          {uploadingImages ? 'Uploading…' : 'Add Image'}
                        </button>
                      )}
                    </div>
                    <input ref={imageInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                      onChange={handleImageUpload}/>
                  </div>
                  <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                    Submit Ticket
                  </button>
                </form>
              </article>

              {/* My tickets */}
              <article className="panel">
                <h2>My Tickets</h2>
                {incidents.length === 0 ? <Empty text="No tickets yet."/> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {incidents.map(i => (
                      <div className="card" key={i.id} style={{ cursor: 'pointer' }}
                        onClick={() => openIncidentDetail(i)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <strong>#{i.id} {i.title}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              📍 {i.location} · {i.category} · {fmt(i.createdAt)}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                            <Badge status={i.status}/>
                            <Badge status={i.priority}/>
                          </div>
                        </div>
                        {i.technician && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                            🔧 Assigned to: {i.technician.fullName}
                          </div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '6px' }}>
                          <MessageSquare size={12} style={{ marginRight: '4px' }}/>Click to view comments
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              {/* Technician / Admin workspace */}
              {(isAdmin || isTech) && (
                <article className="panel">
                  <h2>{isAdmin ? 'All Incidents' : 'Assigned to Me'}</h2>
                  {assignedIncidents.length === 0 ? <Empty text="No incidents."/> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {assignedIncidents.map(i => (
                        <div className="card" key={i.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong>#{i.id} {i.title}</strong>
                            <Badge status={i.status}/>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{i.description}</p>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                            📍 {i.location} · <Badge status={i.priority}/> · Reporter: {i.reporter?.fullName || '—'}
                          </div>
                          {isAdmin && (
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              <select className="input" style={{ flex: 1 }}
                                value={incidentAction[i.id]?.technicianId || ''}
                                onChange={e => setIncidentAction({ ...incidentAction,
                                  [i.id]: { ...incidentAction[i.id], technicianId: e.target.value } })}>
                                <option value="">Assign technician…</option>
                                {technicians.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                              </select>
                              <button className="btn btn-primary" type="button" onClick={() => assignToTech(i.id)}>
                                Assign
                              </button>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <select className="input" style={{ flex: 1 }}
                              value={incidentAction[i.id]?.status || ''}
                              onChange={e => setIncidentAction({ ...incidentAction,
                                [i.id]: { ...incidentAction[i.id], status: e.target.value } })}>
                              <option value="">Update status…</option>
                              {['OPEN','IN_PROGRESS','RESOLVED','CLOSED','REJECTED'].map(s =>
                                <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <input className="input" placeholder="Resolution note"
                            value={incidentAction[i.id]?.resolutionNote || ''}
                            onChange={e => setIncidentAction({ ...incidentAction,
                              [i.id]: { ...incidentAction[i.id], resolutionNote: e.target.value } })}
                            style={{ marginBottom: '8px' }}/>
                          <button className="btn btn-primary" type="button" style={{ width: '100%' }}
                            onClick={() => saveIncidentStatus(i.id)}>
                            Save Update
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              )}
            </section>
          )}

          {/* ── NOTIFICATIONS ──────────────────────────────────────────── */}
          {tab === 'Notifications' && (
            <section>
              <article className="panel">
                <h2>Notifications {unread > 0 && <span className="badge badge-red" style={{ marginLeft: '8px' }}>{unread} unread</span>}</h2>
                {notifications.length === 0 ? <Empty text="No notifications."/> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notifications.map(n => (
                      <div key={n.id} className="card"
                        style={{ borderLeft: `4px solid ${n.isRead ? 'var(--border-color)' : 'var(--primary)'}`,
                          opacity: n.isRead ? 0.7 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span className="badge badge-indigo" style={{ marginBottom: '6px' }}>{n.type}</span>
                            <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>{n.message}</p>
                            <small style={{ color: 'var(--text-muted)' }}>{fmt(n.createdAt)}</small>
                          </div>
                          {!n.isRead && (
                            <button className="ghost" type="button" onClick={() => readNotification(n.id)}
                              style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>
          )}

          {/* ── ADMIN ──────────────────────────────────────────────────── */}
          {tab === 'Admin' && isAdmin && (
            <section>
              <article className="panel">
                <h2>User Management</h2>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>{u.fullName}</td>
                          <td>{u.email}</td>
                          <td><Badge status={u.role}/></td>
                          <td>{u.active ? '✅ Active' : '❌ Inactive'}</td>
                          <td>{fmt(u.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
              <article className="panel" style={{ marginTop: '24px' }}>
                <h2>Technicians</h2>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {technicians.map(t => (
                        <tr key={t.id}>
                          <td>{t.fullName}</td>
                          <td>{t.email}</td>
                          <td>{t.active ? '✅ Active' : '❌ Inactive'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          )}
        </div>
      </main>

      {/* ── Incident detail modal (comments) ─────────────────────────── */}
      {openIncident && (
        <div className="modal-scrim" onClick={() => setOpenIncident(null)}>
          <div className="modal-box wide" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0 }}>#{openIncident.id} {openIncident.title}</h2>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <Badge status={openIncident.status}/>
                  <Badge status={openIncident.priority}/>
                </div>
              </div>
              <button className="ghost" type="button" onClick={() => setOpenIncident(null)}>
                <X size={20}/>
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>{openIncident.description}</p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              📍 {openIncident.location} · {openIncident.category} · Reported: {fmt(openIncident.createdAt)}
              {openIncident.technician && ` · 🔧 ${openIncident.technician.fullName}`}
            </div>
            {openIncident.imageUrl && (
              <img src={`http://localhost:8082${openIncident.imageUrl}`} alt="incident"
                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }}
                onError={e => { e.target.style.display = 'none'; }}/>
            )}
            <hr style={{ borderColor: 'var(--border-color)', marginBottom: '16px' }}/>
            <h3 style={{ marginBottom: '12px' }}>
              <MessageSquare size={16} style={{ marginRight: '6px' }}/>Comments
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', maxHeight: '240px', overflowY: 'auto' }}>
              {comments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No comments yet.</p>
              ) : comments.map(c => (
                <div key={c.id} style={{ background: 'var(--bg-body)', borderRadius: '8px', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.875rem' }}>{c.author?.fullName || 'User'}</strong>
                    <small style={{ color: 'var(--text-muted)' }}>{fmt(c.createdAt)}</small>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>{c.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={submitComment} style={{ display: 'flex', gap: '8px' }}>
              <input className="input" placeholder="Add a comment…"
                value={commentText} onChange={e => setCommentText(e.target.value)} required/>
              <button className="btn btn-primary" type="submit">Post</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
