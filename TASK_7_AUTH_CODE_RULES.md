# 📋 TASK 7 - AUTH (JWT) CODE RULES & GUIDELINES

**Task:** Đăng ký / Đăng nhập (JWT)  
**Sprint:** 2  
**Points:** 13  
**Phạm vi:** Backend + Frontend Auth flows

---

## I. PHẠM VỊ & ÁP DỤNG

**Áp dụng cho:** Tất cả 6 thành viên nhóm khi làm Task 7

**Người chịu trách nhiệm:**
- **Backend Lead (A1):** Đăng ký cấp code standards cho backend auth
- **Frontend Lead (B1):** Đăng ký cấp code standards cho frontend auth
- **A2, B2:** Implement theo standards
- **A3, B3:** Review + QA

**Thời gian:** Từ khi start Task 7 → Merge vào develop

---

## II. WORKING DIRECTORIES (THƯ MỤC LÀM VIỆC)

### Backend - CHỈ THAO TÁC CÁC THƯ MỤC NÀY

```
backend/src/auth/
├── auth.controller.ts        (Endpoints: register, login, logout)
├── auth.service.ts           (Business logic: encrypt, JWT token)
├── auth.module.ts            (Module setup)
├── dto/
│   ├── register.dto.ts       (Validation: email, password)
│   ├── login.dto.ts
│   └── auth-response.dto.ts  (Response format)
├── entities/
│   └── user.entity.ts        (User model - Prisma)
├── guards/
│   └── jwt.guard.ts          (JWT protection)
├── strategies/
│   └── jwt.strategy.ts       (Passport JWT strategy)
└── decorators/
    └── current-user.decorator.ts  (@CurrentUser() để lấy user từ token)

backend/prisma/
├── schema.prisma             (Database schema - User table)
└── migrations/
    └── 001_create_users/
        └── migration.sql
```

**CẤM thao tác trong:**
- ❌ `backend/src/app.module.ts` (chỉ lead add import)
- ❌ `backend/src/main.ts`
- ❌ `backend/package.json` (chỉ lead install dependencies)
- ❌ `backend/tsconfig.json`

---

### Frontend - CHỈ THAO TÁC CÁC THƯ MỤC NÀY

```
frontend/src/app/auth/
├── login/
│   └── page.tsx              (Login form page)
├── register/
│   └── page.tsx              (Register form page)
└── layout.tsx                (Shared auth layout)

frontend/src/api/
└── auth.ts                   (API calls: register(), login())

frontend/src/stores/
└── authStore.ts              (Zustand: token, user, login/logout)

frontend/src/hooks/
└── useAuth.ts                (Custom hook: check login status)
```

**CẤM thao tác trong:**
- ❌ `frontend/next.config.js`
- ❌ `frontend/tailwind.config.js`
- ❌ `frontend/tsconfig.json`
- ❌ `frontend/package.json`
- ❌ `frontend/src/app/layout.tsx` (global root layout)

---

## III. NAMING CONVENTION

### Backend (TypeScript + NestJS)

```typescript
// ✅ CONTROLLERS
auth.controller.ts
├── @Post('/register')
├── @Post('/login')
├── @Post('/logout')
└── @Get('/me')

// ✅ SERVICES
auth.service.ts
├── register(dto: RegisterDto): Promise<AuthResponseDto>
├── login(dto: LoginDto): Promise<{ accessToken: string }>
├── validateUser(email: string, password: string): Promise<User>
└── generateJwtToken(user: User): string

// ✅ DTOs (Data Transfer Objects)
register.dto.ts
├── email: string
├── password: string
└── confirmPassword: string

login.dto.ts
├── email: string
└── password: string

auth-response.dto.ts
├── id: string
├── email: string
├── accessToken: string
└── (NO password!)

// ✅ GUARDS
jwt.guard.ts
├── class JwtGuard implements CanActivate

// ✅ STRATEGIES
jwt.strategy.ts
├── class JwtStrategy extends PassportStrategy(Strategy)

// ✅ DECORATORS
current-user.decorator.ts
├── export const CurrentUser() => ...

// ✅ ENTITIES
user.entity.ts
├── id: string (uuid)
├── email: string (unique)
├── passwordHash: string (NEVER plain password!)
├── createdAt: Date
└── updatedAt: Date
```

### Frontend (React + TypeScript)

```typescript
// ✅ PAGES (PascalCase)
LoginPage
├── /src/app/auth/login/page.tsx
├── export default function LoginPage()

RegisterPage
├── /src/app/auth/register/page.tsx
├── export default function RegisterPage()

// ✅ HOOKS (camelCase + use prefix)
useAuth.ts
├── export const useAuth = () => {
│   return { user, isLoading, isLoggedIn, login, logout }
│ }

// ✅ STORES (camelCase)
authStore.ts
├── interface AuthStore {
│   user: User | null
│   accessToken: string | null
│   login: (token) => void
│   logout: () => void
│   isLoggedIn: () => boolean
│ }

// ✅ API FUNCTIONS (camelCase)
auth.ts
├── export const register = (email, password) => {}
├── export const login = (email, password) => {}
├── export const logout = () => {}

// ✅ COMPONENTS (PascalCase)
LoginForm.tsx
├── export default function LoginForm()
RegisterForm.tsx
├── export default function RegisterForm()
```

---

## IV. RESPONSE FORMAT (API CONTRACT)

### Success Response (200, 201)

```typescript
// POST /auth/register (201)
{
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "id": "uuid-here",
    "email": "user@example.com",
    "accessToken": "eyJhbGc..."  // JWT token
  }
}

// POST /auth/login (200)
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "id": "uuid-here",
    "email": "user@example.com",
    "accessToken": "eyJhbGc..."  // JWT token
  }
}

// GET /auth/me (Protected) (200)
{
  "statusCode": 200,
  "message": "User fetched successfully",
  "data": {
    "id": "uuid-here",
    "email": "user@example.com"
  }
}
```

### Error Response (400, 401, 409)

```typescript
// 400 - Validation Error
{
  "statusCode": 400,
  "message": "Email không hợp lệ",
  "error": "BAD_REQUEST",
  "details": {
    "email": "Email must be a valid email"
  }
}

// 409 - Email already exists
{
  "statusCode": 409,
  "message": "Email đã tồn tại",
  "error": "CONFLICT"
}

// 401 - Invalid credentials
{
  "statusCode": 401,
  "message": "Email hoặc mật khẩu không chính xác",
  "error": "UNAUTHORIZED"
}

// 401 - No JWT token
{
  "statusCode": 401,
  "message": "Unauthorized - No token provided",
  "error": "UNAUTHORIZED"
}
```

---

## V. STRICTLY PROHIBITED (CẤM TUYỆT ĐỐI)

### 🚫 Backend

```typescript
// ❌ CẤM: Plain text password trong database
User {
  email: string
  password: string  // ← SAI! Phải hash
}

// ✅ ĐÚNG:
User {
  email: string
  passwordHash: string  // Đã hash với bcrypt
}

// ❌ CẤM: Trả plain password trong response
{
  data: {
    id: "...",
    email: "...",
    password: "123456"  // ← SAI!
  }
}

// ✅ ĐÚNG: Không trả password
{
  data: {
    id: "...",
    email: "...",
    accessToken: "..."
  }
}

// ❌ CẤM: Validate password ở controller
@Post('/login')
login(@Body() dto: LoginDto) {
  // Tự validate? Sai!
  // Phải gọi service
}

// ✅ ĐÚNG:
@Post('/login')
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}

// ❌ CẤM: Hardcode JWT secret
const SECRET = "my-secret-123";

// ✅ ĐÚNG: Từ .env
const SECRET = process.env.JWT_SECRET;

// ❌ CẤM: Sửa package.json
// Để cài dependencies, chỉ chạy:
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt

// ❌ CẤM: Sửa tsconfig.json để fix TypeScript error
// Nếu type error → fix code, không fix config

// ❌ CẤM: Sửa app.module.ts tùy ý
// Lead sẽ add imports cho auth module
```

### 🚫 Frontend

```typescript
// ❌ CẤM: Lưu token ở localStorage không an toàn
localStorage.setItem('password', password);

// ✅ ĐÚNG: Lưu token (không password!)
localStorage.setItem('accessToken', token);

// ❌ CẤM: Gửi token qua URL
navigate(`/dashboard?token=${token}`);

// ✅ ĐÚNG: Gửi header Authorization
fetch('/api/me', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

// ❌ CẤM: Lưu password trong state/store
const [password, setPassword] = useState("");
authStore.setPassword(password);  // ← SAI!

// ✅ ĐÚNG: Chỉ lưu token, username/email
const authStore = {
  user: { id, email },  // OK
  accessToken: "..."     // OK
  // password? NO!
};

// ❌ CẤM: Sửa next.config.js
// Nếu cần config Next.js, hỏi lead trước

// ❌ CẤM: Sửa tailwind.config.js
// Chỉ viết CSS classes theo Tailwind có sẵn
```

---

## VI. GIT WORKFLOW (TASK 7)

### Branch Naming

```
feature/task-7-auth
feature/task-7-register-endpoint
feature/task-7-login-page
feature/task-7-jwt-guard
```

### Commit Message Format

```
[Task-7] [BE] Feat: Implement JWT strategy and guards
[Task-7] [BE] Feat: Create register endpoint with bcrypt
[Task-7] [BE] Feat: Create login endpoint with JWT token
[Task-7] [FE] UI: Create login page with form validation
[Task-7] [FE] Hook: Create useAuth hook for auth state
[Task-7] [BE] Fix: Add email validation in register DTO
[Task-7] [FE] Bug: Fix localStorage token persistence
```

### PR Process

1. **Push to feature branch:**
   ```bash
   git checkout -b feature/task-7-auth
   git add .
   git commit -m "[Task-7] [BE] Feat: ..."
   git push origin feature/task-7-auth
   ```

2. **Create PR on GitHub:**
   - Title: `[Task-7] Auth: Register & Login with JWT`
   - Description: Link to checklist, what changed, how to test

3. **Code Review:**
   - Lead (A1 for backend, B1 for frontend) reviews
   - Check: naming, response format, no passwords leaked, DTOs valid

4. **Merge to develop:**
   ```bash
   git checkout develop
   git pull origin develop
   git merge --squash feature/task-7-auth
   git commit -m "[Task-7] [FE/BE] Feat: Auth - Register & Login"
   git push origin develop
   ```

---

## VII. TYPESCRIPT STRICT TYPES

### Backend DTOs & Entities

```typescript
// ✅ Register DTO - Strict validation
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Password must contain letters and numbers'
  })
  password: string;

  @IsString()
  @Equals('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}

// ✅ Login DTO
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

// ✅ Auth Response DTO - NO password!
export class AuthResponseDto {
  id: string;
  email: string;
  accessToken: string;
  // NO password, NO passwordHash
}

// ✅ User Entity
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;  // Hashed! Not plain password

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
```

### Frontend Types

```typescript
// ✅ Auth types
export interface User {
  id: string;
  email: string;
  // NO password
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  statusCode: number;
  message: string;
  data: {
    id: string;
    email: string;
    accessToken: string;
  };
}

export interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}
```

---

## VIII. COMMON PITFALLS & FIXES

| Issue | ❌ SAI | ✅ ĐÚNG | Fix |
|-------|-------|--------|-----|
| Password storage | Plain text | Hash with bcrypt | Use `bcrypt.hash()` |
| API response | Includes password | Excludes password | Map to DTO before response |
| JWT secret | Hardcoded | From .env | `process.env.JWT_SECRET` |
| Token location | localStorage for password | localStorage for token only | Save token, not password |
| HTTP header | No Authorization | `Authorization: Bearer <token>` | Add interceptor |
| Validation | No validation | Class-validator DTOs | Use @IsEmail(), @MinLength() |
| Password confirm | Not compared | Matched with validator | Use @Equals() decorator |
| Error message | "Invalid credentials" | Generic message | Don't leak if email exists |
| Token expiry | No expiry | JWT with expiresIn | Set expiresIn in sign options |
| CORS | Restricted to wrong origin | Allow frontend origin | Check main.ts enableCors() |

---

## IX. DEPENDENCIES (Install Commands)

**Run on terminal, KHÔNG sửa package.json:**

```bash
# Backend Auth dependencies
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt

# Frontend: Zustand (state management) - nếu chưa cài
npm install zustand
```

**Check after install:**
```bash
npm list @nestjs/jwt
npm list bcrypt
npm list zustand
```

---

## X. TESTING CHECKLIST

### Backend Manual Test

```bash
# 1. Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test1234","confirmPassword":"Test1234"}'

# Expected: 201 with accessToken

# 2. Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Test1234"}'

# Expected: 200 with accessToken

# 3. Protected endpoint (GET /orders/me)
curl -X GET http://localhost:3001/api/v1/orders/me \
  -H "Authorization: Bearer <accessToken>"

# Expected: 200 with orders data
```

### Frontend Manual Test

```
1. Go to http://localhost:3000/auth/register
2. Enter: user@test.com, Test1234, confirm
3. Click Register
4. Check: token saved in localStorage
5. Redirect to /auth/login or home page
6. Try logout: localStorage cleared
7. Login page shows
8. Enter credentials → login
9. Check: token in localStorage
10. Redirect to menu/home
```

---

## XI. SIGN-OFF CHECKLIST

**Before submitting Task 7:**

```
Code Quality
□ No plain passwords in code
□ All passwords hashed with bcrypt
□ JWT tokens created correctly
□ DTOs have validation decorators
□ Guard protects routes

Security
□ .env file NEVER committed
□ JWT secret from environment
□ Password confirm validation
□ Token in Authorization header, not URL
□ CORS configured for frontend origin

Git
□ Branch: feature/task-7-auth
□ Commits follow format: [Task-7] [BE/FE] ...
□ PR created with description
□ Code reviewed by lead (A1/B1)

Frontend
□ Login/Register pages created
□ Form validation works
□ useAuth hook works
□ Token stored in localStorage (only!)
□ Logout clears storage
□ Redirect flows correct

Backend
□ /auth/register endpoint works (201)
□ /auth/login endpoint works (200)
□ /auth/logout endpoint works
□ GET /auth/me protected (requires token)
□ All responses follow format

Testing
□ Manual curl tests pass
□ Frontend form submission works
□ Token persists on page refresh
□ Logout works
□ Protected routes reject no-token requests
```

---

**Last Updated:** 23/09/2026  
**Version:** 1.0  
**Owner:** A1 (Backend Lead) + B1 (Frontend Lead)

---

**Questions? Ask lead before coding!** 💬

