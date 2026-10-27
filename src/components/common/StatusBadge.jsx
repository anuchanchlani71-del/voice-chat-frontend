import React from 'react';

export default function StatusBadge({ status, label, size = "md" }) {
  if (!status && !label) return null;
  
  const normalized = (status || label || '').toLowerCase().replace(/[\s-]/g, '_');
  
  let badgeClass = 'badge-offline';
  let displayLabel = label || status;

  switch (normalized) {
    case 'online':
    case 'active':
    case 'accepted':
    case 'approved':
    case 'completed':
    case 'resolved':
    case 'delivered':
      badgeClass = 'badge-online';
      break;
      
    case 'pending':
    case 'under_review':
    case 'in_progress':
      badgeClass = 'badge-pending';
      break;
      
    case 'suspended':
    case 'blocked':
    case 'rejected':
    case 'failed':
    case 'high':
      badgeClass = 'badge-rejected';
      break;
      
    case 'offline':
    case 'inactive':
    case 'cancelled':
    case 'dismissed':
    case 'missed':
    case 'declined':
    case 'read':
      badgeClass = 'badge-offline';
      break;

    default:
      badgeClass = 'badge-active';
  }

  return (
    <span className={`badge ${badgeClass} ${size === 'sm' ? 'text-xs py-0.5 px-2' : ''}`}>
      <span className="badge-dot" />
      {displayLabel}
    </span>
  );
}
