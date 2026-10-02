#!/bin/sh
set -e
if [ -n "${DATABASE_URL:-}" ]; then
  echo "[sygos] Aplicando migraciones…"
  npm run db:migrate
  if [ -n "${ADMIN_INITIAL_PASSWORD:-}" ]; then
    echo "[sygos] Seed Super Admin (si no existe)…"
    npm run db:seed || true
  elif [ -n "${QA_VIEW_AS_PASSWORD:-}" ]; then
    echo "[sygos] Usuarios QA Ver como…"
    npm run db:seed-demo-view-as || true
  fi
  if [ -n "${FIX_SYSTRONIA_PASSWORD:-}" ]; then
    echo "[sygos] Restableciendo contraseña de Systronia (una vez)…"
    NEW_ADMIN_PASSWORD="${FIX_SYSTRONIA_PASSWORD}" npm run db:reset-systronia || true
  fi
fi
exec "$@"
