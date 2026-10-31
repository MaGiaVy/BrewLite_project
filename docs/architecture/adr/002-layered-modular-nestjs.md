# ADR-002: Kiến trúc Phân lớp theo Module trong NestJS

* **Trạng thái:** Chấp thuận (Accepted)
* **Ngày quyết định:** 2026-10-26
* **Người quyết định:** Huỳnh Tuấn Kiệt, Nguyễn Gia Thành
* **Mã task liên quan:** `T3.1`, `T4.3`, `T5.1a`

---

## 1. Bối cảnh (Context)
Hệ thống backend của BrewLite cần xử lý nhiều miền nghiệp vụ khác nhau: xác thực người dùng (`auth`), quản lý danh mục đồ uống (`products`), xử lý đơn hàng và máy trạng thái (`orders`), thanh toán không tiền mặt (`payments`), áp dụng mã giảm giá và điểm thưởng (`vouchers`/`loyalty`), và giám sát sức khỏe (`health`). Nếu viết mã theo dạng kịch bản tập trung hoặc monolithic không phân lớp sẽ dẫn đến mã nguồn bị phụ thuộc chéo (tight coupling), khó mở rộng và khó viết unit/integration tests.

## 2. Quyết định (Decision)
Nhóm quyết định áp dụng mô hình **Modular Layered Architecture (Kiến trúc phân lớp theo module)** trong NestJS:
1. **Chia tách theo Domain Module:** Mỗi miền nghiệp vụ được đóng gói thành một module riêng biệt (`AuthModule`, `ProductsModule`, `OrdersModule`, `PaymentsModule`, `HealthModule`).
2. **Phân lớp trách nhiệm rõ ràng (Separation of Concerns):**
   * `Controller`: Tiếp nhận HTTP Request, xác thực DTO đầu vào (`class-validator`), kiểm tra phân quyền (`Guards`).
   * `Service`: Chứa toàn bộ nghiệp vụ lõi (tính giá, máy trạng thái, transaction, trừ tồn kho).
   * `Data Access`: Truy vấn cơ sở dữ liệu thông qua `PrismaService`.
   * `Jobs`: Tác vụ nền độc lập sử dụng `@nestjs/schedule` (như hủy đơn quá hạn).

## 3. Hệ quả (Consequences)

### Ưu điểm (Pros):
* **Tính độc lập cao:** Mỗi thành viên trong nhóm có thể phát triển trên từng module riêng biệt mà không gây xung đột mã nguồn (merge conflicts).
* **Dễ dàng kiểm thử:** Các Controller và Service dễ dàng được mock dependencies để viết Unit Test và Integration Test độc lập.
* **Tái sử dụng cao:** `PrismaService` và `MockGatewayService` được chia sẻ an toàn qua cơ chế Dependency Injection của NestJS.

### Nhược điểm & Hạn chế (Cons):
* Số lượng tệp tin (files) và boilerplate code nhiều hơn so với Express.js truyền thống.

### Sự đánh đổi (Trade-off):
Chấp nhận thời gian viết cấu trúc NestJS ban đầu để đổi lấy tính ổn định lâu dài, cấu trúc dự án chuẩn mực kỹ nghệ phần mềm và khả năng bảo trì tốt.

