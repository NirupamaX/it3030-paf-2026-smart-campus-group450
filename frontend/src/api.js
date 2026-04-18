const API_BASE =
  process.env.REACT_APP_API_BASE || `http://${window.location.hostname || 'localhost'}:8082/api`;

function getToken() {
  return localStorage.getItem('campusx_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = { ...(options.headers || {}) };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error('Cannot connect to backend. Make sure the backend is running on port 8082.');
  }

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

  if (!response.ok) {
    const message =
      data?.message || data?.error ||
      (typeof data?.raw === 'string' ? data.raw.slice(0, 200) : null) ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (payload) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });

export const register = (payload) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });

export const getMe = () => request('/auth/me');

export const forgotPassword = (email) =>
  request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });

export const resetPassword = (payload) =>
  request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) });

export const sendOtp = (email) =>
  request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ email }) });

export const verifyOtp = (email, otp) =>
  request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) });

// ── Facilities ────────────────────────────────────────────────────────────────
export function listFacilities(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.type) params.set('type', filters.type);
  if (filters.location) params.set('location', filters.location);
  if (Number.isFinite(filters.capacityMin)) params.set('capacityMin', String(filters.capacityMin));
  if (Number.isFinite(filters.capacityMax)) params.set('capacityMax', String(filters.capacityMax));
  const qs = params.toString();
  return request(`/facilities${qs ? '?' + qs : ''}`);
}

export const createFacility = (payload) =>
  request('/facilities', { method: 'POST', body: JSON.stringify(payload) });

export const updateFacility = (id, payload) =>
  request(`/facilities/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteFacility = (id) =>
  request(`/facilities/${id}`, { method: 'DELETE' });

// ── Bookings ──────────────────────────────────────────────────────────────────
export const createBooking = (payload) =>
  request('/bookings', { method: 'POST', body: JSON.stringify(payload) });

export async function listMyBookings({ page = 0, size = 50 } = {}) {
  const data = await request(`/bookings/mine?page=${page}&size=${size}`);
  // backend returns PagedResponse { content, page, size, totalElements, totalPages, last }
  return Array.isArray(data) ? data : (data?.content ?? []);
}

export async function listAllBookings({ page = 0, size = 50, status, bookingDate } = {}) {
  const params = new URLSearchParams({ page, size });
  if (status) params.set('status', status);
  if (bookingDate) params.set('bookingDate', bookingDate);
  const data = await request(`/bookings?${params.toString()}`);
  return Array.isArray(data) ? data : (data?.content ?? []);
}

// Backend BookingDecisionRequest accepts { status, rejectionReason } OR aliases { decision, comment }
export const bookingDecision = (id, payload) =>
  request(`/bookings/${id}/decision`, { method: 'PATCH', body: JSON.stringify(payload) });

export const cancelBooking = (id) =>
  request(`/bookings/${id}`, { method: 'DELETE' });

export const checkAvailability = (params) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/bookings/availability?${qs}`);
};

// ── Incidents ─────────────────────────────────────────────────────────────────
export const createIncident = (payload) =>
  request('/incidents', { method: 'POST', body: JSON.stringify(payload) });

export async function uploadIncidentImages(files = []) {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  const data = await request('/incidents/uploads', { method: 'POST', body: formData });
  return data?.files ?? [];
}

export async function listMyIncidents({ page = 0, size = 50 } = {}) {
  const data = await request(`/incidents/mine?page=${page}&size=${size}`);
  return Array.isArray(data) ? data : (data?.content ?? []);
}

export async function listAllIncidents({ page = 0, size = 50 } = {}) {
  const data = await request(`/incidents?page=${page}&size=${size}`);
  return Array.isArray(data) ? data : (data?.content ?? []);
}

export async function listAssignedIncidents({ page = 0, size = 50 } = {}) {
  const data = await request(`/incidents/assigned?page=${page}&size=${size}`);
  return Array.isArray(data) ? data : (data?.content ?? []);
}

export const assignIncident = (id, payload) =>
  request(`/incidents/${id}/assign`, { method: 'PATCH', body: JSON.stringify(payload) });

export const updateIncidentStatus = (id, payload) =>
  request(`/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) });

export const listIncidentComments = (id) => request(`/incidents/${id}/comments`);

export const addIncidentComment = (id, payload) =>
  request(`/incidents/${id}/comments`, { method: 'POST', body: JSON.stringify(payload) });

export const updateIncidentComment = (id, commentId, payload) =>
  request(`/incidents/${id}/comments/${commentId}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteIncidentComment = (id, commentId) =>
  request(`/incidents/${id}/comments/${commentId}`, { method: 'DELETE' });

export const listIncidentAttachments = (id) => request(`/incidents/${id}/attachments`);

// ── Notifications ─────────────────────────────────────────────────────────────
export const listNotifications = () => request('/notifications');
export const getUnreadCount = () => request('/notifications/unread-count');
export const markNotificationRead = (id) =>
  request(`/notifications/${id}/read`, { method: 'PATCH' });

// ── Admin ─────────────────────────────────────────────────────────────────────
export const listUsers = () => request('/admin/users');
export const listTechnicians = () => request('/admin/technicians');
