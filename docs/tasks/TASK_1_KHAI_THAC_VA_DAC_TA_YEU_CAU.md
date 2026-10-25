# HỒ SƠ NHIỆM VỤ: TASK 1 — KHAI THÁC VÀ ĐẶC TẢ YÊU CẦU
## ASSIGNMENT 2 — BREWLITE SPECIALTY COFFEE ROASTERY

> **Mã nhiệm vụ:** `TASK-01` (Trọng số: **2.0 / 10 điểm**)  
> **Học phần:** Công nghệ Phần mềm — Giảng viên: ThS. Từ Lãng Phiêu  
> **Nhóm thực hiện (6 thành viên):**  
> 1. Mã Gia Vỹ | 2. Huỳnh Tuấn Kiệt | 3. Nguyễn Gia Thành  
> 4. Vũ Châu Minh Khôi | 5. Quách Kỳ Minh | 6. Nguyễn Thị Ý  
> **Trạng thái:** `HOÀN THÀNH 100% — ĐỒNG BỘ CHUẨN XÁC VỚI CODEBASE & TEST SUITES`

---

## 🎯 1. TỔNG QUAN YÊU CẦU ĐỀ BÀI (ASSIGNMENT 2 SPEC)

Task 1 yêu cầu nhóm khai thác và đặc tả bài toán phần mềm BrewLite theo đúng chuẩn kỹ nghệ phần mềm qua 3 mục con bắt buộc:
1. **Task 1.1 (0.5đ):** Bối cảnh, các bên liên quan (Stakeholders) và phạm vi hệ thống.
2. **Task 1.2 (1.0đ):** Yêu cầu chức năng (FR) và phi chức năng (NFR) kèm mức độ ưu tiên MoSCoW, tiêu chí chấp nhận (AC) cho từng yêu cầu và sơ đồ Use-case tổng quát chuẩn UML.
3. **Task 1.3 (0.5đ):** Đặc tả ca sử dụng trọng tâm (*Đặt và thanh toán đơn hàng*) với luồng sự kiện chi tiết (Basic/Alt/Exception flows).

---

## 📂 2. DANH SÁCH FILE TÀI LIỆU CỐT LÕI ĐÃ TẠO

Toàn bộ nội dung chi tiết đã được biên soạn theo đúng cấu trúc thư mục quy định tại:

| Mục con | Đường dẫn file tài liệu | Nội dung chính | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Task 1.1** | [`docs/requirements/context-and-scope.md`](../requirements/context-and-scope.md) | • Tuyên bố bài toán & tầm nhìn 100% Cashless Kiosk.<br>• Ma trận 6 bên liên quan (Khách, Barista, Quản lý, Giảng viên, Dev, Gateway).<br>• Phân định 3 tầng phạm vi (Trong MVP, Mở rộng đã hoàn thành, Ngoài phạm vi).<br>• Giả định công nghệ & Ma trận 5 rủi ro cốt lõi. | 🟢 Hoàn thành |
| **Task 1.2** | [`docs/requirements/srs.md`](../requirements/srs.md) | • Đặc tả 13 yêu cầu chức năng (`FR-01` $\rightarrow$ `FR-13` có đầy đủ AC).<br>• Đặc tả 6 yêu cầu phi chức năng (`NFR-01` $\rightarrow$ `NFR-06`).<br>• Phân loại ưu tiên MoSCoW chuẩn hóa.<br>• Tiêu chí chấp nhận (Acceptance Criteria) liên kết 9 Test Suites (72 bài tests).<br>• Máy trạng thái đơn hàng (Order State Machine đầy đủ nhánh hủy & retry). | 🟢 Hoàn thành |
| **Task 1.3** | [`docs/requirements/use-case-checkout.md`](../requirements/use-case-checkout.md) | • Tác nhân chính (Customer), Tác nhân hỗ trợ (Gateway, DB).<br>• Tiền điều kiện & Hậu điều kiện (Success / Failure).<br>• Luồng chính 12 bước từ giỏ hàng đến thanh toán thành công.<br>• 2 Luồng thay thế (Voucher, Hủy đơn 5p Grace Period).<br>• 4 Luồng ngoại lệ (Chưa login, Hết hàng 409, Thẻ từ chối, Idempotency). | 🟢 Hoàn thành |
| **Sơ đồ UC** | [`docs/diagrams/use-case.puml`](../diagrams/use-case.puml), [`.svg`](../diagrams/use-case.svg) & [`.png`](../diagrams/use-case.png) | • Sơ đồ Use-case UML chuẩn đen trắng toàn hệ thống (4 Actors, 17 Use-cases). | 🟢 Đã xuất SVG & PNG |

---

## 📝 3. HƯỚNG DẪN KIỂM TRA VÀ CHỈNH SỬA (CHECKLIST CHO BẠN)

Khi bạn mở từng file ra để rà soát, hãy kiểm tra các điểm sau:
- [x] **Thông tin thành viên:** Đầy đủ 6 thành viên và giảng viên hướng dẫn ThS. Từ Lãng Phiêu.
- [x] **Mô tả bối cảnh (`context-and-scope.md`):** Khớp các bên liên quan, phạm vi 3 tầng và ma trận rủi ro.
- [x] **Danh sách FR/NFR (`srs.md`):** Đầy đủ 13 FR, 6 NFR, 100% có Acceptance Criteria chi tiết, khớp 9 Test Suites (72/72 tests passed).
- [x] **Sơ đồ Use-case (`use-case.puml` / `use-case.svg`):** Chuẩn đen trắng UML tối giản, khớp 100% giữa Use-case và các FR.
- [x] **Luồng Use-case (`use-case-checkout.md`):** Đầy đủ các bước luồng chính, luồng thay thế (áp mã, hủy đơn) và luồng ngoại lệ.
