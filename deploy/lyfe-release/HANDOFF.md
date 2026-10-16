# Canonical release handoff — 2452 / 2519

W1 is the sole release executor. Existing approval `appr_mvabgkmsa61a518f` is
**APPROVED**; re-read it and reconcile the selected final source/image/scope
before any Live write. No duplicate card is needed. This handoff integrates the
[accepted preparation and executable Env/rollback fix](https://github.com/namesrexx-design/bizbox-postiz/pull/5#issuecomment-6207867818).

## One entry point on Production

```sh
PYTHONDONTWRITEBYTECODE=1 python3 /srv/lyfe/work-2452-release-prep-20261016/deploy/lyfe-release/release-handoff.py
```

This is a read-only verification/plan. It verifies every d78 context/archive byte,
the accepted preparation file checksums and the extracted corrected production
helper, then invokes the accepted builder in planning mode. It prints the exact
build command and current gates. It does not claim or acquire a release lock;
preserve the current operator if one is active and do not launch a second executor.

After the lead grants this exact build all three slots and capacity clears, the
same entry point executes the unchanged guarded builder:

```sh
LYFE_RELEASE_SLOT_GRANTED=2452-d78-three-slots PYTHONDONTWRITEBYTECODE=1 \
  python3 /srv/lyfe/work-2452-release-prep-20261016/deploy/lyfe-release/release-handoff.py --build
```

Disk must be below 90% and have 40 GiB available on the local Docker-layer
filesystem (including containerd storage), with 5 GiB MemAvailable for build;
rehearsal needs 7.5 GiB. All three real kernel slots must be reserved and acquired.
The 04:07 snapshot was 31.03 GiB short, plus concurrent-write margin; remeasure
before execution. [Accepted capacity finding](https://github.com/namesrexx-design/bizbox-postiz/pull/3#issuecomment-6207878516).
W2/lead owns the separate capacity route. StorageBox is artifact storage and does
not clear root capacity. No compiler reservation is implied by these commands.

## Immutable inputs and execution order

| Input | Exact selection |
| --- | --- |
| Combined application | `d78e598b6117607d24cd0465f98639241c107571` (PR2 + PR3 + PR4 + signed-in source download) |
| Context | `/srv/lyfe/pods/social-media-w2/source-context-final-6480` |
| Source archive SHA256 | `92f4c75a7c38cfd1ba7e0f3b0231d0a8336ac8c6e2b68ff68136a58ae4b918e1` |
| Accepted PR5 preparation | `23cc99fad5d26568a8402e22197c9aeebef58320`; file hashes in `release-inputs.json` |
| Corrected PR3 helper | `833fd239532891b2c41dac022850c891b90d47b3`, `docs/social-lyfe/operator-handoff-2519.md` |
| Base/toolchain image | `ghcr.io/gitroomhq/postiz-app@sha256:7eb4a553507ce3f200deff2ec0211ab3cf834ba19eb44dd68e83ccc236509feb` |
| Production API | `https://social.biz-box.io/api` |
| Production source URL | `https://social.biz-box.io/api/source/d78e598b6117607d24cd0465f98639241c107571.tar.gz` |
| Dependency lock SHA256 | `a80b52413e65fc53791524120ef4fa300a2815020885961801ebed02cf9f1fee` |
| D78 rehearsal image | `sha256:7686a2108317973bb21ed6194dc298432ea426229b8ec0e6c26a67610f6c41a1`; exported and network-none checked; corrected-source parity remains open |

The d78 build/export, actual startup/source/activation/queued email, Chromium and
WebKit phone/editor/download, and complete-image rollback have passed
[W3 independent CHECK](https://github.com/namesrexx-design/bizbox-postiz/pull/5#issuecomment-6209171617). All 232 patched files and source environment were
restored; schema, critical synthetic rows, empty Redis, completed workflow and
two mailbox messages were preserved. All owned rehearsal processes and browsers
exited and all three kernel slots were released at 2026-10-16 06:04:15 UTC.
The corrected bear/bull source in PR6 and its reviewed PR7 repin still require a
separate later build grant. D78 cannot clear corrected-source branding parity.

These external operator files accompany d78; they do not enter or modify its
source archive. Never use the historical helper embedded in d78, the older
7dd review output, or a fixture bundle for release. The adjacent
`create-app-only.py` retains the accepted PR3 environment merge and now initializes
one PM2 daemon before sequential package starts. Its manifest pins this corrected
executable; replace the older embedded helper when following the linked PR3
preservation/forward/rollback procedure.
It requires the environment prepared by that operator handoff and is not an
independent startup command.

1. Use this entry point to verify/plan; build only after the resource/slot gates.
   Validate the immutable image's archive, emitted production URLs, generated
   Prisma and all three compiled apps using [the accepted image checks](README.md#exact-guarded-compiler-command).
2. Follow [the accepted isolated rehearsal](README.md#isolated-startup-and-rollback-procedure)
   on Production: synthetic services only, no Live env/queue, nginx plus frontend,
   backend and orchestrator, authenticated source bytes, actual queued email to
   Mailpit, unchanged app schema and complete-image patch-preserving app rollback.
   These d78 runtime gates passed independent W3 CHECK; a different final image
   still needs its own actual acceptance.
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
root-only on Live. Outputs remain under `/mnt/storagebox/work/2452-release`;
the d78 image is built and exported. Candidate and complete restored rollback
passed actual W3 CHECK. Final corrected-image acceptance and #480 publication
remain open; no Live cutover has been performed.
