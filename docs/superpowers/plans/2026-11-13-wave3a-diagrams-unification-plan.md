# Kế hoạch Hoàn thiện và Chuẩn hóa Hệ thống Sơ đồ UML (Wave 3a)

> **Mục tiêu:** Rà soát, chuẩn hóa và xuất lại toàn bộ các sơ đồ UML (Activity, Sequence, Class, Deployment) trên nhánh `task/wave3a-docs-openapi-smoke` khớp 100% với mã nguồn thực tế và đề bài Assignment 2 (Task 2 & Task 3).  
> **Phương châm thiết kế:** Thực hiện tuần tự từng sơ đồ (Diagram-by-Diagram), đảm bảo độ tinh gọn chuẩn UML (Medium abstraction), bố cục cân đối theo chiều dọc, không kéo bè ngang làm vỡ khung ảnh SVG/PNG.

---

## Danh mục Sơ đồ Cần Hoàn Thiện

### 📍 Giai đoạn 1: Sơ đồ Hoạt động (Activity Diagram — Task 2.1) — *[ĐANG THỰC HIỆN]*
* **Tệp nguồn:** `docs/diagrams/activity-checkout.puml`
* **Kết xuất:** `docs/diagrams/activity-checkout.svg`, `docs/diagrams/activity-checkout.png`
* **Tài liệu thuyết minh:** `docs/diagrams/activity-diagrams.md`
* **Phạm vi chuẩn hóa (Hợp nhất 6 chức năng End-to-End):**
  1. **Xem menu:** Khách truy cập `/menu` $\rightarrow$ Web gọi `GET /products` $\rightarrow$ Backend/PostgreSQL trả về danh mục sản phẩm $\rightarrow$ Hiển thị các tab món (Cà phê phin, Espresso, Trà, Bánh).
  2. **Tùy chọn chi tiết món:** Rẽ nhánh kiểm tra hết hàng (`isSoldOutManual || stock <= 0`). Nếu hết: hiện badge "Hết hàng", khóa nút; Nếu còn: mở modal `ProductDetailModal`, khách chọn Size (S/M/L), Topping (Kem muối, Thạch cà phê, Trân châu), Mức đá/đường $\rightarrow$ Tính giá động theo thời gian thực (Dynamic Pricing).
  3. **Quản lý giỏ hàng:** Bấm thêm giỏ $\rightarrow$ Kiểm tra composite key `(productId-size-ice-sugar-toppings)` để tăng số lượng hoặc thêm dòng mới. Trong trang Giỏ hàng: hỗ trợ tăng/giảm số lượng (+/-), bấm xóa món (thùng rác), áp mã voucher, tự động tính lại tổng tiền. Rẽ nhánh giỏ hàng trống hoặc bấm "Tiến hành đặt hàng".
  4. **Đặt đơn hàng (Pha 1):** Kiểm tra đăng nhập (JWT/AuthStore). Bấm thanh toán $\rightarrow$ Sinh `Idempotency-Key` (UUIDv4) $\rightarrow$ Backend mở Database Transaction, khóa User `FOR UPDATE`, kiểm tra giới hạn 5 đơn chờ, kiểm tra tồn kho BOM và khóa lạc quan `version`. Nếu thiếu nguyên liệu: trả mã 409 Conflict. Nếu đủ: tạm giữ kho BOM, tạo đơn `PENDING` (hạn giữ chỗ 15 phút).
  5. **Thanh toán (Pha 2):** Khởi tạo ZaloPay QR Sandbox hoặc Mock Simulator. Nếu thành công: Webhook/Polling xác thực HMAC $\rightarrow$ Chuyển Order sang `PAID`, dứt điểm trừ kho BOM, cộng điểm Hạt Vàng, xóa giỏ hàng. Nếu thất bại: Chuyển sang `PAYMENT_FAILED` (vẫn giữ kho 15p cho khách thử lại hoặc hủy đơn).
  6. **Theo dõi đơn hàng (Vòng đời sau thanh toán):** Điều hướng sang trang chi tiết đơn `/orders/:id` $\rightarrow$ Hiển thị thanh tiến trình 5 nấc (`PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`) khi Barista thao tác trên KDS $\rightarrow$ Nhận mã nhận nước tại Quầy Bar Express $\rightarrow$ Khách nhận nước và hoàn tất phiên đặt hàng.
* **Quy chuẩn bố cục:** 5 làn swimlane chuẩn (`Khách hàng` | `Giao diện Web` | `Backend API` | `Cổng thanh toán` | `Cơ sở dữ liệu`). Gom nhóm các thao tác con súc tích, ngắt dòng ngắn gọn ($\le 35$ ký tự) để các làn rộng khoảng 180-220px, sơ đồ trải dài dọc đẹp mắt.

---

### 📍 Giai đoạn 2: Sơ đồ Tuần tự (Sequence Diagram — Task 2.2)
* **Tệp nguồn:** `docs/diagrams/sequence-checkout.puml`
* **Kết xuất:** `docs/diagrams/sequence-checkout.svg`, `docs/diagrams/sequence-checkout.png`
* **Tài liệu thuyết minh:** `docs/diagrams/sequence-checkout.md`
* **Nội dung chuẩn hóa:**
  - Đồng bộ chi tiết tương tác message giữa Client, OrderController, OrderService, PaymentService, Prisma/PostgreSQL và ZaloPay.
  - Phân tách rõ 2 Pha: `Pha 1 (POST /orders - Giữ kho BOM)` và `Pha 2 (POST /payments/zalopay - Xử lý thanh toán)`.
  - Bổ sung header `Idempotency-Key` và xử lý ngoại lệ: Hết hàng 409 Conflict, Timeout 15 phút, Khách hủy đơn hoàn kho.

---

### 📍 Giai đoạn 3: Sơ đồ Lớp (Class Diagram — Task 2.3)
* **Tệp nguồn:** `docs/diagrams/class.puml`
* **Kết xuất:** `docs/diagrams/class.svg`, `docs/diagrams/class.png`
* **Nội dung chuẩn hóa:**
  - Chuẩn hóa toàn bộ 12 Model Prisma theo `schema.prisma`: `Product`, `Ingredient`, `Recipe`, `ToppingRecipe`, `InventoryLog`, `StoreSetting`, `User`, `UserVoucher`, `DiscountCode`, `Order`, `OrderItem`, `Payment`.
  - Thể hiện các mối quan hệ (1-n, n-n qua bảng nối), kiểu dữ liệu thuộc tính, khóa chính, khóa ngoại và các Enum (`Role`, `OrderStatus`, `PaymentMethod`, `PaymentStatus`).

---

### 📍 Giai đoạn 4: Sơ đồ Triển khai (Deployment Diagram — Task 3.2)
* **Tệp nguồn:** `docs/diagrams/deployment.puml`
* **Kết xuất:** `docs/diagrams/deployment.svg`, `docs/diagrams/deployment.png`
* **Nội dung chuẩn hóa:**
  - Khớp với ADR-003: Render Cloud Platform + GitHub Container Registry (GHCR) + GitHub Actions CI/CD.
  - Phân tách rõ 3 môi trường: Local Developer Workstation, CI/CD Pipeline (GitHub Runner), và Production Environment (Render Web Services & Private PostgreSQL).

---

## Kế hoạch Thực hiện Tuần Tự (Làm từng sơ đồ)
- [ ] **Bước 1 (Hiện tại):** Biên soạn mã nguồn `activity-checkout.puml` mới theo đúng 6 quyết định đã thống nhất qua `/grill-me`.
- [ ] **Bước 2:** Biên dịch xuất tệp vector `activity-checkout.svg` và ảnh raster `activity-checkout.png`.
- [ ] **Bước 3:** Cập nhật thuyết minh chi tiết trong `docs/diagrams/activity-diagrams.md`.
- [ ] **Bước 4:** Trình bạn xem lại hình ảnh Sơ đồ Activity để bạn duyệt 100%.
- [ ] **Bước 5:** Chuyển sang Sơ đồ Tuần tự (Sequence Diagram) theo cùng quy trình.
