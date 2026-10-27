import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import { useMessages } from '../../context/MessagesContext';
import { useFriendRequests } from '../../context/FriendRequestContext';
import {
  IconMessageSquare,
  IconSearch,
  IconChevronLeft,
  IconCheck,
  IconX,
  IconSparkles
} from '../../components/common/Icons';

import { renderAvatar } from '../../utils/avatarUtils';


export default function UserMessagesList() {
  const navigate = useNavigate();
  const { conversations, totalUnreadCount, isLoading, error, fetchConversations, markAsRead } = useMessages();
  const { connectedFriends } = useFriendRequests();
  const [searchQuery, setSearchQuery] = useState('');

  // Resolve friend object for each conversation
  const resolvedConversations = useMemo(() => {
    return conversations.map(conv => {
      const friend = conv.friend ||
        connectedFriends.find(f => f.id === conv.friendId || f._id === conv.friendId) || {
          id: conv.friendId || 'unknown',
          fullName: 'Voice Friend',
          username: 'friend',
          avatar: '🎧',
          avatarBg: 'var(--user-brand-gradient)',
          isOnline: false,
          status: 'offline'
        };

      return {
        ...conv,
        friend
      };
    });
  }, [conversations, connectedFriends]);

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return resolvedConversations;
    const q = searchQuery.toLowerCase().trim();

    return resolvedConversations.filter(item => {
      const nameMatch = (item.friend?.fullName || '').toLowerCase().includes(q);
      const userMatch = (item.friend?.username || '').toLowerCase().includes(q);
      const msgMatch = (item.lastMessage || '').toLowerCase().includes(q);
      return nameMatch || userMatch || msgMatch;
    });
  }, [resolvedConversations, searchQuery]);

  const handleOpenConversation = (targetId) => {
    markAsRead(targetId);
    navigate(`/messages/${targetId}`);
  };

  return (
    <UserLayout>
      <div className="profile-page-container">

        {/* ── Top Navigation Bar ───────────────────────────────────────── */}
        <div className="profile-top-bar">
          <Link to="/friends" className="profile-back-link">
            <IconChevronLeft size={16} />
            <span>Back to Friends</span>
          </Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="profile-badge-public">
              💬 Direct Messages
            </span>
          </div>
        </div>

        {/* ── Screen Header Block ─────────────────────────────────────── */}
        <div className="requests-header-block" style={{ marginBottom: 24 }}>
          <div className="requests-header-content">
            <div className="requests-header-pill">
              <IconMessageSquare size={14} />
              <span>Direct Messages</span>
            </div>
            <h1 className="requests-header-title">Messages</h1>
            <p className="requests-header-sub">
              Stay in touch with your voice connections. Mutual friends can chat anytime and easily transition to 1-on-1 audio calls.
            </p>
          </div>

          <div className="requests-stats-strip">
            <div className="requests-stat-chip">
              <span className="requests-stat-chip-label">Conversations</span>
              <span className="requests-stat-chip-count" style={{ color: 'var(--user-primary)' }}>
                {conversations.length}
              </span>
            </div>
            {totalUnreadCount > 0 && (
              <div className="requests-stat-chip">
                <span className="requests-stat-chip-label">Unread</span>
                <span className="requests-stat-chip-count" style={{ color: 'var(--user-status-online)' }}>
                  {totalUnreadCount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Search Input Bar ────────────────────────────────────────── */}
        <div className="discover-controls-wrap" style={{ marginBottom: 24 }}>
          <div className="discover-search-box" style={{ width: '100%', maxWidth: '100%' }}>
            <span className="discover-search-icon">
              <IconSearch size={18} />
            </span>
            <input
              type="text"
              placeholder="Search conversations by friend name, @username, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="discover-search-input"
              aria-label="Search conversations"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="discover-search-clear"
                title="Clear search"
              >
                <IconX size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Loading / Error / Roster Content ────────────────────────── */}
        {isLoading && conversations.length === 0 ? (
          <div className="requests-empty-card" style={{ padding: '48px 24px', marginTop: 10 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔄</div>
            <h3 className="requests-empty-title">Loading conversations...</h3>
            <p className="requests-empty-sub">Connecting to your direct messages...</p>
          </div>
        ) : error ? (
          <div className="requests-empty-card" style={{ padding: '40px 20px', marginTop: 10 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
            <h3 className="requests-empty-title">Failed to load messages</h3>
            <p className="requests-empty-sub">{error}</p>
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                onClick={fetchConversations}
                className="btn-user-primary"
                style={{ padding: '8px 22px', fontSize: '0.88rem' }}
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="messages-conversations-list">
            {filteredConversations.map(conv => {
              const hasUnread = (conv.unreadCount || 0) > 0;
              const isAvailable = conv.friend?.status === 'available_to_talk';
              const targetId = conv.friendId || conv.id;

              return (
                <div
                  key={conv.id || targetId}
                  className={`conversation-item-card ${hasUnread ? 'has-unread' : ''}`}
                  onClick={() => handleOpenConversation(targetId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleOpenConversation(targetId);
                  }}
                >
                  {/* Friend Avatar with Status indicator */}
                  <div className="conv-avatar-wrap">
                    <div
                      className="conv-avatar"
                      style={{ background: conv.friend?.avatarBg || 'var(--user-brand-gradient)' }}
                    >
                      {renderAvatar(conv.friend?.avatar, conv.friend?.fullName)}
                    </div>
                    <span
                      className={`conv-status-dot ${isAvailable ? 'available' : conv.friend?.isOnline ? 'online' : 'offline'}`}
                      title={isAvailable ? 'Available to Talk' : conv.friend?.isOnline ? 'Online' : 'Offline'}
                    />
                  </div>

                  {/* Conversation Details */}
                  <div className="conv-details-col">
                    <div className="conv-header-row">
                      <div className="conv-name-group">
                        <span className="conv-friend-name">{conv.friend?.fullName}</span>
                        <span className="conv-friend-username">@{conv.friend?.username}</span>
                      </div>
                      <span className="conv-timestamp">{conv.lastMessageAt}</span>
                    </div>

                    <div className="conv-snippet-row">
                      <p className={`conv-last-message ${hasUnread ? 'unread-text' : ''}`}>
                        {conv.lastMessage}
                      </p>
                      {hasUnread && (
                        <span className="conv-unread-pill">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : searchQuery.trim() ? (
          /* Empty Search State */
          <div className="requests-empty-card" style={{ padding: '40px 20px', marginTop: 10 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
            <h3 className="requests-empty-title">No conversations found</h3>
            <p className="requests-empty-sub">
              No conversations matched &ldquo;{searchQuery}&rdquo;. Try another name or keyword.
            </p>
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn-user-primary"
                style={{ padding: '8px 22px', fontSize: '0.88rem' }}
              >
                Clear Search
              </button>
            </div>
          </div>
        ) : (
          /* Zero Conversations Empty State */
          <div className="requests-empty-card" style={{ padding: '48px 24px', marginTop: 10 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>💬</div>
            <h3 className="requests-empty-title">No conversations yet</h3>
            <p className="requests-empty-sub" style={{ maxWidth: 440, margin: '0 auto 20px auto' }}>
              Connect with friends to start chatting and hanging out. Send a message to any of your mutual friends to break the ice!
            </p>
            <Link
              to="/friends"
              className="btn-user-primary"
              style={{ display: 'inline-flex', padding: '10px 24px', fontSize: '0.9rem' }}
            >
              View My Friends
            </Link>
          </div>
        )}

      </div>
    </UserLayout>
  );
}
