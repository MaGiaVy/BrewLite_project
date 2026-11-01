# T4.3 — MVP Sprint 1 (Menu) — Phân công Quách Kỳ Minh

Nguồn đối chiếu: Excel `BrewLite_Assignment2_Phan_Cong_Task3-5.xlsx` → `Bước chi tiết` (T4.3-1…7), `Task tổng` (T4.3), `Quy ước chung`.

## Phạm vi

- `GET /products` → HTTP 200, `{data: ProductSummary[]}` với `id, name, price, imageUrl, stock`.
- `GET /products/:id` → HTTP 200, `{data: ProductDetail}` bao gồm `toppings[]`; hoặc HTTP 404.
- Seed tối thiểu 8 sản phẩm, có topping và có một sản phẩm `stock = 0`.
- Menu mobile-first: skeleton, empty `Chưa có món`, error + `Thử lại`, responsive 1 cột (mobile) / 2 cột (tablet) / 3 cột (desktop), `Hết hàng`.
- Mã tests bắt buộc: API-T01–T03, WEB-T01–T03.
- **Không thực hiện** cart, product detail page, auth, order/payment, health, Docker hay CI của thành viên khác.

## Đối chiếu từng bước

| Bước | File liên quan | Bằng chứng cần có | Trạng thái | 
|---|---|---|---|
| T4.3-1 | `apps/api/src/products/products.controller.spec.ts`, `products.spec.ts` | API-T01/T02/T03, HTTP 200/404, cấu trúc response | Có test; chưa chạy Vitest |
| T4.3-2 | Terminal/backend test log | `npm run test -w apps/api`, xác định test fail/pass; khi code có sẵn được phép đối chiếu | Chưa chạy được do thiếu dependencies |
| T4.3-3 | `products.controller.ts`, `products.service.ts`, `prisma/seed.ts`, Prisma schema/migration | API đạt; PostgreSQL có >=8 sản phẩm, 1 món stock 0, topping | Code đã cập nhật; chưa kiểm chứng DB |
| T4.3-4 | `apps/web/src/components/__tests__/menu.test.tsx` | WEB-T01/T02/T03; WEB-T03 chứng minh gọi API lần thứ hai | Có test; chưa chạy Vitest |
| T4.3-5 | `apps/web/src/app/menu/page.tsx`, `menu.module.css`, `src/components/ProductCard.tsx` | 1/2/3 cột, skeleton/error/empty, nhãn Hết hàng | Code đã cập nhật; chưa kiểm tra trình duyệt |
| T4.3-6 | Terminal/test log | Hai lệnh test backend và frontend đều PASS | Chưa đủ bằng chứng |
| T4.3-7 | Git commit, PR, CI | Commit `feat(menu): products API, menu screen with loading/empty/error states` | Chưa xác minh PR/CI/merge |

## Hướng dẫn kiểm thử từng bước trên máy

Yêu cầu: Node.js 20+ (khuyến nghị Node.js 22), npm, PostgreSQL. Mở VS Code Terminal tại root repo. Không copy `.env` vào Git.

**Bước A — Cài dependencies và sinh Prisma Client.**

```bash
npm install
npm run db:generate -w apps/api
```

`npm install` tạo `package-lock.json` ở root repo. Nếu chưa tồn tại, sau khi lệnh thành công cần commit file lock cho CI của T4.4 dùng `npm ci`.

**Bước B — Kiểm tra API tests.**

```bash
npm run test -w apps/api
```

Phải thấy API-T01, API-T02, API-T03 PASS (cùng các test bổ sung). Nếu fail, copy log trước khi thay code.

**Bước C — Chuẩn bị database và seed.**

Tạo DB PostgreSQL tên `brewlite` nếu chưa có; sao chép `apps/api/.env.example` thành `apps/api/.env`; cập nhật `DATABASE_URL` theo môi trường thật.

```bash
npm run db:migrate -w apps/api
npm run db:seed -w apps/api
```

Xác minh 8 sản phẩm, ít nhất 1 dòng `stock = 0` (Chocolate đá), các bảng topping và liên kết. Migration không nên thay đổi schema của module khác.

**Bước D — Kiểm tra WEB-T01/T02/T03.**

```bash
npm run test -w apps/web
```

WEB-T03 phải mô phỏng lỗi API, bấm `Thử lại`, chứng minh `fetch` gọi lại lần 2 và sản phẩm hiển thị.

**Bước E — Kiểm tra menu trực quan.**

```bash
npm run dev -w apps/api
# Mở thêm một Terminal:
npm run dev -w apps/web
```

Mở `http://localhost:3000/menu`, sau đó dùng Chrome DevTools (F12 → Toggle Device Toolbar) để kiểm tra bề rộng dưới 640 px = 1 cột, 640–959 px = 2 cột, từ 960 px = 3 cột. Kiểm tra skeleton khi chờ API, lỗi và thử lại khi API dừng, `Hết hàng` khi `stock = 0`. Ảnh 8 sản phẩm có sẵn trong `apps/web/public/images/products/`.

**Bước F — Lint, test và build.**

```bash
npm run lint
npm run test -w apps/api
npm run test -w apps/web
npm run build
```

Chỉ ghi PASS khi lệnh thật sự kết thúc exit code 0. Bản ZIP do trợ lý kiểm tra chưa chạy được do không tải được npm dependencies.

**Bước G — Review và đưa lên Git.**

```bash
git status
git diff --check
git diff --stat
git add apps/api apps/web package.json package-lock.json docs/tasks/TASK_4_3_MVP_SPRINT_1_MENU.md .gitignore
git commit -m "feat(menu): products API, menu screen with loading/empty/error states"
git push -u origin "task/task-4.3-MVP-Sprint-1-(menu)"
```

Chỉ `git add package-lock.json` sau khi npm đã tạo file. Kiểm tra không stage `.env` hoặc file bí mật. Đặt base PR theo nhánh tích hợp mà nhóm thống nhất; ghi `FR-01`, các test API-T01–T03/WEB-T01–T03, lý do thay đổi, các lệnh đã chạy và kết quả. Không tự merge trước khi CI/review đạt.

## Ghi chú về tài liệu chung

`docs/requirements/srs.md` hiện còn mô tả FR-01 rộng hơn phạm vi T4.3 (ví dụ lọc/tìm kiếm và số lượng sản phẩm tối thiểu 10) trong khi Excel ghi seed tối thiểu 8. Vì T4.2 phụ trách đồng bộ SRS, đây là **điểm cần báo nhóm**, không tự sửa SRS hay mở rộng T4.3.

Size S/M/L và phụ thu là quy tắc chung, nhưng trang chọn size/topping và cart là phạm vi T5.1c. Seed T4.3 cung cấp danh sách topping cho API chi tiết để T5.1c dùng lại.
