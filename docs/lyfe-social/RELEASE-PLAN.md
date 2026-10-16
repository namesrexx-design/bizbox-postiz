# Review plan — do not merge or deploy

This task produces source, a frontend preview and phone QA. The full release image and full-service startup below require a separate release task. No old PR #1 payload or bind overlay is used.

## Verified Live baseline (read-only, 2026-10-16)

- Host: Live Studio `2.28.123.22`, service/container `postiz`, base `/srv/lyfe/postiz/docker-compose.yml`.
- Base compose SHA256: `4eca24a546c494f2b4151d01035e7207300f6993960b90b80a4104f6ccd4f90f`.
- Current image: `ghcr.io/gitroomhq/postiz-app:v2.25.0`; immutable rollback digest `sha256:7eb4a553507ce3f200deff2ec0211ab3cf834ba19eb44dd68e83ccc236509feb`.
- Keep `postiz_postiz-config` at `/config`, `postiz_postiz-uploads` at `/uploads`, the existing `.env`, network and all datastore/Temporal volumes.
- Startup currently calls root `pnpm run pm2`, which reaches `pm2-run` and `prisma-db-push`. Both proposed recipes explicitly select only the three app package scripts; neither calls schema push.

## Prepare on Production, after release review

Pin the exact reviewed release commit (including w2 changes only after their own review). PR #3 overlaps the three `/agents` page/layout files: the combined revision must retain this PR's LYFE Social metadata and PR #3's owner-room redirects. Validate the combined frontend and backend, not either PR in isolation. The branding code reviewed here begins at `288dd5a746b951044ce2bf9ccea535ad1ece38f3`; use the final approved release revision rather than a floating branch. Recheck the baseline above and stop if it drifts.

Export that revision as `source/` in an isolated build context. Build with the checked-in `deploy/lyfe-social/Dockerfile.review`, the same revision as `RELEASE_REV`, and `NEXT_PUBLIC_SOURCE_CODE_URL=https://github.com/namesrexx-design/bizbox-postiz/tree/<full-reviewed-revision>`. The recipe checks the dependency lock, regenerates Prisma 6.5's client from that exact schema inside the new image, and rebuilds frontend, backend and orchestrator; the email changes need all relevant processes rebuilt. Client generation uses a dummy local URL and does not connect to or change a database. No dependency install runs.

```sh
docker build --network=bridge --cpuset-cpus=0,1 --memory=5g \
  -f /path/to/reviewed/deploy/lyfe-social/Dockerfile.review \
  --build-arg RELEASE_REV="$RELEASE_REV" \
  --build-arg NEXT_PUBLIC_SOURCE_CODE_URL="https://github.com/namesrexx-design/bizbox-postiz/tree/$RELEASE_REV" \
  -t bizbox-postiz:lyfe-social-2452 "$RELEASE_CONTEXT"
```

Run that build with sufficient reserved RAM under the shared heavy-job lock and test the full image in an isolated stack with test data and outbound sends disabled before a release window. Check app/backend/orchestrator startup, authenticated calendar/settings/media, email rendering and source links. The current branding preview is frontend-only and does not certify this full-service release recipe. The lock shim permits three simultaneous jobs; reserve its three slots when exclusive capacity is required, as coordinated by the lead.

The main-based schema includes fields absent from the cached v2.25.0 schema (`Integration.customName`, `Post.batchId`). Read-only release review must establish that the Live database is compatible with the combined application before any app replacement. Generating the client does not establish database compatibility or authorize a schema push.

Store the finished image archive in StorageBox, preserve the original image, and transfer/load only the reviewed image on Live Studio. Preserve original compose and `.env` privately; no secrets enter Git. Configure `EMAIL_FROM_NAME="LYFE Social"` through the existing secret setter at release time; keep the old value for rollback. Capture connected-channel and scheduled/draft state privately and choose a window clear of publication deadlines.

Registration currently retains upstream `postiz.com` Terms/Privacy links. The lead/Counsel must supply operator-approved policy URLs and review that registration flow before release; this branding task does not invent or replace legal terms.

## App-only release command, after separate authorization

Install the two reviewed compose recipes in `/srv/lyfe/postiz/branding/2452/`. Do not change the base file or its volumes. With the reviewed image already loaded:

```sh
cd /srv/lyfe/postiz
docker compose -f docker-compose.yml -f branding/2452/compose.review.yml \
  up -d --no-deps --no-build --pull never --force-recreate postiz
```

Only the app container is recreated. Nginx/frontend/backend/orchestrator briefly restart; datastore and Temporal containers remain running. Verify `/auth/login` and `/api/auth/can-register` return 200, signed-out protected API calls return 401, all three app processes are healthy, phone layout/icons/source URL match the release, and stored channels/drafts/scheduled content are unchanged. Never submit a test post to a real account.

## Roll back

Restore the prior `EMAIL_FROM_NAME` through the secret setter, then use the original base plus rollback file alone:

```sh
cd /srv/lyfe/postiz
docker compose -f docker-compose.yml -f branding/2452/compose.rollback.yml \
  up -d --no-deps --no-build --pull never --force-recreate postiz
```

Roll back for startup/health failures, missing authenticated screens, broken source/assets, or unexpected channel/queue changes. Repeat baseline health and content-state checks. No schema push, database rollback, volume deletion or image pruning. Keep both images and configuration snapshots until release acceptance.
