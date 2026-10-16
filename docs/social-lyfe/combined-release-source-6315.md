# Combined release source — task 6315

This candidate combines the three accepted source changes from a fresh
`origin/main` base. It is source for review, not a built release image.

| Input | Exact revision | Role |
| --- | --- | --- |
| origin/main | 3a7d28b7 | Fresh source base |
| PR2 | 0c7cb946bcfa3bdd972439e041d395fcff6aff1e | LYFE Social branding/email and metadata |
| PR3 | ff478be57c8d01fea6252e39003bac12ecbdddae | LinkedIn OIDC, disabled Copilot, owner Agent redirects, operator plan |
| PR4 | be9abeb4e2aed7216da3372247f0ef5d19cc44ba | Independently passed no-migration schema compatibility and production recipe |

The PR's exact head is the candidate revision; preserve all three input histories.
The earlier accepted combined build/phone source was
`7ddf86821b6e0ac2b42731d7d15f3e72dce5cfe3`. Comparing its `apps/` and `libraries/`
trees to this candidate yields exactly the ten PR4 compatibility paths; no other
application changes were introduced by merge resolution. Both Agent pages and
the Agent layout retain `LYFE Social - Agent` metadata and redirect to the owner
Social room. LinkedIn retains the reduced personal scopes/userinfo mapping;
Copilot endpoints and UI remain disabled. The scorer model and its indexes remain
unchanged. No full application compile or repeated old phone suite was run.

The add/add conflicts in the production Dockerfile and toolchain documentation
were resolved to the independently reviewed PR4 versions. The Dockerfile sets
`FRONTEND_URL` and `MAIN_URL` to `https://social.biz-box.io` and
`NEXT_PUBLIC_BACKEND_URL` to `https://social.biz-box.io/api`. It includes native
jsdom loading, offline Prisma generation, font guard, one worker, no source maps,
3 GiB heap, and sequential frontend/backend/orchestrator steps. Build it only in
a separately coordinated memory-limited slot. No build reservation is held now.

Main #6033 directs final source packaging to w1's history-preserving private
mirror and signed-in matching-source tarball endpoint. This candidate has no new
public release push. W1 must include these exact input branches/current combined
head in the mirror and provide the verified signed-in endpoint as
`NEXT_PUBLIC_SOURCE_CODE_URL`. The production recipe rejects an empty URL.
Mirror history/licences and authorized-user source download need w3 CHECK before
any archive or remote cutover. Source-download implementation belongs to w1.
The current original source files and repositories remain preserved.

PR2's separately assigned rollback-note correction remains w1's responsibility;
incorporate its pushed revision before final release-source acceptance. The
accepted PR3 operator handoff is authoritative for patch-preserving recovery;
never use a stock-image-only rollback. Compatibility behavior, focused validation,
source-download and production image gates are in `schema-compatibility-2519.md`.

Release HOLD: independent review of this exact source, w1's final rollback/source
package, full Live metadata comparison, new production image and isolated
nginx/frontend/backend/orchestrator/email/startup/rollback rehearsal remain.
Publish/read back BizBox #480 first. Preserve original container/image, active
LinkedIn provider and `.bak-20261016`, root-only env, channels, mounts/data and
queue state. Reconcile final source/image with the existing approved card. No
compiler, database write, deployment, OAuth, public post or new approval card.
