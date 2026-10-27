import React, { useState, useEffect, useMemo } from 'react';
import { Link } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import Modal from '../../components/common/Modal';
import { getDiscoverUsers } from '../../services/discoverApi';
import { useFriendRequests } from '../../context/FriendRequestContext';
import {
  getBlockedUsersApi,
  blockUserApi,
  unblockUserApi,
  reportUserApi
} from '../../services/userSafetyApi';

import {
  IconChevronLeft,
  IconShieldAlert,
  IconCheck,
  IconUsers,
  IconPhoneCall,
  IconMessageSquare,
  IconLock,
  IconBan,
  IconX
} from '../../components/common/Icons';

const STORAGE_KEY_PRIVACY = 'vcf_user_privacy_settings';

// Default privacy options
const DEFAULT_PRIVACY = {
  profileVisibility: 'everyone', // 'everyone' | 'friends_only'
  friendRequests: 'everyone',     // 'everyone' | 'shared_interests' | 'friends_of_friends'
  messages: 'friends_only',        // 'friends_only' | 'connections_only'
  voiceAvailability: true,         // true (ON) | false (OFF)
  roomInvitations: 'friends_only'  // 'friends_only' | 'anyone'
};

const REPORT_REASONS = [
  'Harassment or Bullying',
  'Spam',
  'Inappropriate Content',
  'Fake or Misleading Profile',
  'Safety Concern',
  'Other'
];

import { renderAvatar } from '../../utils/avatarUtils';


export default function UserSafetyPrivacy() {
  const { refetchAll } = useFriendRequests();

  // ── 1. Privacy Settings State ─────────────────────────────────────────
  const [privacy, setPrivacy] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_PRIVACY);
      if (stored) return { ...DEFAULT_PRIVACY, ...JSON.parse(stored) };
    } catch (e) {
      // fallback
    }
    return DEFAULT_PRIVACY;
  });

  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_PRIVACY, JSON.stringify(privacy));
    } catch (e) {
      // ignore
    }
  }, [privacy]);

  const updatePrivacyField = (field, value) => {
    setPrivacy(prev => ({ ...prev, [field]: value }));
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  // ── 2. Real Blocked Users & Discover People State ─────────────────────
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(true);
  const [blockedError, setBlockedError] = useState(null);

  const [discoverPeople, setDiscoverPeople] = useState([]);
  const [unblockingId, setUnblockingId] = useState(null);

  // Fetch real blocked users list & discover users for modal selection
  const fetchSafetyData = async () => {
    setIsLoadingBlocked(true);
    setBlockedError(null);
    try {
      const [blockedRes, discoverRes] = await Promise.all([
        getBlockedUsersApi(),
        getDiscoverUsers({ limit: 50 })
      ]);

      if (blockedRes?.blockedUsers) {
        setBlockedUsers(blockedRes.blockedUsers);
      }
      if (discoverRes?.users) {
        setDiscoverPeople(discoverRes.users);
      }
    } catch (err) {
      setBlockedError(err.message || 'Failed to load safety data.');
    } finally {
      setIsLoadingBlocked(false);
    }
  };

  useEffect(() => {
    fetchSafetyData();
  }, []);

  const handleUnblock = async (userId) => {
    setUnblockingId(userId);
    try {
      await unblockUserApi(userId);
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
      // Re-fetch discover people so unblocked user is available again
      const discRes = await getDiscoverUsers({ limit: 50 });
      if (discRes?.users) setDiscoverPeople(discRes.users);
      if (refetchAll) refetchAll();
    } catch (err) {
      alert(err.message || 'Failed to unblock user.');
    } finally {
      setUnblockingId(null);
    }
  };

  // ── 3. Block User Modal State ─────────────────────────────────────────
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [userToBlockId, setUserToBlockId] = useState('');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);
  const [blockModalError, setBlockModalError] = useState(null);

  // Available users to block (excluding already blocked users)
  const availableToBlock = useMemo(() => {
    const blockedIds = new Set(blockedUsers.map(u => u.id));
    return discoverPeople.filter(p => !blockedIds.has(p.id));
  }, [blockedUsers, discoverPeople]);

  useEffect(() => {
    if (availableToBlock.length > 0 && !userToBlockId) {
      setUserToBlockId(availableToBlock[0].id);
    }
  }, [availableToBlock, userToBlockId]);

  const handleConfirmBlock = async () => {
    if (!userToBlockId) return;
    setIsSubmittingBlock(true);
    setBlockModalError(null);
    try {
      await blockUserApi(userToBlockId, 'Blocked from Safety & Privacy settings');
      setShowBlockModal(false);
      setUserToBlockId('');
      fetchSafetyData();
      if (refetchAll) refetchAll();
    } catch (err) {
      setBlockModalError(err.message || 'Failed to block user.');
    } finally {
      setIsSubmittingBlock(false);
    }
  };


  // ── 4. Report Modal State ─────────────────────────────────────────────
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportUserId, setReportUserId] = useState('');
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportModalError, setReportModalError] = useState(null);

  const handleOpenReportModal = (preselectedUserId) => {
    const initialId = preselectedUserId || (discoverPeople[0] ? discoverPeople[0].id : '');
    setReportUserId(initialId);
    setReportReason(REPORT_REASONS[0]);
    setReportDetails('');
    setReportSubmitted(false);
    setReportModalError(null);
    setShowReportModal(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportUserId) {
      setReportModalError('Please select a valid user to report.');
      return;
    }

    setIsSubmittingReport(true);
    setReportModalError(null);

    try {
      await reportUserApi(reportUserId, reportReason, reportDetails);
      setReportSubmitted(true);
    } catch (err) {
      setReportModalError(err.message || 'Failed to submit report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportSubmitted(false);
    setReportDetails('');
    setReportModalError(null);
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
              🛡️ Account & Safety
            </span>
          </div>
        </div>

        {/* ── Screen Header Block ─────────────────────────────────────── */}
        <div className="requests-header-block" style={{ marginBottom: 28 }}>
          <div className="requests-header-content">
            <div className="requests-header-pill">
              <IconShieldAlert size={14} />
              <span>Control Center</span>
            </div>
            <h1 className="requests-header-title">Safety &amp; Privacy</h1>
            <p className="requests-header-sub">
              Control who can connect with you, message you, and interact with you.
            </p>
          </div>

          {savedFeedback && (
            <div className="privacy-saved-chip">
              <IconCheck size={14} />
              <span>Preferences saved locally</span>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1: PRIVACY CONTROLS
           ═══════════════════════════════════════════════════════════════ */}
        <section className="safety-section-block">
          <div className="safety-section-header">
            <h2 className="safety-section-title">Privacy Controls</h2>
            <p className="safety-section-subtitle">
              Manage who can discover and communicate with you across voice lounges and direct interactions.
            </p>
          </div>

          <div className="safety-controls-grid">

            {/* 1. Profile Visibility */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Who can view my profile</span>
                <span className="safety-control-desc">
                  Choose whether anyone on Discover can see your profile and voice intros.
                </span>
              </div>
              <div className="safety-segmented-controls">
                <button
                  type="button"
                  onClick={() => updatePrivacyField('profileVisibility', 'everyone')}
                  className={`safety-segmented-btn ${privacy.profileVisibility === 'everyone' ? 'active' : ''}`}
                >
                  Everyone
                </button>
                <button
                  type="button"
                  onClick={() => updatePrivacyField('profileVisibility', 'friends_only')}
                  className={`safety-segmented-btn ${privacy.profileVisibility === 'friends_only' ? 'active' : ''}`}
                >
                  Friends Only
                </button>
              </div>
            </div>

            {/* 2. Friend Requests */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Who can send me friend requests</span>
                <span className="safety-control-desc">
                  Filter who is allowed to send you incoming connection requests.
                </span>
              </div>
              <div className="safety-segmented-controls wrap">
                <button
                  type="button"
                  onClick={() => updatePrivacyField('friendRequests', 'everyone')}
                  className={`safety-segmented-btn ${privacy.friendRequests === 'everyone' ? 'active' : ''}`}
                >
                  Everyone
                </button>
                <button
                  type="button"
                  onClick={() => updatePrivacyField('friendRequests', 'shared_interests')}
                  className={`safety-segmented-btn ${privacy.friendRequests === 'shared_interests' ? 'active' : ''}`}
                >
                  Shared Interests
                </button>
                <button
                  type="button"
                  onClick={() => updatePrivacyField('friendRequests', 'friends_of_friends')}
                  className={`safety-segmented-btn ${privacy.friendRequests === 'friends_of_friends' ? 'active' : ''}`}
                >
                  Friends of Friends
                </button>
              </div>
            </div>

            {/* 3. Messages */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Who can message me</span>
                <span className="safety-control-desc">
                  Direct messages require mutual trust to ensure safe, harassment-free conversations.
                </span>
              </div>
              <div className="safety-segmented-controls">
                <button
                  type="button"
                  onClick={() => updatePrivacyField('messages', 'friends_only')}
                  className={`safety-segmented-btn ${privacy.messages === 'friends_only' ? 'active' : ''}`}
                >
                  Friends Only
                </button>
                <button
                  type="button"
                  onClick={() => updatePrivacyField('messages', 'connections_only')}
                  className={`safety-segmented-btn ${privacy.messages === 'connections_only' ? 'active' : ''}`}
                >
                  Connections Only
                </button>
              </div>
            </div>

            {/* 4. Voice Availability (Toggle ON/OFF) */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Show when I&rsquo;m available for voice chat</span>
                <span className="safety-control-desc">
                  Displays the glowing teal status ring on your avatar when you are free to talk.
                </span>
              </div>
              <div className="safety-toggle-wrap">
                <button
                  type="button"
                  role="switch"
                  aria-checked={privacy.voiceAvailability}
                  onClick={() => updatePrivacyField('voiceAvailability', !privacy.voiceAvailability)}
                  className={`safety-switch-btn ${privacy.voiceAvailability ? 'on' : 'off'}`}
                >
                  <span className="safety-switch-handle" />
                </button>
                <span className="safety-toggle-text">
                  {privacy.voiceAvailability ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* 5. Room Invitations */}
            <div className="safety-control-card">
              <div className="safety-control-info">
                <span className="safety-control-label">Who can invite me to voice rooms</span>
                <span className="safety-control-desc">
                  Control who can send you stage invitations for private and group voice lounges.
                </span>
              </div>
              <div className="safety-segmented-controls">
                <button
                  type="button"
                  onClick={() => updatePrivacyField('roomInvitations', 'friends_only')}
                  className={`safety-segmented-btn ${privacy.roomInvitations === 'friends_only' ? 'active' : ''}`}
                >
                  Friends Only
                </button>
                <button
                  type="button"
                  onClick={() => updatePrivacyField('roomInvitations', 'anyone')}
                  className={`safety-segmented-btn ${privacy.roomInvitations === 'anyone' ? 'active' : ''}`}
                >
                  Anyone
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2: SAFETY & BLOCKED USERS
           ═══════════════════════════════════════════════════════════════ */}
        <section className="safety-section-block">
          <div className="safety-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 className="safety-section-title">Blocked Users</h2>
              <p className="safety-section-subtitle">
                People you block won&rsquo;t appear in your normal connection flow.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setBlockModalError(null);
                setShowBlockModal(true);
              }}
              className="btn-user-secondary"
              style={{ width: 'auto', flexShrink: 0, padding: '8px 18px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <IconBan size={15} />
              <span>Block a User</span>
            </button>
          </div>

          {isLoadingBlocked ? (
            <div className="safety-empty-box" style={{ padding: '30px 20px' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--user-text-muted)' }}>
                Loading blocked members...
              </p>
            </div>
          ) : blockedError ? (
            <div className="safety-empty-box" style={{ padding: '24px', borderColor: 'rgba(239,68,68,0.3)' }}>
              <p style={{ color: '#ef4444', margin: '0 0 10px', fontSize: '0.88rem' }}>{blockedError}</p>
              <button
                type="button"
                onClick={fetchSafetyData}
                className="btn-user-secondary"
                style={{ padding: '6px 16px', fontSize: '0.8rem' }}
              >
                Retry
              </button>
            </div>
          ) : blockedUsers.length > 0 ? (
            <div className="blocked-users-list">
              {blockedUsers.map(user => (
                <div key={user.id} className="blocked-user-row">
                  <div className="blocked-user-left">
                    <div
                      className="blocked-user-avatar"
                      style={{ background: user.avatarBg || 'var(--user-brand-gradient)', overflow: 'hidden' }}
                    >
                      {renderAvatar(user.avatar, user.fullName)}
                    </div>
                    <div className="blocked-user-details">
                      <div className="blocked-user-name">{user.fullName}</div>
                      <div className="blocked-user-handle">
                        @{user.username} {user.blockedAt ? `• Blocked ${user.blockedAt}` : ''}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnblock(user.id)}
                    disabled={unblockingId === user.id}
                    className="btn-unblock-user"
                    title={`Unblock ${user.fullName}`}
                  >
                    {unblockingId === user.id ? 'Unblocking...' : 'Unblock'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="safety-empty-box">
              <div style={{ fontSize: 32, marginBottom: 8 }}>🛡️</div>
              <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--user-text)' }}>No blocked users</h4>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--user-text-muted)' }}>
                Users you block will appear here.
              </p>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3: REPORTING
           ═══════════════════════════════════════════════════════════════ */}
        <section className="safety-section-block">
          <div className="safety-section-header">
            <h2 className="safety-section-title">Report a User</h2>
            <p className="safety-section-subtitle">
              Help keep Voice Chat &amp; Friends safe by reporting inappropriate behavior.
            </p>
          </div>

          <div className="safety-report-card">
            <div className="safety-report-content">
              <div className="safety-report-icon-wrap">
                <IconShieldAlert size={22} />
              </div>
              <div className="safety-report-text-block">
                <h4 className="safety-report-card-title">Encountered an issue?</h4>
                <p className="safety-report-card-desc">
                  If someone is violating community guidelines, harassing members, or being disruptive, submit a report for moderation review.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenReportModal()}
              className="btn-safety-report"
            >
              Report User
            </button>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4: SAFETY INFORMATION ("STAY SAFE")
           ═══════════════════════════════════════════════════════════════ */}
        <section className="safety-section-block">
          <div className="safety-section-header">
            <h2 className="safety-section-title">Stay Safe</h2>
            <p className="safety-section-subtitle">
              Important guidelines for a comfortable and respectful voice community.
            </p>
          </div>

          <div className="safety-tips-grid">
            <div className="safety-tip-card">
              <span className="safety-tip-icon">🔒</span>
              <p className="safety-tip-text">
                <strong>Never share passwords</strong> or verification codes with anyone, including staff.
              </p>
            </div>

            <div className="safety-tip-card">
              <span className="safety-tip-icon">🛡️</span>
              <p className="safety-tip-text">
                <strong>Avoid sharing sensitive personal information</strong> like your home address, financial details, or government IDs.
              </p>
            </div>

            <div className="safety-tip-card">
              <span className="safety-tip-icon">🚫</span>
              <p className="safety-tip-text">
                <strong>Block or report users</strong> who make you uncomfortable, push unwanted boundaries, or violate guidelines.
              </p>
            </div>

            <div className="safety-tip-card">
              <span className="safety-tip-icon">🎙️</span>
              <p className="safety-tip-text">
                <strong>Meet people responsibly</strong> and use your privacy controls to manage who can call or invite you to stages.
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          REPORT USER MODAL
         ═══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showReportModal}
        onClose={handleCloseReportModal}
        title="Report a User"
        size="md"
      >
        {reportSubmitted ? (
          <div className="modal-confirmation-state">
            <div className="modal-confirmation-icon">
              <IconCheck size={28} />
            </div>
            <h3 className="modal-confirmation-title">Report submitted</h3>
            <p className="modal-confirmation-sub">
              Thanks for helping keep the community safe. Our moderation team will review this report.
            </p>
            <button
              type="button"
              onClick={handleCloseReportModal}
              className="btn-user-primary"
              style={{ padding: '10px 28px', marginTop: 12 }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitReport} className="report-modal-form">
            {reportModalError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.86rem', marginBottom: 14 }}>
                {reportModalError}
              </div>
            )}

            {/* Select User */}
            <div className="form-group-field">
              <label htmlFor="report-user-select" className="form-field-label">
                Select User
              </label>
              <select
                id="report-user-select"
                value={reportUserId}
                onChange={(e) => setReportUserId(e.target.value)}
                className="safety-form-select"
                required
              >
                {discoverPeople.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} (@{user.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Reason */}
            <div className="form-group-field">
              <label htmlFor="report-reason-select" className="form-field-label">
                Reason
              </label>
              <select
                id="report-reason-select"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="safety-form-select"
                required
              >
                {REPORT_REASONS.map(reason => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Details */}
            <div className="form-group-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label htmlFor="report-details-textarea" className="form-field-label">
                  Optional Details
                </label>
                <span style={{ fontSize: '0.74rem', color: 'var(--user-text-muted)' }}>
                  {reportDetails.length} / 500
                </span>
              </div>
              <textarea
                id="report-details-textarea"
                rows={4}
                maxLength={500}
                placeholder="Tell us what happened..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="safety-form-textarea"
              />
            </div>

            {/* Modal Actions */}
            <div className="modal-actions-strip">
              <button
                type="button"
                onClick={handleCloseReportModal}
                disabled={isSubmittingReport}
                className="btn-user-secondary"
                style={{ padding: '9px 20px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReport}
                className="btn-user-primary"
                style={{ padding: '9px 22px' }}
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════
          BLOCK USER MODAL
         ═══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        title="Block a User"
        size="sm"
      >
        <div className="block-modal-body">
          {blockModalError && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.86rem', marginBottom: 14 }}>
              {blockModalError}
            </div>
          )}

          {availableToBlock.length > 0 ? (
            <>
              <div className="form-group-field" style={{ marginBottom: 14 }}>
                <label htmlFor="block-user-select" className="form-field-label">
                  Select User to Block
                </label>
                <select
                  id="block-user-select"
                  value={userToBlockId}
                  onChange={(e) => setUserToBlockId(e.target.value)}
                  className="safety-form-select"
                >
                  {availableToBlock.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} (@{user.username})
                    </option>
                  ))}
                </select>
              </div>

              <p className="block-modal-warning">
                You won&rsquo;t see this person in your normal connection flow. Any active friendship will be removed.
              </p>

              <div className="modal-actions-strip" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  disabled={isSubmittingBlock}
                  className="btn-user-secondary"
                  style={{ padding: '8px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBlock}
                  disabled={isSubmittingBlock}
                  className="btn-block-confirm"
                  style={{ padding: '8px 20px' }}
                >
                  {isSubmittingBlock ? 'Blocking...' : 'Block User'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ color: 'var(--user-text-secondary)', fontSize: '0.88rem' }}>
                No additional available users to block.
              </p>
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                className="btn-user-secondary"
                style={{ marginTop: 12, padding: '8px 20px' }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </Modal>

    </UserLayout>
  );
}
