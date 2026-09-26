import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  loyaltyPoints?: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  token: string | null; // Alias cho accessToken
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      /**
       * Lưu phiên đăng nhập: token & thông tin user (tuyệt đối không lưu password)
       */
      login: (accessToken: string, user: User) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
        }
        set({
          accessToken,
          token: accessToken,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      /**
       * Đăng xuất: xóa token khỏi state & localStorage
       */
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
        set({
          accessToken: null,
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      setToken: (accessToken: string | null) => {
        if (typeof window !== 'undefined') {
          if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
          } else {
            localStorage.removeItem('accessToken');
          }
        }
        set({
          accessToken,
          token: accessToken,
          isAuthenticated: Boolean(accessToken),
        });
      },

      setIsLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      isLoggedIn: () => {
        return Boolean(get().accessToken || (typeof window !== 'undefined' && localStorage.getItem('accessToken')));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: (state) => ({
        accessToken: state.accessToken,
        token: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Alias cho các nơi gọi dạng authStore
export const authStore = useAuthStore;
