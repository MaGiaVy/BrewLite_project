# Integration Test Traceability Matrix

| Requirement | Test | Observable acceptance |
|---|---|---|
| FR-05 / AC-05.1 | INT-T01 | `POST /orders` creates `PENDING`; successful `POST /payments` changes it to `PAID`, persists one payment, decrements stock and adds loyalty points. |
| FR-05 / AC-05.3 | INT-T03 | Two concurrent orders for one remaining unit produce exactly one `201` and one `409`; stock ends at zero. |
| FR-05 / AC-05.4 | INT-T04 | A failed payment persists `PAYMENT_FAILED` without a second stock deduction; retry persists `PAID`. |
| FR-04 / AC-04.4 | INT-T05 | `POST /orders` without a bearer JWT returns `401`. |
| Payment idempotency | INT-T02 | Reusing an idempotency key returns the original payment and leaves exactly one `Payment` row and one loyalty-point increment. |

## Existing unit coverage

| Functional requirement | Verification |
|---|---|
| FR-03: Tạo đơn hàng | API-T04 |
| FR-04: Áp dụng voucher | API-T05 |
| FR-05: Thanh toán & điểm | API-T06 |
| FR-06: Hủy đơn & timeout | API-T07, API-T08, API-T09 |

## Test configuration

- `TEST_DATABASE_URL` points to an isolated PostgreSQL database.
- The integration suite runs `npx prisma migrate reset --force --skip-seed` once before the suite.
- Each test removes its own persisted rows and seeds a unique user/product.
- CI provisions PostgreSQL as a service; local runs require PostgreSQL and `TEST_DATABASE_URL`.
- The API test client signs HS256 JWTs with `JWT_SECRET`; production endpoints do not accept the legacy `x-user-id` header as authentication.
