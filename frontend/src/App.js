import BookingSystem from './components/BookingSystem/BookingSystem';
import './App.css';
import {
  LayoutDashboard,
  Building2,
  Calendar as CalIcon,
  AlertTriangle,
  Bell,
  Shield,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Menu,
} from 'lucide-react';

import LoginPage from './components/LoginPage/LoginPage';
import { useEffect, useMemo, useState } from 'react';
import {
  assignIncident,
  bookingDecision,
  createBooking,
  deleteFacility,
  createFacility,
  createIncident,
  getMe,
  getUnreadCount,
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
  updateIncidentStatus,
  updateFacility,
} from './api';

const ROLES = ['STUDENT', 'TECHNICIAN', 'ADMIN'];
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
  if (['APPROVED', 'RESOLVED', 'CLOSED', 'READ', 'AVAILABLE', 'ACTIVE'].includes(status)) {
    return 'tone-fresh';
  }
  if (['REJECTED', 'UNAVAILABLE', 'CRITICAL', 'INACTIVE', 'OUT_OF_SERVICE'].includes(status)) {
    return 'tone-alert';
  }
  return 'tone-warm';
}

function isFacilityBookableByStatus(status) {
  return status === 'AVAILABLE' || status === 'ACTIVE';
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
  const [tab, setTab] = useState('Facilities');
  const [token, setToken] = useState(localStorage.getItem('campusx_token'));
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [facilities, setFacilities] = useState([]);
  const [facilitySearch, setFacilitySearch] = useState('');
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [assignedIncidents, setAssignedIncidents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [users, setUsers] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'STUDENT',
  });

  const [facilityForm, setFacilityForm] = useState({
    name: '',
    type: '',
    location: '',
    capacity: 1,
    description: '',
    available: true,
    status: 'AVAILABLE',
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
    category: 'OTHER',
    priority: 'MEDIUM',
    imageUrl: '',
  });

  const [incidentAction, setIncidentAction] = useState({});

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

  const loadFacilities = async (search = '') => {
    const data = await listFacilities({ q: search });
    setFacilities(data);
  };

  const loadBookings = async () => {
    try {
      const mine = await listMyBookings();
      setBookings(mine);
    } catch (e) {}

    try {
      const all = await listAllBookings();
      setAllBookings(all);
    } catch (e) {
      if (isAdmin) console.error('Error loading all bookings', e);
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
      const me = await getMe();
      setUser(me);

      await loadFacilities(facilitySearch);
      await loadBookings();
      await loadIncidents();
      await loadNotifications();

      if (me?.role === 'ADMIN') {
        const [allUsers, techs] = await Promise.all([listUsers(), listTechnicians()]);
        setUsers(allUsers);
        setTechnicians(techs);
      } else {
        setUsers([]);
        setTechnicians([]);
      }
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

  const resetFacilityForm = () => {
    setFacilityForm({
      name: '',
      type: '',
      location: '',
      capacity: 1,
      description: '',
      available: true,
      status: 'AVAILABLE',
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
      status: facility.status || 'AVAILABLE',
      openingTime: facility.openingTime || '08:00',
      closingTime: facility.closingTime || '20:00',
    });
  };

  const submitFacility = async (e) => {
    e.preventDefault();
    clearMessages();

    try {
      const start = facilityForm.openingTime;
      const end = facilityForm.closingTime;

      if (!facilityForm.name.trim() || !facilityForm.type.trim() || !facilityForm.location.trim()) {
        setError('Name, type, and location are required.');
        return;
      }

      if (Number(facilityForm.capacity) <= 0) {
        setError('Capacity must be greater than 0.');
        return;
      }

      if (!start || !end || start >= end) {
        setError('Opening time must be before closing time.');
        return;
      }

      const payload = {
        name: facilityForm.name.trim(),
        type: facilityForm.type.trim(),
        location: facilityForm.location.trim(),
        capacity: Number(facilityForm.capacity),
        description: facilityForm.description.trim(),
        available: facilityForm.status === 'AVAILABLE',
        status: facilityForm.status,
        openingTime: facilityForm.openingTime,
        closingTime: facilityForm.closingTime,
      };

      if (editingFacilityId) {
        await updateFacility(editingFacilityId, payload);
        setInfo('Facility updated successfully.');
      } else {
        await createFacility(payload);
        setInfo('Facility added successfully.');
      }

      resetFacilityForm();
      await loadFacilities(facilitySearch);
    } catch (err) {
      setError(err.message);
    }
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

      await loadFacilities(facilitySearch);
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

  const submitIncident = async (e) => {
    e.preventDefault();
    clearMessages();

    try {
      await createIncident(incidentForm);
      setInfo('Incident reported.');
      setIncidentForm({
        title: '',
        description: '',
        location: '',
        category: 'OTHER',
        priority: 'MEDIUM',
        imageUrl: '',
      });
      await loadIncidents();
      await loadNotifications();
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
    <LoginPage
      mode={mode}
      setMode={setMode}
      loginForm={loginForm}
      setLoginForm={setLoginForm}
      onLogin={onLogin}
      registerForm={registerForm}
      setRegisterForm={setRegisterForm}
      onRegister={onRegister}
      loading={loading}
      ROLES={ROLES}
    />
  );

  if (!token) {
    return (
      <div className="login-root">
        {error ? <div className="alert error toast">{error}</div> : null}
        {info ? <div className="alert success toast">{info}</div> : null}
        {authCard}
      </div>
    );
  }

  const getTabIcon = (t) => {
    switch (t) {
      case 'Facilities':
        return <Building2 size={18} />;
      case 'Bookings':
        return <CalIcon size={18} />;
      case 'Incidents':
        return <AlertTriangle size={18} />;
      case 'Notifications':
        return <Bell size={18} />;
      case 'Admin':
        return <Shield size={18} />;
      default:
        return <LayoutDashboard size={18} />;
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
              onClick={() => {
                setTab(item);
                setSidebarOpen(false);
              }}
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
            <button
              className="btn btn-ghost d-sm-block"
              style={{
                display:
                  typeof window !== 'undefined' && window.innerWidth <= 768 ? 'block' : 'none',
              }}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h3 style={{ margin: 0, fontWeight: 600 }}>{tab}</h3>
          </div>

          <div className="topbar-right">
            <button onClick={loadAll} className="ghost" type="button" title="Refresh">
              <RefreshCw size={18} />
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingLeft: '8px',
                borderLeft: '1px solid var(--border-color)',
              }}
            >
              <span className="badge badge-indigo">{user?.role || '-'}</span>
              <button
                onClick={onLogout}
                className="ghost"
                style={{ color: 'var(--danger)' }}
                type="button"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="page-content-scroll">
          {error && (
            <div className="alert error">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {info && (
            <div className="alert success">
              <CheckCircle size={18} /> {info}
            </div>
          )}

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

                <div className="row">
                  <input
                    className="input"
                    placeholder="Search by name, type, location"
                    value={facilitySearch}
                    onChange={(e) => setFacilitySearch(e.target.value)}
                  />
                  <button className="ghost" onClick={() => loadFacilities(facilitySearch)} type="button">
                    Search
                  </button>
                </div>

                <div className="card-list">
                  {facilities.length === 0 ? (
                    <Empty text="No facilities found." />
                  ) : (
                    facilities.map((f) => (
                      <div
                        className={`card ${
                          isFacilityBookableByStatus(f.status) ? 'tone-fresh' : 'tone-alert'
                        }`}
                        key={f.id}
                      >
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
                            <button className="ghost" type="button" onClick={() => startEditFacility(f)}>
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
                    <input
                      className="input"
                      placeholder="Facility Name"
                      value={facilityForm.name}
                      onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                      required
                    />

                    <input
                      className="input"
                      placeholder="Type"
                      value={facilityForm.type}
                      onChange={(e) => setFacilityForm({ ...facilityForm, type: e.target.value })}
                      required
                    />

                    <input
                      className="input"
                      placeholder="Location"
                      value={facilityForm.location}
                      onChange={(e) => setFacilityForm({ ...facilityForm, location: e.target.value })}
                      required
                    />

                    <input
                      className="input"
                      type="number"
                      min="1"
                      placeholder="Capacity"
                      value={facilityForm.capacity}
                      onChange={(e) => setFacilityForm({ ...facilityForm, capacity: e.target.value })}
                      required
                    />

                    <input
                      className="input"
                      type="time"
                      value={facilityForm.openingTime}
                      onChange={(e) => setFacilityForm({ ...facilityForm, openingTime: e.target.value })}
                      required
                    />

                    <input
                      className="input"
                      type="time"
                      value={facilityForm.closingTime}
                      onChange={(e) => setFacilityForm({ ...facilityForm, closingTime: e.target.value })}
                      required
                    />

                    <select
                      className="input"
                      value={facilityForm.status}
                      onChange={(e) => setFacilityForm({ ...facilityForm, status: e.target.value })}
                      required
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                      <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                    </select>

                    <textarea
                      className="input"
                      placeholder="Description"
                      value={facilityForm.description}
                      onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })}
                    />

                    <small>
                      Booking availability depends on facility status. AVAILABLE allows bookings, while
                      UNDER_MAINTENANCE and OUT_OF_SERVICE block bookings.
                    </small>

                    <button className="primary" type="submit">
                      {editingFacilityId ? 'Update Facility' : 'Save Facility'}
                    </button>

                    {editingFacilityId && (
                      <button className="ghost" type="button" onClick={resetFacilityForm}>
                        Cancel Edit
                      </button>
                    )}
                  </form>
                </article>
              )}
            </section>
          )}

          {tab === 'Bookings' && (
            <div className="fade-in">
              <BookingSystem
                facilities={facilities}
                userBookings={bookings}
                allBookings={allBookings}
                isAdmin={isAdmin}
                onSubmitBooking={async (params) => {
                  try {
                    await createBooking(params);
                    setInfo('Booking request created successfully.');
                    loadBookings();
                  } catch (err) {
                    setError(err.message);
                  }
                }}
                onApproveBooking={async (id) => {
                  try {
                    await bookingDecision(id, { decision: 'APPROVED', comment: '' });
                    loadBookings();
                  } catch (e) {
                    setError(e.message);
                  }
                }}
                onRejectBooking={async (id) => {
                  const reason = prompt('Reason for rejection:');
                  if (reason) {
                    try {
                      await bookingDecision(id, { decision: 'REJECTED', comment: reason });
                      loadBookings();
                    } catch (e) {
                      setError(e.message);
                    }
                  }
                }}
              />
            </div>
          )}

          {tab === 'Incidents' && (
            <section className="panel-grid">
              <article className="panel">
                <h2>Report Incident</h2>

                <form onSubmit={submitIncident} className="form-grid">
                  <input
                    className="input"
                    placeholder="Title"
                    value={incidentForm.title}
                    onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                    required
                  />

                  <input
                    className="input"
                    placeholder="Location"
                    value={incidentForm.location}
                    onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                    required
                  />

                  <select
                    className="input"
                    value={incidentForm.priority}
                    onChange={(e) => setIncidentForm({ ...incidentForm, priority: e.target.value })}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>

                  <select
                    className="input"
                    value={incidentForm.category}
                    onChange={(e) => setIncidentForm({ ...incidentForm, category: e.target.value })}
                  >
                    <option value="ELECTRICAL">ELECTRICAL</option>
                    <option value="NETWORK">NETWORK</option>
                    <option value="PLUMBING">PLUMBING</option>
                    <option value="HARDWARE">HARDWARE</option>
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="OTHER">OTHER</option>
                  </select>

                  <input
                    className="input"
                    placeholder="Image URL (optional)"
                    value={incidentForm.imageUrl}
                    onChange={(e) => setIncidentForm({ ...incidentForm, imageUrl: e.target.value })}
                  />

                  <textarea
                    className="input"
                    placeholder="Description"
                    value={incidentForm.description}
                    onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                    required
                  />

                  <button className="primary" type="submit">
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
                          <h3>
                            #{i.id} {i.title}
                          </h3>
                          <span
                            className={`status ${
                              i.status === 'RESOLVED' || i.status === 'CLOSED' ? 'ok' : 'wait'
                            }`}
                          >
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
                              <select
                                className="input"
                                value={incidentAction[i.id]?.technicianId || ''}
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

                              <button className="ghost" type="button" onClick={() => assignToTechnician(i.id)}>
                                Assign
                              </button>
                            </div>
                          )}

                          <select
                            className="input"
                            value={incidentAction[i.id]?.status || ''}
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

                          <input
                            className="input"
                            placeholder="Resolution note"
                            value={incidentAction[i.id]?.resolutionNote || ''}
                            onChange={(e) =>
                              setIncidentAction({
                                ...incidentAction,
                                [i.id]: {
                                  ...incidentAction[i.id],
                                  resolutionNote: e.target.value,
                                },
                              })
                            }
                          />

                          <button className="primary" type="button" onClick={() => updateStatus(i.id)}>
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
                          <span className={`status ${n.isRead ? 'ok' : 'wait'}`}>
                            {n.isRead ? 'Read' : 'Unread'}
                          </span>
                        </div>

                        <p>{n.message}</p>

                        <div className="row">
                          <small>{formatDate(n.createdAt)}</small>
                          {!n.isRead ? (
                            <button className="ghost" type="button" onClick={() => readNotification(n.id)}>
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