import React from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import StatusBadge from './StatusBadge';
import './BookingSystem.css';

export default function BookingCard({ booking, onApprove, onReject }) {
  const normalizedStatus = String(booking.status || '').trim().toUpperCase();

  const facilityName =
    booking.facility?.name ||
    booking.facilityName ||
    (booking.resourceId != null
      ? `Facility #${booking.resourceId}`
      : booking.facilityId != null
        ? `Facility #${booking.facilityId}`
        : 'Facility');

  return (
    <div className="admin-booking-card">
      <div className="admin-card-header">
        <div className="admin-card-title">{booking.purpose || 'No Purpose'}</div>
        <StatusBadge status={normalizedStatus || booking.status} />
      </div>
      
      <div className="admin-card-meta">
        <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><MapPin size={14}/> {facilityName}</span>
        <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><Calendar size={14}/> {booking.bookingDate}</span>
        <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><Clock size={14}/> {booking.startTime} - {booking.endTime}</span>
        <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><Users size={14}/> Expected Attendees: {booking.expectedAttendees || 1}</span>
      </div>

      {normalizedStatus === 'PENDING' && typeof onApprove === 'function' && typeof onReject === 'function' && (
        <div className="admin-card-actions">
          <button className="action-btn btn-approve" onClick={() => onApprove(booking.id)}>Approve</button>
          <button className="action-btn btn-reject" onClick={() => onReject(booking.id)}>Reject</button>
        </div>
      )}
    </div>
  );
}
