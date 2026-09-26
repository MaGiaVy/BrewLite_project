import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Request Interceptor: Tự động đính kèm Authorization: Bearer <token>
 */
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    let token: string | null = null;

    if (typeof window !== 'undefined') {
      token =
        useAuthStore.getState().accessToken ||
        localStorage.getItem('accessToken');
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/**
 * Response Interceptor: Bắt lỗi 401 Unauthorized -> Xóa token & chuyển hướng về /auth/login
 */
client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        useAuthStore.getState().logout();
        localStorage.removeItem('accessToken');

        // Chỉ chuyển hướng nếu người dùng chưa ở trang login để tránh vòng lặp
        if (!window.location.pathname.startsWith('/auth/login')) {
          window.location.href = '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

export const apiClient = client;
export default client;
