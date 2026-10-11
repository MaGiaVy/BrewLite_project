import {
  Body,
  Controller,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { ProcessPaymentDto } from './dto/process-payment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller(['payments', 'api/v1/payments'])
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async processPayment(
    @CurrentUser('id') userId: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() dto: ProcessPaymentDto
  ) {
    return await this.paymentsService.processPayment(userId, idempotencyKey, dto);
  }
}
