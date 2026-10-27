import React from 'react';
import { IconSearch, IconX } from './Icons';

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  style = {}
}) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '320px', ...style }} className={className}>
      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)', display: 'flex', alignItems: 'center' }}>
        <IconSearch size={16} />
      </div>
      <input
        type="text"
        className="input-control"
        style={{ paddingLeft: '36px', paddingRight: value ? '32px' : '12px' }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--slate-400)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Clear search"
        >
          <IconX size={14} />
        </button>
      )}
    </div>
  );
}
