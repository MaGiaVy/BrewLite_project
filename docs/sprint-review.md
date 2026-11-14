# BrewLite — Sprint Review (Sprint 1 & Sprint 2)

- **Dự án:** BrewLite — Nền tảng Đặt & Thanh toán Đồ uống Không Tiền Mặt (PWA)
- **Kho lưu trữ:** `MaGiaVy/BrewLite_project` (Nhánh `main`, tag `v1.0.0`)
- **Production URLs:**
  - Web App (Vercel): https://brew-lite-project.vercel.app
  - Backend API (Render Singapore): https://brewlite-api-9viv.onrender.com (Health: `/health`)
- **Demo Video / Walkthrough:** `[Link Video Demo — cập nhật trước khi nộp]`

---

## 1. Sprint 1 (`23/10/2026 – 02/11/2026`) — Design, Architecture & Core Foundation

### 1.1 Mục tiêu Sprint (Sprint Goal)
Hoàn tất đặc tả yêu cầu (`FR-01..FR-13`, `NFR-01..NFR-06`), hệ thống sơ đồ UML 2.5, tài liệu kiến trúc & ADRs, khởi tạo Monorepo + Docker Compose + CI Pull Request gate và luồng nền tảng đầu tiên (`products` & `menu`).

### 1.2 Hạng mục Hoàn thành (Completed)
| Nhóm công việc | Kết quả nghiệm thu | Tạo phẩm chính |
| :--- | :--- | :--- |
| **Đặc tả yêu cầu & Use Case** | Hoàn tất Context & Scope, SRS (`FR-01..13`, `NFR-01..06`), Use Case Checkout 2 pha & đồng bộ thông tin môn học | [`docs/requirements/context-and-scope.md`](requirements/context-and-scope.md), [`srs.md`](requirements/srs.md), [`usecase-checkout.md`](requirements/usecase-checkout.md) |
| **Mô hình hóa UML 2.5** | Hoàn tất bộ sơ đồ Use Case, Activity, Sequence Checkout, Class Diagram và Deployment Diagram (`.puml` + `.svg`/`.png`) | [`docs/diagrams/`](diagrams/deployment-diagram.md) |
| **Kiến trúc & ADRs** | Chốt Monorepo NestJS + Next.js, các ADR `001–007`, thiết kế `GET /health` và `env.validation` | [`docs/architecture/architecture.md`](architecture/architecture.md), `docs/architecture/adr/` |
| **CI Pipeline & Monorepo Base** | Thiết lập `.github/workflows/ci.yml` chạy `lint`/`test`/`build` trên PR vào `main` (minh chứng PR `#17`) | [`docs/evidence/ci.md`](evidence/ci.md), `docker-compose.yml` |
| **Core Menu Slice đầu tiên** | Hoàn thiện API danh mục sản phẩm `GET /products`, `GET /products/:id` và UI `/menu` responsive | `apps/api/src/products/*`, `apps/web/src/app/menu/page.tsx` |

### 1.3 Chưa hoàn thành / Chuyển sang Sprint 2 (Deferred)
- Toàn bộ giao diện khách hàng đầy đủ (Cart Zustand, Checkout Idempotency, Loyalty/Vouchers, ZaloPay Sandbox), Barista KDS `/staff` và Admin Portal `/admin`.
- Suite kiểm thử Integration với PostgreSQL thật (`INT-T01..INT-T05`) và Playwright E2E (`E2E-T01..E2E-T02`).
- Triển khai chính thức lên Production cloud (Vercel + Render + Supabase) và bộ Runbook vận hành.

---

## 2. Sprint 2 (`03/11/2026 – 14/11/2026`) — Full Features, Payment Sandbox, Testing & Production Deploy

### 2.1 Mục tiêu Sprint (Sprint Goal)
Xây dựng hoàn chỉnh Backend BOM 12 bảng + Frontend PWA, tích hợp ZaloPay Sandbox & Mock Gateway, chạy đầy đủ Unit/Integration/E2E/Smoke tests, triển khai live HTTPS trên Production và chốt phiên bản `v1.0.0`.

### 2.2 Hạng mục Hoàn thành (Completed)
| Nhóm công việc | Kết quả nghiệm thu | Tạo phẩm chính |
| :--- | :--- | :--- |
| **Backend BOM & Concurrency** | Hoàn thiện schema 12 bảng BOM (`schema.prisma`), Optimistic Locking `version`, `SELECT ... FOR UPDATE`, cron hủy đơn quá hạn 15 phút (`expire-orders.job.ts`), giới hạn 5 đơn chờ, RBAC JWT, Loyalty & Vouchers (`ADR-008`) | `apps/api/src/{auth,orders,payments,inventory,customers,users,jobs}/*` |
| **Frontend PWA & KDS / Admin UI** | Hoàn thiện UI khách hàng (Size/Topping/Cart/Voucher/Tracking), KDS `/staff` (chuông báo đơn mới & toggle hết món `86`), Admin `/admin` giao diện Modern Vintage + `<BrewLiteLogo />` + `RevenueSparkline` + role-based login redirect | `apps/web/src/app/{cart,checkout,orders,staff,admin,account,promotions}/*` |
| **Thanh toán ZaloPay Sandbox & Fallback** | Tích hợp `ZaloPayService` (`HMAC-SHA256`, webhook callback) và điều hướng ổn định về `/gateway/zalopay` (hỗ trợ client fallback khi Sandbox create gặp lỗi) | `apps/api/src/payments/*`, `apps/web/src/app/gateway/zalopay/page.tsx` |
| **Kiểm thử Toàn diện (4 tầng)** | Hoàn thiện Unit/API Jest (`apps/api`), Live PostgreSQL Integration (`INT-T01..T05`), Vitest (`apps/web`), Playwright E2E (`tests/e2e/checkout.spec.ts`) và Smoke Test Production | [`docs/traceability-matrix.md`](traceability-matrix.md), [`docs/evidence/production-smoke.md`](evidence/production-smoke.md) |
| **Production Deploy & Hồ sơ `v1.0.0`** | Triển khai live **Vercel** (Web) + **Render Singapore Docker** (API) + **Supabase PostgreSQL** (SSL), hoàn thiện `README.md`, `CHANGELOG.md`, Runbook, Secret Scan & Tag `v1.0.0` | [`README.md`](../README.md), [`docs/deployment.md`](deployment.md), [`CHANGELOG.md`](../CHANGELOG.md) |

### 2.3 Đóng góp Thành viên (Theo lịch sử Git & Phân công)
- **Mã Gia Vỹ:** Lead Monorepo & PR integration, SRS/Use Case/Activity, Customer UI, Admin Modern Vintage UI, KDS/Admin/ZaloPay fixes & Production Vercel/Render/Supabase deployment.
- **Nguyễn Gia Thành:** SRS (`FR-11..13`), Sequence Checkout UML, Orders API, BOM Optimistic Locking & Live PostgreSQL Integration Tests (`INT-T01..INT-T05`).
- **Nguyễn Thị Ý:** Use Case Checkout & Activity Payment, Docker Compose healthcheck & `.env.example`, Payment Mock/VietQR & Playwright E2E (`checkout.spec.ts`).
- **Quách Kỳ Minh:** Products API & Menu refactor, State Machine / Deployment Diagram (`deployment.puml`), chuẩn hóa CI/test.
- **Huỳnh Tuấn Kiệt:** Context & Scope alignment, Activity KDS/Menu/Cart, `ADR-003` & xác nhận đơn / KDS flow.
- **Vũ Châu Minh Khôi:** Architecture Overview & ADRs, đồng bộ docs/PR template, chi tiết món & Cart Zustand.

### 2.4 Hạn chế đã biết (Known Limitations — Ngoài scope MVP)
- Thanh toán sử dụng **ZaloPay Sandbox** & **MockGateway**, không giao dịch tiền thật; nút xác nhận giả lập Sandbox trên Production được bảo vệ bởi biến môi trường `ALLOW_SANDBOX_CONFIRM`.
- Backend chạy gói **Render Free tier**, có độ trễ cold-start ~30–50 giây nếu idle quá 15 phút.

---

## 3. Kịch bản Demo Walkthrough (3–5 phút)

1. **Kiểm tra hệ thống Live & Responsive Menu (0:00–0:45):** Mở `https://brewlite-api-9viv.onrender.com/health` thấy `{"status":"ok","db":"up"}`; mở `https://brew-lite-project.vercel.app` trên khung mobile/desktop, duyệt tab danh mục.
2. **Tùy biến món, Giỏ hàng & Voucher (0:45–1:30):** Chọn món → chọn Size M/L + Topping → thêm giỏ hàng → vào `/cart` tăng/giảm số lượng, đăng nhập `khach@brewlite.vn` (`Password123`) và áp mã giảm giá / đổi Hạt Vàng.
3. **Đặt đơn & Thanh toán ZaloPay Sandbox (1:30–2:30):** Chuyển sang `/checkout` → đặt đơn (quan sát `Idempotency-Key`, giữ kho BOM 15 phút) → điều hướng tới `/gateway/zalopay` → xác nhận thanh toán Sandbox → xem trang theo dõi đơn `/orders/:id` trạng thái `PAID`.
4. **Barista KDS `/staff` & Nút báo hết món `86` (2:30–3:30):** Mở tab ẩn danh đăng nhập `staff@brewlite.vn` (`123456`) → tự động vào `/staff`, xem đơn mới kèm âm thanh báo & chuyển trạng thái `PAID` → `PREPARING` → `READY` → `COMPLETED` (tab khách hàng tự cập nhật qua polling 5s); demo bật/tắt hết món `86`.
5. **Admin Portal `/admin` (3:30–4:15):** Đăng nhập `admin@brewlite.vn` (`Admin@123`) → xem biểu đồ doanh thu (`RevenueSparkline`), quản lý tồn kho nguyên liệu BOM và nhân sự.
6. **Kỹ thuật CI/CD, Secret Hygiene & Rollback (4:15–5:00):** Trình bày nhanh GitHub Actions `ci.yml`/`cd.yml`, kết quả Smoke Test (`docs/evidence/production-smoke.md`), Secret Scan và quy trình Instant Rollback trên Vercel/Render + tag `v1.0.0`.
