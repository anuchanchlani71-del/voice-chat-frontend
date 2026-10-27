import React, { useState } from 'react';
import { Link } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import { useFriendRequests } from '../../context/FriendRequestContext';
import {
  IconUsers,
  IconCheck,
  IconSparkles,
  IconMic,
  IconUserCheck
} from '../../components/common/Icons';

import { renderAvatar } from '../../utils/avatarUtils';


export default function UserFriendRequests() {
  const {
    incomingRequests,
    sentRequests,
    incomingCount,
    sentCount,
    isLoading,
    acceptRequest,
    declineRequest,
    cancelRequest
  } = useFriendRequests();

  // Active tab: 'incoming' | 'sent'
  const [activeTab, setActiveTab] = useState('incoming');
  const [acceptedIds, setAcceptedIds] = useState([]);
  const [declinedIds, setDeclinedIds] = useState([]);
  const [cancellingIds, setCancellingIds] = useState([]);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  const handleAccept = async (e, reqId) => {
    e.stopPropagation();
    setAcceptedIds(prev => [...prev, reqId]);
    try {
      await acceptRequest(reqId);
    } catch (err) {
      console.error('Accept request failed:', err);
    } finally {
      setAcceptedIds(prev => prev.filter(id => id !== reqId));
    }
  };

  const handleDecline = async (e, reqId) => {
    e.stopPropagation();
    setDeclinedIds(prev => [...prev, reqId]);
    try {
      await declineRequest(reqId);
    } catch (err) {
      console.error('Decline request failed:', err);
    } finally {
      setDeclinedIds(prev => prev.filter(id => id !== reqId));
    }
  };

  const handleCancelSent = async (e, reqId) => {
    e.stopPropagation();
    setCancellingIds(prev => [...prev, reqId]);
    try {
      await cancelRequest(reqId);
    } catch (err) {
      console.error('Cancel request failed:', err);
    } finally {
      setCancellingIds(prev => prev.filter(id => id !== reqId));
    }
  };

  const handleTogglePlayVoice = (e, userId) => {
    e.stopPropagation();
    setPlayingVoiceId(prev => (prev === userId ? null : userId));
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
              to="/friends"
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
              title="View Friends List"
            >
              <span>👥 View Friends</span>
            </Link>
            <span className="profile-badge-public">
              🤝 Connection Management
            </span>
          </div>
        </div>

        {/* ── Screen Header Area ───────────────────────────────────────── */}
        <div className="requests-header-block">
          <div className="requests-header-content">
            <div className="requests-header-pill">
              <IconUsers size={14} />
              <span>Voice Social Connections</span>
            </div>
            <h1 className="requests-header-title">Friend Requests</h1>
            <p className="requests-header-sub">
              Connect with people who want to talk, too. 1-on-1 voice calls are unlocked once you both connect.
            </p>
          </div>

          <div className="requests-stats-strip">
            <div className="requests-stat-chip">
              <span className="requests-stat-chip-label">Incoming</span>
              <span className="requests-stat-chip-count incoming">{incomingCount}</span>
            </div>
            <div className="requests-stat-chip">
              <span className="requests-stat-chip-label">Pending Sent</span>
              <span className="requests-stat-chip-count sent">{sentCount}</span>
            </div>
          </div>
        </div>

        {/* ── Tab Switcher ────────────────────────────────────────────── */}
        <div className="requests-tabs-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('incoming')}
            className={`requests-tab-btn ${activeTab === 'incoming' ? 'active' : ''}`}
          >
            <span>📥 Incoming</span>
            <span className={`requests-tab-badge ${incomingCount > 0 ? 'highlight' : ''}`}>
              {incomingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`requests-tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          >
            <span>📤 Sent</span>
            <span className="requests-tab-badge">
              {sentCount}
            </span>
          </button>
        </div>

        {/* ── TAB 1: Incoming Requests ─────────────────────────────────── */}
        {activeTab === 'incoming' && (
          <div className="requests-tab-panel">
            {isLoading && incomingRequests.length === 0 ? (
              <div className="discover-empty-state" style={{ marginTop: 10 }}>
                <div className="discover-empty-icon">⏳</div>
                <h3 className="discover-empty-title">Loading requests...</h3>
                <p className="discover-empty-sub">
                  Checking for connection invitations.
                </p>
              </div>
            ) : incomingRequests.length === 0 ? (
              <div className="discover-empty-state" style={{ marginTop: 10 }}>
                <div className="discover-empty-icon">📬</div>
                <h3 className="discover-empty-title">No new requests</h3>
                <p className="discover-empty-sub">
                  When someone wants to connect with you, their request will appear here.
                </p>
                <Link
                  to="/discover"
                  className="btn-user-primary"
                  style={{ width: 'auto', display: 'inline-flex', padding: '12px 28px', marginTop: 8 }}
                >
                  Discover People &rarr;
                </Link>
              </div>
            ) : (
              <div className="requests-cards-list">
                {incomingRequests.map(req => {
                  const { user } = req;
                  const isAccepted = acceptedIds.includes(req.id);
                  const isDeclined = declinedIds.includes(req.id);
                  const isPlayingVoice = playingVoiceId === user.id;

                  return (
                    <div
                      key={req.id}
                      className={`request-card incoming ${isAccepted ? 'accepted-out' : ''} ${isDeclined ? 'declined-out' : ''}`}
                    >
                      {/* Top Row: User Avatar, Name, Handle, Match, Timestamp */}
                      <div className="request-card-header">
                        <Link
                          to={`/user/${user.id}`}
                          className="request-user-anchor"
                          title={`View ${user.fullName}'s profile`}
                        >
                          <div className="request-avatar-wrap">
                            <div
                              className="request-avatar-circle"
                              style={{ background: user.avatarBg }}
                            >
                              {renderAvatar(user.avatar, user.fullName)}
                            </div>
                            <span
                              className={`request-status-dot ${user.status === 'available_to_talk' ? 'available' : 'online'}`}
                              title={user.statusLabel}
                            />
                          </div>

                          <div className="request-user-info">
                            <div className="request-name-row">
                              <span className="request-full-name">{user.fullName}</span>
                              <span className="request-username">@{user.username}</span>
                            </div>
                            <div className="request-meta-row">
                              {user.location && <span>📍 {user.location}</span>}
                              {user.location && <span className="request-meta-bullet">&bull;</span>}
                              <span>💬 {user.conversationStyle || 'Chill conversationalist'}</span>
                            </div>
                          </div>
                        </Link>

                        <div className="request-header-right">
                          <div className="discover-resonance-pill">
                            <IconSparkles size={13} />
                            <span>{user.matchScore || 94}% Match</span>
                          </div>
                          <span className="request-timestamp">{req.createdAt}</span>
                        </div>
                      </div>

                      {/* Personal Note / Voice Message Quote if present */}
                      {req.personalNote && (
                        <div className="request-note-bubble">
                          <span className="request-note-quote-mark">&ldquo;</span>
                          <span className="request-note-text">{req.personalNote}</span>
                        </div>
                      )}

                      {/* Shared Interests Cloud */}
                      {user.interests && user.interests.length > 0 && (
                        <div className="request-interests-row">
                          <span className="request-interests-label">Shared Topics:</span>
                          <div className="request-tags-wrap">
                            {user.interests.slice(0, 4).map((topic, idx) => (
                              <span key={idx} className="request-tag-chip">
                                #{topic}
                              </span>
                            ))}
                            {user.interests.length > 4 && (
                              <span className="request-tag-more">
                                +{user.interests.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Optional Voice Intro Snippet */}
                      {user.voicePrompt && (
                        <div className={`request-voice-snippet ${isPlayingVoice ? 'playing' : ''}`}>
                          <button
                            type="button"
                            onClick={(e) => handleTogglePlayVoice(e, user.id)}
                            className="request-voice-play-btn"
                            aria-label={isPlayingVoice ? 'Pause voice prompt' : 'Play voice intro'}
                          >
                            {isPlayingVoice ? '⏸' : '▶'}
                          </button>
                          <div className="request-voice-text">
                            <div className="request-voice-title">&ldquo;{user.voicePrompt.title}&rdquo;</div>
                            <div className="request-voice-duration">{user.voicePrompt.duration} voice intro</div>
                          </div>
                        </div>
                      )}

                      {/* Actions Footer */}
                      <div className="request-actions-footer">
                        <div className="request-primary-actions">
                          <button
                            type="button"
                            onClick={(e) => handleAccept(e, req.id)}
                            className="btn-request-accept"
                            disabled={isAccepted}
                          >
                            <IconCheck size={16} />
                            <span>{isAccepted ? 'Accepted!' : 'Accept'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDecline(e, req.id)}
                            className="btn-request-decline"
                            disabled={isDeclined}
                          >
                            <span>Decline</span>
                          </button>
                        </div>

                        <Link
                          to={`/user/${user.id}`}
                          className="btn-request-profile"
                        >
                          View Profile &rarr;
                        </Link>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: Sent Requests ─────────────────────────────────────── */}
        {activeTab === 'sent' && (
          <div className="requests-tab-panel">
            {isLoading && sentRequests.length === 0 ? (
              <div className="discover-empty-state" style={{ marginTop: 10 }}>
                <div className="discover-empty-icon">⏳</div>
                <h3 className="discover-empty-title">Loading sent requests...</h3>
                <p className="discover-empty-sub">
                  Checking pending connection invitations.
                </p>
              </div>
            ) : sentRequests.length === 0 ? (
              <div className="discover-empty-state" style={{ marginTop: 10 }}>
                <div className="discover-empty-icon">📤</div>
                <h3 className="discover-empty-title">No pending requests</h3>
                <p className="discover-empty-sub">
                  People you connect with from Discover will appear here.
                </p>
                <Link
                  to="/discover"
                  className="btn-user-primary"
                  style={{ width: 'auto', display: 'inline-flex', padding: '12px 28px', marginTop: 8 }}
                >
                  Find Someone to Talk To &rarr;
                </Link>
              </div>
            ) : (
              <div className="requests-cards-list">
                {sentRequests.map(req => {
                  const { user } = req;
                  if (!user) return null;

                  return (
                    <div key={req.id} className="request-card sent">
                      {/* Top Row: User Avatar, Name, Handle, Status */}
                      <div className="request-card-header">
                        <Link
                          to={`/user/${user.id}`}
                          className="request-user-anchor"
                          title={`View ${user.fullName}'s profile`}
                        >
                          <div className="request-avatar-wrap">
                            <div
                              className="request-avatar-circle"
                              style={{ background: user.avatarBg }}
                            >
                              {renderAvatar(user.avatar, user.fullName)}
                            </div>
                            <span
                              className={`request-status-dot ${user.status === 'available_to_talk' ? 'available' : 'online'}`}
                              title={user.statusLabel}
                            />
                          </div>

                          <div className="request-user-info">
                            <div className="request-name-row">
                              <span className="request-full-name">{user.fullName}</span>
                              <span className="request-username">@{user.username}</span>
                            </div>
                            <div className="request-meta-row">
                              {user.location && <span>📍 {user.location}</span>}
                              {user.location && <span className="request-meta-bullet">&bull;</span>}
                              <span>💬 {user.conversationStyle || 'Chill conversationalist'}</span>
                            </div>
                          </div>
                        </Link>

                        <div className="request-header-right">
                          <span className="request-pending-pill">
                            ⏳ Request Pending
                          </span>
                          <span className="request-timestamp">Sent {req.createdAt}</span>
                        </div>
                      </div>

                      {/* Bio or Topics */}
                      {user.bio && (
                        <p className="request-sent-bio">
                          {user.bio}
                        </p>
                      )}

                      {user.interests && user.interests.length > 0 && (
                        <div className="request-interests-row">
                          <span className="request-interests-label">Their Topics:</span>
                          <div className="request-tags-wrap">
                            {user.interests.slice(0, 4).map((topic, idx) => (
                              <span key={idx} className="request-tag-chip">
                                #{topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions Footer */}
                      <div className="request-actions-footer">
                        <button
                          type="button"
                          onClick={(e) => handleCancelSent(e, req.id)}
                          className="btn-request-cancel"
                          disabled={cancellingIds.includes(req.id)}
                        >
                          <span>{cancellingIds.includes(req.id) ? 'Cancelling...' : 'Cancel Request'}</span>
                        </button>

                        <Link
                          to={`/user/${user.id}`}
                          className="btn-request-profile"
                        >
                          View Profile &rarr;
                        </Link>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </UserLayout>
  );
}
