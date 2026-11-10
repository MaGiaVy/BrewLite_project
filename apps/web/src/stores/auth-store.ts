import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: number | string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  role?: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  loyaltyPoints?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  isLoggedIn: () => boolean;
}

export const AUTH_STORAGE_KEY = 'brewlite-auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      accessToken: null,
      isAuthenticated: false,

      login: (token: string, user: User) => {
        set({
          token,
          accessToken: token,
          user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          token: null,
          accessToken: null,
          user: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      isLoggedIn: () => {
        return Boolean(get().token || (typeof window !== 'undefined' && localStorage.getItem('accessToken')));
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: (state) => ({
        token: state.token,
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export const authStore = useAuthStore;

