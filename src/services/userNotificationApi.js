/**
 * User Notifications REST API Service
 * Connects frontend user notification center to real backend MongoDB endpoints.
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
 * 1. GET /api/v1/notifications
 * Fetch user's notifications list
 * @param {Object} [params] - { page, limit, category, status, unreadOnly }
 */
export async function getNotificationsApi(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.status) query.set('status', params.status);
  if (params.unreadOnly) query.set('unreadOnly', 'true');

  const queryString = query.toString();
  return apiFetch(`/notifications${queryString ? `?${queryString}` : ''}`, {
    method: 'GET'
  });
}

/**
 * 2. PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read
 * @param {string} notificationId
 */
export async function markNotificationAsReadApi(notificationId) {
  return apiFetch(`/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH'
  });
}

/**
 * 3. POST /api/v1/notifications/read-all
 * Mark all notifications for the authenticated user as read
 */
export async function markAllNotificationsAsReadApi() {
  return apiFetch('/notifications/read-all', {
    method: 'POST'
  });
}

/**
 * 4. DELETE /api/v1/notifications/:id
 * Delete a single notification
 * @param {string} notificationId
 */
export async function deleteNotificationApi(notificationId) {
  return apiFetch(`/notifications/${encodeURIComponent(notificationId)}`, {
    method: 'DELETE'
  });
}
