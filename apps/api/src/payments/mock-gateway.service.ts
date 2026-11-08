import { Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';

export interface GatewayChargeResult {
  success: boolean;
  transactionId: string;
}

@Injectable()
export class MockGatewayService {
  async charge(amount: number, method: PaymentMethod): Promise<GatewayChargeResult> {
    return {
      success: true,
      transactionId: `MOCK-${method}-${amount}-${Date.now()}`,
    };
  }
}
