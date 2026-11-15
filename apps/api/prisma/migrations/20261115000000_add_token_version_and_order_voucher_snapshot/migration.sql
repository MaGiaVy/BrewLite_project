-- Additive-first migration for H-01 (tokenVersion) and M-11 (Order voucher snapshot)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "voucherDiscountPercent" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "voucherMinOrderAmount" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "voucherMaxDiscountAmount" DOUBLE PRECISION;
