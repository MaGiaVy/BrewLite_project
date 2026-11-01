# T4.3 – MVP Sprint 1: Product API và Menu

> Phạm vi: phần được phân công cho Quách Kỳ Minh theo sheet **Bước chi tiết**. Tài liệu này ghi lại triển khai trên branch T4.3; không thay thế tài liệu yêu cầu, UML hoặc ADR của thành viên khác.

## Đầu ra theo phân công

| Bước | Công việc | Bằng chứng trong source | Trạng thái xác minh |
|---|---|---|---|
| 1 | Viết API-T01, API-T02, API-T03 | `apps/api/src/products/products.spec.ts` | Đã có test; chưa xác nhận chạy PASS |
| 2 | Chạy test backend | `npm run test -w apps/api` | Chưa có log PASS |
| 3 | Product API, seed ≥ 8 sản phẩm và ≥ 1 món hết hàng | `apps/api/src/products/`, `apps/api/prisma/seed.ts`, `apps/api/prisma/schema.prisma` | Có source; cần chạy PostgreSQL |
| 4 | Viết WEB-T01, WEB-T02, WEB-T03 | `apps/web/src/app/menu/menu.test.tsx` | Đã có test; chưa xác nhận chạy PASS |
| 5 | Menu mobile-first, loading/empty/error/retry, hết hàng | `apps/web/src/app/menu/page.tsx` | Có source; cần kiểm thử trình duyệt |
| 6 | Chạy lại backend/frontend tests và build | Các lệnh bên dưới | Chưa có log PASS |
| 7 | Commit, push và PR | Link PR/CI trên GitHub | Cần xác minh PR và merge |

## API và dữ liệu

- `GET /products`: trả `{ "data": ProductSummary[] }` với các trường `id`, `name`, `price`, `imageUrl`, `stock`.
- `GET /products/:id`: trả `{ "data": ProductDetail }` với `toppings[]`; trả HTTP 404 khi sản phẩm không tồn tại.
- Prisma sử dụng PostgreSQL. Migration đầu tiên ở `apps/api/prisma/migrations/`.
- Seed định nghĩa 8 đồ uống, trong đó `Chocolate đá` có `stock = 0`.

## Chạy và kiểm tra trên máy

Yêu cầu Node.js/npm, PostgreSQL hoạt động và kết nối npm registry.

```bash
npm install
npm run lint
npm test
npm run build
```

Sao chép `apps/api/.env.example` thành `apps/api/.env` và thiết lập `DATABASE_URL`. Nếu dùng file môi trường tại thư mục gốc `apps/api`, chạy:

```bash
npm run db:generate -w apps/api
npm run db:migrate -w apps/api
npm run db:seed -w apps/api
```

Khởi chạy ở hai terminal:

```bash
npm run dev -w apps/api
npm run dev -w apps/web
```

Kiểm tra `http://localhost:3001/products`, `http://localhost:3001/products/1` và `http://localhost:3000/menu` sau khi cấu hình môi trường phù hợp.

## Lưu ý trước PR

- Chưa coi các bước chạy test/build, migration/seed hoặc PR là **Done** nếu chưa có log/bằng chứng thực tế.
- Kiểm tra màn hình responsive, skeleton loading, danh sách rỗng, lỗi có nút **Thử lại** và món **Hết hàng**.
- `imageUrl` của seed trỏ tới `/images/products/<id>.jpg`; ảnh phải được bổ sung hoặc đường dẫn được thống nhất với nhóm trước khi chấm giao diện.
- Link **Chi tiết** trên menu liên quan đến T5.1c, chưa có nghĩa T5.1c đã hoàn thành.
- Không bắt đầu T5.1c trước khi T4.3 và T4.4 đã merge theo quy ước nhóm.
