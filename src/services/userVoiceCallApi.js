/**
 * User Voice Calls REST API Service
 * Connects frontend user 1-to-1 voice call features to real backend MongoDB endpoints.
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
 * 1. POST /api/v1/calls
 * Initiate a 1-to-1 voice call record with a receiver (friend)
 * @param {string} receiverId - Target user ID to call
 * @param {string} [status='ringing'] - Initial status
 */
export async function initiateCallApi(receiverId, status = 'ringing') {
  return apiFetch('/calls', {
    method: 'POST',
    body: JSON.stringify({ receiverId, status })
  });
}

/**
 * 2. GET /api/v1/calls/history
 * Fetch authenticated user's call history
 * @param {number} [page=1]
 * @param {number} [limit=50]
 * @param {string} [status='all']
 */
export async function getCallHistoryApi(page = 1, limit = 50, status = 'all') {
  const statusParam = status && status !== 'all' ? `&status=${encodeURIComponent(status)}` : '';
  return apiFetch(`/calls/history?page=${page}&limit=${limit}${statusParam}`, {
    method: 'GET'
  });
}

/**
 * 3. GET /api/v1/calls/:id
 * Retrieve details for a specific call record
 * @param {string} callId
 */
export async function getCallDetailsApi(callId) {
  return apiFetch(`/calls/${encodeURIComponent(callId)}`, {
    method: 'GET'
  });
}

/**
 * 4. PATCH /api/v1/calls/:id
 * Update status, duration, endReason, audioQuality of a call
 * @param {string} callId
 * @param {Object} payload - { status, durationSeconds, endReason, audioQuality }
 */
export async function updateCallStatusApi(callId, payload = {}) {
  return apiFetch(`/calls/${encodeURIComponent(callId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}
