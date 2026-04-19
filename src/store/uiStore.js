import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'dark',
      toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme: theme === 'light' ? 'light' : 'dark' }),
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
      modal: null,
      modalData: null,
      openModal: (name, data = null) => set({ modal: name, modalData: data }),
      closeModal: () => set({ modal: null, modalData: null }),
    }),
    {
      name: 'ow-ui',
      partialize: s => ({ theme: s.theme }),
    }
  )
);
