# ĐẶC TẢ SƠ ĐỒ TUẦN TỰ: ĐĂNG KÝ VÀ ĐĂNG NHẬP PHÂN QUYỀN (RBAC)
## HỆ THỐNG BREWLITE SPECIALTY COFFEE PLATFORM

> **Học phần:** Công nghệ Phần mềm — Giảng viên: **ThS. Từ Lãng Phiêu**  
> **Sinh viên thực hiện:** Mã Gia Vỹ — MSSV: **3124410414**  
> **Tạo phẩm:** [`sequence-auth.puml`](sequence-auth.puml) | [`sequence-auth.svg`](sequence-auth.svg) | [`sequence-auth.png`](sequence-auth.png)  
> **Mã ca sử dụng liên kết:** `UC10` (Đăng ký tài khoản), `UC11` (Đăng nhập hệ thống), `UC11a` (Điều hướng phân quyền RBAC)

---

## 📌 1. MỤC TIÊU VÀ ĐỐI CHIẾU NÂNG CẤP

Sơ đồ tuần tự này được chuẩn hóa và nâng cấp toàn diện từ sơ đồ gốc (`seq3_Dang_Ky_Dang_Nhap (1).png`) để khớp chính xác 100% với mã nguồn hiện thực thực tế của BrewLite (NestJS + Next.js App Router):

| Tiêu chí | Sơ đồ cũ (`seq3_Dang_Ky_Dang_Nhap.png`) | Sơ đồ nâng cấp mới (`sequence-auth.puml`) | Lý do kỹ thuật |
| :--- | :--- | :--- | :--- |
| **Actor thực hiện** | Cố định là `Khách hàng` | Tổng quát là `Người dùng / Khách truy cập (User / Guest)` | Cả Khách hàng, Barista và Quản trị viên đều đi qua cổng xác thực này. |
| **Dữ liệu đăng ký** | Chỉ có `email, mật khẩu` | `fullName, email, phone, password, confirmPassword` | Khớp 100% với `RegisterDto` (NestJS) và Form đăng ký `LoginClient.tsx` (Next.js). |
| **Độ an toàn mật khẩu** | Mô tả chung chung | `bcrypt.hash(password, SALT_ROUNDS=10)` | Khớp implementation bảo mật trong `auth.service.ts`. |
| **Bảo mật đăng nhập (OWASP)** | Trả lỗi chung cho email/pass sai | Giữ nguyên nguyên tắc bảo mật OWASP: trả lỗi đồng nhất `401 Unauthorized` | Chống tấn công rà quét tài khoản (User Enumeration). |
| **Điều hướng sau đăng nhập** | Cố định: chuyển thẳng sang `/checkout` | **Điều hướng phân quyền tự động (RBAC):**<br>• `ADMIN` $\rightarrow$ `/admin`<br>• `STAFF` $\rightarrow$ `/staff`<br>• `CUSTOMER` $\rightarrow$ `/checkout` (nếu đang dở đơn) hoặc `/menu` | Phù hợp với kiến trúc phân quyền đa người dùng trong hệ thống thực tế. |

---

## 🏛️ 2. CÁC ĐỐI TƯỢNG VÀ LIFELINES TRONG SƠ ĐỒ

1. **`User` (Actor - `Người dùng / Khách truy cập`):** Khách vãng lai, khách quen, nhân viên hoặc quản trị viên tương tác trực tiếp với giao diện.
2. **`UI` (Boundary - `Giao diện Xác thực / Next.js Client & Zustand AuthStore`):** Màn hình `/login`, chịu trách nhiệm validate phía client, gọi API, lưu trữ token an toàn và điều hướng.
3. **`Controller` (Control - `AuthController / NestJS REST API`):** Tiếp nhận HTTP request, kích hoạt `ValidationPipe` kiểm tra DTO.
4. **`Service` (Control - `AuthService / Bcrypt & JwtService`):** Xử lý nghiệp vụ mã hóa mật khẩu, kiểm tra tồn tại, tạo chữ ký số JWT có hạn 24 giờ.
5. **`DB` (Database - `PostgreSQL / Prisma ORM`):** Tầng cơ sở dữ liệu lưu trữ bảng `User` và mã hash an toàn.

---

## 🔄 3. DIỄN BIẾN LUỒNG NGHIỆP VỤ CHI TIẾT (49 BƯỚC)

### Phân đoạn 1: Đăng ký tài khoản khách hàng (Register)
* **Bước 1 – 3:** Người dùng nhập các trường thông tin. Giao diện validate kiểm tra rỗng và so khớp mật khẩu xác nhận. Nếu sai, hiển thị lỗi ngay tại client mà không gửi request lên server (tiết kiệm băng thông).
* **Bước 4 – 7:** Gửi `POST /auth/register`. NestJS `ValidationPipe` kiểm tra `RegisterDto`. Nếu email không đúng chuẩn RFC hoặc mật khẩu < 6 ký tự, trả về `400 Bad Request`.
* **Bước 8 – 13:** Service tìm kiếm email trong Database. Nếu đã tồn tại, ném `ConflictException(409)` thông báo email đã được đăng ký.
* **Bước 14 – 16:** Nếu email hợp lệ, Service mã hóa mật khẩu với `bcrypt` (10 rounds) và lưu vào Database với vai trò mặc định `CUSTOMER`, điểm tích lũy ban đầu `loyaltyPoints: 0`.
* **Bước 17 – 20:** Service tạo JWT Token chứa thông tin vai trò `role: 'CUSTOMER'` (hạn 24 giờ), trả về client. Client lưu token vào `LocalStorage` và cập nhật Zustand `authStore`.
* **Bước 21 – 22:** Giao diện tự động điều hướng: Nếu khách hàng đang dở luồng đặt hàng, chuyển thẳng đến `/checkout`; nếu đăng ký bình thường, chuyển sang `/menu`.

### Phân đoạn 2: Đăng nhập & Điều hướng Phân quyền (Login & RBAC Routing)
* **Bước 23 – 28:** Người dùng nhập email và mật khẩu. Gửi `POST /auth/login`. Server validate định dạng đầu vào.
* **Bước 29 – 32:** Service tìm kiếm User theo email. Nếu không tồn tại, trả về `401 Unauthorized` với thông điệp *"Email hoặc mật khẩu không chính xác"*.
* **Bước 33 – 38:** Nếu email tồn tại, so sánh mật khẩu qua `bcrypt.compare`. Nếu sai, trả về lỗi `401` tương tự. Nếu khớp 100%, tạo JWT Token mang `role` của người dùng.
* **Bước 39 – 41:** Controller trả về `200 OK` kèm `accessToken` và hồ sơ an toàn `safeUser`. Giao diện cập nhật `authStore`.
* **Bước 42 – 49 (Điều hướng phân quyền tự động):**
  * `ADMIN`: Chuyển hướng đến `/admin` (Cổng Quản trị Thực đơn, Công thức BOM và Kho nguyên liệu).
  * `STAFF`: Chuyển hướng đến `/staff` (Màn hình KDS điều phối pha chế đơn hàng).
  * `CUSTOMER`:
    * Có giỏ hàng chờ thanh toán (`redirect = '/checkout'`): Chuyển thẳng sang `/checkout`.
    * Đăng nhập thông thường: Chuyển hướng sang `/menu`.

---

## 🖼️ 4. HÌNH ẢNH SƠ ĐỒ TUẦN TỰ (PREVIEW)

![Sơ đồ Tuần tự Đăng ký & Đăng nhập Phân quyền](sequence-auth.png)
