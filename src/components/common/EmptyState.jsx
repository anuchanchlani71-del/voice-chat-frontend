import React from 'react';
import { IconSearch } from './Icons';

export default function EmptyState({
  icon: Icon = IconSearch,
  title = "No records found",
  description = "Try adjusting your search query or filter parameters to see results.",
  actionText,
  onAction
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon-wrap">
        <Icon size={28} />
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-description">{description}</p>
      {actionText && onAction && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}
