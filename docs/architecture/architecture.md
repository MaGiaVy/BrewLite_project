# Tài liệu Thiết kế Kiến trúc — BrewLite

> **Mã nhiệm vụ:** `TASK-03` (Trọng số: **2.0 / 10 điểm** — Đợt A: Bắt đầu ngay)  
> **Học phần:** Công nghệ Phần mềm — Giảng viên: **ThS. Từ Lãng Phiêu**  
> **Thành viên phụ trách:** Huỳnh Tuấn Kiệt | Phối hợp kiến trúc: Cả nhóm  
> **Kho mã nguồn:** Monorepo (`apps/web`, `apps/api`, `docs`, `tests`)  
> **Trạng thái:** `HOÀN THÀNH BẢN THIẾT KẾ KIẾN TRÚC & TRUY VẾT (T3.1)`

---

## 1. Bối cảnh Hệ thống (System Context)

**BrewLite** là ứng dụng web đặt và thanh toán đồ uống không dùng tiền mặt theo hướng mobile-first/PWA, giúp khách hàng chọn món, tùy chỉnh size/topping, áp dụng khuyến mãi và thanh toán nhanh chóng chỉ trong vài chạm, từ đó giảm thời gian xếp hàng chờ đợi tại quầy.

### 1.1 Các tác nhân và hệ thống bên ngoài
* **Khách hàng (Customer):** Duyệt thực đơn (menu), chọn tùy chọn (size, topping), quản lý giỏ hàng, đặt đơn, thanh toán không tiền mặt và theo dõi trạng thái đơn hàng theo thời gian thực.
* **Nhân viên quầy / Quản lý (Staff / Admin):** Tiếp nhận đơn hàng đã thanh toán (`PAID`), cập nhật tiến trình pha chế (`PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`) và quản lý danh mục sản phẩm, tồn kho.
* **Cổng thanh toán mô phỏng (Mock Payment Service):** Mô phỏng hành vi xử lý giao dịch Ví điện tử (`WALLET`) và Thẻ ngân hàng (`CARD`), hỗ trợ cấu hình chế độ phản hồi (`success`, `failure`, `random`) phục vụ kiểm thử tự động và nghiệm thu.

### 1.2 Sơ đồ C4 — Mức Bối cảnh (Level 1: System Context Diagram)

```mermaid
flowchart TB
    subgraph Actors["Người dùng (Actors)"]
        Customer["👤 Khách hàng (Customer)<br/>[Person]<br/>Đặt đồ uống, chọn size/topping,<br/>thanh toán và theo dõi đơn"]
        Staff["👤 Nhân viên / Quản lý (Staff)<br/>[Person]<br/>Cập nhật trạng thái đơn hàng<br/>và quản lý cửa hàng"]
    end

    BrewLite["☕ Hệ thống BrewLite<br/>[Software System]<br/>Ứng dụng đặt cà phê không tiền mặt<br/>(Next.js PWA + NestJS API + PostgreSQL)"]

    MockPayment["💳 Dịch vụ Thanh toán Mô phỏng<br/>(Mock Payment Service)<br/>[Internal/Simulated System]<br/>Mô phỏng thanh toán Ví điện tử / Thẻ"]

    Customer -->|"Xem menu, đặt đơn, thanh toán<br/>[HTTPS]"| BrewLite
    Staff -->|"Quản lý trạng thái đơn, tồn kho<br/>[HTTPS]"| BrewLite
    BrewLite -->|"Xử lý giao dịch thanh toán<br/>(WALLET / CARD)"| MockPayment
```

---

## 2. Kiến trúc Mức Container (C4 Level 2: Container Diagram)

Hệ thống BrewLite được tổ chức theo mô hình **Monorepo** (xem [ADR-001](./adr/001-monorepo.md)), phân tách rõ ràng giữa giao diện người dùng (Frontend), dịch vụ nghiệp vụ (Backend API) và hệ quản trị cơ sở dữ liệu (Database). Các container được đóng gói bằng Docker, lưu trữ trên GitHub Container Registry (GHCR) và triển khai lên nền tảng Render (xem [ADR-003](./adr/003-render-ghcr-deployment.md)).

```mermaid
flowchart TB
    Customer["👤 Khách hàng<br/>[Trình duyệt Mobile / PWA]"]
    Staff["👤 Nhân viên quầy<br/>[Trình duyệt Web]"]

    subgraph BrewLiteSystem["Hệ thống BrewLite (Render Production / Docker Compose Local)"]
        WebApp["📱 Frontend Web Application<br/>[Container: Next.js / TypeScript / TailwindCSS]<br/>Thư mục: apps/web<br/>Phục vụ giao diện mobile-first/PWA,<br/>quản lý giỏ hàng (Zustand)"]

        ApiApp["⚙️ Backend API Application<br/>[Container: NestJS / TypeScript / Prisma Client]<br/>Thư mục: apps/api<br/>Cung cấp REST API, xác thực JWT, tính giá,<br/>state machine, khóa tồn kho và thanh toán"]

        Database[("🗄️ Cơ sở dữ liệu<br/>[Container: PostgreSQL]<br/>Thư mục schema: apps/api/prisma<br/>Lưu trữ Users, Products, Orders,<br/>OrderItems, Payments, Vouchers")]

        MockGateway["💳 Mock Payment Module<br/>[Internal Component trong API]<br/>Thư mục: apps/api/src/payments<br/>Mô phỏng cổng thanh toán Ví/Thẻ<br/>theo biến MOCK_PAYMENT_MODE"]
    end

    GHCR["📦 GitHub Container Registry (GHCR)<br/>[Container Registry]<br/>Lưu trữ Docker images của web và api<br/>được gắn tag theo SHA & SemVer"]

    Customer -->|"Truy cập UI<br/>[HTTPS / Port 443 (Prod) / 3000 (Local)]"| WebApp
    Staff -->|"Truy cập UI Staff<br/>[HTTPS / Port 443 (Prod) / 3000 (Local)]"| WebApp
    WebApp -->|"Gọi REST API + JWT + Idempotency-Key<br/>[HTTPS / Port 3001 (Local) / JSON]"| ApiApp
    ApiApp -->|"Đọc/Ghi dữ liệu & Transaction<br/>[TCP / Port 5432 nội bộ]"| Database
    ApiApp -->|"Gọi xử lý giao dịch nội bộ"| MockGateway
    GHCR -.->|"Pull Docker Images khi Deploy"| WebApp
    GHCR -.->|"Pull Docker Images khi Deploy"| ApiApp
```

---

## 3. Chi tiết các Thành phần Kiến trúc

### 3.1 Frontend (`apps/web`) — Next.js Mobile-First / PWA
* **Công nghệ cốt lõi:** Next.js (App Router, React 19, TypeScript) kết hợp TailwindCSS thiết kế theo định hướng ưu tiên thiết bị di động (mobile-first) và hỗ trợ Progressive Web App (PWA).
* **Quản lý trạng thái (State Management):**
  * `cart-store` (`apps/web/src/stores/cart-store.ts`): Sử dụng **Zustand** kết hợp middleware `persist` để lưu giỏ hàng vào `localStorage`. Hỗ trợ gộp dòng khi trùng `(productId, size, toppingIds)`, giới hạn số lượng $1\text{--}20$ mỗi dòng và tính tổng tạm tính (`selectTotal`).
  * `auth-store` (`apps/web/src/stores/auth-store.ts`): Lưu trữ trạng thái đăng nhập và `accessToken` JWT.
* **Giao tiếp API & Xử lý lỗi (`apps/web/src/lib/api-client.ts`):**
  * Tự động đính kèm header `Authorization: Bearer <token>` cho các endpoint yêu cầu xác thực.
  * Tự động sinh và giữ nguyên `Idempotency-Key` (bằng `crypto.randomUUID()`) khi người dùng bấm thanh toán hoặc thử lại (`Retry`) để tránh tạo đơn/trừ tiền kép.
  * Khi nhận mã lỗi `401 Unauthorized` (JWT hết hạn), tự động xóa token, giữ nguyên giỏ hàng hiện tại và điều hướng về `/login?redirect=<trang_hiện_tại>`.
* **Theo dõi trạng thái đơn (`apps/web/src/hooks/use-order-polling.ts`):** Custom hook gọi định kỳ `GET /orders/:id` mỗi $5\text{ giây}$ kèm `AbortController`, tự động dừng khi đơn đạt trạng thái kết thúc (`COMPLETED` hoặc `CANCELLED`) hoặc khi component unmount.
* **Biến môi trường phía Client:** `NEXT_PUBLIC_API_URL` trỏ tới địa chỉ Backend API (Local: `http://localhost:3001`, Production: URL Render của backend).

### 3.2 Backend (`apps/api`) — Kiến trúc Phân lớp theo Module (Modular Layered Architecture)
Backend được xây dựng bằng **NestJS** (TypeScript), áp dụng kiến trúc phân lớp (`Controller` $\rightarrow$ `Service` $\rightarrow$ `Data Access / PrismaService`) và chia tách theo từng miền nghiệp vụ (Domain Modules) (xem [ADR-002](./adr/002-layered-modular-nestjs.md)):

1. **Auth Module (`apps/api/src/auth`):**
   * Xử lý đăng ký (`POST /auth/register`) và đăng nhập (`POST /auth/login`).
   * Băm mật khẩu bằng `bcrypt`, cấp phát token JWT có thời hạn $7\text{ ngày}$.
   * Cung cấp `JwtAuthGuard` và `RolesGuard` để bảo vệ các route đặt đơn, thanh toán và cập nhật trạng thái đơn.
2. **Products Module (`apps/api/src/products`):**
   * Cung cấp danh sách thực đơn (`GET /products`) và chi tiết sản phẩm kèm danh sách topping (`GET /products/:id`), trả về `404 Not Found` nếu sản phẩm không tồn tại.
3. **Orders Module (`apps/api/src/orders`):**
   * **Tạo đơn hàng (`POST /orders`):** Thực thi trong một database transaction của Prisma. Hệ thống kiểm tra `Idempotency-Key` theo từng người dùng, tự tính lại toàn bộ giá trị đơn hàng ở phía server theo công thức:
     $$\text{LineTotal} = (\text{Giá gốc} + \text{Phụ thu Size} + \sum \text{Giá Topping}) \times \text{Số lượng}$$
     (Phụ thu Size: $S = +0\text{đ}$, $M = +5.000\text{đ}$, $L = +10.000\text{đ}$; không tính VAT).
   * **Kiểm soát đồng thời (Optimistic Locking):** Trừ tồn kho (`stock`) bằng điều kiện `WHERE id = :id AND version = :version` đồng thời tăng `version + 1`. Nếu xảy ra xung đột đồng thời, hệ thống thử lại tối đa $3\text{ lần}$ trước khi trả về `409 Conflict` (xem [ADR-006](./adr/006-optimistic-locking-idempotency.md)).
   * **Máy trạng thái đơn hàng (`apps/api/src/orders/order-state.ts`):** Hàm `assertTransition(from, to)` kiểm soát chặt chẽ các chuyển tiếp hợp lệ:
     * Luồng chính: `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`.
     * Luồng thanh toán lỗi & thử lại: `PENDING` $\rightleftarrows$ `PAYMENT_FAILED`.
     * Luồng hủy đơn: `PENDING` / `PAID` / `PAYMENT_FAILED` $\rightarrow$ `CANCELLED`.
   * **Tác vụ tự động hủy đơn quá hạn (`apps/api/src/jobs/expire-orders.job.ts`):** Sử dụng `@nestjs/schedule` quét mỗi phút để tự động chuyển các đơn `PENDING` hoặc `PAYMENT_FAILED` quá $15\text{ phút}$ sang `CANCELLED`, đồng thời hoàn trả tồn kho và lượt sử dụng voucher.
4. **Payments Module (`apps/api/src/payments`):**
   * Xử lý thanh toán (`POST /payments`) cho phương thức `WALLET` hoặc `CARD`.
   * Đảm bảo tính **Idempotency** thông qua header `Idempotency-Key` (nếu giao dịch đã `SUCCESS` với cùng khóa, trả về ngay kết quả cũ mà không trừ tiền hay cộng điểm lần hai — xem [ADR-006](./adr/006-optimistic-locking-idempotency.md)).
   * Khi thanh toán thất bại (`PAYMENT_FAILED`), đơn hàng vẫn giữ tồn kho đã đặt để khách hàng có thể bấm thử lại ngay.
5. **Vouchers & Loyalty (`apps/api/src/vouchers`, tích hợp trong `orders` & `payments`):**
   * Kiểm tra tính hợp lệ của mã giảm giá (`PERCENT` hoặc `FIXED`, hạn sử dụng, giá trị đơn tối thiểu `minOrderValue`, giới hạn số lượt dùng).
   * Khi đơn hàng chuyển sang `PAID`, tự động cộng điểm tích lũy $\lfloor \text{finalTotal} / 1000 \rfloor$ vào tài khoản khách hàng và ghi nhận `LoyaltyTransaction` trong cùng một transaction. Nếu đơn `PAID` bị hủy, hệ thống hoàn kho và khấu trừ lại số điểm đã cộng.
6. **Health Module (`apps/api/src/health`):**
   * Cung cấp endpoint `GET /health` để kiểm tra trạng thái sống của API và thực hiện truy vấn kiểm tra kết nối thực tế tới PostgreSQL (`SELECT 1`).

### 3.3 Cơ sở dữ liệu (`apps/api/prisma`) — PostgreSQL & Prisma ORM
* **Mô hình dữ liệu:** Quản lý tập trung qua tệp `apps/api/prisma/schema.prisma`, bao gồm các thực thể cốt lõi: `User`, `Product`, `Topping`, `Order`, `OrderItem`, `Payment`, `Promotion` (Voucher) và `LoyaltyTransaction` (xem [ADR-004](./adr/004-prisma-migrations.md)).
* **Cơ chế kiểm soát phiên bản (Version Column):** Cột `version Int @default(0)` được đặt tại các thực thể liên quan đến tồn kho và đơn hàng để đảm bảo cơ chế Khóa lạc quan (Optimistic Locking) hoạt động chuẩn xác.
* **Cơ chế Migration & Seed:**
  * Lịch sử thay đổi cấu trúc bảng được lưu vết đầy đủ trong `apps/api/prisma/migrations/`.
  * Dữ liệu mẫu (`apps/api/prisma/seed.ts`) được thiết kế có tính chất idempotent (`upsert`), khởi tạo tối thiểu $8\text{ món}$ đồ uống (trong đó có món `stock = 0` để kiểm thử trạng thái hết hàng), đầy đủ tùy chọn size/topping và tài khoản mẫu.
  * Quá trình chạy migration trên môi trường production được thực thi tự động khi container API khởi động thông qua `prisma migrate deploy` (xem [ADR-007](./adr/007-migration-on-startup.md)).

### 3.4 Dịch vụ Thanh toán Mô phỏng (`MockGatewayService`)
* Đặt tại `apps/api/src/payments/mock-gateway.service.ts` (xem [ADR-005](./adr/005-mock-payment-service.md)).
* Hoạt động dựa trên biến môi trường `MOCK_PAYMENT_MODE`:
  * `success`: Luôn trả về kết quả thanh toán thành công (dùng cho luồng happy-path và E2E-T01).
  * `failure`: Luôn trả về kết quả thất bại (dùng để kiểm thử luồng `PAYMENT_FAILED`, giữ giỏ hàng và thử lại ở E2E-T02).
  * `random`: Mô phỏng xác suất thành công/thất bại ngẫu nhiên trong môi trường demo thông thường.

### 3.5 Logging, Health Check và Quản lý Cấu hình
* **Logging:** Sử dụng hệ thống Logger tích hợp của NestJS, xuất log có cấu trúc (timestamp, context module, mức độ log `LOG`, `WARN`, `ERROR`) ra luồng `stdout`/`stderr` chuẩn của container, cho phép thu thập và tra cứu trực tiếp trên bảng điều khiển Render Logs hoặc `docker compose logs`. Tuyệt đối không ghi `passwordHash`, `JWT_SECRET` hay token vào log.
* **Health Check (`GET /health`):**
  * Thực hiện kiểm tra kết nối cơ sở dữ liệu (`SELECT 1` qua Prisma).
  * Trả về `200 OK` kèm `{ "status": "ok", "db": "up" }` khi hệ thống khỏe mạnh, hoặc `503 Service Unavailable` khi mất kết nối DB. Endpoint này đóng vai trò làm cổng kiểm tra (Smoke Test) bắt buộc trong pipeline CD.
* **Quản lý cấu hình (`apps/api/src/config/env.validation.ts`):**
  * Kiểm tra tính hợp lệ của toàn bộ biến môi trường bắt buộc (`DATABASE_URL`, `JWT_SECRET`, `MOCK_PAYMENT_MODE`, `PORT`) ngay tại thời điểm ứng dụng khởi động (fail-fast). Nếu thiếu biến quan trọng như `DATABASE_URL` hoặc `JWT_SECRET`, ứng dụng sẽ từ chối khởi động và báo lỗi rõ ràng.

### 3.6 Kiến trúc Phân tầng Kiểm thử (Testing Architecture)
Hệ thống thiết lập 4 cấp độ kiểm thử rõ ràng theo kim tự tháp kiểm thử (Testing Pyramid):
1. **Unit & Component Tests (`apps/api/src/**/*.spec.ts`, `apps/web/src/**/__tests__/*.test.tsx`):** Kiểm tra độc lập logic tính giá, mã giảm giá, state machine của giỏ hàng và render component React.
2. **API Tests (`API-T01` $\rightarrow$ `API-T17`):** Kiểm thử trực tiếp các controller và service của NestJS với mock dependencies.
3. **Integration Tests (`INT-T01` $\rightarrow$ `INT-T05` — `apps/api/test/integration/`):** Khởi chạy với cơ sở dữ liệu kiểm thử độc lập (reset schema trước mỗi suite) để kiểm tra giao dịch tạo đơn, trừ kho đồng thời và idempotency.
4. **End-to-End Tests (`E2E-T01`, `E2E-T02` — `tests/e2e/`):** Sử dụng Playwright kiểm thử tự động toàn bộ luồng người dùng từ trang chủ đến màn hình xác nhận thanh toán với Docker Compose.

---

## 4. Lý do chọn Kiến trúc, Ưu điểm, Hạn chế và Đánh đổi (Trade-offs)

### 4.1 Lý do lựa chọn
Nhóm lựa chọn kiến trúc **Modular Monolith (Khối đơn nguyên phân tách theo module)** cho Backend NestJS kết hợp với **Frontend Next.js tách biệt** trong cùng một **Monorepo** vì:
1. Nghiệp vụ đặt hàng của BrewLite đòi hỏi tính toàn vẹn dữ liệu rất cao (kiểm tra tồn kho, áp voucher, tạo đơn, xử lý thanh toán và cộng điểm thưởng phải nằm trong các giao dịch ACID trên cùng một cơ sở dữ liệu PostgreSQL).
2. Quy mô nhóm 6 thành viên và thời gian thực hiện gói gọn trong 2 Sprint rất phù hợp với việc quản lý mã nguồn, tài liệu (`docs/`) và pipeline CI/CD trên một kho lưu trữ duy nhất.

### 4.2 Phân tích Ưu điểm, Hạn chế và Trade-offs

| Khía cạnh | Ưu điểm (Pros) | Hạn chế (Cons) | Sự đánh đổi (Trade-offs) |
| :--- | :--- | :--- | :--- |
| **Modular Monolith (`apps/api`)** | • Dễ dàng thực hiện ACID Transaction qua nhiều bảng (`Order`, `Product`, `Payment`, `User`) bằng Prisma.<br>• Triển khai đơn giản (chỉ cần 1 container API), không tốn chi phí giao tiếp mạng nội bộ giữa các microservices. | • Khó mở rộng (scale) độc lập từng module (ví dụ: không thể chỉ scale riêng module `orders` mà không nhân bản toàn bộ `api`).<br>• Nếu một module gây rò rỉ bộ nhớ, toàn bộ tiến trình API bị ảnh hưởng. | Chấp nhận giới hạn về khả năng scale độc lập từng module để đổi lấy **tính nhất quán dữ liệu tuyệt đối** và **tốc độ phát triển/vận hành nhanh** trong phạm vi MVP. |
| **Monorepo (`apps/web`, `apps/api`, `docs`, `tests`)** | • Đồng bộ hóa tài liệu đặc tả (SRS, ADR, sơ đồ), mã nguồn Frontend/Backend và kiểm thử E2E trong cùng một Pull Request.<br>• Dễ dàng thiết lập CI/CD tập trung. | • Pipeline CI có thể chạy lâu hơn nếu không cấu hình tách luồng (matrix) và bộ nhớ đệm (cache). | Sử dụng GitHub Actions `matrix` (`api`, `web`) và `npm cache` để giảm thời gian build, đổi lại sự tiện lợi trong quản lý phiên bản và truy vết. |
| **Optimistic Locking so với Pessimistic Locking** | • Không giữ khóa dòng (row lock) lâu trong DB, giúp tăng thông lượng đọc/ghi khi nhiều khách xem và đặt món cùng lúc. | • Khi có xung đột cao trên cùng 1 sản phẩm, một số request phải retry hoặc nhận lỗi `409 Conflict`. | Kết hợp cơ chế **retry tối đa 3 lần** trong `OrdersService` để giảm tỷ lệ lỗi cho người dùng mà vẫn đảm bảo tuyệt đối không bán âm tồn kho ($\text{stock} \ge 0$). |
| **Chạy Migration lúc khởi động API** | • Không cần mở public cổng `5432` của PostgreSQL trên Render ra Internet cho GitHub Actions runner kết nối. | • Làm tăng nhẹ thời gian khởi động container API; yêu cầu các bản migration phải tương thích ngược. | Ưu tiên **bảo mật cơ sở dữ liệu production** (chỉ kết nối qua mạng nội bộ Render) và cơ chế tự động giữ bản cũ của Render nếu container mới lỗi khi migrate. |

---

## 5. Danh mục Quyết định Kiến trúc (Architecture Decision Records — ADRs)

Mọi quyết định kiến trúc trọng yếu của dự án đều được ghi nhận chi tiết trong thư mục `docs/architecture/adr/`:

1. **[ADR-001: Tổ chức mã nguồn theo cấu trúc Monorepo](./adr/001-monorepo.md)** — Thống nhất quản lý `apps/web`, `apps/api`, `docs` và `tests` trên một repository duy nhất.
2. **[ADR-002: Kiến trúc phân lớp theo Module trong NestJS](./adr/002-layered-modular-nestjs.md)** — Phân tách trách nhiệm `Controller` – `Service` – `PrismaService` theo từng miền nghiệp vụ (`auth`, `products`, `orders`, `payments`, `vouchers`, `health`).
3. **[ADR-003: Triển khai Production trên Render kết hợp GitHub Container Registry (GHCR)](./adr/003-render-ghcr-deployment.md)** — Chuẩn hóa quy trình đóng gói Docker image trên CI, lưu trữ tại GHCR và kích hoạt triển khai qua Render Deploy Hook.
4. **[ADR-004: Sử dụng Prisma ORM và quản lý Schema/Migration cho PostgreSQL](./adr/004-prisma-migrations.md)** — Đảm bảo an toàn kiểu dữ liệu (type-safety) và khả năng tái tạo cơ sở dữ liệu nhất quán giữa Local, CI và Production.
5. **[ADR-005: Xây dựng Dịch vụ Thanh toán Mô phỏng (`MockGatewayService`)](./adr/005-mock-payment-service.md)** — Chủ động điều khiển kịch bản thanh toán (`success`, `failure`, `random`) qua biến môi trường để kiểm thử toàn diện các nhánh nghiệp vụ.
6. **[ADR-006: Kiểm soát đặt hàng đồng thời bằng Optimistic Locking và chống trùng lặp bằng Idempotency-Key](./adr/006-optimistic-locking-idempotency.md)** — Giải quyết bài toán bán vượt tồn kho (overselling) và thanh toán lặp hai lần.
7. **[ADR-007: Thực thi Database Migration khi khởi động Container API](./adr/007-migration-on-startup.md)** — Bảo vệ cơ sở dữ liệu production trong mạng nội bộ và đảm bảo an toàn khi triển khai phiên bản mới.

---

## 6. Bảng Truy vết Thành phần Kiến trúc → Mã nguồn & Triển khai

Bảng dưới đây ánh xạ trực tiếp từng container/dịch vụ trong sơ đồ C4 và **Deployment Diagram (Task 3.2)** tới mục mô tả kiến trúc và đường dẫn mã nguồn thực tế trong repository (phục vụ **Task 5.2b** và **Task 5.3**):

| Thành phần / Container (trên Deployment Diagram) | Công nghệ / Nền tảng | Mục kiến trúc tương ứng | Thư mục / Tệp mã nguồn liên quan | Cổng & Giao thức |
| :--- | :--- | :--- | :--- | :--- |
| **`web` (Frontend Web Container)** | Next.js 15+ (App Router, React 19, TypeScript, TailwindCSS, Zustand) | Mục 2, Mục 3.1 (ADR-001, ADR-003) | • `apps/web/`<br>• `apps/web/src/app/`<br>• `apps/web/src/stores/`<br>• `apps/web/Dockerfile` | • Local: `3000` (HTTP)<br>• Production (Render): `443` (HTTPS) $\rightarrow$ container port `3000` |
| **`api` (Backend API Container)** | NestJS (TypeScript, Passport JWT, class-validator, Prisma Client) | Mục 2, Mục 3.2, Mục 3.5 (ADR-002, ADR-006, ADR-007) | • `apps/api/`<br>• `apps/api/src/{auth,products,orders,payments,vouchers,health,jobs,config}/`<br>• `apps/api/Dockerfile` | • Local: `3001` (HTTP)<br>• Production (Render): `443` (HTTPS) $\rightarrow$ container port; Health check: `GET /health` |
| **`MockGatewayService` (In-process Payment Service)** | NestJS Injectable Service (`MOCK_PAYMENT_MODE`) | Mục 2, Mục 3.4 (ADR-005) | • `apps/api/src/payments/mock-gateway.service.ts`<br>• `apps/api/src/payments/payments.service.ts` | Gọi nội bộ (In-process) bên trong container `api` |
| **`db` (Database Container / Managed PostgreSQL)** | PostgreSQL 16 + Persistent Volume / Render Internal Postgres | Mục 2, Mục 3.3 (ADR-004, ADR-007) | • `apps/api/prisma/schema.prisma`<br>• `apps/api/prisma/migrations/`<br>• `apps/api/prisma/seed.ts`<br>• `docker-compose.yml` | • TCP `5432` (Chỉ truy cập qua mạng nội bộ Docker network / Render Private Network) |
| **`tests` (E2E & Integration Test Suites)** | Playwright & Jest (Supertest) | Mục 3.6 | • `tests/e2e/checkout.spec.ts`<br>• `playwright.config.ts`<br>• `apps/api/test/integration/` | Chạy trên local container và CI runner kiểm thử qua HTTP |
| **`registry` (Container Registry — GHCR)** | GitHub Container Registry (`ghcr.io`) | Mục 2, Mục 5 (ADR-003) | • `.github/workflows/cd.yml`<br>• `apps/web/Dockerfile`<br>• `apps/api/Dockerfile` | HTTPS (`443`) — CI push image, Render pull image theo tag `sha` / `v*.*.*` |
| **`ci-cd` (GitHub Actions Runner)** | GitHub Actions (`ubuntu-latest`) | Mục 4.2, Mục 5 (ADR-001, ADR-003) | • `.github/workflows/ci.yml`<br>• `.github/workflows/cd.yml`<br>• `docs/deployment.md` | HTTPS (`443`) — Chạy lint/test/build, push GHCR, gọi Render Deploy Hook và Smoke Test |
