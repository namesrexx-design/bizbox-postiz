#!/bin/bash
set -euo pipefail
src=${POSTIZ_REVIEW_SRC:-/srv/lyfe/work-social-combined-2519-20261016}
out=${POSTIZ_REVIEW_OUT:-/srv/lyfe/pods/social-media-w2}
image=bizbox-postiz:candidate-345426c-v2.25.0
backend_status=0
frontend_status=0
# Caller holds slot1, slot2, slot3 exclusively, after w1 releases its build.
docker run --rm --name social-media-w2-combined-backend --cpus=2 --memory=4g --network=none --entrypoint sh \
 -e NODE_ENV=production -e NODE_OPTIONS=--max-old-space-size=3072 \
 --mount type=bind,src="$src/apps/backend",dst=/app/apps/backend,readonly \
 --mount type=bind,src="$src/libraries",dst=/app/libraries,readonly \
 --mount type=bind,src="$out/combined-backend-prisma-build",dst=/app/apps/backend/dist \
 --mount type=bind,src="$out/generated-prisma",dst=/app/node_modules/.prisma/client,readonly \
 --workdir /app/apps/backend "$image" \
 -c '../../node_modules/.bin/tsc --project tsconfig.build.json' > "$out/combined-backend.log" 2>&1 || backend_status=$?

printf "backend_exit=%s\n" "$backend_status" > "$out/combined-backend-status.txt"
exit "$backend_status"
