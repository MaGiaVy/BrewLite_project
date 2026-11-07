# Báo Cáo Kiểm Tra Thiết Kế Mobile-First — Task T5.1f (Staff KDS)

> **Mã nhiệm vụ:** `T5.1f` — Giao diện nhân viên (xem đơn, đổi trạng thái) sang mobile (lát cắt trọn gói)  
> **Người thực hiện:** Mã Gia Vỹ (`3124410414@sv.sgu.edu.vn`)  
> **Nhánh thực hiện:** `task/task-5.1f`  
> **Cơ sở mã nguồn:** `apps/web/src/app/staff/page.tsx` & `apps/web/src/components/staff/**`  
> **Phong cách UI:** C cải tiến (Neumorphism ấm áp, thẻ đơn viền trạng thái, bảng công thức mở dạng trượt)

---

## 1. Bảng Tiêu Chí Kiểm Tra Mobile-First (Audit Checklist)

| STT | Tiêu Chí Kiểm Tra (Requirement) | Tiêu Chuẩn Áp Dụng | Kết Quả Thực Tế | Trạng Thái |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Viewport Di Động** | Kiểm tra hiển thị tại chiều rộng 360px & 390px | Bố cục 1 cột cuộn mượt mà, không bị tràn ngang | ✅ **PASS** |
| 2 | **Kích Thước Vùng Bấm (Touch Target)** | Nút bấm tối thiểu $\ge 44\text{px}$ (Android $\ge 48\text{px}$) | Nút chính `min-height: 48px`, nút hủy `48x48px` | ✅ **PASS** |
| 3 | **Khoảng Cách Vùng Bấm (Touch Spacing)** | Khoảng cách giữa các nút liền kề $\ge 8\text{px}$ | `gap: 10px` giữa nút chính và nút hủy | ✅ **PASS** |
| 4 | **Định Dạng Thẻ Thay Thế Bảng Biểu** | Không dùng thẻ `<table>` chật chội trên mobile | Thẻ đơn hàng (OrderCard) bo góc 20px, dải màu cạnh | ✅ **PASS** |
| 5 | **Xem Công Thức Món (Recipe Sheet)** | Thu gọn trên thẻ, bấm mở bảng chi tiết | Bấm "Xem công thức" mở `RecipeSheet` trượt từ dưới lên | ✅ **PASS** |
| 6 | **Phân Biệt Trạng Thái Rõ Ràng** | Không chỉ dùng màu sắc (Color Independence) | Mỗi trạng thái có dải màu + chip chữ (Mới, Đang pha, Sẵn sàng) | ✅ **PASS** |
| 7 | **Cảnh Báo Chờ Lâu** | Đơn chờ $\ge 10$ phút xếp lên đầu, có cảnh báo | Hiển thị chữ đỏ "quá lâu", sắp xếp đơn cũ nhất lên trước | ✅ **PASS** |
| 8 | **Chống Bấm Đúp & Thao Tác Nguy Hiểm** | Tránh gửi request trùng, xác nhận hủy/giao | Khóa nút khi `busy`, hộp thoại `ConfirmDialog` trước khi giao/hủy | ✅ **PASS** |
| 9 | **Hiển Thị Màn Hình Rộng (Responsive)** | Hỗ trợ tablet và desktop | `@media (min-width: 768px)` tự động xếp lưới đa cột | ✅ **PASS** |
| 10 | **Hỗ Trợ Giảm Chuyển Động** | Tuân thủ `prefers-reduced-motion` | Chấm nhấp nháy tự động tắt animation nếu người dùng bật | ✅ **PASS** |

---

## 2. Kết Quả Kiểm Thử Tự Động (Automated Test Evidence)

Bộ kiểm thử của Task T5.1f được tự động hóa qua Vitest trong `apps/web`:

### 🔹 `WEB-T17` — Kiểm thử Logic Điều Phối Hàng Đợi (`staff-orders.test.ts` & `page.test.tsx`):
- ✅ Phân nhóm đơn hàng theo trạng thái `PAID`, `PREPARING`, `READY`, `COMPLETED`
- ✅ Sắp xếp đơn có thời gian chờ lâu nhất lên đầu danh sách
- ✅ Đánh dấu cảnh báo `isLate = true` khi đơn chờ $\ge 10$ phút
- ✅ Chuyển đổi trạng thái tuần tự và khóa thao tác không hợp lệ
- ✅ Phân giải mảng topping từ chuỗi JSON hoặc phân cách dấu phẩy
- ✅ Chặn vai trò không hợp lệ (CUSTOMER) và chuyển hướng về `/login?redirect=%2Fstaff`
- ✅ Hiển thị trạng thái "Không có đơn" khi danh sách trống
- ✅ Hiển thị banner cảnh báo khi nguyên liệu chạm ngưỡng `LOW_STOCK` hoặc `OUT_OF_STOCK`

### 🔹 `WEB-T18` — Kiểm thử Tương Tác Giao Diện (`staff.test.tsx`):
- ✅ Bấm "Xem công thức" trên món hiển thị đầy đủ bảng nguyên liệu & topping
- ✅ Món không có công thức ẩn nút xem công thức
- ✅ Nút bấm chính và nút hủy đơn đạt chuẩn chiều cao $\ge 48\text{px}$
- ✅ Đơn chờ lâu hiển thị nhãn "quá lâu"
- ✅ Hộp thoại xác nhận hoạt động chính xác khi bấm nút xác nhận hoặc hủy
- ✅ Bảng công thức hỗ trợ đóng bằng phím `Escape` và nút Đóng

```text
 ✓ src/lib/staff-orders.test.ts (5 tests)
 ✓ src/lib/use-barista-queue.test.ts (3 tests)
 ✓ src/components/staff/staff.test.tsx (7 tests)
 ✓ src/app/staff/page.test.tsx (4 tests)
 Test Files  4 passed (4)
      Tests  19 passed (19)
```
