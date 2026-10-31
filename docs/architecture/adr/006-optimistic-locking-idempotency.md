# ADR-006: Kiểm soát Đặt hàng Đồng thời bằng Optimistic Locking và Chống Trùng lặp bằng Idempotency-Key

* **Trạng thái:** Chấp thuận (Accepted)
* **Ngày quyết định:** 2026-10-26
* **Người quyết định:** Huỳnh Tuấn Kiệt, Nguyễn Gia Thành
* **Mã task liên quan:** `T3.1`, `T5.1a`, `T5.2a`

---

## 1. Bối cảnh (Context)
Trong hệ thống bán cà phê trực tuyến, hai vấn đề kỹ thuật nguy hiểm nhất ở tầng giao dịch nghiệp vụ là:
1. **Bán vượt tồn kho (Overselling / Race Condition):** Khi chỉ còn 1 ly nước cuối cùng nhưng 2 khách hàng bấm đặt hàng cùng một thời điểm. Nếu không kiểm soát tranh chấp, cả hai đơn đều được tạo thành công và tồn kho bị âm.
2. **Thanh toán lặp / Trừ tiền kép (Double Spending / Duplicate Charges):** Khi người dùng mạng chậm bấm nút "Xác nhận thanh toán" liên tục nhiều lần, hoặc khi frontend thử lại request do timeout, hệ thống có thể tạo ra nhiều giao dịch thanh toán hoặc cộng điểm thưởng nhiều lần.

## 2. Quyết định (Decision)
Nhóm quyết định triển khai giải pháp kết hợp hai cơ chế kỹ thuật:
1. **Khóa Lạc Quan (Optimistic Locking):**
   * Bổ sung trường `version Int @default(0)` vào thực thể quản lý tồn kho và đơn hàng.
   * Khi cập nhật tồn kho, thực hiện câu lệnh:
     `UPDATE products SET stock = stock - :qty, version = version + 1 WHERE id = :id AND version = :version AND stock >= :qty`
   * Nếu số dòng bị ảnh hưởng là 0 (chứng tỏ phiên bản đã bị thay đổi bởi request khác), hệ thống tự động thử lại (retry) tối đa $3\text{ lần}$. Nếu vẫn thất bại, ném ngoại lệ HTTP `409 Conflict`.
2. **Tính Bất Biến Yêu Cầu (Idempotency-Key):**
   * Phía client (Next.js) sinh chuỗi UUID ngẫu nhiên bằng `crypto.randomUUID()` khi bấm xác nhận thanh toán và gửi qua header `Idempotency-Key`.
   * Cả hai endpoint `POST /orders` và `POST /payments` đều kiểm tra khóa này:
     * Nếu đã có bản ghi thanh toán `SUCCESS` tương ứng với `Idempotency-Key`, hệ thống trả về ngay kết quả cũ mà không tạo thêm giao dịch thanh toán hay cộng điểm thưởng lần thứ hai.
     * Khóa này được giữ nguyên cho mọi lần thử lại (`Retry`) của cùng một phiên đặt đơn.

## 3. Hệ quả (Consequences)

### Ưu điểm (Pros):
* **Hiệu năng cao:** Không khóa dòng dữ liệu trong cơ sở dữ liệu (no pessimistic row-lock), giúp hàng trăm khách hàng có thể duyệt menu và thêm giỏ hàng mà không bị nghẽn DB.
* **Ngăn chặn triệt để lỗi nghiệp vụ:** Đảm bảo tồn kho $\text{stock} \ge 0$ và ngăn chặn hoàn toàn việc trừ tiền/cộng điểm hai lần (được kiểm chứng qua bài test `INT-T02` và `INT-T03`).

### Nhược điểm & Hạn chế (Cons):
* Người dùng đến sau trong trường hợp hết hàng sẽ nhận thông báo lỗi `409 Conflict` và phải chọn món khác.
* Cần thêm logic xử lý bảng `Payment` và lưu trữ `idempotencyKey`.

### Sự đánh đổi (Trade-off):
Chấp nhận một tỷ lệ nhỏ request bị retry/conflict để đổi lấy hiệu năng hệ thống vượt trội và bảo vệ sự toàn vẹn của dữ liệu tài chính.

