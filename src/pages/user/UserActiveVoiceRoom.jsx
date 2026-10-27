import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from '../../router';
import { getRoomByIdApi, joinRoomApi, leaveRoomApi, closeRoomApi, getRoomMembersApi } from '../../services/userRoomApi';
import { useAuth } from '../../context/AuthContext';
import { createGroupWebRTCManager } from '../../services/groupWebRTCManager';
import { MOCK_DISCOVER_PEOPLE, MOCK_CURRENT_USER_PREVIEW } from '../../data/userMockData';
import {
  IconMic,
  IconChevronLeft,
  IconGlobe,
  IconLock,
  IconUsers,
  IconTag,
  IconClock,
  IconSparkles,
  IconX,
  IconCheck
} from '../../components/common/Icons';

// Additional inline SVG icons for audio controls
const IconMicOff = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const IconHand = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-4 0v5" />
    <path d="M14 10V4a2 2 0 0 0-4 0v7" />
    <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

const IconLogOut = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconPower = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);

import { useSocket } from '../../context/SocketContext';

export default function UserActiveVoiceRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { socket, isConnected } = useSocket();

  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Real-time Socket.IO room subscriptions & signaling listeners
  useEffect(() => {
    if (!socket || !isConnected || !roomId) return;

    // Join room channel
    socket.emit('room:join', { roomId });

    const handleMemberJoined = (data) => {
      if (!data || data.roomId !== roomId) return;
      getRoomByIdApi(roomId).then(res => {
        if (res && res.groupVoiceRoom) setRoom(res.groupVoiceRoom);
      }).catch(() => {});
      getRoomMembersApi(roomId).then(memRes => {
        if (memRes && memRes.members) setMembers(memRes.members);
      }).catch(() => {});
    };

    const handleMemberLeft = (data) => {
      if (!data || data.roomId !== roomId) return;
      getRoomByIdApi(roomId).then(res => {
        if (res && res.groupVoiceRoom) setRoom(res.groupVoiceRoom);
      }).catch(() => {});
      getRoomMembersApi(roomId).then(memRes => {
        if (memRes && memRes.members) setMembers(memRes.members);
      }).catch(() => {});
    };

    const handleRoomClosed = (data) => {
      if (!data || data.roomId !== roomId) return;
      setIsRoomEnded(true);
      setRoom(prev => prev ? { ...prev, status: 'closed' } : null);
      if (groupWebRTCManagerRef.current) {
        groupWebRTCManagerRef.current.destroy();
        groupWebRTCManagerRef.current = null;
      }
      setRemoteStreams(new Map());
      setLocalIsSpeaking(false);
      setRemoteSpeakingUsers(new Set());
    };

    const handleHandRaised = (data) => {
      if (!data || data.roomId !== roomId) return;
      const { userId, user, isHandRaised: raised } = data;
      const uidStr = (userId || (user && (user.id || user._id)) || '').toString();
      const currentId = currentUser ? (currentUser.id || (currentUser._id ? currentUser._id.toString() : '')) : '';

      if (uidStr === currentId) {
        setIsHandRaised(!!raised);
      }

      setRoom(prev => {
        if (!prev) return prev;
        const currentRaised = Array.isArray(prev.raisedHands) ? prev.raisedHands : [];
        let nextRaised;
        if (raised) {
          if (!currentRaised.some(u => (u?.id || u?._id || u).toString() === uidStr)) {
            nextRaised = [...currentRaised, user || { id: uidStr, _id: uidStr }];
          } else {
            nextRaised = currentRaised;
          }
        } else {
          nextRaised = currentRaised.filter(u => (u?.id || u?._id || u).toString() !== uidStr);
        }
        return { ...prev, raisedHands: nextRaised };
      });
    };

    const handleSpeakerUpdated = (data) => {
      if (!data || data.roomId !== roomId) return;
      if (data.room) {
        setRoom(data.room);
      }
      const updatedUser = data.user;
      const currentId = currentUser ? (currentUser.id || (currentUser._id ? currentUser._id.toString() : '')) : '';
      const updatedUserIdStr = (updatedUser?.id || updatedUser?._id || '').toString();
      if (updatedUserIdStr === currentId) {
        if (data.action === 'promoted') {
          setIsHandRaised(false);
        }
      }
      getRoomMembersApi(roomId).then(memRes => {
        if (memRes && memRes.members) setMembers(memRes.members);
      }).catch(() => {});
    };

    const handleSpeakingStarted = (data) => {
      if (!data || data.roomId !== roomId) return;
      const currentId = currentUser ? (currentUser.id || (currentUser._id ? currentUser._id.toString() : '')) : '';
      const currentUsername = currentUser?.username;
      const uid = (data.userId || data.userMongoId || '').toString();
      const uname = data.username;
      if ((uid && uid === currentId) || (uname && uname === currentUsername)) return;

      setRemoteSpeakingUsers(prev => {
        const next = new Set(prev);
        if (data.userId) next.add(data.userId.toString());
        if (data.userMongoId) next.add(data.userMongoId.toString());
        if (uname) next.add(uname);
        return next;
      });
    };

    const handleSpeakingStopped = (data) => {
      if (!data || data.roomId !== roomId) return;
      setRemoteSpeakingUsers(prev => {
        const next = new Set(prev);
        if (data.userId) next.delete(data.userId.toString());
        if (data.userMongoId) next.delete(data.userMongoId.toString());
        if (data.username) next.delete(data.username);
        return next;
      });
    };

    socket.on('room:member_joined', handleMemberJoined);
    socket.on('room:member_left', handleMemberLeft);
    socket.on('room:closed', handleRoomClosed);
    socket.on('room:hand_raised', handleHandRaised);
    socket.on('room:speaker_updated', handleSpeakerUpdated);
    socket.on('room:speaking_started', handleSpeakingStarted);
    socket.on('room:speaking_stopped', handleSpeakingStopped);

    return () => {
      socket.emit('room:leave', { roomId });
      socket.off('room:member_joined', handleMemberJoined);
      socket.off('room:member_left', handleMemberLeft);
      socket.off('room:closed', handleRoomClosed);
      socket.off('room:hand_raised', handleHandRaised);
      socket.off('room:speaker_updated', handleSpeakerUpdated);
      socket.off('room:speaking_started', handleSpeakingStarted);
      socket.off('room:speaking_stopped', handleSpeakingStopped);
      setRemoteSpeakingUsers(new Set());
    };
  }, [socket, isConnected, roomId, currentUser]);

  // Load room data & join room on mount
  useEffect(() => {
    let isMounted = true;
    async function initRoom() {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await getRoomByIdApi(roomId);
        if (res && res.success && res.groupVoiceRoom) {
          if (isMounted) setRoom(res.groupVoiceRoom);

          // Try joining room if active or scheduled
          if (res.groupVoiceRoom.status === 'active' || res.groupVoiceRoom.status === 'scheduled') {
            try {
              const joinRes = await joinRoomApi(roomId);
              if (joinRes && joinRes.success && joinRes.groupVoiceRoom) {
                if (isMounted) setRoom(joinRes.groupVoiceRoom);
              }
            } catch (joinErr) {
              if (isMounted && joinErr.message) {
                console.warn('Room join info:', joinErr.message);
              }
            }
          }

          // Fetch sanitized room members
          try {
            const memRes = await getRoomMembersApi(roomId);
            if (memRes && memRes.success && memRes.members) {
              if (isMounted) setMembers(memRes.members);
            }
          } catch (memErr) {
            // Ignore members fetch error silently
          }
        } else {
          if (isMounted) setFetchError('Group voice room not found');
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || 'Failed to load room details.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (roomId) {
      initRoom();
    }
    return () => {
      isMounted = false;
    };
  }, [roomId]);


  // Is current user the host?
  const isHost = useMemo(() => {
    if (!room || !room.host || !currentUser) return false;
    const hostId = room.host.id || (room.host._id ? room.host._id.toString() : '');
    const currentId = currentUser.id || (currentUser._id ? currentUser._id.toString() : '');
    return (
      hostId === currentId ||
      room.host.username === currentUser.username
    );
  }, [room, currentUser]);

  // Is current user an approved speaker?
  const isSpeaker = useMemo(() => {
    if (!room || !currentUser) return false;
    const currentId = currentUser.id || (currentUser._id ? currentUser._id.toString() : '');
    const currentUsername = currentUser.username;
    if (Array.isArray(room.speakers)) {
      return room.speakers.some((sp) => {
        const spId = sp?.id || (sp?._id ? sp._id.toString() : (typeof sp === 'string' ? sp : ''));
        return spId === currentId || (sp?.username && sp.username === currentUsername);
      });
    }
    return false;
  }, [room, currentUser]);

  // Check invite-only access
  const hasAccess = useMemo(() => {
    if (!room) return false;
    if (room.accessType !== 'invite_only') return true;
    if (isHost) return true;

    // Check if current user is invited
    const currentId = currentUser ? (currentUser.id || (currentUser._id ? currentUser._id.toString() : '')) : '';
    const invited = room.invitedUsers || [];
    const isInvited = invited.some(
      u => (u.id || (u._id ? u._id.toString() : u.toString())) === currentId || u.username === currentUser?.username
    );
    return isInvited;
  }, [room, isHost, currentUser]);

  // Local Controls State
  const [isMuted, setIsMuted] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRoomEnded, setIsRoomEnded] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showHostLeaveModal, setShowHostLeaveModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [shareToastText, setShareToastText] = useState(null);
  const [showAgenda, setShowAgenda] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(128); // starting duration
  const [activeSpeakerIdx, setActiveSpeakerIdx] = useState(0); // 0 = host
  const [microphonePermissionDenied, setMicrophonePermissionDenied] = useState(false);
  const [localIsSpeaking, setLocalIsSpeaking] = useState(false);
  const [remoteSpeakingUsers, setRemoteSpeakingUsers] = useState(new Set());

  // Active remote audio MediaStreams for multi-user WebRTC playback
  const [remoteStreams, setRemoteStreams] = useState(new Map());

  const groupWebRTCManagerRef = useRef(null);
  const timerRef = useRef(null);

  // Group WebRTC Manager (Phase 3B Multi-User Negotiation Foundation)
  useEffect(() => {
    if (!roomId) return;

    const manager = createGroupWebRTCManager({
      roomId,
      socket,
      currentUser,
      isHost,
      isSpeaker,
      isPublisher: isHost || isSpeaker,
      onLocalSpeakingChange: (speaking) => {
        setLocalIsSpeaking(speaking);
      },
      onRemoteSpeakingChange: (_remoteUserId, _isSpeaking, speakingSet) => {
        setRemoteSpeakingUsers(new Set(speakingSet));
      },
      onRemoteStream: (remoteUserId, stream) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(remoteUserId, stream);
          return next;
        });
      },
      onRemoteStreamRemoved: (remoteUserId) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(remoteUserId);
          return next;
        });
      },
      onError: (err) => {
        if (err && err.code === 'permission_denied') {
          setMicrophonePermissionDenied(true);
        }
      }
    });

    groupWebRTCManagerRef.current = manager;

    return () => {
      manager.destroy();
      groupWebRTCManagerRef.current = null;
      setRemoteStreams(new Map());
      setLocalIsSpeaking(false);
      setRemoteSpeakingUsers(new Set());
    };
  }, [roomId, socket, isConnected]);

  // Auto-acquire microphone for publishers (Host / Approved Speaker)
  useEffect(() => {
    if ((isHost || isSpeaker) && groupWebRTCManagerRef.current && !groupWebRTCManagerRef.current.getLocalStream()) {
      groupWebRTCManagerRef.current.startLocalAudio().catch((err) => {
        if (err && err.code === 'permission_denied') {
          setMicrophonePermissionDenied(true);
        }
      });
    }
  }, [isHost, isSpeaker]);

  // Build normalized participant roster for WebRTC negotiation sync
  const participants = useMemo(() => {
    if (!room) return [];
    const list = [];
    if (room.host) {
      const hostId = room.host.id || (room.host._id ? room.host._id.toString() : '');
      if (hostId) list.push({ id: hostId, role: 'host' });
    }
    if (Array.isArray(room.speakers)) {
      room.speakers.forEach((sp) => {
        const spId = sp?.id || (sp?._id ? sp._id.toString() : (typeof sp === 'string' ? sp : ''));
        if (spId && !list.some((p) => p.id === spId)) {
          list.push({ id: spId, role: 'speaker' });
        }
      });
    }
    if (Array.isArray(room.listeners)) {
      room.listeners.forEach((ls) => {
        const lsId = ls?.id || (ls?._id ? ls._id.toString() : (typeof ls === 'string' ? ls : ''));
        if (lsId && !list.some((p) => p.id === lsId)) {
          list.push({ id: lsId, role: 'listener' });
        }
      });
    }
    return list;
  }, [room]);

  // Synchronize WebRTC peer connections with current room roster
  useEffect(() => {
    if (!groupWebRTCManagerRef.current) return;
    groupWebRTCManagerRef.current.setRole({ isHost, isSpeaker });
    if (participants.length > 0) {
      groupWebRTCManagerRef.current.syncParticipants(participants);
    }
  }, [isHost, isSpeaker, participants]);

  // Live timer
  useEffect(() => {
    if (!room || room.status !== 'active' || isRoomEnded || !hasAccess) return;

    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [room, isRoomEnded, hasAccess]);

  // Format seconds to mm:ss
  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Audience roster generator (deterministic, capped cleanly for display)
  const audienceList = useMemo(() => {
    if (!room) return [];
    const basePeople = MOCK_DISCOVER_PEOPLE.filter(
      p => p.id !== room.host?.id && p.id !== MOCK_CURRENT_USER_PREVIEW.id
    );
    return basePeople;
  }, [room]);

  // Merged all room listeners (real members + fallback)
  const allListeners = useMemo(() => {
    const list = [];
    const addedIds = new Set();
    const hostId = room?.host?.id || (room?.host?._id ? room.host._id.toString() : '');
    if (hostId) addedIds.add(hostId);
    if (Array.isArray(room?.speakers)) {
      room.speakers.forEach(sp => {
        const id = sp?.id || (sp?._id ? sp._id.toString() : (typeof sp === 'string' ? sp : ''));
        if (id) addedIds.add(id);
      });
    }

    const realListeners = members?.listeners || room?.listeners || [];
    realListeners.forEach(ls => {
      const id = ls?.id || (ls?._id ? ls._id.toString() : (typeof ls === 'string' ? ls : ''));
      if (id && !addedIds.has(id)) {
        addedIds.add(id);
        list.push({
          id,
          name: ls.fullName || ls.name || ls.username || 'Listener',
          username: ls.username || 'listener',
          avatar: ls.avatar || '🎧',
          avatarBg: ls.avatarBg || 'rgba(255,255,255,0.08)',
          isReal: true
        });
      }
    });

    audienceList.forEach(p => {
      if (!addedIds.has(p.id)) {
        addedIds.add(p.id);
        list.push({
          id: p.id,
          name: p.fullName || p.name,
          username: p.username,
          avatar: p.avatar,
          avatarBg: p.avatarBg,
          isReal: false
        });
      }
    });

    return list;
  }, [room, members, audienceList]);

  // Raised hands count
  const raisedHandsCount = useMemo(() => {
    if (!room || !Array.isArray(room.raisedHands)) return 0;
    return room.raisedHands.length;
  }, [room]);

  // Handlers
  const handleToggleMute = () => {
    setIsMuted(prev => {
      const nextMuted = !prev;
      if (groupWebRTCManagerRef.current) {
        groupWebRTCManagerRef.current.setMuted(nextMuted);
      }
      return nextMuted;
    });
  };

  const handleToggleHand = () => {
    setIsHandRaised(prev => {
      const nextRaised = !prev;
      if (socket && isConnected && roomId) {
        socket.emit('room:raise_hand', { roomId, isHandRaised: nextRaised });
      }
      return nextRaised;
    });
  };

  const handlePromoteToSpeaker = (targetUser) => {
    if (!isHost || !targetUser) return;
    const targetId = targetUser.id || (targetUser._id ? targetUser._id.toString() : (typeof targetUser === 'string' ? targetUser : ''));
    if (socket && isConnected && roomId && targetId) {
      socket.emit('room:update_speaker', { roomId, targetUserId: targetId, action: 'promote' });
    }
  };

  const handleDemoteToListener = (targetUser) => {
    if (!isHost || !targetUser) return;
    const targetId = targetUser.id || (targetUser._id ? targetUser._id.toString() : (typeof targetUser === 'string' ? targetUser : ''));
    if (socket && isConnected && roomId && targetId) {
      socket.emit('room:update_speaker', { roomId, targetUserId: targetId, action: 'demote' });
    }
  };

  const handleSelfDemote = () => {
    if (!isSpeaker || isHost) return;
    const myId = currentUser?.id || (currentUser?._id ? currentUser._id.toString() : '');
    if (socket && isConnected && roomId && myId) {
      socket.emit('room:update_speaker', { roomId, targetUserId: myId, action: 'demote' });
    }
  };

  const handleShareRoom = () => {
    try {
      const roomUrl = window.location.origin + '/room/' + roomId;
      navigator.clipboard.writeText(roomUrl);
      setShareToastText('Room link copied to clipboard! 📋');
      setTimeout(() => setShareToastText(null), 3000);
    } catch (e) {
      setShareToastText(`Room ID: ${roomId}`);
      setTimeout(() => setShareToastText(null), 3000);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      if (groupWebRTCManagerRef.current) {
        groupWebRTCManagerRef.current.destroy();
        groupWebRTCManagerRef.current = null;
      }
      if (roomId) {
        await leaveRoomApi(roomId);
      }
    } catch (e) {
      // Ignore leave errors on navigation
    }
    navigate('/rooms');
  };

  const handleConfirmEndRoom = async () => {
    try {
      if (groupWebRTCManagerRef.current) {
        groupWebRTCManagerRef.current.destroy();
        groupWebRTCManagerRef.current = null;
      }
      if (roomId) {
        await closeRoomApi(roomId);
      }
      setIsRoomEnded(true);
      if (room) {
        setRoom(prev => prev ? { ...prev, status: 'closed' } : null);
      }
    } catch (err) {
      alert(err.message || 'Failed to end room.');
    } finally {
      setShowEndModal(false);
    }
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
            <span>Connecting to room stage...</span>
          </div>
        </div>
      </div>
    );
  }

  // ── 1. GRACEFUL STATE: Room Not Found or Fetch Error ────────────────
  if (!room || fetchError) {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="group-room-stage-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="voice-ended-card" style={{ maxWidth: 480 }}>
            <div className="voice-ended-icon" style={{ background: 'rgba(255, 51, 133, 0.12)', color: 'var(--user-primary)' }}>
              🔍
            </div>
            <h2 className="voice-ended-title">Room Not Available</h2>
            <p className="voice-ended-sub">
              {fetchError || "This audio room doesn't exist or may have been deleted. Please explore active lounges in the discovery directory."}
            </p>
            <button
              type="button"
              onClick={() => navigate('/rooms')}
              className="btn-user-primary"
              style={{ padding: '12px 28px', marginTop: 8 }}
            >
              Back to Lounge
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 2. GRACEFUL STATE: Scheduled Room ───────────────────────────────
  if (room.status === 'scheduled') {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="group-room-stage-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="voice-ended-card" style={{ maxWidth: 520 }}>
            <div className="voice-ended-icon" style={{ background: 'rgba(216, 150, 255, 0.15)', color: 'var(--user-accent-soft)' }}>
              🗓️
            </div>
            <h2 className="voice-ended-title">Room hasn&rsquo;t started yet</h2>
            <div style={{ margin: '14px 0', padding: '12px 16px', background: 'rgba(20, 5, 40, 0.8)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>{room.title}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--user-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <IconClock size={13} style={{ color: 'var(--user-accent-soft)' }} />
                <span>Scheduled for: <strong>{room.scheduledFor || 'Upcoming'}</strong></span>
              </div>
            </div>
            <p className="voice-ended-sub" style={{ marginBottom: 20 }}>
              The host (@{room.host?.username || 'host'}) has scheduled this audio session. Set a reminder in the lounge to be notified when the stage goes live.
            </p>
            <button
              type="button"
              onClick={() => navigate('/rooms')}
              className="btn-user-primary"
              style={{ padding: '10px 26px' }}
            >
              Back to Lounge
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 3. GRACEFUL STATE: Ended Room ──────────────────────────────────
  if (room.status === 'ended' || isRoomEnded) {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="group-room-stage-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="voice-ended-card" style={{ maxWidth: 520 }}>
            <div className="voice-ended-icon" style={{ background: 'rgba(0, 245, 212, 0.12)', color: 'var(--user-status-online)' }}>
              🎙️
            </div>
            <h2 className="voice-ended-title">This room has ended</h2>
            <p className="voice-ended-sub" style={{ marginBottom: 16 }}>
              The host has concluded &ldquo;{room.title}&rdquo;. Thank you for listening and participating in this community audio session.
            </p>
            <div style={{ margin: '0 0 20px 0', padding: '14px 18px', background: 'rgba(20, 5, 40, 0.8)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--user-text-muted)' }}>Topic:</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{room.topic}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                <span style={{ color: 'var(--user-text-muted)' }}>Host:</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{room.host?.fullName} (@{room.host?.username})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--user-text-muted)' }}>Session Duration:</span>
                <span style={{ color: 'var(--user-status-online)', fontWeight: 700 }}>{formatTime(elapsedSeconds)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/rooms')}
              className="btn-user-primary"
              style={{ padding: '12px 28px' }}
            >
              Return to Lounge
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 4. GRACEFUL STATE: Closed Room ─────────────────────────────────
  if (room.status === 'closed') {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="group-room-stage-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="voice-ended-card" style={{ maxWidth: 480 }}>
            <div className="voice-ended-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              🔒
            </div>
            <h2 className="voice-ended-title">This room is unavailable</h2>
            <p className="voice-ended-sub">
              This audio room is currently closed or restricted by room moderators.
            </p>
            <button
              type="button"
              onClick={() => navigate('/rooms')}
              className="btn-user-primary"
              style={{ padding: '10px 26px', marginTop: 10 }}
            >
              Back to Lounge
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 5. GRACEFUL STATE: Invite Only Locked (Not Invited) ─────────────
  if (!hasAccess) {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="group-room-stage-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="voice-ended-card" style={{ maxWidth: 480 }}>
            <div className="voice-ended-icon" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}>
              🔒
            </div>
            <h2 className="voice-ended-title">Private Room</h2>
            <p className="voice-ended-sub" style={{ marginBottom: 12 }}>
              You are not invited to this room.
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--user-text-muted)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              This audio lounge is set to <strong>Invite Only</strong> by host @{room.host?.username || 'host'}. Only invited friends may join.
            </p>
            <button
              type="button"
              onClick={() => navigate('/rooms')}
              className="btn-user-primary"
              style={{ padding: '10px 26px' }}
            >
              Back to Lounge
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 6. ACTIVE GROUP VOICE ROOM STAGE ────────────────────────────────
  // Priority-aware real local speaking resolution (Phase 3C-4 & 3E)
  const isPublisher = isHost || isSpeaker;
  const effectiveLocalSpeaking = !isMuted && isPublisher && localIsSpeaking;
  const hostId = room.host?.id || (room.host?._id ? room.host._id.toString() : '');
  const hostUsername = room.host?.username;
  const hostIsRemoteSpeaking = (hostId && remoteSpeakingUsers.has(hostId)) || (hostUsername && remoteSpeakingUsers.has(hostUsername));
  const hostIsSpeaking = isHost ? effectiveLocalSpeaking : !!hostIsRemoteSpeaking;
  const totalAudienceCount = Math.max(room.participantCount || 1, audienceList.length);

  return (
    <div className="user-app-shell group-voice-room-shell">
      {/* Background ambient lighting blobs */}
      <div className="user-ambient-blob-1" aria-hidden="true" />
      <div className="user-ambient-blob-2" aria-hidden="true" />

      <div className="group-room-stage-shell">

        {/* ── 1. Top Header Bar ──────────────────────────────────────── */}
        <header className="group-room-header">
          <div className="group-room-header-left">
            <button
              type="button"
              onClick={handleLeaveRoom}
              className="group-room-back-btn"
              title="Leave Room & Back to Lounge"
            >
              <IconChevronLeft size={18} />
              <span>Lounge</span>
            </button>
          </div>

          {/* Center Identity & Live Indicators */}
          <div className="group-room-header-center">
            <div className="group-room-meta-pill-row">
              {/* Live Status Pill */}
              <span className="group-room-live-pill">
                <span className="room-status-pulse" />
                <span>LIVE</span>
              </span>

              {/* Topic Tag */}
              <span className="group-room-topic-pill">
                <IconTag size={11} style={{ marginRight: 3 }} />
                {room.topic || 'Audio Lounge'}
              </span>

              {/* Access Mode */}
              {room.accessType === 'invite_only' ? (
                <span className="group-room-access-pill invite" title="Private Room">
                  <IconLock size={11} />
                  <span>Invite Only</span>
                </span>
              ) : (
                <span className="group-room-access-pill anyone" title="Open Stage">
                  <IconGlobe size={11} />
                  <span>Anyone</span>
                </span>
              )}

              {/* Participant Occupancy */}
              <span
                className="group-room-occupancy-pill"
                onClick={() => setShowParticipantsModal(true)}
                style={{ cursor: 'pointer' }}
                title="View & manage room participants"
              >
                <IconUsers size={11} style={{ marginRight: 3 }} />
                <span>{room.participantCount || 1} / {room.capacity || 20} listening</span>
                {isHost && raisedHandsCount > 0 && (
                  <span className="hand-raise-alert-badge" style={{ marginLeft: 4 }}>
                    ✋ {raisedHandsCount}
                  </span>
                )}
              </span>
            </div>

            <h1 className="group-room-title">{room.title}</h1>
            <div className="group-room-host-sub">
              Hosted by <strong style={{ color: '#fff' }}>@{room.host?.username || 'host'}</strong> &bull; {formatTime(elapsedSeconds)}
            </div>
          </div>

          {/* Right Action / Agenda Toggle & Share */}
          <div className="group-room-header-right">
            <button
              type="button"
              onClick={handleShareRoom}
              className="group-room-agenda-btn"
              title="Copy link to invite friends"
            >
              <span>🔗 Invite</span>
            </button>
            <button
              type="button"
              onClick={() => setShowParticipantsModal(true)}
              className="group-room-agenda-btn"
              title="View room participants"
              style={{ position: 'relative' }}
            >
              <span>👥 Stage ({totalAudienceCount + (room.speakers?.length || 0) + 1})</span>
              {isHost && raisedHandsCount > 0 && (
                <span className="hand-raise-alert-badge" style={{ marginLeft: 4 }}>
                  ✋ {raisedHandsCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowAgenda(prev => !prev)}
              className={`group-room-agenda-btn ${showAgenda ? 'active' : ''}`}
              title="Toggle Room Description"
            >
              <span>📋 Agenda</span>
            </button>
          </div>
        </header>

        {/* Floating Toast Banner */}
        {shareToastText && (
          <div className="room-toast-banner">
            <span>{shareToastText}</span>
          </div>
        )}

        {/* ── Optional Collapsible Agenda Drawer ──────────────────────── */}
        {showAgenda && (
          <div className="group-room-agenda-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--user-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Room Agenda &amp; Guidelines
              </span>
              <button
                type="button"
                onClick={() => setShowAgenda(false)}
                className="room-modal-close-btn"
                style={{ padding: 2 }}
              >
                <IconX size={14} />
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--user-text-secondary)', lineHeight: 1.5 }}>
              {room.description || 'Welcome to this audio space! Feel free to listen in, raise your hand to speak, and connect with fellow members.'}
            </p>
          </div>
        )}

        {/* ── Optional Microphone Permission Denied Warning ──────────── */}
        {microphonePermissionDenied && (
          <div style={{ margin: '0 0 14px 0', padding: '10px 16px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', fontSize: '0.84rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span>⚠️ Microphone permission denied. Please allow microphone access in your browser to speak.</span>
            <button
              type="button"
              onClick={() => {
                if (groupWebRTCManagerRef.current) {
                  groupWebRTCManagerRef.current.startLocalAudio().then(() => {
                    setMicrophonePermissionDenied(false);
                  }).catch(() => {});
                }
              }}
              className="btn-user-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── 2. The Stage Podium (Host & Speakers) ───────────────────── */}
        <main className="group-room-main-stage">
          
          <div className="stage-section-heading">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconMic size={14} style={{ color: 'var(--user-status-online)' }} />
              <span>THE STAGE</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--user-text-muted)' }}>
              {(room.speakers?.length || 0) + 1} on stage
            </span>
          </div>

          <div className="stage-podium-grid">

            {/* ── Host Podium Card ── */}
            <div className={`host-podium-card ${hostIsSpeaking ? 'is-speaking' : ''}`}>
              <div className="host-avatar-stage-wrap">
                {/* Voice Aura Rings (Animated when speaking) */}
                <div className={`voice-aura-ring voice-aura-outer ${hostIsSpeaking ? 'active-speaking' : ''}`} />
                <div className={`voice-aura-ring voice-aura-middle ${hostIsSpeaking ? 'active-speaking' : ''}`} />
                <div className={`voice-aura-ring voice-aura-inner ${hostIsSpeaking ? 'active-speaking' : ''}`} />

                {/* Host Avatar Bubble */}
                <div
                  className="host-avatar-bubble"
                  style={{ background: room.host?.avatarBg || 'var(--user-brand-gradient)' }}
                >
                  {room.host?.avatar?.startsWith('http') || room.host?.avatar?.startsWith('data:') ? (
                    <img src={room.host.avatar} alt="host" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    room.host?.avatar || '🎧'
                  )}
                </div>

                {/* Crown / Host Floating Badge */}
                <span className="host-floating-badge" title="Room Host">
                  👑 HOST
                </span>

                {/* Local mute indicator on avatar */}
                {isHost && isMuted && (
                  <span className="voice-muted-badge" title="Muted">
                    <IconMicOff size={12} />
                  </span>
                )}
              </div>

              <div className="host-details-box">
                <div className="host-card-name">
                  {room.host?.fullName || room.host?.name}
                  {isHost && <span style={{ fontSize: '0.72rem', color: 'var(--user-primary)', marginLeft: 4 }}>(You)</span>}
                </div>
                <div className="host-card-handle">@{room.host?.username || 'host'}</div>

                {/* Animated speaking indicator bar or status */}
                <div className="speaking-status-pill">
                  {hostIsSpeaking ? (
                    <span className="speaking-active-indicator">
                      <span className="voice-wave-visualizer" style={{ transform: 'scale(0.7)' }}>
                        <span className="voice-wave-bar" />
                        <span className="voice-wave-bar" />
                        <span className="voice-wave-bar" />
                      </span>
                      <span>Speaking</span>
                    </span>
                  ) : isHost && isMuted ? (
                    <span style={{ color: 'var(--user-text-muted)' }}>Muted</span>
                  ) : (
                    <span style={{ color: 'var(--user-text-muted)' }}>Listening</span>
                  )}
                </div>
              </div>
            </div>

            {/* ── On-Stage Speakers ── */}
            {room.speakers && room.speakers.length > 0 ? (
              room.speakers.map((sp, idx) => {
                const spId = sp?.id || (sp?._id ? sp._id.toString() : (typeof sp === 'string' ? sp : ''));
                const currentId = currentUser ? (currentUser.id || (currentUser._id ? currentUser._id.toString() : '')) : '';
                const isSelf = spId === currentId || (sp?.username && sp.username === currentUser?.username);
                const speakerIsRemoteSpeaking = (spId && remoteSpeakingUsers.has(spId)) || (sp?.username && remoteSpeakingUsers.has(sp.username));
                const isSpeakerActive = isSelf ? effectiveLocalSpeaking : !!speakerIsRemoteSpeaking;

                return (
                  <div key={idx} className={`speaker-podium-card ${isSpeakerActive ? 'is-speaking' : ''}`}>
                    <div className="speaker-avatar-wrap">
                      <div className={`speaker-speaking-ring ${isSpeakerActive ? 'active' : ''}`} />
                      <div className="speaker-avatar-bubble">
                        {sp.avatar?.startsWith('http') || sp.avatar?.startsWith('data:') ? (
                          <img src={sp.avatar} alt={sp.name || 'speaker'} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          sp.avatar || '🎙️'
                        )}
                      </div>
                      <span className="speaker-badge-tag">
                        SPEAKER
                      </span>
                      {isSelf && isMuted && (
                        <span className="voice-muted-badge" title="Muted">
                          <IconMicOff size={12} />
                        </span>
                      )}
                    </div>

                    <div className="speaker-card-name">
                      {sp.name}
                      {isSelf && <span style={{ fontSize: '0.72rem', color: 'var(--user-primary)', marginLeft: 4 }}>(You)</span>}
                    </div>
                    
                    <div className="speaking-status-pill">
                      {isSpeakerActive ? (
                        <span className="speaking-active-indicator">
                          <span className="voice-wave-visualizer" style={{ transform: 'scale(0.65)' }}>
                            <span className="voice-wave-bar" />
                            <span className="voice-wave-bar" />
                            <span className="voice-wave-bar" />
                          </span>
                          <span>Speaking</span>
                        </span>
                      ) : isSelf && isMuted ? (
                        <span style={{ color: 'var(--user-text-muted)' }}>Muted</span>
                      ) : (
                        <span style={{ color: 'var(--user-text-muted)' }}>Listening</span>
                      )}
                    </div>

                    {/* Speaker actions */}
                    {isHost && !isSelf && (
                      <button
                        type="button"
                        onClick={() => handleDemoteToListener(sp)}
                        className="participant-action-btn demote"
                        style={{ marginTop: 8 }}
                        title="Demote speaker to listener"
                      >
                        Demote
                      </button>
                    )}
                    {isSelf && !isHost && (
                      <button
                        type="button"
                        onClick={handleSelfDemote}
                        className="participant-action-btn demote"
                        style={{ marginTop: 8 }}
                        title="Step down from stage"
                      >
                        Step Down
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="speaker-empty-placeholder">
                <span style={{ fontSize: 24 }}>🎙️</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--user-text-muted)' }}>
                  No co-speakers yet. Raise your hand to speak on stage!
                </span>
              </div>
            )}

          </div>

          {/* ── 3. Audience Roster ─────────────────────────────────────── */}
          <section className="group-room-audience-section">
            <div className="stage-section-heading">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconUsers size={14} style={{ color: 'var(--user-text-muted)' }} />
                <span>AUDIENCE</span>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--user-text-muted)' }}>
                {totalAudienceCount} listening
              </span>
            </div>

            <div className="audience-roster-cluster">
              {/* Current user (if not host) */}
              {!isHost && (
                <div className="audience-member-chip self">
                  <div
                    className="audience-avatar"
                    style={{ background: MOCK_CURRENT_USER_PREVIEW.avatarBg }}
                  >
                    {MOCK_CURRENT_USER_PREVIEW.avatar}
                    {isHandRaised && <span className="hand-raise-dot" title="Hand Raised">✋</span>}
                  </div>
                  <span className="audience-name">You</span>
                </div>
              )}

              {/* Roster from listeners */}
              {allListeners.slice(0, 15).map(member => {
                const memberId = member.id;
                const isSelf = memberId === (currentUser?.id || (currentUser?._id ? currentUser._id.toString() : ''));
                const isRaised = (room.raisedHands || []).some(rh => (rh?.id || rh?._id || rh).toString() === memberId.toString());

                return (
                  <div key={memberId} className={`audience-member-chip ${isRaised ? 'hand-raised' : ''}`}>
                    <div
                      className="audience-avatar"
                      style={{ background: member.avatarBg || 'rgba(255,255,255,0.08)', cursor: isHost && !isSelf ? 'pointer' : 'default' }}
                      title={`${member.name} (@${member.username})${isRaised ? ' - Hand Raised' : ''}`}
                      onClick={() => {
                        if (isHost && !isSelf) {
                          handlePromoteToSpeaker(member);
                        }
                      }}
                    >
                      {member.avatar?.startsWith('http') || member.avatar?.startsWith('data:') ? (
                        <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        member.avatar || '🎧'
                      )}
                      {isRaised && <span className="hand-raise-dot" title="Hand Raised">✋</span>}
                    </div>
                    <span className="audience-name">{isSelf ? 'You' : member.name.split(' ')[0]}</span>
                    {isHost && !isSelf && (
                      <button
                        type="button"
                        onClick={() => handlePromoteToSpeaker(member)}
                        className="participant-action-btn promote"
                        style={{ padding: '2px 6px', fontSize: '0.66rem', marginTop: 3 }}
                        title="Promote to Speaker"
                      >
                        + Speak
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Responsive Overflow Badge for High Capacity (up to 100 seats) */}
              {room.capacity > 12 && (
                <div className="audience-overflow-chip" title="Additional room listeners">
                  <span>+{Math.max(room.capacity - 12, 14)} listeners</span>
                </div>
              )}
            </div>
          </section>

        </main>

        {/* ── 4. Docked Bottom Control Bar ─────────────────────────────── */}
        <footer className="group-room-docked-bar">
          <div className="group-room-controls-cluster">

            {/* Control 1: Mute / Unmute */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`btn-voice-control ${isMuted ? 'muted' : 'active'}`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              <span className="control-icon-wrap">
                {isMuted ? <IconMicOff size={18} /> : <IconMic size={18} />}
              </span>
              <span className="control-label">{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            {/* Control 2: Raise Hand */}
            {!isHost && (
              <button
                type="button"
                onClick={handleToggleHand}
                className={`btn-voice-control ${isHandRaised ? 'hand-raised' : ''}`}
                title={isHandRaised ? 'Lower hand' : 'Raise hand to request stage access'}
              >
                <span className="control-icon-wrap">
                  <IconHand size={18} />
                </span>
                <span className="control-label">
                  {isHandRaised ? 'Hand Raised ✋' : 'Raise Hand'}
                </span>
              </button>
            )}

            {/* Control 3: View Participants */}
            <button
              type="button"
              onClick={() => setShowParticipantsModal(true)}
              className="btn-voice-control"
              style={{ background: 'rgba(255, 255, 255, 0.08)' }}
              title="View room participants"
            >
              <span className="control-icon-wrap" style={{ position: 'relative' }}>
                <IconUsers size={18} />
                {isHost && raisedHandsCount > 0 && (
                  <span style={{ position: 'absolute', top: -8, right: -10, background: 'var(--user-status-online)', color: '#000', fontSize: '0.62rem', fontWeight: 900, borderRadius: '50%', width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {raisedHandsCount}
                  </span>
                )}
              </span>
              <span className="control-label">People</span>
            </button>

            {/* Control 4: Leave Stage */}
            <button
              type="button"
              onClick={() => {
                if (isHost) {
                  setShowHostLeaveModal(true);
                } else {
                  handleLeaveRoom();
                }
              }}
              className="btn-voice-control leave"
              title="Leave Room & Return to Lounge"
            >
              <span className="control-icon-wrap">
                <IconLogOut size={18} />
              </span>
              <span className="control-label">Leave Stage</span>
            </button>

            {/* Control 5: Host End Room (Visible ONLY for Host) */}
            {isHost && (
              <button
                type="button"
                onClick={() => setShowEndModal(true)}
                className="btn-voice-control end-room"
                title="End room for all participants"
              >
                <span className="control-icon-wrap">
                  <IconPower size={18} />
                </span>
                <span className="control-label">End Room</span>
              </button>
            )}

          </div>
        </footer>

        {/* ── Host End Room Confirmation Modal ────────────────────────── */}
        {showEndModal && (
          <div className="room-modal-backdrop" onClick={() => setShowEndModal(false)}>
            <div className="room-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div className="room-modal-icon-header">
                <span className="room-modal-icon-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                  <IconPower size={22} />
                </span>
                <button
                  type="button"
                  className="room-modal-close-btn"
                  onClick={() => setShowEndModal(false)}
                  title="Close"
                >
                  <IconX size={16} />
                </button>
              </div>

              <h3 className="room-modal-title">End Group Voice Room?</h3>
              <p className="room-modal-subtitle">
                As the host, ending the room will conclude this live session for all listeners and return participants to the lounge.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setShowEndModal(false)}
                  className="btn-user-secondary"
                  style={{ padding: '8px 18px', fontSize: '0.88rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEndRoom}
                  className="btn-user-danger"
                  style={{
                    padding: '8px 22px',
                    fontSize: '0.88rem',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Yes, End Room
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Host Leave Choice Modal (Leave Stage vs End Room) ──────────── */}
        {showHostLeaveModal && (
          <div className="room-modal-backdrop" onClick={() => setShowHostLeaveModal(false)}>
            <div className="room-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div className="room-modal-icon-header">
                <span className="room-modal-icon-badge" style={{ background: 'rgba(255, 51, 133, 0.15)', color: 'var(--user-primary)' }}>
                  <IconLogOut size={22} />
                </span>
                <button
                  type="button"
                  className="room-modal-close-btn"
                  onClick={() => setShowHostLeaveModal(false)}
                  title="Close"
                >
                  <IconX size={16} />
                </button>
              </div>

              <h3 className="room-modal-title">Host Stage Actions</h3>
              <p className="room-modal-subtitle">
                You are the room host. You can choose to leave the stage (keeping the voice session open for fellow speakers and listeners) or end the room completely.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowHostLeaveModal(false);
                    handleLeaveRoom();
                  }}
                  className="btn-user-secondary"
                  style={{ padding: '10px 18px', fontSize: '0.9rem', justifyContent: 'center' }}
                >
                  Leave Stage (Keep Room Open)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowHostLeaveModal(false);
                    setShowEndModal(true);
                  }}
                  className="btn-user-danger"
                  style={{
                    padding: '10px 18px',
                    fontSize: '0.9rem',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  End Room for Everyone
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Room Participants & Stage Management Modal ─────────────────── */}
        {showParticipantsModal && (
          <div className="room-modal-backdrop" onClick={() => setShowParticipantsModal(false)}>
            <div className="room-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
              
              {/* Header */}
              <div className="room-modal-icon-header" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="room-modal-icon-badge" style={{ background: 'rgba(0, 245, 212, 0.15)', color: 'var(--user-status-online)' }}>
                    <IconUsers size={20} />
                  </span>
                  <div>
                    <h3 className="room-modal-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                      Room Participants ({totalAudienceCount + (room.speakers?.length || 0) + 1})
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: 'var(--user-text-muted)' }}>
                      Live stage participants &amp; audience
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="room-modal-close-btn"
                  onClick={() => setShowParticipantsModal(false)}
                  title="Close"
                >
                  <IconX size={16} />
                </button>
              </div>

              {/* Raised Hand Alert Banner (Visible to Host if any) */}
              {isHost && raisedHandsCount > 0 && (
                <div style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(0, 245, 212, 0.12)', border: '1px solid rgba(0, 245, 212, 0.3)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--user-status-online)', fontWeight: 700 }}>
                    ✋ {raisedHandsCount} participant{raisedHandsCount > 1 ? 's' : ''} requested to speak
                  </span>
                </div>
              )}

              {/* Participants Scrollable List */}
              <div className="room-participants-list">
                
                {/* 1. Host Section */}
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--user-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '4px 0 6px 4px' }}>
                  Host (1)
                </div>
                <div className="room-participant-item">
                  <div className="participant-item-left">
                    <div className="participant-item-avatar" style={{ background: room.host?.avatarBg || 'var(--user-brand-gradient)' }}>
                      {room.host?.avatar?.startsWith('http') || room.host?.avatar?.startsWith('data:') ? (
                        <img src={room.host.avatar} alt="host" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        room.host?.avatar || '👑'
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="participant-item-name">
                        {room.host?.fullName || room.host?.name}
                        {isHost && <span style={{ fontSize: '0.7rem', color: 'var(--user-primary)' }}>(You)</span>}
                      </div>
                      <div className="participant-item-handle">@{room.host?.username || 'host'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {hostIsSpeaking ? (
                      <span className="speaking-active-indicator" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                        Speaking
                      </span>
                    ) : isHost && isMuted ? (
                      <span style={{ fontSize: '0.72rem', color: 'var(--user-text-muted)' }}>Muted</span>
                    ) : null}
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.12)', padding: '2px 8px', borderRadius: 8, border: '1px solid rgba(251, 191, 36, 0.25)' }}>
                      👑 Host
                    </span>
                  </div>
                </div>

                {/* 2. On-Stage Speakers Section */}
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--user-accent-soft)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '12px 0 6px 4px' }}>
                  Speakers ({room.speakers?.length || 0})
                </div>
                {room.speakers && room.speakers.length > 0 ? (
                  room.speakers.map((sp, idx) => {
                    const spId = sp?.id || (sp?._id ? sp._id.toString() : (typeof sp === 'string' ? sp : ''));
                    const currentId = currentUser ? (currentUser.id || (currentUser._id ? currentUser._id.toString() : '')) : '';
                    const isSelf = spId === currentId || (sp?.username && sp.username === currentUser?.username);
                    const speakerIsRemoteSpeaking = (spId && remoteSpeakingUsers.has(spId)) || (sp?.username && remoteSpeakingUsers.has(sp.username));
                    const isSpeakerActive = isSelf ? effectiveLocalSpeaking : !!speakerIsRemoteSpeaking;

                    return (
                      <div key={idx} className="room-participant-item">
                        <div className="participant-item-left">
                          <div className="participant-item-avatar">
                            {sp.avatar?.startsWith('http') || sp.avatar?.startsWith('data:') ? (
                              <img src={sp.avatar} alt="sp" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              sp.avatar || '🎙️'
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="participant-item-name">
                              {sp.name || sp.fullName}
                              {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--user-primary)' }}>(You)</span>}
                            </div>
                            <div className="participant-item-handle">@{sp.username || 'speaker'}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isSpeakerActive ? (
                            <span className="speaking-active-indicator" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                              Speaking
                            </span>
                          ) : isSelf && isMuted ? (
                            <span style={{ fontSize: '0.72rem', color: 'var(--user-text-muted)' }}>Muted</span>
                          ) : null}
                          {isHost && !isSelf && (
                            <button
                              type="button"
                              onClick={() => handleDemoteToListener(sp)}
                              className="participant-action-btn demote"
                            >
                              Demote
                            </button>
                          )}
                          {isSelf && !isHost && (
                            <button
                              type="button"
                              onClick={handleSelfDemote}
                              className="participant-action-btn demote"
                            >
                              Step Down
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: '0.78rem', color: 'var(--user-text-muted)', padding: '6px 8px' }}>
                    No co-speakers on stage yet.
                  </div>
                )}

                {/* 3. Hand Raised Requests (if any) */}
                {room.raisedHands && room.raisedHands.length > 0 && (
                  <>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--user-status-online)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '12px 0 6px 4px' }}>
                      Hand Raised ({room.raisedHands.length})
                    </div>
                    {room.raisedHands.map((rh, idx) => {
                      const rhUser = rh?.fullName ? rh : (allListeners.find(l => (l.id || l._id) === (rh?.id || rh?._id || rh)) || rh);
                      const rhId = rhUser?.id || rhUser?._id || rh;
                      const isSelf = rhId === (currentUser?.id || (currentUser?._id ? currentUser._id.toString() : ''));

                      return (
                        <div key={idx} className="room-participant-item has-raised-hand">
                          <div className="participant-item-left">
                            <div className="participant-item-avatar">
                              {rhUser.avatar?.startsWith('http') || rhUser.avatar?.startsWith('data:') ? (
                                <img src={rhUser.avatar} alt="rh" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                rhUser.avatar || '✋'
                              )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div className="participant-item-name">
                                {rhUser.fullName || rhUser.name || 'Participant'}
                                {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--user-primary)' }}>(You)</span>}
                                <span style={{ fontSize: '0.7rem' }}>✋</span>
                              </div>
                              <div className="participant-item-handle">@{rhUser.username || 'user'}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {isHost && (
                              <button
                                type="button"
                                onClick={() => handlePromoteToSpeaker(rhUser)}
                                className="participant-action-btn promote"
                              >
                                Approve to Speak
                              </button>
                            )}
                            {isSelf && (
                              <button
                                type="button"
                                onClick={handleToggleHand}
                                className="participant-action-btn demote"
                              >
                                Lower Hand
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* 4. Audience / Listeners Section */}
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--user-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '12px 0 6px 4px' }}>
                  Audience ({allListeners.length})
                </div>
                {allListeners.length > 0 ? (
                  allListeners.map((member, idx) => {
                    const memberId = member.id;
                    const isSelf = memberId === (currentUser?.id || (currentUser?._id ? currentUser._id.toString() : ''));
                    const isRaised = (room.raisedHands || []).some(rh => (rh?.id || rh?._id || rh).toString() === memberId.toString());

                    return (
                      <div key={idx} className={`room-participant-item ${isRaised ? 'has-raised-hand' : ''}`}>
                        <div className="participant-item-left">
                          <div className="participant-item-avatar" style={{ background: member.avatarBg }}>
                            {member.avatar?.startsWith('http') || member.avatar?.startsWith('data:') ? (
                              <img src={member.avatar} alt={member.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              member.avatar || '🎧'
                            )}
                            {isRaised && <span className="hand-raise-dot" title="Hand Raised">✋</span>}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="participant-item-name">
                              {member.name}
                              {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--user-primary)' }}>(You)</span>}
                            </div>
                            <div className="participant-item-handle">@{member.username}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isHost && (
                            <button
                              type="button"
                              onClick={() => handlePromoteToSpeaker(member)}
                              className="participant-action-btn promote"
                              title="Invite participant to speak on stage"
                            >
                              Invite to Speak
                            </button>
                          )}
                          {isSelf && !isRaised && (
                            <button
                              type="button"
                              onClick={handleToggleHand}
                              className="participant-action-btn promote"
                              style={{ background: 'rgba(0, 245, 212, 0.15)', color: 'var(--user-status-online)', border: '1px solid rgba(0, 245, 212, 0.3)' }}
                            >
                              Raise Hand
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: '0.78rem', color: 'var(--user-text-muted)', padding: '6px 8px' }}>
                    No audience listeners yet.
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Hidden Remote Audio Elements for WebRTC Peers */}
        <div style={{ display: 'none' }} aria-hidden="true">
          {Object.entries(remoteStreams).map(([streamUserId, stream]) => (
            <RemoteAudioStream key={streamUserId} userId={streamUserId} stream={stream} />
          ))}
        </div>

      </div>
    </div>
  );
}

/**
 * Structural remote audio stream player component
 * Connects MediaStream to real browser audio element safely
 */
function RemoteAudioStream({ userId, stream }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      if (audioRef.current.srcObject !== stream) {
        audioRef.current.srcObject = stream;
      }
      audioRef.current.play().catch((err) => {
        // Autoplay notice
        console.warn(`[WebRTC Audio] Remote playback notice for user ${userId}:`, err.message);
      });
    }
  }, [stream, userId]);

  return <audio ref={audioRef} autoPlay playsInline />;
}
