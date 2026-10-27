/**
 * User Safety & Privacy API Service
 * Connects frontend user safety actions (Block, Unblock, Blocked Users List, Report) to backend endpoints.
 * Uses authenticated fetch with localStorage userToken.
 */

import { getUserToken } from './authApi';

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

/**
 * POST /api/v1/users/block
 * Block another user.
 * @param {string} targetUserId - Target user custom string ID or Mongo _id
 * @param {string} [reason] - Optional block reason
 * @returns {Promise<{ success: boolean, message: string, block: object }>}
 */
export async function blockUserApi(targetUserId, reason = '') {
  if (!targetUserId) {
    throw new Error('User ID is required to block.');
  }

  return apiFetch('/users/block', {
    method: 'POST',
    body: JSON.stringify({
      blockedUserId: targetUserId,
      reason
    })
  });
}

/**
 * POST /api/v1/users/unblock
 * Unblock a previously blocked user.
 * @param {string} targetUserId - Target user ID to unblock
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function unblockUserApi(targetUserId) {
  if (!targetUserId) {
    throw new Error('User ID is required to unblock.');
  }

  return apiFetch('/users/unblock', {
    method: 'POST',
    body: JSON.stringify({
      blockedUserId: targetUserId
    })
  });
}

/**
 * GET /api/v1/users/blocked
 * Fetch authenticated user's list of active blocked users from MongoDB.
 * @returns {Promise<{ success: boolean, blockedUsers: Array, count: number }>}
 */
export async function getBlockedUsersApi() {
  return apiFetch('/users/blocked', {
    method: 'GET'
  });
}

/**
 * POST /api/v1/users/report
 * Report a user for moderation review.
 * @param {string} targetUserId - Reported user ID
 * @param {string} reasonCategory - Category/Reason string
 * @param {string} [description] - Optional details/description
 * @returns {Promise<{ success: boolean, message: string, report: object }>}
 */
export async function reportUserApi(targetUserId, reasonCategory, description = '') {
  if (!targetUserId) {
    throw new Error('User ID is required to submit a report.');
  }
  if (!reasonCategory) {
    throw new Error('Please select a reason for reporting.');
  }

  return apiFetch('/users/report', {
    method: 'POST',
    body: JSON.stringify({
      reportedUserId: targetUserId,
      reasonCategory,
      description
    })
  });
}
