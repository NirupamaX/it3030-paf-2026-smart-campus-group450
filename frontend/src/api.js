const API_BASE =
  process.env.REACT_APP_API_BASE || `http://${window.location.hostname || 'localhost'}:8082/api`;

function getToken() {
  return localStorage.getItem('campusx_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(options.headers || {}),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Cannot connect to backend API. Make sure backend is running.');
  }

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (typeof data?.raw === 'string' ? data.raw.slice(0, 160) : null) ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export async function login(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function register(payload) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe() {
  return request('/auth/me');
}

export async function listFacilities(filters = {}) {
  const params = new URLSearchParams();

  if (filters.q) params.set('q', filters.q);
  if (filters.type) params.set('type', filters.type);
  if (filters.location) params.set('location', filters.location);
  if (Number.isFinite(filters.capacityMin)) params.set('capacityMin', String(filters.capacityMin));
  if (Number.isFinite(filters.capacityMax)) params.set('capacityMax', String(filters.capacityMax));

  const suffix = params.toString() ? `?${params.toString()}` : '';
  return request(`/facilities${suffix}`);
}

export async function createFacility(payload) {
  return request('/facilities', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateFacility(id, payload) {
  return request(`/facilities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteFacility(id) {
  return request(`/facilities/${id}`, {
    method: 'DELETE',
  });
}

export async function createBooking(payload) {
  return request('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listMyBookings() {
  return request('/bookings/mine');
}

export async function listAllBookings() {
  return request('/bookings');
}

export async function bookingDecision(id, payload) {
  return request(`/bookings/${id}/decision`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function createIncident(payload) {
  return request('/incidents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadIncidentImages(files = []) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  return request('/incidents/uploads', {
    method: 'POST',
    body: formData,
  });
}

export async function listMyIncidents() {
  return request('/incidents/mine');
}

export async function listAssignedIncidents() {
  return request('/incidents/assigned');
}

export async function updateIncidentStatus(id, payload) {
  return request(`/incidents/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function assignIncident(id, payload) {
  return request(`/incidents/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function listIncidentComments(id) {
  return request(`/incidents/${id}/comments`);
}

export async function addIncidentComment(id, payload) {
  return request(`/incidents/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateIncidentComment(id, commentId, payload) {
  return request(`/incidents/${id}/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteIncidentComment(id, commentId) {
  return request(`/incidents/${id}/comments/${commentId}`, {
    method: 'DELETE',
  });
}

export async function listIncidentAttachments(id) {
  return request(`/incidents/${id}/attachments`);
}

export async function listNotifications() {
  return request('/notifications');
}

export async function markNotificationRead(id) {
  return request(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function getUnreadCount() {
  return request('/notifications/unread-count');
}

export async function listUsers() {
  return request('/admin/users');
}

export async function listTechnicians() {
  return request('/admin/technicians');
}
