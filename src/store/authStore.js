import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      activeRole: null,
      isLoading: false,
      isAuthenticated: false,

      setAuth: (user, token) => {
        const canClient = user?.role === 'client' || user?.canActAsClient;
        const canFreelancer = user?.role === 'freelancer' || user?.canActAsFreelancer || user?.role === 'admin';
        const allowed = [
          ...(canClient ? ['client'] : []),
          ...(canFreelancer ? ['freelancer'] : []),
        ];
        const fallbackRole = allowed[0] || 'freelancer';
        const current = get().activeRole;
        const nextRole = allowed.includes(current) ? current : fallbackRole;
        set({ user, token, activeRole: nextRole, isAuthenticated: true });
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      },

      setActiveRole: (role) => {
        const user = get().user;
        if (!user) return;
        const canClient = user?.role === 'client' || user?.canActAsClient;
        const canFreelancer = user?.role === 'freelancer' || user?.canActAsFreelancer || user?.role === 'admin';
        const allowed = [
          ...(canClient ? ['client'] : []),
          ...(canFreelancer ? ['freelancer'] : []),
        ];
        if (allowed.includes(role)) {
          set({ activeRole: role });
        }
      },

      toggleRole: async () => {
        const user = get().user;
        if (!user) return;

        const canClient = user.role === 'client' || user.canActAsClient;
        const canFreelancer =
          user.role === 'freelancer' ||
          user.canActAsFreelancer ||
          user.role === 'admin';

        const allowed = [
          ...(canClient ? ['client'] : []),
          ...(canFreelancer ? ['freelancer'] : []),
        ];

        // Admin cannot switch roles
        if (user.role === 'admin') return;

        // Only dual-role users can switch
        if (allowed.length < 2) return;

        set({ isLoading: true });

        try {
          const { data } = await api.put('/users/role-switch');

          set((state) => ({
            user: {
              ...state.user,
              role: data.role,
            },
            activeRole: data.role,
          }));

          return data;
        } finally {
          set({ isLoading: false });
        }
      },

      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),

      logout: () => {
        set({ user: null, token: null, activeRole: null, isAuthenticated: false });
        delete api.defaults.headers.common.Authorization;

        // Clear all auth-related data
        localStorage.removeItem('ow-token');
        localStorage.removeItem('ow-auth');
        localStorage.removeItem('ow-user');

        // Clear any cached data
        sessionStorage.clear();
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          get().setAuth(data.user, data.token);
          localStorage.setItem('ow-token', data.token);
          return data;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', formData);
          get().setAuth(data.user, data.token);
          localStorage.setItem('ow-token', data.token);
          return data;
        } finally {
          set({ isLoading: false });
        }
      },

      firebaseRegister: async (idToken, provider) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/firebase-register', { idToken, provider });
          get().setAuth(data.user, data.token);
          localStorage.setItem('ow-token', data.token);
          return data;
        } catch (error) {
          const status = error.response?.status;
          const message = error.response?.data?.message || error.message;

          // Provide user-friendly error messages
          if (status === 400) {
            throw new Error('Missing or invalid authentication data. Please try again.');
          } else if (status === 401) {
            throw new Error('Firebase authentication failed. Please try again.');
          } else if (status === 409) {
            throw new Error('User already registered. Please log in instead.');
          } else if (error.code === 'ECONNABORTED') {
            throw new Error('Registration request timed out. Please check your connection and try again.');
          }

          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      firebaseLogin: async (idToken, provider) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/firebase-login', { idToken, provider });
          get().setAuth(data.user, data.token);
          localStorage.setItem('ow-token', data.token);
          return data;
        } catch (error) {
          const status = error.response?.status;
          const message = error.response?.data?.message || error.message;

          // Provide user-friendly error messages
          if (status === 400) {
            throw new Error('Missing or invalid authentication data. Please try again.');
          } else if (status === 401) {
            throw new Error('Firebase authentication failed. Your token may have expired. Please try again.');
          } else if (status === 404) {
            throw new Error('User not registered. Please sign up first.');
          } else if (error.code === 'ECONNABORTED') {
            throw new Error('Authentication request timed out. Please check your connection and try again.');
          }

          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      googleLogin: async (idToken) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/google', { idToken });

          // Check if this is a new user requiring role selection
          if (data.requiresRoleSelection && data.googleData) {
            return {
              success: true,
              requiresRoleSelection: true,
              googleData: data.googleData,
            };
          }

          // Existing user - login them
          get().setAuth(data.user, data.token);
          localStorage.setItem('ow-token', data.token);
          return data;
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      googleCompleteSignup: async (idToken, role) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/google-complete', { idToken, role });
          get().setAuth(data.user, data.token);
          localStorage.setItem('ow-token', data.token);
          return data;
        } catch (error) {
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      refreshUser: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set((s) => {
            const user = data.user;
            const canClient = user?.role === 'client' || user?.canActAsClient;
            const canFreelancer = user?.role === 'freelancer' || user?.canActAsFreelancer || user?.role === 'admin';
            const allowed = [
              ...(canClient ? ['client'] : []),
              ...(canFreelancer ? ['freelancer'] : []),
            ];
            const fallbackRole = allowed[0] || 'freelancer';
            const nextRole = allowed.includes(s.activeRole) ? s.activeRole : fallbackRole;
            return { user, activeRole: nextRole };
          });
        } catch (error) {

          get().logout();
          throw error;
        }
      },
    }),
    {
      name: 'ow-auth',
      partialize: (s) => ({
        token: s.token,
        user: s.user,
        activeRole: s.activeRole,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
