# Operator handoff — 2519 / 2452 / 2551

## Decision and exact artifacts

**Do not deploy.** The existing release card `appr_mvabgkmsa61a518f` is pending.
No second card, compiler or live write is requested by this handoff.

Accepted combined source:
[`7ddf86821b6e0ac2b42731d7d15f3e72dce5cfe3`](https://github.com/namesrexx-design/bizbox-postiz/tree/7ddf86821b6e0ac2b42731d7d15f3e72dce5cfe3).
Both backend and frontend review compiles exit 0; 21 focused tests and independent
Chromium/WebKit phone review PASS. Synthetic fixtures block writes and do not
exercise real OAuth/accounts/posts. Earlier failed build attempts remain recorded.

Production artifacts on the builder:

- `/srv/lyfe/pods/social-media-w2/combined-backend-prisma-build`
- `/srv/lyfe/pods/social-media-w2/combined-frontend-review-build`
- `/srv/lyfe/pods/social-media-w2/generated-prisma`

**Full release image: UNBUILT. No selected deployable image digest exists.**
The public toolchain digest below is the upstream build dependency, not a new
release. The preview is frontend-only with synthetic API, embeds localhost API
URLs, and must not be copied to Live. The checked-in `Dockerfile.review` is an
unexecuted full-image recipe; no full nginx/frontend/backend/orchestrator startup
has been certified. A later explicitly scheduled build must use the real release
API/source URLs and a schema-compatible source, then produce and review its own
immutable image digest. No additional compiler is authorized for this task.

## Prerequisites the lead must clear

1. Release [BizBox #480](https://github.com/namesrexx-design/bizbox/pull/480) first.
   It is currently open/unmerged. Read back the published owner destination:
   saved Main opens Social on the first request; subsequent Main tap stays Main;
   unknown room falls back Main; missing owner pass remains 401. Existing local
   tests/CI/phone PASS do not establish that the destination is published.
2. Resolve the **confirmed Live schema incompatibility** through a separately
   reviewed source compatibility decision. Live lacks `Integration.customName`
   and `Post.batchId`, required by the main-based generated client. This task
   authorizes no database mutation. Do not use `prisma db push`, migrations,
   initialization, root `pm2-run` or a frontend overlay to bypass this gate.
3. Schedule a release build separately, record its immutable full-app image and
   exact matching public source offer, and run isolated full-service startup
   against test data with outbound sending disabled. Include orchestrator and
   email paths; backend TypeScript plus frontend preview are insufficient.
4. Re-read the existing approval immediately before any Live write. If approval
   changes the source, scope or image, return it to the lead for reconciliation.
   Pending approval is not permission to execute the commands below.

## Read-only Live baseline and schema check

Observed 2026-10-16 on Live Studio `2.28.123.22`:

- Container `postiz`: `cf116497fa175224f45e83fb16dead5a39e74d35e5078bf62a3eeb8c9e887f48`.
- Current image ID and pinned upstream toolchain:
  `sha256:7eb4a553507ce3f200deff2ec0211ab3cf834ba19eb44dd68e83ccc236509feb`
  (`ghcr.io/gitroomhq/postiz-app:v2.25.0`).
- Compose project/service `postiz`; `/srv/lyfe/postiz/docker-compose.yml`.
- `/srv/lyfe/postiz/.env`: root:root, mode 0600. Do not print, edit or publish it.
- Named volumes `postiz_postiz-config:/config`, `postiz_postiz-uploads:/uploads`.
- Networks `deploy_default`, `postiz_postiz`, `postiz_temporal`.
- Published app port `127.0.0.1:4007:5000`; public `https://social.biz-box.io`.
- PostgreSQL, Redis, Temporal and Temporal PostgreSQL remain untouched.

The actual read-only comparison queried `information_schema.columns` and compared
all scalar/enum fields in the candidate Prisma DMMF (85 models), without creating
a PrismaClient or connecting it to Live. Only the two columns above were missing.
Repeat after an approved compatibility resolution; this smaller query reproduces
the known failure without reading rows or displaying credentials:

```sh
# Run on Live Studio as root; metadata only.
docker exec -i postiz-postgres sh -c 'exec psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -X -v ON_ERROR_STOP=1 -At' <<'SQL'
BEGIN READ ONLY;
SELECT wanted.t || '.' || wanted.c || ':' ||
       CASE WHEN actual.column_name IS NULL THEN 'MISSING' ELSE 'present' END
FROM (VALUES ('Integration','customName'),('Post','batchId')) AS wanted(t,c)
LEFT JOIN information_schema.columns AS actual
 ON actual.table_schema='public' AND actual.table_name=wanted.t
 AND actual.column_name=wanted.c;
ROLLBACK;
SQL
```

This check establishes column presence only, not types/defaults/indexes or runtime
compatibility. The full schema and service gate must pass for the final source.

## Future approved release: preserve the current container first

These are operator instructions, **not executed**. Run as root on Live after all
prerequisites pass. Set `RELEASE_IMAGE` to the reviewed **image ID** loaded from
Production, not the old upstream/toolchain tag. Never push a snapshot containing
runtime env to a public registry. Keep the original container and immutable image.

```sh
cd /srv/lyfe/postiz
umask 077
RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)"
export ROLLBACK_NAME="postiz-rollback-$RELEASE_ID"
export ROLLBACK_DIR="/srv/lyfe/postiz/rollback/$RELEASE_ID"
mkdir -p "$ROLLBACK_DIR"
chmod 700 "$ROLLBACK_DIR"
PROVIDER=/app/apps/backend/dist/libraries/nestjs-libraries/src/integrations/social/linkedin.provider.js
docker cp "postiz:$PROVIDER" "$ROLLBACK_DIR/linkedin.provider.current.js"
docker cp "postiz:$PROVIDER.bak-20261016" "$ROLLBACK_DIR/linkedin.provider.js.bak-20261016"
cp -p docker-compose.yml "$ROLLBACK_DIR/docker-compose.yml"
ROLLBACK_IMAGE="$(docker commit --pause=true postiz "lyfe-private-rollback:$RELEASE_ID")"
export ROLLBACK_IMAGE
docker image save "$ROLLBACK_IMAGE" > "$ROLLBACK_DIR/previous-complete-app.private.tar"
# Record the matching temporary-patch source privately with these artifacts.
# The original container and private snapshot retain the complete writable layer.
```

The private rollback image/archive includes effective environment metadata and
must remain root-only on Live; never publish it, push it to a registry or copy it
to a shared archive unencrypted. The unchanged `.env` remains in place.

Preserve both provider files: `.current.js` is the active patched provider;
`.bak-20261016` is the pre-patch original. A stock image alone loses the patch.
Do not copy the pre-patch backup over the active provider. Do not alter the env
file, volumes, datastore containers or stored channels/drafts/queue. Schedule a
window clear of due posts; the isolated candidate must not duplicate workers
against the live queue before cutover.

## Future approved app-only startup

The normal compose recreate would remove the original container. Instead retain
it stopped for rollback and create only a replacement app through Docker Engine,
copying its env in memory (no values printed or placed in command arguments).
The root env file does not contain every effective runtime variable; do not
reconstruct the new app from `.env` alone. This plan intentionally avoids root
`pnpm run pm2`, which invokes schema push.

Set `RELEASE_IMAGE=sha256:<reviewed-full-app-image-ID>` before these commands.
This value is deliberately not supplied because that image does not yet exist.

```sh
: "${RELEASE_IMAGE:?no reviewed full-app image selected}"
export RELEASE_IMAGE
docker image inspect "$RELEASE_IMAGE" --format '{{.Id}}'
docker stop postiz
docker rename postiz "$ROLLBACK_NAME"
export CLONE_SOURCE="$ROLLBACK_NAME"
cat > "$ROLLBACK_DIR/create-app-only.py" <<'PYOP'
import copy, http.client, json, os, socket, subprocess
old=json.loads(subprocess.check_output(['docker','inspect',os.environ['CLONE_SOURCE']]))[0]
image=os.environ['RELEASE_IMAGE']
if not image.startswith('sha256:') or len(image)!=71:
    raise SystemExit('Require immutable full-app image ID')
class Engine(http.client.HTTPConnection):
    def connect(self):
        self.sock=socket.socket(socket.AF_UNIX,socket.SOCK_STREAM)
        self.sock.connect('/var/run/docker.sock')
cfg=old['Config']
payload={k:copy.deepcopy(cfg[k]) for k in ('Env','WorkingDir','User','ExposedPorts','Entrypoint') if k in cfg}
payload.update(Image=image, HostConfig=copy.deepcopy(old['HostConfig']),
    Cmd=['sh','-c','nginx && pnpm --filter postiz-frontend --filter postiz-backend --filter postiz-orchestrator --parallel run pm2 && pm2 logs'],
    Labels={'io.lyfe.release.previous-container':os.environ['ROLLBACK_NAME']})
payload['NetworkingConfig']={'EndpointsConfig':{name:{'Aliases':[a for a in (net.get('Aliases') or []) if a not in (old['Id'],old['Id'][:12])]}
    for name,net in old['NetworkSettings']['Networks'].items()}}
conn=Engine('localhost');conn.request('POST','/containers/create?name=postiz',json.dumps(payload),{'Content-Type':'application/json'})
response=conn.getresponse();body=response.read()
if response.status!=201:
    # Do not log request payload or potentially sensitive engine response.
    raise SystemExit('App create failed: HTTP '+str(response.status)+'; execute app-only rollback')
print('Created replacement app; previous container retained stopped')
PYOP
python3 "$ROLLBACK_DIR/create-app-only.py"
docker start postiz
```

The retained original keeps all old env and patch state; no compose command may
recreate/delete it during the acceptance window. The replacement keeps effective
env, mounts, port bindings, resource/restart settings and all three networks.
The operator must first exercise this create/start procedure on the isolated
full-image stack. It has not been executed on Live by this task.

Startup acceptance, before declaring live:

```sh
docker exec postiz nginx -t
docker exec postiz test -s /app/apps/backend/dist/apps/backend/src/main.js
docker exec postiz test -s /app/apps/orchestrator/dist/apps/orchestrator/src/main.js
docker exec postiz pm2 jlist | python3 -c 'import json,sys; p=json.load(sys.stdin); statuses={n:next((x.get("pm2_env",{}).get("status") for x in p if x.get("name")==n),"missing") for n in ("frontend","backend","orchestrator")}; print(statuses); sys.exit(0 if all(v=="online" for v in statuses.values()) else 1)'
curl --fail --silent --output /dev/null http://127.0.0.1:4007/auth/login
curl --fail --silent --output /dev/null http://127.0.0.1:4007/api/auth/can-register
curl --fail --silent https://social.biz-box.io/auth/login | grep -q 'LYFE Social'
```

Check private runtime logs for crash loops without publishing secrets. Verify
signed-out protected APIs are 401; inspect authenticated existing channels,
drafts and scheduled content read-only. Verify the visible exact source offer,
phone login/calendar/editor and Agent handoff after #480 publication. Exercise
Copilot 503 in the isolated authenticated full-stack fixture, with and without a
key; no live draft/post/OAuth is required. Send the public login URL to w3 for the
separately assigned live CHECK. Any failure below triggers app-only rollback.

## Immediate app-only rollback

Use this if create/startup, health, queue state, brand/source, owner handoff or
read-only authenticated checks fail. Keep the failed candidate for diagnosis.
If replacement creation failed, omit its stop/rename commands. Keep Redis,
PostgreSQL, Temporal, volumes, channels and `.env` unchanged.

```sh
docker stop postiz
docker rename postiz "postiz-failed-$RELEASE_ID"
# Clone complete private rollback snapshot with the safe app-only command.
# Original container remains stopped and preserved.
export CLONE_SOURCE="$ROLLBACK_NAME"
export RELEASE_IMAGE="$ROLLBACK_IMAGE"
python3 "$ROLLBACK_DIR/create-app-only.py"
PROVIDER=/app/apps/backend/dist/libraries/nestjs-libraries/src/integrations/social/linkedin.provider.js
# New rollback app is stopped; restore active patch and preserve its backup.
docker cp "$ROLLBACK_DIR/linkedin.provider.current.js" "postiz:$PROVIDER"
docker cp "$ROLLBACK_DIR/linkedin.provider.js.bak-20261016" "postiz:$PROVIDER.bak-20261016"
docker start postiz
curl --fail --silent --output /dev/null http://127.0.0.1:4007/auth/login
curl --fail --silent --output /dev/null http://127.0.0.1:4007/api/auth/can-register
```

The private snapshot restores the exact previous image plus complete writable
layer; the original stopped container remains intact. Copying effective env in
memory preserves runtime configuration without editing or exposing `.env`.
Both forward startup and rollback use only the three app package scripts,
excluding root `pm2-run` and schema push. Exercise this rollback in the isolated
full-image rehearsal before any Live cutover. Verify the restored active provider statically/with fixtures uses
only `openid profile w_member_social` and `/v2/userinfo`, not `/v2/me`, without
OAuth. Recheck previous login/calendar/queue behavior. Preserve all originals;
archive approved artifacts in StorageBox after acceptance, without public secrets.

BizBox #480 may remain independently; if it must be reverted, remove the Postiz
entry first, then use its separately reviewed site rollback. No database rollback.
