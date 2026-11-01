import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const prisma = { $queryRaw: jest.fn() };

  beforeEach(async () => {
    prisma.$queryRaw.mockReset();
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    controller = moduleRef.get(HealthController);
  });

  it('API-T16: GET /health returns { status: ok, db: up } when the database responds', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.check()).resolves.toEqual({ status: 'ok', db: 'up' });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('GET /health returns 503 when the database is unreachable', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    const result = controller.check();
    await expect(result).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(result).rejects.toMatchObject({
      status: 503,
      response: { status: 'error', db: 'down' },
    });
  });
});
