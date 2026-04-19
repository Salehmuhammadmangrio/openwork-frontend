import { create } from 'zustand';
import api from '../utils/api';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingStates: {},
  loadingConversations: false,
  loadingMessages: false,

  fetchConversations: async () => {
    set({ loadingConversations: true });
    try {
      const { data } = await api.get('/messages/conversations');
      set({ conversations: data.conversations || [] });
    } finally {
      set({ loadingConversations: false });
    }
  },

  setActive: (id) => set({ activeConversationId: id }),
  setActiveConversation: (id) => set({ activeConversationId: id }),

  fetchMessages: async (conversationId) => {
    set({ loadingMessages: true });
    try {
      const { data } = await api.get(`/messages/conversations/${conversationId}/messages`);
      set((s) => ({
        messages: {
          ...s.messages,
          [conversationId]: data.messages || [],
        },
      }));
      return data.messages || [];
    } finally {
      set({ loadingMessages: false });
    }
  },

  addMessage: (conversationId, message) => set((s) => ({
    messages: {
      ...s.messages,
      [conversationId]: [...(s.messages[conversationId] || []), message],
    },
  })),

  /**
   * Mark messages as read locally (called when messages_seen event is received)
   * Updates the readAt timestamp for messages in a conversation
   */
  markMessagesAsRead: (conversationId, seenBy, seenAt) => set((s) => {
    const conversationMessages = s.messages[conversationId] || [];
    const updatedMessages = conversationMessages.map(msg => {
      // Only update messages from the other user that are unread
      if (msg.sender._id !== seenBy && !msg.readAt) {
        return { ...msg, readAt: seenAt };
      }
      return msg;
    });

    return {
      messages: {
        ...s.messages,
        [conversationId]: updatedMessages,
      },
    };
  }),

  /**
   * Update conversation unread count (called when messages_seen event is received)
   */
  updateConversationUnreadCount: (conversationId, newCount) => set((s) => ({
    conversations: s.conversations.map(conv =>
      conv._id === conversationId
        ? { ...conv, unreadCount: newCount }
        : conv
    ),
  })),

  setTyping: (conversationId, userId, isTyping) => set((s) => ({
    typingStates: {
      ...s.typingStates,
      [conversationId]: {
        ...(s.typingStates[conversationId] || {}),
        [userId]: isTyping,
      },
    },
  })),
}));
