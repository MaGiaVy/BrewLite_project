# ADR-001: Tổ chức Mã nguồn theo Kiến trúc Monorepo

* **Trạng thái:** Chấp thuận (Accepted)
* **Ngày quyết định:** 2026-10-26
* **Người quyết định:** Huỳnh Tuấn Kiệt (với sự thống nhất của nhóm)
* **Mã task liên quan:** `T3.1`, `T4.1`, `T4.4`

---

## 1. Bối cảnh (Context)
Dự án BrewLite bao gồm hai ứng dụng chính: giao diện web đặt hàng người dùng bằng Next.js (`apps/web`) và dịch vụ xử lý nghiệp vụ backend bằng NestJS (`apps/api`), cùng hệ thống tài liệu đặc tả kỹ thuật (`docs/`) và các bài kiểm thử tự động (`tests/`). Việc quản lý mã nguồn ở Assignment 1 gặp khó khăn khi tách rời hai repository hoặc hai thư mục độc lập, dẫn đến lệch phiên bản tài liệu (SRS/Diagrams) so với mã nguồn và khó thiết lập luồng kiểm thử tích hợp tự động (CI/CD).

## 2. Quyết định (Decision)
Nhóm quyết định hợp nhất toàn bộ mã nguồn vào một kho lưu trữ duy nhất theo cấu trúc **Monorepo**:
```text
brewlite/
├── apps/
│   ├── web/               # Next.js App Router (Mobile-first / PWA)
│   └── api/               # NestJS API (Modular Architecture)
├── docs/                  # Tài liệu đặc tả yêu cầu, sơ đồ UML, kiến trúc
├── tests/                 # Kiểm thử End-to-End (Playwright)
├── .github/workflows/     # Pipeline CI/CD tập trung
├── docker-compose.yml     # Khởi chạy môi trường local đồng nhất
└── README.md
```

## 3. Hệ quả (Consequences)

### Ưu điểm (Pros):
* **Tính nhất quán cao:** Một Pull Request (PR) duy nhất có thể bao gồm cả tài liệu kiến trúc, mã nguồn backend, frontend và kiểm thử tương ứng.
* **Tối ưu quy trình CI/CD:** Pipeline GitHub Actions được cấu hình tập trung, dễ dàng điều phối build và test cho cả hai ứng dụng.
* **Đồng bộ truy vết:** Dễ dàng lập ma trận truy vết (Traceability Matrix) từ yêu cầu chức năng (FR) đến commit mã nguồn cụ thể.

### Nhược điểm & Hạn chế (Cons):
* Kích thước repository lớn hơn, lịch sử commit chung cho cả frontend và backend.
* Cần cấu hình phân tách luồng kiểm thử (`working-directory` hoặc `matrix` trong CI) để tránh build dư thừa.

### Sự đánh đổi (Trade-off):
Chấp nhận thời gian thiết lập CI ban đầu phức tạp hơn đôi chút để đổi lấy khả năng đồng bộ mã nguồn, tài liệu và kiểm thử tuyệt đối cho cả 6 thành viên trong nhóm.

