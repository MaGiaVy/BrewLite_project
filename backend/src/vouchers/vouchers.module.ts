import { Module } from '@nestjs/common';
import { VouchersController } from './vouchers.controller.js';
import { VouchersService } from './vouchers.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [VouchersController],
  providers: [VouchersService, PrismaService],
  exports: [VouchersService],
})
export class VouchersModule {}
