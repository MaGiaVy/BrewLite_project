import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kích hoạt ValidationPipe toàn cục để tự động kiểm tra DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  // Cho phép Frontend (port 3000) gọi API sang Backend (port 3001)
  app.enableCors();

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
