# BrewLite — Tài liệu Triển khai, Vận hành & Rollback (Production Runbook)

Tài liệu này mô tả cấu trúc hạ tầng Production thực tế của hệ thống BrewLite, quy trình phát hành (Deploy), quay lui sự cố (Rollback), quản lý secrets và minh chứng kiểm thử hậu triển khai (đồng bộ với [`deployment.puml`](diagrams/deployment.puml) và [`ADR-003`](architecture/adr/003-render-ghcr-deployment.md)).

---

## 1. Tổng quan Hạ tầng Production

| Thành phần | Nền tảng | URL / Endpoint | Nguồn triển khai |
| :--- | :--- | :--- | :--- |
| **Frontend Web (`apps/web`)** | **Vercel** (Next.js 15.1.6, Edge CDN, TLS 1.3) | `https://brew-lite-project.vercel.app` | Auto-Deploy từ nhánh `main` (`MaGiaVy/BrewLite_project`) |
| **Backend API (`apps/api`)** | **Render** Singapore (Docker Free, NestJS 10.4, Prisma 5.22) | `https://brewlite-api-9viv.onrender.com` | Auto-Deploy từ `apps/api/Dockerfile` trên nhánh `main` (tùy chọn GHCR qua `cd.yml`) |
| **Health Check** | Render Web Service (`GET /health`) | `https://brewlite-api-9viv.onrender.com/health` | Trả về HTTP `200` với `{"status":"ok","db":"up"}` |
| **Database** | **Supabase** Managed PostgreSQL 16 | Kết nối nội tại từ Render API (`sslmode=require`) | Chỉ Backend Render giữ `DATABASE_URL`; không public ra client hay repo |
| **Payment Gateway** | **ZaloPay Sandbox** v2 (`sb-openapi.zalopay.vn`) | Gọi server-to-server (`HMAC-SHA256`) + webhook `/payments/zalopay/callback` | Song hành `MockGatewayService` (bị chặn trên Production nếu không cấu hình cho phép) |

---

## 2. Biến Môi Trường & Quản lý Secrets

Không commit bất kỳ file `.env` thật nào lên Git; toàn bộ biến local mẫu nằm ở [`.env.example`](../.env.example).

### 2.1 Render (`brewlite-api` Environment Variables)
- `NODE_ENV=production`
- `PORT=3001` (hoặc cổng mặc định của Render Docker)
- `DATABASE_URL=<Supabase PostgreSQL URI kèm ?sslmode=require>`
- `JWT_SECRET=<Chuỗi bí mật ngẫu nhiên >= 32 ký tự>`
- `JWT_EXPIRES_IN=7d`
- `CORS_ORIGIN=https://brew-lite-project.vercel.app,https://*.vercel.app`
- `MOCK_PAYMENT_MODE=success` (kết hợp kiểm soát `ALLOW_MOCK_PAYMENT`)
- `ALLOW_SANDBOX_CONFIRM=true` *(bật riêng cho môi trường chấm bài/demo Sandbox khi dùng nút xác nhận trực tiếp thay webhook ZaloPay thật; mặc định hệ thống là `false` để chặn gọi ngoài webhook)*
- `ZALOPAY_APP_ID`, `ZALOPAY_KEY1`, `ZALOPAY_KEY2`, `ZALOPAY_ENDPOINT`, `ZALOPAY_CALLBACK_URL`, `ZALOPAY_REDIRECT_URL` *(nếu kết nối Sandbox ZaloPay live)*

### 2.2 Vercel (`apps/web` Environment Variables)
- `NEXT_PUBLIC_API_URL=https://brewlite-api-9viv.onrender.com`
- `NEXT_PUBLIC_ENABLE_DEMO_TOOLS=false`

### 2.3 Bảo mật Database & Migration
- **Non-public DB access:** Trình duyệt/Frontend không bao giờ kết nối trực tiếp tới PostgreSQL; toàn bộ truy vấn đi qua NestJS API với JWT + `RolesGuard` và kết nối TLS/SSL (`sslmode=require`) tới Supabase.
- **Migration khi khởi động (`ADR-007`):** Container `apps/api/Dockerfile` chạy `npx prisma migrate deploy` trước khi bật server NestJS (`apps/api/src/main.ts`), nhờ đó CI/CD không cần mở kết nối DB từ runner bên ngoài.

---

## 3. Quy trình Triển khai (Deploy Workflow)

### 3.1 Quy trình chính (CI → Auto-Deploy Vercel & Render)
1. Mọi thay đổi được mở Pull Request vào nhánh `main`; workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) bắt buộc chạy pass:
   - `apps/api`: `npm ci` → `npx prisma generate` → `npm run lint` → `npm run test` → `npm run build`
   - `apps/web`: `npm ci` → `npm run lint` → `npm run test` → `npm run build`
2. Sau khi merge vào `main`:
   - **Vercel** tự động pull commit mới nhất từ `main`, build `apps/web` và cập nhật `https://brew-lite-project.vercel.app`.
   - **Render** tự động build Docker image từ `apps/api/Dockerfile`, chạy `prisma migrate deploy` lên Supabase, kiểm tra `/health` và chuyển traffic sang bản mới (`Live`).

### 3.2 Quy trình CD Đóng gói GHCR (Tùy chọn qua `.github/workflows/cd.yml`)
Repository cung cấp thêm workflow thủ công [`cd.yml`](../.github/workflows/cd.yml) (`workflow_dispatch`) với 3 chế độ `operation`:
- `publish`: Chạy `ci.yml` + quét lịch sử git với `gitleaks/gitleaks-action@v3` + build và push Docker images (`brewlite-api`, `brewlite-web`) gắn tag `vX.Y.Z` lên GitHub Container Registry (`ghcr.io`).
- `deploy`: Thực hiện `publish` và gọi `scripts/render-deploy.sh` kèm `scripts/smoke-test.sh` để xác minh bản image đã `live`.
- `rollback`: Redeploy lại một image tag `vX.Y.Z` trước đó từ GHCR qua `scripts/render-deploy.sh` và xác minh bằng `scripts/smoke-test.sh`.

*(Nếu sử dụng `cd.yml` ở mode `deploy`/`rollback`, cần khai báo trong GitHub Repository `vars.RENDER_API_URL`, `vars.RENDER_WEB_URL`, `vars.RENDER_API_SERVICE_ID`, `vars.RENDER_WEB_SERVICE_ID` và `secrets.RENDER_API_KEY`, `secrets.RENDER_API_DEPLOY_HOOK`, `secrets.RENDER_WEB_DEPLOY_HOOK`.)*

---

## 4. Quy trình Quay lui Sự cố (Rollback Procedure)

Khi phát hiện lỗi nghiêm trọng sau triển khai trên Production:

1. **Rollback Frontend trên Vercel (30 giây):**
   - Mở **Vercel Dashboard** → Project `brew-lite-project` → tab **Deployments**.
   - Tìm deployment ổn định gần nhất (ví dụ gắn mốc tag `v1.0.0`) → bấm **⋯ → Instant Rollback** để trỏ domain production về bản trước đó ngay lập tức.
2. **Rollback Backend trên Render (~1–3 phút):**
   - Mở **Render Dashboard** → Web Service `brewlite-api` → tab **Deploys**.
   - Chọn bản deploy xanh gần nhất trước commit lỗi → bấm **Rollback** để Render khôi phục service về bản build/image trước đó.
3. **Rollback qua Git (khi Auto-Deploy đang bật):**
   - Chạy `git revert <bad_commit_sha>` trên `main` và `git push`, hoặc tạo nhánh/hotfix từ annotated tag ổn định (`git checkout -b hotfix/revert v1.0.0`) để Vercel và Render tự đồng bộ lại trạng thái sạch.
4. **Rollback bằng `cd.yml` (nếu triển khai qua GHCR image):**
   - Vào GitHub Actions → **CD** → **Run workflow** → chọn `operation = rollback`, nhập `release_tag = v1.0.0` (bản ổn định trước).
5. **Lưu ý Database Migration:** Mọi migration trong `apps/api/prisma/migrations/` phải giữ tính tương thích ngược (*additive-first*: thêm bảng/cột nullable trước khi xóa cột cũ) để bản code cũ sau rollback vẫn đọc/ghi dữ liệu an toàn.

---

## 5. Kiểm tra Hậu Triển khai & Minh chứng Đã Hoàn tất

Chạy kiểm tra tự động sau mỗi lần phát hành:

```powershell
./scripts/smoke-test.ps1 `
  -ApiBaseUrl "https://brewlite-api-9viv.onrender.com" `
  -WebBaseUrl "https://brew-lite-project.vercel.app" `
  -Email "khach@brewlite.vn" `
  -Password "<DEMO_PASSWORD>" `
  -Attempts 12 -DelaySeconds 10
```

Hồ sơ minh chứng thực tế đã được ghi nhận đầy đủ:
- **CI Pull Request Gate (`ci.yml`):** [`docs/evidence/ci.md`](evidence/ci.md)
- **Production Smoke Test & Negative Checks:** [`docs/evidence/production-smoke.md`](evidence/production-smoke.md)
- **Secret Scan & Environment Hygiene:** [`docs/evidence/secret-scan.md`](evidence/secret-scan.md)
