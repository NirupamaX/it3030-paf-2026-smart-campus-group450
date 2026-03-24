import { useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { getAllBookings } from './bookingApi';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './booking.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function toDateTime(bookingDate, time) {
  return new Date(`${bookingDate}T${time}`);
}

export default function BookingCalendarView() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setError('');
      try {
        const data = await getAllBookings({ status: 'APPROVED' });
        setBookings(data);
      } catch (requestError) {
        setError(requestError.message);
      }
    };

    load();
  }, []);

  const events = useMemo(
    () =>
      bookings.map((booking) => ({
        id: booking.id,
        title: `${booking.facility?.name || `Resource ${booking.resourceId}`} - ${booking.purpose}`,
        start: toDateTime(booking.bookingDate, booking.startTime),
        end: toDateTime(booking.bookingDate, booking.endTime),
      })),
    [bookings]
  );

  return (
    <section className="booking-card">
      <h2>Approved Booking Calendar</h2>
      {error && <p className="message-error">{error}</p>}
      <div style={{ height: 520 }}>
        <Calendar localizer={localizer} events={events} startAccessor="start" endAccessor="end" />
      </div>
    </section>
  );
}
