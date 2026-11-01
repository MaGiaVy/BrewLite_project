"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentVariables = exports.MockPaymentMode = void 0;
exports.validateEnv = validateEnv;
require("reflect-metadata");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var MockPaymentMode;
(function (MockPaymentMode) {
    MockPaymentMode["Success"] = "success";
    MockPaymentMode["Failure"] = "failure";
})(MockPaymentMode || (exports.MockPaymentMode = MockPaymentMode = {}));
class EnvironmentVariables {
    DATABASE_URL;
    JWT_SECRET;
    MOCK_PAYMENT_MODE;
    JWT_EXPIRES_IN = '7d';
    PORT = 3001;
    NODE_ENV = 'development';
    CORS_ORIGIN = 'http://localhost:3000';
}
exports.EnvironmentVariables = EnvironmentVariables;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^postgres(ql)?:\/\//, {
        message: 'DATABASE_URL must start with postgresql:// or postgres://',
    }),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "DATABASE_URL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(16, { message: 'JWT_SECRET must be at least 16 characters' }),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "JWT_SECRET", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(MockPaymentMode, {
        message: `MOCK_PAYMENT_MODE must be one of: ${Object.values(MockPaymentMode).join(', ')}`,
    }),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "MOCK_PAYMENT_MODE", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d+[dhm]?$/, {
        message: 'JWT_EXPIRES_IN must look like 7d, 12h, 30m or a number of seconds',
    }),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "JWT_EXPIRES_IN", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(65535),
    __metadata("design:type", Number)
], EnvironmentVariables.prototype, "PORT", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['development', 'test', 'production']),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "NODE_ENV", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "CORS_ORIGIN", void 0);
function validateEnv(config) {
    const validated = (0, class_transformer_1.plainToInstance)(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });
    const errors = (0, class_validator_1.validateSync)(validated, { skipMissingProperties: false });
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
