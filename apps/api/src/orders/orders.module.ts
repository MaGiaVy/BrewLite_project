import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ExpireOrdersJob } from '../jobs/expire-orders.job';

@Module({ controllers: [OrdersController], providers: [OrdersService, ExpireOrdersJob], exports: [OrdersService] })
export class OrdersModule {}
