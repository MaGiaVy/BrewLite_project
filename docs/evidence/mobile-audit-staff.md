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

## 3. Hình Ảnh Minh Chứng Giao Diện Mobile (Visual Evidence)

Các ảnh chụp màn hình thực tế tại độ phân giải chuẩn di động (390px) và máy tính bảng (Tablet 2 cột):

| Trạng thái / Màn hình | Hình ảnh minh chứng | Mô tả chi tiết |
| :--- | :---: | :--- |
| **1. Hàng đợi Đơn mới (Mới / PAID)** | `![Hàng đợi đơn mới](mobile-staff-queue.png)` | Thẻ đơn hàng bo góc 20px, dải màu cam đậm, mã `#BL-1042` to rõ, tag chips `[SIZE M]`, `[🧊 50% Đá]`, `[🍬 50% Ngọt]`, `[🧋 +Trân châu đen]`. |
| **2. Tiến độ Checklist từng ly (Đang pha)** | `![Checklist từng ly](mobile-staff-checklist.png)` | Từng ly có nút "Xong ly này", dấu tích xanh `✓`, gạch mờ ly đã làm, nút chính tự đếm `(Đã làm X/Y ly)`. |
| **3. Bảng công thức định lượng (BOM Sheet)** | `![Công thức định lượng BOM](mobile-staff-recipe.png)` | Bảng trượt từ đáy màn hình, hiển thị chi tiết định lượng 1 ly và tổng số ly cho nguyên liệu & topping. |
| **4. Bố cục máy tính bảng (Tablet Responsive)** | `![Bố cục Tablet](mobile-staff-tablet.png)` | Tự động mở rộng thành lưới 2 cột khi xem trên màn hình tablet quầy bar $\ge 768\text{px}$. |

---

## 4. Kết Quả Kiểm Thử Tự Động (Automated Test Evidence)

Toàn bộ **29/29 tests PASS 100%** qua Vitest trong `apps/web`:

```text
 ✓ src/lib/staff-orders.test.ts (6 tests)
 ✓ src/lib/api-client.test.ts (2 tests)
 ✓ src/lib/format.test.ts (1 test)
 ✓ src/lib/use-barista-queue.test.ts (3 tests)
 ✓ src/app/staff/page.test.tsx (4 tests)
 ✓ src/app/menu/menu.test.tsx (4 tests)
 ✓ src/components/staff/staff.test.tsx (9 tests)

 Test Files  7 passed (7)
      Tests  29 passed (29)
   Duration  8.23s
```
