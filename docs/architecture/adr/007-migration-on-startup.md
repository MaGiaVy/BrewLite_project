# ADR-007: Thực thi Database Migration khi Khởi động Container API

* **Trạng thái:** Chấp thuận (Accepted)
* **Ngày quyết định:** 2026-10-26
* **Người quyết định:** Huỳnh Tuấn Kiệt, Nguyễn Thị Ý
* **Mã task liên quan:** `T3.1`, `T5.2b`, `T5.3`

---

## 1. Bối cảnh (Context)
Trên môi trường production (Render), cơ sở dữ liệu PostgreSQL được cấu hình nằm hoàn toàn trong mạng nội bộ riêng (Private Network) và không mở cổng `5432` ra Internet để đảm bảo an toàn thông tin theo yêu cầu của đề bài. Do đó, máy ảo chạy pipeline CI/CD trên GitHub Actions không thể kết nối trực tiếp vào cơ sở dữ liệu production để chạy lệnh `npx prisma migrate deploy` trước khi triển khai.

Cần một chiến lược thực thi migration an toàn, tự động và tương thích với kiến trúc mạng khép kín của Render.

## 2. Quyết định (Decision)
Nhóm quyết định thực thi migration cơ sở dữ liệu **ngay tại thời điểm container API khởi động (Migration on Container Startup)**:
1. Trong kịch bản khởi động (`Dockerfile` / `entrypoint.sh` của `apps/api`), câu lệnh `npx prisma migrate deploy` sẽ được chạy trước khi lệnh khởi động máy chủ `node dist/main.js` được thực thi.
2. **Quy tắc tương thích ngược (Backward-Compatible Migrations):** Mọi bản migration schema khi đưa lên nhánh `main` bắt buộc phải là thay đổi tương thích ngược (không xóa cột cũ ngay lập tức, các cột mới thêm phải có giá trị mặc định `@default` hoặc cho phép `nullable`).
3. **Cơ chế an toàn (Fail-Safe):** Nếu quá trình migration gặp lỗi (ví dụ xung đột schema hoặc mất kết nối DB), tiến trình container API sẽ kết thúc với mã lỗi khác 0 (`exit code != 0`). Khi đó, nền tảng Render sẽ hủy bỏ quá trình triển khai phiên bản mới và tự động duy trì phiên bản container cũ đang hoạt động ổn định.

## 3. Hệ quả (Consequences)

### Ưu điểm (Pros):
* **Bảo mật tối đa:** Không cần mở public database port `5432` hoặc lưu trữ thông tin đăng nhập database nhạy cảm trong GitHub Secrets của môi trường CI.
* **Tự động và khép kín:** Ứng dụng tự động cập nhật schema ngay trong mạng nội bộ Render mà không cần can thiệp thủ công từ bên ngoài.
* **Bảo vệ ứng dụng:** Ứng dụng NestJS chỉ khởi động lắng nghe request sau khi cấu trúc bảng đã được cập nhật thành công 100%.

### Nhược điểm & Hạn chế (Cons):
* Làm tăng nhẹ thời gian khởi động ban đầu của container API (thêm khoảng 3–5 giây để kiểm tra và áp dụng migration).
* Yêu cầu các thành viên trong nhóm phải tuân thủ nghiêm ngặt quy tắc viết migration tương thích ngược.

### Sự đánh đổi (Trade-off):
Chấp nhận thời gian khởi động container lâu hơn vài giây để đổi lấy sự **bảo mật tuyệt đối của cơ sở dữ liệu production** và tính năng an toàn tự giữ phiên bản cũ của Render khi gặp sự cố triển khai.

