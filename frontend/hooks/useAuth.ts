import { useCallback } from 'react';
import { useAuthStore, User } from '../stores/authStore';
import * as authApi from '../api/auth';

export const useAuth = () => {
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    login: storeLogin,
    logout: storeLogout,
    setUser,
    setIsLoading,
    isLoggedIn,
  } = useAuthStore();

  /**
   * Đăng nhập: Gọi API Backend -> Lưu token và user vào Zustand store
   */
  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await authApi.login({ email, password });
        const { accessToken, id } = response.data;
        const loggedUser: User = { id, email };

        storeLogin(accessToken, loggedUser);
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, storeLogin],
  );

  /**
   * Đăng ký: Gọi API Backend -> Tự động đăng nhập nếu có accessToken trả về
   */
  const register = useCallback(
    async (email: string, password: string, confirmPassword: string) => {
      setIsLoading(true);
      try {
        const response = await authApi.register({
          email,
          password,
          confirmPassword,
        });
        const { accessToken, id } = response.data;
        const newUser: User = { id, email };

        if (accessToken) {
          storeLogin(accessToken, newUser);
        }
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    [setIsLoading, storeLogin],
  );

  /**
   * Đăng xuất: Gọi API logout và dọn dẹp state / localStorage
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      storeLogout();
      setIsLoading(false);
    }
  }, [setIsLoading, storeLogout]);

  /**
   * Cập nhật lại thông tin user từ /auth/me
   */
  const fetchMe = useCallback(async () => {
    if (!accessToken && typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
      return null;
    }
    try {
      const response = await authApi.getMe();
      if (response && response.data) {
        setUser(response.data);
        return response.data;
      }
      return null;
    } catch {
      storeLogout();
      return null;
    }
  }, [accessToken, setUser, storeLogout]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    isLoggedIn: isLoggedIn(),
    login,
    register,
    logout,
    fetchMe,
  };
};

export default useAuth;
