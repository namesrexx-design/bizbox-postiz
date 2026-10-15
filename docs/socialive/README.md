# Socialive calendar branding

> Superseded candidate: Rexx selected exact **Lyfe Social** after this Socialive artifact was sealed. Retain this payload and its hashes as historical evidence; do not deploy it as Lyfe Social. The final-name source is committed at `a27639367090d78b635fa9e3a93f74ee7f48d2af`, but its fresh frontend build was rejected before execution by automatic approval (CreateProcess blocked by policy). No Lyfe Social compiled artifact or live deployment is claimed.

Rexx requested the exact product name **Socialive** on October 14, 2026. This candidate renames the visible name in the existing Social LYFE implementation: sign-in and sidebar labels, page titles, billing/logout copy, and root footer. It retains the approved Lifey cloud artwork, current asset filenames, Postiz/AGPL attribution, corresponding-source links, and upstream package identifiers.

The isolated Production checkout is `/srv/lyfe/work-socialive-name-20261014`, branch `fix/codex/socialive-name-20261014`, based on `18ed06d55f1e5b41316f665ed494912a0d3b3511`. Tested product source is `315fab7be5d838d9ce421d66bc107cf83e430f65`.

## Evidence

27 visible-name occurrences changed across 25 frontend source files; the agent heading changed separately. Independent source review found no actionable findings. The approved 256px and 180px Lifey image blobs and upstream LICENSE are unchanged; `git diff --check` passes.

A new full frontend build passed on Production using the existing immutable candidate image and shared heavy lock: Next compilation59s, TypeScript17.6s, prerender2/2, exit0. A separate new review payload is sealed and its runtime/artwork content verified; see the deployment card for actual hashes. Rexx later wrote Social Lyfe on BizBox; exact display-name clarification is pending, so this candidate is held from publication/deployment. Its `NEXT_PUBLIC_SOURCE_CODE_URL` is fixed to [the tested commit](https://github.com/namesrexx-design/bizbox-postiz/tree/315fab7be5d838d9ce421d66bc107cf83e430f65); publication of that commit remains a release gate. There are no new browser fixtures or authenticated workflow checks in this rename.

## Release

This is source and build preparation. Live deployment, credential configuration, account changes, scheduling and publication have not been performed. The original checkout, Social LYFE payload, sealed hashes and historical browser receipts remain unchanged.

The [new deployment card](DEPLOYMENT-CARD.md) carries this candidate's results and release gates. The [prior card](../social-lyfe/DEPLOYMENT-CARD.md) remains historical evidence, including the candidate-base, host-bind/hash, full-startup and recovery requirements. Existing PR1 ownership/consolidation and exact public-source verification are required before rollout.
