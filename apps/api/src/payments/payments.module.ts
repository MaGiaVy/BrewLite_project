import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockGatewayService } from './mock-gateway.service';
import { MockPaymentService } from './mock-payment.service';
import { ZaloPayService } from './zalopay.service';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MockGatewayService,
    MockPaymentService,
    ZaloPayService,
  ],
  exports: [
    PaymentsService,
    MockGatewayService,
    MockPaymentService,
    ZaloPayService,
  ],
})
export class PaymentsModule {}
