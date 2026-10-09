import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/index.js';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  theme: 'light' | 'dark';
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  toggleTheme: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      theme: 'dark', // default dark mode for sleek automotive look

      setAuth: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ user: null, accessToken: null }),

      toggleTheme: () =>
        set((state) => {
          const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
          if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { theme: nextTheme };
        }),
    }),
    {
      name: 'stockdrive-auth-storage',
      partialize: (state) => ({ user: state.user, theme: state.theme }),
    }
  )
);
