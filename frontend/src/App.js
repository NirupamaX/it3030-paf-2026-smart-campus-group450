import './App.css';
import { 
  LayoutDashboard, Building2, Calendar as CalIcon, AlertTriangle, 
  Bell, Shield, LogOut, RefreshCw, AlertCircle, CheckCircle, Menu
} from 'lucide-react';


import { useEffect, useMemo, useState } from 'react';
import {
  addIncidentComment,
  assignIncident,
  bookingDecision,
  createBooking,
  deleteFacility,
  createFacility,
  createIncident,
  deleteIncidentComment,
  getMe,
  getUnreadCount,
  listIncidentAttachments,
  listIncidentComments,
  listAllBookings,
  listAssignedIncidents,
  listFacilities,
  listMyBookings,
  listMyIncidents,
  listNotifications,
  listTechnicians,
  listUsers,
  login,
  markNotificationRead,
  register,
  updateIncidentComment,
  updateIncidentStatus,
  updateFacility,
  uploadIncidentImages,
} from './api';

const ROLES = ['USER', 'TECHNICIAN', 'ADMIN'];
const TABS = ['Facilities', 'Bookings', 'Incidents', 'Notifications', 'Admin'];

function Empty({ text }) {
  return <p className="empty">{text}</p>;
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function todayDateValue() {
  return new Date().toISOString().split('T')[0];
}

function toMinutes(timeValue) {
  if (!timeValue || !timeValue.includes(':')) return null;
  const [h, m] = timeValue.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function statusTone(status) {
  if (['APPROVED', 'RESOLVED', 'CLOSED', 'READ', 'AVAILABLE', 'ACTIVE'].includes(status)) return 'tone-fresh';
  if (['REJECTED', 'UNAVAILABLE', 'CRITICAL', 'INACTIVE'].includes(status)) return 'tone-alert';
  return 'tone-warm';
}

function isFacilityBookableByStatus(status) {
  return status === 'ACTIVE' || status === 'AVAILABLE';
}

function facilityStatusBadge(status) {
  if (status === 'UNDER_MAINTENANCE') {
    return { text: 'Under Maintenance', cls: 'wait' };
  }
  if (status === 'OUT_OF_SERVICE') {
    return { text: 'Out of Service', cls: 'bad' };
  }
  return { text: 'Available', cls: 'ok' };
}

function App() {
  const [mode, setMode] = useState('login');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState('Facilities');
  const [token, setToken] = useState(localStorage.getItem('campusx_token'));
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const [facilities, setFacilities] = useState([]);
  const [facilityFilters, setFacilityFilters] = useState({
    q: '',
    type: '',
    location: '',
    capacityMin: '',
    capacityMax: '',
  });
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [assignedIncidents, setAssignedIncidents] = useState([]);
  const [attachmentsByIncident, setAttachmentsByIncident] = useState({});
  const [commentsByIncident, setCommentsByIncident] = useState({});
  const [commentDraftByIncident, setCommentDraftByIncident] = useState({});
  const [editingCommentByIncident, setEditingCommentByIncident] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [users, setUsers] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ fullName: '', email: '', password: '', role: 'USER' });
  const [facilityForm, setFacilityForm] = useState({
    name: '',
    type: '',
    location: '',
    capacity: 1,
    description: '',
    available: true,
    status: 'ACTIVE',
    operatingHours: '08:00-20:00',
    openingTime: '08:00',
    closingTime: '20:00',
  });
  const [editingFacilityId, setEditingFacilityId] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    facilityId: '',
    bookingDate: todayDateValue(),
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: 1,
  });
  const [incidentForm, setIncidentForm] = useState({
    title: '',
    description: '',
    location: '',
    category: 'ELECTRICAL',
    priority: 'MEDIUM',
    files: [],
  });
  const [decisionForm, setDecisionForm] = useState({});
  const [incidentAction, setIncidentAction] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('token');
    if (!oauthToken) {
      return;
    }

    localStorage.setItem('campusx_token', oauthToken);
    setToken(oauthToken);
    setInfo('Signed in with Google successfully.');

    params.delete('token');
    const next = params.toString();
    const newUrl = `${window.location.pathname}${next ? `?${next}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, []);

  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isTech = role === 'TECHNICIAN';
  const selectedBookingFacility = useMemo(
    () => facilities.find((f) => String(f.id) === String(bookingForm.facilityId)) || null,
    [facilities, bookingForm.facilityId]
  );

  const visibleTabs = useMemo(() => {
    if (isAdmin) return TABS;
    if (isTech) return ['Facilities', 'Incidents', 'Notifications'];
    return ['Facilities', 'Bookings', 'Incidents', 'Notifications'];
  }, [isAdmin, isTech]);

  const dashboardStats = useMemo(
    () => [
      { label: 'Facilities', value: facilities.length, hint: 'Spaces and assets ready to use' },
      { label: 'My Bookings', value: bookings.length, hint: 'Personal reservations tracked' },
      { label: 'My Incidents', value: incidents.length, hint: 'Issues reported and monitored' },
      { label: 'Unread Alerts', value: unread, hint: 'Pending updates requiring attention' },
    ],
    [facilities.length, bookings.length, incidents.length, unread]
  );

  const adminAnalytics = useMemo(() => {
    const bookingPending = allBookings.filter((item) => item.status === 'PENDING').length;
    const bookingApproved = allBookings.filter((item) => item.status === 'APPROVED').length;
    const incidentOpen = assignedIncidents.filter((item) => ['OPEN', 'IN_PROGRESS'].includes(item.status)).length;
    const incidentResolved = assignedIncidents.filter((item) => ['RESOLVED', 'CLOSED'].includes(item.status)).length;

    return [
      { label: 'Pending Bookings', value: bookingPending },
      { label: 'Approved Bookings', value: bookingApproved },
      { label: 'Open Incidents', value: incidentOpen },
      { label: 'Resolved Incidents', value: incidentResolved },
    ];
  }, [allBookings, assignedIncidents]);

  const incidentSlaTimers = useMemo(() => {
    return assignedIncidents
      .filter((item) => ['OPEN', 'IN_PROGRESS'].includes(item.status) && item.createdAt)
      .map((item) => {
        const created = new Date(item.createdAt).getTime();
        const now = Date.now();
        const elapsedHours = Math.max(0, Math.floor((now - created) / (1000 * 60 * 60)));
        return {
          id: item.id,
          title: item.title,
          status: item.status,
          elapsedHours,
          breached: elapsedHours >= 24,
        };
      });
  }, [assignedIncidents]);

  const clearMessages = () => {
    setError('');
    setInfo('');
  };

  const loadAuthData = async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch (e) {
      localStorage.removeItem('campusx_token');
      setToken(null);
      setUser(null);
      setError(e.message);
    }
  };

  const loadFacilities = async (filters = facilityFilters) => {
    const payload = {
      q: filters.q?.trim() || undefined,
      type: filters.type?.trim() || undefined,
      location: filters.location?.trim() || undefined,
      capacityMin: filters.capacityMin === '' ? undefined : Number(filters.capacityMin),
      capacityMax: filters.capacityMax === '' ? undefined : Number(filters.capacityMax),
    };

    const data = await listFacilities(payload);
    setFacilities(data);
  };

  const loadBookings = async () => {
    const mine = await listMyBookings();
    setBookings(mine);
    if (isAdmin) {
      const all = await listAllBookings();
      setAllBookings(all);
    }
  };

  const loadIncidents = async () => {
    const mine = await listMyIncidents();
    setIncidents(mine);

    if (isTech || isAdmin) {
      const assigned = await listAssignedIncidents();
      setAssignedIncidents(assigned);
    }
  };

  const loadNotifications = async () => {
    const [list, unreadPayload] = await Promise.all([listNotifications(), getUnreadCount()]);
    setNotifications(list);
    setUnread(unreadPayload?.unread || 0);
  };

  const loadAdminData = async () => {
    if (!isAdmin) return;
    const [allUsers, techs] = await Promise.all([listUsers(), listTechnicians()]);
    setUsers(allUsers);
    setTechnicians(techs);
  };

  const loadAll = async () => {
    if (!token) return;
    setLoading(true);
    clearMessages();
    try {
      await loadAuthData();
      await loadFacilities(facilityFilters);
      await loadBookings();
      await loadIncidents();
      await loadNotifications();
      await loadAdminData();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const interval = setInterval(() => {
      loadNotifications().catch(() => {
        // Polling should not interrupt user flow if a request fails once.
      });
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!visibleTabs.includes(tab)) {
      setTab(visibleTabs[0]);
    }
  }, [visibleTabs, tab]);

  const onLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const payload = await login(loginForm);
      localStorage.setItem('campusx_token', payload.token);
      setToken(payload.token);
      setInfo('Welcome to CampusX.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const payload = await register(registerForm);
      localStorage.setItem('campusx_token', payload.token);
      setToken(payload.token);
      setInfo('Account created successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onLogout = () => {
    localStorage.removeItem('campusx_token');
    setToken(null);
    setUser(null);
    setInfo('Logged out.');
  };

  const submitFacility = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      const payload = {
        ...facilityForm,
        capacity: Number(facilityForm.capacity),
        available: isFacilityBookableByStatus(facilityForm.status),
      };
      if (editingFacilityId) {
        await updateFacility(editingFacilityId, payload);
        setInfo('Facility updated.');
      } else {
        await createFacility(payload);
        setInfo('Facility added.');
      }
      resetFacilityForm();
      await loadFacilities(facilityFilters);
    } catch (err) {
      setError(err.message);
    }
  };

  const resetFacilityForm = () => {
    setFacilityForm({
      name: '',
      type: '',
      location: '',
      capacity: 1,
      description: '',
      available: true,
      status: 'ACTIVE',
      operatingHours: '08:00-20:00',
      openingTime: '08:00',
      closingTime: '20:00',
    });
    setEditingFacilityId(null);
  };

  const startEditFacility = (facility) => {
    setEditingFacilityId(facility.id);
    setFacilityForm({
      name: facility.name || '',
      type: facility.type || '',
      location: facility.location || '',
      capacity: facility.capacity || 1,
      description: facility.description || '',
      available: Boolean(facility.available),
      status: facility.status === 'AVAILABLE' ? 'ACTIVE' : (facility.status || 'ACTIVE'),
      operatingHours: facility.operatingHours || `${facility.openingTime || '08:00'}-${facility.closingTime || '20:00'}`,
      openingTime: facility.openingTime || '08:00',
      closingTime: facility.closingTime || '20:00',
    });
  };

  const removeFacility = async (facilityId) => {
    clearMessages();
    if (!window.confirm('Delete this facility? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteFacility(facilityId);
      setInfo('Facility deleted.');
      if (editingFacilityId === facilityId) {
        resetFacilityForm();
      }
      await loadFacilities(facilityFilters);
    } catch (err) {
      setError(err.message);
    }
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      if (bookingForm.bookingDate < todayDateValue()) {
        setError('You cannot book a date before today.');
        return;
      }

      const startMinutes = toMinutes(bookingForm.startTime);
      const endMinutes = toMinutes(bookingForm.endTime);
      if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
        setError('End time must be after start time.');
        return;
      }

      if (selectedBookingFacility?.openingTime && selectedBookingFacility?.closingTime) {
        const openingMinutes = toMinutes(selectedBookingFacility.openingTime);
        const closingMinutes = toMinutes(selectedBookingFacility.closingTime);
        if (
          openingMinutes !== null &&
          closingMinutes !== null &&
          (startMinutes < openingMinutes || endMinutes > closingMinutes)
        ) {
          setError(
            `This facility can only be booked between ${selectedBookingFacility.openingTime} and ${selectedBookingFacility.closingTime}.`
          );
          return;
        }
      }

      await createBooking({
        resourceId: Number(bookingForm.facilityId),
        bookingDate: bookingForm.bookingDate,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        purpose: bookingForm.purpose,
        expectedAttendees: Number(bookingForm.expectedAttendees),
      });
      setInfo('Booking submitted.');
      setBookingForm({
        facilityId: '',
        bookingDate: todayDateValue(),
        startTime: '',
        endTime: '',
        purpose: '',
        expectedAttendees: 1,
      });
      await loadBookings();
      await loadNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const decideBooking = async (bookingId, decision) => {
    clearMessages();
    try {
      await bookingDecision(bookingId, {
        decision,
        comment: decisionForm[bookingId] || '',
      });
      setInfo(`Booking ${decision.toLowerCase()}.`);
      await loadBookings();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitIncident = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      let imageUrls = [];
      if (incidentForm.files.length > 0) {
        const uploadPayload = await uploadIncidentImages(incidentForm.files);
        imageUrls = uploadPayload?.files || [];
      }

      await createIncident({
        title: incidentForm.title,
        description: incidentForm.description,
        location: incidentForm.location,
        category: incidentForm.category,
        priority: incidentForm.priority,
        imageUrls,
      });
      setInfo('Incident reported.');
      setIncidentForm({
        title: '',
        description: '',
        location: '',
        category: 'ELECTRICAL',
        priority: 'MEDIUM',
        files: [],
      });
      await loadIncidents();
      await loadNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const loadIncidentDetails = async (incidentId) => {
    try {
      const [comments, attachments] = await Promise.all([
        listIncidentComments(incidentId),
        listIncidentAttachments(incidentId),
      ]);
      setCommentsByIncident((prev) => ({ ...prev, [incidentId]: comments }));
      setAttachmentsByIncident((prev) => ({ ...prev, [incidentId]: attachments }));
    } catch (err) {
      setError(err.message);
    }
  };

  const submitIncidentComment = async (incidentId) => {
    clearMessages();
    const draft = (commentDraftByIncident[incidentId] || '').trim();
    if (!draft) {
      setError('Comment cannot be empty.');
      return;
    }

    try {
      await addIncidentComment(incidentId, { content: draft });
      setCommentDraftByIncident((prev) => ({ ...prev, [incidentId]: '' }));
      await loadIncidentDetails(incidentId);
      await loadNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveEditedComment = async (incidentId, commentId) => {
    clearMessages();
    const content = (editingCommentByIncident[commentId] || '').trim();
    if (!content) {
      setError('Comment cannot be empty.');
      return;
    }

    try {
      await updateIncidentComment(incidentId, commentId, { content });
      setEditingCommentByIncident((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
      await loadIncidentDetails(incidentId);
    } catch (err) {
      setError(err.message);
    }
  };

  const removeComment = async (incidentId, commentId) => {
    clearMessages();
    try {
      await deleteIncidentComment(incidentId, commentId);
      await loadIncidentDetails(incidentId);
    } catch (err) {
      setError(err.message);
    }
  };

  const assignToTechnician = async (incidentId) => {
    clearMessages();
    const technicianId = incidentAction[incidentId]?.technicianId;
    if (!technicianId) {
      setError('Select a technician first.');
      return;
    }
    try {
      await assignIncident(incidentId, { technicianId: Number(technicianId) });
      setInfo('Technician assigned.');
      await loadIncidents();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateStatus = async (incidentId) => {
    clearMessages();
    const payload = incidentAction[incidentId];
    if (!payload?.status) {
      setError('Select a status.');
      return;
    }

    try {
      await updateIncidentStatus(incidentId, {
        status: payload.status,
        resolutionNote: payload.resolutionNote || '',
      });
      setInfo('Incident updated.');
      await loadIncidents();
    } catch (err) {
      setError(err.message);
    }
  };

  const readNotification = async (id) => {
    clearMessages();
    try {
      await markNotificationRead(id);
      await loadNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const authCard = (
    <div className="auth-shell">
      <div className="brand-card">
        <h1>CampusX</h1>
        <p className="slogan">Experience the future of education.</p>
        <p>
          Unified facilities, bookings, incident management, notifications, and role-based operations
          for modern smart campuses.
        </p>
        <div className="brand-tags">
          <span>Facilities</span>
          <span>Bookings</span>
          <span>Incidents</span>
          <span>Role Security</span>
        </div>
        <a
          className="oauth-btn"
          href={`http://${window.location.hostname || 'localhost'}:8082/oauth2/authorization/google`}
        >
          Continue with Google OAuth
        </a>
      </div>

      <div className="auth-box">
        <div className="auth-switch">
          <button
            className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setMode('register')}
            type="button"
          >
            Register
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={onLogin}>
            <label>Email</label>
            <input className="input" type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              required
            />
            <label>Password</label>
            <input className="input" type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={onRegister}>
            <label>Full Name</label>
            <input className="input" value={registerForm.fullName}
              onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
              required
            />
            <label>Email</label>
            <input className="input" type="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              required
            />
            <label>Password</label>
            <input className="input" type="password"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
              required
            />
            <label>Role</label>
            <select className="input" value={registerForm.role}
              onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  if (!token) {
    return (
      <main className="auth-wrapper">
        {error && <div className="alert error toast"><AlertCircle size={18}/> {error}</div>}
        {info && <div className="alert success toast"><CheckCircle size={18}/> {info}</div>}
        {authCard}
      </main>
    );
  }

  
  const getTabIcon = (t) => {
    switch (t) {
      case 'Facilities': return <Building2 size={18} />;
      case 'Bookings': return <CalIcon size={18} />;
      case 'Incidents': return <AlertTriangle size={18} />;
      case 'Notifications': return <Bell size={18} />;
      case 'Admin': return <Shield size={18} />;
      default: return <LayoutDashboard size={18} />;
    }
  };


  return (
    <div className="layout-container">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <LayoutDashboard size={24} />
          <h2>CampusX</h2>
        </div>
        <nav className="sidebar-nav">
          {visibleTabs.map((item) => (
            <button
              key={item}
              className={`nav-item ${tab === item ? 'active' : ''}`}
              onClick={() => { setTab(item); setSidebarOpen(false); }}
              type="button"
            >
              <div className="nav-item-content">
                {getTabIcon(item)}
                {item}
              </div>
              {item === 'Notifications' && unread > 0 ? (
                <span className="badge badge-red">{unread}</span>
              ) : null}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn btn-ghost d-sm-block" style={{ display: typeof window !== 'undefined' && window.innerWidth <= 768 ? 'block' : 'none'}} onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h3 style={{ margin: 0, fontWeight: 600 }}>{tab}</h3>
          </div>
          <div className="topbar-right">
            <button onClick={loadAll} className="btn btn-ghost" type="button" title="Refresh">
              <RefreshCw size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--border-color)' }}>
              <span className="badge badge-indigo">{user?.role || '-'}</span>
              <button onClick={onLogout} className="btn btn-ghost" style={{color: 'var(--danger)'}} type="button">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="page-content-scroll">
          {error && <div className="alert error toast"><AlertCircle size={18}/> {error}</div>}
          {info && <div className="alert success toast"><CheckCircle size={18}/> {info}</div>}

          {/* Quick Analytics Strip directly above tabs content */}
          {tab === 'Facilities' && (
             <section className="analytics-grid">
               {dashboardStats.map((item) => (
                 <article className="card analytic-card" key={item.label}>
                   <p className="analytic-title">{item.label}</p>
                   <div className="analytic-value">{item.value}</div>
                   <span className="analytic-hint">{item.hint}</span>
                 </article>
               ))}
             </section>
          )}



      {tab === 'Facilities' && (
        <section className="panel-grid">
          <article className="panel">
            <h2>Facilities Catalogue</h2>
            <div className="row facility-filter-row">
              <input className="input" placeholder="Search by name, type, location"
                value={facilityFilters.q}
                onChange={(e) => setFacilityFilters({ ...facilityFilters, q: e.target.value })}
              />
              <input className="input" placeholder="Type"
                value={facilityFilters.type}
                onChange={(e) => setFacilityFilters({ ...facilityFilters, type: e.target.value })}
              />
              <input className="input" placeholder="Location"
                value={facilityFilters.location}
                onChange={(e) => setFacilityFilters({ ...facilityFilters, location: e.target.value })}
              />
              <input className="input" type="number"
                min="0"
                placeholder="Min Capacity"
                value={facilityFilters.capacityMin}
                onChange={(e) => setFacilityFilters({ ...facilityFilters, capacityMin: e.target.value })}
              />
              <input className="input" type="number"
                min="0"
                placeholder="Max Capacity"
                value={facilityFilters.capacityMax}
                onChange={(e) => setFacilityFilters({ ...facilityFilters, capacityMax: e.target.value })}
              />
              <button className="btn btn-ghost" onClick={() => loadFacilities(facilityFilters)} type="button">
                Search
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  const reset = { q: '', type: '', location: '', capacityMin: '', capacityMax: '' };
                  setFacilityFilters(reset);
                  loadFacilities(reset);
                }}
              >
                Reset
              </button>
            </div>
            <div className="card-list">
              {facilities.length === 0 ? (
                <Empty text="No facilities found." />
              ) : (
                facilities.map((f) => (
                  <div className={`card ${isFacilityBookableByStatus(f.status) ? 'tone-fresh' : 'tone-alert'}`} key={f.id}>
                    <div className="card-header">
                      <h3>{f.name}</h3>
                      <span className={`status ${facilityStatusBadge(f.status).cls}`}>
                        {facilityStatusBadge(f.status).text}
                      </span>
                    </div>
                    <p>{f.description || 'No description provided.'}</p>
                    <div className="meta">
                      <span>{f.type}</span>
                      <span>{f.location}</span>
                      <span>Cap: {f.capacity}</span>
                      <span>Status: {f.status}</span>
                      <span>Hours: {f.operatingHours || `${f.openingTime}-${f.closingTime}`}</span>
                      <span>
                        {f.openingTime} - {f.closingTime}
                      </span>
                    </div>
                    {isAdmin && (
                      <div className="row facility-actions">
                        <button className="btn btn-ghost" type="button" onClick={() => startEditFacility(f)}>
                          Edit
                        </button>
                        <button className="danger" type="button" onClick={() => removeFacility(f.id)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </article>

          {isAdmin && (
            <article className="panel">
              <h2>{editingFacilityId ? 'Edit Facility' : 'Add Facility'}</h2>
              <form onSubmit={submitFacility} className="form-grid">
                <input className="input" placeholder="Facility Name"
                  value={facilityForm.name}
                  onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                  required
                />
                <input className="input" placeholder="Type"
                  value={facilityForm.type}
                  onChange={(e) => setFacilityForm({ ...facilityForm, type: e.target.value })}
                  required
                />
                <input className="input" placeholder="Location"
                  value={facilityForm.location}
                  onChange={(e) => setFacilityForm({ ...facilityForm, location: e.target.value })}
                  required
                />
                <input className="input" type="number"
                  min="1"
                  placeholder="Capacity"
                  value={facilityForm.capacity}
                  onChange={(e) => setFacilityForm({ ...facilityForm, capacity: e.target.value })}
                  required
                />
                <input className="input" placeholder="Opening Time (HH:mm)"
                  value={facilityForm.openingTime}
                  onChange={(e) => setFacilityForm({ ...facilityForm, openingTime: e.target.value })}
                  required
                />
                <input className="input" placeholder="Closing Time (HH:mm)"
                  value={facilityForm.closingTime}
                  onChange={(e) => setFacilityForm({ ...facilityForm, closingTime: e.target.value })}
                  required
                />
                <input className="input" placeholder="Operating Hours (e.g. 08:00-20:00)"
                  value={facilityForm.operatingHours}
                  onChange={(e) => setFacilityForm({ ...facilityForm, operatingHours: e.target.value })}
                  required
                />
                <select className="input" value={facilityForm.status}
                  onChange={(e) => setFacilityForm({ ...facilityForm, status: e.target.value })}
                  required
                >
                  <option value="ACTIVE">AVAILABLE</option>
                  <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                  <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                </select>
                <textarea className="input" placeholder="Description"
                  value={facilityForm.description}
                  onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })}
                />
                <small>
                  Booking availability is controlled by status. `AVAILABLE` allows bookings; `UNDER_MAINTENANCE` and
                  `OUT_OF_SERVICE` block bookings.
                </small>
                <button className="btn btn-primary" type="submit">
                  {editingFacilityId ? 'Update Facility' : 'Save Facility'}
                </button>
                {editingFacilityId && (
                  <button className="btn btn-ghost" type="button" onClick={resetFacilityForm}>
                    Cancel Edit
                  </button>
                )}
              </form>
            </article>
          )}
        </section>
      )}

      {tab === 'Bookings' && (
        <section className="panel-grid">
          <article className="panel">
            <h2>Create Booking</h2>
            <form onSubmit={submitBooking} className="form-grid">
              <select className="input" value={bookingForm.facilityId}
                onChange={(e) => setBookingForm({ ...bookingForm, facilityId: e.target.value })}
                required
              >
                <option value="">Choose Facility</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.location})
                  </option>
                ))}
              </select>
              <label>Start Time</label>
              <input className="input" type="time"
                value={bookingForm.startTime}
                onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                min={selectedBookingFacility?.openingTime || undefined}
                max={selectedBookingFacility?.closingTime || undefined}
                disabled={!bookingForm.facilityId}
                required
              />
              <label>End Time</label>
              <input className="input" type="time"
                value={bookingForm.endTime}
                onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                min={selectedBookingFacility?.openingTime || undefined}
                max={selectedBookingFacility?.closingTime || undefined}
                disabled={!bookingForm.facilityId}
                required
              />
              <label>Booking Date</label>
              <input className="input" type="date"
                value={bookingForm.bookingDate}
                onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                min={todayDateValue()}
                required
              />
              <label>Expected Attendees</label>
              <input className="input" type="number"
                min="1"
                value={bookingForm.expectedAttendees}
                onChange={(e) => setBookingForm({ ...bookingForm, expectedAttendees: e.target.value })}
                required
              />
              {selectedBookingFacility ? (
                <small>
                  This {selectedBookingFacility.type || 'facility'} can be used only from{' '}
                  {selectedBookingFacility.openingTime} to {selectedBookingFacility.closingTime}. Please choose a start/end
                  time within this range.
                </small>
              ) : null}
              <textarea className="input" placeholder="Purpose"
                value={bookingForm.purpose}
                onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                required
              />
              <button className="btn btn-primary" type="submit">
                Submit Booking
              </button>
            </form>
          </article>

          <article className="panel">
            <h2>My Bookings</h2>
            <div className="card-list">
              {bookings.length === 0 ? (
                <Empty text="No bookings yet." />
              ) : (
                bookings.map((b) => (
                  <div className={`card ${statusTone(b.status)}`} key={b.id}>
                    <div className="card-header">
                      <h3>{b.facility?.name}</h3>
                      <span className={`status ${b.status === 'APPROVED' ? 'ok' : b.status === 'PENDING' ? 'wait' : 'bad'}`}>
                        {b.status}
                      </span>
                    </div>
                    <p>{b.purpose}</p>
                    <div className="meta">
                      <span>Date: {b.bookingDate || '-'}</span>
                      <span>Start: {b.startTime || '-'}</span>
                      <span>End: {b.endTime || '-'}</span>
                    </div>
                    {b.decisionComment ? <small>Comment: {b.decisionComment}</small> : null}
                  </div>
                ))
              )}
            </div>
          </article>

          {isAdmin && (
            <article className="panel">
              <h2>Booking Moderation</h2>
              <div className="card-list">
                {allBookings.length === 0 ? (
                  <Empty text="No booking requests." />
                ) : (
                  allBookings.map((b) => (
                    <div className={`card ${statusTone(b.status)}`} key={b.id}>
                      <h3>
                        #{b.id} {b.facility?.name}
                      </h3>
                      <p>
                        By {b.user?.fullName} ({b.user?.email})
                      </p>
                      <div className="meta">
                        <span>Date: {b.bookingDate || '-'}</span>
                        <span>Start: {b.startTime || '-'}</span>
                        <span>End: {b.endTime || '-'}</span>
                      </div>
                      <input className="input" placeholder="Admin comment"
                        value={decisionForm[b.id] || ''}
                        onChange={(e) => setDecisionForm({ ...decisionForm, [b.id]: e.target.value })}
                      />
                      <div className="row">
                        <button className="btn btn-primary" type="button" onClick={() => decideBooking(b.id, 'APPROVED')}>
                          Approve
                        </button>
                        <button className="danger" type="button" onClick={() => decideBooking(b.id, 'REJECTED')}>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          )}
        </section>
      )}

      {tab === 'Incidents' && (
        <section className="panel-grid">
          <article className="panel">
            <h2>Report Incident</h2>
            <form onSubmit={submitIncident} className="form-grid">
              <input className="input" placeholder="Title"
                value={incidentForm.title}
                onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                required
              />
              <input className="input" placeholder="Location"
                value={incidentForm.location}
                onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                required
              />
              <select className="input" value={incidentForm.category}
                onChange={(e) => setIncidentForm({ ...incidentForm, category: e.target.value })}
              >
                <option value="ELECTRICAL">ELECTRICAL</option>
                <option value="NETWORK">NETWORK</option>
                <option value="PLUMBING">PLUMBING</option>
                <option value="HARDWARE">HARDWARE</option>
                <option value="SOFTWARE">SOFTWARE</option>
                <option value="OTHER">OTHER</option>
              </select>
              <select className="input" value={incidentForm.priority}
                onChange={(e) => setIncidentForm({ ...incidentForm, priority: e.target.value })}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
              <input className="input" type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).slice(0, 3);
                  setIncidentForm({ ...incidentForm, files });
                }}
              />
              <small>Upload up to 3 images (JPG, PNG, WEBP, max 5MB each).</small>
              <textarea className="input" placeholder="Description"
                value={incidentForm.description}
                onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                required
              />
              <button className="btn btn-primary" type="submit">
                Submit Ticket
              </button>
            </form>
          </article>

          <article className="panel">
            <h2>My Tickets</h2>
            <div className="card-list">
              {incidents.length === 0 ? (
                <Empty text="No tickets submitted." />
              ) : (
                incidents.map((i) => (
                  <div className={`card ${statusTone(i.status)}`} key={i.id}>
                    <div className="card-header">
                      <h3>#{i.id} {i.title}</h3>
                      <span className={`status ${i.status === 'RESOLVED' || i.status === 'CLOSED' ? 'ok' : 'wait'}`}>
                        {i.status}
                      </span>
                    </div>
                    <p>{i.description}</p>
                    <div className="meta">
                      <span>{i.priority}</span>
                      <span>{i.location}</span>
                      <span>Tech: {i.technician?.fullName || 'Unassigned'}</span>
                    </div>
                    {i.resolutionNote ? <small>Resolution: {i.resolutionNote}</small> : null}
                    <div className="incident-detail-actions">
                      <button className="btn btn-ghost" type="button" onClick={() => loadIncidentDetails(i.id)}>
                        Load Comments & Attachments
                      </button>
                    </div>

                    {attachmentsByIncident[i.id]?.length ? (
                      <div className="attachment-list">
                        {attachmentsByIncident[i.id].map((attachment) => (
                          <a
                            key={attachment.id}
                            href={`${process.env.REACT_APP_API_BASE?.replace('/api', '') || `http://${window.location.hostname || 'localhost'}:8082`}${attachment.fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="attachment-chip"
                          >
                            Attachment #{attachment.id}
                          </a>
                        ))}
                      </div>
                    ) : null}

                    <div className="comment-list">
                      {(commentsByIncident[i.id] || []).map((comment) => {
                        const isOwner = Number(comment.author?.id) === Number(user?.id);
                        const isEditing = editingCommentByIncident[comment.id] !== undefined;
                        return (
                          <div className="comment-item" key={comment.id}>
                            <strong>{comment.author?.fullName}</strong>
                            {isEditing ? (
                              <>
                                <textarea className="input" value={editingCommentByIncident[comment.id]}
                                  onChange={(e) =>
                                    setEditingCommentByIncident((prev) => ({
                                      ...prev,
                                      [comment.id]: e.target.value,
                                    }))
                                  }
                                />
                                <div className="row">
                                  <button className="btn btn-primary" type="button" onClick={() => saveEditedComment(i.id, comment.id)}>
                                    Save
                                  </button>
                                  <button
                                    className="btn btn-ghost"
                                    type="button"
                                    onClick={() =>
                                      setEditingCommentByIncident((prev) => {
                                        const next = { ...prev };
                                        delete next[comment.id];
                                        return next;
                                      })
                                    }
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </>
                            ) : (
                              <p>{comment.content}</p>
                            )}
                            <small>{formatDate(comment.createdAt)}</small>
                            {isOwner && !isEditing ? (
                              <div className="row">
                                <button
                                  className="btn btn-ghost"
                                  type="button"
                                  onClick={() =>
                                    setEditingCommentByIncident((prev) => ({
                                      ...prev,
                                      [comment.id]: comment.content,
                                    }))
                                  }
                                >
                                  Edit
                                </button>
                                <button className="danger" type="button" onClick={() => removeComment(i.id, comment.id)}>
                                  Delete
                                </button>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                    <div className="row">
                      <input className="input" placeholder="Add a comment"
                        value={commentDraftByIncident[i.id] || ''}
                        onChange={(e) =>
                          setCommentDraftByIncident((prev) => ({
                            ...prev,
                            [i.id]: e.target.value,
                          }))
                        }
                      />
                      <button className="btn btn-primary" type="button" onClick={() => submitIncidentComment(i.id)}>
                        Comment
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          {(isAdmin || isTech) && (
            <article className="panel">
              <h2>Technician Workspace</h2>
              <div className="card-list">
                {assignedIncidents.length === 0 ? (
                  <Empty text="No assigned incidents." />
                ) : (
                  assignedIncidents.map((i) => (
                    <div className={`card ${statusTone(i.status)}`} key={i.id}>
                      <h3>
                        #{i.id} {i.title}
                      </h3>
                      <p>{i.description}</p>
                      <div className="meta">
                        <span>{i.priority}</span>
                        <span>{i.location}</span>
                        <span>{i.status}</span>
                      </div>

                      {isAdmin && (
                        <div className="row">
                          <select className="input" value={incidentAction[i.id]?.technicianId || ''}
                            onChange={(e) =>
                              setIncidentAction({
                                ...incidentAction,
                                [i.id]: { ...incidentAction[i.id], technicianId: e.target.value },
                              })
                            }
                          >
                            <option value="">Assign technician</option>
                            {technicians.map((tech) => (
                              <option key={tech.id} value={tech.id}>
                                {tech.fullName}
                              </option>
                            ))}
                          </select>
                          <button className="btn btn-ghost" type="button" onClick={() => assignToTechnician(i.id)}>
                            Assign
                          </button>
                        </div>
                      )}

                      <select className="input" value={incidentAction[i.id]?.status || ''}
                        onChange={(e) =>
                          setIncidentAction({
                            ...incidentAction,
                            [i.id]: { ...incidentAction[i.id], status: e.target.value },
                          })
                        }
                      >
                        <option value="">Update Status</option>
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                      <input className="input" placeholder="Resolution note"
                        value={incidentAction[i.id]?.resolutionNote || ''}
                        onChange={(e) =>
                          setIncidentAction({
                            ...incidentAction,
                            [i.id]: { ...incidentAction[i.id], resolutionNote: e.target.value },
                          })
                        }
                      />
                      <button className="btn btn-primary" type="button" onClick={() => updateStatus(i.id)}>
                        Save Update
                      </button>
                    </div>
                  ))
                )}
              </div>
            </article>
          )}
        </section>
      )}

      {tab === 'Notifications' && (
        <section className="panel-grid single">
          <article className="panel">
            <h2>Notifications</h2>
            <div className="card-list">
              {notifications.length === 0 ? (
                <Empty text="No notifications." />
              ) : (
                notifications.map((n) => (
                  <div className={`card ${n.isRead ? 'tone-fresh' : 'tone-warm'}`} key={n.id}>
                    <div className="card-header">
                      <h3>{n.type}</h3>
                      <span className={`status ${n.isRead ? 'ok' : 'wait'}`}>{n.isRead ? 'Read' : 'Unread'}</span>
                    </div>
                    <p>{n.message}</p>
                    <div className="row">
                      <small>{formatDate(n.createdAt)}</small>
                      {!n.isRead ? (
                        <button className="btn btn-ghost" type="button" onClick={() => readNotification(n.id)}>
                          Mark Read
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      )}

      {tab === 'Admin' && isAdmin && (
        <section className="panel-grid single">
          <article className="panel">
            <h2>Admin Analytics</h2>
            <div className="admin-analytics-grid">
              {adminAnalytics.map((item) => (
                <div key={item.label} className="analytics-card">
                  <small>{item.label}</small>
                  <h3>{item.value}</h3>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h2>Incident SLA Timer (24h target)</h2>
            {incidentSlaTimers.length === 0 ? (
              <Empty text="No active incident SLA timers." />
            ) : (
              <div className="card-list">
                {incidentSlaTimers.map((item) => (
                  <div className={`card ${item.breached ? 'tone-alert' : 'tone-warm'}`} key={item.id}>
                    <div className="card-header">
                      <h3>
                        #{item.id} {item.title}
                      </h3>
                      <span className={`status ${item.breached ? 'bad' : 'wait'}`}>
                        {item.elapsedHours}h elapsed
                      </span>
                    </div>
                    <small>Status: {item.status}</small>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="panel">
            <h2>Role Management</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.active ? 'Active' : 'Inactive'}</td>
                      <td>{formatDate(u.createdAt)}</td>
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
    </div>
  );
}

export default App;
