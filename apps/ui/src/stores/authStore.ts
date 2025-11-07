import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  roles: string[];
  isAuthenticated: boolean;

  login: (user: User, token: string, roles: string[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      roles: [],
      isAuthenticated: false,

      login: (user, token, roles) => {
        set({ user, token, roles, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, roles: [], isAuthenticated: false });
      },
    }),
    {
      name: 'cityreach-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        roles: state.roles,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
