import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { assertTransition } from './state-machine.helper';
import { MockGatewayService } from './mock-gateway.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentGateway: MockGatewayService = new MockGatewayService(),
  ) {}

  async processPayment(dto: CreatePaymentDto, userId: number, idempotencyKey?: string): Promise<any> {
    const order = await (this.prisma as any).order.findUnique({ where: { id: dto.orderId }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId != null && order.userId !== userId) throw new BadRequestException('Order ownership mismatch');
    if (order.status === OrderStatus.CANCELLED) throw new BadRequestException('Order is cancelled');
    const gatewayResult = await this.paymentGateway.charge(order.totalAmount, dto.method);
    const next = gatewayResult.success ? OrderStatus.PAID : OrderStatus.PAYMENT_FAILED;
    return this.prisma.$transaction(async (tx: any) => {
      if (idempotencyKey) {
        const previous = await tx.payment.findUnique({ where: { idempotencyKey }, include: { order: true } });
        if (previous) {
          return {
            success: previous.status === PaymentStatus.SUCCESS,
            paymentId: previous.id,
            orderId: previous.orderId,
            status: previous.order.status,
            paymentStatus: previous.status,
            amount: previous.amount,
            method: previous.method,
            isIdempotent: true,
          };
        }
      }
      const locked = await tx.order.findUnique({ where: { id: dto.orderId } });
      if (!locked) throw new NotFoundException('Order not found');
      assertTransition(locked.status, next);
      const changed = await tx.order.updateMany({ where: { id: locked.id, version: locked.version }, data: { status: next, version: { increment: 1 } } });
      if (changed.count !== 1) throw new ConflictException('Order was changed by another request');
      const payment = await tx.payment.create({ data: { orderId: locked.id, amount: locked.totalAmount, method: dto.method, status: gatewayResult.success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED, idempotencyKey: idempotencyKey ?? null } });
      const pointsEarned = gatewayResult.success ? Math.floor(locked.totalAmount / 1000) : 0;
      if (pointsEarned && locked.userId && tx.user?.update) await tx.user.update({ where: { id: locked.userId }, data: { loyaltyPoints: { increment: pointsEarned } } });
      return { success: gatewayResult.success, paymentId: payment.id, orderId: locked.id, status: next, paymentStatus: payment.status, amount: payment.amount, method: payment.method, pointsEarned, transactionId: gatewayResult.transactionId };
    });
  }
}
