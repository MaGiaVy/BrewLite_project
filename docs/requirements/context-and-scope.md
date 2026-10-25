# ĐẶC TẢ BỐI CẢNH, CÁC BÊN LIÊN QUAN VÀ PHẠM VI DỰ ÁN
## BREWLITE: 100% CASHLESS SPECIALTY COFFEE ROASTERY

> **Tài liệu:** `docs/requirements/context-and-scope.md`  
> **Học phần:** Công nghệ Phần mềm (Software Engineering) — Assignment 2 (Requirements to Deployment)  
> **Đơn vị đào tạo:** Khoa Công nghệ Thông tin, Trường Đại học Sài Gòn (SGU)  
> **Giảng viên hướng dẫn:** ThS. Từ Lãng Phiêu  
> **Nhóm thực hiện:** Nhóm BrewLite (6 thành viên):
> 1. **Mã Gia Vỹ**
> 2. **Huỳnh Tuấn Kiệt**
> 3. **Nguyễn Gia Thành**
> 4. **Vũ Châu Minh Khôi**
> 5. **Quách Kỳ Minh**
> 6. **Nguyễn Thị Ý**  
> **Phiên bản:** v1.1 (Đồng bộ chuẩn hóa cùng mã nguồn & SRS v4.2) — Ngày cập nhật: 25/10/2026

---

## 1. BỐI CẢNH VÀ TUYÊN BỐ BÀI TOÁN (CONTEXT & PROBLEM STATEMENT)

### 1.1. Bối cảnh dự án
Ngành dịch vụ bán lẻ cà phê thủ công (Specialty Coffee) tại các đô thị lớn đang đối mặt với sự gia tăng mạnh mẽ về nhu cầu tiêu dùng nhanh, tiện lợi nhưng vẫn đòi hỏi khắt khe về chất lượng hạt rang mộc và tính cá nhân hóa (tùy chọn độ ngọt, lượng đá, sữa hạt, topping). Tuy nhiên, hầu hết các quầy cà phê truyền thống hiện nay vẫn vận hành theo mô hình phục vụ thủ công: khách hàng phải xếp hàng chờ gọi món tại quầy thu ngân, thanh toán tiền mặt với thời gian thối tiền chậm chạp, và nhân viên quầy phải ghi nhận order bằng giấy hoặc truyền miệng dễ xảy ra sai sót.

### 1.2. Tuyên bố bài toán (Problem Statement)
* **Đối với Khách hàng:** Thời gian xếp hàng giờ cao điểm kéo dài (trung bình 5–10 phút), dễ xảy ra nhầm lẫn về tùy chọn cá nhân hóa (size, topping, mức đá/đường), bất tiện khi mang tiền mặt lẻ và thiếu công cụ theo dõi tiến độ pha chế trực quan.
* **Đối với Cửa hàng & Quầy Bar:** Nhân viên thu ngân và Barista bị quá tải vào khung giờ cao điểm, áp lực đối soát tiền mặt cuối ca dễ thất thoát, quản lý tồn kho nguyên liệu không đồng bộ dẫn đến tình trạng nhận đơn nhưng hết nguyên liệu pha chế.
* **Giải pháp BrewLite:** BrewLite là nền tảng ứng dụng web (Next.js Mobile-First/PWA kết hợp NestJS API) cho phép khách hàng chủ động khám phá menu thủ công, tùy chỉnh ly nước cá nhân hóa, thanh toán không dùng tiền mặt (100% Cashless) và theo dõi trạng thái đơn hàng theo thời gian thực (Realtime Progress Tracker).

### 1.3. Tầm nhìn sản phẩm (Product Vision)
> *"BrewLite mang đến trải nghiệm gọi và thưởng thức cà phê thủ công rang mộc đỉnh cao chỉ trong vài chạm: 100% không tiền mặt, không xếp hàng chờ đợi, minh bạch từng hạt cà phê và nhận đồ uống chuẩn xác tại trạm Bar Express trong vòng 3–5 phút."*

---

## 2. BẢNG PHÂN TÍCH CÁC BÊN LIÊN QUAN (STAKEHOLDER MATRIX)

Hệ thống BrewLite được thiết kế để phục vụ và thỏa mãn kỳ vọng của **6 nhóm bên liên quan trọng yếu** theo đúng chuẩn kỹ nghệ phần mềm:

| STT | Nhóm Stakeholder | Vai trò trong hệ sinh thái | Mục tiêu cốt lõi | Mối quan tâm & Kỳ vọng chính |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Khách hàng<br>*(Customer)*** | Người dùng cuối trực tiếp đặt món và thanh toán qua Web/PWA | • Đặt món nhanh dưới 60 giây.<br>• Tùy chỉnh hương vị chính xác.<br>• Thanh toán không tiền mặt an toàn. | • Giao diện mượt mà, phản hồi tức thì.<br>• Không bao giờ bị trừ tiền sai hoặc trừ lặp (Idempotent).<br>• Biết chính xác khi nào đồ uống sẵn sàng để ra quầy lấy. |
| **2** | **Nhân viên quầy / Barista<br>*(Counter Staff)*** | Tiếp nhận thông tin đơn hàng và thực hiện pha chế | • Nhận thông tin chi tiết từng ly cà phê rõ ràng, chính xác.<br>• Giảm áp lực giao tiếp và thu tiền tại quầy. | • Màn hình KDS hiển thị đầy đủ size, mức đá, mức đường, topping.<br>• Cập nhật trạng thái đơn (Pha chế → Sẵn sàng) chỉ với 1 chạm.<br>• Đơn hàng đã được thanh toán đảm bảo trước khi pha chế. |
| **3** | **Quản lý cửa hàng<br>*(Store Manager / PO)*** | Giám sát vận hành kinh doanh và định hướng sản phẩm | • Tối ưu hóa năng suất phục vụ quầy bar.<br>• Kiểm soát chặt chẽ tồn kho nguyên liệu.<br>• Xây dựng tệp khách hàng thân thiết. | • Hệ thống tuyệt đối không bán vượt tồn kho (Zero Overselling).<br>• Minh bạch doanh thu và lịch sử đơn hàng.<br>• Chính sách khuyến mãi (Voucher) và tích điểm Loyalty chính xác. |
| **4** | **Giảng viên / Nghiệm thu<br>*(Instructor / Auditor)*** | Khách hàng đóng vai đánh giá chất lượng sản phẩm & quy trình | • Nghiệm thu phần mềm theo tiêu chuẩn kỹ nghệ phần mềm.<br>• Đánh giá năng lực phát triển và bàn giao của nhóm. | • Tuân thủ quy trình Agile/Scrum qua các Sprint.<br>• Đầy đủ tài liệu, sơ đồ UML, ma trận truy vết.<br>• Có unit/integration test chứng minh nghiệp vụ cốt lõi.<br>• Pipeline CI/CD tự động và URL Production truy cập được. |
| **5** | **Nhóm phát triển<br>*(Development Team)*** | Phân tích, thiết kế, hiện thực hóa, kiểm thử và bàn giao | • Xây dựng hệ thống ổn định, đúng hạn trong 2 Sprint.<br>• Đạt điểm số tối đa theo tiêu chí chấm điểm Assignment 2. | • Phạm vi nghiệp vụ rõ ràng, không bị phình to (Scope creep).<br>• Kiến trúc module hóa sạch sẽ, dễ bảo trì.<br>• Có hạ tầng Docker và CI/CD tự động hỗ trợ kiểm thử liên tục. |
| **6** | **Cổng thanh toán điện tử<br>*(Payment Partner / ZaloPay & Mock)*** | Đơn vị cung cấp hạ tầng thanh toán số mô phỏng và thực nghiệm | • Xử lý các giao dịch tài chính không tiền mặt an toàn.<br>• Đảm bảo tính toàn vẹn và đối soát dòng tiền. | • Tích hợp chuẩn REST API, Webhook bảo mật HMAC-SHA256.<br>• Cơ chế `Idempotency-Key` bảo vệ chống gửi trùng request.<br>• Phản hồi trạng thái tức thời (Success / Failure). |

---

## 3. PHẠM VI DỰ ÁN (PROJECT SCOPE)

Nhằm đảm bảo dự án hoàn thành đúng tiến độ cam kết theo mô hình Scrum, phạm vi phát triển được phân định rạch ròi theo mô hình MoSCoW thành **3 tầng**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHẠM VI HỆ THỐNG BREWLITE                       │
├────────────────────────────────┬───────────────────────────────────────┤
│  [TẦNG 1] TRONG PHẠM VI MVP    │  • Menu thực đơn, tìm kiếm & bộ lọc   │
│  (Must Have — Sprint 1 & 2)    │  • Chi tiết món (Size S/M/L, Topping) │
│                                │  • Giỏ hàng (Cart Zustand + Storage)  │
│                                │  • Xác thực & RBAC (JWT 7 ngày)       │
│                                │  • Tạo đơn & Máy trạng thái (5 bước)  │
│                                │  • Khóa đồng thời kép (Dual-Locking)  │
│                                │  • Thanh toán ZaloPay Sandbox & Mock  │
│                                │  • Voucher & Loyalty (1.000đ = 1 điểm)│
│                                │  • Màn hình Theo dõi đơn & Lịch sử    │
│                                │  • Docker Compose, Test & CI/CD       │
├────────────────────────────────┼───────────────────────────────────────┤
│  [TẦNG 2] PHẠM VI MỞ RỘNG      │  • Màn hình Barista KDS (/staff)      │
│  (Should Have — Đã hiện thực   │  • Admin Dashboard (/admin) Menu/Kho  │
│   hoàn chỉnh 100% trong dự án) │  • Quản lý định mức công thức BOM     │
│                                │  • Quản lý mã khuyến mãi Voucher      │
├────────────────────────────────┼───────────────────────────────────────┤
│  [TẦNG 3] NGOÀI PHẠM VI        │  • Giao hàng tận nơi (Home Delivery)  │
│  (Out-of-Scope hoàn toàn)      │  • Ứng dụng di động Native iOS/Android│
│                                │  • Đăng nhập mạng xã hội (OAuth)      │
│                                │  • Thanh toán tiền mặt COD tại quầy   │
└────────────────────────────────┴───────────────────────────────────────┘
```

### 3.1. Trong phạm vi MVP (Must Have — Sprint 1 & Sprint 2)
1. **Quản lý Thực đơn & Sản phẩm:** Hiển thị danh mục đồ uống thủ công, tìm kiếm theo tên, phân loại nhóm, xem ảnh chất lượng cao và ghi chú hương vị.
2. **Cá nhân hóa món uống:** Lựa chọn Size chuẩn (S/M/L), thêm Topping (Kem muối biển, Trân châu, Thạch cà phê, Đồ ăn kèm bánh), tùy chỉnh mức đá (0% - 100%) và đường (0% - 100%).
3. **Quản lý Giỏ hàng (Client Cart):** Thêm món, điều chỉnh số lượng linh hoạt theo nhu cầu (tối thiểu 1 ly, trần an toàn kỹ thuật là 100 ly/dòng món để phòng ngừa spam đơn), xóa món, tính tạm tính tự động, lưu trữ bền vững qua `localStorage` (không mất khi reload trang).
4. **Xác thực & Phân quyền (Authentication & RBAC):** Đăng ký, đăng nhập tài khoản bằng email/mật khẩu, mã hóa mật khẩu bằng `bcrypt`, cấp phát JWT token thời hạn **7 ngày** (`expiresIn: '7d'`), kiểm soát phân quyền theo vai trò (`CUSTOMER`, `STAFF`, `ADMIN`) với Route Guard bảo vệ tạo đơn, xem lịch sử, truy cập KDS và Dashboard quản trị.
5. **Xử lý Đơn hàng & Kiểm soát đồng thời kép (Dual-layer Optimistic Locking):**
   - Tạo đơn trạng thái ban đầu `PENDING`, quản lý luân chuyển theo máy trạng thái nghiêm ngặt: `PENDING → PAID → PREPARING → READY → COMPLETED` (hoặc `CANCELLED`).
   - **Khóa tầng kho nguyên liệu (Ingredient Level):** Cột `version` trong bảng `Ingredient` được kiểm tra và tăng tự động trong Database Transaction khi trừ công thức BOM, đảm bảo **Zero Overselling** (tuyệt đối không bao giờ để tồn kho bị âm khi nhiều khách đặt cùng lúc).
   - **Khóa tầng đơn hàng (Order Level):** Cột `version` trong bảng `Order` chống tranh chấp cập nhật trạng thái đơn (State Machine transitions) khi hệ thống nhận webhook thanh toán hoặc Barista thao tác đồng thời.
6. **Thanh toán không dùng tiền mặt (100% Cashless Multi-Gateway):**
   - **Cổng ZaloPay Sandbox (Bên thứ ba VNG):** Tích hợp chính thức ở mức Must Have, hỗ trợ thanh toán qua mã QR/cổng ZaloPay Sandbox với xác thực chữ ký số HMAC-SHA256 và IPN Webhook tự động cập nhật đơn hàng.
   - **Cổng thanh toán giả lập nội bộ (Internal Mock Gateway):** Cung cấp sẵn cơ chế mô phỏng với 2 phương thức Ví điện tử và Thẻ ngân hàng nội địa/quốc tế, hỗ trợ tỷ lệ 50% SUCCESS / 50% FAILURE hoặc cờ ép buộc trạng thái phục vụ kiểm thử tự động và demo độc lập.
   - **Cơ chế Idempotency-Key (UUIDv4):** Áp dụng đồng bộ cho cả hai cổng thanh toán, chống trừ tiền hoặc tạo đơn lặp khi mất kết nối mạng hoặc người dùng ấn nút thanh toán nhiều lần.
7. **Khuyến mãi & Tích lũy điểm Loyalty:** Áp dụng mã Voucher hợp lệ (theo % hoặc số tiền cố định), cộng điểm thưởng Loyalty Hạt Vàng với tỷ lệ **1.000đ = 1 điểm** ngay khi đơn chuyển trạng thái `PAID` thành công.
8. **Theo dõi đơn hàng & Thông báo tại quầy:**
   - Màn hình theo dõi tiến trình 5 bước theo thời gian thực: `PENDING → PAID → PREPARING → READY → COMPLETED`.
   - Bảng thông báo trang trọng mời khách đến quầy Bar Express (Trạm 02) nhận nước khi đồ uống chuyển sang `READY`.
   - Trang xem lại lịch sử các đơn hàng của chính tài khoản đăng nhập (`GET /orders/me`).
9. **Kỹ thuật & DevOps:** Container hóa bằng Docker/Docker Compose, kiểm thử tự động (Unit test, Integration test), Pipeline CI/CD tự động hóa trên GitHub Actions và triển khai môi trường Production có HTTPS.

### 3.2. Phạm vi mở rộng (Should Have — Đã hiện thực hoàn chỉnh 100% trong dự án)
Nhằm mang lại giải pháp vận hành toàn diện cho quán cà phê, nhóm phát triển đã hiện thực hóa hoàn chỉnh 100% hai phân hệ nâng cao (xếp loại **Should Have** trong SRS) ngay trong phạm vi sản phẩm bàn giao:
* **Hệ thống KDS cho Barista (`/staff` — Kitchen Display System):** Màn hình chuyên dụng cho Barista theo dõi danh sách đơn hàng đã thanh toán (`PAID`), chuyển trạng thái pha chế `PREPARING` và hoàn tất `READY` chỉ với 1 click theo thời gian thực.
* **Cổng quản trị cửa hàng (`/admin` — Admin Dashboard):** Phân hệ dành cho Quản lý cửa hàng quản lý danh mục Menu (CRUD món, ẩn/hiện, định giá theo size), quản lý định mức công thức nguyên liệu (BOM Recipe), quản lý mã khuyến mãi Voucher và theo dõi thống kê doanh thu/món bán chạy.

### 3.3. Ngoài phạm vi hoàn toàn (Out-of-Scope)
* **Giao hàng tận nơi (Home Delivery / Shipper):** BrewLite định vị là mô hình Kiosk nhận nhanh tại quầy (Express Counter Pickup). Toàn bộ luồng giao hàng tận nhà, tính phí ship và gọi tài xế shipper nằm ngoài phạm vi sản phẩm.
* **Ứng dụng Native Mobile (iOS / Android riêng biệt):** Hệ thống được xây dựng dưới dạng Web Responsive Mobile-First chuẩn PWA chạy trên mọi trình duyệt hiện đại, không xây dựng và phát hành ứng dụng native lên Apple App Store hay Google Play Store.
* **Đăng nhập mạng xã hội bên thứ ba:** Không triển khai OAuth2 với Google, Facebook, Apple. Chỉ sử dụng đăng ký/đăng nhập độc lập bằng Email và Mật khẩu có mã hóa.
* **Thanh toán tiền mặt tại quầy:** Dự án hướng tới mô hình 100% Cashless Kiosk, không hỗ trợ hình thức thanh toán COD hay nộp tiền mặt cho thu ngân.

---

## 4. GIẢ ĐỊNH VÀ RÀNG BUỘC (ASSUMPTIONS & CONSTRAINTS)

### 4.1. Ràng buộc công nghệ (Technical Constraints)
1. **Frontend:** Phải sử dụng **Next.js** (App Router, TypeScript), TailwindCSS, quản lý state giỏ hàng bằng Zustand.
2. **Backend:** Phải sử dụng **NestJS** (TypeScript, Module-based architecture), xác thực bằng Passport JWT, validate đầu vào bằng `class-validator` và `class-transformer`.
3. **Cơ sở dữ liệu:** Phải sử dụng **PostgreSQL** kết hợp Prisma ORM, có migration có thể tái tạo và persistent storage lưu trữ dữ liệu.
4. **Đóng gói & Chạy cục bộ:** Phải cung cấp tệp `docker-compose.yml` có khả năng khởi chạy đồng thời cả 3 dịch vụ (Frontend, Backend, Database) chỉ bằng một câu lệnh `docker compose up`.
5. **Thời gian token:** JWT token hết hạn sau **7 ngày** (`expiresIn: '7d'`) thống nhất trên toàn hệ thống (Backend `auth.module.ts`, Frontend session và tài liệu SRS).

### 4.2. Ràng buộc quy trình và bàn giao (Process Constraints)
* Phát triển theo khung làm việc Scrum qua **2 Sprint** với Definition of Done (DoD) nghiêm ngặt: code không lỗi build, có test chứng minh, có commit rõ ràng và tài liệu đi kèm.
* Bắt buộc có pipeline CI/CD tự động chặn merge nếu lint/test/build thất bại.
* Bắt buộc cung cấp đường dẫn URL môi trường Production hoạt động thực tế qua HTTPS tại thời điểm nghiệm thu.

### 4.3. Giả định nghiệp vụ (Business Assumptions)
* Khách hàng tự thao tác gọi món trên thiết bị di động cá nhân hoặc màn hình Kiosk cảm ứng tại cửa hàng.
* **Hạ tầng thanh toán đa kênh:** Hệ thống tích hợp song song cả Cổng thanh toán thực nghiệm ZaloPay Sandbox (VNG) và Cổng thanh toán giả lập nội bộ (Internal Mock Gateway) có hỗ trợ điều hướng ngẫu nhiên hoặc ép buộc trạng thái thành công/thất bại phục vụ kiểm thử và demo độc lập.
* Giỏ hàng được quản lý an toàn phía Client (Zustand + LocalStorage), giá tiền cuối cùng luôn được Backend thẩm định và tính toán lại dựa trên cơ sở dữ liệu gốc nhằm chống gian lận giá.

---

## 5. MA TRẬN NHẬN DIỆN RỦI RO BAN ĐẦU (INITIAL RISK MATRIX)

| Mã Rủi ro | Tên Rủi ro | Mức độ Tác động | Xác suất Xảy ra | Biện pháp Kỹ thuật & Nghiệp vụ Giảm thiểu |
| :---: | :--- | :---: | :---: | :--- |
| **RSK-01** | **Bán vượt tồn kho & Xung đột trạng thái**<br>*Nhiều khách hàng cùng đặt ly cà phê cuối cùng hoặc nhiều bên cùng cập nhật đơn.* | **Rất cao**<br>*(Critical)* | **Trung bình**<br>*(Medium)* | • Áp dụng Database Transaction với mức cô lập nghiêm ngặt.<br>• Sử dụng kỹ thuật **Khóa đồng thời kép (Dual-layer Optimistic Locking)**: kiểm tra cột `version` của bảng `Ingredient` chống bán âm kho BOM và bảng `Order` chống xung đột trạng thái.<br>• Backend tự động phát hiện xung đột và trả về mã lỗi `409 Conflict`, không bao giờ để tồn kho bị âm. |
| **RSK-02** | **Trừ tiền lặp / Tạo đơn trùng (Double Charge)**<br>*Khách hàng nhấn nút thanh toán nhiều lần do mạng chập chờn hoặc lag.* | **Rất cao**<br>*(Critical)* | **Trung bình**<br>*(Medium)* | • Frontend tự động sinh khóa duy nhất `Idempotency-Key` (UUIDv4) khi bắt đầu giao dịch.<br>• Frontend khóa nút bấm (disable) và hiển thị loading spinner chống double-click.<br>• Backend lưu vết key; nếu nhận lại cùng một key sẽ trả về kết quả giao dịch cũ, không trừ tiền hai lần. |
| **RSK-03** | **Mất dữ liệu giỏ hàng khi người dùng reload trang**<br>*Khách đang chọn tùy chọn chi tiết nhưng vô tình tải lại trình duyệt.* | **Trung bình**<br>*(Medium)* | **Rất cao**<br>*(High)* | • Sử dụng Zustand kết hợp Middleware `persist` đồng bộ trạng thái giỏ hàng tức thời vào `localStorage`.<br>• Dữ liệu giỏ hàng được giữ nguyên vẹn cho đến khi đơn hàng chuyển trạng thái `PAID` thành công. |
| **RSK-04** | **Nghẽn tiến độ Triển khai Production & CI/CD**<br>*Cấu hình pipeline CI/CD và môi trường cloud phức tạp vượt dự kiến.* | **Cao**<br>*(High)* | **Cao**<br>*(High)* | • Chuẩn hóa Dockerfile và `docker-compose.yml` độc lập ngay từ Sprint 1.<br>• Sử dụng các nền tảng PaaS hiện đại có tích hợp sẵn HTTPS và build tự động (như Vercel, Render).<br>• Xây dựng kịch bản kiểm thử tự động với Vitest để chạy nhẹ nhàng trên GitHub Actions. |
| **RSK-05** | **Sai lệch số tiền thanh toán giữa Client và Server**<br>*Khách hàng cố tình can thiệp mã nguồn Frontend để sửa giá rẻ hơn.* | **Cao**<br>*(High)* | **Thấp**<br>*(Low)* | • Frontend chỉ đóng vai trò hiển thị tạm tính.<br>• Backend là **Nguồn sự thật duy nhất (Single Source of Truth)**: tự động truy vấn giá gốc từ DB, tính toán lại giá size, topping, giảm giá voucher và điểm thưởng trước khi lưu đơn. |

---

## 6. TIÊU CHÍ NGHIỆM THU TÀI LIỆU (ACCEPTANCE VERIFICATION)

Tài liệu này thỏa mãn toàn bộ các tiêu chí nghiệm thu của Task 1.1 trong Đề bài Assignment 2:
- [x] Đã mô tả rõ ràng vấn đề nghiệp vụ và tầm nhìn của BrewLite.
- [x] Đầy đủ bảng phân tích 6 bên liên quan (Stakeholders) kèm mục tiêu và kỳ vọng chi tiết.
- [x] Phân chia rạch ròi 3 tầng phạm vi (Trong MVP, Mở rộng tương lai đã hoàn thành, Ngoài phạm vi).
- [x] Định nghĩa đầy đủ các giả định và ràng buộc về công nghệ, quy trình và vận hành.
- [x] Có bảng ma trận nhận diện 5 rủi ro cốt lõi kèm biện pháp giảm thiểu kỹ thuật cụ thể.
