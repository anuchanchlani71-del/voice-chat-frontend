import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from '../../router';
import { getRoomByIdApi, joinRoomApi } from '../../services/userRoomApi';
import { useAuth } from '../../context/AuthContext';
import {
  IconLock,
  IconUsers,
  IconChevronLeft,
  IconSparkles,
  IconMic,
  IconCheck
} from '../../components/common/Icons';

import { renderAvatar } from '../../utils/avatarUtils';


export default function UserGroupRoomInvite() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isDeclined, setIsDeclined] = useState(false);

  // Load room details from backend
  useEffect(() => {
    let isMounted = true;
    async function loadRoom() {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await getRoomByIdApi(roomId);
        if (res && res.success && res.groupVoiceRoom) {
          if (isMounted) setRoom(res.groupVoiceRoom);
        } else {
          if (isMounted) setFetchError('Room not found');
        }
      } catch (err) {
        if (isMounted) setFetchError(err.message || 'Room not found.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    if (roomId) {
      loadRoom();
    }
  }, [roomId]);

  // Check permissions & access
  const { isHost, isInvited, hasAccess } = useMemo(() => {
    if (!room || !currentUser) {
      return { isHost: false, isInvited: false, hasAccess: false };
    }

    const currentId = currentUser.id || (currentUser._id ? currentUser._id.toString() : '');
    const hostId = room.host ? (room.host.id || (room.host._id ? room.host._id.toString() : '')) : '';

    const hostCheck = hostId === currentId || (room.host && room.host.username === currentUser.username);

    const invitedList = room.invitedUsers || [];
    const invitedCheck = invitedList.some(
      u => (u.id || (u._id ? u._id.toString() : u.toString())) === currentId || u.username === currentUser.username
    );

    const accessCheck = room.accessType !== 'invite_only' || hostCheck || invitedCheck;

    return {
      isHost: hostCheck,
      isInvited: invitedCheck,
      hasAccess: accessCheck
    };
  }, [room, currentUser]);

  // Join Room: Calls joinRoomApi and navigates to UserActiveVoiceRoom.jsx
  const handleJoinRoom = async () => {
    if (room) {
      try {
        await joinRoomApi(room.id);
      } catch (e) {
        // Continue to room view even if join notice returned
      }
      navigate(`/room/${room.id}`);
    }
  };

  // Decline: Local feedback
  const handleDeclineInvite = () => {
    setIsDeclined(true);
    setTimeout(() => {
      navigate('/notifications');
    }, 1400);
  };

  // ── 0. LOADING STATE ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="group-room-stage-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ color: 'var(--user-text-secondary)', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.95rem' }}>
            <span className="room-status-pulse" style={{ background: 'var(--user-primary)' }} />
            <span>Loading room invitation details...</span>
          </div>
        </div>
      </div>
    );
  }

  // ── INVALID STATE 1: Room Not Found ──────────────────────────────────
  if (!room) {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="group-room-stage-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="voice-ended-card" style={{ maxWidth: 480 }}>
            <div
              className="voice-ended-icon"
              style={{ background: 'rgba(255, 51, 133, 0.12)', color: 'var(--user-primary)' }}
            >
              🔍
            </div>
            <h2 className="voice-ended-title">Room Not Found</h2>
            <p className="voice-ended-sub" style={{ margin: '12px 0 24px 0' }}>
              This room invite is no longer available.
            </p>
            <Link
              to="/notifications"
              className="btn-user-primary"
              style={{ width: 'auto', display: 'inline-flex', padding: '12px 28px', textDecoration: 'none' }}
            >
              Back to Notifications &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── INVALID STATE 2: Room Ended or Closed ────────────────────────────
  if (room.status === 'ended' || room.status === 'closed') {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="group-room-stage-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="voice-ended-card" style={{ maxWidth: 480 }}>
            <div
              className="voice-ended-icon"
              style={{ background: 'rgba(239, 68, 68, 0.14)', color: '#EF4444' }}
            >
              <IconLock size={28} />
            </div>
            <h2 className="voice-ended-title">Room Ended</h2>
            <p className="voice-ended-sub" style={{ margin: '12px 0 24px 0' }}>
              This room is no longer active.
            </p>
            <Link
              to="/notifications"
              className="btn-user-primary"
              style={{ width: 'auto', display: 'inline-flex', padding: '12px 28px', textDecoration: 'none' }}
            >
              Back to Notifications &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── INVALID STATE 3: User Not Invited to Invite-Only Room ────────────
  if (room.accessType === 'invite_only' && !hasAccess) {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="group-room-stage-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="voice-ended-card" style={{ maxWidth: 480 }}>
            <div
              className="voice-ended-icon"
              style={{ background: 'rgba(245, 158, 11, 0.14)', color: '#F59E0B' }}
            >
              <IconLock size={28} />
            </div>
            <h2 className="voice-ended-title">Access Restricted</h2>
            <p className="voice-ended-sub" style={{ margin: '12px 0 24px 0' }}>
              You don&apos;t have access to this invite-only room.
            </p>
            <Link
              to="/notifications"
              className="btn-user-primary"
              style={{ width: 'auto', display: 'inline-flex', padding: '12px 28px', textDecoration: 'none' }}
            >
              Back to Notifications &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── LOCAL DECLINED STATE ─────────────────────────────────────────────
  if (isDeclined) {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="group-room-stage-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="voice-ended-card" style={{ maxWidth: 460 }}>
            <div
              className="voice-ended-icon"
              style={{ background: 'rgba(255, 51, 133, 0.14)', color: 'var(--user-primary)' }}
            >
              <IconCheck size={28} />
            </div>
            <h2 className="voice-ended-title">Invitation Declined</h2>
            <p className="voice-ended-sub" style={{ margin: '12px 0 20px 0' }}>
              You declined the invitation to join &ldquo;{room.title}&rdquo;. Returning to your notifications...
            </p>
            <Link
              to="/notifications"
              className="btn-user-secondary"
              style={{ width: 'auto', display: 'inline-flex', padding: '10px 22px', textDecoration: 'none' }}
            >
              Back to Notifications Now &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── VALID INVITATION PREVIEW STAGE ───────────────────────────────────
  return (
    <div className="user-app-shell">
      {/* Ambient background lighting */}
      <div className="user-ambient-blob-1" aria-hidden="true" />
      <div className="user-ambient-blob-2" aria-hidden="true" />

      <div className="group-room-stage-shell room-invite-stage">

        {/* ── 1. Top Minimal Navigation Bar ─────────────────────────── */}
        <header className="group-room-header" style={{ marginBottom: 24 }}>
          <div className="group-room-header-left">
            <Link
              to="/notifications"
              className="group-room-back-btn"
              title="Return to Notifications"
            >
              <IconChevronLeft size={16} />
              <span>Back to Notifications</span>
            </Link>
          </div>

          <div className="voice-privacy-pill">
            <IconLock size={14} style={{ color: '#F59E0B' }} />
            <span>Invite-Only Audio Stage</span>
          </div>

          <div>
            <Link
              to={`/user/${room.host?.id || 'usr-disc-07'}`}
              className="voice-profile-link"
              title={`View ${room.host?.fullName || 'Host'}'s profile`}
            >
              <span>Host Profile</span>
              <span style={{ fontSize: '0.8rem' }}>&rarr;</span>
            </Link>
          </div>
        </header>

        {/* ── 2. Center Stage: Invite Preview Card ──────────────────── */}
        <main className="room-invite-card-wrapper">
          <div className="room-invite-card">

            {/* Host Invitation Callout Strip */}
            <div className="room-invite-host-badge">
              <div
                className="room-invite-host-avatar"
                style={{ background: room.host?.avatarBg || 'linear-gradient(135deg, #8B2FC9, #FF4081)', overflow: 'hidden' }}
              >
                {renderAvatar(room.host?.avatar, room.host?.fullName || room.host?.name)}
              </div>
              <div className="room-invite-host-info">
                <div className="room-invite-host-headline">
                  <strong>{room.host?.fullName || room.host?.name || 'Zoe Martinez'}</strong> invited you to join this room
                </div>
                <div className="room-invite-host-handle">
                  @{room.host?.username || 'zoe_ambient'} &bull; Stage Host
                </div>
              </div>
            </div>

            {/* Room Title & Access Badges */}
            <div className="room-invite-details-block">
              <div className="room-invite-badge-row">
                <span className="room-access-chip-invite">
                  <IconLock size={12} />
                  <span>Invite Only</span>
                </span>
                <span className="room-topic-tag-chip">
                  {room.tag || `#${(room.topic || 'VoiceRoom').replace(/[^a-zA-Z0-9]/g, '')}`}
                </span>
                {room.status === 'active' && (
                  <span className="room-live-indicator-chip">
                    <span className="room-live-dot" />
                    <span>Live Now</span>
                  </span>
                )}
              </div>

              <h1 className="room-invite-title">{room.title}</h1>

              <div className="room-invite-topic-sub">
                <IconSparkles size={14} style={{ color: 'var(--user-primary)', flexShrink: 0 }} />
                <span>{room.topic || 'Chill & Late Night Talks'}</span>
              </div>

              <p className="room-invite-desc">
                {room.description || 'Join this private audio stage to connect, listen, and participate in voice discussions.'}
              </p>
            </div>

            {/* Room Participant & Capacity Metrics */}
            <div className="room-invite-stats-strip">
              <div className="room-invite-stat-col">
                <div className="room-invite-stat-label">
                  <IconUsers size={14} />
                  <span>Participants</span>
                </div>
                <div className="room-invite-stat-val">
                  <strong>{room.participantCount || (room.speakers?.length || 1) + (room.listenersCount || 0)}</strong>
                  <span style={{ color: 'var(--user-text-muted)', fontWeight: 500 }}> / {room.capacity || 20} seats</span>
                </div>
              </div>

              <div className="room-invite-stat-col">
                <div className="room-invite-stat-label">
                  <IconMic size={14} />
                  <span>Active Speakers</span>
                </div>
                <div className="room-invite-stat-val">
                  <strong>{room.speakers?.length || 1} on mic</strong>
                </div>
              </div>
            </div>

            {/* Current On-Stage Speakers Preview */}
            {room.speakers && room.speakers.length > 0 && (
              <div className="room-invite-speakers-block">
                <div className="room-invite-speakers-title">
                  Currently on stage:
                </div>
                <div className="room-invite-speakers-list">
                  {room.speakers.map((speaker, idx) => (
                    <div key={idx} className="room-invite-speaker-pill">
                      <div className="room-invite-speaker-avatar" style={{ overflow: 'hidden' }}>
                        {renderAvatar(speaker.avatar, speaker.name, '🎙️')}
                        {speaker.isSpeaking && <span className="speaker-mic-dot" />}
                      </div>
                      <span className="room-invite-speaker-name">{speaker.name}</span>
                      {speaker.isSpeaking && (
                        <span className="speaker-speaking-badge">Speaking</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 3. Actions Dock (Decline & Join Room) ──────────────── */}
            <div className="room-invite-actions-dock">
              <button
                type="button"
                onClick={handleDeclineInvite}
                className="btn-room-invite-decline"
                title="Decline this room invitation"
              >
                Decline
              </button>

              <button
                type="button"
                onClick={handleJoinRoom}
                className="btn-room-invite-join"
                title="Enter this live voice room"
              >
                <IconMic size={18} />
                <span>Join Room</span>
              </button>
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}
