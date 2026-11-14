import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const corsOrigin = process.env.CORS_ORIGIN;
  const origin =
    !corsOrigin || corsOrigin === '*'
      ? true
      : corsOrigin.includes(',')
        ? corsOrigin.split(',').map((o) => o.trim())
        : corsOrigin;

  app.enableCors({
    origin,
    credentials: true,
  });
  await app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0');
}

void bootstrap();
