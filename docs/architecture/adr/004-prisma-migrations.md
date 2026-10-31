# ADR-004: Sử dụng Prisma ORM và Quản lý Cơ chế Migrations cho PostgreSQL

* **Trạng thái:** Chấp thuận (Accepted)
* **Ngày quyết định:** 2026-10-26
* **Người quyết định:** Huỳnh Tuấn Kiệt, Nguyễn Gia Thành
* **Mã task liên quan:** `T3.1`, `T4.2`, `T5.1a`, `T5.2b`

---

## 1. Bối cảnh (Context)
Dự án BrewLite yêu cầu một cơ sở dữ liệu quan hệ (PostgreSQL) để lưu trữ các bảng có tính liên kết chặt chẽ (`User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction`). Đội ngũ phát triển cần một công cụ ORM đảm bảo an toàn kiểu dữ liệu (type-safety), hỗ trợ database transaction đáng tin cậy cho nghiệp vụ đặt hàng và cung cấp cơ chế theo dõi lịch sử thay đổi cấu trúc bảng (schema migrations) giữa các môi trường Local, CI và Production.

## 2. Quyết định (Decision)
Nhóm quyết định chọn **Prisma ORM** (`prisma`, `@prisma/client`) làm giải pháp quản lý cơ sở dữ liệu cho NestJS:
1. **Khai báo Schema tập trung:** Toàn bộ thực thể, kiểu dữ liệu, quan hệ và chỉ mục được mô tả tại `apps/api/prisma/schema.prisma`.
2. **Quản lý phiên bản bảng bằng Migrations:** Mọi thay đổi schema đều tạo ra tệp SQL tương ứng trong thư mục `apps/api/prisma/migrations/` và được đưa vào Git.
3. **Cơ chế Khởi tạo dữ liệu mẫu (Seed):** Tệp `apps/api/prisma/seed.ts` được thiết kế có tính idempotent (`upsert`) để nạp ít nhất 8 món nước (có món hết hàng), size, topping và tài khoản mẫu phục vụ kiểm thử.

## 3. Hệ quả (Consequences)

### Ưu điểm (Pros):
* **An toàn kiểu dữ liệu từ đầu đến cuối (End-to-End Type Safety):** TypeScript types được tự động sinh từ schema, loại bỏ lỗi cú pháp khi truy vấn.
* **Giao dịch ACID mạnh mẽ:** `prisma.$transaction()` cho phép thực thi đồng thời việc trừ tồn kho, tạo đơn, ghi nhận thanh toán và cộng điểm thưởng trong một khối duy nhất.
* **Đồng bộ môi trường:** Lệnh `prisma migrate deploy` đảm bảo cơ sở dữ liệu trên Production luôn khớp 100% với schema mã nguồn.

### Nhược điểm & Hạn chế (Cons):
* Prisma Client cần thời gian khởi tạo và biên dịch lại mỗi khi schema thay đổi (`prisma generate`).
* Một số truy vấn phức tạp hoặc tối ưu khóa dòng cấp thấp (pessimistic lock) cần dùng `$queryRaw`.

### Sự đánh đổi (Trade-off):
Chấp nhận kích thước thư viện Prisma để đổi lấy sự nhất quán, an toàn mã nguồn TypeScript và cơ chế migration tự động cực kỳ tin cậy.

