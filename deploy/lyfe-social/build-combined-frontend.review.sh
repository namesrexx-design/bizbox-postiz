#!/bin/bash
set -euo pipefail
src=${POSTIZ_REVIEW_SRC:-/srv/lyfe/work-social-combined-2519-20261016}
out=${POSTIZ_REVIEW_OUT:-/srv/lyfe/pods/social-media-w2}
image=bizbox-postiz:candidate-345426c-v2.25.0
frontend_status=0
head=$(git -C "$src" rev-parse HEAD)
docker run --rm --name social-media-w2-combined-frontend --cpus=2 --cpuset-cpus=0,1 --memory=5g --network=bridge --entrypoint sh \
 -e RAYON_NUM_THREADS=2 -e CIRCLE_NODE_TOTAL=2 -e NEXT_TELEMETRY_DISABLED=1 -e NODE_ENV=production \
 -e NEXT_PUBLIC_VERSION=v2.25.0 -e NODE_OPTIONS=--max-old-space-size=3072 -e IS_GENERAL=true -e STORAGE_PROVIDER=local \
 -e FRONTEND_URL=http://127.0.0.1:4027 -e MAIN_URL=http://127.0.0.1:4027 \
 -e NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4027/api \
 -e NEXT_PUBLIC_SOURCE_CODE_URL="https://github.com/namesrexx-design/bizbox-postiz/tree/$head" \
 --mount type=bind,src="$src/apps/frontend",dst=/app/apps/frontend,readonly \
 --mount type=bind,src="$src/libraries",dst=/app/libraries,readonly \
 --mount type=bind,src="$src/deploy/lyfe-social/next.review.config.js",dst=/app/apps/frontend/next.config.js,readonly \
 --mount type=bind,src="$out/combined-frontend-review-build",dst=/app/apps/frontend/.next \
 --mount type=bind,src="$out/generated-prisma",dst=/app/node_modules/.prisma/client,readonly \
 --workdir /app/apps/frontend "$image" -c '../../node_modules/.bin/next build --webpack' > "$out/combined-frontend-review.log" 2>&1 || frontend_status=$?

printf "frontend_exit=%s\nreview_sourcemaps=disabled\n" "$frontend_status" > "$out/combined-build-status.txt"
exit "$frontend_status"
