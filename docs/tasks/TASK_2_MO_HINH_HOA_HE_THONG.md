# HỒ SƠ NHIỆM VỤ: TASK 2 — MÔ HÌNH HÓA HỆ THỐNG (SYSTEM MODELING)
## ASSIGNMENT 2 — BREWLITE SPECIALTY COFFEE ROASTERY

> **Mã nhiệm vụ:** `TASK-02` (Trọng số: **2.0 / 10 điểm**)  
> **Học phần:** Công nghệ Phần mềm — Giảng viên: **ThS. Từ Lãng Phiêu**  
> **Sinh viên thực hiện:** Mã Gia Vỹ (MSSV: 3124410414) | Nhóm 6 thành viên  
> **Nhánh phát triển:** `task/task-2-diagrams`  
> **Trạng thái:** `ĐÃ HOÀN TẤT TASK 2.1 (ACTIVITY DIAGRAMS) & USE CASE, SEQUENCE AUTH`

---

## 🎯 1. TIÊU CHÍ NGHIỆM THU THEO ĐỀ BÀI (ASSIGNMENT 2 SPEC)

Theo đề bài của ThS. Từ Lãng Phiêu, Task 2 yêu cầu mô hình hóa hệ thống theo 3 mục con cốt lõi:
1. **Task 2.1 (Activity Diagram):** Luồng nghiệp vụ End-to-End từ Chọn món $\rightarrow$ Giỏ hàng $\rightarrow$ Đặt đơn $\rightarrow$ Thanh toán ZaloPay $\rightarrow$ KDS quầy bar với các swimlanes rõ ràng.
2. **Task 2.2 (Sequence Diagram):** Sơ đồ tương tác tuần tự cho các ca sử dụng trọng tâm (Xác thực phân quyền và Đặt hàng thanh toán không tiền mặt) với đầy đủ request/response, validate, transaction, nhánh `alt` thành công/thất bại và xử lý token JWT 7 ngày.
3. **Task 2.3 (Class Diagram):** Sơ đồ lớp miền dữ liệu (Domain Class Diagram) thể hiện các thực thể, thuộc tính, kiểu dữ liệu, quan hệ và số lượng bội (multiplicity).

---

## 📂 2. TIẾN ĐỘ VÀ DANH MỤC TẠO PHẨM ĐÃ THỰC HIỆN

| STT | Loại sơ đồ | Tệp mã nguồn PlantUML | Tệp ảnh kết xuất (SVG / PNG) | Trạng thái kỹ thuật |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Sơ đồ Use-Case tổng quát** | [`docs/diagrams/use-case.puml`](../diagrams/use-case.puml) | [`use-case.svg`](../diagrams/use-case.svg)<br>[`use-case.png`](../diagrams/use-case.png) | 🟢 **Hoàn tất 100%**<br>• Đen trắng tối giản chuẩn UML 2.5.<br>• 4 Actor: Khách hàng, Barista, Admin, ZaloPay.<br>• Phân quyền RBAC qua Use Case Đăng nhập. |
| **2** | **Sơ đồ Use-Case phân hệ Thanh toán** | [`docs/diagrams/checkout-use-case.puml`](../diagrams/checkout-use-case.puml) | [`checkout-use-case.svg`](../diagrams/checkout-use-case.svg)<br>[`checkout-use-case.png`](../diagrams/checkout-use-case.png) | 🟢 **Hoàn tất 100%**<br>• Khách hàng & Cổng thanh toán ZaloPay/Mock.<br>• Quan hệ include/extend rõ ràng. |
| **3** | **Sơ đồ Tuần tự Xác thực (Auth & RBAC)** | [`docs/diagrams/sequence-auth.puml`](../diagrams/sequence-auth.puml) | [`sequence-auth.svg`](../diagrams/sequence-auth.svg)<br>[`sequence-auth.png`](../diagrams/sequence-auth.png)<br>[`sequence-auth.md`](../diagrams/sequence-auth.md) | 🟢 **Hoàn tất 100%**<br>• Đúng 41 bước theo form gốc thầy thích.<br>• 5 cột Lifeline tiếng Việt rõ ràng, JWT 7 ngày.<br>• Rẽ nhánh kiểm tra OWASP & điều hướng 3 vai trò. |
| **4** | **Task 2.1: Bộ 3 Sơ đồ Hoạt động (Activity Diagrams)** | • [`activity-menu-cart.puml`](../diagrams/activity-menu-cart.puml)<br>• [`activity-checkout.puml`](../diagrams/activity-checkout.puml)<br>• [`activity-kds.puml`](../diagrams/activity-kds.puml) | • `activity-menu-cart.svg/.png`<br>• `activity-checkout.svg/.png`<br>• `activity-kds.svg/.png`<br>• [`activity-diagrams.md`](../diagrams/activity-diagrams.md) | 🟢 **Hoàn tất 100% (Task 2.1)**<br>• Đen trắng tối giản, swimlane phân làn.<br>• Decision hình thoi, chữ trong thoi, nhánh tách xa.<br>• **Xử lý trọn vẹn cả 3 ngoại lệ: Chưa login, Hết hàng BOM 409, Thanh toán thất bại & Timeout 15p**. |
| **5** | **Sơ đồ Tuần tự Đặt & Thanh toán (Checkout)** | `docs/diagrams/sequence-checkout.puml` | `docs/diagrams/sequence-checkout.svg` | ⏳ *Sẵn sàng thực hiện* |
| **6** | **Sơ đồ Lớp miền (Domain Class Diagram)** | `docs/diagrams/class.puml` | `docs/diagrams/class.svg` | ⏳ *Sẵn sàng thực hiện* |

---

## 📌 3. NGUYÊN TẮC THIẾT KẾ ĐƯỢC ÁP DỤNG
* **Tính nhất quán (Traceability):** Mọi thông điệp và hành động trong sơ đồ hoạt động đều ánh xạ chính xác 1:1 với DTO, Service và Endpoint trong mã nguồn NestJS backend và Next.js App Router frontend.
* **Phong cách thẩm mỹ học thuật:** Sử dụng nét vẽ đen trắng tối giản, đường nét sắc sảo, không màu mè, đạt chuẩn hiển thị cao nhất khi in ấn và nhúng vào tài liệu báo cáo kỹ thuật.
