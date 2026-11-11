import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  process(@Body() dto: CreatePaymentDto, @Req() request: Request & { user?: { userId: number } }, @Headers('idempotency-key') key?: string) {
    return this.paymentsService.processPayment(dto, request.user!.userId, key);
  }
}
