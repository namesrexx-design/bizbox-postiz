# Facebook profile lane — task 8593

This implements PR507 `tools/facebook-profile-publisher/POSTIZ-LANE.md` without
changing the Windows publisher wire contract. Postiz remains the only queue.
Nothing here schedules a Facebook post. The PC still checks the exact Rexx
approval, ownership, expiry/revocation, media bytes and native Scheduled readback.
An organization API key alone is not a publish approval.

The dedicated integration has reserved internal ID `bizbox:facebook-profile:v1`,
name **Facebook profile (PC)**, the existing Facebook icon/provider identifier and
an inert external-only token. It cannot be an OAuth Page or acquire a Page token.
No existing integration is converted. The calendar uses its existing DRAFT display;
a future native schedule stays DRAFT with `settings.bizboxFacebookProfile.native`
and `releaseURL`, never `releaseId`, `QUEUE` or `PUBLISHED`.

## Endpoints

All three routes use the existing PublicAuthMiddleware and authenticated org,
never a caller-supplied organization ID. Disabled organizations return 404.

- `POST /public/v1/facebook-profile/lane`: idempotently provisions the reserved
  integration; returns `{integrationId,name,draftOnly:true}`. Feed this exact ID to
  W2's Studio/PC configuration. Never reuse a Facebook Page integration ID.
- `GET /public/v1/facebook-profile/capabilities`: PR507's exact version-1 boolean
  object, only when allowlisted, both ALWAYS database guards exist and an active
  dedicated lane exists. Missing guards return 503; missing lane returns 404.
- `PUT /public/v1/facebook-profile/posts/:id/result`: PR507's unchanged body;
  organization/integration-scoped `FOR UPDATE`, exact frozen batch/item/media/time
  verification, idempotent scheduled result, conflicting result 409, missing or
  cross-org/wrong-lane ID 404. Saves only JSON-text settings + releaseURL, verifies
  saved data, commits, returns the saved post. GET `/posts` now includes `image`.

POST `/posts` accepts a single exact profile draft; no short links, tags, recurring
jobs, comments, edits or prepopulated native proof. Staging serializes on an org
advisory transaction lock and reconciles the exact approval/item on retry. Mixed
batches are refused before writes. Ordinary providers follow the existing path.
The PC independently downloads and verifies media SHA256/size; the Postiz field is
exact saved-media readback, not a claim that the server downloaded those bytes.

## Reviewed rollout (not executed by this PR)

1. Keep accepted healthy Live image/container, volumes, original snapshots and
   root-only Env/member/media/session records. Do not rebuild or recreate Live
   during this source review. Build/test a separate candidate on Production only
   after coordination; exercise the scratch-PostgreSQL checks below and the
   existing backend/provider checks. No owner-PC Schedule action is authorized.
2. Back up the database and record schema, original image/probe/Env/volumes,
   integration/post/publishDate state. Apply `install-guard.sql` in a maintenance
   transaction with `psql -v ON_ERROR_STOP=1`; it installs functions/triggers only
   and rewrites no original row. Database guard comes BEFORE lane provisioning.
3. Ship the reviewed backend together with that guard using the existing reviewed
   app-only release plan. Preserve complete healthcheck, Env, mounts, image/source
   binding and rollback originals. No ad hoc Live container recreation.
4. Add only the approved organization ID to `FACEBOOK_PROFILE_ORGANIZATIONS` in
   private server Env. Default unset disables the extension. Install/reuse that
   organization's Postiz API key only in private Studio/PC config, never in docs,
   room, source, shared ZIP or logs. W2 supplies the owning worker's scoped Agent
   Room token; the server's shared/root room key never goes to the PC.
5. Authenticate POST `/facebook-profile/lane`; give its returned integration ID to
   W2. Probe capabilities with the same key. Check other-org/missing-key denial,
   exact draft readback, blocked native status/date/settings edits and conflicting
   native results against isolated fixtures before enabling W2's trigger. W3
   independently checks source/runtime. Keep Windows scheduling disabled until
   the remaining owner-PC integration/approval gates pass.
6. Recheck current original provider/post data, publishDate and healthy probes.
   No existing Page/integration/media data is migrated by this feature.

Rollback: remove the organization allowlist first and stop the Studio/PC publisher
through its existing disable switch. Restore the prior reviewed application image
and Env through the existing release operator, preserving its probe and originals.
Retain the database guards and all lane drafts/results as reconciliation history;
the older app cannot promote them. Never remove guards while a reserved lane or
native schedule exists, and never clear proof or retry a native schedule blindly.
If guard installation fails, transaction rollback leaves both prior guards intact;
capabilities fail closed until installation succeeds.

## Production-only checks

`node --test tests/facebook-profile/*.test.cjs` runs actual transpiled production
contracts, service and controller against a disposable PostgreSQL database (see
`tests/facebook-profile/run.sh`). The runner uses existing cached Postiz and
PostgreSQL images, starts no compiler/browser/publisher, publishes no port, uses no
Live secrets and retains its scratch database until explicitly removed. It tests
real transactions/locks/SQL guards, HTTP auth routing and positive/negative result
readback. Configure the cached image variable if its tag differs locally.
