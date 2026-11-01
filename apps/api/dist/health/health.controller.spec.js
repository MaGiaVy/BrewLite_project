"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const prisma_service_1 = require("../prisma/prisma.service");
const health_controller_1 = require("./health.controller");
describe('HealthController', () => {
    let controller;
    const prisma = { $queryRaw: jest.fn() };
    beforeEach(async () => {
        prisma.$queryRaw.mockReset();
        const moduleRef = await testing_1.Test.createTestingModule({
            controllers: [health_controller_1.HealthController],
            providers: [{ provide: prisma_service_1.PrismaService, useValue: prisma }],
        }).compile();
        controller = moduleRef.get(health_controller_1.HealthController);
    });
    it('API-T16: GET /health returns { status: ok, db: up } when the database responds', async () => {
        prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
        await expect(controller.check()).resolves.toEqual({ status: 'ok', db: 'up' });
        expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });
    it('GET /health returns 503 when the database is unreachable', async () => {
        prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));
        const result = controller.check();
        await expect(result).rejects.toBeInstanceOf(common_1.ServiceUnavailableException);
        await expect(result).rejects.toMatchObject({
            status: 503,
            response: { status: 'error', db: 'down' },
        });
    });
});
