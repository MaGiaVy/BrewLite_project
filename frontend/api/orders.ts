import client from './client';

export interface CreateOrderItemPayload {
  productId: string;
  productName?: string;
  size: 'S' | 'M' | 'L';
  ice?: string;
  sugar?: string;
  quantity: number;
  toppingIds?: string[];
}

export interface CreateOrderPayload {
  items: CreateOrderItemPayload[];
  voucherCode?: string;
  paymentMethod?: 'WALLET' | 'CARD';
}

export interface OrderItemDetail {
  id: string;
  productId: string;
  size: 'S' | 'M' | 'L';
  ice?: string;
  sugar?: string;
  quantity: number;
  priceAtPurchase: number;
  lineTotal: number;
  product?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  toppings?: Array<{
    id: string;
    toppingId: string;
    toppingName: string;
    toppingPrice: number;
  }>;
}

export interface OrderDetail {
  id: string;
  userId: string;
  status: 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'PAYMENT_FAILED';
  subtotal: number;
  discountAmount: number;
  finalTotal: number;
  paymentMethod?: string;
  idempotencyKey?: string;
  createdAt: string;
  items: OrderItemDetail[];
  voucher?: {
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
  payments?: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
  }>;
}

/**
 * Tạo đơn hàng mới (POST /api/v1/orders)
 */
export async function createOrder(
  payload: CreateOrderPayload,
  idempotencyKey?: string
): Promise<OrderDetail> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  } else if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    headers['Idempotency-Key'] = crypto.randomUUID();
  }

  const res = await client.post('/api/v1/orders', payload, { headers });
  return res.data?.data;
}

/**
 * Lấy chi tiết đơn hàng theo ID (GET /api/v1/orders/:id)
 */
export async function fetchOrderById(id: string): Promise<OrderDetail> {
  const res = await client.get(`/api/v1/orders/${id}`);
  return res.data?.data;
}

/**
 * Lấy lịch sử đơn hàng của người dùng hiện tại (GET /api/v1/orders/me)
 */
export async function fetchMyOrders(): Promise<OrderDetail[]> {
  const res = await client.get('/api/v1/orders/me');
  return res.data?.data || [];
}

/**
 * Hủy đơn hàng (PATCH /api/v1/orders/:id/cancel)
 */
export async function cancelOrder(id: string): Promise<OrderDetail> {
  const res = await client.patch(`/api/v1/orders/${id}/cancel`);
  return res.data?.data;
}
