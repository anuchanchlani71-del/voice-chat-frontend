import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import {
  getConversationsApi,
  getConversationDetailsApi,
  createOrGetConversationApi,
  sendMessageApi,
  editMessageApi,
  deleteMessageApi,
  markConversationAsReadApi,
  deleteConversationApi
} from '../services/messageApi';
import { MOCK_AVATARS } from '../data/userMockData';

const MessagesContext = createContext(null);

// Helper to normalize user avatar and online status
function normalizeMessageFriend(u) {
  if (!u) {
    return {
      id: 'unknown',
      fullName: 'Voice Friend',
      username: 'friend',
      avatar: '🎧',
      avatarBg: 'var(--user-brand-gradient)',
      isOnline: false,
      status: 'offline'
    };
  }
  const avatarFallback = MOCK_AVATARS[0];
  const avatarObj = MOCK_AVATARS.find(a => a.id === u.avatarId) || avatarFallback;
  return {
    ...u,
    id: u.id || u._id,
    fullName: u.fullName || u.username || 'Voice Friend',
    username: u.username || 'friend',
    avatar: u.avatar && u.avatar.length <= 4 ? u.avatar : (u.avatar && (u.avatar.startsWith('http') || u.avatar.startsWith('/')) ? u.avatar : avatarObj.emoji),
    avatarBg: u.avatarBg || avatarObj.bg,
    status: u.voiceStatus || (u.isOnline ? 'online' : 'offline'),
    statusLabel: u.voiceStatus === 'available_to_talk' ? 'Available to Talk' : (u.isOnline ? 'Online' : 'Offline'),
    isOnline: !!u.isOnline
  };
}

// Format relative/readable date string for conversation snippets
function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
}

export function MessagesProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch conversations list from backend
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([]);
      setTotalUnreadCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await getConversationsApi();
      if (res.success && Array.isArray(res.conversations)) {
        const formatted = res.conversations.map(c => {
          const friend = normalizeMessageFriend(c.friend);
          return {
            ...c,
            id: c.id,
            friendId: c.friendId || (friend ? friend.id : null),
            friend,
            lastMessage: c.lastMessage || 'No messages yet',
            lastMessageAt: formatMessageTime(c.lastMessageAt),
            unreadCount: c.unreadCount || 0
          };
        });
        setConversations(formatted);
        setTotalUnreadCount(res.totalUnreadCount || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to real-time socket events for conversation list refresh
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessageNew = (data) => {
      fetchConversations();
    };

    const handleMessageRead = (data) => {
      fetchConversations();
    };

    const handleMessageDeleted = (data) => {
      fetchConversations();
    };

    socket.on('message:new', handleMessageNew);
    socket.on('message:read', handleMessageRead);
    socket.on('message:deleted', handleMessageDeleted);

    return () => {
      socket.off('message:new', handleMessageNew);
      socket.off('message:read', handleMessageRead);
      socket.off('message:deleted', handleMessageDeleted);
    };
  }, [socket, isConnected, fetchConversations]);

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationIdOrFriendId) => {
    if (!conversationIdOrFriendId) return;

    // Optimistically zero out unread count in local state
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === conversationIdOrFriendId || conv.friendId === conversationIdOrFriendId) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      })
    );

    try {
      await markConversationAsReadApi(conversationIdOrFriendId);
      // Refresh count from backend
      fetchConversations();
    } catch (err) {
      // ignore non-critical mark error
    }
  }, [fetchConversations]);

  // Clear/delete conversation
  const clearConversation = useCallback(async (conversationIdOrFriendId) => {
    if (!conversationIdOrFriendId) return;

    // Optimistically remove from state
    setConversations(prev =>
      prev.filter(c => c.id !== conversationIdOrFriendId && c.friendId !== conversationIdOrFriendId)
    );

    try {
      await deleteConversationApi(conversationIdOrFriendId);
      fetchConversations();
    } catch (err) {
      // Refetch if error
      fetchConversations();
      throw err;
    }
  }, [fetchConversations]);

  // Get or initialize conversation with a user
  const startOrGetConversation = useCallback(async (targetUserId) => {
    const existing = conversations.find(c => c.friendId === targetUserId || c.id === targetUserId);
    if (existing) return existing;

    const res = await createOrGetConversationApi(targetUserId);
    if (res.success && res.conversation) {
      const convData = res.conversation;
      const friend = normalizeMessageFriend(convData.friend);
      const formatted = {
        ...convData,
        id: convData.id,
        friendId: convData.friendId || (friend ? friend.id : targetUserId),
        friend,
        lastMessage: convData.lastMessage || 'No messages yet',
        lastMessageAt: formatMessageTime(convData.lastMessageAt),
        unreadCount: 0
      };
      setConversations(prev => [formatted, ...prev.filter(c => c.id !== formatted.id)]);
      return formatted;
    }
    return null;
  }, [conversations]);

  // Backwards compatibility helper for getConversation
  const getConversation = useCallback((friendIdOrConvId) => {
    return conversations.find(c => c.friendId === friendIdOrConvId || c.id === friendIdOrConvId) || null;
  }, [conversations]);

  const value = {
    conversations,
    totalUnreadCount,
    isLoading,
    error,
    fetchConversations,
    markAsRead,
    clearConversation,
    startOrGetConversation,
    getConversation
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    return {
      conversations: [],
      totalUnreadCount: 0,
      isLoading: false,
      error: null,
      fetchConversations: () => {},
      markAsRead: () => {},
      clearConversation: () => {},
      startOrGetConversation: () => Promise.resolve(null),
      getConversation: () => null
    };
  }
  return context;
}
