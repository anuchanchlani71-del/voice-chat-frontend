import React, { useState, useMemo } from 'react';
import { Link } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import Modal from '../../components/common/Modal';
import {
  IconSearch,
  IconMic,
  IconUsers,
  IconMessageSquare,
  IconSliders,
  IconShieldAlert,
  IconChevronDown,
  IconChevronRight,
  IconCheck,
  IconAlertTriangle,
  IconFileText,
  IconScale,
  IconGlobe,
  IconLock,
  IconX
} from '../../components/common/Icons';

// Comprehensive Help & Support FAQ Knowledge Base
const FAQ_ITEMS = [
  // ── Voice Chat ──
  {
    id: 'vc-1',
    category: 'voice',
    categoryLabel: 'Voice Chat',
    categoryIcon: '🎙️',
    question: 'How do I start a voice chat with a friend?',
    answer: 'Navigate to Friends from the header, find the friend you wish to call, and click the "Voice Call" button on their card. Both users must be mutual friends and currently online with their voice status set to Available.'
  },
  {
    id: 'vc-2',
    category: 'voice',
    categoryLabel: 'Voice Chat',
    categoryIcon: '🎙️',
    question: "Why can't I start a voice chat?",
    answer: "Voice chats require mutual friendship. You cannot directly call users who haven't accepted your friend request. Additionally, check if your friend's status is set to 'Away' or 'In Room', or if either of you has mutual voice calling restricted in Safety & Privacy."
  },
  {
    id: 'vc-3',
    category: 'voice',
    categoryLabel: 'Voice Chat',
    categoryIcon: '🎙️',
    question: 'How do I mute myself?',
    answer: 'During an active 1-to-1 voice chat or inside a Group Voice Room, click the microphone button on the in-call control bar at the bottom of the screen. A crossed-out icon and red mute indicator will visually confirm your mic is muted.'
  },

  // ── Friends & Requests ──
  {
    id: 'fr-1',
    category: 'friends',
    categoryLabel: 'Friends & Requests',
    categoryIcon: '👥',
    question: 'How do I send a friend request?',
    answer: 'Visit the Discover page or any member’s profile and click the "Connect" button. Once sent, the button updates to "Request Sent". You can also send a friendly wave 👋 to initiate an informal greeting.'
  },
  {
    id: 'fr-2',
    category: 'friends',
    categoryLabel: 'Friends & Requests',
    categoryIcon: '👥',
    question: 'Where can I manage friend requests?',
    answer: 'Go to Friends in the navigation bar and select the "Requests" tab (or click the pending badge in the header). From there, you can accept or decline incoming requests, as well as view or cancel outgoing requests you sent.'
  },
  {
    id: 'fr-3',
    category: 'friends',
    categoryLabel: 'Friends & Requests',
    categoryIcon: '👥',
    question: 'How do I remove or block someone?',
    answer: 'To remove a friend, visit your Friends list, click the options menu on their card, and choose "Remove Friend". To completely block someone and prevent them from contacting you, visit Safety & Privacy or select "Block User" directly from their profile.'
  },

  // ── Messages ──
  {
    id: 'msg-1',
    category: 'messages',
    categoryLabel: 'Messages',
    categoryIcon: '💬',
    question: 'How do I send a message?',
    answer: 'Click the Messages icon in the top header, select an existing conversation or click "New Message", type your message into the text input, and press Enter or the send arrow.'
  },
  {
    id: 'msg-2',
    category: 'messages',
    categoryLabel: 'Messages',
    categoryIcon: '💬',
    question: 'Where can I find my conversations?',
    answer: 'All direct messaging threads are consolidated in the Messages screen (/messages). You can search conversations by friend name, view unread badges, and see last active timestamps.'
  },

  // ── Group Voice Rooms ──
  {
    id: 'room-1',
    category: 'rooms',
    categoryLabel: 'Group Voice Rooms',
    categoryIcon: '🏠',
    question: 'How do I join a room?',
    answer: 'Click "Rooms" in the header to open the Rooms Lounge (/rooms). Browse the live active voice lounges, filter by topic or access level, and click "Enter Stage" or "Listen In" to join the audio space.'
  },
  {
    id: 'room-2',
    category: 'rooms',
    categoryLabel: 'Group Voice Rooms',
    categoryIcon: '🏠',
    question: 'How do I create a room?',
    answer: 'In the Rooms Lounge (/rooms), click the "+ Create Room" button in the upper right. Choose a room title, select a conversation topic hub, set an access type (Public or Friends Only), and click "Launch Room Stage".'
  },
  {
    id: 'room-3',
    category: 'rooms',
    categoryLabel: 'Group Voice Rooms',
    categoryIcon: '🏠',
    question: 'What is the difference between an open and invite-only room?',
    answer: 'Open / Public stages allow any logged-in community member to listen in and request speaking turns. Friends-Only or Invite-Only rooms restrict stage access exclusively to users connected with the host.'
  },

  // ── Notifications ──
  {
    id: 'notif-1',
    category: 'notifications',
    categoryLabel: 'Notifications',
    categoryIcon: '🔔',
    question: 'What notifications will I receive?',
    answer: 'You receive instant alerts for incoming friend requests, friend acceptance updates, incoming 1-to-1 voice calls, live stage invites from friends, and essential community safety notices.'
  },
  {
    id: 'notif-2',
    category: 'notifications',
    categoryLabel: 'Notifications',
    categoryIcon: '🔔',
    question: 'Where do I find my notification history?',
    answer: 'Click the Bell icon in the header or navigate to /notifications. You can filter alerts by category (All, Voice Calls, Friend Requests, Stages, Safety) and mark items as read.'
  },

  // ── Safety & Privacy ──
  {
    id: 'safety-1',
    category: 'safety',
    categoryLabel: 'Safety & Privacy',
    categoryIcon: '🛡️',
    question: 'How do I report someone?',
    answer: 'You can report an account by going to Safety & Privacy (/safety-privacy) and clicking "Report User", or by opening the user\'s profile and selecting "Report Profile". Our moderation queue reviews reports within minutes.'
  },
  {
    id: 'safety-2',
    category: 'safety',
    categoryLabel: 'Safety & Privacy',
    categoryIcon: '🛡️',
    question: 'How do I block a user?',
    answer: 'Visit Safety & Privacy (/safety-privacy) and click "Block a User", or click "Block" from any user\'s profile card. Blocked users cannot see your online status, send you friend requests, call you, or message you.'
  },
  {
    id: 'safety-3',
    category: 'safety',
    categoryLabel: 'Safety & Privacy',
    categoryIcon: '🛡️',
    question: 'Where are my privacy settings?',
    answer: 'Privacy controls are located in Safety & Privacy (/safety-privacy). You can toggle profile visibility, restrict 1-to-1 call permissions to mutual friends only, and manage who can invite you to voice spaces.'
  },

  // ── Account & Settings ──
  {
    id: 'account-1',
    category: 'account',
    categoryLabel: 'Account & Settings',
    categoryIcon: '⚙️',
    question: 'Where can I change my profile or settings?',
    answer: 'Click on your avatar in the header to visit your Profile (/profile) where you can edit your bio, avatar, and interests. For audio preferences, notification settings, and password management, visit Settings (/settings).'
  },
  {
    id: 'account-2',
    category: 'account',
    categoryLabel: 'Account & Settings',
    categoryIcon: '⚙️',
    question: 'How do I manage notification preferences?',
    answer: 'Go to Settings (/settings) and scroll down to the "Notification Preferences" section. You can toggle audio chimes, in-app toast banners, call rings, and email digest updates.'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Questions', icon: '✨' },
  { id: 'voice', label: 'Voice Chat', icon: '🎙️' },
  { id: 'friends', label: 'Friends & Requests', icon: '👥' },
  { id: 'messages', label: 'Messages', icon: '💬' },
  { id: 'rooms', label: 'Group Voice Rooms', icon: '🏠' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'safety', label: 'Safety & Privacy', icon: '🛡️' },
  { id: 'account', label: 'Account & Settings', icon: '⚙️' }
];

export default function UserHelpSupport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFaqIds, setExpandedFaqIds] = useState(['vc-1']); // First item open by default

  // Support Form Modal State
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportCategory, setSupportCategory] = useState('Technical Problem');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportErrors, setSupportErrors] = useState({});
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Legal / Information Modal State
  const [legalModalType, setLegalModalType] = useState(null); // 'privacy' | 'terms' | 'about'

  // Toggle FAQ item accordion expansion
  const handleToggleFaq = (id) => {
    setExpandedFaqIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Open Contact Support modal with optional preselected category
  const handleOpenSupportModal = (category = 'Technical Problem') => {
    setSupportCategory(category);
    setSupportSubject('');
    setSupportMessage('');
    setSupportErrors({});
    setSupportSuccess(false);
    setIsSupportModalOpen(true);
  };

  // Submit Support Form (Mock validation & confirmation)
  const handleSubmitSupport = (e) => {
    e.preventDefault();
    const errors = {};

    if (!supportSubject.trim()) {
      errors.subject = 'Please enter a subject.';
    } else if (supportSubject.trim().length < 4) {
      errors.subject = 'Subject must be at least 4 characters.';
    }

    if (!supportMessage.trim()) {
      errors.message = 'Please provide details about your issue or question.';
    } else if (supportMessage.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setSupportErrors(errors);
      return;
    }

    setSupportErrors({});
    setSupportSuccess(true);
  };

  // Filtered FAQ items based on selected category and search query
  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Local search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuestion = item.question.toLowerCase().includes(query);
        const matchesAnswer = item.answer.toLowerCase().includes(query);
        const matchesCategory = item.categoryLabel.toLowerCase().includes(query);
        return matchesQuestion || matchesAnswer || matchesCategory;
      }

      return true;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <UserLayout>
      <div className="help-support-container">

        {/* ── Breadcrumb & Profile Shortcut ───────────────────────────── */}
        <div className="help-top-nav">
          <Link to="/profile" className="help-back-link">
            <span>&larr;</span>
            <span>Back to My Profile</span>
          </Link>
          <div className="help-top-badges">
            <span className="help-badge-pill">
              <span className="help-badge-dot" />
              <span>Voice Support Online</span>
            </span>
          </div>
        </div>

        {/* ── 1. Hero Header & Local Search Field ──────────────────────── */}
        <section className="help-hero-banner">
          <div className="help-hero-badge">
            <span style={{ fontSize: 16 }}>🎧</span>
            <span>Help Center &amp; Community Support</span>
          </div>

          <h1 className="help-hero-title">
            How can we <span className="text-brand-gradient">help?</span>
          </h1>

          <p className="help-hero-subtitle">
            Find answers about Voice Chat &amp; Friends, troubleshoot audio connections, or get in touch with our team.
          </p>

          {/* Local Search Input */}
          <div className="help-search-box">
            <span className="help-search-icon">
              <IconSearch size={18} />
            </span>
            <input
              type="text"
              placeholder="Search help articles, questions, voice troubleshooting..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="help-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="help-search-clear"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </section>

        {/* ── 2. Quick Help Categories ─────────────────────────────────── */}
        <section className="help-categories-section">
          <div className="help-categories-header">
            <h2 className="help-section-title">Browse by Category</h2>
            <span className="help-count-meta">
              Showing {filteredFaqs.length} {filteredFaqs.length === 1 ? 'article' : 'articles'}
            </span>
          </div>

          <div className="help-category-pills">
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`help-category-btn ${isSelected ? 'active' : ''}`}
                >
                  <span className="help-cat-icon">{cat.icon}</span>
                  <span className="help-cat-label">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 3. Frequently Asked Questions (Expandable Accordion) ─────── */}
        <section className="help-faq-section">
          <div className="help-section-header">
            <div>
              <h2 className="help-section-title">Frequently Asked Questions</h2>
              <p className="help-section-sub">
                Click any question to view instructions and recommended platform best practices.
              </p>
            </div>
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="help-reset-filter-btn"
              >
                View all categories &rarr;
              </button>
            )}
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="help-empty-search">
              <div className="help-empty-icon">🔍</div>
              <h3 className="help-empty-title">No matching help articles found</h3>
              <p className="help-empty-sub">
                Try searching with different keywords, or check another category.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="btn-user-secondary"
                  style={{ width: 'auto', padding: '8px 18px', fontSize: '0.86rem' }}
                >
                  Reset Search
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenSupportModal('Technical Problem')}
                  className="btn-user-primary"
                  style={{ width: 'auto', padding: '8px 20px', fontSize: '0.86rem' }}
                >
                  Contact Support
                </button>
              </div>
            </div>
          ) : (
            <div className="help-faq-list">
              {filteredFaqs.map(item => {
                const isExpanded = expandedFaqIds.includes(item.id);
                return (
                  <div key={item.id} className={`help-faq-card ${isExpanded ? 'expanded' : ''}`}>
                    <button
                      type="button"
                      onClick={() => handleToggleFaq(item.id)}
                      className="help-faq-question-btn"
                      aria-expanded={isExpanded}
                    >
                      <div className="help-faq-question-wrap">
                        <span className="help-faq-cat-badge">
                          {item.categoryIcon} {item.categoryLabel}
                        </span>
                        <h3 className="help-faq-question-text">{item.question}</h3>
                      </div>
                      <span className={`help-faq-toggle-icon ${isExpanded ? 'open' : ''}`}>
                        <IconChevronDown size={18} />
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="help-faq-answer-block">
                        <p className="help-faq-answer-text">{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 4. Contact Support & Technical Report Action Cards ───────── */}
        <section className="help-action-cards-grid">
          {/* Card A: Contact Support */}
          <div className="help-action-card primary">
            <div className="help-card-icon-wrap">
              <IconMessageSquare size={24} />
            </div>
            <div className="help-card-content">
              <h3 className="help-card-title">Need Personalized Assistance?</h3>
              <p className="help-card-desc">
                Send a message directly to our community support desk. We assist with account inquiries, voice audio quality, and room moderation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenSupportModal('Account Help')}
              className="btn-user-primary"
              style={{ width: 'auto', padding: '10px 22px', fontSize: '0.88rem' }}
            >
              Contact Support
            </button>
          </div>

          {/* Card B: Report a Technical Problem */}
          <div className="help-action-card secondary">
            <div className="help-card-icon-wrap tech">
              <IconAlertTriangle size={24} />
            </div>
            <div className="help-card-content">
              <h3 className="help-card-title">Report a Technical Problem</h3>
              <p className="help-card-desc">
                Experiencing mic static, unexpected disconnects, or visual glitches? Submit a technical diagnostics ticket.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenSupportModal('Technical Problem')}
              className="btn-user-secondary"
              style={{ width: 'auto', padding: '10px 20px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <IconSliders size={16} />
              <span>Report Problem</span>
            </button>
          </div>
        </section>

        {/* ── 5. Dedicated Safety & Privacy Notice Banner ─────────────── */}
        <section className="help-safety-banner">
          <div className="help-safety-content">
            <span className="help-safety-icon">
              <IconShieldAlert size={26} />
            </span>
            <div>
              <h3 className="help-safety-title">Looking to report or block an abusive user?</h3>
              <p className="help-safety-sub">
                Our specialized user moderation controls, block list manager, and privacy visibility preferences are managed inside the dedicated Safety &amp; Privacy Center.
              </p>
            </div>
          </div>
          <Link
            to="/safety-privacy"
            className="btn-user-primary"
            style={{ width: 'auto', padding: '10px 22px', fontSize: '0.88rem', whiteSpace: 'nowrap', textDecoration: 'none' }}
          >
            <span>Safety &amp; Privacy</span>
            <span style={{ marginLeft: 4 }}>&rarr;</span>
          </Link>
        </section>

        {/* ── 6. Legal & Product Information Links ─────────────────────── */}
        <section className="help-legal-section">
          <h3 className="help-legal-title">Legal &amp; Information</h3>
          <p className="help-legal-sub">
            Review community standards, privacy principles, and terms of service.
          </p>

          <div className="help-legal-links-row">
            <button
              type="button"
              onClick={() => setLegalModalType('privacy')}
              className="help-legal-link-btn"
            >
              <IconLock size={15} />
              <span>Privacy Policy</span>
            </button>

            <span className="help-legal-divider">&bull;</span>

            <button
              type="button"
              onClick={() => setLegalModalType('terms')}
              className="help-legal-link-btn"
            >
              <IconFileText size={15} />
              <span>Terms of Service</span>
            </button>

            <span className="help-legal-divider">&bull;</span>

            <button
              type="button"
              onClick={() => setLegalModalType('about')}
              className="help-legal-link-btn"
            >
              <IconGlobe size={15} />
              <span>About Voice Chat &amp; Friends</span>
            </button>
          </div>
        </section>

        {/* ── Modal: Contact Support Form ──────────────────────────────── */}
        <Modal
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
          title="Contact Community Support"
          size="md"
        >
          {supportSuccess ? (
            <div className="help-modal-success-view">
              <div className="help-modal-success-icon">
                <IconCheck size={32} />
              </div>
              <h3 className="help-modal-success-title">
                Your support message has been prepared.
              </h3>
              <p className="help-modal-success-desc">
                In this local demonstration environment, your message has been logged for review:
              </p>
              <div className="help-modal-summary-box">
                <div className="help-summary-row">
                  <span className="summary-label">Category:</span>
                  <span className="summary-val">{supportCategory}</span>
                </div>
                <div className="help-summary-row">
                  <span className="summary-label">Subject:</span>
                  <span className="summary-val">{supportSubject}</span>
                </div>
                <div className="help-summary-row" style={{ alignItems: 'flex-start' }}>
                  <span className="summary-label">Message:</span>
                  <span className="summary-val" style={{ maxWidth: '75%', wordBreak: 'break-word' }}>
                    {supportMessage}
                  </span>
                </div>
              </div>
              <p className="help-modal-mock-note">
                🔒 Demo notice: No external email or backend network requests were triggered.
              </p>
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="btn-user-primary"
                style={{ width: '100%', marginTop: 16 }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitSupport} className="help-support-form">
              <p className="help-form-hint">
                Please describe your issue or question. We typically respond within 24 hours.
              </p>

              {/* Category selector */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ color: 'var(--user-text)' }}>
                  Issue Category <span style={{ color: 'var(--user-primary)' }}>*</span>
                </label>
                <select
                  value={supportCategory}
                  onChange={(e) => setSupportCategory(e.target.value)}
                  className="input-control"
                  style={{
                    background: 'var(--user-bg-secondary)',
                    color: 'var(--user-text)',
                    borderColor: 'var(--user-border)'
                  }}
                >
                  <option value="Technical Problem">Technical Problem (Audio / Mic / Rooms)</option>
                  <option value="Account Help">Account Help (Profile / Onboarding / Login)</option>
                  <option value="Voice Chat Problem">Voice Chat Problem (Calls / Disconnects)</option>
                  <option value="Messaging Problem">Messaging Problem (Direct Messages)</option>
                  <option value="Group Room Problem">Group Room Problem (Stage / Hosting)</option>
                  <option value="Safety Concern">Safety Concern (Community Safety)</option>
                  <option value="Other">Other Inquiry</option>
                </select>
              </div>

              {/* Subject Input */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ color: 'var(--user-text)' }}>
                  Subject <span style={{ color: 'var(--user-primary)' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Brief summary of your question or issue"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  className="input-control"
                  style={{
                    background: 'var(--user-bg-secondary)',
                    color: 'var(--user-text)',
                    borderColor: supportErrors.subject ? 'var(--user-status-error)' : 'var(--user-border)'
                  }}
                />
                {supportErrors.subject && (
                  <span className="help-field-error">{supportErrors.subject}</span>
                )}
              </div>

              {/* Message Textarea */}
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ color: 'var(--user-text)' }}>
                  Message <span style={{ color: 'var(--user-primary)' }}>*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide any helpful details, browser info, or steps to reproduce..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  className="input-control"
                  style={{
                    background: 'var(--user-bg-secondary)',
                    color: 'var(--user-text)',
                    borderColor: supportErrors.message ? 'var(--user-status-error)' : 'var(--user-border)',
                    resize: 'vertical',
                    minHeight: 90
                  }}
                />
                {supportErrors.message && (
                  <span className="help-field-error">{supportErrors.message}</span>
                )}
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(false)}
                  className="btn-user-secondary"
                  style={{ width: 'auto', padding: '9px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-user-primary"
                  style={{ width: 'auto', padding: '9px 24px' }}
                >
                  Send Message
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* ── Modal: Legal / Information Placeholders ──────────────────── */}
        <Modal
          isOpen={legalModalType !== null}
          onClose={() => setLegalModalType(null)}
          title={
            legalModalType === 'privacy'
              ? 'Privacy Policy'
              : legalModalType === 'terms'
              ? 'Terms of Service'
              : 'About Voice Chat & Friends'
          }
          size="md"
        >
          <div className="help-legal-modal-body">
            {legalModalType === 'privacy' && (
              <div>
                <div className="help-legal-badge-strip">
                  <IconLock size={16} />
                  <span>Privacy Policy</span>
                </div>
                <p style={{ margin: '14px 0 0 0', color: 'var(--user-text-secondary)', lineHeight: 1.6 }}>
                  Privacy Policy is not available yet.
                </p>
              </div>
            )}

            {legalModalType === 'terms' && (
              <div>
                <div className="help-legal-badge-strip">
                  <IconScale size={16} />
                  <span>Terms of Service</span>
                </div>
                <p style={{ margin: '14px 0 0 0', color: 'var(--user-text-secondary)', lineHeight: 1.6 }}>
                  Terms of Service is not available yet.
                </p>
              </div>
            )}

            {legalModalType === 'about' && (
              <div>
                <div className="help-legal-badge-strip">
                  <IconGlobe size={16} />
                  <span>About Voice Chat &amp; Friends</span>
                </div>
                <p style={{ margin: '14px 0 0 0', color: 'var(--user-text-secondary)', lineHeight: 1.6 }}>
                  Voice Chat &amp; Friends is a social platform designed to help people discover shared interests, connect with friends, and communicate through voice.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setLegalModalType(null)}
              className="btn-user-secondary"
              style={{ width: '100%', marginTop: 20 }}
            >
              Close
            </button>
          </div>
        </Modal>

      </div>
    </UserLayout>
  );
}
