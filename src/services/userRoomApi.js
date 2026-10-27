/**
 * User Group Voice Rooms API Service
 * Connects frontend User Group Voice Rooms UI to backend endpoints.
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
 * GET /api/v1/rooms
 * Discover & list available group voice rooms from MongoDB.
 */
export async function getRoomsApi(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.topic) query.append('topic', params.topic);
  if (params.category) query.append('category', params.category);
  if (params.accessType && params.accessType !== 'all') query.append('accessType', params.accessType);
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);

  const queryString = query.toString();
  const path = `/rooms${queryString ? `?${queryString}` : ''}`;

  return apiFetch(path, { method: 'GET' });
}

/**
 * GET /api/v1/rooms/:id
 * Retrieve single group voice room details by ID.
 */
export async function getRoomByIdApi(id) {
  if (!id) throw new Error('Room ID is required.');
  return apiFetch(`/rooms/${id}`, { method: 'GET' });
}

/**
 * POST /api/v1/rooms
 * Create a new Group Voice Room.
 */
export async function createRoomApi(roomData) {
  return apiFetch('/rooms', {
    method: 'POST',
    body: JSON.stringify(roomData)
  });
}

/**
 * PATCH /api/v1/rooms/:id
 * Update an existing Group Voice Room (Host only).
 */
export async function updateRoomApi(id, roomData) {
  if (!id) throw new Error('Room ID is required.');
  return apiFetch(`/rooms/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(roomData)
  });
}

/**
 * POST /api/v1/rooms/:id/join
 * Join a Group Voice Room.
 */
export async function joinRoomApi(id) {
  if (!id) throw new Error('Room ID is required.');
  return apiFetch(`/rooms/${id}/join`, { method: 'POST' });
}

/**
 * POST /api/v1/rooms/:id/leave
 * Leave a Group Voice Room.
 */
export async function leaveRoomApi(id) {
  if (!id) throw new Error('Room ID is required.');
  return apiFetch(`/rooms/${id}/leave`, { method: 'POST' });
}

/**
 * POST /api/v1/rooms/:id/end or /close
 * End or close a Group Voice Room (Host only).
 */
export async function endRoomApi(id) {
  if (!id) throw new Error('Room ID is required.');
  return apiFetch(`/rooms/${id}/end`, { method: 'POST' });
}

export async function closeRoomApi(id) {
  if (!id) throw new Error('Room ID is required.');
  return apiFetch(`/rooms/${id}/close`, { method: 'POST' });
}

/**
 * POST /api/v1/rooms/:id/invite
 * Invite users to a Group Voice Room (Host only).
 */
export async function inviteUsersToRoomApi(id, targetUserIds) {
  if (!id) throw new Error('Room ID is required.');
  const body = Array.isArray(targetUserIds) ? { userIds: targetUserIds } : { targetUserId: targetUserIds };
  return apiFetch(`/rooms/${id}/invite`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

/**
 * GET /api/v1/rooms/:id/members
 * Retrieve sanitized room members and host info.
 */
export async function getRoomMembersApi(id) {
  if (!id) throw new Error('Room ID is required.');
  return apiFetch(`/rooms/${id}/members`, { method: 'GET' });
}
