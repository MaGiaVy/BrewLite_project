import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller(['orders', 'api/v1/orders'])
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @CurrentUser('id') userId: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() dto: CreateOrderDto
  ) {
    const data = await this.ordersService.createOrder(userId, idempotencyKey, dto);
    return {
      statusCode: (data as any)?.isIdempotentReplay ? 200 : 201,
      message: (data as any)?.isIdempotentReplay
        ? 'Lấy lại đơn hàng đã tạo trước đó'
        : 'Tạo đơn hàng thành công',
      data,
    };
  }

  @Get('me')
  async getMyOrders(@CurrentUser('id') userId: string) {
    const data = await this.ordersService.findAllByUser(userId);
    return {
      statusCode: 200,
      message: 'Lấy lịch sử đơn hàng thành công',
      data,
    };
  }

  @Get(':id')
  async getOrderById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    const data = await this.ordersService.findOne(id, userId);
    return {
      statusCode: 200,
      message: 'Lấy chi tiết đơn hàng thành công',
      data,
    };
  }

  @Patch(':id/cancel')
  async cancelOrder(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    const data = await this.ordersService.cancelOrder(id, userId);
    return {
      statusCode: 200,
      message: 'Hủy đơn hàng thành công',
      data,
    };
  }
}
