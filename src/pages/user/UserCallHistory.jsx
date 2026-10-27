import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import { useFriendRequests } from '../../context/FriendRequestContext';
import { useAuth } from '../../context/AuthContext';
import { getCallHistoryApi } from '../../services/userVoiceCallApi';
import {
  IconSearch,
  IconClock,
  IconPhoneCall,
  IconUsers,
  IconWaveform,
  IconChevronDown,
  IconChevronLeft,
  IconX
} from '../../components/common/Icons';

// Specialized SVG icons for call directions and states
const IconPhoneIncoming = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="16 2 16 8 22 8" />
    <line x1="22" y1="2" x2="15" y2="9" />
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconPhoneOutgoing = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 7 22 1 16 1" />
    <line x1="15" y1="8" x2="22" y2="1" />
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconPhoneMissed = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="22" y1="2" x2="16" y2="8" />
    <line x1="16" y1="2" x2="22" y2="8" />
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconPhoneDeclined = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="18" cy="6" r="4" />
    <line x1="15.5" y1="8.5" x2="20.5" y2="3.5" />
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

import { renderAvatar } from '../../utils/avatarUtils';


// Helper for relative timestamps
function formatRelativeTimestamp(dateIso) {
  if (!dateIso) return 'Recently';
  const date = new Date(dateIso);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function UserCallHistory() {
  const navigate = useNavigate();
  const { connectedFriends } = useFriendRequests();
  const { user: currentUser } = useAuth();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'incoming' | 'outgoing' | 'missed' | 'declined'
  const [expandedCallId, setExpandedCallId] = useState(null);

  // REST API state
  const [rawCalls, setRawCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Fetch real call history from backend
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setApiError(null);

    getCallHistoryApi(1, 100, 'all')
      .then(res => {
        if (!isMounted) return;
        const list = res.voiceCalls || res.calls || res.data || [];
        setRawCalls(Array.isArray(list) ? list : []);
        setIsLoading(false);
      })
      .catch(err => {
        if (!isMounted) return;
        setIsLoading(false);
        setApiError(err?.response?.error || err?.message || 'Failed to load call history');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Map backend records to UI structure
  const enrichedCallHistory = useMemo(() => {
    const currentIdStr = currentUser?.id || currentUser?._id || '';

    return rawCalls.map(item => {
      const callerObj = item.caller || {};
      const receiverObj = item.receiver || {};
      const callerId = callerObj.id || callerObj._id || (typeof callerObj === 'string' ? callerObj : '');

      const isOutgoing = currentIdStr && callerId && String(callerId) === String(currentIdStr);
      const targetUserRaw = isOutgoing ? receiverObj : callerObj;
      const targetUserId = targetUserRaw?.id || targetUserRaw?._id || (typeof targetUserRaw === 'string' ? targetUserRaw : '');

      const liveFriend = connectedFriends.find(f => f.id === targetUserId);
      const user = liveFriend || (typeof targetUserRaw === 'object' ? targetUserRaw : { id: targetUserId });

      const durationSec = item.durationSeconds || 0;
      const formattedDuration = item.durationFormatted || (durationSec > 0 ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s` : '0s');
      const startDate = item.startedAt || item.createdAt;

      return {
        id: item.id || item._id,
        userId: targetUserId,
        type: isOutgoing ? 'outgoing' : 'incoming',
        status: item.status || 'completed',
        duration: durationSec,
        formattedDuration,
        timestamp: formatRelativeTimestamp(startDate),
        exactDate: startDate ? new Date(startDate).toLocaleString() : 'N/A',
        roomType: '1-to-1 Voice',
        quality: item.audioQuality || 'Good',
        endReason: item.endReason || '',
        user: {
          id: targetUserId,
          fullName: user.fullName || user.username || 'Voice User',
          username: user.username || 'user',
          avatar: user.avatar || '🎧',
          avatarBg: user.avatarBg || 'var(--user-brand-gradient)',
          isOnline: !!user.isOnline
        }
      };
    });
  }, [rawCalls, currentUser, connectedFriends]);

  // Dynamic filter application
  const filteredHistory = useMemo(() => {
    return enrichedCallHistory.filter(call => {
      // 1. Filter Tab
      if (filterType === 'incoming' && call.type !== 'incoming') return false;
      if (filterType === 'outgoing' && call.type !== 'outgoing') return false;
      if (filterType === 'missed' && call.status !== 'missed') return false;
      if (filterType === 'declined' && call.status !== 'declined') return false;

      // 2. Search query matching name, username
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (call.user?.fullName || '').toLowerCase().includes(q);
        const userMatch = (call.user?.username || '').toLowerCase().includes(q);
        return nameMatch || userMatch;
      }

      return true;
    });
  }, [enrichedCallHistory, filterType, searchQuery]);

  // Derived metrics from dataset
  const metrics = useMemo(() => {
    const totalCalls = enrichedCallHistory.length;
    const totalDurationSeconds = enrichedCallHistory.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    const mins = Math.floor(totalDurationSeconds / 60);
    const secs = totalDurationSeconds % 60;
    const formattedVoiceTime = `${mins}m ${secs > 0 ? secs + 's' : ''}`;
    const recentActivity = enrichedCallHistory[0]?.timestamp || 'None';

    return {
      totalCalls,
      formattedVoiceTime,
      recentActivity
    };
  }, [enrichedCallHistory]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: enrichedCallHistory.length,
      incoming: enrichedCallHistory.filter(c => c.type === 'incoming').length,
      outgoing: enrichedCallHistory.filter(c => c.type === 'outgoing').length,
      missed: enrichedCallHistory.filter(c => c.status === 'missed').length,
      declined: enrichedCallHistory.filter(c => c.status === 'declined').length
    };
  }, [enrichedCallHistory]);

  const toggleExpand = (id) => {
    setExpandedCallId(prev => (prev === id ? null : id));
  };

  const handleCallAgain = (e, userId) => {
    e.stopPropagation();
    navigate(`/voice/${userId}`);
  };

  const handleViewProfile = (e, userId) => {
    e.stopPropagation();
    navigate(`/user/${userId}`);
  };

  return (
    <UserLayout>
      <div className="profile-page-container">

        {/* ── Top Navigation Bar ───────────────────────────────────────── */}
        <div className="profile-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/friends" className="profile-back-link">
              <IconChevronLeft size={16} />
              <span>Back to Friends</span>
            </Link>
            <span style={{ color: 'var(--user-text-muted)', fontSize: '0.8rem' }}>&bull;</span>
            <Link to="/discover" className="profile-back-link" style={{ color: 'var(--user-text-muted)' }}>
              <span>Discover Lounge</span>
            </Link>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="profile-badge-public" title="Simulated locally on this browser device">
              🔒 Private Voice Activity
            </span>
          </div>
        </div>

        {/* ── Screen Header Block ─────────────────────────────────────── */}
        <div className="requests-header-block">
          <div className="requests-header-content">
            <div className="requests-header-pill">
              <IconPhoneCall size={14} />
              <span>Voice History</span>
            </div>
            <h1 className="requests-header-title">Voice Activity</h1>
            <p className="requests-header-sub">
              Your recent conversations, all in one place. Review previous audio chats, reconnect with mutual friends, and see voice engagement.
            </p>
          </div>

          {/* Metric Summary Strip */}
          <div className="requests-stats-strip">
            <div className="requests-stat-chip">
              <span className="requests-stat-chip-label">Total Conversations</span>
              <span className="requests-stat-chip-count" style={{ color: 'var(--user-primary)' }}>
                {metrics.totalCalls}
              </span>
            </div>
            <div className="requests-stat-chip">
              <span className="requests-stat-chip-label">Total Voice Time</span>
              <span className="requests-stat-chip-count" style={{ color: 'var(--user-status-online)' }}>
                {metrics.formattedVoiceTime}
              </span>
            </div>
            <div className="requests-stat-chip">
              <span className="requests-stat-chip-label">Recent Activity</span>
              <span className="requests-stat-chip-count" style={{ color: 'var(--user-accent-soft)', fontSize: '1rem' }}>
                {metrics.recentActivity}
              </span>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Controls ─────────────────────────────────── */}
        <div className="requests-filter-bar" style={{ marginBottom: 24 }}>
          {/* Live Search Input */}
          <div className="requests-search-box">
            <IconSearch size={16} className="requests-search-icon" />
            <input
              type="text"
              placeholder="Search by name or @username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="requests-search-input"
              aria-label="Search voice activity"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="requests-search-clear"
                title="Clear search"
              >
                <IconX size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="requests-tabs" style={{ marginBottom: 0 }}>
            <button
              type="button"
              className={`requests-tab ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              className={`requests-tab ${filterType === 'incoming' ? 'active' : ''}`}
              onClick={() => setFilterType('incoming')}
            >
              Incoming ({counts.incoming})
            </button>
            <button
              type="button"
              className={`requests-tab ${filterType === 'outgoing' ? 'active' : ''}`}
              onClick={() => setFilterType('outgoing')}
            >
              Outgoing ({counts.outgoing})
            </button>
            <button
              type="button"
              className={`requests-tab ${filterType === 'missed' ? 'active' : ''}`}
              onClick={() => setFilterType('missed')}
            >
              Missed ({counts.missed})
            </button>
            <button
              type="button"
              className={`requests-tab ${filterType === 'declined' ? 'active' : ''}`}
              onClick={() => setFilterType('declined')}
            >
              Declined ({counts.declined})
            </button>
          </div>
        </div>

        {/* ── API Loading & Error States ──────────────────────────────── */}
        {isLoading ? (
          <div className="requests-empty-card" style={{ padding: '48px 24px' }}>
            <div className="user-spinner" style={{ margin: '0 auto 16px auto', width: 32, height: 32, borderColor: 'var(--user-primary) transparent transparent transparent' }} />
            <p style={{ color: 'var(--user-text-secondary)', fontSize: '0.9rem' }}>Loading voice call history...</p>
          </div>
        ) : apiError ? (
          <div className="requests-empty-card" style={{ padding: '36px 24px', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <h3 className="requests-empty-title">Failed to load history</h3>
            <p className="requests-empty-sub">{apiError}</p>
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="call-history-list">
            {filteredHistory.map((call) => {
              const isExpanded = expandedCallId === call.id;
              const isMissed = call.status === 'missed';
              const isDeclined = call.status === 'declined';
              const isCompleted = call.status === 'completed';
              const isIncoming = call.type === 'incoming';

              return (
                <div
                  key={call.id}
                  className={`call-history-card ${isExpanded ? 'expanded' : ''} ${isMissed ? 'card-missed' : ''}`}
                >
                  <div className="call-card-main" onClick={() => toggleExpand(call.id)}>
                    {/* Left: Avatar with online dot */}
                    <div className="call-card-avatar-wrapper">
                      <div
                        className="call-card-avatar"
                        style={{ background: call.user?.avatarBg || 'var(--user-brand-gradient)', overflow: 'hidden' }}
                      >
                        {renderAvatar(call.user?.avatar, call.user?.fullName)}
                      </div>
                      <span
                        className="call-card-status-dot"
                        style={{
                          background: call.user?.isOnline ? 'var(--user-status-online)' : 'var(--user-text-muted)'
                        }}
                        title={call.user?.isOnline ? 'Online' : 'Offline'}
                      />
                    </div>

                    {/* Middle Left: Identity & Call Direction/Status Badge */}
                    <div className="call-card-identity">
                      <div className="call-card-name-row">
                        <Link
                          to={`/user/${call.userId}`}
                          className="call-card-name"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {call.user?.fullName}
                        </Link>
                        <span className="call-card-username">@{call.user?.username}</span>
                      </div>

                      {/* Direction & Status Pill */}
                      <div className="call-card-status-badges">
                        {isIncoming && isCompleted && (
                          <span className="call-badge call-badge-incoming">
                            <IconPhoneIncoming size={12} />
                            <span>Incoming &bull; Completed</span>
                          </span>
                        )}
                        {!isIncoming && isCompleted && (
                          <span className="call-badge call-badge-outgoing">
                            <IconPhoneOutgoing size={12} />
                            <span>Outgoing &bull; Completed</span>
                          </span>
                        )}
                        {isMissed && (
                          <span className="call-badge call-badge-missed">
                            <IconPhoneMissed size={12} />
                            <span>Incoming &bull; Missed Call</span>
                          </span>
                        )}
                        {isDeclined && (
                          <span className="call-badge call-badge-declined">
                            <IconPhoneDeclined size={12} />
                            <span>Outgoing &bull; Declined</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Right: Duration & Timestamp */}
                    <div className="call-card-meta">
                      <div className="call-card-duration-row">
                        {isCompleted ? (
                          <>
                            <IconWaveform size={14} className="call-duration-icon" />
                            <span className="call-duration-text">{call.formattedDuration}</span>
                          </>
                        ) : (
                          <>
                            <IconClock size={13} style={{ color: 'var(--user-text-muted)' }} />
                            <span className="call-duration-text text-muted">
                              {call.formattedDuration}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="call-card-time">{call.timestamp}</div>
                    </div>

                    {/* Right: Actions */}
                    <div className="call-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleCallAgain(e, call.userId)}
                        className={`call-action-btn ${isMissed ? 'call-back' : 'call-again'}`}
                        title={isMissed ? `Call back ${call.user?.fullName}` : `Call ${call.user?.fullName} again`}
                      >
                        <IconPhoneCall size={14} />
                        <span>{isMissed ? 'Call Back' : 'Call Again'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleViewProfile(e, call.userId)}
                        className="call-action-btn view-profile"
                        title="View user profile"
                      >
                        Profile
                      </button>

                      {/* Expand Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(call.id)}
                        className={`call-expand-toggle ${isExpanded ? 'rotated' : ''}`}
                        title={isExpanded ? 'Collapse details' : 'View details'}
                        aria-label="Toggle call details"
                      >
                        <IconChevronDown size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details Drawer */}
                  {isExpanded && (
                    <div className="call-card-drawer">
                      <div className="call-drawer-grid">
                        <div className="call-drawer-item">
                          <span className="call-drawer-label">Exact Timestamp</span>
                          <span className="call-drawer-val">{call.exactDate}</span>
                        </div>
                        <div className="call-drawer-item">
                          <span className="call-drawer-label">Channel Format</span>
                          <span className="call-drawer-val">{call.roomType}</span>
                        </div>
                        <div className="call-drawer-item">
                          <span className="call-drawer-label">Audio Quality</span>
                          <span className="call-drawer-val">{call.quality}</span>
                        </div>
                        <div className="call-drawer-item">
                          <span className="call-drawer-label">Status Summary</span>
                          <span className="call-drawer-val" style={{ textTransform: 'capitalize' }}>
                            {call.type} &bull; {call.status}
                          </span>
                        </div>
                      </div>
                      <div className="call-drawer-footer">
                        <span>Safe peer connection &bull; No conversation audio is recorded or stored.</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Empty States ─────────────────────────────────────────────── */
          <div className="requests-empty-card" style={{ padding: '48px 24px' }}>
            <div className="requests-empty-icon" style={{ fontSize: 42, marginBottom: 12 }}>
              {searchQuery || filterType !== 'all' ? '🔍' : '🎙️'}
            </div>

            {searchQuery || filterType !== 'all' ? (
              <>
                <h3 className="requests-empty-title">No conversations found</h3>
                <p className="requests-empty-sub">
                  We couldn&rsquo;t find any voice calls matching your criteria. Try adjusting your search query or reset your filter.
                </p>
                <div style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                    }}
                    className="btn-user-primary"
                    style={{ padding: '8px 20px', fontSize: '0.88rem' }}
                  >
                    Reset Filters
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="requests-empty-title">No voice activity yet</h3>
                <p className="requests-empty-sub">
                  Start a conversation with a friend and your voice activity will appear here. Connect with friends in the Lounge!
                </p>
                <div style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={() => navigate('/friends')}
                    className="btn-user-primary"
                    style={{ padding: '10px 24px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <IconUsers size={16} />
                    <span>Find Friends</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </UserLayout>
  );
}
