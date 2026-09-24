import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth() {
    return {
      statusCode: 200,
      status: 'ok',
      message: 'BrewLite Backend is running! 🍵',
      timestamp: new Date().toISOString(),
      service: 'BrewLite Backend v1.0',
    };
  }
}
