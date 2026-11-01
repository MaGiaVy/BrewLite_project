# Minh chứng CI — Pull Request Pipeline (Task 4.4)

Người thực hiện: Nguyễn Thị Ý · Tệp cấu hình: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

## 1. Quy trình CI

Workflow `CI` chạy khi **mở/cập nhật Pull Request vào `main`**, đồng thời có trigger `workflow_call` để `cd.yml` gọi lại làm Quality Gate (`uses: ./.github/workflows/ci.yml`).

| Job | Mô tả |
|-----|-------|
| `quality (api)`, `quality (web)` | Matrix build cho `apps/api` và `apps/web`, chạy độc lập (`fail-fast: false`) để thấy lỗi của cả hai ứng dụng. |
| `ci` | Job tổng hợp, `needs: quality`, `if: always()`; thất bại nếu bất kỳ matrix job nào không `success`. **Đây là check bắt buộc tên `ci`.** |

Các bước trong mỗi matrix job (working-directory `apps/<app>`):

1. **Checkout** (`actions/checkout@v4`)
2. **Setup Node.js 20** với cache npm (`cache-dependency-path: apps/<app>/package-lock.json`)
3. **`npm ci`** — cài đặt đúng theo lockfile
4. *(chỉ api)* `npx prisma generate` — sinh Prisma Client để lint/test/build kiểm tra kiểu được
5. **`npm run lint`**
6. **`npm run test`**
7. **`npm run build`**

Một bước lỗi sẽ dừng job, job `ci` đỏ và PR không thể merge. Các giá trị môi trường trong workflow (`DATABASE_URL`, `JWT_SECRET`...) là giá trị giả chỉ dùng cho CI, không có secret thật. Workflow chỉ có quyền `contents: read`.

> Yêu cầu: mỗi workspace (`apps/api`, `apps/web`) phải có `package-lock.json` và đủ script `lint`, `test`, `build`.

## 2. Cấu hình Branch Protection (chủ repo thực hiện)

`Settings → Branches → Add branch protection rule` (hoặc Rulesets), pattern `main`:

- [x] **Require a pull request before merging** (không push thẳng vào `main`)
- [x] **Require status checks to pass before merging** → chọn check **`ci`**
- [x] **Require branches to be up to date before merging**
- [x] **Do not allow bypassing the above settings**
- [ ] (khuyến nghị) Require linear history / chặn force-push để không rewrite lịch sử

> Check `ci` chỉ xuất hiện trong danh sách sau khi workflow đã chạy ít nhất một lần.

## 3. Bằng chứng

| Mục | PR / Ảnh | Mô tả |
|-----|----------|-------|
| Pipeline đỏ | PR: _(điền link PR cố ý lỗi lint)_ · ảnh `ci-fail.png` | PR cố ý vi phạm lint → `quality` đỏ → `ci` đỏ → nút Merge bị khóa. |
| Pipeline xanh | PR: _(điền link PR đã sửa)_ · ảnh `ci-pass.png` | Sửa lỗi, push lại → mọi bước xanh → `ci` xanh → được merge. |

Ảnh chụp lưu cùng thư mục: `docs/evidence/ci-fail.png`, `docs/evidence/ci-pass.png`.
