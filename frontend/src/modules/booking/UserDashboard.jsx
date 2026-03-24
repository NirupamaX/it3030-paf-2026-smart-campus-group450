import { useEffect, useState } from 'react';
import { cancelBooking, getUserBookings } from './bookingApi';
import './booking.css';

function statusClass(status) {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'approved') return 'status-badge status-approved';
  if (normalized === 'pending') return 'status-badge status-pending';
  return 'status-badge status-rejected';
}

export default function UserDashboard({ userId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUserBookings(userId);
      setBookings(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const onCancel = async (id) => {
    setError('');
    try {
      await cancelBooking(id);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className="booking-card">
      <h2>My Bookings</h2>
      {loading && <p>Loading bookings...</p>}
      {error && <p className="message-error">{error}</p>}

      {!loading && bookings.length === 0 && <p>No bookings found.</p>}

      {!loading && bookings.length > 0 && (
        <table className="booking-table">
          <thead>
            <tr>
              <th>Resource</th>
              <th>Date</th>
              <th>Time</th>
              <th>Purpose</th>
              <th>Attendees</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.facility?.name || booking.resourceId}</td>
                <td>{booking.bookingDate}</td>
                <td>
                  {booking.startTime} - {booking.endTime}
                </td>
                <td>{booking.purpose}</td>
                <td>{booking.attendees}</td>
                <td>
                  <span className={statusClass(booking.status)}>{booking.status}</span>
                </td>
                <td>
                  {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                    <button type="button" className="btn-muted" onClick={() => onCancel(booking.id)}>
                      Cancel
                    </button>
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
