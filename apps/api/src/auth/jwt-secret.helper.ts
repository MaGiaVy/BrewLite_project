/**
 * Centralized JWT secret resolver to ensure all AuthModule and JwtStrategy
 * sign/verify operations share the exact same key without drift.
 *
 * Security policy:
 * - In production (NODE_ENV === 'production'), JWT_SECRET MUST be explicitly set,
 *   be at least 16 characters long, and MUST NOT be a weak placeholder/default secret.
 * - Outside production (dev/test), falls back to 'brewlite_secret_key' when unset.
 */
const WEAK_DEFAULT_SECRETS = new Set([
  'brewlite_secret_key',
  'brewlite-super-secret-jwt-key-change-in-prod',
  'brewlite-super-secret-jwt-key-2026-sgu',
  'ci-only-jwt-secret-not-for-production',
  'replace-with-a-random-32-plus-char-secret-key',
  'changeme',
  'secret',
]);

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const trimmed = secret?.trim() ?? '';
    if (trimmed.length < 16 || WEAK_DEFAULT_SECRETS.has(trimmed.toLowerCase())) {
      throw new Error(
        'FATAL SECURITY CONFIGURATION: process.env.JWT_SECRET must be configured with a secure non-default key (>= 16 chars) in production!',
      );
    }
    return secret as string;
  }

  return secret || 'brewlite_secret_key';
}
