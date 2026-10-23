# ĐẶC TẢ USE-CASE TRỌNG TÂM: ĐẶT VÀ THANH TOÁN ĐƠN HÀNG
## BREWLITE: 100% CASHLESS SPECIALTY COFFEE ROASTERY

> **Tài liệu:** `docs/requirements/use-case-checkout.md`  
> **Mã Use-case:** `UC-CHECKOUT`  
> **Học phần:** Công nghệ Phần mềm (Software Engineering) — Assignment 2 (Task 1.3)  
> **Đơn vị đào tạo:** Khoa Công nghệ Thông tin, Trường Đại học Sài Gòn (SGU)  
> **Giảng viên hướng dẫn:** ThS. Nguyễn Phan Tuyết Ngân  
> **Nhóm thực hiện:** Nhóm BrewLite (6 thành viên):
> 1. **Mã Gia Vỹ**
> 2. **Huỳnh Tuấn Kiệt**
> 3. **Nguyễn Gia Thành**
> 4. **Vũ Châu Minh Khôi**
> 5. **Quách Kỳ Minh**
> 6. **Nguyễn Thị Ý**  
> **Phiên bản:** v1.0 — Ngày lập: 23/10/2026

---

## 1. THÔNG TIN TỔNG QUAN (METADATA)

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã định danh** | `UC-CHECKOUT` |
| **Tên Use-case** | **Đặt món và Thanh toán không dùng tiền mặt (Cashless Order & Checkout)** |
| **Tác nhân chính (Primary Actor)** | **Khách hàng (Customer)** — Người dùng đã chọn món vào giỏ hàng và tiến hành đặt hàng. |
| **Tác nhân hỗ trợ (Supporting Actors)** | • **Cổng thanh toán giả lập (Mock Payment Gateway)**: Xử lý giao dịch thẻ / ví điện tử.<br>• **Hệ thống cơ sở dữ liệu (PostgreSQL)**: Thẩm định giá, trừ tồn kho và ghi nhận đơn hàng. |
| **Sự kiện kích hoạt (Trigger)** | Khách hàng nhấn nút **"Tiến hành đặt hàng" (Proceed to Checkout)** từ màn hình Giỏ hàng. |
| **Mức độ ưu tiên** | `MUST HAVE` (Nghiệp vụ sống còn của hệ thống). |
| **Liên kết yêu cầu chức năng (FR)** | `FR-03` (Giỏ hàng), `FR-04` (Xác thực JWT), `FR-05` (Tạo đơn & Trừ kho), `FR-06` (Thanh toán & Idempotency), `FR-07` (Voucher & Loyalty). |

---

## 2. TIỀN ĐIỀU KIỆN VÀ HẬU ĐIỀU KIỆN (PRE & POST CONDITIONS)

### 2.1. Tiền điều kiện (Pre-conditions)
1. Giỏ hàng của khách hàng trên ứng dụng có ít nhất 1 sản phẩm hợp lệ (`cart.items.length > 0`).
2. Khách hàng đã đăng nhập tài khoản hợp lệ và sở hữu JWT Token chưa hết hạn (nếu chưa đăng nhập, hệ thống yêu cầu xác thực trước khi tiến hành thanh toán).
3. Hệ thống Backend và Database đang hoạt động bình thường, sẵn sàng kết nối.

### 2.2. Hậu điều kiện (Post-conditions)
* **Trường hợp thành công (Success Post-condition):**
  - Đơn hàng được tạo thành công với trạng thái `PAID`.
  - Tồn kho nguyên liệu (BOM) tương ứng của từng món được trừ chính xác khỏi cơ sở dữ liệu.
  - Giao dịch thanh toán được ghi nhận kèm mã giao dịch `transactionId` và `Idempotency-Key`.
  - Tài khoản khách hàng được cộng điểm thưởng Loyalty theo tỷ lệ (`10.000đ = 1 điểm`).
  - Lượt sử dụng mã voucher (nếu có) bị giảm 1 đơn vị.
  - Giỏ hàng phía Client được dọn sạch (`cart.items = []`).
  - Màn hình chuyển hướng sang trang **Xác nhận & Theo dõi tiến trình đơn hàng** (`/orders/:id`).
* **Trường hợp thất bại (Failure Post-condition):**
  - Tồn kho nguyên liệu được hoàn trả (hoặc giao dịch DB Rollback toàn bộ).
  - Đơn hàng chuyển sang trạng thái `PAYMENT_FAILED` hoặc bị hủy.
  - Giỏ hàng của khách hàng được giữ nguyên vẹn để khách có thể thử lại phương thức khác.
  - Khách hàng nhận được thông báo lỗi rõ ràng.

---

## 3. LUỒNG SỰ KIỆN CHI TIẾT (FLOW OF EVENTS)

```
┌──────────┐            ┌────────────┐            ┌───────────┐            ┌─────────────────┐
│ Customer │            │ Next.js UI │            │ NestJS BE │            │ Payment Gateway │
└────┬─────┘            └─────┬──────┘            └─────┬─────┘            └────────┬────────┘
     │                        │                         │                           │
     │ 1. Nhấn Checkout       │                         │                           │
     │───────────────────────>│                         │                           │
     │                        │ 2. Kiểm tra Auth JWT    │                           │
     │                        │──┐                      │                           │
     │                        │  │ Token hợp lệ         │                           │
     │                        │<─┘                      │                           │
     │                        │ 3. POST /orders (Draft) │                           │
     │                        │────────────────────────>│                           │
     │                        │                         │ 4. Transaction:           │
     │                        │                         │    - Validate giá gốc     │
     │                        │                         │    - Trừ tồn kho BOM      │
     │                        │                         │    - Tạo đơn PENDING      │
     │                        │                         │──┐                        │
     │                        │                         │  │ Optimistic Lock        │
     │                        │                         │<─┘                        │
     │                        │ 5. Đơn PENDING (201)    │                           │
     │                        │<────────────────────────│                           │
     │ 6. Chọn PT & Bấm Trả   │                         │                           │
     │───────────────────────>│                         │                           │
     │                        │ 7. POST /payments/pay   │                           │
     │                        │    [Idempotency-Key]    │                           │
     │                        │────────────────────────>│                           │
     │                        │                         │ 8. Gửi yêu cầu trừ tiền   │
     │                        │                         │──────────────────────────>│
     │                        │                         │ 9. Trả về SUCCESS         │
     │                        │                         │<──────────────────────────│
     │                        │                         │ 10. Update PAID, +Loyalty │
     │                        │ 11. Thanh toán OK (200) │                           │
     │                        │<────────────────────────│                           │
     │ 12. Theo dõi đơn hàng  │                         │                           │
     │<───────────────────────│                         │                           │
```

### 3.1. Luồng chính (Basic Flow — Happy Path)
1. **Khách hàng** nhấn nút "Xem giỏ hàng" và bấm "Tiến hành đặt hàng" từ giao diện Next.js.
2. **Next.js Frontend** kiểm tra trạng thái xác thực:
   - Phát hiện JWT Token hợp lệ lưu tại Zustand AuthStore.
3. **Next.js Frontend** chuyển người dùng đến màn hình Thanh toán (`/checkout`), hiển thị tóm tắt đơn hàng:
   - Danh sách món kèm tùy chọn (Size, Topping, Ghi chú đường/đá).
   - Tạm tính tiền món (Subtotal).
   - Thuế giá trị gia tăng VAT 8%.
   - Ô nhập mã giảm giá (Voucher).
   - Lựa chọn phương thức thanh toán: Ví điện tử (`E_WALLET`) hoặc Thẻ ngân hàng (`CREDIT_CARD`).
4. **Khách hàng** chọn phương thức thanh toán và nhấn **"Xác nhận & Thanh toán"**.
5. **Next.js Frontend** tạo một chuỗi khóa định danh duy nhất `Idempotency-Key` (UUIDv4), vô hiệu hóa nút bấm để chống bấm đúp, và gửi request `POST /orders` kèm header `Authorization: Bearer <token>` và `Idempotency-Key`.
6. **NestJS API** tiếp nhận request:
   - `JwtAuthGuard` giải mã token, xác thực danh tính khách hàng.
   - Thẩm định tính hợp lệ của DTO (`CreateOrderDto`).
7. **NestJS API** mở một **PostgreSQL Database Transaction** có mức cô lập cao:
   - Truy vấn giá gốc thực tế của từng sản phẩm, size và topping từ cơ sở dữ liệu (không phụ thuộc vào giá client gửi lên).
   - Kiểm tra tồn kho nguyên liệu (BOM Ingredients) bằng cơ chế **Optimistic Concurrency Control**.
   - Trừ số lượng tồn kho của nguyên liệu tương ứng.
   - Tạo bản ghi `Order` với trạng thái `PENDING`.
8. **NestJS API** chuyển giao dịch sang dịch vụ thanh toán `PaymentsService`:
   - Gửi yêu cầu trừ tiền tới Cổng thanh toán giả lập (Mock Payment Gateway).
9. **Cổng thanh toán** xử lý trừ tiền và trả về kết quả `SUCCESS` kèm mã giao dịch `transactionId`.
10. **NestJS API** cập nhật giao dịch trong cùng Transaction:
    - Chuyển trạng thái đơn hàng sang `PAID`.
    - Tạo bản ghi thanh toán `Payment` lưu trữ `transactionId`, `amount`, `paymentMethod`.
    - Tính và cộng điểm thưởng Loyalty cho khách hàng (`Math.floor(finalAmount / 10000)`).
    - Cập nhật số lượt sử dụng của Voucher (nếu có).
    - Commit Transaction vào Database.
11. **NestJS API** trả về mã `201 Created` kèm thông tin đơn hàng đã thanh toán.
12. **Next.js Frontend** nhận phản hồi thành công:
    - Xóa sạch giỏ hàng hiện tại trong Zustand Store và `localStorage`.
    - Điều hướng khách hàng sang màn hình chi tiết đơn hàng (`/orders/:orderId`).
    - Khởi động cơ chế Polling (5 giây/lần) để khách theo dõi Barista chuẩn bị món tại quầy bar.

---

### 3.2. Các luồng thay thế (Alternative Flows)

#### A1: Khách hàng áp dụng mã giảm giá (Voucher) hợp lệ
* Tại Bước 3 của Luồng chính:
  1. Khách hàng nhập mã giảm giá (ví dụ: `BREWLITE10` hoặc `WELCOME20`) và bấm "Áp dụng".
  2. Frontend gửi request `POST /vouchers/validate` đến Backend.
  3. Backend kiểm tra mã: tồn tại trong DB, còn thời hạn, chưa hết lượt sử dụng và đơn đạt giá trị tối thiểu.
  4. Backend trả về thông tin giảm giá. Frontend tính toán lại tổng tiền hiển thị: `Tổng thanh toán = (Tạm tính + VAT) - Giảm giá`.
  5. Tiếp tục Bước 4 của Luồng chính.

#### A2: Khách hàng hủy đơn trong vòng 5 phút (Grace Period Cancellation)
* Sau khi đơn hàng đã chuyển sang trạng thái `PAID` nhưng Barista chưa bấm chuyển `PREPARING`:
  1. Khách hàng bấm nút "Hủy đơn hàng" trên màn hình chi tiết đơn.
  2. Frontend gửi `PATCH /orders/:id/cancel`.
  3. Backend kiểm tra: thời gian kể từ lúc đặt $\le 5$ phút và trạng thái đơn đang là `PAID`.
  4. Backend chuyển đơn sang `CANCELLED` và tự động cộng hoàn trả tồn kho nguyên liệu đã trừ trước đó.
  5. Màn hình cập nhật trạng thái đã hủy đơn thành công.

---

### 3.3. Các luồng ngoại lệ (Exception Flows)

#### E1: Khách hàng chưa đăng nhập khi bấm Checkout
* Tại Bước 2 của Luồng chính:
  1. Frontend phát hiện không có JWT Token trong AuthStore.
  2. Frontend hiển thị thông báo yêu cầu đăng nhập và tự động điều hướng sang trang `/auth/login?redirect=/checkout`.
  3. Sau khi khách đăng nhập thành công, Frontend tự động chuyển hướng khách hàng quay trở lại trang `/checkout` với đầy đủ các món trong giỏ hàng được bảo lưu nguyên vẹn.

#### E2: Xung đột hết hàng đồng thời (Optimistic Locking Conflict / Out of Stock)
* Tại Bước 7 của Luồng chính:
  1. Trong lúc khách đang thao tác, một khách hàng khác đã hoàn tất mua hết số lượng nguyên liệu của món đó.
  2. Khi Backend thực thi truy vấn cập nhật với điều kiện `version = current_version`, số dòng cập nhật trả về là 0 (hoặc tồn kho không đủ).
  3. Transaction tự động Rollback toàn bộ.
  4. Backend trả về mã lỗi HTTP `409 Conflict` kèm thông báo: *"Một số nguyên liệu trong đơn hàng của bạn vừa hết suất phục vụ. Vui lòng chọn món khác!"*.
  5. Frontend bắt lỗi, hiển thị Toast cảnh báo đỏ và giữ nguyên giỏ hàng để khách hàng điều chỉnh.

#### E3: Thanh toán thất bại từ Cổng thanh toán (Payment Failed)
* Tại Bước 9 của Luồng chính:
  1. Cổng thanh toán giả lập trả về lỗi (ví dụ: Số dư không đủ, Thẻ hết hạn, mã mô phỏng ngẫu nhiên trả về FAILURE).
  2. Backend cập nhật đơn hàng sang trạng thái `PAYMENT_FAILED`.
  3. Backend thực hiện hoàn trả lại tồn kho nguyên liệu đã giữ chỗ tạm thời trong Database.
  4. Backend trả về lỗi HTTP `400 Bad Request` kèm thông báo: *"Thanh toán không thành công. Giao dịch đã bị từ chối bởi ngân hàng."*.
  5. Frontend hiển thị màn hình thông báo lỗi thanh toán kèm nút "Thử lại bằng phương thức khác". Giỏ hàng của khách vẫn được giữ nguyên.

#### E4: Gửi trùng request do giật lag mạng (Idempotency Collision)
* Tại Bước 5 của Luồng chính:
  1. Do mạng chập chờn, khách hàng bấm liên tiếp 2 lần hoặc client tự động retry request với cùng một `Idempotency-Key`.
  2. Backend phát hiện `Idempotency-Key` này đã được tiếp nhận và xử lý trong bảng `idempotency_records`.
  3. Backend lập tức chặn đứng việc tạo thêm bản ghi thứ 2, trả về đúng kết quả và `orderId` của giao dịch trước đó.
  4. Đảm bảo tài khoản khách hàng không bao giờ bị trừ tiền 2 lần.

---

## 4. MA TRẬN ÁNH XẠ TIÊU CHÍ NGHIỆM THU (TRACEABILITY MAPPING)

| Thành phần của Use-Case | Yêu cầu chức năng tương ứng | Code hiện thực (NestJS / Next.js) | Kịch bản kiểm thử tự động |
| :--- | :--- | :--- | :--- |
| Xác thực trước khi đặt | `FR-04` | `JwtAuthGuard`, `ProtectedRoute.tsx` | `auth.service.spec.ts` |
| Thẩm định giỏ & Tính giá gốc | `FR-03`, `FR-05` | `orders.service.ts` -> `calculateTotal()` | `orders.service.spec.ts (Test Case 1-10)` |
| Trừ tồn kho Optimistic Lock | `FR-05` | `orders.service.ts` -> `tx.ingredient.update()` | `orders.service.spec.ts (Optimistic Lock Test)` |
| Thanh toán & Idempotency Key | `FR-06` | `payments.service.ts`, `IdempotencyInterceptor` | `payments.service.spec.ts (Idempotent Test)` |
| Chuyển trạng thái & Cộng điểm | `FR-06`, `FR-07` | `orders.service.ts` -> `assertTransition()` | `orders.service.spec.ts (State Transition Test)` |
