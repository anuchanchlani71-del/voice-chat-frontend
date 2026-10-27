import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from '../../router';
import { useAuth } from '../../context/AuthContext';
import { useMessages } from '../../context/MessagesContext';
import { useFriendRequests } from '../../context/FriendRequestContext';
import { useSocket } from '../../context/SocketContext';
import {
  getConversationDetailsApi,
  createOrGetConversationApi,
  sendMessageApi,
  editMessageApi,
  deleteMessageApi,
  markConversationAsReadApi,
  deleteConversationApi
} from '../../services/messageApi';
import {
  IconChevronLeft,
  IconPhoneCall,
  IconUsers,
  IconSparkles,
  IconCheck,
  IconX,
  IconSearch
} from '../../components/common/Icons';

// Inline Icons
const IconSend = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconEdit = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

import { renderAvatar } from '../../utils/avatarUtils';


// Format date timestamp for messages
function formatMsgTimestamp(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

// Format date separator label (e.g. Today, Yesterday, or Oct 8, 2026)
function formatMsgDateSeparator(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

export default function UserConversation() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { connectedFriends } = useFriendRequests();
  const { markAsRead, fetchConversations } = useMessages();
  const { socket, isConnected } = useSocket();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [friend, setFriend] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [inputMessage, setInputMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Real-time typing state
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [peerTypingUsername, setPeerTypingUsername] = useState('');
  const typingTimerRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Resolve friend profile from connectedFriends as fallback initial profile
  const knownFriend = useMemo(() => {
    return connectedFriends.find(f => f.id === userId || f._id === userId) || null;
  }, [connectedFriends, userId]);

  // Load conversation details & messages from backend
  const loadConversationData = useCallback(async (pageToLoad = 1, appendOlder = false) => {
    if (!userId) return;
    if (appendOlder) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setError(null);
    }

    try {
      let res;
      try {
        res = await getConversationDetailsApi(userId, pageToLoad, 30);
      } catch (firstErr) {
        // If searching by friendId failed to find existing conversation, attempt createOrGet
        if (firstErr.status === 404) {
          const createRes = await createOrGetConversationApi(userId);
          if (createRes.success && createRes.conversation) {
            res = await getConversationDetailsApi(createRes.conversation.id, pageToLoad, 30);
          } else {
            throw firstErr;
          }
        } else {
          throw firstErr;
        }
      }

      if (res.success) {
        setConversation(res.conversation);

        // Resolve friend from conversation participants
        const convFriend = res.conversation?.friend || knownFriend || null;
        if (convFriend) {
          setFriend(convFriend);
        }

        const newMsgs = res.messages || [];

        if (appendOlder) {
          setMessages(prev => {
            // Deduplicate older messages
            const existingIds = new Set(prev.map(m => m.id || m._id));
            const filteredNew = newMsgs.filter(m => !existingIds.has(m.id || m._id));
            return [...filteredNew, ...prev];
          });
        } else {
          setMessages(newMsgs);
        }

        if (res.pagination) {
          setPagination(res.pagination);
        }

        // Mark as read on backend & update local unread state
        if (res.conversation?.id) {
          markAsRead(res.conversation.id);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load conversation details.');
      if (knownFriend) {
        setFriend(knownFriend);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [userId, knownFriend, markAsRead]);

  useEffect(() => {
    loadConversationData(1, false);
  }, [loadConversationData]);

  // ── REALTIME SOCKET EVENT LISTENERS ────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessageNew = (data) => {
      if (!data || !data.message) return;
      const incomingMsg = data.message;
      const activeConvId = conversation?.id || conversation?._id;
      const matchConv = data.conversationId === activeConvId || data.conversationId === userId;
      const matchSender = (incomingMsg.sender?.id || incomingMsg.sender?._id || incomingMsg.sender) === userId;

      if (matchConv || matchSender) {
        setMessages(prev => {
          const incomingId = incomingMsg.id || incomingMsg._id;
          const exists = prev.some(m => (m.id || m._id) === incomingId);
          if (exists) return prev; // Message deduplication by messageId
          return [...prev, incomingMsg];
        });

        // Auto mark as read if viewing active thread
        if (activeConvId) {
          markAsRead(activeConvId);
        }
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
    };

    const handleMessageRead = (data) => {
      const activeConvId = conversation?.id || conversation?._id;
      if (data && (data.conversationId === activeConvId || data.conversationId === userId)) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      }
    };

    const handleMessageDeleted = (data) => {
      if (data && data.messageId) {
        setMessages(prev => prev.filter(m => (m.id || m._id) !== data.messageId));
      }
    };

    const handleTypingStart = (data) => {
      const activeConvId = conversation?.id || conversation?._id;
      if (data && (data.conversationId === activeConvId || data.conversationId === userId)) {
        const currentUserId = currentUser?.id || currentUser?._id;
        if (data.userId !== currentUserId) {
          setIsPeerTyping(true);
          setPeerTypingUsername(data.username || 'Friend');
        }
      }
    };

    const handleTypingStop = (data) => {
      const activeConvId = conversation?.id || conversation?._id;
      if (data && (data.conversationId === activeConvId || data.conversationId === userId)) {
        setIsPeerTyping(false);
      }
    };

    const handleReconnect = () => {
      // Reconnect Recovery: Refetch conversation thread from REST source of truth
      loadConversationData(1, false);
    };

    socket.on('message:new', handleMessageNew);
    socket.on('message:read', handleMessageRead);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('message:new', handleMessageNew);
      socket.off('message:read', handleMessageRead);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('connect', handleReconnect);
    };
  }, [socket, isConnected, conversation, userId, currentUser, markAsRead, loadConversationData]);

  // Scroll to bottom helper
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      scrollToBottom('auto');
    }
  }, [isLoading, userId]);

  // Load older messages handler
  const handleLoadOlderMessages = () => {
    if (pagination.page < pagination.totalPages && !isLoadingMore) {
      loadConversationData(pagination.page + 1, true);
    }
  };

  // Typing emitter helper
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputMessage(val);

    const activeConvId = conversation?.id || conversation?._id;
    if (socket && isConnected && activeConvId) {
      socket.emit('typing:start', { conversationId: activeConvId });

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socket.emit('typing:stop', { conversationId: activeConvId });
      }, 2000);
    }
  };

  // Send message handler
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    // Stop typing indicator on submit
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    const activeConvId = conversation?.id || conversation?._id;
    if (socket && isConnected && activeConvId) {
      socket.emit('typing:stop', { conversationId: activeConvId });
    }

    const textToSend = inputMessage.trim();
    setIsSending(true);
    setActionError(null);

    try {
      let activeId = conversation?.id;

      // If conversation doesn't exist yet in state, ensure created
      if (!activeId) {
        const createRes = await createOrGetConversationApi(userId);
        if (createRes.success && createRes.conversation) {
          activeId = createRes.conversation.id;
          setConversation(createRes.conversation);
        }
      }

      if (!activeId) {
        throw new Error('Could not establish conversation.');
      }

      const res = await sendMessageApi(activeId, textToSend);
      if (res.success && (res.data || res.messageData)) {
        const sentMsg = res.data || res.messageData;
        const msgId = sentMsg.id || sentMsg._id;

        setMessages(prev => {
          const exists = prev.some(m => (m.id || m._id) === msgId);
          if (exists) return prev;
          return [...prev, sentMsg];
        });

        setInputMessage('');
        fetchConversations();
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Edit message handler
  const handleStartEdit = (msg) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
  };

  const handleSaveEdit = async (msgId) => {
    if (!editingText.trim()) return;
    setActionError(null);
    try {
      const res = await editMessageApi(msgId, editingText.trim());
      if (res.success) {
        setMessages(prev =>
          prev.map(m => (m.id === msgId ? { ...m, text: editingText.trim(), isEdited: true } : m))
        );
        setEditingMessageId(null);
        setEditingText('');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to edit message.');
    }
  };

  // Delete message handler
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    setActionError(null);
    try {
      const res = await deleteMessageApi(msgId);
      if (res.success) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
        fetchConversations();
      }
    } catch (err) {
      setActionError(err.message || 'Failed to delete message.');
    }
  };

  // Clear conversation handler
  const handleClearConversation = async () => {
    if (!window.confirm('Are you sure you want to clear this conversation history?')) return;
    setActionError(null);
    try {
      const convIdToClear = conversation?.id || userId;
      await deleteConversationApi(convIdToClear);
      fetchConversations();
      navigate('/messages');
    } catch (err) {
      setActionError(err.message || 'Failed to clear conversation.');
    }
  };

  // ── Error State (Non-friend, Blocked, Suspended, Unauthorized) ───────
  if (error && !isLoading) {
    return (
      <div className="user-app-shell">
        <div className="user-ambient-blob-1" aria-hidden="true" />
        <div className="user-ambient-blob-2" aria-hidden="true" />
        <div className="chat-fullscreen-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="voice-ended-card" style={{ maxWidth: 480, padding: 32 }}>
            <div className="voice-ended-icon" style={{ background: 'rgba(255, 51, 133, 0.12)', color: 'var(--user-primary)', fontSize: 32 }}>
              🔒
            </div>
            <h2 className="voice-ended-title">Messaging Restricted</h2>
            <p className="voice-ended-sub" style={{ marginBottom: 20 }}>
              {error}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link
                to="/messages"
                className="btn-user-secondary"
                style={{ padding: '10px 20px', textDecoration: 'none', fontSize: '0.88rem' }}
              >
                Back to Messages
              </Link>
              <Link
                to="/friends"
                className="btn-user-primary"
                style={{ padding: '10px 24px', textDecoration: 'none', fontSize: '0.88rem' }}
              >
                My Friends
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const friendUser = friend || knownFriend || {
    id: userId,
    fullName: 'Voice Connection',
    username: 'friend',
    avatar: '🎧',
    avatarBg: 'var(--user-brand-gradient)',
    isOnline: false,
    status: 'offline'
  };

  const isAvailable = friendUser.voiceStatus === 'available_to_talk' || friendUser.status === 'available_to_talk';

  return (
    <div className="user-app-shell chat-app-shell">
      {/* Background ambient lighting */}
      <div className="user-ambient-blob-1" aria-hidden="true" />
      <div className="user-ambient-blob-2" aria-hidden="true" />

      <div className="chat-fullscreen-wrapper">

        {/* ── 1. Top Header Bar ──────────────────────────────────────── */}
        <header className="chat-conversation-header">
          {/* Back Button */}
          <Link to="/messages" className="chat-back-link" title="Back to Conversations">
            <IconChevronLeft size={18} />
            <span className="chat-back-label">Messages</span>
          </Link>

          {/* Center Friend Identity */}
          <div className="chat-header-profile-block">
            <div className="chat-header-avatar-wrap">
              <div
                className="chat-header-avatar"
                style={{ background: friendUser.avatarBg || 'var(--user-brand-gradient)' }}
              >
                {renderAvatar(friendUser.avatar, friendUser.fullName)}
              </div>
              <span
                className={`conv-status-dot ${isAvailable ? 'available' : friendUser.isOnline ? 'online' : 'offline'}`}
                title={isAvailable ? 'Available to Talk' : friendUser.isOnline ? 'Online' : 'Offline'}
              />
            </div>

            <div className="chat-header-info">
              <div className="chat-header-name-row">
                <span className="chat-header-name">{friendUser.fullName}</span>
                <span className="chat-header-handle">@{friendUser.username}</span>
              </div>
              <div className="chat-header-status-text">
                <span className="chat-status-indicator-dot" />
                <span>{isAvailable ? 'Available for Voice' : friendUser.isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="chat-header-actions">
            {/* Start 1-to-1 Voice Chat Action */}
            <Link
              to={`/voice/${friendUser.id}`}
              className="chat-voice-call-btn"
              title={`Start 1-to-1 Voice Chat with ${friendUser.fullName}`}
            >
              <IconPhoneCall size={16} />
              <span className="chat-btn-text">Voice Chat</span>
            </Link>

            {/* View Profile Action */}
            <Link
              to={`/user/${friendUser.id}`}
              className="chat-view-profile-btn"
              title={`View ${friendUser.fullName}'s Profile`}
            >
              <IconUsers size={16} />
              <span className="chat-btn-text">Profile</span>
            </Link>

            {/* Clear Conversation Action */}
            <button
              type="button"
              onClick={handleClearConversation}
              className="chat-view-profile-btn"
              title="Clear Conversation History"
              style={{ color: '#ff4d4d', borderColor: 'rgba(255, 77, 77, 0.3)' }}
            >
              <IconTrash size={15} />
            </button>
          </div>
        </header>

        {/* Action Error Alert */}
        {actionError && (
          <div className="chat-demo-disclaimer" style={{ background: 'rgba(255, 77, 77, 0.15)', color: '#ff4d4d' }}>
            <span>⚠️ {actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              style={{ background: 'none', border: 'none', color: '#ff4d4d', marginLeft: 10, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── 2. Message Thread Body ─────────────────────────────────── */}
        <main className="chat-messages-scroll-area">
          {/* Conversation Starter Pill */}
          <div className="chat-starter-pill">
            <IconSparkles size={14} style={{ color: 'var(--user-primary)' }} />
            <span>Mutual Voice Friends &bull; Connected</span>
          </div>

          {/* Load Older Messages Button (Pagination) */}
          {pagination.page < pagination.totalPages && (
            <div style={{ textAlign: 'center', margin: '12px 0' }}>
              <button
                type="button"
                onClick={handleLoadOlderMessages}
                disabled={isLoadingMore}
                className="btn-user-secondary"
                style={{ padding: '6px 16px', fontSize: '0.82rem', borderRadius: 16 }}
              >
                {isLoadingMore ? 'Loading older messages...' : 'Load older messages'}
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="chat-empty-thread">
              <span style={{ fontSize: 32 }}>🔄</span>
              <h4>Loading chat history...</h4>
            </div>
          ) : messages.length > 0 ? (
            /* Messages Feed */
            <div className="chat-thread-container">
              {messages.map((msg, idx) => {
                const msgSenderId = msg.sender?.id || msg.sender?._id || msg.sender;
                const isOutgoing =
                  msgSenderId === currentUser?.id ||
                  msgSenderId === currentUser?._id ||
                  msgSenderId === 'usr_demo_01';

                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const dateLabel = formatMsgDateSeparator(msg.createdAt);
                const prevDateLabel = prevMsg ? formatMsgDateSeparator(prevMsg.createdAt) : null;
                const showDate = !prevMsg || dateLabel !== prevDateLabel;

                const isEditingThis = editingMessageId === msg.id;

                return (
                  <React.Fragment key={msg.id || idx}>
                    {showDate && dateLabel && (
                      <div className="chat-date-separator">
                        <span>{dateLabel}</span>
                      </div>
                    )}

                    <div className={`chat-message-row ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                      {/* Incoming friend avatar */}
                      {!isOutgoing && (
                        <div
                          className="chat-message-avatar"
                          style={{ background: friendUser.avatarBg || 'var(--user-brand-gradient)' }}
                          title={friendUser.fullName}
                        >
                          {renderAvatar(friendUser.avatar, friendUser.fullName)}
                        </div>
                      )}

                      <div className="chat-bubble-wrap">
                        {isEditingThis ? (
                          /* Inline Edit Box */
                          <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="chat-composer-input"
                              style={{ padding: '6px 12px', fontSize: '0.88rem' }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(msg.id)}
                              className="btn-user-primary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingMessageId(null)}
                              className="btn-user-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          /* Standard Message Bubble */
                          <div className="chat-message-bubble">
                            <p className="chat-message-text">{msg.text}</p>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          <span className="chat-message-timestamp">
                            {formatMsgTimestamp(msg.createdAt)}
                            {msg.isEdited && <span style={{ marginLeft: 4, opacity: 0.7 }}>(edited)</span>}
                          </span>

                          {/* Message Edit / Delete Controls for Outgoing Messages */}
                          {isOutgoing && !isEditingThis && (
                            <div className="chat-msg-actions-hover" style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(msg)}
                                title="Edit message"
                                style={{ background: 'none', border: 'none', color: 'var(--user-text-muted)', cursor: 'pointer', opacity: 0.7, padding: 0 }}
                              >
                                <IconEdit size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                title="Delete message"
                                style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', opacity: 0.7, padding: 0 }}
                              >
                                <IconTrash size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              {/* Realtime Peer Typing Indicator */}
              {isPeerTyping && (
                <div style={{ padding: '4px 16px', fontSize: '0.8rem', color: 'var(--user-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="typing-pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--user-primary)', display: 'inline-block' }} />
                  <span>{peerTypingUsername || friendUser.fullName || 'Friend'} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="chat-empty-thread">
              <span style={{ fontSize: 32 }}>👋</span>
              <h4>Say hello to {(friendUser.fullName || 'friend').split(' ')[0]}!</h4>
              <p>Break the ice with a message or jump directly into a live voice chat.</p>
              {isPeerTyping && (
                <div style={{ marginTop: 12, fontSize: '0.82rem', color: 'var(--user-primary)' }}>
                  <span>{peerTypingUsername || 'Friend'} is typing...</span>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── 3. Bottom Message Composer ─────────────────────────────── */}
        <footer className="chat-composer-bar">
          <form onSubmit={handleSendMessage} className="chat-composer-form">
            <input
              ref={inputRef}
              type="text"
              placeholder={`Write a message to @${friendUser.username || 'friend'}...`}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              className="chat-composer-input"
              autoFocus
              aria-label="Write a message"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className={`chat-composer-send-btn ${inputMessage.trim() && !isSending ? 'active' : ''}`}
              title="Send Message (Enter)"
              aria-label="Send Message"
            >
              <IconSend size={18} />
            </button>
          </form>
        </footer>

      </div>
    </div>
  );
}
