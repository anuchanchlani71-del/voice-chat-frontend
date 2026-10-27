import React from 'react';
import UserHeader from './UserHeader';

export default function UserLayout({ children }) {
  return (
    <div className="user-app-shell">
      {/* Background ambient lighting effects */}
      <div className="user-ambient-blob-1" aria-hidden="true" />
      <div className="user-ambient-blob-2" aria-hidden="true" />

      {/* Header */}
      <UserHeader />

      {/* Main content */}
      <main className="user-main-container">
        {children}
      </main>

      {/* Subtle user-friendly footer */}
      <footer style={{
        textAlign: 'center',
        padding: '20px',
        fontSize: '0.78rem',
        color: 'var(--user-text-subtle)',
        position: 'relative',
        zIndex: 2,
        borderTop: '1px solid rgba(255,255,255,0.04)'
      }}>
        <span>Voice Chat &amp; Friends &bull; Safe, Real-Time Audio Social Community</span>
      </footer>
    </div>
  );
}
