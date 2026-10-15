# Review card: Socialive calendar branding

**Status: source and full frontend build passed; new review payload sealed; exact display-name clarification pending; NOT approved or deployed.**

Rexx requested **Socialive**, retaining the approved Lifey cloud. Visible titles, logo labels, billing/logout copy and footer are renamed. Postiz/AGPL attribution, source offers, artwork bytes, asset filenames and upstream identifiers are retained.

- Parent source: `18ed06d55f1e5b41316f665ed494912a0d3b3511`.
- Tested product source: `315fab7be5d838d9ce421d66bc107cf83e430f65`.
- Existing PR: https://github.com/namesrexx-design/bizbox-postiz/pull/1. This own branch is not pushed and PR1 is not updated by this task.
- Matching-source URL embedded by the new build: https://github.com/namesrexx-design/bizbox-postiz/tree/315fab7be5d838d9ce421d66bc107cf83e430f65.
- Production evidence: `/srv/lyfe/work-socialive-name-20261014-evidence`.
- Approved logo SHA256: `d35aea622bf27b2deac19ab6873e049eb79c3980c4b6952ed7601ffd6d326c27`.
- Own candidate recipe: [compose.socialive.yml](../../deploy/socialive/compose.socialive.yml); rollback: [compose.rollback.yml](../../deploy/socialive/compose.rollback.yml).

## Artifact and validation

Private review payload: `/srv/lyfe/work-socialive-name-20261014-evidence/socialive-315fab7b-payload.tar.gz`. 55,982,273 bytes; SHA256 `a324fc511a073aecc6adcfb3297d7015f19d1ca31da7cae56322ddc32da0345d`. Build ID `8BF6jQGNXGfl8dLGTAYCc`. Verified 1850 runtime file hashes, 7 unchanged compiled links to existing image dependencies and all four approved artwork hashes. Archive member paths and content hashes passed. No dependency bytes, cache, credentials or source footage are included. The build uses existing image `sha256:0d2a19db134f4e2fb308d81d67142f307494e934221acdb43ba7117e3f856391` with source mounted read-only and a separate output directory. No dependencies or source assets are duplicated into this sparse checkout.

Source review and whitespace checks pass. Full Next compilation (59s), TypeScript (17.6s) and prerender (2/2) completed with exit0. An independent compiled-content review found 38 Socialive occurrences and six exact tested-commit source links, with no old exact Social LYFE display strings. The links reference retained dependencies inside the pinned app image; extraction/startup must preserve that reviewed container mapping. These are compiled-content checks, not live browser or native proof. New browser captures, authenticated screens, OAuth, uploads, provider calls and publication were not exercised. Historical Social LYFE browser receipts do not validate this new artifact.

## Required gates before a Live write

1. Rexx clarifies Socialive versus the later written Social Lyfe name before release. Coordinator and existing PR1 owner consolidate/review this own branch. Publish and verify the exact matching-source commit.
2. Clear the pre-existing candidate-base and independent host-bind/hash, full-service startup and recovery/rollback gates recorded in the prior card and Main1507–1509.
3. Verify the new payload's member paths and hashes, current Live image/compose fingerprints, storage headroom and service state. Stop on drift.
4. Obtain approval for this exact artifact, reviewed recipes and an app restart window. Preserve existing channels, records, queues, credentials and datastores.

The candidate and rollback recipes retain the pinned Live app image and the existing explicit no-migration startup override. Full-service startup and rollback with these recipes are **not tested**. The branding override targets only `/srv/lyfe/postiz/branding/releases/315fab7b/` and recreates only the app; startup can briefly pause UI/API/queue processing. The rollback must use the original base plus its rollback override alone.

No Live, secret, database, credential, provider or posting operation is authorized by this document alone. Follow the preserved prior card's restart impact, capture, post-release comparison and rollback procedures.
