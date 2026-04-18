import React, { useEffect, useState, useMemo } from 'react';
import CalendarGrid from './CalendarGrid';
import AdminDashboardUI from './AdminDashboardUI';
import { Calendar as CalendarIcon, Clock, MapPin, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import './BookingSystem.css';

export default function BookingSystem({
  facilities,
  userBookings,
  allBookings,
  isAdmin,
  onSubmitBooking,
  onApproveBooking,
  onRejectBooking
}) {
  const [view, setView] = useState('CREATE'); // 'CREATE', 'MY_BOOKINGS', 'ADMIN'
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  
  // Date selection
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  // Time slot selection array (like ["09:00", "10:00"])
  const [selectedSlots, setSelectedSlots] = useState([]);
  
  // Form fields
  const [purpose, setPurpose] = useState('');
  const [attendees, setAttendees] = useState(1);

  useEffect(() => {
    if (isAdmin) {
      setView((current) => (current === 'CREATE' ? 'ADMIN' : current));
      return;
    }

    setView((current) => (current === 'ADMIN' ? 'CREATE' : current));
  }, [isAdmin]);

  // Helper to get formatted next date
  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
    setSelectedSlots([]); // Reset slots on date change
  };

  const selectedFacility = facilities.find(f => f.id === Number(selectedFacilityId) || f.id === selectedFacilityId);

  // Default operating hours
  const startHour = selectedFacility ? parseInt(selectedFacility.openingTime?.split(':')[0] || '8') : 8;
  const endHour = selectedFacility ? parseInt(selectedFacility.closingTime?.split(':')[0] || '20') : 20;
  
  const hoursList = useMemo(() => {
    const list = [];
    for (let i = startHour; i < endHour; i++) {
      list.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return list;
  }, [startHour, endHour]);

  const bookingsForAvailability = useMemo(() => {
    if (isAdmin) {
      return allBookings;
    }

    return userBookings;
  }, [allBookings, isAdmin, userBookings]);

  // Filter bookings for the selected date and facility
  const relevantBookings = useMemo(() => {
    const selectedId = Number(selectedFacilityId);
    if (!selectedId) {
      return [];
    }

    // Use normalized facility/resource identifier from backend view payload.
    return bookingsForAvailability.filter((booking) => {
      const bookingFacilityId = Number(
        booking.resourceId ?? booking.facilityId ?? booking.facility?.id
      );
      return bookingFacilityId === selectedId && booking.bookingDate === selectedDate;
    });
  }, [bookingsForAvailability, selectedFacilityId, selectedDate]);

  const handleSlotToggle = (hour) => {
    // If selecting contiguous slots, or just single slot.
    // Let's implement simple multi-select contiguous blocks
    if (selectedSlots.includes(hour)) {
      setSelectedSlots(selectedSlots.filter(s => s !== hour));
    } else {
      // Just add it for now and sort
      const newSlots = [...selectedSlots, hour].sort();
      setSelectedSlots(newSlots);
    }
  };

  const getContinuousRange = () => {
    if (selectedSlots.length === 0) return null;
    const sorted = [...selectedSlots].sort();
    const st = sorted[0];
    const lastHour = parseInt(sorted[sorted.length-1].split(':')[0]);
    // The end time is the end of the last block
    const et = `${(lastHour + 1).toString().padStart(2, '0')}:00`;
    return { startTime: st, endTime: et };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const range = getContinuousRange();
    if (!range) return;

    if (!purpose.trim()) {
      alert("Please enter a purpose.");
      return;
    }

    try {
      await onSubmitBooking({
        resourceId: Number(selectedFacilityId),
        bookingDate: selectedDate,
        startTime: range.startTime,
        endTime: range.endTime,
        purpose: purpose.trim(),
        expectedAttendees: Number(attendees)
      });

      // Clear selection only after a successful booking request.
      setSelectedSlots([]);
      setPurpose('');
      setAttendees(1);
    } catch (submitError) {
      // Parent handles displaying the detailed error.
    }
  };

  const range = getContinuousRange();

  return (
    <div className="booking-system-container">
      <div className="booking-header">
        <h1>{isAdmin ? 'Resource & Booking Management' : 'Book a Resource'}</h1>
        
        <div className="booking-filters">
          <select 
            className="booking-filter-select"
            value={view}
            onChange={(e) => setView(e.target.value)}
          >
            <option value="CREATE">New Booking</option>
            <option value="MY_BOOKINGS">My Bookings</option>
            {isAdmin && <option value="ADMIN">Admin Approval Dashboard</option>}
          </select>
        </div>
      </div>

      {isAdmin && view === 'ADMIN' && (
        <p style={{ margin: 0, color: '#6b7280' }}>
          Approve or reject pending booking requests in this section.
        </p>
      )}

      {view === 'CREATE' && (
        <div className="booking-main-layout">
          {/* Left Canvas: Calendar visualizer */}
          <div className="calendar-section">
            <div className="calendar-header">
              <h2>Availability Map</h2>
              <div className="date-navigator">
                <button type="button" className="nav-btn" onClick={() => changeDate(-1)}><ChevronLeft size={18}/></button>
                <span className="current-date-display">{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}</span>
                <button type="button" className="nav-btn" onClick={() => changeDate(1)}><ChevronRight size={18}/></button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <select 
                className="booking-filter-select" 
                style={{width: '100%', padding: '12px'}}
                value={selectedFacilityId}
                onChange={(e) => { setSelectedFacilityId(e.target.value); setSelectedSlots([]); }}
              >
                <option value="">-- Choose a Facility to Book --</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.location}) - Capacity: {f.capacity}</option>
                ))}
              </select>
            </div>

            {selectedFacilityId ? (
              <CalendarGrid 
                hours={hoursList} 
                existingBookings={relevantBookings}
                selectedSlots={selectedSlots}
                onSlotToggle={handleSlotToggle}
              />
            ) : (
              <div style={{textAlign: 'center', color: '#6b7280', padding: '40px 0'}}>
                <Building2 size={48} style={{opacity: 0.3, margin: '0 auto 16px'}} />
                <p>Please select a facility to view availability</p>
              </div>
            )}
          </div>

          {/* Right Canvas: Form Control */}
          <div className="booking-panel">
            <div className="panel-header">
              <h3>Booking Request</h3>
              <p style={{color: '#6b7280', fontSize: '0.875rem', marginTop: '4px'}}>Select time slots from the calendar to begin.</p>
            </div>

            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="selection-summary">
                <div className="summary-item">
                  <MapPin className="summary-icon" size={16} /> 
                  <span>{selectedFacility ? selectedFacility.name : 'No facility selected'}</span>
                </div>
                <div className="summary-item">
                  <CalendarIcon className="summary-icon" size={16} />
                  <span>{selectedDate}</span>
                </div>
                <div className="summary-item">
                  <Clock className="summary-icon" size={16} />
                  <span>
                    {range ? `${range.startTime} - ${range.endTime}` : 'No time selected'}
                  </span>
                </div>
              </div>

              {selectedFacility && selectedSlots.length > 0 && selectedFacility.capacity < attendees && (
                 <div className="conflict-warning">
                   <strong>Capacity Exceeded</strong>
                   Maximum capacity for this facility is {selectedFacility.capacity}.
                 </div>
              )}

              <div className="input-group">
                <label>Purpose of Booking</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Project Meeting, Study Group" 
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  disabled={selectedSlots.length === 0}
                  required
                />
              </div>

              <div className="input-group">
                <label>Number of Attendees</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="1"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  disabled={selectedSlots.length === 0}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={selectedSlots.length === 0 || !selectedFacilityId || (selectedFacility && attendees > selectedFacility.capacity)}
              >
                Request Booking
              </button>
            </form>
          </div>
        </div>
      )}

      {view === 'MY_BOOKINGS' && (
        <AdminDashboardUI 
          bookings={userBookings} 
        />
      )}

      {view === 'ADMIN' && isAdmin && (
        <AdminDashboardUI 
          bookings={allBookings} 
          onApprove={onApproveBooking}
          onReject={onRejectBooking}
          defaultFilter="PENDING"
        />
      )}
    </div>
  );
}
