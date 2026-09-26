# YÊU CẦU THỰC THI TASK 7: AUTHENTICATION (JWT) - DỰ ÁN BREWLITE

## I. VAI TRÒ VÀ NGỮ CẢNH

Bạn là một Senior Fullstack Developer (NestJS & Next.js). Nhiệm vụ của bạn là hoàn thành **Task 7: Authentication (JWT)** cho dự án BrewLite.
Bạn phải tuân thủ nghiêm ngặt kiến trúc Monorepo hiện tại và bộ Code Standards & Conventions của dự án. Tuyệt đối KHÔNG sửa đổi logic của các module khác (như Products, Cart) nếu không liên quan trực tiếp đến luồng xác thực.

## II. CÔNG NGHỆ BẮT BUỘC

- **Backend:** NestJS, Prisma (PostgreSQL), Passport-JWT, Bcrypt.
- **Frontend:** Next.js 14 (App Router), TailwindCSS, Zustand, Axios.

## III. QUY TẮC CODE (RULES) - [THIẾT QUÂN LUẬT]

1. **Thư mục làm việc:**
   - Backend: Chỉ thao tác trong `backend/src/auth/` và `backend/prisma/`.
   - Frontend: Chỉ thao tác trong `frontend/app/auth/`, `frontend/api/`, và `frontend/stores/`.
2. **Naming Convention:**
   - Backend: `*.controller.ts`, `*.service.ts`, `*.dto.ts`, `*.entity.ts`, `*.guard.ts`.
   - Frontend: PascalCase cho Components/Pages, camelCase cho hooks/stores.
3. **Response Format:** Mọi API backend trả về phải theo chuẩn: `{ statusCode, message, data, error? }`.
4. **CẤM ĐỤNG VÀO CẤU HÌNH (STRICTLY PROHIBITED):**
   - Tuyệt đối KHÔNG tự ý viết lại, thay đổi hay xuất ra nội dung mới cho các file cấu hình hệ thống như `package.json`, `tsconfig.json`, `tailwind.config.js`, hay `next.config.js`.
   - Nếu logic yêu cầu bắt buộc phải dùng thư viện bên thứ 3 (ví dụ: bcrypt, @nestjs/jwt), CHỈ ĐƯỢC cung cấp câu lệnh `npm install...` để người dùng tự chạy trên terminal. Không được hướng dẫn người dùng sửa file cấu hình để fix lỗi TypeScript.

## IV. CÁC BƯỚC THỰC THI (SKILLS)

### Bước 1: Cập nhật Database Schema

- Mở `backend/prisma/schema.prisma`.
- Thêm model `User`: `id` (UUID), `email` (unique), `passwordHash`, `loyaltyPoints` (Int, default 0), `createdAt`.
- Cập nhật model `Order`: Thêm quan hệ với `User` qua trường `userId` (bắt buộc).
- Cung cấp cho user lệnh để chạy migration (VD: `npx prisma migrate dev --name add_user_auth`).

### Bước 2: Xây dựng Backend Auth Module

- **DTOs:** Tạo `register.dto.ts` (kiểm tra định dạng email, password >= 8 ký tự bằng `class-validator`) và `login.dto.ts`.
- **Service (`auth.service.ts`):**
  - `register`: Mã hóa password bằng `bcrypt`, lưu vào db.
  - `login`: So sánh password, sinh JWT token với payload `{ sub: userId, email }`. Secret lấy từ `process.env.JWT_SECRET`.
- **Strategy & Guard:** Thiết lập `jwt.strategy.ts` và `jwt.guard.ts` bằng `@nestjs/passport`.
- **Controller (`auth.controller.ts`):**
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login` (Trả về `accessToken` và thông tin user).

### Bước 3: Xây dựng Frontend State & Interceptor

- **Zustand Store (`frontend/stores/authStore.ts`):** Quản lý state `user`, `token`, `isAuthenticated`. Dùng middleware `persist` để lưu token vào `localStorage`.
- **Axios Interceptor (`frontend/api/client.ts`):** Cấu hình tự động đính kèm header `Authorization: Bearer <token>` vào tất cả các request gửi lên Backend. Xử lý lỗi 401 (Unauthorized) bằng cách xóa token và redirect về `/auth/login`.

### Bước 4: Xây dựng Giao diện Frontend (UI)

- **Trang Đăng ký (`frontend/app/auth/register/page.tsx`):** Form nhập email, password, confirm password. Gọi API register, thành công thì chuyển sang trang login. Thêm thông báo lỗi rõ ràng.
- **Trang Đăng nhập (`frontend/app/auth/login/page.tsx`):** Form nhập email, password. Gọi API login, lưu token vào Zustand store, sau đó redirect người dùng.

### Bước 5: Tích hợp Luồng Nghiệp vụ (Guard)

- **Backend:** Gắn `@UseGuards(JwtAuthGuard)` bảo vệ endpoint `POST /api/v1/orders`.
- **Frontend (Luồng thanh toán):** Cập nhật logic ở nút "Thanh toán" tại trang Giỏ hàng (`Cart`). Nếu `isAuthenticated` là false, bắt buộc redirect người dùng sang `/auth/login`. Sau khi đăng nhập thành công, điều hướng họ đến `/checkout`.
