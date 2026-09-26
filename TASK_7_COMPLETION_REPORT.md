# 📋 BÁO CÁO TỔNG KẾT HOÀN THÀNH TASK 7: AUTHENTICATION (JWT)
**Dự án:** BrewLite - Hệ thống Đặt Hàng & Giao Đồ Uống  
**Sprint:** 2 | **Điểm Story:** 13 pts  
**Công nghệ:** NestJS (Backend) + Prisma (PostgreSQL) + Next.js 14 App Router (Frontend) + TailwindCSS + Zustand + Axios + Passport JWT  
**Tiêu chuẩn áp dụng:** `TASK_7_AUTH_CODE_RULES.md` & `Task7_plan.md`

---

## 📑 MỤC LỤC
1. [Tổng Quan Kiến Trúc & Cây Thư Mục](#1-tổng-quan-kiến-trúc--cây-thư-mục)
2. [Chi Tiết Thực Thi Từng Bước (1 → 5)](#2-chi-tiết-thực-thi-từng-bước-1--5)
3. [Bảng Phân Tích Chi Tiết Từng File, Biến & Hàm](#3-bảng-phân-tích-chi-tiết-từng-file-biến--hàm)
4. [Sơ Đồ Luồng Dữ Liệu (Data Flows)](#4-sơ-đồ-luồng-dữ-liệu-data-flows)
5. [Bảng Đối Chiếu Quy Tắc Thép (Compliance Matrix)](#5-bảng-đối-chiếu-quy-tắc-thép-compliance-matrix)
6. [Hướng Dẫn Chạy & Kiểm Thử Nghiệm Thu (Manual Test Guide)](#6-hướng-dẫn-chạy--kiểm-thử-nghiệm-thu-manual-test-guide)

---

## 1. TỔNG QUAN KIẾN TRÚC & CÂY THƯ MỤC

Toàn bộ các file được tạo mới và cấu hình trong Task 7 đều tuân thủ nguyên tắc giới hạn thư mục làm việc, không đụng chạm vào file cấu hình gốc:

```
BrewLite/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma                  # [Bước 1] Model User, Order & quan hệ 1-N
│   │   └── migrations/
│   │       └── 20260925164403_add_user_auth/
│   │           └── migration.sql          # [Bước 1] SQL Migration đã migrate vào PostgreSQL
│   └── src/
│       ├── prisma/
│       │   └── prisma.service.ts          # [Bước 2] Prisma Client Provider cho NestJS
│       ├── app.module.ts                  # [Bước 2] Import AuthModule vào root app
│       └── auth/                          # [Bước 2] Toàn bộ module Auth độc lập
│           ├── auth.module.ts             # Module khai báo JwtModule, Passport, providers
│           ├── auth.controller.ts         # Controller xử lý routing /register, /login, /me, /logout
│           ├── auth.service.ts            # Business logic (hash bcrypt, JWT sign, validate)
│           ├── dto/
│           │   ├── register.dto.ts        # DTO validate input đăng ký (class-validator)
│           │   ├── login.dto.ts           # DTO validate input đăng nhập
│           │   └── auth-response.dto.ts   # DTO chuẩn hóa Response Contract Section IV
│           ├── entities/
│           │   └── user.entity.ts         # User entity model (khớp Prisma)
│           ├── guards/
│           │   └── jwt.guard.ts           # Guard bảo vệ endpoint, xử lý 401 Unauthorized
│           ├── strategies/
│           │   └── jwt.strategy.ts        # Passport Strategy trích xuất Bearer token
│           └── decorators/
│               └── current-user.decorator.ts # Custom decorator @CurrentUser()
│
└── frontend/
    ├── stores/
    │   └── authStore.ts                   # [Bước 3] Zustand Store + Persist localStorage
    ├── api/
    │   ├── client.ts                      # [Bước 3] Axios instance + Request/Response Interceptors
    │   └── auth.ts                        # [Bước 3] Gọi API register, login, logout, getMe
    ├── hooks/
    │   └── useAuth.ts                     # [Bước 3] Custom Hook tổng hợp Auth actions & state
    ├── components/
    │   ├── Navbar.tsx                     # [Bước 5] Header thay đổi theo auth state
    │   ├── ProtectedRoute.tsx             # [Bước 5] HOC bảo vệ route nội bộ, auto-redirect
    │   └── AuthHydration.tsx              # [Bước 5] Chống nhấp nháy/mất state khi F5
    └── app/
        ├── page.tsx                       # [Bước 5] Trang chủ tích hợp Navbar & Auth state
        └── auth/                          # [Bước 4] Giao diện Auth
            ├── layout.tsx                 # [Bước 4] Shared layout 2 cột (Ảnh cà phê + Quote)
            ├── login/
            │   └── page.tsx               # [Bước 4] Trang Đăng nhập (Form UI chuẩn mẫu)
            └── register/
                └── page.tsx               # [Bước 4] Trang Đăng ký (Form UI chuẩn mẫu)
```

---

## 2. CHI TIẾT THỰC THI TỪNG BƯỚC (1 → 5)

### 🔹 Bước 1: Cập Nhật Database Schema (Prisma)
- **Tạo schema chuẩn:** Thêm model `User` (`id` UUID, `email` unique, `passwordHash`, `loyaltyPoints` default 0, `createdAt`, `updatedAt`) và liên kết quan hệ 1-N với model `Order` qua khóa ngoại `userId`.
- **Chạy Migration:** Đã sinh migration SQL và thực thi lệnh migrate thành công vào PostgreSQL: `20260925164403_add_user_auth`.

### 🔹 Bước 2: Xây Dựng Backend Auth Module (NestJS)
- **Mã hóa an toàn:** Sử dụng `bcrypt` với `saltRounds = 10` để băm mật khẩu. Tuyệt đối không lưu plain text.
- **Cơ chế Token:** Sinh JSON Web Token chứa payload `{ sub: userId, email }` với khóa bí mật lấy từ `process.env.JWT_SECRET`, thời hạn `1d`.
- **Phản hồi chuẩn:** Áp dụng chặt chẽ Response Format từ Section IV:
  - `POST /api/v1/auth/register` → HTTP `201 Created`
  - `POST /api/v1/auth/login` → HTTP `200 OK`
  - `GET /api/v1/auth/me` → HTTP `200 OK` (yêu cầu Bearer Token)
  - `POST /api/v1/auth/logout` → HTTP `200 OK`
- **Bảo vệ Routes:** Viết `JwtStrategy` trích xuất Bearer token từ Header và `JwtGuard` chặn các request không có hoặc sai token, trả về HTTP 401 chuẩn.

### 🔹 Bước 3: Xây Dựng Frontend State & Axios Interceptor
- **Zustand Store (`authStore.ts`):** Quản lý state gồm `user`, `accessToken`, `token`, `isAuthenticated`, `isLoading`. Tích hợp middleware `persist` để tự động lưu vào `localStorage`. Tuyệt đối không lưu password vào store hay storage.
- **Axios Interceptor (`client.ts`):**
  - *Request Interceptor:* Tự động gắn header `Authorization: Bearer <token>` vào mọi request gửi lên backend.
  - *Response Interceptor:* Bắt mã lỗi HTTP `401 Unauthorized` → tự động kích hoạt `logout()`, dọn sạch token và redirect người dùng về `/auth/login`.
- **API & Hook (`auth.ts`, `useAuth.ts`):** Đóng gói toàn bộ các hàm gọi HTTP và hook React cho tầng UI.

### 🔹 Bước 4: Xây Dựng Giao Diện Đăng Nhập & Đăng Ký (UI)
- **Bám sát 100% thiết kế mẫu:**
  - Bố cục 2 cột: Cột trái là ảnh hạt/ly cà phê Unsplash (`photo-1510972527921-ce03766a1cf1`) kèm câu quote tiếng Việt có nền tối nhẹ; Cột phải là form nhập liệu tinh tế màu nâu cà phê `#6F4E37`.
  - Responsive: Tự động ẩn cột ảnh trên màn hình nhỏ/mobile, tập trung vào form.
- **Trang Login (`/auth/login`):** Nhập email + password, kiểm tra validate, hiển thị banner lỗi đỏ nếu sai thông tin, redirect về `/` khi thành công.
- **Trang Register (`/auth/register`):** Form đăng ký có email, password, confirmPassword, validate mật khẩu >= 8 ký tự kèm chữ + số.

### 🔹 Bước 5: Tích Hợp Luồng Nghiệp Vụ (Business Flow Integration)
- **Bảo vệ Route (`ProtectedRoute.tsx`):** Component bọc các trang nhạy cảm (Profile, Giỏ hàng). Tự động kiểm tra token, nếu chưa đăng nhập lập tức chuyển hướng về `/auth/login`.
- **Duy trì trạng thái (`AuthHydration.tsx`):** Chờ Zustand rehydrate xong dữ liệu từ `localStorage` trước khi render giao diện, loại bỏ 100% tình trạng nhấp nháy hoặc mất session khi người dùng bấm F5 (refresh).
- **Thanh điều hướng (`Navbar.tsx`):**
  - Khi chưa đăng nhập: Hiển thị 2 nút "Đăng nhập" & "Đăng ký".
  - Khi đã đăng nhập: Hiển thị lời chào "Xin chào, {email}" kèm nút "Đăng xuất".
- **Luồng Đăng xuất an toàn:** Nhấn "Đăng xuất" sẽ gọi action xóa token trong Zustand, dọn sạch `localStorage`, hủy Bearer header và chuyển hướng an toàn về trang chủ.

---

## 3. BẢNG PHÂN TÍCH CHI TIẾT TỪNG FILE, BIẾN & HÀM

### 📁 A. Backend Files

#### 1. `backend/prisma/schema.prisma`
- **Mục đích:** Định nghĩa cấu trúc bảng trong cơ sở dữ liệu PostgreSQL.
- **Chi tiết Models & Fields:**
  - `model User`:
    - `id`: Kiểu `String @id @default(uuid())` - Khóa chính định dạng UUID v4.
    - `email`: Kiểu `String @unique` - Email tài khoản, bắt buộc duy nhất.
    - `passwordHash`: Kiểu `String` - Chuỗi mật khẩu đã được hash bằng bcrypt.
    - `loyaltyPoints`: Kiểu `Int @default(0)` - Điểm tích lũy thành viên.
    - `createdAt` / `updatedAt`: Timestamps tự động.
    - `orders`: Quan hệ 1-N tới model `Order`.
  - `model Order`:
    - `userId`: Kiểu `String` - Khóa ngoại bắt buộc liên kết tới `User.id`.
    - `user`: Định nghĩa `@relation(fields: [userId], references: [id])`.

#### 2. `backend/src/prisma/prisma.service.ts`
- **Mục đích:** Khởi tạo và quản lý vòng đời kết nối Prisma Client với cơ sở dữ liệu.
- **Chi tiết Class & Methods:**
  - `class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy`
  - `onModuleInit()`: Gọi `await this.$connect()` khi module khởi động.
  - `onModuleDestroy()`: Gọi `await this.$disconnect()` khi ứng dụng tắt, tránh rò rỉ kết nối connection pool.

#### 3. `backend/src/auth/dto/register.dto.ts`
- **Mục đích:** Định nghĩa và validate dữ liệu gửi lên khi đăng ký tài khoản.
- **Chi tiết Fields & Decorators:**
  - `email`: `@IsEmail()` kiểm tra định dạng email hợp lệ.
  - `password`: `@IsString()`, `@MinLength(8)`, `@Matches(/^(?=.*[A-Za-z])(?=.*\d)/)` bắt buộc mật khẩu từ 8 ký tự trở lên, phải chứa ít nhất 1 chữ cái và 1 chữ số.
  - `confirmPassword`: `@IsString()` chuỗi xác nhận mật khẩu.

#### 4. `backend/src/auth/dto/login.dto.ts`
- **Mục đích:** Validate dữ liệu khi người dùng đăng nhập.
- **Chi tiết Fields:**
  - `email`: `@IsEmail()`
  - `password`: `@IsString()`

#### 5. `backend/src/auth/dto/auth-response.dto.ts`
- **Mục đích:** Quy chuẩn cấu trúc dữ liệu trả về cho client theo hợp đồng API (Section IV).
- **Chi tiết Classes:**
  - `class AuthResponseDto`: Chứa `id`, `email`, `accessToken`. Tuyệt đối không chứa `password` hay `passwordHash`.
  - `class UserProfileDto`: Chứa `id`, `email`, `loyaltyPoints`.
  - `class ApiResponse<T>`: Format chuẩn gồm `{ statusCode: number, message: string, data: T, error?: string }`.

#### 6. `backend/src/auth/entities/user.entity.ts`
- **Mục đích:** Định nghĩa thực thể User trong bộ nhớ của tầng Application/Domain.
- **Chi tiết Fields:** `id`, `email`, `passwordHash`, `loyaltyPoints`, `createdAt`, `updatedAt`.

#### 7. `backend/src/auth/decorators/current-user.decorator.ts`
- **Mục đích:** Custom parameter decorator giúp controller lấy trực tiếp thông tin user từ request.
- **Chi tiết:** `CurrentUser = createParamDecorator(...)` trích xuất `request.user` được `JwtStrategy` gán vào sau khi xác thực token.

#### 8. `backend/src/auth/guards/jwt.guard.ts`
- **Mục đích:** Chặn các request chưa xác thực trước khi chạm tới Controller handler.
- **Chi tiết:**
  - `class JwtGuard extends AuthGuard('jwt')`
  - `handleRequest()`: Bắt lỗi nếu không có user/token, ném ra `UnauthorizedException` chuẩn định dạng `{ statusCode: 401, message: 'Unauthorized - No token provided', error: 'UNAUTHORIZED' }`.
  - Export alias `JwtAuthGuard` tương thích với cả 2 cách gọi trong đồ án.

#### 9. `backend/src/auth/strategies/jwt.strategy.ts`
- **Mục đích:** Tích hợp Passport JWT Strategy vào hệ thống NestJS.
- **Chi tiết:**
  - Trích xuất token từ header: `ExtractJwt.fromAuthHeaderAsBearerToken()`.
  - Lấy secret key từ: `process.env.JWT_SECRET`.
  - Hàm `validate(payload: JwtPayload)`: Nhận `sub` (userId), truy vấn Prisma tìm user tương ứng (bỏ trường `passwordHash`). Nếu không thấy user, ném 401.

#### 10. `backend/src/auth/auth.service.ts`
- **Mục đích:** Nơi xử lý toàn bộ nghiệp vụ cốt lõi của việc xác thực.
- **Chi tiết các hàm:**
  - `register(dto: RegisterDto)`:
    1. Kiểm tra `dto.password === dto.confirmPassword`, nếu lệch ném `BadRequestException` (400).
    2. Truy vấn `prisma.user.findUnique({ where: { email } })`, nếu trùng ném `ConflictException` (409).
    3. Mã hóa: `bcrypt.hash(dto.password, 10)`.
    4. Lưu database qua `prisma.user.create(...)`.
    5. Gọi `generateJwtToken(user)` và trả về `{ id, email, accessToken }`.
  - `validateUser(email, password)`:
    1. Tìm user theo email. Nếu không có ném `UnauthorizedException` (401).
    2. So sánh mật khẩu bằng `bcrypt.compare(password, user.passwordHash)`. Nếu sai ném 401.
    3. Trả về thông tin user hợp lệ.
  - `login(dto: LoginDto)`:
    1. Gọi `validateUser`.
    2. Sinh `accessToken` và trả về kết quả đăng nhập.
  - `generateJwtToken(user)`:
    - Ký token JWT với payload `{ sub: user.id, email: user.email }` thông qua `jwtService.sign()`.

#### 11. `backend/src/auth/auth.controller.ts`
- **Mục đích:** Tiếp nhận HTTP Request và trả về HTTP Response.
- **Hỗ trợ routing kép:** `@Controller(['auth', 'api/v1/auth'])` đáp ứng cả 2 quy chuẩn gọi API.
- **Endpoints:**
  - `@Post('/register')` (`@HttpCode(201)`): Gọi `authService.register`, trả về `201 Created`.
  - `@Post('/login')` (`@HttpCode(200)`): Gọi `authService.login`, trả về `200 OK`.
  - `@Get('/me')` (`@UseGuards(JwtGuard)`, `@HttpCode(200)`): Lấy thông tin user đăng nhập qua `@CurrentUser()`.
  - `@Post('/logout')` (`@HttpCode(200)`): Trả về `200 OK` với `data: null`.

#### 12. `backend/src/auth/auth.module.ts`
- **Mục đích:** Gom nhóm controller, providers, cấu hình JwtModule và PassportModule, export các thành phần để các module khác (như Orders Module) có thể tái sử dụng JwtGuard.

---

### 📁 B. Frontend Files

#### 13. `frontend/stores/authStore.ts`
- **Mục đích:** Quản lý state đăng nhập toàn cục trên client bằng Zustand.
- **Các trường trong State:**
  - `user`: Thông tin người dùng (`id`, `email`, `loyaltyPoints`).
  - `accessToken` & `token`: Chuỗi JWT Token.
  - `isAuthenticated`: Boolean báo trạng thái đã đăng nhập hay chưa.
  - `isLoading`: Boolean trạng thái đang gửi request.
- **Các Actions:**
  - `login(accessToken, user)`: Cập nhật state và lưu `accessToken` vào `localStorage`.
  - `logout()`: Xóa token trong state và gọi `localStorage.removeItem('accessToken')`.
  - `setUser(user)`: Cập nhật thông tin user.
  - `setToken(token)`: Cập nhật token.
  - `isLoggedIn()`: Helper kiểm tra token hợp lệ tức thời.
- **Middleware `persist`:** Đồng bộ state vào localStorage dưới khóa `auth-storage`.

#### 14. `frontend/api/client.ts`
- **Mục đích:** Cấu hình instance Axios tập trung cho toàn bộ ứng dụng.
- **Chi tiết:**
  - `baseURL`: Đọc từ `process.env.NEXT_PUBLIC_API_URL` (fallback `http://localhost:3001`).
  - `Request Interceptor`: Trước khi gửi bất kỳ request nào, tự động đọc token từ Zustand Store / `localStorage` và gán: `config.headers.Authorization = 'Bearer ' + token`.
  - `Response Interceptor`: Khi nhận response có status `401 Unauthorized` → tự động gọi `authStore.getState().logout()`, xóa localStorage và chuyển hướng trình duyệt về `/auth/login` (nếu đang ở trang khác).

#### 15. `frontend/api/auth.ts`
- **Mục đích:** Cung cấp các hàm API chuyên biệt gọi xuống Backend:
  - `register(data: RegisterRequest)`: Gọi `POST /api/v1/auth/register`.
  - `login(data: LoginRequest)`: Gọi `POST /api/v1/auth/login`.
  - `logout()`: Gọi `POST /api/v1/auth/logout`.
  - `getMe()`: Gọi `GET /api/v1/auth/me`.

#### 16. `frontend/hooks/useAuth.ts`
- **Mục đích:** Custom React Hook đóng vai trò cầu nối giữa UI Component với Zustand Store và Auth API.
- **Trả về:** `{ user, accessToken, isAuthenticated, isLoading, isLoggedIn, login, register, logout, fetchMe }`.

#### 17. `frontend/app/auth/layout.tsx`
- **Mục đích:** Bố cục dùng chung cho các trang xác thực (`/auth/login`, `/auth/register`).
- **Giao diện:**
  - Cột trái (Desktop `w-1/2`): Background ảnh cà phê Unsplash chất lượng cao (`photo-1510972527921-ce03766a1cf1`), overlay bóng mờ, quote tiếng Việt truyền cảm hứng của BrewLite Việt Nam.
  - Cột phải (`w-1/2`): Khung form căn giữa nền `stone-50`.

#### 18. `frontend/app/auth/login/page.tsx`
- **Mục đích:** Trang giao diện Đăng nhập.
- **Đặc điểm:** Bám sát 100% hình ảnh mẫu (tiêu đề BrewLite, mô tả, ô input email/password bo góc, nút nâu `#6F4E37`, link chuyển sang đăng ký). Tích hợp hàm `login` từ `useAuth()`.

#### 19. `frontend/app/auth/register/page.tsx`
- **Mục đích:** Trang giao diện Đăng ký tài khoản.
- **Đặc điểm:** Gồm 3 ô input: Email, Mật khẩu, Xác nhận mật khẩu. Validate đầy đủ ở client trước khi gọi API, thông báo lỗi nếu mật khẩu dưới 8 ký tự hoặc không khớp.

#### 20. `frontend/components/Navbar.tsx`
- **Mục đích:** Thanh điều hướng đầu trang phản ứng linh hoạt theo trạng thái auth.
- **Xử lý hiển thị:**
  - Nếu `isAuthenticated === false`: Hiển thị nút "Đăng nhập" và "Đăng ký".
  - Nếu `isAuthenticated === true`: Hiển thị "Xin chào, {email}" và nút "Đăng xuất".
  - Nút "Đăng xuất" kích hoạt hàm `logout()`, dọn dẹp dữ liệu và điều hướng về trang chủ `/`.

#### 21. `frontend/components/ProtectedRoute.tsx`
- **Mục đích:** Wrapper bảo vệ các trang nội bộ (Giỏ hàng, Checkout, Profile).
- **Cơ chế:** Kiểm tra nếu không có token trong store lẫn localStorage → tự động điều hướng sang `/auth/login`.

#### 22. `frontend/components/AuthHydration.tsx`
- **Mục đích:** Giải quyết triệt để lỗi Hydration Mismatch & nhấp nháy giao diện trong Next.js App Router khi dùng `persist` với `localStorage`.
- **Cơ chế:** Đợi Zustand kích hoạt sự kiện `onFinishHydration()` mới hiển thị nội dung, giúp giao diện luôn nhận đúng trạng thái đăng nhập ngay khi vừa tải trang.

#### 23. `frontend/app/page.tsx`
- **Mục đích:** Trang chủ ứng dụng được nâng cấp ở Bước 5: bọc trong `AuthHydration`, gắn `Navbar` và hiển thị banner chào mừng thành viên nếu đã đăng nhập.

---

## 4. SƠ ĐỒ LUỒNG DỮ LIỆU (DATA FLOWS)

### 🔄 Luồng 1: Đăng ký tài khoản mới (Registration Flow)
```
[User Form tại /auth/register]
       │
       ▼ (1. Nhập email, password, confirmPassword)
[useAuth.register()]
       │
       ▼ (2. Validate client-side: regex email, length >= 8, chữ + số, match password)
[api/auth.register() qua Axios Client]
       │
       ▼ (3. POST /api/v1/auth/register kèm Body JSON)
[NestJS AuthController @Post('/register')]
       │
       ▼ (4. ValidationPipe kiểm tra RegisterDto)
[AuthService.register()]
       ├── (5. Kiểm tra email trong PostgreSQL qua Prisma: nếu trùng -> ném 409 Conflict)
       ├── (6. Mã hóa password bằng bcrypt.hash(password, 10))
       ├── (7. Lưu user vào DB qua prisma.user.create())
       └── (8. Ký JWT Token với payload { sub: id, email })
       │
       ▼ (9. Trả về response 201 Created { statusCode, message, data: { id, email, accessToken } })
[Frontend useAuth]
       │
       ▼ (10. authStore.login(accessToken, user) -> Lưu vào Zustand + localStorage)
[router.push('/') -> Chuyển hướng người dùng về Trang Chủ]
```

---

### 🔑 Luồng 2: Đăng nhập (Login Flow)
```
[User Form tại /auth/login]
       │
       ▼ (1. Nhập email & password)
[useAuth.login()]
       │
       ▼ (2. api/auth.login() qua Axios)
[NestJS AuthController @Post('/login')]
       │
       ▼ (3. AuthService.login())
[AuthService.validateUser()]
       ├── (4. Tìm user theo email trong DB; nếu không thấy -> ném 401 Unauthorized)
       └── (5. bcrypt.compare(password, user.passwordHash); nếu sai -> ném 401 Unauthorized)
       │
       ▼ (6. Ký JWT Token { sub: id, email })
       │
       ▼ (7. Trả về response 200 OK kèm accessToken)
[useAuth] -> [authStore.login()] -> [Lưu localStorage] -> [Redirect về Trang Chủ]
```

---

### 🛡️ Luồng 3: Gọi API Được Bảo Vệ & Tự Động Xử Lý Token (Protected API Flow)
```
[Frontend Axios Request (ví dụ: POST /api/v1/orders)]
       │
       ▼ (1. Request Interceptor tự động đọc accessToken từ Zustand / localStorage)
       ▼ (2. Đính kèm Header: Authorization: Bearer <accessToken>)
[NestJS Backend API Gateway]
       │
       ▼ (3. Gặp @UseGuards(JwtGuard))
[JwtStrategy.validate()]
       ├── (4. Giải mã JWT token bằng JWT_SECRET)
       ├── (5. Trích xuất payload { sub, email })
       └── (6. Tìm user trong DB bằng prisma.user.findUnique)
       │
   ┌───┴─────────────────────────────────┐
   │ Hợp lệ                              │ Không hợp lệ / Hết hạn / Thiếu Token
   ▼                                     ▼
[Gán user vào request -> Chạy Controller]  [JwtGuard ném HTTP 401 Unauthorized]
                                         │
                                         ▼ (Trả JSON 401 về Frontend)
                       [Axios Response Interceptor bắt mã 401]
                                         ├── authStore.logout() (xóa state)
                                         ├── localStorage.removeItem('accessToken')
                                         └── window.location.href = '/auth/login' (Tự động redirect)
```

---

## 5. BẢNG ĐỐI CHIẾU QUY TẮC THÉP (COMPLIANCE MATRIX)

| Tiêu chuẩn bắt buộc | File quy định | Mức độ tuân thủ | Bằng chứng thực thi |
|---------------------|---------------|-----------------|---------------------|
| **Không lưu plain password** | `TASK_7_AUTH_CODE_RULES` Mục V | ✅ Đạt 100% | Băm bằng `bcrypt.hash(..., 10)` trước khi lưu DB. |
| **Không leak password trong response** | `TASK_7_AUTH_CODE_RULES` Mục V | ✅ Đạt 100% | `AuthResponseDto` và `UserProfileDto` hoàn toàn không có trường `password` hay `passwordHash`. |
| **Không lưu password trong frontend state/storage** | `TASK_7_AUTH_CODE_RULES` Mục V | ✅ Đạt 100% | `authStore.ts` chỉ lưu `user: { id, email }` và `accessToken`. |
| **Không hardcode JWT Secret** | `TASK_7_AUTH_CODE_RULES` Mục V | ✅ Đạt 100% | Đọc trực tiếp từ `process.env.JWT_SECRET`. |
| **Đúng Response Format chuẩn** | `TASK_7_AUTH_CODE_RULES` Mục IV | ✅ Đạt 100% | Định dạng `{ statusCode, message, data, error? }` trên tất cả endpoints. |
| **Token truyền qua Header, cấm qua URL** | `TASK_7_AUTH_CODE_RULES` Mục V | ✅ Đạt 100% | Axios Request Interceptor gửi qua `Authorization: Bearer <token>`. |
| **Validate DTOs phía Backend** | `TASK_7_AUTH_CODE_RULES` Mục VII | ✅ Đạt 100% | Dùng `class-validator` với `@IsEmail()`, `@MinLength(8)`, `@Matches()`. |
| **Không tự ý sửa config hệ thống** | `Task7_plan` Mục III.4 | ✅ Đạt 100% | Giữ nguyên `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.js`. |
| **Bám sát tỷ lệ giao diện mẫu ảnh Unsplash** | Yêu cầu Bước 4 | ✅ Đạt 100% | Layout 2 cột chia đôi, hình ảnh cà phê `photo-1510972527921-ce03766a1cf1`, quote tiếng Việt, nút nâu `#6F4E37`. |

---

## 6. HƯỚNG DẪN CHẠY & KIỂM THỬ NGHIỆM THU (MANUAL TEST GUIDE)

### Bước A: Khởi động hệ thống
Mở 2 cửa sổ terminal:
```powershell
# Terminal 1 - Backend (port 3001):
cd backend
npm run start:dev

# Terminal 2 - Frontend (port 3000):
cd frontend
npm run dev
```

### Bước B: Kịch bản kiểm thử (Test Scenarios)

#### 1. Kiểm thử Trang Đăng Ký (`/auth/register`)
- Truy cập: `http://localhost:3000/auth/register`
- **Case 1 (Validate lỗi):** Để trống mật khẩu hoặc nhập mật khẩu dưới 8 ký tự (hoặc mật khẩu xác nhận không khớp) → Bấm "Tạo Tài Khoản" → Giao diện hiện khung đỏ thông báo lỗi tương ứng.
- **Case 2 (Đăng ký thành công):** Nhập email mới (ví dụ: `khachhang@gmail.com`) và mật khẩu `Brewlite1234` (khớp xác nhận) → Bấm "Tạo Tài Khoản" → Hệ thống gọi API `201 Created` → Tự động đăng nhập và chuyển hướng về Trang Chủ `/`.

#### 3. Kiểm thử Duy trì trạng thái (State Hydration & LocalStorage)
- Sau khi đăng ký/đăng nhập thành công, bạn đang ở trang chủ `http://localhost:3000`.
- Trên thanh Navbar xuất hiện dòng: **"Xin chào, khachhang@gmail.com"** và nút **"Đăng xuất"**.
- Bấm phím **F5 (Refresh lại trang web)**:
  - Giao diện **vẫn giữ nguyên trạng thái đăng nhập** (không bị văng ra ngoài, không bị nhấp nháy nút Đăng nhập).
- Nhấn phím `F12` trên trình duyệt -> Mở tab **Application** -> mục **Local Storage** -> chọn `http://localhost:3000`:
  - Thấy khóa `auth-storage` chứa thông tin user và `accessToken`.
  - Thấy khóa `accessToken` lưu đúng chuỗi token JWT.
  - Tuyệt đối **không có mật khẩu** xuất hiện ở đây.

#### 4. Kiểm thử Trang Đăng Nhập (`/auth/login`)
- Nhấn nút **"Đăng xuất"** trên Navbar → Dữ liệu trong LocalStorage bị xóa sạch → Navbar quay về 2 nút "Đăng nhập" & "Đăng ký".
- Bấm nút **"Đăng nhập"** (hoặc vào `http://localhost:3000/auth/login`).
- **Case 1 (Sai mật khẩu):** Nhập email `khachhang@gmail.com` và mật khẩu sai `11111111` → Bấm "Đăng Nhập" → Khung thông báo lỗi đỏ hiện ra: *"Email hoặc mật khẩu không chính xác"*.
- **Case 2 (Đăng nhập đúng):** Nhập mật khẩu đúng `Brewlite1234` → Bấm "Đăng Nhập" → Chuyển hướng ngay về Trang Chủ với session mới.

---

### 🎉 KẾT LUẬN
Module **Task 7: Authentication (JWT)** đã được xây dựng hoàn thiện toàn diện từ CSDL, Backend API, State Management, Interceptors đến Giao diện UI và Tích hợp luồng nghiệp vụ thực tế, sẵn sàng 100% để nghiệm thu và tích hợp cho các Task kế tiếp (như Task 6: Orders & Checkout Guard)!
