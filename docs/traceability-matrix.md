# 🔗 MA TRẬN TRUY VẾT YÊU CẦU TOÀN HỆ THỐNG (REQUIREMENTS TRACEABILITY MATRIX)
## BREWLITE — 100% CASHLESS SPECIALTY COFFEE ROASTERY PLATFORM

> **Tài liệu:** `docs/traceability-matrix.md`  
> **Tài liệu SRS tham chiếu gốc:** [`docs/requirements/srs.md`](requirements/srs.md)  
> **Học phần:** Công nghệ Phần mềm (Software Engineering) — Assignment 2 (Requirements to Delivery)  
> **Giảng viên hướng dẫn:** ThS. Từ Lãng Phiêu  
> **Người phụ trách cập nhật Task T5.1b:** Mã Gia Vỹ (`3124410414@sv.sgu.edu.vn`)

---

## 1. TRỌNG TÂM TRUY VẾT LÁT CẮT XÁC THỰC — TASK T5.1b (AUTH VERTICAL SLICE)

Bảng dưới đây ánh xạ chi tiết lát cắt dọc **Task T5.1b: Đăng ký, Đăng nhập, JWT Guard và Xử lý 401** (do **Mã Gia Vỹ** thực hiện) từ tài liệu đặc tả yêu cầu (`docs/requirements/srs.md` & Đề bài Assignment 2) tới các sơ đồ thiết kế, mã nguồn Backend/Frontend và bộ kiểm thử tự động:

| Mã Yêu Cầu (SRS / Đề bài) | Use-Case & Tiêu Chí Nghiệm Thu (AC) | Sơ Đồ Thiết Kế (UML) | Thành Phần Mã Nguồn (Code Truth) | Mã Test Tự Động | Trạng Thái |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **`FR-04`** (`UC-04`)<br>*(Đề bài: FR-01 Đăng ký)* | **AC-04.1:** Từ chối đăng ký email đã tồn tại với mã lỗi `409 Conflict`. | • [`use-case.svg`](diagrams/use-case.svg)<br>• [`sequence-auth.svg`](diagrams/sequence-auth.svg)<br>• [`class.svg`](diagrams/class.svg) | • `POST /auth/register`<br>• `AuthController.register()`<br>• `AuthService.register()`<br>• `LoginClient.tsx` / `register/page.tsx` | **`API-T11`**<br>(`auth-api.spec.ts`) | ✅ **PASS** |
| **`FR-04`** (`UC-04`)<br>*(Đề bài: FR-01 Đăng ký)* | **AC-04.2:** Mật khẩu $< 6$ ký tự bị chặn tại Client form & Backend DTO/Service với mã `400 Bad Request`. | • [`sequence-auth.svg`](diagrams/sequence-auth.svg)<br>• [`class.svg`](diagrams/class.svg) | • `RegisterDto` (`@MinLength(6)`)<br>• `AuthService.register()`<br>• `LoginClient.tsx` (`password.length >= 6`) | **`API-T12`**<br>(`auth-api.spec.ts`) | ✅ **PASS** |
| **`FR-04`** (`UC-05`)<br>**`NFR-02`** (Bảo mật)<br>*(Đề bài: FR-02 Đăng nhập)* | **AC-04.3:** Đăng nhập sai mật khẩu trả về `401 Unauthorized`. Băm mật khẩu `bcrypt` (10 rounds), cấp JWT hạn `7d`, **tuyệt đối không trả về `passwordHash`**. | • [`sequence-auth.svg`](diagrams/sequence-auth.svg)<br>• [`class.svg`](diagrams/class.svg) | • `POST /auth/login`<br>• `AuthService.login()` & `safeUser()`<br>• `AuthModule` (`expiresIn: '7d'`) | **`API-T13`**<br>(`auth-api.spec.ts`) | ✅ **PASS** |
| **`FR-04`** (`UC-06`)<br>**`NFR-02`** (JWT Guard) | **AC-04.4:** Bảo vệ các route nhạy cảm (`GET /auth/me`, `POST /orders`, `POST /payments`) bằng `JwtAuthGuard`. Token hết hạn (`expiresIn: -1`) hoặc thiếu token bị chặn với `401 Unauthorized`. | • [`sequence-auth.svg`](diagrams/sequence-auth.svg)<br>• [`sequence-checkout.svg`](diagrams/sequence-checkout.svg) | • `JwtStrategy` (`passport-jwt`)<br>• `JwtAuthGuard`<br>• `GET /auth/me` | **`API-T10`**<br>(`auth-api.spec.ts`) | ✅ **PASS** |
| **`FR-03`**, **`FR-04`**<br>*(Xử lý 401 Client)* | **AC-03.4 & AC-04.4:** Khi API trả về `401 Unauthorized`, `api-client` tự động xóa token (`authStore.logout()`), điều hướng `/login?redirect=...` và **bảo toàn 100% giỏ hàng (`cartStore`)**. | • [`sequence-auth.svg`](diagrams/sequence-auth.svg)<br>• [`activity-checkout.svg`](diagrams/activity-checkout.svg) | • `frontend/src/lib/api-client.ts`<br>• `authStore.ts` (`logout`)<br>• `cartStore.ts` (giữ nguyên items) | **`WEB-T09`**<br>(`api-client.spec.ts`) | ✅ **PASS** |

---

## 2. MA TRẬN TRUY VẾT TỔNG THỂ TOÀN HỆ THỐNG (`FR-01` $\rightarrow$ `FR-13`)

| Mã FR | Tên Yêu Cầu Chức Năng | Mã Use-Case | Sơ Đồ UML Liên Quan | API Endpoint & Module Hiện Thực | File Kiểm Thử & Mã Test | Kết Quả |
| :---: | :--- | :---: | :--- | :--- | :--- | :---: |
| **`FR-01`** | Duyệt Thực Đơn & Tìm Kiếm Sản Phẩm | `UC-01` | `use-case.svg`, `activity-menu-cart.svg`, `class.svg` | `GET /products`<br>`ProductsController`, `ProductsService`, `menu/page.tsx` | `products.service.spec.ts`<br>`products.controller.spec.ts`<br>(`API-T01..T03`, `WEB-T01..T05`) | ✅ **PASS** |
| **`FR-02`** | Chi Tiết Món & Cá Nhân Hóa Size/Topping | `UC-02` | `use-case.svg`, `activity-menu-cart.svg`, `class.svg` | `GET /products/:id`<br>`ProductDetailModal.tsx`, `ProductDetailClient.tsx` | `products.service.spec.ts` | ✅ **PASS** |
| **`FR-03`** | Quản Lý Giỏ Hàng Cục Bộ (`localStorage`) | `UC-03` | `activity-menu-cart.svg`, `activity-checkout.svg` | `cartStore.ts`, `cart/page.tsx` | `api-client.spec.ts` (`WEB-T09`) | ✅ **PASS** |
| **`FR-04`** | Xác Thực JWT (7 ngày) & Phân Quyền RBAC | `UC-04`, `UC-05`, `UC-06` | `use-case.svg`, `sequence-auth.svg`, `class.svg` | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/profile`<br>`AuthService`, `JwtAuthGuard`, `RolesGuard`, `api-client.ts` | `auth-api.spec.ts` (`API-T10..T13`)<br>`auth.service.spec.ts`<br>`auth-profile.spec.ts`<br>`api-client.spec.ts` (`WEB-T09`) | ✅ **PASS** |
| **`FR-05`** | Đặt Đơn Hàng & Giữ Tồn Kho BOM (Optimistic Lock) | `UC-07` | `checkout-use-case.svg`, `activity-checkout.svg`, `sequence-checkout.svg`, `class.svg` | `POST /orders`<br>`OrdersController`, `OrdersService`, `checkout/page.tsx` | `orders.service.spec.ts`<br>`orders.controller.spec.ts`<br>(`API-T04`, `API-T05`) | ✅ **PASS** |
| **`FR-06`** | Thanh Toán Không Tiền Mặt (ZaloPay Sandbox / Mock & Idempotency) | `UC-07`, `UC-10` | `checkout-use-case.svg`, `activity-checkout.svg`, `sequence-checkout.svg`, `deployment.svg` | `POST /payments`, `POST /payments/zalopay/create`, `POST /payments/zalopay/callback`<br>`PaymentsService`, `ZaloPayService` | `payments.service.spec.ts` (`API-T06`, `API-T07`)<br>`zalopay.service.spec.ts`<br>`zalopay.controller.spec.ts` | ✅ **PASS** |
| **`FR-07`** | Mã Giảm Giá (Voucher) & Điểm Thưởng Hạt Vàng | `UC-08`, `UC-09` | `checkout-use-case.svg`, `sequence-checkout.svg`, `class.svg` | `POST /orders/validate-promo`, `POST /auth/redeem-points`<br>`OrdersService`, `AuthService`, `LoyaltyDrawer.tsx` | `orders.service.spec.ts` (`API-T05`)<br>`auth.service.spec.ts` | ✅ **PASS** |
| **`FR-08`** | Theo Dõi Tiến Trình Đơn Hàng Thời Gian Thực | `UC-12`, `UC-13` | `use-case.svg`, `activity-kds.svg` | `GET /orders/me`, `GET /orders/:id`<br>`OrdersController`, `orders/page.tsx` | `orders.service.spec.ts`<br>`orders.controller.spec.ts` | ✅ **PASS** |
| **`FR-09`** | Phân Hệ Quầy Pha Chế Barista (Staff KDS) | `UC-14`, `UC-15` | `use-case.svg`, `activity-kds.svg`, `class.svg` | `GET /orders`, `PATCH /orders/:id/status`<br>`OrdersService`, `staff/page.tsx` | `orders.service.spec.ts` (`API-T07`)<br>`inventory-packaging.spec.ts` | ✅ **PASS** |
| **`FR-10`** | Cổng Quản Trị Cửa Hàng, Nhân Sự & Kho BOM | `UC-16`, `UC-17` | `use-case.svg`, `class.svg`, `deployment.svg` | `InventoryController`, `CustomersController`, `admin/page.tsx` | `inventory.service.spec.ts`<br>`customers.service.spec.ts`<br>`customers.controller.spec.ts` | ✅ **PASS** |
| **`FR-11`** | Tự Động Hủy Đơn Quá Hạn 15 Phút & Hoàn Kho | `UC-07`, `UC-11` | `activity-checkout.svg`, `sequence-checkout.svg` | `OrdersService.cancelExpiredPendingOrders()` | `orders.service.spec.ts` (`API-T08`) | ✅ **PASS** |
| **`FR-12`** | Tìm Kiếm & Bộ Lọc Thực Đơn Unicode NFC | `UC-01` | `activity-menu-cart.svg` | `ProductsService.findAll()`, `menu/page.tsx` | `products.service.spec.ts` (`API-T02`, `WEB-T02`) | ✅ **PASS** |
| **`FR-13`** | Hủy Đơn Hàng Chủ Động & Hoàn Tồn Kho BOM | `UC-11` | `checkout-use-case.svg`, `activity-checkout.svg` | `PATCH /orders/:id/cancel`<br>`OrdersService.cancelOrder()` | `orders.service.spec.ts` (`API-T09`) | ✅ **PASS** |

---

## 3. TRUY VẾT YÊU CẦU PHI CHỨC NĂNG (`NFR-01` $\rightarrow$ `NFR-06`)

| Mã NFR | Thuộc Tính Chất Lượng | Giải Pháp Kỹ Thuật & Ràng Buộc | Minh Chứng Kiểm Thử |
| :---: | :--- | :--- | :--- |
| **`NFR-01`** | **Performance** ($\le 200\text{ms}$) | Index trên `User.email`, `Order.userId`, `Product.category`; kết nối Prisma Pool. | `products.service.spec.ts`, `orders.service.spec.ts` |
| **`NFR-02`** | **Security & Auth** | `bcrypt` (cost = 10), Stateless JWT (`7d`), `JwtAuthGuard`, `RolesGuard`, ẩn `passwordHash`, HMAC-SHA256 ZaloPay. | `auth-api.spec.ts` (`API-T10..T13`), `zalopay.service.spec.ts`, `WEB-T09` |
| **`NFR-03`** | **Concurrency & ACID** | Khóa lạc quan `version` trên `Order` & `InventoryItem`, `$transaction` ACID khi trừ/hoàn kho BOM. | `orders.service.spec.ts`, `inventory.service.spec.ts` |
| **`NFR-04`** | **Usability & Mobile-First** | Giao diện responsive, giữ giỏ hàng khi gặp 401 (`api-client.ts`), thông báo lỗi tiếng Việt rõ ràng. | `api-client.spec.ts` (`WEB-T09`), `LoginClient.tsx` |
| **`NFR-05`** | **DevOps & CI/CD** | Multi-stage Dockerfile, `docker-compose.yml`, GitHub Actions workflow `.github/workflows/ci.yml` (`lint`, `test`, `build`). | `health.controller.spec.ts`, GitHub Actions CI |
| **`NFR-06`** | **Financial Idempotency** | Header `Idempotency-Key` chống thanh toán/tạo đơn trùng lặp. | `payments.service.spec.ts` (21/21 tests) |
