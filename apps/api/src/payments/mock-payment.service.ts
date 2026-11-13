import { Injectable, Logger } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface ProcessPaymentParams {
  amount: number;
  method: PaymentMethod;
  simulateFailure?: boolean;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  gatewayRef: string;
  message: string;
}

@Injectable()
export class MockPaymentService {
  private readonly logger = new Logger(MockPaymentService.name);

  async processPayment(params: ProcessPaymentParams): Promise<PaymentResult> {
    const { amount, method, simulateFailure } = params;
    const isFailure =
      process.env.MOCK_PAYMENT_MODE === 'failure' || Boolean(simulateFailure);
    const transactionId = `TXN-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const gatewayRef = `GW-${method}-${randomUUID().slice(0, 12).toUpperCase()}`;

    this.logger.log(
      `[MockPayment] Xử lý thanh toán: ${amount} VNĐ qua ${method}. simulateFailure=${isFailure}`,
    );

    if (isFailure) {
      return {
        success: false,
        transactionId,
        gatewayRef,
        message: 'Giao dịch thanh toán bị từ chối bởi ngân hàng/ví điện tử (Demo Failure)',
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
