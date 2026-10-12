# TÀI LIỆU ĐẶC TẢ KỸ THUẬT (TECHNICAL SPECIFICATION)
## Dự án: BrewLite — Nền Tảng Đặt & Thanh Toán Cà Phê Không Tiền Mặt

**Môn học:** Công nghệ Phần mềm — Trường Đại học Sài Gòn (SGU)  
**Phiên bản:** 1.0 (Chính thức)  
**Ngày lập:** Tháng 10, 2026  
**Căn cứ tài liệu:** `BrewLite-CongNghePhanMem.md` (Đề bài Giảng viên), `BrewLite_SRS_Final.md` v4.0, `DESIGN.md`, `Seed (1).md`.

---

## MỤC LỤC
1. [Kiến trúc hệ thống & Hạ tầng (System Architecture)](#1-kiến-trúc-hệ-thống--hạ-tầng)
2. [Mô hình CSDL & Quan hệ thực thể (Database Schema & ERD)](#2-mô-hình-csdl--quan-hệ-thực-thể)
3. [Danh sách API & Hợp đồng giao tiếp (API Specifications & Contracts)](#3-danh-sách-api--hợp-đồng-giao-tiếp)
4. [Logic nghiệp vụ nâng cao (Business Logic & Concurrency Control)](#4-logic-nghiệp-vụ-nâng-cao)
5. [Dữ liệu khởi tạo (Data Seed Specification)](#5-dữ-liệu-khởi-tạo-data-seed)
6. [Chiến lược kiểm thử tự động (Testing Strategy)](#6-chiến-lược-kiểm-thử-tự-động)

---

## 1. KIẾN TRÚC HỆ THỐNG & HẠ TẦNG

### 1.1. Công nghệ sử dụng (Technology Stack)
* **Frontend:**
  - Framework: Next.js 16 (App Router), React 19, TypeScript.
  - Styling: Tailwind CSS v4, Font kép (*Playfair Display* cho tiêu đề/giá, *Inter* cho UI).
  - State Management: Zustand 5 (Client Store + `persist` middleware lưu `localStorage`).
  - HTTP Client: Axios với Request/Response Interceptor tự động gán Bearer Token.
* **Backend:**
  - Framework: NestJS 11+ (TypeScript, Module Resolution `nodenext`, ESM imports `.js`).
  - Validation: `class-validator`, `class-transformer` với `ValidationPipe` toàn cục.
  - Authentication: Passport JWT, `bcrypt` (10 salt rounds).
  - ORM: Prisma ORM 6.19.3.
* **Database:** PostgreSQL 16 (Chạy trên cổng 5432).
* **Kiểm thử tự động:** Jest Framework.
* **DevOps:** Docker Compose (Quản lý 3 dịch vụ: `postgres`, `backend`, `frontend`).

### 1.2. Sơ đồ kiến trúc phân tầng (Layered Architecture)

```mermaid
flowchart TD
    Client["Trình duyệt Client<br/>(Desktop / Mobile)"]
    
    subgraph FrontendApp ["Frontend (Next.js - Port 3000)"]
        Pages["App Router Pages<br/>(/, /cart, /checkout, /orders)"]
        Stores["Zustand Stores<br/>(cartStore, authStore)"]
        AxiosClient["Axios Client Interceptors<br/>(Auto Bearer JWT, Idempotency-Key)"]
    end
    
    subgraph BackendApp ["Backend (NestJS - Port 3001)"]
        Controllers["Controllers Layer<br/>(Products, Auth, Orders, Payments, Vouchers)"]
        Guards["Guards & Decorators<br/>(JwtAuthGuard, @CurrentUser)"]
        Services["Services Layer<br/>(ProductsService, OrdersService, PaymentsService, AuthService)"]
        StateMachine["Order State Machine Engine<br/>(assertTransition validation)"]
        PrismaService["Prisma ORM Layer<br/>(PrismaClient wrapper)"]
    end
    
    subgraph DatabaseLayer ["Database (PostgreSQL - Port 5432)"]
        PostgresDB[("PostgreSQL 16 DB<br/>(Tables: users, products, toppings, vouchers, orders, payments)")]
    end

    Client -->|HTTP / React SSR| Pages
    Pages --> Stores
    Pages --> AxiosClient
    AxiosClient -->|REST API Requests| Controllers
    Controllers --> Guards
    Controllers --> Services
    Services --> StateMachine
    Services --> PrismaService
    PrismaService -->|SQL Queries / ACID Transactions| PostgresDB
```

### 1.3. Cấu hình Docker Compose (`docker-compose.yml`)

Hệ thống được đóng gói hoàn chỉnh bằng Docker Compose phục vụ chạy 1 lệnh duy nhất khi nghiệm thu (`Task 9`):

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: brewlite-postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
      POSTGRES_DB: brewlite
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: brewlite-backend
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      PORT: 3001
      DATABASE_URL: postgresql://postgres:password123@postgres:5432/brewlite?schema=public
      JWT_SECRET: BrewLiteSecretKey2026SuperSecureKey
      NODE_ENV: production
    ports:
      - "3001:3001"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: brewlite-frontend
    restart: always
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
      PORT: 3000
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

---

## 2. MÔ HÌNH CSDL & QUAN HỆ THỰC THỂ

### 2.1. Sơ đồ thực thể (Entity Relationship Diagram)

```mermaid
erDiagram
    User ||--o{ Order : "places"
    Order ||--|{ OrderItem : "contains"
    Product ||--o{ OrderItem : "is ordered in"
    Order ||--o| Voucher : "applies"
    Order ||--o| Payment : "settled by"
    OrderItem ||--o{ OrderItemTopping : "customized with"
    Topping ||--o{ OrderItemTopping : "referenced in"

    User {
        string id PK "UUID"
        string email UK "Unique"
        string passwordHash "bcrypt"
        int loyaltyPoints "default: 0"
        datetime createdAt
        datetime updatedAt
    }

    Product {
        string id PK "UUID"
        string name "Tên món"
        string category "COFFEE_VN, ESPRESSO, TEA"
        int price "Giá gốc size S (VNĐ)"
        int stock "Số lượng tồn kho"
        string imageUrl "URL hình ảnh"
        string description "Mô tả sản phẩm"
        int version "Optimistic Locking"
        datetime createdAt
        datetime updatedAt
    }

    Topping {
        string id PK "UUID"
        string name "Tên topping"
        int price "Đơn giá (VNĐ)"
        boolean isAvailable "default: true"
    }

    Voucher {
        string id PK "UUID"
        string code UK "Mã giảm giá"
        string discountType "PERCENT | FIXED"
        int discountValue "Giá trị giảm"
        int minOrderValue "Đơn tối thiểu (VNĐ)"
        int maxDiscount "Mức giảm tối đa (VNĐ)"
        int usageLimit "Giới hạn lượt dùng"
        int usedCount "Số lượt đã dùng"
        datetime expiresAt
    }

    Order {
        string id PK "UUID (#1042...)"
        string userId FK "Tham chiếu User"
        string voucherId FK "Tham chiếu Voucher (nullable)"
        string status "PENDING, PAID, CANCELLED..."
        int total "Tổng tiền trước giảm (VNĐ)"
        int discountAmount "Số tiền giảm (VNĐ)"
        int finalTotal "Số tiền thực trả (VNĐ)"
        string paymentMethod "WALLET | CARD"
        string idempotencyKey "Chống trùng lặp"
        datetime createdAt
        datetime updatedAt
    }

    OrderItem {
        string id PK "UUID"
        string orderId FK "Tham chiếu Order"
        string productId FK "Tham chiếu Product"
        string size "S, M, L"
        string ice "100% Đá, 70% Đá..."
        string sugar "Chuẩn Ngọt, 70%..."
        int quantity "Số lượng (1-20)"
        int priceAtPurchase "Snapshot đơn giá ly"
        int lineTotal "Snapshot tổng tiền dòng"
    }

    OrderItemTopping {
        string id PK "UUID"
        string orderItemId FK "Tham chiếu OrderItem"
        string toppingId FK "Tham chiếu Topping"
        string toppingName "Snapshot tên topping"
        int toppingPrice "Snapshot giá topping"
    }

    Payment {
        string id PK "UUID"
        string orderId FK "Tham chiếu Order"
        string idempotencyKey UK "Unique chống lặp"
        int amount "Số tiền thanh toán (VNĐ)"
        string method "WALLET | CARD"
        string status "SUCCESS | FAILURE"
        datetime createdAt
    }
```

### 2.2. Chi tiết Định nghĩa Schema Prisma (`backend/prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 1. NGƯỜI DÙNG (User)
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  loyaltyPoints Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  orders        Order[]

  @@map("users")
}

// 2. SẢN PHẨM (Product)
model Product {
  id          String   @id @default(uuid())
  name        String
  category    String   // COFFEE_VN, ESPRESSO, TEA
  price       Int      // Giá gốc size S (VNĐ)
  stock       Int      @default(0)
  imageUrl    String
  description String
  version     Int      @default(0) // Optimistic Locking Version
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  orderItems  OrderItem[]

  @@map("products")
}

// 3. TOPPING DÙNG CHUNG
model Topping {
  id          String   @id @default(uuid())
  name        String
  price       Int      // Giá topping (VNĐ)
  isAvailable Boolean  @default(true)

  orderItemToppings OrderItemTopping[]

  @@map("toppings")
}

// 4. MÃ GIẢM GIÁ (Voucher)
enum DiscountType {
  PERCENT
  FIXED
}

model Voucher {
  id            String       @id @default(uuid())
  code          String       @unique
  discountType  DiscountType
  discountValue Int
  minOrderValue Int          @default(0)
  maxDiscount   Int          @default(0)
  usageLimit    Int          @default(100)
  usedCount     Int          @default(0)
  expiresAt     DateTime?
  createdAt     DateTime     @default(now())

  orders        Order[]

  @@map("vouchers")
}

// 5. ĐƠN HÀNG (Order)
enum OrderStatus {
  PENDING
  PAID
  PAYMENT_FAILED
  PREPARING
  READY
  COMPLETED
  CANCELLED
}

model Order {
  id             String      @id @default(uuid())
  userId         String
  voucherId      String?
  status         OrderStatus @default(PENDING)
  total          Int
  discountAmount Int         @default(0)
  finalTotal     Int
  paymentMethod  String?     // WALLET, CARD
  idempotencyKey String
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  user           User        @relation(fields: [userId], references: [id])
  voucher        Voucher?    @relation(fields: [voucherId], references: [id])
  items          OrderItem[]
  payments       Payment[]

  @@unique([userId, idempotencyKey])
  @@map("orders")
}

// 6. CHI TIẾT DÒNG ĐƠN HÀNG (OrderItem)
model OrderItem {
  id              String   @id @default(uuid())
  orderId         String
  productId       String
  size            String   // S, M, L
  ice             String?  // 100% Đá, 70% Đá...
  sugar           String?  // Chuẩn Ngọt, 70% Đường...
  quantity        Int
  priceAtPurchase Int      // Snapshot giá ly cơ sở + phụ thu size
  lineTotal       Int      // Snapshot tổng dòng

  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product         Product  @relation(fields: [productId], references: [id])
  toppings        OrderItemTopping[]

  @@map("order_items")
}

// 7. SNAPSHOT TOPPING TRONG DÒNG ĐƠN HÀNG
model OrderItemTopping {
  id           String    @id @default(uuid())
  orderItemId  String
  toppingId    String
  toppingName  String    // Snapshot tên
  toppingPrice Int       // Snapshot giá

  orderItem    OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  topping      Topping   @relation(fields: [toppingId], references: [id])

  @@map("order_item_toppings")
}

// 8. GIAO DỊCH THANH TOÁN (Payment)
enum PaymentStatus {
  SUCCESS
  FAILURE
}

model Payment {
  id             String        @id @default(uuid())
  orderId        String
  idempotencyKey String        @unique
  amount         Int
  method         String        // WALLET, CARD
  status         PaymentStatus
  createdAt      DateTime      @default(now())

  order          Order         @relation(fields: [orderId], references: [id])

  @@map("payments")
}
```

---

## 3. DANH SÁCH API & HỢP ĐỒNG GIAO TIẾP

Chuẩn định dạng phản hồi JSON thống nhất:
```typescript
interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  error?: string;
}
```

### 3.1. Phân hệ Xác thực & Người dùng (Auth Module)

#### `POST /api/v1/auth/register`
* **Mô tả:** Đăng ký tài khoản người dùng mới (Mật khẩu tối thiểu 6 ký tự theo SRS v4.0 BR-14).
* **Quyền:** Public.
* **Request DTO (`RegisterDto`):**
  ```json
  {
    "email": "khach@brewlite.vn",
    "password": "Password123",
    "confirmPassword": "Password123"
  }
  ```
* **Response `201 Created`:**
  ```json
  {
    "statusCode": 201,
    "message": "Đăng ký tài khoản thành công",
    "data": {
      "id": "uuid-user-1",
      "email": "khach@brewlite.vn",
      "loyaltyPoints": 0,
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
* **Response `400 Bad Request`:** Email đã tồn tại hoặc mật khẩu không hợp lệ (< 6 ký tự).

#### `POST /api/v1/auth/login`
* **Mô tả:** Đăng nhập hệ thống bằng email và mật khẩu, trả về JWT Access Token (thời hạn 24 giờ / 1 ngày).
* **Quyền:** Public.
* **Request DTO (`LoginDto`):**
  ```json
  {
    "email": "khach@brewlite.vn",
    "password": "Password123"
  }
  ```
* **Response `200 OK`:**
  ```json
  {
    "statusCode": 200,
    "message": "Đăng nhập thành công",
    "data": {
      "id": "uuid-user-1",
      "email": "khach@brewlite.vn",
      "loyaltyPoints": 120,
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
* **Response `401 Unauthorized`:** Email hoặc mật khẩu không chính xác.

#### `GET /api/v1/auth/me`
* **Mô tả:** Lấy thông tin tài khoản hiện tại kèm số điểm thưởng tích lũy `loyaltyPoints`.
* **Quyền:** Bắt buộc JWT (`Authorization: Bearer <token>`).
* **Response `200 OK`:**
  ```json
  {
    "statusCode": 200,
    "message": "Lấy thông tin người dùng thành công",
    "data": {
      "id": "uuid-user-1",
      "email": "khach@brewlite.vn",
      "loyaltyPoints": 120
    }
  }
  ```

---

### 3.2. Phân hệ Sản phẩm & Menu (Products Module)

#### `GET /api/v1/products`
* **Mô tả:** Lấy danh sách thực đơn đồ uống.
* **Quyền:** Public.
* **Query Params:** `category` (optional: `COFFEE_VN`, `ESPRESSO`, `TEA`), `search` (optional).
* **Response `200 OK`:**
  ```json
  {
    "statusCode": 200,
    "message": "Lấy danh sách sản phẩm thành công",
    "data": [
      {
        "id": "uuid-1",
        "name": "Cà Phê Muối",
        "category": "COFFEE_VN",
        "price": 39000,
        "stock": 50,
        "imageUrl": "https://images.unsplash.com/...",
        "description": "Cà phê đậm đà kết hợp cùng lớp kem muối béo mặn."
      }
    ]
  }
  ```

#### `GET /api/v1/products/:id`
* **Mô tả:** Chi tiết một món đồ uống kèm danh sách topping có sẵn trong hệ thống.
* **Quyền:** Public.
* **Response `200 OK`:**
  ```json
  {
    "statusCode": 200,
    "message": "Lấy chi tiết sản phẩm thành công",
    "data": {
      "id": "uuid-1",
      "name": "Cà Phê Muối",
      "category": "COFFEE_VN",
      "price": 39000,
      "stock": 50,
      "imageUrl": "https://...",
      "description": "...",
      "availableToppings": [
        { "id": "top-1", "name": "Kem Cheese Béo Ngậy", "price": 15000 },
        { "id": "top-2", "name": "Củ Năng Giòn", "price": 10000 }
      ]
    }
  }
  ```

---

### 3.3. Phân hệ Khuyến mãi (Voucher Module)

#### `POST /api/v1/vouchers/validate`
* **Mô tả:** Kiểm tra và tính toán trước số tiền giảm giá của mã voucher.
* **Quyền:** Public.
* **Request DTO (`ValidateVoucherDto`):**
  ```json
  {
    "code": "BREWLITE10",
    "total": 60000
  }
  ```
* **Response `200 OK`:**
  ```json
  {
    "statusCode": 200,
    "message": "Áp dụng mã giảm giá thành công",
    "data": {
      "valid": true,
      "code": "BREWLITE10",
      "discountAmount": 6000,
      "finalTotal": 54000
    }
  }
  ```
* **Response `400 Bad Request`:** Mã không tồn tại, hết hạn, hoặc chưa đạt giá trị đơn tối thiểu.

---

### 3.4. Phân hệ Đơn hàng (Orders Module)

#### `POST /api/v1/orders`
* **Mô tả:** Tạo đơn hàng mới ở trạng thái `PENDING`, trừ tồn kho bằng Optimistic Locking trong Transaction.
* **Quyền:** Bắt buộc JWT (`Authorization: Bearer <token>`).
* **Header bắt buộc:** `Idempotency-Key: <UUID>`
* **Request DTO (`CreateOrderDto`):**
  ```json
  {
    "items": [
      {
        "productId": "uuid-product-1",
        "size": "M",
        "ice": "50% Đá",
        "sugar": "Chuẩn Ngọt",
        "quantity": 1,
        "toppingIds": ["uuid-top-1"]
      }
    ],
    "voucherCode": "BREWLITE10"
  }
  ```
  *(Lưu ý: Không gửi giá tiền từ Client lên. Backend tự tra cứu và tính toán).*
* **Xử lý Backend:**
  1. Kiểm tra cặp `(userId, idempotencyKey)`. Nếu đã tồn tại $\rightarrow$ Trả về Order cũ, HTTP `200 OK`.
  2. Bắt đầu Transaction:
     - Lấy thông tin các Product, kiểm tra `stock >= quantity`.
     - Update Product: `stock = stock - quantity`, `version = version + 1` WHERE `id = :id AND version = :version`.
     - Nếu cập nhật thất bại do xung đột version $\rightarrow$ Thử lại tối đa 3 lần. Vẫn thất bại $\rightarrow$ Ném `409 Conflict`.
     - Tạo bản ghi Order (`status: PENDING`), OrderItem, OrderItemTopping.
  3. Commit Transaction.
* **Response `201 Created`:**
  ```json
  {
    "statusCode": 201,
    "message": "Tạo đơn hàng thành công",
    "data": {
      "orderId": "uuid-order-1",
      "status": "PENDING",
      "total": 49000,
      "discountAmount": 4900,
      "finalTotal": 44100,
      "createdAt": "2026-10-11T10:00:00.000Z"
    }
  }
  ```

#### `GET /api/v1/orders/me`
* **Mô tả:** Lấy danh sách lịch sử đơn hàng của người dùng hiện tại, sắp xếp mới nhất lên đầu.
* **Quyền:** Bắt buộc JWT.
* **Response `200 OK`:** Danh sách `Order[]` kèm các item tóm tắt.

#### `GET /api/v1/orders/:id`
* **Mô tả:** Xem chi tiết tiến trình đơn hàng (phục vụ Polling mỗi 5 giây).
* **Quyền:** Bắt buộc JWT.

#### `PATCH /api/v1/orders/:id/cancel`
* **Mô tả:** Khách hàng hủy đơn (áp dụng khi đơn đang ở `PENDING` hoặc `PAYMENT_FAILED`).
* **Xử lý:** Chuyển trạng thái sang `CANCELLED`, hoàn lại số lượng tồn kho `stock` cho Product trong Transaction.

---

### 3.5. Phân hệ Thanh toán (Payments Module - Mock Payment)

#### `POST /api/v1/payments`
* **Mô tả:** Thực hiện thanh toán giả lập (Mock Payment Gateway: 50% SUCCESS / 50% FAILURE).
* **Quyền:** Bắt buộc JWT.
* **Header bắt buộc:** `Idempotency-Key: <UUID>`
* **Request DTO (`ProcessPaymentDto`):**
  ```json
  {
    "orderId": "uuid-order-1",
    "amount": 44100,
    "method": "WALLET"
  }
  ```
* **Xử lý Backend:**
  1. Kiểm tra Idempotency: Nếu đã có Payment `SUCCESS` cùng `idempotencyKey` $\rightarrow$ Trả kết quả cũ ngay lập tức.
  2. Kiểm tra `amount == Order.finalTotal` và Order ở trạng thái `PENDING` hoặc `PAYMENT_FAILED`.
  3. Mô phỏng cổng thanh toán:
     - **Nếu SUCCESS:**
       - Lưu Payment `SUCCESS`.
       - `assertTransition(PENDING → PAID)`.
       - Tăng `Voucher.usedCount += 1` (nếu có dùng voucher).
       - Cộng điểm thành viên: `User.loyaltyPoints += floor(finalTotal / 10000)`.
       - Commit Transaction.
       - Trả về `200 OK` `{ status: "SUCCESS", orderStatus: "PAID" }`.
     - **Nếu FAILURE:**
       - Lưu Payment `FAILURE`.
       - `assertTransition(PENDING → PAYMENT_FAILED)`.
       - Giữ nguyên tồn kho (không hoàn kho ngay).
       - Trả về `200 OK` `{ status: "FAILURE", orderStatus: "PAYMENT_FAILED" }`.

---

## 4. LOGIC NGHIỆP VỤ NÂNG CAO

### 4.1. Order State Machine & Hàm `assertTransition`

```mermaid
stateDiagram-v2
    [*] --> PENDING: POST /orders
    PENDING --> PAID: Mock Gateway SUCCESS
    PENDING --> PAYMENT_FAILED: Mock Gateway FAILURE
    PENDING --> CANCELLED: Khách hủy / Timeout
    PAYMENT_FAILED --> PENDING: Khách bấm "Thử lại"
    PAYMENT_FAILED --> CANCELLED: Khách bấm "Hủy đơn"
    PAID --> CANCELLED: Rollback / Hủy sau thanh toán
    PAID --> PREPARING: Barista tiếp nhận
    PREPARING --> READY: Hoàn thành pha chế
    READY --> COMPLETED: Đã nhận đồ uống
    COMPLETED --> [*]
    CANCELLED --> [*]
```

**Bảng ma trận chuyển đổi hợp lệ:**
```typescript
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PAID,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAYMENT_FAILED]: [
    OrderStatus.PENDING,     // Thử lại thanh toán
    OrderStatus.CANCELLED,   // Hủy đơn khi lỗi
  ],
  [OrderStatus.PAID]: [
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,   // Hỗ trợ rollback test
  ],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [], // Trạng thái kết thúc
  [OrderStatus.CANCELLED]: [], // Trạng thái kết thúc
};

export function assertTransition(current: OrderStatus, next: OrderStatus): void {
  const allowed = VALID_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    throw new BadRequestException(
      `Không thể chuyển trạng thái đơn hàng từ ${current} sang ${next}`
    );
  }
}
```

### 4.2. Kiểm soát tồn kho đồng thời (Optimistic Locking)

Thuật toán chống bán vượt tồn kho (Overselling) khi nhiều khách cùng đặt một món:

```typescript
async function deductStockWithOptimisticLock(
  prisma: PrismaClient,
  productId: string,
  quantity: number,
  maxRetries = 3
): Promise<void> {
  let attempts = 0;
  while (attempts < maxRetries) {
    attempts++;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.stock < quantity) {
      throw new ConflictException(`Sản phẩm ${product?.name || ''} đã hết hàng`);
    }

    // Cập nhật với điều kiện version cũ không đổi
    const updateResult = await prisma.product.updateMany({
      where: {
        id: productId,
        version: product.version,
      },
      data: {
        stock: product.stock - quantity,
        version: { increment: 1 },
      },
    });

    if (updateResult.count > 0) {
      return; // Cập nhật thành công!
    }
    // Xung đột phiên bản -> vòng lặp thử lại
  }
  throw new ConflictException('Hệ thống đang quá tải, vui lòng thử lại');
}
```

### 4.3. Chống trùng lặp yêu cầu (Idempotency Key)
- Tại `POST /orders`: Cặp `(userId, idempotencyKey)` được đặt ràng buộc `@@unique([userId, idempotencyKey])`. Nếu một request bị bấm 2 lần do mạng lag, request thứ hai lập tức bắt được bản ghi đã tạo và trả về cùng thông tin đơn hàng mà không trừ thêm kho hay tạo 2 đơn.
- Tại `POST /payments`: Bảng `payments` có `idempotencyKey @unique`. Nếu đã có bản ghi thanh toán `SUCCESS`, trả về ngay lập tức kết quả thành công mà không gọi lại Mock Gateway.

---

## 5. DỮ LIỆU KHỞI TẠO (DATA SEED SPECIFICATION)

File thực thi: `backend/prisma/seed.ts`

### 5.1. Dữ liệu 10 Sản phẩm Đồ uống (Trích xuất từ `Seed (1).md`)

| Mã món | Tên sản phẩm | Nhóm (Category) | Giá size S (VNĐ) | Tồn kho (Stock) | Mô tả sản phẩm |
|---|---|---|---|---|---|
| `CF-SDA-01` | Cà Phê Sữa Đá | `COFFEE_VN` | 35.000 | 50 | Cà phê phin đậm đà kết hợp cùng lớp sữa đặc ngọt béo truyền thống. |
| `CF-DEN-02` | Cà Phê Đen Đá | `COFFEE_VN` | 29.000 | 50 | Đượm vị đắng thanh nhẹ và hương thơm nguyên bản từ hạt cà phê Rang Xay. |
| `CF-BAC-03` | Bạc Xỉu | `COFFEE_VN` | 35.000 | 50 | Sự kết hợp hoàn hảo giữa nhiều sữa tươi, chút sữa đặc và điểm xuyết hương cà phê phin. |
| `CF-SLT-04` | Cà Phê Muối | `COFFEE_VN` | 39.000 | 50 | Cà phê đắng đậm đà hòa quyện cùng lớp kem muối béo ngậy, mặn nhẹ độc đáo. |
| `ES-CRM-05` | Caramel Macchiato | `ESPRESSO` | 49.000 | 50 | Espresso đậm đà hòa quyện cùng sữa tươi bốc hơi nóng và xốt Caramel thơm ngọt phủ trên mặt. |
| `ES-LAT-06` | Cà Phê Latte | `ESPRESSO` | 45.000 | 50 | Sự cân bằng giữa vị đắng nhẹ của Espresso và vị béo mịn của lớp bọt sữa tươi. |
| `ES-AME-07` | Americano | `ESPRESSO` | 39.000 | 50 | Cà phê Espresso pha loãng với nước tinh khiết, thơm đậm và thanh nhẹ. |
| `TE-SEN-08` | Trà Sen Vàng | `TEA` | 45.000 | 50 | Trà Oolong thanh mát kết hợp hạt sen bùi ngậy, củ năng giòn ngọt và lớp kem béo. |
| `TE-DAO-09` | Trà Đào Cam Sả | `TEA` | 45.000 | 50 | Trà đen thơm ngát vị đào mọng nước, hòa quyện cùng vị chua dịu của cam tươi và hương sả ấm. |
| `TE-OOL-10` | Trà Sữa Oolong Nướng | `TEA` | 49.000 | 50 | Đậm đà vị trà Oolong nướng thơm lừng kết hợp cùng sữa béo ngậy. |

### 5.2. Dữ liệu 6 Topping Tuyển chọn (Từ `Seed (1).md`)

| ID | Tên Topping | Giá (VNĐ) | Trạng thái khả dụng |
|---|---|---|---|
| `top-1` | Củ Năng Giòn | 10.000 | `true` |
| `top-2` | Kem Cheese Béo Ngậy | 15.000 | `true` |
| `top-3` | Trân Châu Ô Long Hoàng Kim | 10.000 | `true` |
| `top-4` | Hạt Sen Ninh Đường | 12.000 | `true` |
| `top-5` | Pudding Trứng Mịn Màng | 10.000 | `true` |
| `top-6` | Extra Shot Espresso | 15.000 | `true` |

### 5.3. Dữ liệu 3 Mã Giảm Giá (Vouchers)

| Mã Voucher | Loại giảm | Giá trị | Mức giảm tối đa | Đơn tối thiểu | Giới hạn dùng |
|---|---|---|---|---|---|
| `BREWLITE10` | `PERCENT` | 10% | 20.000đ | 50.000đ | 100 lượt |
| `WELCOME20` | `FIXED` | 20.000đ | 20.000đ | 40.000đ | 50 lượt |
| `BREWCOZY` | `PERCENT` | 15% | 25.000đ | 0đ | 100 lượt |

### 5.4. Tài khoản Demo Khách hàng
* Email: `khach@brewlite.vn`
* Mật khẩu: `BrewLite123!` (Hash bcrypt: `$2b$10$...`)
* Điểm thưởng ban đầu: `120` điểm.

---

## 6. CHIẾN LƯỢC KIỂM THỬ TỰ ĐỘNG (TESTING STRATEGY)

Đáp ứng đầy đủ **tiêu chí chấm điểm 10/10 của Giảng viên** trong mục 9 của `BrewLite-CongNghePhanMem.md`.

### 6.1. Unit Test (a): Chặn chuyển trạng thái sai
* **File:** `backend/src/orders/state-machine.spec.ts`
* **Nội dung kiểm tra:**
  - `assertTransition(PENDING, PAID)` $\rightarrow$ Hợp lệ.
  - `assertTransition(PAID, PREPARING)` $\rightarrow$ Hợp lệ.
  - `assertTransition(PENDING, COMPLETED)` $\rightarrow$ Bị chặn, ném `BadRequestException`.
  - `assertTransition(CANCELLED, PAID)` $\rightarrow$ Bị chặn, ném `BadRequestException`.
  - `assertTransition(PAYMENT_FAILED, COMPLETED)` $\rightarrow$ Bị chặn, ném `BadRequestException`.

### 6.2. Integration Test (b): Chống lặp đơn với Idempotency-Key
* **File:** `backend/test/order-idempotency.e2e-spec.ts`
* **Nội dung kiểm tra:**
  - Sinh một UUID `idempotencyKey = "uuid-test-123"`.
  - Gửi Request 1: `POST /api/v1/orders` kèm header `Idempotency-Key: uuid-test-123` $\rightarrow$ Trả về `201 Created`, lưu 1 đơn vào CSDL.
  - Gửi Request 2: `POST /api/v1/orders` với **cùng nội dung và cùng header `Idempotency-Key`** $\rightarrow$ Trả về `200/201`, mã đơn trả về trùng với Request 1.
  - Kiểm tra bảng `orders` trong CSDL $\rightarrow$ Chỉ tồn tại đúng 1 đơn hàng duy nhất.

### 6.3. Concurrency Test (c): Đặt đồng thời không vượt tồn kho
* **File:** `backend/test/optimistic-locking.e2e-spec.ts`
* **Nội dung kiểm tra:**
  - Tạo một sản phẩm thử nghiệm có tồn kho ban đầu: `stock = 1`, `version = 0`.
  - Kích hoạt đồng thời 3 Promise (`Promise.all`) gửi yêu cầu đặt món sản phẩm đó:
    ```typescript
    const requests = [
      orderService.createOrder(userA, { productId, quantity: 1 }),
      orderService.createOrder(userB, { productId, quantity: 1 }),
      orderService.createOrder(userC, { productId, quantity: 1 }),
    ];
    const results = await Promise.allSettled(requests);
    ```
  - Kết quả kiểm chứng:
    - Đúng 1 Promise thành công (`status === 'fulfilled'`).
    - 2 Promise còn lại thất bại với lỗi `ConflictException` (`409 Conflict`).
    - Số lượng tồn kho sau cùng trong CSDL: `stock === 0`, không bao giờ bị âm.

---

*Tài liệu Đặc tả Kỹ thuật hoàn tất — Dự án BrewLite, Môn CNPM, SGU, Tháng 10/2026.*
