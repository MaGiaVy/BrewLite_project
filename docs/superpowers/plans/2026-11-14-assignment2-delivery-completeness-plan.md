# Assignment 2 Delivery Completeness (Items 1–4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đóng toàn bộ 4 hạng mục còn thiếu của repo `MaGiaVy/BrewLite_project` đối chiếu với `Assignment2-BrewLite.md`: (1) Root `README.md`, (2) `CHANGELOG.md` + Git tag `v1.0.0` + hướng dẫn tạo GitHub Release, (3) `docs/sprint-review.md` & `docs/sprint-retrospective.md`, và (4) Đồng bộ sơ đồ/tài liệu triển khai theo hạ tầng thật (**Vercel** Web + **Render Docker** API + **Supabase** PostgreSQL) kèm minh chứng quét secret & smoke test production.

**Architecture:** Thực hiện tuần tự từ hạ tầng & minh chứng thực tế (Task 1–2) → tài liệu tổng hợp & vận hành ở root/docs (Task 3–4) → đóng gói release `CHANGELOG.md` + kiểm tra toàn vẹn link/test/security + gắn tag `v1.0.0` ở bước cuối cùng (Task 5) để tag trỏ đúng commit hoàn chỉnh nhất trên `main`.

**Tech Stack:** Markdown, PlantUML (`.puml` → `.svg`/`.png` via Docker `plantuml/plantuml` hoặc `kroki.io`), Git CLI (annotated tag), PowerShell (`scripts/smoke-test.ps1`), Docker (`zricethezav/gitleaks` hoặc GHA `gitleaks`), Next.js 15.1.6 (`apps/web`), NestJS 10 (`apps/api`).

**Spec & Decisions Locked via `/grill-me`:**
- **Hạ tầng Production thật:** Frontend tại Vercel (`https://brew-lite-project.vercel.app`), Backend API tại Render Singapore Docker Free (`https://brewlite-api-9viv.onrender.com`), Database PostgreSQL tại **Supabase** (`sslmode=require`, `DATABASE_URL` lưu trong Render Environment Variables — không public DB credentials).
- **CD & GHCR (`cd.yml`):** Giữ `cd.yml` làm pipeline đóng gói container GHCR/rollback tùy chọn; tài liệu hóa rõ quy trình Auto-Deploy chính qua GitHub → Vercel (Web) & Render (API).
- **Ngôn ngữ & Demo Accounts (`README.md`):** Tiếng Việt (tiêu đề/thuật ngữ kỹ thuật Tiếng Anh), công khai Production URLs thật + bảng tài khoản demo từ `apps/api/prisma/seed.ts` kèm ghi chú chỉ dùng cho môi trường demo/kiểm thử.
- **Sprint Review & Retrospective:** 2 file (`docs/sprint-review.md`, `docs/sprint-retrospective.md`), chia rõ Sprint 1 (`23/10–02/11/2026`: Design & Core APIs) và Sprint 2 (`03/11–14/11/2026`: Frontend, Payment, KDS/Admin, Testing & Deploy), kèm kịch bản Demo Walkthrough 3–5 phút + placeholder `[Link Video Demo — cập nhật trước khi nộp]`, tổng hợp sự cố thật từ git/deploy history.
- **Release `v1.0.0`:** Tạo `CHANGELOG.md`, gắn annotated tag `v1.0.0` & push lên `personal main` sau khi xong Mục 1, 3, 4; người dùng tạo GitHub Release từ tag `v1.0.0` trên giao diện web GitHub (không cần nhập PAT vào máy).

## Global Constraints

- Mọi đường dẫn, lệnh `npm`/`docker`/`prisma`, biến môi trường, URL và tài khoản phải khớp **100%** với file thật trong `d:\SWE\BrewLite_project` (`package.json`, `apps/{web,api}/package.json`, `.env.example`, `docker-compose.yml`, `apps/api/prisma/seed.ts`).
- Tuyệt đối không ghi secret thật (`DATABASE_URL` có password, `JWT_SECRET` production, `ZALOPAY_KEY1/KEY2`, token) vào bất kỳ file markdown, diagram hay evidence log nào.
- Không sửa code nghiệp vụ (`apps/api/src/**`, `apps/web/src/**`) trừ khi phát hiện lỗi chặn kiểm thử (không nằm trong phạm vi 4 mục tài liệu/release này).
- Mọi ảnh sơ đồ `.svg` và `.png` trong `docs/diagrams/` phải được biên dịch lại từ `.puml` sau khi chỉnh sửa (Assignment 2 §5.2).

## Review Focus

1. **Link hỏng trong Markdown:** Link tương đối tới `docs/...`, ảnh `deployment.png`, hoặc anchor bị sai tên file/thư mục giữa root `README.md` và `docs/`. → Kiểm tra bằng script PowerShell kiểm tồn tại mọi đường dẫn tương đối ở Task 5.
2. **Ảnh `deployment.svg`/`.png` lệch với `deployment.puml`:** Quên render lại hoặc render fail vẫn giữ ảnh cũ chứa `Render Web` / `api.brewlite.vn`. → Verify timestamp + grep text trong `.svg` và xem trực quan `.png` bằng `read_file` ở Task 1.
3. **Thông tin môi trường sai lệch:** Ghi nhầm port DB local (`5433` vs `${DB_PORT:-5432}` trong `docker-compose.yml`), sai phiên bản Next.js/NestJS (`15.1.6`/`10.4` vs `16`/`11` từng ghi nhầm ở doc cũ), hoặc sai lệnh test. → Đối chiếu trực tiếp với `package.json` và `docker-compose.yml` ở Task 1 & Task 3.
4. **Lộ thông tin nhạy cảm trong Evidence Log:** Log `smoke-test` hoặc `gitleaks` in nguyên URL/header/token hoặc password thật. → Redact mọi giá trị nhạy cảm, chỉ giữ hostname công khai + kết quả PASS/HTTP status ở Task 2.
5. **Gắn tag `v1.0.0` quá sớm:** Tag trước khi commit `README.md`, `CHANGELOG.md`, docs & evidence → tag không chứa đủ hồ sơ nộp bài. → Chỉ tạo & push tag `v1.0.0` ở bước cuối cùng của Task 5 sau khi `git status` sạch và kiểm tra đạt 100%.

---

### Task 1: Đồng bộ Sơ đồ & Tài liệu Kiến trúc Hạ tầng thật (Mục 4 — Phần A)

**Files:**
- Modify: `docs/diagrams/deployment.puml:1-190`
- Regenerate: `docs/diagrams/deployment.svg`, `docs/diagrams/deployment.png`
- Modify: `docs/diagrams/deployment-diagram.md:1-60`
- Modify: `docs/architecture/adr/003-render-ghcr-deployment.md:1-34`
- Modify: `docs/architecture/architecture.md:40-85,170-204`
- Modify: `docs/traceability-matrix.md` (dòng `NFR-05`)

**Interfaces:**
- Produces: Kiến trúc chuẩn hóa **3 nền tảng Production**:
  - Frontend: **Vercel Edge Network** (`https://brew-lite-project.vercel.app`, Next.js 15.1.6 Standalone/SSR, React 19, Zustand, env `NEXT_PUBLIC_API_URL`)
  - Backend: **Render Cloud PaaS (Singapore Region, Docker Free)** (`https://brewlite-api-9viv.onrender.com`, NestJS 10.4 + Prisma 5.22, Health `GET /health`, Auto-Deploy từ `main` + tùy chọn GHCR via `cd.yml`)
  - Database: **Supabase Managed PostgreSQL** (`sslmode=require`, `DATABASE_URL` bảo mật trên Render Env, không cấp credential cho client/repo)

- [ ] **Step 1: Cập nhật `docs/diagrams/deployment.puml` phản ánh đúng hạ tầng thật**

Cập nhật các khối trong `docs/diagrams/deployment.puml`:
1. Khối Local (`docker_local`): sửa phiên bản thực tế (`Next.js 15.1`, `NestJS 10.4`), cổng DB khớp `docker-compose.yml` (`${DB_PORT:-5432}:5432`, container `db`, `api`, `web`, volume `brewlite_pgdata`).
2. Khối CI/CD (`ci_env`): thể hiện GitHub `main` trigger cả **CI (`ci.yml`)**, **Vercel Git Integration**, **Render Auto-Deploy**, và **CD (`cd.yml`: `workflow_dispatch` → GHCR + Render Deploy Hook)**.
3. Khối Production: tách rõ thành 3 node ngang hàng thực tế:
   - `Vercel Cloud Platform (Edge CDN)` → `BrewLite Web App (apps/web)` (`https://brew-lite-project.vercel.app`, `NEXT_PUBLIC_API_URL=https://brewlite-api-9viv.onrender.com`).
   - `Render Cloud PaaS (Singapore)` → `brewlite-api` Docker container (`apps/api`, `https://brewlite-api-9viv.onrender.com`, `GET /health`, `ALLOW_SANDBOX_CONFIRM`, `MOCK_PAYMENT_MODE`, `CORS_ORIGIN`).
   - `Supabase Cloud (Managed PostgreSQL 16)` → Database (`TCP :5432 / 6543 SSL/TLS required`, kết nối qua `DATABASE_URL` nội tại trên Render Secret Env, không công khai credential ra frontend/repo).
4. Kết nối: Client → HTTPS :443 → Vercel (UI) & Render API (`CORS_ORIGIN`); Render API → TLS :5432/6543 → Supabase Postgres; Render API → HTTPS :443 (`HMAC-SHA256`) → ZaloPay Sandbox (`sb-openapi.zalopay.vn`). Bỏ hoàn toàn domain giả `api.brewlite.vn` / `brewlite.vn` và node sai `Web Service: Frontend Web` trên Render.

- [ ] **Step 2: Biên dịch `docs/diagrams/deployment.puml` ra `.svg` và `.png`**

Chạy lệnh Render PlantUML qua Docker container chính thức (ưu tiên local Docker, fallback `kroki.io` nếu Docker chưa pull/chạy daemon):
```powershell
docker run --rm -i plantuml/plantuml -tsvg < docs/diagrams/deployment.puml > docs/diagrams/deployment.svg
docker run --rm -i plantuml/plantuml -tpng < docs/diagrams/deployment.puml > docs/diagrams/deployment.png
```
Verify:
1. Kiểm tra `.svg` chứa các chuỗi `Vercel`, `Supabase`, `brew-lite-project.vercel.app`, `brewlite-api-9viv.onrender.com`, và KHÔNG chứa `api.brewlite.vn`:
```powershell
Select-String -Path docs/diagrams/deployment.svg -Pattern "Vercel|Supabase|brewlite-api-9viv" | Measure-Object | Select-Object Count
Select-String -Path docs/diagrams/deployment.svg -Pattern "api\.brewlite\.vn|Web Service: Frontend Web"
```
Expected: `Count >= 3` cho pattern đầu; không có kết quả cho pattern thứ 2.
2. Mở `docs/diagrams/deployment.png` bằng `read_file` để kiểm tra hình ảnh không bị vỡ chữ, mất nhãn hay cắt khung.

- [ ] **Step 3: Cập nhật `docs/diagrams/deployment-diagram.md`**

Sửa bảng đặc tả 13 thành phần & phần Secrets Management trong `docs/diagrams/deployment-diagram.md` để khớp 100% với `deployment.puml` mới (Vercel Web, Render Docker API, Supabase PostgreSQL TLS/SSL, Local `docker-compose.yml` ports/volumes, Next.js 15.1.6 / NestJS 10.4).

- [ ] **Step 4: Cập nhật `docs/architecture/adr/003-render-ghcr-deployment.md`, `docs/architecture/architecture.md` và `docs/traceability-matrix.md`**

1. Trong `docs/architecture/adr/003-render-ghcr-deployment.md`: giữ nguyên quyết định lịch sử ngày `2026-10-26`, thêm mục `## 4. Cập nhật thực tế Production (Amendment — 2026-11-14)` giải thích rõ việc tách Frontend sang **Vercel** (tối ưu Next.js Edge/CDN & miễn phí băng thông, tránh cold-start 50s cho giao diện web), giữ **Render Docker** cho Backend API (`brewlite-api-9viv.onrender.com`), dùng **Supabase Managed PostgreSQL** (`sslmode=require`), và giữ GHCR/`cd.yml` làm tùy chọn đóng gói image.
2. Trong `docs/architecture/architecture.md` (các dòng đề cập Render Web / Render Postgres ở Mục 2, Mục 3.1, Mục 4.2, Mục 5, Mục 6): đồng bộ bảng Truy vết Thành phần Kiến trúc sang **Vercel (Frontend)**, **Render Docker (Backend)**, **Supabase PostgreSQL (`DATABASE_URL` SSL)**.
3. Trong `docs/traceability-matrix.md`: cập nhật dòng `NFR-05` từ `Docker/Render CD (Queued Wave 3b/4)` sang trạng thái thực tế đã hoàn thành (`Vercel Auto-Deploy + Render Docker Auto-Deploy + Supabase Postgres + .github/workflows/cd.yml` + `docs/deployment.md`).

- [ ] **Step 5: Commit Task 1**

```bash
git add docs/diagrams/deployment.puml docs/diagrams/deployment.svg docs/diagrams/deployment.png docs/diagrams/deployment-diagram.md docs/architecture/adr/003-render-ghcr-deployment.md docs/architecture/architecture.md docs/traceability-matrix.md
git commit -m "docs(architecture): sync deployment diagram, ADR-003, and traceability matrix with Vercel + Render + Supabase production"
```

---

### Task 2: Hoàn thiện `docs/deployment.md` & Lưu Minh chứng An ninh / Smoke Test (Mục 4 — Phần B)

**Files:**
- Modify: `docs/deployment.md:1-68`
- Create: `docs/evidence/secret-scan.md`
- Create: `docs/evidence/production-smoke.md`

**Interfaces:**
- Consumes: Hạ tầng Production từ Task 1 (`https://brew-lite-project.vercel.app`, `https://brewlite-api-9viv.onrender.com`, Supabase PostgreSQL) và script có sẵn `scripts/smoke-test.ps1`, `scripts/smoke-test.sh`, `.github/workflows/cd.yml`.
- Produces: Tài liệu vận hành chính thức `docs/deployment.md` (bỏ `(draft)`) + 2 file minh chứng thực tế `docs/evidence/secret-scan.md` và `docs/evidence/production-smoke.md` để `README.md` (Task 3) và `sprint-review.md` (Task 4) trích dẫn.

- [ ] **Step 1: Chạy Smoke Test trực tiếp lên Production URLs thật**

Chạy `scripts/smoke-test.ps1` (wake Render free instance tối đa ~60–90s nên đặt `-Attempts 12 -DelaySeconds 10`):
```powershell
./scripts/smoke-test.ps1 `
  -ApiBaseUrl "https://brewlite-api-9viv.onrender.com" `
  -WebBaseUrl "https://brew-lite-project.vercel.app" `
  -Email "khach@brewlite.vn" `
  -Password "Password123" `
  -Attempts 12 -DelaySeconds 10
```
Đồng thời chạy 1 negative check kiểm chứng Production guard (`POST /payments` mock payment bị chặn `403` khi `ALLOW_MOCK_PAYMENT` không bật, hoặc `GET /auth/me` không token trả `401`).
Expected:
- `PASS GET /health` (`{"status":"ok","db":"up"}`)
- `PASS GET /products`
- `PASS GET /inventory/pricing-config`
- `PASS POST /auth/login + GET /auth/me`
- `PASS GET https://brew-lite-project.vercel.app/menu`
- Negative check: `401` cho `/auth/me` khi thiếu Bearer token; `403` cho `POST /payments` (mock gateway disabled in production) hoặc ghi lại chính xác HTTP code quan sát được.

- [ ] **Step 2: Lưu kết quả Smoke Test vào `docs/evidence/production-smoke.md`**

Ghi lại thời gian chạy, câu lệnh đã chạy (ẩn mật khẩu hoặc ghi rõ dùng tài khoản demo `khach@brewlite.vn`), output thực tế từng bước và kết luận (kèm lưu ý cold-start Render Free tier ~50s nếu gặp retry ở lần request đầu).

- [ ] **Step 3: Chạy Secret Scan (Gitleaks) trên toàn bộ Git history và lưu `docs/evidence/secret-scan.md`**

Chạy Gitleaks qua Docker image chính thức trên repo hiện tại (redacted output):
```powershell
docker run --rm -v "D:\SWE\BrewLite_project:/repo" zricethezav/gitleaks:latest detect --source="/repo" --no-banner --redact -v
```
*(Nếu Docker Hub bị lỗi mạng, kiểm tra bằng `git log -S` / pattern scan `.env`, `postgres://`, `ZALOPAY_KEY`, `JWT_SECRET` thật trên lịch sử git và ghi rõ phương pháp đã chạy + ghi nhận job `security` trong `.github/workflows/cd.yml` sử dụng `gitleaks/gitleaks-action@v3`)*.
Expected: `no leaks found` (exit code 0). Lưu kết quả và bảng kiểm an ninh (`.gitignore` chặn `.env`, DB không public ra client, Production secrets lưu ở Render Env & Vercel Env, `cd.yml` chạy `gitleaks-action@v3`) vào `docs/evidence/secret-scan.md`.

- [ ] **Step 4: Viết lại `docs/deployment.md` hoàn chỉnh (xóa `(draft)`)**

Cấu trúc `docs/deployment.md` gồm 7 phần súc tích, chính xác:
1. **Tổng quan hạ tầng Production thật:** Bảng Service (Web Vercel, API Render Singapore Docker, DB Supabase Postgres SSL, Payment ZaloPay Sandbox v2) kèm URL công khai & health endpoint.
2. **Biến môi trường & Bảo mật Secrets:** Phân tách Local (`.env.example`), Render (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `MOCK_PAYMENT_MODE`, `ALLOW_SANDBOX_CONFIRM`, `ZALOPAY_*`), Vercel (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ENABLE_DEMO_TOOLS`), và quy tắc Non-public DB / SSL (`sslmode=require`, Prisma migrate deploy lúc khởi động container).
3. **Quy trình Deploy thường ngày (Auto-Deploy từ `main`):** GitHub PR CI (`ci.yml`) → Merge `main` → Vercel tự build `apps/web` & Render tự build `apps/api/Dockerfile` + chạy `npx prisma migrate deploy`.
4. **Quy trình CD Container GHCR (tùy chọn qua `cd.yml`):** Giải thích 3 mode `publish` / `deploy` / `rollback` với `release_tag` (`vX.Y.Z`) và secrets Render tương ứng.
5. **Quy trình Rollback khi sự cố:** Từng bước cụ thể cho **Vercel** (`Deployments → Instant Rollback`), **Render** (`Deploys → Rollback` commit trước), và **Git** (`git revert` / redeploy tag `v1.0.0`) + lưu ý database migration backward-compatible.
6. **Kiểm tra sau triển khai (Post-Deploy Smoke Test):** Lệnh `scripts/smoke-test.ps1` / `scripts/smoke-test.sh`.
7. **Bằng chứng kiểm chứng đã hoàn tất:** Liên kết trực tiếp tới [`docs/evidence/secret-scan.md`](evidence/secret-scan.md), [`docs/evidence/production-smoke.md`](evidence/production-smoke.md) và [`docs/evidence/ci.md`](evidence/ci.md) — xóa hoàn toàn mục `(draft)` và danh sách việc chưa làm cũ.

- [ ] **Step 5: Commit Task 2**

```bash
git add docs/deployment.md docs/evidence/secret-scan.md docs/evidence/production-smoke.md
git commit -m "docs(deployment): finalize production runbook for Vercel/Render/Supabase and add smoke + secret scan evidence"
```

---

### Task 3: Tạo Root `README.md` chuẩn Assignment 2 (Mục 1)

**Files:**
- Create: `README.md` (root `d:\SWE\BrewLite_project\README.md`)

**Interfaces:**
- Consumes: Task 1–2 URLs/docs (`docs/deployment.md`, `docs/diagrams/deployment.png`, `docs/evidence/*.md`), Task 4 sprint docs paths (`docs/sprint-review.md`, `docs/sprint-retrospective.md`), Task 5 release file (`CHANGELOG.md`), và lệnh thực tế từ `package.json`, `apps/{api,web}/package.json`, `.env.example`, `apps/api/prisma/seed.ts`.
- Produces: Tài liệu cửa ngõ chính của repo đáp ứng Assignment 2 §6.1, §7.4, §9, §9.1.

- [ ] **Step 1: Viết `README.md` theo đúng cấu trúc tinh gọn, 100% đúng lệnh thật**

Các section bắt buộc trong `README.md`:
1. **Header & Tổng quan BrewLite:** Mô tả ngắn hệ thống đặt đồ uống không tiền mặt (Customer PWA + KDS `/staff` + Admin `/admin` + BOM Inventory + ZaloPay Sandbox/Mock), nhóm 6 thành viên & Giảng viên hướng dẫn `ThS. Từ Lãng Phiêu`.
2. **Production URLs & Demo Video:**
   - Web App (Vercel): `https://brew-lite-project.vercel.app`
   - Backend API (Render Singapore): `https://brewlite-api-9viv.onrender.com`
   - Health Check: `https://brewlite-api-9viv.onrender.com/health` (`{"status":"ok","db":"up"}` — kèm lưu ý cold-start ~50s trên gói Render Free)
   - Demo Video / Live Walkthrough: `[Link Video Demo — cập nhật trước khi nộp]` + liên kết tới kịch bản demo trong [`docs/sprint-review.md`](docs/sprint-review.md)
3. **Tài khoản Demo (Demo Accounts — chỉ dùng cho môi trường demo/kiểm thử):**
   Lấy đúng từ `apps/api/prisma/seed.ts`:
   - Admin (`ADMIN`): `admin@brewlite.vn` / `Admin@123` (quản trị `/admin`)
   - Barista / Staff (`STAFF`): `staff@brewlite.vn` / `123456` (bảng điều phối KDS `/staff`)
   - Khách hàng (`CUSTOMER`): `khach@brewlite.vn` / `Password123` và `test@example.com` / `password123` (hoặc đăng ký tài khoản mới tại `/auth/register`)
4. **Kiến trúc & Cấu trúc Monorepo:** Cây thư mục rút gọn (`apps/web`, `apps/api`, `docs`, `scripts`, `tests`) + ảnh/link sơ đồ [`docs/diagrams/deployment.png`](docs/diagrams/deployment.png).
5. **Hướng dẫn Chạy Local (Local Setup):**
   - Cách 1 (Khuyên dùng — Docker Compose): copy `.env.example` → `.env`, chạy `docker compose up --build`, chạy seed `docker compose exec api npx prisma db seed`, mở `http://localhost:3000`.
   - Cách 2 (Chạy thủ công với Node.js >= 20 & PostgreSQL 16): `npm ci`, cập nhật `DATABASE_URL` trong `.env`, `npx prisma migrate deploy` & `npx prisma db seed` trong `apps/api`, chạy song song `npm run start:dev -w apps/api` và `npm run dev -w apps/web`.
6. **Kiểm thử & Build (Test & Build):**
   - Backend (`apps/api`): `npm run lint -w apps/api`, `npm run test -w apps/api` (unit + API), `npm run test:int -w apps/api` (cần `TEST_DATABASE_URL` PostgreSQL), `npm run build -w apps/api`.
   - Frontend (`apps/web`): `npm run lint -w apps/web`, `npm run test -w apps/web` (Vitest), `npm run build -w apps/web`.
   - E2E & Smoke: `npm run test:e2e` (Playwright chạy với Docker Compose), `./scripts/smoke-test.ps1`.
7. **Triển khai & Quay lui (Deploy & Rollback):** Tóm tắt nhanh & link chi tiết [`docs/deployment.md`](docs/deployment.md) (Auto-Deploy Vercel/Render, `cd.yml` GHCR, Rollback tức thì trên Vercel/Render & tag `v1.0.0`).
8. **Tài liệu Dự án (`docs/`):** Bảng liên kết đầy đủ tới SRS (`docs/requirements/srs.md`), Context & Scope, Use Case, OpenAPI (`docs/api/openapi.yaml`), Architecture & ADRs, Diagrams, Traceability Matrix (`docs/traceability-matrix.md`), Evidence (`docs/evidence/ci.md`, `secret-scan.md`, `production-smoke.md`), Sprint Review, Sprint Retrospective, và `CHANGELOG.md`.

- [ ] **Step 2: Kiểm tra nhanh toàn bộ tên script & link trong `README.md`**

Verify rằng mọi `npm run ...` có mặt trong `package.json`, `apps/api/package.json`, hoặc `apps/web/package.json`, và chưa ghi link chết.

- [ ] **Step 3: Commit Task 3**

```bash
git add README.md
git commit -m "docs: add root README.md with setup, test, build, deploy/rollback guides, demo accounts, and production URLs"
```

---

### Task 4: Tạo `docs/sprint-review.md` & `docs/sprint-retrospective.md` (Mục 3)

**Files:**
- Create: `docs/sprint-review.md`
- Create: `docs/sprint-retrospective.md`

**Interfaces:**
- Consumes: Lịch sử git thực tế từ `2026-10-23` đến `2026-11-14`, phân công thành viên (`apps/api/prisma/seed.ts`, `docs/tasks/*`, git commits), kết quả kiểm thử/evidence từ Task 2, và kịch bản walkthrough 3–5 phút.
- Produces: Hồ sơ Sprint Review & Sprint Retrospective đầy đủ cho cả Sprint 1 và Sprint 2 theo Assignment 2 §7.4, §9.1.

- [ ] **Step 1: Thu thập số liệu chính xác từ Git Log để không bịa đặt bất kỳ con số hay commit nào**

Chạy lệnh tổng hợp commit theo khoảng thời gian Sprint 1 (`2026-10-23` → `2026-11-02`) và Sprint 2 (`2026-11-03` → `2026-11-14`) + tác giả / module thay đổi:
```powershell
git log --format="%h | %ad | %an | %s" --date=short --reverse
```
Dùng chính dữ liệu thật này làm căn cứ ghi vào `sprint-review.md` và `sprint-retrospective.md`.

- [ ] **Step 2: Tạo `docs/sprint-review.md`**

Cấu trúc chuẩn cho 2 Sprint:
1. **Thông tin chung:** Dự án BrewLite, nhóm 6 thành viên, Production URLs, link `[Link Video Demo — cập nhật trước khi nộp]`.
2. **Sprint 1 (`23/10/2026 – 02/11/2026`) — Design, Architecture & Core APIs:**
   - Sprint Goal & Deliverable Completed: Task 1 (Context/Scope, SRS `FR-01..FR-13`, `NFR-01..NFR-06`, Checkout Use Case), Task 2 (UML Use Case, Activity, Sequence, Class), Task 3 (Architecture C4, ADRs `001–008`, Deployment Diagram, OpenAPI contract), Backend NestJS + Prisma BOM 12 models, Auth JWT, Products, Orders Optimistic Locking, Mock Payment.
   - Deferred sang Sprint 2: Giao diện hoàn chỉnh KDS/Admin/ZaloPay, bộ Integration/E2E tests chạy với PostgreSQL thật, và Production deployment.
3. **Sprint 2 (`03/11/2026 – 14/11/2026`) — Frontend PWA, ZaloPay Sandbox, KDS/Admin, Testing & Deployment:**
   - Sprint Goal & Deliverable Completed: Frontend Next.js PWA (Menu, Cart Zustand, Checkout Idempotency, Loyalty/Vouchers, Order Polling, KDS `/staff` có âm thanh & 86 Out-of-Stock, Admin `/admin` Modern Vintage Theme), ZaloPay Sandbox (`HMAC-SHA256` + fallback `/gateway/zalopay`), Live PostgreSQL Integration (`INT-T01..INT-T05`), Playwright E2E, CI (`ci.yml`), CD (`cd.yml`), Production deploy trên Vercel + Render + Supabase, đồng bộ hồ sơ Assignment 2 & Release `v1.0.0`.
   - Known Limitations / Deferred ngoài scope MVP: ZaloPay chạy môi trường Sandbox (không xử lý tiền thật), Render Free instance spin-down ~50s sau 15 phút không truy cập.
4. **Bảng tổng hợp trạng thái nghiệm thu & Liên kết Bằng chứng:** Unit/Integration/E2E/Smoke/Secret scan.
5. **Kịch bản Demo Walkthrough (3–5 phút):** Checklist 6 bước theo đúng luồng chấm bài (1. Health & Menu trên Vercel mobile viewport → 2. Chọn Size/Topping + Voucher/Cart → 3. Đặt đơn & Thanh toán ZaloPay Sandbox → 4. Barista xử lý đơn trên `/staff` & bật/tắt 86 hết món → 5. Admin kiểm tra BOM & Doanh thu `/admin` → 6. CI/CD, Smoke & Rollback).

- [ ] **Step 3: Tạo `docs/sprint-retrospective.md`**

Cấu trúc theo từng Sprint (Sprint 1 & Sprint 2), mỗi Sprint có 3 cột/mục rõ ràng dựa trên sự cố có thật của nhóm:
1. **What Went Well (Điểm làm tốt):** Thiết kế kiến trúc & SRS/OpenAPI sớm giúp ít phải sửa lại luồng nghiệp vụ chính; khóa lạc quan `version` + `Idempotency-Key` chặn lỗi trùng đơn/âm kho ngay từ lõi; tách wave PR & review giúp giữ chất lượng code.
2. **What Didn't Go Well (Vấn đề gặp phải từ thực tế dự án):**
   - *Sprint 1:* Một số tài liệu sơ đồ ban đầu lệch chi tiết kỹ thuật (ví dụ thời hạn JWT, số bước sequence, tách/gộp sơ đồ activity) phải refactor lại ở Wave 3a; lệch dữ liệu giữa bản thiết kế ban đầu và schema BOM 12 bảng.
   - *Sprint 2:* Xung đột merge trên `package-lock.json` và `schema.prisma` khi nhiều nhánh cùng chạm; Docker build trên Render lỗi `npm ci` do lệch `apps/api/package-lock.json`; Frontend Vercel gọi API Render gặp CORS cho tới khi hỗ trợ wildcard origin; nút xác nhận thanh toán Sandbox trên Production bị guard `ALLOW_SANDBOX_CONFIRM=false` trả `403` nên phải cấu hình env và xử lý fallback UI `/gateway/zalopay`; khác biệt biến `TEST_DATABASE_URL` khiến integration test cần chạy trên Docker/CI PostgreSQL.
3. **Action Items (Hành động cải tiến đã áp dụng & tiếp tục duy trì):** Bảng gồm *Vấn đề → Hành động cụ thể → Người phụ trách (nhóm thành viên) → Trạng thái (Đã xong / Duy trì)*.

- [ ] **Step 4: Commit Task 4**

```bash
git add docs/sprint-review.md docs/sprint-retrospective.md
git commit -m "docs(sprint): add Sprint 1 & 2 Review (with walkthrough script) and Retrospective"
```

---

### Task 5: Tạo `CHANGELOG.md`, Kiểm tra Toàn vẹn & Gắn Git Tag `v1.0.0` (Mục 2 + Verification Gate)

**Files:**
- Create: `CHANGELOG.md` (root `d:\SWE\BrewLite_project\CHANGELOG.md`)

**Interfaces:**
- Consumes: Toàn bộ file đã tạo/cập nhật ở Task 1–4.
- Produces: `CHANGELOG.md` + Verification output + Annotated Git Tag `v1.0.0` pushed lên `personal main`.

- [ ] **Step 1: Tạo `CHANGELOG.md` ở thư mục gốc**

Theo chuẩn Keep a Changelog (`## [1.0.0] - 2026-11-14`), gồm:
- **Added:** Toàn bộ tính năng cốt lõi (Menu/Size/Topping, Cart Zustand, Checkout `Idempotency-Key`, BOM Optimistic Locking, ZaloPay Sandbox & Mock Gateway, KDS `/staff` Chime + 86 Sold-out, Admin `/admin` Dashboard + BOM + Vouchers/Loyalty, CI/CD `.github/workflows/{ci,cd}.yml`, Docker Compose, bộ docs & evidence đầy đủ).
- **Changed & Fixed:** Đồng bộ kiến trúc Vercel + Render + Supabase, sửa CORS Vercel wildcard, đồng bộ `apps/api/package-lock.json` cho Docker build, điều hướng ZaloPay về `/gateway/zalopay` với graceful fallback, chuẩn hóa UML diagrams.
- **Operations & Notes:** Yêu cầu `npx prisma migrate deploy` khi khởi động API, lưu ý `ALLOW_SANDBOX_CONFIRM` và `MOCK_PAYMENT_MODE` bảo vệ Production, giới hạn Render Free tier cold-start ~50s.

- [ ] **Step 2: Commit `CHANGELOG.md`**

```bash
git add CHANGELOG.md
git commit -m "docs(release): add CHANGELOG.md for BrewLite v1.0.0"
```

- [ ] **Step 3: Chạy Verification Gate toàn diện trước khi gắn tag**

1. **Kiểm tra toàn bộ Markdown relative links** trong `README.md`, `CHANGELOG.md`, `docs/deployment.md`, `docs/sprint-review.md`, `docs/sprint-retrospective.md`, `docs/diagrams/deployment-diagram.md`, `docs/evidence/secret-scan.md`, `docs/evidence/production-smoke.md`:
   Chạy script PowerShell kiểm tra mọi pattern `\[[^\]]+\]\(([^)#]+)(#[^)]*)?\)` (bỏ qua `http://`, `https://`, `mailto:`) đều tồn tại file thật trên đĩa!
   Expected: `0 broken links`.
2. **Kiểm tra secret leak quick-check** trên `git diff origin/main..HEAD` (hoặc `personal/main..HEAD`) để chắc chắn không lọt token/password production.
3. **Chạy lại kiểm thử hiện có để chứng minh bộ test & lint vẫn PASS sạch:**
   - `npm run lint -w apps/api`
   - `npm run test -w apps/api`
   - `npm run lint -w apps/web`
   - `npm run test -w apps/web`
   Expected: Exit code 0 trên cả 4 lệnh.
4. **Kiểm tra `git status`**: Working tree sạch hoàn toàn (`nothing to commit, working tree clean`).

- [ ] **Step 4: Gắn Annotated Git Tag `v1.0.0` và Push lên `personal` (`MaGiaVy/BrewLite_project`)**

```bash
git push personal main
git tag -a v1.0.0 -m "Release BrewLite v1.0.0 — Assignment 2 Submission"
git push personal v1.0.0
```
Verify:
```bash
git ls-remote --tags personal
```
Expected: Hiển thị `refs/tags/v1.0.0` và `refs/tags/v1.0.0^{}`.

- [ ] **Step 5: Hướng dẫn người dùng 2 click tạo GitHub Release từ tag `v1.0.0`**

Sau khi đẩy tag thành công, gửi người dùng link trực tiếp tới trang Releases của repo (`https://github.com/MaGiaVy/BrewLite_project/releases/new?tag=v1.0.0`) kèm nội dung Release Notes copy-ready trích từ `CHANGELOG.md` để bấm **Publish release** là hoàn tất 100% tiêu chí GitHub Release.
