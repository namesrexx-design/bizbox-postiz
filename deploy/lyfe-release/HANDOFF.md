# Proposed PR6 canonical repin — task 9476 / 9519

This separate checkout is a proposal for W1's **post-exit** integration. It does
not replace `/srv/lyfe/work-2452-release-prep-20261016` or the active d78 context.
W3 must check this bounded delta first. W1 alone integrates and builds after the
active job exits and the next shared window is explicitly granted. Never source
the old slot grant into this proposal: it requires `2452-pr6-1bac9b61-three-slots`.
PR6's source/assets/archive PASS is retained; runtime PASS is still required.

Accepted integration base: `92b0cc04736e5bcc692dd0b25499856c1059c52b`.
The bounded changes are the application/archive/context/source URL pins, separate
build output/tag/slot grant, matching build.args, integration verification and
this handoff. Isolation checks and the original preparation tests retain accepted
bytes. The external production helper retains its accepted Env merge and receives
only the explicit PM2 startup delta authorized in 10247. The rehearsal helper preserves its accepted isolation/environment logic and repins REV. Follow-up 10149/10164 also applies the reviewed rehearsal startup correction below. Follow-up
9840 changes only Temporal's dynamic-config path in compose to
`config/dynamicconfig/docker.yaml` and refreshes its manifest checksum. The pinned
Temporal image contains that file; `development-sql.yaml` is absent. The active
d78 preparation and W1's running inputs are not modified by this correction.
Follow-up 10020 also removes unsupported `--no-deps` from the README's
`docker compose create baseline` command and refreshes the README checksum.
The immutable PR6 source archive itself is unchanged; these operator files stay
external to its authenticated source offer.

Retain the refreshed **complete 232-file Live patch inventory** and its private
snapshot, effective environment, provider/backup, config/uploads and queues for
baseline and restored rollback. Do not replace that current baseline with the
older two-provider-only snapshot in the historical procedural example below.
W1 must supply actual startup/source/email/phone/queue and complete baseline/
restored rollback results to W3. #480 publication and authenticated destination
readback passed W3 CHECK; see the completed destination gate below. The owner-PC publisher approval
is separate and does not authorize scheduling or change this release scope.

# Canonical release handoff — 2452 / 2519

W1 is the sole release executor. Existing approval `appr_mvabgkmsa61a518f` is
**APPROVED**; re-read it and reconcile the selected final source/image/scope
before any Live write. No duplicate card is needed. This handoff integrates the
[accepted preparation and executable Env/rollback fix](https://github.com/namesrexx-design/bizbox-postiz/pull/5#issuecomment-6207867818).

## One entry point on Production

```sh
PYTHONDONTWRITEBYTECODE=1 python3 /mnt/work/2452-release/w2/canonical-repin/deploy/lyfe-release/release-handoff.py
```

This is a read-only verification/plan. It verifies every PR6 context/archive byte,
the preparation file checksums and the derived corrected production helper, then invokes the accepted builder in planning mode. It prints the exact
build command and current gates. It does not claim or acquire a release lock;
preserve the current operator if one is active and do not launch a second executor.

After the lead grants this exact build all three slots and capacity clears, the
same entry point executes the repinned guarded builder with unchanged capacity/lock logic:

```sh
LYFE_RELEASE_SLOT_GRANTED=2452-pr6-1bac9b61-three-slots PYTHONDONTWRITEBYTECODE=1 \
  python3 /mnt/work/2452-release/w2/canonical-repin/deploy/lyfe-release/release-handoff.py --build
```

Disk must be below 90% and have 40 GiB available on the local Docker-layer
filesystem (including containerd storage), with 5 GiB MemAvailable for build;
rehearsal needs 7.5 GiB. All three real kernel slots must be reserved and acquired.
Rexx's purchased local work volume is mounted at `/mnt/work`; Docker/containerd
remain on root. Historic insufficient-disk snapshots do not describe current
capacity. Measure Docker disk, RAM and all three locks before execution. StorageBox
holds artifacts; it does not supply Docker-layer space. No spend or resize is
needed by this proposal; no compiler reservation is implied. W1 must release the
active slots and honor the coordinated web-app window before any PR6 build.

## Immutable inputs and execution order

| Input | Exact selection |
| --- | --- |
| Combined application | `1bac9b61be8a30dea31b7cdac4a76bf1f51f5229` (PR2 + PR3 + PR4 + signed-in source download) |
| Context | `/mnt/work/2452-release/w2/bear-bull-ico-context-9198` |
| Source archive SHA256 | `3b5a9c8566327db43d400976026794b095166637170904c4c97c6e25b8994286` |
| Accepted PR5 preparation | `23cc99fad5d26568a8402e22197c9aeebef58320`; file hashes in `release-inputs.json` |
| PR3 helper provenance base | `833fd239532891b2c41dac022850c891b90d47b3`, `docs/social-lyfe/operator-handoff-2519.md` |
| Base/toolchain image | `ghcr.io/gitroomhq/postiz-app@sha256:7eb4a553507ce3f200deff2ec0211ab3cf834ba19eb44dd68e83ccc236509feb` |
| Production API | `https://social.biz-box.io/api` |
| Production source URL | `https://social.biz-box.io/api/source/1bac9b61be8a30dea31b7cdac4a76bf1f51f5229.tar.gz` |
| Dependency lock SHA256 | `a80b52413e65fc53791524120ef4fa300a2815020885961801ebed02cf9f1fee` |
| Release image | **UNBUILT**; require immutable ID from `release-image.id` after successful build |

These external operator files accompany PR6; they do not enter or modify its
source archive. Never use the historical helper embedded in PR6, the older
7dd review output, or a fixture bundle for release. The adjacent
`create-app-only.py` derives from the accepted corrected PR3 block with only the
reviewed PM2 prewarm/sequential-startup delta. The exact derivation is named in
`release-inputs.json`; its Env merge is unchanged.
It requires the environment prepared by that operator handoff and is not an
independent startup command.

1. Use this entry point to verify/plan; build only after the resource/slot gates.
   Validate the immutable image's archive, emitted production URLs, generated
   Prisma and all three compiled apps using [the accepted image checks](README.md#exact-guarded-compiler-command).
2. Follow [the accepted isolated rehearsal](README.md#isolated-startup-and-rollback-procedure-not-yet-executed)
   on Production: synthetic services only, no Live env/queue, nginx plus frontend,
   backend and orchestrator, authenticated source bytes, actual queued email to
   Mailpit, unchanged app schema and complete-image patch-preserving app rollback.
   W3 must check the actual result; these runtime gates remain **OPEN**.
3. Destination gate **PASS / PUBLISHED**: [BizBox #480](https://github.com/namesrexx-design/bizbox/pull/480)
   merged at 2026-10-16 06:45:03 UTC. The selected platform revision
   `0893533de58ca704f884fe3d911a84d3d2d68286` is bound to published checkpoint
   `6ad1c56c4de26e549df4a3c8`, deployed at 06:37:43.752 UTC.
   [W3 final independent CHECK PASS](https://github.com/namesrexx-design/bizbox/pull/480#issuecomment-6209738514)
   confirms the actual signed-in phone result at
   https://biz-box.io/owner/room?room=social-media: first-request Social,
   manual Main retention, mounted query changes, unknown/malformed fallback,
   missing-pass 401 and no page errors. No republish is needed. Sanitized binding,
   final QA and capture are archived on Live Studio at
   `/mnt/storagebox/social-media/11069-published-social-destination-check/`.
   Existing approval is retained; W1 owns the separate corrected-image grant.
4. After both runtime and destination PASS, re-read approval and use the
   [corrected complete production operator handoff](https://github.com/namesrexx-design/bizbox-postiz/blob/833fd239532891b2c41dac022850c891b90d47b3/docs/social-lyfe/operator-handoff-2519.md#future-approved-release-preserve-the-current-container-first)
   for private preservation, app-only forward creation, acceptance and rollback.
   The planning/source/status paragraphs in that older document are superseded
   by this handoff; its corrected executable forward/rollback procedure is retained.

Forward creation merges selected-image defaults with retained effective runtime
Env and selects source-offer settings from that image. Rollback removes candidate
source settings absent from the complete preserved baseline. Preserve the old
container, complete private snapshot, active LinkedIn provider and dated backup,
effective env, networks, config/uploads volumes, stored channels and queues.
Never run root pm2/schema push or migrations. Private Live snapshots stay
root-only on Live. Outputs remain under `/mnt/storagebox/social-media/9476-pr6-canonical-repin/build-output`;
the full image, actual startup/email/rollback and Live cutover have not run.

## Rehearsal startup follow-up 10149 / 10164

W3's actual baseline startup CHECK found the missing public API URL and fresh
PM2 daemon races. The future rehearsal baseline now supplies
`NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4052/api`. Both baseline Compose and
`rehearsal-clone.py` initialize one daemon with `pm2 ping`, then start frontend,
backend and orchestrator sequentially before following PM2 logs, as requested
in W3's [actual startup findings](https://github.com/namesrexx-design/bizbox-postiz/pull/5#issuecomment-6208854175).
Follow-up 10247 applies that same startup correction to the external production
`create-app-only.py`; its Env merge and all other operator bytes are preserved.
The manifest records this explicit delta from the operator provenance base.
This preparation does not grant Live execution. Application source/archive, d78
image, corrected PR7 source pins and both grant scopes are unchanged. W1 alone
executes actual startup/phone/queue/rollback acceptance under its scoped grant.

Follow-up 10226 mirrors W1's Temporal setup: skip example search-attribute creation
and mount the two-field `temporal.dynamicconfig.yml` read-only at the selected
config path. It contains only max ID length255 and forced search-attribute cache
refresh. The manifest verifies its bytes; a missing bind source cannot be created
as an empty directory. Existing isolation, images, synthetic credentials, no-host-
port policy and source/image pins are retained. W1 preserves failed synthetic
Temporal state and alone owns any clean rehearsal DB setup; this proposal performs
no database operation.

## Published loopback relay lifecycle — follow-up 10327 / 10362

The adjacent `loopback-proxy.cjs` and `stop-loopback-proxy.py` are exact published
PR5 helpers from `ab589d976d3d85c26f08c474e41da11b38620fbb`. The matching README
Temporal/startup/relay guidance is mirrored from that same revision. Start the
relay only for the active isolated app and stop its matching recorded process
before replacement or final cleanup. The relay does not add app network access.
Its manifest-pinned helpers validate the app/network/loopback boundary and stop
only the recorded matching relay. W1 alone owns the actual relay lifecycle under
its runtime reservation; W2 validates through controlled boundaries only.
Corrected PR7 source/archive/context/build arguments and grant remain unchanged.

The final published phase runbook also mirrors full frontend/Prisma preservation
inputs, separate relay starts/stops for baseline/candidate/restored and final
owned-service cleanup. Writable captures, private snapshots and relay phase output each select fresh
PR7 directories and refuse existing output on retry. A separate captured-input
reference reads only W1's frontend/Prisma archives; capture redirects never target
W1 inputs. The corrected image/archive namespace and retained d78 originals are
preserved. No private bytes are
copied into this repository.

Follow-up CHECK10430 path correction preserves the exact accepted relay/helper
bytes. All baseline/candidate/restored starts use one guarded runbook function
and one fresh PR7 phase directory; it refuses existing JSON/log records. A retry
must reconcile retained partial output rather than overwrite it.
