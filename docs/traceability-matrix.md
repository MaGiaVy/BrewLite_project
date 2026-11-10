# Traceability Matrix (Ma Trận Truy Vết)

| Mã yêu cầu | Use-case / User Story | Thiết kế / Sơ đồ | Code / API / Giao diện | Mã Test / Kết quả |
| :---: | :--- | :--- | :--- | :---: |
| **FR-01** | US-01 Xem menu đồ uống | Activity-01, Class-01 | `GET /products`, `apps/web/src/app/menu/page.tsx` | API-T01, WEB-T01..T03 (Pass) |
| **FR-02** | US-02 Xem chi tiết món & Tùy chọn | Activity-01, Class-01 | `GET /products/:id`, `apps/web/src/app/products/[id]/page.tsx` | API-T02, **WEB-T04..T06 (Pass)** |
| **FR-03** | US-03 Giỏ hàng & Tạo đơn | Activity-01, Class-01 | `POST /orders`, `apps/web/src/app/cart/page.tsx`, `apps/web/src/stores/cart-store.ts` | API-T04, **WEB-T04..T07 (Pass)** |
| **FR-04** | US-04 Đăng ký, đăng nhập & JWT | Sequence-Auth, Activity-01 | `POST /auth/{register, login}`, `apps/web/src/app/(auth)/{login, register}`, `apps/web/src/lib/api-client.ts` | API-T10..T13, **WEB-T09 (Pass)** |
| **FR-05** | US-05 Thanh toán & Tích điểm | Sequence-01, Class-01 | `POST /payments`, `apps/web/src/app/checkout/page.tsx`, `apps/api/src/payments/payments.service.ts` | API-T05..T06, **WEB-T10..T13 (Pass)** |
| **FR-06** | US-06 Hủy đơn & Timeout | Activity-01, Sequence-01 | `PATCH /orders/:id/cancel`, `expire-orders.job.ts` | API-T07, API-T08, API-T09 (Pass) |
| **FR-07** | US-07 Lịch sử & Theo dõi đơn | Activity-01, Sequence-01 | `GET /orders/me`, `GET /orders/:id`, `apps/web/src/app/orders/`, `use-order-polling.ts` | **WEB-T14..T16 (Pass)** |
| **NFR-02** | Bảo mật phiên & Xử lý 401 | Sequence-Auth | `apps/web/src/lib/api-client.ts`, `apps/web/src/stores/auth-store.ts` | **WEB-T09 (Pass)** |
| **NFR-03** | Tính bền vững của giỏ hàng | Activity-01 | `apps/web/src/stores/cart-store.ts` (`localStorage persist`) | **WEB-T07 (Pass)** |
| **NFR-04** | Trải nghiệm thời gian thực | Activity-01 | `apps/web/src/hooks/use-order-polling.ts` (AbortController, 5s interval) | **WEB-T14..T16 (Pass)** |
