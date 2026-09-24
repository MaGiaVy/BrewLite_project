import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return health status with statusCode 200', () => {
      const result = appController.getHealth();
      expect(result.statusCode).toBe(200);
      expect(result.status).toBe('ok');
      expect(result.message).toContain('Backend');
      expect(result.service).toBe('BrewLite Backend v1.0');
      expect(result.timestamp).toBeDefined();
    });
  });
});
