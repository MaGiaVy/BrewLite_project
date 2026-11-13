import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ExpireOrdersJob } from '../jobs/expire-orders.job';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [OrdersService, ExpireOrdersJob],
  exports: [OrdersService],
})
export class OrdersModule {}
