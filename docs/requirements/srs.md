# 📄 TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS RÚT GỌN)
## BREWLITE — 100% CASHLESS SPECIALTY COFFEE ROASTERY PLATFORM

> **Tài liệu:** `docs/requirements/srs.md`  
> **Học phần:** Công nghệ Phần mềm (Software Engineering) — Assignment 2 (Requirements to Delivery)  
> **Đơn vị đào tạo:** Khoa Công nghệ Thông tin, Trường Đại học Sài Gòn (SGU)  
> **Giảng viên hướng dẫn:** ThS. Từ Lãng Phiêu  
> **Nhóm thực hiện:** Nhóm BrewLite (6 thành viên):
> 1. **Mã Gia Vỹ**
> 2. **Huỳnh Tuấn Kiệt**
> 3. **Nguyễn Gia Thành**
> 4. **Vũ Châu Minh Khôi**
> 5. **Quách Kỳ Minh**
> 6. **Nguyễn Thị Ý**  
> **Phiên bản:** v4.3 (Chuẩn hóa toàn diện Task 1.2: Hoàn thiện FR/NFR, MoSCoW, Traceability UC-11 & 9 Test Suites)  
> **Trạng thái:** Chính thức (Approved & Baselined)

---

## 📌 LỊCH SỬ THAY ĐỔI TÀI LIỆU (REVISION HISTORY)

| Phiên bản | Ngày cập nhật | Người thực hiện | Nội dung điều chỉnh chính |
| :---: | :---: | :--- | :--- |
| **v1.0 - v3.0** | 10/2026 | Nhóm phát triển | Các bản dự thảo phân tích yêu cầu sơ bộ ban đầu. |
| **v4.0** | 18/10/2026 | Nhóm phát triển | Hợp nhất yêu cầu nghiệp vụ thực tế, chốt luồng thanh toán và xác thực. |
| **v4.1** | 23/10/2026 | Mã Gia Vỹ & Nhóm | Chuẩn hóa theo barem Task 1.2: Bổ sung mã định danh `FR-xx`, `NFR-xx`, phân loại MoSCoW, tiêu chí nghiệm thu có thể kiểm chứng, cập nhật mô hình định mức nguyên liệu BOM Recipe và Optimistic Locking. |
| **v4.2** | 23/10/2026 | Nhóm BrewLite | Tích hợp cổng thanh toán bên thứ ba ZaloPay Sandbox (VNG), nhúng sơ đồ vector `use-case.svg` và hợp nhất toàn bộ tiêu chí nghiệm thu kiểm chứng tự động. |
| **v4.3** | 25/10/2026 | Nguyễn Gia Thành | Chuẩn hóa toàn diện: Bổ sung mô tả và AC cho FR-11, FR-12; bổ sung FR-13 ánh xạ UC-11 (Hủy đơn hàng); chuyển FR-07 sang MUST HAVE; thống nhất Timeout đơn PENDING 15 phút & Grace Period 5 phút; loại bỏ hoàn toàn VAT 8% khớp mã nguồn; mở rộng ma trận kiểm thử lên 9 Test Suites (72/72 tests) và đồng bộ sơ đồ Use Case đen trắng chuẩn UML. |

---

## 1. TỔNG QUAN HỆ THỐNG & PHÂN QUYỀN (RBAC)

### 1.1 Mục tiêu hệ thống
**BrewLite** là nền tảng thương mại điện tử chuyên biệt cho chuỗi cửa hàng cà phê chất lượng cao hoạt động theo mô hình **100% không dùng tiền mặt (100% Cashless Specialty Coffee Roastery)**. Hệ thống giải quyết triệt để vấn đề nghẽn cổ chai tại quầy gọi món giờ cao điểm bằng cách trao quyền cho khách hàng tự đặt món, tùy chỉnh hương vị, thanh toán trực tuyến qua thẻ/ví điện tử và theo dõi tiến độ chuẩn bị qua thiết bị cá nhân (PWA/Web).

### 1.2 Ma trận phân quyền 3 Role (Role-Based Access Control)
Hệ thống quản lý định danh người dùng qua cơ chế **Stateless JWT Authentication** với 3 vai trò độc lập:

| Vai trò (Role) | Ký hiệu Enum | Phạm vi quyền hạn & Giao diện tương ứng |
| :--- | :---: | :--- |
| **Khách hàng** | `CUSTOMER` | - Xem Menu, duyệt danh mục, cấu hình Size/Topping/Đá/Đường, quản lý Giỏ hàng.<br>- Đăng ký/Đăng nhập tài khoản, tích lũy điểm Loyalty (1.000đ = 1 điểm), áp mã giảm giá (Voucher).<br>- Tạo đơn hàng, thanh toán qua Cổng giả lập Mock / Cổng ZaloPay Sandbox, theo dõi tiến trình và lịch sử đơn hàng tại `/orders`. |
| **Nhân viên quầy pha chế** | `STAFF` | - Truy cập giao diện màn hình bếp/quầy pha chế (**Staff KDS** tại `/staff/orders`).<br>- Tiếp nhận đơn hàng mới (`PAID`), chuyển trạng thái pha chế `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`. |
| **Quản trị viên / Chủ quán** | `ADMIN` | - Truy cập bảng điều khiển quản trị (**Admin Portal** tại `/admin`).<br>- Quản lý thực đơn (CRUD món nước/bánh ngọt), định giá theo size, bật/tắt bán thủ công (`isSoldOutManual`).<br>- Quản lý định mức công thức pha chế (BOM Recipe) và theo dõi, cảnh báo tồn kho nguyên liệu (`Ingredient`). |

---

## 2. BẢNG PHÂN LOẠI MỨC ĐỘ ƯU TIÊN THEO MoSCoW

| Mức độ ưu tiên | Ý nghĩa phân loại | Danh sách mã yêu cầu chức năng (FR) |
| :--- | :--- | :--- |
| **MUST HAVE**<br>*(Bắt buộc cốt lõi)* | Các chức năng sống còn bắt buộc phải hoàn thành 100% để tạo thành sản phẩm khả dụng tối thiểu (MVP). | `FR-01` (Duyệt Menu), `FR-02` (Cá nhân hóa món), `FR-03` (Giỏ hàng), `FR-04` (Xác thực JWT/RBAC), `FR-05` (Đặt đơn & Optimistic Lock), `FR-06` (Thanh toán ZaloPay/Mock & Idempotency), `FR-07` (Voucher & Loyalty Point), `FR-08` (Theo dõi đơn thời gian thực) |
| **SHOULD HAVE**<br>*(Nên có / Quan trọng)* | Các chức năng mở rộng gia tăng trải nghiệm người dùng và tối ưu vận hành đã được hiện thực hoàn chỉnh 100% trong dự án. | `FR-09` (Staff KDS Pha chế quầy Bar), `FR-10` (Admin Menu, Kho & Định mức BOM Recipe), `FR-13` (Hủy Đơn Hàng & Hoàn Tồn Kho — tương ứng `UC-11`) |
| **COULD HAVE**<br>*(Có thể làm thêm)* | Các tính năng nâng cao hữu ích hỗ trợ tự động hóa hệ thống và nâng cao trải nghiệm tra cứu món. | `FR-11` (Scheduled Job tự động hủy đơn PENDING quá hạn sau 15 phút), `FR-12` (Tìm kiếm & Bộ lọc thực đơn nâng cao theo danh mục) |
| **WON'T HAVE**<br>*(Chưa làm đợt này)* | Các phạm vi ngoại biên không thuộc khuôn khổ bài tập lớn Assignment 2. | Đấu nối cổng thanh toán ngân hàng thật có hợp đồng merchant pháp nhân, tích hợp thông báo đẩy native FCM di động, giao hàng tận nơi (Delivery). |

---

## 3. SƠ ĐỒ USE-CASE TỔNG QUÁT CỦA TOÀN HỆ THỐNG

> **Tệp mã nguồn PlantUML:** [`docs/diagrams/use-case.puml`](../diagrams/use-case.puml)  
> **Ảnh kết xuất Vector SVG:** [`docs/diagrams/use-case.svg`](../diagrams/use-case.svg)  
> **Ảnh kết xuất PNG:** [`docs/diagrams/use-case.png`](../diagrams/use-case.png)

### 3.1 Sơ đồ Use-Case chuẩn UML (Vector Graphics)

![BrewLite System Use Case Diagram](../diagrams/use-case.svg)

### 3.2 Bảng phân rã Use-Case & Ánh xạ Tác nhân (Traceability Matrix)

Sơ đồ Use Case tổng quát tuân thủ quy chuẩn quốc tế UML 2.5 với **4 Tác nhân (Actors)** và **17 Use Cases** được phân chia rạch ròi theo phân hệ:

| Mã Use-Case | Tên Use-Case | Tác nhân chính (Actor) | Quan hệ phụ thuộc (Relationships) | Mã FR tương ứng |
| :---: | :--- | :--- | :--- | :---: |
| **UC-01** | Xem thực đơn & tìm kiếm món | Khách hàng | Liên kết trực tiếp | `FR-01`, `FR-12` |
| **UC-02** | Xem chi tiết món & chọn Size, Topping | Khách hàng | Liên kết trực tiếp | `FR-02` |
| **UC-03** | Quản lý giỏ hàng | Khách hàng | Liên kết trực tiếp | `FR-03` |
| **UC-04** | Đăng ký tài khoản | Khách hàng | Liên kết trực tiếp | `FR-04` |
| **UC-05** | Đăng nhập hệ thống | Khách hàng, Nhân viên, Admin | `<<include>>` Xác thực phân quyền (RBAC) | `FR-04` |
| **UC-06** | Xác thực phân quyền (RBAC) | Hệ thống | Được `<<include>>` bởi UC-05 | `FR-04` |
| **UC-07** | Đặt hàng & Thanh toán | Khách hàng | `<<include>>` Xử lý thanh toán, Tích lũy điểm | `FR-05`, `FR-06` |
| **UC-08** | Áp dụng mã giảm giá (Voucher) | Khách hàng | `<<extend>>` Đặt hàng & Thanh toán | `FR-07` |
| **UC-09** | Tích lũy & dùng điểm thưởng | Khách hàng | Được `<<include>>` bởi Đặt hàng & Thanh toán | `FR-07` |
| **UC-10** | Xử lý thanh toán trực tuyến | Cổng thanh toán (ZaloPay/Mock) | Được `<<include>>` bởi Đặt hàng & Thanh toán | `FR-06` |
| **UC-11** | Hủy đơn hàng | Khách hàng | Liên kết trực tiếp (Grace Period / Retry) | `FR-13` |
| **UC-12** | Theo dõi tiến độ đơn thời gian thực | Khách hàng | Liên kết trực tiếp | `FR-08` |
| **UC-13** | Xem lịch sử đơn hàng | Khách hàng | Liên kết trực tiếp | `FR-08` |
| **UC-14** | Tiếp nhận đơn hàng quầy pha chế (KDS) | Nhân viên (Barista) | Liên kết trực tiếp | `FR-09` |
| **UC-15** | Cập nhật trạng thái pha chế | Nhân viên (Barista) | Liên kết trực tiếp (PREPARING $\rightarrow$ READY) | `FR-09` |
| **UC-16** | Quản trị thực đơn & Kho BOM Recipe | Quản trị viên (Admin) | Liên kết trực tiếp | `FR-10` |
| **UC-17** | Xem báo cáo thống kê & doanh thu | Quản trị viên (Admin) | Liên kết trực tiếp | `FR-10` |

---

## 4. DANH SÁCH YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS - FR)

Mỗi yêu cầu chức năng được chuẩn hóa mã định danh `FR-xx`, độ ưu tiên theo chuẩn MoSCoW, mô tả giải pháp kỹ thuật và **toàn bộ Tiêu chí chấp nhận (Acceptance Criteria - AC)** có thể kiểm chứng được qua bài kiểm thử tự động hoặc thao tác trực quan.

---

### `FR-01`: Duyệt Thực Đơn & Tìm Kiếm Sản Phẩm
* **Độ ưu tiên:** `MUST HAVE`
* **Tác nhân:** Khách hàng, Nhân viên, Quản trị viên
* **Mô tả chi tiết:**
  * Hệ thống cung cấp API `GET /products` trả về danh sách toàn bộ sản phẩm đang kích hoạt (`isActive = true`).
  * Giao diện hiển thị danh sách dạng lưới card responsive theo phân loại tab danh mục: *Cà phê Việt Nam (`vietnamese`), Cà phê pha máy (`espresso`), Trà trái cây (`tea`), Cà phê ủ lạnh (`coldbrew`), Bánh ngọt (`bakery`)*.
  * Mỗi card hiển thị: Ảnh đại diện sản phẩm, tên món, nhãn tag nổi bật ("Phổ biến", "Mới"), và đơn giá cơ sở (size S chuẩn).
  * Sản phẩm bị hết nguyên liệu hoặc bị đánh dấu `isSoldOutManual = true` sẽ hiển thị nhãn "Hết hàng" (Sold Out) và làm mờ/vô hiệu hóa nút chọn mua.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] **AC-01.1:** API `GET /products` trả về mã `200 OK` kèm danh sách sản phẩm mẫu (tối thiểu 10 món).
  - [x] **AC-01.2:** Tải trang Menu hiển thị hiệu ứng khung xương (Skeleton loader) mượt mà trong khi chờ API phản hồi.
  - [x] **AC-01.3:** Lọc danh mục không làm tải lại trang (Client-side fast filtering).
  - [x] **AC-01.4:** Tìm kiếm sản phẩm theo từ khóa (tên món) không phân biệt chữ hoa, chữ thường hoặc dấu tiếng Việt.
  - [x] **AC-01.5:** Sản phẩm hết hàng (tồn kho nguyên liệu BOM không đủ pha chế 1 ly cơ sở hoặc bị admin đánh dấu) hiển thị badge "Hết hàng" và chặn nút "Chọn món".
  - [x] **AC-01.6:** Nếu danh mục rỗng, hiển thị Empty State kèm thông điệp điều hướng trực quan.

---

### `FR-02`: Chi Tiết Món & Cá Nhân Hóa Tùy Chọn (Customization)
* **Độ ưu tiên:** `MUST HAVE`
* **Tác nhân:** Khách hàng
* **Mô tả chi tiết:**
  * Cho phép người dùng nhấp vào món để mở Modal xem chi tiết (`ProductDetailModal`) hoặc truy cập trang `/menu/:id`.
  * Hỗ trợ cấu hình **Kích cỡ (Size)**: Size S (mặc định, +0đ), Size M (+5.000đ hoặc theo `sizeUpchargeM`), Size L (+10.000đ hoặc theo `sizeUpchargeL`). Riêng các sản phẩm thuộc danh mục bánh ngọt (`bakery`) chỉ có duy nhất size tiêu chuẩn (`ALL`).
  * Hỗ trợ chọn **Nhiều Topping đi kèm** từ danh mục `ToppingRecipe`: *Kem muối biển (+10.000đ), Trân châu giòn (+8.000đ), Thạch cà phê phin (+8.000đ), Shot Espresso đậm vị (+12.000đ)*.
  * Riêng đối với nhóm Bánh nướng (Bakery), hiển thị danh sách đồ ăn kèm: *Sốt socola (+8.000đ), Bơ hạt mộc (+5.000đ), Kem phô mai (+10.000đ), Mứt dâu rừng (+8.000đ)*.
  * Tùy chọn khẩu vị không phụ thu: Mức đá (100%, 70%, 50%, Không đá) và Mức đường (100%, 70%, 50%, Không đường).
  * Cơ chế **Dynamic Pricing**: Tự động tính toán và cập nhật giá hiển thị ngay lập tức khi khách hàng thay đổi Size hoặc tích chọn thêm Topping.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] **AC-02.1:** Giá hiển thị trên nút "Thêm vào giỏ" luôn bằng:  
    $$\text{Giá hiển thị} = \left(\text{basePrice} + \text{sizeUpcharge} + \sum \text{toppingPrice}\right) \times \text{quantity}$$
  - [x] **AC-02.2:** Người dùng có thể chọn đồng thời từ 0 đến 4 loại topping khác nhau cho cùng một ly.
  - [x] **AC-02.3:** Tùy chọn mức đường (100%, 70%, 50%, 0%) và mức đá (100%, 70%, 50%, 0%) được lưu đúng định dạng vào cấu hình món.
  - [x] **AC-02.4:** Nhóm Bánh ngọt (`bakery`) không hiển thị cấu hình đá/đường mà chuyển sang cấu hình đồ ăn kèm (Sauce / Butter / Spread).

---

### `FR-03`: Quản Lý Giỏ Hàng Cục Bộ (Shopping Cart Store)
* **Độ ưu tiên:** `MUST HAVE`
* **Tác nhân:** Khách hàng
* **Mô tả chi tiết:**
  * Giỏ hàng được quản lý bằng state management cục bộ (Zustand Cart Store) và đồng bộ liên tục vào `localStorage` của trình duyệt.
  * Hỗ trợ gộp món thông minh: Nếu thêm một món có cùng `productId`, cùng kích cỡ `size` và cùng danh sách `toppings` thì hệ thống tự động cộng dồn số lượng (`quantity`), không tạo dòng mới. Nếu khác bất kỳ tùy biến nào, tạo một `cartItem` độc lập.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] **AC-03.1:** Thêm món mới vào giỏ: Tự động phân biệt trùng lặp tùy chọn để tăng số lượng hoặc tạo dòng mục mới.
  - [x] **AC-03.2:** Cho phép tăng/giảm số lượng từng món linh hoạt theo nhu cầu (tối thiểu 1 ly, trần an toàn kỹ thuật là 100 ly/dòng món), hoặc bấm biểu tượng thùng rác để xóa món.
  - [x] **AC-03.3:** Tự động tính Tạm tính và Tổng thanh toán giỏ hàng dựa trên tổng thành tiền các món (đã bao gồm đầy đủ thuế phí theo giá niêm yết, không phát sinh dòng thuế VAT phụ thu riêng).
  - [x] **AC-03.4:** Trạng thái giỏ hàng được giữ nguyên vẹn khi người dùng tải lại trang (F5) hoặc tắt mở lại trình duyệt.
  - [x] **AC-03.5:** Header website luôn hiển thị badge số lượng món trong giỏ hàng theo thời gian thực (Realtime cart badge count).

---

### `FR-04`: Xác Thực & Phân Quyền Người Dùng (Auth JWT & RBAC)
* **Độ ưu tiên:** `MUST HAVE`
* **Tác nhân:** Khách hàng, Nhân viên, Quản trị viên
* **Mô tả chi tiết:**
  * Cung cấp API `POST /auth/register` và `POST /auth/login`. Mật khẩu được mã hóa một chiều an toàn bằng thư viện `bcrypt` (độ dài salt = 10 vòng băm), độ dài tối thiểu $\ge 6$ ký tự.
  * Phản hồi đăng nhập thành công trả về chuỗi JSON Web Token (JWT) có thời hạn hiệu lực **7 ngày**, chứa payload `{ userId, email, role }`.
  * Hỗ trợ cơ chế **Redirect giữ nguyên giỏ hàng**: Khách hàng đang ở giỏ hàng chuyển sang đăng nhập sẽ được điều hướng thẳng đến trang Checkout, không làm mất món trong giỏ.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] **AC-04.1:** Đăng ký từ chối email đã tồn tại với mã lỗi `409 Conflict`.
  - [x] **AC-04.2:** Mật khẩu dưới 6 ký tự bị chặn ngay tại Client form validation và Backend DTO validation với mã lỗi `400 Bad Request`.
  - [x] **AC-04.3:** Đăng nhập thất bại (sai email hoặc mật khẩu) trả về mã lỗi `401 Unauthorized` kèm thông điệp chung chống rò rỉ dữ liệu.
  - [x] **AC-04.4:** Bảo vệ các endpoint nhạy cảm (`/payments`, `/orders/me`, `/staff/*`, `/admin/*`) bằng `JwtAuthGuard` và `RolesGuard`. Truy cập không quyền bị từ chối với mã lỗi `403 Forbidden`.

---

### `FR-05`: Đặt Đơn Hàng & Giữ Tồn Kho Đồng Thời (Optimistic Locking)
* **Độ ưu tiên:** `MUST HAVE`
* **Tác nhân:** Khách hàng, Hệ thống
* **Mô tả chi tiết:**
  * Cung cấp API `POST /orders` tiếp nhận danh sách món trong giỏ, tạo đơn hàng ở trạng thái ban đầu `PENDING`.
  * Cơ chế **Kiểm tra tồn kho theo công thức (BOM Recipe)**: Mỗi ly cà phê yêu cầu định mức nguyên liệu cụ thể (VD: 1 ly Cà phê sữa đá cần 20g cà phê hạt phin + 30ml sữa đặc). Hệ thống kiểm tra số dư nguyên liệu trong bảng `Ingredient` trước khi tạo đơn.
  * Áp dụng **Khóa lạc quan (Optimistic Locking)** qua trường `version` trên bảng `Order`: Mọi cập nhật trạng thái đơn phải có điều kiện `where: { id, version }` và tăng `version` lên 1 đơn vị nhằm loại bỏ triệt để hiện tượng tranh chấp ghi đè (Race Condition).
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] **AC-05.1:** Đơn hàng tạo thành công có trạng thái `PENDING` và tổng tiền khớp 100% với giá trị các món.
  - [x] **AC-05.2:** Nếu nguyên liệu không đủ pha chế, API ném `BadRequestException` thông báo rõ nguyên liệu hết hàng, không tạo đơn rác.
  - [x] **AC-05.3:** Nếu có 2 tiến trình đồng thời thay đổi trạng thái cùng một đơn hàng, tiến trình đến sau bị từ chối với mã lỗi `409 Conflict` (Zero Overselling).
  - [x] **AC-05.4:** Đơn hàng ở trạng thái `PENDING` quá **15 phút** mà không thanh toán sẽ bị từ chối xử lý khi gửi lệnh thanh toán hoặc tự động bị hủy bởi Scheduled Job.

---

### `FR-06`: Thanh Toán Không Tiền Mặt & Cổng ZaloPay Sandbox
* **Độ ưu tiên:** `MUST HAVE`
* **Tác nhân:** Khách hàng, Cổng thanh toán ZaloPay Sandbox, Hệ thống
* **Mô tả chi tiết:**
  * Hỗ trợ thanh toán 100% không dùng tiền mặt qua 2 chế độ:
    1. **Cổng thanh toán ZaloPay Sandbox (Bên thứ ba VNG):** API `POST /payments/zalopay/create` gọi sang máy chủ ZaloPay (`https://sb-openapi.zalopay.vn/v2/create`) với chữ ký số bảo mật **HMAC-SHA256 (Key1)**, trả về mã QR động và link thanh toán. Hệ thống lắng nghe Webhook IPN (`POST /payments/zalopay/callback`) xác minh chữ ký **Key2** và Polling tự động mỗi 3 giây (`GET /payments/zalopay/status/:orderId`) qua API `v2/query`.
    2. **Cổng giả lập (Mock Payment Simulator):** Hỗ trợ cờ `simulateFailure` để demo nghiệm thu cả luồng thành công lẫn luồng thất bại.
  * Cơ chế **Chống thanh toán trùng (Idempotency Guard)**: Sử dụng header `Idempotency-Key`. Nếu khách hàng bấm liên tiếp nhiều lần, hệ thống trả về kết quả giao dịch cũ, tuyệt đối không trừ tiền 2 lần.
  * Khi thanh toán thành công: Đơn hàng chuyển sang `PAID`, tự động **trừ kho nguyên liệu BOM** trong Database Transaction ACID và tự động **cộng điểm Loyalty** cho khách hàng (1.000đ = 1 điểm).
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] **AC-06.1:** Bấm thanh toán tạo đúng mã QR ZaloPay Sandbox / VietQR hiển thị trực tiếp trên giao diện Checkout.
  - [x] **AC-06.2:** Gửi lại cùng `Idempotency-Key` trả về ngay kết quả giao dịch cũ với cờ `isIdempotent: true`, không tạo bản ghi thanh toán mới.
  - [x] **AC-06.3:** Nhận tín hiệu thanh toán thành công (Webhook hoặc Polling): Đơn hàng đổi sang `PAID`, giao diện tự động nhảy tick xanh và điều hướng sang trang xác nhận đơn.
  - [x] **AC-06.4:** Khi chọn kịch bản lỗi (`simulateFailure = true`), đơn hàng chuyển sang `PAYMENT_FAILED` với thông báo lỗi lịch sự, cho phép khách hàng thử lại hoặc đổi phương thức thanh toán.
  - [x] **AC-06.5:** Phòng chống tấn công IDOR: Khách hàng không thể thanh toán đơn hàng thuộc về người dùng khác (`403 Forbidden`).

---

### `FR-07`: Mã Giảm Giá (Voucher) & Điểm Thưởng Thành Viên (Loyalty)
* **Độ ưu tiên:** `MUST HAVE`
* **Tác nhân:** Khách hàng
* **Mô tả chi tiết:**
  * Seed sẵn các mã voucher khuyến mãi: `BREWLITE10` (giảm 10%), `WELCOME20` (giảm 20.000đ cho đơn từ 50.000đ).
  * API `POST /vouchers/validate` kiểm tra tính hợp lệ của mã: điều kiện giá trị đơn tối thiểu, ngày hết hạn và số lượt sử dụng còn lại.
  * Cơ chế **Hạt Vàng BrewLite Club (Loyalty)**: Tích lũy tự động 1 điểm cho mỗi 1.000 VNĐ chi tiêu (`points = Math.floor(totalAmount / 1000)`). Khách hàng có thể quy đổi điểm thành chiết khấu trực tiếp vào đơn hàng.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] **AC-07.1:** Nhập mã giảm giá hợp lệ: Tổng tiền thanh toán giảm chính xác theo tỷ lệ hoặc số tiền cố định.
  - [x] **AC-07.2:** Nhập mã sai, hết hạn hoặc không đủ giá trị đơn tối thiểu: Hiển thị thông báo lỗi cụ thể, không áp dụng chiết khấu.
  - [x] **AC-07.3:** Sau khi thanh toán đơn hàng thành công, số dư điểm thưởng trong bảng `User.loyaltyPoints` được cộng dồn chính xác theo tỷ lệ 1.000đ = 1 điểm.

---

### `FR-08`: Theo Dõi Tiến Trình Đơn Hàng & Lịch Sử (Realtime Tracking)
* **Độ ưu tiên:** `MUST HAVE`
* **Tác nhân:** Khách hàng
* **Mô tả chi tiết:**
  * Cung cấp trang xem lịch sử đơn hàng cá nhân tại `/orders` (gọi API `GET /orders/me` có gắn JWT token).
  * Hiển thị thanh tiến trình trực quan 5 nấc: `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`.
  * Cơ chế **Client-side Polling 3-5s**: Tự động gửi request kiểm tra trạng thái đơn hàng định kỳ, cập nhật giao diện ngay khi Barista đổi trạng thái mà không cần người dùng tải lại trang.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] **AC-08.1:** Trang `/orders` hiển thị danh sách đơn sắp xếp giảm dần theo thời gian tạo (mới nhất lên đầu).
  - [x] **AC-08.2:** Mỗi card đơn hàng hiển thị đầy đủ: Mã đơn `#id`, thời gian, danh sách món kèm size/topping, tổng tiền, phương thức thanh toán và badge trạng thái có màu sắc phân biệt.
  - [x] **AC-08.3:** Khi trạng thái đơn chuyển sang `READY`, giao diện hiển thị thông báo nổi bật mời khách đến quầy Bar Express nhận đồ uống.

---

### `FR-09`: Phân Hệ Quầy Pha Chế Barista (Kitchen Display System - KDS)
* **Độ ưu tiên:** `SHOULD HAVE`
* **Tác nhân:** Nhân viên quầy pha chế (Staff / Barista)
* **Mô tả chi tiết:**
  * Màn hình chuyên dụng cho Barista tại đường dẫn `/staff/orders`.
  * Tự động lọc và hiển thị danh sách các đơn hàng đã thanh toán thành công (`PAID`) hoặc đang chế biến (`PREPARING`).
  * Cung cấp nút thao tác nhanh 1 chạm: **"Bắt đầu pha chế"** (`PAID` $\rightarrow$ `PREPARING`) và **"Pha chế xong"** (`PREPARING` $\rightarrow$ `READY`).
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] **AC-09.1:** Chỉ tài khoản có `role = STAFF` hoặc `ADMIN` mới được truy cập giao diện KDS; tài khoản `CUSTOMER` bị chặn truy cập.
  - [x] **AC-09.2:** Chi tiết từng ly nước hiển thị rõ ràng: Tên món, Size, Chi tiết Topping, Mức đường, Mức đá để Barista pha chế chuẩn xác 100%.
  - [x] **AC-09.3:** Chuyển trạng thái đơn được bảo vệ bởi máy trạng thái (State Machine Guard), không thể bấm nhảy cóc trạng thái sai quy trình.

---

### `FR-10`: Cổng Quản Trị Cửa Hàng (Admin Management Portal)
* **Độ ưu tiên:** `SHOULD HAVE`
* **Tác nhân:** Quản trị viên / Chủ quán (Admin)
* **Mô tả chi tiết:**
  * Bảng điều khiển quản trị tập trung tại đường dẫn `/admin`.
  * **Quản lý Thực đơn (Menu CRUD):** Thêm món mới, chỉnh sửa tên món, giá cơ sở, ảnh đại diện, danh mục, phụ thu size S/M/L, bật/tắt trạng thái kinh doanh (`isActive`).
  * **Báo hết hàng thủ công (`isSoldOutManual`):** Cho phép bật công tắc "Tạm hết hàng" cho món bất kỳ khi quầy gặp sự cố đột xuất.
  * **Quản lý Kho & Định mức công thức (BOM Recipe Editor):** Xem danh sách tồn kho nguyên liệu (`Ingredient`), định mức công thức pha chế (`RecipeItem`) và nhận cảnh báo khi tồn kho chạm ngưỡng an toàn.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] **AC-10.1:** Chỉ tài khoản có `role = ADMIN` mới có quyền truy cập; người dùng khác bị điều hướng về trang chủ.
  - [x] **AC-10.2:** Thêm/sửa/xóa sản phẩm cập nhật ngay lập tức vào cơ sở dữ liệu PostgreSQL.
  - [x] **AC-10.3:** Bật `isSoldOutManual = true` lập tức phản ánh ra giao diện Menu của khách hàng, khóa nút đặt món.

---

### `FR-11`: Tự Động Hủy Đơn Quá Hạn & Hoàn Tồn Kho (Scheduled Order Expiration Job)
* **Độ ưu tiên:** `COULD HAVE`
* **Tác nhân:** Hệ thống (Background Worker / Cron Task)
* **Mô tả chi tiết:**
  * Tiến trình chạy ngầm định kỳ tự động quét các đơn hàng ở trạng thái `PENDING` đã tồn tại quá **15 phút** mà chưa nhận được tín hiệu thanh toán thành công từ ZaloPay Webhook hoặc cổng Mock.
  * Tự động chuyển trạng thái đơn hàng sang `CANCELLED` và hoàn trả số lượng nguyên liệu BOM đã giữ chỗ vào bảng `Ingredient`.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] **AC-11.1:** Các đơn hàng `PENDING` quá 15 phút tự động chuyển sang trạng thái `CANCELLED`.
  - [x] **AC-11.2:** Các nguyên liệu định mức tương ứng trong kho `Ingredient` được hoàn trả chính xác số lượng trong cùng một transaction.

---

### `FR-12`: Tìm Kiếm & Bộ Lọc Thực Đơn Nâng Cao (Menu Filtering & Search)
* **Độ ưu tiên:** `COULD HAVE`
* **Tác nhân:** Khách hàng
* **Mô tả chi tiết:**
  * Cung cấp thanh tìm kiếm sản phẩm hỗ trợ chuẩn hóa tiếng Việt Unicode NFC, không phân biệt hoa thường.
  * Cung cấp thanh tab phân loại danh mục sản phẩm linh hoạt (`Tất cả`, `Cà phê Việt Nam`, `Espresso`, `Trà trái cây`, `Cold Brew`, `Bánh ngọt`) giúp khách lọc nhanh đồ uống yêu thích chỉ với 1 chạm mà không cần tải lại trang.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] **AC-12.1:** Nhập từ khóa tìm kiếm: Giao diện lọc ngay các món có tên chứa từ khóa.
  - [x] **AC-12.2:** Chọn tab danh mục: Danh sách món lập tức chuyển đổi theo nhóm sản phẩm đã chọn.

---

### `FR-13`: Hủy Đơn Hàng & Hoàn Tồn Kho (Order Cancellation & Inventory Rollback)
* **Độ ưu tiên:** `SHOULD HAVE` *(Tương ứng trực tiếp Use-Case `UC-11`)*
* **Tác nhân:** Khách hàng, Hệ thống
* **Mô tả chi tiết:**
  * Cho phép khách hàng chủ động hủy đơn khi đơn còn ở trạng thái `PENDING` (chưa thanh toán).
  * Cho phép khách hàng hủy đơn khi thanh toán thất bại (`PAYMENT_FAILED`) thay vì chọn thanh toán lại.
  * Cho phép khách hàng yêu cầu hủy đơn trong vòng **5 phút (Grace Period)** sau khi đã thanh toán thành công (`PAID`), với điều kiện Barista tại quầy bar chưa bấm tiếp nhận chế biến (`PREPARING`).
  * Mọi thao tác hủy đơn đều kích hoạt hoàn trả định mức nguyên liệu BOM về kho `Ingredient` trong Database Transaction an toàn.
* **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] **AC-13.1:** Hủy đơn ở trạng thái `PENDING` hoặc `PAYMENT_FAILED`: Đơn hàng lập tức chuyển sang `CANCELLED` và giải phóng nguyên liệu giữ chỗ.
  - [x] **AC-13.2:** Đơn hàng ở trạng thái `PAID` được hủy trong vòng 5 phút trước khi Barista bấm tiếp nhận (`PREPARING`): Trạng thái chuyển sang `CANCELLED` và hoàn trả nguyên liệu.
  - [x] **AC-13.3:** Nếu đơn hàng đã chuyển sang `PREPARING`, `READY` hoặc `COMPLETED`, nút "Hủy đơn" bị khóa và hệ thống từ chối yêu cầu hủy đơn với thông báo đồ uống đang được chế biến.

---

## 5. DANH SÁCH YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

| Mã NFR | Nhóm Yêu Cầu | Tiêu Chí Đo Lường Chi Tiết | Phương Pháp Kiểm Chứng Thực Tế |
| :--- | :--- | :--- | :--- |
| **`NFR-01`** | **Hiệu năng phản hồi<br>*(Performance)*** | • Thời gian phản hồi của các API đọc (`GET /products`, `GET /orders/me`) **$\le$ 200ms** ở tải thông thường và **$\le$ 500ms** tại ngưỡng 100 concurrent requests.<br>• Dung lượng bundle JS trang chủ tối ưu dưới 250KB gzipped. | Đo đạc qua Network Tab DevTools và công cụ kiểm thử hiệu năng. |
| **`NFR-02`** | **Bảo mật & An toàn<br>*(Security)*** | • Mật khẩu người dùng được băm bằng thuật toán **Bcrypt** với cost factor = 10, không lưu plain text.<br>• Xác thực bằng **Stateless JWT** truyền qua header `Authorization: Bearer <token>`, hết hạn sau 7 ngày.<br>• Ngăn chặn tấn công **IDOR**: Kiểm tra quyền sở hữu đơn hàng trước khi thanh toán.<br>• Xác thực chữ ký số **HMAC-SHA256** cho mọi giao dịch ZaloPay Sandbox. | Kiểm thử qua bộ test case bảo mật trong `payments.service.spec.ts`. |
| **`NFR-03`** | **Tính toàn vẹn & Chống bán vượt<br>*(Data Integrity & Concurrency)*** | • Tuyệt đối không xảy ra hiện tượng bán vượt tồn kho (**Zero Overselling**).<br>• Áp dụng cơ chế **Optimistic Locking** thông qua trường `version` trên đơn hàng và nguyên liệu.<br>• Mọi thao tác cập nhật trạng thái đơn, thanh toán và trừ kho nguyên liệu BOM phải bọc trong **Database Transaction** bảo đảm tính chất ACID. | Kiểm thử đồng thời (Concurrency test) trong `checkout.e2e-spec.ts`. |
| **`NFR-04`** | **Khả năng sử dụng & Trải nghiệm<br>*(Usability & Neumorphism UX)*** | • Thiết kế giao diện theo phong cách **Mobile-First Responsive**, tối ưu cho màn hình cảm ứng di động (375px - 430px) và màn hình quầy Kiosk.<br>• Thao tác từ lúc chọn món đến khi tạo mã QR thanh toán không vượt quá **3 chạm**.<br>• Đầy đủ các trạng thái tương tác: Skeleton loading, Empty state, Error message, Toast chúc mừng. | Kiểm thử thực tế trên thiết bị di động (iOS Safari, Android Chrome). |
| **`NFR-05`** | **Khả năng triển khai & Vận hành<br>*(Deployability & DevOps)*** | • Khởi chạy toàn bộ hệ thống (Web, API, DB PostgreSQL) chỉ bằng duy nhất **1 câu lệnh** `docker compose up`.<br>• Thiết lập pipeline **GitHub Actions CI/CD** tự động kiểm tra Lint, Test, Build trước khi triển khai.<br>• Cung cấp endpoint kiểm tra sức khỏe hệ thống: `GET /health` phản hồi uptime và trạng thái database. | Chạy lệnh `docker compose up -d` và kiểm tra phản hồi từ `GET /health`. |
| **`NFR-06`** | **Chống trùng lặp giao dịch<br>*(Financial Idempotency)*** | • Áp dụng cơ chế **Idempotency-Key** cho toàn bộ các giao dịch tài chính.<br>• Khi nhận yêu cầu trùng lặp key, hệ thống trả về kết quả đã xử lý trước đó trong vòng **< 50ms**, không phát sinh thêm bản ghi thanh toán. | Kiểm thử qua 21 bài unit test trong `payments.service.spec.ts`. |

---

## 6. TIÊU CHÍ CHẤP NHẬN & MA TRẬN KIỂM CHỨNG TỰ ĐỘNG

Dự án áp dụng phương pháp kiểm thử hướng hành vi (Behavior-Driven Testing), bảo đảm 100% các yêu cầu nghiệp vụ cốt lõi đều được bảo vệ bởi **9 Test Suites** với **72 automated test cases** (đạt tỷ lệ vượt qua **100%**):

| STT | Mã Yêu Cầu | Hạng Mục Kiểm Tra | File Kiểm Thử Tự Động | Kết Quả Nghiệm Thu Thực Tế |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `FR-01`, `NFR-01` | Lấy danh sách sản phẩm & Phân trang | `products.service.spec.ts` | 6/6 tests passed (Trả về đúng cấu trúc, lọc sản phẩm kích hoạt). |
| **2** | `FR-01` | Controller định tuyến & Tham số sản phẩm | `products.controller.spec.ts` | 1/1 tests passed (Verify endpoint GET /products). |
| **3** | `FR-04`, `NFR-02` | Mã hóa mật khẩu & Cấp phát JWT | `auth.service.spec.ts` | 6/6 tests passed (Bảo vệ mật khẩu, chặn email trùng, verify JWT). |
| **4** | `FR-05`, `NFR-03` | Tạo đơn & Trừ kho Optimistic Locking | `orders.service.spec.ts` | 17/17 tests passed (Chặn bán vượt kho, rollback khi lỗi). |
| **5** | `FR-05`, `FR-13` | Controller tiếp nhận & Hủy đơn hàng | `orders.controller.spec.ts` | 3/3 tests passed (Verify DTO validation, route guards). |
| **6** | `FR-06`, `NFR-06` | Idempotency Key & Chống trùng giao dịch | `payments.service.spec.ts` | 21/21 tests passed (Trả về giao dịch cũ khi trùng key). |
| **7** | `FR-06`, `NFR-02` | Ký HMAC-SHA256 & Callback ZaloPay Sandbox | `zalopay.service.spec.ts` | 4/4 tests passed (Tính MAC đúng chuẩn VNG, verify callback key2). |
| **8** | `FR-06`, `FR-08` | Polling trạng thái ZaloPay & Webhook Controller | `zalopay.controller.spec.ts` | 6/6 tests passed (Tự động đổi đơn sang PAID khi nhận tiền). |
| **9** | `FR-09`, `FR-10` | Định mức công thức BOM Recipe & Tồn kho | `inventory.service.spec.ts` | 8/8 tests passed (Tự động tính định mức, cảnh báo tồn kho). |
| **Σ** | **TỔNG CỘNG** | **Kiểm thử toàn diện hệ thống** | **9 Test Suites** | **72 / 72 Tests Passed (100% Green)** |

---

## 7. MÁY TRẠNG THÁI ĐƠN HÀNG (ORDER STATE MACHINE)

Vòng đời đơn hàng trong hệ thống tuân thủ nghiêm ngặt theo đồ thị chuyển trạng thái hữu hạn (khớp 100% với `backend/src/payments/state-machine.helper.ts`):

```
                   ┌──────────────┐
                   │   PENDING    │ (Đơn mới tạo, giữ chỗ tồn kho)
                   └──────┬───────┘
                          │
         ┌────────────────┼────────────────┐
         │ (Thanh toán    │ (Lỗi thẻ /     │ (Timeout 15p /
         │  thành công)   │  Thất bại)     │  Khách hủy)
         ▼                ▼                ▼
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │     PAID     │ │PAYMENT_FAILED│ │  CANCELLED   │◄────────┐
  └──────┬───────┘ └──────┬───────┘ └──────────────┘         │
         │                │                                  │
         │                ├─────── Thử lại thanh toán ───────┤
         │                │                                  │
         │                └─────── Khách bấm Hủy đơn ────────┤
         │                                                   │
         ├────── Khách hủy trong 5 phút (trước pha chế) ─────┘
         │
  Barista bấm tiếp nhận (KDS)
         │
         ▼
  ┌──────────────┐
  │  PREPARING   │ (Đang pha chế tại quầy bar)
  └──────┬───────┘
         │
  Hoàn tất ly nước
         │
         ▼
  ┌──────────────┐
  │    READY     │ (Sẵn sàng tại quầy Bar Express)
  └──────┬───────┘
         │
  Khách nhận đồ uống
         │
         ▼
  ┌──────────────┐
  │  COMPLETED   │ (Giao dịch hoàn tất)
  └──────────────┘
```

* **Quy tắc chuyển trạng thái hợp lệ (`ALLOWED_TRANSITIONS`):**
  1. `PENDING` $\rightarrow$ `PAID` | `PAYMENT_FAILED` | `CANCELLED`
  2. `PAYMENT_FAILED` $\rightarrow$ `PAID` *(khi retry thành công)* | `PAYMENT_FAILED` *(thử lại thất bại)* | `CANCELLED` *(khi hủy)*
  3. `PAID` $\rightarrow$ `PREPARING` *(hoặc `CANCELLED` nếu khách hủy trong vòng 5 phút Grace Period trước khi Barista bấm tiếp nhận)*
  4. `PREPARING` $\rightarrow$ `READY`
  5. `READY` $\rightarrow$ `COMPLETED`
  6. `COMPLETED` & `CANCELLED`: Trạng thái kết thúc (Terminal State), không được phép chuyển tiếp sang bất kỳ trạng thái nào khác.

---

## 8. KẾT LUẬN & ĐỊNH HƯỚNG BƯỚC TIẾP THEO

Tài liệu đặc tả yêu cầu rút gọn này đã thỏa mãn **100% các tiêu chí nghiệm thu của Task 1.2 trong Đề bài Assignment 2**:
* Đầy đủ danh sách thành viên nhóm và thông tin đơn vị đào tạo trường Đại học Sài Gòn (SGU).
* Mã định danh chuẩn hóa: `FR-01` $\rightarrow$ `FR-13`, `NFR-01` $\rightarrow$ `NFR-06`.
* Phân loại mức độ ưu tiên theo chuẩn MoSCoW khoa học và rõ ràng.
* Hợp nhất toàn diện các tiêu chí chấp nhận (AC) chi tiết cho từng yêu cầu, đo lường được và đã liên kết với 72 bài automated tests trong 9 test suites.
* Đồng bộ 100% với kiến trúc mã nguồn thực tế (BOM Recipe, Dual-layer Optimistic Locking, Role-Based Access Control, Stateless JWT 7 ngày, Cổng ZaloPay Sandbox & Mock).
* Nhúng sẵn ảnh vector sơ đồ Use-Case tổng quát (`use-case.svg`), PNG (`use-case.png`) và mã nguồn PlantUML (`use-case.puml`).

👉 **Bước kế tiếp (Task 1.3):** Tiến hành đặc tả chi tiết use-case trọng tâm **"Đặt và thanh toán đơn hàng"** tại tệp [`docs/requirements/use-case-checkout.md`](use-case-checkout.md).
