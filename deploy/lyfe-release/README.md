> Proposed repin only. Start with [HANDOFF.md](HANDOFF.md). W1 retains the
> complete refreshed 232-file baseline and active inputs. Integrate after exit
> and W3 CHECK, then coordinate a new shared window before execution.

# Task 2452/2519: guarded image build and isolated rehearsal

This is operator preparation, not a release image or a startup PASS. The selected
application source remains `1bac9b61be8a30dea31b7cdac4a76bf1f51f5229` in
`/mnt/work/2452-release/w2/bear-bull-ico-context-9198`. These external operator
helpers do not change that application's source offer or rebuild the old preview.
Existing owner approval `appr_mvabgkmsa61a518f` is approved; do not duplicate it.

## Current gates and owners

- Capacity: the purchased local `/mnt/work` volume is available; Docker and
  containerd remain on root. Historical 98%/8.5-GiB observations are superseded.
  Remeasure the unchanged below-90% / 40-GiB / RAM gates on every execution.
  No purchase, resize, cleanup or Docker migration is part of this proposal.
- Social lead: grant the single build all three real shared slots after recovery.
  The script uses `/usr/bin/flock`'s kernel locks directly through `fcntl`, never
  the three-slot `flock` shim, and refuses to queue behind an occupied slot.
- W1: build the exact full image, verify emitted URLs/source/compiled apps, then
  run the isolated rehearsal below. This proposal does not certify a PR6 image.
- Destination: [BizBox #480](https://github.com/namesrexx-design/bizbox/pull/480) is merged
  and published. [W3 final CHECK PASS](https://github.com/namesrexx-design/bizbox/pull/480#issuecomment-6209738514)
  verifies checkpoint `6ad1c56c4de26e549df4a3c8` at platform revision
  `0893533de58ca704f884fe3d911a84d3d2d68286` and real signed-in phone navigation.
  Saved Main → Social, manual Main, mounted query changes, unknown/malformed
  fallback, missing-pass 401 and no page errors pass. See HANDOFF.md for archive.
- W3: independently check this preparation; later check the actual image/startup
  and final Live title/auth/source/channels/LinkedIn once an artifact exists.

The PR6 schema metadata comparison already passes for the compared 85 models,
989 columns, 262 indexes and 11 enums. It does not cover foreign-key actions,
index predicates/operator classes or runtime behavior. Do not run schema push,
migrations or root `pnpm run pm2` to fill any gap.

## Exact guarded compiler command

Run from this directory on Production. Planning and the refusal-path test are
read-only; they start no compiler or application:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 test-preparation.py
PYTHONDONTWRITEBYTECODE=1 python3 guarded-build.py
```

After the lead explicitly assigns this build the shared slot, run:

```sh
LYFE_RELEASE_SLOT_GRANTED=2452-pr6-1bac9b61-three-slots \
  PYTHONDONTWRITEBYTECODE=1 python3 guarded-build.py --execute
```

The script verifies the pinned source archive, every extracted source file,
absence of extra files, the reviewed Dockerfile and all build arguments. It
requires root utilization **below 90%**, at least **40 GiB available** on Docker's
filesystem, and **5 GiB MemAvailable**. Remeasure available space; do not reuse historical capacity snapshots.
40 GiB is an operator allowance, not a measured final image size. Both gates are
rechecked after acquiring the three real slots. During compilation, disk checks
every two seconds request build cancellation at 89% to leave margin before 90%;
concurrent host activity still requires supervision. If cancellation does not
complete in 30 seconds, inspect Docker before retrying.

The exact command is printed in plan output. It selects the installed **legacy
Docker builder** (`DOCKER_BUILDKIT=0`), whose memory flags are available on this
host, with a **4608 MiB hard memory/no-swap cap**, 2 CPUs and the recipe's 3072 MiB
V8 heap/one Next worker. It builds frontend/backend/orchestrator sequentially.
No dependency install, root startup or database access occurs. Network is enabled
only for the existing font download during compilation; no Live env is supplied.
The base image is already cached; no `--pull` is used. Existing failed layers and
containers are retained according to Docker's default failure behavior.

Result and log: `/mnt/storagebox/social-media/9476-pr6-canonical-repin/build-output/release-image.id` and
`full-image-build.log`. Existing result/log files are never overwritten.
The mutable tag is for discovery only; subsequent commands use the recorded ID.

Before starting any application, inspect that image's label and environment for
PR6 and production `https://social.biz-box.io/api`; run a **network-none one-shot
Node inspection** (override entrypoint) to check:

1. Matching source archive SHA256
   `3b5a9c8566327db43d400976026794b095166637170904c4c97c6e25b8994286`.
2. Frontend `.next/BUILD_ID`, backend
   `/app/apps/backend/dist/apps/backend/src/main.js`, and orchestrator
   `/app/apps/orchestrator/dist/apps/orchestrator/src/main.js` exist.
3. Emitted frontend chunks contain the production API and exact source-download
   URL, and contain no `http://127.0.0.1:4027/api` fixture URL.
4. Generated Prisma schema equals the packaged PR6 source schema.
5. Image startup is the explicit three-package app-only command; root `pm2-run`
   remains excluded. Record the immutable image ID and results in PR3.

## Isolated startup and rollback procedure (not yet executed)

This rehearsal runs on **Production**, never on Live. It needs the final image,
the same below-90%/40-GiB disk clearance, all three reserved slots, and at least
**7.5 GiB MemAvailable**: app 4.5 GiB + PostgreSQL 0.5 + Redis 0.125 + Temporal 1
+ Temporal PostgreSQL 0.5 + SMTP 0.0625 + host headroom. Baseline and candidate
must never run concurrently. All supporting images are pinned to digests actually
read from Live's cached image inventory; `pull_policy: never` prevents an
unreviewed pull. If absent on Production, stage those exact images only after
capacity clearance; do not start the app to discover missing dependencies.

First prepare **schema only**, no rows, with this read-only Live command. Keep
the fixture and patch files under a root-only StorageBox directory. A schema-only
fixture restores the existing schema into a new isolated test DB; it does not
change Live or apply a new candidate schema.

```sh
set -euC
umask 077
PRIVATE=/mnt/storagebox/social-media/9476-pr6-canonical-repin/build-output/private-rehearsal
readonly CAPTURED_INPUT=/mnt/work/2452-release/w1/private-rehearsal
mkdir -p "$(dirname "$PRIVATE")"
# Existing output, including a partial failed capture, requires reconciliation.
mkdir -m 700 "$PRIVATE" || exit 1
ssh root@2.28.123.22 'docker exec postiz-postgres sh -c '\''exec pg_dump --schema-only --no-owner --no-acl -U "$POSTGRES_USER" -d "$POSTGRES_DB"'\''' > "$PRIVATE/schema.sql"
# The mounted file must be readable by the isolated postgres UID; parent stays 0700.
chmod 644 "$PRIVATE/schema.sql"
PROVIDER=/app/apps/backend/dist/libraries/nestjs-libraries/src/integrations/social/linkedin.provider.js
ssh root@2.28.123.22 "docker exec postiz cat '$PROVIDER'" > "$PRIVATE/linkedin.current.js"
ssh root@2.28.123.22 "docker exec postiz cat '$PROVIDER.bak-20261016'" > "$PRIVATE/linkedin.bak-20261016"
```

Run these steps in the same operator shell. Writable captures and phase output
use new PR7 directories and refuse an existing directory/record on retry. The
W1 captured-input reference is used only for the frontend/Prisma tar reads;
no command redirects into it. Preserve any partial output for reconciliation.

Verify the active provider SHA256 is
`b603943dbf2e33442d07888cb37b913edc65a606baad4fcf4bdff72b72683e74`;
the backup must be
`3cbec7c62ca7cbfc82f786ada3924339e8cb49d05aa81bb6afeea0caaec646c1`.
Changed fingerprints require reconciliation before rehearsal. No `.env`, token,
channel row, schedule, queue or whole Live container snapshot is copied here.

```sh
export REHEARSAL_SCHEMA_SQL="$PRIVATE/schema.sql"
docker compose -f compose.rehearsal.yml config --quiet
docker compose -f compose.rehearsal.yml up -d postgres redis temporal-postgresql temporal smtp
docker compose -f compose.rehearsal.yml create baseline
docker cp - lyfe2452-baseline:/app/apps/frontend < "$CAPTURED_INPUT/live-post-hotpatch-frontend.tar"
docker cp - lyfe2452-baseline:/app/node_modules/.prisma < "$CAPTURED_INPUT/live-post-hotpatch-prisma.tar"
docker cp "$PRIVATE/linkedin.current.js" "lyfe2452-baseline:$PROVIDER"
docker cp "$PRIVATE/linkedin.bak-20261016" "lyfe2452-baseline:$PROVIDER.bak-20261016"
docker compose -f compose.rehearsal.yml start baseline
```

These commands create only `lyfe2452-*` resources, an **internal** Docker network,
new synthetic DB/Redis/Temporal queues and fresh named config/uploads volumes.
The pinned Temporal 1.28.1 image supplies `config/dynamicconfig/docker.yaml`;
`development-sql.yaml` is absent and makes the server exit before readiness.
The static configuration mirrors Live's maximum ID length and search-cache
refresh settings. `SKIP_ADD_CUSTOM_SEARCH_ATTRIBUTES=true` leaves the SQL Text
attribute slots available for the app. If a failed run already added example
attributes, retain that Temporal database/container and use fresh isolated
Temporal persistence; do not delete its original state.
The baseline has no `depends_on`, so `compose create baseline` selects only that
app; the installed Compose CLI does not accept `create --no-deps`.

The baseline supplies a synthetic `NEXT_PUBLIC_BACKEND_URL`; omitting it crashes
the stock backend's upload-widget initialization. All app starts initialize PM2
once, then start frontend/backend/orchestrator sequentially. This avoids concurrent
daemon initialization losing two of the apps. The production helper retains its
accepted environment merge with the same corrected startup command.

On the reviewed Docker host, the internal bridge leaves published port 4052
inactive. Keep the app attached only to the internal network and run the guarded
host TCP relay after each app starts:

```sh
readonly REHEARSAL_OUTPUT=/mnt/storagebox/social-media/9476-pr6-canonical-repin/build-output/phase-output
mkdir -p "$(dirname "$REHEARSAL_OUTPUT")"
# Never reuse a directory containing retained phase records.
mkdir -m 700 "$REHEARSAL_OUTPUT" || exit 1
start_rehearsal_relay() {
  phase=$1
  case "$phase" in baseline|candidate|restored) ;; *) return 1 ;; esac
  if [ -e "$REHEARSAL_OUTPUT/lyfe2452-$phase-proxy.json" ] || [ -e "$REHEARSAL_OUTPUT/$phase-relay.log" ]; then
    echo "Relay phase already recorded; reconcile before retry" >&2
    return 1
  fi
  (
    set -C
    exec node loopback-proxy.cjs "lyfe2452-$phase" "$REHEARSAL_OUTPUT" > "$REHEARSAL_OUTPUT/$phase-relay.log" 2>&1
  ) &
  RELAY_PID=$!
}
start_rehearsal_relay baseline || exit 1
BASELINE_RELAY_PID=$RELAY_PID
```

The relay validates the running rehearsal name, single internal attachment and
loopback-only binding; it forwards raw TCP only from `127.0.0.1:4052` to that
container's nginx port. No host/external network is added to the app. Stop this
relay when stopping baseline, then launch the same helper for candidate and
restored with their respective names/PIDs. `stop-loopback-proxy.py` validates the
recorded PID's actual command and app name before stopping it; it does not delete
the relay record. Stop the final relay during cleanup.
Only app port `127.0.0.1:4052` is published. SMTP is a non-relaying Mailpit sink
with synthetic credentials; no external email/social/provider secrets are used.
Never combine this file with Live compose or join any existing network. Verify
the internal network setting before starting; the clone helper also enforces it.
Wait for the isolated DB and Temporal to become ready; do not continue if any
baseline app process fails. No schema-pushing retry is permitted.

Once the patched baseline has stable frontend/backend/orchestrator processes,
healthy `/auth/login`, `/api/auth/can-register` and orchestrator
`http://127.0.0.1:3002/health/status`, preserve its complete writable layer:

```sh
PRIVATE_ARCHIVE=/mnt/storagebox/social-media/9476-pr6-canonical-repin/build-output/private-snapshot
mkdir -m 700 "$PRIVATE_ARCHIVE" || exit 1
ROLLBACK_IMAGE=$(docker commit lyfe2452-baseline lyfe2452-private:baseline)
docker image save "$ROLLBACK_IMAGE" > "$PRIVATE_ARCHIVE/isolated-baseline.private.tar"
docker stop lyfe2452-baseline
python3 stop-loopback-proxy.py lyfe2452-baseline "$REHEARSAL_OUTPUT"
RELEASE_IMAGE=$(cat /mnt/storagebox/social-media/9476-pr6-canonical-repin/build-output/release-image.id)
python3 rehearsal-clone.py --source lyfe2452-baseline --image "$RELEASE_IMAGE" --name lyfe2452-candidate --execute
docker start lyfe2452-candidate
start_rehearsal_relay candidate || exit 1
CANDIDATE_RELAY_PID=$RELAY_PID
```

The helper refuses Live names, external networks, host binds, non-synthetic DB
endpoints, non-loopback ports and a running source container. It creates a stopped
app and retains the original. **It merges new image environment defaults with old
runtime values, then takes release-source settings from the new image.** The
earlier handoff copied old `Config.Env` directly, dropping the new image's
`RELEASE_SOURCE_REVISION` and causing authenticated source download to return 503.
The same merge order is now applied in
[PR3's complete runnable production handoff](https://github.com/namesrexx-design/bizbox-postiz/blob/833fd239532891b2c41dac022850c891b90d47b3/docs/social-lyfe/operator-handoff-2519.md).
Use the adjacent canonical `create-app-only.py`, derived from that corrected
handoff with the reviewed PM2 prewarm/sequential-startup delta, instead of the
historical helper in the unchanged PR6 archive. Its environment merge is retained.
Use the linked operator handoff's private preservation and rollback procedure.

The equivalent replacement for an older `create-app-only.py`, immediately after
its `payload.update`, is below. This adds no Live write during preparation; it
changes the future create request only. The regression in
`test-preparation.py` exercises this same merge order for forward and rollback.

```python
defaults = dict(item.split('=', 1) for item in json.loads(
    subprocess.check_output(['docker', 'image', 'inspect', image])
)[0]['Config'].get('Env', []))
effective = dict(defaults)
effective.update(dict(item.split('=', 1) for item in cfg.get('Env', [])))
for key in ('RELEASE_SOURCE_REVISION', 'RELEASE_SOURCE_ARCHIVE', 'NEXT_PUBLIC_SOURCE_CODE_URL'):
    effective.pop(key, None)
    if key in defaults:
        effective[key] = defaults[key]
payload['Env'] = [f'{key}={value}' for key, value in effective.items()]
```

Required acceptance on the candidate, with all calls routed to loopback:

- `nginx -t`; stable PM2 `frontend`, `backend`, `orchestrator`, not merely
  initial `online`. Observe restart counts/logs over at least 60 seconds.
- `/auth/login` 200 with LYFE Social title, `/api/auth/can-register` 200, anonymous
  exact source route 401; orchestrator `/health/status` 200.
- Register `rehearsal@example.invalid` through `/api/auth/register` using
  `{provider:"LOCAL",password:"synthetic-password",email:"rehearsal@example.invalid",company:"Rehearsal"}`.
  Verify the activation email in the internal Mailpit API, including LYFE styling;
  activate through `/api/auth/activate` with that email's code. Login must return
  a real synthetic session. Use it to fetch the exact source archive and compare
  SHA256/headers; wrong revision must return 404. Never copy a Live session.
- Exercise one email through the application's Temporal `sendSingleEmailWorkflow`
  on the isolated `main` queue and verify receipt in Mailpit. Registration's
  synchronous email alone does not cover the worker/email queues.
- Check actual candidate LinkedIn compiled provider scope/member mapping with
  fixtures, disabled Copilot 503, and phone auth/editor/source. Browser requests
  to the compiled production API URL must be intercepted and fulfilled through
  `127.0.0.1:4052`, with every other external request aborted before navigation.
  An ordinary local browser page could otherwise request the Live API.
- Compare before/after isolated application schema dumps: no app schema change.
  All rows written during registration are synthetic and remain isolated.

Then rehearse app-only rollback, retaining both prior containers:

```sh
docker stop lyfe2452-candidate
python3 stop-loopback-proxy.py lyfe2452-candidate "$REHEARSAL_OUTPUT"
python3 rehearsal-clone.py --source lyfe2452-baseline --image "$ROLLBACK_IMAGE" --name lyfe2452-restored --rollback --execute
docker start lyfe2452-restored
start_rehearsal_relay restored || exit 1
RESTORED_RELAY_PID=$RELAY_PID
```

Read back both provider fingerprints in `lyfe2452-restored`, all three stable app
processes, previous login/API behavior and unchanged synthetic state/queues.
The complete private image supplies the patch and backup; no stock rollback or
schema operation is used. Stop the rehearsal apps/services after QA; preserve
containers, volumes and private snapshot for review. Do not run `down -v`, prune,
delete originals, or restart Live during this preparation.

```sh
docker stop lyfe2452-restored
python3 stop-loopback-proxy.py lyfe2452-restored "$REHEARSAL_OUTPUT"
docker compose -f compose.rehearsal.yml stop
```

If a failed-run replacement used a separate named support container, stop that
owned replacement too. Retain it and its original database/volume for review.

Only after independent image/startup/rollback PASS and #480 publication may w1
perform the separately approved Live cutover. Re-read approval then preserve the
original container, effective env, complete private snapshot, active provider and
backup, exact networks, both named volumes and channels. Complete snapshots with
Live effective env remain root-only on Live, never in public artifacts or shared
StorageBox unencrypted. Live startup and rollback must both use the explicit
app-package command and the corrected environment merge. W3 then checks the
actual deployed container/revision/title/link and read-only account state.
