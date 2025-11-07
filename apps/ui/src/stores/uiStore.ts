import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark';
  env: 'dev' | 'stg' | 'prod';
  sidebarCollapsed: boolean;

  setTheme: (theme: 'light' | 'dark') => void;
  setEnv: (env: 'dev' | 'stg' | 'prod') => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      env: 'dev',
      sidebarCollapsed: false,

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      setEnv: (env) => set({ env }),

      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
      })),
    }),
    {
      name: 'cityreach-ui',
    }
  )
);
