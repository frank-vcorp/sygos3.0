#!/usr/bin/env bash
# Uso local (no commitear secretos): env -u CURSOR_ENV_LOADED bash scripts/coolify-set-env.sh
set -euo pipefail
source "${HOME}/.cursor/bin/load-cursor-env.sh"

APP_UUID="${1:-fwvckhghsttencoftqwjn4am}"
DB_UUID="${2:-t6edawwtycbgxrkmwuob7vj0}"

DBURL="$(curl -sf -H "Authorization: Bearer ${COOLIFY_READ_TOKEN}" \
  "${COOLIFY_BASE_URL}${COOLIFY_API_PREFIX}/databases/${DB_UUID}" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["internal_db_url"])')"

ENCKEY="${ENCRYPTION_KEY:-$(openssl rand -hex 16)}"
ADMIN_PW="${ADMIN_INITIAL_PASSWORD:-}"

post_env() {
  local key="$1"
  local value="$2"
  local body
  body="$(python3 -c 'import json,sys; print(json.dumps({"key":sys.argv[1],"value":sys.argv[2],"is_literal":True,"is_runtime":True,"is_buildtime":False}))' "$key" "$value")"
  curl -sf -H "Authorization: Bearer ${COOLIFY_WRITE_TOKEN}" \
    -H "Content-Type: application/json" \
    -X POST "${COOLIFY_BASE_URL}${COOLIFY_API_PREFIX}/applications/${APP_UUID}/envs" \
    -d "$body" >/dev/null
  echo "OK $key"
}

post_env "DATABASE_URL" "$DBURL"
post_env "ENCRYPTION_KEY" "$ENCKEY"
if [[ -n "$ADMIN_PW" ]]; then
  post_env "ADMIN_INITIAL_PASSWORD" "$ADMIN_PW"
fi

curl -sf -H "Authorization: Bearer ${COOLIFY_WRITE_TOKEN}" \
  -H "Content-Type: application/json" \
  -X POST "${COOLIFY_BASE_URL}${COOLIFY_API_PREFIX}/deploy" \
  -d "{\"uuid\":\"${APP_UUID}\",\"force\":true}" >/dev/null
echo "Deploy queued."
