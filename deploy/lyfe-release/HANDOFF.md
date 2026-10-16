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
this handoff. `create-app-only.py`, isolation checks and the original preparation
tests retain accepted bytes. The rehearsal helper changes only REV. Follow-up
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
readback remain gates before Live recreation. The owner-PC publisher approval
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
the accepted preparation file checksums and the extracted corrected production
helper, then invokes the accepted builder in planning mode. It prints the exact
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
| Corrected PR3 helper | `833fd239532891b2c41dac022850c891b90d47b3`, `docs/social-lyfe/operator-handoff-2519.md` |
| Base/toolchain image | `ghcr.io/gitroomhq/postiz-app@sha256:7eb4a553507ce3f200deff2ec0211ab3cf834ba19eb44dd68e83ccc236509feb` |
| Production API | `https://social.biz-box.io/api` |
| Production source URL | `https://social.biz-box.io/api/source/1bac9b61be8a30dea31b7cdac4a76bf1f51f5229.tar.gz` |
| Dependency lock SHA256 | `a80b52413e65fc53791524120ef4fa300a2815020885961801ebed02cf9f1fee` |
| Release image | **UNBUILT**; require immutable ID from `release-image.id` after successful build |

These external operator files accompany PR6; they do not enter or modify its
source archive. Never use the historical helper embedded in PR6, the older
7dd review output, or a fixture bundle for release. The adjacent
`create-app-only.py` is an exact extraction of the accepted corrected PR3 block.
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
3. Claude/web-app must publish [BizBox #480](https://github.com/namesrexx-design/bizbox/pull/480)
   and read back authenticated first-request Social selection, manual Main,
   unknown-room fallback and missing-pass 401. Its companion-review author hold is
   cleared; publication/readback remains a separate **OPEN** gate.
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
