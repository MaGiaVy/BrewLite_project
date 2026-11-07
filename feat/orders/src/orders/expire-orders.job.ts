import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrdersService } from './orders.service.js';

@Injectable()
export class ExpireJob implements OnModuleInit {
  private readonly logger = new Logger(ExpireJob.name);

  constructor(private readonly ordersService: OrdersService) {}

  onModuleInit() {
    this.ordersService.cancelExpiredPendingOrders().catch((error: unknown) => {
      this.logger.error('Lỗi khi quét đơn hết hạn lúc khởi động:', error);
    });
  }

  @Cron('0 * * * * *')
  async run() {
    try {
      await this.ordersService.cancelExpiredPendingOrders();
    } catch (error: unknown) {
      this.logger.error('Lỗi khi quét định kỳ đơn hết hạn:', error);
    }
  }
}
