import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { expirePendingOrders } from '../orders/order-refund.helper';

@Injectable()
export class ExpireOrdersJob {
  private readonly logger = new Logger(ExpireOrdersJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('*/1 * * * *')
  async handleExpiredOrders(): Promise<void> {
    try {
      const count = await expirePendingOrders(this.prisma, this.logger, {
        timeoutMinutes: 15,
      });
      if (count > 0) {
        this.logger.log(
          `Expired ${count} pending order(s) older than 15 minutes and restored BOM stock.`,
        );
      }
    } catch (err) {
      this.logger.error('Failed to expire pending orders', err);
    }
  }
}
