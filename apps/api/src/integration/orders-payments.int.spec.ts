import { createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../app.module';
import { MockGatewayService } from '../payments/mock-gateway.service';
import { PrismaService } from '../prisma/prisma.service';

const databaseUrl = process.env.TEST_DATABASE_URL;
const runIntegrationSuite = databaseUrl ? describe : describe.skip;

function tokenFor(userId: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ userId, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  const signature = createHmac('sha256', process.env.JWT_SECRET!)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

const orderBody = (productId: number, quantity = 1) => ({
  items: [{ productId, productName: 'Test coffee', size: 'M', toppings: [], quantity, unitPrice: 1 }],
});

runIntegrationSuite('orders and payments integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: number;
  let productId: number;

  beforeAll(async () => {
    if (databaseUrl) {
      execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'migrate', 'reset', '--force', '--skip-seed'], {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'inherit',
      });
    }
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.productTopping.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    const user = await prisma.user.create({ data: { email: `integration-${Date.now()}@test.local` } });
    const product = await prisma.product.create({
      data: { name: `Integration coffee ${Date.now()}`, basePrice: 45000, sizeUpchargeM: 5000, stock: 10 },
    });
    userId = user.id;
    productId = product.id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('INT-T01 creates an order, pays successfully, persists PAID and decrements stock', async () => {
    const auth = { Authorization: `Bearer ${tokenFor(userId)}` };
    const orderResponse = await request(app.getHttpServer()).post('/orders').set(auth).send(orderBody(productId)).expect(201);
    const paymentResponse = await request(app.getHttpServer()).post('/payments')
      .set(auth)
      .set('Idempotency-Key', `payment-${Date.now()}`)
      .send({ orderId: orderResponse.body.orderId, method: PaymentMethod.EWALLET })
      .expect(201);

    expect(paymentResponse.body.status).toBe(OrderStatus.PAID);
    const order = await prisma.order.findUnique({ where: { id: orderResponse.body.orderId } });
    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(order?.status).toBe(OrderStatus.PAID);
    expect(product?.stock).toBe(9);
    expect(paymentResponse.body.pointsEarned).toBe(50);
  });

  it('INT-T02 makes a repeated payment idempotent and records one payment', async () => {
    const auth = { Authorization: `Bearer ${tokenFor(userId)}` };
    const orderResponse = await request(app.getHttpServer()).post('/orders').set(auth).send(orderBody(productId)).expect(201);
    const key = `payment-${Date.now()}`;
    const body = { orderId: orderResponse.body.orderId, method: PaymentMethod.EWALLET };
    await request(app.getHttpServer()).post('/payments').set(auth).set('Idempotency-Key', key).send(body).expect(201);
    const duplicate = await request(app.getHttpServer()).post('/payments').set(auth).set('Idempotency-Key', key).send(body).expect(201);

    expect(duplicate.body.isIdempotent).toBe(true);
    expect(await prisma.payment.count({ where: { idempotencyKey: key } })).toBe(1);
    expect(await prisma.user.findUnique({ where: { id: userId } })).toMatchObject({ loyaltyPoints: 50 });
  });

  it('INT-T03 allows only one of two concurrent orders when stock is one', async () => {
    await prisma.product.update({ where: { id: productId }, data: { stock: 1 } });
    const auth = { Authorization: `Bearer ${tokenFor(userId)}` };
    const responses = await Promise.all([
      request(app.getHttpServer()).post('/orders').set(auth).send(orderBody(productId)),
      request(app.getHttpServer()).post('/orders').set(auth).send(orderBody(productId)),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect((await prisma.product.findUnique({ where: { id: productId } }))?.stock).toBe(0);
  });

  it('INT-T04 records payment failure, preserves stock, then allows a successful retry', async () => {
    const gateway = app.get(MockGatewayService);
    jest.spyOn(gateway, 'charge')
      .mockResolvedValueOnce({ success: false, transactionId: 'FAILED-TEST' })
      .mockResolvedValueOnce({ success: true, transactionId: 'SUCCESS-TEST' });
    const auth = { Authorization: `Bearer ${tokenFor(userId)}` };
    const orderResponse = await request(app.getHttpServer()).post('/orders').set(auth).send(orderBody(productId)).expect(201);
    const orderId = orderResponse.body.orderId;

    await request(app.getHttpServer()).post('/payments').set(auth).send({ orderId, method: PaymentMethod.EWALLET }).expect(201);
    expect((await prisma.order.findUnique({ where: { id: orderId } }))?.status).toBe(OrderStatus.PAYMENT_FAILED);
    expect((await prisma.product.findUnique({ where: { id: productId } }))?.stock).toBe(9);

    await request(app.getHttpServer()).post('/payments').set(auth).send({ orderId, method: PaymentMethod.EWALLET }).expect(201);
    expect((await prisma.order.findUnique({ where: { id: orderId } }))?.status).toBe(OrderStatus.PAID);
    expect(await prisma.payment.count({ where: { orderId, status: PaymentStatus.FAILED } })).toBe(1);
    expect(await prisma.payment.count({ where: { orderId, status: PaymentStatus.SUCCESS } })).toBe(1);
  });

  it('INT-T05 rejects order creation without a JWT', async () => {
    await request(app.getHttpServer()).post('/orders').send(orderBody(productId)).expect(401);
  });
});
