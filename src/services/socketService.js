import { io } from 'socket.io-client';
import { getUserToken } from './authApi';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

/**
 * Connect to Socket.IO backend with authenticated user token.
 * Prevents duplicate socket connections across React re-renders.
 * @param {string} [overrideToken] - Optional token override
 * @returns {object|null} Socket instance
 */
export function connectSocket(overrideToken) {
  const token = overrideToken || getUserToken();

  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  // Reuse existing socket connection if already connected or connecting
  if (socket) {
    if (socket.connected || socket.connecting) {
      return socket;
    }
    // Update token auth in case session refreshed
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  // Create new socket instance
  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ['websocket', 'polling']
  });

  socket.connect();

  return socket;
}

/**
 * Disconnect and destroy active socket instance.
 */
export function disconnectSocket() {
  if (socket) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    } finally {
      socket = null;
    }
  }
}

/**
 * Get active socket instance.
 * @returns {object|null}
 */
export function getSocket() {
  return socket;
}

/**
 * Register an event listener safely.
 * @param {string} event - Event name
 * @param {Function} callback - Event handler callback
 */
export function onSocketEvent(event, callback) {
  if (socket) {
    socket.off(event, callback); // Remove existing listener to prevent duplicates
    socket.on(event, callback);
  }
}

/**
 * Remove an event listener.
 * @param {string} event - Event name
 * @param {Function} callback - Event handler callback
 */
export function offSocketEvent(event, callback) {
  if (socket) {
    socket.off(event, callback);
  }
}

/**
 * Emit a socket event if connected.
 * @param {string} event - Event name
 * @param {any} data - Event payload
 */
export function emitSocketEvent(event, data) {
  if (socket && socket.connected) {
    socket.emit(event, data);
  }
}

export const socketService = {
  connect: connectSocket,
  disconnect: disconnectSocket,
  getSocket,
  on: onSocketEvent,
  off: offSocketEvent,
  emit: emitSocketEvent
};

export default socketService;
