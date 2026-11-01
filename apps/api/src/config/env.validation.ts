import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum MockPaymentMode {
  Success = 'success',
  Failure = 'failure',
}

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  @Matches(/^postgres(ql)?:\/\//, {
    message: 'DATABASE_URL must start with postgresql:// or postgres://',
  })
  DATABASE_URL!: string;

  @IsString()
  @MinLength(16, { message: 'JWT_SECRET must be at least 16 characters' })
  JWT_SECRET!: string;

  @IsEnum(MockPaymentMode, {
    message: `MOCK_PAYMENT_MODE must be one of: ${Object.values(MockPaymentMode).join(', ')}`,
  })
  MOCK_PAYMENT_MODE!: MockPaymentMode;

  @IsOptional()
  @IsString()
  @Matches(/^\d+[dhm]?$/, {
    message: 'JWT_EXPIRES_IN must look like 7d, 12h, 30m or a number of seconds',
  })
  JWT_EXPIRES_IN?: string = '7d';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number = 3001;

  @IsOptional()
  @IsIn(['development', 'test', 'production'])
  NODE_ENV?: 'development' | 'test' | 'production' = 'development';

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string = 'http://localhost:3000';
}

/**
 * Dùng với `ConfigModule.forRoot({ isGlobal: true, validate: validateEnv })`.
 * Ném lỗi (app từ chối khởi động) nếu biến môi trường thiếu hoặc sai định dạng.
 */
export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((error) => {
        const messages = Object.values(error.constraints ?? {}).join('; ');
        return `  - ${error.property}: ${messages}`;
      })
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return validated;
}
