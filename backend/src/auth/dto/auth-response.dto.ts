export class AuthResponseDto {
  id: string;
  email: string;
  accessToken: string;
}

export class UserProfileDto {
  id: string;
  email: string;
  loyaltyPoints?: number;
}

export class ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data: T;
  error?: string;
  details?: Record<string, string>;
}
