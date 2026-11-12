import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrderConfirmationPage from '../page';

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});

vi.mock('../../../../lib/api-client', () => ({
  apiClient: vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve({}),
    }),
  ),
}));

describe('Task T5.1e — Order Confirmation Mobile UI (/orders/[id]/confirmation)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders confirmation page with order ID, status, and headline', async () => {
    const paramsPromise = Promise.resolve({ id: '9988' });
    render(<OrderConfirmationPage params={paramsPromise} />);

    expect(await screen.findByText(/#BL-9988/i)).toBeTruthy();
    expect(screen.getByText(/Đặt hàng & Thanh toán thành công!/i)).toBeTruthy();
    expect(screen.getByText(/PAID • ĐÃ THANH TOÁN/i)).toBeTruthy();
  });

  it('renders express pickup station information and 3-step live stepper', async () => {
    const paramsPromise = Promise.resolve({ id: '9988' });
    render(<OrderConfirmationPage params={paramsPromise} />);

    expect(await screen.findByText(/Downtown Roastery Bar - 124 Lê Lợi/i)).toBeTruthy();
    expect(screen.getByText(/Kệ Express Bar số 04/i)).toBeTruthy();
    expect(screen.getByText(/1. Đã thanh toán/i)).toBeTruthy();
    expect(screen.getByText(/2. Đang pha chế/i)).toBeTruthy();
    expect(screen.getByText(/3. Sẵn sàng lấy/i)).toBeTruthy();
  });

  it('renders order items with customization attributes and separate toppings', async () => {
    const mockOrder = {
      id: 'ord-test-1',
      status: 'PAID',
      totalAmount: 92000,
      subtotal: 92000,
      discountAmount: 0,
      paymentMethod: 'Ví MoMo Express',
      createdAt: new Date().toISOString(),
      items: [
        {
          id: 1,
          productId: 4,
          productName: 'Cà phê Muối Đặc Biệt',
          size: 'L',
          temperature: 'iced',
          iceLevel: '50% đá',
          sugarLevel: '70% đường',
          toppings: ['Trân châu trắng giòn', 'Thêm Kem Muối Béo'],
          notes: 'Ít ngọt nhiều béo',
          quantity: 1,
          unitPrice: 92000,
        },
      ],
    };
    window.localStorage.setItem('order_details_ord-test-1', JSON.stringify(mockOrder));

    const paramsPromise = Promise.resolve({ id: 'ord-test-1' });
    render(<OrderConfirmationPage params={paramsPromise} />);

    expect(await screen.findByText('Cà phê Muối Đặc Biệt')).toBeTruthy();
    expect(screen.getByText('Size L')).toBeTruthy();
    expect(screen.getByText('Uống Lạnh')).toBeTruthy();
    expect(screen.getByText('50% đá')).toBeTruthy();
    expect(screen.getByText('70% đường')).toBeTruthy();
    expect(screen.getByText('Trân châu trắng giòn')).toBeTruthy();
    expect(screen.getByText('Thêm Kem Muối Béo')).toBeTruthy();
    expect(screen.getByText(/Ít ngọt nhiều béo/i)).toBeTruthy();
  });

  it('renders payment summary, loyalty reward points, and eco receipt', async () => {
    const mockOrder = {
      id: 'ord-test-2',
      status: 'PAID',
      totalAmount: 80000,
      subtotal: 80000,
      discountAmount: 0,
      paymentMethod: 'Thẻ ngân hàng',
      createdAt: new Date().toISOString(),
      items: [
        {
          id: 1,
          productId: 1,
          productName: 'Cà phê Đen',
          size: 'M',
          quantity: 2,
          unitPrice: 40000,
        },
      ],
    };
    window.localStorage.setItem('order_details_ord-test-2', JSON.stringify(mockOrder));

    const paramsPromise = Promise.resolve({ id: 'ord-test-2' });
    render(<OrderConfirmationPage params={paramsPromise} />);

    expect(await screen.findByText('Tổng thanh toán')).toBeTruthy();
    expect(screen.getByText('+80 Hạt Vàng BrewLite Club')).toBeTruthy();
    expect(screen.getByText(/100% Cốc Bã Mía Sinh Học/i)).toBeTruthy();
  });

  it('renders navigation buttons linking to /menu and /orders', async () => {
    const paramsPromise = Promise.resolve({ id: '9988' });
    render(<OrderConfirmationPage params={paramsPromise} />);

    const menuBtn = await screen.findByRole('link', { name: /Tiếp tục đặt món/i });
    expect(menuBtn).toBeTruthy();
    expect(menuBtn.getAttribute('href')).toBe('/menu');

    const ordersBtn = screen.getByRole('link', { name: /Xem lịch sử đơn hàng/i });
    expect(ordersBtn).toBeTruthy();
    expect(ordersBtn.getAttribute('href')).toBe('/orders');
  });

  it('copies order code to clipboard when clicking copy button', async () => {
    const paramsPromise = Promise.resolve({ id: '12345' });
    render(<OrderConfirmationPage params={paramsPromise} />);

    const copyBtn = await screen.findByRole('button', { name: /Chép mã/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('12345');
    expect(await screen.findByText(/Đã chép/i)).toBeTruthy();
  });

  it('handles simulated E-Receipt download', async () => {
    const paramsPromise = Promise.resolve({ id: '9988' });
    render(<OrderConfirmationPage params={paramsPromise} />);

    const receiptBtn = await screen.findByText(/Tải hóa đơn điện tử/i);
    fireEvent.click(receiptBtn);

    expect(await screen.findByText(/Đang tải hóa đơn/i)).toBeTruthy();
    await waitFor(
      () => {
        expect(screen.getByText(/Đã lưu hóa đơn điện tử/i)).toBeTruthy();
      },
      { timeout: 2500 },
    );
  });
});
