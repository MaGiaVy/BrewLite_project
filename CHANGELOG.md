# Changelog

All notable changes to **BrewLite** are documented in this file.

## [1.0.0] - 2026-11-14

Phiên bản phát hành chính thức cho **Assignment 2 — Software Engineering (`MaGiaVy/BrewLite_project`)**.

### Added
- **Customer PWA (`apps/web`):** Thực đơn phân loại danh mục, chi tiết món với giá động theo Size (`S/M/L`) và Topping, giỏ hàng bền vững Zustand, đổi điểm Hạt Vàng lấy voucher, đặt đơn kèm `Idempotency-Key`, thanh toán ZaloPay Sandbox (`/gateway/zalopay`) & Mock Gateway, theo dõi trạng thái đơn theo thời gian thực (polling 5 giây).
- **Barista KDS (`/staff`):** Hàng đợi pha chế theo trạng thái (`PAID` → `PREPARING` → `READY` → `COMPLETED`), âm báo đơn mới và thao tác bật/tắt hết món tạm thời (`86 Sold-Out`).
- **Admin Portal (`/admin`):** Giao diện Modern Vintage với `<BrewLiteLogo />`, biểu đồ doanh thu (`RevenueSparkline`), quản trị Menu, kho nguyên liệu BOM (`Ingredient`, `Recipe`, `ToppingRecipe`, `InventoryLog`), mã giảm giá, nhân sự và khách hàng.
- **Backend Core (`apps/api`):** NestJS 10.4 + Prisma 5.22 + PostgreSQL 16 (schema 12 bảng BOM), JWT RBAC, khóa hàng `SELECT ... FOR UPDATE`, Optimistic Locking (`version`), giới hạn chống spam 5 đơn chờ, cron tự động hủy & hoàn kho sau 15 phút (`expire-orders.job.ts`), endpoint `GET /health` kiểm tra kết nối DB (`SELECT 1`).
- **Testing & CI/CD:** Unit/API specs (Jest), Live PostgreSQL Integration (`INT-T01..INT-T05`), Frontend component/store tests (Vitest), Playwright mobile E2E (`tests/e2e/checkout.spec.ts`), Pull Request CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)), CD pipeline GHCR ([`.github/workflows/cd.yml`](.github/workflows/cd.yml)) và `scripts/smoke-test.{sh,ps1}`.
- **Documentation & Governance:** Root [`README.md`](README.md), SRS & Use Case Checkout, OpenAPI (`docs/api/openapi.yaml`), Architecture & ADRs (`001–008`), UML Diagrams (Use Case, Activity, Sequence, Class, Deployment), Traceability Matrix, Production Runbook ([`docs/deployment.md`](docs/deployment.md)), Sprint Review/Retrospective và bộ minh chứng kiểm thử (`docs/evidence/`).

### Changed & Fixed
- Đồng bộ hạ tầng Production thật trong tài liệu & sơ đồ (`docs/diagrams/deployment.puml`): Frontend **Vercel** (`https://brew-lite-project.vercel.app`), Backend **Render Singapore Docker** (`https://brewlite-api-9viv.onrender.com`), Database **Supabase PostgreSQL** (`sslmode=require`).
- Hỗ trợ wildcard `CORS_ORIGIN` cho domain Vercel trên `brewlite-api` (`9ae3da4`).
- Đồng bộ `apps/api/package-lock.json` phục vụ `npm ci` trong Docker build (`99a3085`).
- Điều hướng ổn định mọi nút ZaloPay tại `/checkout` sang `/gateway/zalopay` kèm client fallback (`c044be5`).

### Operations & Known Limitations
- Container Backend chạy `npx prisma migrate deploy` tự động khi khởi động (`ADR-007`).
- Nút xác nhận thanh toán Sandbox trên Production được bảo vệ bởi biến môi trường `ALLOW_SANDBOX_CONFIRM`.
- Render gói Free có độ trễ cold-start ~30–50 giây sau 15 phút không có truy cập; thanh toán hoạt động ở chế độ Sandbox/Mock.
