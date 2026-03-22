import './App.css';
import { useEffect, useMemo, useState } from 'react';
import {
  assignIncident,
  bookingDecision,
  createBooking,
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

function statusTone(status) {
  if (['APPROVED', 'RESOLVED', 'CLOSED', 'READ', 'AVAILABLE', 'ACTIVE'].includes(status)) return 'tone-fresh';
  if (['REJECTED', 'UNAVAILABLE', 'CRITICAL', 'INACTIVE'].includes(status)) return 'tone-alert';
  return 'tone-warm';
}

function App() {
  const [mode, setMode] = useState('login');
  const [tab, setTab] = useState('Facilities');
  const [token, setToken] = useState(localStorage.getItem('campusx_token'));
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

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
  const [registerForm, setRegisterForm] = useState({ fullName: '', email: '', password: '', role: 'STUDENT' });
  const [facilityForm, setFacilityForm] = useState({
    name: '',
    type: '',
    location: '',
    capacity: 1,
    description: '',
    available: true,
    openingTime: '08:00',
    closingTime: '20:00',
  });
  const [bookingForm, setBookingForm] = useState({ facilityId: '', startTime: '', endTime: '', purpose: '' });
  const [incidentForm, setIncidentForm] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'MEDIUM',
    imageUrl: '',
  });
  const [decisionForm, setDecisionForm] = useState({});
  const [incidentAction, setIncidentAction] = useState({});

  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isTech = role === 'TECHNICIAN';

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
    const data = await listFacilities(search);
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
      await loadFacilities(facilitySearch);
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
      await createFacility({ ...facilityForm, capacity: Number(facilityForm.capacity) });
      setInfo('Facility added.');
      setFacilityForm({
        name: '',
        type: '',
        location: '',
        capacity: 1,
        description: '',
        available: true,
        openingTime: '08:00',
        closingTime: '20:00',
      });
      await loadFacilities(facilitySearch);
    } catch (err) {
      setError(err.message);
    }
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await createBooking({
        facilityId: Number(bookingForm.facilityId),
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        purpose: bookingForm.purpose,
      });
      setInfo('Booking submitted.');
      setBookingForm({ facilityId: '', startTime: '', endTime: '', purpose: '' });
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
      await createIncident(incidentForm);
      setInfo('Incident reported.');
      setIncidentForm({ title: '', description: '', location: '', priority: 'MEDIUM', imageUrl: '' });
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
        <a className="oauth-btn" href="http://localhost:8080/oauth2/authorization/google">
          Continue with Google OAuth
        </a>
      </div>

      <div className="auth-card">
        <div className="auth-switch">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
            type="button"
          >
            Register
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={onLogin}>
            <label>Email</label>
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              required
            />
            <label>Password</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
            />
            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={onRegister}>
            <label>Full Name</label>
            <input
              value={registerForm.fullName}
              onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
              required
            />
            <label>Email</label>
            <input
              type="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              required
            />
            <label>Password</label>
            <input
              type="password"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
              required
            />
            <label>Role</label>
            <select
              value={registerForm.role}
              onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  if (!token) {
    return (
      <main className="app">
        {error ? <div className="alert error">{error}</div> : null}
        {info ? <div className="alert success">{info}</div> : null}
        {authCard}
      </main>
    );
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-copy">
          <h1>CampusX</h1>
          <p>Smart operations cockpit for your entire campus lifecycle.</p>
        </div>
        <div className="top-actions">
          <span className="role-pill">{user?.role || '-'}</span>
          <button onClick={loadAll} className="ghost" type="button">
            Refresh
          </button>
          <button onClick={onLogout} className="ghost" type="button">
            Logout
          </button>
        </div>
      </header>

      {error ? <div className="alert error">{error}</div> : null}
      {info ? <div className="alert success">{info}</div> : null}

      <section className="insight-strip">
        {dashboardStats.map((item) => (
          <article className="insight-card" key={item.label}>
            <p>{item.label}</p>
            <h2>{item.value}</h2>
            <small>{item.hint}</small>
          </article>
        ))}
      </section>

      <nav className="tabs">
        {visibleTabs.map((item) => (
          <button
            key={item}
            className={tab === item ? 'active' : ''}
            onClick={() => setTab(item)}
            type="button"
          >
            {item}
            {item === 'Notifications' ? <span className="badge">{unread}</span> : null}
          </button>
        ))}
      </nav>

      {tab === 'Facilities' && (
        <section className="panel-grid">
          <article className="panel">
            <h2>Facilities Catalogue</h2>
            <div className="row">
              <input
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
                  <div className={`card ${f.available ? 'tone-fresh' : 'tone-alert'}`} key={f.id}>
                    <div className="card-header">
                      <h3>{f.name}</h3>
                      <span className={f.available ? 'status ok' : 'status bad'}>
                        {f.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <p>{f.description || 'No description provided.'}</p>
                    <div className="meta">
                      <span>{f.type}</span>
                      <span>{f.location}</span>
                      <span>Cap: {f.capacity}</span>
                      <span>
                        {f.openingTime} - {f.closingTime}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          {isAdmin && (
            <article className="panel">
              <h2>Add Facility</h2>
              <form onSubmit={submitFacility} className="form-grid">
                <input
                  placeholder="Facility Name"
                  value={facilityForm.name}
                  onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                  required
                />
                <input
                  placeholder="Type"
                  value={facilityForm.type}
                  onChange={(e) => setFacilityForm({ ...facilityForm, type: e.target.value })}
                  required
                />
                <input
                  placeholder="Location"
                  value={facilityForm.location}
                  onChange={(e) => setFacilityForm({ ...facilityForm, location: e.target.value })}
                  required
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Capacity"
                  value={facilityForm.capacity}
                  onChange={(e) => setFacilityForm({ ...facilityForm, capacity: e.target.value })}
                  required
                />
                <input
                  placeholder="Opening Time (HH:mm)"
                  value={facilityForm.openingTime}
                  onChange={(e) => setFacilityForm({ ...facilityForm, openingTime: e.target.value })}
                  required
                />
                <input
                  placeholder="Closing Time (HH:mm)"
                  value={facilityForm.closingTime}
                  onChange={(e) => setFacilityForm({ ...facilityForm, closingTime: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Description"
                  value={facilityForm.description}
                  onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })}
                />
                <label className="check">
                  <input
                    type="checkbox"
                    checked={facilityForm.available}
                    onChange={(e) => setFacilityForm({ ...facilityForm, available: e.target.checked })}
                  />
                  Available for booking
                </label>
                <button className="primary" type="submit">
                  Save Facility
                </button>
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
              <select
                value={bookingForm.facilityId}
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
              <input
                type="datetime-local"
                value={bookingForm.startTime}
                onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                required
              />
              <label>End Time</label>
              <input
                type="datetime-local"
                value={bookingForm.endTime}
                onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                required
              />
              <textarea
                placeholder="Purpose"
                value={bookingForm.purpose}
                onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                required
              />
              <button className="primary" type="submit">
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
                      <span>{formatDate(b.startTime)}</span>
                      <span>{formatDate(b.endTime)}</span>
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
                        <span>{formatDate(b.startTime)}</span>
                        <span>{formatDate(b.endTime)}</span>
                      </div>
                      <input
                        placeholder="Admin comment"
                        value={decisionForm[b.id] || ''}
                        onChange={(e) => setDecisionForm({ ...decisionForm, [b.id]: e.target.value })}
                      />
                      <div className="row">
                        <button className="primary" type="button" onClick={() => decideBooking(b.id, 'APPROVED')}>
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
              <input
                placeholder="Title"
                value={incidentForm.title}
                onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                required
              />
              <input
                placeholder="Location"
                value={incidentForm.location}
                onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                required
              />
              <select
                value={incidentForm.priority}
                onChange={(e) => setIncidentForm({ ...incidentForm, priority: e.target.value })}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
              <input
                placeholder="Image URL (optional)"
                value={incidentForm.imageUrl}
                onChange={(e) => setIncidentForm({ ...incidentForm, imageUrl: e.target.value })}
              />
              <textarea
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
                        placeholder="Resolution note"
                        value={incidentAction[i.id]?.resolutionNote || ''}
                        onChange={(e) =>
                          setIncidentAction({
                            ...incidentAction,
                            [i.id]: { ...incidentAction[i.id], resolutionNote: e.target.value },
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
                      <span className={`status ${n.isRead ? 'ok' : 'wait'}`}>{n.isRead ? 'Read' : 'Unread'}</span>
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
    </main>
  );
}

export default App;
