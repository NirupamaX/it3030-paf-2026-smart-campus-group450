import React from 'react';
import './BookingSystem.css';

export default function TimeSlot({ 
  time, 
  status, 
  isSelected, 
  isConflict, 
  onSelect 
}) {
  let btnClass = 'time-slot';
  let titleText = 'Available';

  if (status === 'BOOKED') {
    btnClass += ' booked';
    titleText = 'Slot already booked';
  } else if (status === 'PENDING') {
    btnClass += ' pending';
    titleText = 'Slot pending approval';
  } else {
    btnClass += ' available';
  }

  if (isSelected) {
    btnClass += ' selected';
  }

  if (isConflict) {
    btnClass += ' conflict';
  }

  const handleClick = () => {
    if (status !== 'BOOKED') {
      onSelect(time);
    }
  };

  return (
    <button 
      type="button" 
      className={btnClass} 
      onClick={handleClick}
      title={titleText}
      disabled={status === 'BOOKED'}
    >
      {isSelected ? '✓' : ''}
    </button>
  );
}
