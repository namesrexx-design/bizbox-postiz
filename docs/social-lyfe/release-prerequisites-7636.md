# Release prerequisites — 2452 / 2519

Read-only finding, 2026-10-16. **Approval confirmed; deployment remains HOLD.**
W1 owns the existing release lock, artifact selection and cutover. W2 supplies
this prerequisite correction; w3 independently checks the changed finding.
No new compiler, schema write, OAuth, account write or competing release ran.

## Exact source and artifact decision

The current compatible integrated source available to w1 is
`d78e598b6117607d24cd0465f98639241c107571`, branch
`release/combined-lyfe-social-2519-20261016`, at
`/srv/lyfe/work-social-release-source-6315-20261016` on Production. It preserves
the PR2/PR3/PR4 histories and implements the authenticated exact-source download.
The prepared context is
`/srv/lyfe/pods/social-media-w2/source-context-final-6480`; its `build.args`
and archive identify that same commit. Archive SHA256:
`92f4c75a7c38cfd1ba7e0f3b0231d0a8336ac8c6e2b68ff68136a58ae4b918e1`.
The matching history bundle is
`/srv/lyfe/pods/social-media-w2/combined-source-final-6480.bundle`.
These are source inputs, not a deployable image. W1 must reconcile its pending
rollback-note correction and history-mirror delivery before final source selection.
Any changed selected commit needs its own matching archive/build arguments.

**No compatible production image was found in the inspected Production/Live
image inventory.** Both hosts retain the upstream toolchain image
`sha256:7eb4a553507ce3f200deff2ec0211ab3cf834ba19eb44dd68e83ccc236509feb`;
Production also has the older cached candidate image. Neither establishes a
new full-image build of this integrated source. W1 owns any additional artifact
discovery; only a matching immutable image plus startup evidence can clear this gate.

The accepted old combined build `7ddf86821b6e0ac2b42731d7d15f3e72dce5cfe3`
remains build/phone PASS for its exact source. Its retained `.next` server output
still contains `http://127.0.0.1:4027/api` in provider/modal pages. That output
cannot be deployed by changing runtime environment, and does not certify the
later schema/source-download changes.

## Production URL and matching source requirement

Use the integrated production recipe, not the old preview script:

| Build input | Required value |
| --- | --- |
| `FRONTEND_URL`, `MAIN_URL` | `https://social.biz-box.io` |
| `NEXT_PUBLIC_BACKEND_URL` | `https://social.biz-box.io/api` |
| `RELEASE_REV`, `RELEASE_SOURCE_REVISION` | Exact selected full Git commit |
| `NEXT_PUBLIC_SOURCE_CODE_URL` | `https://social.biz-box.io/api/source/<same-commit>.tar.gz` |
| `RELEASE_SOURCE_SHA256` | SHA256 of that commit's packaged source archive |

`prepare-release-context.sh` emits the matching archive and arguments; the
integrated Dockerfile checks source URL/revision/checksum, generates Prisma
offline, applies the font guard, and builds frontend/backend/orchestrator
sequentially using the reviewed memory profile. It starts app package scripts,
excluding the root schema-pushing command. Do not run a build in this task.
Production root is still 98% used; heavy root writes remain held at or above 90%.
An independently scheduled executor must clear capacity and the shared-lock/RAM
gate before a full image build or isolated startup/rollback rehearsal.

Fresh public GETs return 200 for live login and `/api/auth/can-register`.
Live login still says **Postiz Login**; the integrated source-download URL for
`d78e598b6117607d24cd0465f98639241c107571` returns 404 anonymously on the current
old service. This is a baseline observation, not an authenticated download test.
After release, w3 must read back the exact archive through real nginx and Social
authentication, check the compiled API/source URLs and reject fixture references.

## Fresh schema result

Metadata-only `BEGIN READ ONLY` / `ROLLBACK` inspection still finds no
`Integration.customName` or `Post.batchId`. `mastra_scorers.batchId` remains present.
The integrated candidate removes the first two dependencies and preserves the
scorer field. Its saved generated-client schema matches the selected source
byte-for-byte. Running its checked-in `compare-live-schema.py` against fresh
Live metadata passes **85 models, 989 columns, 262 declared indexes and 11 enums**
with no compared differences. Types, nullability, timestamp precision, database
defaults, declared index column order/uniqueness and enum order are covered.
Foreign-key actions, index predicates/operator classes, application rows and
full-service runtime behavior are outside this check. No migration is needed
to resolve these two removed dependencies; runtime acceptance is still required.

## Smallest remaining operator actions

1. The lead/release owner must publish and read back
   [BizBox #480](https://github.com/namesrexx-design/bizbox/pull/480) **first**.
   Fresh GitHub readback: OPEN, unmerged, head
   `2c76d8b3161737989807ee468e39bd421a956be9`. An HTTP 200 owner-page app shell
   does not establish the saved-Main to Social behavior. Retain its accepted
   local phone/auth checks and perform the published owner-authenticated check.
2. W1 must select the final compatible source/archive and immutable production
   image, then supply isolated nginx/frontend/backend/orchestrator/email startup
   and patch-preserving rollback evidence. Existing approval
   `appr_mvabgkmsa61a518f` reads **approved**; reconcile final source/image/scope
   with that card rather than creating another. Preserve the original container,
   active LinkedIn provider and `.bak-20261016`, effective root-only env,
   channels, mounts, data and queue under the authoritative operator handoff.
3. W3 checks the changed deployability finding now; post-cutover title/phone/auth,
   source, channels, LinkedIn and retained rollback checks follow w1's actual
   deployed-artifact handoff. No unchanged export or old build suite is repeated.

Evidence and owner-page handoff data are under
`/mnt/storagebox/work/2452-release-prereqs/`. Main #7641's shared owner project-page
template is queued with web-app; use its reviewed contract when supplied, with
this release's PR links/status/owners/questions. No separate template is created.

## One readiness handoff to w1 — task 7785

| Gate | Owner | Required next result |
| --- | --- | --- |
| Capacity below 90% on Docker's filesystem | Onboarding capacity lead; its independent capacity reviewer | Exact retired-output paths/destinations and enough verified reclaim, followed by fresh `df`; w2 coordinates inventory/review only |
| #480 merge and actual site publication | Social lead coordinates BizBox/web-app release owner | Published saved-Main to Social behavior and owner-auth boundary readback |
| Final source, production image and isolated startup/rollback | W1, sole release executor | Immutable matching image and full-service evidence under the existing approved scope |
| Changed finding, then actual deployed artifact | W3, sole social reviewer | Independent prerequisite verdict, then post-cutover title/phone/auth/source/channels/provider/rollback result |

At 03:59:25 UTC, `/var/lib/docker` is on `/`, with 300,403,990,528 used bytes
and 8,679,485,440 available bytes. Its unrounded utilization is about 97.19%;
`df` rounds up to 98%. At that snapshot, reclaiming 22,228,862,157 bytes would
cross the exact 90% ratio. To make the displayed `df` percentage **below 90**,
budget at least 25,319,696,917 bytes (about 23.58 GiB), plus a margin for concurrent
writes. This is a measured target, not a capacity guarantee or move authorization.

The earlier onboarding gate was 7 GiB available, and its capacity task closed
without moving its 18 planned directories. That outcome does not clear this
different Docker-layer utilization gate. Social's independently accepted two-folder
archive reclaimed about 2.64 GiB and is closed. Do not repeat it, broaden its
scope, prune Docker, move active previews, or invoke an old mover.

W2 requested onboarding's exact reviewed proposal and reclaim budget in Main
messages #7819/#7828. The capacity owner must return the explicit generated-output
paths, owner retirement confirmation, destinations and allocated-byte inventory.
Independent review must clear those exact moves and the final all-container/process
reference guards before any retirement. Preserve source/media/keys, active build
outputs and original services; verify complete archive copy/readback before
retiring only cleared generated files. This task authorizes inventory/review,
not execution of additional moves. A proposed set smaller than the measured target
must not be represented as sufficient recovery.

These are the immediate **read-only** operator commands; they can run while the
owner prepares the exact capacity proposal:

```sh
# Production: verify that capacity recovery applies to the actual layer filesystem.
docker info --format '{{.DockerRootDir}}'
df -B1 --output=source,size,used,avail,pcent,target / /var/lib/docker
# Verify the retained packaged source; this starts no compiler.
sha256sum /srv/lyfe/pods/social-media-w2/source-context-final-6480/source-archive.tar.gz
# Dependency and existing approval; neither command performs publication.
gh pr view 480 --repo namesrexx-design/bizbox --json state,mergedAt,headRefOid,url
ssh root@2.28.123.22 'cd /srv/lyfe/agent-room/repo && node tools/agent-room/ping.mjs approval --id appr_mvabgkmsa61a518f'
```

W1's [artifact/startup finding](https://github.com/namesrexx-design/bizbox-postiz/pull/3#issuecomment-6207729067)
supplies the next production-image step after capacity, measured RAM and all three
shared locks are cleared in a separately scheduled slot. Use the prepared final
context and its explicit build arguments; do not start a compiler from this
handoff. Startup/rollback and source/phone acceptance remain the authoritative
operator handoff's gates. Current readiness evidence is retained under
`/mnt/storagebox/work/2452-release/` alongside w1's artifact finding.
