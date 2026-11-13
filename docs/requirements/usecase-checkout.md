# 📋 BẢNG ĐẶC TẢ CHI TIẾT USE-CASE: PHÂN HỆ ĐẶT HÀNG & THANH TOÁN
## HỆ THỐNG BREWLITE — 100% CASHLESS SPECIALTY COFFEE ROASTERY

> **Tài liệu:** `docs/requirements/usecase-checkout.md`  
> **Học phần:** Công nghệ Phần mềm (Software Engineering) — Assignment 2 (Task 1.3)  
> **Đơn vị đào tạo:** Khoa Công nghệ Thông tin, Trường Đại học Sài Gòn (SGU)  
> **Nhóm thực hiện:** Nhóm BrewLite (6 thành viên)  
> **Sơ đồ liên kết:** [`checkout-use-case.svg`](../diagrams/checkout-use-case.svg) | [`checkout-use-case.png`](../diagrams/checkout-use-case.png)  
> **Trạng thái:** Chuẩn hóa tách biệt 2 nghiệp vụ Tạo đơn hàng & Thanh toán (Approved)

---

## 📌 1. BẢNG TỔNG QUAN PHÂN RÃ USE-CASE TRONG PHÂN HỆ

| Mã Use-case | Tên Use-case | Loại | Tác nhân chính | Tác nhân hỗ trợ | Mô tả tóm tắt |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **`UC-07a`** | **Tạo đơn hàng (Đặt hàng)** | Trung tâm | Khách hàng | Cơ sở dữ liệu PostgreSQL | Tiếp nhận giỏ món, áp mã giảm giá, kiểm tra định mức BOM, khóa lạc quan tạo đơn `PENDING`. |
| **`UC-07b`** | **Thanh toán đơn hàng** | Nối tiếp | Khách hàng | Cổng thanh toán (ZaloPay/Mock) | Quét QR Code/xác nhận thẻ, trừ tiền đối soát, chuyển `PAID`, trừ kho dứt điểm và tích điểm Loyalty. |
| **`UC-07.1`** | **Xác thực đăng nhập (JWT)** | `<<include>>` | Khách hàng | Backend API | Kiểm tra và cấp JWT Bearer Token trước khi cho phép tạo đơn. |
| **`UC-07.2`** | **Kiểm tra tồn kho BOM & Khóa Optimistic** | `<<include>>` | Hệ thống | PostgreSQL | Thẩm định tồn kho BOM và khóa phiên bản (`version = version + 1`) chống xung đột (409). |
| **`UC-07.3`** | **Áp dụng mã giảm giá (Voucher)** | `<<extend>>` | Khách hàng | Backend API | Kiểm tra điều kiện đơn tối thiểu, trần giảm giá và chiết khấu trực tiếp vào đơn hàng. |
| **`UC-07.4`** | **Xử lý thanh toán trực tuyến** | `<<include>>` | Hệ thống | Cổng ZaloPay / Mock | Tạo giao dịch, sinh QR Code và nhận Webhook IPN Callback đối soát HMAC. |
| **`UC-07.5`** | **Tích lũy điểm Loyalty** | `<<include>>` | Hệ thống | PostgreSQL | Tự động cộng điểm Hạt Vàng vào tài khoản User theo tỷ lệ: 1.000đ = 1 điểm. |
| **`UC-07.6`** | **Thanh toán lại khi lỗi (Retry)** | `<<extend>>` | Khách hàng | Cổng ZaloPay / Mock | Đổi phương thức hoặc gửi lại yêu cầu thanh toán khi đơn ở trạng thái `PAYMENT_FAILED`. |
| **`UC-07.7`** | **Hủy đơn hàng (Grace Period / Hết hạn)** | `<<extend>>` | Khách hàng | PostgreSQL | Hủy đơn trong thời gian ân hạn 5 phút hoặc tự động hủy sau 15 phút, hoàn kho 100% BOM. |

---

## ☕ 2. ĐẶC TẢ CHI TIẾT USE-CASE 1: TẠO ĐƠN HÀNG (`UC-07a`)

| Mục đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Tên Use-case** | **Tạo đơn hàng / Đặt hàng (Create Order)** |
| **Mã Use-case** | `UC-07a` |
| **Tác nhân** | • **Khách hàng (Primary Actor):** Người bấm nút tiến hành đặt đơn.<br>• **Cơ sở dữ liệu PostgreSQL (Supporting System):** Thẩm định giá và kiểm tra tồn kho BOM. |
| **Sự kiện kích hoạt** | Khách hàng nhấn nút **"Tiến hành đặt hàng"** từ màn hình Giỏ hàng (`/cart`). |
| **Tiền điều kiện** | 1. Giỏ hàng có ít nhất một sản phẩm (`cart.items.length > 0`).<br>2. Khách hàng đã đăng nhập tài khoản sở hữu JWT Bearer hợp lệ (nếu chưa, hệ thống tự động redirect sang `/auth/login` và bảo lưu giỏ hàng). |
| **Hậu điều kiện** | • **Thành công:** Tạo bản ghi `Order` ở trạng thái `PENDING`, trừ kho tạm thời (giữ chỗ BOM) trong bảng `Ingredient` (`version = version + 1`), đếm ngược giữ kho 15 phút, kích hoạt chuyển tiếp sang Use-case `Thanh toán đơn hàng`.<br>• **Thất bại:** Rollback Transaction, trả về `409 Conflict` (nếu thiếu nguyên liệu BOM) hoặc `401 Unauthorized` (nếu hết hạn đăng nhập), giữ nguyên giỏ hàng. |
| **Luồng sự kiện chính (Normal Flow)** | **1.** Khách hàng bấm "Tiến hành đặt hàng" từ trang Giỏ hàng.<br>**2.** Hệ thống kiểm tra phiên đăng nhập (`<<include>> Xác thực đăng nhập`).<br>**3.** Khách hàng xem lại danh sách món (size, topping, đường/đá), áp dụng mã Voucher nếu có (`<<extend>> Áp dụng mã giảm giá`).<br>**4.** Khách hàng chọn phương thức thanh toán và nhấn "Xác nhận & Thanh toán".<br>**5.** Frontend sinh khóa duy nhất `Idempotency-Key` (UUIDv4) chống gửi lặp và gửi `POST /orders` kèm JWT.<br>**6.** Backend mở Database Transaction Pha 1: khóa hàng User (`SELECT ... FOR UPDATE`), kiểm tra giới hạn $\le 5$ đơn PENDING.<br>**7.** Backend tính toán định lượng nguyên liệu BOM (`computeRequiredIngredients`) và thực thi Optimistic Locking kiểm tra tồn kho (`<<include>> Kiểm tra tồn kho BOM & Khóa Optimistic`).<br>**8.** Hệ thống trừ tồn kho tạm thời, tạo Order trạng thái `PENDING`, commit Transaction Pha 1 và tự động kích hoạt `<<include>> Thanh toán đơn hàng`. |
| **Luồng thay thế / Ngoại lệ** | • **A1. Áp dụng Voucher thành công:** Khách nhập mã hợp lệ, hệ thống giảm trừ trực tiếp vào tổng tiền thanh toán.<br>• **E1. Chưa đăng nhập (401):** Hệ thống lưu `redirect=/checkout`, chuyển sang `/auth/login`. Đăng nhập xong tự động quay lại `/checkout`.<br>• **E2. Hết nguyên liệu BOM / Xung đột version (409 Conflict):** Rollback Transaction, hiển thị thông báo món/nguyên liệu vừa hết, mở khóa nút bấm để khách chọn món khác.<br>• **E3. Trùng lặp khóa Idempotency (409/200):** Trả về bản ghi đơn hàng đã tạo trước đó, ngăn chặn tạo đơn trùng. |

---

## 💳 3. ĐẶC TẢ CHI TIẾT USE-CASE 2: THANH TOÁN ĐƠN HÀNG (`UC-07b`)

| Mục đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Tên Use-case** | **Thanh toán đơn hàng (Process Payment / Checkout)** |
| **Mã Use-case** | `UC-07b` |
| **Tác nhân** | • **Khách hàng (Primary Actor):** Quét mã QR ZaloPay hoặc xác nhận thẻ.<br>• **Cổng thanh toán điện tử (Supporting Actor):** ZaloPay Sandbox hoặc Mock Payment Gateway. |
| **Sự kiện kích hoạt** | Được gọi tự động qua quan hệ `<<include>>` từ `Tạo đơn hàng` hoặc khách hàng chủ động chọn "Thanh toán lại" trên đơn `PAYMENT_FAILED`. |
| **Tiền điều kiện** | Đơn hàng đã tồn tại trong cơ sở dữ liệu ở trạng thái `PENDING` hoặc `PAYMENT_FAILED` và còn trong thời hạn giữ kho 15 phút. |
| **Hậu điều kiện** | • **Thành công:** Đơn hàng chuyển sang trạng thái `PAID`, chốt dứt điểm trừ kho nguyên liệu BOM, tạo bản ghi `Payment` trạng thái `SUCCESS`, tích lũy điểm Loyalty Hạt Vàng vào tài khoản, giỏ hàng Client dọn sạch.<br>• **Thất bại:** Đơn hàng chuyển sang `PAYMENT_FAILED`, giữ nguyên kho BOM để khách đổi phương thức thử lại trong 15 phút. Nếu quá hạn 15 phút hoặc khách bấm Hủy, đơn chuyển sang `CANCELLED` và hoàn trả 100% kho BOM. |
| **Luồng sự kiện chính (Normal Flow)** | **1.** Hệ thống gửi yêu cầu tạo giao dịch sang Cổng thanh toán ZaloPay (`<<include>> Xử lý thanh toán trực tuyến`).<br>**2.** Cổng thanh toán sinh mã giao dịch (`appTransId`) và mã QR Code.<br>**3.** Frontend hiển thị mã QR Code ZaloPay, bộ đếm ngược 15 phút và khởi động Polling mỗi 3 giây (`GET /payments/zalopay/status`).<br>**4.** Khách hàng mở ứng dụng quét mã QR hoặc xác nhận thẻ mô phỏng.<br>**5.** Cổng thanh toán đối soát tài chính và gửi Webhook IPN Callback kèm chữ ký số HMAC-SHA256.<br>**6.** Backend xác thực chữ ký HMAC và mở Database Transaction Pha 2:<br>&nbsp;&nbsp;a. Chuyển trạng thái Order sang `PAID`.<br>&nbsp;&nbsp;b. Xác nhận dứt điểm trừ kho nguyên liệu BOM.<br>&nbsp;&nbsp;c. Tạo bản ghi `Payment` trạng thái `SUCCESS`.<br>&nbsp;&nbsp;d. Tự động cộng điểm Loyalty Hạt Vàng: **1.000đ = 1 điểm** (`<<include>> Tích lũy điểm Loyalty`).<br>&nbsp;&nbsp;e. Commit Transaction Pha 2, phản hồi `return_code = 1` cho ZaloPay.<br>**7.** Frontend Polling nhận diện `PAID` $ightarrow$ dọn sạch giỏ hàng trong store & localStorage $ightarrow$ điều hướng sang trang xác nhận đơn `/orders/:id`. |
| **Luồng thay thế / Ngoại lệ** | • **A1. Thanh toán thất bại và Thử lại (`<<extend>> Thanh toán lại khi lỗi`):** Cổng thanh toán từ chối, đơn chuyển `PAYMENT_FAILED`. Hệ thống không hoàn kho ngay mà giữ kho trong 15 phút để khách đổi phương thức hoặc bấm thử lại.<br>• **A2. Hủy đơn trong thời gian ân hạn 5 phút (`<<extend>> Hủy đơn hàng`):** Trong vòng 5 phút sau khi `PAID` và Barista chưa bấm chuyển `PREPARING`, khách hàng có thể hủy đơn $ightarrow$ hoàn 100% nguyên liệu BOM, thu hồi điểm Loyalty.<br>• **E1. Timeout quá 15 phút không thanh toán:** `ExpireOrdersJob` tự động quét mỗi phút, chuyển đơn `PENDING`/`PAYMENT_FAILED` sang `CANCELLED` và hoàn 100% nguyên liệu BOM về kho. |
