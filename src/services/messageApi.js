/**
 * User Direct Messages API Service
 * Connects frontend user messaging to real backend MongoDB endpoints.
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
    const error = new Error(data.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.response = data;
    throw error;
  }

  return data;
}

/**
 * 1. GET /api/v1/messages/conversations
 * Fetch user's active conversations list
 */
export async function getConversationsApi() {
  return apiFetch('/messages/conversations', {
    method: 'GET'
  });
}

/**
 * 2. GET /api/v1/messages/conversations/:conversationId
 * Fetch single conversation details + paginated messages
 * @param {string} conversationId - Conversation custom string ID or Mongo _id
 * @param {number} [page=1]
 * @param {number} [limit=20]
 */
export async function getConversationDetailsApi(conversationId, page = 1, limit = 20) {
  return apiFetch(`/messages/conversations/${encodeURIComponent(conversationId)}?page=${page}&limit=${limit}`, {
    method: 'GET'
  });
}

/**
 * 3. POST /api/v1/messages/conversations
 * Create or find existing 1-on-1 conversation with a target user (friend)
 * @param {string} targetUserId
 */
export async function createOrGetConversationApi(targetUserId) {
  return apiFetch('/messages/conversations', {
    method: 'POST',
    body: JSON.stringify({ targetUserId })
  });
}

/**
 * 4. POST /api/v1/messages/conversations/:conversationId/messages
 * Send message in a conversation
 * @param {string} conversationId
 * @param {string} text
 */
export async function sendMessageApi(conversationId, text) {
  return apiFetch(`/messages/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text })
  });
}

/**
 * 5. PATCH /api/v1/messages/:messageId
 * Edit an existing message (sender only)
 * @param {string} messageId
 * @param {string} text
 */
export async function editMessageApi(messageId, text) {
  return apiFetch(`/messages/${encodeURIComponent(messageId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ text })
  });
}

/**
 * 6. DELETE /api/v1/messages/:messageId
 * Delete a message (sender only)
 * @param {string} messageId
 */
export async function deleteMessageApi(messageId) {
  return apiFetch(`/messages/${encodeURIComponent(messageId)}`, {
    method: 'DELETE'
  });
}

/**
 * 7. POST /api/v1/messages/conversations/:conversationId/read
 * Mark all messages in a conversation as read
 * @param {string} conversationId
 */
export async function markConversationAsReadApi(conversationId) {
  return apiFetch(`/messages/conversations/${encodeURIComponent(conversationId)}/read`, {
    method: 'POST'
  });
}

/**
 * 8. DELETE /api/v1/messages/conversations/:conversationId
 * Clear/hide conversation for current user
 * @param {string} conversationId
 */
export async function deleteConversationApi(conversationId) {
  return apiFetch(`/messages/conversations/${encodeURIComponent(conversationId)}`, {
    method: 'DELETE'
  });
}
