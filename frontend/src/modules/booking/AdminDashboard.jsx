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
  const [reasons, setReasons] = useState({});
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

  const decide = async (id, status) => {
    setError('');
    if (status === 'REJECTED' && !reasons[id]?.trim()) {
      setError('Rejection reason is required.');
      return;
    }

    try {
      await updateBookingStatus(id, {
        status,
        rejectionReason: status === 'REJECTED' ? reasons[id] : null,
      });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
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
              <th>Rejection Reason</th>
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
                <td>
                  <input
                    type="text"
                    placeholder="Reason if rejecting"
                    value={reasons[booking.id] || ''}
                    onChange={(event) =>
                      setReasons((previous) => ({
                        ...previous,
                        [booking.id]: event.target.value,
                      }))
                    }
                    disabled={booking.status !== 'PENDING'}
                  />
                </td>
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
                        onClick={() => decide(booking.id, 'REJECTED')}
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
    </section>
  );
}
