#!/bin/sh
set -e

echo "[entrypoint] Applying database migrations..."
npx prisma migrate deploy

echo "[entrypoint] Seeding database (idempotent)..."
npx prisma db seed

echo "[entrypoint] Starting API..."
exec "$@"
