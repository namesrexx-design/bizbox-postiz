#!/bin/bash
set -euo pipefail
src=${POSTIZ_REVIEW_SRC:-/srv/lyfe/work-social-combined-2519-20261016}
out=${POSTIZ_REVIEW_OUT:-/srv/lyfe/pods/social-media-w2}/generated-prisma
mkdir -p "$out"
docker run --rm --name social-media-w2-prisma-codegen --cpus=1 --memory=1g --network=none --entrypoint sh \
 -e DATABASE_URL=postgresql://qa:qa@127.0.0.1:9/qa \
 --mount type=bind,src="$src/libraries",dst=/app/libraries,readonly \
 --mount type=bind,src="$out",dst=/qa-prisma \
 --workdir /app ghcr.io/gitroomhq/postiz-app@sha256:7eb4a553507ce3f200deff2ec0211ab3cf834ba19eb44dd68e83ccc236509feb \
 -c 'node_modules/.bin/prisma generate --schema libraries/nestjs-libraries/src/database/prisma/schema.prisma && cp -a node_modules/.prisma/client/. /qa-prisma/'
