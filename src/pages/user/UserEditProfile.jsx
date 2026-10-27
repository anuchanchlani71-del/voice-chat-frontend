import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import InterestPicker from '../../components/user/InterestPicker';
import { useAuth } from '../../context/AuthContext';
import { uploadAvatar } from '../../services/authApi';
import { getAvatarUrl, AvatarImage } from '../../utils/avatarUtils';

import {
  MOCK_AVATARS,
  MOCK_INTEREST_CATEGORIES
} from '../../data/userMockData';

import {
  IconCheck,
  IconMic,
  IconSparkles,
  IconUsers,
  IconChevronLeft,
  IconAlertTriangle,
  IconTag,
  IconGlobe
} from '../../components/common/Icons';

const LANGUAGE_OPTIONS = [
  'English (Fluent)',
  'English (Native)',
  'Japanese (Learning)',
  'Japanese (Fluent)',
  'Spanish (Conversational)',
  'French (Conversational)',
  'German (Conversational)',
  'Hindi (Fluent)'
];

const STATUS_OPTIONS = [
  {
    id: 'available_to_talk',
    label: 'Available to Talk',
    icon: '🎙️',
    color: 'var(--user-status-online)',
    desc: 'Ready for 1-to-1 incoming calls and room stage invites'
  },
  {
    id: 'online',
    label: 'Online',
    icon: '●',
    color: '#38BDF8',
    desc: 'Browsing and available for messaging'
  },
  {
    id: 'away',
    label: 'Away / Busy',
    icon: '☕',
    color: '#F59E0B',
    desc: 'Temporarily stepping away from voice chat'
  },
  {
    id: 'offline',
    label: 'Appear Offline',
    icon: '🌙',
    color: 'var(--user-text-muted)',
    desc: 'Hide online status from friends'
  }
];

export default function UserEditProfile() {
  const navigate = useNavigate();
  const { user, updateUserProfile, setUser } = useAuth();
  const fileInputRef = useRef(null);

  // Form State initialized from real authenticated user
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [avatarId, setAvatarId] = useState(user?.avatarId || 'av-1');
  const [customAvatarUrl, setCustomAvatarUrl] = useState(
    user?.avatar && (user.avatar.startsWith('/') || user.avatar.startsWith('http')) ? user.avatar : ''
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [photoError, setPhotoError] = useState('');

  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [conversationStyle, setConversationStyle] = useState(user?.conversationStyle || '');
  const [preferredTime, setPreferredTime] = useState(user?.preferredTime || '');
  const [voiceStatus, setVoiceStatus] = useState(user?.voiceStatus || 'available_to_talk');
  const [languages, setLanguages] = useState(
    user?.languages && user.languages.length > 0
      ? user.languages
      : ['English (Fluent)', 'Japanese (Learning)']
  );

  const allTags = MOCK_INTEREST_CATEGORIES.flatMap(cat => cat.tags);
  const initialTagIds = user?.interests && user.interests.length > 0
    ? user.interests.map(name => {
        const found = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
        return found ? found.id : null;
      }).filter(Boolean)
    : ['tag-lofi', 'tag-valorant', 'tag-deeptalks', 'tag-coding'];

  const [selectedTagIds, setSelectedTagIds] = useState(
    initialTagIds.length > 0 ? initialTagIds : ['tag-lofi', 'tag-valorant']
  );

  // Sync state if user changes/loads
  useEffect(() => {
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.username) setUsername(user.username);
      if (user.avatarId) setAvatarId(user.avatarId);
      if (user.avatar && (user.avatar.startsWith('/') || user.avatar.startsWith('http'))) {
        setCustomAvatarUrl(user.avatar);
      }
      if (user.bio) setBio(user.bio);
      if (user.location) setLocation(user.location);
      if (user.conversationStyle) setConversationStyle(user.conversationStyle);
      if (user.preferredTime) setPreferredTime(user.preferredTime);
      if (user.voiceStatus) setVoiceStatus(user.voiceStatus);
      if (user.languages && user.languages.length > 0) setLanguages(user.languages);
      if (user.interests && user.interests.length > 0) {
        const matched = user.interests.map(name => {
          const found = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
          return found ? found.id : null;
        }).filter(Boolean);
        if (matched.length > 0) setSelectedTagIds(matched);
      }
    }
  }, [user]);

  // Handle Photo File Selection & Multer Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setPhotoError('');
    setApiError('');

    // Frontend 2 MB File Size Check
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('File size exceeds 2 MB limit. Please choose a smaller photo.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Supported Format Check
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
      setPhotoError('Invalid file type. Only JPEG, PNG, WebP, and GIF images are supported.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingPhoto(true);
    setUploadProgress('Uploading photo...');

    try {
      const res = await uploadAvatar(file);
      if (res.success && res.avatarUrl) {
        setCustomAvatarUrl(res.avatarUrl);
        setAvatarId('custom');
        setPhotoError('');
        if (res.user && setUser) {
          setUser(res.user);
        }
      }
    } catch (err) {
      setPhotoError(err.message || 'Failed to upload profile photo.');
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };



  // Voice Intro Simulation State
  const [isPlayingVoiceIntro, setIsPlayingVoiceIntro] = useState(false);

  // Errors, Loading & Feedback State
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Find currently selected avatar object
  const currentAvatarObj = MOCK_AVATARS.find(a => a.id === avatarId) || MOCK_AVATARS[0];

  const voicePrompt = user?.voicePrompt || {
    title: 'What should we talk about late at night?',
    description: 'A quick snippet of my mic vibe and favorite chat topics.',
    duration: '0:18',
    previewWaves: [45, 80, 95, 65, 90, 100, 75, 50, 85, 70, 90, 55]
  };

  // Toggle Language Pill
  const handleToggleLanguage = (lang) => {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  // Toggle Tag in InterestPicker
  const handleToggleTag = (tagId) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  // Validate Form Inputs
  const validateForm = () => {
    const errs = {};

    if (!fullName.trim()) {
      errs.fullName = 'Display name is required.';
    } else if (fullName.trim().length < 2) {
      errs.fullName = 'Display name must be at least 2 characters.';
    } else if (fullName.trim().length > 40) {
      errs.fullName = 'Display name cannot exceed 40 characters.';
    }

    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername) {
      errs.username = 'Username is required.';
    } else if (cleanUsername.length < 3) {
      errs.username = 'Username must be at least 3 characters.';
    } else if (cleanUsername.length > 25) {
      errs.username = 'Username cannot exceed 25 characters.';
    } else if (!/^[a-z0-9_]+$/i.test(cleanUsername)) {
      errs.username = 'Username can only contain letters, numbers, and underscores.';
    }

    if (bio.length > 160) {
      errs.bio = 'Bio cannot exceed 160 characters.';
    }

    if (selectedTagIds.length < 2) {
      errs.interests = 'Please select at least 2 conversation topics.';
    }

    if (languages.length < 1) {
      errs.languages = 'Please select at least one language.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Save via Real Backend API
  const handleSave = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    try {
      // Map tag ids to tag names
      const updatedInterestNames = selectedTagIds.map(id => {
        const found = allTags.find(t => t.id === id);
        return found ? found.name : id;
      });

      const isCustomAvatar = avatarId === 'custom';
      const updatedAvatar = isCustomAvatar && customAvatarUrl ? customAvatarUrl : currentAvatarObj.emoji;
      const updatedAvatarId = isCustomAvatar ? 'custom' : currentAvatarObj.id;
      const updatedAvatarBg = isCustomAvatar ? 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)' : currentAvatarObj.bg;

      await updateUserProfile({
        fullName: fullName.trim(),
        avatar: updatedAvatar,
        avatarId: updatedAvatarId,
        avatarBg: updatedAvatarBg,
        bio: bio.trim(),
        location: location.trim() || 'Online',
        conversationStyle: conversationStyle.trim() || 'Casual chill & deep talks',
        preferredTime: preferredTime.trim() || 'Evenings & Weekends',
        voiceStatus: voiceStatus,
        languages: languages.length > 0 ? languages : ['English (Fluent)'],
        interests: updatedInterestNames
      });

      setSaveSuccess(true);

      setTimeout(() => {
        navigate('/profile');
      }, 700);
    } catch (err) {
      setApiError(err.message || 'Failed to update profile. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <UserLayout>
      <div className="edit-profile-page-container">
        
        {/* ── Breadcrumb Bar ─────────────────────────────────────────── */}
        <div className="edit-profile-top-bar">
          <Link to="/profile" className="edit-profile-back-link">
            <IconChevronLeft size={16} />
            <span>Back to My Profile</span>
          </Link>
          <span className="edit-profile-mode-badge">
            ✏️ Profile Editing Mode
          </span>
        </div>

        {/* ── Header Banner ───────────────────────────────────────────── */}
        <div className="edit-profile-header-card">
          <div className="edit-profile-header-content">
            <div className="edit-profile-pill">
              <IconSparkles size={14} />
              <span>Identity &amp; Vibe Settings</span>
            </div>
            <h1 className="edit-profile-title">Edit Profile</h1>
            <p className="edit-profile-subtitle">
              Personalize your display identity, avatar aura, voice availability, and conversation topics.
            </p>
          </div>

        </div>

        {/* Success Alert Banner */}
        {saveSuccess && (
          <div className="edit-profile-success-banner">
            <IconCheck size={18} />
            <span>Profile changes saved successfully! Returning to profile...</span>
          </div>
        )}

        {/* API Error Notice */}
        {apiError && (
          <div className="edit-profile-error-banner" style={{ marginBottom: 16 }}>
            <IconAlertTriangle size={18} />
            <span>{apiError}</span>
          </div>
        )}

        {/* Validation Errors Notice */}
        {Object.keys(errors).length > 0 && (
          <div className="edit-profile-error-banner">
            <IconAlertTriangle size={18} />
            <span>Please resolve the errors highlighted below before saving.</span>
          </div>
        )}

        {/* ── Form Container ─────────────────────────────────────────── */}
        <form onSubmit={handleSave} className="edit-profile-form">

          {/* ════ SECTION 1: AVATAR & VISUALS ═════════════════════════ */}
          <section className="edit-profile-section-card">
            <div className="edit-section-header">
              <span className="edit-section-icon">🎨</span>
              <div>
                <h2 className="edit-section-title">Profile Avatar &amp; Visuals</h2>
                <p className="edit-section-desc">Upload a custom profile photo or pick a vibrant preset emoji avatar.</p>
              </div>
            </div>

            {/* Custom Photo Upload Box */}
            <div className="edit-custom-upload-box" style={{
              background: 'var(--user-bg-secondary)',
              border: avatarId === 'custom' ? '2px solid var(--user-primary)' : '1px solid var(--user-border)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20
            }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div
                  className="custom-avatar-preview-circle"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: 'var(--user-bg-tertiary)',
                    border: '2px dashed var(--user-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Click to select profile photo"
                >
                  {customAvatarUrl ? (
                    <AvatarImage avatar={customAvatarUrl} alt="Uploaded Avatar" fallbackEmoji="📷" />
                  ) : (
                    <span style={{ fontSize: '1.8rem' }}>📷</span>
                  )}
                </div>



                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-user-primary"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      disabled={isUploadingPhoto}
                      style={{ width: 'auto', padding: '8px 18px', fontSize: '0.85rem' }}
                    >
                      {isUploadingPhoto ? uploadProgress || 'Uploading...' : 'Upload Custom Photo'}
                    </button>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--user-text-muted)', marginTop: 8 }}>
                    Supported formats: JPEG, PNG, WebP, GIF (Max 2 MB). Single image upload.
                  </div>
                  {photoError && (
                    <div className="edit-field-error" style={{ marginTop: 6 }}>
                      {photoError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--user-text-muted)', marginBottom: 12 }}>
              Or choose a preset emoji avatar:
            </div>

            <div className="edit-avatar-picker-grid">
              {MOCK_AVATARS.map(avatar => {
                const isSelected = avatar.id === avatarId;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => {
                      setAvatarId(avatar.id);
                      setPhotoError('');
                    }}
                    className={`edit-avatar-card ${isSelected ? 'selected' : ''}`}
                    style={{ background: avatar.bg }}
                    title={avatar.label}
                  >
                    <span className="edit-avatar-emoji">{avatar.emoji}</span>
                    <span className="edit-avatar-name">{avatar.label}</span>
                    {isSelected && (
                      <span className="edit-avatar-check-badge">
                        <IconCheck size={12} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ════ SECTION 2: BASIC IDENTITY ═══════════════════════════ */}
          <section className="edit-profile-section-card">
            <div className="edit-section-header">
              <span className="edit-section-icon">👤</span>
              <div>
                <h2 className="edit-section-title">Display Name &amp; Username</h2>
                <p className="edit-section-desc">How you appear to other members and in voice lounges.</p>
              </div>
            </div>

            <div className="edit-fields-row">
              {/* Display Name */}
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ color: 'var(--user-text)' }}>
                  Display Name <span style={{ color: 'var(--user-primary)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    background: 'var(--user-bg-secondary)',
                    color: 'var(--user-text)',
                    borderColor: errors.fullName ? 'var(--user-status-error)' : 'var(--user-border)'
                  }}
                />
                {errors.fullName ? (
                  <span className="edit-field-error">{errors.fullName}</span>
                ) : (
                  <span className="edit-field-hint">Your friendly name displayed to friends.</span>
                )}
              </div>

              {/* Username */}
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ color: 'var(--user-text)' }}>
                  Username Handle <span style={{ color: 'var(--user-primary)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--user-text-muted)',
                    fontWeight: 600
                  }}>
                    @
                  </span>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="alex_vibes"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    style={{
                      paddingLeft: 28,
                      background: 'var(--user-bg-secondary)',
                      color: 'var(--user-text)',
                      borderColor: errors.username ? 'var(--user-status-error)' : 'var(--user-border)'
                    }}
                  />
                </div>
                {errors.username ? (
                  <span className="edit-field-error">{errors.username}</span>
                ) : (
                  <span className="edit-field-hint">Unique handle for mentions and direct connection.</span>
                )}
              </div>
            </div>

            {/* Bio / About Me */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label className="form-label" style={{ color: 'var(--user-text)', margin: 0 }}>
                  About Me / Bio
                </label>
                <span style={{
                  fontSize: '0.76rem',
                  color: bio.length > 160 ? 'var(--user-status-error)' : 'var(--user-text-muted)'
                }}>
                  {bio.length} / 160
                </span>
              </div>
              <textarea
                rows={3}
                className="input-control"
                placeholder="Share your audio vibe, interests, and what you enjoy discussing late at night..."
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                style={{
                  background: 'var(--user-bg-secondary)',
                  color: 'var(--user-text)',
                  borderColor: errors.bio ? 'var(--user-status-error)' : 'var(--user-border)',
                  resize: 'none'
                }}
              />
              {errors.bio && <span className="edit-field-error">{errors.bio}</span>}
            </div>

            <div className="edit-fields-row" style={{ marginTop: 14 }}>
              {/* Location */}
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ color: 'var(--user-text)' }}>
                  Location / City
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. San Francisco, CA / Online"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{
                    background: 'var(--user-bg-secondary)',
                    color: 'var(--user-text)',
                    borderColor: 'var(--user-border)'
                  }}
                />
              </div>

              {/* Conversation Style */}
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ color: 'var(--user-text)' }}>
                  Conversation Style
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Casual chill & deep talks"
                  value={conversationStyle}
                  onChange={(e) => setConversationStyle(e.target.value)}
                  style={{
                    background: 'var(--user-bg-secondary)',
                    color: 'var(--user-text)',
                    borderColor: 'var(--user-border)'
                  }}
                />
              </div>
            </div>

            {/* Preferred Active Times */}
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label" style={{ color: 'var(--user-text)' }}>
                Preferred Active Times
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. Late Nights & Evenings (PST)"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                style={{
                  background: 'var(--user-bg-secondary)',
                  color: 'var(--user-text)',
                  borderColor: 'var(--user-border)'
                }}
              />
            </div>
          </section>

          {/* ════ SECTION 3: VOICE AVAILABILITY & STATUS ═══════════════ */}
          <section className="edit-profile-section-card">
            <div className="edit-section-header">
              <span className="edit-section-icon">🎙️</span>
              <div>
                <h2 className="edit-section-title">Voice Availability Status</h2>
                <p className="edit-section-desc">Set your current availability for 1-to-1 voice calls and invites.</p>
              </div>
            </div>

            <div className="edit-status-options-grid">
              {STATUS_OPTIONS.map(status => {
                const isSelected = status.id === voiceStatus;
                return (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => setVoiceStatus(status.id)}
                    className={`edit-status-card ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="edit-status-card-top">
                      <span className="edit-status-icon" style={{ color: status.color }}>
                        {status.icon}
                      </span>
                      <strong className="edit-status-label">{status.label}</strong>
                      {isSelected && (
                        <span className="edit-status-check">
                          <IconCheck size={14} />
                        </span>
                      )}
                    </div>
                    <p className="edit-status-desc">{status.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ════ SECTION 4: SPOKEN LANGUAGES ══════════════════════════ */}
          <section className="edit-profile-section-card">
            <div className="edit-section-header">
              <span className="edit-section-icon">🗣️</span>
              <div>
                <h2 className="edit-section-title">Languages Spoken</h2>
                <p className="edit-section-desc">Select languages you feel comfortable speaking in voice chat.</p>
              </div>
            </div>

            <div className="edit-language-chips-grid">
              {LANGUAGE_OPTIONS.map(lang => {
                const isSelected = languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleToggleLanguage(lang)}
                    className={`edit-lang-pill ${isSelected ? 'selected' : ''}`}
                  >
                    <span>{lang}</span>
                    {isSelected && <IconCheck size={12} style={{ marginLeft: 6 }} />}
                  </button>
                );
              })}
            </div>
            {errors.languages && <span className="edit-field-error">{errors.languages}</span>}
          </section>

          {/* ════ SECTION 5: CONVERSATION TOPICS / INTERESTS ════════════ */}
          <section className="edit-profile-section-card">
            <div className="edit-section-header">
              <span className="edit-section-icon">🏷️</span>
              <div>
                <h2 className="edit-section-title">Conversation Topics &amp; Passions</h2>
                <p className="edit-section-desc">
                  Pick topics you love chatting about. These drive topic resonance scores with new friends.
                </p>
              </div>
            </div>

            <InterestPicker
              selectedTagIds={selectedTagIds}
              onToggleTag={handleToggleTag}
              minRequired={2}
            />
            {errors.interests && <span className="edit-field-error">{errors.interests}</span>}
          </section>

          {/* ════ SECTION 6: VOICE INTRO PROMPT PREVIEW ═════════════════ */}
          <section className="edit-profile-section-card">
            <div className="edit-section-header">
              <span className="edit-section-icon">📻</span>
              <div>
                <h2 className="edit-section-title">Voice Bio Snippet</h2>
                <p className="edit-section-desc">
                  Your audio preview gives potential friends a warm glimpse of your microphone vibe.
                </p>
              </div>
            </div>

            <div className="edit-voice-snippet-card">
              <div className="edit-voice-snippet-left">
                <button
                  type="button"
                  onClick={() => setIsPlayingVoiceIntro(!isPlayingVoiceIntro)}
                  className={`edit-voice-play-circle ${isPlayingVoiceIntro ? 'playing' : ''}`}
                  title={isPlayingVoiceIntro ? 'Pause preview' : 'Play voice intro'}
                >
                  {isPlayingVoiceIntro ? '⏸' : '▶'}
                </button>
                <div>
                  <div className="edit-voice-prompt-title">
                    &ldquo;{voicePrompt.title}&rdquo;
                  </div>
                  <div className="edit-voice-prompt-sub">
                    {voicePrompt.description}
                  </div>
                </div>
              </div>

              <div className="edit-voice-waves-row">
                <div className={`edit-voice-wave-visualizer ${isPlayingVoiceIntro ? 'active' : ''}`}>
                  {(voicePrompt.previewWaves || [45, 80, 95, 65, 90, 100, 75, 50, 85, 70, 90, 55]).map((height, i) => (
                    <span
                      key={i}
                      className="edit-wave-bar"
                      style={{ height: isPlayingVoiceIntro ? `${height}%` : '35%' }}
                    />
                  ))}
                </div>
                <span className="edit-voice-duration">
                  {voicePrompt.duration}
                </span>
              </div>
            </div>
          </section>

          {/* ════ BOTTOM ACTION BAR ═════════════════════════════════════ */}
          <div className="edit-profile-action-bar">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="btn-user-secondary"
              style={{ width: 'auto', padding: '12px 24px', fontSize: '0.92rem' }}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-user-primary"
              disabled={isSaving}
              style={{ width: 'auto', padding: '12px 32px', fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <IconCheck size={18} />
              <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>

        </form>

      </div>
    </UserLayout>
  );
}
