import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

interface AuthRequest extends Request {
  user: { userId: number; email: string; role?: Role };
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private assertMockPaymentAllowed(): void {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_PAYMENT === 'false') {
      throw new ForbiddenException(
        'Cổng thanh toán thử nghiệm (Mock Payment) đã bị vô hiệu hóa trên môi trường Production.',
      );
    }
  }

  private assertSandboxConfirmAllowed(message: string): void {
    if (process.env.ALLOW_SANDBOX_CONFIRM !== 'true') {
      throw new ForbiddenException(message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  processPayment(
    @Request() req: AuthRequest,
    @Body() dto: CreatePaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    this.assertMockPaymentAllowed();
    return this.paymentsService.processPayment(
      dto,
      req.user.userId,
      idempotencyKey,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('zalopay/create')
  @HttpCode(HttpStatus.OK)
  createZaloPayOrder(
    @Request() req: AuthRequest,
    @Body('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.paymentsService.createZaloPayOrder(
      orderId,
      req.user.userId,
      req.user.role,
    );
  }

  @Post('zalopay/callback')
  @HttpCode(HttpStatus.OK)
  handleZaloPayCallback(@Body() body: { data: string; mac: string; type?: number }) {
    return this.paymentsService.handleZaloPayCallback(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('zalopay/status/:orderId')
  @HttpCode(HttpStatus.OK)
  getZaloPayStatus(
    @Request() req: AuthRequest,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Query('appTransId') appTransId?: string,
  ) {
    return this.paymentsService.getZaloPayStatus(
      orderId,
      req.user.userId,
      appTransId,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('zalopay/confirm')
  @HttpCode(HttpStatus.OK)
  confirmZaloPayOrder(
    @Request() req: AuthRequest,
    @Body('orderId', new ParseIntPipe({ optional: true })) orderId?: number | string,
    @Body('appTransId') appTransId?: string,
  ) {
    this.assertSandboxConfirmAllowed(
      'Xác nhận thanh toán Sandbox bị vô hiệu hóa trên môi trường Production. Vui lòng sử dụng Webhook chính thức từ ZaloPay.',
    );
    const targetOrderId =
      orderId === undefined || orderId === null || orderId === ''
        ? undefined
        : typeof orderId === 'number'
          ? orderId
          : Number(orderId);
    return this.paymentsService.confirmZaloPaySandbox(
      targetOrderId,
      req.user.userId,
      req.user.role,
      appTransId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('zalopay/cancel')
  @HttpCode(HttpStatus.OK)
  cancelZaloPayOrder(
    @Request() req: AuthRequest,
    @Body('orderId', ParseIntPipe) orderId: number,
  ) {
    this.assertSandboxConfirmAllowed(
      'Hủy thanh toán Sandbox bị vô hiệu hóa trên môi trường Production.',
    );
    return this.paymentsService.cancelZaloPaySandbox(
      orderId,
      req.user.userId,
      req.user.role,
    );
  }
}
