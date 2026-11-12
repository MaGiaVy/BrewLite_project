import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  evaluateRouteAccess,
  middleware,
  SESSION_ROLE_COOKIE,
} from '../../middleware';
import { useAuthStore } from '../../stores/auth-store';
import { apiClient, clearAuthSession, setAuthSession } from '../api-client';

function clearRoleCookie() {
  document.cookie = `${SESSION_ROLE_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
}

describe('Edge Route Guard & Session Cookie Sync (As2)', () => {
  describe('evaluateRouteAccess', () => {
    it('redirects unauthenticated /admin* to /auth/login?redirect=...', () => {
      expect(evaluateRouteAccess('/admin', '', undefined, '/auth/login')).toEqual({
        action: 'redirect',
        location: '/auth/login?redirect=%2Fadmin',
      });
      expect(
        evaluateRouteAccess('/admin/menu', '?category=coffee', null, '/auth/login'),
      ).toEqual({
        action: 'redirect',
        location: '/auth/login?redirect=%2Fadmin%2Fmenu%3Fcategory%3Dcoffee',
      });
    });

    it('redirects wrong role on /admin* to / and allows ADMIN', () => {
      expect(evaluateRouteAccess('/admin', '', 'CUSTOMER', '/auth/login')).toEqual({
        action: 'redirect',
        location: '/',
      });
      expect(evaluateRouteAccess('/admin', '', 'STAFF', '/auth/login')).toEqual({
        action: 'redirect',
        location: '/',
      });
      expect(evaluateRouteAccess('/admin', '', 'ADMIN', '/auth/login')).toEqual({
        action: 'allow',
      });
    });

    it('allows STAFF and ADMIN on /staff*, redirects CUSTOMER to / and missing role to /auth/login', () => {
      expect(evaluateRouteAccess('/staff', '', undefined, '/auth/login')).toEqual({
        action: 'redirect',
        location: '/auth/login?redirect=%2Fstaff',
      });
      expect(evaluateRouteAccess('/staff/queue', '', 'CUSTOMER', '/auth/login')).toEqual({
        action: 'redirect',
        location: '/',
      });
      expect(evaluateRouteAccess('/staff', '', 'STAFF', '/auth/login')).toEqual({
        action: 'allow',
      });
      expect(evaluateRouteAccess('/staff/queue', '', 'ADMIN', '/auth/login')).toEqual({
        action: 'allow',
      });
    });

    it('protects /checkout*, /account*, /orders*, /order-confirmation* for authenticated roles', () => {
      const protectedPaths = [
        '/checkout',
        '/account',
        '/orders',
        '/orders/123',
        '/order-confirmation',
      ];
      for (const path of protectedPaths) {
        expect(evaluateRouteAccess(path, '', '', '/auth/login')).toEqual({
          action: 'redirect',
          location: `/auth/login?redirect=${encodeURIComponent(path)}`,
        });
        expect(evaluateRouteAccess(path, '', 'CUSTOMER', '/auth/login')).toEqual({
          action: 'allow',
        });
        expect(evaluateRouteAccess(path, '', 'STAFF', '/auth/login')).toEqual({
          action: 'allow',
        });
        expect(evaluateRouteAccess(path, '', 'ADMIN', '/auth/login')).toEqual({
          action: 'allow',
        });
      }
    });

    it('allows public routes cleanly with zero redirect loops', () => {
      const publicPaths = [
        '/',
        '/menu',
        '/menu/1',
        '/cart',
        '/login',
        '/auth/login',
        '/auth/register',
        '/promotions',
        '/api/orders',
        '/_next/static/app.js',
        '/gateway/mock',
      ];
      for (const path of publicPaths) {
        expect(evaluateRouteAccess(path, '', undefined, '/auth/login')).toEqual({
          action: 'allow',
        });
      }
    });
  });

  describe('Next.js middleware', () => {
    it('redirects unauthenticated /checkout to /auth/login?redirect=%2Fcheckout', () => {
      const req = new NextRequest('http://localhost:3000/checkout?mode=express');
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe(
        'http://localhost:3000/auth/login?redirect=%2Fcheckout%3Fmode%3Dexpress',
      );
    });

    it('redirects CUSTOMER on /admin to /', () => {
      const req = new NextRequest('http://localhost:3000/admin', {
        headers: { cookie: `${SESSION_ROLE_COOKIE}=CUSTOMER` },
      });
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('allows /auth/login and authenticated /orders/10 cleanly', () => {
      const authReq = new NextRequest('http://localhost:3000/auth/login');
      const authRes = middleware(authReq);
      expect(authRes.headers.get('location')).toBeNull();
      expect(authRes.headers.get('x-middleware-next')).toBe('1');

      const ordersReq = new NextRequest('http://localhost:3000/orders/10', {
        headers: { cookie: `${SESSION_ROLE_COOKIE}=CUSTOMER` },
      });
      const ordersRes = middleware(ordersReq);
      expect(ordersRes.headers.get('location')).toBeNull();
      expect(ordersRes.headers.get('x-middleware-next')).toBe('1');
    });
  });

  describe('auth-store & api-client cookie sync', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      window.localStorage.clear();
      clearRoleCookie();
      clearAuthSession();
    });

    it('syncs cookie on login/setAuthSession and clears on logout/clearAuthSession/401', async () => {
      useAuthStore.getState().login('jwt-admin', {
        id: 1,
        email: 'admin@brewlite.vn',
        role: 'ADMIN',
      });
      expect(document.cookie).toContain(`${SESSION_ROLE_COOKIE}=ADMIN`);

      useAuthStore.getState().logout();
      expect(document.cookie).not.toContain(`${SESSION_ROLE_COOKIE}=ADMIN`);

      setAuthSession({
        token: 'jwt-staff',
        user: { id: 2, email: 'staff@brewlite.vn', role: 'STAFF' },
      });
      expect(document.cookie).toContain(`${SESSION_ROLE_COOKIE}=STAFF`);

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 }),
        ),
      );
      await apiClient('/orders', {
        currentPath: '/staff',
        onUnauthorizedRedirect: () => {},
      });
      expect(document.cookie).not.toContain(`${SESSION_ROLE_COOKIE}=STAFF`);
    });

    it('clears cookie when refreshProfile fails with non-OK response', async () => {
      setAuthSession({
        token: 'jwt-customer',
        user: { id: 3, email: 'customer@brewlite.vn', role: 'CUSTOMER' },
      });
      expect(document.cookie).toContain(`${SESSION_ROLE_COOKIE}=CUSTOMER`);

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 }),
        ),
      );
      await useAuthStore.getState().refreshProfile();
      expect(document.cookie).not.toContain(`${SESSION_ROLE_COOKIE}=CUSTOMER`);
    });
  });
});
