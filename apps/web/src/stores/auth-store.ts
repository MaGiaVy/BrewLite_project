import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { clearAuthSession, getAuthToken, setAuthSession } from '../lib/api-client';

export interface UserVoucherItem {
  code: string;
  title?: string;
  description?: string;
  discountPercent: number;
  maxDiscountAmount: number;
  minOrderAmount: number;
  badge?: string;
  expiresIn?: string;
  quantity: number;
}

export interface User {
  id: number | string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  role?: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  loyaltyPoints?: number;
  vouchers?: UserVoucherItem[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  updateProfile: (data: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
  isLoggedIn: () => boolean;
  updateLoyaltyPoints: (points: number) => void;
  deductLoyaltyPoints: (cost: number) => boolean;
}

export const AUTH_STORAGE_KEY = 'brewlite-auth';

// Prevent infinite recursion when api-client's setAuthSession/clearAuthSession calls back into useAuthStore
let isSyncingSession = false;

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
        if (!isSyncingSession) {
          isSyncingSession = true;
          try {
            setAuthSession({ token, user });
          } finally {
            isSyncingSession = false;
          }
        }
      },

      logout: () => {
        set({
          token: null,
          accessToken: null,
          user: null,
          isAuthenticated: false,
        });
        if (!isSyncingSession) {
          isSyncingSession = true;
          try {
            clearAuthSession();
          } finally {
            isSyncingSession = false;
          }
        }
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      updateProfile: (data: Partial<User>) => {
        const u = get().user;
        if (u) {
          set({ user: { ...u, ...data } });
        } else {
          set({
            user: {
              id: 1,
              email: 'tuankiet.huynh@brewlite.vn',
              fullName: 'Huỳnh Tuấn Kiệt',
              phone: '0988 888 888',
              role: 'CUSTOMER',
              loyaltyPoints: 120,
              ...data,
            },
          });
        }
      },

      refreshProfile: async () => {
        const token = get().token ?? getAuthToken();
        if (!token) return;
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          const res = await fetch(`${apiBase}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const json = await res.json();
            const profile = json?.user ?? json?.data ?? json;
            if (profile && typeof profile === 'object') {
              const u = get().user;
              const vouchers = Array.isArray(profile.vouchers)
                ? profile.vouchers
                : u?.vouchers;
              set({
                user: {
                  ...u,
                  ...profile,
                  ...(vouchers !== undefined ? { vouchers } : {}),
                },
              });
            }
          }
        } catch {
          // ignore network failure
        }
      },

      updateLoyaltyPoints: (points: number) => {
        const u = get().user;
        if (u) {
          set({ user: { ...u, loyaltyPoints: points } });
        }
      },

      deductLoyaltyPoints: (cost: number) => {
        const u = get().user;
        const currentPoints = u?.loyaltyPoints ?? 120;
        if (currentPoints < cost) return false;
        set({
          user: u
            ? { ...u, loyaltyPoints: currentPoints - cost }
            : { id: 1, email: 'khachhang@brewlite.vn', loyaltyPoints: currentPoints - cost },
        });
        return true;
      },

      isLoggedIn: () => {
        return Boolean(
          get().token ||
            getAuthToken() ||
            (typeof window !== 'undefined' && localStorage.getItem('accessToken')),
        );
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

