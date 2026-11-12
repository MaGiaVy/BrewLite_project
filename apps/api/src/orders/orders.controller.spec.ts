import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ROLES_KEY } from '../auth/roles.decorator';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: {
    createOrder: jest.Mock;
    getAllOrdersForAdmin: jest.Mock;
    getMyOrders: jest.Mock;
    getOrderById: jest.Mock;
    updateOrderStatus: jest.Mock;
    deleteOrder: jest.Mock;
    getBaristaQueue: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createOrder: jest.fn(),
      getAllOrdersForAdmin: jest.fn(),
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      updateOrderStatus: jest.fn(),
      deleteOrder: jest.fn(),
      getBaristaQueue: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createOrder should forward userId and optional idempotency-key header', async () => {
    const mockReq = { user: { userId: 5, email: 'test@example.com', role: Role.CUSTOMER } };
    const dto = { items: [{ productId: 1, size: 'M', toppings: [], quantity: 1 }] };
    service.createOrder.mockResolvedValue({ id: 11, orderId: 11 });

    const res = await controller.createOrder(mockReq as any, dto as any, 'idem-key-123');
    expect(service.createOrder).toHaveBeenCalledWith(dto, 5, 'idem-key-123');
    expect(res).toEqual({ id: 11, orderId: 11 });
  });

  it('findAllForAdmin should enforce ADMIN role metadata and call service.getAllOrdersForAdmin', async () => {
    const reflector = new Reflector();
    const roles = reflector.get<Role[]>(ROLES_KEY, OrdersController.prototype.findAllForAdmin);
    expect(roles).toEqual([Role.ADMIN]);

    service.getAllOrdersForAdmin.mockResolvedValue([{ id: 1 }]);
    const res = await controller.findAllForAdmin();
    expect(service.getAllOrdersForAdmin).toHaveBeenCalled();
    expect(res).toEqual([{ id: 1 }]);
  });

  it('getMyOrders should call service.getMyOrders with req.user.userId', async () => {
    const mockReq = { user: { userId: 5, email: 'test@example.com' } };
    service.getMyOrders.mockResolvedValue([]);

    await controller.getMyOrders(mockReq as any);

    expect(service.getMyOrders).toHaveBeenCalledWith(5);
  });

  it('updateOrderStatus should call service.updateOrderStatus with orderId, status, userId and role', async () => {
    const mockReq = {
      user: { userId: 7, email: 'barista@brewlite.com', role: 'STAFF' },
    };
    const mockResult = { orderId: 10, status: 'PREPARING' };
    service.updateOrderStatus.mockResolvedValue(mockResult);

    const result = await controller.updateOrderStatus(
      mockReq as any,
      10,
      { status: 'PREPARING' as any },
    );

    expect(service.updateOrderStatus).toHaveBeenCalledWith(
      10,
      'PREPARING',
      7,
      'STAFF',
    );
    expect(result).toEqual(mockResult);
  });

  it('updateOrderStatus should forward customer role when customer cancels order', async () => {
    const mockReq = {
      user: { userId: 5, email: 'customer@brewlite.com', role: 'CUSTOMER' },
    };
    const mockResult = { orderId: 10, status: 'CANCELLED' };
    service.updateOrderStatus.mockResolvedValue(mockResult);

    const result = await controller.updateOrderStatus(
      mockReq as any,
      10,
      { status: 'CANCELLED' as any },
    );

    expect(service.updateOrderStatus).toHaveBeenCalledWith(
      10,
      'CANCELLED',
      5,
      'CUSTOMER',
    );
    expect(result).toEqual(mockResult);
  });

  it('updateOrderStatus should forward customer role when customer retries PAYMENT_FAILED order to PENDING', async () => {
    const mockReq = {
      user: { userId: 5, email: 'customer@brewlite.com', role: 'CUSTOMER' },
    };
    const mockResult = {
      orderId: 10,
      previousStatus: 'PAYMENT_FAILED',
      status: 'PENDING',
    };
    service.updateOrderStatus.mockResolvedValue(mockResult);

    const result = await controller.updateOrderStatus(
      mockReq as any,
      10,
      { status: 'PENDING' as any },
    );

    expect(service.updateOrderStatus).toHaveBeenCalledWith(
      10,
      'PENDING',
      5,
      'CUSTOMER',
    );
    expect(result).toEqual(mockResult);
  });

  it('deleteOrder should call service.deleteOrder with orderId, userId and role', async () => {
    const mockReq = {
      user: { userId: 5, email: 'customer@brewlite.com', role: 'CUSTOMER' },
    };
    const mockResult = { success: true, message: 'Đã xóa đơn hàng #10' };
    service.deleteOrder.mockResolvedValue(mockResult);

    const result = await controller.deleteOrder(mockReq as any, 10);

    expect(service.deleteOrder).toHaveBeenCalledWith(10, 5, 'CUSTOMER');
    expect(result).toEqual(mockResult);
  });
});
