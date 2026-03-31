import React from 'react';
import { 
  CheckCircle, Clock, XCircle, XOctagon 
} from 'lucide-react';
import './BookingSystem.css';

export default function StatusBadge({ status }) {
  let mapping = {
    class: 'status-pending',
    icon: <Clock size={14} />,
    label: 'Pending'
  };

  switch(status?.toUpperCase()) {
    case 'APPROVED':
      mapping = { class: 'status-approved', icon: <CheckCircle size={14} />, label: 'Approved' };
      break;
    case 'REJECTED':
      mapping = { class: 'status-rejected', icon: <XOctagon size={14} />, label: 'Rejected' };
      break;
    case 'CANCELLED':
      mapping = { class: 'status-cancelled', icon: <XCircle size={14} />, label: 'Cancelled' };
      break;
    default:
      break;
  }

  return (
    <span className={`status-badge ${mapping.class}`}>
      {mapping.icon}
      {mapping.label}
    </span>
  );
}
