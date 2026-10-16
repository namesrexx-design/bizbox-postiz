#!/usr/bin/env bash
set -euo pipefail
repo_dir=$(cd "$(dirname "$0")/../.." && pwd)
run_id=${PROFILE_TEST_RUN_ID:-8593-$(date -u +%Y%m%dT%H%M%S)-$$}
fixture_dir=${PROFILE_TEST_OUTPUT:-/mnt/work/8593-profile-tests/$run_id}
app_image=${PROFILE_TEST_IMAGE:-bizbox-postiz:lyfe-pr6-1bac9b61-2452-retry1}
network_name="profile-test-$run_id"
db_name="profile-db-$run_id"
mkdir -p "$fixture_dir/pgdata"
# Only this newly-created disposable database is used. No caller DATABASE_URL accepted.
docker network create --internal "$network_name" > "$fixture_dir/network.txt"
docker run -d --name "$db_name" --network "$network_name" --network-alias profile-test-pg \
  --memory=192m --cpus=1 -e POSTGRES_USER=profile_test -e POSTGRES_DB=profile_test \
  -e POSTGRES_HOST_AUTH_METHOD=trust --mount "type=bind,src=$fixture_dir/pgdata,dst=/var/lib/postgresql/data" \
  postgres:16-alpine > "$fixture_dir/container.txt"
trap 'docker stop "$db_name" > "$fixture_dir/stopped.txt"' EXIT
for attempt in {1..30}; do
  if docker exec "$db_name" pg_isready -U profile_test -d profile_test >/dev/null; then break; fi
  sleep 1
done
docker run --rm --name "profile-run-$run_id" --network "$network_name" --cpus=1 --memory=768m \
  --mount "type=bind,src=$repo_dir,dst=/src,readonly" --mount "type=bind,src=$fixture_dir,dst=/results" \
  -e DATABASE_URL=postgresql://profile_test@profile-test-pg:5432/profile_test \
  -e NODE_PATH=/app/node_modules -e PROFILE_FIXTURE_DATABASE=profile_test \
  --entrypoint sh "$app_image" -c '
    set -eu
    cd /app
    node_modules/.bin/prisma db push --skip-generate --schema /src/libraries/nestjs-libraries/src/database/prisma/schema.prisma > /results/schema.log 2>&1
    node --test /src/tests/facebook-profile/lane.test.cjs > /results/tests.tap 2>&1
  ' || { cat "$fixture_dir/schema.log" "$fixture_dir/tests.tap"; exit 1; }
cat "$fixture_dir/tests.tap"
printf 'Retained fixtures: %s\n' "$fixture_dir"
