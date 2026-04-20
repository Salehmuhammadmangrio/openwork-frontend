import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore, useChatStore } from '../../store';
import { Button, Avatar } from '../../components/common/UI';
import { formatRelative } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { getSocket } from '../../utils/socket';

export default function DashMessages() {
    const { conversationId } = useParams();
    const { user } = useAuthStore();
    const {
        conversations,
        activeConversationId,
        messages,
        fetchConversations,
        fetchMessages,
        addMessage,
        markMessagesAsRead,
        updateConversationUnreadCount,
        updateMessageStatus,
        setActive,
        loadingConversations,
        loadingMessages,
    } = useChatStore();

    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    // Group conversations by other user
    const groupedChats = useMemo(() => {
        const groups = {};
        conversations.forEach((conv) => {
            const other = conv.participants?.find((p) => p._id !== user?._id);
            if (!other) return;

            const key = other._id;
            if (!groups[key]) {
                groups[key] = {
                    user: other,
                    convs: [],
                    latestActivity: null,
                    unreadCount: 0,
                };
            }
            groups[key].convs.push(conv);

            const convTime = new Date(conv.lastActivity || conv.createdAt || '1970-01-01');
            if (!groups[key].latestActivity || convTime > new Date(groups[key].latestActivity)) {
                groups[key].latestActivity = conv.lastActivity || conv.createdAt;
            }
            groups[key].unreadCount += conv.unreadCount || 0;
        });

        return Object.values(groups).sort(
            (a, b) => new Date(b.latestActivity) - new Date(a.latestActivity)
        );
    }, [conversations, user?._id]);

    // Effects
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        if (conversationId) {
            setActive(conversationId);
            fetchMessages(conversationId);
            // No longer need to dispatch window event - Dashboard listens to socket events
        }
    }, [conversationId, setActive, fetchMessages]);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages[activeConversationId]]);

    // Socket handling
    useEffect(() => {
        const socket = getSocket();
        socketRef.current = socket;

        if (activeConversationId && user?._id) {
            socket.emit('chat:join', { conversationId: activeConversationId, userId: user._id });
        }

        socket.on('chat:message', (msg) => {
            if (msg.conversationId === activeConversationId) {
                addMessage(activeConversationId, msg);
            }
        });

        // Handle messages_seen event - when other user reads your messages
        socket.on('messages_seen', ({ conversationId, seenBy, seenAt, messageCount }) => {
            // Update local message read status
            markMessagesAsRead(conversationId, seenBy, seenAt);

            // Update conversation unread count to 0 (all messages read)
            updateConversationUnreadCount(conversationId, 0);

            // Note: Dashboard component listens directly to socket events for real-time updates
            // No need for window.dispatchEvent anymore
        });

        // Handle message status update from AI analysis
        socket.on('message:status-update', ({ messageId, contentStatus, contentScore, flaggedAt }) => {
            if (activeConversationId) {
                updateMessageStatus(activeConversationId, messageId, {
                    contentStatus,
                    contentScore,
                    flaggedAt,
                });
            }
        });

        return () => {
            socket.off('chat:message');
            socket.off('messages_seen');
            socket.off('message:status-update');
        };
    }, [activeConversationId, user?._id, addMessage, markMessagesAsRead, updateConversationUnreadCount, updateMessageStatus]);

    const sendMessage = async () => {
        if (!input.trim() || !activeConversationId) return;

        setSending(true);
        try {
            const { data } = await api.post(`/messages/conversations/${activeConversationId}/messages`, {
                content: input,
            });
            addMessage(activeConversationId, data.message);
            setInput('');
        } catch (err) {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const activeConv = conversations.find((c) => c._id === activeConversationId);
    const activeMessages = messages[activeConversationId] || [];
    const otherUser = activeConv?.participants?.find((p) => p._id !== user?._id);

    return (
        <div
            className="animate-up"
            style={{
                height: 'calc(100vh - 128px)',
                display: 'grid',
                gridTemplateColumns: '280px 1fr',
                overflow: 'hidden',
                background: 'var(--s1)',
                borderRadius: 12,
                boxShadow: 'var(--inv-shadow)',
            }}
        >
            {/* ==================== CONVERSATION LIST (Left Sidebar) ==================== */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: '1px solid var(--b1)',
                    background: 'var(--s1)',
                    overflow: 'hidden',
                }}
            >
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--b1)', background: 'var(--s1)' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Messages</h2>
                    <input
                        placeholder="Search conversations..."
                        style={{
                            width: '100%',
                            background: 'var(--s2)',
                            border: '1px solid var(--b1)',
                            borderRadius: 9,
                            padding: '9px 12px',
                            color: 'var(--txt)',
                            fontSize: '0.82rem',
                            outline: 'none',
                        }}
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0.5rem' }}>
                    {loadingConversations ? (
                        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--txt3)' }}>
                            <div style={{ fontSize: '2.2rem', animation: 'spin 1s linear infinite' }}>⏳</div>
                            <div style={{ marginTop: '0.8rem', fontSize: '0.85rem' }}>Loading conversations...</div>
                        </div>
                    ) : groupedChats.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--txt3)' }}>
                            No conversations yet
                        </div>
                    ) : (
                        groupedChats.map((group) => {
                            const latestConv = group.convs[0]; // You can improve this logic if needed
                            return (
                                <div
                                    key={group.user._id}
                                    onClick={() => {
                                        // Open the most recent conversation with this user
                                        const targetConv = group.convs[0];
                                        if (targetConv) {
                                            setActive(targetConv._id);
                                            fetchMessages(targetConv._id);
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '0.85rem 0.9rem',
                                        cursor: 'pointer',
                                        borderRadius: 10,
                                        margin: '3px 4px',
                                        background:
                                            activeConversationId === group.convs[0]?._id
                                                ? 'rgba(108, 78, 246, 0.12)'
                                                : 'transparent',
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    <Avatar user={group.user} size={42} radius="10px" />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                            {group.user.fullName}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.76rem',
                                                color: 'var(--txt3)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {latestConv?.lastMessage?.content || 'No messages yet'}
                                        </div>
                                    </div>
                                    {group.unreadCount > 0 && (
                                        <div
                                            style={{
                                                background: 'var(--acc)',
                                                color: '#fff',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                minWidth: 18,
                                                height: 18,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {group.unreadCount}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ==================== CHAT WINDOW (Right Side) ==================== */}
            {activeConversationId && otherUser ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    {/* Chat Header */}
                    <div
                        style={{
                            padding: '1rem',
                            borderBottom: '1px solid var(--b1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            background: 'var(--s1)',
                        }}
                    >
                        <Avatar user={otherUser} size={42} radius="10px" />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{otherUser.fullName}</div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--acc2)' }}>● Active now</div>
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                            <Button size="xs" variant="ghost" onClick={() => toast.success('Video call')}>
                                📹
                            </Button>
                            <Button size="xs" variant="ghost" onClick={() => toast.success('Attach file')}>
                                📎
                            </Button>
                        </div>
                    </div>

                    {/* Messages Area - This is the key part that scrolls independently */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.8rem',
                            background: 'var(--s1)',
                        }}
                    >
                        {loadingMessages ? (
                            <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--txt3)' }}>
                                <div style={{ fontSize: '2.5rem', animation: 'spin 1s linear infinite' }}>⏳</div>
                                <p style={{ marginTop: '0.75rem' }}>Loading messages...</p>
                            </div>
                        ) : activeMessages.length === 0 ? (
                            <div
                                style={{
                                    textAlign: 'center',
                                    marginTop: '6rem',
                                    color: 'var(--txt3)',
                                    fontSize: '0.9rem',
                                }}
                            >
                                No messages yet. Start the conversation!
                            </div>
                        ) : (
                            activeMessages.map((msg, i) => {
                                const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
                                const isRead = msg.readAt !== null;
                                const isDelivered = msg.deliveredAt !== null;
                                const contentStatus = msg.contentStatus || 'pending';
                                const contentScore = msg.contentScore || 0;

                                // Status badge styling
                                const getStatusBadge = () => {
                                    if (contentStatus === 'pending') {
                                        return { emoji: '⏳', label: 'Analyzing...', color: '#f59e0b' };
                                    } else if (contentStatus === 'safe') {
                                        return { emoji: '✅', label: 'Safe', color: '#10b981' };
                                    } else if (contentStatus === 'unsafe') {
                                        return { emoji: '⚠️', label: 'Unsafe', color: '#ef4444' };
                                    }
                                    return { emoji: '❓', label: 'Unknown', color: '#6b7280' };
                                };

                                const statusBadge = getStatusBadge();

                                return (
                                    <div
                                        key={msg._id || i}
                                        style={{
                                            display: 'flex',
                                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                                            animation: 'slideUp 0.3s ease',
                                        }}
                                    >
                                        <div style={{ maxWidth: '72%' }}>
                                            <div
                                                style={{
                                                    padding: '10px 14px',
                                                    borderRadius: isMine
                                                        ? '12px 12px 4px 12px'
                                                        : '12px 12px 12px 4px',
                                                    background: isMine ? 'var(--acc)' : 'var(--s2)',
                                                    color: isMine ? '#fff' : 'var(--txt)',
                                                    fontSize: '0.9rem',
                                                    lineHeight: 1.55,
                                                    border: isMine ? 'none' : '1px solid var(--b1)',
                                                }}
                                            >
                                                {msg.content}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '0.68rem',
                                                    color: 'var(--txt3)',
                                                    marginTop: 4,
                                                    textAlign: isMine ? 'right' : 'left',
                                                    padding: '0 4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                                                    gap: 4,
                                                }}
                                            >
                                                {/* Status Badge */}
                                                <span title={`${statusBadge.label} (${(contentScore * 100).toFixed(0)}% confidence)`}
                                                    style={{ fontSize: '0.7rem' }}>
                                                    {statusBadge.emoji}
                                                </span>

                                                {formatRelative(msg.createdAt)}
                                                {isMine && (
                                                    <span style={{ fontSize: '0.65rem' }}>
                                                        {isRead ? (
                                                            <span style={{ color: '#4ade80' }}>✓✓</span>
                                                        ) : isDelivered ? (
                                                            <span style={{ color: '#94a3b8' }}>✓✓</span>
                                                        ) : (
                                                            <span style={{ color: '#64748b' }}>✓</span>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div
                        style={{
                            padding: '0.9rem 1rem',
                            borderTop: '1px solid var(--b1)',
                            background: 'var(--s1)',
                        }}
                    >
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                                placeholder="Type a message..."
                                style={{
                                    flex: 1,
                                    background: 'var(--s2)',
                                    border: '1px solid var(--b2)',
                                    borderRadius: 12,
                                    padding: '11px 14px',
                                    color: 'var(--txt)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    resize: 'none',
                                }}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={sending || !input.trim()}
                                style={{
                                    width: 42,
                                    height: 42,
                                    background: 'var(--g1)',
                                    border: 'none',
                                    borderRadius: 10,
                                    color: '#fff',
                                    fontSize: '1.1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: sending || !input.trim() ? 0.6 : 1,
                                    transition: 'all 0.2s',
                                }}
                            >
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Empty State */
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '1.2rem',
                        color: 'var(--txt3)',
                        height: '100%',
                    }}
                >
                    <span style={{ fontSize: '4.5rem', opacity: 0.6 }}>💬</span>
                    <p style={{ fontSize: '1.05rem' }}>Select a conversation to start chatting</p>
                </div>
            )}
        </div>
    );
}