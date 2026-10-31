# ADR-005: Xây dựng Dịch vụ Thanh toán Mô phỏng (Mock Payment Service)

* **Trạng thái:** Chấp thuận (Accepted)
* **Ngày quyết định:** 2026-10-26
* **Người quyết định:** Huỳnh Tuấn Kiệt, Nguyễn Gia Thành, Mã Gia Vỹ
* **Mã task liên quan:** `T3.1`, `T5.1a`, `T5.2c`

---

## 1. Bối cảnh (Context)
Đề tài BrewLite tập trung vào mô hình đặt hàng không tiền mặt (Cashless). Mặc dù ở Assignment 1 nhóm đã từng thử nghiệm kết nối ZaloPay Sandbox, việc phụ thuộc vào một cổng thanh toán bên thứ ba thực tế gây ra nhiều rủi ro:
* Không thể kiểm thử tự động các kịch bản lỗi thanh toán (`PAYMENT_FAILED`) một cách chủ động và có thể tái lặp (deterministic).
* Mạng chập chờn hoặc hệ thống sandbox bên ngoài bảo trì có thể làm gián đoạn kiểm thử E2E trong pipeline CI/CD hoặc làm hỏng buổi demo nghiệm thu trước giảng viên.

## 2. Quyết định (Decision)
Nhóm quyết định thiết kế một **Dịch vụ Thanh toán Mô phỏng nội bộ (`MockGatewayService`)** tại `apps/api/src/payments/mock-gateway.service.ts`:
1. Hỗ trợ 2 phương thức thanh toán: Ví điện tử (`WALLET`) và Thẻ ngân hàng (`CARD`).
2. Điều khiển kết quả phản hồi thông qua biến môi trường `MOCK_PAYMENT_MODE`:
   * `success`: Luôn trả về giao dịch thành công (dùng cho Happy Path và `E2E-T01`).
   * `failure`: Luôn trả về giao dịch thất bại (dùng để kiểm thử xử lý lỗi, giữ giỏ hàng và nút thử lại tại `E2E-T02`).
   * `random`: Trả về ngẫu nhiên với tỷ lệ thành công 80% và thất bại 20% (dùng trong môi trường trải nghiệm thực tế).

## 3. Hệ quả (Consequences)

### Ưu điểm (Pros):
* **Kiểm thử tự động hóa 100%:** Pipeline CI/CD và E2E Test (Playwright) có thể chủ động kích hoạt cả nhánh thành công và nhánh thất bại mà không cần thao tác quét mã hay nhập OTP thật.
* **Độc lập và ổn định:** Không phụ thuộc vào kết nối Internet bên ngoài hay trạng thái của đối tác thanh toán trong lúc chấm điểm.
* **Đạt chuẩn yêu cầu đề bài:** Đáp ứng trọn vẹn yêu cầu dịch vụ thanh toán mô phỏng trong đề bài Assignment 2 của môn học.

### Nhược điểm & Hạn chế (Cons):
* Chưa mang lại trải nghiệm quét mã QR thực tế như môi trường sản xuất thương mại ngoài đời.

### Sự đánh đổi (Trade-off):
Ưu tiên **tính ổn định, tính xác định (determinism) của kiểm thử tự động** và sự an toàn khi chạy pipeline CD/nghiệm thu đồ án trên hết.

