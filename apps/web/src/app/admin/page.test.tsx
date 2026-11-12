import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import AdminPage from './page';
import * as apiClientModule from '../../lib/api-client';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockPush,
  }),
}));

function setAdminSession() {
  apiClientModule.setAuthSession({
    token: 'jwt-admin-token',
    user: {
      id: 99,
      email: 'admin@brewlite.vn',
      fullName: 'Quản Lý Cửa Hàng',
      role: 'ADMIN',
    },
  });
}

function createAdminApiMock(overrides?: {
  products?: any[];
  ingredients?: any[];
  orders?: any[];
  staff?: any[];
  customers?: any[];
  dashboard?: Record<string, any>;
  vouchers?: any[];
  customHandler?: (path: string, init?: apiClientModule.ApiClientOptions) => Promise<Response | null>;
}) {
  const products = overrides?.products ?? [
    {
      id: 1,
      name: 'Cà phê Sữa',
      description: 'Cà phê pha phin truyền thống',
      basePrice: 35000,
      category: 'vietnamese',
      isActive: true,
      isSoldOutManual: false,
      availableServings: 42,
    },
    {
      id: 2,
      name: 'Trà Đào Cam Sả',
      description: 'Ngát hương sả tươi',
      basePrice: 45000,
      category: 'tea',
      isActive: false,
      isSoldOutManual: true,
      availableServings: 0,
    },
  ];
  const ingredients = overrides?.ingredients ?? [
    {
      id: 10,
      code: 'ING_ROBUSTA',
      name: 'Hạt Cà phê Robusta Đắk Lắk',
      unit: 'g',
      stock: 400,
      minThreshold: 500,
      status: 'LOW_STOCK',
      percentage: 30,
    },
  ];
  const orders = overrides?.orders ?? [];
  const staff = overrides?.staff ?? [
    {
      id: 101,
      fullName: 'Nguyễn Gia Thành',
      email: 'thanh.barista@brewlite.vn',
      role: 'STAFF',
      isActive: true,
    },
  ];
  const customers = overrides?.customers ?? [
    {
      id: 201,
      fullName: 'Trần Văn Minh',
      email: 'minh.customer@gmail.com',
      loyaltyPoints: 185,
      isActive: true,
      _count: { orders: 4 },
    },
  ];
  const dashboard = overrides?.dashboard ?? {
    totalRevenue: 1250000,
    totalOrders: 18,
    completedCount: 14,
    activeCount: 4,
    totalGrossProfit: 720000,
  };
  const vouchers = overrides?.vouchers ?? [
    {
      id: 5,
      code: 'BREW10',
      description: 'Giảm 10% tối đa 15.000đ',
      discountPercent: 10,
      isActive: true,
    },
  ];

  return vi.spyOn(apiClientModule, 'apiClient').mockImplementation(async (path, init) => {
    if (overrides?.customHandler) {
      const custom = await overrides.customHandler(path, init);
      if (custom) return custom;
    }
    const method = (init?.method ?? 'GET').toUpperCase();
    if (method === 'GET') {
      if (path === '/products?includeInactive=true') {
        return new Response(JSON.stringify({ data: products }), { status: 200 });
      }
      if (path === '/inventory/ingredients') {
        return new Response(JSON.stringify(ingredients), { status: 200 });
      }
      if (path === '/orders') {
        return new Response(JSON.stringify(orders), { status: 200 });
      }
      if (path === '/staff') {
        return new Response(JSON.stringify(staff), { status: 200 });
      }
      if (path === '/admin/customers') {
        return new Response(JSON.stringify(customers), { status: 200 });
      }
      if (path === '/inventory/dashboard') {
        return new Response(JSON.stringify(dashboard), { status: 200 });
      }
      if (path === '/inventory/vouchers') {
        return new Response(JSON.stringify(vouchers), { status: 200 });
      }
    }
    return new Response(JSON.stringify({ message: `Unhandled ${method} ${path}` }), { status: 404 });
  });
}

describe('T5.1g Admin Page (/admin) — Real API Integration', () => {
  beforeEach(() => {
    mockPush.mockClear();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('WEB-T19 redirects an unauthenticated or CUSTOMER user to /login?redirect=%2Fadmin', async () => {
    apiClientModule.setAuthSession({
      token: 'jwt-customer-token',
      user: {
        id: 1,
        email: 'customer@brewlite.com',
        fullName: 'Khách Hàng',
        role: 'CUSTOMER',
      },
    });

    render(<AdminPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Fadmin');
    });
  });

  it('WEB-T19 authorizes ADMIN from fallback localStorage key (brewlite-auth-storage)', async () => {
    window.localStorage.setItem(
      'brewlite-auth-storage',
      JSON.stringify({
        state: {
          token: 'jwt-admin-fallback',
          user: { id: 99, email: 'admin@brewlite.vn', role: 'ADMIN' },
        },
      }),
    );

    const spy = createAdminApiMock();
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('BREWLITE PREMIER')).toBeTruthy();
      expect(spy).toHaveBeenCalledWith('/staff', expect.any(Object));
    });
  });

  it('WEB-T20 fetches all real endpoints, renders real dashboard metrics (0 when empty, never 18450000/142), and switches tabs', async () => {
    setAdminSession();
    const apiSpy = createAdminApiMock({
      dashboard: {
        totalRevenue: 0,
        totalOrders: 0,
        completedCount: 0,
        activeCount: 0,
        totalGrossProfit: 0,
      },
      products: [],
      ingredients: [],
      staff: [],
      customers: [],
      vouchers: [],
    });

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('BREWLITE PREMIER')).toBeTruthy();
      expect(screen.getByText('Doanh thu hôm nay')).toBeTruthy();
      expect(screen.getAllByText('0đ').length).toBeGreaterThanOrEqual(2);
    });

    // Must NOT render fake hardcoded metrics or fake INITIAL_* items
    expect(screen.queryByText(/18\.450\.000/)).toBeNull();
    expect(screen.queryByText(/142 đơn/)).toBeNull();
    expect(screen.getByText('0 đơn')).toBeTruthy();

    // Verify all 7 real API routes were called (and NEVER /users)
    const calledPaths = apiSpy.mock.calls.map(([p]) => p);
    expect(calledPaths).toContain('/products?includeInactive=true');
    expect(calledPaths).toContain('/inventory/ingredients');
    expect(calledPaths).toContain('/orders');
    expect(calledPaths).toContain('/staff');
    expect(calledPaths).toContain('/admin/customers');
    expect(calledPaths).toContain('/inventory/dashboard');
    expect(calledPaths).toContain('/inventory/vouchers');
    expect(calledPaths).not.toContain('/users');

    // Empty Menu state (no INITIAL_PRODUCTS)
    fireEvent.click(screen.getByTestId('tab-menu'));
    await waitFor(() => {
      expect(screen.queryByText('Phin Sữa Đá Highlands')).toBeNull();
      expect(screen.getByText(/Thực đơn món \(0\)/)).toBeTruthy();
    });

    // Empty Inventory state (no INITIAL_INGREDIENTS)
    fireEvent.click(screen.getByTestId('tab-inventory'));
    await waitFor(() => {
      expect(screen.queryByText('Hạt Robusta Buôn Ma Thuột')).toBeNull();
      expect(screen.getByText('Chưa có nguyên liệu nào trong kho')).toBeTruthy();
    });

    // Empty Management state (no INITIAL_STAFF)
    fireEvent.click(screen.getByTestId('tab-management'));
    await waitFor(() => {
      expect(screen.getByText('Đội ngũ Barista & Thu ngân')).toBeTruthy();
      expect(screen.queryByText('thanh.barista@brewlite.vn')).toBeNull();
    });
  });

  it('WEB-T20 shows explicit Vietnamese error toast when initial data fetch fails', async () => {
    setAdminSession();
    createAdminApiMock({
      customHandler: async (path) => {
        if (path === '/staff') {
          return new Response(JSON.stringify({ message: 'Lỗi máy chủ' }), { status: 500 });
        }
        return null;
      },
    });

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText(/Không thể tải đầy đủ dữ liệu quản trị/i)).toBeTruthy();
    });
  });

  it('WEB-T20 toggles product visibility via PATCH /products/:id/visibility and rolls back on failure', async () => {
    setAdminSession();
    let shouldFail = false;
    const apiSpy = createAdminApiMock({
      customHandler: async (path, init) => {
        if (path === '/products/1/visibility' && init?.method === 'PATCH') {
          if (shouldFail) {
            return new Response(JSON.stringify({ message: 'Không thể cập nhật món' }), { status: 500 });
          }
          const body = JSON.parse(String(init.body));
          return new Response(
            JSON.stringify({
              id: 1,
              name: 'Cà phê Sữa',
              description: 'Cà phê pha phin truyền thống',
              basePrice: 35000,
              category: 'vietnamese',
              isActive: body.isActive,
              isSoldOutManual: !body.isActive,
              availableServings: body.isActive ? 42 : 0,
            }),
            { status: 200 },
          );
        }
        return null;
      },
    });

    render(<AdminPage />);

    fireEvent.click(screen.getByTestId('tab-menu'));
    await waitFor(() => {
      expect(screen.getByTestId('toggle-product-1')).toBeTruthy();
      // Inactive product #2 returned by includeInactive=true is also visible
      expect(screen.getByText('Trà Đào Cam Sả')).toBeTruthy();
    });

    // Success toggle OFF
    fireEvent.click(screen.getByTestId('toggle-product-1'));
    await waitFor(() => {
      expect(screen.getByText('Đã tạm ngưng bán món')).toBeTruthy();
    });

    const patchCall = apiSpy.mock.calls.find(([p]) => p === '/products/1/visibility');
    expect(patchCall).toBeTruthy();
    expect(JSON.parse(String(patchCall![1]?.body))).toMatchObject({ isActive: false });

    // Failed toggle ON -> rollback back to paused
    shouldFail = true;
    fireEvent.click(screen.getByTestId('toggle-product-1'));
    await waitFor(() => {
      expect(screen.getByText('Không thể cập nhật món')).toBeTruthy();
    });
    const card = screen.getByTestId('product-card-1');
    expect(card.textContent).toContain('Tạm ngưng bán');
  });

  it('WEB-T20 restocks ingredient via PATCH /inventory/ingredients/:id/restock ({ addAmount }) and rolls back on failure', async () => {
    setAdminSession();
    let failNext = false;
    const apiSpy = createAdminApiMock({
      customHandler: async (path, init) => {
        if (path === '/inventory/ingredients/10/restock' && init?.method === 'PATCH') {
          if (failNext) {
            return new Response(JSON.stringify({ message: 'Xung đột kho hàng' }), { status: 409 });
          }
          const body = JSON.parse(String(init.body));
          return new Response(
            JSON.stringify({
              id: 10,
              code: 'ING_ROBUSTA',
              name: 'Hạt Cà phê Robusta Đắk Lắk',
              unit: 'g',
              stock: 400 + body.addAmount,
              minThreshold: 500,
              status: 'OK',
              percentage: 70,
            }),
            { status: 200 },
          );
        }
        return null;
      },
    });

    render(<AdminPage />);

    fireEvent.click(screen.getByTestId('tab-inventory'));
    await waitFor(() => {
      expect(screen.getByTestId('quick-stockin-10')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('quick-stockin-10'));
    await waitFor(() => {
      expect(screen.getByText(/Đã nhập thêm/)).toBeTruthy();
    });

    const restockCall = apiSpy.mock.calls.find(([p]) => p === '/inventory/ingredients/10/restock');
    expect(restockCall).toBeTruthy();
    expect(restockCall![1]?.method).toBe('PATCH');
    const body = JSON.parse(String(restockCall![1]?.body));
    expect(body.addAmount).toBeGreaterThan(0);

    // Next attempt fails -> rollback stock back to 900
    failNext = true;
    fireEvent.click(screen.getByTestId('quick-stockin-10'));
    await waitFor(() => {
      expect(screen.getByText('Xung đột kho hàng')).toBeTruthy();
    });
    expect(screen.getByTestId('ingredient-card-10').textContent).toContain('900 g');
  });

  it('WEB-T20 creates product via POST /products using bottom sheet', async () => {
    setAdminSession();
    const apiSpy = createAdminApiMock({
      customHandler: async (path, init) => {
        if (path === '/products' && init?.method === 'POST') {
          const payload = JSON.parse(String(init.body));
          return new Response(
            JSON.stringify({
              id: 77,
              ...payload,
              isActive: true,
              availableServings: 0,
            }),
            { status: 201 },
          );
        }
        return null;
      },
    });

    render(<AdminPage />);
    fireEvent.click(screen.getByTestId('tab-menu'));
    await waitFor(() => expect(screen.getByTestId('add-product-btn')).toBeTruthy());

    fireEvent.click(screen.getByTestId('add-product-btn'));
    fireEvent.change(screen.getByPlaceholderText(/Cà Phê Trứng/i), {
      target: { value: 'Cà Phê Trứng Hà Nội' },
    });
    fireEvent.change(screen.getByPlaceholderText('39000'), {
      target: { value: '45000' },
    });
    fireEvent.click(screen.getByTestId('sheet-submit-btn'));

    await waitFor(() => {
      expect(screen.getByText('Cà Phê Trứng Hà Nội')).toBeTruthy();
    });

    const postCall = apiSpy.mock.calls.find(
      ([p, i]) => p === '/products' && i?.method === 'POST',
    );
    expect(postCall).toBeTruthy();
    expect(JSON.parse(String(postCall![1]?.body))).toMatchObject({
      name: 'Cà Phê Trứng Hà Nội',
      basePrice: 45000,
      category: 'vietnamese',
    });
  });

  it('WEB-T20 Management tab toggles staff & voucher status and creates staff & voucher via real APIs', async () => {
    setAdminSession();
    const apiSpy = createAdminApiMock({
      customHandler: async (path, init) => {
        if (path === '/staff/101/status' && init?.method === 'PATCH') {
          const body = JSON.parse(String(init.body));
          return new Response(JSON.stringify({ id: 101, isActive: body.isActive }), { status: 200 });
        }
        if (path === '/inventory/vouchers/5' && init?.method === 'PATCH') {
          const body = JSON.parse(String(init.body));
          return new Response(
            JSON.stringify({
              id: 5,
              code: 'BREW10',
              description: 'Giảm 10% tối đa 15.000đ',
              discountPercent: 10,
              isActive: body.isActive,
            }),
            { status: 200 },
          );
        }
        if (path === '/staff' && init?.method === 'POST') {
          const body = JSON.parse(String(init.body));
          return new Response(
            JSON.stringify({
              id: 105,
              fullName: body.fullName,
              email: body.email,
              role: body.role ?? 'STAFF',
              isActive: true,
            }),
            { status: 201 },
          );
        }
        if (path === '/inventory/vouchers' && init?.method === 'POST') {
          const body = JSON.parse(String(init.body));
          return new Response(
            JSON.stringify({
              id: 88,
              code: body.code,
              description: body.description || `Giảm ${body.discountPercent}% đơn hàng`,
              discountPercent: body.discountPercent,
              isActive: true,
            }),
            { status: 201 },
          );
        }
        return null;
      },
    });

    render(<AdminPage />);
    fireEvent.click(screen.getByTestId('tab-management'));

    await waitFor(() => {
      expect(screen.getByTestId('toggle-staff-101')).toBeTruthy();
    });

    // Toggle staff status
    fireEvent.click(screen.getByTestId('toggle-staff-101'));
    await waitFor(() => {
      expect(screen.getByText('Đã khóa tài khoản nhân viên')).toBeTruthy();
    });
    const staffPatch = apiSpy.mock.calls.find(([p]) => p === '/staff/101/status');
    expect(JSON.parse(String(staffPatch![1]?.body))).toEqual({ isActive: false });

    // Create new staff via bottom sheet
    fireEvent.click(screen.getByTestId('add-staff-btn'));
    fireEvent.change(screen.getByLabelText(/Họ và tên/i), {
      target: { value: 'Lê Bảo Bình' },
    });
    fireEvent.change(screen.getByLabelText(/Email đăng nhập/i), {
      target: { value: 'binh.staff@brewlite.vn' },
    });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByTestId('sheet-submit-btn'));

    await waitFor(() => {
      expect(screen.getByText('Lê Bảo Bình')).toBeTruthy();
    });

    // Switch to Customers subtab -> shows loyaltyPoints (185)
    fireEvent.click(screen.getByTestId('subtab-customers'));
    await waitFor(() => {
      expect(screen.getByText(/185 hạt vàng/)).toBeTruthy();
    });

    // Switch to Vouchers subtab -> toggle & create voucher
    fireEvent.click(screen.getByTestId('subtab-vouchers'));
    await waitFor(() => {
      expect(screen.getByTestId('toggle-voucher-5')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('toggle-voucher-5'));
    await waitFor(() => {
      expect(screen.getByText('Đã tắt mã voucher')).toBeTruthy();
    });
    const voucherPatch = apiSpy.mock.calls.find(([p]) => p === '/inventory/vouchers/5');
    expect(JSON.parse(String(voucherPatch![1]?.body))).toEqual({ isActive: false });

    fireEvent.click(screen.getByTestId('add-voucher-btn'));
    fireEvent.change(screen.getByLabelText('Mã voucher'), {
      target: { value: 'SUMMER25' },
    });
    fireEvent.change(screen.getByLabelText('Phần trăm giảm (%)'), {
      target: { value: '25' },
    });
    fireEvent.click(screen.getByTestId('sheet-submit-btn'));

    await waitFor(() => {
      expect(screen.getByText('SUMMER25')).toBeTruthy();
    });
  });

  it('WEB-T20 Management tab rolls back staff & voucher toggle and shows error toast when backend rejects', async () => {
    setAdminSession();
    createAdminApiMock({
      customHandler: async (path, init) => {
        if (path === '/staff/101/status' && init?.method === 'PATCH') {
          return new Response(
            JSON.stringify({ message: 'Không thể vô hiệu hóa tài khoản này' }),
            { status: 400 },
          );
        }
        if (path === '/inventory/vouchers/5' && init?.method === 'PATCH') {
          return new Response(
            JSON.stringify({ message: 'Không thể cập nhật voucher lúc này' }),
            { status: 500 },
          );
        }
        return null;
      },
    });

    render(<AdminPage />);
    fireEvent.click(screen.getByTestId('tab-management'));
    await waitFor(() => expect(screen.getByTestId('toggle-staff-101')).toBeTruthy());

    fireEvent.click(screen.getByTestId('toggle-staff-101'));
    await waitFor(() => {
      expect(screen.getByText('Không thể vô hiệu hóa tài khoản này')).toBeTruthy();
    });
    expect(screen.getByTestId('staff-card-101').textContent).toContain('Đang làm việc');

    fireEvent.click(screen.getByTestId('subtab-vouchers'));
    await waitFor(() => expect(screen.getByTestId('toggle-voucher-5')).toBeTruthy());

    fireEvent.click(screen.getByTestId('toggle-voucher-5'));
    await waitFor(() => {
      expect(screen.getByText('Không thể cập nhật voucher lúc này')).toBeTruthy();
    });
  });
});
