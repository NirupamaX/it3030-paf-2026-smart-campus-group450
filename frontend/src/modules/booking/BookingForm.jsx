import { useMemo, useState } from 'react';
import { createBookingRequest } from './bookingApi';
import './booking.css';

function toInputDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function BookingForm({ resources = [], onCreated }) {
  const [form, setForm] = useState({
    resourceId: '',
    bookingDate: toInputDate(new Date()),
    startTime: '09:00',
    endTime: '10:00',
    purpose: '',
    attendees: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canSubmit = useMemo(() => {
    if (!form.resourceId || !form.bookingDate || !form.startTime || !form.endTime || !form.purpose) {
      return false;
    }
    return form.endTime > form.startTime;
  }, [form]);

  const onChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.endTime <= form.startTime) {
      setError('End time must be later than start time.');
      return;
    }

    setSubmitting(true);
    try {
      await createBookingRequest({
        resourceId: Number(form.resourceId),
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose.trim(),
        attendees: Number(form.attendees),
      });

      setSuccess('Booking request submitted. Status is PENDING until reviewed by admin.');
      setForm((previous) => ({
        ...previous,
        purpose: '',
        attendees: 1,
      }));
      if (onCreated) {
        onCreated();
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="booking-card">
      <h2>Booking Request Form</h2>
      <form onSubmit={onSubmit} className="booking-grid">
        <select
          value={form.resourceId}
          onChange={(event) => onChange('resourceId', event.target.value)}
          required
        >
          <option value="">Select Resource</option>
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name} ({resource.location})
            </option>
          ))}
        </select>

        <input
          type="date"
          value={form.bookingDate}
          onChange={(event) => onChange('bookingDate', event.target.value)}
          required
        />

        <input
          type="time"
          value={form.startTime}
          onChange={(event) => onChange('startTime', event.target.value)}
          required
        />

        <input
          type="time"
          value={form.endTime}
          onChange={(event) => onChange('endTime', event.target.value)}
          required
        />

        <input
          type="number"
          min="1"
          value={form.attendees}
          onChange={(event) => onChange('attendees', event.target.value)}
          required
        />

        <textarea
          className="full"
          placeholder="Purpose of booking"
          value={form.purpose}
          onChange={(event) => onChange('purpose', event.target.value)}
          required
        />

        <div className="booking-actions full">
          <button type="submit" className="btn-primary" disabled={!canSubmit || submitting}>
            {submitting ? 'Submitting...' : 'Submit Booking'}
          </button>
        </div>
      </form>

      {error && <p className="message-error">{error}</p>}
      {success && <p className="message-success">{success}</p>}
    </section>
  );
}
