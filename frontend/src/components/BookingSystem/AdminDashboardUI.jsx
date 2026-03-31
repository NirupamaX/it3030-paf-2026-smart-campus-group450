import React, { useState } from 'react';
import BookingCard from './BookingCard';
import './BookingSystem.css';

export default function AdminDashboardUI({ bookings, onApprove, onReject }) {
  const [filter, setFilter] = useState('ALL');

  const filteredBookings = bookings.filter(b => {
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  return (
    <div>
      <div className="booking-filters" style={{marginBottom: '20px'}}>
        <select className="booking-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      
      {filteredBookings.length === 0 ? (
        <p style={{color: '#6b7280'}}>No bookings found for the selected filter.</p>
      ) : (
        <div className="admin-booking-grid">
          {filteredBookings.map(b => (
            <BookingCard 
              key={b.id} 
              booking={b} 
              onApprove={onApprove} 
              onReject={onReject} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
