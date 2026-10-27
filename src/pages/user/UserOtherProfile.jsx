import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import {
  MOCK_CURRENT_USER_PREVIEW
} from '../../data/userMockData';
import { getPublicUserProfile } from '../../services/discoverApi';
import { useFriendRequests } from '../../context/FriendRequestContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import { blockUserApi, reportUserApi } from '../../services/userSafetyApi';
import {
  IconMic,
  IconSparkles,
  IconUsers,
  IconPhoneCall,
  IconCheck,
  IconTag,
  IconMessageSquare,
  IconShieldAlert,
  IconBan
} from '../../components/common/Icons';


import { renderAvatar } from '../../utils/avatarUtils';


export default function UserOtherProfile() {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const {
    isRequestSent,
    sendRequest,
    cancelRequest,
    isFriend,
    isIncomingRequest,
    getIncomingRequest,
    acceptRequest,
    connectedFriends,
    incomingRequests,
    sentRequests
  } = useFriendRequests();

  // Profile data & loading states
  const [profileUser, setProfileUser] = useState(() => {
    const friend = (connectedFriends || []).find(f => f.id === id);
    if (friend) return friend;
    const incoming = (incomingRequests || []).find(r => r.user?.id === id);
    if (incoming) return incoming.user;
    const sent = (sentRequests || []).find(r => r.user?.id === id);
    if (sent) return sent.user;
    return null;
  });
  const [isLoading, setIsLoading] = useState(!profileUser);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch real user public profile from backend
  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      if (!id) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setNotFound(false);
      setErrorMessage(null);

      try {
        const res = await getPublicUserProfile(id);
        if (isMounted) {
          if (res?.user) {
            setProfileUser(res.user);
          } else {
            setNotFound(true);
          }
        }
      } catch (err) {
        if (isMounted) {
          if (err.status === 404 || err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
            setNotFound(true);
          } else {
            setErrorMessage(err.message || 'Failed to load user profile');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const user = profileUser;
  const currentUser = authUser || MOCK_CURRENT_USER_PREVIEW;

  // Local interaction states
  const requestPending = isRequestSent(user?.id);
  const isAlreadyFriend = isFriend(user?.id);
  const incomingPending = isIncomingRequest ? isIncomingRequest(user?.id) : false;
  const [hasWaved, setHasWaved] = useState(false);
  const [isPlayingPrompt, setIsPlayingPrompt] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);

  // Safety & Privacy Modal & Action States
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockError, setBlockError] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Harassment or Bullying');
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleConfirmBlock = async () => {
    if (!user || !user.id) return;
    setIsBlocking(true);
    setBlockError(null);
    try {
      await blockUserApi(user.id, 'Blocked from user profile');
      setIsBlocked(true);
      setShowBlockModal(false);
    } catch (err) {
      setBlockError(err.message || 'Failed to block user.');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!user || !user.id) return;
    setIsReporting(true);
    setReportError(null);
    try {
      await reportUserApi(user.id, reportReason, reportDetails);
      setReportSubmitted(true);
    } catch (err) {
      setReportError(err.message || 'Failed to submit report.');
    } finally {
      setIsReporting(false);
    }
  };


  // Compute shared topics (intersection between current user and target user)
  const { sharedInterests, otherInterests } = useMemo(() => {
    if (!user || !currentUser) {
      return { sharedInterests: [], otherInterests: [] };
    }

    const currentTopicsLower = (currentUser.interests || []).map(t => t.toLowerCase().trim());
    const shared = [];
    const others = [];

    (user.interests || []).forEach(topic => {
      const topicLower = topic.toLowerCase().trim();
      const hasMatch = currentTopicsLower.some(ct => 
        ct === topicLower || ct.includes(topicLower) || topicLower.includes(ct)
      );

      if (hasMatch) {
        shared.push(topic);
      } else {
        others.push(topic);
      }
    });

    return { sharedInterests: shared, otherInterests: others };
  }, [user, currentUser]);

  const handleToggleConnect = async () => {
    if (isAlreadyFriend) {
      return;
    }
    if (requestPending) {
      try {
        await cancelRequest(user.id);
      } catch (err) {
        console.error('Cancel request failed:', err);
      }
    } else if (incomingPending) {
      try {
        const inc = getIncomingRequest(user.id);
        if (inc) {
          await acceptRequest(inc.id);
        }
      } catch (err) {
        console.error('Accept request failed:', err);
      }
    } else {
      try {
        await sendRequest(user);
      } catch (err) {
        console.error('Send request failed:', err);
      }
    }
  };

  const handleSendWave = () => {
    setHasWaved(true);
  };

  const handleShareProfile = () => {
    setShareFeedback(true);
    setTimeout(() => setShareFeedback(false), 2400);
  };

  if (isLoading && !user) {
    return (
      <UserLayout>
        <div className="profile-page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2.4rem', marginBottom: 16 }}>⏳</div>
          <h2>Loading Voice Profile...</h2>
          <p style={{ color: 'var(--user-text-secondary)', marginBottom: 24 }}>
            Retrieving member details...
          </p>
        </div>
      </UserLayout>
    );
  }

  if (notFound || !user) {
    return (
      <UserLayout>
        <div className="profile-page-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2>User Profile Not Found</h2>
          <p style={{ color: 'var(--user-text-secondary)', marginBottom: 24 }}>
            {errorMessage || 'The voice member you are looking for does not exist or is unavailable.'}
          </p>
          <Link to="/discover" className="btn-user-primary" style={{ width: 'auto', display: 'inline-flex' }}>
            &larr; Back to Discover Lounge
          </Link>
        </div>
      </UserLayout>
    );
  }

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
            <span className="profile-badge-public">
              🌐 Community Member Profile
            </span>
            <button
              type="button"
              onClick={() => {
                setReportError(null);
                setReportSubmitted(false);
                setShowReportModal(true);
              }}
              className="btn-user-secondary"
              style={{ padding: '5px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <IconShieldAlert size={14} />
              <span>Report</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBlockError(null);
                setShowBlockModal(true);
              }}
              className="btn-user-secondary"
              style={{ padding: '5px 12px', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <IconBan size={14} />
              <span>{isBlocked ? 'Blocked' : 'Block'}</span>
            </button>
          </div>
        </div>

        {isBlocked && (
          <div style={{
            padding: '16px 20px',
            borderRadius: 14,
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <strong>User Blocked</strong>
              <div style={{ fontSize: '0.84rem', marginTop: 2, color: 'var(--user-text-secondary)' }}>
                You have blocked {user.fullName}. They will no longer appear in your Discover lounge or Friends list.
              </div>
            </div>
          </div>
        )}


        {/* ── 1. Profile Hero Identity Card ───────────────────────────── */}
        <section className="profile-hero-card">
          <div className="profile-hero-grid">
            
            {/* Left: Avatar Block with Voice Glow Aura */}
            <div className="profile-avatar-column">
              <div className="profile-avatar-wrapper">
                <div
                  className="profile-avatar-circle"
                  style={{ background: user.avatarBg }}
                >
                  {renderAvatar(user.avatar, user.fullName)}
                </div>
                {/* Voice Aura Ring */}
                <span className={`profile-avatar-aura ${user.status === 'available_to_talk' ? 'active' : ''}`} />
              </div>

              {/* Status Pill */}
              <div className="profile-voice-status-pill">
                <span
                  className="profile-status-indicator"
                  style={{
                    backgroundColor: user.status === 'available_to_talk'
                      ? 'var(--user-status-online)'
                      : user.status === 'in_room'
                      ? 'var(--user-accent)'
                      : '#38BDF8'
                  }}
                />
                <span>{user.statusLabel}</span>
              </div>
            </div>

            {/* Middle: Identity, Location, Bio */}
            <div className="profile-identity-column">
              <div className="profile-name-row">
                <h1 className="profile-display-name">{user.fullName}</h1>
                <span className="profile-username-badge">@{user.username}</span>
                
                {/* Topic Resonance Match Badge */}
                <div className="discover-resonance-pill" style={{ marginLeft: 4 }}>
                  <IconSparkles size={13} />
                  <span>{user.matchScore}% Match</span>
                </div>
              </div>

              <div className="profile-meta-row">
                <span className="profile-meta-item">
                  <span>📍</span>
                  <span>{user.location}</span>
                </span>
                <span className="profile-meta-divider">&bull;</span>
                <span className="profile-meta-item">
                  <span>💬</span>
                  <span>{user.conversationStyle}</span>
                </span>
              </div>

              {/* Bio */}
              <p className="profile-bio-text">
                {user.bio}
              </p>

              {/* Primary Action Buttons */}
              <div className="profile-actions-row">
                <button
                  type="button"
                  onClick={handleToggleConnect}
                  className={`discover-connect-btn ${requestPending || isAlreadyFriend || incomingPending ? 'connected' : ''}`}
                  style={{ flex: 'none', minWidth: 160, padding: '11px 24px', fontSize: '0.92rem' }}
                >
                  {isAlreadyFriend ? (
                    <>
                      <IconCheck size={16} />
                      <span>Friends</span>
                    </>
                  ) : requestPending ? (
                    <>
                      <IconCheck size={16} />
                      <span>Request Sent</span>
                    </>
                  ) : incomingPending ? (
                    <>
                      <IconCheck size={16} />
                      <span>Accept</span>
                    </>
                  ) : (
                    <>
                      <IconUsers size={16} />
                      <span>Connect</span>
                    </>
                  )}
                </button>

                {isAlreadyFriend && (
                  <>
                    <Link
                      to={`/messages/${user.id}`}
                      className="btn-user-primary"
                      style={{
                        flex: 'none',
                        padding: '11px 20px',
                        fontSize: '0.9rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        textDecoration: 'none'
                      }}
                    >
                      <IconMessageSquare size={16} />
                      <span>Message</span>
                    </Link>

                    <Link
                      to={`/voice/${user.id}`}
                      className="btn-user-primary"
                      style={{
                        flex: 'none',
                        padding: '11px 20px',
                        fontSize: '0.9rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'linear-gradient(135deg, #00F5D4, #00b4d8)',
                        color: '#0d021a',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <IconPhoneCall size={16} />
                      <span>Voice Call</span>
                    </Link>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleSendWave}
                  className={`discover-wave-btn ${hasWaved ? 'waved' : ''}`}
                  style={{ flex: 'none', padding: '11px 20px', fontSize: '0.9rem' }}
                >
                  {hasWaved ? '👋 Waved!' : '👋 Send Wave'}
                </button>

                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="btn-user-secondary"
                  style={{ width: 'auto', padding: '11px 18px', fontSize: '0.9rem' }}
                  title="Share profile link"
                >
                  {shareFeedback ? '✓ Copied!' : '🔗 Share'}
                </button>
              </div>
            </div>

            {/* Right: Quick Vibe & Voice Compatibility Card */}
            <div className="profile-status-switcher-column" style={{ background: 'rgba(255, 51, 133, 0.05)', borderColor: 'rgba(255, 51, 133, 0.25)' }}>
              <div className="profile-switcher-title" style={{ color: 'var(--user-primary)' }}>
                ✨ Voice Compatibility
              </div>

              <div style={{ fontSize: '0.84rem', color: 'var(--user-text)', fontWeight: 700, margin: '4px 0 2px' }}>
                {user.matchScore}% Resonance
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--user-text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                {sharedInterests.length > 0
                  ? `You and ${user.fullName.split(' ')[0]} share ${sharedInterests.length} mutual interests.`
                  : `Connect to explore each other’s favorite audio topics.`}
              </p>

              <div style={{
                background: 'var(--user-bg-card)',
                borderRadius: 10,
                padding: '8px 10px',
                border: '1px solid var(--user-border)',
                fontSize: '0.76rem',
                color: 'var(--user-text-muted)'
              }}>
                <span style={{ color: 'var(--user-status-online)' }}>●</span> Mutual friends only 1-on-1 calling
              </div>
            </div>

          </div>
        </section>

        {/* ── 2. Social Stats Bar ──────────────────────────────────────── */}
        <div className="profile-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          
          <div className="profile-stat-box">
            <div className="profile-stat-icon-wrap" style={{ background: 'rgba(255, 51, 133, 0.12)', color: 'var(--user-primary)' }}>
              <IconSparkles size={20} />
            </div>
            <div>
              <div className="profile-stat-number">{user.matchScore}%</div>
              <div className="profile-stat-label">Match Resonance</div>
            </div>
          </div>

          <div className="profile-stat-box">
            <div className="profile-stat-icon-wrap" style={{ background: 'rgba(139, 47, 201, 0.16)', color: 'var(--user-accent)' }}>
              <IconUsers size={20} />
            </div>
            <div>
              <div className="profile-stat-number">{user.stats?.friendsCount || 18}</div>
              <div className="profile-stat-label">Friends Connected</div>
            </div>
          </div>

          <div className="profile-stat-box">
            <div className="profile-stat-icon-wrap" style={{ background: 'rgba(0, 245, 212, 0.12)', color: 'var(--user-status-online)' }}>
              <IconMic size={20} />
            </div>
            <div>
              <div className="profile-stat-number">{user.stats?.stagesAttended || 24}</div>
              <div className="profile-stat-label">Stages Joined</div>
            </div>
          </div>

          <div className="profile-stat-box">
            <div className="profile-stat-icon-wrap" style={{ background: 'rgba(255, 51, 133, 0.12)', color: 'var(--user-primary)' }}>
              <IconPhoneCall size={20} />
            </div>
            <div>
              <div className="profile-stat-number">{user.stats?.voiceHours || '35h'}</div>
              <div className="profile-stat-label">Voice Talk Time</div>
            </div>
          </div>

        </div>

        {/* ── 3. Voice Intro / Voice Prompt Audio Capsule ──────────────── */}
        {user.voicePrompt && (
          <section className="profile-section-card voice-intro-card">
            <div className="profile-card-header">
              <div className="profile-card-header-left">
                <div className="profile-section-icon-badge">
                  <IconMic size={20} />
                </div>
                <div>
                  <h2 className="profile-section-title">
                    {user.fullName.split(' ')[0]}&rsquo;s Voice Intro
                  </h2>
                  <p className="profile-section-sub">
                    Listen to their tone and voice vibe before saying hello.
                  </p>
                </div>
              </div>
            </div>

            <div className={`profile-audio-capsule ${isPlayingPrompt ? 'playing' : ''}`}>
              {/* Play / Pause Button */}
              <button
                type="button"
                onClick={() => setIsPlayingPrompt(!isPlayingPrompt)}
                className="profile-audio-play-btn"
                aria-label={isPlayingPrompt ? 'Pause voice prompt' : 'Play voice prompt'}
                title={isPlayingPrompt ? 'Pause voice intro' : 'Listen to voice intro'}
              >
                {isPlayingPrompt ? '⏸' : '▶'}
              </button>

              {/* Audio Details & Equalizer Track */}
              <div className="profile-audio-details">
                <div className="profile-audio-prompt-title">
                  &ldquo;{user.voicePrompt.title}&rdquo;
                </div>

                <div className="profile-waveform-track">
                  {user.voicePrompt.previewWaves.map((h, idx) => (
                    <span
                      key={idx}
                      className={`profile-wave-bar ${isPlayingPrompt ? 'animating' : ''}`}
                      style={{
                        height: isPlayingPrompt ? `${Math.max(20, (h + (idx % 4) * 18) % 100)}%` : `${h}%`,
                        animationDelay: `${idx * 0.07}s`
                      }}
                    />
                  ))}
                </div>

                <div className="profile-audio-description">
                  {user.voicePrompt.description || 'Authentic voice introduction and topic preview.'}
                </div>
              </div>

              {/* Duration Indicator */}
              <div className="profile-audio-duration">
                <span className="voice-wave-visualizer" style={{ transform: 'scale(0.8)', marginRight: 4 }}>
                  <span className="voice-wave-bar" />
                  <span className="voice-wave-bar" />
                  <span className="voice-wave-bar" />
                </span>
                <span>{user.voicePrompt.duration}</span>
              </div>
            </div>
          </section>
        )}

        {/* ── 4. Two-Column Layout: Shared Interests & About ──────────── */}
        <div className="profile-two-columns-grid">
          
          {/* Left Column: Shared Interests ("You Both Like") */}
          <section className="profile-section-card">
            <div className="profile-card-header">
              <div className="profile-card-header-left">
                <span style={{ fontSize: '1.3rem' }}>✨</span>
                <div>
                  <h2 className="profile-section-title">
                    You Both Like ({sharedInterests.length})
                  </h2>
                  <p className="profile-section-sub">
                    Direct topic overlap based on your onboarding preferences.
                  </p>
                </div>
              </div>
            </div>

            {sharedInterests.length > 0 ? (
              <div className="profile-interests-cloud" style={{ marginBottom: 20 }}>
                {sharedInterests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="profile-interest-tag"
                    style={{
                      borderColor: 'var(--user-primary)',
                      background: 'rgba(255, 51, 133, 0.12)',
                      color: '#FFFFFF',
                      boxShadow: '0 0 12px rgba(255, 51, 133, 0.2)'
                    }}
                  >
                    <IconCheck size={13} style={{ color: 'var(--user-primary)', marginRight: 6 }} />
                    <span>#{interest}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '20px 16px',
                borderRadius: 14,
                background: 'var(--user-bg-secondary)',
                border: '1px dashed var(--user-border)',
                color: 'var(--user-text-muted)',
                fontSize: '0.86rem',
                lineHeight: 1.5,
                marginBottom: 20
              }}>
                No direct topic overlap yet &mdash; maybe you&rsquo;ll introduce each other to new ones!
              </div>
            )}

            {/* Other Topics They're Into */}
            {otherInterests.length > 0 && (
              <div style={{ paddingTop: 16, borderTop: '1px solid var(--user-border)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--user-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  Other Topics {user.fullName.split(' ')[0]} Explores:
                </div>
                <div className="profile-interests-cloud">
                  {otherInterests.map((interest, idx) => (
                    <span key={idx} className="profile-interest-tag">
                      <span style={{ color: 'var(--user-text-muted)', marginRight: 4 }}>#</span>
                      <span>{interest}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Right Column: About & Conversation Vibe */}
          <section className="profile-section-card">
            <div className="profile-card-header">
              <div className="profile-card-header-left">
                <span style={{ fontSize: '1.3rem' }}>💬</span>
                <div>
                  <h2 className="profile-section-title">About &amp; Vibe</h2>
                  <p className="profile-section-sub">
                    How {user.fullName.split(' ')[0]} likes to chat.
                  </p>
                </div>
              </div>
            </div>

            <div className="profile-details-list">
              <div className="profile-detail-item">
                <span className="profile-detail-label">Conversation Style</span>
                <span className="profile-detail-value">{user.conversationStyle}</span>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">Preferred Active Times</span>
                <span className="profile-detail-value">{user.preferredTime}</span>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">Languages Spoken</span>
                <div className="profile-lang-chips">
                  {user.languages && user.languages.map((lang, idx) => (
                    <span key={idx} className="profile-lang-chip">
                      🗣️ {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">Voice Safety</span>
                <span className="profile-detail-value" style={{ color: 'var(--user-status-online)' }}>
                  🔒 Strict Mutual Consent &bull; 1-on-1 calls unlocked only after connection
                </span>
              </div>
            </div>
          </section>

        </div>

        {/* ── 5. Bottom Action Bar CTA ─────────────────────────────────── */}
        <div style={{
          background: 'var(--user-bg-card)',
          border: '1px solid var(--user-border)',
          borderRadius: 20,
          padding: '22px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          boxShadow: 'var(--user-card-shadow)'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--user-text)', marginBottom: 2 }}>
              Ready to chat with {user.fullName.split(' ')[0]}?
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--user-text-secondary)' }}>
              Send a connection request or a lightweight friendly wave to start talking.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={handleSendWave}
              className={`discover-wave-btn ${hasWaved ? 'waved' : ''}`}
              style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem' }}
            >
              {hasWaved ? '👋 Waved!' : '👋 Send Wave'}
            </button>
            <button
              type="button"
              onClick={handleToggleConnect}
              className={`discover-connect-btn ${requestPending || isAlreadyFriend ? 'connected' : ''}`}
              style={{ width: 'auto', padding: '10px 24px', fontSize: '0.92rem' }}
            >
              {isAlreadyFriend ? (
                <>
                  <IconCheck size={16} />
                  <span>Friends with {user.fullName.split(' ')[0]}</span>
                </>
              ) : requestPending ? (
                <>
                  <IconCheck size={16} />
                  <span>Request Sent</span>
                </>
              ) : (
                <>
                  <IconUsers size={16} />
                  <span>Connect with {user.fullName.split(' ')[0]}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Block User Modal ────────────────────────────────────────── */}
        <Modal
          isOpen={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          title={`Block ${user.fullName}`}
          size="sm"
        >
          <div style={{ padding: '8px 0' }}>
            {blockError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.86rem', marginBottom: 14 }}>
                {blockError}
              </div>
            )}
            <p style={{ color: 'var(--user-text-secondary)', fontSize: '0.9rem', marginBottom: 20, lineHeight: 1.5 }}>
              Are you sure you want to block <strong>{user.fullName}</strong> (@{user.username})? They will be removed from your friends and won&rsquo;t appear in your connection feed.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                disabled={isBlocking}
                className="btn-user-secondary"
                style={{ padding: '8px 18px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                disabled={isBlocking}
                className="btn-block-confirm"
                style={{ padding: '8px 20px' }}
              >
                {isBlocking ? 'Blocking...' : 'Confirm Block'}
              </button>
            </div>
          </div>
        </Modal>

        {/* ── Report User Modal ───────────────────────────────────────── */}
        <Modal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title={`Report ${user.fullName}`}
          size="md"
        >
          {reportSubmitted ? (
            <div className="modal-confirmation-state">
              <div className="modal-confirmation-icon">
                <IconCheck size={28} />
              </div>
              <h3 className="modal-confirmation-title">Report submitted</h3>
              <p className="modal-confirmation-sub">
                Thank you for helping keep our community safe. Our moderation team will review your report.
              </p>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="btn-user-primary"
                style={{ padding: '10px 28px', marginTop: 12 }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReport} className="report-modal-form">
              {reportError && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.86rem', marginBottom: 14 }}>
                  {reportError}
                </div>
              )}

              <div className="form-group-field">
                <label htmlFor="profile-report-reason" className="form-field-label">
                  Reason for Report
                </label>
                <select
                  id="profile-report-reason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="safety-form-select"
                  required
                >
                  <option value="Harassment or Bullying">Harassment or Bullying</option>
                  <option value="Spam">Spam</option>
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Fake or Misleading Profile">Fake or Misleading Profile</option>
                  <option value="Safety Concern">Safety Concern</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group-field">
                <label htmlFor="profile-report-details" className="form-field-label">
                  Details
                </label>
                <textarea
                  id="profile-report-details"
                  rows={4}
                  maxLength={500}
                  placeholder="Describe the issue..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="safety-form-textarea"
                />
              </div>

              <div className="modal-actions-strip">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  disabled={isReporting}
                  className="btn-user-secondary"
                  style={{ padding: '9px 20px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReporting}
                  className="btn-user-primary"
                  style={{ padding: '9px 22px' }}
                >
                  {isReporting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </Modal>

      </div>
    </UserLayout>
  );
}

