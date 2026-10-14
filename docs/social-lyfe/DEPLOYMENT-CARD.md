# Approval card: Social LYFE calendar branding

**Decision requested after Master review: Approve deployment / Send back.**
**Status: awaiting review; NOT approved or deployed.** Rexx requested the rebrand; this card is the separate concrete deployment decision requested by Master in Agent Room #1498.

## What changes

Social LYFE name and existing LYFEY cloud artwork on sign-in, sidebar, titles, logout, browser and touch icons. Existing account connections and scheduled content are retained.

- Tested product source: b1d62f8fc2672d85e4a45b2ac8f7b426dfe6a339.
- Existing PR: https://github.com/namesrexx-design/bizbox-postiz/pull/1
- Exact branding diff: https://github.com/namesrexx-design/bizbox-postiz/compare/345426c123b1109b0937155c3a8f5aafdc02d824...b1d62f8fc2672d85e4a45b2ac8f7b426dfe6a339
- PR base is the earlier lane-D candidate. The compiled frontend also includes that candidate's calendar-midnight, settings-keyboard and media-recovery fixes. **Master must explicitly disposition that base before release.** This is not a claim those fixes already run Live.
- Approved source artwork: namesrexx-design/bizbox public/media/start/lyfey-awake.png; SHA256 99229f0bd4d18b910ca24e728edf895cb8af867211d88f418ee4ec82ad09701c.
- Actual shipped logo: apps/frontend/public/social-lyfe.png; SHA256 d35aea622bf27b2deac19ab6873e049eb79c3980c4b6952ed7601ffd6d326c27.
- No new generated artwork. Postiz/AGPL attribution and matching-source links remain.

## Exact artifact and installation diff

Private Production artifact:
 /srv/lyfe/work-social-lyfe-brand-20261014-evidence/social-lyfe-b1d62f8f-payload.tar.gz

68,781,726 bytes; SHA256 a2cda93f15cfcd522571829a74ae7d12e22bd9df9400bff1d3e74e268deb37d2.
Build ID z5BJWjAcENVhQ94Nt_VRp. Contains compiled frontend, four brand assets, source manifest and 1,850 runtime-file hashes. No credentials, dependencies or source footage.

Deploy recipe: ../../deploy/social-lyfe/compose.social-lyfe.yml. Rollback recipe: ../../deploy/social-lyfe/compose.rollback.yml.

Both retain the CURRENT Live app image:
 ghcr.io/gitroomhq/postiz-app@sha256:7eb4a553507ce3f200deff2ec0211ab3cf834ba19eb44dd68e83ccc236509feb

The release overlays five read-only bind mounts under /srv/lyfe/postiz/branding/releases/b1d62f8f: frontend runtime, logo, touch icon and two favicon files. It replaces only app startup with nginx + existing workspace PM2 starts. **Vendor pm2-run is excluded because its actual command runs prisma-db-push.** No database migration, datastore recreation, new provider/credential or environment-secret change.

Current original Live compose SHA256:
 4eca24a546c494f2b4151d01035e7207300f6993960b90b80a4104f6ccd4f90f.

## Restart impact

Recreate only service postiz, using the base compose plus branded override, --no-deps, --no-build and --pull never. Nginx, frontend, backend and orchestrator in that app container restart. UI/API and queue processing can briefly pause; zero downtime is NOT claimed. Datastore/Temporal containers and their existing volumes remain running. Choose an approved window clear of publishing deadlines.

Compose syntax parses. Actual full-service startup with this override is NOT tested; only the compiled frontend was run in the isolated preview. Required independent release/startup review remains a gate.

## Before any write

Master clears candidate-base and remaining review gates; Rexx taps this concrete card. Release owner rechecks current image/compose fingerprints, actual disk headroom, backend/orchestrator for unowned writable changes and service health. Stop on drift.

Capture fresh read-only receipts of connected org/channels, queue/draft IDs, dates, states, media and captions; original compose and current runtime/version. Keep existing secrets/private receipts out of Git. Verify archive hash and safe member paths. Transfer/extract only this artifact into the exact release folder; install the two reviewed override files. No execution is authorized by this document alone.

## Rollback

Use ORIGINAL base compose plus compose.rollback.yml ALONE, never the branded override. Recreate ONLY postiz with --no-deps --no-build --pull never --force-recreate. The same pinned image loads its original frontend without brand mounts; the no-migration startup remains explicit.

Restore any changed service-definition pointers to the captured configuration. Do not run stock pm2-run/prisma-db-push, prune images/volumes, revert the database or alter posts. Keep the original app image and old configuration throughout the release.

## Post-release checks and rollback triggers

- Frontend/backend/orchestrator online; login and API registration-state HTTP200; unauthenticated protected media API401. No restart loop.
- Live desktop/phone sign-in AND existing signed-in calendar/settings/media/logout branding; LYFEY images decode, no clipped controls/overflow, visible source and keyboard focus, correct title/favicon.
- Verify matching public source and deployed build ID/asset hashes.
- Compare org/channel bindings and all captured scheduled/draft IDs, date/state/media/caption values; account for naturally due publications separately. No publish/test-post action.
- Roll back immediately for failed startup/health, missing authenticated screens or unexpected account/queue/config change. Report actual results; source/build success is not deployment success.
