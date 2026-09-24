# 🍵 BrewLite - Premium Beverage Delivery App

## Tổng quan
BrewLite là ứng dụng đặt cà phê/nước đồ không dùng tiền mặt, được xây dựng theo quy trình Agile Scrum.

**Stack:**
- **Frontend:** Next.js + TypeScript + TailwindCSS
- **Backend:** NestJS + TypeScript
- **Database:** PostgreSQL + Prisma
- **Payment:** Mock Payment Gateway

---

## 📁 Cấu trúc dự án

\`\`\`
brewlite/
├── frontend/          # Next.js app (port 3000)
│   ├── src/app/
│   ├── src/components/
│   ├── .env.example
│   └── package.json
├── backend/           # NestJS app (port 3001)
│   ├── src/
│   ├── .env.example
│   └── package.json
├── .gitignore
├── README.md
└── docker-compose.yml (sẽ add sau)
\`\`\`

---

## 🚀 Cách chạy

### Yêu cầu
- Node.js 18+ 
- npm hoặc yarn
- PostgreSQL (sau này khi làm Task 6)

### Backend Setup

\`\`\`bash
cd backend
npm install
npm run start:dev
\`\`\`

Backend chạy trên: **http://localhost:3001**

Kiểm tra: http://localhost:3001/health

### Frontend Setup

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

Frontend chạy trên: **http://localhost:3000**

---

## 📝 Environment Variables

### Backend (.env)
\`\`\`
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/brewlite
JWT_SECRET=your_jwt_secret_key_here
\`\`\`

### Frontend (.env.local)
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_NAME=BrewLite
\`\`\`

---

## ✅ Task 1 Checklist

- [x] Monorepo structure (frontend + backend)
- [x] NestJS backend running
- [x] Next.js frontend running
- [x] Git initialized with commits
- [x] .env.example files created
- [x] README.md created
- [x] Both apps show "Hello" message

---

## 👥 Team Members

| Task | FE/BE | Name | Status |
|------|-------|------|--------|
| 1 | Both | ... | ✅ DONE |
| 2 | BE | ... | 🚧 TODO |
| 3 | FE | ... | 🚧 TODO |
| ... | ... | ... | ... |

---



**Last Updated:** 23/09/2026