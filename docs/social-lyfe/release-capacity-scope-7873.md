# Social output archive scope — task 7873

Inventory/proposal only, 2026-10-16. **No additional move is cleared or performed.**
This is a scoped inspection of known Social generated-output directories, not a
root sweep or Docker cleanup. All source, media, keys, QA evidence and accepted
preview stay in place. Onboarding #7824 clears no new onboarding moves; #7897
assigns its finished-output inventory to onboarding-w2 with onboarding-w1 review.
W2 has requested that exact proposal, without treating it as move clearance.

All existing Docker containers were checked, including created/exited containers,
with equal/child/parent mount overlap rejection. Process cwd/executable/open
descriptors were checked against each target. Scoped historical build/preview
scripts and installed systemd/cron configuration were searched; no installed
service/cron reference was found. These observations must be repeated immediately
before any separately authorized retirement.

| Exact generated-output directory | Allocated bytes | Finding and disposition |
| --- | ---: | --- |
| `/srv/lyfe/pods/social-media-w2/combined-backend-build` | 15,740,928 | Failed stale-client compile output; 1,036 regular files, no mount/process references, symlinks, hard links, unexpected types or detected credential/audio/video filenames. Candidate for w3 scope review only. |
| `/srv/lyfe/pods/social-media-w2/combined-backend-prisma-build` | 15,736,832 | Accepted backend build evidence; preserve. |
| `/srv/lyfe/pods/social-media-w2/postiz-build` | 4,096 | Created `social-media-w2-2519-build` container mounts this empty directory; preserve. |
| `/srv/lyfe/pods/social-media-w2/postiz-backend-build` | 4,096 | Empty historical mountpoint; no useful reclaim; preserve. |
| `/srv/lyfe/work-2452-lyfe-social-20261016-evidence/build` | 1,150,976 | Mounted by two exited build containers; preserve. |
| `/srv/lyfe/work-2452-lyfe-social-20261016-evidence/build-webpack` | 123,076,608 | Mounted by two exited build containers; preserve. |
| `/srv/lyfe/work-2452-lyfe-social-20261016-evidence/build-dev` | 4,096 | Empty mountpoint; no useful reclaim; preserve. |
| `/srv/lyfe/work-social-lyfe-brand-20261014-evidence/build` | 226,344,960 | No mount/process reference, but seven dependency symlinks and historical build/preview scripts. Excluded from this proposal; the prior verified mover rejects symlinks. |
| `/srv/lyfe/work-lyfe-social-name-20261014-evidence/build` | 4,096 | Empty mountpoint; no useful reclaim; preserve. |
| `/srv/lyfe/work-socialive-name-20261014-evidence/build` | 966,111,232 | No mount/process reference, but seven dependency symlinks and historical build script. Excluded from this proposal pending owner retirement and a separately reviewed symlink-preserving method. |

The ten inspected paths total **1,348,177,920 allocated bytes** (about 1.26 GiB),
even before exclusions. They cannot clear the approximately 23.58 GiB measured
Docker-layer recovery target. The one proposed failed backend directory supplies
only about 15 MiB. No move of that directory is recommended as sufficient recovery.
The broader capacity owner/Claude must clear another exact reviewed scope before
the image gate can pass; this task supplies no authority to prune or move it.

## Concrete proposal for w3, before any move

Source: `/srv/lyfe/pods/social-media-w2/combined-backend-build` only.
Proposed destination:
`/mnt/storagebox/work/2452-release/social-idle-output-proposal/combined-backend-build`.
The directory contains generated backend JavaScript, source maps and build metadata
from the failed stale-client attempt; the successful backend output is separate.
W2 confirms this failed output is retired. Keep its historical logs/scripts and
all accepted evidence. This proposal does not retire any original source/media.

If the owner later authorizes execution after w3 review, adapt the previously
reviewed copy/verify/retire method to this exact single path; do not reuse its old
two-folder clearance file or run its historical mover. Require complete
file/directory inventory, sizes/modes/timestamps/SHA256 and StorageBox readback,
source identity/rehash, and a fresh all-container/process overlap guard immediately
before retirement. Keep StorageBox copies and original metadata manifests. No
copy, mover implementation, source retirement or Docker change ran in this task.

Machine-readable inventory, scoped script references and capacity snapshot:
`/mnt/storagebox/work/2452-release/{social-output-inventory-7873.json,social-output-script-references.txt,capacity-prerequisite.json}`.
The [one release-readiness handoff](release-prerequisites-7636.md) retains the
production URL/schema/image/#480/approval gates and named operator owners.
