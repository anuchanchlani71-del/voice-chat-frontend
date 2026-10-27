import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketService';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Connection manager based on Auth state
  useEffect(() => {
    let activeSocket = null;

    if (isAuthenticated && token) {
      activeSocket = connectSocket(token);
      setSocket(activeSocket);

      if (activeSocket) {
        setIsConnected(activeSocket.connected);

        const handleConnect = () => {
          setIsConnected(true);
          setConnectionError(null);
        };

        const handleDisconnect = (reason) => {
          setIsConnected(false);
        };

        const handleConnectError = (err) => {
          setIsConnected(false);
          setConnectionError(err?.message || 'Socket connection failed');
        };

        // ── GLOBAL INCOMING CALL REALTIME LISTENER ───────────────────────
        const handleGlobalCallIncoming = (data) => {
          if (!data) return;
          const callerObj = data.caller || data.call?.caller;
          const callerId = typeof callerObj === 'object' ? (callerObj.id || callerObj._id) : (callerObj || '');
          const callId = data.callId || data.call?.id || data.call?._id;

          if (!callerId) return;

          const currentPath = window.location.pathname;
          // Avoid navigating if already on the incoming call page or active call page with this user
          if (currentPath.includes(`/voice/incoming/${callerId}`) || currentPath.includes(`/voice/${callerId}`)) {
            return;
          }

          const targetUrl = `/voice/incoming/${callerId}${callId ? `?callId=${callId}` : ''}`;
          if (window.location.pathname !== targetUrl) {
            window.history.pushState({}, '', targetUrl);
            window.dispatchEvent(new Event('popstate'));
          }
        };

        activeSocket.on('connect', handleConnect);
        activeSocket.on('disconnect', handleDisconnect);
        activeSocket.on('connect_error', handleConnectError);
        activeSocket.on('call:incoming', handleGlobalCallIncoming);

        return () => {
          activeSocket.off('connect', handleConnect);
          activeSocket.off('disconnect', handleDisconnect);
          activeSocket.off('connect_error', handleConnectError);
          activeSocket.off('call:incoming', handleGlobalCallIncoming);
        };
      }
    } else {
      // Disconnect socket if user is unauthenticated or logged out
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
    }
  }, [isAuthenticated, token]);

  const manualConnect = useCallback(() => {
    if (token) {
      const s = connectSocket(token);
      setSocket(s);
    }
  }, [token]);

  const manualDisconnect = useCallback(() => {
    disconnectSocket();
    setSocket(null);
    setIsConnected(false);
  }, []);

  const value = {
    socket,
    isConnected,
    connectionError,
    connect: manualConnect,
    disconnect: manualDisconnect
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    return {
      socket: null,
      isConnected: false,
      connectionError: null,
      connect: () => {},
      disconnect: () => {}
    };
  }
  return context;
}
