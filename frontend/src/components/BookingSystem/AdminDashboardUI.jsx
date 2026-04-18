import React, { useState } from 'react';
import BookingCard from './BookingCard';
import './BookingSystem.css';

export default function AdminDashboardUI({ bookings, onApprove, onReject, defaultFilter = 'ALL' }) {
  const [filter, setFilter] = useState(defaultFilter);
  const isAdminApprovalView = typeof onApprove === 'function' && typeof onReject === 'function';

  const normalizeStatus = (status) => String(status || '').trim().toUpperCase();

  const pendingBookings = bookings.filter((booking) => normalizeStatus(booking.status) === 'PENDING');

  const filteredBookings = bookings.filter(b => {
    if (filter === 'ALL') return true;
    return normalizeStatus(b.status) === filter;
  });

  return (
    <div>
      {isAdminApprovalView && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Pending Approval Requests</h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Approve or reject booking requests that are waiting for admin decision.
          </p>

          {pendingBookings.length === 0 ? (
            <p style={{ color: '#6b7280', marginTop: '12px' }}>No pending booking requests right now.</p>
          ) : (
            <div className="admin-booking-grid" style={{ marginTop: '12px' }}>
              {pendingBookings.map((booking) => (
                <BookingCard
                  key={`pending-${booking.id}`}
                  booking={booking}
                  onApprove={onApprove}
                  onReject={onReject}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
