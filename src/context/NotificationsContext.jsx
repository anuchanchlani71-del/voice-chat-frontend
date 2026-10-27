import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getNotificationsApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  deleteNotificationApi
} from '../services/userNotificationApi';
import { getUserToken } from '../services/authApi';
import { useSocket } from './SocketContext';

const NotificationsContext = createContext(null);

// Normalize backend Notification document into frontend UI shape
function normalizeNotification(item) {
  if (!item) return null;
  const sender = item.sender || {};
  const metadata = item.metadata || {};
  const isUnread = !item.isRead;

  let category = 'messages';
  let actionUrl = '/notifications';
  let actionLabel = 'View Details';
  let secondaryActionUrl = null;
  let secondaryActionLabel = null;

  if (item.type === 'friend_request') {
    category = 'requests';
    actionUrl = '/requests';
    actionLabel = 'View Request';
  } else if (item.type === 'friend_accepted') {
    category = 'requests';
    actionUrl = sender.id ? `/messages/${sender.id}` : '/messages';
    actionLabel = 'Message';
    if (sender.id) {
      secondaryActionUrl = `/voice/${sender.id}`;
      secondaryActionLabel = 'Voice Chat';
    }
  } else if (item.type === 'call_alert' || item.type === 'call_missed') {
    category = 'voice';
    actionUrl = '/call-history';
    actionLabel = 'Call History';
    if (sender.id) {
      secondaryActionUrl = `/voice/${sender.id}`;
      secondaryActionLabel = 'Call Back';
    }
  } else if (item.type === 'system_alert') {
    category = 'messages';
    actionUrl = metadata.conversationId ? `/messages/${metadata.conversationId}` : (sender.id ? `/messages/${sender.id}` : '/messages');
    actionLabel = 'Reply';
  } else if (item.type === 'room_invite' || item.type === 'room_reminder') {
    category = 'rooms';
    actionUrl = metadata.roomId ? `/room/${metadata.roomId}` : '/rooms';
    actionLabel = 'Join Room';
  }

  return {
    id: item.id || item._id,
    type: item.type,
    category,
    user: {
      id: sender.id || sender._id || 'usr_unknown',
      fullName: sender.fullName || sender.username || 'Voice Member',
      username: sender.username || 'member',
      avatar: sender.avatar || '🎧',
      avatarBg: sender.avatarBg || 'var(--user-brand-gradient)'
    },
    title: item.title,
    message: item.message,
    timestamp: item.date || 'Recently',
    unread: isUnread,
    actionUrl,
    actionLabel,
    secondaryActionUrl,
    secondaryActionLabel,
    metadata
  };
}

export function NotificationsProvider({ children }) {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch real notifications from REST backend
  const fetchNotifications = useCallback(async () => {
    const token = getUserToken();
    if (!token) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await getNotificationsApi({ page: 1, limit: 100 });
      const rawList = res.notifications || res.data || [];
      const normalized = Array.isArray(rawList) ? rawList.map(normalizeNotification).filter(Boolean) : [];
      setNotifications(normalized);
    } catch (err) {
      console.warn('Failed to load notifications from REST API:', err.message);
      setError(err?.response?.error || err?.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount & token changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Realtime Socket Listeners & Reconnect Recovery ──────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotificationNew = (data) => {
      if (!data || !data.notification) return;
      const normalized = normalizeNotification(data.notification);
      if (!normalized) return;

      setNotifications(prev => {
        const incomingId = normalized.id;
        const exists = prev.some(n => n.id === incomingId);
        if (exists) return prev; // Deduplication by notification ID
        return [normalized, ...prev];
      });
    };

    const handleNotificationRead = (data) => {
      if (!data || !data.notificationId) return;
      setNotifications(prev =>
        prev.map(n => (n.id === data.notificationId ? { ...n, unread: false } : n))
      );
    };

    const handleNotificationReadAll = () => {
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    };

    const handleNotificationDeleted = (data) => {
      if (!data || !data.notificationId) return;
      setNotifications(prev => prev.filter(n => n.id !== data.notificationId));
    };

    const handleReconnect = () => {
      // Reconnect Recovery: Refetch notifications from REST source of truth
      fetchNotifications();
    };

    socket.on('notification:new', handleNotificationNew);
    socket.on('notification:read', handleNotificationRead);
    socket.on('notification:read-all', handleNotificationReadAll);
    socket.on('notification:deleted', handleNotificationDeleted);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('notification:new', handleNotificationNew);
      socket.off('notification:read', handleNotificationRead);
      socket.off('notification:read-all', handleNotificationReadAll);
      socket.off('notification:deleted', handleNotificationDeleted);
      socket.off('connect', handleReconnect);
    };
  }, [socket, isConnected, fetchNotifications]);

  // Compute unread count from state
  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => n.unread).length;
  }, [notifications]);

  // Mark single notification as read via REST
  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return;

    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, unread: false } : n))
    );

    try {
      await markNotificationAsReadApi(notificationId);
    } catch (err) {
      console.warn('Failed to mark notification read on backend:', err.message);
    }
  }, []);

  // Mark all notifications as read via REST
  const markAllAsRead = useCallback(async () => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));

    try {
      await markAllNotificationsAsReadApi();
    } catch (err) {
      console.warn('Failed to mark all notifications read on backend:', err.message);
    }
  }, []);

  // Delete notification via REST
  const deleteNotification = useCallback(async (notificationId) => {
    if (!notificationId) return;

    // Optimistic UI update
    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    try {
      await deleteNotificationApi(notificationId);
    } catch (err) {
      console.warn('Failed to delete notification on backend:', err.message);
    }
  }, []);

  const value = {
    notifications,
    unreadNotificationCount,
    isLoading,
    error,
    refetchNotifications: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    return {
      notifications: [],
      unreadNotificationCount: 0,
      isLoading: false,
      error: null,
      refetchNotifications: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      deleteNotification: () => {}
    };
  }
  return context;
}
