# Biểu đồ Tuần tự Luồng Đặt hàng & Thanh toán (Checkout Sequence Diagram)

## 1. Tổng quan Kiến trúc 2 Pha

Quy trình Checkout của hệ thống **BrewLite** tách biệt thành **2 Pha độc lập (Two-Phase Checkout)** thông qua 5 thành phần cốt lõi (`Customer`, `Next.js Web`, `NestJS API`, `PostgreSQL`, `ZaloPay / Mock Payment`) để đảm bảo tính nhất quán tồn kho BOM và ngăn chặn thanh toán trùng lặp:

1. **Pha 1 (`POST /orders`)**: Xác thực JWT, kiểm tra `Idempotency-Key`, khóa dòng `User` kiểm tra `< 5` đơn chưa hoàn tất, kiểm tra công thức BOM bắt buộc (`requireRecipeForEachItem: true`), tính lại tổng tiền (0% VAT), kiểm tra/trừ lượt Voucher (`UserVoucher` đặt `voucherDeducted = true`, còn mã công khai `DiscountCode` chỉ tăng `usageCount` và giữ `voucherDeducted = false`; mã công khai tối đa 1 đơn không `CANCELLED` mỗi `userId`) và trừ kho nguyên liệu BOM bằng **Optimistic Locking (`version + 1`)** để tạo đơn hàng `PENDING` (TTL **5 phút (300s)**; hoặc `PAID` ngay nếu `totalAmount = 0`).
2. **Pha 2 (`POST /payments` hoặc `POST /payments/zalopay/create`)**: Gọi cổng thanh toán ZaloPay / Mock Gateway (kèm `Idempotency-Key` hoặc IPN HMAC-SHA256 `key2`) để hoàn tất chuyển trạng thái `Order -> PAID` và ghi nhận `Payment(SUCCESS)`. Nhánh `PAYMENT_FAILED` chỉ phát sinh với Mock Payment (`POST /payments`); khi đang hiện QR ZaloPay (`PENDING`), khách có thể bấm **"Hủy đơn & Hoàn kho"** qua `PATCH /orders/:id/status`.
3. **Theo dõi tiến độ & Hoàn tất (`/orders/:id`)**: Web polling `GET /orders/:id` mỗi **5 giây** (`useOrderPolling`) cho đến khi đơn đạt `COMPLETED` hoặc `CANCELLED` để đồng bộ trạng thái từ KDS quầy pha chế (`PAID -> PREPARING -> READY -> COMPLETED`). Khi KDS chuyển `READY -> COMPLETED` qua `PATCH /orders/:id/status`, hệ thống mới cộng điểm Hạt Vàng (**1.000đ = 1 điểm**).

* **Tệp nguồn PlantUML**: [sequence-checkout.puml](file:///D:/SWE/BrewLite_project/docs/diagrams/sequence-checkout.puml)
* **Ảnh vector SVG**: [sequence-checkout.svg](file:///D:/SWE/BrewLite_project/docs/diagrams/sequence-checkout.svg)
* **Ảnh PNG**: [sequence-checkout.png](file:///D:/SWE/BrewLite_project/docs/diagrams/sequence-checkout.png)

![Biểu đồ Tuần tự Checkout BrewLite](sequence-checkout.svg)

---

## 2. Chi tiết Các Bước & Cơ chế Bảo vệ Dữ liệu

### 2.1. Kiểm tra Xác thực & Chống trùng lặp (`Idempotency-Key`)
* Trước khi vào `/checkout`, `Next.js Web` kiểm tra JWT token (`7d`). Nếu chưa đăng nhập, chuyển hướng về `/auth/login?redirect=%2Fcheckout`. Khi người dùng đổi mật khẩu qua `PATCH /auth/profile`, API tăng `tokenVersion + 1` và cấp `accessToken` mới để vô hiệu hóa phiên cũ.
* Cả `POST /orders` và `POST /payments` đều hỗ trợ `Idempotency-Key` (UUIDv4) để chống double-click hoặc retry mạng. Nếu payload không khớp key cũ, API trả về `409 Conflict`.

### 2.2. Phase 1: Tạo đơn `PENDING`, Trừ Voucher & Khóa kho BOM (`POST /orders`)
* **Khóa hàng User & Giới hạn đơn chờ**: Thực thi `SELECT id FROM "User" WHERE id = :userId FOR UPDATE`, từ chối (`400 Bad Request`) nếu khách đang có `>= 5` đơn ở trạng thái `PENDING` / `PAYMENT_FAILED`.
* **Kiểm tra công thức BOM bắt buộc (`requireRecipeForEachItem: true`)**: `createOrder` từ chối với `400 Bad Request` nếu sản phẩm/size đặt mua chưa có `Recipe` nào được cấu hình. Trên `/admin`, form **"Thêm món mới"** bắt buộc chọn `>= 1` nguyên liệu kèm size (`ALL`/`S`/`M`/`L`) và định lượng `> 0` để lưu qua `POST /inventory/recipes`.
* **Tính giá & Kiểm soát Voucher**: Server tự tính tổng tiền từ giá sản phẩm/topping/voucher trong DB (0% VAT), **trừ ngay lượt trong transaction** để tránh dùng 1 mã cho nhiều đơn song song: với `UserVoucher` cá nhân thì giảm `quantity` và đặt `voucherDeducted = true`; với mã công khai (`DiscountCode`) thì chỉ tăng `usageCount` và giữ `voucherDeducted = false`. Mỗi `userId` đã đăng nhập chỉ được dùng mã công khai **1 lần** cho đơn không ở trạng thái `CANCELLED`; các mã có `isActive = false` bị lọc khỏi danh sách `UserVoucher`.
* **BOM Optimistic Locking**: Tính tổng nguyên liệu (`Recipe` + `ToppingRecipe` + bao bì). Với nguyên liệu bắt buộc (`isRequiredForSale = true`), cập nhật `stock = stock - required, version = version + 1` với điều kiện `WHERE id = ... AND version = ... AND stock >= required` (tối đa **3 lần thử (1 lần chính + 2 lần retry)**).
  * Thiếu công thức / thiếu nguyên liệu ở lần thử đầu -> trả `400 Bad Request` và rollback transaction.
  * Cạnh tranh đồng thời vượt quá số lần retry -> trả `409 Conflict` và rollback transaction.
* **TTL Thanh toán**: Giao diện `/checkout`, `/gateway/zalopay` và Backend thống nhất áp dụng **TTL 5 phút (300s)**.

### 2.3. Phase 2: Xử lý Thanh toán (`ZaloPay / Mock`) & Thử lại
* **ZaloPay Sandbox**: `POST /payments/zalopay/create` tạo giao dịch trên ZaloPay `v2/create` (HMAC-SHA256 `key1`) và điều hướng sang `/gateway/zalopay`. Kết quả được xác nhận qua webhook IPN `POST /payments/zalopay/callback` (xác thực HMAC-SHA256 `key2`) hoặc nút xác nhận sandbox (`POST /payments/zalopay/confirm`), trong khi Web poll `GET /orders/:id` để cập nhật trạng thái đơn. Khi đang hiện QR (`PENDING`), khách có thể bấm **"Hủy đơn & Hoàn kho"** gọi `PATCH /orders/:id/status` (`{ status: 'CANCELLED' }`) để hủy đơn và hoàn kho BOM/Voucher.
* **Mock Payment**: `POST /payments` (kèm `Idempotency-Key`) mô phỏng kết quả `PAID` hoặc `PAYMENT_FAILED` (trả HTTP `201`).
* **Thanh toán thành công (`PAID`)**: Dùng CAS (`where: { id, status: activeStatus, version }`) chuyển `Order -> PAID` và tạo `Payment(SUCCESS)` (`pointsEarned: 0`; điểm Hạt Vàng chưa cộng ở bước này).
* **Thanh toán thất bại (`PAYMENT_FAILED`)**: Chỉ phát sinh với Mock Payment (`POST /payments`). API cập nhật `Order -> PAYMENT_FAILED` và **giữ nguyên kho BOM trong phạm vi TTL 5 phút (300s)** để khách hàng trên `/checkout` bấm **"Thử lại"** (`PAYMENT_FAILED -> PENDING`) hoặc **"Hủy đơn"** (`PATCH /orders/:id/status` với `{ status: 'CANCELLED' }`).

### 2.4. Quy tắc Hủy đơn, Xóa đơn & Hết hạn Tự động (5 phút / 300s)
* **Hủy đơn qua `PATCH /orders/:id/status`**: Khách hàng chỉ được tự hủy đơn ở trạng thái `PENDING` hoặc `PAYMENT_FAILED` (**không được tự hủy đơn đã `PAID`**). Khi cần hủy đơn `PAID` trước lúc pha chế (`PAID -> CANCELLED`), `STAFF` hoặc `ADMIN` thực hiện qua `PATCH /orders/:id/status` để hoàn kho BOM và hoàn Voucher (không cần thu hồi điểm vì điểm chỉ cộng khi `COMPLETED`).
* **Xóa đơn qua `DELETE /orders/:id`**: Chỉ **chủ sở hữu đơn hàng hoặc `ADMIN`** được phép gọi `DELETE /orders/:id` đối với đơn `PENDING` / `PAYMENT_FAILED` / `CANCELLED` (`STAFF` gọi `DELETE` sẽ nhận `403 Forbidden`).
* **Tự động hết hạn (5 phút / 300s)**: `ExpireOrdersJob` (`@Cron('*/1 * * * *')`) quét các đơn `PENDING` / `PAYMENT_FAILED` quá hạn TTL **5 phút (300s)**, chuyển sang `CANCELLED` và gọi `refundOrderResources` để hoàn kho BOM (`InventoryLog: CANCEL_REFUND`) cùng lượt Voucher đã trừ.

### 2.5. Theo dõi Đơn hàng (`/orders/:id`) & Tích điểm khi Hoàn tất
* Sau khi thanh toán thành công, Web xóa giỏ hàng (`localStorage`) và chuyển sang `/orders/:id`.
* Hook `useOrderPolling` gọi `GET /orders/:id` mỗi **5 giây** để cập nhật tiến độ 3 bước từ quầy KDS (`/staff` polling `GET /orders/barista/queue` mỗi **3 giây**): `PAID -> PREPARING -> READY -> COMPLETED`.
* Khi KDS chuyển `READY -> COMPLETED` qua `PATCH /orders/:id/status`, `OrdersService` cộng điểm Hạt Vàng (`User.loyaltyPoints += Math.floor(totalAmount / 1000)`) cho chủ đơn.
