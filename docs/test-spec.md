# ĐẶC TẢ KIỂM THỬ PHẦN MỀM (TEST SPECIFICATION)
## DỰ ÁN BREWLITE: 100% CASHLESS SPECIALTY COFFEE ROASTERY
> **Tài liệu:** `docs/test-spec.md` (Đồng bộ với `Test_spec.md`)  
> **Học phần:** Công nghệ Phần mềm — Assignment 1 & 2  
> **Đơn vị đào tạo:** Khoa Công nghệ Thông tin, Trường Đại học Sài Gòn (SGU)  
> **Phiên bản:** v2.0 — Cập nhật toàn diện sau Fix Audit (32/32 Tests PASS)

---

## 1. TỔNG QUAN & CHIẾN LƯỢC KIỂM THỬ (TESTING STRATEGY)

Hệ thống BrewLite áp dụng mô hình kim tự tháp kiểm thử phần mềm (Testing Pyramid) đảm bảo tính toàn vẹn dữ liệu tài chính, bảo mật định danh và kiểm soát trạng thái đơn hàng nghiêm ngặt:

```
           / \
          /   \     E2E Manual User Flow Tests (10 Kịch bản cho 5 Màn hình)
         /-----\
        /       \    Integration Tests (Prisma DB, Idempotency, Concurrency Locking)
       /---------\
      /           \  Unit Tests (State Machine, Controller, DTO Validation, Bcrypt)
     /-------------\
```

### 1.1. Công cụ & Môi trường kiểm thử
* **Test Runner:** [Vitest v4.1+](https://vitest.dev/) kết hợp `@nestjs/testing`.
* **Cơ sở dữ liệu kiểm thử:** PostgreSQL 16 (chạy container Docker `brewlite_postgres`).
* **ORM:** Prisma Client v6.19.
* **Thời gian thực thi:** Toàn bộ 32 tests chạy hoàn tất trong vòng **~3.2 giây**.
* **Tỷ lệ vượt qua (Pass Rate):** **32/32 tests (100% PASS)**.

---

## 2. ĐẶC TẢ 32 BÀI KIỂM THỬ TỰ ĐỘNG BACKEND (AUTOMATED TEST CASES)

Hệ thống bao gồm **8 bộ kiểm thử (Test Suites)** với tổng cộng **32 bài test tự động** bao phủ từ Task 1 đến Task 10:

### Suite 1: Sức khỏe Máy chủ & Endpoint Gốc (`src/app.controller.spec.ts`)
| Mã Test Case | Kịch bản kiểm thử | Loại test | Kết quả |
| :---: | :--- | :---: | :---: |
| `TC-SYS-01` | `GET /`: Phản hồi chuỗi chào mừng `"Hello World!"` | Unit | **PASS** |
| `TC-SYS-02` | `GET /health`: Phản hồi HTTP 200 kèm trạng thái `"ok"` | Unit | **PASS** |

---

### Suite 2: Quản lý Sản phẩm & Phân loại (`src/products/products.spec.ts` — Task 2 & Task 4)
| Mã Test Case | Kịch bản kiểm thử | Loại test | Kết quả |
| :---: | :--- | :---: | :---: |
| `TC-PROD-01`| `findAll()`: Trả về danh sách sản phẩm đầy đủ giá, tồn kho, category, image | Integration | **PASS** |
| `TC-PROD-02`| `findAll({ category: 'COFFEE_VN' })`: Lọc chính xác danh mục cà phê truyền thống | Integration | **PASS** |
| `TC-PROD-03`| `findOne(id)`: Lấy chi tiết món kèm mảng danh sách topping khả dụng | Integration | **PASS** |
| `TC-PROD-04`| `findOne('fake-id')`: Ném lỗi `NotFoundException (404)` khi ID không tồn tại | Unit | **PASS** |

---

### Suite 3: Xác thực JWT & Bảo mật Mật khẩu (`src/auth/auth.spec.ts` — Task 7)
| Mã Test Case | Kịch bản kiểm thử | Loại test | Kết quả |
| :---: | :--- | :---: | :---: |
| `TC-AUTH-01`| `register()`: Đăng ký thành công, hash mật khẩu bằng Bcrypt 10 rounds, cấp JWT token | Integration | **PASS** |
| `TC-AUTH-02`| `register()`: Chặn đăng ký trùng email, ném lỗi `ConflictException (409)` | Integration | **PASS** |
| `TC-AUTH-03`| `login()`: Đăng nhập đúng email & mật khẩu, trả về `accessToken` hợp lệ | Integration | **PASS** |
| `TC-AUTH-04`| `login()`: Nhập sai mật khẩu, ném lỗi `UnauthorizedException (401)` | Unit | **PASS** |

---

### Suite 4: Tạo Đơn hàng & Topping (`src/orders/orders.spec.ts` — Task 6 & P0 Bug Verification)
| Mã Test Case | Kịch bản kiểm thử | Loại test | Kết quả |
| :---: | :--- | :---: | :---: |
| `TC-ORD-01` | **Xác thực Fix P0.1:** Tạo đơn với mã món ảo phải ném 404, **tuyệt đối không lấy nhầm món khác** | Integration | **PASS** |
| `TC-ORD-02` | Tạo đơn thành công: Tính đúng phụ thu Size M (+5k), Topping và trừ tồn kho nguyên tử | Integration | **PASS** |
| `TC-ORD-03` | **Xác thực Fix P0.3:** `findOne()` là hàm đọc dữ liệu, tuân thủ State Machine, không tự ý sửa trạng thái | Integration | **PASS** |

---

### Suite 5: Idempotency Khi Tạo Đơn Hàng (`src/orders/idempotency.spec.ts` — Task 10 Tiêu chí b)
| Mã Test Case | Kịch bản kiểm thử | Loại test | Kết quả |
| :---: | :--- | :---: | :---: |
| `TC-IDEM-01`| Gửi 2 request với cùng `Idempotency-Key` chỉ tạo đúng 1 đơn hàng duy nhất và trả về Replay | Integration | **PASS** |

---

### Suite 6: Kiểm soát Tranh chấp Đồng thời Tồn kho (`src/orders/optimistic-locking.spec.ts` — Task 10 Tiêu chí c)
| Mã Test Case | Kịch bản kiểm thử | Loại test | Kết quả |
| :---: | :--- | :---: | :---: |
| `TC-CONC-01`| Mô phỏng 10 request đồng thời đặt ly cuối cùng qua Optimistic Locking: kho không bao giờ âm (Zero Overselling) | Concurrency | **PASS** |

---

### Suite 7: Thanh toán, Replay & Thử lại (`src/payments/payments.spec.ts` — Task 8 & 10)
| Mã Test Case | Kịch bản kiểm thử | Loại test | Kết quả |
| :---: | :--- | :---: | :---: |
| `TC-PAY-01` | **Idempotency của `POST /payments`:** Gửi 2 lần cùng key chỉ trừ tiền 1 lần và trả về kết quả Replay | Integration | **PASS** |
| `TC-PAY-02` | **Xác thực Fix P0.2:** Đơn bị `PAYMENT_FAILED` có thể thử lại thanh toán thành công sang `PAID` | Integration | **PASS** |
| `TC-PAY-03` | **Kiểm tra quyền sở hữu:** Không cho phép user khác thanh toán đơn không thuộc về mình (403 Forbidden) | Unit | **PASS** |
| `TC-PAY-04` | **Toàn vẹn giá trị:** Gửi số tiền lệch với giá trị đơn hàng ném lỗi 400 BadRequestException | Unit | **PASS** |

---

### Suite 8: Máy trạng thái Đơn hàng (`src/orders/state-machine.spec.ts` — Task 10 Tiêu chí a)
| Mã Test Case | Chuyển đổi trạng thái kiểm tra | Kết quả mong đợi | Kết quả thực tế |
| :---: | :--- | :---: | :---: |
| `TC-SM-01` | `PENDING → PAID` (Thanh toán thành công) | Hợp lệ (Allow) | **PASS** |
| `TC-SM-02` | `PENDING → PAYMENT_FAILED` (Giao dịch lỗi) | Hợp lệ (Allow) | **PASS** |
| `TC-SM-03` | `PENDING → CANCELLED` (Khách hủy đơn chưa trả) | Hợp lệ (Allow) | **PASS** |
| `TC-SM-04` | `PAYMENT_FAILED → PENDING` (Khách bấm thử lại) | Hợp lệ (Allow) | **PASS** |
| `TC-SM-05` | `PAYMENT_FAILED → PAID` (Thanh toán lại thành công) | Hợp lệ (Allow) | **PASS** |
| `TC-SM-06` | `PAYMENT_FAILED → CANCELLED` (Khách hủy đơn thất bại) | Hợp lệ (Allow) | **PASS** |
| `TC-SM-07` | `PAID → PREPARING` (Barista nhận đơn pha chế) | Hợp lệ (Allow) | **PASS** |
| `TC-SM-08` | `PAID → CANCELLED` (Hoàn tiền / rollback theo đề bài) | Hợp lệ (Allow) | **PASS** |
| `TC-SM-09` | `PREPARING → READY` (Đồ uống đã làm xong) | Hợp lệ (Allow) | **PASS** |
| `TC-SM-10` | `READY → COMPLETED` (Khách nhận nước tại quầy) | Hợp lệ (Allow) | **PASS** |
| `TC-SM-11` | **CHẶN:** `PENDING → COMPLETED` (Chưa trả tiền đòi nhận nước) | Bị từ chối (400) | **PASS** |
| `TC-SM-12` | **CHẶN:** `CANCELLED → PAID` (Đơn hủy cố tình trả tiền) | Bị từ chối (400) | **PASS** |
| `TC-SM-13` | **CHẶN:** `COMPLETED → PENDING` (Đã nhận xong lùi về pending) | Bị từ chối (400) | **PASS** |

---

## 3. ĐẶC TẢ MANUAL E2E TEST CASES FRONTEND (5 MÀN HÌNH WIREFRAME)

| Mã Test | Màn hình | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :---: |
| `TC-FE-01` | Màn hình 1 (Menu) | Vào trang chủ `/` | Mạng bình thường | Hiển thị 10 món thực đơn, ảnh mộc, giá gốc và badge Bestseller/Truyền thống | **PASS** |
| `TC-FE-02` | Màn hình 1 (Menu) | Nhập từ khóa vào ô tìm kiếm | Gõ từ "muối" | Lưới sản phẩm lọc tức thì chỉ hiển thị "Cà Phê Muối" | **PASS** |
| `TC-FE-03` | Màn hình 1 (Menu) | Ngắt kết nối backend và tải lại | Backend offline | Hiển thị Banner đỏ báo lỗi kết nối kèm 2 nút "Thử lại" và "Dùng dữ liệu mẫu" | **PASS** |
| `TC-FE-04` | Màn hình 2 (Detail) | Bấm vào món Cà phê Muối `/products/[id]` | Chọn Size M (+5k), Thạch cà phê (+10k) | Giá trên nút "Thêm vào giỏ" nhảy từ 35.000đ lên 50.000đ | **PASS** |
| `TC-FE-05` | Màn hình 3 (Cart) | Bấm "Thêm vào giỏ hàng" | Món tùy chọn | Mở CartDrawer trượt từ phải sang, badge trên Navbar nhảy số, bấm F5 giỏ không mất | **PASS** |
| `TC-FE-06` | Màn hình 3 (Cart) | Bấm "Tiến hành thanh toán" khi chưa đăng nhập | Chưa có token | Tự động chuyển hướng về trang `/auth/login?redirect=/checkout` | **PASS** |
| `TC-FE-07` | Màn hình 4 (Checkout)| Nhập mã giảm giá | Gõ `BREWCOZY` | Giảm 15% tổng đơn (tối đa 25.000đ), hiển thị tiền sau giảm chuẩn xác | **PASS** |
| `TC-FE-08` | Màn hình 4 (Checkout)| Chọn "Ví điện tử" và bấm "Xác nhận thanh toán" | Phương thức WALLET | Bật Popup VietQR MB Bank kèm đồng hồ đếm ngược 60 giây và mã đơn thật | **PASS** |
| `TC-FE-09` | Màn hình 4 (Checkout)| Chọn Apple Pay | Bấm thanh toán | Bật popup mô phỏng quét sinh trắc học Face ID hiệu ứng xoay tròn và tích xanh | **PASS** |
| `TC-FE-10` | Màn hình 5 (Tracking)| Bấm "Xác nhận đã quét mã (Sandbox)" | Đơn chuyển PAID | Chuyển mượt sang trang `/orders/[id]`, hiển thị mã đơn, tiến trình 5 bước | **PASS** |

---

## 4. HƯỚNG DẪN THỰC THI KIỂM THỬ (HOW TO RUN TESTS)

### 4.1. Chạy toàn bộ 32 bài test tự động Backend
Mở Terminal tại thư mục dự án và chạy:
```powershell
npm --prefix backend test
```
**Kết quả hiển thị trên màn hình:**
```
✓ src/app.controller.spec.ts (2 tests)
✓ src/orders/state-machine.spec.ts (13 tests)
✓ src/products/products.spec.ts (4 tests)
✓ src/orders/idempotency.spec.ts (1 test)
✓ src/orders/orders.spec.ts (3 tests)
✓ src/orders/optimistic-locking.spec.ts (1 test)
✓ src/payments/payments.spec.ts (4 tests)
✓ src/auth/auth.spec.ts (4 tests)

Test Files  8 passed (8)
     Tests  32 passed (32)
  Duration  ~3.2s
```

### 4.2. Kiểm tra chất lượng bản Build Frontend (Production Build)
```powershell
npm --prefix frontend run build
```
**Kết quả:** 0 lỗi TypeScript, biên dịch 9/9 trang thành công (0 errors).
