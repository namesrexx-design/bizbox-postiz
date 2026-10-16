#!/usr/bin/env bash
set -euo pipefail
# Isolated code generation and focused tests only; no app build or database.
root=$(cd "$(dirname "$0")/../.." && pwd)
out=${POSTIZ_COMPAT_OUT:?Set POSTIZ_COMPAT_OUT to a fresh empty output directory}
image=ghcr.io/gitroomhq/postiz-app@sha256:7eb4a553507ce3f200deff2ec0211ab3cf834ba19eb44dd68e83ccc236509feb
mkdir -p "$out"
test -z "$(ls -A "$out")"
docker run --rm --network=none --cpus=1 --memory=1g --entrypoint sh \
  --mount "type=bind,src=$root,dst=/candidate,readonly" \
  --mount "type=bind,src=$out,dst=/results" \
  -e DATABASE_URL=postgresql://offline:offline@127.0.0.1:1/offline \
  "$image" -ec '
    cp /candidate/libraries/nestjs-libraries/src/database/prisma/schema.prisma /app/compatibility.prisma
    cd /app
    node_modules/.bin/prisma generate --schema compatibility.prisma
    cp -a node_modules/.prisma/client /results/generated-client
  '
docker run --rm --network=none --cpus=1 --memory=1g --entrypoint sh \
  --mount "type=bind,src=$root,dst=/candidate,readonly" \
  --mount "type=bind,src=$out,dst=/results" \
  --mount "type=bind,src=$out/generated-client,dst=/app/node_modules/.prisma/client,readonly" \
  -e NODE_PATH=/app/node_modules -e COMPAT_MENU_HTML=/results/menu.html \
  "$image" -c 'node --test /candidate/tests/compatibility/*.test.cjs'
