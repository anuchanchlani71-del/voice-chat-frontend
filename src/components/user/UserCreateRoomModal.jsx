import React, { useState, useMemo } from 'react';
import { useNavigate } from '../../router';
import { useFriendRequests } from '../../context/FriendRequestContext';
import { MOCK_CURRENT_USER_PREVIEW, MOCK_INITIAL_FRIENDS } from '../../data/userMockData';
import {
  IconX,
  IconPlus,
  IconGlobe,
  IconLock,
  IconUsers,
  IconCheck,
  IconSearch,
  IconMic,
  IconTag
} from '../common/Icons';

import { createRoomApi } from '../../services/userRoomApi';

const TOPIC_OPTIONS = [
  'Chill & Late Night Talks',
  'Music & Audio Vibes',
  'Gaming & Esports',
  'Tech, Code & AI',
  'Anime & Cinema',
  'Study & Languages'
];

import { renderAvatar } from '../../utils/avatarUtils';


export default function UserCreateRoomModal({ isOpen, onClose, onRoomCreated }) {
  const navigate = useNavigate();
  const { connectedFriends } = useFriendRequests();

  // Always ensure we have available friends for the invite picker
  const availableFriends = useMemo(() => {
    if (connectedFriends && connectedFriends.length > 0) {
      return connectedFriends;
    }
    return MOCK_INITIAL_FRIENDS;
  }, [connectedFriends]);

  // Form states
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState(TOPIC_OPTIONS[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(20);
  const [accessType, setAccessType] = useState('anyone'); // STRICT: 'anyone' | 'invite_only'
  const [invitedUserIds, setInvitedUserIds] = useState([]);
  const [friendSearch, setFriendSearch] = useState('');

  // Validation & Submission State
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [createdRoom, setCreatedRoom] = useState(null);

  if (!isOpen) return null;

  // Filter friends for Invite Only picker
  const filteredFriends = availableFriends.filter(friend => {
    if (!friendSearch.trim()) return true;
    const q = friendSearch.toLowerCase().trim();
    const nameMatch = (friend.fullName || '').toLowerCase().includes(q);
    const userMatch = (friend.username || '').toLowerCase().includes(q);
    return nameMatch || userMatch;
  });

  const toggleSelectFriend = (friendId) => {
    setInvitedUserIds(prev =>
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    );
    // Clear invite error when friend is selected
    if (errors.invited) {
      setErrors(prev => ({ ...prev, invited: null }));
    }
  };

  const handleSelectAllFriends = () => {
    if (invitedUserIds.length === availableFriends.length) {
      setInvitedUserIds([]);
    } else {
      setInvitedUserIds(availableFriends.map(f => f.id));
    }
    if (errors.invited) {
      setErrors(prev => ({ ...prev, invited: null }));
    }
  };

  const validate = () => {
    const errs = {};

    if (!title.trim()) {
      errs.title = 'Room title is required.';
    } else if (title.trim().length > 150) {
      errs.title = 'Room title cannot exceed 150 characters.';
    }

    if (isCustomTopic && !customTopic.trim()) {
      errs.topic = 'Please specify your custom topic.';
    }

    if (description.length > 1000) {
      errs.description = 'Description cannot exceed 1000 characters.';
    }

    const capNum = Number(capacity);
    if (isNaN(capNum) || capNum < 2 || capNum > 100) {
      errs.capacity = 'Capacity must be strictly between 2 and 100 seats.';
    }

    if (accessType === 'invite_only' && invitedUserIds.length === 0) {
      errs.invited = 'Please select at least one friend to invite to your private room.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const chosenTopic = isCustomTopic ? customTopic.trim() : topic;

    try {
      const res = await createRoomApi({
        title: title.trim(),
        description: description.trim(),
        topic: chosenTopic,
        capacity: Number(capacity),
        accessType,
        status: 'active',
        invitedUsers: accessType === 'invite_only' ? invitedUserIds : []
      });

      if (res && res.success && res.groupVoiceRoom) {
        setCreatedRoom(res.groupVoiceRoom);
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to create room. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (createdRoom && onRoomCreated) {
      onRoomCreated(createdRoom);
    }
    onClose();
  };

  const handleEnterStage = () => {
    if (createdRoom && onRoomCreated) {
      onRoomCreated(createdRoom);
    }
    onClose();
    if (createdRoom) {
      navigate(`/room/${createdRoom.id}`);
    }
  };

  return (
    <div className="room-modal-backdrop" onClick={onClose}>
      <div
        className="create-room-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-room-title"
      >
        {/* Header */}
        <div className="create-room-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="create-room-badge-icon">
              <IconMic size={20} />
            </span>
            <div>
              <h2 id="create-room-title" className="create-room-header-title">
                {createdRoom ? 'Room Ready!' : 'Create Group Voice Room'}
              </h2>
              <span className="create-room-header-sub">
                {createdRoom
                  ? 'Your voice lounge is now active in this browser session'
                  : 'Host an open stage or an intimate private audio space'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="room-modal-close-btn"
            onClick={onClose}
            title="Close"
            aria-label="Close modal"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* ── Success Dialog Screen (After Create) ────────────────────── */}
        {createdRoom ? (
          <div className="create-room-success-view">
            <div className="create-room-success-icon-wrap">
              <span style={{ fontSize: 36 }}>🎉</span>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
              &ldquo;{createdRoom.title}&rdquo; is Live
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--user-text-secondary)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Your new audio room has been initialized in this demo session. You are currently the host on stage.
            </p>

            {/* Room Summary Preview */}
            <div className="create-room-summary-box">
              <div className="create-room-summary-row">
                <span className="summary-label">Topic:</span>
                <span className="summary-val">
                  <IconTag size={12} style={{ marginRight: 4 }} />
                  {createdRoom.topic}
                </span>
              </div>
              <div className="create-room-summary-row">
                <span className="summary-label">Access Mode:</span>
                <span className="summary-val" style={{ textTransform: 'capitalize' }}>
                  {createdRoom.accessType === 'invite_only' ? '🔒 Invite Only' : '🌐 Open to Anyone'}
                </span>
              </div>
              <div className="create-room-summary-row">
                <span className="summary-label">Max Capacity:</span>
                <span className="summary-val">{createdRoom.capacity} seats</span>
              </div>
              {createdRoom.accessType === 'invite_only' && (
                <div className="create-room-summary-row">
                  <span className="summary-label">Invited Friends:</span>
                  <span className="summary-val">{createdRoom.invitedUsers.length} people invited</span>
                </div>
              )}
            </div>

            <div className="create-room-demo-notice">
              <span>💡 <strong>Demo Lifecycle:</strong> The room is now active in this browser session. You can enter the live audio stage directly or return to the lounge.</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button
                type="button"
                onClick={handleFinish}
                className="btn-user-secondary"
                style={{ padding: '10px 22px', fontSize: '0.9rem' }}
              >
                Go to Lounge
              </button>
              <button
                type="button"
                onClick={handleEnterStage}
                className="btn-user-primary"
                style={{ padding: '10px 24px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>Enter Room Stage</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        ) : (
          /* ── Main Create Form ────────────────────────────────────────── */
          <form onSubmit={handleSubmit} className="create-room-form">
            {submitError && (
              <div className="form-error-banner" style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                color: '#ef4444',
                fontSize: '0.84rem',
                marginBottom: 16
              }}>
                {submitError}
              </div>
            )}
            {/* 1. Room Title */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <label className="form-label" htmlFor="room-title">
                  Room Title <span style={{ color: 'var(--user-primary)' }}>*</span>
                </label>
                <span style={{ fontSize: '0.72rem', color: title.length > 150 ? 'var(--user-status-error)' : 'var(--user-text-muted)' }}>
                  {title.length} / 150
                </span>
              </div>
              <input
                id="room-title"
                type="text"
                placeholder="e.g. Late Night Lo-Fi Beats & Chill Talks"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                }}
                maxLength={150}
                className={`form-input-control ${errors.title ? 'has-error' : ''}`}
                autoFocus
              />
              {errors.title && <div className="form-error-msg">{errors.title}</div>}
            </div>

            {/* 2. Conversation Topic */}
            <div className="form-group">
              <label className="form-label" htmlFor="room-topic">
                Conversation Topic
              </label>
              {!isCustomTopic ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <select
                    id="room-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="form-select-control"
                    style={{ flex: 1 }}
                  >
                    {TOPIC_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCustomTopic(true)}
                    className="btn-user-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                  >
                    + Custom
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Enter custom topic..."
                    value={customTopic}
                    onChange={(e) => {
                      setCustomTopic(e.target.value);
                      if (errors.topic) setErrors(prev => ({ ...prev, topic: null }));
                    }}
                    className={`form-input-control ${errors.topic ? 'has-error' : ''}`}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomTopic(false);
                      setCustomTopic('');
                    }}
                    className="btn-user-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.78rem' }}
                  >
                    Preset
                  </button>
                </div>
              )}
              {errors.topic && <div className="form-error-msg">{errors.topic}</div>}
            </div>

            {/* 3. Description / Agenda */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <label className="form-label" htmlFor="room-desc">
                  Room Description &amp; Topic Agenda <span style={{ color: 'var(--user-text-muted)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <span style={{ fontSize: '0.72rem', color: description.length > 1000 ? 'var(--user-status-error)' : 'var(--user-text-muted)' }}>
                  {description.length} / 1000
                </span>
              </div>
              <textarea
                id="room-desc"
                placeholder="What should listeners and speakers discuss in this space?"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                }}
                maxLength={1000}
                rows={3}
                className={`form-textarea-control ${errors.description ? 'has-error' : ''}`}
              />
              {errors.description && <div className="form-error-msg">{errors.description}</div>}
            </div>

            {/* 4. Room Capacity Slider (STRICT: 2 to 100) */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" htmlFor="room-capacity" style={{ marginBottom: 0 }}>
                  Room Capacity
                </label>
                <span className="capacity-badge-pill">
                  <IconUsers size={13} style={{ marginRight: 4 }} />
                  <strong>{capacity}</strong> seats
                </span>
              </div>

              <div className="capacity-slider-row">
                <span className="capacity-slider-min">2</span>
                <input
                  id="room-capacity"
                  type="range"
                  min="2"
                  max="100"
                  step="1"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="capacity-range-slider"
                  aria-label="Room capacity slider from 2 to 100"
                />
                <span className="capacity-slider-max">100</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--user-text-muted)', marginTop: 4 }}>
                <span>Intimate (2–10)</span>
                <span>Community Lounge (15–30)</span>
                <span>Open Auditorium (50–100)</span>
              </div>
              {errors.capacity && <div className="form-error-msg">{errors.capacity}</div>}
            </div>

            {/* 5. Access Type (STRICT: 'anyone' vs 'invite_only') */}
            <div className="form-group">
              <label className="form-label">
                Access Type <span style={{ color: 'var(--user-primary)' }}>*</span>
              </label>

              <div className="access-toggle-cards">
                {/* Option A: Anyone */}
                <div
                  className={`access-card-option ${accessType === 'anyone' ? 'selected' : ''}`}
                  onClick={() => setAccessType('anyone')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="access-card-radio">
                    <span className={`access-radio-dot ${accessType === 'anyone' ? 'active' : ''}`} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="access-card-title-row">
                      <IconGlobe size={15} style={{ color: '#34d399' }} />
                      <span className="access-card-title">Anyone (Open Stage)</span>
                    </div>
                    <p className="access-card-desc">
                      Publicly discoverable in the Lounge. Any community member can drop in and listen.
                    </p>
                  </div>
                </div>

                {/* Option B: Invite Only */}
                <div
                  className={`access-card-option ${accessType === 'invite_only' ? 'selected' : ''}`}
                  onClick={() => setAccessType('invite_only')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="access-card-radio">
                    <span className={`access-radio-dot ${accessType === 'invite_only' ? 'active' : ''}`} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="access-card-title-row">
                      <IconLock size={15} style={{ color: '#fbbf24' }} />
                      <span className="access-card-title">Selected People (Invite Only)</span>
                    </div>
                    <p className="access-card-desc">
                      Private space. Only mutual friends selected below can view and join this room.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Invite Friends Picker (Visible ONLY when Invite Only is selected) */}
            {accessType === 'invite_only' && (
              <div className="invite-picker-container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Select Friends to Invite <span style={{ color: 'var(--user-primary)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="invite-count-badge">
                      {invitedUserIds.length} invited
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAllFriends}
                      className="btn-user-text-action"
                    >
                      {invitedUserIds.length === availableFriends.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                {/* Search Friends Filter */}
                <div className="invite-search-wrap">
                  <IconSearch size={14} className="invite-search-icon" />
                  <input
                    type="text"
                    placeholder="Search mutual friends..."
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    className="invite-search-input"
                  />
                  {friendSearch && (
                    <button
                      type="button"
                      onClick={() => setFriendSearch('')}
                      className="invite-search-clear"
                    >
                      <IconX size={12} />
                    </button>
                  )}
                </div>

                {/* Friends List Box */}
                <div className="invite-friends-list">
                  {filteredFriends.length > 0 ? (
                    filteredFriends.map(friend => {
                      const isSelected = invitedUserIds.includes(friend.id);

                      return (
                        <div
                          key={friend.id}
                          className={`invite-friend-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleSelectFriend(friend.id)}
                        >
                          <div
                            className="invite-friend-avatar"
                            style={{ background: friend.avatarBg || 'var(--user-brand-gradient)', overflow: 'hidden' }}
                          >
                            {renderAvatar(friend.avatar, friend.fullName)}
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="invite-friend-name">{friend.fullName}</div>
                            <div className="invite-friend-handle">@{friend.username}</div>
                          </div>

                          <div className={`invite-checkbox-indicator ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <IconCheck size={12} />}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--user-text-muted)' }}>
                      No friends matched your search.
                    </div>
                  )}
                </div>

                {errors.invited && <div className="form-error-msg" style={{ marginTop: 6 }}>{errors.invited}</div>}
              </div>
            )}

            {/* 7. Action Buttons */}
            <div className="create-room-footer-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn-user-secondary"
                style={{ padding: '10px 20px', fontSize: '0.88rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-user-primary"
                style={{ padding: '10px 26px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: isSubmitting ? 0.7 : 1 }}
              >
                <IconPlus size={16} />
                <span>{isSubmitting ? 'Creating Room...' : 'Create Room'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
