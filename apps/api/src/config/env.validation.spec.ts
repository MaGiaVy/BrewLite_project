import { validateEnv } from './env.validation';

describe('env.validation', () => {
  const validEnv = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/brewlite',
    JWT_SECRET: 'a-sufficiently-long-test-secret',
    MOCK_PAYMENT_MODE: 'success',
  };

  it('accepts a valid configuration and applies defaults', () => {
    const env = validateEnv({ ...validEnv, PORT: '3001' });

    expect(env.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(env.PORT).toBe(3001);
    expect(env.JWT_EXPIRES_IN).toBe('7d');
  });

  it('API-T17: refuses to start when DATABASE_URL is missing', () => {
    const { DATABASE_URL: _omitted, ...withoutDatabaseUrl } = validEnv;

    expect(() => validateEnv(withoutDatabaseUrl)).toThrow(/DATABASE_URL/);
  });

  it('rejects a missing or too short JWT_SECRET', () => {
    expect(() => validateEnv({ ...validEnv, JWT_SECRET: undefined })).toThrow(/JWT_SECRET/);
    expect(() => validateEnv({ ...validEnv, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });

  it('rejects an unknown MOCK_PAYMENT_MODE', () => {
    expect(() => validateEnv({ ...validEnv, MOCK_PAYMENT_MODE: 'maybe' })).toThrow(
      /MOCK_PAYMENT_MODE/,
    );
    expect(validateEnv({ ...validEnv, MOCK_PAYMENT_MODE: 'failure' }).MOCK_PAYMENT_MODE).toBe(
      'failure',
    );
  });

  it('validates optional ALLOW_MOCK_PAYMENT and ALLOW_SANDBOX_CONFIRM flags', () => {
    const enabled = validateEnv({
      ...validEnv,
      ALLOW_MOCK_PAYMENT: 'true',
      ALLOW_SANDBOX_CONFIRM: 'false',
    });
    expect(enabled.ALLOW_MOCK_PAYMENT).toBe('true');
    expect(enabled.ALLOW_SANDBOX_CONFIRM).toBe('false');

    expect(() =>
      validateEnv({ ...validEnv, ALLOW_MOCK_PAYMENT: 'yes' }),
    ).toThrow(/ALLOW_MOCK_PAYMENT/);
    expect(() =>
      validateEnv({ ...validEnv, ALLOW_SANDBOX_CONFIRM: '1' }),
    ).toThrow(/ALLOW_SANDBOX_CONFIRM/);
  });

  it('accepts optional ZaloPay configuration variables', () => {
    const env = validateEnv({
      ...validEnv,
      ZALOPAY_APP_ID: '2554',
      ZALOPAY_KEY1: 'sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn',
      ZALOPAY_KEY2: 'trMrHtvjo6myautxDUiAcYsVtaeQ8nhf',
      ZALOPAY_ENDPOINT: 'https://sb-openapi.zalopay.vn/v2/create',
      ZALOPAY_CALLBACK_URL: 'https://example.com/payments/zalopay/callback',
    });

    expect(env.ZALOPAY_APP_ID).toBe('2554');
    expect(env.ZALOPAY_KEY1).toBe('sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn');
    expect(env.ZALOPAY_KEY2).toBe('trMrHtvjo6myautxDUiAcYsVtaeQ8nhf');
    expect(env.ZALOPAY_ENDPOINT).toBe('https://sb-openapi.zalopay.vn/v2/create');
    expect(env.ZALOPAY_CALLBACK_URL).toBe('https://example.com/payments/zalopay/callback');
  });
});
