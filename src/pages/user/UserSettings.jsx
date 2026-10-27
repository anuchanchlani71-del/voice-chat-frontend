import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import Modal from '../../components/common/Modal';
import { MOCK_CURRENT_USER_PREVIEW, MOCK_INTEREST_CATEGORIES } from '../../data/userMockData';
import { useAuth } from '../../context/AuthContext';
import {
  IconChevronLeft,
  IconSliders,
  IconCheck,
  IconBell,
  IconMic,
  IconSparkles,
  IconShield,
  IconShieldAlert,
  IconGlobe,
  IconAlertTriangle,
  IconBan,
  IconTrash,
  IconLock
} from '../../components/common/Icons';

const STORAGE_KEY_SETTINGS = 'vcf_user_settings';
const STORAGE_KEY_BLOCKED = 'vcf_user_blocked_users';
const STORAGE_KEY_PRIVACY = 'vcf_user_privacy_settings';

// Default mock settings state
const DEFAULT_SETTINGS = {
  // Notifications
  notifyFriendRequests: true,
  notifyMessages: true,
  notifyVoiceCalls: true,
  notifyGroupRooms: true,
  notifyRoomReminders: true,

  // Voice & Audio (Mock only)
  voiceAvailability: true,
  selectedMic: 'mic-default',
  selectedSpeaker: 'spk-default',
  autoConnectStage: true,

  // Discovery Preferences
  discoverability: true,
  availableToTalk: true,
  preferredLanguage: 'English (Fluent)',
  selectedInterests: [...MOCK_CURRENT_USER_PREVIEW.interests],

  // Appearance
  compactInterface: false
};

const MOCK_MIC_DEVICES = [
  { id: 'mic-default', label: 'Default - Built-in Microphone (Realtek(R) Audio)' },
  { id: 'mic-headset', label: 'Headset Mic (Voice Friends Virtual Audio)' },
  { id: 'mic-usb', label: 'USB Condenser Microphone (Studio Pulse)' }
];

const MOCK_SPEAKER_DEVICES = [
  { id: 'spk-default', label: 'Default - Built-in Speakers / Headphones (Realtek Audio)' },
  { id: 'spk-headset', label: 'Headset Earphone (Voice Friends Virtual Audio)' },
  { id: 'spk-bluetooth', label: 'Wireless Stereo Audio Output (Bluetooth)' }
];

const LANGUAGE_OPTIONS = [
  'English (Fluent)',
  'Spanish (Español)',
  'French (Français)',
  'German (Deutsch)',
  'Japanese (日本語)',
  'Hindi (हिन्दी)'
];

export default function UserSettings() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // ── 1. Settings State (with sessionStorage sync) ─────────────────────
  const [settings, setSettings] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      // ignore
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  // ── 2. Blocked & Privacy Summary State (read-only from existing keys) ──
  const [blockedCount, setBlockedCount] = useState(1);
  const [privacySummary, setPrivacySummary] = useState('Everyone can view profile');

  useEffect(() => {
    try {
      const storedBlocked = sessionStorage.getItem(STORAGE_KEY_BLOCKED);
      if (storedBlocked) {
        const parsed = JSON.parse(storedBlocked);
        if (Array.isArray(parsed)) setBlockedCount(parsed.length);
      }
      const storedPrivacy = sessionStorage.getItem(STORAGE_KEY_PRIVACY);
      if (storedPrivacy) {
        const p = JSON.parse(storedPrivacy);
        if (p.profileVisibility === 'friends_only') {
          setPrivacySummary('Friends only can view profile');
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // ── 3. Modals State for Destructive Account Actions ──────────────────
  const [activeModal, setActiveModal] = useState(null); // 'logout' | 'deactivate' | 'delete' | null
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const handleConfirmLogout = () => {
    setActiveModal(null);
    logout();
    navigate('/login', { replace: true });
  };

  const handleConfirmDeactivate = () => {
    setActiveModal(null);
    setActionSuccessMsg('Your account has been temporarily deactivated.');
    setTimeout(() => {
      setActionSuccessMsg('');
    }, 3500);
  };

  const handleConfirmDelete = () => {
    setActiveModal(null);
    setActionSuccessMsg('Account scheduled for deletion.');
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  // Toggle interest tags in local state
  const handleToggleInterest = (topic) => {
    const current = settings.selectedInterests;
    let next;
    if (current.includes(topic)) {
      next = current.filter(t => t !== topic);
    } else {
      next = [...current, topic];
    }
    updateSetting('selectedInterests', next);
  };

  return (
    <UserLayout>
      <div className="profile-page-container">

        {/* ── Top Navigation Bar ───────────────────────────────────────── */}
        <div className="profile-top-bar">
          <Link to="/profile" className="profile-back-link">
            <IconChevronLeft size={16} />
            <span>Back to Profile</span>
          </Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="profile-badge-public">
              ⚙️ Account Settings
            </span>
          </div>
        </div>

        {/* ── Screen Header Block ─────────────────────────────────────── */}
        <div className="requests-header-block" style={{ marginBottom: 28 }}>
          <div className="requests-header-content">
            <div className="requests-header-pill">
              <IconSliders size={14} />
              <span>User Preferences</span>
            </div>
            <h1 className="requests-header-title">Settings</h1>
            <p className="requests-header-sub">
              Manage your account identity, audio preferences, notifications, and discovery controls.
            </p>
          </div>

          {savedFeedback && (
            <div className="privacy-saved-chip">
              <IconCheck size={14} />
              <span>Preferences saved locally</span>
            </div>
          )}
        </div>

        {/* Global Action Message Banner */}
        {actionSuccessMsg && (
          <div className="settings-alert-banner">
            <IconCheck size={16} />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1: ACCOUNT
           ═══════════════════════════════════════════════════════════════ */}
        <section className="safety-section-block">
          <div className="safety-section-header">
            <h2 className="safety-section-title">Account</h2>
            <p className="safety-section-subtitle">
              Your personal profile identity and current account status.
            </p>
          </div>

          <div className="settings-account-card">
            <div className="settings-account-left">
              <div
                className="settings-account-avatar"
                style={{ background: MOCK_CURRENT_USER_PREVIEW.avatarBg }}
              >
                {MOCK_CURRENT_USER_PREVIEW.avatar}
              </div>
              <div className="settings-account-details">
                <div className="settings-account-name-row">
                  <h3 className="settings-account-name">{MOCK_CURRENT_USER_PREVIEW.fullName}</h3>
                  <span className="settings-status-chip active">
                    ● Account Active
                  </span>
                </div>
                <div className="settings-account-meta">
                  <span>@{MOCK_CURRENT_USER_PREVIEW.username}</span>
                  <span>&bull;</span>
                  <span>{MOCK_CURRENT_USER_PREVIEW.email}</span>
                </div>
              </div>
            </div>

            <Link
              to="/profile/edit"
              className="btn-user-secondary"
              style={{ width: 'auto', flexShrink: 0, padding: '9px 18px', fontSize: '0.86rem', textDecoration: 'none' }}
            >
              <span>✏️ Edit Profile</span>
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2: NOTIFICATIONS
           ═══════════════════════════════════════════════════════════════ */}
        <section className="safety-section-block">
          <div className="safety-section-header">
            <h2 className="safety-section-title">Notifications</h2>
            <p className="safety-section-subtitle">
              Choose which in-app alerts and notifications you want to receive.
            </p>
          </div>

          <div className="safety-controls-grid">

            {/* Friend Requests */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Friend Requests</span>
                <span className="safety-control-desc">
                  Notify when other voice chat members send you connection invites.
                </span>
              </div>
              <div className="safety-toggle-wrap">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.notifyFriendRequests}
                  onClick={() => updateSetting('notifyFriendRequests', !settings.notifyFriendRequests)}
                  className={`safety-switch-btn ${settings.notifyFriendRequests ? 'on' : 'off'}`}
                >
                  <span className="safety-switch-handle" />
                </button>
                <span className="safety-toggle-text">
                  {settings.notifyFriendRequests ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Direct Messages</span>
                <span className="safety-control-desc">
                  Alert you when friends send new direct messages or reply in conversations.
                </span>
              </div>
              <div className="safety-toggle-wrap">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.notifyMessages}
                  onClick={() => updateSetting('notifyMessages', !settings.notifyMessages)}
                  className={`safety-switch-btn ${settings.notifyMessages ? 'on' : 'off'}`}
                >
                  <span className="safety-switch-handle" />
                </button>
                <span className="safety-toggle-text">
                  {settings.notifyMessages ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Voice Calls */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Voice Calls</span>
                <span className="safety-control-desc">
                  Ring and notify you for incoming 1-to-1 voice chat requests.
                </span>
              </div>
              <div className="safety-toggle-wrap">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.notifyVoiceCalls}
                  onClick={() => updateSetting('notifyVoiceCalls', !settings.notifyVoiceCalls)}
                  className={`safety-switch-btn ${settings.notifyVoiceCalls ? 'on' : 'off'}`}
                >
                  <span className="safety-switch-handle" />
                </button>
                <span className="safety-toggle-text">
                  {settings.notifyVoiceCalls ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Group Voice Rooms */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Group Voice Rooms</span>
                <span className="safety-control-desc">
                  Notify when friends invite you to join active audio stages and group lounges.
                </span>
              </div>
              <div className="safety-toggle-wrap">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.notifyGroupRooms}
                  onClick={() => updateSetting('notifyGroupRooms', !settings.notifyGroupRooms)}
                  className={`safety-switch-btn ${settings.notifyGroupRooms ? 'on' : 'off'}`}
                >
                  <span className="safety-switch-handle" />
                </button>
                <span className="safety-toggle-text">
                  {settings.notifyGroupRooms ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Room Reminders */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Room Reminders</span>
                <span className="safety-control-desc">
                  Receive alerts when scheduled topics and community voice lounges go live.
                </span>
              </div>
              <div className="safety-toggle-wrap">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.notifyRoomReminders}
                  onClick={() => updateSetting('notifyRoomReminders', !settings.notifyRoomReminders)}
                  className={`safety-switch-btn ${settings.notifyRoomReminders ? 'on' : 'off'}`}
                >
                  <span className="safety-switch-handle" />
                </button>
                <span className="safety-toggle-text">
                  {settings.notifyRoomReminders ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3: VOICE & AUDIO (Mock UI only)
           ═══════════════════════════════════════════════════════════════ */}
        <section className="safety-section-block">
          <div className="safety-section-header">
            <h2 className="safety-section-title">Voice &amp; Audio</h2>
            <p className="safety-section-subtitle">
              Manage your preferred audio input and output settings for voice chats.
            </p>
          </div>

          <div className="safety-controls-grid">

            {/* Voice Availability Toggle */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Available for Voice Chat</span>
                <span className="safety-control-desc">
                  Displays the active status ring around your avatar when you are free to talk.
                </span>
              </div>
              <div className="safety-toggle-wrap">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.voiceAvailability}
                  onClick={() => updateSetting('voiceAvailability', !settings.voiceAvailability)}
                  className={`safety-switch-btn ${settings.voiceAvailability ? 'on' : 'off'}`}
                >
                  <span className="safety-switch-handle" />
                </button>
                <span className="safety-toggle-text">
                  {settings.voiceAvailability ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Microphone Preference Selector */}
            <div className="safety-control-card" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 10 }}>
              <div className="safety-control-info">
                <span className="safety-control-label">Microphone Input Device</span>
                <span className="safety-control-desc">
                  Select your primary audio capture device for lounges and calls.
                </span>
              </div>
              <select
                value={settings.selectedMic}
                onChange={(e) => updateSetting('selectedMic', e.target.value)}
                className="safety-form-select"
                style={{ maxWidth: 440 }}
              >
                {MOCK_MIC_DEVICES.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Speaker Preference Selector */}
            <div className="safety-control-card" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 10 }}>
              <div className="safety-control-info">
                <span className="safety-control-label">Speaker Output Device</span>
                <span className="safety-control-desc">
                  Select your playback destination for stage audio and conversations.
                </span>
              </div>
              <select
                value={settings.selectedSpeaker}
                onChange={(e) => updateSetting('selectedSpeaker', e.target.value)}
                className="safety-form-select"
                style={{ maxWidth: 440 }}
              >
                {MOCK_SPEAKER_DEVICES.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-connect Behavior Toggle */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Auto-connect to Stage</span>
                <span className="safety-control-desc">
                  Automatically connect your audio stream when invited or joining an open room.
                </span>
              </div>
              <div className="safety-toggle-wrap">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.autoConnectStage}
                  onClick={() => updateSetting('autoConnectStage', !settings.autoConnectStage)}
                  className={`safety-switch-btn ${settings.autoConnectStage ? 'on' : 'off'}`}
                >
                  <span className="safety-switch-handle" />
                </button>
                <span className="safety-toggle-text">
                  {settings.autoConnectStage ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4: DISCOVERY PREFERENCES
           ═══════════════════════════════════════════════════════════════ */}
        <section className="safety-section-block">
          <div className="safety-section-header">
            <h2 className="safety-section-title">Discovery Preferences</h2>
            <p className="safety-section-subtitle">
              Control how new friends discover and match with you in the Discover lounge.
            </p>
          </div>

          <div className="safety-controls-grid">

            {/* Discoverability */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Show in Discover Lounge</span>
                <span className="safety-control-desc">
                  Allow other community members to find your profile card on the Discover page.
                </span>
              </div>
              <div className="safety-toggle-wrap">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.discoverability}
                  onClick={() => updateSetting('discoverability', !settings.discoverability)}
                  className={`safety-switch-btn ${settings.discoverability ? 'on' : 'off'}`}
                >
                  <span className="safety-switch-handle" />
                </button>
                <span className="safety-toggle-text">
                  {settings.discoverability ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Available to Talk Highlight */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Highlight as &ldquo;Available to Talk&rdquo;</span>
                <span className="safety-control-desc">
                  Appear in the top priority section when users filter for active speakers.
                </span>
              </div>
              <div className="safety-toggle-wrap">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.availableToTalk}
                  onClick={() => updateSetting('availableToTalk', !settings.availableToTalk)}
                  className={`safety-switch-btn ${settings.availableToTalk ? 'on' : 'off'}`}
                >
                  <span className="safety-switch-handle" />
                </button>
                <span className="safety-toggle-text">
                  {settings.availableToTalk ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* Language Preference */}
            <div className="safety-control-card" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 10 }}>
              <div className="safety-control-info">
                <span className="safety-control-label">Preferred Conversation Language</span>
                <span className="safety-control-desc">
                  Used to suggest voice partners who speak the same languages.
                </span>
              </div>
              <select
                value={settings.preferredLanguage}
                onChange={(e) => updateSetting('preferredLanguage', e.target.value)}
                className="safety-form-select"
                style={{ maxWidth: 360 }}
              >
                {LANGUAGE_OPTIONS.map(lang => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred Topics */}
            <div className="safety-control-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
              <div className="safety-control-info">
                <span className="safety-control-label">Preferred Conversation Topics</span>
                <span className="safety-control-desc">
                  Topics you love to talk about late at night and in casual lounges. Click to toggle.
                </span>
              </div>
              <div className="settings-tags-cloud">
                {MOCK_CURRENT_USER_PREVIEW.interests.map(topic => {
                  const isSelected = settings.selectedInterests.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleToggleInterest(topic)}
                      className={`settings-topic-tag ${isSelected ? 'active' : ''}`}
                    >
                      <span>{isSelected ? '✓' : '+'}</span>
                      <span>{topic}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 5: PRIVACY & SAFETY (Compact summary & link)
           ═══════════════════════════════════════════════════════════════ */}
        <section className="safety-section-block">
          <div className="safety-section-header">
            <h2 className="safety-section-title">Privacy &amp; Safety</h2>
            <p className="safety-section-subtitle">
              Quick overview of your privacy settings and blocked connections.
            </p>
          </div>

          <div className="settings-safety-summary-card">
            <div className="settings-safety-summary-left">
              <div className="settings-safety-icon-wrap">
                <IconShield size={22} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.98rem', color: 'var(--user-text)' }}>
                  Community Safety &amp; Blocked List
                </h4>
                <div style={{ fontSize: '0.84rem', color: 'var(--user-text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>🔒 {privacySummary}</span>
                  <span>&bull;</span>
                  <span>🚫 {blockedCount} {blockedCount === 1 ? 'user' : 'users'} blocked</span>
                </div>
              </div>
            </div>

            <Link
              to="/safety-privacy"
              className="btn-user-secondary"
              style={{ width: 'auto', flexShrink: 0, padding: '9px 18px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <IconShieldAlert size={15} />
              <span>Manage Safety &amp; Privacy</span>
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 6: APPEARANCE
           ═══════════════════════════════════════════════════════════════ */}
        <section className="safety-section-block">
          <div className="safety-section-header">
            <h2 className="safety-section-title">Appearance</h2>
            <p className="safety-section-subtitle">
              Visual styling and layout density preferences.
            </p>
          </div>

          <div className="safety-controls-grid">

            {/* Current Theme Display */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Theme</span>
                <span className="safety-control-desc">
                  Voice Friends is designed with a dark twilight plum palette optimized for late-night audio lounges.
                </span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.05)', padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.84rem', color: 'var(--user-text)' }}>
                <span>🌙</span>
                <span style={{ fontWeight: 600 }}>Dark Twilight</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--user-primary)', marginLeft: 4 }}>Active</span>
              </div>
            </div>

            {/* Compact Interface Toggle */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Compact Interface Mode</span>
                <span className="safety-control-desc">
                  Reduce spacing in voice rooms and list rows to display more participants on screen.
                </span>
              </div>
              <div className="safety-toggle-wrap">
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.compactInterface}
                  onClick={() => updateSetting('compactInterface', !settings.compactInterface)}
                  className={`safety-switch-btn ${settings.compactInterface ? 'on' : 'off'}`}
                >
                  <span className="safety-switch-handle" />
                </button>
                <span className="safety-toggle-text">
                  {settings.compactInterface ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 7: ACCOUNT ACTIONS (Destructive Actions)
           ═══════════════════════════════════════════════════════════════ */}
        <section className="safety-section-block" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div className="safety-section-header">
            <h2 className="safety-section-title" style={{ color: '#fca5a5' }}>
              Account Actions
            </h2>
            <p className="safety-section-subtitle">
              Session management and permanent account operations.
            </p>
          </div>

          <div className="settings-danger-grid">

            {/* 1. Log Out */}
            <div className="settings-danger-card">
              <div>
                <h4 className="settings-danger-title">Log Out</h4>
                <p className="settings-danger-desc">
                  End your current session on this device. You can log back in anytime.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('logout')}
                className="btn-user-secondary"
                style={{ width: 'auto', flexShrink: 0, padding: '8px 18px', fontSize: '0.86rem' }}
              >
                Log Out
              </button>
            </div>

            {/* 2. Deactivate Account */}
            <div className="settings-danger-card">
              <div>
                <h4 className="settings-danger-title">Deactivate Account</h4>
                <p className="settings-danger-desc">
                  Temporarily disable your profile and hide your presence from discover lounges.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('deactivate')}
                className="btn-settings-warning"
              >
                Deactivate
              </button>
            </div>

            {/* 3. Delete Account */}
            <div className="settings-danger-card danger">
              <div>
                <h4 className="settings-danger-title" style={{ color: '#ef4444' }}>
                  Delete Account
                </h4>
                <p className="settings-danger-desc">
                  Permanently remove your account, profile, friend connections, and chat history. This action cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('delete')}
                className="btn-settings-danger"
              >
                <IconTrash size={14} />
                <span>Delete Account</span>
              </button>
            </div>

          </div>
        </section>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 1: LOG OUT CONFIRMATION
         ═══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={activeModal === 'logout'}
        onClose={() => setActiveModal(null)}
        title="Log Out of Voice Friends"
        size="sm"
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: 'var(--user-text-secondary)', lineHeight: 1.5 }}>
            Are you sure you want to log out? You will need to sign in again to join voice lounges and chat with friends.
          </p>
          <div className="modal-actions-strip">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="btn-user-secondary"
              style={{ width: 'auto', padding: '8px 18px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="btn-user-primary"
              style={{ width: 'auto', padding: '8px 20px' }}
            >
              Confirm Log Out
            </button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 2: DEACTIVATE ACCOUNT CONFIRMATION
         ═══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={activeModal === 'deactivate'}
        onClose={() => setActiveModal(null)}
        title="Deactivate Account"
        size="sm"
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
            <span style={{ fontSize: 24 }}>⏸️</span>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '0.96rem', color: 'var(--user-text)' }}>
                Temporarily hide your profile?
              </h4>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--user-text-secondary)', lineHeight: 1.45 }}>
                Your profile will not appear in the Discover lounge, and you will appear offline. You can reactivate anytime by logging back in.
              </p>
            </div>
          </div>
          <div className="modal-actions-strip">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="btn-user-secondary"
              style={{ width: 'auto', padding: '8px 18px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeactivate}
              className="btn-settings-warning"
              style={{ padding: '8px 20px' }}
            >
              Deactivate
            </button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL 3: DELETE ACCOUNT CONFIRMATION
         ═══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={activeModal === 'delete'}
        onClose={() => setActiveModal(null)}
        title="Delete Account"
        size="sm"
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconAlertTriangle size={18} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '0.96rem', color: '#ef4444' }}>
                Permanent Account Deletion
              </h4>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--user-text-secondary)', lineHeight: 1.45 }}>
                This action is permanent. All your voice call history, friend connections, and profile data will be permanently removed.
              </p>
            </div>
          </div>
          <div className="modal-actions-strip">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="btn-user-secondary"
              style={{ width: 'auto', padding: '8px 18px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="btn-settings-danger"
              style={{ padding: '8px 20px' }}
            >
              Yes, Delete Account
            </button>
          </div>
        </div>
      </Modal>

    </UserLayout>
  );
}
