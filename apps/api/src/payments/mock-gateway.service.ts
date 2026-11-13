import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface GatewayChargeResult {
  success: boolean;
  transactionId: string;
  gatewayRef?: string;
  message?: string;
}

@Injectable()
export class MockGatewayService {
  async charge(
    _amount: number,
    method: PaymentMethod,
    simulateFailure?: boolean,
  ): Promise<GatewayChargeResult> {
    const isFailure =
      process.env.MOCK_PAYMENT_MODE === 'failure' || Boolean(simulateFailure);
    const transactionId = `TXN-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const gatewayRef = `GW-${method}-${randomUUID().slice(0, 12).toUpperCase()}`;

    if (isFailure) {
      return {
        success: false,
        transactionId,
        gatewayRef,
        message: 'Giao dịch thanh toán bị từ chối bởi cổng thanh toán giả lập',
      };
    }

    return {
      success: true,
      transactionId,
      gatewayRef,
      message: 'Giao dịch thanh toán thành công',
    };
  }
}
