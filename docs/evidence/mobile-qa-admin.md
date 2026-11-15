# T5.5b – Báo cáo QA Mobile Staff & Admin

## 1. Thông tin

- **Task:** T5.5b – QA Mobile Staff & Admin (kiểm thử độc lập)
- **Người kiểm thử:** Quách Kỳ Minh
- **Reviewer:** Vỹ
- **Môi trường:** BrewLite Web
- **Phương pháp:** Chrome DevTools Responsive và điện thoại thật
- **Trạng thái:** Đã thực hiện kiểm thử theo xác nhận của người kiểm thử

## 2. Phạm vi kiểm thử

- **Staff (`/staff`):** danh sách đơn hàng, các tab trạng thái, chi tiết đơn, thao tác cập nhật trạng thái và hộp thoại xác nhận.
- **Admin (`/admin`):** điều hướng, quản lý món, topping, voucher, biểu mẫu và các chức năng quản trị có trên phiên bản kiểm thử.
- **Kích thước:** 360 × 800, 390 × 844, 768 × 1024.
- **Thiết bị thật:** Đã kiểm thử, không ghi thông tin mẫu thiết bị.

## 3. Kết quả kiểm thử

| Vai trò | 360px | 390px | 768px | Điện thoại thật |
| ------- | ----- | ----- | ----- | --------------- |
| Staff   | PASS  | PASS  | PASS  | PASS            |
| Admin   | PASS  | PASS  | PASS  | PASS            |

Các kết quả trên do người thực hiện xác nhận sau khi kiểm thử.

## 4. Kết quả tổng hợp

- **Responsive DevTools:** 6/6 trường hợp PASS.
- **Kiểm thử điện thoại thật:** Staff và Admin PASS.
- **Lỗi responsive được báo cáo:** 0.
- **Retest:** Không áp dụng vì không báo cáo lỗi cần sửa.

## 5. Evidence

Ảnh chụp màn hình Staff/Admin tại các kích thước kiểm thử được lưu trong `docs/evidence/` khi bổ sung vào repository.

Chỉ đưa vào báo cáo những ảnh evidence thực tế đã được lưu. Không sử dụng ảnh trang Google Search hoặc giao diện khách hàng làm bằng chứng cho Staff/Admin.

## 6. Kết luận

Theo kết quả do người kiểm thử xác nhận, giao diện Mobile Staff và Admin của BrewLite đạt yêu cầu responsive tại các kích thước 360px, 390px, 768px và khi sử dụng trên điện thoại thật.

Chưa ghi nhận lỗi responsive cần chuyển cho người phụ trách sửa giao diện. Báo cáo cần được bổ sung ảnh evidence và review trước khi nghiệm thu chính thức.
