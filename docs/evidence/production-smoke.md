# Minh Chứng Smoke Test & Negative Checks trên Production

- **Thời điểm thực hiện:** `2026-11-14T22:21:26+07:00`
- **Frontend URL (Vercel):** `https://brew-lite-project.vercel.app`
- **Backend API URL (Render Singapore):** `https://brewlite-api-9viv.onrender.com`
- **Database:** Supabase Managed PostgreSQL (`sslmode=require`)
- **Script sử dụng:** [`scripts/smoke-test.ps1`](../../scripts/smoke-test.ps1)

---

## 1. Kết quả Smoke Test (`scripts/smoke-test.ps1`)

Lệnh thực thi (đã lược bỏ mật khẩu khi lưu tài liệu):

```powershell
./scripts/smoke-test.ps1 `
  -ApiBaseUrl "https://brewlite-api-9viv.onrender.com" `
  -WebBaseUrl "https://brew-lite-project.vercel.app" `
  -Email "khach@brewlite.vn" `
  -Password "<DEMO_PASSWORD>" `
  -Attempts 12 -DelaySeconds 10
```

Kết quả quan sát thực tế:

```text
PASS GET /health (attempt 1)
PASS GET /products (attempt 1)
PASS GET /inventory/pricing-config (attempt 1)
PASS POST /auth/login + GET /auth/me (attempt 1)
PASS GET https://brew-lite-project.vercel.app/menu (attempt 1)
```

Xác nhận phản hồi `GET https://brewlite-api-9viv.onrender.com/health`:

```json
{"status":"ok","db":"up"}
```

---

## 2. Kết quả Negative Security & RBAC Checks

| Kiểm thử | Điều kiện gửi | Kết quả thực tế | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `GET /auth/me` | Không kèm `Authorization` Bearer JWT | **HTTP `401`** | Chặn truy cập ẩn danh vào profile người dùng |
| `POST /payments` | Không kèm `Authorization` Bearer JWT | **HTTP `401`** | Chặn khởi tạo giao dịch thanh toán khi chưa xác thực |
| `GET /admin/customers` | Kèm JWT vai trò `CUSTOMER` (`khach@brewlite.vn`) | **HTTP `403`** | Xác nhận `RolesGuard` chặn leo thang đặc quyền sang trang Admin |
| `POST /payments` | Kèm JWT `CUSTOMER` với `orderId: 999999` không tồn tại | **HTTP `404`** | Không rò rỉ dữ liệu đơn hàng không hợp lệ (`Khong tim thay don hang voi ma #999999`) |

---

## 3. Lưu ý vận hành Production

- Render sử dụng gói **Docker Free tier**, có cơ chế ngủ đông (*spin-down*) sau ~15 phút không có request; lần gọi đầu tiên sau khi ngủ có thể mất 30–50 giây để khởi động lại (dùng `-Attempts 12 -DelaySeconds 10` khi chạy smoke test sau idle).
