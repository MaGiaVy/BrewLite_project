# ADR-003: Kiến trúc Triển khai Production Đa Nền tảng (Vercel, Render, Supabase & GHCR)

* **Trạng thái:** Chấp thuận (Accepted)
* **Ngày quyết định:** 2026-10-26 (Cập nhật chuẩn hóa Wave 3a/Wave 4)
* **Người quyết định:** Quách Kỳ Minh (Sơ đồ triển khai Task 3.2), Huỳnh Tuấn Kiệt & Vũ Châu Minh Khôi
* **Mã task liên quan:** `T3.1`, `T3.2`, `T5.3`

---

## 1. Bối cảnh (Context)
Đề bài Assignment 2 yêu cầu triển khai hệ thống BrewLite lên môi trường production có thể truy cập qua giao thức HTTPS công khai, cơ sở dữ liệu production đạt chuẩn bảo mật và hiệu năng cao, và quy trình phát hành phải được tự động hóa qua pipeline CI/CD (kích hoạt khi push code/tag phiên bản). Cần lựa chọn nền tảng đám mây phù hợp với ngân sách sinh viên ($0 chi phí, không phụ thuộc thẻ tín dụng quốc tế), đảm bảo tốc độ phản hồi người dùng cao nhất và tránh rủi ro cơ sở dữ liệu bị xóa hoặc ngủ đông (cold-sleep).

## 2. Quyết định (Decision)
Nhóm quyết định lựa chọn giải pháp kiến trúc đám mây đa nền tảng tối ưu (Hybrid Cloud Architecture):
1. **Frontend Web (Vercel Cloud Platform):**
   * Triển khai ứng dụng `apps/web` (Next.js 16 App Router, React 19) trực tiếp lên mạng lưới Vercel Global Edge Network.
   * Tự động hóa phát hành qua Vercel GitHub Integration (tự động build, prerender tĩnh và deploy khi có commit mới trên nhánh `main`).
   * Tối ưu hóa tuyệt đối tốc độ tải trang, Next.js Server Components (RSC) và Edge Caching toàn cầu.
2. **Backend API (Render Cloud PaaS - Singapore Region):**
   * Đóng gói ứng dụng `apps/api` (NestJS 11 REST API) thành Docker multi-stage container image trên môi trường Node 22-alpine.
   * Pipeline CD trên GitHub Actions đóng gói image, lưu trữ trên GitHub Container Registry (GHCR — `ghcr.io/brewlite-api`) và kích hoạt triển khai tự động qua Render Deploy Hook.
   * Cung cấp endpoint kiểm tra tình trạng dịch vụ `GET /health` (Probe interval 10s).
3. **Cơ sở dữ liệu (Supabase Cloud - Managed PostgreSQL 16 trên AWS Singapore `ap-southeast-1`):**
   * Cung cấp cụm PostgreSQL 16 chuyên dụng, lưu trữ SSD NVMe hiệu năng cao, tự động sao lưu.
   * Kết nối thông qua PgBouncer Connection Pooler (cổng `6543`) giúp chịu tải kết nối đồng thời từ Prisma ORM.
   * Bắt buộc mã hóa đường truyền qua giao thức TLS/SSL (`sslmode=require`). Không bị xóa sau 30 ngày.
4. **Dịch vụ Giữ ấm (Anti-Sleep Monitoring):**
   * Tích hợp dịch vụ giám sát tự động (UptimeRobot / Cron-Job.org) gửi yêu cầu HTTP `GET /health` định kỳ 10 phút/lần nhằm duy trì container Render luôn ở trạng thái hoạt động (warm state), loại bỏ hoàn toàn độ trễ khởi động nguội (cold-start).
5. **Cổng thanh toán bên thứ ba:**
   * Tích hợp ZaloPay Sandbox Gateway API v2 thông qua HMAC-SHA256 REST API và Webhook callback bảo mật.

## 3. Hệ quả (Consequences)

### Ưu điểm (Pros):
* **Hiệu năng vượt trội:** Frontend được phân phối trên mạng CDN toàn cầu của Vercel cho thời gian phản hồi dưới 1 giây.
* **Độ tin cậy của dữ liệu:** Supabase đặt trên hạ tầng AWS Singapore (gần Việt Nam nhất), hỗ trợ connection pooling và bảo vệ dữ liệu vĩnh viễn trong suốt thời gian chấm đồ án.
* **Tự động hóa hoàn toàn:** Tách bạch rõ ràng giữa luồng Vercel Git Integration cho Web và GitHub Actions + GHCR cho API.
* **Chi phí tối ưu $0:** Tận dụng 100% các gói miễn phí tiêu chuẩn của các nền tảng hàng đầu, không rủi ro phát sinh cước phí ngoài ý muốn.
* **Giải quyết triệt để cold-start:** Dịch vụ giữ ấm đảm bảo giảng viên và hội đồng khi truy cập chấm bài đều nhận được phản hồi tức thì.

### Nhược điểm & Hạn chế (Cons):
* Phải quản lý cấu hình CORS giữa tên miền của Vercel (`*.vercel.app`) và API của Render (`*.onrender.com`).
* Cần khai báo chính xác chuỗi kết nối Supabase Connection Pooler (`DATABASE_URL`) trong nhóm Render Secret Group.

### Sự đánh đổi (Trade-off):
Chấp nhận chia tách quản lý giữa Vercel, Render và Supabase để đổi lấy hiệu năng cao nhất cho Next.js, tính ổn định dài hạn của cơ sở dữ liệu PostgreSQL và loại bỏ rủi ro tài chính.
