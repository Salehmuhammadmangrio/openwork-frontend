import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      mode: 'dark',

      toggleTheme: () => {
        const newMode = get().mode === 'dark' ? 'light' : 'dark';
        get().setTheme(newMode);
      },

      setTheme: (mode) => {
        const validMode = mode === 'light' ? 'light' : 'dark';
        set({ mode: validMode });

        // Apply theme to document
        if (validMode === 'light') {
          document.documentElement.classList.add('theme-light');
        } else {
          document.documentElement.classList.remove('theme-light');
        }
      },

      initTheme: () => {
        // Detect system preference on first run
        const stored = localStorage.getItem('ow-theme');
        const mode = stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        get().setTheme(mode);
      },
    }),
    {
      name: 'ow-theme',
      partialize: s => ({ mode: s.mode }),
    }
  )
);
