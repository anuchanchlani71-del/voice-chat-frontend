import React from 'react';
import { Link, useLocation } from '../../router';
import { IconMic, IconBell, IconMessageSquare } from '../common/Icons';
import { useFriendRequests } from '../../context/FriendRequestContext';
import { useMessages } from '../../context/MessagesContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useAuth } from '../../context/AuthContext';
import { renderAvatar } from '../../utils/avatarUtils';


export default function UserHeader() {
  const { pathname } = useLocation();
  const { incomingCount } = useFriendRequests();
  const { totalUnreadCount } = useMessages();
  const { unreadNotificationCount } = useNotifications();
  const { user, isAuthenticated, isLoading } = useAuth();

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/verify';
  const isOnboardingPage = pathname.startsWith('/onboarding');


  return (
    <header className="user-header">
      <Link to="/" className="user-header-brand">
        <div className="user-brand-badge">
          <IconMic size={20} />
        </div>
        <div>
          <div className="user-brand-title">Voice Friends</div>
          <div className="user-brand-sub">Talk &middot; Connect &middot; Hangout</div>
        </div>
      </Link>

      <div className="user-header-actions">
        {isLoading ? (
          <div style={{ minHeight: 38 }} />
        ) : isAuthenticated && isOnboardingPage ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--user-text-muted)' }}>
              Setting up your profile
            </span>
            <span className="user-header-avatar-badge">{renderAvatar(user?.avatar)}</span>
          </div>
        ) : isAuthenticated ? (
          <div className="user-header-authenticated-group">
            {/* Center Navigation Tabs */}
            <nav className="user-header-nav-tabs">
              <Link
                to="/discover"
                className={`user-header-navlink ${pathname === '/discover' ? 'active' : ''}`}
              >
                🎙️ Discover
              </Link>

              <Link
                to="/rooms"
                className={`user-header-navlink ${pathname.startsWith('/room') ? 'active' : ''}`}
                title="Group Voice Lounges"
              >
                🎙️ Rooms
              </Link>

              <Link
                to="/friends"
                className={`user-header-navlink ${pathname === '/friends' || pathname === '/requests' ? 'active' : ''}`}
                title="My Friends & Requests"
              >
                <span>👥 Friends</span>
                {incomingCount > 0 && (
                  <span className="user-header-tab-badge" title={`${incomingCount} Pending Requests`}>
                    {incomingCount}
                  </span>
                )}
              </Link>

              <Link
                to="/call-history"
                className={`user-header-navlink ${pathname === '/call-history' ? 'active' : ''}`}
                title="Voice Activity & Call History"
              >
                🎙️ Activity
              </Link>
            </nav>

            {/* Right Action Icons & Profile Cluster */}
            <div className="user-header-utilities">
              {/* Messages Quick Icon Button */}
              <Link
                to="/messages"
                className={`user-header-icon-btn ${pathname.startsWith('/messages') ? 'active' : ''}`}
                title="Direct Messages"
                aria-label="Direct Messages"
              >
                <IconMessageSquare size={18} />
                {totalUnreadCount > 0 && (
                  <span className="user-header-floating-badge messages">
                    {totalUnreadCount}
                  </span>
                )}
              </Link>

              {/* Notifications Quick Bell Icon Button */}
              <Link
                to="/notifications"
                className={`user-header-icon-btn ${pathname === '/notifications' ? 'active' : ''}`}
                title="Notifications"
                aria-label="Notifications"
              >
                <IconBell size={18} />
                {unreadNotificationCount > 0 && (
                  <span className="user-header-floating-badge notifications">
                    {unreadNotificationCount}
                  </span>
                )}
              </Link>

              {/* Profile Avatar Chip */}
              <Link
                to="/profile"
                className={`user-header-profile-chip ${pathname === '/profile' ? 'active' : ''}`}
                title="View My Profile"
              >
                <span className="user-header-avatar-badge">{renderAvatar(user?.avatar)}</span>
                <span className="user-header-profile-name">{user?.fullName || 'Alex M.'}</span>
                <span className="user-header-presence-dot" />
              </Link>
            </div>
          </div>
        ) : isAuthPage ? (
          pathname === '/login' ? (
            <Link to="/register" className="user-header-navlink">
              Create Account
            </Link>
          ) : (
            <Link to="/login" className="user-header-navlink">
              Sign In
            </Link>
          )
        ) : (
          <>
            <Link to="/discover" className="user-header-navlink" style={{ color: 'var(--user-primary)', fontWeight: 600 }}>
              🎙️ Discover Lounge
            </Link>
            <Link to="/login" className="user-header-navlink">
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn-user-primary"
              style={{ width: 'auto', flexShrink: 0, padding: '8px 18px', fontSize: '0.88rem', whiteSpace: 'nowrap' }}
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
