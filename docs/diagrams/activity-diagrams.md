# ĐẶC TẢ SƠ ĐỒ HOẠT ĐỘNG TOÀN TRÌNH (ACTIVITY DIAGRAM END-TO-END)
## BREWLITE: 100% CASHLESS SPECIALTY COFFEE ROASTERY

> **Tài liệu:** `docs/diagrams/activity-diagrams.md`  
> **Học phần:** Công nghệ Phần mềm (Software Engineering) — Assignment 2 (Task 2.1)  
> **Đơn vị đào tạo:** Khoa Công nghệ Thông tin, Trường Đại học Sài Gòn (SGU)  
> **Sinh viên thực hiện:** Mã Gia Vỹ (Task 2.1 — Activity Diagram)  
> **Nhóm thực hiện:** Nhóm BrewLite (6 thành viên)  
> **Phong cách thiết kế:** Monochrome UML 2.5 (Chuẩn đen trắng tối giản, Swimlane 5 phân làn, Decision hình thoi)  
> **Trạng thái:** Chuẩn hóa hợp nhất toàn trình theo mã nguồn thực tế (Approved)

---

## 📌 1. TỔNG QUAN SƠ ĐỒ HOẠT ĐỘNG TOÀN TRÌNH (TASK 2.1)

Nhằm mô hình hóa trọn vẹn hành vi động của hệ thống theo đúng hành trình khách hàng từ khi tiếp cận thực đơn đến khi nhận ly cà phê đặc sản tại quầy Bar Express, hệ thống BrewLite được chuẩn hóa thành **1 Sơ đồ Hoạt động Toàn trình (End-to-End Activity Diagram)** trải qua **5 làn bơi (Swimlanes)** và **6 giai đoạn nghiệp vụ liên tục**:

| STT | Giai Đoạn Nghiệp Vụ | Phân Làn Xử Lý Chính | Nội Dung & Điểm Nhấn Nghiệp Vụ |
| :---: | :--- | :--- | :--- |
| **1** | **Duyệt Thực Đơn** | Khách hàng $\rightarrow$ Web $\rightarrow$ API $\rightarrow$ PostgreSQL | Truy cập `/menu`, tải danh mục theo tab (Cà phê phin, Espresso, Trà, Bánh). |
| **2** | **Chọn Món & Tùy Biến** | Khách hàng $\leftrightarrow$ Web | Món hết kho hiện badge "Hết hàng" (khóa nút chọn món); Món còn hàng mở `ProductDetailModal` chọn **Size S/M/L**, tích **Topping**, chỉnh **Đá/Đường (0–100%)**; tính giá thời gian thực (**Dynamic Pricing**) và kiểm tra **Composite Key** `(productId-size-ice-sugar-toppings)` tránh trùng lặp. |
| **3** | **Quản Lý Giỏ Hàng** | Khách hàng $\leftrightarrow$ Web | Trang `/cart`: chỉnh số lượng (+/-), nhập mã giảm giá (**Voucher**), tự động tính lại Tạm tính & Tổng thanh toán. |
| **4** | **Đặt Đơn (Pha 1: PENDING & Giữ Kho BOM)** | Khách hàng $\rightarrow$ Web $\rightarrow$ API $\rightarrow$ PostgreSQL | Kiểm tra đăng nhập JWT (bảo lưu giỏ nếu cần login); sinh khóa chống gửi trùng `Idempotency-Key` (UUIDv4); Transaction Pha 1 thực thi Khóa lạc quan (**Optimistic Locking**) trừ tạm tồn kho BOM trong bảng `Ingredient` (`version = version + 1`). Nếu thiếu trả lỗi **HTTP 409 Conflict**; nếu đủ tạo đơn `PENDING`, kích hoạt đếm ngược 15 phút (900s). |
| **5** | **Thanh Toán (Pha 2: ZaloPay / Mock)** | Cổng ZaloPay $\leftrightarrow$ Khách $\leftrightarrow$ Web $\leftrightarrow$ API | ZaloPay sinh QR Code, Web polling mỗi 3s; Khách quét mã thanh toán. **Thành công:** Webhook HMAC xác thực $\rightarrow$ Transaction Pha 2 chuyển `PAID`, trừ kho dứt điểm, cộng điểm **Hạt Vàng** (1.000đ = 1đ), xóa giỏ hàng. **Thất bại:** ghi `PAYMENT_FAILED` nhưng giữ kho 15 phút cho khách thử lại. |
| **6** | **Theo Dõi Đơn & KDS Barista** | Khách hàng $\leftrightarrow$ Web $\leftrightarrow$ API (KDS) | Khách theo dõi thanh tiến trình 5 nấc; Barista bấm "Bắt đầu pha chế" (`PAID` $\rightarrow$ `PREPARING`) $\rightarrow$ bấm "Pha chế xong" (`PREPARING` $\rightarrow$ `READY`) $\rightarrow$ Khách tới Quầy Bar Express đọc mã đơn, nhận nước $\rightarrow$ chuyển đơn sang `COMPLETED`. |

---

## ☕ 2. HÌNH ẢNH SƠ ĐỒ HOẠT ĐỘNG TOÀN TRÌNH (VECTOR SVG)

![Activity Diagram End-to-End](activity-checkout.svg)

*Tệp mã nguồn PlantUML:* [`activity-checkout.puml`](activity-checkout.puml) | *Ảnh định dạng raster:* [`activity-checkout.png`](activity-checkout.png)

---

## 📋 3. THUYẾT MINH LUỒNG HOẠT ĐỘNG CHI TIẾT

### 3.1. Giai đoạn 1 & 2: Duyệt menu, Tùy biến món & Giỏ hàng
1. **Khách hàng** truy cập `/menu` $\rightarrow$ **Giao diện Web (Next.js)** hiển thị Skeleton loader và gọi `GET /products` sang **Backend API (NestJS)**.
2. **Backend API** truy vấn bảng `Product`, `Recipe`, `Ingredient` trong **PostgreSQL** và trả về danh sách sản phẩm khả dụng kèm cấu hình định giá.
3. Khi khách bấm chọn 1 món:
   - **Điều kiện `Sản phẩm còn hàng?`:**
     - *Hết hàng / Sold Out:* Frontend hiển thị badge "Hết hàng", làm mờ card và khóa nút chọn món. Kết thúc nhánh chọn món này.
     - *Còn hàng sẵn sàng:* Mở `ProductDetailModal` hiển thị lựa chọn kích cỡ và tùy chọn.
4. Khách hàng chọn Size (S, M, L), Topping (Kem muối biển, Thạch cà phê, Trân châu) và Mức đá (0–100%), Mức đường (0–100%) $\rightarrow$ Frontend tính giá động (Dynamic Pricing) theo thời gian thực:
   $$\text{Giá} = (\text{basePrice} + \text{sizeUpcharge} + \sum \text{toppingPrice}) \times \text{quantity}$$
5. Khi khách bấm "Thêm vào giỏ hàng":
   - **Điều kiện `Composite key đã có trong giỏ?` (`productId-size-ice-sugar-toppings`):**
     - *Đã có cùng tùy chọn:* Cộng dồn số lượng (`quantity = quantity + 1`).
     - *Chưa có trong giỏ:* Thêm dòng mục mới vào Zustand Cart Store.
6. Frontend lưu `localStorage`, cập nhật số lượng trên Cart Badge Header.

### 3.2. Giai đoạn 3 & 4: Giỏ hàng và Đặt đơn (Pha 1 - PENDING)
7. Khách vào trang `/cart`, kiểm tra danh sách món, chỉnh số lượng (+/-) hoặc áp dụng Voucher giảm giá $\rightarrow$ Web tính lại tiền $\rightarrow$ Khách nhấn "Tiến hành đặt hàng".
8. **Kiểm tra đăng nhập:**
   - *Chưa đăng nhập:* Lưu redirect `/checkout`, chuyển hướng `/auth/login`. Đăng nhập xong tự động quay lại `/checkout` với giỏ hàng nguyên vẹn.
   - *Đã có JWT hợp lệ:* Chuyển thẳng sang trang `/checkout`.
9. Khách chọn phương thức thanh toán và nhấn "Xác nhận & Thanh toán":
   - Web sinh `Idempotency-Key` (UUIDv4) chống gửi trùng lặp (double-click).
   - Gửi yêu cầu `POST /orders` kèm JWT Bearer.
10. **Backend API mở Database Transaction Pha 1 trong PostgreSQL:**
    - SELECT FOR UPDATE khóa hàng User, kiểm tra giới hạn $\le 5$ đơn chờ PENDING.
    - Thẩm định lại giá sản phẩm, size, topping và tính định mức BOM tiêu hao.
    - **Điều kiện `Đủ tồn kho BOM & Version hợp lệ?`:**
      - *Thiếu kho / Xung đột version (HTTP 409 Conflict):* Rollback Transaction Pha 1. Frontend mở khóa nút bấm, hiển thị Toast đỏ thông báo nguyên liệu vừa hết, giữ nguyên giỏ hàng để khách chọn lại.
      - *Đủ tồn kho nguyên liệu:* Thực thi Optimistic Locking trừ tồn kho tạm thời (giữ chỗ) trong bảng `Ingredient` (`version = version + 1`), tạo bản ghi `Order` với trạng thái ban đầu là `PENDING`. Commit Transaction Pha 1.
      - Kích hoạt đếm ngược thời gian giữ chỗ **15 phút (900 giây)**.
      - Gửi yêu cầu khởi tạo giao dịch sang **Cổng thanh toán (ZaloPay createOrder)**.

### 3.3. Giai đoạn 5: Xử lý thanh toán (Pha 2 - ZaloPay / Mock)
11. Cổng thanh toán ZaloPay sinh mã giao dịch và QR Code. Web hiển thị QR, đếm ngược 15 phút và khởi động Polling mỗi 3 giây (`GET /payments/zalopay/status`).
12. Khách hàng quét mã QR ZaloPay hoặc xác nhận thẻ $\rightarrow$ ZaloPay xử lý trừ tiền.
13. **Điều kiện `Kết quả xử lý thanh toán?`:**
    - **Thanh toán thành công:**
      - ZaloPay gửi Webhook IPN Callback kèm chữ ký số HMAC-SHA256 (Mac Key2).
      - Backend API xác thực chữ ký HMAC và mở **Database Transaction Pha 2**:
        - Chuyển trạng thái Order: `PENDING` / `PAYMENT_FAILED` $\rightarrow$ `PAID`.
        - Xác nhận dứt điểm trừ kho nguyên liệu BOM trong bảng `Ingredient`.
        - Tạo bản ghi `Payment` với trạng thái `SUCCESS` và lưu `idempotencyKey`.
        - Cộng dồn điểm thưởng **Hạt Vàng** vào tài khoản User: 1.000đ = 1 Hạt Vàng (`points = Math.floor(amount / 1000)`).
        - Commit Transaction Pha 2, phản hồi `return_code = 1` cho ZaloPay.
      - Frontend Polling nhận diện trạng thái `PAID` $\rightarrow$ Xóa sạch giỏ hàng trong Zustand Store & `localStorage` $\rightarrow$ Điều hướng sang `/orders/:id`.
    - **Thanh toán thất bại (`PAYMENT_FAILED`):**
      - Cập nhật Order sang `PAYMENT_FAILED`.
      - **Quy tắc Nghiệp vụ:** Hệ thống **KHÔNG lập tức hoàn kho**. Tồn kho BOM tiếp tục được giữ chỗ trong tổng thời hạn 15 phút để khách đổi phương thức hoặc thử lại.
      - Nếu khách thử lại: Gửi lại yêu cầu thanh toán cho đơn hàng hiện tại.
      - Nếu khách hủy hoặc quá hạn 15 phút: `ExpireOrdersJob` tự động hủy đơn (`CANCELLED`) và **hoàn trả 100% định mức nguyên liệu BOM** vào kho.

### 3.4. Giai đoạn 6: KDS Barista & Nhận nước tại Quầy Express
14. Khách hàng xem mã nhận nước tại Quầy Express và theo dõi thanh tiến trình 5 nấc trên trang `/orders/:id`.
15. Đơn hàng hiển thị trên Staff KDS (`/staff`). Barista bấm "Bắt đầu pha chế" $\rightarrow$ Backend cập nhật trạng thái `PAID` $\rightarrow$ `PREPARING`. Thanh tiến trình của khách cập nhật: **ĐANG PHA CHẾ**.
16. Barista hoàn tất pha chế theo công thức định mức BOM, bấm "Pha chế xong" $\rightarrow$ Backend cập nhật `PREPARING` $\rightarrow$ `READY`. Web hiển thị: **MÓN ĐÃ SẴN SÀNG** và phát thông báo nhận nước tại Quầy Express.
17. Khách hàng tới Quầy Bar Express đọc mã đơn đối soát $\rightarrow$ Nhận ly nước hoàn tất $\rightarrow$ Backend ghi nhận đơn chuyển sang `COMPLETED`. Khách hàng hoàn tất trọn vẹn phiên mua sắm.
