import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from '../../router';
import {
  IconDashboard,
  IconUsers,
  IconUserCheck,
  IconPhoneCall,
  IconShieldAlert,
  IconBan,
  IconTag,
  IconBell,
  IconShield,
  IconSliders,
  IconMic,
  IconX,
  IconMenu,
  IconChevronLeft,
  IconSparkles,
  IconAlertOctagon,
  IconFileText,
  IconCrown,
  IconCreditCard
} from './Icons';
import { adminGetReports } from '../../services/adminApi';

export default function Sidebar({
  isCollapsed = true,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    adminGetReports({ limit: 1, status: 'pending' })
      .then((res) => {
        if (isMounted && res) {
          const count = res.counts?.pending ?? res.pagination?.totalItems ?? 0;
          setPendingReportsCount(count);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPendingReportsCount(0);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const navGroups = [
    {
      title: "Core Platform",
      items: [
        { id: "dashboard", path: "/dashboard", label: "Dashboard", icon: IconDashboard },
        { id: "users", path: "/users", label: "Users", icon: IconUsers, matchPrefix: true },
        { id: "friendships", path: "/friendships", label: "Friendships & Requests", icon: IconUserCheck, altPaths: ["/friend-requests"] },
        { id: "voice_calls", path: "/voice-calls", label: "1-to-1 Voice Calls", icon: IconPhoneCall, altPaths: ["/voice-chat-activity"] },
        { id: "group_voice_rooms", path: "/group-voice-rooms", label: "Group Voice Rooms", icon: IconMic, altPaths: ["/group-rooms"] }
      ]
    },
    {
      title: "Plans & Subscriptions",
      items: [
        { id: "plans", path: "/admin/plans", label: "Plans", icon: IconCrown, altPaths: ["/plans"] },
        { id: "subscriptions", path: "/admin/subscriptions", label: "Subscriptions", icon: IconCreditCard, altPaths: ["/subscriptions"] }
      ]
    },
    {
      title: "Discovery & Tags",
      items: [
        { id: "interests", path: "/interests", label: "Interests & Tags", icon: IconTag },
        { id: "icebreaker_prompts", path: "/icebreaker-prompts", label: "Icebreaker Prompts", icon: IconSparkles }
      ]
    },
    {
      title: "Safety & Moderation",
      items: [
        { id: "safety_center", path: "/safety-center", label: "Safety Center", icon: IconShield, altPaths: ["/safety-moderation"] },
        { id: "repeat_offenders", path: "/repeat-offenders", label: "Repeat Offender Detector", icon: IconAlertOctagon, altPaths: ["/safety-center/repeat-offenders"] },
        { id: "appeal_requests", path: "/appeal-requests", label: "Appeal / Review Requests", icon: IconFileText },
        {
          id: "reports",
          path: "/reports",
          label: "Reports Queue",
          icon: IconShieldAlert,
          badge: pendingReportsCount > 0 ? String(pendingReportsCount) : null
        },
        { id: "blocked_users", path: "/blocked-users", label: "Blocked Users", icon: IconBan }
      ]
    },
    {
      title: "System & Audit",
      items: [
        { id: "notifications", path: "/admin/notifications", label: "Notifications Log", icon: IconBell },
        { id: "settings", path: "/admin/settings", label: "Admin Settings", icon: IconSliders }
      ]
    }
  ];

  const handleItemClick = (path) => {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const isItemActive = (item) => {
    const currentPath = location.pathname;
    if (currentPath === item.path) return true;
    if (item.matchPrefix && currentPath.startsWith(`${item.path}/`)) return true;
    if (item.altPaths && item.altPaths.includes(currentPath)) return true;
    return false;
  };

  return (
    <>
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={onCloseMobile} />
      )}

      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${isMobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Sidebar Header / Brand Logo & Toggle */}
        <div className="sidebar-header">
          <div
            className="sidebar-brand"
            onClick={onToggleCollapse}
            title={isCollapsed ? "Click to Expand Sidebar" : "Click to Collapse Sidebar"}
            style={{ cursor: 'pointer' }}
          >
            <div className="brand-icon">
              <IconMic size={20} />
            </div>
            {!isCollapsed && (
              <div className="brand-text">
                <span className="brand-title">Voice Chat</span>
                <span className="brand-subtitle">&amp; Friends Admin</span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={onToggleCollapse}
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <IconChevronLeft size={18} />
            </button>
          )}

          {isMobileOpen && (
            <button
              type="button"
              className="btn-icon-only"
              onClick={onCloseMobile}
              style={{ color: '#fff' }}
              title="Close Menu"
            >
              <IconX size={20} />
            </button>
          )}
        </div>

        {/* Navigation items */}
        <nav className="sidebar-nav">
          {navGroups.map((group, idx) => (
            <div key={idx} className="nav-group-block">
              {!isCollapsed && (
                <div className="nav-section-title">{group.title}</div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item);
                return (
                  <div key={item.id} className="nav-item-wrapper" title={isCollapsed ? item.label : undefined}>
                    <button
                      type="button"
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleItemClick(item.path)}
                      aria-label={item.label}
                    >
                      <Icon size={20} className="nav-icon" />
                      {!isCollapsed && (
                        <span className="nav-item-label">{item.label}</span>
                      )}
                      {item.badge && (
                        <span className="nav-badge">{item.badge}</span>
                      )}
                    </button>
                    {isCollapsed && (
                      <div className="sidebar-tooltip">
                        <span>{item.label}</span>
                        {item.badge && <span className="tooltip-badge">{item.badge}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        {!isCollapsed && (
          <div className="sidebar-footer">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--sidebar-text-muted)', fontWeight: '600' }}>
                  Phase 1 MVP Scope
                </span>
                <span style={{ fontSize: '10px', background: 'var(--accent-100)', color: 'var(--accent-color-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                  v1.0
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--sidebar-text-muted)' }}>
                "Talk, Connect, Make Friends"
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
