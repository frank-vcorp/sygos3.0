#!/bin/sh
set -e
if [ -n "${DATABASE_URL:-}" ]; then
  echo "[sygos] Aplicando migraciones…"
  npm run db:migrate
  if [ -n "${ADMIN_INITIAL_PASSWORD:-}" ]; then
    echo "[sygos] Seed Super Admin (si no existe)…"
    npm run db:seed || true
  fi
fi
exec "$@"
