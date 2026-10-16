# TỔNG HỢP TOÀN DIỆN VỀ QUY TRÌNH CHẤM SCRUM CHO ĐỒ ÁN BREWLITE
**Môn học:** Công nghệ Phần mềm — Khoa CNTT, Trường Đại học Sài Gòn  
**Dự án:** BrewLite (Hệ thống đặt & thanh toán cà phê không dùng tiền mặt)  
**Tài liệu tham khảo chính:** `BrewLite-CongNghePhanMem.md`, `BrewLite_SRS_Final.md`

---

## 1. Bản chất: "Chấm theo Scrum" là chấm cái gì?

Trong môn Công nghệ Phần mềm, **"Chấm theo Scrum"** có nghĩa là: **Thầy cô không chỉ chấm sản phẩm cuối cùng (App có chạy được không), mà chấm TOÀN BỘ QUY TRÌNH phát triển phần mềm theo mô hình Agile Scrum.**

| Tiêu chí | Chấm kiểu truyền thống (Waterfall) | Chấm theo Agile Scrum (Đề bài BrewLite) |
| :--- | :--- | :--- |
| **Thời điểm đánh giá** | Chỉ nộp và chấm 1 lần vào cuối kỳ. | Đánh giá quá trình tăng trưởng sản phẩm (**Increment**) qua 3 Sprint. |
| **Trọng tâm chấm** | Code chạy được là có điểm. | Code chạy được + Minh chứng quy trình (Git, Board, Daily, DoD). |
| **Đánh giá cá nhân** | Khó biết ai làm gì, dễ bị 1 người gánh hết. | Kiểm tra lịch sử Git commit, phân công User Story, nhật ký Daily Scrum của từng người. |

---

## 2. Thang điểm 10 Task Backlog theo Đề bài

Đề bài chia Product Backlog thành **10 task** (mỗi task 1 điểm, tổng 10 điểm) tương ứng 3 Sprint:

### 🔹 Sprint 1: Nền tảng & Hiển thị Menu (4 Điểm)
* **Task 1 (1đ):** Khởi tạo monorepo (`frontend/` Next.js + `backend/` NestJS), Docker Compose, Git repository, `.env.example`, README.
* **Task 2 (1đ):** API danh sách sản phẩm (`GET /products` và `GET /products/:id`) kết nối cơ sở dữ liệu PostgreSQL qua Prisma/TypeORM.
* **Task 3 (1đ):** Giao diện Menu (Next.js gọi API, hiển thị lưới món ăn, xử lý trạng thái loading/skeleton/empty).
* **Task 4 (1đ):** Chi tiết và tùy chọn món: Màn hình chi tiết chọn size (S/M/L) và topping, tự tính giá theo tùy chọn.

### 🔹 Sprint 2: Giỏ hàng, Đặt đơn & Xác thực (3 Điểm)
* **Task 5 (1đ):** Quản lý Giỏ hàng (Client state bằng Zustand/Context: thêm, sửa số lượng 1–20, xóa, tính tổng tiền, badge icon).
* **Task 6 (1đ):** API tạo đơn hàng (`POST /orders` nhận giỏ hàng, validate DTO bằng `class-validator`, tạo đơn trạng thái `PENDING`).
* **Task 7 (1đ):** Đăng ký / Đăng nhập (`POST /auth/register`, `POST /auth/login`, băm mật khẩu `bcrypt` ≥ 6 ký tự, cấp JWT, Guard bảo vệ route đặt đơn).

### 🔹 Sprint 3: Thanh toán, Bàn giao & Nghiệp vụ nâng cao (3 Điểm)
* **Task 8 (1đ):** Thanh toán không tiền mặt (Tích hợp Mock Payment: chọn Ví/Thẻ, gọi `POST /payments`, chuyển `PAID` hoặc `PAYMENT_FAILED`).
* **Task 9 (1đ):** Xác nhận đơn, lịch sử đơn (`GET /orders/me` polling 5s), hoàn thiện `docker-compose` full stack, README hướng dẫn chạy.
* **Task 10 (1đ - Task điểm 10):** Nghiệp vụ backend thực tế bao gồm 4 yêu cầu:
  1. *Order State Machine:* `PENDING → PAID → PREPARING → READY → COMPLETED`; chặn chuyển trạng thái sai.
  2. *Thanh toán idempotent:* Dùng `Idempotency-Key` để không trừ tiền/tạo đơn trùng lặp.
  3. *Kiểm soát tồn kho đồng thời:* Dùng transaction + Optimistic Locking khi nhiều người cùng đặt món.
  4. *Khuyến mãi & Tích điểm:* Áp voucher và cộng loyalty points sau khi đơn `PAID`.
  * **Yêu cầu chấm:** Bắt buộc có Unit/Integration tests pass 100% chứng minh được 3 tiêu chí: (a) Chặn transition sai, (b) Idempotency, (c) Concurrency không âm kho.

---

## 3. Tiêu chuẩn hoàn thành (Definition of Done - DoD)

Một task chỉ được tính trọn 1 điểm khi đạt Definition of Done (Mục 10 của đề bài):
1. **Code chạy được, không lỗi build:** Đạt đúng Tiêu chí chấp nhận (Acceptance Criteria) của task.
2. **Minh chứng trên Git:** Phải có commit rõ ràng với thông điệp chuẩn; có phân chia nhánh (`feature/task-X...`), Pull Request và code review trong nhóm.
3. **Chất lượng code:** Backend có validate đầu vào (`class-validator`), Frontend xử lý đầy đủ trạng thái loading/lỗi.
4. **Tài liệu:** Có hướng dẫn chạy trong file `README.md`.

---

## 4. Công cụ quản lý tiến độ: GitHub Projects vs Trello

Bảng quản lý công việc (Scrum Board / Kanban Board) là "bảng dán giấy ghi chú online" giúp nhóm theo dõi tiến độ.

### Nên dùng GitHub Projects hay Trello?
* **Trello ([trello.com](https://trello.com)):** Rất trực quan, dễ kéo thả, phù hợp nếu nhóm muốn làm nhanh và chỉ chụp ảnh dán vào báo cáo Word.
* **GitHub Projects (Khuyên dùng nhất ⭐):** Nằm ngay trong tab **Projects** của repo GitHub nhóm bạn.
  * **Lợi thế lớn:** Liên kết trực tiếp với Code, Issue, Pull Request. Ví dụ commit ghi `Fixes #2` thì thẻ Task 2 tự động nhảy sang cột **Done**. Thầy mở repo lên là thấy ngay quy trình chuyên nghiệp.

### Cách thiết lập trên GitHub Projects:
1. Bấm **New project** $\rightarrow$ Chọn template **Team planning** (hoặc **Team backlog**).
2. Tạo 2 View (Tabs):
   * **Tab 1 - Board:** Chia các cột kéo thả: `Todo` $\rightarrow$ `In Progress` $\rightarrow$ `In Review` $\rightarrow$ `Done` (Dùng để họp Daily hàng ngày).
   * **Tab 2 - Table:** Dạng bảng danh sách Excel, tạo trường `Sprint` để gán:
     * Task 1, 2, 3, 4 $\rightarrow$ `Sprint 1`
     * Task 5, 6, 7 $\rightarrow$ `Sprint 2`
     * Task 8, 9, 10 $\rightarrow$ `Sprint 3`
3. Cột `Assignees`: Gán tài khoản GitHub của từng thành viên vào task phụ trách.

---

## 5. Có phải gửi bảng tiến độ cho thầy không? Gửi bằng cách nào?

> **CÂU TRẢ LỜI: CÓ, ĐÂY LÀ MINH CHỨNG BẮT BUỘC ĐỂ CHẤM ĐIỂM QUY TRÌNH.**

Nhóm gửi qua 3 hình thức:
1. **Gửi link GitHub Project:** Để link trong file README hoặc file báo cáo nộp bài. Thầy click vào là xem được toàn bộ 10 task.
2. **Chụp ảnh màn hình (Screenshots):** Chụp bảng công việc ở các giai đoạn (đầu Sprint, giữa Sprint, cuối Sprint) và chèn vào báo cáo Word/PDF.
3. **Trình chiếu trong buổi Bàn giao (Sprint Review):** Mở bảng tiến độ lên chứng minh với thầy: *"Nhóm em đã hoàn thành các task của Sprint 1, 2, 3 đúng kế hoạch như trên bảng."*

---

## 6. Phân tích chi tiết "Sprint Log" trong Agile Scrum

"Sprint Log" trong đồ án phần mềm thực chất gồm **3 loại nhật ký/tài liệu**:

```
Sprint Log
 ├── 1. Sprint Backlog (Danh sách việc cần làm trong Sprint)
 ├── 2. Daily Scrum Log (Nhật ký họp ngắn hàng ngày của từng người)
 └── 3. Sprint Retrospective Log (Nhật ký họp rút kinh nghiệm cuối Sprint)
```

### 1. Sprint Backlog (Hạng mục công việc Sprint)
* Là danh sách các User Story / Task được nhóm cam kết hoàn thành trong Sprint đó kèm theo điểm ước lượng (Story Points) và người chịu trách nhiệm.

### 2. Daily Scrum Log (Nhật ký họp hàng ngày)
* Ghi lại tóm tắt câu trả lời của từng thành viên cho 3 câu hỏi kinh điển:
  1. *Hôm qua tôi đã làm gì?*
  2. *Hôm nay tôi sẽ làm gì?*
  3. *Có gặp khó khăn hay vật cản (blocker) nào không?*
* **Tác dụng:** Chứng minh từng người đều làm việc đều đặn, không có thành viên "bỏ nhóm".

### 3. Sprint Retrospective Log (Nhật ký họp cải tiến)
* Cuối mỗi Sprint, nhóm ghi chép lại:
  * **What went well? (Làm tốt):** Hoàn thành đúng hạn, setup Docker mượt mà.
  * **What could be improved? (Cần cải thiện):** Frontend và Backend chưa thống nhất kiểu dữ liệu nên tốn thời gian sửa lỗi.
  * **Action items (Giải pháp cho Sprint sau):** Backend viết Swagger API trước để Frontend xem trước.

---

## 7. Các sơ đồ cần vẽ trong đồ án (Rất cần thiết để lấy điểm cao)

### 📈 Sơ đồ 1: Sprint Burndown Chart (Biểu đồ tiến độ)
* **Mục đích:** Theo dõi khối lượng công việc còn lại (Story Points) giảm dần theo thời gian trong Sprint (Mục 2.4 đề bài).
* **Đặc điểm:** Có 2 đường:
  * **Ideal line (Đường lý tưởng):** Đường thẳng chéo từ trên xuống 0.
  * **Actual line (Đường thực tế):** Đường giảm giật cấp theo tiến độ thật của nhóm.
* **Cách vẽ nhanh nhất:** Dùng **Excel** hoặc **Google Sheets**, nhập bảng ngày và điểm còn lại $\rightarrow$ Bấm *Insert Line Chart* $\rightarrow$ Chụp ảnh chèn vào báo cáo.

### 🔄 Sơ đồ 2: Sơ đồ Máy trạng thái đơn hàng (Order State Machine)
* Bắt buộc có cho **Task 10** (Mục 9.1 đề bài).
* Luồng chính: `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED`.
* Luồng phụ: `PAYMENT_FAILED` (thanh toán lỗi, có thể thử lại), `CANCELLED` (hủy đơn).

### 🗄️ Sơ đồ 3: Sơ đồ Cơ sở dữ liệu (ERD)
* Thể hiện các bảng: `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Topping`, `Voucher` (Mục 12.2 đề bài và SRS).

### 🧭 Sơ đồ 4: Sơ đồ Luồng nghiệp vụ (Flowchart / Activity Diagram)
* Thể hiện luồng từ lúc khách mở Web $\rightarrow$ Menu $\rightarrow$ Giỏ hàng $\rightarrow$ Đăng nhập $\rightarrow$ Thanh toán $\rightarrow$ Nhận đơn tại quầy.

*Công cụ vẽ sơ đồ kỹ thuật miễn phí khuyên dùng:* **[draw.io](https://app.diagrams.net)**.

---

## 8. Checklist nghiệm thu và bàn giao sản phẩm (Mục 11 đề bài)

- [ ] **1. Mã nguồn & Docker:** Gõ lệnh `docker-compose up --build` chạy được toàn bộ Frontend, Backend, PostgreSQL mà không cần cấu hình phức tạp.
- [ ] **2. Kịch bản Demo End-to-End:** Chuẩn bị sẵn tài khoản test, thực hiện luồng từ Chọn món $\rightarrow$ Thêm giỏ $\rightarrow$ Thanh toán $\rightarrow$ Xem mã đơn #1042 trạng thái `PAID`.
- [ ] **3. Bộ Unit/Integration Tests cho Task 10:** Chạy `npm run test` trên Backend để chứng minh State machine, Idempotency và Concurrency control.
- [ ] **4. Hồ sơ Báo cáo Scrum hoàn chỉnh:** Gồm phân công vai trò, Sprint Backlog 3 Sprint, Biểu đồ Burndown, và Nhật ký Daily/Retrospective.
