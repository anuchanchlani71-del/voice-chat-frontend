import React, { useState, useEffect, useMemo } from 'react';
import {
  IconFilter,
  IconSliders,
  IconX,
  IconCheck,
  IconSparkles,
  IconUsers,
  IconMic,
  IconTag
} from '../common/Icons';
import { MOCK_INTEREST_CATEGORIES } from '../../data/userMockData';

export const DEFAULT_DISCOVERY_FILTERS = {
  availability: 'all', // 'all' | 'online' | 'available'
  topics: [], // array of selected topic strings
  languages: [], // array of selected language strings
  location: 'all', // 'all' | country string
  interestMatch: 'any', // 'any' | 'some' | 'strong'
  onlyWithVoicePrompt: false,
  hideBusy: false
};

// Available languages in mock database
export const FILTER_LANGUAGE_OPTIONS = [
  'English',
  'Japanese',
  'French',
  'German',
  'Spanish',
  'Hindi',
  'Russian'
];

// Mock country/region options
export const FILTER_LOCATION_OPTIONS = [
  { id: 'all', label: 'Any Location (Worldwide)' },
  { id: 'United States', label: 'United States' },
  { id: 'United Kingdom', label: 'United Kingdom' },
  { id: 'Japan', label: 'Japan' },
  { id: 'Germany', label: 'Germany' },
  { id: 'Canada', label: 'Canada' },
  { id: 'Spain', label: 'Spain' },
  { id: 'India', label: 'India' },
  { id: 'Australia', label: 'Australia' }
];

export default function UserDiscoveryFiltersModal({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
  calculateMatchCount,
  currentUserInterests = []
}) {
  // Staging state inside modal: changes only apply when user clicks "Apply Filters"
  const [staged, setStaged] = useState(filters || DEFAULT_DISCOVERY_FILTERS);

  // Sync staged state whenever modal opens with current active filters
  useEffect(() => {
    if (isOpen) {
      setStaged(filters || DEFAULT_DISCOVERY_FILTERS);
    }
  }, [isOpen, filters]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Flatten popular topic tags from MOCK_INTEREST_CATEGORIES
  const availableTopics = useMemo(() => {
    const list = [];
    MOCK_INTEREST_CATEGORIES.forEach(cat => {
      cat.tags.forEach(tag => {
        if (!list.includes(tag.name)) {
          list.push(tag.name);
        }
      });
    });
    return list;
  }, []);

  if (!isOpen) return null;

  // Staged matching count preview
  const liveCount = typeof calculateMatchCount === 'function' ? calculateMatchCount(staged) : null;

  // Toggle topic in staged
  const handleToggleTopic = (topic) => {
    setStaged(prev => {
      const exists = prev.topics.includes(topic);
      return {
        ...prev,
        topics: exists
          ? prev.topics.filter(t => t !== topic)
          : [...prev.topics, topic]
      };
    });
  };

  // Toggle language in staged
  const handleToggleLanguage = (lang) => {
    setStaged(prev => {
      const exists = prev.languages.includes(lang);
      return {
        ...prev,
        languages: exists
          ? prev.languages.filter(l => l !== lang)
          : [...prev.languages, lang]
      };
    });
  };

  // Reset staged to default
  const handleInternalReset = () => {
    setStaged(DEFAULT_DISCOVERY_FILTERS);
  };

  // Apply staged to parent
  const handleInternalApply = () => {
    onApply(staged);
    onClose();
  };

  return (
    <div className="room-modal-backdrop" onClick={onClose}>
      <div
        className="discover-filter-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="advanced-filters-title"
      >
        {/* Modal Header */}
        <div className="discover-filter-modal-header">
          <div className="discover-filter-modal-title-wrap">
            <span className="discover-filter-badge-icon">
              <IconSliders size={18} />
            </span>
            <div>
              <h2 id="advanced-filters-title" className="discover-filter-modal-title">
                Advanced Discovery Filters
              </h2>
              <p className="discover-filter-modal-subtitle">
                Filter members by availability, passion topics, languages, and match resonance
              </p>
            </div>
          </div>
          <button
            type="button"
            className="room-modal-close-btn"
            onClick={onClose}
            title="Close filters"
            aria-label="Close"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="discover-filter-modal-body">

          {/* 1. Availability Section */}
          <div className="filter-group-block">
            <label className="filter-group-label">
              <IconUsers size={15} style={{ color: 'var(--user-primary)' }} />
              <span>Availability &amp; Voice Status</span>
            </label>
            <div className="filter-segmented-control">
              <button
                type="button"
                onClick={() => setStaged(prev => ({ ...prev, availability: 'all' }))}
                className={`filter-seg-btn ${staged.availability === 'all' ? 'active' : ''}`}
              >
                All Members
              </button>
              <button
                type="button"
                onClick={() => setStaged(prev => ({ ...prev, availability: 'online' }))}
                className={`filter-seg-btn ${staged.availability === 'online' ? 'active' : ''}`}
              >
                <span className="filter-dot-online" />
                Online Now
              </button>
              <button
                type="button"
                onClick={() => setStaged(prev => ({ ...prev, availability: 'available' }))}
                className={`filter-seg-btn ${staged.availability === 'available' ? 'active' : ''}`}
              >
                🎙️ Available to Talk
              </button>
            </div>
          </div>

          {/* 2. Conversation Topics / Interests */}
          <div className="filter-group-block">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="filter-group-label" style={{ marginBottom: 0 }}>
                <IconTag size={15} style={{ color: 'var(--user-accent-coral)' }} />
                <span>Conversation Topics ({staged.topics.length} selected)</span>
              </label>
              {staged.topics.length > 0 && (
                <button
                  type="button"
                  onClick={() => setStaged(prev => ({ ...prev, topics: [] }))}
                  className="filter-clear-sublink"
                >
                  Clear topics
                </button>
              )}
            </div>
            <p className="filter-group-hint">
              Select topics you enjoy chatting about. Members with at least one matching topic will be surfaced.
            </p>
            <div className="filter-topics-cloud">
              {availableTopics.slice(0, 18).map(topic => {
                const isSelected = staged.topics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleToggleTopic(topic)}
                    className={`filter-topic-pill ${isSelected ? 'selected' : ''}`}
                  >
                    <span>#{topic}</span>
                    {isSelected && <IconCheck size={12} style={{ marginLeft: 4 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Spoken Languages */}
          <div className="filter-group-block">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="filter-group-label" style={{ marginBottom: 0 }}>
                <span style={{ fontSize: 14 }}>🗣️</span>
                <span>Spoken Languages ({staged.languages.length} selected)</span>
              </label>
              {staged.languages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setStaged(prev => ({ ...prev, languages: [] }))}
                  className="filter-clear-sublink"
                >
                  Clear languages
                </button>
              )}
            </div>
            <p className="filter-group-hint">
              Find voice companions who communicate in languages you speak.
            </p>
            <div className="filter-languages-grid">
              {FILTER_LANGUAGE_OPTIONS.map(lang => {
                const isSelected = staged.languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleToggleLanguage(lang)}
                    className={`filter-language-btn ${isSelected ? 'active' : ''}`}
                  >
                    <span className="lang-check-circle">
                      {isSelected ? <IconCheck size={11} /> : null}
                    </span>
                    <span>{lang}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Location / Region */}
          <div className="filter-group-block">
            <label className="filter-group-label">
              <span style={{ fontSize: 14 }}>📍</span>
              <span>Location / Region (Mock Demo)</span>
            </label>
            <p className="filter-group-hint">
              Demonstration region selector. Client-side preference only — zero browser geolocation or IP tracking.
            </p>
            <select
              value={staged.location}
              onChange={(e) => setStaged(prev => ({ ...prev, location: e.target.value }))}
              className="filter-select-input"
            >
              {FILTER_LOCATION_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Interest Compatibility Strength */}
          <div className="filter-group-block">
            <label className="filter-group-label">
              <IconSparkles size={15} style={{ color: 'var(--user-primary)' }} />
              <span>Interest Compatibility Strength</span>
            </label>
            <p className="filter-group-hint">
              Calculates shared topics against your profile ({currentUserInterests.slice(0, 3).join(', ')}...).
            </p>
            <div className="filter-segmented-control">
              <button
                type="button"
                onClick={() => setStaged(prev => ({ ...prev, interestMatch: 'any' }))}
                className={`filter-seg-btn ${staged.interestMatch === 'any' ? 'active' : ''}`}
              >
                Any Match
              </button>
              <button
                type="button"
                onClick={() => setStaged(prev => ({ ...prev, interestMatch: 'some' }))}
                className={`filter-seg-btn ${staged.interestMatch === 'some' ? 'active' : ''}`}
              >
                1+ Shared Interests
              </button>
              <button
                type="button"
                onClick={() => setStaged(prev => ({ ...prev, interestMatch: 'strong' }))}
                className={`filter-seg-btn ${staged.interestMatch === 'strong' ? 'active' : ''}`}
              >
                ✨ Strong Match (90%+)
              </button>
            </div>
          </div>

          {/* 6. Discovery Preferences Toggles */}
          <div className="filter-group-block" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
            <label className="filter-group-label">
              <IconMic size={15} style={{ color: 'var(--user-accent-coral)' }} />
              <span>Discovery Preferences</span>
            </label>
            
            <div className="filter-checkbox-row">
              <label className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={staged.onlyWithVoicePrompt}
                  onChange={(e) => setStaged(prev => ({ ...prev, onlyWithVoicePrompt: e.target.checked }))}
                  className="filter-checkbox-native"
                />
                <span className="filter-checkbox-box">
                  {staged.onlyWithVoicePrompt && <IconCheck size={12} />}
                </span>
                <span className="filter-checkbox-text">
                  <strong>Only show members with a Voice Bio</strong>
                  <small>Filter for talkers with sample voice recordings available to listen</small>
                </span>
              </label>
            </div>

            <div className="filter-checkbox-row">
              <label className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={staged.hideBusy}
                  onChange={(e) => setStaged(prev => ({ ...prev, hideBusy: e.target.checked }))}
                  className="filter-checkbox-native"
                />
                <span className="filter-checkbox-box">
                  {staged.hideBusy && <IconCheck size={12} />}
                </span>
                <span className="filter-checkbox-text">
                  <strong>Hide busy talkers</strong>
                  <small>Exclude members currently participating inside live voice rooms</small>
                </span>
              </label>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="discover-filter-modal-footer">
          <div className="discover-filter-footer-preview">
            {liveCount !== null && (
              <span className="filter-match-count-badge">
                <strong>{liveCount}</strong> {liveCount === 1 ? 'person matches' : 'people match'}
              </span>
            )}
          </div>

          <div className="discover-filter-footer-actions">
            <button
              type="button"
              onClick={handleInternalReset}
              className="btn-user-secondary"
              style={{ width: 'auto', padding: '10px 18px', fontSize: '0.86rem' }}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleInternalApply}
              className="btn-user-primary"
              style={{ width: 'auto', padding: '10px 22px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <IconCheck size={16} />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
