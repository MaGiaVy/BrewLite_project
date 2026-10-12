# Multi-stage Dockerfile cho NestJS Backend (BrewLite)
FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt công cụ build cho native dependencies (bcrypt, v.v.)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

# Stage 2: Runtime Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3001

CMD ["node", "dist/main.js"]
