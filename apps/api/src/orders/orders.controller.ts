import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface AuthRequest extends Request {
  user: { userId: number; email: string; role?: Role };
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createOrder(
    @Request() req: AuthRequest,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.ordersService.createOrder(dto, req.user.userId, idempotencyKey);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAllForAdmin() {
    return this.ordersService.getAllOrdersForAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyOrders(@Request() req: AuthRequest) {
    return this.ordersService.getMyOrders(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @Get('barista/queue')
  getBaristaQueue() {
    return this.ordersService.getBaristaQueue();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getOrderById(
    @Request() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.getOrderById(id, req.user.userId, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateOrderStatus(
    @Request() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      dto.status,
      req.user.userId,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteOrder(
    @Request() req: AuthRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.deleteOrder(id, req.user.userId, req.user.role);
  }
}
