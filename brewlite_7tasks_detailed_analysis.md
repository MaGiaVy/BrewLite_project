# PHÂN TÍCH CHI TIẾT 7 TASKS - BrewLite (Sprint 1 + Sprint 2)

**Dự án:** BrewLite  
**Giai đoạn:** Sprint 1 + Sprint 2 (ghép lại)  
**Tổng tasks:** 7  
**Tổng thời gian:** ~10-12 tuần (tùy velocity)  
**Nhóm:** 6 người

---

## NHÓM & PHÂN CÔNG

**Nhóm A (Cao cấp, kỹ năng mạnh):**
- **A1:** Tech Lead Backend
- **A2:** Backend Dev 
- **A3:** QA Lead & Diagram specialist

**Nhóm B (Trung bình, thực hiện theo spec):**
- **B1:** Frontend Lead
- **B2:** Frontend Dev
- **B3:** DevOps & Docs

---

## TASK 1: Khởi tạo dự án

**Sprint:** 1  
**Duration:** 3-5 ngày  
**Points:** 5

**Mô tả:**
Thiết lập toàn bộ infrastructure của dự án BrewLite. Bao gồm tạo monorepo structure, cấu hình git repository, setup linting/formatting tools, Docker environment, và README mô tả cách run project. Tất cả developers sẽ dùng cấu hình này làm foundation để bắt đầu code.

**Kỹ thuật cụ thể:**

*Frontend setup:*
Tạo Next.js project với `npx create-next-app@latest brewlite-web --typescript --tailwind`. Cấu hình TypeScript strict mode. Setup ESLint và Prettier với shared config. Cấu hình Zustand hoặc Context API cho state management. Thêm axios hoặc fetch wrapper để call backend API. Setup environment variables (.env.local, .env.example).

*Backend setup:*
Tạo NestJS project với `nest new brewlite-api`. Cấu hình TypeScript strict mode. Cấu hình Jest cho unit testing. Setup ESLint và Prettier. Cấu hình Prisma ORM hoặc TypeORM để kết nối PostgreSQL. Setup .env file cho database connection, JWT secret, etc. Cấu hình CORS để frontend có thể call backend API.

*DevOps setup:*
Tạo Docker images cho frontend, backend, postgres. Tạo docker-compose.yml để orchestrate các services. Setup initial seed data script cho database. Tạo .dockerignore files.

*Git & CI/CD:*
Khởi tạo git repository, setup branch naming convention (main/develop/feature). Cấu hình GitHub/GitLab CI/CD pipeline cơ bản nếu cần. Thêm .gitignore file cho project.

*Documentation:*
Tạo README.md chi tiết hướng dẫn: cách clone project, cài dependencies, chạy frontend/backend/postgres, chạy seeding data, common commands, troubleshooting.

**Subtasks:**

Task 1.1 - Monorepo structure: A1 & B3 tạo folder structure (frontend/, backend/, docker/, docs/). Task 1.2 - Frontend scaffolding: B1 setup Next.js project cơ bản. Task 1.3 - Backend scaffolding: A1 setup NestJS project cơ bản. Task 1.4 - Database & Prisma: A1 setup PostgreSQL schema, Prisma config, migrations. Task 1.5 - Docker setup: B3 tạo Dockerfile cho frontend/backend, docker-compose.yml. Task 1.6 - Git & CI setup: B3 init git repo, setup basic GitHub Actions/GitLab CI. Task 1.7 - README & docs: B3 viết documentation chi tiết.

**Assigned to:**
- **A1 (Tech Lead Backend):** Lead task này, setup backend infrastructure, database/Prisma, xác nhận architecture decisions. ~15h
- **B1 (Frontend Lead):** Setup frontend infrastructure, Next.js config, state management foundation. ~12h
- **B3 (DevOps & Docs):** Lead Docker setup, git config, CI/CD pipeline, README/documentation. ~16h

**Dependencies:** None (first task)

**Risk:**
Setup environment issues (Docker not installed, Node version conflicts, database connection issues). Mitigation: Clear documentation, provide docker-compose troubleshooting guide.

**Definition of Done:**
- All team members có thể clone repo, chạy `docker-compose up`, frontend + backend + database chạy bình thường trên localhost
- Có seed script tạo 10+ products mẫu trong database
- README chi tiết với hướng dẫn setup & common commands

---

## TASK 2: API GET /products - Lấy danh sách sản phẩm

**Sprint:** 1  
**Duration:** 3-4 ngày  
**Points:** 5

**Mô tả:**
Tạo endpoint backend GET /api/products để lấy danh sách tất cả sản phẩm cà phê. Endpoint này sẽ được gọi từ trang Menu Frontend để hiển thị danh sách cà phê cho khách hàng. Backend cần định nghĩa database schema cho Product entity, implement API endpoint, thêm pagination/filtering, setup basic error handling.

**Kỹ thuật cụ thể:**

*Database Schema:*
Tạo Product table với columns: id (UUID primary key), name (varchar), description (text), basePrice (decimal), imageUrl (varchar), categoryId (foreign key), createdAt (timestamp), updatedAt (timestamp). Tạo Category table nếu cần (để organize products).

*NestJS Implementation:*
Tạo product.entity.ts định nghĩa Product class với Prisma schema. Tạo product.service.ts với method findAll() để query tất cả products từ database. Tạo product.controller.ts với endpoint GET /api/products. Implement pagination (page, limit query params), filtering (category, search). Thêm basic error handling (try-catch, custom exceptions).

*API Response:*
Trả về JSON array của products:
```json
{
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Cappuccino",
      "description": "...",
      "basePrice": 45000,
      "imageUrl": "...",
      "category": "Coffee"
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

*Database seed:*
Tạo seed script thêm 10-15 products mẫu vào database (Cappuccino, Latte, Espresso, Iced Coffee, Green Tea, Bubble Tea, etc.) với hình ảnh placeholder URL và description.

*Testing:*
Viết unit test cho ProductService, test các edge cases (empty database, pagination out of range, etc.).

**Subtasks:**

Task 2.1 - Product schema & database: A1 define Prisma schema, run migrations. Task 2.2 - ProductService: A1 implement findAll() method, pagination logic. Task 2.3 - ProductController & API: A1 implement GET /api/products endpoint. Task 2.4 - Seed data: A2 script thêm 10+ products. Task 2.5 - Unit tests: A2 test ProductService & controller. Task 2.6 - API documentation: A1 document endpoint (request/response format, error codes).

**Assigned to:**
- **A1 (Tech Lead Backend):** Lead task, design schema, implement service/controller, API docs. ~12h
- **A2 (Backend Dev):** Seed data script, unit testing, edge cases. ~8h

**Dependencies:** Task 1 (project setup phải xong)

**Risk:**
Database connection issues, migration failures. Mitigation: Test migrations locally, have rollback script.

**Definition of Done:**
- GET /api/products endpoint hoạt động, return 10+ products
- Pagination works (page, limit params)
- Database seed script chạy thành công
- Unit tests pass (test service & controller)
- API documentation updated

---

## TASK 3: Trang Menu Frontend - Hiển thị danh sách sản phẩm

**Sprint:** 1  
**Duration:** 3-4 ngày  
**Points:** 5

**Mô tả:**
Tạo trang Menu Frontend (Next.js) để hiển thị danh sách sản phẩm cà phê từ backend API. Trang này sẽ fetch danh sách từ GET /api/products, hiển thị trong grid layout 2 cột (mobile) / 3-4 cột (desktop), mỗi product card hiển thị hình ảnh, tên, giá. Khách hàng có thể click vào product card để xem chi tiết (navigate sang Task 4). Trang cần responsive design, loading states, error handling.

**Kỹ thuật cụ thể:**

*Next.js Page:*
Tạo pages/menu.tsx hoặc app/menu/page.tsx (tùy Next.js version). Fetch products từ backend API (GET /api/products) khi component mount. Sử dụng useEffect + useState hoặc getServerSideProps để fetch data.

*State Management:*
Store products list trong Zustand store hoặc Context API. Store cart badge count (number of items in cart).

*UI Components:*
Tạo ProductCard component hiển thị: product image (square, 1:1 aspect ratio), product name, base price. Responsive grid: 2 columns trên mobile (<768px), 3 columns trên tablet (768px-1024px), 4 columns trên desktop (>1024px). Dùng TailwindCSS cho styling (brown + white theme).

*Interactions:*
Click ProductCard → navigate sang pages/product/[id].tsx (Task 4). Click cart icon → navigate sang pages/cart.tsx (Task 5). Lazy load images (next/image component).

*Loading & Error States:*
Skeleton loaders khi fetching products. Error message nếu API call fail. Retry button nếu error.

*Header:*
BrewLite logo, "Menu" title, cart badge icon (🛒 2 = 2 items in cart). Header sticky/fixed.

**Subtasks:**

Task 3.1 - Setup Next.js page structure: B1 tạo pages/menu.tsx. Task 3.2 - Fetch products from API: B1 setup API call, error handling. Task 3.3 - ProductCard component: B2 tạo reusable ProductCard. Task 3.4 - Grid layout & responsive: B2 TailwindCSS grid, responsive breakpoints. Task 3.5 - Loading/error states: B2 skeleton loaders, error UI. Task 3.6 - Navigation & interactions: B1 setup routing, click handlers. Task 3.7 - Styling (brown+white theme): B2 TailwindCSS styling.

**Assigned to:**
- **B1 (Frontend Lead):** Lead task, setup page structure, API integration, routing. ~14h
- **B2 (Frontend Dev):** Build ProductCard component, responsive grid, loading states, styling. ~12h

**Dependencies:** Task 1 (setup), Task 2 (API ready)

**Risk:**
API not ready when frontend developer starts. Mitigation: Use mock data initially, switch to real API later.

**Definition of Done:**
- Menu page loads, displays 10+ products in responsive grid
- Product cards clickable (navigate to detail page)
- Loading skeleton shows while fetching
- Error message & retry button if API fails
- Responsive on mobile/tablet/desktop
- Cart badge shows correct count

---

## TASK 4: Trang Chi tiết sản phẩm - Chọn size + đường đá + số lượng

**Sprint:** 1  
**Duration:** 4-5 ngày  
**Points:** 8

**Mô tả:**
Tạo trang Product Detail Frontend (Next.js) cho phép khách hàng xem chi tiết sản phẩm và chọn tuỳ chọn: size (S/M/L), đường đá (Có/Không), số lượng. Giá sẽ được tính toán realtime dựa trên lựa chọn. Khách hàng có thể thêm sản phẩm vào giỏ hàng. Trang cần responsive design, price calculation logic, state management.

**Kỹ thuật cụ thể:**

*API Integration:*
Trang này cần fetch product detail từ backend, có thể reuse GET /api/products/:id endpoint (A1 sẽ implement). Nhận product ID từ URL params (pages/product/[id].tsx).

*State Management:*
Dùng useState để manage: selectedSize (S/M/L, default M), sugarOption (true/false, default true), quantity (default 1), calculatedPrice. Khi size hoặc sugar thay đổi, recalculate giá realtime.

*Price Calculation:*
basePrice từ API, cộng markup tùy size (S: -2k, M: 0, L: +3k), thêm extras nếu có. Công thức: (basePrice + sizeMarkup) × quantity = totalPrice.

*UI Components:*
Tạo SizeSelector component (3 nút: S/M/L, highlight selected). Tạo SugarToggle component (2 nút: Có đường/Không đường). Tạo QuantitySelector component ([−] qty [+]). Display product info (image, name, description, base price). Display calculated price realtime. "Thêm vào giỏ" button (CTA, brown).

*Add to Cart:*
Khi click "Thêm vào giỏ", tạo CartItem object: {productId, size, sugar, quantity, price}. Thêm vào Zustand store hoặc Context API. Show toast notification "✅ Đã thêm [name] vào giỏ". Stay on current page (không redirect).

*Navigation:*
Back button quay Menu. "Xem giỏ hàng" button → navigate to Cart. "Tiếp tục mua sắm" button → quay Menu.

**Subtasks:**

Task 4.1 - Setup product detail page & fetch API: B1. Task 4.2 - Size selector component: B2. Task 4.3 - Sugar toggle component: B2. Task 4.4 - Quantity selector component: B2. Task 4.5 - Price calculation logic: B1. Task 4.6 - Add to cart logic & Zustand integration: B1. Task 4.7 - Styling & responsive: B2. Task 4.8 - Error handling & loading states: B2.

**Assigned to:**
- **B1 (Frontend Lead):** Lead task, page structure, API fetch, price calculation, add-to-cart logic. ~16h
- **B2 (Frontend Dev):** Build all UI components (SizeSelector, SugarToggle, QuantitySelector), styling, responsive. ~14h

**Dependencies:** Task 1, Task 2 (API /products/:id), Task 3 (navigation from Menu)

**Risk:**
Price calculation logic errors, state management complexity. Mitigation: Test thoroughly with different size/sugar combinations.

**Definition of Done:**
- Product detail page loads với info từ API
- Size/sugar/quantity selectors hoạt động
- Price cập nhật realtime
- "Thêm vào giỏ" button adds item to cart + shows toast
- Cart badge updates
- Responsive on all devices

---

## TASK 5: Giỏ hàng - Cart, state management, edit/remove

**Sprint:** 2  
**Duration:** 4-5 ngày  
**Points:** 8

**Mô tả:**
Tạo trang Cart Frontend (Next.js) để hiển thị tất cả sản phẩm mà khách hàng đã thêm vào giỏ. Trang cần hiển thị danh sách items chi tiết (tên, size, sugar, qty, giá), cho phép khách hàng sửa hoặc xóa items, tính toán tổng giá, navigate sang Checkout. State của cart phải được persist (localStorage hoặc Zustand).

**Kỹ thuật cụ thể:**

*State Management (Critical):*
Dùng Zustand để create cart store với actions: addItem(), removeItem(), updateItem(), clearCart(), getCartTotal(). Persist cart to localStorage để khi user refresh page, cart vẫn giữ. Store structure:
```typescript
type CartItem = {
  id: string; // unique ID cho mỗi line item
  productId: string;
  name: string;
  size: 'S' | 'M' | 'L';
  sugar: boolean;
  quantity: number;
  price: number; // price per unit
  totalPrice: number; // quantity * price
};
```

*UI Layout:*
Header: Back button, "Giỏ hàng" title. Cart items list: Mỗi item hiển thị product info (name, size, sugar), quantity với [−] & [+] buttons, price (qty × price = total), [✎ Sửa] [✕ Xóa] buttons. Cart summary: Tổng tiền tất cả items. Action buttons: [← Tiếp tục mua sắm] [Thanh toán]. Empty state: "Giỏ hàng trống" message + button quay Menu.

*Edit Item:*
Click [✎ Sửa] trên item → navigate sang Product Detail page (Task 4) với dữ liệu item đó pre-loaded (size, sugar, qty). Khi user update và click "Cập nhật giỏ" thay vì "Thêm vào giỏ", item được update trong cart (quantity, price) thay vì thêm item mới.

*Remove Item:*
Click [✕ Xóa] → show confirmation modal "Bạn chắc chắn muốn xóa Cappuccino khỏi giỏ không?" → Delete nếu confirm → update Zustand store → show toast. Tổng tiền auto recalculate.

*Quantity Adjustment:*
Trên cart page, click [−] hoặc [+] để thay đổi qty trực tiếp → realtime update price → update Zustand store.

*Persist Cart:*
Zustand middleware persist cart to localStorage. Khi page reload, cart restore từ localStorage. Có middleware xử lý hydration (client-side only).

**Subtasks:**

Task 5.1 - Setup Zustand cart store & localStorage persist: B1. Task 5.2 - Cart page layout & item list UI: B2. Task 5.3 - Edit item functionality: B1 (link to Task 4 logic). Task 5.4 - Remove item & confirmation modal: B2. Task 5.5 - Cart summary & price calculation: B1. Task 5.6 - Empty state & responsive: B2. Task 5.7 - Styling (brown+white theme): B2.

**Assigned to:**
- **B1 (Frontend Lead):** Lead task, setup Zustand store, localStorage persist, edit logic, price summary. ~16h
- **B2 (Frontend Dev):** Build cart UI components, remove logic, quantity adjustment, styling. ~14h

**Dependencies:** Task 1, Task 3 (Menu), Task 4 (Product Detail), possibly Task 3 (cart badge integration)

**Risk:**
localStorage issues (quota, security), state management bugs (items disappearing after refresh). Mitigation: Test localStorage thoroughly, hydration logic.

**Definition of Done:**
- Cart page displays all added items correctly
- Edit & remove items work
- Quantity adjust works (qty [−] [+])
- Price recalculate on every change
- Cart persist to localStorage
- Empty state shown when cart empty
- Responsive design

---

## TASK 6: API POST /orders - Tạo đơn hàng

**Sprint:** 2  
**Duration:** 4-5 ngày  
**Points:** 8

**Mô tả:**
Tạo endpoint backend POST /api/orders để khách hàng có thể tạo đơn hàng mới. Endpoint sẽ nhận danh sách items từ frontend (cart), validate dữ liệu, tính toán tổng giá, tạo Order record trong database (với status PENDING), tạo OrderItem records cho mỗi product. Endpoint cũng cần implement Order State Machine logic (PENDING → PAID → PREPARING → READY → COMPLETED). Error handling cho các trường hợp: stock hết, invalid data.

**Kỹ thuật cụ thể:**

*Database Schema:*
Tạo Order table: id (UUID), userId (nullable, khách hàng chưa login), status (PENDING/PAID/PAYMENT_FAILED/PREPARING/READY/COMPLETED), totalPrice (decimal), paymentMethod (string), createdAt, updatedAt, completedAt (nullable). Tạo OrderItem table: id (UUID), orderId (FK), productId (FK), quantity (int), price (decimal, giá tại thời điểm order), sizeSelected (S/M/L), sugarSelected (boolean).

*API Request Format:*
POST /api/orders
Body:
```json
{
  "items": [
    { "productId": "uuid1", "quantity": 2, "size": "M", "sugar": true, "price": 47000 },
    { "productId": "uuid2", "quantity": 1, "size": "L", "sugar": false, "price": 35000 }
  ],
  "paymentMethod": "wallet", // hoặc "credit_card", "cod"
  "customerPhone": "+84912345678", // optional
  "customerNote": "..." // optional
}
```

*NestJS Implementation:*
Tạo order.entity.ts, order-item.entity.ts (Prisma schema). Tạo order.service.ts với method createOrder(items, paymentMethod). Validate: mỗi item có productId, quantity > 0. Check stock (mỗi product có quantity field, validate đủ stock để order). Calculate totalPrice từ items. Create Order record với status PENDING. Create OrderItem records cho mỗi item. Return Order object với generated Order ID. Error handling: ProductNotFound, InsufficientStock, ValidationError.

*State Machine:*
Order được tạo với status PENDING. Khi payment thành công (Task 8), status → PAID. Barista pha chế, status → PREPARING (qua separate API, admin use). Khi ready, status → READY. Khi customer lấy, status → COMPLETED.

*Idempotency (Optional):*
Để avoid double-charge khi user retry request, implement idempotency key logic. Frontend send X-Idempotency-Key header, backend check nếu đã process request này trước.

**Subtasks:**

Task 6.1 - Order & OrderItem schema: A1. Task 6.2 - OrderService create/validation logic: A1. Task 6.3 - OrderController POST /api/orders endpoint: A1. Task 6.4 - Stock validation: A2. Task 6.5 - State machine constants & transitions: A1. Task 6.6 - Error handling & custom exceptions: A1. Task 6.7 - Unit tests: A2.

**Assigned to:**
- **A1 (Tech Lead Backend):** Lead task, schema design, service implementation, state machine, error handling, API docs. ~18h
- **A2 (Backend Dev):** Stock validation, edge cases, unit testing. ~10h

**Dependencies:** Task 1, Task 2 (Product entity)

**Risk:**
Race condition (multiple orders with same stock simultaneously), data inconsistency. Mitigation: Database transactions, locking mechanism.

**Definition of Done:**
- POST /api/orders endpoint hoạt động
- Order & OrderItem records tạo trong database
- Status set to PENDING
- Stock validation works
- Error handling for edge cases (out of stock, invalid data)
- Idempotency implemented (optional)
- Unit tests pass

---

## TASK 7: Authentication - JWT, register/login

**Sprint:** 2  
**Duration:** 5-6 ngày  
**Points:** 13 (lớn nhất vì liên quan 2 sides)

**Mô tả:**
Implement authentication system backend & frontend. Backend: Tạo endpoints POST /api/auth/register (tạo user mới với email/password hash), POST /api/auth/login (verify credentials, return JWT token). Tạo JWT guard để protect endpoints (orders, user profile). Frontend: Tạo Register & Login pages, handle login/logout logic, store JWT token (localStorage hoặc HTTP-only cookie), attach token vào requests, redirect based on auth state.

**Kỹ thuật cụ thể:**

*Backend - User Entity & Schema:*
Tạo User table: id (UUID), email (unique), password (hashed với bcrypt), firstName (nullable), lastName (nullable), phone (nullable), createdAt, updatedAt. Link Order → User (userId field).

*Backend - Auth Service:*
Tạo auth.service.ts: register(email, password) → hash password với bcrypt (bcryptjs), tạo User record. login(email, password) → verify email exists, compare password với bcrypt, generate JWT token (HS256, secret from env). JWT payload: {sub: userId, email}. Token expiry: 24h (hoặc tuỳ config).

*Backend - JWT Strategy (Passport.js):*
Setup Passport JWT strategy. Config: secretOrKey từ env variable. Extract token từ Authorization header (Bearer <token>). Validate token, return user object.

*Backend - Auth Controller:*
POST /api/auth/register: Nhận email, password. Validate (email format, password length ≥ 8). Hash password bcrypt. Create user. Return {statusCode: 201, message: "User registered", data: {id, email}}.
POST /api/auth/login: Nhận email, password. Verify. Return {statusCode: 200, data: {accessToken: "<jwt>", user: {id, email}}}.
POST /api/auth/logout: Clear token (client-side, token stored in localStorage).

*Backend - JWT Guard:*
Tạo jwt.guard.ts - NestJS Guard để protect routes. Thêm @UseGuards(JwtAuthGuard) trên endpoints cần auth (orders, user profile).

*Frontend - Register Page:*
Tạo pages/register.tsx. Form fields: email input, password input, confirm password input. Validation: email format, password ≥ 8 chars, password match. Button: [Tạo tài khoản]. On submit: POST /api/auth/register → if success, show toast & navigate to login. If error, show error message.

*Frontend - Login Page:*
Tạo pages/login.tsx. Form fields: email input, password input. Button: [Đăng nhập]. On submit: POST /api/auth/login → if success, store token (localStorage or cookie), store user info (Zustand), redirect to dashboard/menu. If error, show error message.

*Frontend - Auth Context / Store:*
Tạo Zustand auth store: isAuthenticated, user, token. Actions: login(email, password), logout(), register(email, password). Persist to localStorage.

*Frontend - HTTP Interceptor:*
Setup axios interceptor hoặc fetch wrapper để auto-attach JWT token vào Authorization header (Authorization: Bearer <token>) cho mọi requests ke backend.

*Frontend - Protected Routes:*
Tạo PrivateRoute component (wrapper) để protect pages (orders, user profile). Nếu chưa login → redirect to login page.

*Frontend - Login After Payment (Task 5 integration):*
Ở trang Confirmation (sau thanh toán), show prompt "Bạn muốn đăng ký không?" → [Đăng ký ngay] [Bỏ qua]. If [Đăng ký], navigate to Register page.

**Subtasks:**

Backend:
- Task 7.1 - User schema & database: A1
- Task 7.2 - Auth service (register/login logic, bcrypt): A2
- Task 7.3 - Passport JWT strategy setup: A1
- Task 7.4 - Auth controller (endpoints): A1
- Task 7.5 - JWT guard & protection: A1
- Task 7.6 - Validation & error handling: A2
- Task 7.7 - Unit tests: A2

Frontend:
- Task 7.8 - Zustand auth store & localStorage persist: B1
- Task 7.9 - Register page & form: B2
- Task 7.10 - Login page & form: B2
- Task 7.11 - HTTP interceptor (JWT attach): B1
- Task 7.12 - Protected routes wrapper: B1
- Task 7.13 - Logout logic & redirect: B1
- Task 7.14 - Integrate with Task 5 (login after payment): B1
- Task 7.15 - Styling: B2

**Assigned to:**
- **A1 (Tech Lead Backend):** Lead auth task, user schema, passport strategy, JWT guard, auth controller. ~20h
- **A2 (Backend Dev):** Auth service (bcrypt, JWT generation), validation, testing. ~12h
- **B1 (Frontend Lead):** Auth store (Zustand), HTTP interceptor, protected routes, logout, integration with checkout flow. ~16h
- **B2 (Frontend Dev):** Register & login pages, form handling, styling, validation UI. ~14h

**Dependencies:** Task 1, Task 5 (Checkout flow), Task 6 (User auth API)

**Risk:**
Security issues (JWT exposed, bcrypt misconfiguration, CORS issues), token expiry/refresh logic. Mitigation: Use environment variables, HTTP-only cookies if possible, implement token refresh (optional for v1), security review.

**Definition of Done:**
- POST /api/auth/register endpoint works (user created with hashed password)
- POST /api/auth/login endpoint works (JWT generated & returned)
- JWT token stored securely (localStorage for now, HTTP-only cookie ideally)
- JWT attached to all API requests automatically
- Protected endpoints check JWT guard
- Register page functional
- Login page functional
- Logout clears token & redirects
- "Login after payment" flow in checkout
- Validation on both frontend & backend
- Unit tests pass
- No console errors / security issues

---

## TỔNG QUAN & TIMELINE

**7 tasks chính (Sprint 1 + 2):**

| Task | Tên | Duration | Points | Lead | Support |
|------|-----|----------|--------|------|---------|
| 1 | Khởi tạo dự án | 3-5d | 5 | A1 | B1, B3 |
| 2 | API GET /products | 3-4d | 5 | A1 | A2 |
| 3 | Menu Page | 3-4d | 5 | B1 | B2 |
| 4 | Product Detail | 4-5d | 8 | B1 | B2 |
| 5 | Cart & State | 4-5d | 8 | B1 | B2 |
| 6 | API POST /orders | 4-5d | 8 | A1 | A2 |
| 7 | Auth (JWT) | 5-6d | 13 | A1, B1 | A2, B2 |

**Tổng:** ~30-35 ngày làm việc, ~52 story points

**Timeline (nếu 5 ngày/tuần, 8h/ngày):**
- Week 1: Task 1 (setup) + start Task 2, 3, 4
- Week 2: Complete Task 2, 3, 4 + start Task 5, 6
- Week 3: Complete Task 5, 6 + start Task 7
- Week 4: Complete Task 7 + integration testing

**Phân chia theo người (estimate):**

- **A1 (Tech Lead):** Task 1, 2, 6, 7 (lead) → ~65h
- **A2 (Backend Dev):** Task 2, 6, 7 (support) → ~30h
- **A3 (QA):** QA testing tất cả tasks (não included ở đây, riêng Sprint 3)
- **B1 (Frontend Lead):** Task 1, 3, 4, 5, 7 (lead) → ~72h
- **B2 (Frontend Dev):** Task 3, 4, 5, 7 (support) → ~54h
- **B3 (DevOps):** Task 1 (lead) → ~16h

---

## DEPENDENCIES & CRITICAL PATH

**Critical Path:** Task 1 → Task 2 & Task 3 → Task 4 → Task 5 → Task 6 & Task 7 (parallel)

Task 1 phải xong trước tất cả. Task 2 (API) & Task 3 (Menu) có thể song song. Task 4 depend Task 2 & 3. Task 5 depend Task 3 & 4. Task 6 & 7 có thể parallel nhưng Task 7 (auth) cần được done để integrate login-after-payment flow ở Task 5.

**Risk & Mitigation:**
- API delays → Use mock data on frontend first
- Database issues → Test migrations, have rollback scripts
- State management bugs → Thorough testing, code review
- Auth security → Code review by senior, external security check
- Integration issues → Daily standup, clear API contracts

---

**END OF TASK ANALYSIS**

