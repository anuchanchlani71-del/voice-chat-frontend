import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import { useFriendRequests } from '../../context/FriendRequestContext';
import {
  IconUsers,
  IconSearch,
  IconMic,
  IconSparkles,
  IconPhoneCall,
  IconCheck,
  IconMessageSquare
} from '../../components/common/Icons';

import { renderAvatar } from '../../utils/avatarUtils';


export default function UserFriendsList() {
  const navigate = useNavigate();
  const { connectedFriends, friendsCount, incomingCount, isLoading, removeFriend } = useFriendRequests();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'online' | 'available'
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const handleRemoveFriendClick = async (e, friend) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove ${friend.fullName || 'this user'} from your friends?`)) {
      try {
        setRemovingId(friend.id);
        await removeFriend(friend.id);
      } catch (err) {
        console.error('Failed to remove friend:', err);
      } finally {
        setRemovingId(null);
      }
    }
  };

  // Filtered friends
  const filteredFriends = useMemo(() => {
    return connectedFriends.filter(friend => {
      // Tab filter
      if (filterTab === 'online' && !friend.isOnline) {
        return false;
      }
      if (filterTab === 'available' && friend.status !== 'available_to_talk') {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = (friend.fullName || '').toLowerCase().includes(query);
        const matchesUser = (friend.username || '').toLowerCase().includes(query);
        const matchesStyle = (friend.conversationStyle || '').toLowerCase().includes(query);
        const matchesInterests = (friend.interests || []).some(t => t.toLowerCase().includes(query));
        return matchesName || matchesUser || matchesStyle || matchesInterests;
      }

      return true;
    });
  }, [connectedFriends, filterTab, searchQuery]);

  // Compute counts for tabs
  const onlineCount = useMemo(() => {
    return connectedFriends.filter(f => f.isOnline).length;
  }, [connectedFriends]);

  const availableCount = useMemo(() => {
    return connectedFriends.filter(f => f.status === 'available_to_talk').length;
  }, [connectedFriends]);

  const handleToggleVoicePlay = (e, userId) => {
    e.stopPropagation();
    setPlayingVoiceId(prev => (prev === userId ? null : userId));
  };

  const handleStartVoiceCallClick = (e, friend) => {
    e.stopPropagation();
    navigate(`/voice/${friend.id}`);
  };

  return (
    <UserLayout>
      <div className="profile-page-container">

        {/* ── Top Navigation / Breadcrumb Bar ─────────────────────────── */}
        <div className="profile-top-bar">
          <Link to="/discover" className="profile-back-link">
            <span>&larr;</span>
            <span>Back to Discover Lounge</span>
          </Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link
              to="/requests"
              className="btn-user-secondary"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                textDecoration: 'none'
              }}
              title="View Pending Requests"
            >
              <span>🤝 Requests</span>
              {incomingCount > 0 && (
                <span style={{
                  background: 'var(--user-primary)',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  padding: '1px 6px',
                  borderRadius: 999,
                  lineHeight: '14px'
                }}>
                  {incomingCount}
                </span>
              )}
            </Link>
            <span className="profile-badge-public">
              🎙️ Mutual Connections
            </span>
          </div>
        </div>

        {/* ── Screen Header Area ───────────────────────────────────────── */}
        <div className="requests-header-block">
          <div className="requests-header-content">
            <div className="requests-header-pill">
              <IconUsers size={14} />
              <span>Voice Friends Circle</span>
            </div>
            <h1 className="requests-header-title">Friends</h1>
            <p className="requests-header-sub">
              People you&rsquo;ve connected with. Mutual friends can hop on 1-on-1 voice calls anytime without stranger harassment.
            </p>
          </div>

          <div className="requests-stats-strip">
            <div className="requests-stat-chip">
              <span className="requests-stat-chip-label">Total Friends</span>
              <span className="requests-stat-chip-count" style={{ color: 'var(--user-primary)' }}>
                {friendsCount}
              </span>
            </div>
            <div className="requests-stat-chip">
              <span className="requests-stat-chip-label">Available Now</span>
              <span className="requests-stat-chip-count" style={{ color: 'var(--user-status-online)' }}>
                {availableCount}
              </span>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Controls Bar ────────────────────────────── */}
        <div className="discover-controls-wrap" style={{ marginBottom: 22 }}>
          {/* Search Field */}
          <div className="discover-search-box">
            <span className="discover-search-icon">
              <IconSearch size={18} />
            </span>
            <input
              type="text"
              placeholder="Search friends by name, @username, or topic (e.g. Lo-Fi, Gaming)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="discover-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="discover-search-clear"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="requests-tabs-wrap" style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}>
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`requests-tab-btn ${filterTab === 'all' ? 'active' : ''}`}
            >
              <span>All</span>
              <span className="requests-tab-badge">
                {connectedFriends.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('online')}
              className={`requests-tab-btn ${filterTab === 'online' ? 'active' : ''}`}
            >
              <span>● Online</span>
              <span className="requests-tab-badge">
                {onlineCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('available')}
              className={`requests-tab-btn ${filterTab === 'available' ? 'active' : ''}`}
            >
              <span>🎙️ Available to Talk</span>
              <span className={`requests-tab-badge ${availableCount > 0 ? 'highlight' : ''}`}>
                {availableCount}
              </span>
            </button>
          </div>
        </div>

        {/* ── Friends List Body ────────────────────────────────────────── */}
        {isLoading && connectedFriends.length === 0 ? (
          <div className="discover-empty-state" style={{ marginTop: 20 }}>
            <div className="discover-empty-icon">⏳</div>
            <h3 className="discover-empty-title">Loading friends...</h3>
            <p className="discover-empty-sub">
              Fetching your voice connections.
            </p>
          </div>
        ) : connectedFriends.length === 0 ? (
          /* Empty State: Zero Friends Yet */
          <div className="discover-empty-state" style={{ marginTop: 20 }}>
            <div className="discover-empty-icon">🤝</div>
            <h3 className="discover-empty-title">Your circle starts here</h3>
            <p className="discover-empty-sub">
              Connect with people from Discover and they&rsquo;ll appear here once you become friends.
            </p>
            <Link
              to="/discover"
              className="btn-user-primary"
              style={{ width: 'auto', display: 'inline-flex', padding: '12px 28px', marginTop: 10 }}
            >
              Discover People &rarr;
            </Link>
          </div>
        ) : filteredFriends.length === 0 ? (
          /* Empty State: Search / Filter Yields No Match */
          <div className="discover-empty-state" style={{ marginTop: 20 }}>
            <div className="discover-empty-icon">🔍</div>
            <h3 className="discover-empty-title">No friends found</h3>
            <p className="discover-empty-sub">
              {searchQuery
                ? `No friends matched "${searchQuery}". Try another name, username, or topic.`
                : 'No friends match the currently selected status filter.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterTab('all');
              }}
              className="btn-user-secondary"
              style={{ width: 'auto', padding: '10px 22px', marginTop: 10 }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Friends Grid */
          <div className="friends-cards-grid">
            {filteredFriends.map(friend => {
              const isPlayingVoice = playingVoiceId === friend.id;
              const isAvailable = friend.status === 'available_to_talk';
              const isInRoom = friend.status === 'in_room';

              return (
                <div key={friend.id} className="friend-card">
                  {/* Top Header: Avatar, Name, Handle, Resonance */}
                  <div className="friend-card-top">
                    <Link
                      to={`/user/${friend.id}`}
                      className="friend-user-anchor"
                      title={`View ${friend.fullName}'s profile`}
                    >
                      <div className="friend-avatar-wrap">
                        <div
                          className="friend-avatar-circle"
                          style={{ background: friend.avatarBg }}
                        >
                          {renderAvatar(friend.avatar, friend.fullName)}
                        </div>
                        {/* Voice Aura Ring */}
                        <span className={`friend-avatar-aura ${isAvailable ? 'active' : ''}`} />
                        {/* Availability Dot */}
                        <span
                          className={`friend-status-dot ${isAvailable ? 'available' : isInRoom ? 'in-room' : friend.isOnline ? 'online' : 'offline'}`}
                          title={friend.statusLabel || (isAvailable ? 'Available to Talk' : 'Online')}
                        />
                      </div>

                      <div className="friend-user-info">
                        <div className="friend-name-row">
                          <h3 className="friend-full-name">{friend.fullName}</h3>
                          <span className="friend-username">@{friend.username}</span>
                        </div>
                        <div className="friend-meta-row">
                          {friend.location && <span>📍 {friend.location}</span>}
                          {friend.location && <span className="friend-meta-bullet">&bull;</span>}
                          <span>💬 {friend.conversationStyle || 'Casual chats'}</span>
                        </div>
                      </div>
                    </Link>

                    {/* Match Score Badge */}
                    {friend.matchScore && (
                      <div className="discover-resonance-pill">
                        <IconSparkles size={13} />
                        <span>{friend.matchScore}%</span>
                      </div>
                    )}
                  </div>

                  {/* Status Indicator Pill */}
                  <div className="friend-status-strip">
                    <span className={`friend-status-badge ${isAvailable ? 'available' : isInRoom ? 'in-room' : 'online'}`}>
                      {isAvailable ? '🎙️ Available to Talk' : isInRoom ? '🎙️ In Audio Stage' : '● Online'}
                    </span>
                    <span className="friend-mutual-tag">
                      <IconCheck size={12} />
                      <span>Mutual Friend</span>
                    </span>
                  </div>

                  {/* Bio snippet */}
                  {friend.bio && (
                    <p className="friend-bio-text">
                      {friend.bio}
                    </p>
                  )}

                  {/* Shared Interests Chips */}
                  {friend.interests && friend.interests.length > 0 && (
                    <div className="friend-topics-cloud">
                      {friend.interests.slice(0, 3).map((topic, idx) => (
                        <span key={idx} className="friend-topic-chip">
                          #{topic}
                        </span>
                      ))}
                      {friend.interests.length > 3 && (
                        <span className="friend-topic-more">
                          +{friend.interests.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Optional Voice Intro Audio Snippet */}
                  {friend.voicePrompt && (
                    <div className={`request-voice-snippet ${isPlayingVoice ? 'playing' : ''}`} style={{ marginTop: 2 }}>
                      <button
                        type="button"
                        onClick={(e) => handleToggleVoicePlay(e, friend.id)}
                        className="request-voice-play-btn"
                        aria-label={isPlayingVoice ? 'Pause voice prompt' : 'Play voice intro'}
                      >
                        {isPlayingVoice ? '⏸' : '▶'}
                      </button>
                      <div className="request-voice-text">
                        <div className="request-voice-title">&ldquo;{friend.voicePrompt.title}&rdquo;</div>
                        <div className="request-voice-duration">{friend.voicePrompt.duration} voice intro</div>
                      </div>
                    </div>
                  )}

                  {/* Card Actions Footer */}
                  <div className="friend-actions-footer">
                    <button
                      type="button"
                      onClick={(e) => handleStartVoiceCallClick(e, friend)}
                      className={`btn-friend-voice-call ${isAvailable ? 'active' : 'subdued'}`}
                      title={isAvailable ? 'Start 1-to-1 Voice Chat' : `${friend.fullName} is currently ${friend.statusLabel || 'busy'}`}
                    >
                      <IconPhoneCall size={16} />
                      <span>{isAvailable ? 'Voice Chat' : 'Busy'}</span>
                    </button>

                    <Link
                      to={`/messages/${friend.id}`}
                      className="btn-friend-message"
                      title={`Send direct message to ${friend.fullName}`}
                    >
                      <IconMessageSquare size={15} />
                      <span>Message</span>
                    </Link>

                    <Link
                      to={`/user/${friend.id}`}
                      className="btn-friend-profile"
                      title={`View ${friend.fullName}'s profile`}
                    >
                      Profile &rarr;
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => handleRemoveFriendClick(e, friend)}
                      className="btn-friend-profile"
                      style={{ flex: 'none', padding: '0 10px', color: 'var(--user-text-muted)', border: '1px solid var(--user-border)' }}
                      title={`Unfriend ${friend.fullName}`}
                      disabled={removingId === friend.id}
                    >
                      {removingId === friend.id ? '...' : '✕'}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </UserLayout>
  );
}
