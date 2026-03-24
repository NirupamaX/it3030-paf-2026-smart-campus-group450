import { useEffect, useMemo, useState } from 'react';
import { checkBookingAvailability, createBookingRequest, getFacilities } from './bookingApi';
import './booking.css';

function toInputDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function BookingForm({ resources = [], onCreated }) {
  const [facilities, setFacilities] = useState(resources);
  const [form, setForm] = useState({
    resourceId: '',
    bookingDate: toInputDate(new Date()),
    startTime: '09:00',
    endTime: '10:00',
    purpose: '',
    attendees: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availabilityMessage, setAvailabilityMessage] = useState('');

  useEffect(() => {
    if (resources.length > 0) {
      setFacilities(resources);
      return;
    }

    const loadFacilities = async () => {
      try {
        const list = await getFacilities();
        setFacilities(list);
      } catch (requestError) {
        setError(requestError.message);
      }
    };

    loadFacilities();
  }, [resources]);

  const validationError = useMemo(() => {
    if (!form.resourceId || !form.bookingDate || !form.startTime || !form.endTime || !form.purpose) {
      return 'All fields are required.';
    }
    if (form.endTime <= form.startTime) {
      return 'End time must be later than start time.';
    }
    if (Number(form.attendees) < 1) {
      return 'Expected attendees must be at least 1.';
    }
    return '';
  }, [form]);

  const canSubmit = useMemo(() => {
    return !validationError;
  }, [validationError]);

  const onChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (validationError) {
      setError(validationError);
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
        expectedAttendees: Number(form.attendees),
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

  const onCheckAvailability = async () => {
    setError('');
    setSuccess('');
    setAvailabilityMessage('');

    if (validationError) {
      setError(validationError);
      return;
    }

    setCheckingAvailability(true);
    try {
      const result = await checkBookingAvailability({
        resourceId: Number(form.resourceId),
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
      });
      setAvailabilityMessage(result.message || (result.available ? 'Slot available' : 'Slot unavailable'));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCheckingAvailability(false);
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
          {facilities.map((resource) => (
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
          <button type="button" className="btn-muted" onClick={onCheckAvailability} disabled={checkingAvailability}>
            {checkingAvailability ? 'Checking...' : 'Check Availability'}
          </button>
          <button type="submit" className="btn-primary" disabled={!canSubmit || submitting}>
            {submitting ? 'Submitting...' : 'Submit Booking'}
          </button>
        </div>
      </form>

      {validationError && <p className="message-error">{validationError}</p>}
      {error && <p className="message-error">{error}</p>}
      {success && <p className="message-success">{success}</p>}
      {availabilityMessage && <p className="message-success">{availabilityMessage}</p>}
    </section>
  );
}
