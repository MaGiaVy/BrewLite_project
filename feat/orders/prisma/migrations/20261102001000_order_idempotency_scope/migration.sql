DROP INDEX IF EXISTS "Order_idempotencyKey_key";

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "idempotencyPayload" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_userId_idempotencyKey_key"
ON "Order"("userId", "idempotencyKey");
