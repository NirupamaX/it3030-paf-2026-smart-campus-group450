import { useEffect, useMemo, useState } from 'react';
import { getAllBookings, updateBookingStatus } from './bookingApi';
import './booking.css';

const STATUS_OPTIONS = ['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

function statusClass(status) {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'approved') return 'status-badge status-approved';
  if (normalized === 'pending') return 'status-badge status-pending';
  return 'status-badge status-rejected';
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [filters, setFilters] = useState({ status: 'PENDING', bookingDate: '' });
  const [rejectModal, setRejectModal] = useState({ open: false, bookingId: null, reason: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const query = useMemo(() => {
    const payload = {};
    if (filters.status) payload.status = filters.status;
    if (filters.bookingDate) payload.bookingDate = filters.bookingDate;
    return payload;
  }, [filters]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllBookings(query);
      setBookings(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.status, query.bookingDate]);

  const decide = async (id, status, rejectionReason = null) => {
    setError('');

    try {
      await updateBookingStatus(id, {
        status,
        rejectionReason,
      });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const openRejectModal = (bookingId) => {
    setRejectModal({ open: true, bookingId, reason: '' });
  };

  const closeRejectModal = () => {
    setRejectModal({ open: false, bookingId: null, reason: '' });
  };

  const confirmReject = async () => {
    if (!rejectModal.reason.trim()) {
      setError('Rejection reason is required.');
      return;
    }

    await decide(rejectModal.bookingId, 'REJECTED', rejectModal.reason.trim());
    closeRejectModal();
  };

  return (
    <section className="booking-card">
      <h2>Admin Booking Moderation</h2>

      <div className="booking-toolbar">
        <select
          value={filters.status}
          onChange={(event) => setFilters((previous) => ({ ...previous, status: event.target.value }))}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option || 'ALL'} value={option}>
              {option || 'ALL'}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.bookingDate}
          onChange={(event) => setFilters((previous) => ({ ...previous, bookingDate: event.target.value }))}
        />

        <button type="button" className="btn-muted" onClick={() => setFilters({ status: 'PENDING', bookingDate: '' })}>
          Reset Filters
        </button>
      </div>

      {loading && <p>Loading booking requests...</p>}
      {error && <p className="message-error">{error}</p>}

      {!loading && bookings.length === 0 && <p>No booking requests found.</p>}

      {!loading && bookings.length > 0 && (
        <table className="booking-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Resource</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.id}</td>
                <td>{booking.user?.fullName || booking.userId}</td>
                <td>{booking.facility?.name || booking.resourceId}</td>
                <td>{booking.bookingDate}</td>
                <td>
                  {booking.startTime} - {booking.endTime}
                </td>
                <td>
                  <span className={statusClass(booking.status)}>{booking.status}</span>
                </td>
                <td>{booking.rejectionReason || '-'}</td>
                <td>
                  {booking.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => decide(booking.id, 'APPROVED')}
                      >
                        Approve
                      </button>{' '}
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => openRejectModal(booking.id)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {rejectModal.open && (
        <div className="modal-backdrop" role="presentation" onClick={closeRejectModal}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3>Reject Booking #{rejectModal.bookingId}</h3>
            <textarea
              placeholder="Enter rejection reason"
              value={rejectModal.reason}
              onChange={(event) => setRejectModal((previous) => ({ ...previous, reason: event.target.value }))}
            />
            <div className="modal-actions">
              <button type="button" className="btn-muted" onClick={closeRejectModal}>
                Cancel
              </button>
              <button type="button" className="btn-danger" onClick={confirmReject}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
