# BÁO CÁO ĐỒ ÁN MÔN HỌC: CÔNG NGHỆ PHẦN MỀM

<div align="center">

**TRƯỜNG ĐẠI HỌC SÀI GÒN**  
**KHOA CÔNG NGHỆ THÔNG TIN**  
----- ❖ -----

### ĐỀ TÀI:
# BREWLITE — NỀN TẢNG ĐẶT VÀ THANH TOÁN ĐỒ UỐNG KHÔNG TIỀN MẶT (PWA)

**Học phần:** Công nghệ Phần mềm *(Software Engineering — Assignment 2: Requirements to Deployment)*  
**Giảng viên hướng dẫn:** ThS. Từ Lãng Phiêu  
**Kho lưu trữ mã nguồn:** `https://github.com/MaGiaVy/BrewLite_project` (Tag phát hành: `v1.0.0`)  
**Production URLs:**  
- **Web Application (Vercel):** `https://brew-lite-project.vercel.app`  
- **REST API (Render Singapore):** `https://brewlite-api-9viv.onrender.com` (Health: `/health`)  

### BẢNG THÀNH VIÊN NHÓM THỰC HIỆN

| STT | Họ và Tên | MSSV | Vai trò chính trong dự án |
| :---: | :--- | :---: | :--- |
| **1** | Mã Gia Vỹ | `3124410414` | Lead Monorepo, Customer UI, Admin UI, Production Deploy (Vercel/Render/Supabase) |
| **2** | Huỳnh Tuấn Kiệt | — | Context & Scope, Activity KDS/Menu/Cart, `ADR-003`, KDS & Xác nhận đơn |
| **3** | Nguyễn Gia Thành | — | SRS (`FR-11..13`), Sequence Checkout UML, Orders API, BOM Optimistic Locking, Integration Tests |
| **4** | Vũ Châu Minh Khôi | — | Architecture Overview & ADRs, Chi tiết món & Cart Zustand |
| **5** | Quách Kỳ Minh | — | Products API & Menu, Deployment Diagram (`deployment.puml`), Chuẩn hóa CI/Test |
| **6** | Nguyễn Thị Ý | — | Use Case Checkout, Docker Compose & `.env.example`, Payment Mock/VietQR, Playwright E2E |

*TP. Hồ Chí Minh, tháng 11 năm 2026*

</div>

---

## LỜI CẢM ƠN

Nhóm chúng em xin trân trọng gửi lời cảm ơn chân thành nhất đến quý Thầy Cô Khoa Công nghệ Thông tin — Trường Đại học Sài Gòn đã truyền đạt những kiến thức nền tảng và phương pháp luận quan trọng về kỹ nghệ phần mềm.

Đặc biệt, nhóm xin bày tỏ lòng biết ơn sâu sắc tới **ThS. Từ Lãng Phiêu**, giảng viên môn Công nghệ Phần mềm. Nhờ sự định hướng quy trình rõ ràng từ khâu khai thác yêu cầu, mô hình hóa UML, thiết kế kiến trúc đến triển khai CI/CD và vận hành thực tế trên môi trường Production, nhóm đã hoàn thiện hệ thống **BrewLite** theo đúng chuẩn công nghiệp và đạt được các mục tiêu đề ra.

Do thời gian và kinh nghiệm thực chiến còn hạn chế, báo cáo và sản phẩm khó tránh khỏi những thiếu sót. Nhóm rất mong nhận được những ý kiến đóng góp quý báu từ Thầy để hoàn thiện hơn trong các dự án tiếp theo.

---

## MỤC LỤC

1. [TASK 1: KHAI THÁC VÀ ĐẶC TẢ YÊU CẦU](#task-1-khai-thác-và-đặc-tả-yêu-cầu)
   - [TASK 1.1. Bối cảnh, Các bên liên quan và Phạm vi dự án](#task-11-bối-cảnh-các-bên-liên-quan-và-phạm-vi-dự-án)
   - [TASK 1.2. Yêu cầu Chức năng, Phi chức năng và Sơ đồ Use-case tổng quát](#task-12-yêu-cầu-chức-năng-phi-chức-năng-và-sơ-đồ-use-case-tổng-quát)
   - [TASK 1.3. Đặc tả Use-case trọng tâm: Đặt và Thanh toán đơn hàng](#task-13-đặc-tả-use-case-trọng-tâm-đặt-và-thanh-toán-đơn-hàng)
2. [TASK 2: MÔ HÌNH HÓA HỆ THỐNG](#task-2-mô-hình-hóa-hệ-thống)
   - [TASK 2.1. Sơ đồ Hoạt động (Activity Diagram)](#task-21-sơ-đồ-hoạt-động-activity-diagram)
   - [TASK 2.2. Sơ đồ Trình tự (Sequence Diagram)](#task-22-sơ-đồ-trình-tự-sequence-diagram)
   - [TASK 2.3. Sơ đồ Lớp miền (Domain Class Diagram)](#task-23-sơ-đồ-lớp-miền-domain-class-diagram)
3. [TASK 3: THIẾT KẾ KIẾN TRÚC](#task-3-thiết-kế-kiến-trúc)
   - [TASK 3.1. Phương pháp và Quyết định Kiến trúc (C4 & ADRs)](#task-31-phương-pháp-và-quyết-định-kiến-trúc-c4--adrs)
   - [TASK 3.2. Sơ đồ Triển khai (Deployment Diagram)](#task-32-sơ-đồ-triển-khai-deployment-diagram)
4. [TASK 4: TRIỂN KHAI — SPRINT 1 & CONTINUOUS INTEGRATION](#task-4-triển-khai--sprint-1--continuous-integration)
   - [TASK 4.1. Thiết lập Repository GitHub & Quy trình làm việc](#task-41-thiết-lập-repository-github--quy-trình-làm-việc)
   - [TASK 4.2. Mô hình hóa Cơ sở dữ liệu (ERD 12 bảng PostgreSQL)](#task-42-mô-hình-hóa-cơ-sở-dữ-liệu-erd-12-bảng-postgresql)
   - [TASK 4.3. Triển khai MVP Sprint 1](#task-43-triển-khai-mvp-sprint-1)
   - [TASK 4.4. Continuous Integration (CI Pipeline)](#task-44-continuous-integration-ci-pipeline)
5. [TASK 5: TRIỂN KHAI — SPRINT 2, KIỂM THỬ, CI/CD VÀ BÀN GIAO](#task-5-triển-khai--sprint-2-kiểm-thử-cicd-và-bàn-giao)
   - [5.1. User Stories](#51-user-stories)
   - [5.2. Test Scenario, Test Case và Kết quả Kiểm thử Tự động](#52-test-scenario-test-case-và-kết-quả-kiểm-thử-tự-động)
   - [5.3. Giao diện Hệ thống Thực tế (UI Screenshots)](#53-giao-diện-hệ-thống-thực-tế-ui-screenshots)
   - [5.4. Continuous Delivery, Triển khai Production, Smoke Test & Rollback](#54-continuous-delivery-triển-khai-production-smoke-test--rollback)
   - [5.5. Sprint Review & Sprint Retrospective](#55-sprint-review--sprint-retrospective)
6. [MỤC 8: MA TRẬN TRUY VẾT (TRACEABILITY MATRIX)](#mục-8-ma-trận-truy-vết-traceability-matrix)
7. [KẾT LUẬN](#kết-luận)

---

## TASK 1: KHAI THÁC VÀ ĐẶC TẢ YÊU CẦU

### TASK 1.1. Bối cảnh, Các bên liên quan và Phạm vi dự án

#### 1. Bối cảnh và Tuyên bố bài toán
Ngành dịch vụ cà phê thủ công (*Specialty Coffee*) tại đô thị đối mặt với nhu cầu gọi món nhanh, cá nhân hóa cao (Size, Topping, mức đá/đường) nhưng các quầy truyền thống vẫn phụ thuộc gọi món trực tiếp và thu tiền mặt:
- **Khách hàng:** Mất 5–10 phút xếp hàng giờ cao điểm, dễ nhầm lẫn tùy chọn pha chế, bất tiện tiền mặt lẻ và không biết tiến độ ly nước.
- **Cửa hàng & Barista:** Quá tải thu ngân, dễ thất thoát đối soát cuối ca, thiếu đồng bộ tồn kho nguyên liệu dẫn đến nhận đơn nhưng hết nguyên liệu pha chế.
- **Giải pháp BrewLite:** Ứng dụng web Mobile-First/PWA (**Next.js 15.1.6** + **NestJS 10.4** + **PostgreSQL 16** + **Docker**) hỗ trợ khách hàng duyệt thực đơn, cá nhân hóa đồ uống, thanh toán **100% không tiền mặt** (*ZaloPay Sandbox / Mock Gateway*) và theo dõi tiến độ pha chế thời gian thực.

#### 2. Các bên liên quan chính (Stakeholder Matrix)

| STT | Nhóm Stakeholder | Vai trò | Mục tiêu & Kỳ vọng chính |
| :---: | :--- | :--- | :--- |
| **1** | **Khách hàng (`Customer`)** | Người dùng cuối đặt món và thanh toán | Đặt món dưới 60s; tùy chỉnh hương vị chính xác; không trừ tiền lặp (`Idempotency-Key`); biết rõ lúc nào ra quầy nhận nước. |
| **2** | **Nhân viên quầy / Barista (`Staff`)** | Tiếp nhận đơn và pha chế | Màn hình KDS (`/staff`) hiển thị rõ Size, đá, đường, topping; cập nhật trạng thái 1 chạm; đơn đã thanh toán chắc chắn trước khi pha. |
| **3** | **Quản lý cửa hàng (`Admin`)** | Giám sát vận hành & tồn kho | Không bán vượt tồn kho (*Zero Overselling*); kiểm soát định mức BOM & giá vốn; minh bạch doanh thu, Voucher và điểm Loyalty. |
| **4** | **Giảng viên / Nghiệm thu** | Đánh giá quy trình & sản phẩm | Đủ tài liệu SRS, UML, ADR, Ma trận truy vết; có Unit/Integration/E2E tests; CI/CD tự động và URL Production HTTPS truy cập được. |
| **5** | **Nhóm phát triển (`Dev Team`)** | Phân tích, thiết kế, lập trình, kiểm thử | Kiểm soát phạm vi trong 2 Sprint; kiến trúc module hóa sạch sẽ; Docker & CI/CD hỗ trợ kiểm thử liên tục. |
| **6** | **Đối tác thanh toán (`ZaloPay / Mock`)** | Xử lý giao dịch không tiền mặt | REST API + Webhook ký số `HMAC-SHA256`, chống gửi trùng bằng `Idempotency-Key`, phản hồi trạng thái tức thời. |

#### 3. Phạm vi dự án (3 tầng theo MoSCoW)

| Tầng phạm vi | Các hạng mục thuộc phạm vi |
| :--- | :--- |
| **Trong phạm vi MVP (Must Have — Sprint 1 & 2)** | Menu thực đơn, tìm kiếm & lọc danh mục; Chi tiết món (Size S/M/L, Topping); Giỏ hàng Zustand + `localStorage`; Xác thực & RBAC (`JWT` 7 ngày); Tạo đơn & Máy trạng thái 5 bước; Khóa đồng thời kép (*Dual-layer Optimistic Locking*); Thanh toán ZaloPay Sandbox & Mock Gateway (`Idempotency-Key`); Voucher & Loyalty (`1.000đ = 1 điểm`); Theo dõi đơn & Lịch sử; Docker Compose, Test & CI/CD. |
| **Phạm vi mở rộng (Should Have — Đã hoàn thành 100%)** | Màn hình Barista KDS (`/staff`) kèm âm báo đơn mới & nút báo hết món `86`; Cổng quản trị Admin (`/admin`) quản lý Menu, kho nguyên liệu BOM, công thức `Recipe`, Voucher, nhân sự, khách hàng và biểu đồ doanh thu. |
| **Ngoài phạm vi (Out-of-Scope)** | Giao hàng tận nơi (*Home Delivery*); Ứng dụng Native iOS/Android; Đăng nhập OAuth mạng xã hội; Thanh toán tiền mặt COD tại quầy. |

#### 4. Giả định, Ràng buộc và Ma trận Rủi ro ban đầu
- **Ràng buộc công nghệ:** Frontend Next.js (App Router, TypeScript, TailwindCSS, Zustand); Backend NestJS (TypeScript, Passport JWT, `class-validator`); Database PostgreSQL + Prisma ORM; Docker Compose chạy đồng thời `web`, `api`, `db`; JWT hết hạn sau 7 ngày.
- **Ràng buộc quy trình:** Scrum 2 Sprint, CI chặn merge khi lỗi lint/test/build, bắt buộc có URL Production HTTPS.
- **Rủi ro trọng yếu & Biện pháp:**
  - `RSK-01` *Bán vượt tồn kho / xung đột trạng thái:* Dùng Transaction + **Dual-layer Optimistic Locking** (`version` trên `Ingredient` và `Order`), xung đột trả `409 Conflict`.
  - `RSK-02` *Trừ tiền lặp (`Double Charge`):* Dùng `Idempotency-Key` (UUIDv4) và khóa nút bấm trên UI.
  - `RSK-03` *Mất giỏ hàng khi reload:* Zustand `persist` lưu vào `localStorage`.
  - `RSK-04` *Nghẽn Deploy & CI/CD:* Chuẩn hóa `docker-compose.yml` từ Sprint 1, dùng Vercel + Render + Supabase.
  - `RSK-05` *Sai lệch giá Client/Server:* Backend tính lại toàn bộ giá gốc, size, topping, voucher từ Database.

---

### TASK 1.2. Yêu cầu Chức năng, Phi chức năng và Sơ đồ Use-case tổng quát

#### 1. Yêu cầu Chức năng (`FR-01` – `FR-13`)

| Mã | Tên yêu cầu | MoSCoW | Mô tả & Tiêu chí chấp nhận (Acceptance Criteria) tóm tắt |
| :---: | :--- | :---: | :--- |
| **FR-01** | Duyệt thực đơn & trạng thái món | `MUST` | `GET /products` (`200 OK`, ≥ 10 món); lọc danh mục client-side; Skeleton loading, Empty state; hiển thị badge *Hết hàng* khi hết BOM hoặc `isSoldOutManual = true`. |
| **FR-02** | Chi tiết món & cá nhân hóa | `MUST` | Trang `/products/[id]` & Quick-Add: Size S/M/L (hoặc `ALL` cho bánh ngọt); tối đa 10 Topping; mức đường/đá (`100%/70%/50%/0%`); tính giá động theo `(basePrice + sizeUpcharge + ΣtoppingPrice) × qty`. |
| **FR-03** | Quản lý giỏ hàng cục bộ | `MUST` | Zustand + `localStorage`; gom nhóm theo `lineId` (`productId-size-toppingIds`); chỉnh số lượng UI (`1..20`/dòng, DTO `1..50`/dòng, tối đa 50 dòng/đơn), xóa món; tự tính tổng tiền & đồng bộ badge header. |
| **FR-04** | Xác thực & phân quyền JWT RBAC | `MUST` | `POST /auth/register`, `POST /auth/login` (`bcrypt` 10 vòng, JWT 7 ngày, `ThrottlerGuard` 5 req/60s); trùng email `409`, sai mật khẩu `401`, thiếu quyền `403`; khóa cứng Single Root Admin; Next.js Middleware bảo vệ `/admin/*`, `/staff/*`. |
| **FR-05** | Đặt đơn & giữ kho BOM đồng thời | `MUST` | `POST /orders` tạo đơn `PENDING` (hoặc tự chốt `PAID` nếu `totalAmount = 0đ`); khóa hàng User (`SELECT ... FOR UPDATE`), giới hạn ≤ 5 đơn chờ; thiếu tồn kho ban đầu trả `400 Bad Request`, đụng độ Optimistic Locking `version` trả `409 Conflict`; giữ kho tối đa 15 phút. |
| **FR-06** | Thanh toán Cashless & ZaloPay | `MUST` | Hỗ trợ ZaloPay Sandbox (`HMAC-SHA256`, webhook IPN, polling 3s) & Mock Gateway; `Idempotency-Key` chống trừ lặp; bảo vệ chống IDOR (`403`); endpoint giả lập Sandbox khóa mặc định trên Production (`ALLOW_SANDBOX_CONFIRM`). |
| **FR-07** | Voucher & Điểm Loyalty Hạt Vàng | `MUST` | Mã giảm giá (`BREWLITE10`, `WELCOME20`, `DiscountCode`, `UserVoucher`); trừ lượt/ví voucher ngay khi tạo đơn (`voucherDeducted`) & hoàn lại nếu hủy/hết hạn; tích `1.000đ = 1 điểm` khi `PAID`; đổi điểm server-enforced (`10/15/20/50` điểm) trong transaction atomic. |
| **FR-08** | Theo dõi & lịch sử đơn hàng | `MUST` | `/orders` (`GET /orders/me`) sắp mới nhất lên đầu; 5 trạng thái backend `PENDING → PAID → PREPARING → READY → COMPLETED` (UI hiển thị thanh tiến trình 3 bước chính); polling `4–5s` tự cập nhật. |
| **FR-09** | Quầy pha chế Barista KDS (`/staff`) | `SHOULD` | Chỉ `STAFF`/`ADMIN` truy cập; polling `3s` xem đơn `PAID`/`PREPARING` đủ Size/Topping/Đá/Đường; 1 chạm chuyển trạng thái; bật/tắt hết món `86` (`PATCH /products/:id/sold-out`); ẩn công thức & giá vốn khỏi `STAFF`. |
| **FR-10** | Admin Portal (`/admin`) | `SHOULD` | Quản trị Menu, kho nguyên liệu BOM (`Ingredient`, `Recipe`, `ToppingRecipe`, `InventoryLog`), Voucher, nhân sự `STAFF`, khách hàng và thống kê doanh thu. |
| **FR-11** | Tự động hủy đơn quá hạn 15 phút | `COULD` | Cron job `ExpireOrdersJob` (`@Cron('*/1 * * * *')`) quét đơn `PENDING`/`PAYMENT_FAILED` quá 15 phút → `CANCELLED` và hoàn trả 100% kho BOM & voucher. |
| **FR-12** | Tìm kiếm & lọc thực đơn nâng cao | `COULD` | Tìm kiếm không phân biệt hoa/thường kết hợp 6 tab danh mục (`all`, `espresso`, `salt_phin`, `tea_matcha`, `cold_brew`, `bakery`). |
| **FR-13** | Hủy đơn & hoàn kho BOM | `SHOULD` | `CUSTOMER` được hủy đơn khi đang `PENDING`/`PAYMENT_FAILED`; `STAFF`/`ADMIN` được hủy đơn `PAID` (trước khi `PREPARING`) → hoàn 100% kho BOM & hoàn lượt/ví voucher (`UserVoucher`/`DiscountCode`). |

#### 2. Yêu cầu Phi chức năng (`NFR-01` – `NFR-06`)

| Mã | Nhóm | Yêu cầu & Tiêu chí kiểm chứng |
| :---: | :--- | :--- |
| **NFR-01** | Hiệu năng | API đọc menu (`GET /products`) và lịch sử đơn (`GET /orders/me`) phản hồi nhanh, không N+1 query gây nghẽn. |
| **NFR-02** | Bảo mật | JWT Bearer + `RolesGuard`, bcrypt 10 rounds, Throttler rate-limiting, chống IDOR sở hữu đơn, Edge Middleware RBAC, không lộ `passwordHash`/secret trong log. |
| **NFR-03** | Toàn vẹn dữ liệu | Zero Overselling nhờ PostgreSQL Transaction + Dual-layer Optimistic Locking (`version` trên `Ingredient` & `Order`). |
| **NFR-04** | Tính khả dụng | Giao diện Mobile-First/PWA responsive (`360px–768px+`), bền vững giỏ hàng qua `localStorage`, polling cập nhật đơn tự động. |
| **NFR-05** | Khả năng triển khai | Dockerize 3 services (`docker-compose.yml`), `GET /health` kiểm tra DB (`SELECT 1`), CI/CD GitHub Actions (`ci.yml`, `cd.yml`), Production HTTPS (Vercel + Render + Supabase), Smoke Test & Secret Scan. |
| **NFR-06** | Chống trùng giao dịch | `Idempotency-Key` duy nhất trên `Order` (`(userId, idempotencyKey)`) và `Payment` (`idempotencyKey`), trả kết quả cũ nếu client retry. |

#### 3. Sơ đồ Use-case tổng quát của hệ thống
Sơ đồ gồm **4 Tác nhân** (*Khách hàng*, *Nhân viên/Barista*, *Quản trị viên*, *Cổng thanh toán ZaloPay/Mock*) và **17 Use-cases** (`UC-01` đến `UC-17`):

![Sơ đồ Use-Case tổng quát hệ thống BrewLite](diagrams/use-case.png)  
*Hình 1.1: Sơ đồ Use-Case tổng quát của hệ thống BrewLite (`docs/diagrams/use-case.png`).*

---

### TASK 1.3. Đặc tả Use-case trọng tâm: Đặt và Thanh toán đơn hàng

#### 1. Sơ đồ Use-case phân hệ Đặt và Thanh toán

![Sơ đồ Use-Case Đặt và Thanh toán](diagrams/checkout-use-case.png)  
*Hình 1.2: Sơ đồ Use-Case phân hệ Đặt hàng và Thanh toán (`docs/diagrams/checkout-use-case.png`).*

#### 2. Bảng đặc tả chi tiết Use-case (`UC-07a` Tạo đơn hàng & `UC-07b` Thanh toán đơn hàng)

| Mục đặc tả | `UC-07a`: Tạo đơn hàng (Create Order) | `UC-07b`: Thanh toán đơn hàng (Process Payment) |
| :--- | :--- | :--- |
| **Tóm tắt** | Tiếp nhận giỏ hàng, kiểm tra định mức BOM, khóa lạc quan và tạo đơn `PENDING`. | Thực hiện thanh toán qua ZaloPay Sandbox/Mock, chuyển `PAID`, chốt trừ kho BOM & cộng điểm. |
| **Actor** | Chính: Khách hàng. Hỗ trợ: PostgreSQL. | Chính: Khách hàng. Hỗ trợ: ZaloPay Sandbox / Mock Gateway. |
| **Trigger** | Khách bấm *"Tiến hành đặt hàng"* tại `/cart`. | Gọi nối tiếp từ `UC-07a` hoặc khách bấm *"Thanh toán lại"* trên đơn `PAYMENT_FAILED`. |
| **Tiền điều kiện** | Giỏ hàng không rỗng; khách có JWT Bearer hợp lệ. | Đơn ở trạng thái `PENDING` hoặc `PAYMENT_FAILED`, còn trong hạn giữ kho 15 phút. |
| **Dòng sự kiện chính** | 1. Khách vào `/checkout`, kiểm tra JWT (`<<include>>`).<br>2. Chọn/áp mã Voucher (`<<extend>>`) và phương thức thanh toán.<br>3. Frontend sinh `Idempotency-Key` (UUIDv4), gửi `POST /orders`.<br>4. Backend mở Transaction Pha 1: `SELECT ... FOR UPDATE` trên User, kiểm tra ≤ 5 đơn chờ, trừ lượt/ví voucher (`voucherDeducted`).<br>5. Tính định mức BOM (`computeRequiredIngredients`), kiểm tra & giữ tồn kho với Optimistic Locking (`version + 1`).<br>6. Tạo `Order` trạng thái `PENDING` (hoặc `PAID` nếu `totalAmount = 0đ`), commit và chuyển sang `UC-07b`. | 1. Backend gọi `POST /payments/zalopay/create` (ký `HMAC-SHA256` Key1) hoặc `POST /payments`.<br>2. Hiển thị QR / trang `/gateway/zalopay`, đếm ngược hiển thị UI 5p (giữ kho backend 15p) & polling 3s (`GET /payments/zalopay/status/:orderId`).<br>3. Khách quét QR hoặc xác nhận trên cổng Sandbox.<br>4. Backend nhận Webhook IPN (xác minh Key2) / xác nhận và mở Transaction Pha 2: đổi `Order` → `PAID`, tạo `Payment` (`SUCCESS`), cộng điểm Loyalty (`1.000đ = 1 điểm`).<br>5. Frontend xóa giỏ hàng và chuyển tới `/orders/:id`. |
| **Dòng sự kiện phụ / Ngoại lệ** | • **A1:** Áp dụng Voucher hợp lệ giảm trừ tổng tiền (`0đ` tự chốt `PAID`).<br>• **E1 (`401`):** Chưa đăng nhập → chuyển `/auth/login?redirect=/checkout`, giữ nguyên giỏ.<br>• **E2 (`400`/`409`):** Thiếu nguyên liệu BOM trả `400 Bad Request`; đụng độ `version` trả `409 Conflict` → rollback.<br>• **E3:** Trùng `Idempotency-Key` (khớp payload) → trả lại đơn đã tạo, không tạo trùng. | • **A1:** Thanh toán thất bại → `PAYMENT_FAILED`, vẫn giữ kho trong hạn 15 phút để khách retry.<br>• **A2:** Khách hủy `PENDING`/`PAYMENT_FAILED` (`DELETE /orders/:id`) hoặc Staff/Admin hủy `PAID` trước khi `PREPARING` → hoàn 100% kho BOM & hoàn voucher.<br>• **E1:** Quá 15 phút chưa thanh toán → `ExpireOrdersJob` chuyển `CANCELLED` và hoàn kho BOM + voucher. |
| **Hậu điều kiện** | Tạo `Order` (`PENDING`), giữ chỗ kho BOM (`version + 1`). | Thành công: `Order = PAID`, `Payment = SUCCESS`, cộng điểm Loyalty, dọn giỏ hàng. |

---

## TASK 2: MÔ HÌNH HÓA HỆ THỐNG

### TASK 2.1. Sơ đồ Hoạt động (Activity Diagram)

Nhằm mô hình hóa trọn vẹn hành vi động của hệ thống theo đúng hành trình khách hàng và nhân viên pha chế, nhóm chuẩn hóa thành **1 Sơ đồ Hoạt động Toàn trình End-to-End** qua **6 Swimlanes** (*Khách hàng*, *Web Next.js*, *NestJS API*, *PostgreSQL*, *ZaloPay / Mock*, *Nhân viên KDS*), bao quát **6 giai đoạn nghiệp vụ liên tục** và các nhánh ngoại lệ (`400`/`409` hết hàng BOM, lỗi thanh toán, hủy đơn hợp lệ, quá hạn 15 phút):

#### 1. Bảng tổng hợp 6 giai đoạn nghiệp vụ End-to-End

| STT | Giai đoạn | Phân làn xử lý chính | Trọng tâm kỹ thuật & Ngoại lệ |
| :---: | :--- | :--- | :--- |
| **1** | **Duyệt Thực đơn** | Khách hàng → Web → API → PostgreSQL | Truy cập `/menu`, hiển thị Skeleton loader, gọi `GET /products` lọc theo 6 tab danh mục & trạng thái bán (`isActive`, `isSoldOutManual`). |
| **2** | **Tùy biến & Giỏ hàng** | Khách hàng ↔ Web (`Zustand`) | Vào `/products/[id]` (hoặc Quick-Add `+`); tính giá theo Size (`S/M/L`) + Topping (tối đa 10) + đá/đường; gom nhóm theo `lineId` (`1..20`/dòng) & lưu `localStorage`. |
| **3** | **Đặt đơn (Pha 1: `PENDING`)** | Web → API → PostgreSQL | Kiểm tra JWT Bearer (giữ nguyên giỏ nếu cần đăng nhập); gắn `Idempotency-Key` (UUIDv4); `SELECT ... FOR UPDATE` giới hạn `<= 5` đơn chờ; trừ voucher trước (`voucherDeducted`); thiếu BOM trả `400`, đụng độ `version` trả `409 Conflict`. |
| **4** | **Thanh toán (Pha 2: ZaloPay / Mock)** | ZaloPay ↔ Khách ↔ Web ↔ API | Hiển thị QR / `/gateway/zalopay`, đếm ngược UI 5p (giữ kho 15p) & polling 3s; xác thực IPN `HMAC-SHA256` chuyển `PAID`, tạo `Payment`, cộng điểm (`1.000đ = 1đ`). Nếu lỗi → `PAYMENT_FAILED` giữ kho đến hết 15 phút để thử lại. |
| **5** | **Hủy đơn & Hết hạn 15 phút** | Khách / KDS → API / Cron | Khách hủy đơn `PENDING`/`PAYMENT_FAILED` (`DELETE /orders/:id`) hoặc Staff/Admin hủy `PAID` trước khi `PREPARING` → hoàn 100% kho BOM & voucher; quá 15 phút `ExpireOrdersJob` tự hủy & hoàn kho. |
| **6** | **Pha chế KDS & Giao nhận** | Nhân viên KDS (`/staff`) ↔ API ↔ Khách | Barista polling 3s nhận đơn `PAID`, chuyển `PREPARING → READY → COMPLETED` qua State Machine guard `assertTransition`; khách theo dõi 5s tại `/orders/:id`. |

#### 2. Sơ đồ Hoạt động Toàn trình End-to-End (6 Swimlanes)

<div align="center">

![Sơ đồ Hoạt động End-to-End BrewLite](diagrams/activity_E2E.png)  
*Hình 2.1: Sơ đồ Hoạt động toàn trình luồng Đặt hàng, Thanh toán và Pha chế End-to-End với 6 Swimlanes (`docs/diagrams/activity_E2E.png`).*

</div>

---

### TASK 2.2. Sơ đồ Trình tự (Sequence Diagram)

Sơ đồ trình tự được giữ ở mức trừu tượng trung bình (~18 thông điệp cốt lõi, phong cách đen trắng tối giản) giữa 5 lifeline (`Customer → Web App → NestJS API → PostgreSQL → Payment Gateway`), làm rõ kiểm tra JWT, Transaction 2 pha, trừ voucher Pha 1, Optimistic Locking, nhánh `alt` thanh toán (`PAID`/`PAYMENT_FAILED`) và hoàn kho `ExpireOrdersJob`:

<div align="center">

![Sơ đồ Trình tự Đặt hàng và Thanh toán](diagrams/sequence-checkout.png)  
*Hình 2.2: Sơ đồ Trình tự luồng Đặt hàng và Thanh toán (`docs/diagrams/sequence-checkout.png`).*

</div>

---

### TASK 2.3. Sơ đồ Lớp miền (Domain Class Diagram)

#### 1. Sơ đồ Lớp miền

<div align="center">

![Sơ đồ Lớp miền BrewLite](diagrams/class.png)  
*Hình 2.3: Sơ đồ Lớp miền hệ thống BrewLite (`docs/diagrams/class.png`).*

</div>

#### 2. Bảng danh sách các lớp và Enum (`apps/api/prisma/schema.prisma`)

| STT | Tên lớp / Enum | Loại | Ý nghĩa trong miền nghiệp vụ |
| :---: | :--- | :--- | :--- |
| **1** | `User` | Lớp người dùng | Tài khoản Khách hàng, Barista hoặc Admin, lưu `role`, `loyaltyPoints`, `tokenVersion`. |
| **2** | `Product` | Lớp khái niệm | Món đồ uống hoặc bánh ngọt bán trên thực đơn, hỗ trợ `sizeUpchargeM/L` và `isSoldOutManual`. |
| **3** | `Ingredient` | Lớp kho vận | Nguyên vật liệu / bao bì (`INGREDIENT` \| `PACKAGING`) kèm `version` phục vụ Optimistic Locking. |
| **4** | `Recipe` | Lớp định mức | Định mức nguyên liệu BOM cho từng `(productId, ingredientId, size)`. |
| **5** | `ToppingRecipe` | Lớp định mức | Danh mục Topping / đồ ăn kèm và định mức nguyên liệu tiêu hao tương ứng. |
| **6** | `InventoryLog` | Lớp nhật ký | Lịch sử nhập/điều chỉnh kho (`RESTOCK` \| `ADJUST`), lưu tồn trước/sau và người thực hiện. |
| **7** | `StoreSetting` | Lớp cấu hình | Lưu cấu hình cửa hàng dạng `key-value` (phụ thu size chuẩn, thông số vận hành). |
| **8** | `DiscountCode` | Lớp khuyến mãi | Mã giảm giá công khai (tỷ lệ `%`, đơn tối thiểu, trần giảm tối đa, số lượt dùng). |
| **9** | `UserVoucher` | Lớp sở hữu | Voucher cá nhân khách hàng đã đổi bằng điểm Hạt Vàng. |
| **10** | `Order` | Lớp sự kiện | Đơn hàng trung tâm, lưu trạng thái, tổng tiền, `version` và `idempotencyKey`. |
| **11** | `OrderItem` | Lớp chi tiết | Từng dòng món trong đơn (size, mức đá/đường, nhiệt độ, danh sách toppings, đơn giá). |
| **12** | `Payment` | Lớp giao dịch | Giao dịch thanh toán gắn với `Order`, bảo vệ bằng `idempotencyKey` duy nhất. |
| **E1–E4** | `OrderStatus`, `PaymentMethod`, `PaymentStatus`, `Role` | Enum | Các tập giá trị trạng thái và phân quyền chuẩn hóa toàn hệ thống. |

#### 3. Bảng mô tả chi tiết thuộc tính các lớp chính

- **Lớp `User`**

| STT | Tên thuộc tính | Kiểu | Ràng buộc | Ý nghĩa |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | `Int` | PK, AutoIncrement | Mã định danh người dùng |
| 2 | `email` | `String` | UNIQUE, NOT NULL | Email đăng nhập |
| 3 | `passwordHash` | `String` | NOT NULL | Mật khẩu băm bcrypt |
| 4 | `fullName`, `phone`, `position` | `String?` | Nullable | Họ tên, SĐT, chức vụ nhân viên |
| 5 | `isActive` | `Boolean` | Default `true` | Trạng thái kích hoạt tài khoản |
| 6 | `role` | `Role` | Default `CUSTOMER` | Vai trò (`CUSTOMER` \| `STAFF` \| `ADMIN`) |
| 7 | `loyaltyPoints` | `Int` | Default `0` | Điểm Hạt Vàng tích lũy |
| 8 | `tokenVersion` | `Int` | Default `0` | Phiên bản token phục vụ thu hồi phiên |

- **Lớp `Product`**

| STT | Tên thuộc tính | Kiểu | Ràng buộc | Ý nghĩa |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | `Int` | PK, AutoIncrement | Mã sản phẩm |
| 2 | `name`, `description`, `imageUrl` | `String` | `name` NOT NULL | Tên món, mô tả, đường dẫn ảnh |
| 3 | `basePrice` | `Float` | NOT NULL | Giá cơ sở (Size S hoặc chuẩn) |
| 4 | `sizeUpchargeM`, `sizeUpchargeL` | `Float?` | Nullable | Phụ thu riêng Size M, Size L |
| 5 | `category`, `tag` | `String` | Default `"vietnamese"` | Nhóm danh mục & nhãn nổi bật |
| 6 | `isActive`, `isSoldOutManual` | `Boolean` | Default `true` / `false` | Bật bán trên menu / Báo hết món `86` |

- **Lớp `Order`**

| STT | Tên thuộc tính | Kiểu | Ràng buộc | Ý nghĩa |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id` | `Int` | PK, AutoIncrement | Mã đơn hàng |
| 2 | `userId` | `Int?` | FK → `User.id` | Chủ đơn hàng |
| 3 | `status` | `OrderStatus` | Default `PENDING` | Trạng thái (`PENDING`, `PAID`, `PREPARING`, `READY`, `COMPLETED`, `PAYMENT_FAILED`, `CANCELLED`) |
| 4 | `totalAmount`, `discountAmount` | `Float` | NOT NULL | Tổng tiền thanh toán và tiền giảm |
| 5 | `discountCode`, `voucherDeducted` | `String?` / `Boolean` | Default `false` | Mã voucher áp dụng & cờ đã trừ lượt/ví |
| 6 | `version` | `Int` | Default `0` | Khóa lạc quan chống cập nhật xung đột |
| 7 | `idempotencyKey`, `idempotencyPayload` | `String?` | UQ `(userId, idempotencyKey)` | Chống tạo trùng đơn hàng |
| 8 | `staffId`, `staffName` | `Int?` / `String?` | Nullable | Nhân viên nhận pha chế trên KDS |

- **Lớp `OrderItem`**

| STT | Tên thuộc tính | Kiểu | Ràng buộc | Ý nghĩa |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id`, `orderId`, `productId` | `Int` | PK / FK → `Order.id` (Cascade) | Mã dòng, mã đơn, mã sản phẩm |
| 2 | `productName`, `size` | `String` | NOT NULL | Tên món snapshot & kích cỡ (`S`/`M`/`L`/`ALL`) |
| 3 | `sugarLevel`, `iceLevel`, `temperature`, `notes` | `String?` | Defaults `"100%"`, `"COLD"` | Khẩu vị đường, đá, nóng/lạnh, ghi chú |
| 4 | `toppings` | `String[]` | Array | Danh sách tên topping đã chọn |
| 5 | `quantity`, `unitPrice` | `Int` / `Float` | NOT NULL | Số lượng và đơn giá tại thời điểm đặt |

- **Lớp `Payment`**

| STT | Tên thuộc tính | Kiểu | Ràng buộc | Ý nghĩa |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `id`, `orderId` | `Int` | PK / FK → `Order.id` | Mã giao dịch & mã đơn hàng |
| 2 | `idempotencyKey` | `String?` | UNIQUE | Khóa chống trừ tiền lặp |
| 3 | `amount` | `Float` | NOT NULL | Số tiền giao dịch |
| 4 | `method` | `PaymentMethod` | `EWALLET` \| `BANK_CARD` | Phương thức thanh toán |
| 5 | `status` | `PaymentStatus` | `SUCCESS` \| `FAILED` \| `PENDING` | Trạng thái giao dịch |

- **Các lớp Kho & Khuyến mãi (`Ingredient`, `Recipe`, `ToppingRecipe`, `InventoryLog`, `DiscountCode`, `UserVoucher`, `StoreSetting`)**

| Lớp | Các thuộc tính khóa & trọng yếu | Ràng buộc & Ý nghĩa |
| :--- | :--- | :--- |
| `Ingredient` | `id`, `code` (UQ), `name`, `unit`, `stock`, `minThreshold`, `costPerUnit`, `type`, `isRequiredForSale`, `version` | Quản lý tồn kho nguyên liệu/bao bì, cảnh báo ngưỡng tối thiểu và khóa lạc quan `version`. |
| `Recipe` | `id`, `productId` (FK), `ingredientId` (FK), `size`, `amount` | Định mức nguyên liệu theo món & size; duy nhất trên `(productId, ingredientId, size)`. |
| `ToppingRecipe` | `id`, `toppingId`, `toppingName`, `price`, `isActive`, `ingredientId` (FK), `amount` | Giá bán & định mức BOM của từng topping; duy nhất trên `(toppingId, ingredientId)`. |
| `InventoryLog` | `id`, `ingredientId` (FK Restrict), `type`, `changeAmount`, `previousStock`, `newStock`, `unitCost`, `totalCost`, `performedBy` | Nhật ký biến động kho phục vụ kiểm toán nhập/điều chỉnh. |
| `DiscountCode` | `id`, `code` (UQ), `discountPercent`, `minOrderAmount`, `maxDiscountAmount`, `isActive`, `usageCount` | Danh mục mã khuyến mãi hệ thống. |
| `UserVoucher` | `id`, `userId` (FK Cascade), `code`, `quantity`, `discountPercent`, `minOrderAmount`, `maxDiscountAmount` | Ví voucher riêng của khách hàng; duy nhất trên `(userId, code)`. |
| `StoreSetting` | `key` (PK), `value`, `description`, `updatedAt` | Bảng tham số cấu hình toàn cửa hàng. |

---

## TASK 3: THIẾT KẾ KIẾN TRÚC

### TASK 3.1. Phương pháp và Quyết định Kiến trúc (C4 & ADRs)

#### 1. Tổng quan Kiến trúc phân lớp & C4
Hệ thống BrewLite áp dụng **Kiến trúc Monorepo phân tầng theo Module/Domain** (tài liệu gốc tại [`docs/architecture/architecture.md`](architecture/architecture.md)):
- **Presentation Layer (`apps/web`):** Next.js 15.1.6 (App Router, React 19, TailwindCSS, Zustand) theo hướng Mobile-First/PWA, tích hợp Edge Middleware kiểm soát role trên route `/staff/*` và `/admin/*`.
- **Application & Domain Layer (`apps/api`):** NestJS 10.4 chia module độc lập (`auth`, `products`, `orders`, `payments`, `inventory`, `customers`, `users`, `jobs`, `health`, `prisma`), validate DTO với `class-validator`, bảo vệ bằng `JwtAuthGuard`, `RolesGuard`, `ThrottlerGuard`, và kiểm tra biến môi trường lúc khởi động (`env.validation.ts`).
- **Data Layer (`apps/api/prisma`):** PostgreSQL 16 giao tiếp qua Prisma ORM 5.22 với 12 bảng chuẩn hóa BOM; migration tự động qua `npx prisma migrate deploy`.
- **Payment Integration:** `ZaloPayService` (Sandbox v2, ký `HMAC-SHA256` + IPN Webhook) song hành `MockGatewayService` (cấu hình qua `MOCK_PAYMENT_MODE` và `ALLOW_SANDBOX_CONFIRM`).

#### 2. Bảng tổng hợp các Quyết định Kiến trúc (ADRs `001–008`)

| Mã ADR | Tiêu đề quyết định | Lựa chọn & Trade-off cốt lõi |
| :---: | :--- | :--- |
| **ADR-001** | Monorepo (`apps/web`, `apps/api`) | Gom Frontend và Backend vào 1 repo giúp đồng bộ type, OpenAPI và CI/CD; đánh đổi cần giữ đồng bộ lockfile cho Docker build. |
| **ADR-002** | Kiến trúc phân lớp Modular NestJS | Tách rõ Controller → Service → Prisma/Helper giúp dễ viết Unit Test và bảo trì; chấp nhận thêm lớp DTO boilerplate. |
| **ADR-003** | Triển khai Production & GHCR (`Amendment 2026-11-14`) | Tách Frontend sang **Vercel** (CDN, loại bỏ cold-start UI), Backend Docker trên **Render Singapore**, DB trên **Supabase PostgreSQL** (`sslmode=require`); giữ `cd.yml` đóng gói GHCR tùy chọn. |
| **ADR-004** | Quản lý lược đồ bằng Prisma Migrations | Dùng `prisma migrate deploy` thay vì chạy SQL thủ công, đảm bảo tái tạo DB đồng nhất giữa Local, CI và Production. |
| **ADR-005** | Dịch vụ Thanh toán Mô phỏng & ZaloPay Sandbox | Dùng `MockGatewayService` + ZaloPay Sandbox cho phép kiểm thử đủ nhánh Success/Failure không cần hợp đồng merchant thật. |
| **ADR-006** | Optimistic Locking & Idempotency-Key | Chống bán âm kho và double-charge ở mức database transaction (`version`, khóa `idempotencyKey`), đánh đổi xử lý lỗi `409 Conflict` ở client. |
| **ADR-007** | Chạy Migration khi khởi động Container | Container API tự chạy `npx prisma migrate deploy` trước khi listen HTTP, giúp runner CI không cần mở kết nối trực tiếp vào DB Production. |
| **ADR-008** | Tương thích lược đồ BOM 12 bảng | Chuyển từ tồn kho theo sản phẩm sang định mức nguyên liệu `Ingredient` + `Recipe` + `ToppingRecipe` và chuẩn hóa `{ data }` JSON response. |

---

### TASK 3.2. Sơ đồ Triển khai (Deployment Diagram)

Sơ đồ UML Deployment phản ánh đúng **hạ tầng Production thực tế** của BrewLite qua 3 môi trường **Local (`docker-compose.yml`)**, **CI/CD (`GitHub Actions + GHCR`)**, và **Production (`Vercel + Render Docker + Supabase PostgreSQL + ZaloPay Sandbox`)**:

![Sơ đồ Triển khai hệ thống BrewLite](diagrams/deployment.png)  
*Hình 3.1: Sơ đồ UML Deployment Diagram hệ thống BrewLite (`docs/diagrams/deployment.png`).*

#### Bảng đặc tả các thành phần triển khai chính

| STT | Thành phần / Node | Môi trường | Giao thức & Cổng | Bảo mật & Vai trò |
| :---: | :--- | :--- | :--- | :--- |
| 1 | Client Browser / PWA | Người dùng | HTTPS `:443` | Tải UI từ Vercel, gọi API Render qua HTTPS, sinh `Idempotency-Key`. |
| 2 | Docker Compose (`web`, `api`, `db`) | Local Dev | `:3000`, `:3001`, `:5432` | Dữ liệu lưu persistent trên volume `brewlite_pgdata`. |
| 3 | GitHub (`MaGiaVy/BrewLite_project`) & Actions | CI/CD Cloud | HTTPS `:443` | Chạy `ci.yml` trên PR; `cd.yml` quét Gitleaks, đẩy GHCR và deploy hook. |
| 4 | **Vercel Edge CDN (`apps/web`)** | Production | HTTPS `:443` (TLS 1.3) | Phục vụ Next.js `https://brew-lite-project.vercel.app`, chỉ giữ biến công khai `NEXT_PUBLIC_API_URL`. |
| 5 | **Render Singapore (`brewlite-api` Docker)** | Production | HTTPS `:443` → `:3001` | Build từ `apps/api/Dockerfile`, chạy `prisma migrate deploy`, phục vụ `GET /health`, giữ secrets ở Render Env. |
| 6 | **Supabase Managed PostgreSQL 16** | Production | TCP `:5432/:6543` (`sslmode=require`) | Không mở kết nối cho client/frontend; chỉ Backend Render kết nối qua `DATABASE_URL` SSL. |
| 7 | **ZaloPay Sandbox v2** | Bên thứ ba | HTTPS `:443` | Nhận `v2/create` (HMAC Key1) và gửi IPN Callback (HMAC Key2). |

---

## TASK 4: TRIỂN KHAI — SPRINT 1 & CONTINUOUS INTEGRATION

### TASK 4.1. Thiết lập Repository GitHub & Quy trình làm việc

- **Repository:** `https://github.com/MaGiaVy/BrewLite_project` (Monorepo chuẩn gồm `apps/web`, `apps/api`, `docs`, `tests`, `scripts`, `.github/workflows`, `docker-compose.yml`, `.env.example`, `README.md`, `CHANGELOG.md`).
- **Quy trình Branch & PR:** Nhánh chính `main` được bảo vệ bởi Pull Request và status check `ci`; các tính năng phát triển theo nhánh `task/*`, `fix/*`, `feat/*` và tích hợp qua các đợt Wave PR (`#17`, `#40–#48`).
- **Definition of Done (DoD):** Code qua ESLint/Typecheck, Unit/Integration Test pass, Production build thành công, cập nhật tài liệu/truy vết liên quan.

<div align="center">

![Trang chủ GitHub Repository MaGiaVy/BrewLite_project](evidence/github-repo.jpg)  
*Hình 4.1: Trang chủ GitHub Repository `MaGiaVy/BrewLite_project` hiển thị cây thư mục Monorepo, nhánh `main`, Contributors và Release `v1.0.0` (`docs/evidence/github-repo.jpg`).*

</div>

---

### TASK 4.2. Mô hình hóa Cơ sở dữ liệu (ERD 12 bảng PostgreSQL)

#### 1. Lược đồ thực thể kết hợp (ERD)

<div align="center">

![Sơ đồ ERD 12 bảng PostgreSQL BrewLite](diagrams/erd.png)  
*Hình 4.2: Sơ đồ ERD 12 bảng PostgreSQL đồng bộ `apps/api/prisma/schema.prisma` (`docs/diagrams/erd.png`).*

</div>

#### 2. Đặc tả chi tiết 12 bảng dữ liệu (`PostgreSQL` / `Prisma ORM`)

Hệ thống quản trị toàn bộ nghiệp vụ bán hàng, thanh toán, tích điểm và định mức nguyên liệu theo **Bill of Materials (BOM)** trên 12 bảng chuẩn hóa tại [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma):

1. **Bảng `User` (Người dùng hệ thống):** `id` (`Int`, PK), `email` (`String`, UNIQUE), `passwordHash` (`String`), `fullName` (`String?`), `phone` (`String?`), `position` (`String?`), `isActive` (`Boolean`, mặc định `true`), `role` (`Role`: `CUSTOMER | STAFF | ADMIN`, mặc định `CUSTOMER`), `loyaltyPoints` (`Int`, mặc định `0` — điểm Hạt Vàng), `tokenVersion` (`Int`, mặc định `0` — thu hồi JWT), `createdAt` (`DateTime`).
2. **Bảng `UserVoucher` (Ví voucher cá nhân của khách hàng):** `id` (`Int`, PK), `userId` (`Int`, FK → `User.id`, `ON DELETE CASCADE`), `code` (`String`), `quantity` (`Int`, mặc định `1`), `discountPercent` (`Float`), `minOrderAmount` (`Float`, mặc định `0`), `maxDiscountAmount` (`Float?`), `createdAt`, `updatedAt`. Ràng buộc duy nhất `@@unique([userId, code])`.
3. **Bảng `DiscountCode` (Danh mục mã khuyến mãi toàn hệ thống):** `id` (`Int`, PK), `code` (`String`, UNIQUE), `description` (`String?`), `discountPercent` (`Float`), `minOrderAmount` (`Float`, mặc định `0`), `maxDiscountAmount` (`Float?`), `isActive` (`Boolean`, mặc định `true`), `usageCount` (`Int`, mặc định `0`), `createdAt`, `updatedAt`.
4. **Bảng `Product` (Danh mục đồ uống & bánh ngọt):** `id` (`Int`, PK), `name` (`String`), `description` (`String?`), `imageUrl` (`String?`), `basePrice` (`Float`), `sizeUpchargeM` (`Float?` — ghi đè phụ thu Size M), `sizeUpchargeL` (`Float?` — ghi đè phụ thu Size L), `category` (`String`, mặc định `"vietnamese"`), `tag` (`String?`, mặc định `"Phổ biến"`), `isActive` (`Boolean`, mặc định `true`), `isSoldOutManual` (`Boolean`, mặc định `false` — báo hết món `86`), `createdAt`, `updatedAt`.
5. **Bảng `Ingredient` (Kho nguyên liệu & bao bì BOM):** `id` (`Int`, PK), `code` (`String`, UNIQUE), `name` (`String`), `unit` (`String`), `stock` (`Float`, mặc định `0`), `minThreshold` (`Float`, mặc định `100`), `costPerUnit` (`Float`, mặc định `0`), `type` (`String`, mặc định `"INGREDIENT"`: `INGREDIENT | PACKAGING`), `isRequiredForSale` (`Boolean`, mặc định `true`), `version` (`Int`, mặc định `0` — Optimistic Locking chống oversell), `createdAt`, `updatedAt`.
6. **Bảng `Recipe` (Định mức nguyên liệu theo món & Size):** `id` (`Int`, PK), `productId` (`Int`, FK → `Product.id`, `CASCADE`), `ingredientId` (`Int`, FK → `Ingredient.id`, `CASCADE`), `size` (`String`, mặc định `"ALL"`: `S | M | L | ALL`), `amount` (`Float`). Ràng buộc duy nhất `@@unique([productId, ingredientId, size])`.
7. **Bảng `ToppingRecipe` (Topping & định mức trừ kho BOM):** `id` (`Int`, PK), `toppingId` (`String`), `toppingName` (`String`), `subtext` (`String?`), `price` (`Float`, mặc định `8000`), `isActive` (`Boolean`, mặc định `true`), `ingredientId` (`Int`, FK → `Ingredient.id`, `CASCADE`), `amount` (`Float`). Ràng buộc duy nhất `@@unique([toppingId, ingredientId])`.
8. **Bảng `InventoryLog` (Nhật ký biến động kho phục vụ kiểm toán):** `id` (`Int`, PK), `ingredientId` (`Int`, FK → `Ingredient.id`, `ON DELETE RESTRICT`), `ingredientName` (`String`), `unit` (`String`), `type` (`String`, mặc định `"RESTOCK"`: `RESTOCK | ADJUST`), `changeAmount` (`Float`), `previousStock` (`Float`), `newStock` (`Float`), `unitCost` (`Float`, mặc định `0`), `totalCost` (`Float`, mặc định `0`), `note` (`String?`), `performedBy` (`String?`), `createdAt` (`DateTime`).
9. **Bảng `Order` (Đơn hàng & snapshot khuyến mãi):** `id` (`Int`, PK), `userId` (`Int?`, FK → `User.id`), `status` (`OrderStatus`: `PENDING | PAID | PREPARING | READY | COMPLETED | PAYMENT_FAILED | CANCELLED`), `totalAmount` (`Float`), `discountCode` (`String?`), `discountAmount` (`Float`, mặc định `0`), `voucherDeducted` (`Boolean`, mặc định `false`), `voucherDiscountPercent` (`Float?`), `voucherMinOrderAmount` (`Float?`), `voucherMaxDiscountAmount` (`Float?`), `version` (`Int`, mặc định `0` — Optimistic Locking), `idempotencyKey` (`String?`), `idempotencyPayload` (`String?`), `createdAt`, `updatedAt`, `staffId` (`Int?`), `staffName` (`String?`). Ràng buộc duy nhất `@@unique([userId, idempotencyKey])`.
10. **Bảng `OrderItem` (Chi tiết từng món trong đơn hàng):** `id` (`Int`, PK), `orderId` (`Int`, FK → `Order.id`, `CASCADE`), `productId` (`Int`), `productName` (`String`), `size` (`String`), `sugarLevel` (`String?`, mặc định `"100%"`), `iceLevel` (`String?`, mặc định `"100%"`), `temperature` (`String?`, mặc định `"COLD"`), `notes` (`String?`), `toppings` (`String[]`), `quantity` (`Int`), `unitPrice` (`Float`).
11. **Bảng `Payment` (Lịch sử giao dịch thanh toán):** `id` (`Int`, PK), `orderId` (`Int`, FK → `Order.id`), `idempotencyKey` (`String?`, UNIQUE), `amount` (`Float`), `method` (`PaymentMethod`: `EWALLET | BANK_CARD`), `status` (`PaymentStatus`: `SUCCESS | FAILED | PENDING`), `createdAt` (`DateTime`).
12. **Bảng `StoreSetting` (Cấu hình vận hành toàn cửa hàng):** `key` (`String`, PK), `value` (`String`), `description` (`String?`), `updatedAt` (`DateTime`).

---

### TASK 4.3. Triển khai MVP Sprint 1

Trong Sprint 1 (`23/10/2026 – 02/11/2026`), nhóm hoàn thiện bộ tài liệu phân tích/thiết kế (`Task 1–3`), khởi tạo Monorepo + `docker-compose.yml` + seed dữ liệu mẫu (`apps/api/prisma/seed.ts`), triển khai API `GET /products`, `GET /products/:id` cùng màn hình Menu Mobile-First (`/menu`) hỗ trợ Skeleton loading, Empty state và lọc danh mục.

*(Xem ảnh giao diện `/menu` thực tế ở Mục 5.3 — Hình 5.2).*

---

### TASK 4.4. Continuous Integration (CI Pipeline)

Pipeline CI tại [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) chạy tự động trên mỗi Pull Request vào `main` với ma trận song song cho `apps/api` và `apps/web` theo chuỗi: `npm ci` → *(prisma generate với API)* → `npm run lint` → `npm run test` → `npm run build`. Job tổng hợp `ci` chỉ xanh khi cả hai workspace đạt 100%, làm điều kiện bắt buộc (*Branch Protection*) trước khi merge.

**Minh chứng thực tế trên PR `#17`** (`https://github.com/MaGiaVy/BrewLite_project/pull/17`):

| Trạng thái Pipeline | Minh chứng hình ảnh |
| :---: | :---: |
| **Pipeline Fail (Chặn merge khi lỗi lint)** | ![CI Pipeline Fail](evidence/ci-fail.png) |
| **Pipeline Pass (Mở khóa merge sau khi sửa)** | ![CI Pipeline Pass](evidence/ci-pass.png) |

<div align="center">

*Hình 4.3 & 4.4: Minh chứng GitHub Actions CI phát hiện lỗi và đạt chuẩn xanh trên PR `#17` (`docs/evidence/ci-fail.png`, `docs/evidence/ci-pass.png`).*

</div>

---

## TASK 5: TRIỂN KHAI — SPRINT 2, KIỂM THỬ, CI/CD VÀ BÀN GIAO

### 5.1. User Stories

| Mã US | Vai trò | Nội dung User Story | Mã FR |
| :---: | :--- | :--- | :---: |
| **US-01** | Khách hàng | Là một khách hàng, tôi muốn xem thực đơn theo danh mục và tìm kiếm món để nhanh chóng chọn đồ uống phù hợp. | `FR-01`, `FR-12` |
| **US-02** | Khách hàng | Là một khách hàng, tôi muốn chọn Size (S/M/L), Topping, mức đá và mức đường kèm giá cập nhật tức thì để tùy biến ly nước theo khẩu vị. | `FR-02` |
| **US-03** | Khách hàng | Là một khách hàng, tôi muốn thêm/sửa/xóa món trong giỏ hàng và không bị mất khi tải lại trang để quản lý đơn trước khi đặt. | `FR-03` |
| **US-04** | Khách hàng | Là một khách hàng, tôi muốn đăng ký và đăng nhập tài khoản an toàn (giữ nguyên giỏ hàng) để đặt đơn và tích điểm thành viên. | `FR-04` |
| **US-05** | Khách hàng | Là một khách hàng, tôi muốn đặt đơn và giữ nguyên liệu trong 15 phút để đảm bảo ly nước không bị hết nguyên liệu giữa chừng. | `FR-05` |
| **US-06** | Khách hàng | Là một khách hàng, tôi muốn thanh toán không tiền mặt qua ZaloPay Sandbox hoặc Ví/Thẻ mô phỏng (không bị trừ tiền lặp) để hoàn tất đơn nhanh chóng. | `FR-06` |
| **US-07** | Khách hàng | Là một khách hàng, tôi muốn áp dụng mã Voucher và đổi điểm Hạt Vàng lấy ưu đãi để tiết kiệm chi phí mua hàng. | `FR-07` |
| **US-08** | Khách hàng | Là một khách hàng, tôi muốn theo dõi trạng thái đơn hàng theo thời gian thực và xem lịch sử đơn để biết khi nào ra quầy nhận nước. | `FR-08` |
| **US-09** | Khách hàng | Là một khách hàng, tôi muốn hủy đơn khi chưa thanh toán (`PENDING`/`PAYMENT_FAILED`) hoặc thanh toán lại khi lỗi để linh hoạt xử lý sự cố. | `FR-13` |
| **US-10** | Barista (`STAFF`) | Là một Barista, tôi muốn xem hàng đợi đơn đã thanh toán trên KDS (`/staff`) kèm âm báo và cập nhật trạng thái `PREPARING → READY → COMPLETED` để điều phối quầy bar chính xác. | `FR-09` |
| **US-11** | Barista (`STAFF`) | Là một Barista, tôi muốn bật/tắt trạng thái hết món `86` ngay trên màn hình quầy để ngăn khách đặt món vừa hết nguyên liệu. | `FR-09` |
| **US-12** | Quản lý (`ADMIN`) | Là một Admin, tôi muốn quản lý thực đơn, tồn kho nguyên liệu BOM, định mức `Recipe`, Voucher, nhân sự và xem doanh thu tại `/admin` để vận hành cửa hàng hiệu quả. | `FR-10` |

---

### 5.2. Test Scenario, Test Case và Kết quả Kiểm thử Tự động

#### 1. Bảng Test Scenario tổng hợp

| ID | Phân hệ (Module) | Các kịch bản kiểm thử chính |
| :---: | :--- | :--- |
| **TS-01** | Xác thực & Phân quyền (`Auth / RBAC`) | Đăng ký trùng email (`409`); mật khẩu < 6 ký tự (`400`); sai thông tin đăng nhập (`401`); đăng nhập hợp lệ trả JWT 7 ngày; chặn leo thang quyền `CUSTOMER` vào `/admin`, `/staff` (`403`). |
| **TS-02** | Đặt đơn & Kho BOM (`Orders / BOM`) | Tạo đơn `PENDING` đúng tổng tiền (0đ tự chốt `PAID`); thiếu kho ban đầu (`400 Bad Request`); 2 request đồng thời tranh chấp 1 đơn vị tồn kho cuối (`201` & `409`); giới hạn > 5 đơn chờ (`400`); tự động hủy quá hạn 15 phút (`ExpireOrdersJob`). |
| **TS-03** | Thanh toán & Idempotency (`Payments`) | Gửi lại cùng `Idempotency-Key` không tạo bản ghi thứ 2; thanh toán thành công chuyển `PAID` và cộng điểm Loyalty; thanh toán thất bại chuyển `PAYMENT_FAILED` và cho retry; chặn `ALLOW_SANDBOX_CONFIRM=false` (`403`). |
| **TS-04** | Quầy pha chế KDS & Hủy đơn | Chuyển trạng thái hợp lệ `PAID → PREPARING → READY → COMPLETED`; `CUSTOMER` hủy `PENDING`/`PAYMENT_FAILED` và `STAFF`/`ADMIN` hủy `PAID` trước `PREPARING` hoàn 100% kho BOM & voucher; nhân viên `STAFF` không xem được công thức/giá vốn. |
| **TS-05** | Luồng End-to-End Mobile (`Playwright`) | Người dùng trên viewport di động duyệt `/menu` → chọn Size/Topping → giỏ hàng → đăng nhập → `/checkout` → thanh toán thành công (`PAID`) và kịch bản thất bại giữ nguyên giỏ hàng. |

#### 2. Bảng Test Case trọng tâm

| TC ID | Kịch bản | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi |
| :---: | :--- | :--- | :--- | :--- |
| **TC-01** | Đăng nhập sai mật khẩu | 1. Mở `/auth/login`<br>2. Nhập email đúng, mật khẩu sai<br>3. Bấm Đăng nhập | `email`: `khach@brewlite.vn`<br>`password`: `wrongpass` | API trả `401 Unauthorized`; UI báo lỗi chung, không cấp JWT. |
| **TC-02** | Đăng nhập hợp lệ theo vai trò | 1. Mở `/auth/login`<br>2. Nhập thông tin tài khoản `CUSTOMER` / `STAFF` / `ADMIN` | `khach@brewlite.vn` / `Password123` (hoặc `staff@brewlite.vn`, `admin@brewlite.vn`) | Trả JWT 7 ngày; điều hướng đúng `/menu`, `/staff`, `/admin`. |
| **TC-03** | Tranh chấp tồn kho đồng thời (`INT-T03`) | 1. Seed tồn kho đủ cho đúng 1 ly<br>2. Gửi song song 2 request `POST /orders` | 2 request JWT hợp lệ cùng đặt món cuối | Đúng 1 request nhận `201 Created`, 1 request nhận `409 Conflict`; tồn kho không âm. |
| **TC-04** | Chống trừ tiền lặp (`INT-T02`) | 1. Tạo đơn `PENDING`<br>2. Gửi 2 lần `POST /payments` với cùng `Idempotency-Key` | `Idempotency-Key`: cùng 1 UUIDv4 | Chỉ có 1 dòng `Payment`, trả về `isIdempotent: true`, cộng điểm đúng 1 lần. |
| **TC-05** | Thanh toán thất bại & giữ kho (`INT-T04`) | 1. Gửi `POST /payments` với chế độ failure<br>2. Kiểm tra đơn và gửi lại lần 2 thành công | `MOCK_PAYMENT_MODE=failure` → `success` | Lần 1 đơn sang `PAYMENT_FAILED` (không trừ kho lần 2); lần 2 thành `PAID`. |
| **TC-06** | Chặn truy cập trái phép (`INT-T05` & RBAC) | 1. Gửi `POST /orders` không JWT<br>2. Gửi `GET /admin/customers` với JWT `CUSTOMER` | Header thiếu token / JWT `CUSTOMER` | Lần 1 trả `401 Unauthorized`; lần 2 trả `403 Forbidden`. |
| **TC-07** | Hủy đơn & hoàn kho BOM | 1. Khách hủy đơn `PENDING`/`PAYMENT_FAILED` (`DELETE /orders/:id`)<br>2. Hoặc `STAFF`/`ADMIN` hủy đơn `PAID` trước `PREPARING` | Đơn `PENDING`/`PAYMENT_FAILED` hoặc `PAID` chưa pha | Đơn chuyển `CANCELLED`, hoàn 100% nguyên liệu BOM về `Ingredient` và hoàn voucher. |
| **TC-08** | Luồng Mobile E2E thanh toán thành công (`E2E-T01`) | 1. Mở `/menu` (Pixel 7) → chọn Size M + Topping<br>2. Vào `/cart` → `/auth/register` → `/checkout`<br>3. Chọn Ví (`payment-method-wallet`) → `confirm-payment-button` | Tài khoản đăng ký mới; `MOCK_PAYMENT_MODE=success` | API trả `201 Created`, đơn đạt `PAID`, chuyển trang xác nhận đơn thành công. |
| **TC-09** | Luồng Mobile E2E thanh toán thất bại (`E2E-T02`) | 1. Bật `MOCK_PAYMENT_MODE=failure` cho API container<br>2. Đặt đơn và bấm xác nhận thanh toán tại `/checkout` | `MOCK_PAYMENT_MODE=failure` | UI hiển thị `payment-error`, không chuyển trang, giỏ hàng (`cart-link`) vẫn giữ nguyên món. |
| **TC-10** | Chống giả mạo ZaloPay Callback | 1. Gửi `POST /payments/zalopay/callback` với `mac` sai hoặc `amount` lệch | Payload giả mạo MAC / số tiền | Trả `return_code: -1`, từ chối cập nhật `PAID` và ghi log cảnh báo bảo mật. |

#### 3. Kết quả chạy kiểm thử tự động thực tế tại workspace (`15/11/2026`)

| Bộ kiểm thử | Lệnh chạy | Kết quả thực tế quan sát được | Log / Minh chứng |
| :--- | :--- | :--- | :--- |
| **Backend Unit, API & Live DB Integration (Jest)** | `npx jest --runInBand` *(với `TEST_DATABASE_URL` PostgreSQL 16)* | **27/27 test suites passed**, **400/400 tests passed** (0 failed, 0 skipped — chạy cả `orders-payments.int.spec.ts` `INT-T01..T05` và `security-concurrency.int.spec.ts`) | `docs/evidence/test-logs/api-jest.txt` |
| **Frontend Unit & UI (Vitest)** | `npm run lint && npm run test -w apps/web` | **19/19 test files passed**, **131/131 tests passed** (0 failed, 0 skipped — ~49.91s; `tsc --noEmit` đạt 0 lỗi) | `docs/evidence/test-logs/web-vitest.txt` |
| **Playwright Mobile E2E (`Chromium / Pixel 7`)** | `npx playwright test --reporter=list,html` | **2/2 tests passed** (`E2E-T01` đạt `PAID` trong `10.5s`; `E2E-T02` giữ nguyên giỏ khi lỗi trong `42.4s`; tổng `1.7m`) | `docs/evidence/test-logs/playwright-e2e.txt` |

<div align="center">

![Báo cáo Playwright HTML Report](evidence/playwright-html-report.png)  
*Hình 5.1: Kết quả chạy thực tế Playwright Mobile E2E (`2 passed / 0 failed`) trên Docker Compose (`docs/evidence/playwright-html-report.png`).*

</div>

---

### 5.3. Giao diện Hệ thống Thực tế (UI Screenshots)

#### 1. Phân hệ Khách hàng (Customer PWA — Production `https://brew-lite-project.vercel.app`)

| Màn hình | Ảnh chụp thực tế | Màn hình | Ảnh chụp thực tế |
| :---: | :---: | :---: | :---: |
| **Thực đơn (`/menu`)** | ![Menu](evidence/ui/01-menu.png) | **Chi tiết món & Size/Topping** | ![Chi tiết món](evidence/ui/02-product-detail.png) |
| **Giỏ hàng (`/cart`)** | ![Giỏ hàng](evidence/ui/03-cart.png) | **Thanh toán (`/checkout`)** | ![Checkout](evidence/ui/04-checkout.png) |
| **Cổng ZaloPay (`/gateway/zalopay`)** | ![ZaloPay Gateway](evidence/ui/10-zalopay-gateway.png) | **Theo dõi đơn (`/orders`)** | ![Theo dõi đơn](evidence/ui/05-order-tracking.png) |
| **Ưu đãi & Đổi điểm (`/promotions`)** | ![Ưu đãi](evidence/ui/06-promotions.png) | **Tài khoản (`/account`)** | ![Tài khoản](evidence/ui/07-account.png) |
| **Đăng nhập (`/auth/login`)** | ![Đăng nhập](evidence/ui/08-login.png) | **Đăng ký (`/auth/register`)** | ![Đăng ký](evidence/ui/09-register.png) |

<div align="center">

*Hình 5.2: Bộ 10 màn hình thực tế của phân hệ Khách hàng (`Customer PWA`) trên Vercel Production (`docs/evidence/ui/`).*

</div>

#### 2. Phân hệ Quầy Pha Chế Barista KDS (`/staff`)

| Chế độ xem | Ảnh chụp thực tế | Chế độ xem | Ảnh chụp thực tế |
| :---: | :---: | :---: | :---: |
| **Hàng đợi đơn KDS (Mobile)** | ![Staff Queue](evidence/mobile-staff-queue.png) | **Công thức & chi tiết pha chế** | ![Staff Recipe](evidence/mobile-staff-recipe.png) |
| **Checklist thao tác KDS** | ![Staff Checklist](evidence/mobile-staff-checklist.png) | **KDS trên Tablet** | ![Staff Tablet](evidence/mobile-staff-tablet.png) |

<div align="center">

*Hình 5.3: Giao diện Quầy pha chế Barista KDS (`/staff`) trên Mobile và Tablet (`docs/evidence/mobile-staff-*.png`).*

</div>

#### 3. Phân hệ Quản trị Admin Portal (`/admin`)

| Viewport 360px | Viewport 390px | Viewport 768px |
| :---: | :---: | :---: |
| ![Admin 360](evidence/mobile-qa-admin-360.png) | ![Admin 390](evidence/mobile-qa-admin-390.png) | ![Admin 768](evidence/mobile-qa-admin-768.png) |

<div align="center">

*Hình 5.4: Kiểm tra responsive giao diện Quản trị Admin Portal (`/admin`) ở các kích thước `360px`, `390px` và `768px` (`docs/evidence/mobile-qa-admin-*.png`).*

</div>

---

### 5.4. Continuous Delivery, Triển khai Production, Smoke Test & Rollback

#### 1. Hạ tầng Production & Tài khoản Demo
- **Frontend (Vercel):** `https://brew-lite-project.vercel.app` (Auto-Deploy từ `main`).
- **Backend API (Render Singapore Docker):** `https://brewlite-api-9viv.onrender.com` (Auto-Deploy từ `apps/api/Dockerfile`, `npx prisma migrate deploy` khi khởi động).
- **Database (Supabase PostgreSQL 16):** Kết nối SSL nội tại từ Render API (`sslmode=require`), không mở public ra client.
- **Tài khoản Demo** *(từ `apps/api/prisma/seed.ts`, chỉ dùng cho môi trường demo/kiểm thử)*:
  - `ADMIN`: `admin@brewlite.vn` / `Admin@123` (`/admin`)
  - `STAFF`: `staff@brewlite.vn` / `123456` (`/staff`)
  - `CUSTOMER`: `khach@brewlite.vn` / `Password123` hoặc `test@example.com` / `password123`

#### 2. Kết quả Production Smoke Test & Secret Scan
- **Smoke Test ([`docs/evidence/production-smoke.md`](evidence/production-smoke.md)):** Chạy `scripts/smoke-test.ps1` ngày `2026-11-14` đạt **PASS** 100%: `GET /health` (`{"status":"ok","db":"up"}`), `GET /products`, `GET /inventory/pricing-config`, `POST /auth/login + GET /auth/me`, `GET /menu` trên Vercel. Negative checks xác nhận `401` khi thiếu JWT, `403` khi `CUSTOMER` gọi `/admin/customers`, `404` khi đơn không tồn tại.
- **Secret Hygiene ([`docs/evidence/secret-scan.md`](evidence/secret-scan.md)):** Rà soát 282 commits git ghi nhận **0 file `.env`** bị commit, **0 rò rỉ** URI Supabase hay token/key thật; workflow [`.github/workflows/cd.yml`](../.github/workflows/cd.yml) tích hợp sẵn `gitleaks/gitleaks-action@v3`, build & push image lên GHCR (`ghcr.io`) và hỗ trợ `operation = deploy | rollback`.

#### 3. Quy trình Rollback khi có sự cố
- **Vercel:** *Deployments → chọn bản ổn định (mốc `v1.0.0`) → Instant Rollback*.
- **Render:** *Deploys → chọn bản build xanh gần nhất → Rollback*.
- **Git / CD GHCR:** `git revert <commit>` hoặc chạy `cd.yml` với `operation = rollback`, `release_tag = v1.0.0`.
- Chi tiết xem tại [`docs/deployment.md`](deployment.md) và [`CHANGELOG.md`](../CHANGELOG.md).

<div align="center">

![Trang phát hành GitHub Release BrewLite v1.0.0](evidence/github-release-v1.0.0.jpg)  
*Hình 5.5: Trang phát hành chính thức GitHub Release `BrewLite v1.0.0 — Assignment 2 Submission` (`docs/evidence/github-release-v1.0.0.jpg`).*

![Tab GitHub Actions CI/CD Workflows](evidence/github-actions-ci.png)  
*Hình 5.6: Tab GitHub Actions hiển thị các lượt workflow CI/CD đạt trạng thái xanh (`docs/evidence/github-actions-ci.png`).*

![Kết quả Render Production Health Check](evidence/production-health.png)  
*Hình 5.7: Endpoint Production `https://brewlite-api-9viv.onrender.com/health` trả về HTTP `200` với `{"status":"ok","db":"up"}` (`docs/evidence/production-health.png`).*

</div>

---

### 5.5. Sprint Review & Sprint Retrospective

#### 1. Sprint Review (2 Sprint)
- **Sprint 1 (`23/10/2026 – 02/11/2026` — Design, Architecture & Core Foundation):** Hoàn thành Context & Scope, SRS (`FR-01..13`, `NFR-01..06`), Use Case Checkout, toàn bộ sơ đồ UML, ADRs `001–007`, thiết lập Monorepo + Docker Compose + CI Pull Request (`#17`) và luồng Menu đầu tiên (`GET /products`, `/menu`). Chuyển sang Sprint 2: các phân hệ hoàn chỉnh Cart/Checkout/ZaloPay/KDS/Admin, Integration/E2E tests và triển khai Production.
- **Sprint 2 (`03/11/2026 – 14/11/2026` — Full Features, Payment Sandbox, Testing & Deploy):** Hoàn thiện schema 12 bảng BOM, Dual Optimistic Locking, `ExpireOrdersJob` 15 phút, ZaloPay Sandbox + `/gateway/zalopay` fallback, Barista KDS `/staff` (âm báo & `86`), Admin `/admin`, kiểm thử 4 tầng, triển khai live Vercel + Render + Supabase và phát hành `v1.0.0`.
- **Hạn chế đã biết:** Thanh toán sử dụng ZaloPay Sandbox/Mock (không tiền thật); Render gói Free ngủ đông sau 15 phút idle (cold-start ~30–50s).

#### 2. Sprint Retrospective

| Sprint | Điểm làm tốt (What Went Well) | Vấn đề gặp phải (What Didn't Go Well) | Hành động cải tiến (Action Items) |
| :---: | :--- | :--- | :--- |
| **Sprint 1** | Chốt SRS, OpenAPI & ADRs sớm giúp FE/BE làm song song ít sửa luồng; đưa CI gate vào từ đầu chặn lỗi lint/build rác. | Sơ đồ Activity ban đầu bị phân mảnh; thiết kế tồn kho ban đầu theo sản phẩm lệch so với mô hình BOM 12 bảng. | Hợp nhất thành 1 sơ đồ Activity E2E 5 swimlane; bổ sung `ADR-008` khóa chuẩn BOM 12 bảng. |
| **Sprint 2** | Dual Optimistic Locking + `Idempotency-Key` + Cron 15p hoạt động ổn định; tách Vercel + Render + Supabase miễn phí & bỏ cold-start UI. | Xung đột `package-lock.json` làm Docker build Render fail; lỗi CORS Vercel ↔ Render; guard `ALLOW_SANDBOX_CONFIRM=false` chặn nút Sandbox; tài liệu deployment trễ nhịp so với hạ tầng thật. | Đồng bộ `apps/api/package-lock.json`; hỗ trợ wildcard `CORS_ORIGIN`; fallback `/gateway/zalopay` & ghi rõ biến môi trường; rà soát chéo toàn bộ docs/diagrams trước tag `v1.0.0`. |

---

## MỤC 8: MA TRẬN TRUY VẾT (TRACEABILITY MATRIX)

| Mã yêu cầu | Use-case / Tính năng | Thiết kế / Sơ đồ / ADR | Code / API / Giao diện | Mã Test / Kết quả |
| :---: | :--- | :--- | :--- | :--- |
| **FR-01** | Duyệt thực đơn & lọc món đang bán | `activity_E2E.puml`, `class.puml`, `openapi.yaml` | `GET /products` (`apps/api/src/products/*`), `apps/web/src/app/menu/page.tsx` | `products.controller.spec.ts`, `menu.test.tsx` (Pass) |
| **FR-02** | Chi tiết món, Size & Topping (BOM) | `activity_E2E.puml`, `ADR-008`, `openapi.yaml` | `GET /products/:id`, `GET /inventory/pricing-config`, `products/[id]/page.tsx` | `products.controller.spec.ts`, `product-detail.test.tsx` (Pass) |
| **FR-03** | Giỏ hàng & tùy chỉnh ghi chú | `activity_E2E.puml`, `architecture.md` | `cart/page.tsx`, `ProductEditModal.tsx`, `cart-store.ts` | `cart-ui.test.tsx`, `cart-store.test.ts` (Pass) |
| **FR-04** | Đăng ký, đăng nhập & JWT RBAC | `sequence-checkout.puml`, `use-case.puml`, `openapi.yaml` | `POST /auth/{register,login}`, `GET /auth/me`, `apps/api/src/auth/*`, `auth/{login,register}/page.tsx` | `auth-api.spec.ts`, `auth-profile.spec.ts`, `auth.service.spec.ts`, `jwt-secret.spec.ts`, `auth-ui.test.tsx`, `account.test.tsx` (Pass) |
| **FR-05** | Tạo đơn, tính giá & giữ kho BOM | `usecase-checkout.md`, `sequence-checkout.puml`, `activity_E2E.puml`, `ADR-006`, `ADR-008` | `POST /orders`, `GET /orders/*` (`orders.service.ts`, `bom.helper.ts`), `checkout/page.tsx` | `API-T04.spec.ts`, `orders.{controller,service}.spec.ts`, `checkout.test.tsx` (Pass); `INT-T01..T05` |
| **FR-06** | Thanh toán Mock / ZaloPay & Idempotency | `usecase-checkout.md`, `sequence-checkout.puml`, `ADR-005`, `ADR-006` | `POST /payments`, `/payments/zalopay/*`, `gateway/zalopay/page.tsx` | `API-T05.spec.ts`, `API-T06.spec.ts`, `payments.*.spec.ts`, `zalopay.service.spec.ts` (Pass) |
| **FR-07** | Voucher & Đổi Hạt Vàng | `architecture.md`, `class.puml`, `openapi.yaml` | `POST /auth/redeem-points`, `GET /auth/vouchers`, `/inventory/vouchers`, `promotions/page.tsx` | `auth.service.spec.ts`, `orders.service.spec.ts`, `payments.service.spec.ts`, `promotions.test.tsx` (Pass) |
| **FR-08** | Lịch sử & theo dõi tiến trình đơn | `activity_E2E.puml`, `architecture.md` | `GET /orders/me`, `GET /orders/:id`, `orders/*/page.tsx`, `use-order-polling.ts` | `orders.test.tsx`, `confirmation.test.tsx`, `use-order-polling.test.ts` (Pass) |
| **FR-09** | Quầy pha chế Barista KDS | `activity_E2E.puml`, `openapi.yaml` | `GET /orders/barista/queue`, `PATCH /orders/:id/status`, `staff/page.tsx` | `orders.service.spec.ts`, `staff/*.test.*`, `use-barista-queue.test.ts` (Pass) |
| **FR-10** | Admin Portal (Menu, Kho BOM, Nhân sự) | `architecture.md`, `ADR-004`, `ADR-008`, `openapi.yaml` | `/products`, `/inventory/*`, `/staff/*`, `/admin/customers/*`, `admin/page.tsx` | `inventory.*.spec.ts`, `users.service.spec.ts`, `customers.*.spec.ts`, `admin/page.test.tsx` (Pass) |
| **FR-11** | Tự động hủy đơn quá hạn 15 phút | `sequence-checkout.puml`, `activity_E2E.puml`, `ADR-008` | `apps/api/src/jobs/expire-orders.job.ts`, `order-refund.helper.ts` | `API-T07..T09.spec.ts`, `expire-orders.job.spec.ts` (Pass) |
| **FR-12** | Tìm kiếm & lọc thực đơn theo danh mục | `activity_E2E.puml`, `srs.md` | `apps/web/src/app/menu/page.tsx`, `lib/format.ts` | `menu.test.tsx`, `format.test.ts` (Pass) |
| **FR-13** | Hủy đơn & hoàn kho BOM | `usecase-checkout.md`, `activity_E2E.puml`, `ADR-008` | `PATCH /orders/:id/status`, `DELETE /orders/:id`, `order-refund.helper.ts` | `API-T07..T09.spec.ts`, `orders.service.spec.ts` (Pass) |
| **NFR-01..06** | Hiệu năng, Bảo mật, Zero Overselling, Mobile PWA, CI/CD, Idempotency | `ADR-003`, `ADR-006`, `ADR-007`, `deployment.puml`, `sequence-checkout.puml` | `JwtAuthGuard`, `RolesGuard`, `version`, `GET /health`, `ci.yml`, `cd.yml`, `smoke-test.ps1` | `health.controller.spec.ts`, `env.validation.spec.ts`, `ci.md`, `production-smoke.md`, `secret-scan.md` (Pass) |

---

## KẾT LUẬN

Đồ án **BrewLite — Nền tảng Đặt và Thanh toán Đồ uống Không Tiền Mặt (PWA)** đã hoàn thành trọn vẹn chu trình kỹ nghệ phần mềm từ khai thác yêu cầu, mô hình hóa UML, thiết kế kiến trúc đến hiện thực hóa qua hai Sprint, kiểm thử đa tầng và triển khai thành công trên môi trường Production thực tế (**Vercel + Render Docker + Supabase PostgreSQL**).

Hệ thống đáp ứng đầy đủ các chức năng cốt lõi lẫn mở rộng: khách hàng có thể duyệt menu, tùy biến Size/Topping, thanh toán ZaloPay Sandbox/Mock an toàn chống trừ tiền lặp (`Idempotency-Key`), theo dõi đơn hàng theo thời gian thực; đồng thời Barista (`/staff`) và Quản lý (`/admin`) kiểm soát chặt chẽ quy trình pha chế và tồn kho nguyên liệu theo định mức BOM với cơ chế khóa lạc quan kép (*Dual-layer Optimistic Locking*). Quy trình CI/CD trên GitHub Actions giúp đảm bảo chất lượng mã nguồn, an toàn bí mật và khả năng quay lui sự cố nhanh chóng.

Trong giai đoạn phát triển tiếp theo, hệ thống có thể mở rộng thêm thông báo đẩy (*Web Push Notification*), thanh toán đa ví thực tế khi có hợp đồng merchant và tối ưu nâng cấp gói server Backend để loại bỏ độ trễ cold-start trên môi trường miễn phí.
