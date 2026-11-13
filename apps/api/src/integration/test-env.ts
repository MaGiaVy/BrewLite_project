process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'integration-test-secret';
process.env.MOCK_PAYMENT_MODE = process.env.MOCK_PAYMENT_MODE ?? 'success';
