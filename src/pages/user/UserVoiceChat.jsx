import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from '../../router';
import { useFriendRequests } from '../../context/FriendRequestContext';
import { MOCK_DISCOVER_PEOPLE } from '../../data/userMockData';
import { getPublicUserProfile } from '../../services/discoverApi';
import { initiateCallApi, updateCallStatusApi } from '../../services/userVoiceCallApi';
import {
  IconPhoneCall,
  IconMic,
  IconLock,
  IconCheck,
  IconSparkles,
  IconChevronLeft
} from '../../components/common/Icons';

import { renderAvatar } from '../../utils/avatarUtils';


// Additional inline SVG icons for voice controls
const IconMicOff = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const IconPhoneOff = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
    <line x1="23" y1="1" x2="1" y2="23" />
  </svg>
);

const IconVolume2 = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const IconVolumeX = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

import { useSocket } from '../../context/SocketContext';

export default function UserVoiceChat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { connectedFriends } = useFriendRequests();
  const { socket, isConnected } = useSocket();

  // Fetched profile state if not found in local context
  const [fetchedFriend, setFetchedFriend] = useState(null);

  // Resolved Friend Profile
  const friend = useMemo(() => {
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
      fetchedFriend ||
      null
    );
  }, [connectedFriends, userId, fetchedFriend]);

  // REST Voice Call record state
  const [callId, setCallId] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [isInitiating, setIsInitiating] = useState(true);

  // Voice Call State Machine: 'connecting' -> 'connected' -> 'ended'
  const [callStatus, setCallStatus] = useState('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [duration, setDuration] = useState(0);

  const timerRef = useRef(null);
  const speakingIntervalRef = useRef(null);
  const activeCallIdRef = useRef(null);
  activeCallIdRef.current = callId;

  const initiatedUserRef = useRef(null);
  const initiationPromiseRef = useRef(null);

  // 1. Fetch friend profile from REST if not available locally
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
          if (res?.user) setFetchedFriend(res.user);
        })
        .catch(() => {});
    }
  }, [userId, connectedFriends]);

  // ── WebRTC Peer Connection & Media Refs ─────────────────────────────────────
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const iceCandidateQueueRef = useRef([]);

  // WebRTC STUN Configuration
  const RTC_CONFIG = useMemo(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }), []);

  // Teardown WebRTC peer connection and local microphone tracks
  const cleanupWebRTC = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    iceCandidateQueueRef.current = [];
  };

  // Helper: Request local microphone media stream
  const getLocalMicrophone = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported by your browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.warn('Microphone access notice:', err.message);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setApiError('Microphone permission denied. Please allow microphone access in your browser to start the call.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setApiError('No microphone input device was found on your machine.');
      }
      return null;
    }
  };

  // Helper: Create RTCPeerConnection instance and attach event listeners
  const createPeerConnection = (targetUserId) => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    // ICE Candidate trickle handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && isConnected) {
        socket.emit('webrtc:ice_candidate', {
          targetUserId: targetUserId || userId,
          callId: activeCallIdRef.current,
          candidate: event.candidate
        });
      }
    };

    // Remote Track handler (attach incoming stream to audio element)
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(e => console.warn('Remote audio playback notice:', e.message));
        }
      }
    };

    // Attach local microphone tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    return pc;
  };

  // 2. Real-time Socket.IO call signaling & WebRTC listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleCallAccepted = async (data) => {
      if (!data || !activeCallIdRef.current || data.callId === activeCallIdRef.current || String(data.callId) === String(activeCallIdRef.current)) {
        setCallStatus('connected');

        // Initiate WebRTC offer as caller
        const stream = await getLocalMicrophone();
        const pc = createPeerConnection(userId);

        if (stream && pc) {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc:offer', {
              targetUserId: userId,
              callId: activeCallIdRef.current,
              sdp: offer
            });
          } catch (offerErr) {
            console.warn('WebRTC offer creation notice:', offerErr.message);
          }
        }
      }
    };

    const handleCallDeclined = (data) => {
      if (!data || !activeCallIdRef.current || data.callId === activeCallIdRef.current || String(data.callId) === String(activeCallIdRef.current)) {
        cleanupWebRTC();
        setCallStatus('ended');
        setApiError(data?.endReason === 'user_busy' ? 'User is currently busy on another call.' : 'Call was declined by recipient.');
      }
    };

    const handleCallBusy = () => {
      cleanupWebRTC();
      setCallStatus('ended');
      setApiError('User is currently busy on another call.');
    };

    const handleCallEnded = (data) => {
      if (!data || !activeCallIdRef.current || data.callId === activeCallIdRef.current || String(data.callId) === String(activeCallIdRef.current)) {
        cleanupWebRTC();
        setCallStatus('ended');
      }
    };

    // WebRTC Signaling Handlers
    const handleWebRTCOffer = async (data) => {
      if (!data || !data.sdp) return;
      const stream = await getLocalMicrophone();
      const pc = createPeerConnection(userId);

      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('webrtc:answer', {
            targetUserId: userId,
            callId: activeCallIdRef.current,
            sdp: answer
          });

          // Flush queued candidates
          while (iceCandidateQueueRef.current.length > 0) {
            const cand = iceCandidateQueueRef.current.shift();
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
        } catch (err) {
          console.warn('WebRTC offer processing notice:', err.message);
        }
      }
    };

    const handleWebRTCAnswer = async (data) => {
      if (!data || !data.sdp || !pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        while (iceCandidateQueueRef.current.length > 0) {
          const cand = iceCandidateQueueRef.current.shift();
          await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
        }
      } catch (err) {
        console.warn('WebRTC answer processing notice:', err.message);
      }
    };

    const handleWebRTCIceCandidate = async (data) => {
      if (!data || !data.candidate) return;
      if (pcRef.current && pcRef.current.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.warn('ICE candidate addition notice:', err.message);
        }
      } else {
        iceCandidateQueueRef.current.push(data.candidate);
      }
    };

    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:declined', handleCallDeclined);
    socket.on('call:busy', handleCallBusy);
    socket.on('call:ended', handleCallEnded);
    socket.on('webrtc:offer', handleWebRTCOffer);
    socket.on('webrtc:answer', handleWebRTCAnswer);
    socket.on('webrtc:ice_candidate', handleWebRTCIceCandidate);

    return () => {
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:declined', handleCallDeclined);
      socket.off('call:busy', handleCallBusy);
      socket.off('call:ended', handleCallEnded);
      socket.off('webrtc:offer', handleWebRTCOffer);
      socket.off('webrtc:answer', handleWebRTCAnswer);
      socket.off('webrtc:ice_candidate', handleWebRTCIceCandidate);
    };
  }, [socket, isConnected, userId]);

  // Cleanup WebRTC tracks on unmount
  useEffect(() => {
    return () => {
      cleanupWebRTC();
    };
  }, []);

  // 3. Initiate REST call session on mount (Safe against React StrictMode & Duplicate Calls)
  useEffect(() => {
    if (!userId) return;

    let isSubscribed = true;

    if (initiatedUserRef.current !== userId || !initiationPromiseRef.current) {
      initiatedUserRef.current = userId;
      setIsInitiating(true);
      setApiError(null);
      initiationPromiseRef.current = initiateCallApi(userId);
    }

    initiationPromiseRef.current
      .then(res => {
        if (!isSubscribed) return;
        const callObj = res?.voiceCall || res?.call || res?.data;
        if (callObj && (callObj.id || callObj._id)) {
          const actualCallId = callObj.id || callObj._id;
          setCallId(actualCallId);
          activeCallIdRef.current = actualCallId;
          if (callObj.status === 'ongoing') {
            setCallStatus('connected');
          }
        }
        setIsInitiating(false);
      })
      .catch(err => {
        if (!isSubscribed) return;
        setIsInitiating(false);
        const errMsg = err?.response?.data?.error || err?.response?.error || err?.message || 'Unable to initiate voice call.';
        setApiError(errMsg);
        setCallStatus('ended');
      });

    return () => {
      isSubscribed = false;
    };
  }, [userId]);

  // 3. Call duration timer & speaking rhythm simulation once connected
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      speakingIntervalRef.current = setInterval(() => {
        setIsSpeaking(prev => !prev);
      }, 3400);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
    };
  }, [callStatus]);

  // Format seconds to mm:ss
  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Actions
  const handleToggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setIsMuted(prev => !prev);
  };

  const handleToggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeakerOn;
    }
    setIsSpeakerOn(prev => !prev);
  };

  const handleEndCall = () => {
    cleanupWebRTC();
    setCallStatus('ended');
    setIsSpeaking(false);

    // Update backend call record & emit socket event
    const currentCallId = activeCallIdRef.current;
    if (socket && isConnected && currentCallId) {
      socket.emit('call:end', { callId: currentCallId, durationSeconds: duration, endReason: 'user_ended' });
    }

    if (currentCallId) {
      updateCallStatusApi(currentCallId, {
        status: 'completed',
        durationSeconds: duration,
        endReason: 'user_ended'
      }).catch(err => {
        console.warn('Failed to update call status on backend:', err.message);
      });
    }
  };


  // ── Error / Rejection Fallback Card ──────────────────────────────────────
  if (apiError) {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="voice-room-container" style={{ justifyContent: 'center' }}>
          <div className="voice-ended-card" style={{ maxWidth: 480 }}>
            <div className="voice-ended-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' }}>
              🚫
            </div>
            <h2 className="voice-ended-title">Call Unavailable</h2>
            <p className="voice-ended-sub">{apiError}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
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
      </div>
    );
  }

  // ── Graceful Fallback: Loading or Friend Not Found ──────────────────────────
  if (!friend) {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="voice-room-container" style={{ justifyContent: 'center' }}>
          <div className="voice-ended-card" style={{ maxWidth: 460 }}>
            <div className="voice-ended-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: 'var(--user-primary)' }}>
              🎧
            </div>
            <h2 className="voice-ended-title">
              {isInitiating ? 'Connecting Voice Line...' : 'User Profile Loading...'}
            </h2>
            <p className="voice-ended-sub">
              {isInitiating
                ? 'Setting up your 1-on-1 audio connection. Please wait...'
                : 'This voice conversation is no longer available or the member ID is invalid.'}
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

  // Predefined heights for simulated waveform bars
  const waveHeights = [40, 75, 95, 60, 85, 100, 70, 45, 90, 65, 80, 50];

  return (
    <div className="user-app-shell">
      {/* Hidden WebRTC Remote Audio Element */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      {/* Background ambient lighting blobs */}
      <div className="user-ambient-blob-1" aria-hidden="true" />
      <div className="user-ambient-blob-2" aria-hidden="true" />

      <div className="voice-room-container">


        {/* ── 1. Minimal Top Navigation Bar ────────────────────────────── */}
        <header className="voice-room-header">
          <Link to="/friends" className="voice-back-btn" title="Back to Friends List">
            <IconChevronLeft size={18} />
            <span>Friends</span>
          </Link>

          <div className="voice-privacy-pill">
            <IconLock size={14} style={{ color: 'var(--user-status-online)' }} />
            <span>Private 1-to-1 Voice Chat</span>
          </div>

          <Link
            to={`/user/${friend.id}`}
            className="voice-profile-link"
            title={`View ${friend.fullName}'s Profile`}
          >
            <span>View Profile</span>
            <span style={{ fontSize: '0.8rem' }}>&rarr;</span>
          </Link>
        </header>

        {/* ── 2. Center Stage (Avatar, Aura, Identity & Visualizer) ──── */}
        <main className="voice-stage">

          {/* Large Avatar with Concentric Voice Aura Rings */}
          <div className="voice-avatar-stage">
            {/* Concentric Aura Rings */}
            <div
              className={`voice-aura-ring voice-aura-outer ${
                callStatus === 'connected' && isSpeaking && !isMuted ? 'active-speaking' : callStatus === 'connecting' ? 'active-connecting' : ''
              }`}
            />
            <div
              className={`voice-aura-ring voice-aura-middle ${
                callStatus === 'connected' && isSpeaking && !isMuted ? 'active-speaking' : callStatus === 'connecting' ? 'active-connecting' : ''
              }`}
            />
            <div
              className={`voice-aura-ring voice-aura-inner ${
                callStatus === 'connected' && isSpeaking && !isMuted ? 'active-speaking' : ''
              }`}
            />

            {/* Avatar Circle */}
            <div
              className="voice-avatar-large"
              style={{ background: friend.avatarBg }}
              title={friend.fullName}
            >
              {renderAvatar(friend.avatar, friend.fullName)}
            </div>

            {/* Subtle mic-muted badge over avatar if muted */}
            {isMuted && callStatus === 'connected' && (
              <span className="voice-muted-badge" title="Microphone Muted">
                <IconMicOff size={14} />
              </span>
            )}
          </div>

          {/* Identity & Status Details */}
          <div className="voice-identity-wrap">
            <Link
              to={`/user/${friend.id}`}
              className="voice-friend-name-link"
              title={`View ${friend.fullName}'s profile`}
            >
              <h1 className="voice-friend-name">{friend.fullName}</h1>
            </Link>
            <div className="voice-friend-handle">@{friend.username}</div>

            {/* Call State & Live Timer Strip */}
            <div className="voice-status-strip">
              {callStatus === 'connecting' && (
                <div className="voice-status-text connecting">
                  <span className="voice-pulse-dot" />
                  <span>Connecting to {friend.fullName.split(' ')[0]}...</span>
                </div>
              )}

              {callStatus === 'connected' && (
                <>
                  <div className="voice-timer-pill">
                    <span className="voice-timer-dot" />
                    <span>{formatTime(duration)}</span>
                  </div>

                  <div className="voice-status-text connected">
                    {isMuted ? (
                      <span style={{ color: '#F59E0B' }}>🎙️ You are muted</span>
                    ) : isSpeaking ? (
                      <span style={{ color: 'var(--user-status-online)' }}>
                        ● {friend.fullName.split(' ')[0]} is speaking...
                      </span>
                    ) : (
                      <span>● In Conversation</span>
                    )}
                  </div>
                </>
              )}

              {callStatus === 'ended' && (
                <div className="voice-status-text ended">
                  <span>Call Ended</span>
                </div>
              )}
            </div>
          </div>

          {/* Simulated Waveform Equalizer */}
          {callStatus !== 'ended' && (
            <div className="voice-waveform-equalizer">
              {waveHeights.map((h, idx) => {
                const isActiveAnim = callStatus === 'connected' && !isMuted && isSpeaking;
                const isListening = callStatus === 'connected' && !isMuted && !isSpeaking;
                const isMutedState = isMuted || callStatus === 'connecting';

                const barHeight = isMutedState
                  ? 15
                  : isListening
                  ? Math.max(18, (h * 0.4))
                  : h;

                return (
                  <span
                    key={idx}
                    className={`voice-equalizer-bar ${isActiveAnim ? 'animating' : ''}`}
                    style={{
                      height: `${barHeight}%`,
                      animationDelay: `${idx * 0.08}s`
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Topics context badge */}
          {friend.interests && friend.interests.length > 0 && callStatus !== 'ended' && (
            <div className="voice-topics-hint">
              <span>Shared vibe:</span>
              <span className="voice-topic-tag">#{friend.interests[0]}</span>
              {friend.interests[1] && (
                <span className="voice-topic-tag">#{friend.interests[1]}</span>
              )}
            </div>
          )}

        </main>

        {/* ── 3. Bottom Controls Area or Call Ended Summary ─────────── */}
        {callStatus !== 'ended' ? (
          <footer className="voice-controls-bar">
            {/* Mute Toggle Button */}
            <div className="voice-control-item">
              <button
                type="button"
                onClick={handleToggleMute}
                disabled={callStatus === 'connecting'}
                className={`voice-control-btn mute ${isMuted ? 'active-muted' : ''}`}
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <IconMicOff size={22} /> : <IconMic size={22} />}
              </button>
              <span className="voice-control-label">{isMuted ? 'Unmute' : 'Mute'}</span>
            </div>

            {/* End Call Button (Prominent Destructive Action) */}
            <div className="voice-control-item">
              <button
                type="button"
                onClick={handleEndCall}
                className="voice-control-btn end-call"
                aria-label="End voice call"
                title="End Call"
              >
                <IconPhoneOff size={24} />
              </button>
              <span className="voice-control-label end">End Call</span>
            </div>

            {/* Speaker Toggle Button */}
            <div className="voice-control-item">
              <button
                type="button"
                onClick={handleToggleSpeaker}
                disabled={callStatus === 'connecting'}
                className={`voice-control-btn speaker ${!isSpeakerOn ? 'active-speaker-off' : ''}`}
                aria-label={isSpeakerOn ? 'Turn speaker off' : 'Turn speaker on'}
                title={isSpeakerOn ? 'Speaker Off' : 'Speaker On'}
              >
                {isSpeakerOn ? <IconVolume2 size={22} /> : <IconVolumeX size={22} />}
              </button>
              <span className="voice-control-label">{isSpeakerOn ? 'Speaker On' : 'Speaker Off'}</span>
            </div>
          </footer>
        ) : (
          /* ── Call Ended Summary Card ────────────────────────────── */
          <div className="voice-ended-card">
            <div className="voice-ended-icon">
              <IconCheck size={28} />
            </div>

            <h2 className="voice-ended-title">Call Ended</h2>
            <p className="voice-ended-sub">
              Your voice conversation with <strong>{friend.fullName}</strong> ended.
            </p>

            <div className="voice-ended-stats">
              <div className="voice-ended-stat-box">
                <span className="voice-ended-stat-val">{formatTime(duration)}</span>
                <span className="voice-ended-stat-lbl">Call Duration</span>
              </div>
              <div className="voice-ended-stat-box">
                <span className="voice-ended-stat-val" style={{ color: 'var(--user-status-online)' }}>
                  {friend.matchScore}%
                </span>
                <span className="voice-ended-stat-lbl">Topic Match</span>
              </div>
            </div>

            <div className="voice-ended-actions">
              <Link
                to="/friends"
                className="btn-user-primary"
                style={{ flex: 1, padding: '12px 20px', textAlign: 'center', justifyContent: 'center' }}
              >
                Back to Friends
              </Link>
              <Link
                to={`/user/${friend.id}`}
                className="btn-user-secondary"
                style={{ flex: 1, padding: '12px 20px', textAlign: 'center', justifyContent: 'center' }}
              >
                View Profile
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
