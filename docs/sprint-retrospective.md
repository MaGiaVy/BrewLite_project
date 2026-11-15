# BrewLite — Sprint Retrospective (Sprint 1 & Sprint 2)

Tài liệu ghi nhận phản hồi thực tế của nhóm 6 thành viên sau mỗi Sprint nhằm cải tiến quy trình phối hợp Monorepo, kiểm thử và triển khai Production.

---

## 1. Sprint 1 Retrospective (`23/10/2026 – 02/11/2026`)

### 1.1 Điểm làm tốt (What Went Well)
- **Chốt thiết kế & hợp đồng sớm:** Nhóm hoàn thiện SRS, Use Case Checkout và `OpenAPI` / `ADRs` ngay đầu kỳ nên các thành viên làm Frontend và Backend có điểm neo chung khi chia task song song.
- **Đưa CI gate vào từ rất sớm:** Cấu hình `.github/workflows/ci.yml` kèm minh chứng PR `#17` (fail trước, pass sau khi sửa) giúp phát hiện sớm lỗi lint/type và tránh push file build rác (`.next`, `dist`) lên nhánh chính.
- **Chuẩn hóa UML theo thực tế code:** Rà soát và sửa kịp thời các điểm lệch giữa tài liệu sơ đồ và thiết kế thật (như thời hạn JWT 7 ngày, `include` đăng nhập trong Use Case Checkout).

### 1.2 Điểm chưa tốt & Vấn đề phát sinh (What Didn't Go Well)
- **Sơ đồ phân mảnh gây khó đọc:** Lúc đầu nhóm tách nhiều sơ đồ Activity nhỏ và có khác biệt định dạng PlantUML giữa các thành viên, dẫn tới mũi tên bị gãy hoặc kéo ngang khó theo dõi.
- **Độ vênh dữ liệu giữa thiết kế ban đầu và schema BOM:** Bản đặc tả ban đầu dùng mô hình tồn kho đơn giản theo sản phẩm, sau chuyển sang mô hình **BOM 12 bảng** (trừ định mức nguyên liệu theo Size/Topping) khiến nhóm phải bổ sung `ADR-008` và chỉnh lại tài liệu.

### 1.3 Hành động Cải tiến (Action Items — Sprint 1 → Sprint 2)
| Vấn đề | Hành động cụ thể | Phụ trách | Trạng thái |
| :--- | :--- | :--- | :--- |
| Sơ đồ UML phân tán & lệch chi tiết | Hợp nhất thành 1 sơ đồ Activity E2E 5 swimlane chuẩn mực và re-compile đồng loạt SVG/PNG (Wave 3a) | Cả nhóm (Lead: Mã Gia Vỹ) | **Đã hoàn thành** (`1726342`) |
| Lệch mô hình dữ liệu khi thêm BOM | Khóa chuẩn **BOM 12 bảng** + JSON `{ data }` wrapper trong `ADR-008` & `openapi.yaml` trước khi code Wave 2–4 | Nguyễn Gia Thành, Vũ Châu Minh Khôi | **Đã hoàn thành** (`bdb35e4`) |

---

## 2. Sprint 2 Retrospective (`03/11/2026 – 14/11/2026`)

### 2.1 Điểm làm tốt (What Went Well)
- **Bảo vệ toàn vẹn giao dịch từ lõi:** Cơ chế `SELECT ... FOR UPDATE` + Optimistic Locking (`version`) + `Idempotency-Key` + Cron hoàn kho quá hạn 15 phút hoạt động ổn định và được kiểm chứng bằng Live PostgreSQL Integration tests (`INT-T01..T05`).
- **Tách Wave tích hợp có review gate:** Chia các đợt merge (Wave 1 → 2 → 3a/3b → 4) giúp kiểm soát xung đột tốt hơn so với dồn merge cuối kỳ.
- **Tối ưu chi phí & tốc độ Production:** Chuyển Frontend sang **Vercel** (loại bỏ cold-start khi mở UI) kết hợp **Render Docker** (`brewlite-api`) và **Supabase PostgreSQL** (SSL) giúp hệ thống chạy ổn định miễn phí cho mục tiêu nghiệm thu.

### 2.2 Điểm chưa tốt & Vấn đề thực tế gặp phải (What Didn't Go Well)
1. **Xung đột merge lockfile & schema giữa các nhánh song song:** Nhiều nhánh chỉnh `package.json` / `apps/api/package-lock.json` và `docker-compose.yml` cùng lúc gây conflict khi merge về `main`; đặc biệt khi Render build `apps/api/Dockerfile`, `npm ci` bị fail vì `apps/api/package-lock.json` chưa đồng bộ với monorepo (`99a3085`).
2. **Sai khác cấu hình giữa Local và Production (`CORS` & `ZaloPay Sandbox`):**
   - Sau khi tách Frontend lên Vercel (`*.vercel.app`), API trên Render ban đầu chặn request chéo domain do `CORS_ORIGIN` chưa hỗ trợ wildcard (`9ae3da4`).
   - Nút xác nhận ZaloPay Sandbox trên giao diện bị lỗi khi `ALLOW_SANDBOX_CONFIRM=false` mặc định trên Production; đồng thời luồng `/checkout` cần fallback về `/gateway/zalopay` khi gọi Sandbox ngoài gặp trục trặc (`c044be5`).
3. **Khác biệt môi trường DB khi chạy Integration Test:** Máy dev cục bộ không luôn có sẵn Docker daemon hoặc `TEST_DATABASE_URL` nên bộ `INT-T01..INT-T05` cần dựa vào dịch vụ PostgreSQL trong CI/Docker; ngoài ra xuất hiện lỗi cài đặt `next` unhoisted cục bộ trong `apps/web/node_modules` làm nhiễu quá trình chạy lệnh từ thư mục con.
4. **Tài liệu triển khai bị trễ nhịp so với hạ tầng thật:** Code đã chuyển sang Vercel + Render + Supabase nhưng `deployment.puml` và `docs/deployment.md` vẫn giữ thiết kế cũ (Render Web + GHCR) tới cuối Sprint 2 mới phát hiện khi rà soát chéo Assignment 2.

### 2.3 Hành động Cải tiến (Action Items — Đã áp dụng & Duy trì cho giai đoạn sau)
| Vấn đề | Hành động cụ thể | Phụ trách | Trạng thái |
| :--- | :--- | :--- | :--- |
| Lỗi `npm ci` trong Docker API build | Đồng bộ khóa `apps/api/package-lock.json` và kiểm thử Docker build trước khi merge `main` | Mã Gia Vỹ | **Đã áp dụng** (`99a3085`) |
| CORS Vercel ↔ Render & ZaloPay Sandbox trên Production | Hỗ trợ wildcard `CORS_ORIGIN` trong API, fallback điều hướng `/gateway/zalopay` và tài liệu hóa biến `ALLOW_SANDBOX_CONFIRM` trong `docs/deployment.md` | Mã Gia Vỹ | **Đã áp dụng** (`9ae3da4`, `c044be5`) |
| Lệch hạ tầng thật vs `deployment.puml` & thiếu bằng chứng cuối kỳ | Bắt buộc có bước rà soát chéo docs/diagram/README/evidence trước khi gắn tag phát hành (`v1.0.0`); đồng bộ đầy đủ trong PR cuối | Quách Kỳ Minh, Dương Quang Khôi, Mã Gia Vỹ | **Đã hoàn thành** (`v1.0.0`) |
| Khác biệt môi trường test giữa máy cá nhân & CI | Chạy test qua `npm run test -w ...` tại root monorepo, dùng `docker-compose.yml` chuẩn và chạy `scripts/smoke-test.ps1` trực tiếp lên Production | Nguyễn Gia Thành, Nguyễn Thị Ý | **Đang duy trì** |
