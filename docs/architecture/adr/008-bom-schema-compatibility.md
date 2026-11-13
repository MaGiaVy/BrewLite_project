# ADR-008: Tương thích Schema BOM 12 Bảng và Chuẩn Hóa Hợp Đồng API Monorepo

* **Trạng thái:** Chấp thuận (Accepted)
* **Ngày quyết định:** 2026-11-11
* **Người quyết định:** Huỳnh Tuấn Kiệt, Mã Gia Vỹ
* **Mã task liên quan:** `Wave 1 (Backend BOM)`, `Wave 2 (Frontend Full Integration)`, `Wave 3a`

---

## 1. Bối cảnh (Context)
Khi tích hợp nghiệp vụ quản lý kho theo định mức nguyên vật liệu (Bill of Materials - BOM) và vận hành cửa hàng thực tế (Staff KDS, Admin Portal) từ nhánh Assignment 1 vào khung kiến trúc Monorepo Assignment 2 (`apps/api`, `apps/web`), mô hình dữ liệu đơn giản ban đầu không còn đáp ứng đủ:
* Cần tính toán khả năng phục vụ theo thời gian thực (`outOfStockSizes`, `servingsAvailable`, `cogs`) từ tồn kho `Ingredient` và định lượng `Recipe` / `ToppingRecipe`.
* Cần tách rõ hai chu kỳ thời gian xử lý đơn hàng: tự động hủy đơn chưa thanh toán sau 15 phút (nhằm giải phóng nguyên liệu BOM giữ chỗ) so với thời gian ân hạn 5 phút để khách tự hủy đơn `PAID` khi Barista chưa pha chế.
* Giao diện Monorepo Next.js kỳ vọng hợp đồng JSON thống nhất với các quy tắc an toàn của Assignment 2 (`Idempotency-Key`, optimistic locking `version`, `0%` VAT).

## 2. Quyết định (Decision)
Nhóm quyết định chuẩn hóa lược đồ cơ sở dữ liệu **12 model Prisma** và các hợp đồng tương thích giữa `apps/api` và `apps/web`:
1. **Mô hình dữ liệu 12 bảng (`apps/api/prisma/schema.prisma`):**
   * Nhóm danh mục & kho BOM: `Product`, `Ingredient`, `InventoryLog`, `Recipe`, `ToppingRecipe`, `StoreSetting`.
   * Nhóm người dùng & ưu đãi: `User`, `UserVoucher`, `DiscountCode`.
   * Nhóm giao dịch: `Order`, `OrderItem`, `Payment` (tích hợp `version` CAS và `idempotencyKey`).
2. **Hợp đồng dữ liệu thực đơn:** `GET /products` và `GET /products/:id` bọc kết quả trong envelope `{ data: ... }`, kèm trường tính toán BOM (`outOfStockSizes`, tồn kho khả dụng) mà không làm lộ công thức/COGS ra endpoint công khai khi không có quyền Admin.
3. **Quy tắc tính tiền và hoàn kho:**
   * Áp dụng `0%` VAT (`totalAmount = Math.max(0, rawSubtotal - discountAmount)`), không áp dụng làm tròn thuế.
   * Tạo đơn `PENDING` sẽ tạm giữ nguyên vật liệu BOM ngay trong `$transaction`. Nếu thanh toán thất bại (`PAYMENT_FAILED`), nguyên liệu **vẫn được giữ chỗ** để khách hàng thử lại (retry); nguyên liệu chỉ được hoàn trả (`refundOrderResources`) khi đơn chuyển sang `CANCELLED` (do khách hủy, Barista/Admin hủy, hoặc `ExpireOrdersJob` `@Cron('*/1 * * * *')` hủy đơn quá `15 phút`).
4. **Phân biệt hai mốc thời gian (15 phút vs 5 phút):**
   * **15 phút (`ORDER_PAYMENT_TTL_MS`):** Thời hạn tối đa cho đơn ở trạng thái `PENDING` / `PAYMENT_FAILED` trước khi tự động hủy hoàn kho.
   * **5 phút (`PAID_CANCEL_GRACE_MS`):** Thời gian ân hạn cho phép khách tự hủy đơn đã thanh toán `PAID` khi KDS chưa chuyển `PREPARING`.

## 3. Hệ quả (Consequences)
* **Ưu điểm:** Ngăn chặn triệt để tình trạng bán quá tồn nguyên liệu (overselling) ngay cả khi nhiều giao dịch đồng thời hoặc retry thanh toán; thống nhất hoàn toàn API giữa Backend NestJS, Frontend Customer, Staff KDS và Admin Portal.
* **Đánh đổi:** Schema và service logic tăng từ 7 bảng lên 12 bảng, đòi hỏi test tích hợp (`orders-payments.int.spec.ts`) kiểm chứng kỹ các đường hoàn kho và `ExpireOrdersJob` trên DB PostgreSQL thật.
