"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true });
    await app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0');
}
void bootstrap();
