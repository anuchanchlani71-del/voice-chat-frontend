/**
 * Friends & Friend Requests API Service
 * Connects frontend user flows to real backend MongoDB endpoints.
 */

import { getUserToken } from './authApi';

const BASE_URL = 'http://localhost:5000/api/v1';

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
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

/**
 * 1. Send friend request
 * POST /api/v1/friends/requests
 * @param {string} recipientId - Target user custom id or MongoDB _id
 * @param {string} [personalNote] - Optional intro note
 */
export async function sendFriendRequest(recipientId, personalNote = '') {
  return apiFetch('/friends/requests', {
    method: 'POST',
    body: JSON.stringify({ recipientId, personalNote })
  });
}

/**
 * 2. Get incoming and outgoing pending friend requests
 * GET /api/v1/friends/requests
 * @returns {Promise<{ incoming: Array, sent: Array, incomingCount: number, sentCount: number }>}
 */
export async function getFriendRequests() {
  return apiFetch('/friends/requests', {
    method: 'GET'
  });
}

/**
 * 3. Accept incoming friend request
 * PATCH /api/v1/friends/requests/:id/accept
 * @param {string} requestId
 */
export async function acceptFriendRequest(requestId) {
  return apiFetch(`/friends/requests/${encodeURIComponent(requestId)}/accept`, {
    method: 'PATCH'
  });
}

/**
 * 4. Reject / Decline incoming friend request
 * PATCH /api/v1/friends/requests/:id/reject
 * @param {string} requestId
 */
export async function rejectFriendRequest(requestId) {
  return apiFetch(`/friends/requests/${encodeURIComponent(requestId)}/reject`, {
    method: 'PATCH'
  });
}

/**
 * 5. Cancel sent outgoing friend request
 * DELETE /api/v1/friends/requests/:id
 * @param {string} requestId
 */
export async function cancelFriendRequest(requestId) {
  return apiFetch(`/friends/requests/${encodeURIComponent(requestId)}`, {
    method: 'DELETE'
  });
}

/**
 * 6. Get authenticated user's active friendships
 * GET /api/v1/friends
 * @returns {Promise<{ friends: Array, count: number }>}
 */
export async function getFriends() {
  return apiFetch('/friends', {
    method: 'GET'
  });
}

/**
 * 7. Remove/unfriend an active friend
 * DELETE /api/v1/friends/:friendId
 * @param {string} friendId - Friend user custom id or MongoDB _id
 */
export async function removeFriend(friendId) {
  return apiFetch(`/friends/${encodeURIComponent(friendId)}`, {
    method: 'DELETE'
  });
}

/**
 * 8. Retrieve friendship status with a specific user
 * GET /api/v1/friends/status/:targetUserId
 * @param {string} targetUserId - Target user custom id or MongoDB _id
 * @returns {Promise<{ status: 'none' | 'pending_sent' | 'pending_received' | 'friends', isSelf?: boolean, requestId?: string }>}
 */
export async function getFriendStatus(targetUserId) {
  return apiFetch(`/friends/status/${encodeURIComponent(targetUserId)}`, {
    method: 'GET'
  });
}
