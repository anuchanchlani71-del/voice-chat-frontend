/**
 * Admin API Service
 * Minimal fetch-based utility for Admin Panel backend calls.
 * No external dependencies.
 */

const BASE_URL = 'http://localhost:5000/api/v1';

// ── Token storage helpers ────────────────────────────────────
// Convention: JWT stored in localStorage under 'adminToken'.
// Replace key or storage mechanism here if the convention changes.
const TOKEN_KEY = 'adminToken';

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Core fetch helper ────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const token = getAdminToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // Throw the server-provided error message so callers can display it.
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

// ── Auth endpoints ───────────────────────────────────────────

/**
 * POST /api/v1/admin/auth/login
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ success: boolean, token: string, admin: object, message: string }>}
 * @throws {Error} with server error message on failure
 */
export async function adminLogin(email, password) {
  return apiFetch('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * GET /api/v1/admin/auth/me
 * @returns {Promise<{ success: boolean, admin: object }>}
 */
export async function adminGetMe() {
  return apiFetch('/admin/auth/me');
}

/**
 * PUT /api/v1/admin/auth/me
 * @param {{ name?: string, email?: string }} data
 * @returns {Promise<{ success: boolean, message: string, admin: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminUpdateMe(data) {
  return apiFetch('/admin/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * PUT /api/v1/admin/auth/change-password
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<{ success: boolean, message: string }>}
 * @throws {Error} with server error message on failure
 */
export async function adminChangePassword(currentPassword, newPassword) {
  return apiFetch('/admin/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// ── Settings endpoints ───────────────────────────────────────

/**
 * GET /api/v1/admin/settings
 * @returns {Promise<{ success: boolean, settings: object }>}
 */
export async function adminGetSettings() {
  return apiFetch('/admin/settings');
}

/**
 * PUT /api/v1/admin/settings
 * @param {object} data - Editable settings payload
 * @returns {Promise<{ success: boolean, message: string, settings: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminUpdateSettings(data) {
  return apiFetch('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ── Interests endpoints ──────────────────────────────────────

/**
 * GET /api/v1/admin/interests
 * @param {object} params - { page, limit, search, category, isActive }
 * @returns {Promise<{ success: boolean, interests: Array, categories: Array, pagination: object }>}
 */
export async function adminGetInterests(params = {}) {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    query.set('limit', params.limit);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.category && typeof params.category === 'string' && params.category !== 'all') {
    query.set('category', params.category.trim());
  }
  if (params.isActive !== undefined && params.isActive !== null && params.isActive !== 'all') {
    query.set('isActive', params.isActive);
  }

  const qs = query.toString();
  return apiFetch(`/admin/interests${qs ? `?${qs}` : ''}`);
}

/**
 * POST /api/v1/admin/interests
 * @param {{ name: string, category?: string, icon?: string, isActive?: boolean }} data
 * @returns {Promise<{ success: boolean, message: string, interest: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminCreateInterest(data) {
  return apiFetch('/admin/interests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT /api/v1/admin/interests/:id
 * @param {string} id - Interest ID or Mongo _id
 * @param {{ name?: string, category?: string, icon?: string, isActive?: boolean }} data
 * @returns {Promise<{ success: boolean, message: string, interest: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminUpdateInterest(id, data) {
  return apiFetch(`/admin/interests/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE /api/v1/admin/interests/:id
 * @param {string} id - Interest ID or Mongo _id
 * @returns {Promise<{ success: boolean, message: string }>}
 * @throws {Error} with server error message on failure
 */
export async function adminDeleteInterest(id) {
  return apiFetch(`/admin/interests/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ── Icebreaker Prompts endpoints ─────────────────────────────

/**
 * GET /api/v1/admin/icebreaker-prompts
 * @param {object} params - { page, limit, search, interest, status }
 * @returns {Promise<{ success: boolean, prompts: Array, pagination: object }>}
 */
export async function adminGetIcebreakerPrompts(params = {}) {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    query.set('limit', params.limit);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.interest && typeof params.interest === 'string' && params.interest !== 'All Interests' && params.interest !== 'all') {
    query.set('interest', params.interest.trim());
  }
  if (params.status && typeof params.status === 'string' && params.status !== 'All Status' && params.status !== 'all') {
    const norm = params.status.toLowerCase().trim();
    if (norm === 'active' || norm === 'inactive') {
      query.set('status', norm);
    }
  }

  const qs = query.toString();
  return apiFetch(`/admin/icebreaker-prompts${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/admin/icebreaker-prompts/:id
 * @param {string} id
 * @returns {Promise<{ success: boolean, prompt: object }>}
 */
export async function adminGetIcebreakerPrompt(id) {
  return apiFetch(`/admin/icebreaker-prompts/${encodeURIComponent(id)}`);
}

/**
 * POST /api/v1/admin/icebreaker-prompts
 * @param {{ interest: string, prompt: string, status?: string }} data
 * @returns {Promise<{ success: boolean, message: string, prompt: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminCreateIcebreakerPrompt(data) {
  return apiFetch('/admin/icebreaker-prompts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT /api/v1/admin/icebreaker-prompts/:id
 * @param {string} id - Prompt ID or Mongo _id
 * @param {{ interest?: string, prompt?: string, status?: string }} data
 * @returns {Promise<{ success: boolean, message: string, prompt: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminUpdateIcebreakerPrompt(id, data) {
  return apiFetch(`/admin/icebreaker-prompts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH /api/v1/admin/icebreaker-prompts/:id/status
 * @param {string} id - Prompt ID or Mongo _id
 * @param {string} status - 'active' | 'inactive'
 * @returns {Promise<{ success: boolean, message: string, prompt: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminUpdateIcebreakerPromptStatus(id, status) {
  return apiFetch(`/admin/icebreaker-prompts/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/**
 * DELETE /api/v1/admin/icebreaker-prompts/:id
 * @param {string} id - Prompt ID or Mongo _id
 * @returns {Promise<{ success: boolean, message: string }>}
 * @throws {Error} with server error message on failure
 */
export async function adminDeleteIcebreakerPrompt(id) {
  return apiFetch(`/admin/icebreaker-prompts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ── Users endpoints ──────────────────────────────────────────

/**
 * GET /api/v1/admin/users
 * @param {object} params - { page, limit, search, online, isOnline, status, accountStatus, interest }
 * @returns {Promise<{ success: boolean, users: Array, pagination: object }>}
 */
export async function adminGetUsers(params = {}) {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    query.set('limit', params.limit);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.online !== undefined && params.online !== null && params.online !== 'all') {
    query.set('online', params.online);
  } else if (params.isOnline !== undefined && params.isOnline !== null && params.isOnline !== 'all') {
    query.set('isOnline', params.isOnline);
  }
  if (params.status !== undefined && params.status !== null && params.status !== 'all') {
    query.set('status', params.status);
  } else if (params.accountStatus !== undefined && params.accountStatus !== null && params.accountStatus !== 'all') {
    query.set('accountStatus', params.accountStatus);
  }
  if (params.interest && typeof params.interest === 'string' && params.interest !== 'all' && params.interest !== 'All Interests') {
    query.set('interest', params.interest.trim());
  }

  const qs = query.toString();
  return apiFetch(`/admin/users${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/admin/users/:id
 * @param {string} id - User ID, Mongo _id, or username
 * @returns {Promise<{ success: boolean, user: object }>}
 */
export async function adminGetUserById(id) {
  return apiFetch(`/admin/users/${encodeURIComponent(id)}`);
}

/**
 * PATCH /api/v1/admin/users/:id/status
 * @param {string} id - User ID, Mongo _id, or username
 * @param {{ accountStatus?: string, status?: string }} data
 * @returns {Promise<{ success: boolean, message: string, user: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminUpdateUserStatus(id, data) {
  return apiFetch(`/admin/users/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ── Dashboard endpoints ──────────────────────────────────────

/**
 * GET /api/v1/admin/dashboard/stats
 * @returns {Promise<{ success: boolean, stats: object }>}
 */
export async function adminGetDashboardStats() {
  return apiFetch('/admin/dashboard/stats');
}

/**
 * GET /api/v1/admin/dashboard/charts
 * @returns {Promise<{ success: boolean, chart: object }>}
 */
export async function adminGetDashboardCharts() {
  return apiFetch('/admin/dashboard/charts');
}

// ── Reports endpoints ────────────────────────────────────────

/**
 * GET /api/v1/admin/reports
 * @param {object} params - { page, limit, search, status, type, reasonCategory, startDate, endDate }
 * @returns {Promise<{ success: boolean, reports: Array, pagination: object }>}
 */
export async function adminGetReports(params = {}) {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    query.set('limit', params.limit);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.status && typeof params.status === 'string' && params.status !== 'all') {
    query.set('status', params.status.trim());
  }
  if (params.type && typeof params.type === 'string' && params.type !== 'all') {
    query.set('type', params.type.trim());
  }
  if (params.reasonCategory && typeof params.reasonCategory === 'string' && params.reasonCategory !== 'all') {
    query.set('reasonCategory', params.reasonCategory.trim());
  }

  const qs = query.toString();
  return apiFetch(`/admin/reports${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/admin/reports/:id
 * @param {string} id - Report ID or Mongo _id
 * @returns {Promise<{ success: boolean, report: object }>}
 */
export async function adminGetReportById(id) {
  return apiFetch(`/admin/reports/${encodeURIComponent(id)}`);
}

/**
 * PATCH /api/v1/admin/reports/:id/status
 * @param {string} id - Report ID or Mongo _id
 * @param {{ status: string, resolutionAction?: string, notes?: string }} data
 * @returns {Promise<{ success: boolean, message: string, report: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminUpdateReportStatus(id, data) {
  return apiFetch(`/admin/reports/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ── Voice Calls endpoints ────────────────────────────────────

/**
 * GET /api/v1/admin/voice-calls
 * @param {object} params - { page, limit, search, status, startDate, endDate }
 * @returns {Promise<{ success: boolean, calls: Array, pagination: object }>}
 */
export async function adminGetVoiceCalls(params = {}) {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    query.set('limit', params.limit);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.status && typeof params.status === 'string' && params.status !== 'all') {
    query.set('status', params.status.trim());
  }

  const qs = query.toString();
  return apiFetch(`/admin/voice-calls${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/admin/voice-calls/:id
 * @param {string} id - Voice call ID or Mongo _id
 * @returns {Promise<{ success: boolean, voiceCall: object }>}
 */
export async function adminGetVoiceCallById(id) {
  return apiFetch(`/admin/voice-calls/${encodeURIComponent(id)}`);
}

// ── Safety & Repeat Offenders endpoints ──────────────────────

/**
 * GET /api/v1/admin/safety/overview
 * @returns {Promise<{ success: boolean, metrics: object }>}
 */
export async function adminGetSafetyOverview() {
  return apiFetch('/admin/safety/overview');
}

/**
 * GET /api/v1/admin/safety/flagged-users
 * @param {object} params - { page, limit, search, accountStatus, status }
 * @returns {Promise<{ success: boolean, flaggedUsers: Array, pagination: object }>}
 */
export async function adminGetFlaggedUsers(params = {}) {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    query.set('limit', params.limit);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.accountStatus && typeof params.accountStatus === 'string' && params.accountStatus !== 'all') {
    query.set('accountStatus', params.accountStatus.trim());
  } else if (params.status && typeof params.status === 'string' && params.status !== 'all') {
    query.set('status', params.status.trim());
  }

  const qs = query.toString();
  return apiFetch(`/admin/safety/flagged-users${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/admin/safety/repeat-offenders
 * @param {object} params - { page, limit, search, priority, patternStatus, minDistinctReporters }
 * @returns {Promise<{ success: boolean, data: Array, patterns: Array, pagination: object }>}
 */
export async function adminGetRepeatOffenders(params = {}) {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    query.set('limit', params.limit);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.priority && typeof params.priority === 'string' && params.priority !== 'all' && params.priority !== 'All Priorities') {
    query.set('priority', params.priority.toLowerCase().replace(' priority', '').trim());
  }
  if (params.patternStatus && typeof params.patternStatus === 'string' && params.patternStatus !== 'all' && params.patternStatus !== 'All Statuses') {
    query.set('patternStatus', params.patternStatus.toLowerCase().replace(/\s+/g, '_').trim());
  }
  if (params.minDistinctReporters !== undefined && params.minDistinctReporters !== null && params.minDistinctReporters !== '' && params.minDistinctReporters !== 'all' && params.minDistinctReporters !== 'All (2+)') {
    const minVal = parseInt(params.minDistinctReporters, 10);
    if (!isNaN(minVal) && minVal >= 2) {
      query.set('minDistinctReporters', minVal);
    }
  }

  const qs = query.toString();
  return apiFetch(`/admin/safety/repeat-offenders${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/admin/safety/repeat-offenders/:userId
 * @param {string} userId - User ID, Mongo _id, or username
 * @returns {Promise<{ success: boolean, data: object }>}
 */
export async function adminGetRepeatOffenderDetail(userId) {
  return apiFetch(`/admin/safety/repeat-offenders/${encodeURIComponent(userId)}`);
}

// ── Appeals endpoints ────────────────────────────────────────

/**
 * GET /api/v1/admin/appeals
 * @param {object} params - { page, limit, search, status, actionType }
 * @returns {Promise<{ success: boolean, appeals: Array, data: Array, pagination: object }>}
 */
export async function adminGetAppeals(params = {}) {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    query.set('limit', params.limit);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.status && typeof params.status === 'string' && params.status !== 'all' && params.status !== 'All Status') {
    query.set('status', params.status.toLowerCase().replace(/\s+/g, '_').trim());
  }
  if (params.actionType && typeof params.actionType === 'string' && params.actionType !== 'all' && params.actionType !== 'All Actions') {
    query.set('actionType', params.actionType.toLowerCase().trim());
  }

  const qs = query.toString();
  return apiFetch(`/admin/appeals${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/admin/appeals/:id
 * @param {string} id - Appeal ID or Mongo _id
 * @returns {Promise<{ success: boolean, appeal: object, data: object }>}
 */
export async function adminGetAppealById(id) {
  return apiFetch(`/admin/appeals/${encodeURIComponent(id)}`);
}

/**
 * PATCH /api/v1/admin/appeals/:id/status
 * @param {string} id - Appeal ID or Mongo _id
 * @param {{ status: string, adminNotes?: string }} data
 * @returns {Promise<{ success: boolean, message: string, appeal: object, data: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminUpdateAppealStatus(id, data) {
  return apiFetch(`/admin/appeals/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ── Friendships & Friend Requests endpoints ──────────────────

/**
 * GET /api/v1/admin/friendships
 * @param {object} params - { page, limit, search, status }
 * @returns {Promise<{ success: boolean, friendships: Array, counts: object, pagination: object }>}
 */
export async function adminGetFriendships(params = {}) {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    query.set('limit', params.limit);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.status && typeof params.status === 'string' && params.status !== 'all') {
    query.set('status', params.status.trim());
  }

  const qs = query.toString();
  return apiFetch(`/admin/friendships${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/admin/friendships/:id
 * @param {string} id - Friendship ID or Mongo _id
 * @returns {Promise<{ success: boolean, friendship: object }>}
 */
export async function adminGetFriendshipById(id) {
  return apiFetch(`/admin/friendships/${encodeURIComponent(id)}`);
}

/**
 * GET /api/v1/admin/friend-requests
 * @param {object} params - { page, limit, search, status }
 * @returns {Promise<{ success: boolean, friendRequests: Array, counts: object, pagination: object }>}
 */
export async function adminGetFriendRequests(params = {}) {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    query.set('limit', params.limit);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.status && typeof params.status === 'string' && params.status !== 'all') {
    query.set('status', params.status.trim());
  }

  const qs = query.toString();
  return apiFetch(`/admin/friend-requests${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/admin/friend-requests/:id
 * @param {string} id - Friend request ID or Mongo _id
 * @returns {Promise<{ success: boolean, friendRequest: object }>}
 */
export async function adminGetFriendRequestById(id) {
  return apiFetch(`/admin/friend-requests/${encodeURIComponent(id)}`);
}

// ── Notifications endpoints ──────────────────────────────────

/**
 * GET /api/v1/admin/notifications
 * @param {object} params - { page, limit, search, type, status, startDate, endDate }
 * @returns {Promise<{ success: boolean, notifications: Array, counts: object, pagination: object }>}
 */
export async function adminGetNotifications(params = {}) {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    query.set('limit', params.limit);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.type && typeof params.type === 'string' && params.type !== 'all') {
    query.set('type', params.type.trim());
  }
  if (params.status && typeof params.status === 'string' && params.status !== 'all') {
    query.set('status', params.status.trim());
  }
  if (params.startDate) {
    query.set('startDate', params.startDate);
  }
  if (params.endDate) {
    query.set('endDate', params.endDate);
  }

  const qs = query.toString();
  return apiFetch(`/admin/notifications${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/admin/notifications/:id
 * @param {string} id - Notification ID or Mongo _id
 * @returns {Promise<{ success: boolean, notification: object }>}
 */
export async function adminGetNotificationById(id) {
  return apiFetch(`/admin/notifications/${encodeURIComponent(id)}`);
}

// ── Blocked Users endpoints ──────────────────────────────────

/**
 * GET /api/v1/admin/blocked-users
 * @param {object} params - { page, limit, search, status, reason, startDate, endDate }
 * @returns {Promise<{ success: boolean, blockedUsers: Array, counts: object, pagination: object }>}
 */
export async function adminGetBlockedUsers(params = {}) {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    query.set('limit', params.limit);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.status && typeof params.status === 'string' && params.status !== 'all') {
    query.set('status', params.status.trim());
  }
  if (params.reason && typeof params.reason === 'string' && params.reason.trim()) {
    query.set('reason', params.reason.trim());
  }
  if (params.startDate) {
    query.set('startDate', params.startDate);
  }
  if (params.endDate) {
    query.set('endDate', params.endDate);
  }

  const qs = query.toString();
  return apiFetch(`/admin/blocked-users${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/admin/blocked-users/:id
 * @param {string} id - Block ID or Mongo _id
 * @returns {Promise<{ success: boolean, blockedUser: object }>}
 */
export async function adminGetBlockedUserById(id) {
  return apiFetch(`/admin/blocked-users/${encodeURIComponent(id)}`);
}

// ── Group Voice Rooms endpoints ──────────────────────────────

/**
 * GET /api/v1/admin/group-voice-rooms
 * @param {object} params - { page, limit, search, accessType, status }
 * @returns {Promise<{ success: boolean, groupVoiceRooms: Array, counts: object, pagination: object }>}
 */
export async function adminGetGroupVoiceRooms(params = {}) {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    query.set('limit', params.limit);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.accessType && typeof params.accessType === 'string' && params.accessType !== 'all') {
    query.set('accessType', params.accessType.trim());
  }
  if (params.status && typeof params.status === 'string' && params.status !== 'all') {
    query.set('status', params.status.trim());
  }

  const qs = query.toString();
  return apiFetch(`/admin/group-voice-rooms${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/admin/group-voice-rooms/:id
 * @param {string} id - GroupVoiceRoom ID or Mongo _id
 * @returns {Promise<{ success: boolean, groupVoiceRoom: object }>}
 */
export async function adminGetGroupVoiceRoomById(id) {
  return apiFetch(`/admin/group-voice-rooms/${encodeURIComponent(id)}`);
}

/**
 * PATCH /api/v1/admin/group-voice-rooms/:id/status
 * Moderation action: Close/Disable room.
 * @param {string} id - GroupVoiceRoom ID or Mongo _id
 * @param {string} status - 'closed' | 'ended' | 'active'
 * @returns {Promise<{ success: boolean, message: string, groupVoiceRoom: object }>}
 */
export async function adminUpdateGroupVoiceRoomStatus(id, status) {
  return apiFetch(`/admin/group-voice-rooms/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

/**
 * DELETE /api/v1/admin/group-voice-rooms/:id
 * Moderation action: Remove closed/ended room record.
 * @param {string} id - GroupVoiceRoom ID or Mongo _id
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function adminDeleteGroupVoiceRoom(id) {
  return apiFetch(`/admin/group-voice-rooms/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

// ── Subscription Plans endpoints ─────────────────────────────

/**
 * GET /api/v1/admin/plans
 * @param {object} params - { page, limit, search, isActive, status }
 * @returns {Promise<{ success: boolean, plans: Array, data: Array, pagination: object }>}
 */
export async function adminGetPlans(params = {}) {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    query.set('limit', params.limit);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.isActive !== undefined && params.isActive !== null && params.isActive !== 'all') {
    query.set('isActive', params.isActive);
  }
  if (params.status && typeof params.status === 'string' && params.status !== 'all') {
    query.set('status', params.status.trim());
  }

  const qs = query.toString();
  return apiFetch(`/admin/plans${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/admin/plans/:id
 * @param {string} id - Plan ID or Mongo _id
 * @returns {Promise<{ success: boolean, plan: object, data: object }>}
 */
export async function adminGetPlan(id) {
  return apiFetch(`/admin/plans/${encodeURIComponent(id)}`);
}

/**
 * POST /api/v1/admin/plans
 * @param {object} payload - Plan creation payload
 * @returns {Promise<{ success: boolean, message: string, plan: object, data: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminCreatePlan(payload) {
  return apiFetch('/admin/plans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * PUT /api/v1/admin/plans/:id
 * @param {string} id - Plan ID or Mongo _id
 * @param {object} payload - Plan update payload
 * @returns {Promise<{ success: boolean, message: string, plan: object, data: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminUpdatePlan(id, payload) {
  return apiFetch(`/admin/plans/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH /api/v1/admin/plans/:id/status
 * @param {string} id - Plan ID or Mongo _id
 * @param {{ isActive?: boolean, status?: string }} payload
 * @returns {Promise<{ success: boolean, message: string, plan: object, data: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminUpdatePlanStatus(id, payload) {
  return apiFetch(`/admin/plans/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /api/v1/admin/plans/:id
 * @param {string} id - Plan ID or Mongo _id
 * @returns {Promise<{ success: boolean, message: string }>}
 * @throws {Error} with server error message on failure
 */
export async function adminDeletePlan(id) {
  return apiFetch(`/admin/plans/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ── Subscriptions endpoints ──────────────────────────────────

/**
 * GET /api/v1/admin/subscriptions
 * @param {object} params - { page, limit, search, status, plan }
 * @returns {Promise<{ success: boolean, subscriptions: Array, data: Array, pagination: object }>}
 */
export async function adminGetSubscriptions(params = {}) {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    query.set('page', params.page);
  }
  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    query.set('limit', params.limit);
  }
  if (params.search && typeof params.search === 'string' && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.status && typeof params.status === 'string' && params.status !== 'all') {
    query.set('status', params.status.trim());
  }
  if (params.plan && typeof params.plan === 'string' && params.plan !== 'all') {
    query.set('plan', params.plan.trim());
  }

  const qs = query.toString();
  return apiFetch(`/admin/subscriptions${qs ? `?${qs}` : ''}`);
}

/**
 * GET /api/v1/admin/subscriptions/:id
 * @param {string} id - Subscription ID or Mongo _id
 * @returns {Promise<{ success: boolean, subscription: object, data: object }>}
 */
export async function adminGetSubscription(id) {
  return apiFetch(`/admin/subscriptions/${encodeURIComponent(id)}`);
}

/**
 * POST /api/v1/admin/subscriptions
 * @param {object} payload - { userId, planId, status, startDate, endDate, autoRenew }
 * @returns {Promise<{ success: boolean, message: string, subscription: object, data: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminCreateSubscription(payload) {
  return apiFetch('/admin/subscriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * PUT /api/v1/admin/subscriptions/:id
 * @param {string} id - Subscription ID or Mongo _id
 * @param {object} payload - { planId, status, startDate, endDate, autoRenew }
 * @returns {Promise<{ success: boolean, message: string, subscription: object, data: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminUpdateSubscription(id, payload) {
  return apiFetch(`/admin/subscriptions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH /api/v1/admin/subscriptions/:id/status
 * @param {string} id - Subscription ID or Mongo _id
 * @param {{ status: string }} payload
 * @returns {Promise<{ success: boolean, message: string, subscription: object, data: object }>}
 * @throws {Error} with server error message on failure
 */
export async function adminUpdateSubscriptionStatus(id, payload) {
  return apiFetch(`/admin/subscriptions/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /api/v1/admin/subscriptions/:id
 * @param {string} id - Subscription ID or Mongo _id
 * @returns {Promise<{ success: boolean, message: string }>}
 * @throws {Error} with server error message on failure
 */
export async function adminDeleteSubscription(id) {
  return apiFetch(`/admin/subscriptions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}


