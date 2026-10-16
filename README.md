# ☕ BrewLite — 100% Cashless Specialty Coffee Roastery

> **Bài tập lớn môn học:** Công nghệ Phần mềm (Software Engineering)  
> **Đơn vị:** Khoa Công nghệ Thông tin — Trường Đại học Sài Gòn (SGU)  
> **Quy trình:** Agile Scrum (3 Sprints — 10 Tasks — 10/10 Điểm DoD)  
> **Công nghệ chủ đạo:** Next.js (Frontend) + NestJS (Backend) + PostgreSQL 16 (Database) + Docker Compose

---

## 📌 1. TỔNG QUAN DỰ ÁN

**BrewLite** là nền tảng gọi món và thanh toán cà phê thủ công cao cấp **100% không dùng tiền mặt (Cashless Express Kiosk)**. Hệ thống giải quyết triệt để bài toán xếp hàng chờ đợi giờ cao điểm, loại bỏ sai sót ghi nhận order thủ công, kiểm soát tồn kho thời gian thực và tự động hóa quy trình pha chế qua máy trạng thái 5 bước.

### 🌟 Tính năng nổi bật đã hoàn thiện:
* **Thực đơn số hóa:** Tìm kiếm, lọc theo danh mục, hình ảnh sắc nét, ghi chú hương vị tuyển chọn (Taste Notes).
* **Tùy biến món linh hoạt:** 3 kích thước chuẩn (Size S/M/L), 6 loại Topping thủ công, tùy chỉnh mức đá (0% - 100%) và lượng đường (0% - 100%).
* **Giỏ hàng thông minh:** Quản lý bằng Zustand + `localStorage` (không mất khi reload trang), chặn giới hạn an toàn 1–20 ly.
* **Bảo mật chuẩn JWT:** Mã hóa mật khẩu `bcrypt`, cấp phát JWT token có hạn dùng 24 giờ, Route Guard bảo vệ tài nguyên người dùng.
* **Thanh toán mô phỏng (Mock Payment):** Tích hợp Ví điện tử & Thẻ ngân hàng, phản hồi tức thì, áp dụng mã giảm giá Voucher và cộng điểm thưởng Loyalty (`10.000đ = 1 điểm`).
* **Theo dõi đơn hàng thời gian thực:** Trình theo dõi tiến trình 5 bước (`PENDING → PAID → PREPARING → READY → COMPLETED`), thông báo trang trọng mời khách đến **Quầy Bar Express (Trạm 02)** nhận nước.
* **4 Nghiệp vụ Backend nâng cao:** Chặn chuyển trạng thái sai, chống đặt/trừ tiền trùng lặp bằng `Idempotency-Key`, kiểm soát tồn kho đồng thời bằng `Transaction + Optimistic Locking` (cột `version`), và tự động hoàn kho khi hủy đơn.

---

## 🛠️ 2. KIẾN TRÚC & CÔNG NGHỆ (TECH STACK)

| Phân hệ | Công nghệ sử dụng | Cổng (Port) | Vai trò chính |
|---|---|:---:|---|
| **Frontend** | **Next.js 16** (React 19, TypeScript, TailwindCSS v4, Zustand) | `3000` | Giao diện Web Mobile-First, Server/Client Rendering |
| **Backend** | **NestJS 12** (TypeScript, Passport JWT, Class-Validator) | `3001` | REST API, xử lý nghiệp vụ, kiểm soát giao dịch |
| **Database** | **PostgreSQL 16** + **Prisma ORM** | `5432` | CSDL quan hệ, lưu trữ bền vững với Persistent Volume |
| **Testing** | **Vitest** | — | Unit & Integration Test tự động cho Backend |
| **DevOps** | **Docker & Docker Compose** | — | Đóng gói Multi-stage build, triển khai đồng bộ 1 lệnh |

---

## 📁 3. CẤU TRÚC THƯ MỤC MONOREPO

```text
brewlite/
├── backend/                    # NestJS Backend API (Port 3001)
│   ├── prisma/                 # Schema CSDL & Seed script mẫu
│   │   ├── schema.prisma       # Mô hình 8 Entities dữ liệu
│   │   └── seed.ts             # Nạp 10 món, 6 topping, 3 voucher
│   ├── src/                    # Mã nguồn các Modules NestJS
│   │   ├── auth/               # Đăng ký, Đăng nhập, JWT Guard
│   │   ├── orders/             # Xử lý đơn, State machine, Tồn kho
│   │   ├── payments/           # Mock Payment Gateway, Idempotency
│   │   ├── products/           # Menu đồ uống, chi tiết món
│   │   ├── vouchers/           # Thẩm định & tính giảm giá
│   │   └── app.controller.ts   # Endpoint kiểm tra sức khỏe (/health)
│   └── Dockerfile              # Multi-stage Dockerfile cho Backend
├── frontend/                   # Next.js Web App (Port 3000)
│   ├── app/                    # App Router (Next.js 16)
│   │   ├── page.tsx            # (1) Màn hình Menu Thực đơn
│   │   ├── products/[id]/      # (2) Chi tiết món & Tùy biến
│   │   ├── cart/               # (3) Giỏ hàng
│   │   ├── checkout/           # (4) Thanh toán & Nhập Voucher
│   │   ├── orders/[id]/        # (5) Theo dõi đơn & Mời nhận nước
│   │   └── orders/             # Lịch sử đơn hàng cá nhân
│   ├── store/cartStore.ts      # Zustand Store quản lý giỏ hàng
│   ├── api/                    # Axios API client gọi Backend
│   └── Dockerfile              # Multi-stage Dockerfile cho Frontend
├── docs/                       # Tài liệu đồ án & Đặc tả kỹ thuật
│   └── requirements/           # Task 1.1 Context & Scope
├── docker-compose.yml          # Điều phối 3 containers (DB, BE, FE)
├── .env.example                # File mẫu biến môi trường
└── README.md                   # Hướng dẫn cài đặt & Báo cáo đồ án
```

---

## 🚀 4. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY HỆ THỐNG

Bạn có thể chạy hệ thống theo **1 trong 2 phương pháp** dưới đây:

### 🌟 CÁCH 1: Khởi chạy bằng Docker Compose (Khuyên dùng cho Demo & Chấm điểm)

Yêu cầu máy tính đã cài đặt và bật [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
# 1. Di chuyển vào thư mục gốc dự án
cd BrewLite

# 2. Xây dựng và khởi chạy đồng thời cả 3 dịch vụ
docker compose up --build
```

* Sau khi lệnh hoàn tất, hệ thống tự động khởi chạy:
  * **Frontend:** Truy cập `http://localhost:3000`
  * **Backend API:** Truy cập `http://localhost:3001`
  * **Health Check API:** Truy cập `http://localhost:3001/health`
* **Dừng hệ thống:** Nhấn `Ctrl + C` hoặc mở terminal gõ `docker compose down`.

---

### 💻 CÁCH 2: Khởi chạy thủ công trên môi trường máy thật (Native Localhost)

#### Bước 1: Khởi tạo Cơ sở dữ liệu PostgreSQL
Đảm bảo máy bạn đang chạy PostgreSQL trên cổng `5432` với database tên `brewlite`.

#### Bước 2: Thiết lập Backend (NestJS)
```bash
cd backend

# Cài đặt thư viện
npm install

# Đồng bộ cấu trúc bảng vào Database
npx prisma db push

# Nạp dữ liệu mẫu khởi tạo (10 món, 6 topping, 3 voucher, user demo)
npx prisma db seed

# Khởi chạy Backend ở chế độ phát triển
npm run start:dev
```
👉 Backend sẵn sàng tại: **`http://localhost:3001`** (Kiểm tra tại: `http://localhost:3001/health`).

#### Bước 3: Thiết lập Frontend (Next.js)
Mở một cửa sổ Terminal mới:
```bash
cd frontend

# Cài đặt thư viện
npm install

# Khởi chạy Frontend
npm run dev
```
👉 Mở trình duyệt truy cập: **`http://localhost:3000`** để sử dụng ứng dụng!

---

## 🔑 5. TÀI KHOẢN & DỮ LIỆU THỬ NGHIỆM (DEMO SEED DATA)

Dữ liệu đã được nạp sẵn vào CSDL qua script `backend/prisma/seed.ts`:

* **Tài khoản khách hàng demo:**
  * **Email:** `khach@brewlite.vn`
  * **Mật khẩu:** `123456`
* **Danh sách 3 Mã giảm giá (Voucher):**
  * `BREWCOZY`: Giảm **15%** tổng đơn hàng (Tối đa 25.000đ).
  * `BREWLITE10`: Giảm **10%** tổng đơn hàng (Đơn tối thiểu 40.000đ).
  * `WELCOME20`: Giảm trực tiếp **20.000đ** cho khách hàng mới (Đơn tối thiểu 50.000đ).
* **Danh mục đồ uống:** 10 sản phẩm bán chạy (Cà phê Muối, Bạc Xỉu, Cà phê Sữa Đá, Cold Brew, Trà Sen Vàng,...).

---

## 🧪 6. KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST VERIFICATION)

Hệ thống được tích hợp bộ Unit & Integration Test tự động với **Vitest**, chứng minh đầy đủ 100% các tiêu chí chấm điểm khắt khe của **Task 10 (Nghiệp vụ Backend)**.

### Lệnh chạy kiểm thử:
```bash
npm --prefix backend run test
```

### Kết quả kiểm thử thực tế (17/17 Tests Passed):
```text
 ✓ src/orders/state-machine.spec.ts (13 tests) 28ms
 ✓ src/orders/idempotency.spec.ts (1 test) 575ms
 ✓ src/orders/optimistic-locking.spec.ts (1 test) 633ms
 ✓ src/app.controller.spec.ts (2 tests) 18ms

 Test Files  4 passed (4)
      Tests  17 passed (17)
   Duration  1.25s
```

| Tiêu chí chấm điểm của Giảng viên | File kiểm thử tương ứng | Trạng thái | Chứng minh kỹ thuật |
|---|---|:---:|---|
| **(a) Chặn chuyển trạng thái sai** | `src/orders/state-machine.spec.ts` | **PASS (13/13)** | Hàm `assertTransition` chặn đứng mọi luồng sai như `PENDING → COMPLETED`, `CANCELLED → PAID`,... |
| **(b) Idempotency-Key chống trùng lặp** | `src/orders/idempotency.spec.ts` | **PASS (1/1)** | Gửi cùng một `Idempotency-Key` 2 lần chỉ tạo duy nhất 1 đơn, không bị trừ tiền/tồn kho lần 2. |
| **(c) Đặt đồng thời không vượt tồn kho** | `src/orders/optimistic-locking.spec.ts` | **PASS (1/1)** | Khi chỉ còn 1 ly, 2 request đồng thời gửi đến: 1 đơn thành công, 1 đơn bị chặn (409 Conflict), kho về 0 (không âm). |

---

## 📋 7. BẢNG TIẾN ĐỘ 10 TASK PRODUCT BACKLOG (AGILE SCRUM)

Dự án hoàn thành đầy đủ **10/10 Tasks (10/10 Điểm)** theo đúng Definition of Done (DoD) của môn học:

| Task | Tên Story / Hạng mục | Sprint | Phân công chính | Trạng thái |
| :---: | :--- | :---: | :--- | :---: |
| **Task 1** | Khởi tạo cấu trúc dự án monorepo, Git, `.env.example`, README | Sprint 1 | Cả nhóm | ✅ **100%** |
| **Task 2** | API danh sách sản phẩm `GET /products` từ CSDL PostgreSQL | Sprint 1 | Huỳnh Tuấn Kiệt | ✅ **100%** |
| **Task 3** | Trang Menu (Frontend) gọi API, render lưới món, loading & empty | Sprint 1 | Quách Kỳ Minh | ✅ **100%** |
| **Task 4** | Màn hình Chi tiết món, chọn size (S/M/L), topping, tính giá động | Sprint 1 | Nguyễn Thị Ý | ✅ **100%** |
| **Task 5** | Giỏ hàng (Cart) thêm/sửa/xóa, lưu Zustand + Storage, tự tính tổng tiền | Sprint 2 | Vũ Châu Minh Khôi | ✅ **100%** |
| **Task 6** | API tạo đơn hàng `POST /orders`, validate `class-validator`, trạng thái `PENDING` | Sprint 2 | Nguyễn Gia Thành | ✅ **100%** |
| **Task 7** | Đăng ký, Đăng nhập (JWT), băm mật khẩu `bcrypt`, Route Guard | Sprint 2 | Mã Gia Vỹ | ✅ **100%** |
| **Task 8** | Thanh toán không tiền mặt Ví/Thẻ, gọi `POST /payments`, chuyển `PAID` | Sprint 3 | Huỳnh Tuấn Kiệt & Nguyễn Gia Thành | ✅ **100%** |
| **Task 9** | Màn hình xác nhận "Mời lấy nước", lịch sử `GET /orders/me`, Dockerfile | Sprint 3 | Mã Gia Vỹ & Cả nhóm | ✅ **100%** |
| **Task 10** | Nghiệp vụ nâng cao: State Machine, Idempotent, Optimistic Lock, Loyalty | Sprint 3 | Mã Gia Vỹ & Nguyễn Gia Thành | ✅ **100%** |

---

## 👥 8. THÀNH VIÊN NHÓM & PHÂN CÔNG VAI TRÒ SCRUM

* **Đơn vị:** Nhóm sinh viên thực hiện đề tài BrewLite — Môn Công nghệ Phần mềm
* **Product Owner (PO):** Quản lý yêu cầu, nghiệm thu từng Sprint.
* **Scrum Master (SM):** Điều phối tiến độ, loại bỏ rào cản kỹ thuật.
* **Development Team:** Lập trình Frontend, Backend, Database và DevOps.

| STT | Họ và tên | Vai trò Scrum | Phân công phụ trách chính |
| :---: | :--- | :---: | :--- |
| 1 | **Mã Gia Vỹ** | Scrum Master / Lead Dev | Task 1, Task 7 (Auth JWT), Task 9, Task 10 (Backend Core Logic & Tests) |
| 2 | **Nguyễn Gia Thành** | Backend Developer | Task 1, Task 6 (Order API), Task 8 (Payment Gateway), Task 10 |
| 3 | **Huỳnh Tuấn Kiệt** | Backend Developer | Task 1, Task 2 (Product API & Database Seeding), Task 8 |
| 4 | **Quách Kỳ Minh** | Frontend Developer | Task 1, Task 3 (Menu Catalog UI, Search & Filters) |
| 5 | **Nguyễn Thị Ý** | Frontend Developer | Task 1, Task 4 (Product Detail, Size/Topping Customizer) |
| 6 | **Vũ Châu Minh Khôi** | Frontend Developer | Task 1, Task 5 (Cart Store Zustand, Badge Counter) |

---

## 🔄 9. TỔNG KẾT SPRINT RETROSPECTIVE (BÀN GIAO MỤC 11)

Theo yêu cầu tại **Mục 11.3 (Bàn giao sản phẩm)** của đề bài, nhóm ghi nhận kết quả Retrospective qua 3 Sprint:

* **Điều đã làm tốt (What went well):**
  - Hoàn thành đầy đủ 100% luồng nghiệp vụ end-to-end từ chọn món đến nhận đồ uống tại quầy.
  - Áp dụng các kỹ thuật Backend hiện đại chuẩn doanh nghiệp: Transaction Serializable, Optimistic Locking chống overselling, và Idempotency-Key chống double charge.
  - Giao diện người dùng sang trọng, chuẩn Responsive Mobile-First theo tài liệu `DESIGN.md`.
  - Bộ kiểm thử tự động 17/17 test cases giúp đảm bảo chất lượng code và phòng chống regression.
* **Điều cần cải thiện (What could be improved):**
  - Cần sớm chuyển đổi sang môi trường Production Cloud thực tế (Vercel / Render / Railway).
  - Có thể mở rộng thêm màn hình hiển thị Barista KDS chuyên dụng cho quầy pha chế trong phiên bản tiếp theo.

---

*Tài liệu được cập nhật chính thức phục vụ nghiệm thu môn học Công nghệ Phần mềm — Tháng 10/2026.*