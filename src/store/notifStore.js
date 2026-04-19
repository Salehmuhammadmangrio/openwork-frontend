import { create } from 'zustand';
import api from '../utils/api';

export const useNotifStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isFetching: false,

  fetch: async () => {
    try {
      set({ isFetching: true });
      const { data } = await api.get('/notifications');
      set({
        notifications: Array.isArray(data?.notifications) ? data.notifications : [],
        unreadCount: typeof data?.unreadCount === 'number' ? data.unreadCount : 0,
      });
    } catch {
      set({ notifications: [], unreadCount: 0 });
    } finally {
      set({ isFetching: false });
    }
  },

  addNew: (notif) => set((s) => {
    // Prevent duplicates - check if notification already exists
    const exists = s.notifications.some(n => n._id === notif._id || n.id === notif.id);
    if (exists) return s; // Don't add if already present
    
    return {
      notifications: [notif, ...s.notifications],
      unreadCount: s.unreadCount + (notif?.isRead ? 0 : 1),
    };
  }),

  markRead: async (id) => {
    const current = get().notifications.find((n) => n._id === id || n.id === id);
    if (!current || current.isRead) return;

    try {
      await api.put(`/notifications/${id}/read`);
      set((s) => ({
        notifications: s.notifications.map((n) =>
          (n._id === id || n.id === id) ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    } catch {
      // no-op
    }
  },

  markAllRead: async () => {
    if (get().unreadCount <= 0) return;

    try {
      await api.put('/notifications/all/read');
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      // no-op
    }
  },
}));
