import React from 'react';
import { IconFilter } from './Icons';

export default function FilterBar({ children, className = "" }) {
  return (
    <div className={`filter-row ${className}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--slate-500)', fontSize: '13px', fontWeight: '600' }}>
        <IconFilter size={16} />
        <span>Filter:</span>
      </div>
      {children}
    </div>
  );
}
