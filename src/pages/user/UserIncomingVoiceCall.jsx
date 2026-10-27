import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from '../../router';
import { useFriendRequests } from '../../context/FriendRequestContext';
import {
  MOCK_DISCOVER_PEOPLE,
  getUserProfile
} from '../../data/userMockData';
import {
  IconPhoneCall,
  IconLock,
  IconSparkles,
  IconChevronLeft
} from '../../components/common/Icons';

// Inline Phone Hangup SVG Icon
const IconPhoneOff = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
    <line x1="23" y1="1" x2="1" y2="23" />
  </svg>
);

import { renderAvatar } from '../../utils/avatarUtils';


import { useLocation } from '../../router';
import { useSocket } from '../../context/SocketContext';
import { updateCallStatusApi } from '../../services/userVoiceCallApi';
import { getPublicUserProfile } from '../../services/discoverApi';

export default function UserIncomingVoiceCall() {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { connectedFriends } = useFriendRequests();
  const { socket, isConnected } = useSocket();

  const [fetchedCaller, setFetchedCaller] = useState(null);

  // Read callId from query params
  const callId = useMemo(() => {
    try {
      return new URLSearchParams(location.search).get('callId') || null;
    } catch {
      return null;
    }
  }, [location.search]);

  // Find caller from connected friends, mock discover directory, or REST API
  const caller = useMemo(() => {
    if (!userId) return null;
    const findMatch = (u) =>
      u &&
      (u.id === userId ||
        u._id === userId ||
        (u._id && u._id.toString() === userId) ||
        u.username === userId);

    return (
      connectedFriends.find(findMatch) ||
      MOCK_DISCOVER_PEOPLE.find(findMatch) ||
      fetchedCaller ||
      null
    );
  }, [connectedFriends, userId, fetchedCaller]);

  useEffect(() => {
    if (!userId) return;
    const findMatch = (u) =>
      u &&
      (u.id === userId ||
        u._id === userId ||
        (u._id && u._id.toString() === userId) ||
        u.username === userId);

    const local = connectedFriends.find(findMatch) || MOCK_DISCOVER_PEOPLE.find(findMatch);
    if (!local) {
      getPublicUserProfile(userId)
        .then(res => {
          if (res?.user) setFetchedCaller(res.user);
        })
        .catch(() => {});
    }
  }, [userId, connectedFriends]);

  // Current user (for computing shared conversation topics)
  const currentUser = useMemo(() => getUserProfile(), []);

  // Call state: 'ringing' | 'declined' | 'missed'
  const [callState, setCallState] = useState('ringing');
  const [ringTimeRemaining, setRingTimeRemaining] = useState(30);

  const ringTimerRef = useRef(null);

  // Listen to remote call cancellation/end
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleRemoteCallEnded = (data) => {
      if (!data || !callId || data.callId === callId || String(data.callId) === String(callId)) {
        if (ringTimerRef.current) clearInterval(ringTimerRef.current);
        setCallState('missed');
      }
    };

    socket.on('call:ended', handleRemoteCallEnded);
    socket.on('call:declined', handleRemoteCallEnded);

    return () => {
      socket.off('call:ended', handleRemoteCallEnded);
      socket.off('call:declined', handleRemoteCallEnded);
    };
  }, [socket, isConnected, callId]);

  // 30-Second Ringing Timeout
  useEffect(() => {
    if (callState !== 'ringing') return;

    ringTimerRef.current = setInterval(() => {
      setRingTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(ringTimerRef.current);
          setCallState('missed');
          if (callId) {
            updateCallStatusApi(callId, { status: 'missed', endReason: 'timeout' }).catch(() => {});
            if (socket && isConnected) {
              socket.emit('call:decline', { callId, endReason: 'timeout' });
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (ringTimerRef.current) clearInterval(ringTimerRef.current);
    };
  }, [callState, callId, socket, isConnected]);

  // Compute shared topics between caller and current user
  const sharedTopics = useMemo(() => {
    if (!caller || !currentUser || !caller.interests || !currentUser.interests) {
      return [];
    }
    const currentLower = currentUser.interests.map(t => t.toLowerCase().trim());
    return caller.interests.filter(topic =>
      currentLower.some(ct => ct === topic.toLowerCase().trim() || ct.includes(topic.toLowerCase()) || topic.toLowerCase().includes(ct))
    );
  }, [caller, currentUser]);

  // ── Actions ────────────────────────────────────────────────────────
  // Accept: Emits socket event, updates REST status to 'ongoing', and navigates to /voice/:userId
  const handleAccept = () => {
    if (ringTimerRef.current) clearInterval(ringTimerRef.current);
    if (callId) {
      if (socket && isConnected) {
        socket.emit('call:accept', { callId });
      }
      updateCallStatusApi(callId, { status: 'ongoing' }).catch(() => {});
    }
    navigate(`/voice/${caller?.id || userId}`);
  };

  // Decline: Emits socket event, updates REST status to 'declined', and redirects back to /friends
  const handleDecline = () => {
    if (ringTimerRef.current) clearInterval(ringTimerRef.current);
    setCallState('declined');

    if (callId) {
      if (socket && isConnected) {
        socket.emit('call:decline', { callId, endReason: 'user_declined' });
      }
      updateCallStatusApi(callId, { status: 'declined', endReason: 'user_declined' }).catch(() => {});
    }

    setTimeout(() => {
      navigate('/friends');
    }, 1200);
  };

  // ── Fallback: Caller Not Found ─────────────────────────────────────
  if (!caller) {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="voice-room-container" style={{ justifyContent: 'center' }}>
          <div className="voice-ended-card" style={{ maxWidth: 460 }}>
            <div
              className="voice-ended-icon"
              style={{ background: 'rgba(255, 51, 133, 0.12)', color: 'var(--user-primary)' }}
            >
              🔍
            </div>
            <h2 className="voice-ended-title">Caller Not Found</h2>
            <p className="voice-ended-sub">
              This incoming voice call is no longer active or the caller ID is invalid.
            </p>
            <Link
              to="/friends"
              className="btn-user-primary"
              style={{ width: 'auto', display: 'inline-flex', padding: '12px 28px' }}
            >
              Back to Friends &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Missed Call State ──────────────────────────────────────────────
  if (callState === 'missed') {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="voice-room-container" style={{ justifyContent: 'center' }}>
          <div className="voice-ended-card" style={{ maxWidth: 480 }}>
            <div
              className="voice-ended-icon"
              style={{ background: 'rgba(245, 158, 11, 0.14)', color: '#F59E0B' }}
            >
              <IconPhoneOff size={28} />
            </div>
            <h2 className="voice-ended-title">Call Missed</h2>
            <p className="voice-ended-sub">
              You missed an incoming voice call from <strong style={{ color: '#FFFFFF' }}>{caller.fullName}</strong>.
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 20,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--user-border)',
                color: 'var(--user-text-secondary)',
                fontSize: '0.84rem',
                marginBottom: 24
              }}
            >
              <span>⏱️ Rang for 30s</span>
              <span>&bull;</span>
              <span>Just now</span>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/friends"
                className="btn-user-secondary"
                style={{ width: 'auto', padding: '11px 22px', fontSize: '0.9rem', textDecoration: 'none' }}
              >
                Back to Friends
              </Link>
              <button
                type="button"
                onClick={() => navigate(`/voice/${caller.id}`)}
                className="btn-user-primary"
                style={{
                  width: 'auto',
                  padding: '11px 26px',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <IconPhoneCall size={16} />
                <span>Call Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Declined Feedback State ─────────────────────────────────────────
  if (callState === 'declined') {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="voice-room-container" style={{ justifyContent: 'center' }}>
          <div className="voice-ended-card" style={{ maxWidth: 440 }}>
            <div
              className="voice-ended-icon"
              style={{ background: 'rgba(239, 68, 68, 0.14)', color: '#EF4444' }}
            >
              <IconPhoneOff size={28} />
            </div>
            <h2 className="voice-ended-title">Call Declined</h2>
            <p className="voice-ended-sub">
              You declined the incoming call from {caller.fullName}. Returning to your friends...
            </p>
            <Link
              to="/friends"
              className="btn-user-secondary"
              style={{ width: 'auto', display: 'inline-flex', padding: '10px 22px', marginTop: 12, textDecoration: 'none' }}
            >
              Return to Friends Now &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Ringing / Incoming Call Stage ──────────────────────────────────
  return (
    <div className="user-app-shell">
      {/* Background ambient lighting blobs */}
      <div className="user-ambient-blob-1" aria-hidden="true" />
      <div className="user-ambient-blob-2" aria-hidden="true" />

      <div className="voice-room-container incoming-call-container">

        {/* ── 1. Minimal Top Navigation ───────────────────────────────── */}
        <header className="voice-room-header">
          <Link to="/friends" className="voice-back-btn" title="Back to Friends">
            <IconChevronLeft size={18} />
            <span>Friends</span>
          </Link>

          <div className="voice-privacy-pill">
            <IconLock size={14} style={{ color: 'var(--user-status-online)' }} />
            <span>Private 1-to-1 Voice Chat</span>
          </div>

          <Link
            to={`/user/${caller.id}`}
            className="voice-profile-link"
            title={`View ${caller.fullName}'s Profile`}
          >
            <span>View Profile</span>
            <span style={{ fontSize: '0.8rem' }}>&rarr;</span>
          </Link>
        </header>

        {/* ── 2. Center Stage (Caller Identity & Incoming Aura) ────────── */}
        <main className="voice-stage incoming-call-stage">

          {/* Incoming Call Label Badge */}
          <div className="incoming-badge-banner">
            <span className="incoming-pulse-dot" />
            <span className="incoming-badge-text">Incoming Voice Call</span>
            <span className="incoming-timer-pill">{ringTimeRemaining}s</span>
          </div>

          {/* Large Pulsating Caller Avatar Stage */}
          <div className="voice-avatar-stage incoming-avatar-stage">
            {/* Concentric Incoming Call Pulse Rings */}
            <div className="incoming-aura-outer" />
            <div className="incoming-aura-middle" />
            <div className="incoming-aura-inner" />

            {/* Core Avatar Circle */}
            <div
              className="voice-avatar-circle incoming-avatar-glow"
              style={{ background: caller.avatarBg || 'linear-gradient(135deg, #FF3385, #8B2FC9)', overflow: 'hidden' }}
            >
              {renderAvatar(caller.avatar, caller.fullName)}
            </div>

            {/* Ringing Sound Wave Pill */}
            <div className="incoming-waveform-strip">
              <span className="incoming-wave-bar bar-1" />
              <span className="incoming-wave-bar bar-2" />
              <span className="incoming-wave-bar bar-3" />
              <span className="incoming-wave-bar bar-4" />
              <span className="incoming-wave-bar bar-5" />
            </div>
          </div>

          {/* Caller Identity Details */}
          <div className="voice-identity-wrap" style={{ marginTop: 22 }}>
            <h1 className="voice-friend-name">
              {caller.fullName}
            </h1>
            <div className="voice-friend-handle">
              @{caller.username}
            </div>

            {/* Availability Status Pill */}
            <div className="incoming-status-row">
              <span
                className="profile-status-indicator"
                style={{
                  backgroundColor:
                    caller.status === 'available_to_talk'
                      ? 'var(--user-status-online)'
                      : caller.isOnline
                      ? '#38BDF8'
                      : 'var(--user-text-muted)',
                  width: 9,
                  height: 9
                }}
              />
              <span className="incoming-status-label">
                {caller.statusLabel || (caller.status === 'available_to_talk' ? 'Available to Talk' : caller.isOnline ? 'Online' : 'Member')}
              </span>
            </div>

            {/* Shared Interests Banner (if applicable) */}
            {sharedTopics.length > 0 ? (
              <div className="incoming-shared-topics-card">
                <div className="incoming-shared-title">
                  <IconSparkles size={14} style={{ color: 'var(--user-primary)' }} />
                  <span>You both enjoy:</span>
                </div>
                <div className="incoming-topics-cloud">
                  {sharedTopics.slice(0, 3).map((topic, i) => (
                    <span key={i} className="incoming-topic-chip">
                      #{topic}
                    </span>
                  ))}
                  {sharedTopics.length > 3 && (
                    <span className="incoming-topic-more">
                      +{sharedTopics.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ) : caller.bio ? (
              <p className="incoming-caller-bio">
                &ldquo;{caller.bio}&rdquo;
              </p>
            ) : null}
          </div>

          {/* ── 3. Bottom Primary Actions (Decline & Accept) ──────────── */}
          <div className="incoming-actions-dock">
            {/* Decline Action */}
            <div className="incoming-action-col">
              <button
                type="button"
                onClick={handleDecline}
                className="btn-incoming-circle btn-incoming-decline"
                title="Decline Call"
                aria-label="Decline incoming call"
              >
                <IconPhoneOff size={26} />
              </button>
              <span className="incoming-action-label decline-label">Decline</span>
            </div>

            {/* Accept Action */}
            <div className="incoming-action-col">
              <button
                type="button"
                onClick={handleAccept}
                className="btn-incoming-circle btn-incoming-accept"
                title="Accept Voice Call"
                aria-label="Accept incoming voice call"
              >
                <IconPhoneCall size={28} />
              </button>
              <span className="incoming-action-label accept-label">Accept Call</span>
            </div>
          </div>

        </main>

      </div>
    </div>
  );
}
