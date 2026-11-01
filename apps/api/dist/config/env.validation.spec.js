"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_validation_1 = require("./env.validation");
describe('env.validation', () => {
    const validEnv = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/brewlite',
        JWT_SECRET: 'a-sufficiently-long-test-secret',
        MOCK_PAYMENT_MODE: 'success',
    };
    it('accepts a valid configuration and applies defaults', () => {
        const env = (0, env_validation_1.validateEnv)({ ...validEnv, PORT: '3001' });
        expect(env.DATABASE_URL).toBe(validEnv.DATABASE_URL);
        expect(env.PORT).toBe(3001);
        expect(env.JWT_EXPIRES_IN).toBe('7d');
    });
    it('API-T17: refuses to start when DATABASE_URL is missing', () => {
        const { DATABASE_URL: _omitted, ...withoutDatabaseUrl } = validEnv;
        expect(() => (0, env_validation_1.validateEnv)(withoutDatabaseUrl)).toThrow(/DATABASE_URL/);
    });
    it('rejects a missing or too short JWT_SECRET', () => {
        expect(() => (0, env_validation_1.validateEnv)({ ...validEnv, JWT_SECRET: undefined })).toThrow(/JWT_SECRET/);
        expect(() => (0, env_validation_1.validateEnv)({ ...validEnv, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
    });
    it('rejects an unknown MOCK_PAYMENT_MODE', () => {
        expect(() => (0, env_validation_1.validateEnv)({ ...validEnv, MOCK_PAYMENT_MODE: 'maybe' })).toThrow(/MOCK_PAYMENT_MODE/);
        expect((0, env_validation_1.validateEnv)({ ...validEnv, MOCK_PAYMENT_MODE: 'failure' }).MOCK_PAYMENT_MODE).toBe('failure');
    });
});
