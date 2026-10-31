# ADR-003: Triển khai Production trên Render kết hợp GitHub Container Registry (GHCR)

* **Trạng thái:** Chấp thuận (Accepted)
* **Ngày quyết định:** 2026-10-26
* **Người quyết định:** Huỳnh Tuấn Kiệt (với sự thống nhất của nhóm)
* **Mã task liên quan:** `T3.1`, `T3.2`, `T5.3`

---

## 1. Bối cảnh (Context)
Đề bài Assignment 2 yêu cầu triển khai hệ thống BrewLite lên môi trường production có thể truy cập qua giao thức HTTPS công khai, cơ sở dữ liệu production không mở public cổng ra ngoài Internet, và quy trình phát hành phải được tự động hóa qua pipeline CD (kích hoạt khi push tag phiên bản `v*.*.*`). Cần lựa chọn nền tảng đám mây phù hợp với ngân sách sinh viên (gói miễn phí), hỗ trợ Docker container và bảo mật cấu hình.

## 2. Quyết định (Decision)
Nhóm quyết định lựa chọn giải pháp:
1. **GitHub Container Registry (GHCR — `ghcr.io`):** Là kho lưu trữ Docker Image tập trung. Pipeline CD trên GitHub Actions sẽ đóng gói các image `brewlite-web` và `brewlite-api`, gắn nhãn (tag) bằng mã commit SHA và semantic version (`v1.0.0`), sau đó push lên GHCR.
2. **Nền tảng Đám mây Render (`render.com`):**
   * Triển khai dịch vụ `web` (Next.js) và `api` (NestJS) từ image trên GHCR.
   * Triển khai dịch vụ cơ sở dữ liệu `PostgreSQL` trên mạng nội bộ của Render (Private Network), không gán địa chỉ IP công khai cho cơ sở dữ liệu.
   * Kích hoạt cập nhật thông qua Render Deploy Hook bí mật được lưu trữ trong GitHub Secrets.

## 3. Hệ quả (Consequences)

### Ưu điểm (Pros):
* **Bảo mật tuyệt đối cho dữ liệu:** Cơ sở dữ liệu PostgreSQL chỉ lắng nghe kết nối nội bộ từ container API qua cổng `5432`, ngăn chặn nguy cơ tấn công trực tiếp từ bên ngoài.
* **Tự động hóa hoàn toàn:** Việc triển khai được kích hoạt tự động qua GitHub Actions khi gắn tag release.
* **Chi phí tối ưu:** Tận dụng được gói miễn phí của Render và GHCR cho bài tập lớn.

### Nhược điểm & Hạn chế (Cons):
* Gói miễn phí của Render có hiện tượng "ngủ đông" (spin-down khi không có request trong 15 phút), dẫn đến lần tải đầu tiên (cold-start) có thể mất từ 30–50 giây.
* Database miễn phí trên Render có giới hạn thời gian sử dụng (cần kiểm tra hạn trước ngày nghiệm thu).

### Sự đánh đổi (Trade-off):
Chấp nhận thời gian khởi động chậm hơn khi cold-start và thời gian build image trên GHCR để đổi lấy sự an toàn về dữ liệu mạng nội bộ và tính năng triển khai container chuyên nghiệp.

