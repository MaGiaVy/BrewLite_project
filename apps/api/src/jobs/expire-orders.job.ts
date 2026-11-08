import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class ExpireOrdersJob {
  private readonly logger = new Logger(ExpireOrdersJob.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredOrders(): Promise<void> {
    const cancelledCount = await this.ordersService.cancelExpiredPendingOrders();
    if (cancelledCount > 0) {
      this.logger.log(`Automatically cancelled ${cancelledCount} expired order(s).`);
    }
  }
}
