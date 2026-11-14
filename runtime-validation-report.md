# Runtime Validation Report

**Generated**: 2026-11-11T16:30:00+07:00  
**Target**: `apps/api`

## Summary

| Step | Status | Exit Code | Details |
|---|---|---:|---|
| Environment | PARTIAL | 0 | Node.js v22.21.0 available; Docker CLI/daemon unavailable; local PostgreSQL credentials were unavailable. |
| Unit tests | PASS | 0 | `npm run test -w apps/api` passed with integration tests skipped because `TEST_DATABASE_URL` is unset locally. |
| Integration tests | UNVERIFIED | 0 | `npm run test:int -w apps/api` requires an isolated PostgreSQL database via `TEST_DATABASE_URL`. |
| Build | PASS | 0 | `npm run build -w apps/api`. |

**Overall**: NEEDS SIGNOFF — CI must run INT-T01 through INT-T05 with its PostgreSQL service.

## Capability verdict

```text
environment:
  docker: UNAVAILABLE — docker command not installed
  node: AVAILABLE — v22.21.0
  playwright: SKIPPED — API-only application; browser tier is not applicable
  infra-tier: PRIMARY(Docker-based) — configured in CI with PostgreSQL service; unavailable locally
  browser-tier: SKIPPED — no browser UI in this task
startup: UNVERIFIED — integration startup requires TEST_DATABASE_URL
integration: UNVERIFIED — exit_code: 0, passed: 0, failed: 0, skipped: 5, INT-T01..INT-T05
e2e: SKIPPED — API-only
overall: NEEDS_SIGNOFF — CI evidence required for the database-backed suite
```

## Issues Found

No additional issues were found after adding the integration test harness, JWT guard, and missing Prisma migration.
