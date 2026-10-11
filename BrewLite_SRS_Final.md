# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
## BrewLite — Ứng Dụng Đặt Và Thanh Toán Cà Phê Không Tiền Mặt

**Dự án:** BrewLite  
**Phiên bản:** 4.0 (Hợp nhất SRS 3.0 + File yêu cầu thầy v1.0 + Quyết định nhóm 10/2026)  
**Ngày soạn:** Tháng 10, 2026  
**Trạng thái:** Đã chốt — tài liệu chính thức dùng để phát triển  
**Scope:** Hệ thống dành cho khách hàng đầu cuối + Scheduled Job (tùy chọn)

> **Các điểm đã chốt & thay đổi so với v3.0:**
> - **Mật khẩu tối thiểu:** **≥ 6 ký tự** (điều chỉnh từ 8 về 6 theo SRS gốc — cập nhật cả `RegisterDto` backend và form validation frontend).
> - **Redirect sau đăng ký/đăng nhập:** **Chuyển thẳng sang trang Checkout** (giữ nguyên giỏ hàng, tiếp tục luồng thanh toán thay vì quay về trang chủ).
> - **Topping:** Bảng `Topping` riêng biệt, quan hệ nhiều-nhiều với `Product` qua `ProductTopping`, lưu snapshot lịch sử tại `OrderItemTopping`.
> - **Voucher / Khuyến mãi:** Seed sẵn 2 mã cố định (`BREWLITE10`, `WELCOME20`) + 1 API validate (`POST /vouchers/validate`) + tích hợp logic tính tiền & trừ lượt ở Backend trong Task 10 (không làm UI admin).
> - **Thông báo:** Bỏ Push Notification (FCM/Web Push), thay thế hoàn toàn bằng **Polling 5 giây** tại trang chi tiết/lịch sử đơn hàng.
> - **Scheduled Job:** Đưa vào mục **Ghi chú tính năng tùy chọn** (làm nếu còn thời gian, không ảnh hưởng điểm số chính).
> - **State Machine:** Giữ nguyên logic transition `PAID → CANCELLED` tại Backend NestJS để pass 100% bài unit test `assertTransition` của thầy.
> - **Task 10 (Backend nâng cao):** Đầy đủ 3 bộ kiểm thử bắt buộc: (a) Chặn chuyển trạng thái sai; (b) Idempotency-Key; (c) Optimistic Locking không vượt tồn kho.

---

## MỤC LỤC

1. [Giới thiệu về hệ thống](#1-giới-thiệu)
2. [Phạm vi và ranh giới](#2-phạm-vi)
3. [Tổng quan Use Case](#3-tổng-quan-use-case)
4. [Use Case chi tiết](#4-use-case-chi-tiết)
5. [Quy tắc nghiệp vụ (Business Rules)](#5-quy-tắc-nghiệp-vụ)
6. [Máy trạng thái đơn hàng](#6-máy-trạng-thái)
7. [Mô hình dữ liệu](#7-mô-hình-dữ-liệu)
8. [Danh sách API và Endpoint](#8-api)
9. [Yêu cầu phi chức năng](#9-phi-chức-năng)
10. [Tiêu chí chấp nhận & Kiểm thử](#10-tiêu-chí-chấp-nhận)
11. [Môi trường phát triển & Kiến trúc](#11-môi-trường)
12. [Định nghĩa hoàn thành (DoD)](#12-dod)
13. [Bàn giao sản phẩm](#13-bàn-giao)
14. [Ghi chú tính năng tùy chọn](#14-tùy-chọn)

---

## 1. GIỚI THIỆU

BrewLite là ứng dụng web thương mại điện tử phục vụ khách hàng đặt và thanh toán đồ uống không dùng tiền mặt (Cashless Coffee). Ứng dụng giúp khách hàng duyệt danh sách đồ uống, tùy chọn size và topping, quản lý giỏ hàng, xác thực tài khoản JWT, thanh toán trực tuyến qua cổng giả lập, và theo dõi trạng thái đơn hàng từ lúc đặt cho đến khi sẵn sàng nhận đồ uống tại quầy.

**Mục tiêu cốt lõi:** Giảm thiểu thời gian xếp hàng chờ đợi, tối ưu hóa quy trình pha chế và nâng cao trải nghiệm đặt hàng tiện lợi, chuẩn xác, minh bạch.

---

## 2. PHẠM VI

### Trong phạm vi (Core MVP)
- Duyệt thực đơn (Menu), xem chi tiết sản phẩm, chọn kích thước (S/M/L) và topping.
- Quản lý giỏ hàng cục bộ phía Client (thêm, sửa số lượng 1–20, xóa, cập nhật).
- Xác thực người dùng bằng JWT (đăng ký, đăng nhập với mật khẩu băm bcrypt ≥ 6 ký tự).
- Luồng Checkout: áp dụng mã giảm giá (voucher), chọn phương thức (Ví điện tử / Thẻ), tạo đơn hàng `PENDING`.
- Thanh toán giả lập (Mock Payment Gateway 50% SUCCESS / 50% FAILURE).
- Quản lý trạng thái đơn hàng (Order State Machine) và hiển thị kết quả xác nhận đơn hàng (`PAID`).
- Xem lịch sử đơn hàng (`GET /orders/me`) và theo dõi tiến độ đơn hàng theo thời gian thực (Polling mỗi 5 giây).
- Nghiệp vụ Backend nâng cao (Task 10): Optimistic Locking kiểm soát tồn kho đồng thời, Idempotency-Key chống thanh toán trùng, cộng điểm tích lũy (Loyalty Points), trừ lượt voucher.

### Ngoài phạm vi
- Giao diện thao tác của nhân viên Barista (cập nhật `PREPARING → READY → COMPLETED`).
- Giao diện Admin quản trị sản phẩm, danh mục, topping và voucher.
- Cổng thanh toán thật tích hợp ngân hàng (chỉ dùng Mock Payment Gateway trong bài tập lớn).
- Push Notification qua Firebase/Web Push (dùng polling thay thế).
- Hoàn tiền tự động về tài khoản ngân hàng thực tế.

---

## 3. TỔNG QUAN USE CASE

| Mã UC | Tên Use Case | Tác nhân (Actor) | Yêu cầu đăng nhập |
|:---:|:---|:---:|:---:|
| **UC1** | Duyệt danh sách sản phẩm & Xem chi tiết | Khách hàng | Không |
| **UC2** | Quản lý giỏ hàng | Khách hàng | Không |
| **UC3** | Đăng ký & Đăng nhập tài khoản | Khách hàng | N/A |
| **UC4** | Tạo đơn hàng, áp voucher & Thanh toán | Khách hàng | **Có** |
| **UC5** | Xem lịch sử & Theo dõi trạng thái đơn hàng | Khách hàng | **Có** |
| **UC6** *(Tùy chọn)* | Scheduled Job tự hủy đơn quá hạn | Hệ thống (Cron Job) | N/A |

---

## 4. USE CASE CHI TIẾT

### UC1: Duyệt Danh Sách Sản Phẩm & Xem Chi Tiết
* **Tiền điều kiện:** Hệ thống đã khởi chạy, Database đã seed ít nhất 10 sản phẩm mẫu kèm giá, ảnh, số lượng tồn kho (`stock`) và các topping tương ứng.
* **Luồng chính:**
  1. Khách hàng truy cập trang Menu (`/` hoặc `/menu`). Frontend gọi API `GET /products`. Hệ thống hiển thị lưới sản phẩm với ảnh, tên, giá cơ sở (size S). Sản phẩm có `stock = 0` hiển thị nhãn "Hết hàng" và vô hiệu hóa chọn mua.
  2. Khách bấm vào một sản phẩm để xem chi tiết. Frontend điều hướng sang trang chi tiết và gọi `GET /products/:id`.
  3. Màn hình chi tiết hiển thị ảnh, tên, mô tả, tồn kho và các tùy chọn:
     - **Chọn Size:** Mặc định là size S.
       - Size S: +0 đ
       - Size M: +5,000 đ
       - Size L: +10,000 đ
     - **Chọn Topping:** Danh sách checkbox lấy từ mảng `toppings` của sản phẩm.
       - Kem muối biển: +10,000 đ
       - Trân châu giòn: +8,000 đ
       - Thạch cà phê: +8,000 đ
     - **Tùy chọn mức đá:** 100% Đá (mặc định), 70% Đá, 50% Đá, Không Đá (+0 đ).
     - **Tùy chọn mức đường:** Chuẩn Ngọt (mặc định), 70% Đường, 50% Đường, Không Đường (+0 đ).
     - **Chọn số lượng:** Giá trị từ 1 đến 20.
  4. Hệ thống tự động tính giá xem trước theo thời gian thực (Realtime):
     $$\text{Giá một ly} = \text{Giá cơ sở (size S)} + \text{Phụ thu size} + \sum \text{Giá topping đã chọn}$$
     $$\text{Tổng tiền dòng} = \text{Giá một ly} \times \text{Số lượng}$$
* **Hậu điều kiện:** Khách chọn xong cấu hình món và sẵn sàng thêm vào giỏ hàng.

---

### UC2: Quản Lý Giỏ Hàng
* **Tiền điều kiện:** Khách bấm "Thêm vào giỏ hàng" tại màn hình chi tiết món.
* **Luồng chính:**
  1. Giỏ hàng được quản lý hoàn toàn tại Client bằng **Zustand store + localStorage**, không gọi API backend.
  2. Khi thêm sản phẩm:
     - Kiểm tra nếu giỏ hàng đã có sản phẩm trùng khớp hoàn toàn (`productId`, `size`, tập hợp các `toppingIds` đã chọn) → **Cộng dồn số lượng** vào dòng cũ (không tạo dòng mới). Nếu tổng số lượng vượt quá 20 → Báo lỗi giới hạn số lượng và giữ nguyên.
     - Nếu là cấu hình mới → Thêm một dòng mới vào giỏ hàng.
  3. Cập nhật Badge số lượng hiển thị trên thanh Header/Navbar. Hiển thị thông báo Toast xác nhận.
  4. Tại trang Giỏ hàng (`/cart`):
     - Hiển thị danh sách từng món: Ảnh, tên, size, danh sách topping, số lượng, thành tiền từng dòng và Tổng tạm tính của giỏ hàng.
     - Cho phép tăng/giảm số lượng (1–20), xóa từng dòng, hoặc xóa toàn bộ giỏ.
     - Cho phép bấm nút "Sửa" để quay lại trang chi tiết nạp sẵn tùy chọn cũ.
  5. Nếu giỏ hàng trống → Hiển thị giao diện Empty State và nút "Tiếp tục mua hàng". Nút "Thanh toán" bị vô hiệu hóa.
* **Hậu điều kiện:** Giỏ hàng lưu trữ đầy đủ thông tin sản phẩm và sẵn sàng tiến hành thanh toán.

---

### UC3: Đăng Ký & Đăng Nhập Tài Khoản
* **Tiền điều kiện:** Khách bấm nút "Thanh toán" từ Giỏ hàng, hệ thống kiểm tra chưa có Token JWT hợp lệ.
* **Luồng đăng ký:**
  1. Khách nhập email, mật khẩu (**≥ 6 ký tự**), xác nhận mật khẩu.
  2. Frontend kiểm tra validation cơ bản (đúng định dạng email, mật khẩu ≥ 6 ký tự, mật khẩu xác nhận trùng khớp).
  3. Frontend gọi `POST /api/v1/auth/register`.
  4. Backend xác thực DTO: Kiểm tra email trong DB. Nếu đã tồn tại → Trả về HTTP `409 Conflict`. Nếu chưa tồn tại → Băm mật khẩu bằng `bcrypt` (salt rounds = 10), tạo User mới (`loyaltyPoints = 0`), ký sinh JWT Token (hạn 24 giờ).
  5. Frontend nhận JWT Token, lưu vào `localStorage` và cập nhật Zustand store.
  6. **Điều hướng quan trọng:** Hệ thống **chuyển hướng thẳng sang trang Checkout (`/checkout`)** để khách tiếp tục thanh toán đơn hàng (không điều hướng về trang chủ), giỏ hàng được bảo toàn nguyên vẹn.
* **Luồng đăng nhập:**
  1. Khách nhập email và mật khẩu tại `/auth/login`.
  2. Frontend gọi `POST /api/v1/auth/login`.
  3. Backend đối chiếu email và mật khẩu băm qua `bcrypt.compare`. Nếu không đúng → Trả về HTTP `401 Unauthorized`. Nếu đúng → Ký sinh JWT Token.
  4. Frontend lưu token vào `localStorage` và Zustand store, sau đó **chuyển hướng thẳng sang trang Checkout (`/checkout`)**. Giỏ hàng được giữ nguyên.
* **Hậu điều kiện:** Khách có phiên đăng nhập hợp lệ với JWT, sẵn sàng thực hiện thanh toán.

---

### UC4: Tạo Đơn Hàng & Thanh Toán

#### Bước 1: Xem lại đơn hàng & Áp dụng Voucher tại trang Checkout
* Trang Checkout hiển thị tóm tắt danh sách món, số lượng, tùy chọn và Tổng tiền tạm tính (`total`).
* **Áp dụng mã giảm giá (Voucher):**
  - Khách hàng nhập mã (ví dụ: `BREWCOZY`, `BREWLITE10`, hoặc `WELCOME20`) và bấm "Áp dụng".
  - Danh sách mã giảm giá seed sẵn phục vụ test & demo:
    - `BREWCOZY`: Giảm 15% tổng đơn (tối đa 25,000 đ).
    - `BREWLITE10`: Giảm 10% tổng đơn (tối đa 20,000 đ, đơn tối thiểu 50,000 đ).
    - `WELCOME20`: Giảm thẳng 20,000 đ (đơn tối thiểu 30,000 đ).
  - Frontend gọi `POST /api/v1/vouchers/validate` gửi `{ code, total }`.
  - Backend kiểm tra tính hợp lệ: Mã có tồn tại trong DB không? Đã hết hạn chưa? Đã đạt giới hạn lượt dùng chưa (`usedCount < usageLimit`)? Giá trị đơn hàng có đạt mức tối thiểu (`minOrderValue`) không?
  - Nếu hợp lệ: Backend tính toán số tiền giảm (`discountAmount`) và tổng tiền thanh toán mới (`finalTotal = total - discountAmount`), trả về cho Frontend hiển thị xem trước.

#### Bước 2: Chọn phương thức thanh toán
* Khách chọn một trong hai phương thức qua Radio Button:
  - **Ví điện tử** (mặc định)
  - **Thẻ ngân hàng (Thẻ tín dụng/ghi nợ)**

#### Bước 3: Tạo đơn hàng (`POST /orders`)
1. Khách bấm nút "Xác nhận đặt hàng".
2. Frontend tự động sinh một mã duy nhất **`Idempotency-Key` (chuẩn UUID v4)**. Khóa này được đính kèm vào Header của cả request tạo đơn lẫn request thanh toán.
3. Frontend gửi request `POST /api/v1/orders` kèm Header `Authorization: Bearer <token>` và `Idempotency-Key`. Body gửi lên chỉ gồm mảng items `[{ productId, size, toppingIds[], quantity }]` và `voucherCode` (nếu có). **Tuyệt đối không gửi giá tiền từ Client lên.**
4. **Backend xử lý trong một Database Transaction:**
   - Kiểm tra trùng lặp `Idempotency-Key` kết hợp `userId`. Nếu request gửi lại cùng khóa → Trả về thông tin đơn hàng đã tạo trước đó, không tạo trùng.
   - Tra cứu giá `Product` và các `Topping` trực tiếp từ Database. Tính toán lại toàn bộ `unitPrice`, `lineTotal`, và `total`.
   - Tra cứu và kiểm tra lại mã Voucher trực tiếp từ Database. Tính toán `discountAmount` và `finalTotal` chính thức.
   - **Trừ tồn kho với Optimistic Locking:** Cập nhật `stock = stock - quantity` đồng thời tăng `version = version + 1` với điều kiện `version` cũ khớp. Nếu xảy ra xung đột đồng thời, hệ thống thử lại tối đa 3 lần. Nếu vẫn thất bại hoặc hết hàng → Rollback transaction và trả về HTTP `409 Conflict`.
   - Tạo bản ghi `Order` với trạng thái ban đầu là **`PENDING`**.
   - Tạo các bản ghi `OrderItem` và snapshot thông tin topping vào `OrderItemTopping`.
   - Commit transaction.
5. Backend trả về thông tin đơn hàng (`orderId`, `status: PENDING`, `finalTotal`...).

#### Bước 4: Thực hiện thanh toán (`POST /payments`)
1. Frontend lập tức gọi API `POST /api/v1/payments` với cùng `Idempotency-Key`, body gồm `{ orderId, amount: finalTotal, method }`.
2. Backend kiểm tra tính hợp lệ: Khớp số tiền, đơn hàng ở trạng thái `PENDING` hoặc `PAYMENT_FAILED`.
3. Kiểm tra Idempotency: Nếu đã có Payment `SUCCESS` cho key này → Trả về kết quả cũ ngay lập tức.
4. Gọi Mock Payment Service: Giả lập trả về ngẫu nhiên **SUCCESS (50%)** hoặc **FAILURE (50%)**.
5. **Trường hợp SUCCESS (Thành công):**
   - Thực thi trong một Database Transaction:
     - Tạo bản ghi `Payment` với trạng thái `SUCCESS`.
     - Kích hoạt chuyển trạng thái đơn hàng: `assertTransition(PENDING → PAID)`.
     - Tăng số lượt sử dụng voucher: `Voucher.usedCount += 1` (nếu có áp dụng voucher).
     - Tích lũy điểm thưởng thành viên cho User: `loyaltyPoints += floor(finalTotal / 10000)`.
     - Commit transaction.
   - Frontend nhận phản hồi thành công → Xóa sạch giỏ hàng trong Zustand và `localStorage` (badge về 0).
   - Chuyển hướng sang màn hình Xác nhận đơn hàng (Confirmation).
6. **Trường hợp FAILURE (Thất bại):**
   - Tạo bản ghi `Payment` với trạng thái `FAILURE`.
   - Chuyển trạng thái đơn hàng: `assertTransition(PENDING → PAYMENT_FAILED)`.
   - Tồn kho và lượt dùng voucher được **giữ nguyên** (không hoàn kho ngay) để khách hàng có thể thử lại.
   - Frontend hiển thị thông báo lỗi thanh toán kèm 2 lựa chọn: **"Thử lại thanh toán"** hoặc **"Hủy đơn hàng"**.

#### Bước 5: Thử lại hoặc Hủy đơn từ màn hình lỗi
* **Thử lại thanh toán:** Khách bấm "Thử lại", Frontend gửi lại request `POST /api/v1/payments` với cùng `Idempotency-Key`. Backend chuyển `assertTransition(PAYMENT_FAILED → PENDING)` và gọi lại Mock Payment.
* **Hủy đơn:** Khách bấm "Hủy đơn", Frontend gọi `PATCH /api/v1/orders/:id/cancel`. Backend thực hiện `assertTransition(PAYMENT_FAILED → CANCELLED)`, hoàn lại số lượng tồn kho `stock` cho các sản phẩm, hoàn lại `usedCount` của voucher và commit. Khách được điều hướng về lại Giỏ hàng (giỏ hàng vẫn còn nguyên sản phẩm).

---

### UC5: Xem Lịch Sử & Theo Dõi Trạng Thái Đơn Hàng
* **Xem lịch sử đơn (`GET /api/v1/orders/me`):**
  - Hiển thị danh sách tất cả các đơn hàng của tài khoản đang đăng nhập, sắp xếp theo thời gian mới nhất lên đầu.
  - Mỗi đơn hiển thị: Mã đơn (`#xxxx`), ngày đặt, tổng tiền, phương thức thanh toán, số điểm thưởng nhận được và nhãn trạng thái (`PAID`, `PENDING`, `PAYMENT_FAILED`, `CANCELLED`...).
* **Theo dõi trạng thái chi tiết (`GET /api/v1/orders/:id`):**
  - Frontend thực hiện cơ chế **Polling định kỳ mỗi 5 giây** gọi API `GET /api/v1/orders/:id` cho đến khi đơn hàng đạt trạng thái kết thúc (`COMPLETED` hoặc `CANCELLED`).
  - Giao diện hiển thị thanh tiến trình Timeline trực quan:
    $$\text{PAID} \longrightarrow \text{PREPARING} \longrightarrow \text{READY} \longrightarrow \text{COMPLETED}$$
  - Nếu đơn hàng đang ở trạng thái `PAYMENT_FAILED`, hiển thị nút "Thử lại thanh toán" và "Hủy đơn".

---

## 5. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

| Mã quy tắc | Tên quy tắc | Nội dung chi tiết |
|:---:|:---|:---|
| **BR-01** | **Công thức tính giá** | $\text{unitPrice} = \text{product.price} + \text{sizeUpcharge}$. $\text{lineTotal} = (\text{unitPrice} + \sum \text{topping.price}) \times \text{quantity}$. $\text{total} = \sum \text{lineTotal}$. Phụ thu size: S (+0đ), M (+5,000đ), L (+10,000đ). |
| **BR-02** | **Backend là nguồn chân lý về giá** | Frontend chỉ tính giá xem trước cho khách. Khi tạo đơn, Backend tự truy vấn Database để tính lại toàn bộ đơn giá, phụ thu và tổng tiền. Topping được chọn phải thuộc danh sách hợp lệ của sản phẩm đó. |
| **BR-03** | **Quy tắc giảm giá Voucher** | Giảm theo phần trăm: $\text{floor}(\text{total} \times \text{value} / 100)$, có thể kèm mức giảm tối đa. Giảm cố định: $\min(\text{value}, \text{total})$. $\text{finalTotal} = \max(0, \text{total} - \text{discountAmount})$. Voucher phải được xác thực lại tại thời điểm tạo đơn. |
| **BR-04** | **Trừ kho khi tạo đơn** | Trừ tồn kho ngay khi tạo đơn hàng ở trạng thái `PENDING` trong cùng Database Transaction để giữ chỗ. |
| **BR-05** | **Hoàn tồn kho** | Chỉ hoàn lại tồn kho khi đơn hàng chuyển sang trạng thái `CANCELLED`. Đơn ở trạng thái `PAYMENT_FAILED` vẫn giữ chỗ tồn kho để khách hàng thực hiện thử lại. |
| **BR-06** | **Kiểm soát tồn kho đồng thời (Optimistic Locking)** | Bảng `Product` bắt buộc có cột `version` (kiểu Int, mặc định 0). Khi trừ kho, câu lệnh update kiểm tra `WHERE id = ... AND version = ...`. Nếu không khớp phiên bản, tự động thử lại tối đa 3 lần. Nếu vẫn xung đột hoặc không đủ tồn kho, trả về mã lỗi HTTP `409 Conflict`. |
| **BR-07** | **Xử lý Idempotent (Chống lặp)** | Frontend sinh UUID v4 cho mỗi lượt nhấn thanh toán. Tại `POST /orders`, cặp `(userId, idempotencyKey)` là duy nhất; nếu gửi lại cùng key, Backend trả về đơn hàng cũ. Tại `POST /payments`, nếu key đã có giao dịch `SUCCESS`, Backend trả về kết quả cũ ngay, không gọi cổng thanh toán lần 2. |
| **BR-08** | **Tích lũy điểm thưởng Loyalty** | Số điểm tích lũy: $\text{points} = \lfloor \text{finalTotal} / 10,000 \rfloor$. Điểm chỉ được cộng vào `User.loyaltyPoints` khi đơn hàng chuyển sang trạng thái `PAID`. Nếu đơn hàng `PAID` bị hủy, hệ thống tự động trừ lại số điểm tương ứng. |
| **BR-09** | **Máy trạng thái nghiêm ngặt** | Mọi thay đổi trạng thái đơn hàng đều phải đi qua hàm kiểm tra `assertTransition`. Bất kỳ hành vi chuyển trạng thái trái phép nào đều bị chặn và ném ngoại lệ `BadRequestException`. |
| **BR-10** | **Giỏ hàng lưu trữ Client-side** | Giỏ hàng được lưu trong Zustand và `localStorage`, không đồng bộ lên server khi chưa đặt hàng. Giỏ hàng chỉ bị xóa khi đơn hàng đã thanh toán thành công (`PAID`). |
| **BR-11** | **Xác thực bảo mật Route** | Các API `/orders`, `/payments`, `/orders/me` bắt buộc phải có JWT Token hợp lệ qua Header `Authorization: Bearer <token>`. Xem menu và xem chi tiết món không yêu cầu đăng nhập. |
| **BR-12** | **Giới hạn số lượng món** | Số lượng mỗi dòng sản phẩm trong giỏ hàng tối thiểu là 1 và tối đa là 20. |
| **BR-13** | **Quản lý lượt dùng Voucher** | Lượt dùng `usedCount` của voucher chỉ tăng lên khi đơn hàng chuyển sang `PAID` (trong transaction). Hoàn lại lượt dùng khi đơn bị hủy `CANCELLED`. |
| **BR-14** | **Chuẩn mật khẩu** | Mật khẩu tài khoản phải có độ dài tối thiểu **≥ 6 ký tự** (áp dụng nhất quán ở `RegisterDto` và form giao diện). |

---

## 6. MÁY TRẠNG THÁI ĐƠN HÀNG (ORDER STATE MACHINE)

```
                    POST /orders OK
   (Tạo mới) ──────────────────────────► PENDING
                                             │
                         ┌───────────────────┼───────────────────┐
                         │ Gateway SUCCESS   │ Gateway FAILURE   │ Khách hủy / Cron job
                         ▼                   ▼                   ▼
                       PAID          PAYMENT_FAILED ──────► CANCELLED ◄─── PENDING
                         │                   │  Khách hủy
                         │ (Ngoài MVP)       │  Thử lại
                         ▼                   └──────────────► PENDING
                     PREPARING
                         ▼
                       READY
                         ▼
                     COMPLETED
```

### Ma trận chuyển đổi trạng thái hợp lệ (`assertTransition`)

| Trạng thái hiện tại | Trạng thái chuyển đến | Điều kiện kích hoạt | Hành động nghiệp vụ thực thi |
|:---|:---|:---|:---|
| `(None)` | `PENDING` | `POST /orders` thành công | Trừ tồn kho (`stock`), tăng `version` |
| `PENDING` | `PAID` | Mock Gateway trả về `SUCCESS` | Lưu Payment SUCCESS, cộng `loyaltyPoints`, tăng `usedCount` voucher |
| `PENDING` | `PAYMENT_FAILED` | Mock Gateway trả về `FAILURE` | Lưu Payment FAILURE, giữ nguyên kho |
| `PENDING` | `CANCELLED` | Khách chủ động hủy hoặc Job quá hạn | Hoàn tồn kho (`stock`), hoàn `usedCount` voucher |
| `PAYMENT_FAILED` | `PENDING` | Khách bấm "Thử lại thanh toán" | Chuẩn bị gọi lại cổng thanh toán |
| `PAYMENT_FAILED` | `CANCELLED` | Khách bấm "Hủy đơn" | Hoàn tồn kho (`stock`), hoàn `usedCount` voucher |
| `PAID` | `CANCELLED` | Khách yêu cầu hủy đơn đã thanh toán | Hoàn tồn kho, hoàn voucher, **trừ lại điểm tích lũy** |
| `PAID` | `PREPARING` | Nhân viên Barista tiếp nhận pha chế | *(Ngoài phạm vi MVP - hỗ trợ state)* |
| `PREPARING` | `READY` | Pha chế hoàn tất, sẵn sàng lấy nước | *(Ngoài phạm vi MVP - hỗ trợ state)* |
| `READY` | `COMPLETED` | Khách hàng đã nhận nước tại quầy | *(Trạng thái kết thúc thành công)* |

> **Quy tắc:** Bất kỳ cặp chuyển trạng thái nào không nằm trong bảng trên (ví dụ: `PAYMENT_FAILED → COMPLETED`, `CANCELLED → PAID`) đều bị hàm `assertTransition` ném lỗi HTTP `400 Bad Request`.

---

## 7. MÔ HÌNH DỮ LIỆU (DATABASE SCHEMA)

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   Product    │1     N│  ProductTopping  │N     1│   Topping    │
│--------------│───────│------------------│───────│--------------│
│ id (PK)      │       │ productId (FK)   │       │ id (PK)      │
│ name         │       │ toppingId (FK)   │       │ name         │
│ price        │       └──────────────────┘       │ price        │
│ imageUrl     │                                  └──────────────┘
│ stock        │
│ version      │
└──────────────┘
       │ 1
       │
       │ N
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│  OrderItem   │1     N│ OrderItemTopping │       │   Voucher    │
│--------------│───────│------------------│       │--------------│
│ id (PK)      │       │ id (PK)          │       │ id (PK)      │
│ orderId (FK) │       │ orderItemId (FK) │       │ code (UQ)    │
│ productId(FK)│       │ toppingName      │       │ discountType │
│ size         │       │ toppingPrice     │       │ discountValue│
│ quantity     │       └──────────────────┘       │ usedCount    │
│ lineTotal    │                                  └──────────────┘
└──────────────┘                                         │ 1
       │ N                                               │
       │                                                 │ N
       │ 1                                               ▼
┌─────────────────────────────────────────────────────────────┐
│                            Order                            │
│-------------------------------------------------------------│
│ id (PK, UUID)                                               │
│ userId (FK) ──► User                                        │
│ voucherId (FK, Nullable) ──► Voucher                        │
│ status (PENDING, PAID, PAYMENT_FAILED, CANCELLED, ...)      │
│ total, discountAmount, finalTotal                           │
│ paymentMethod (WALLET, CARD)                                │
│ idempotencyKey                                              │
│ createdAt, updatedAt                                        │
└─────────────────────────────────────────────────────────────┘
       │ 1
       │
       │ N
┌──────────────┐
│   Payment    │
│--------------│
│ id (PK)      │
│ orderId (FK) │
│ idempotencyKey (UQ)
│ amount       │
│ method       │
│ status       │
└──────────────┘
```

### 1. Bảng `Product`
- `id`: String (UUID, Khóa chính)
- `name`: String (Tên món đồ uống)
- `description`: String? (Mô tả món)
- `price`: Decimal (Đơn giá cơ sở cho size S)
- `imageUrl`: String (Đường dẫn hình ảnh)
- `stock`: Int (Số lượng tồn kho, $\ge 0$)
- `version`: Int (Mặc định 0, dùng cho Optimistic Locking)
- `createdAt`, `updatedAt`: DateTime

### 2. Bảng `Topping`
- `id`: String (UUID, Khóa chính)
- `name`: String (Tên topping: Kem muối biển, Trân châu giòn, Thạch cà phê)
- `price`: Decimal (Đơn giá topping: 8,000đ – 10,000đ)

### 3. Bảng `ProductTopping` (Bảng nối Many-to-Many)
- `productId`: String (Khóa ngoại tham chiếu `Product.id`)
- `toppingId`: String (Khóa ngoại tham chiếu `Topping.id`)
- Khóa chính composite: `(productId, toppingId)`

### 4. Bảng `User`
- `id`: String (UUID, Khóa chính)
- `email`: String (Unique, Email người dùng)
- `passwordHash`: String (Mật khẩu băm bcrypt)
- `loyaltyPoints`: Int (Điểm tích lũy, mặc định 0)
- `createdAt`, `updatedAt`: DateTime

### 5. Bảng `Voucher`
- `id`: String (UUID, Khóa chính)
- `code`: String (Unique, Mã giảm giá viết hoa: `BREWCOZY`, `BREWLITE10`, `WELCOME20`)
- `discountType`: Enum (`PERCENT` | `FIXED`)
- `discountValue`: Decimal (Phần trăm hoặc số tiền giảm cố định)
- `minOrderValue`: Decimal (Giá trị đơn hàng tối thiểu áp dụng)
- `maxDiscount`: Decimal? (Số tiền giảm tối đa đối với loại PERCENT)
- `usageLimit`: Int (Giới hạn tổng số lượt sử dụng)
- `usedCount`: Int (Số lượt đã sử dụng, mặc định 0)
- `expiresAt`: DateTime (Thời điểm hết hạn)

### 6. Bảng `Order`
- `id`: String (UUID, Khóa chính hiển thị mã đơn)
- `userId`: String (Khóa ngoại tham chiếu `User.id`)
- `voucherId`: String? (Khóa ngoại tham chiếu `Voucher.id`, có thể null)
- `status`: Enum (`PENDING`, `PAID`, `PAYMENT_FAILED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`)
- `total`: Decimal (Tổng tiền trước giảm)
- `discountAmount`: Decimal (Số tiền được giảm)
- `finalTotal`: Decimal (Tổng tiền thực tế phải trả)
- `paymentMethod`: Enum? (`WALLET`, `CARD`)
- `idempotencyKey`: String (Mã UUID chống trùng lặp)
- `createdAt`, `updatedAt`: DateTime
- Ràng buộc duy nhất: `UNIQUE(userId, idempotencyKey)`

### 7. Bảng `OrderItem`
- `id`: String (UUID, Khóa chính)
- `orderId`: String (Khóa ngoại tham chiếu `Order.id`)
- `productId`: String (Khóa ngoại tham chiếu `Product.id`)
- `size`: Enum (`S`, `M`, `L`)
- `ice`: String? (Mức đá: 100%, 70%, 50%, Không đá)
- `sugar`: String? (Mức đường: Chuẩn ngọt, 70%, 50%, Không đường)
- `quantity`: Int (Số lượng mua: 1–20)
- `priceAtPurchase`: Decimal (Đơn giá ly tại thời điểm mua)
- `lineTotal`: Decimal (Tổng tiền của dòng sản phẩm)

### 8. Bảng `OrderItemTopping`
- `id`: String (UUID, Khóa chính)
- `orderItemId`: String (Khóa ngoại tham chiếu `OrderItem.id`)
- `toppingId`: String (Khóa ngoại tham chiếu `Topping.id`)
- `toppingName`: String (Snapshot lưu tên topping tại thời điểm mua)
- `toppingPrice`: Decimal (Snapshot lưu giá topping tại thời điểm mua)

### 9. Bảng `Payment`
- `id`: String (UUID, Khóa chính)
- `orderId`: String (Khóa ngoại tham chiếu `Order.id`)
- `idempotencyKey`: String (Unique, Chống thanh toán lặp)
- `amount`: Decimal (Số tiền thanh toán)
- `method`: Enum (`WALLET`, `CARD`)
- `status`: Enum (`SUCCESS`, `FAILURE`)
- `createdAt`: DateTime

---

## 8. DANH SÁCH API VÀ ENDPOINTS

### API công khai (Public - Không yêu cầu Token)

| Method | Endpoint | Mục đích | Body Request | Phản hồi (Data) |
|:---:|:---|:---|:---|:---|
| `GET` | `/api/v1/products` | Lấy danh sách menu đồ uống | Không | `Product[]` (id, name, price, imageUrl, stock) |
| `GET` | `/api/v1/products/:id` | Chi tiết món & danh sách topping | Không | `Product` kèm `toppings: Topping[]` |
| `POST` | `/api/v1/auth/register` | Đăng ký tài khoản mới | `{ email, password, confirmPassword }` | `{ id, email, accessToken }` (201 Created) |
| `POST` | `/api/v1/auth/login` | Đăng nhập tài khoản | `{ email, password }` | `{ id, email, accessToken }` (200 OK) |
| `POST` | `/api/v1/vouchers/validate` | Kiểm tra tính hợp lệ của mã giảm giá | `{ code, total }` | `{ valid, discountAmount, finalTotal }` |

### API bảo vệ (Protected - Yêu cầu Header `Authorization: Bearer <token>`)

| Method | Endpoint | Header bổ sung | Mục đích | Body Request |
|:---:|:---|:---|:---|:---|
| `GET` | `/api/v1/auth/me` | — | Lấy thông tin tài khoản hiện tại | Không |
| `POST` | `/api/v1/auth/logout` | — | Đăng xuất người dùng | Không |
| `POST` | `/api/v1/orders` | `Idempotency-Key: <UUID>` | Tạo đơn hàng mới (`PENDING`), trừ kho | `{ items: [{ productId, size, toppingIds, quantity }], voucherCode? }` |
| `POST` | `/api/v1/payments` | `Idempotency-Key: <UUID>` | Thanh toán đơn hàng qua Mock Gateway | `{ orderId, amount, method }` |
| `PATCH`| `/api/v1/orders/:id/cancel`| — | Hủy đơn hàng và hoàn tồn kho | Không |
| `GET` | `/api/v1/orders/:id` | — | Xem chi tiết đơn hàng (hỗ trợ polling) | Không |
| `GET` | `/api/v1/orders/me` | — | Xem lịch sử danh sách đơn của người dùng | Không |

---

## 9. YÊU CẦU PHI CHỨC NĂNG

* **Bảo mật:** Mật khẩu lưu trữ bắt buộc băm bằng `bcrypt` (10 salt rounds). JWT Token được ký bằng secret key bảo mật với thời hạn 24 giờ. Tuyệt đối không để lộ mật khẩu trong token hay phản hồi API.
* **Toàn vẹn dữ liệu (ACID Transaction):** Toàn bộ chuỗi thao tác tạo đơn, trừ kho, lưu chi tiết món, trừ voucher và thanh toán phải chạy trong Database Transaction. Nếu có bất kỳ lỗi nào, transaction phải tự động rollback toàn bộ.
* **Thời gian phản hồi:** Tốc độ phản hồi API trung bình dưới 500ms đối với dữ liệu mẫu trong môi trường thử nghiệm.
* **Giao diện người dùng (UI/UX):**
  - Đảm bảo tương thích Responsive từ màn hình điện thoại (320px) đến máy tính để bàn (1920px), không bị vỡ giao diện hay xuất hiện thanh cuộn ngang.
  - Tối ưu hóa trải nghiệm với Skeleton Loader khi tải dữ liệu và hiển thị thông báo lỗi rõ ràng.

---

## 10. TIÊU CHÍ CHẤP NHẬN & KIỂM THỬ (ACCEPTANCE CRITERIA)

Dự án hoàn thành đầy đủ khi đáp ứng toàn bộ các tiêu chí nghiệm thu sau:

1. **Menu & Chi tiết (Task 2, 3, 4):**
   - Hiển thị danh sách $\ge 10$ món có đủ ảnh, tên, giá cơ sở.
   - Chọn size (S/M/L) và topping phản ánh đúng giá tức thì ở giao diện. Hết hàng thì vô hiệu hóa nút thêm vào giỏ.
2. **Giỏ hàng (Task 5):**
   - Thêm món tự cộng dồn khi trùng tùy chọn. Tự động tính tổng tiền. Giữ trạng thái khi F5 tải lại trang.
3. **Xác thực JWT (Task 7):**
   - Đăng ký và đăng nhập thành công với mật khẩu $\ge 6$ ký tự.
   - Đăng nhập/đăng ký từ luồng mua hàng tự động chuyển hướng vào thẳng trang Checkout.
4. **Tạo đơn & Thanh toán (Task 6, 8):**
   - Áp mã `BREWLITE10` và `WELCOME20` giảm đúng số tiền.
   - Tạo đơn trạng thái `PENDING`. Thanh toán thành công chuyển sang `PAID`, xóa giỏ hàng và tích lũy điểm thưởng. Thanh toán thất bại cho phép thử lại hoặc hủy đơn.
5. **Lịch sử đơn (Task 9):**
   - Trang `/orders/me` hiển thị đúng danh sách đơn hàng đã đặt. Polling mỗi 5 giây cập nhật trạng thái đơn chi tiết.
6. **Bộ ba tiêu chí kiểm thử bắt buộc Backend (Task 10):**
   - **(a) Unit Test State Machine:** Chứng minh hàm `assertTransition` chặn đứng mọi trường hợp chuyển trạng thái không hợp lệ.
   - **(b) Integration Test Idempotency:** Chứng minh việc gửi 2 request liên tiếp có cùng `Idempotency-Key` chỉ tạo ra đúng 1 đơn hàng và 1 giao dịch thanh toán duy nhất.
   - **(c) Concurrency Test Optimistic Locking:** Chứng minh khi nhiều khách hàng cùng đặt sản phẩm có số lượng tồn kho có hạn, hệ thống không bao giờ bán vượt quá số lượng tồn kho thực tế (`overselling`).

---

## 11. MÔI TRƯỜNG PHÁT TRIỂN & CÔNG NGHỆ

* **Backend:** NestJS 11+, TypeScript, Prisma ORM 6.19.3, PostgreSQL 16.
* **Frontend:** Next.js 15 (App Router), React 19, TailwindCSS v4, Zustand.
* **HTTP Client:** Axios với Request/Response Interceptor tự động quản lý Bearer Token.
* **Kiểm thử:** Vitest / Jest cho Unit Test và Integration Test.
* **Môi trường:** Docker Compose quản lý cơ sở dữ liệu PostgreSQL.

---

## 12. ĐỊNH NGHĨA HOÀN THÀNH (DEFINITION OF DONE - DOD)

Một Task được nghiệm thu khi đạt các tiêu chuẩn sau (theo quy định đề bài của Giảng viên):
1. Mã nguồn biên dịch không có lỗi (`tsc --noEmit`, `nest build`, `next build` thành công 100%).
2. Tuân thủ tiêu chí chấp nhận riêng của từng Task.
3. Có lịch sử commit Git rõ ràng, phân nhánh theo quy chuẩn.
4. Đầu vào API được validate chặt chẽ bằng `class-validator`, Frontend xử lý đầy đủ các trạng thái Loading / Empty / Error.
5. Có tài liệu hướng dẫn cài đặt và chạy ứng dụng trong file `README.md`.
6. Riêng Task 10: Có kịch bản test tự động chứng minh (a), (b), (c) chạy thành công.

---

## 13. KỊCH BẢN BÀN GIAO & DEMO NGHIỆM THU

Buổi nghiệm thu kết thúc Sprint trình diễn luồng nghiệp vụ khép kín (End-to-End Happy Path):
$$\text{Mở web} \longrightarrow \text{Xem Menu} \longrightarrow \text{Chọn món (Size, Topping)} \longrightarrow \text{Vào Giỏ hàng} \longrightarrow \text{Đăng nhập / Đăng ký}$$
$$\longrightarrow \text{Vào Checkout} \longrightarrow \text{Nhập Voucher} \longrightarrow \text{Thanh toán Mock} \longrightarrow \text{Xem Xác nhận đơn} \longrightarrow \text{Xem Lịch sử đơn}$$

---

## 14. GHI CHÚ TÍNH NĂNG TÙY CHỌN

### ⚙️ Scheduled Job Tự Động Hủy Đơn Quá Hạn (Optional)
* **Mô tả:** Sử dụng `@nestjs/schedule` để định kỳ mỗi 15 phút quét các đơn hàng ở trạng thái `PENDING` hoặc `PAYMENT_FAILED` được tạo quá 15 phút trước đó.
* **Xử lý:** Tự động gọi `assertTransition(→ CANCELLED)`, hoàn lại số lượng tồn kho `stock` và hoàn lại lượt dùng của mã voucher.
* **Đánh giá:** Đây là tính năng mở rộng kỹ thuật (không ảnh hưởng điểm số nếu chưa kịp triển khai trong thời hạn).

### ⚙️ Hỗ trợ chuyển tiếp `PAID → CANCELLED` ở Backend (Bắt buộc)
* Dù giao diện hủy đơn sau thanh toán không mở cho người dùng cuối trên Web MVP, logic chuyển tiếp `PAID → CANCELLED` **bắt buộc phải được giữ lại trong hàm `assertTransition` của Backend** để vượt qua các bài kiểm thử tự động của Giảng viên và phục vụ trường hợp rollback.
