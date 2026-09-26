import { client } from '@/api/client';
import { User } from '@/stores/authStore';

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponseData {
  id: string;
  email: string;
  accessToken: string;
}

export interface AuthResponse {
  statusCode: number;
  message: string;
  data: AuthResponseData;
}

export interface UserResponse {
  statusCode: number;
  message: string;
  data: User;
}

/**
 * Gọi API đăng ký tài khoản (POST /api/v1/auth/register)
 */
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await client.post<AuthResponse>('/api/v1/auth/register', data);
  return response.data;
};

/**
 * Gọi API đăng nhập (POST /api/v1/auth/login)
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await client.post<AuthResponse>('/api/v1/auth/login', data);
  return response.data;
};

/**
 * Gọi API đăng xuất (POST /api/v1/auth/logout)
 */
export const logout = async (): Promise<void> => {
  try {
    await client.post('/api/v1/auth/logout');
  } catch {
    // Nếu lỗi phía server thì vẫn dọn dẹp local session
  }
};

/**
 * Lấy thông tin user hiện tại (GET /api/v1/auth/me)
 */
export const getMe = async (): Promise<UserResponse> => {
  const response = await client.get<UserResponse>('/api/v1/auth/me');
  return response.data;
};
