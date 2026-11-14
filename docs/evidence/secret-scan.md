# Minh Chứng Kiểm Tra Bí Mật Mã Nguồn (Secret Scan & Hygiene)

- **Thời điểm kiểm tra:** `2026-11-14T22:23+07:00`
- **Phạm vi kiểm tra:** Toàn bộ **282 commits** trong lịch sử Git (`git rev-list --all --count`), cây tệp được theo dõi (`git ls-files`) và cấu hình `.gitignore` / GitHub Actions.

---

## 1. Kết quả rà soát cục bộ trên Git History & Tracked Files

| Hạng mục kiểm tra | Lệnh / Cơ chế | Kết quả quan sát |
| :--- | :--- | :--- |
| Tệp `.env` bị theo dõi trong Git | `git ls-files` lọc `.env` (trừ `.env.example`) | **0 tệp** `.env` chứa secret thật nằm trong Git index |
| Cấu hình chặn commit `.env` | [`.gitignore`](../../.gitignore) | Có đủ `.env`, `.env*.local`, chỉ giữ mẫu `!.env.example` |
| Chuỗi kết nối DB Production trong 282 commits | `git log --all -p -S "supabase.co"` | **0 kết quả** rò rỉ URI Supabase Production |
| Token GitHub / Khóa SSH / Render API Key | `git log --all -p -S` (`ghp_`, `github_pat_`, `BEGIN RSA/OPENSSH PRIVATE KEY`) + `git grep` pattern `rnd_`, `postgres(ql)://` non-local | **0 kết quả** rò rỉ token/key thật (chỉ có biến mẫu `${POSTGRES_USER:-brewlite}` trỏ service `db` nội bộ trong `docker-compose.yml`) |

*(Lưu ý kỹ thuật: Tại thời điểm chạy rà soát cục bộ ngày 2026-11-14, Docker Desktop daemon không bật trên máy trạm nên việc quét bổ sung bằng image `zricethezav/gitleaks` không chạy offline; pipeline CI/CD đã tích hợp sẵn `gitleaks/gitleaks-action@v3` ở job `security` trong [`.github/workflows/cd.yml`](../../.github/workflows/cd.yml).)*

---

## 2. Cơ chế Bảo vệ Secrets ở 3 Môi trường

1. **Local Development:** Dùng [`.env.example`](../../.env.example) để khởi tạo `.env` cục bộ; tuyệt đối không commit `.env`.
2. **GitHub Actions CI/CD:** Sử dụng `gitleaks/gitleaks-action@v3` với `fetch-depth: 0` trong `cd.yml` trước khi build/publish image; mọi token/deploy hook lưu trong **GitHub Secrets**.
3. **Production:**
   - **Vercel (`apps/web`):** Chỉ cấu hình biến public `NEXT_PUBLIC_API_URL=https://brewlite-api-9viv.onrender.com` và `NEXT_PUBLIC_ENABLE_DEMO_TOOLS=false`.
   - **Render (`brewlite-api`):** Lưu `DATABASE_URL` (Supabase SSL URI), `JWT_SECRET`, `CORS_ORIGIN`, `ALLOW_SANDBOX_CONFIRM`, `MOCK_PAYMENT_MODE`, `ZALOPAY_APP_ID`, `ZALOPAY_KEY1`, `ZALOPAY_KEY2` trong Render Environment Variables; logger NestJS không in `passwordHash`, `JWT_SECRET` hay token.
