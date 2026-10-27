import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from '../../router';
import { IconMenu, IconBell, IconSearch, IconMic, IconSliders } from './Icons';
import { removeAdminToken, adminGetNotifications } from '../../services/adminApi';
import { useAdmin } from '../../context/AdminContext';

// ── Inline SVG icons (no new icon file needed) ───────────────
function IconUser({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconSettings({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83-2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconLogOut({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ── Header component ─────────────────────────────────────────
export default function Header({ isCollapsed, onToggleSidebar }) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [totalNotificationsCount, setTotalNotificationsCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const { admin } = useAdmin();
  const profileRef = useRef(null);

  const adminName = admin?.name || 'Admin Team';
  const adminRole = admin?.role || 'Super Admin';
  const adminInitials = admin?.initials || (admin?.name ? admin.name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() : 'AD');

  // Fetch latest notifications helper
  const fetchNotifications = () => {
    setLoadingNotifications(true);
    adminGetNotifications({ limit: 5 })
      .then((res) => {
        if (res) {
          const list = res.notifications || res.data || [];
          setNotifications(list);
          const count = res.counts?.all ?? res.pagination?.totalItems ?? list.length;
          setTotalNotificationsCount(count);
        }
      })
      .catch(() => {
        setNotifications([]);
        setTotalNotificationsCount(0);
      })
      .finally(() => {
        setLoadingNotifications(false);
      });
  };

  // Fetch latest notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleToggleNotifications = () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  const formatNotificationTime = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string' && dateVal.includes(' ')) {
      const parts = dateVal.split(' ');
      return parts[1] || parts[0];
    }
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return String(dateVal);
    }
  };

  // Close profile dropdown when user clicks outside it
  useEffect(() => {
    if (!showProfileMenu) return;
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  return (
    <header className="header">
      {/* ── Left: hamburger + search ─────────────────────────── */}
      <div className="header-left">
        <button
          type="button"
          className="toggle-sidebar-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <IconMenu size={20} />
        </button>

        <div className="header-search">
          <IconSearch size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Type to search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ── Right: status pill, settings, notifications, profile ─ */}
      <div className="header-right">

        {/* Phase 1 Live Voice Engine Status Pill */}
        <div className="header-pill" title="Phase 1: 1-to-1 Voice Chat Mesh Active">
          <span className="status-dot-pulse" />
          <IconMic size={14} />
          <span>1-to-1 Voice Engine</span>
        </div>

        {/* Quick Settings Icon Button */}
        <button
          type="button"
          className="icon-button"
          onClick={() => navigate('/admin/settings')}
          title="Platform Settings"
        >
          <IconSliders size={18} />
        </button>

        {/* ── Notifications Dropdown ───────────────────────────── */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="icon-button"
            onClick={handleToggleNotifications}
            title="Notifications"
          >
            <IconBell size={18} />
            {totalNotificationsCount > 0 && (
              <span className="icon-badge">{totalNotificationsCount}</span>
            )}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '50px',
                width: '360px',
                maxWidth: 'calc(100vw - 32px)',
                background: 'var(--bg-card-gradient)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 50,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#ffffff' }}>
                  Platform Notifications
                </div>
                <span
                  style={{ fontSize: '11px', color: 'var(--accent-color-light)', fontWeight: '600', cursor: 'pointer' }}
                  onClick={() => setShowNotifications(false)}
                >
                  Close
                </span>
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {loadingNotifications ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((ntf, idx) => (
                    <div
                      key={ntf.id || ntf._id || idx}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-50)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => { setShowNotifications(false); navigate('/admin/notifications'); }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>{ntf.title}</span>
                        <span style={{ fontSize: '11px', color: 'var(--slate-400)' }}>
                          {formatNotificationTime(ntf.date || ntf.createdAt)}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>{ntf.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  padding: '10px 16px',
                  background: '#100e1c',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--accent-color-light)',
                  cursor: 'pointer'
                }}
                onClick={() => { setShowNotifications(false); navigate('/admin/notifications'); }}
              >
                View all notifications →
              </div>
            </div>
          )}
        </div>

        {/* ── Admin Profile Capsule + Dropdown ─────────────────── */}
        <div ref={profileRef} style={{ position: 'relative' }}>

          {/* Capsule trigger — clicking opens/closes the dropdown */}
          <div
            className="admin-profile"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title="Admin Menu"
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <div className="admin-avatar">
              <span>{adminInitials}</span>
            </div>
            <div className="admin-info">
              <span className="admin-name">{adminName}</span>
              <span className="admin-role">{adminRole}</span>
            </div>
          </div>

          {/* Dropdown */}
          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 10px)',
                minWidth: 190,
                background: 'linear-gradient(160deg, #1c162e 0%, #120e20 60%, #0c0915 100%)',
                border: '1px solid var(--accent-border-glow)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xl), 0 0 20px var(--accent-glow)',
                zIndex: 60,
                overflow: 'hidden',
                animation: 'modal-appear 0.15s cubic-bezier(0.16,1,0.3,1)'
              }}
            >
              {/* Admin identity strip */}
              <div
                style={{
                  padding: '12px 16px 10px',
                  borderBottom: '1px solid var(--border-color)',
                  background: 'var(--accent-50)'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', lineHeight: 1.2 }}>
                  {adminName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--accent-color-light)', marginTop: 2 }}>
                  {adminRole}
                </div>
              </div>

              {/* Profile → /admin/profile */}
              <button
                type="button"
                onClick={() => { setShowProfileMenu(false); navigate('/admin/profile'); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(135,124,169,0.10)',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s, color 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-50)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                <span style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center' }}>
                  <IconUser size={15} />
                </span>
                Profile
              </button>

              {/* Settings → /admin/settings */}
              <button
                type="button"
                onClick={() => { setShowProfileMenu(false); navigate('/admin/settings'); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(135,124,169,0.10)',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s, color 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-50)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                <span style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center' }}>
                  <IconSettings size={15} />
                </span>
                Settings
              </button>

              {/* Logout → /login */}
              <button
                type="button"
                onClick={() => {
                  removeAdminToken();
                  setShowProfileMenu(false);
                  navigate('/admin/login');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: '#f87171',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s, color 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                  e.currentTarget.style.color = '#fca5a5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#f87171';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <IconLogOut size={15} />
                </span>
                Logout
              </button>
            </div>
          )}
        </div>
        {/* ── End Admin Profile ─────────────────────────────────── */}

      </div>
    </header>
  );
}
