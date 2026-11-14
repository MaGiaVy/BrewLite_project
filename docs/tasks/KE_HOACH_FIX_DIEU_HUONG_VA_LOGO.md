# KẾ HOẠCH & DANH SÁCH HẠNG MỤC CẦN FIX & NÂNG CẤP GIAO DIỆN (BREWLITE)
*Cập nhật: 14/11/2026 | Dự án: BrewLite Web & API | Concept: Modern Vintage /ui-styling*

---

## 🎯 1. DANH SÁCH 7 HẠNG MỤC CHI TIẾT TRONG KẾ HOẠCH

### 🔹 Hạng mục 1: Hợp nhất (Merge) nhánh Wave 4 (`fix/wave4-frontend-api-contract`) vào `main` của As2
- **Mục tiêu:**
  - Đồng bộ toàn bộ 7 commit tính năng mở rộng của Wave 4 đang nằm ở nhánh local `fix/wave4-frontend-api-contract` vào nhánh `main` của `BrewLite_project`:
    1. **Chuông âm thanh KDS (`/staff`):** Tự động phát âm thanh chuông báo (`Web Audio API chime`) khi có đơn hàng `PAID` mới.
    2. **Tính năng Báo hết món (86 Out-of-Stock) trên KDS:** Nút gạt / ngăn kéo để Barista 1-click báo hết món qua `PATCH /products/:id/sold-out`.
    3. **Edge Route Guard Middleware (`middleware.ts`):** Đồng bộ cookie `brewlite_session_role` và chặn truy cập trái phép vào `/admin`, `/staff`, `/account`, `/orders` trước khi SSR.
    4. **Bảo mật đổi điểm Voucher:** Backend kiểm soát điểm trừ bắt buộc `requiredPoints` (10/20/50 hạt vàng), chống gian lận điểm từ client.
    5. **Tối ưu hàng đợi KDS Barista & Doanh thu biểu đồ:** Hiển thị toàn bộ đơn đang xử lý không giới hạn, đơn hoàn thành giới hạn 50 đơn gần nhất; cung cấp dữ liệu 7 ngày đầy đủ cho biểu đồ.
    6. **Bộ test tích hợp PostgreSQL:** Mở rộng suite test kiểm thử thực tế với PostgreSQL/Supabase.
- **Thực hiện:**
  - `git merge --no-ff fix/wave4-frontend-api-contract -m "merge(wave4): integrate frontend api-contract, kds chime, 86 toggle, and route guard"` trên `main` của `BrewLite_project`.

---

### 🔹 Hạng mục 2: Nâng cấp Giao diện Admin sang phong cách Hiện Đại Pha Cổ Điển (Modern Vintage)
- **Thiết kế chuẩn hóa (Theo Showcase đã duyệt):**
  - **Bảng màu (Palette 1):** Nền kem sữa bọt cà phê ấm (`#FAF6F0`), thẻ Bento trắng tinh khôi (`#FFFFFF`) với viền mềm (`#EBE3D5`), chữ chính Đen Espresso sâu thẳm (`#1C1917`), điểm xuyết vàng đồng thau cổ điển (`#D4AF37`).
  - **Logo chính thức:** Thay khối huy hiệu tạm `BL` màu đỏ sậm bằng component chuẩn thương hiệu `<BrewLiteLogo height={32} />` (cốc cà phê bốc khói màu kem sữa trên nền gỗ sồi sang trọng).
  - **Iconography thực tế:** Sử dụng 100% SVG Vector màu đen tối giản (Minimalist Black Line Icons), nét vẽ 2px sắc sảo, dứt khoát. Tuyệt đối không dùng emoji màu AI (bỏ hẳn 📊, ☕, 📦, 👥, 🔔).

---

### 🔹 Hạng mục 3: Đồng bộ Logo nhóm chính thức & Chuẩn hóa Icon Vector Thực Tế trên Trang Staff KDS (`/staff`)
- **Hiện trạng:**
  - Trang `/staff` hiện đang hiển thị dòng text thô kèm emoji `☕ BrewLite · Quầy bar KDS`.
  - Thanh tab điều hướng chuyển đổi trạng thái đơn sử dụng emoji AI màu hoạt hình: `📋 Đơn đang pha (3)` và `✅ Lịch sử đã xong (50)`.
  - Nút xem công thức pha chế dùng emoji `📖`, banner cảnh báo dùng emoji `⚠️`.
- **Giải pháp xử lý (Đã nghiệm thu qua Showcase Staff):**
  - **Logo chính thức:** Nhúng component chuẩn thương hiệu `<BrewLiteLogo height={28} />` vào Header trang `/staff`.
  - **Nhãn phụ & Lối tắt:** Bổ sung nhãn phụ `Quầy bar KDS` tinh tế và nút bấm nhanh "Thực đơn" để nhân viên/quản trị dễ dàng quay về `/menu`.
  - **Loại bỏ triệt để icon emoji AI hoạt hình:**
    - Thay tab `📋 Đơn đang pha (3)` bằng **Icon SVG Vector Clipboard (bảng kẹp đơn hàng) nét đen mỏng thanh lịch** kèm huy hiệu số lượng.
    - Thay tab `✅ Lịch sử đã xong (50)` bằng **Icon SVG Vector Check-Circle (vòng tròn tích hoàn tất) nét đen tối giản** kèm huy hiệu số lượng.
    - Thay icon `📖` trên nút bấm công thức bằng **Icon SVG Vector Book-Open**.
    - Thay icon `⚠️` cảnh báo bằng **Icon SVG Vector Alert-Triangle**.
  - **Phong cách thị giác:** Chuyên nghiệp, thực tế như màn hình KDS nhà hàng cao cấp, đồng bộ 100% tinh thần Modern Vintage với Admin.

---

### 🔹 Hạng mục 4: Tích hợp Biểu đồ Doanh Thu Sparkline Đường Cong Mượt (Smooth Bezier Spline)
- **Điểm nhấn đặc biệt của thẻ Doanh thu 7 ngày:**
  - **Đường cong Bezier:** Uốn lượn tự nhiên qua 7 ngày trong tuần, mang lại cảm giác tài chính cao cấp (như Stripe / Apple Health).
  - **Vùng phủ Gradient mạ vàng hổ phách:** Dải màu tan nhẹ từ `#C68B59` / `#D4AF37` xuống đáy thẻ, tăng chiều sâu thị giác.
  - **Điểm nhịp thở (Pulse Dot):** Điểm chốt mốc ngày hôm nay có hiệu ứng phát sáng nhấp nháy êm dịu, báo hiệu hệ thống ghi nhận doanh thu theo thời gian thực (Real-time).
  - **Trục ngày tối giản:** Dòng nhãn `T2 - T3 - T4 - T5 - T6 - T7 - CN (Nay)` nhỏ nhắn, dễ quan sát.

---

### 🔹 Hạng mục 5: Thanh Điều Hướng Dưới (AdminBottomBar) với Icon Vector Đen Tối Giản
- **Hiện trạng & Giải pháp:**
  - Thay toàn bộ icon emoji bằng **bộ icon SVG vector màu đen nguyên bản (Black Monochrome Line)**:
    - `Tổng quan`: Biểu tượng biểu đồ đường vector (`ChartIcon`).
    - `Thực đơn`: Biểu tượng tách cà phê gốm sứ vector (`CupIcon`).
    - `Kho BOM`: Biểu tượng thùng hàng 3D không gian vector (`BoxIcon`).
    - `Quản trị`: Biểu tượng hai người dùng vector (`UsersIcon`).
  - Trạng thái Active có nét đậm rõ ràng (`#1C1917`), Inactive là màu đá xám mờ (`#A8A29E`). Tuyệt đối không dùng emoji màu hay phong cách AI 3D bóng bẩy.

---

### 🔹 Hạng mục 6: Tự động Điều hướng Đăng nhập theo Quyền & Lối tắt Chuyển Trang
- **Tại trang Đăng nhập (`/login`):**
  - Kiểm tra `data.user?.role` sau khi đăng nhập:
    - `ADMIN` ➡️ chuyển thẳng vào `/admin`.
    - `STAFF` ➡️ chuyển thẳng vào `/staff`.
    - `CUSTOMER` ➡️ chuyển về `/menu`.
- **Tại trang Tài khoản (`/account`):**
  - Nếu là `ADMIN`: Hiển thị thẻ lối tắt nổi bật "Trang Quản Trị (Admin Portal)" dẫn sang `/admin`.
  - Nếu là `STAFF`: Hiển thị thẻ lối tắt "Màn hình Pha chế (KDS Barista)" dẫn sang `/staff`.
- **Tại Header `/admin` & `/staff`:**
  - Bổ sung nút bấm nhỏ "Thực đơn" để tiện chuyển qua lại trải nghiệm giao diện menu khách hàng.

---

### 🔹 Hạng mục 7: Kiểm tra Chất lượng (Quality Gate) & Push Thẳng Lên Main
- **Biên dịch & Kiểm thử:**
  - Chạy `npm run build -w apps/web` và `npm run build -w apps/api` đảm bảo 100% không lỗi cú pháp hay TypeScript.
- **Git Push & Auto-Deploy:**
  - Commit toàn bộ thay đổi với thông điệp: `feat(admin,staff): modern vintage theme, official logo, sparkline, monochrome icons, and role redirect`.
  - Chạy `git push personal main` đẩy thẳng lên GitHub repository `MaGiaVy/BrewLite_project`.
  - Vercel và Render tự động kích hoạt pipeline deploy phiên bản mới nhất lên live (`https://brew-lite-project.vercel.app/admin` & `/staff`).

---

## 📄 File Kế Hoạch Chi Tiết Chuẩn Superpowers:
- Đường dẫn: [**`docs/superpowers/plans/2026-11-14-admin-modern-vintage-theme-and-fixes.md`**](file:///D:/SWE/BrewLite_project/docs/superpowers/plans/2026-11-14-admin-modern-vintage-theme-and-fixes.md)
