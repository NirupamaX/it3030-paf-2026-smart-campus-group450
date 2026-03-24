import axios from 'axios';

const API_BASE =
  process.env.REACT_APP_API_BASE || `http://${window.location.hostname || 'localhost'}:8082/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campusx_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function normalizeError(error) {
  if (error.response?.data?.error) return error.response.data.error;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return 'Request failed.';
}

export async function createBookingRequest(payload) {
  try {
    const response = await api.post('/v1/bookings', payload);
    return response.data;
  } catch (error) {
    throw new Error(normalizeError(error));
  }
}

export async function getUserBookings(userId) {
  try {
    const response = await api.get(`/v1/bookings/user/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(normalizeError(error));
  }
}

export async function getAllBookings(filters = {}) {
  try {
    const response = await api.get('/v1/bookings', { params: filters });
    return response.data;
  } catch (error) {
    throw new Error(normalizeError(error));
  }
}

export async function updateBookingStatus(id, payload) {
  try {
    const response = await api.patch(`/v1/bookings/${id}/status`, payload);
    return response.data;
  } catch (error) {
    throw new Error(normalizeError(error));
  }
}

export async function cancelBooking(id) {
  try {
    await api.delete(`/v1/bookings/${id}`);
    return true;
  } catch (error) {
    throw new Error(normalizeError(error));
  }
}
