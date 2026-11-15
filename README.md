# BrewLite — Nền Tảng Đặt & Thanh Toán Đồ Uống Không Tiền Mặt (PWA)

> **Học phần:** Công nghệ Phần mềm — Giảng viên hướng dẫn: **ThS. Từ Lãng Phiêu**  
> **Phiên bản phát hành:** `v1.0.0` (xem [`CHANGELOG.md`](CHANGELOG.md))  
> **Kho lưu trữ:** `MaGiaVy/BrewLite_project` (Monorepo Next.js + NestJS + Prisma + PostgreSQL)

**BrewLite** là ứng dụng web mobile-first/PWA hỗ trợ khách hàng duyệt thực đơn đồ uống, tùy biến Size/Topping/đá/đường, áp mã giảm giá & đổi điểm Hạt Vàng, đặt đơn giữ kho BOM theo thời gian thực (*Optimistic Locking*), thanh toán không tiền mặt qua **ZaloPay Sandbox** / **Mock Gateway** (*Idempotency-Key*), đồng thời cung cấp quầy pha chế **Barista KDS** (`/staff`) và cổng quản trị **Admin Portal** (`/admin`).

---

## 1. Production URLs & Demo Video

| Dịch vụ / Kênh | Nền tảng | Địa chỉ truy cập |
| :--- | :--- | :--- |
| **Web Application (Frontend)** | Vercel (Edge CDN, HTTPS) | https://brew-lite-project.vercel.app |
| **REST API (Backend)** | Render Singapore (Docker Free) | https://brewlite-api-9viv.onrender.com |
| **API Health Check** | Render (`GET /health`) | https://brewlite-api-9viv.onrender.com/health (`{"status":"ok","db":"up"}`) |
| **Database** | Supabase PostgreSQL 16 (SSL) | Kết nối bảo mật nội tại từ Backend API (không public ra client) |
| **Demo Video / Walkthrough** | Video / Live Demo | `[Link Video Demo — cập nhật trước khi nộp]` *(xem kịch bản 3–5 phút tại [`docs/sprint-review.md`](docs/sprint-review.md))* |

> **Lưu ý Cold-Start:** Dịch vụ Backend trên gói Render Free tự ngủ đông sau ~15 phút không có truy cập; request đầu tiên có thể mất ~30–50 giây để khởi động lại.

---

## 2. Tài khoản Demo (Demo Accounts)

> **Lưu ý:** Các tài khoản dưới đây được khởi tạo tự động bởi [`apps/api/prisma/seed.ts`](apps/api/prisma/seed.ts), **chỉ dùng cho môi trường demo/kiểm thử** đồ án.

| Vai trò (`Role`) | Email | Mật khẩu | Route sử dụng |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (`ADMIN`)** | `admin@brewlite.vn` | `Admin@123` | `/admin` (Menu, Kho BOM, Voucher, Nhân sự, Khách hàng, Doanh thu) |
| **Barista / Nhân viên (`STAFF`)** | `staff@brewlite.vn` | `123456` | `/staff` (Bảng KDS theo dõi đơn, chuông báo, báo hết món `86`) |
| **Khách hàng (`CUSTOMER`)** | `khach@brewlite.vn` | `Password123` | `/menu`, `/cart`, `/checkout`, `/orders`, `/promotions`, `/account` |
| **Khách hàng (`CUSTOMER`)** | `test@example.com` | `password123` | Đăng nhập nhanh hoặc dùng `/auth/register` tạo tài khoản mới |

---

## 3. Cấu trúc Monorepo & Sơ đồ Triển khai

```text
BrewLite_project/
├── apps/
│   ├── web/                # Frontend Next.js 15.1.6 (App Router, React 19, TailwindCSS, Zustand)
│   └── api/                # Backend NestJS 10.4 (Prisma 5.22, PostgreSQL, Auth/Orders/Payments/Inventory)
│       └── prisma/         # Schema 12 bảng BOM, migrations & seed.ts
├── docs/
│   ├── api/                # OpenAPI 3.x spec (openapi.yaml)
│   ├── architecture/       # Architecture overview & ADRs (001–008)
│   ├── diagrams/           # UML PlantUML (.puml) + SVG/PNG (Use Case, Activity, Sequence, Class, Deployment)
│   ├── evidence/           # Minh chứng CI, Production Smoke Test, Secret Scan, Mobile KDS Audit
│   ├── requirements/       # Context & Scope, SRS, Checkout Use Case
│   ├── deployment.md       # Production Runbook (Vercel + Render + Supabase + Rollback)
│   ├── sprint-review.md    # Sprint 1 & Sprint 2 Review + Kịch bản Demo Walkthrough
│   ├── sprint-retrospective.md
│   └── traceability-matrix.md
├── scripts/                # smoke-test.ps1, smoke-test.sh, render-deploy.sh
├── tests/e2e/              # Playwright Mobile E2E tests (checkout.spec.ts)
├── docker-compose.yml      # Full local stack (db + api + web)
└── .env.example            # Biến môi trường mẫu (không chứa secret thật)
```

![Sơ đồ Triển khai BrewLite](docs/diagrams/deployment.png)

---

## 4. Hướng dẫn Cài đặt & Chạy Local (Local Setup)

### Cách 1: Chạy toàn bộ hệ thống bằng Docker Compose (Khuyên dùng)

Yêu cầu: **Docker Desktop**.

1. Tạo file biến môi trường `.env` từ mẫu (không commit `.env`):
   ```bash
   cp .env.example .env
   ```
2. Khởi chạy PostgreSQL, API (`http://localhost:3001`) và Web (`http://localhost:3000`):
   ```bash
   docker compose up --build
   ```
3. Nạp dữ liệu mẫu (`seed.ts` — chạy ở terminal khác sau khi container `api` báo `healthy`):
   ```bash
   docker compose exec api npx prisma db seed
   ```
4. Mở trình duyệt tại `http://localhost:3000` (API health: `http://localhost:3001/health`).

### Cách 2: Chạy thủ công với Node.js (>= 20) & PostgreSQL 16

1. Cài dependencies cho toàn bộ workspace:
   ```bash
   npm ci
   ```
2. Tạo `.env` từ `.env.example`, cập nhật `DATABASE_URL` trỏ tới PostgreSQL local (mặc định `postgresql://brewlite:brewlite_password@localhost:5432/brewlite?schema=public`).
3. Generate Prisma Client, chạy migration & seed database trong `apps/api`:
   ```bash
   npm run prisma:generate -w apps/api
   npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
   npx prisma db seed --schema=apps/api/prisma/schema.prisma
   ```
4. Khởi chạy song song API và Web:
   ```bash
   npm run start:dev -w apps/api
   npm run dev -w apps/web
   ```

---

## 5. Lệnh Kiểm thử & Build (Test & Build)

| Hạng mục | Lệnh chạy | Ghi chú |
| :--- | :--- | :--- |
| **Backend Lint** | `npm run lint -w apps/api` | ESLint trên `apps/api/src/**/*.ts` |
| **Backend Unit & API Tests** | `npm run test -w apps/api` | Jest unit + controller/service/cron specs |
| **Backend Integration Tests (DB thật)** | `npm run test:int -w apps/api` | Yêu cầu đặt `TEST_DATABASE_URL` trỏ tới DB PostgreSQL test riêng |
| **Backend Build** | `npm run build -w apps/api` | NestJS production build (`dist/main.js`) |
| **Frontend Typecheck / Lint** | `npm run lint -w apps/web` | `tsc --noEmit` |
| **Frontend Unit & UI Tests** | `npm run test -w apps/web` | Vitest + React Testing Library |
| **Frontend Build** | `npm run build -w apps/web` | Next.js production build |
| **Playwright E2E (Full Stack)** | `npm run test:e2e` | Tự khởi chạy `docker compose up --build` và test luồng mobile Pixel 7 |
| **Production Smoke Test** | `./scripts/smoke-test.ps1 -ApiBaseUrl "https://brewlite-api-9viv.onrender.com" -WebBaseUrl "https://brew-lite-project.vercel.app"` | Hoặc `bash scripts/smoke-test.sh <API_URL>` trên Linux/CI |

---

## 6. Triển khai & Quay lui Sự cố (Deploy & Rollback)

- **Deploy thường ngày:** PR vào `main` chạy CI gate ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)). Khi merge vào `main`, **Vercel** tự build/deploy `apps/web` và **Render** tự build `apps/api/Dockerfile` (chạy `npx prisma migrate deploy` khi khởi động).
- **CD Container GHCR (tùy chọn):** [`.github/workflows/cd.yml`](.github/workflows/cd.yml) (`workflow_dispatch`) hỗ trợ quét Gitleaks, đóng gói Docker images đẩy lên `ghcr.io`, deploy và rollback theo tag `vX.Y.Z`.
- **Rollback nhanh khi sự cố:**
  - **Frontend (Vercel):** *Deployments → chọn bản ổn định trước → Instant Rollback*.
  - **Backend (Render):** *Deploys → chọn commit xanh trước đó → Rollback*.
  - **Git / Release Tag:** `git revert <commit>` hoặc khôi phục từ tag [`v1.0.0`](CHANGELOG.md).
- Chi tiết đầy đủ xem tại **[`docs/deployment.md`](docs/deployment.md)**.

---

## 7. Danh mục Tài liệu Dự án (`docs/`)

| Nhóm tài liệu | Liên kết |
| :--- | :--- |
| **Yêu cầu & Phân tích** | [Context & Scope](docs/requirements/context-and-scope.md) · [SRS (`FR-01..13`, `NFR-01..06`)](docs/requirements/srs.md) · [Use Case Checkout](docs/requirements/usecase-checkout.md) |
| **Đặc tả API & Truy vết** | [OpenAPI 3.x Spec](docs/api/openapi.yaml) · [Traceability Matrix](docs/traceability-matrix.md) |
| **Kiến trúc & ADRs** | [Architecture Overview](docs/architecture/architecture.md) · [ADR-001 Monorepo](docs/architecture/adr/001-monorepo.md) · [ADR-003 Production & GHCR](docs/architecture/adr/003-render-ghcr-deployment.md) · [ADR-006 Optimistic Lock & Idempotency](docs/architecture/adr/006-optimistic-locking-idempotency.md) |
| **Sơ đồ UML** | [Use Case](docs/diagrams/use-case.png) · [Activity Checkout](docs/diagrams/activity-checkout.png) · [Sequence Checkout](docs/diagrams/sequence-checkout.png) · [Class](docs/diagrams/class.png) · [Deployment](docs/diagrams/deployment-diagram.md) |
| **Vận hành & Minh chứng** | [Deployment Runbook](docs/deployment.md) · [CI Evidence](docs/evidence/ci.md) · [Production Smoke](docs/evidence/production-smoke.md) · [Secret Scan](docs/evidence/secret-scan.md) · [Mobile Staff Audit](docs/evidence/mobile-audit-staff.md) |
| **Quản lý Sprint & Phát hành** | [Sprint Review](docs/sprint-review.md) · [Sprint Retrospective](docs/sprint-retrospective.md) · [CHANGELOG `v1.0.0`](CHANGELOG.md) |
