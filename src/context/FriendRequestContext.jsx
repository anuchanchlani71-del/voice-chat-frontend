import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getFriends,
  removeFriend,
  getFriendStatus
} from '../services/friendApi';
import { MOCK_AVATARS } from '../data/userMockData';

const FriendRequestContext = createContext(null);

// Normalize a friend / user object so that UI properties like avatar, avatarBg, status, statusLabel are guaranteed
function normalizeFriendUser(u) {
  if (!u) return null;
  const avatarFallback = MOCK_AVATARS[0];
  const avatarObj = MOCK_AVATARS.find(a => a.id === u.avatarId) || avatarFallback;
  return {
    ...u,
    id: u.id,
    fullName: u.fullName || u.username || 'Voice Friend',
    username: u.username || 'friend',
    avatar: u.avatar && u.avatar.length <= 4 ? u.avatar : (u.avatar && (u.avatar.startsWith('http') || u.avatar.startsWith('/')) ? u.avatar : avatarObj.emoji),
    avatarBg: u.avatarBg || avatarObj.bg,
    status: u.voiceStatus || (u.isOnline ? 'online' : 'offline'),
    statusLabel: u.voiceStatus === 'available_to_talk' ? 'Available to Talk' : (u.isOnline ? 'Online' : 'Offline'),
    interests: Array.isArray(u.interests) ? u.interests : [],
    location: u.location || '',
    conversationStyle: u.conversationStyle || 'Casual chats',
    isOnline: !!u.isOnline
  };
}

// Format relative/readable date string
function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Recently';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch (e) {
    return 'Recently';
  }
}

export function FriendRequestProvider({ children }) {
  const { user, token } = useAuth();

  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [connectedFriends, setConnectedFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all friends and requests from real backend APIs
  const refetchAll = useCallback(async () => {
    if (!token) {
      setIncomingRequests([]);
      setSentRequests([]);
      setConnectedFriends([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [requestsRes, friendsRes] = await Promise.all([
        getFriendRequests().catch(err => {
          console.error('[FriendContext] Failed to load requests:', err.message);
          return { incoming: [], sent: [] };
        }),
        getFriends().catch(err => {
          console.error('[FriendContext] Failed to load friends:', err.message);
          return { friends: [] };
        })
      ]);

      if (requestsRes) {
        const normalizedIncoming = (requestsRes.incoming || []).map(r => ({
          ...r,
          id: r.id,
          user: normalizeFriendUser(r.user),
          createdAt: formatRelativeTime(r.requestedAt || r.createdAt),
          personalNote: r.personalNote || ''
        }));

        const normalizedSent = (requestsRes.sent || []).map(r => ({
          ...r,
          id: r.id,
          user: normalizeFriendUser(r.user),
          createdAt: formatRelativeTime(r.requestedAt || r.createdAt),
          personalNote: r.personalNote || '',
          status: r.status || 'pending'
        }));

        setIncomingRequests(normalizedIncoming);
        setSentRequests(normalizedSent);
      }

      if (friendsRes) {
        const normalizedFriends = (friendsRes.friends || []).map(normalizeFriendUser);
        setConnectedFriends(normalizedFriends);
      }
    } catch (err) {
      console.error('[FriendContext] Error refetching data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Refetch when authenticated user state changes
  useEffect(() => {
    if (token) {
      refetchAll();
    } else {
      setIncomingRequests([]);
      setSentRequests([]);
      setConnectedFriends([]);
    }
  }, [token, user?.id, refetchAll]);

  // Send a connection request to a user
  const sendRequest = useCallback(async (userOrRecipientId, personalNote = '') => {
    if (!userOrRecipientId) return;
    const recipientId = typeof userOrRecipientId === 'string'
      ? userOrRecipientId
      : userOrRecipientId.id;

    if (!recipientId) return;

    try {
      setError(null);
      await sendFriendRequest(recipientId, personalNote);
      await refetchAll();
    } catch (err) {
      console.error('[FriendContext] Send friend request failed:', err.message);
      setError(err.message);
      throw err;
    }
  }, [refetchAll]);

  // Accept incoming friend request
  const acceptRequest = useCallback(async (requestId) => {
    if (!requestId) return;
    try {
      setError(null);
      // Optimistic update
      setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
      await acceptFriendRequest(requestId);
      await refetchAll();
    } catch (err) {
      console.error('[FriendContext] Accept request failed:', err.message);
      setError(err.message);
      await refetchAll();
      throw err;
    }
  }, [refetchAll]);

  // Decline/Reject incoming friend request
  const declineRequest = useCallback(async (requestId) => {
    if (!requestId) return;
    try {
      setError(null);
      // Optimistic update
      setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
      await rejectFriendRequest(requestId);
      await refetchAll();
    } catch (err) {
      console.error('[FriendContext] Decline request failed:', err.message);
      setError(err.message);
      await refetchAll();
      throw err;
    }
  }, [refetchAll]);

  // Cancel an outgoing sent request (supports requestId OR recipient userId)
  const cancelRequest = useCallback(async (userIdOrReqId) => {
    if (!userIdOrReqId) return;
    try {
      setError(null);
      const targetReq = sentRequests.find(r =>
        r.id === userIdOrReqId ||
        r.user?.id === userIdOrReqId ||
        r.recipient?.id === userIdOrReqId
      );
      const reqIdToCancel = targetReq ? targetReq.id : userIdOrReqId;

      // Optimistic update
      setSentRequests(prev =>
        prev.filter(r => r.id !== reqIdToCancel && r.user?.id !== userIdOrReqId)
      );

      await cancelFriendRequest(reqIdToCancel);
      await refetchAll();
    } catch (err) {
      console.error('[FriendContext] Cancel request failed:', err.message);
      setError(err.message);
      await refetchAll();
      throw err;
    }
  }, [sentRequests, refetchAll]);

  // Remove an active friend connection
  const removeFriendAction = useCallback(async (friendIdOrUser) => {
    if (!friendIdOrUser) return;
    const friendId = typeof friendIdOrUser === 'string'
      ? friendIdOrUser
      : friendIdOrUser.id;

    if (!friendId) return;

    try {
      setError(null);
      // Optimistic update
      setConnectedFriends(prev => prev.filter(f => f.id !== friendId));
      await removeFriend(friendId);
      await refetchAll();
    } catch (err) {
      console.error('[FriendContext] Remove friend failed:', err.message);
      setError(err.message);
      await refetchAll();
      throw err;
    }
  }, [refetchAll]);

  // Check if a request has already been sent to a specific user
  const isRequestSent = useCallback((userId) => {
    if (!userId) return false;
    return sentRequests.some(r => r.user?.id === userId || r.recipient?.id === userId);
  }, [sentRequests]);

  // Check if an incoming request from a specific user exists
  const isIncomingRequest = useCallback((userId) => {
    if (!userId) return false;
    return incomingRequests.some(r => r.user?.id === userId || r.requester?.id === userId);
  }, [incomingRequests]);

  // Get incoming request object for a specific user
  const getIncomingRequest = useCallback((userId) => {
    if (!userId) return null;
    return incomingRequests.find(r => r.user?.id === userId || r.requester?.id === userId) || null;
  }, [incomingRequests]);

  // Check if a user is an accepted friend
  const isFriend = useCallback((userId) => {
    if (!userId) return false;
    return connectedFriends.some(u => u.id === userId);
  }, [connectedFriends]);

  const value = {
    incomingRequests,
    sentRequests,
    connectedFriends,
    friendsCount: connectedFriends.length,
    incomingCount: incomingRequests.length,
    sentCount: sentRequests.length,
    isLoading,
    error,
    acceptRequest,
    declineRequest,
    rejectRequest: declineRequest, // Alias for declineRequest
    sendRequest,
    cancelRequest,
    removeFriend: removeFriendAction,
    isRequestSent,
    isIncomingRequest,
    getIncomingRequest,
    isFriend,
    refetchAll,
    refetchFriends: refetchAll,
    refetchRequests: refetchAll
  };

  return (
    <FriendRequestContext.Provider value={value}>
      {children}
    </FriendRequestContext.Provider>
  );
}

export function useFriendRequests() {
  const context = useContext(FriendRequestContext);
  if (!context) {
    return {
      incomingRequests: [],
      sentRequests: [],
      connectedFriends: [],
      friendsCount: 0,
      incomingCount: 0,
      sentCount: 0,
      isLoading: false,
      error: null,
      acceptRequest: async () => {},
      declineRequest: async () => {},
      rejectRequest: async () => {},
      sendRequest: async () => {},
      cancelRequest: async () => {},
      removeFriend: async () => {},
      isRequestSent: () => false,
      isIncomingRequest: () => false,
      getIncomingRequest: () => null,
      isFriend: () => false,
      refetchAll: async () => {},
      refetchFriends: async () => {},
      refetchRequests: async () => {}
    };
  }
  return context;
}
