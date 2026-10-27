import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import { useNotifications } from '../../context/NotificationsContext';
import {
  IconBell,
  IconChevronLeft,
  IconCheck,
  IconMessageSquare,
  IconPhoneCall,
  IconUsers,
  IconSparkles,
  IconTag
} from '../../components/common/Icons';

import { renderAvatar } from '../../utils/avatarUtils';


export default function UserNotifications() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadNotificationCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState('all');

  // Filter tabs definition
  const filterTabs = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadNotificationCount },
    {
      id: 'requests',
      label: 'Friend Requests',
      count: notifications.filter(n => n.category === 'requests').length
    },
    {
      id: 'messages',
      label: 'Messages',
      count: notifications.filter(n => n.category === 'messages').length
    },
    {
      id: 'voice',
      label: 'Voice',
      count: notifications.filter(n => n.category === 'voice').length
    },
    {
      id: 'rooms',
      label: 'Rooms',
      count: notifications.filter(n => n.category === 'rooms').length
    }
  ];

  // Filtered notifications list
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'unread') return n.unread;
      return n.category === activeFilter;
    });
  }, [notifications, activeFilter]);

  // Handle clicking a notification card
  const handleNotificationClick = (e, ntf) => {
    // If the click was on a nested link or action button, let it bubble naturally
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    if (ntf.unread) {
      markAsRead(ntf.id);
    }
    if (ntf.actionUrl) {
      navigate(ntf.actionUrl);
    }
  };

  const handleActionClick = (e, ntf, url) => {
    e.stopPropagation();
    if (ntf.unread) {
      markAsRead(ntf.id);
    }
    navigate(url);
  };

  // Helper for notification type icons
  const renderTypeIcon = (type, subType) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
      case 'friend_request_accepted':
        return <span className="ntf-type-icon requests">🤝</span>;
      case 'new_message':
      case 'system_alert':
        return <span className="ntf-type-icon messages">💬</span>;
      case 'voice_call':
      case 'call_alert':
      case 'call_missed':
        return subType === 'missed' || type === 'call_missed' ? (
          <span className="ntf-type-icon missed-call">📵</span>
        ) : (
          <span className="ntf-type-icon voice">🎙️</span>
        );
      case 'room_invite':
      case 'room_reminder':
        return <span className="ntf-type-icon rooms">📻</span>;
      default:
        return <span className="ntf-type-icon default">🔔</span>;
    }
  };

  return (
    <UserLayout>
      <div className="profile-page-container">

        {/* ── Top Navigation Bar ───────────────────────────────────────── */}
        <div className="profile-top-bar">
          <Link to="/discover" className="profile-back-link">
            <IconChevronLeft size={16} />
            <span>Back to Discover</span>
          </Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="profile-badge-public">
              🔔 Notifications & Activity
            </span>
          </div>
        </div>

        {/* ── Screen Header Block ─────────────────────────────────────── */}
        <div className="requests-header-block" style={{ marginBottom: 24 }}>
          <div className="requests-header-content">
            <div className="requests-header-pill">
              <IconBell size={14} />
              <span>Activity Hub</span>
            </div>
            <h1 className="requests-header-title">Notifications</h1>
            <p className="requests-header-sub">
              Stay updated on your conversations, connections, and voice activity.
            </p>
          </div>

          <div className="requests-stats-strip" style={{ alignItems: 'center', gap: 14 }}>
            <div className="requests-stat-chip">
              <span className="requests-stat-chip-label">Total</span>
              <span className="requests-stat-chip-count" style={{ color: 'var(--user-primary)' }}>
                {notifications.length}
              </span>
            </div>
            {unreadNotificationCount > 0 && (
              <div className="requests-stat-chip">
                <span className="requests-stat-chip-label">Unread</span>
                <span className="requests-stat-chip-count" style={{ color: 'var(--user-status-online)' }}>
                  {unreadNotificationCount}
                </span>
              </div>
            )}
            {unreadNotificationCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="btn-mark-all-read"
                title="Mark all notifications as read"
              >
                <IconCheck size={14} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Filter Tabs ─────────────────────────────────────────────── */}
        <div className="notifications-filter-nav">
          {filterTabs.map(tab => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`notifications-tab-btn ${isActive ? 'active' : ''}`}
              >
                <span>{tab.label}</span>
                <span className={`notifications-tab-badge ${isActive ? 'active' : ''}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Notification List / Loading / Error States ─────────────────── */}
        {isLoading ? (
          <div className="requests-empty-card" style={{ padding: '52px 24px', marginTop: 12 }}>
            <div className="user-spinner" style={{ margin: '0 auto 16px auto', width: 32, height: 32, borderColor: 'var(--user-primary) transparent transparent transparent' }} />
            <p style={{ color: 'var(--user-text-secondary)', fontSize: '0.9rem' }}>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="requests-empty-card" style={{ padding: '36px 24px', marginTop: 12, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <h3 className="requests-empty-title">Failed to load notifications</h3>
            <p className="requests-empty-sub">{error}</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="notifications-list">
            {filteredNotifications.map(ntf => {
              return (
                <div
                  key={ntf.id}
                  className={`notification-item-card ${ntf.unread ? 'unread' : 'read'}`}
                  onClick={(e) => handleNotificationClick(e, ntf)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNotificationClick(e, ntf);
                  }}
                >
                  {/* Left Avatar & Type Badge */}
                  <div className="notification-avatar-col">
                    <div
                      className="notification-avatar-circle"
                      style={{ background: ntf.user?.avatarBg || 'var(--user-brand-gradient)' }}
                    >
                      {renderAvatar(ntf.user?.avatar, ntf.user?.fullName, '👤')}
                    </div>
                    {renderTypeIcon(ntf.type, ntf.subType)}
                  </div>

                  {/* Center Content Column */}
                  <div className="notification-content-col">
                    <div className="notification-meta-row">
                      <div className="notification-title-wrap">
                        {ntf.unread && <span className="notification-unread-dot" title="Unread" />}
                        <h4 className="notification-title">{ntf.title}</h4>
                      </div>
                      <span className="notification-time">{ntf.timestamp}</span>
                    </div>

                    <p className="notification-message">
                      {ntf.message}
                    </p>

                    {/* Optional tags (e.g. shared interests for friend request) */}
                    {ntf.tags && ntf.tags.length > 0 && (
                      <div className="notification-tags-row">
                        {ntf.tags.map((tag, idx) => (
                          <span key={idx} className="notification-tag-chip">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="notification-actions-row">
                      {ntf.actionUrl && (
                        <button
                          type="button"
                          onClick={(e) => handleActionClick(e, ntf, ntf.actionUrl)}
                          className="btn-notification-action primary"
                        >
                          {ntf.actionLabel || 'View'}
                        </button>
                      )}

                      {ntf.secondaryActionUrl && (
                        <button
                          type="button"
                          onClick={(e) => handleActionClick(e, ntf, ntf.secondaryActionUrl)}
                          className="btn-notification-action secondary"
                        >
                          {ntf.secondaryActionLabel || 'Open'}
                        </button>
                      )}

                      {ntf.unread && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(ntf.id);
                          }}
                          className="btn-notification-mark-read"
                          title="Mark as read"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="requests-empty-card" style={{ padding: '52px 24px', marginTop: 12 }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>🔔</div>
            <h3 className="requests-empty-title">You&rsquo;re all caught up</h3>
            <p className="requests-empty-sub" style={{ maxWidth: 440, margin: '0 auto 24px auto' }}>
              {activeFilter === 'unread'
                ? 'No unread notifications at the moment. You have seen all recent activity!'
                : activeFilter !== 'all'
                ? `No ${filterTabs.find(t => t.id === activeFilter)?.label.toLowerCase()} notifications found.`
                : 'New friend requests, messages, and voice activity will appear here.'}
            </p>
            <Link
              to="/discover"
              className="btn-user-primary"
              style={{ display: 'inline-flex', padding: '11px 26px', fontSize: '0.9rem', textDecoration: 'none' }}
            >
              Explore Discover
            </Link>
          </div>
        )}

      </div>
    </UserLayout>
  );
}
