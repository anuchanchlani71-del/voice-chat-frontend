/**
 * Discover API Service
 * Connects frontend user discovery and public profile lookup to backend endpoints.
 * Follows the project's authenticated fetch pattern and localStorage userToken.
 */

import { getUserToken } from './authApi';
import { MOCK_AVATARS } from '../data/userMockData';

const BASE_URL = 'http://localhost:5000/api/v1';

// ── Generic API fetch helper ─────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const token = getUserToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.response = data;
    throw error;
  }

  return data;
}

// ── Normalization Helper ─────────────────────────────────────────────────
/**
 * Normalize backend user payload into standard frontend person/profile shape.
 * Bridges status ('available_to_talk' vs 'voiceStatus') and UI attributes.
 */
export function normalizeDiscoverUser(u) {
  if (!u) return null;

  const avatarFallback = MOCK_AVATARS[0];
  const avatarObj = MOCK_AVATARS.find(a => a.id === u.avatarId) || avatarFallback;

  // Determine avatar icon and background gradient
  const resolvedAvatar = u.avatar && u.avatar.length <= 4
    ? u.avatar
    : (u.avatar && (u.avatar.startsWith('http') || u.avatar.startsWith('/')) ? u.avatar : avatarObj.emoji);

  const resolvedAvatarBg = u.avatarBg || avatarObj.bg;

  // Status mapping: frontend checks status === 'available_to_talk'
  const isAvailable = u.voiceStatus === 'available_to_talk';
  const resolvedStatus = isAvailable ? 'available_to_talk' : (u.voiceStatus || (u.isOnline ? 'online' : 'offline'));
  const resolvedStatusLabel = isAvailable
    ? 'Available to Talk'
    : (u.voiceStatus === 'in_room' ? 'In Stage' : (u.isOnline ? 'Online' : 'Offline'));

  return {
    ...u,
    id: u.id,
    fullName: u.fullName || u.username || 'Voice Member',
    username: u.username || 'member',
    avatar: resolvedAvatar,
    avatarId: u.avatarId || avatarObj.id,
    avatarBg: resolvedAvatarBg,
    bio: u.bio || 'Say hello and start a voice conversation.',
    status: resolvedStatus,
    statusLabel: resolvedStatusLabel,
    voiceStatus: u.voiceStatus || (isAvailable ? 'available_to_talk' : 'online'),
    isOnline: !!u.isOnline,
    interests: Array.isArray(u.interests) ? u.interests : [],
    languages: Array.isArray(u.languages) ? u.languages : ['English'],
    conversationStyle: u.conversationStyle || 'Casual & Friendly',
    preferredTime: u.preferredTime || 'Flexible',
    location: u.location || 'Online',
    friendsCount: typeof u.friendsCount === 'number' ? u.friendsCount : 0,
    matchScore: typeof u.matchScore === 'number' ? u.matchScore : 94,
    voicePrompt: u.voicePrompt || {
      title: `Intro by ${u.fullName ? u.fullName.split(' ')[0] : 'Member'}`,
      duration: '0:18',
      previewWaves: [40, 65, 85, 95, 70, 85, 100, 75, 60, 80, 65, 45],
      description: u.bio || 'Say hello and start a voice conversation.'
    },
    stats: u.stats || {
      friendsCount: typeof u.friendsCount === 'number' ? u.friendsCount : 0,
      stagesAttended: 14,
      voiceHours: '22h'
    }
  };
}

// ── Discover API Methods ─────────────────────────────────────────────────

/**
 * Fetch discoverable users from backend with search, filters & pagination
 * GET /api/v1/users/discover
 *
 * @param {Object} params
 * @param {string} [params.search]
 * @param {string} [params.category]
 * @param {string} [params.topic]
 * @param {string} [params.availability]
 * @param {string} [params.language]
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @returns {Promise<{ users: Array, totalCount: number, page: number, limit: number, totalPages: number }>}
 */
export async function getDiscoverUsers(params = {}) {
  const query = new URLSearchParams();

  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }

  const topicOrCategory = (params.topic || params.category);
  if (topicOrCategory && typeof topicOrCategory === 'string' && topicOrCategory.trim() && topicOrCategory.trim() !== 'all') {
    query.set('topic', topicOrCategory.trim());
  }

  if (params.availability && typeof params.availability === 'string' && params.availability.trim() && params.availability.trim() !== 'all') {
    query.set('availability', params.availability.trim());
  }

  if (params.language && typeof params.language === 'string' && params.language.trim() && params.language.trim() !== 'all') {
    query.set('language', params.language.trim());
  }

  if (params.page && typeof params.page === 'number') {
    query.set('page', String(params.page));
  }

  if (params.limit && typeof params.limit === 'number') {
    query.set('limit', String(params.limit));
  }

  const queryString = query.toString();
  const endpoint = `/users/discover${queryString ? `?${queryString}` : ''}`;
  const data = await apiFetch(endpoint, { method: 'GET' });

  return {
    success: true,
    users: (data.users || []).map(normalizeDiscoverUser),
    totalCount: data.totalCount || 0,
    page: data.page || 1,
    limit: data.limit || 20,
    totalPages: data.totalPages || 1
  };
}

/**
 * Fetch a user's public profile by custom id or MongoDB _id
 * GET /api/v1/users/:id
 *
 * @param {string} userId - custom user id (e.g., usr_xxx) or MongoDB _id
 * @returns {Promise<{ success: boolean, user: Object }>}
 */
export async function getPublicUserProfile(userId) {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    const error = new Error('User ID is required');
    error.status = 400;
    throw error;
  }

  const data = await apiFetch(`/users/${encodeURIComponent(userId.trim())}`, { method: 'GET' });

  return {
    success: true,
    user: normalizeDiscoverUser(data.user)
  };
}
