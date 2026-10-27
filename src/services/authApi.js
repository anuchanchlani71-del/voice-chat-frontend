/**
 * User Authentication API Service
 * Minimal fetch-based utility for User Side backend calls.
 * Zero external dependencies.
 */

const BASE_URL = 'http://localhost:5000/api/v1';

// ── Token storage helpers ────────────────────────────────────
// Convention: User JWT stored in localStorage under 'userToken'
// Note: 'adminToken' is strictly preserved for Admin Panel.
const TOKEN_KEY = 'userToken';

export function getUserToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setUserToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeUserToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Core fetch helper ────────────────────────────────────────
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

// ── Auth API Functions ───────────────────────────────────────

/**
 * Register a new user
 * POST /api/v1/auth/register
 * @param {Object} userData - { fullName, username, email, password }
 */
export async function registerUser({ fullName, username, email, password }) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, username, email, password })
  });

  if (data.token) {
    setUserToken(data.token);
  }

  return data;
}

/**
 * Authenticate user credentials
 * POST /api/v1/auth/login
 * @param {Object} credentials - { identifier, password }
 */
export async function loginUser({ identifier, password }) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password })
  });

  if (data.token) {
    setUserToken(data.token);
  }

  return data;
}

/**
 * Get current authenticated user profile
 * GET /api/v1/auth/me
 */
export async function getCurrentUser() {
  return apiFetch('/auth/me', {
    method: 'GET'
  });
}

/**
 * Complete user onboarding with selected interests
 * PATCH /api/v1/users/me/onboarding
 * @param {Array<string>} interests
 */
export async function completeOnboarding(interests) {
  try {
    return await apiFetch('/users/me/onboarding', {
      method: 'PATCH',
      body: JSON.stringify({ interests })
    });
  } catch (err) {
    if (err.message && (err.message.includes('Route not found') || err.message.includes('404'))) {
      return await apiFetch('/auth/me/onboarding', {
        method: 'PATCH',
        body: JSON.stringify({ interests })
      });
    }
    throw err;
  }
}

/**
 * Update authenticated user profile
 * PATCH /api/v1/users/me
 * @param {Object} profileData
 */
export async function updateProfile(profileData) {
  try {
    return await apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    });
  } catch (err) {
    if (err.message && (err.message.includes('Route not found') || err.message.includes('404'))) {
      return await apiFetch('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(profileData)
      });
    }
    throw err;
  }
}

/**
 * Upload custom profile photo using FormData
 * POST /api/v1/users/upload-avatar
 * @param {File} file
 */
export async function uploadAvatar(file) {
  const url = `${BASE_URL}/users/upload-avatar`;
  const token = getUserToken();

  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || `Upload failed with status ${response.status}`);
  }

  return data;
}

// Object export for flexible import conventions
export const authApi = {
  register: registerUser,
  login: loginUser,
  getMe: getCurrentUser,
  completeOnboarding,
  updateProfile,
  uploadAvatar,
  getToken: getUserToken,
  setToken: setUserToken,
  removeToken: removeUserToken
};

export default authApi;


