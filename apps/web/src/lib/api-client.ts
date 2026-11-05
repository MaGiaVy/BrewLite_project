const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const AUTH_STORAGE_KEY = 'brewlite-auth';
export const CART_STORAGE_KEY = 'brewlite-cart';

export interface AuthSession {
  token: string | null;
  user: {
    id: number;
    email: string;
    fullName: string | null;
    phone?: string | null;
    role?: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  } | null;
}

export interface CartEntry {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
}

export interface ApiClientOptions extends RequestInit {
  onUnauthorizedRedirect?: (loginUrl: string) => void;
  currentPath?: string;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: AuthSession } & AuthSession;
    return parsed?.state?.token ?? parsed?.token ?? null;
  } catch {
    return null;
  }
}

export function setAuthSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      state: {
        user: session.user,
        token: session.token,
        isAuthenticated: Boolean(session.token),
      },
    }),
  );
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getCartItems(): CartEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { state?: { items?: CartEntry[] } } | CartEntry[];
    if (Array.isArray(parsed)) return parsed;
    return parsed?.state?.items ?? [];
  } catch {
    return [];
  }
}

export function setCartItems(items: CartEntry[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({ state: { items } }),
  );
}

export async function apiClient(
  path: string,
  options: ApiClientOptions = {},
): Promise<Response> {
  const { onUnauthorizedRedirect, currentPath, ...fetchOptions } = options;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401) {
    // Xóa phiên đăng nhập nhưng TUYỆT ĐỐI giữ nguyên giỏ hàng (CART_STORAGE_KEY)
    clearAuthSession();

    const targetPath =
      currentPath ??
      (typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search || ''}`
        : '/checkout');

    const loginUrl =
      targetPath && !targetPath.startsWith('/login')
        ? `/login?redirect=${encodeURIComponent(targetPath)}`
        : '/login';

    if (onUnauthorizedRedirect) {
      onUnauthorizedRedirect(loginUrl);
    } else if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login')
    ) {
      try {
        window.location.href = loginUrl;
      } catch {
        // Fallback cho môi trường jsdom
      }
    }
  }

  return response;
}

export default apiClient;
