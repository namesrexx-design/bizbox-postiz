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
