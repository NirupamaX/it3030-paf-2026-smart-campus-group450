import { useState, useMemo } from 'react';
import { Calendar as CalIcon, Clock, MapPin, Building2, ChevronLeft, ChevronRight, CheckCircle, XCircle, XOctagon } from 'lucide-react';

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    APPROVED: { cls: 'status-approved', icon: <CheckCircle size={13}/>, label: 'Approved' },
    REJECTED: { cls: 'status-rejected', icon: <XOctagon size={13}/>, label: 'Rejected' },
    CANCELLED: { cls: 'status-cancelled', icon: <XCircle size={13}/>, label: 'Cancelled' },
  };
  const m = map[status?.toUpperCase()] || { cls: 'status-pending', icon: <Clock size={13}/>, label: 'Pending' };
  return <span className={`status-badge ${m.cls}`}>{m.icon} {m.label}</span>;
}

// ── TimeSlot ──────────────────────────────────────────────────────────────────
function TimeSlot({ time, status, isSelected, onSelect }) {
  const cls = `time-slot ${status === 'BOOKED' ? 'booked' : status === 'PENDING' ? 'pending' : 'available'}${isSelected ? ' selected' : ''}`;
  return (
    <button type="button" className={cls} disabled={status === 'BOOKED'}
      onClick={() => status !== 'BOOKED' && onSelect(time)}
      title={status === 'BOOKED' ? 'Already booked' : status === 'PENDING' ? 'Pending approval' : 'Available'}>
      {isSelected ? '✓' : ''}
    </button>
  );
}

// ── CalendarGrid ──────────────────────────────────────────────────────────────
function CalendarGrid({ hours, existingBookings, selectedSlots, onSlotToggle }) {
  const slotStatus = (hour) => {
    for (const b of existingBookings) {
      if (b.status === 'CANCELLED' || b.status === 'REJECTED') continue;
      const st = parseInt(b.startTime?.split(':')[0]);
      const et = parseInt(b.endTime?.split(':')[0]);
      const cur = parseInt(hour.split(':')[0]);
      if (cur >= st && cur < et) return b.status === 'APPROVED' ? 'BOOKED' : 'PENDING';
    }
    return 'AVAILABLE';
  };

  return (
    <div className="calendar-grid">
      <div className="calendar-grid-header"><div>Time</div><div>Availability</div></div>
      {hours.map(h => (
        <div key={h} className="time-row">
          <div className="time-label">{h}</div>
          <div className="slots-container">
            <TimeSlot time={h} status={slotStatus(h)} isSelected={selectedSlots.includes(h)} onSelect={onSlotToggle}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── BookingCard ───────────────────────────────────────────────────────────────
function BookingCard({ booking, onApprove, onReject }) {
  return (
    <div className="admin-booking-card">
      <div className="admin-card-header">
        <div className="admin-card-title">{booking.purpose || 'No Purpose'}</div>
        <StatusBadge status={booking.status}/>
      </div>
      <div className="admin-card-meta">
        <span><MapPin size={13}/> {booking.facility?.name || `Facility #${booking.resourceId}`}</span>
        <span><CalIcon size={13}/> {booking.bookingDate}</span>
        <span><Clock size={13}/> {booking.startTime} – {booking.endTime}</span>
        <span>👤 {booking.user?.fullName || '—'} · {booking.expectedAttendees} attendees</span>
        {booking.rejectionReason && <span style={{color:'#ef4444'}}>Reason: {booking.rejectionReason}</span>}
      </div>
      {booking.status === 'PENDING' && onApprove && onReject && (
        <div className="admin-card-actions">
          <button className="action-btn btn-approve" onClick={() => onApprove(booking.id)}>Approve</button>
          <button className="action-btn btn-reject" onClick={() => onReject(booking.id)}>Reject</button>
        </div>
      )}
    </div>
  );
}

// ── BookingDashboard ──────────────────────────────────────────────────────────
function BookingDashboard({ bookings, onApprove, onReject, onCancel, showActions }) {
  const [filter, setFilter] = useState('ALL');
  const filtered = bookings.filter(b => filter === 'ALL' || b.status === filter);

  return (
    <div>
      <div style={{marginBottom:'16px'}}>
        <select className="booking-filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          {['ALL','PENDING','APPROVED','REJECTED','CANCELLED'].map(s =>
            <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>)}
        </select>
      </div>
      {filtered.length === 0
        ? <p style={{color:'#6b7280'}}>No bookings found.</p>
        : <div className="admin-booking-grid">
            {filtered.map(b => (
              <div key={b.id}>
                <BookingCard booking={b} onApprove={showActions ? onApprove : null} onReject={showActions ? onReject : null}/>
                {onCancel && (b.status === 'PENDING' || b.status === 'APPROVED') && (
                  <button className="ghost" style={{width:'100%',marginTop:'8px',fontSize:'0.8rem'}}
                    onClick={() => onCancel(b.id)}>Cancel Booking</button>
                )}
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ── Main BookingSystem ────────────────────────────────────────────────────────
export default function BookingSystem({ facilities, userBookings, allBookings, isAdmin,
  onSubmitBooking, onApproveBooking, onRejectBooking, onCancelBooking }) {

  const [view, setView] = useState('CREATE');
  const [facilityId, setFacilityId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [purpose, setPurpose] = useState('');
  const [attendees, setAttendees] = useState(1);

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
    setSelectedSlots([]);
  };

  const facility = facilities.find(f => f.id === Number(facilityId) || f.id === facilityId);
  const startH = facility ? parseInt(facility.openingTime?.split(':')[0] || '8') : 8;
  const endH   = facility ? parseInt(facility.closingTime?.split(':')[0] || '20') : 20;

  const hours = useMemo(() => {
    const list = [];
    for (let i = startH; i < endH; i++) list.push(`${String(i).padStart(2,'0')}:00`);
    return list;
  }, [startH, endH]);

  const relevantBookings = useMemo(() =>
    allBookings.filter(b =>
      (b.resourceId === Number(facilityId) || b.facilityId === Number(facilityId)) &&
      b.bookingDate === selectedDate
    ), [allBookings, facilityId, selectedDate]);

  const toggleSlot = (h) => {
    setSelectedSlots(prev => prev.includes(h) ? prev.filter(s => s !== h) : [...prev, h].sort());
  };

  const getRange = () => {
    if (!selectedSlots.length) return null;
    const sorted = [...selectedSlots].sort();
    const lastH = parseInt(sorted[sorted.length - 1].split(':')[0]);
    return { startTime: sorted[0], endTime: `${String(lastH + 1).padStart(2,'0')}:00` };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const range = getRange();
    if (!range || !purpose.trim()) return;
    onSubmitBooking({ resourceId: Number(facilityId), bookingDate: selectedDate,
      startTime: range.startTime, endTime: range.endTime, purpose, expectedAttendees: parseInt(attendees) });
    setSelectedSlots([]); setPurpose(''); setAttendees(1);
  };

  const range = getRange();

  return (
    <div className="booking-system-container">
      <div className="booking-header">
        <h1>{isAdmin ? 'Booking Management' : 'Book a Resource'}</h1>
        <select className="booking-filter-select" value={view} onChange={e => setView(e.target.value)}>
          <option value="CREATE">New Booking</option>
          <option value="MY_BOOKINGS">My Bookings</option>
          {isAdmin && <option value="ADMIN">Admin Dashboard</option>}
        </select>
      </div>

      {view === 'CREATE' && (
        <div className="booking-main-layout">
          <div className="calendar-section">
            <div className="calendar-header">
              <h2>Availability</h2>
              <div className="date-navigator">
                <button type="button" className="nav-btn" onClick={() => changeDate(-1)}><ChevronLeft size={18}/></button>
                <span className="current-date-display">
                  {new Date(selectedDate).toLocaleDateString(undefined, {weekday:'short',month:'short',day:'numeric'})}
                </span>
                <button type="button" className="nav-btn" onClick={() => changeDate(1)}><ChevronRight size={18}/></button>
              </div>
            </div>
            <select className="booking-filter-select" style={{width:'100%',padding:'12px',marginBottom:'16px'}}
              value={facilityId} onChange={e => { setFacilityId(e.target.value); setSelectedSlots([]); }}>
              <option value="">— Select a facility —</option>
              {facilities.map(f => <option key={f.id} value={f.id}>{f.name} ({f.location}) · Cap: {f.capacity}</option>)}
            </select>
            {facilityId
              ? <CalendarGrid hours={hours} existingBookings={relevantBookings} selectedSlots={selectedSlots} onSlotToggle={toggleSlot}/>
              : <div style={{textAlign:'center',color:'#6b7280',padding:'40px 0'}}>
                  <Building2 size={48} style={{opacity:0.25,display:'block',margin:'0 auto 12px'}}/>
                  <p>Select a facility to view availability</p>
                </div>
            }
          </div>

          <div className="booking-panel">
            <div className="panel-header">
              <h3>Booking Request</h3>
              <p style={{color:'#6b7280',fontSize:'0.875rem',marginTop:'4px'}}>Click time slots on the calendar to select.</p>
            </div>
            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="selection-summary">
                <div className="summary-item"><MapPin className="summary-icon" size={15}/><span>{facility?.name || 'No facility'}</span></div>
                <div className="summary-item"><CalIcon className="summary-icon" size={15}/><span>{selectedDate}</span></div>
                <div className="summary-item"><Clock className="summary-icon" size={15}/><span>{range ? `${range.startTime} – ${range.endTime}` : 'No time selected'}</span></div>
              </div>
              {facility && attendees > facility.capacity && (
                <div className="conflict-warning">⚠ Exceeds capacity of {facility.capacity}</div>
              )}
              <div className="input-group">
                <label>Purpose</label>
                <input type="text" className="form-input" placeholder="e.g. Study group, Meeting"
                  value={purpose} onChange={e => setPurpose(e.target.value)}
                  disabled={!selectedSlots.length} required/>
              </div>
              <div className="input-group">
                <label>Attendees</label>
                <input type="number" className="form-input" min="1" value={attendees}
                  onChange={e => setAttendees(e.target.value)} disabled={!selectedSlots.length} required/>
              </div>
              <button type="submit" className="submit-btn"
                disabled={!selectedSlots.length || !facilityId || (facility && attendees > facility.capacity)}>
                Request Booking
              </button>
            </form>
          </div>
        </div>
      )}

      {view === 'MY_BOOKINGS' && (
        <BookingDashboard bookings={userBookings} onCancel={onCancelBooking} showActions={false}/>
      )}

      {view === 'ADMIN' && isAdmin && (
        <BookingDashboard bookings={allBookings} onApprove={onApproveBooking} onReject={onRejectBooking} showActions={true}/>
      )}
    </div>
  );
}
