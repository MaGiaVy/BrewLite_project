import { Body, Controller, Headers, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { OrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @Req() request: Request & { user?: { userId: number } }, @Headers('idempotency-key') key?: string) {
    return this.ordersService.createOrder(dto, request.user!.userId, key);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: OrderStatus, @Req() request: Request & { user?: { userId: number } }) {
    return this.ordersService.updateOrderStatus(id, status, request.user!.userId);
  }
}
