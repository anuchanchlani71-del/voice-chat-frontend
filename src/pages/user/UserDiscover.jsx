import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from '../../router';
import UserLayout from '../../components/user/UserLayout';
import {
  MOCK_DISCOVER_TOPIC_HUBS,
  MOCK_CURRENT_USER_PREVIEW
} from '../../data/userMockData';
import { getDiscoverUsers } from '../../services/discoverApi';
import { useFriendRequests } from '../../context/FriendRequestContext';

// Map UI category pill IDs to search keywords for interest matching
const CATEGORY_TOPIC_MAP = {
  'cat-lifestyle': 'Deep',
  'cat-music': 'Music',
  'cat-gaming': 'Gaming',
  'cat-movies': 'Anime',
  'cat-tech': 'Tech',
  'cat-learning': 'Languages'
};

import { renderAvatar } from '../../utils/avatarUtils';

import {
  IconSearch,
  IconMic,
  IconSparkles,
  IconUsers,
  IconPhoneCall,
  IconCheck,
  IconTag,
  IconFilter,
  IconSliders,
  IconX
} from '../../components/common/Icons';
import UserDiscoveryFiltersModal, {
  DEFAULT_DISCOVERY_FILTERS
} from '../../components/user/UserDiscoveryFiltersModal';

// Load saved filters from sessionStorage
const loadSavedFilters = () => {
  try {
    const saved = sessionStorage.getItem('vcf_discovery_filters');
    if (saved) {
      return { ...DEFAULT_DISCOVERY_FILTERS, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.error('Failed to parse discovery filters', err);
  }
  return DEFAULT_DISCOVERY_FILTERS;
};

// Filter matching predicate
const matchesAdvancedFilters = (person, filters, myInterests = []) => {
  if (!filters) return true;

  // 1. Availability
  if (filters.availability === 'online' && !person.isOnline) {
    return false;
  }
  if (filters.availability === 'available' && person.voiceStatus !== 'available_to_talk' && person.status !== 'available_to_talk') {
    return false;
  }

  // 2. Topics (multi-select: matches any selected topic)
  if (filters.topics && filters.topics.length > 0) {
    const hasTopic = filters.topics.some(t =>
      person.interests && person.interests.some(pi => pi.toLowerCase().includes(t.toLowerCase()))
    );
    if (!hasTopic) return false;
  }

  // 3. Languages (multi-select: matches any selected language)
  if (filters.languages && filters.languages.length > 0) {
    const hasLanguage = filters.languages.some(lang =>
      person.languages && person.languages.some(pl => pl.toLowerCase().includes(lang.toLowerCase()))
    );
    if (!hasLanguage) return false;
  }

  // 4. Location / Region
  if (filters.location && filters.location !== 'all') {
    const loc = (person.location || '').toLowerCase();
    const target = filters.location.toLowerCase();
    let matchesLocation = false;
    if (target === 'united states') {
      matchesLocation = loc.includes('austin') || loc.includes('san francisco') || loc.includes('new york') || loc.includes('us');
    } else if (target === 'united kingdom') {
      matchesLocation = loc.includes('london') || loc.includes('uk') || loc.includes('kingdom');
    } else if (target === 'japan') {
      matchesLocation = loc.includes('tokyo') || loc.includes('japan');
    } else if (target === 'germany') {
      matchesLocation = loc.includes('berlin') || loc.includes('germany');
    } else if (target === 'canada') {
      matchesLocation = loc.includes('toronto') || loc.includes('canada');
    } else if (target === 'spain') {
      matchesLocation = loc.includes('madrid') || loc.includes('spain');
    } else if (target === 'india') {
      matchesLocation = loc.includes('bengaluru') || loc.includes('mumbai') || loc.includes('india');
    } else if (target === 'australia') {
      matchesLocation = loc.includes('sydney') || loc.includes('melbourne') || loc.includes('australia');
    } else {
      matchesLocation = loc.includes(target);
    }
    if (!matchesLocation) return false;
  }

  // 5. Discovery Preferences
  if (filters.onlyWithVoicePrompt && !person.voicePrompt) {
    return false;
  }
  if (filters.hideBusy && (person.status === 'in_room' || person.voiceStatus === 'in_room')) {
    return false;
  }

  return true;
};

// Generate list of active chips
const getActiveFilterChips = (filters) => {
  if (!filters) return [];
  const chips = [];
  if (filters.availability && filters.availability !== 'all') {
    chips.push({
      id: 'avail',
      type: 'availability',
      category: 'Status',
      label: filters.availability === 'online' ? 'Online Now' : 'Available to Talk',
      value: filters.availability
    });
  }
  if (filters.topics && filters.topics.length > 0) {
    filters.topics.forEach(t => {
      chips.push({
        id: `topic-${t}`,
        type: 'topics',
        category: 'Topic',
        label: t,
        value: t
      });
    });
  }
  if (filters.languages && filters.languages.length > 0) {
    filters.languages.forEach(l => {
      chips.push({
        id: `lang-${l}`,
        type: 'languages',
        category: 'Language',
        label: l,
        value: l
      });
    });
  }
  if (filters.location && filters.location !== 'all') {
    chips.push({
      id: 'loc',
      type: 'location',
      category: 'Region',
      label: filters.location,
      value: filters.location
    });
  }
  if (filters.interestMatch && filters.interestMatch !== 'any') {
    chips.push({
      id: 'match',
      type: 'interestMatch',
      category: 'Match',
      label: filters.interestMatch === 'some' ? 'Shared Interests' : 'Strong Resonance',
      value: filters.interestMatch
    });
  }
  if (filters.onlyWithVoicePrompt) {
    chips.push({
      id: 'voice-prompt',
      type: 'onlyWithVoicePrompt',
      category: 'Audio',
      label: 'Has Voice Bio',
      value: true
    });
  }
  if (filters.hideBusy) {
    chips.push({
      id: 'hide-busy',
      type: 'hideBusy',
      category: 'Filter',
      label: 'Hide Busy Talkers',
      value: true
    });
  }
  return chips;
};

export default function UserDiscover() {
  const {
    isRequestSent,
    sendRequest,
    cancelRequest,
    isFriend,
    isIncomingRequest,
    getIncomingRequest,
    acceptRequest
  } = useFriendRequests();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'available' | 'high_resonance'
  const [playingPromptId, setPlayingPromptId] = useState(null);
  const [wavedUserIds, setWavedUserIds] = useState([]);

  // Real backend discover data state
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Advanced Filters State (persisted in sessionStorage)
  const [advancedFilters, setAdvancedFilters] = useState(loadSavedFilters);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Active filter chips list & count
  const activeFilterChips = useMemo(() => getActiveFilterChips(advancedFilters), [advancedFilters]);
  const activeFilterCount = activeFilterChips.length;

  // Debounce search input to avoid excessive requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Category filter options
  const categoryFilters = [
    { id: 'all', label: 'All Topics', icon: '✨' },
    { id: 'cat-lifestyle', label: 'Deep Talks', icon: '☕' },
    { id: 'cat-music', label: 'Lo-Fi & Music', icon: '🎵' },
    { id: 'cat-gaming', label: 'Gaming', icon: '🎮' },
    { id: 'cat-movies', label: 'Anime & Cinema', icon: '🎬' },
    { id: 'cat-tech', label: 'Tech & Code', icon: '💻' },
    { id: 'cat-learning', label: 'Languages', icon: '📚' }
  ];

  // Fetch real users from backend API
  // Fetch real users from backend API
  const loadDiscoverUsers = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const params = {
        page: 1,
        limit: 100
      };

      // 1. Text search
      if (debouncedSearch && debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      // 2. Category / Topic
      if (advancedFilters.topics && advancedFilters.topics.length > 0) {
        params.topic = advancedFilters.topics[0];
      } else if (selectedCategory !== 'all' && CATEGORY_TOPIC_MAP[selectedCategory]) {
        params.topic = CATEGORY_TOPIC_MAP[selectedCategory];
      }

      // 3. Availability
      if (advancedFilters.availability === 'available' || filterTab === 'available') {
        params.availability = 'available_to_talk';
      } else if (advancedFilters.availability === 'online') {
        params.availability = 'online';
      }

      // 4. Language
      if (advancedFilters.languages && advancedFilters.languages.length > 0) {
        params.language = advancedFilters.languages[0];
      }

      const res = await getDiscoverUsers(params);
      setDiscoverUsers(res.users || []);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      console.error('[UserDiscover] Failed to fetch discover users:', err);
      setApiError(err.message || 'Failed to load discover members');
      setDiscoverUsers([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedCategory, filterTab, advancedFilters]);

  // Reload when query params / filters change
  useEffect(() => {
    loadDiscoverUsers();
  }, [loadDiscoverUsers]);

  // Toggle voice prompt playback simulation
  const handleTogglePlayPrompt = (userId) => {
    if (playingPromptId === userId) {
      setPlayingPromptId(null);
    } else {
      setPlayingPromptId(userId);
    }
  };

  // Toggle friend connection with shared context
  const handleToggleConnect = async (person) => {
    if (isFriend(person.id)) {
      return;
    }
    if (isRequestSent(person.id)) {
      try {
        await cancelRequest(person.id);
      } catch (err) {
        console.error('Cancel request failed:', err);
      }
    } else if (isIncomingRequest && isIncomingRequest(person.id)) {
      try {
        const inc = getIncomingRequest(person.id);
        if (inc) {
          await acceptRequest(inc.id);
        }
      } catch (err) {
        console.error('Accept request failed:', err);
      }
    } else {
      try {
        await sendRequest(person);
      } catch (err) {
        console.error('Send request failed:', err);
      }
    }
  };

  // Quick wave greeting
  const handleSendWave = (userId) => {
    if (!wavedUserIds.includes(userId)) {
      setWavedUserIds(prev => [...prev, userId]);
    }
  };

  // Remove a single active filter chip
  const handleRemoveChip = (type, value) => {
    setAdvancedFilters(prev => {
      let next;
      if (type === 'topics') {
        next = { ...prev, topics: prev.topics.filter(t => t !== value) };
      } else if (type === 'languages') {
        next = { ...prev, languages: prev.languages.filter(l => l !== value) };
      } else if (type === 'availability') {
        next = { ...prev, availability: 'all' };
      } else if (type === 'location') {
        next = { ...prev, location: 'all' };
      } else if (type === 'interestMatch') {
        next = { ...prev, interestMatch: 'any' };
      } else if (type === 'onlyWithVoicePrompt') {
        next = { ...prev, onlyWithVoicePrompt: false };
      } else if (type === 'hideBusy') {
        next = { ...prev, hideBusy: false };
      } else {
        next = prev;
      }
      sessionStorage.setItem('vcf_discovery_filters', JSON.stringify(next));
      return next;
    });
  };

  // Clear all advanced filters
  const handleClearAllFilters = () => {
    setAdvancedFilters(DEFAULT_DISCOVERY_FILTERS);
    sessionStorage.removeItem('vcf_discovery_filters');
  };

  // Complete reset (search + category + tab + advanced filters)
  const handleResetEverything = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setDebouncedSearch('');
    setFilterTab('all');
    setAdvancedFilters(DEFAULT_DISCOVERY_FILTERS);
    sessionStorage.removeItem('vcf_discovery_filters');
  };

  // Calculate matching count for modal live preview using loaded discover users
  const calculateMatchCount = (testFilters) => {
    return discoverUsers.filter(person => {
      return matchesAdvancedFilters(person, testFilters);
    }).length;
  };

  // Filtered People List (applies client refinements on loaded real users)
  const filteredPeople = useMemo(() => {
    return discoverUsers.filter(person => {
      // High resonance tab check
      if (filterTab === 'high_resonance' && (person.matchScore || 0) < 90) {
        return false;
      }

      // Advanced filters composite check
      if (!matchesAdvancedFilters(person, advancedFilters)) {
        return false;
      }

      return true;
    });
  }, [discoverUsers, filterTab, advancedFilters]);

  // Online / Available users subset from real API results
  const onlineNowUsers = useMemo(() => {
    return discoverUsers.filter(p => p.isOnline || p.voiceStatus === 'available_to_talk' || p.status === 'available_to_talk');
  }, [discoverUsers]);

  return (
    <UserLayout>
      <div className="discover-page-container">
        
        {/* ── Contextual Welcome & Live Activity Banner ──────────────── */}
        <section className="discover-hero-banner">
          <div className="discover-hero-badge">
            <span className="voice-wave-visualizer" style={{ marginRight: 6 }}>
              <span className="voice-wave-bar" />
              <span className="voice-wave-bar" />
              <span className="voice-wave-bar" />
              <span className="voice-wave-bar" />
              <span className="voice-wave-bar" />
            </span>
            <span>Live Social Voice Discovery</span>
          </div>

          <h1 className="discover-hero-title">
            Find someone worth <span className="text-brand-gradient">talking to.</span>
          </h1>

          <p className="discover-hero-subtitle">
            Connect with friendly people who share your frequency and passions.
            Listen to authentic voice bios, join open stages, or start a 1-to-1 conversation.
          </p>

          {/* Real-time Activity Metrics Bar */}
          <div className="discover-metrics-bar">
            <div className="discover-metric-item">
              <span className="discover-metric-dot online" />
              <span><strong>148</strong> Voice Members Online</span>
            </div>
            <div className="discover-metric-divider" />
            <div className="discover-metric-item">
              <span style={{ fontSize: '1rem' }}>🎙️</span>
              <span><strong>18</strong> Live Audio Stages</span>
            </div>
            <div className="discover-metric-divider" />
            <div className="discover-metric-item">
              <span style={{ color: 'var(--user-primary)' }}>✨</span>
              <span><strong>96.4%</strong> Topic Resonance Rate</span>
            </div>
          </div>
        </section>

        {/* ── Search & Filter Controls Bar ────────────────────────────── */}
        <div className="discover-controls-wrap">
          {/* Search Input */}
          <div className="discover-search-box">
            <span className="discover-search-icon">
              <IconSearch size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by name, @username, or interest topic (e.g. Lo-Fi, Valorant, AI)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="discover-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="discover-search-clear"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="discover-controls-right">
            {/* Quick Filter Tabs */}
            <div className="discover-filter-tabs">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`discover-tab-btn ${filterTab === 'all' ? 'active' : ''}`}
              >
                All Recommended
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('available')}
                className={`discover-tab-btn ${filterTab === 'available' ? 'active' : ''}`}
              >
                🎙️ Available to Talk
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('high_resonance')}
                className={`discover-tab-btn ${filterTab === 'high_resonance' ? 'active' : ''}`}
              >
                ✨ High Match (90%+)
              </button>
            </div>

            {/* Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className={`discover-advanced-filter-btn ${activeFilterCount > 0 ? 'active' : ''}`}
              title="Open Advanced Discovery Filters"
            >
              <IconSliders size={16} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="discover-filter-count-badge">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* ── Topic Category Pills Cloud ──────────────────────────────── */}
        <div className="discover-category-pills">
          {categoryFilters.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`discover-pill-btn ${isSelected ? 'active' : ''}`}
              >
                <span className="discover-pill-icon">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Active Filters Summary Bar ──────────────────────────────── */}
        {activeFilterCount > 0 && (
          <div className="discover-active-filters-bar">
            <div className="discover-active-filters-meta">
              <span className="discover-active-label">
                <IconFilter size={14} style={{ marginRight: 6 }} />
                <span>Active Filters ({activeFilterCount}):</span>
              </span>
            </div>

            <div className="discover-active-chips-wrap">
              {activeFilterChips.map(chip => (
                <span key={chip.id} className="discover-active-chip">
                  <span className="discover-chip-tag">{chip.category}:</span>
                  <span className="discover-chip-val">{chip.label}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChip(chip.type, chip.value)}
                    className="discover-chip-remove"
                    title={`Remove ${chip.label}`}
                    aria-label={`Remove filter ${chip.label}`}
                  >
                    ✕
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={handleClearAllFilters}
                className="discover-clear-all-link"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* ── Section 1: Online Now & Available (Quick Voice Avatars) ─── */}
        <section className="discover-section">
          <div className="discover-section-header">
            <div>
              <h2 className="discover-section-title">
                <span style={{ color: 'var(--user-status-online)', marginRight: 8 }}>●</span>
                Available for Voice Chat Now
              </h2>
              <p className="discover-section-sub">
                Members currently open to 1-to-1 voice calls and friendly discussions.
              </p>
            </div>
            <span className="discover-badge-count">
              {onlineNowUsers.length} online
            </span>
          </div>

          <div className="discover-online-strip">
            {onlineNowUsers.map(user => (
              <Link
                key={user.id}
                to={`/user/${user.id}`}
                className="discover-online-card"
                style={{ textDecoration: 'none' }}
                title={`View ${user.fullName}'s profile`}
              >
                <div className="discover-online-avatar-wrap">
                  <div
                    className="discover-online-avatar"
                    style={{ background: user.avatarBg }}
                  >
                    {renderAvatar(user.avatar, user.fullName)}
                  </div>
                  <span className={`discover-status-indicator ${(user.status === 'available_to_talk' || user.voiceStatus === 'available_to_talk') ? 'available' : 'online'}`} />
                </div>
                <div className="discover-online-name">{user.fullName.split(' ')[0]}</div>
                <div className="discover-online-status-text">
                  {(user.status === 'available_to_talk' || user.voiceStatus === 'available_to_talk') ? 'Available' : 'Online'}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Section 2: Explore Voice Topics Hub ─────────────────────── */}
        <section className="discover-section">
          <div className="discover-section-header">
            <div>
              <h2 className="discover-section-title">
                Explore Conversations by Topic
              </h2>
              <p className="discover-section-sub">
                Click any topic to filter members and active voice stages immediately.
              </p>
            </div>
          </div>

          <div className="discover-topics-grid">
            {MOCK_DISCOVER_TOPIC_HUBS.map(hub => {
              const isSelected = selectedCategory === hub.id;
              return (
                <div
                  key={hub.id}
                  onClick={() => setSelectedCategory(isSelected ? 'all' : hub.id)}
                  className={`discover-topic-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="discover-topic-icon-wrap">
                    <span className="discover-topic-icon">{hub.icon}</span>
                    <span className="discover-topic-badge">{hub.badge}</span>
                  </div>
                  <h3 className="discover-topic-name">{hub.name}</h3>
                  <div className="discover-topic-meta">
                    <span>{hub.talkersCount} Talkers</span>
                    <span>&bull;</span>
                    <span style={{ color: 'var(--user-primary)' }}>{hub.activeStages} Live Stages</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 3: Recommended People for You (Voice Cards Grid) ── */}
        <section className="discover-section">
          <div className="discover-section-header">
            <div>
              <h2 className="discover-section-title">
                People for You
              </h2>
              <p className="discover-section-sub">
                Curated based on your interests, topic compatibility, and voice vibe.
              </p>
            </div>
            <span className="discover-badge-count">
              Showing {filteredPeople.length} people
            </span>
          </div>

          {isLoading ? (
            <div className="discover-empty-state" style={{ padding: '40px 20px' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
              <h3 className="discover-empty-title">Discovering Voice Members...</h3>
              <p className="discover-empty-sub">Connecting with active voices across the platform.</p>
            </div>
          ) : apiError ? (
            <div className="discover-empty-state" style={{ padding: '40px 20px' }}>
              <div className="discover-empty-icon">⚠️</div>
              <h3 className="discover-empty-title">Unable to Load Members</h3>
              <p className="discover-empty-sub">{apiError}</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 14 }}>
                <button
                  type="button"
                  onClick={loadDiscoverUsers}
                  className="btn-user-primary"
                  style={{ width: 'auto', padding: '10px 22px' }}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="discover-empty-state">
              <div className="discover-empty-icon">🔍</div>
              <h3 className="discover-empty-title">No people match these filters yet</h3>
              <p className="discover-empty-sub">
                Try broadening your selected topics, switching languages, or adjusting your availability criteria.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
                <button
                  type="button"
                  onClick={handleResetEverything}
                  className="btn-user-primary"
                  style={{ width: 'auto', padding: '10px 22px' }}
                >
                  Clear All Filters
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                  className="btn-user-secondary"
                  style={{ width: 'auto', padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <IconSliders size={16} />
                  <span>Adjust Filters</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="discover-people-grid">
              {filteredPeople.map(person => {
                const isPlaying = playingPromptId === person.id;
                const requestPending = isRequestSent(person.id);
                const alreadyFriend = isFriend(person.id);
                const incomingPending = isIncomingRequest ? isIncomingRequest(person.id) : false;
                const isConnected = requestPending || alreadyFriend || incomingPending;
                const hasWaved = wavedUserIds.includes(person.id);

                return (
                  <div key={person.id} className="discover-profile-card">
                    {/* Card Header: Avatar, Name, Status, Match Score */}
                    <div className="discover-profile-header">
                      <Link
                        to={`/user/${person.id}`}
                        className="discover-profile-avatar-block"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                        title={`View ${person.fullName}'s profile`}
                      >
                        <div
                          className="discover-profile-avatar"
                          style={{ background: person.avatarBg }}
                        >
                          {renderAvatar(person.avatar, person.fullName)}
                        </div>
                        <div className="discover-profile-identity">
                          <h3 className="discover-profile-name">{person.fullName}</h3>
                          <div className="discover-profile-handle">@{person.username}</div>
                        </div>
                      </Link>

                      {/* Topic Resonance Score */}
                      <div className="discover-resonance-pill">
                        <IconSparkles size={13} />
                        <span>{person.matchScore}% Match</span>
                      </div>
                    </div>

                    {/* Status Strip */}
                    <div className="discover-profile-status-bar">
                      <span className={`discover-status-dot ${person.status === 'available_to_talk' ? 'available' : person.status === 'in_room' ? 'in-room' : 'online'}`} />
                      <span className="discover-status-label">{person.statusLabel}</span>
                      <span style={{ margin: '0 4px', color: 'var(--user-text-muted)' }}>&bull;</span>
                      <span style={{ color: 'var(--user-text-muted)', fontSize: '0.78rem' }}>{person.location}</span>
                    </div>

                    {/* Short Bio */}
                    <p className="discover-profile-bio">
                      {person.bio}
                    </p>

                    {/* Voice Prompt Capsule (Interactive Audio Snippet) */}
                    {person.voicePrompt && (
                      <div className={`discover-voice-capsule ${isPlaying ? 'playing' : ''}`}>
                        <button
                          type="button"
                          onClick={() => handleTogglePlayPrompt(person.id)}
                          className="discover-voice-play-btn"
                          aria-label={isPlaying ? 'Pause voice prompt' : 'Play voice prompt'}
                          title={isPlaying ? 'Pause audio prompt' : 'Listen to voice intro'}
                        >
                          {isPlaying ? '⏸' : '▶'}
                        </button>
                        <div className="discover-voice-info">
                          <div className="discover-voice-title">
                            &ldquo;{person.voicePrompt.title}&rdquo;
                          </div>
                          <div className="discover-voice-waves-row">
                            {person.voicePrompt.previewWaves.map((h, i) => (
                              <span
                                key={i}
                                className={`discover-wave-bar ${isPlaying ? 'animating' : ''}`}
                                style={{
                                  height: isPlaying ? `${Math.max(25, (h + (i % 3) * 15) % 100)}%` : `${h}%`,
                                  animationDelay: `${i * 0.08}s`
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="discover-voice-duration">
                          {person.voicePrompt.duration}
                        </span>
                      </div>
                    )}

                    {/* Shared Topic Chips */}
                    <div className="discover-topic-chips">
                      {person.interests.map((interest, idx) => (
                        <span key={idx} className="discover-chip">
                          #{interest}
                        </span>
                      ))}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="discover-profile-actions">
                      <button
                        type="button"
                        onClick={() => handleToggleConnect(person)}
                        className={`discover-connect-btn ${isConnected ? 'connected' : ''}`}
                      >
                        {alreadyFriend ? (
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

                      <button
                        type="button"
                        onClick={() => handleSendWave(person.id)}
                        className={`discover-wave-btn ${hasWaved ? 'waved' : ''}`}
                        title="Send a friendly wave"
                      >
                        {hasWaved ? '👋 Waved!' : '👋 Wave'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Advanced Discovery Filters Modal ────────────────────────── */}
        <UserDiscoveryFiltersModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          filters={advancedFilters}
          onApply={(newFilters) => {
            setAdvancedFilters(newFilters);
            sessionStorage.setItem('vcf_discovery_filters', JSON.stringify(newFilters));
          }}
          onReset={() => {
            setAdvancedFilters(DEFAULT_DISCOVERY_FILTERS);
            sessionStorage.removeItem('vcf_discovery_filters');
          }}
          calculateMatchCount={calculateMatchCount}
          currentUserInterests={MOCK_CURRENT_USER_PREVIEW.interests}
        />

      </div>
    </UserLayout>
  );
}
