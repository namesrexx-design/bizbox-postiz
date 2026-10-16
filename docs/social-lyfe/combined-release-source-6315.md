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
public release push. W1 includes these exact input branches/current combined
head in the mirror. W2 owns the source endpoint and release integration.
`prepare-release-context.sh` packages the selected commit and sets
`NEXT_PUBLIC_SOURCE_CODE_URL=https://social.biz-box.io/api/source/<revision>.tar.gz`.
The production recipe rejects a different URL or mismatching archive checksum.
Mirror history/licences and authorized-user source download need w3 CHECK before
any archive or remote cutover. Source-download implementation belongs to w2.
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

## Signed-in source download and packaging

`SourceController` provides `GET /source/<revision>.tar.gz` behind nginx's
existing `/api` proxy. It uses the existing JWT verifier and re-resolves the
activated user through `UsersService`; every activated user can download,
irrespective of subscription, org role or owner access. It does not create API
keys, alter organizations, or accept a filesystem path from the request.
Anonymous, forged, expired, removed and inactive sessions return 401. The
selected revision alone is served; other revisions/traversal return 404, and an
unconfigured/missing archive returns 503. Successful downloads have a safe
attachment name, `application/gzip`, exact length, `nosniff` and private/no-store.
Login-page source offers use the same signed-in endpoint; signing in is required.

From this Git worktree, after selecting the reviewed commit:

```sh
bash deploy/lyfe-social/prepare-release-context.sh <full-commit> /srv/lyfe/new-release-context
```

This performs no compilation. It exports tracked files only with `git archive`,
including application, dependency lock, build helpers, original AGPL LICENSE,
legal notices and branded assets. It refuses unpopulated submodules. It writes
the same archive alongside the extracted `source/` and a `build.args` file.
The Dockerfile copies this archive into the image and checks its SHA256 before
any compiler. `RELEASE_SOURCE_REVISION` is embedded in the image and the source
offer pins the identical commit. Keep the archive in the release image; no
GitHub token, private-repo login or separate owner-only media session is needed
for a signed-in Social member to retrieve it. No endpoint is deployed yet.

Focused HTTP checks execute the actual Nest controller and existing JWT verifier,
with only user lookup substituted. They cover invalid/expired sessions and
inactive/deleted users, authenticated exact-byte downloads, headers, wrong
revision/traversal, and absent config/archive. The downloadable real source
archive is additionally checked byte-for-byte against the selected Git commit.
These checks do not boot the full backend or prove nginx/live routing.

## Metadata comparison and future build handoff

Read-only Live metadata was re-read on 2026-10-16 for this compatible schema.
The generated client's schema matches this candidate byte-for-byte. The
comparison checks **85 models, 989 scalar/enum columns, 262 required indexes and
11 enum definitions**. No compared differences were found: column existence,
PostgreSQL type, timestamp precision, nullability, database defaults, index
column order/uniqueness and enum values/order match. Client-supplied UUID/CUID
defaults are distinguished from database defaults. `mastra_scorers.batchId`
and its indexes are retained. See `schema-metadata-comparison-6480.json` and
`deploy/lyfe-social/compare-live-schema.py`. Only metadata was read, within
`BEGIN READ ONLY`; no application rows, credentials or database writes.
This does not check foreign-key actions or establish application/startup PASS.

The accepted earlier review build used a 4.5 GiB container cap, 3 GiB heap,
2 CPUs, one compiler worker and no source maps; observed cgroup peak was about
3.54 GiB. At this handoff the host had about 6.29 GiB available and no swap.
Those observations are not a reservation or a capacity guarantee for the new
full image. Before any future image build, coordinate with the lead/web-app,
measure host and container budget again, require at least the selected cap plus
512 MiB host headroom, and acquire all three real `/usr/bin/flock` slots in
order. Compile frontend, backend and orchestrator sequentially using the
checked-in 3 GiB/one-worker recipe; release every slot on exit. No compiler
starts as part of packaging. The new full image remains UNBUILT.

After image creation, inspect emitted URLs/archive provenance and independently
rehearse nginx/frontend/backend/orchestrator/email startup and patch-preserving
rollback on an isolated stack with outbound sending disabled and no Live queue
connection. Do not reuse the old localhost fixture `.next`. PR480 publication,
matching-source download through real nginx/auth, final-source CHECK and
approved release-scope reconciliation remain gates before Live cutover.
