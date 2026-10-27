import React, { useState, useEffect } from 'react';
import { Link } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import InterestPicker from '../../components/user/InterestPicker';
import { useAuth } from '../../context/AuthContext';
import {
  MOCK_AVATARS,
  MOCK_INTEREST_CATEGORIES
} from '../../data/userMockData';
import {
  IconMic,
  IconSparkles,
  IconUsers,
  IconPhoneCall,
  IconCheck,
  IconTag,
  IconSliders,
  IconMessageSquare,
  IconShieldAlert
} from '../../components/common/Icons';
import { renderAvatar } from '../../utils/avatarUtils';


export default function UserProfile() {

  const { user, updateUserProfile } = useAuth();

  const [isPlayingPrompt, setIsPlayingPrompt] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);

  // Fallback avatar object
  const fallbackAvatar = MOCK_AVATARS[0];
  const avatarObj = MOCK_AVATARS.find(a => a.id === user?.avatarId) || fallbackAvatar;

  // Real authenticated user profile data with safe UI fallbacks
  const profile = {
    id: user?.id || 'usr-preview',
    fullName: user?.fullName || 'Voice Friend',
    username: user?.username || 'user',
    email: user?.email || '',
    avatar: user?.avatar && user.avatar.length <= 4 ? user.avatar : (user?.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('/')) ? user.avatar : avatarObj.emoji),
    avatarId: user?.avatarId || avatarObj.id,
    avatarBg: user?.avatarBg || avatarObj.bg,
    bio: user?.bio || 'Voice social enthusiast • Always down for a good chat 🎙️',
    location: user?.location || 'Online',
    preferredTime: user?.preferredTime || 'Evenings & Weekends',
    conversationStyle: user?.conversationStyle || 'Casual chill & deep talks',
    languages: user?.languages && user.languages.length > 0 ? user.languages : ['English (Fluent)'],
    voiceStatus: user?.voiceStatus || 'available_to_talk',
    interests: user?.interests && user.interests.length > 0 ? user.interests : ['Lo-Fi Chill Beats', 'Podcasts', 'Deep Night Talks'],
    voicePrompt: {
      title: 'What should we talk about late at night?',
      duration: '0:18',
      previewWaves: [45, 80, 95, 65, 90, 100, 75, 50, 85, 70, 90, 55],
      description: 'A quick snippet of my mic vibe, acoustic background music, and favorite chat topics.'
    },
    stats: {
      friendsCount: user?.friendsCount || 0,
      stagesAttended: Math.max(1, (user?.voiceCallsCount || 0) * 2),
      voiceHours: `${Math.round((user?.totalVoiceMinutes || 0) / 60)}h`,
      resonanceScore: 95
    },
    completeness: Math.min(100, (user?.fullName ? 25 : 0) + (user?.bio ? 25 : 0) + (user?.interests?.length > 0 ? 25 : 0) + (user?.avatarId ? 25 : 0)) || 85
  };

  // Edit form state
  const [editForm, setEditForm] = useState({
    fullName: profile.fullName,
    username: profile.username,
    avatarId: profile.avatarId || 'av-1',
    bio: profile.bio,
    location: profile.location,
    conversationStyle: profile.conversationStyle,
    preferredTime: profile.preferredTime,
    voiceStatus: profile.voiceStatus
  });

  // Selected interest tags in local state
  const [selectedTagIds, setSelectedTagIds] = useState([
    'tag-lofi',
    'tag-valorant',
    'tag-deeptalks',
    'tag-coding'
  ]);

  // Sync form state when user changes
  useEffect(() => {
    if (user) {
      setEditForm({
        fullName: user.fullName || '',
        username: user.username || '',
        avatarId: user.avatarId || 'av-1',
        bio: user.bio || '',
        location: user.location || '',
        conversationStyle: user.conversationStyle || '',
        preferredTime: user.preferredTime || '',
        voiceStatus: user.voiceStatus || 'available_to_talk'
      });
      if (user.interests && user.interests.length > 0) {
        const allTags = MOCK_INTEREST_CATEGORIES.flatMap(cat => cat.tags);
        const matched = user.interests.map(name => {
          const found = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
          return found ? found.id : null;
        }).filter(Boolean);
        if (matched.length > 0) setSelectedTagIds(matched);
      }
    }
  }, [user]);

  // Voice status options
  const statusOptions = [
    { id: 'available_to_talk', label: 'Available to Talk', color: 'var(--user-status-online)', icon: '🎙️' },
    { id: 'online', label: 'Online', color: '#38BDF8', icon: '●' },
    { id: 'away', label: 'Away / Busy', color: '#F59E0B', icon: '☕' },
    { id: 'offline', label: 'Appear Offline', color: 'var(--user-text-muted)', icon: '🌙' }
  ];

  const currentStatusObj = statusOptions.find(s => s.id === profile.voiceStatus) || statusOptions[0];

  // Toggle Voice Status Quick Selector via real backend API
  const handleQuickStatusChange = async (newStatusId) => {
    const matched = statusOptions.find(s => s.id === newStatusId);
    if (matched) {
      try {
        await updateUserProfile({ voiceStatus: matched.id });
      } catch (err) {
        console.error('Failed to update voice status:', err);
      }
    }
  };

  // Save Profile Edit via real backend API
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const chosenAvatar = MOCK_AVATARS.find(a => a.id === editForm.avatarId) || MOCK_AVATARS[0];
    const matchedStatus = statusOptions.find(s => s.id === editForm.voiceStatus) || statusOptions[0];

    try {
      await updateUserProfile({
        fullName: editForm.fullName.trim() || profile.fullName,
        avatar: chosenAvatar.emoji,
        avatarId: chosenAvatar.id,
        avatarBg: chosenAvatar.bg,
        bio: editForm.bio.trim(),
        location: editForm.location.trim() || 'Online',
        conversationStyle: editForm.conversationStyle.trim() || 'Casual chill & deep talks',
        preferredTime: editForm.preferredTime.trim() || 'Evenings & Weekends',
        voiceStatus: matchedStatus.id
      });
      setShowEditModal(false);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    }
  };

  // Save Interests Edit via real backend API
  const handleSaveInterests = async () => {
    const allTags = MOCK_INTEREST_CATEGORIES.flatMap(cat => cat.tags);
    const newNames = selectedTagIds.map(id => {
      const found = allTags.find(t => t.id === id);
      return found ? found.name : id;
    });

    try {
      await updateUserProfile({
        interests: newNames
      });
      setShowInterestsModal(false);
    } catch (err) {
      alert(err.message || 'Failed to update interests');
    }
  };

  const handleToggleTag = (tagId) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  // Copy Profile link simulation
  const handleShareProfile = () => {
    setShareFeedback(true);
    setTimeout(() => setShareFeedback(false), 2400);
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
              to="/settings"
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
              title="User Settings & Preferences"
            >
              <IconSliders size={14} />
              <span>Settings</span>
            </Link>
            <Link
              to="/safety-privacy"
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
              title="Safety & Privacy Controls"
            >
              <IconShieldAlert size={14} />
              <span>Safety & Privacy</span>
            </Link>
            <Link
              to="/help-support"
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
              title="Help Center & Community Support"
            >
              <IconMessageSquare size={14} />
              <span>Help & Support</span>
            </Link>
            <span className="profile-badge-public">
              🔒 My Private Profile View
            </span>
          </div>
        </div>

        {/* ── 1. Profile Hero Identity Header ─────────────────────────── */}
        <section className="profile-hero-card">
          <div className="profile-hero-grid">
            
            {/* Left: Avatar Block with Glow */}
            <div className="profile-avatar-column">
              <div className="profile-avatar-wrapper" style={{ width: 96, height: 96, minWidth: 96, minHeight: 96, position: 'relative', flexShrink: 0 }}>
                <div
                  className="profile-avatar-circle"
                  style={{
                    width: 96,
                    height: 96,
                    minWidth: 96,
                    minHeight: 96,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    background: profile.avatarBg
                  }}
                >
                  {renderAvatar(profile.avatar, profile.fullName)}
                </div>
                {/* Voice Aura Ring */}
                <span className={`profile-avatar-aura ${profile.voiceStatus === 'available_to_talk' ? 'active' : ''}`} />

                
                {/* Quick Avatar Change button */}
                <Link
                  to="/profile/edit"
                  className="profile-avatar-edit-badge"
                  title="Change avatar & edit profile"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✏️
                </Link>
              </div>

              {/* Compact Voice Status Pill */}
              <div className="profile-voice-status-pill">
                <span
                  className="profile-status-indicator"
                  style={{ backgroundColor: currentStatusObj.color }}
                />
                <span>{currentStatusObj.label}</span>
              </div>
            </div>

            {/* Middle: Identity, Bio, Details */}
            <div className="profile-identity-column">
              <div className="profile-name-row">
                <h1 className="profile-display-name">{profile.fullName}</h1>
                <span className="profile-username-badge">@{profile.username}</span>
              </div>

              <div className="profile-meta-row">
                <span className="profile-meta-item">
                  <span>📍</span>
                  <span>{profile.location}</span>
                </span>
                <span className="profile-meta-divider">&bull;</span>
                <span className="profile-meta-item">
                  <IconSparkles size={14} style={{ color: 'var(--user-primary)' }} />
                  <span>Topic Resonance: <strong style={{ color: 'var(--user-text)' }}>{profile.stats.resonanceScore}%</strong></span>
                </span>
              </div>

              {/* Bio */}
              <p className="profile-bio-text">
                {profile.bio}
              </p>

              {/* Action Buttons */}
              <div className="profile-actions-row">
                <Link
                  to="/profile/edit"
                  className="btn-user-primary"
                  style={{ width: 'auto', padding: '10px 22px', fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span>✏️ Edit Profile</span>
                </Link>

                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="btn-user-secondary"
                  style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem' }}
                >
                  {shareFeedback ? '✓ Profile Link Copied!' : '🔗 Share Profile'}
                </button>

                <Link
                  to="/settings"
                  className="btn-user-secondary"
                  style={{ width: 'auto', padding: '10px 18px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                  title="User Settings & Preferences"
                >
                  <IconSliders size={16} />
                  <span>Settings</span>
                </Link>

                <Link
                  to="/safety-privacy"
                  className="btn-user-secondary"
                  style={{ width: 'auto', padding: '10px 18px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                  title="Safety & Privacy Controls"
                >
                  <IconShieldAlert size={16} />
                  <span>Safety & Privacy</span>
                </Link>
              </div>
            </div>

            {/* Right: Quick Voice Status Selector */}
            <div className="profile-status-switcher-column">
              <div className="profile-switcher-title">Voice Availability</div>
              <div className="profile-status-buttons-list">
                {statusOptions.map(opt => {
                  const isSelected = profile.voiceStatus === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleQuickStatusChange(opt.id)}
                      className={`profile-status-option-btn ${isSelected ? 'active' : ''}`}
                    >
                      <span className="profile-status-dot-mini" style={{ backgroundColor: opt.color }} />
                      <span className="profile-status-btn-label">{opt.label}</span>
                      {isSelected && <IconCheck size={14} style={{ marginLeft: 'auto', color: 'var(--user-primary)' }} />}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        {/* ── 2. Profile Completeness & Quick Stats Strip ─────────────── */}
        <div className="profile-stats-grid">
          
          {/* Completeness Card */}
          <div className="profile-stat-box completeness-card">
            <div className="profile-stat-box-header">
              <span className="profile-stat-label">Profile Completeness</span>
              <span className="profile-completeness-pct">{profile.completeness}%</span>
            </div>
            <div className="profile-completeness-track">
              <div
                className="profile-completeness-fill"
                style={{ width: `${profile.completeness}%` }}
              />
            </div>
            <div className="profile-completeness-hint">
              <span>✨ Ready for voice matchmaking &amp; live stages</span>
            </div>
          </div>

          {/* Stat 1: Friends Connected */}
          <div className="profile-stat-box">
            <div className="profile-stat-icon-wrap" style={{ background: 'rgba(255, 51, 133, 0.12)', color: 'var(--user-primary)' }}>
              <IconUsers size={20} />
            </div>
            <div>
              <div className="profile-stat-number">{profile.stats.friendsCount}</div>
              <div className="profile-stat-label">Friends Connected</div>
            </div>
          </div>

          {/* Stat 2: Audio Stages */}
          <div className="profile-stat-box">
            <div className="profile-stat-icon-wrap" style={{ background: 'rgba(139, 47, 201, 0.16)', color: 'var(--user-accent)' }}>
              <IconMic size={20} />
            </div>
            <div>
              <div className="profile-stat-number">{profile.stats.stagesAttended}</div>
              <div className="profile-stat-label">Stages Joined</div>
            </div>
          </div>

          {/* Stat 3: Voice Hours */}
          <div className="profile-stat-box">
            <div className="profile-stat-icon-wrap" style={{ background: 'rgba(0, 245, 212, 0.12)', color: 'var(--user-status-online)' }}>
              <IconPhoneCall size={20} />
            </div>
            <div>
              <div className="profile-stat-number">{profile.stats.voiceHours}</div>
              <div className="profile-stat-label">Voice Talk Time</div>
            </div>
          </div>

        </div>

        {/* ── 3. Dedicated Voice Intro / Voice Prompt Section ─────────── */}
        <section className="profile-section-card voice-intro-card">
          <div className="profile-card-header">
            <div className="profile-card-header-left">
              <div className="profile-section-icon-badge">
                <IconMic size={20} />
              </div>
              <div>
                <h2 className="profile-section-title">My Voice Intro</h2>
                <p className="profile-section-sub">
                  Your audio introduction previewed by potential friends before connecting.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert('Voice prompt re-recording simulation: You can calibrate and test your microphone anytime in voice settings.')}
              className="btn-user-secondary"
              style={{ width: 'auto', padding: '8px 16px', fontSize: '0.82rem' }}
            >
              🎙️ Update Prompt
            </button>
          </div>

          {/* High-Fidelity Audio Capsule */}
          <div className={`profile-audio-capsule ${isPlayingPrompt ? 'playing' : ''}`}>
            {/* Play Button */}
            <button
              type="button"
              onClick={() => setIsPlayingPrompt(!isPlayingPrompt)}
              className="profile-audio-play-btn"
              aria-label={isPlayingPrompt ? 'Pause voice prompt' : 'Play voice prompt'}
              title={isPlayingPrompt ? 'Pause intro snippet' : 'Listen to my voice prompt'}
            >
              {isPlayingPrompt ? '⏸' : '▶'}
            </button>

            {/* Audio Info & Animated Equalizer */}
            <div className="profile-audio-details">
              <div className="profile-audio-prompt-title">
                &ldquo;{profile.voicePrompt.title}&rdquo;
              </div>

              <div className="profile-waveform-track">
                {profile.voicePrompt.previewWaves.map((h, idx) => (
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
                {profile.voicePrompt.description}
              </div>
            </div>

            {/* Duration Tag */}
            <div className="profile-audio-duration">
              <span className="voice-wave-visualizer" style={{ transform: 'scale(0.8)', marginRight: 4 }}>
                <span className="voice-wave-bar" />
                <span className="voice-wave-bar" />
                <span className="voice-wave-bar" />
              </span>
              <span>{profile.voicePrompt.duration}</span>
            </div>
          </div>
        </section>

        {/* ── 4. Two-Column Layout: About Me & My Interests ───────────── */}
        <div className="profile-two-columns-grid">
          
          {/* Left Column: About Me & Conversation Preferences */}
          <section className="profile-section-card">
            <div className="profile-card-header">
              <div className="profile-card-header-left">
                <span style={{ fontSize: '1.3rem' }}>💬</span>
                <div>
                  <h2 className="profile-section-title">About Me &amp; Vibe</h2>
                  <p className="profile-section-sub">Conversation style &amp; social preferences.</p>
                </div>
              </div>
            </div>

            <div className="profile-details-list">
              <div className="profile-detail-item">
                <span className="profile-detail-label">Preferred Time</span>
                <span className="profile-detail-value">{profile.preferredTime}</span>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">Conversation Style</span>
                <span className="profile-detail-value">{profile.conversationStyle}</span>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">Languages</span>
                <div className="profile-lang-chips">
                  {profile.languages.map((lang, idx) => (
                    <span key={idx} className="profile-lang-chip">
                      🗣️ {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-label">Voice Safety</span>
                <span className="profile-detail-value" style={{ color: 'var(--user-status-online)' }}>
                  🔒 Mutual Friends 1-on-1 Calling Only
                </span>
              </div>
            </div>
          </section>

          {/* Right Column: Selected Interests & Topics */}
          <section className="profile-section-card">
            <div className="profile-card-header">
              <div className="profile-card-header-left">
                <span style={{ fontSize: '1.3rem' }}>🏷️</span>
                <div>
                  <h2 className="profile-section-title">My Interests ({profile.interests.length})</h2>
                  <p className="profile-section-sub">Topics chosen to pair with matching friends.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInterestsModal(true)}
                className="btn-user-secondary"
                style={{ width: 'auto', padding: '6px 14px', fontSize: '0.8rem' }}
              >
                ✏️ Edit Interests
              </button>
            </div>

            {/* Chips cloud */}
            <div className="profile-interests-cloud">
              {profile.interests.map((interest, idx) => (
                <span key={idx} className="profile-interest-tag">
                  <span style={{ color: 'var(--user-primary)', marginRight: 4 }}>#</span>
                  <span>{interest}</span>
                </span>
              ))}
            </div>

            {/* Top resonance hubs */}
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--user-border)' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--user-text)', marginBottom: 12 }}>
                Strongest Topic Resonance:
              </div>
              <div className="profile-resonance-hubs">
                <div className="profile-resonance-item">
                  <span>☕ Late Night &amp; Deep Talks</span>
                  <span className="profile-resonance-score">98% Match</span>
                </div>
                <div className="profile-resonance-item">
                  <span>🎵 Lo-Fi &amp; Audio Vibes</span>
                  <span className="profile-resonance-score">94% Match</span>
                </div>
                <div className="profile-resonance-item">
                  <span>💻 Web Dev &amp; Startups</span>
                  <span className="profile-resonance-score">91% Match</span>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* ── Modal: Edit Profile Details ─────────────────────────────── */}
        {showEditModal && (
          <div className="profile-modal-overlay">
            <div className="profile-modal-card">
              <div className="profile-modal-header">
                <h3 className="profile-modal-title">Edit My Profile</h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="profile-modal-close"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveProfile}>
                {/* Avatar Picker */}
                <div className="form-group" style={{ marginBottom: 18 }}>
                  <label className="form-label" style={{ color: 'var(--user-text)' }}>
                    Choose Your Avatar
                  </label>
                  <div className="profile-avatar-picker-grid">
                    {MOCK_AVATARS.map(a => {
                      const isSel = a.id === editForm.avatarId;
                      return (
                        <div
                          key={a.id}
                          onClick={() => setEditForm(prev => ({ ...prev, avatarId: a.id }))}
                          className={`profile-avatar-option ${isSel ? 'selected' : ''}`}
                          style={{ background: a.bg }}
                        >
                          <span>{a.emoji}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Full Name & Username */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--user-text)' }}>Display Name</label>
                    <input
                      type="text"
                      className="input-control"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      style={{ background: 'var(--user-bg-secondary)', color: 'var(--user-text)', borderColor: 'var(--user-border)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--user-text)' }}>Username</label>
                    <input
                      type="text"
                      className="input-control"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                      style={{ background: 'var(--user-bg-secondary)', color: 'var(--user-text)', borderColor: 'var(--user-border)' }}
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label className="form-label" style={{ color: 'var(--user-text)', margin: 0 }}>About You (Bio)</label>
                    <span style={{ fontSize: '0.75rem', color: editForm.bio.length > 160 ? 'var(--user-status-error)' : 'var(--user-text-muted)' }}>
                      {editForm.bio.length} / 160
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    className="input-control"
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value.slice(0, 160) })}
                    style={{ background: 'var(--user-bg-secondary)', color: 'var(--user-text)', borderColor: 'var(--user-border)', resize: 'none' }}
                  />
                </div>

                {/* Location & Conversation Style */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--user-text)' }}>Location</label>
                    <input
                      type="text"
                      className="input-control"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      style={{ background: 'var(--user-bg-secondary)', color: 'var(--user-text)', borderColor: 'var(--user-border)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--user-text)' }}>Conversation Style</label>
                    <input
                      type="text"
                      className="input-control"
                      value={editForm.conversationStyle}
                      onChange={(e) => setEditForm({ ...editForm, conversationStyle: e.target.value })}
                      style={{ background: 'var(--user-bg-secondary)', color: 'var(--user-text)', borderColor: 'var(--user-border)' }}
                    />
                  </div>
                </div>

                {/* Preferred Time */}
                <div className="form-group" style={{ marginBottom: 22 }}>
                  <label className="form-label" style={{ color: 'var(--user-text)' }}>Preferred Active Times</label>
                  <input
                    type="text"
                    className="input-control"
                    value={editForm.preferredTime}
                    onChange={(e) => setEditForm({ ...editForm, preferredTime: e.target.value })}
                    style={{ background: 'var(--user-bg-secondary)', color: 'var(--user-text)', borderColor: 'var(--user-border)' }}
                  />
                </div>

                {/* Modal Footer Actions */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-user-secondary"
                    style={{ width: 'auto', padding: '10px 20px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-user-primary"
                    style={{ width: 'auto', padding: '10px 26px' }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Edit Interests ───────────────────────────────────── */}
        {showInterestsModal && (
          <div className="profile-modal-overlay">
            <div className="profile-modal-card" style={{ maxWidth: 580 }}>
              <div className="profile-modal-header">
                <div>
                  <h3 className="profile-modal-title">Edit My Interests</h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--user-text-secondary)' }}>
                    Select topics to pair with like-minded voice friends.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInterestsModal(false)}
                  className="profile-modal-close"
                >
                  ✕
                </button>
              </div>

              <div style={{ margin: '16px 0 24px' }}>
                <InterestPicker
                  selectedTagIds={selectedTagIds}
                  onToggleTag={handleToggleTag}
                  minRequired={3}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowInterestsModal(false)}
                  className="btn-user-secondary"
                  style={{ width: 'auto', padding: '10px 20px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveInterests}
                  className="btn-user-primary"
                  style={{ width: 'auto', padding: '10px 26px' }}
                  disabled={selectedTagIds.length < 3}
                >
                  Save Interests ({selectedTagIds.length})
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </UserLayout>
  );
}
