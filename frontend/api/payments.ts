import client from './client';

export interface ProcessPaymentPayload {
  orderId: string;
  amount: number;
  method: 'WALLET' | 'CARD';
  forceSuccess?: boolean;
}

export interface PaymentResult {
  statusCode: number;
  message: string;
  data: {
    status: 'SUCCESS' | 'FAILURE';
    paymentId?: string;
    orderId: string;
    amount: number;
    loyaltyPointsAdded?: number;
    userLoyaltyPoints?: number;
    reason?: string;
  };
}

/**
 * Gửi yêu cầu thanh toán tới Mock Gateway (POST /api/v1/payments)
 */
export async function processPayment(
  payload: ProcessPaymentPayload,
  idempotencyKey?: string
): Promise<PaymentResult> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  } else if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    headers['Idempotency-Key'] = crypto.randomUUID();
  }

  const res = await client.post('/api/v1/payments', payload, { headers });
  return res.data;
}
