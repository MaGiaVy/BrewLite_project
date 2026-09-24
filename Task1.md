# ✅ TASK 1 - ACCEPTANCE CRITERIA \& VERIFICATION CHECKLIST

**Task Name:** Khởi tạo dự án và cấu trúc  
**Points:** 1 điểm  
**Sprint:** 1  
**Status:** \[   ] DONE / \[   ] IN PROGRESS / \[   ] TODO

\---

## 📋 YÊUBCẦU (Requirements)

### Requirement 1: Monorepo Structure ✓

**Criterion:**

```
brewlite/
├── frontend/              (Next.js app)
│   ├── src/app/
│   ├── src/components/
│   ├── package.json
│   ├── .env.example
│   ├── .env
│   └── tsconfig.json
├── backend/               (NestJS app)
│   ├── src/
│   ├── package.json
│   ├── .env.example
│   ├── .env
│   └── tsconfig.json
├── .gitignore
├── README.md
└── .git                   (Git repository)
```

**Verification:**

* \[ ] Frontend folder tồn tại: `ls frontend/package.json`
* \[ ] Backend folder tồn tại: `ls backend/package.json`
* \[ ] Cấu trúc folders đúng

\---

### Requirement 2: Backend (NestJS) Chạy Được ✓

**Criterion:**

* Backend chạy trên port 3001
* Không có error khi start
* Có endpoint `/health` hoạt động

**Verification:**

```bash
cd backend
npm run start:dev
```

**Expected Output:**

```
✅ BrewLite Backend running on http://localhost:3001
```

**Test endpoint:**

```bash
curl http://localhost:3001/health
# Response should be JSON:
# {
#   "statusCode": 200,
#   "status": "ok",
#   "message": "BrewLite Backend is running! 🍵",
#   "timestamp": "2026-09-23T...",
#   "service": "BrewLite Backend v1.0"
# }
```

**Checklist:**

* \[ ] Backend start không error
* \[ ] Chạy trên port 3001
* \[ ] GET `/health` trả JSON với statusCode: 200
* \[ ] Message contains "Backend" hoặc "running"

\---

### Requirement 3: Frontend (Next.js) Chạy Được ✓

**Criterion:**

* Frontend chạy trên port 3000
* Không có build error
* Gọi được backend API

**Verification:**

```bash
cd frontend
npm run dev
```

**Expected Output:**

```
  ▲ Next.js 14.x.x
  - Local: http://localhost:3000
  - Environments: .env
```

**Checklist:**

* \[ ] Frontend start không error
* \[ ] Chạy trên port 3000
* \[ ] Mở http://localhost:3000 hiển thị UI
* \[ ] Page không bị white screen

\---

### Requirement 4: Frontend-Backend Communication ✓

**Criterion:**

* Frontend có thể gọi backend API thành công
* Nhận được dữ liệu JSON từ backend
* Hiển thị dữ liệu trên page

**Verification:**

```bash
# 1. Backend chạy: cd backend \&\& npm run start:dev
# 2. Frontend chạy: cd frontend \&\& npm run dev
# 3. Mở browser: http://localhost:3000
```

**Expected Behavior:**

* \[ ] Page hiển thị "✅ Backend Connected!"
* \[ ] Hiển thị status: "ok"
* \[ ] Hiển thị message từ backend
* \[ ] Không có error toast

**If Error:**

* \[ ] DevTools (F12) → Console: có error message gì không?
* \[ ] Check CORS enabled trong backend main.ts
* \[ ] Check .env có `NEXT\_PUBLIC\_API\_URL=http://localhost:3001`

\---

### Requirement 5: Git Repository ✓

**Criterion:**

* Repo initialized với .gitignore
* Có commit rõ ràng cho Task 1

**Verification:**

```bash
cd brewlite
git log --oneline
```

**Expected Output:**

```
abc1234 \[Task-1] \[FE/BE] Setup: Initialize NestJS backend + Next.js frontend
def5678 Initial commit: Add .gitignore
```

**Checklist:**

* \[ ] `.git` folder tồn tại: `ls -la brewlite/ | grep .git`
* \[ ] Có ít nhất 1 commit về Task 1
* \[ ] Commit message format: `\[Task-1] \[FE/BE] ...`
* \[ ] .gitignore tồn tại

\---

### Requirement 6: .env.example Files ✓

**Criterion:**

* Backend có `.env.example`
* Frontend có `.env.example`

**backend/.env.example:**

```env
PORT=3001
NODE\_ENV=development
DATABASE\_URL=postgresql://user:password@localhost:5432/brewlite
JWT\_SECRET=your\_jwt\_secret\_key\_here
```

**frontend/.env.example:**

```env
NEXT\_PUBLIC\_API\_URL=http://localhost:3001/
NEXT\_PUBLIC\_APP\_NAME=BrewLite
```

**Verification:**

* \[ ] `backend/.env.example` tồn tại
* \[ ] `frontend/.env.example` tồn tại
* \[ ] `.env` files (actual) KHÔNG commit vào git (check .gitignore)
* \[ ] Mỗi .env.example có giải thích cho variables

\---

### Requirement 7: README.md ✓

**Criterion:**

* Root README.md tồn tại và có nội dung
* Hướng dẫn setup + chạy app

**README.md phải có:**

* \[ ] Project name: "BrewLite"
* \[ ] Tóm tắt về project (1-2 dòng)
* \[ ] Stack technology (Frontend, Backend, Database)
* \[ ] Folder structure
* \[ ] Hướng dẫn cài đặt dependencies (npm install)
* \[ ] Hướng dẫn chạy backend (npm run start:dev)
* \[ ] Hướng dẫn chạy frontend (npm run dev)
* \[ ] Environment variables section
* \[ ] Task 1 checklist hoặc status

**Verification:**

```bash
cat brewlite/README.md
```

\---

### Requirement 8: Code Quality ✓

**Criterion:**

* Backend code không có error
* Frontend code không có linting errors
* Beide apps start without warnings

**Verification:**

**Backend:**

```bash
cd backend
npm run start:dev
# Kiểm tra: Có warning gì không? Có error không?
```

**Frontend:**

```bash
cd frontend
npm run dev
# Kiểm tra: Build successful? Có warning gì không?
```

**Checklist:**

* \[ ] Backend: Không có error on startup
* \[ ] Backend: Logger shows "running on http://localhost:3001"
* \[ ] Frontend: Build successful
* \[ ] Frontend: Không có build warnings (hoặc minimal)
* \[ ] Console (browser F12): Không có red errors

\---

## 📊 DEFINITION OF DONE (DoD)

Task 1 chỉ được tính "DONE" khi:

1. **Monorepo Structure** ✓

   * Folder structure đúng theo spec
   * Backend + Frontend cùng một git repo
2. **Backend Running** ✓

   * NestJS start successfully trên port 3001
   * `/health` endpoint trả JSON response
   * Không có startup errors
3. **Frontend Running** ✓

   * Next.js start successfully trên port 3000
   * Render page mà không white screen
   * No build errors
4. **Communication Working** ✓

   * Frontend fetch được dữ liệu từ backend
   * Hiển thị "✅ Backend Connected!" trên page
   * CORS hoạt động
5. **Git Setup** ✓

   * Repo initialized
   * .gitignore tồn tại
   * Commit rõ ràng cho Task 1
6. **Documentation** ✓

   * README.md có đầy đủ thông tin
   * .env.example files có
7. **Code Quality** ✓

   * Không có startup errors
   * Không có critical warnings
   * Code follows NestJS + Next.js best practices (cơ bản)

\---

## 🧪 MANUAL TEST STEPS

**Thực hiện theo đúng thứ tự:**

### Step 1: Check folder structure

```bash
cd brewlite
ls -la
# Should show: frontend/, backend/, .git, .gitignore, README.md
```

### Step 2: Start backend

```bash
cd backend
npm run start:dev
# Wait for: ✅ BrewLite Backend running on http://localhost:3001
```

### Step 3: Test backend endpoint (new terminal)

```bash
curl http://localhost:3001/health
# Should return JSON with status: "ok"
```

### Step 4: Start frontend (new terminal)

```bash
cd frontend
npm run dev
# Wait for: ▲ Next.js ... Local: http://localhost:3000
```

### Step 5: Test frontend in browser

* Open: http://localhost:3000
* Should see: "✅ Backend Connected!"
* Should see: "Status: ok"
* Should see message from backend

### Step 6: Check Git

```bash
cd brewlite
git log --oneline
# Should have at least 1 commit about Task 1
```

### Step 7: Verify files

```bash
# Check .env files
ls backend/.env backend/.env.example
ls frontend/.env frontend/.env.example

# Check README
cat README.md | head -20
```

\---

## 📋 SIGN-OFF CHECKLIST

**When all below are checked ✓, Task 1 is DONE:**

```
Frontend + Backend
□ Monorepo structure correct
□ Backend runs on port 3001
□ Frontend runs on port 3000
□ Frontend displays "Backend Connected!"
□ No startup errors

Git + Docs
□ .git folder exists
□ .gitignore correct
□ At least 1 Task 1 commit
□ README.md exists with setup instructions
□ .env.example files exist

Code Quality
□ No error logs
□ No build warnings (critical)
□ API response valid JSON
□ CORS working

Ready for Task 2?
□ YES - All checklist items checked
□ NO - Fix issues first
```

\---

## ⚠️ COMMON ISSUES \& FIXES

|Issue|Cause|Fix|
|-|-|-|
|"Cannot find module @nestjs"|Dependencies not installed|`cd backend \&\& npm install`|
|Port 3001 already in use|Another app using port|`lsof -i :3001` then `kill -9 <PID>`|
|"CORS error" in browser|CORS not enabled|Check `enableCors()` in main.ts|
|"Failed to connect" in frontend|Backend not running|Start backend: `npm run start:dev`|
|.env variables not read|.env not in gitignore|Add to .gitignore: `.env` and `.env.local`|
|"Cannot find next.config"|Node modules not installed|`cd frontend \&\& npm install`|

\---

**Last Updated:** 23/09/2026  
**Version:** 1.0  
**Owner:** Team Lead (A1/B1)

\---

## SUBMIT CHECKLIST

Before saying "Task 1 Done!", verify:

```bash
# 1. Both servers running
# Terminal 1: cd backend \&\& npm run start:dev
# Terminal 2: cd frontend \&\& npm run dev

# 2. API test
curl http://localhost:3001/health | jq

# 3. Frontend test
# Browser: http://localhost:3000 → shows "✅ Backend Connected!"

# 4. Git test
git log --oneline | head -5

# 5. Files exist
ls -la brewlite/{.gitignore,README.md}
ls -la brewlite/{backend,frontend}/.env.example

echo "✅ ALL CHECKS PASSED - Task 1 is DONE!"
```

