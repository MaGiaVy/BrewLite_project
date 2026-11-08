import { Body, Controller, Headers, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @Headers('x-user-id') userId = '1', @Headers('idempotency-key') key?: string) {
    return this.ordersService.createOrder(dto, Number(userId), key);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: OrderStatus, @Headers('x-user-id') userId = '1') {
    return this.ordersService.updateOrderStatus(id, status, Number(userId));
  }
}
