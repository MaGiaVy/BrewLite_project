# TÀI LIỆU CHI TIẾT NGHIỆP VỤ & LUỒNG THỰC THI TASK 7
## PHÂN HỆ XÁC THỰC NGƯỜI DÙNG (AUTHENTICATION & JWT)
> **Tài liệu:** `docs/TASK_7_BUSINESS_FLOW_CHI_TIET.md`  
> **Người phụ trách:** Mã Gia Vỹ (Assignee Task 7)  
> **Dự án:** BrewLite - 100% Cashless Specialty Coffee Roastery  
> **Mục đích:** Dành cho thành viên xem lại toàn bộ luồng code (Frontend & Backend), tự tin trả lời 100% câu hỏi vấn đáp của Giảng viên.

---

## 1. TỔNG QUAN KIẾN TRÚC PHÂN HỆ AUTH (TASK 7)

Phân hệ xác thực của BrewLite được thiết kế theo mô hình **Client-Server phân tầng chặt chẽ**:
* **Frontend (Next.js 16 Client Component):**
  * Giao diện: `frontend/app/auth/login/page.tsx` và `frontend/app/auth/register/page.tsx`.
  * Custom Hook: `frontend/hooks/useAuth.ts` (điều phối logic nghiệp vụ).
  * State Management: `frontend/stores/authStore.ts` (Zustand + LocalStorage).
  * API Layer: `frontend/api/auth.ts` và `frontend/api/client.ts` (Axios Interceptors).
* **Backend (NestJS + Prisma + PostgreSQL):**
  * Controller: `backend/src/auth/auth.controller.ts` (tiếp nhận HTTP Request).
  * Service: `backend/src/auth/auth.service.ts` (xử lý logic nghiệp vụ, hash mật khẩu, cấp JWT).
  * Validation: `backend/src/auth/dto/login.dto.ts` & `register.dto.ts` (Class-Validator).
  * Security: `backend/src/auth/strategies/jwt.strategy.ts` & `guards/jwt.guard.ts` (Passport JWT).

---

## 2. LUỒNG 1: KHI BẤM NÚT "ĐĂNG NHẬP" (LOGIN FLOW)

### 2.1. Sơ đồ chuỗi (Sequence Diagram)
```mermaid
sequenceDiagram
    autonumber
    actor User as Khách hàng
    participant Page as LoginForm (page.tsx)
    participant Hook as useAuth.ts
    participant Api as api/auth.ts
    participant Axios as client.ts (Axios)
    participant Ctrl as AuthController (NestJS)
    participant Svc as AuthService (NestJS)
    participant DB as PostgreSQL (Prisma)
    participant Store as authStore.ts (Zustand)

    User->>Page: Nhập Email, Password & Bấm "Đăng nhập"
    Page->>Page: handleSubmit() kiểm tra rỗng
    Page->>Hook: login(email, password)
    Hook->>Hook: setIsLoading(true)
    Hook->>Api: authApi.login({ email, password })
    Api->>Axios: POST /api/v1/auth/login
    Axios->>Ctrl: Gửi HTTP Request (Body JSON)
    Ctrl->>Svc: authService.login(loginDto)
    Svc->>Svc: validateUser(email, password)
    Svc->>DB: prisma.user.findUnique({ email })
    DB-->>Svc: Trả về thông tin User + passwordHash
    Svc->>Svc: bcrypt.compare(password, user.passwordHash)
    alt Sai mật khẩu hoặc không có User
        Svc-->>Ctrl: Ném UnauthorizedException (401)
        Ctrl-->>Page: Báo lỗi "Email hoặc mật khẩu không chính xác"
    else Đúng mật khẩu
        Svc->>Svc: generateJwtToken(user) -> jwtService.sign()
        Svc-->>Ctrl: Trả về { id, email, accessToken }
        Ctrl-->>Axios: HTTP 200 OK + JSON
        Axios-->>Api: response.data
        Api-->>Hook: { accessToken, id, email }
        Hook->>Store: storeLogin(accessToken, loggedUser)
        Store->>Store: Lưu accessToken vào localStorage & set isAuthenticated = true
        Hook-->>Page: Hoàn tất đăng nhập
        Page->>Page: router.push('/checkout' hoặc redirectPath)
    end
```

---

### 2.2. Chi tiết từng hàm được gọi từ Frontend đến Backend:

#### 👉 BƯỚC 1: Tại Giao diện Frontend (`frontend/app/auth/login/page.tsx`)
1. Khách hàng nhập `email`, `password` vào form và bấm nút **"Đăng nhập"**.
2. Form kích hoạt sự kiện: `onSubmit={handleSubmit}` (dòng 19).
3. Hàm `handleSubmit` thực hiện:
   * Xóa thông báo lỗi cũ: `setError('')`.
   * Kiểm tra cơ bản nếu email hoặc mật khẩu bị bỏ trống:
     ```typescript
     if (!email.trim()) { setError('Vui lòng nhập địa chỉ email'); return; }
     if (!password) { setError('Vui lòng nhập mật khẩu'); return; }
     ```
   * Gọi hàm `login(email, password)` từ custom hook `useAuth()`.

#### 👉 BƯỚC 2: Tại Custom Hook (`frontend/hooks/useAuth.ts`)
1. Hàm `login = useCallback(async (email, password) => { ... })` (dòng 21) bắt đầu chạy.
2. Bật cờ trạng thái đang tải: `setIsLoading(true)`.
3. Gọi tiếp hàm `authApi.login({ email, password })` từ tầng API.

#### 👉 BƯỚC 3: Tại API Client (`frontend/api/auth.ts` & `client.ts`)
1. Hàm `export const login = async (data: LoginRequest)` (dòng 44 trong `auth.ts`) được gọi.
2. Sử dụng Axios instance `client.post('/api/v1/auth/login', data)` gửi HTTP Request:
   * **Method:** `POST`
   * **URL:** `http://localhost:3001/api/v1/auth/login`
   * **Headers:** `Content-Type: application/json`
   * **Body JSON:** `{"email": "khach@brewlite.vn", "password": "Password123!"}`

#### 👉 BƯỚC 4: Tiếp nhận tại Backend Controller (`backend/src/auth/auth.controller.ts`)
1. Request bay tới NestJS Backend, được `AuthController` đón tại route:
   ```typescript
   @Post('/login')
   @HttpCode(HttpStatus.OK)
   async login(@Body() dto: LoginDto) { ... }
   ```
2. `ValidationPipe` tự động đối chiếu dữ liệu với file `LoginDto`:
   * Kiểm tra định dạng `@IsEmail()`.
   * Kiểm tra không được để trống `@IsNotEmpty()`.
3. Controller chuyển việc cho Service xử lý:
   ```typescript
   const data = await this.authService.login(dto);
   ```

#### 👉 BƯỚC 5: Xử lý Nghiệp vụ tại Backend Service (`backend/src/auth/auth.service.ts`)
Đây là trái tim của phân hệ Auth:
1. Hàm `login(dto: LoginDto)` gọi hàm con `validateUser(dto.email, dto.password)` (dòng 106).
2. Trong `validateUser()`:
   * **Truy vấn CSDL bằng Prisma:**
     ```typescript
     const user = await this.prisma.user.findUnique({
       where: { email: email.toLowerCase() },
     });
     ```
   * Nếu không tìm thấy User $\rightarrow$ ném ngay lỗi `UnauthorizedException('Email hoặc mật khẩu không chính xác')` (HTTP 401).
   * **So khớp mật khẩu bằng thư viện Bcrypt:**
     ```typescript
     const isMatch = await bcrypt.compare(password, user.passwordHash);
     ```
     *(Bcrypt lấy salt từ hash trong CSDL để băm password gửi lên và so sánh chuỗi băm một chiều. Kẻ xấu dù thấy DB cũng không biết mật khẩu gốc là gì).*
   * Nếu `isMatch === false` $\rightarrow$ ném lỗi `UnauthorizedException` (HTTP 401).
   * Nếu đúng mật khẩu $\rightarrow$ trả về đối tượng `user`.
3. Quay lại hàm `login()`, Service gọi tiếp hàm `generateJwtToken(user)` (dòng 119):
   * Tạo payload chứa danh tính người dùng:
     ```typescript
     const payload = { sub: user.id, email: user.email };
     ```
   * Ký số bằng secret key: `this.jwtService.sign(payload)`.
4. Trả về kết quả cho Controller (tuyệt đối không kèm mật khẩu hay hash):
   ```typescript
   return {
     id: user.id,
     email: user.email,
     accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   };
   ```

#### 👉 BƯỚC 6: Frontend nhận phản hồi & Lưu trữ phiên (`useAuth.ts` & `authStore.ts`)
1. Axios nhận response HTTP 200 từ Backend, trả về cho `useAuth.ts`.
2. `useAuth.ts` bóc tách dữ liệu:
   ```typescript
   const { accessToken, id } = response.data;
   const loggedUser: User = { id, email };
   storeLogin(accessToken, loggedUser); // Gọi Zustand Store
   ```
3. Trong `frontend/stores/authStore.ts` hàm `login`:
   * Lưu token vào bộ nhớ trình duyệt: `localStorage.setItem('accessToken', accessToken);`.
   * Cập nhật State toàn cục:
     ```typescript
     set({
       accessToken,
       user: loggedUser,
       isAuthenticated: true,
       isLoading: false,
     });
     ```
4. Quay lại trang `page.tsx`:
   * Chuyển hướng người dùng sang trang mua hàng: `router.push(redirectPath);` (mặc định là `/checkout` hoặc `/`).
   * Thanh điều hướng `Navbar` ngay lập tức chuyển từ nút *"Đăng nhập"* sang hiển thị Email và Điểm tích lũy (`loyaltyPoints`) của khách hàng!

---

## 3. LUỒNG 2: KHI BẤM NÚT "ĐĂNG KÝ" (REGISTER FLOW)

### 3.1. Sơ đồ chuỗi (Sequence Diagram)
```mermaid
sequenceDiagram
    autonumber
    actor User as Khách hàng
    participant Page as RegisterForm (page.tsx)
    participant Hook as useAuth.ts
    participant Api as api/auth.ts
    participant Ctrl as AuthController (NestJS)
    participant Svc as AuthService (NestJS)
    participant DB as PostgreSQL (Prisma)
    participant Store as authStore.ts (Zustand)

    User->>Page: Nhập Email, Mật khẩu, Xác nhận mật khẩu & Bấm "Tạo tài khoản"
    Page->>Page: handleSubmit() kiểm tra regex email, độ dài >= 6, pass == confirmPass
    Page->>Hook: register(email, password, confirmPassword)
    Hook->>Api: authApi.register({ email, password, confirmPassword })
    Api->>Ctrl: POST /api/v1/auth/register
    Ctrl->>Svc: authService.register(registerDto)
    Svc->>Svc: Kiểm tra password === confirmPassword
    Svc->>DB: prisma.user.findUnique({ email })
    alt Email đã có người dùng đăng ký
        DB-->>Svc: Tìm thấy User đã tồn tại
        Svc-->>Ctrl: Ném ConflictException (409)
        Ctrl-->>Page: Báo lỗi "Email đã tồn tại"
    else Email chưa tồn tại (Hợp lệ)
        Svc->>Svc: bcrypt.hash(password, 10 rounds)
        Svc->>DB: prisma.user.create({ email, passwordHash })
        DB-->>Svc: Bản ghi User mới được tạo thành công
        Svc->>Svc: generateJwtToken(user) -> Cấp accessToken ngay lập tức
        Svc-->>Ctrl: Trả về { id, email, accessToken }
        Ctrl-->>Api: HTTP 201 Created + JSON
        Api-->>Hook: { accessToken, id, email }
        Hook->>Store: storeLogin(accessToken, newUser) -> Tự động đăng nhập
        Hook-->>Page: Hoàn tất đăng ký
        Page->>Page: router.push('/checkout')
    end
```

---

### 3.2. Chi tiết từng hàm được gọi:

#### 👉 BƯỚC 1: Tại Giao diện Frontend (`frontend/app/auth/register/page.tsx`)
1. Khách hàng điền `email`, `password`, `confirmPassword` và bấm **"Tạo tài khoản"**.
2. Form kích hoạt `onSubmit={handleSubmit}` (dòng 20).
3. Kiểm tra validation nghiêm ngặt phía giao diện:
   * `emailRegex.test(email)`: Phải đúng cấu trúc email (`abc@domain.com`).
   * `password.length < 6`: Mật khẩu tối thiểu 6 ký tự.
   * `password !== confirmPassword`: Mật khẩu và xác nhận mật khẩu phải giống hệt nhau.
4. Nếu hợp lệ, gọi hàm `register(email, password, confirmPassword)` từ custom hook `useAuth()`.

#### 👉 BƯỚC 2: Tại Custom Hook (`frontend/hooks/useAuth.ts`)
1. Hàm `register = useCallback(...)` (dòng 41) kích hoạt.
2. Gọi hàm `authApi.register({ email, password, confirmPassword })`.

#### 👉 BƯỚC 3: Tại API Client (`frontend/api/auth.ts`)
1. Gửi request:
   * **Method:** `POST`
   * **URL:** `http://localhost:3001/api/v1/auth/register`
   * **Body JSON:** `{"email": "...", "password": "...", "confirmPassword": "..."}`

#### 👉 BƯỚC 4: Tiếp nhận tại Backend Controller (`backend/src/auth/auth.controller.ts`)
1. Nhận tại route:
   ```typescript
   @Post('/register')
   @HttpCode(HttpStatus.CREATED) // Trả về 201 Created chuẩn RESTful
   async register(@Body() dto: RegisterDto) { ... }
   ```
2. Chuyển dữ liệu sang `this.authService.register(dto)`.

#### 👉 BƯỚC 5: Xử lý Nghiệp vụ tại Backend Service (`backend/src/auth/auth.service.ts`)
1. **Kiểm tra mật khẩu xác nhận (dòng 27):**
   ```typescript
   if (dto.password !== dto.confirmPassword) {
     throw new BadRequestException('Mật khẩu xác nhận không khớp'); // HTTP 400
   }
   ```
2. **Kiểm tra trùng Email (dòng 39):**
   ```typescript
   const existingUser = await this.prisma.user.findUnique({
     where: { email: dto.email.toLowerCase() },
   });
   if (existingUser) {
     throw new ConflictException('Email đã tồn tại'); // HTTP 409
   }
   ```
3. **Mã hóa một chiều an toàn bằng Bcrypt (dòng 52):**
   ```typescript
   const saltRounds = 10;
   const passwordHash = await bcrypt.hash(dto.password, saltRounds);
   ```
   *(Bcrypt tự động sinh ra chuỗi salt ngẫu nhiên 10 vòng, tạo ra chuỗi hash dạng `$2b$10$...` chống lại tấn công Rainbow Table).*
4. **Lưu vào CSDL PostgreSQL qua Prisma (dòng 56):**
   ```typescript
   const user = await this.prisma.user.create({
     data: {
       email: dto.email.toLowerCase(),
       passwordHash,
     },
   });
   ```
5. **Cấp luôn JWT Token cho người dùng mới (dòng 64):**
   ```typescript
   const accessToken = this.generateJwtToken(user);
   return { id: user.id, email: user.email, accessToken };
   ```

#### 👉 BƯỚC 6: Frontend tự động đăng nhập
* Frontend nhận được `accessToken`, lập tức gọi `storeLogin(accessToken, newUser)` trong `authStore.ts`.
* Khách hàng **không cần phải gõ lại mật khẩu để đăng nhập lần nữa**, hệ thống tự động lưu phiên và đưa khách hàng thẳng tới trang mua cà phê!

---

## 4. CƠ CHẾ BẢO VỆ API BẰNG JWT GUARD (TOKEN AUTHENTICATION)

Sau khi đăng nhập thành công, khách hàng có `accessToken`. Khi khách gọi các API bảo mật (như tạo đơn hàng, thanh toán, xem hồ sơ `GET /api/v1/auth/me`):

1. **Frontend tự động đính kèm Token (`frontend/api/client.ts`):**
   * Nhờ có **Axios Request Interceptor** (dòng 17), mỗi khi có bất kỳ request nào gửi đi, Axios sẽ tự động đọc `localStorage.getItem('accessToken')` và gắn vào Header:
     ```http
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
2. **Backend xác thực Token (`backend/src/auth/guards/jwt.guard.ts` & `jwt.strategy.ts`):**
   * Controller nào có `@UseGuards(JwtGuard)` sẽ kích hoạt `JwtStrategy`.
   * Passport tự động trích xuất chuỗi Bearer Token từ Header, dùng khóa bí mật `JWT_SECRET` để giải mã và kiểm tra hạn sử dụng.
   * Nếu hợp lệ $\rightarrow$ gắn thông tin `user` vào `request.user` để Controller sử dụng qua `@CurrentUser()`.
   * Nếu token hết hạn hoặc bị giả mạo $\rightarrow$ ném ngay `UnauthorizedException` (HTTP 401).
3. **Frontend tự động xử lý khi Token hết hạn (`frontend/api/client.ts`):**
   * Nhờ **Axios Response Interceptor** (dòng 41), nếu Backend trả về mã `401 Unauthorized`, Frontend tự động dọn dẹp `localStorage.removeItem('accessToken')`, reset store về `isAuthenticated = false` và chuyển hướng người dùng về trang `/auth/login`.

---

## 5. BỘ CÂU HỎI VẤN ĐÁP THƯỜNG GẶP KHI THẦY CHẤM TASK 7 (FAQ)

### ❓ Câu 1: Em lưu mật khẩu người dùng vào Database như thế nào? Có lưu chuỗi gốc (plain-text) không?
> **Trả lời:** Dạ tuyệt đối không lưu chuỗi gốc ạ! Em sử dụng thư viện **Bcrypt** với `saltRounds = 10` trong `AuthService.register()`. Bcrypt sẽ tự sinh salt ngẫu nhiên và băm mật khẩu thành chuỗi mã hóa một chiều. Ngay cả quản trị viên khi mở Database cũng không thể dịch ngược lại được mật khẩu gốc của khách.

### ❓ Câu 2: Cơ chế đăng nhập của em hoạt động như thế nào? Dùng Session hay JWT?
> **Trả lời:** Dự án sử dụng **JSON Web Token (JWT)** không trạng thái (Stateless). Khi khách đăng nhập đúng, backend ký một `accessToken` chứa `userId` và `email` bằng thuật toán HMAC SHA256 với `JWT_SECRET`. Token này có thời hạn sử dụng. Phía Frontend lưu vào `localStorage` và `Zustand store`. Mỗi khi gọi API cần bảo vệ, Frontend tự động đính kèm qua header `Authorization: Bearer <token>`.

### ❓ Câu 3: Làm sao Frontend biết được người dùng đã đăng nhập hay chưa khi F5 lại trang?
> **Trả lời:** Em sử dụng cơ chế **Hydration & Persistence** của Zustand trong file `authStore.ts` kết hợp với component `AuthHydration.tsx`. Khi tải lại trang, Zustand đọc token từ `localStorage`, giải mã và cập nhật state `isAuthenticated = true` trước khi render giao diện, giúp Navbar hiển thị đúng avatar mà không bị chớp giật giao diện.

### ❓ Câu 4: Em xử lý trường hợp hai người dùng đăng ký cùng một Email như thế nào?
> **Trả lời:** Trong Prisma Schema, trường `email` của bảng `users` được đặt ràng buộc `@unique`. Ngoài ra, trong hàm `AuthService.register()`, em chủ động gọi `prisma.user.findUnique({ where: { email } })` trước. Nếu email đã tồn tại, backend sẽ trả về mã lỗi HTTP **409 Conflict** kèm thông điệp *"Email đã tồn tại"* để giao diện hiển thị cảnh báo đỏ cho người dùng.

### ❓ Câu 5: Em đã viết Unit Test cho Task 7 chưa?
> **Trả lời:** Dạ có đầy đủ ạ! Trong file `backend/src/auth/auth.spec.ts` có 4 bài test tự động chạy bằng Vitest bao phủ 100%:
> 1. Test đăng ký tài khoản thành công, kiểm tra mật khẩu đã được hash và có token trả về.
> 2. Test ném lỗi 409 Conflict khi đăng ký trùng email.
> 3. Test đăng nhập đúng trả về JWT token.
> 4. Test đăng nhập sai mật khẩu ném lỗi 401 Unauthorized.
> Toàn bộ 4/4 tests đều PASS 100%!
