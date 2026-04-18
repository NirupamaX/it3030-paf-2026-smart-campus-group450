import React from 'react';
import TimeSlot from './TimeSlot';
import './BookingSystem.css';

export default function CalendarGrid({ 
  hours, 
  existingBookings, 
  selectedSlots, 
  onSlotToggle 
}) {
  
  // Format standard hours list "08:00", "09:00"
  const generateTimeSlots = () => {
    return hours.map(hour => {
      // Check if this hour overlaps with any approved/pending booking
      const bookStatus = checkSlotStatus(hour, existingBookings);
      const isSelected = selectedSlots.includes(hour);
      const isConflict = false; // Realtime conflict might be handled parent level or here

      return (
        <div key={hour} className="time-row">
          <div className="time-label">{hour}</div>
          <div className="slots-container">
            {/* Split each hour into 1 slot for now. Could be 30m intervals */}
            <TimeSlot 
              time={hour}
              status={bookStatus}
              isSelected={isSelected}
              isConflict={isConflict}
              onSelect={() => onSlotToggle(hour)}
            />
          </div>
        </div>
      );
    });
  };

  const checkSlotStatus = (hour, bookings) => {
    // Basic check for time overlap
    // Assuming bookings have startTime e.g. "09:00" and endTime e.g. "11:00"
    for (let b of bookings) {
      if (b.status === 'CANCELLED' || b.status === 'REJECTED') continue;
      
      const st = parseInt(b.startTime.split(':')[0]);
      const et = parseInt(b.endTime.split(':')[0]);
      const current = parseInt(hour.split(':')[0]);
      
      if (current >= st && current < et) {
        return 'BOOKED';
      }
    }
    return 'AVAILABLE';
  };

  return (
    <div className="calendar-grid">
      <div className="calendar-grid-header">
        <div>Time</div>
        <div>Availability</div>
      </div>
      {generateTimeSlots()}
    </div>
  );
}
