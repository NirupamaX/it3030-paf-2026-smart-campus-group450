import React from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import StatusBadge from './StatusBadge';
import './BookingSystem.css';

export default function BookingCard({ booking, onApprove, onReject }) {
  return (
    <div className="admin-booking-card">
      <div className="admin-card-header">
        <div className="admin-card-title">{booking.purpose || 'No Purpose'}</div>
        <StatusBadge status={booking.status} />
      </div>
      
      <div className="admin-card-meta">
        <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><MapPin size={14}/> {booking.facilityName || `Facility #${booking.facilityId}`}</span>
        <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><Calendar size={14}/> {booking.bookingDate}</span>
        <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><Clock size={14}/> {booking.startTime} - {booking.endTime}</span>
        <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><Users size={14}/> Expected Attendees: {booking.expectedAttendees || 1}</span>
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
