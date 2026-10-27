import React, { useState } from 'react';

const BACKEND_ORIGIN = 'http://localhost:5000';

/**
 * Resolves avatar relative paths against backend server origin.
 * e.g. "/uploads/avatars/avatar_123.png" -> "http://localhost:5000/uploads/avatars/avatar_123.png"
 * @param {string} avatar
 * @returns {string}
 */
export function getAvatarUrl(avatar) {
  if (!avatar || typeof avatar !== 'string') return '';
  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) {
    return avatar;
  }
  if (avatar.startsWith('/')) {
    return `${BACKEND_ORIGIN}${avatar}`;
  }
  return avatar;
}

/**
 * React Component for safe avatar image rendering with error fallback state
 */
export function AvatarImage({ avatar, alt = 'Avatar', fallbackEmoji = '🎧', style = {} }) {
  const [hasError, setHasError] = useState(false);
  const resolved = getAvatarUrl(avatar);

  const isImage = resolved && typeof resolved === 'string' && (
    resolved.startsWith('http://') ||
    resolved.startsWith('https://') ||
    resolved.startsWith('data:')
  );

  if (!isImage || hasError) {
    const isEmoji = avatar && typeof avatar === 'string' && avatar.length <= 4 && !avatar.startsWith('/') && !avatar.startsWith('http');
    return <span>{isEmoji ? avatar : fallbackEmoji}</span>;
  }

  return (
    <img
      src={resolved}
      alt={alt || 'Avatar'}
      onError={() => setHasError(true)}
      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block', ...style }}
    />
  );
}

/**
 * Universal helper function compatible with renderAvatar(avatar, alt, fallbackEmoji) calls.
 */
export function renderAvatar(avatar, alt = 'Avatar', fallbackEmoji = '🎧') {
  return <AvatarImage avatar={avatar} alt={alt} fallbackEmoji={fallbackEmoji} />;
}

export default getAvatarUrl;
