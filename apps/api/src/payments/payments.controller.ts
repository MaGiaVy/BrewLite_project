import { Body, Controller, Headers, Post } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  process(@Body() dto: CreatePaymentDto, @Headers('x-user-id') userId = '1', @Headers('idempotency-key') key?: string) {
    return this.paymentsService.processPayment(dto, Number(userId), key);
  }
}
