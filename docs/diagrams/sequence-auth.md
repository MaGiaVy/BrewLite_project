# Tài Liệu Biểu Đồ Trình Tự Xác Thực & Quản Lý Hồ Sơ (Auth Sequence Diagram)

Tài liệu này mô tả chi tiết kiến trúc luồng dữ liệu và trình tự xử lý (Sequence Diagram) cho module Xác thực (`apps/api/src/auth/`) của hệ thống **BrewLite**. Biểu đồ nguồn tương ứng được lưu tại [`sequence-auth.puml`](sequence-auth.puml).

---

## 1. Tổng Quan Kiến Trúc & Các Thành Phần Tham Gia

Module Xác thực của BrewLite được xây dựng trên nền tảng **NestJS**, tích hợp **Passport.js JWT Strategy**, thư viện **bcrypt** (10 rounds muối) để băm mật khẩu, và **Prisma ORM** kết nối **PostgreSQL**.

### Các Thành Phần (Participants):
1. **Khách Hàng / User**: Người dùng tương tác trên giao diện Web / Thiết bị di động.
2. **Web / Mobile Client**: Ứng dụng Next.js / React 19 SPA quản lý trạng thái phiên làm việc (Zustand Store + Cookie / LocalStorage).
3. **JwtAuthGuard / Passport Strategy**: Middleware bảo vệ các route yêu cầu định danh người dùng qua Header `Authorization: Bearer <accessToken>`.
4. **AuthController**: Tiếp nhận và điều hướng các HTTP requests (`/auth/register`, `/auth/login`, `/auth/profile`, `/auth/me`).
5. **AuthService**: Thực thi logic nghiệp vụ xác thực, kiểm tra xung đột tài khoản, băm/so khớp mật khẩu và sinh mã định danh JWT.
6. **bcrypt Library**: Thực hiện thuật toán mã hóa mật khẩu an toàn (`bcrypt.hash` với `SALT_ROUNDS = 10`, `bcrypt.compare`).
7. **JwtService**: Ký (`sign`) và giải mã (`verify`) mã truy cập JWT với thời hạn hết hạn được cấu hình chuẩn là **7 ngày** (`expiresIn: '7d'`).
8. **PostgreSQL DB (Prisma ORM)**: Lưu trữ bảng `User` chứa thông tin cá nhân, `passwordHash`, `role` (`CUSTOMER`, `STAFF`, `ADMIN`), `isActive`, `loyaltyPoints`.

---

## 2. Chi Tiết Các Luồng Nghiệp Vụ

### 2.1. Luồng 1: Đăng Ký Tài Khoản Mới (`POST /auth/register`)

- **Endpoint**: `POST /auth/register`
- **Body (`RegisterDto`)**:
  - `email` (string, định dạng Email hợp lệ, bắt buộc)
  - `password` (string, tối thiểu 6 ký tự, bắt buộc)
  - `fullName` (string, không rỗng, bắt buộc)
  - `phone` (string, tùy chọn / optional)
- **Quy trình xử lý thực tế trong mã nguồn**:
  1. `AuthController` nhận request và validate dữ liệu thông qua `ValidationPipe`.
  2. `AuthService.register()` kiểm tra tính duy nhất của email:
     ```ts
     const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
     if (existing) throw new ConflictException('Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.');
     ```
  3. Băm mật khẩu bằng bcrypt với muối 10 vòng:
     ```ts
     const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS); // SALT_ROUNDS = 10
     ```
  4. Tạo bản ghi người dùng mới với vai trò mặc định là `CUSTOMER` và `loyaltyPoints = 0`:
     ```ts
     const user = await this.prisma.user.create({
       data: { email: dto.email, passwordHash, fullName: dto.fullName, phone: dto.phone ?? null, role: Role.CUSTOMER }
     });
     ```
  5. Ký mã xác thực JWT:
     ```ts
     const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
     const accessToken = this.jwtService.sign(payload); // Thời hạn 7 ngày
     ```
  6. Trả về HTTP `201 Created` kèm token và thông tin an toàn (loại bỏ trường `passwordHash` thông qua helper `safeUser`).

---

### 2.2. Luồng 2: Đăng Nhập Hệ Thống (`POST /auth/login`)

- **Endpoint**: `POST /auth/login` (Trả về HTTP `200 OK`)
- **Body (`LoginDto`)**:
  - `email` (string, bắt buộc)
  - `password` (string, bắt buộc)
- **Quy trình xử lý thực tế trong mã nguồn**:
  1. `AuthService.login()` tra cứu người dùng theo email trong DB.
  2. Nếu không tìm thấy người dùng -> ném `UnauthorizedException(401)`.
  3. So khớp mật khẩu đã băm:
     ```ts
     const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
     if (!passwordMatch) throw new UnauthorizedException('Email hoặc mật khẩu không chính xác. Vui lòng thử lại.');
     ```
  4. Kiểm tra trạng thái hoạt động của tài khoản:
     ```ts
     if (user.isActive === false) {
       throw new UnauthorizedException('Tài khoản này hiện đang bị tạm khóa. Vui lòng liên hệ Quản lý cửa hàng.');
     }
     ```
  5. Nếu tài khoản hợp lệ, ký JWT mang payload `{ sub: user.id, email: user.email, role: user.role }` với thời hạn **7 ngày**.
  6. Phản hồi HTTP `200 OK` chứa `{ accessToken, user }`. Frontend lưu token vào Zustand Auth Store và LocalStorage.

---

### 2.3. Luồng 3: Cập Nhật Hồ Sơ & Đổi Mật Khẩu (`PATCH /auth/profile`)

- **Endpoint**: `PATCH /auth/profile`
- **Header**: `Authorization: Bearer <accessToken>`
- **Body (`UpdateProfileDto`)**:
  - `fullName` (string, tùy chọn)
  - `phone` (string, tùy chọn)
  - `currentPassword` (string, tùy chọn, bắt buộc nếu có `newPassword`)
  - `newPassword` (string, tối thiểu 6 ký tự, tùy chọn)
- **Quy trình xử lý thực tế trong mã nguồn**:
  1. `JwtAuthGuard` chặn và xác thực token JWT. Giải mã và đính kèm `req.user = { userId, email }`. Nếu token hết hạn hoặc sai chữ ký, trả ngay `401 Unauthorized`.
  2. `AuthService.updateProfile()` kiểm tra sự tồn tại của `userId` trong DB (ném `404 NotFoundException` nếu không tồn tại).
  3. **Xác thực bảo mật khi đổi mật khẩu**:
     - Nếu client gửi `newPassword`:
       - Bắt buộc phải có `currentPassword`. Nếu thiếu -> ném `BadRequestException('Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới')`.
       - Dùng `bcrypt.compare(dto.currentPassword, user.passwordHash)` để đối soát mật khẩu cũ.
       - Nếu không khớp -> ném `BadRequestException('Mật khẩu hiện tại không chính xác')`.
       - Nếu khớp -> băm mật khẩu mới: `newPasswordHash = await bcrypt.hash(dto.newPassword, 10)`.
  4. Thực hiện cập nhật dữ liệu vào bảng `User`:
     ```ts
     return this.prisma.user.update({
       where: { id: userId },
       data: {
         fullName: dto.fullName?.trim(),
         phone: dto.phone?.trim(),
         passwordHash: newPasswordHash,
       },
       select: {
         id: true, email: true, fullName: true, phone: true,
         role: true, isActive: true, loyaltyPoints: true, createdAt: true
       }
     });
     ```
  5. Trả về thông tin hồ sơ đã cập nhật. Frontend đồng bộ lại state người dùng.

---

## 3. Bảng Mã Lỗi & HTTP Status Code Chuẩn

| Mã Lỗi | Tình Huống Kích Hoạt | Chi Tiết Thông Điệp Backend |
| :--- | :--- | :--- |
| **`400 Bad Request`** | Thiếu mật khẩu hiện tại khi đổi mật khẩu | *"Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới"* |
| **`400 Bad Request`** | Mật khẩu hiện tại không chính xác | *"Mật khẩu hiện tại không chính xác"* |
| **`400 Bad Request`** | Sai định dạng DTO (email sai cú pháp, mật khẩu < 6 ký tự) | Thông báo lỗi từ `class-validator` |
| **`401 Unauthorized`** | Email hoặc mật khẩu sai khi đăng nhập | *"Email hoặc mật khẩu không chính xác. Vui lòng thử lại."* |
| **`401 Unauthorized`** | Tài khoản bị tạm khóa (`isActive = false`) | *"Tài khoản này hiện đang bị tạm khóa. Vui lòng liên hệ Quản lý cửa hàng."* |
| **`401 Unauthorized`** | Token JWT không hợp lệ hoặc đã quá hạn 7 ngày | *"Unauthorized"* |
| **`404 Not Found`** | Không tìm thấy ID người dùng khi cập nhật hồ sơ | *"User không tồn tại"* |
| **`409 Conflict`** | Email đã được người khác đăng ký trước đó | *"Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác."* |
