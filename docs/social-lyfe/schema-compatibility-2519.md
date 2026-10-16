# Live schema compatibility, task 2519

Live's read-only metadata review found no `Integration.customName` or
`Post.batchId` columns. Nullable Prisma declarations still request missing
columns on implicit scalar reads. This fresh-main change removes those two
model fields and the Post batch index declaration, then generates the matching
client offline for focused checks. It contains no migration or schema write.
The separate `mastra_scorers.batchId` field and both existing indexes remain
byte-for-byte unchanged. Earlier inventory text calling that model
`mastra_scores` was incorrect; that name occurs in legacy index names only.

## Resulting behavior

Integration repository/service rename persistence is removed. The existing
custom-name route returns HTTP 501 before any service/repository call. Both
Rename and Reset to original name controls and their request handlers are removed.
Normal provider-derived `name` remains; the dashboard still exposes
`originalName: name`. Public API and tool lists retain their existing safe field
mapping and customer filtering. Provider nickname/profile controls are distinct
features and remain unchanged.

The editor loads only the requested organization/group and returns
`siblings: []`. It does not guess sibling channels using content, dates or
channel identity. Automatically reopening all channels of an old batch is
unavailable. Ordinary multi-channel creation still loops over selected channels,
retaining each date, settings and thread. Group rotation/keepGroup, dropped
comment cleanup, update-without-publication, republish opt-in, workflow calls
and stale-anchor processing remain intact. Public preview still filters child
post relations and integration tokens. Release-id responses retain their
existing shape with the absent batch field no longer part of the Prisma type.

## Focused validation

On Production, with Docker and a fresh output directory:

```sh
POSTIZ_COMPAT_OUT=/srv/lyfe/compatibility-check-output \
  bash tests/compatibility/run.sh
```

Both jobs run sequentially, offline, with one CPU and a 1 GiB cap. The first
only generates Prisma Client 6.5.0 in the disposable layer. The second checks
the generated model metadata and actual changed source methods: HTTP 501
without writes; provider names and safe responses; organization/group isolation;
empty siblings; thread/date/settings payloads; keepGroup/rotation cleanup;
ordinary multi-channel saves; update and republish behavior; stale anchors;
and rendering the actual menu with both rename actions absent. No account or
database connection occurs. Dependencies outside these flows are substituted.
The generated menu HTML is an isolated component fixture; it is not a rebuilt
calendar/editor application or a production interaction test.

Builder result: 12/12 focused checks passed. Chromium and WebKit 390×844
captures of that actual component confirm both rename actions absent and retained
menu content without horizontal overflow. Styles come from the accepted prior
review output; the synthetic harness adds a diagnostic label/background only.
See [Chromium capture](compatibility-phone/menu-chromium-390.png) and
[WebKit capture](compatibility-phone/menu-webkit-390.png). These static component
captures do not establish interactions or a changed full-application phone PASS.
To reproduce with the server's installed Playwright and the accepted CSS output:

```sh
NODE_PATH=/srv/lyfe/nilla-qa-tools/node_modules \
COMPAT_MENU_HTML=/srv/lyfe/compatibility-check-output/menu.html \
COMPAT_REVIEW_CSS_DIR=/srv/lyfe/pods/social-media-w2/combined-frontend-review-build/static/css \
  node tests/compatibility/capture-menu.cjs
```

Accepted PR3 combined build/phone PASS belongs to its earlier exact source and
remains historical evidence. This changed candidate needs its own independent
CHECK. No full frontend/backend/orchestrator compile was run for this change.

## Integration and future production image

This PR is an isolated compatibility diff from current `origin/main`. It does
not replace the LinkedIn/Copilot/Agent changes in PR3 or branding in PR2. Integrate
those accepted changes and this compatibility commit into one exact release
revision in the history-preserving private mirror owned by w1 under Main #6033;
preserve LYFE Social metadata and all three Agent redirects. Review the exact
combined diff. The in-app Source link must serve its matching Postiz source
tarball to signed-in users, including complete build setup and upstream licences.
The private repository link alone is not the user-facing source offer. W1 owns
the history mirror; w2 owns the signed-in source endpoint and its route/authentication tests. Verify authorized
user download and exact source revision before release. Do not archive the public
fork, switch active remotes or cut over services before w3's mirror/source CHECK.
The production recipe and build helpers in this PR are based on PR3's accepted
setup, with the production recipe corrected to use the accepted compiler profile.

Only after the lead coordinates a measured-RAM slot with web-app may an operator
build that final source. Use all three real locks in ascending order, no idle
reservation. Require at least 4.5 GiB for the build container plus 512 MiB host
headroom, one compiler at a time; log measured RAM, image result and release all
locks on exit. Do not rerun this task's accepted old build.

Prepare the Docker context with `prepare-release-context.sh`: `source/` and the
matching `source-archive.tar.gz` come from `git archive` of the exact combined
revision; the helper also copies the reviewed Dockerfile and writes build arguments.
`deploy/lyfe-social/Dockerfile.review` pins the immutable
toolchain/lock, generates Prisma offline, applies the version-checked font guard,
copies the included source-map-free one-worker config and invokes webpack with
a 3 GiB heap. Backend and orchestrator compile sequentially afterward. The
frontend/main URL is `https://social.biz-box.io`; its backend URL is
`https://social.biz-box.io/api`. A future legacy Docker builder invocation can
use `--memory=4608m --cpuset-cpus=0,1`; a BuildKit worker must have an equivalent
coordinated limit. Do not assume CLI flags cap a separately running BuildKit
worker. No builder/resource change is authorized here.

Pass `RELEASE_REV`, `RELEASE_SOURCE_SHA256` and `NEXT_PUBLIC_SOURCE_CODE_URL`
from the helper's `build.args` as explicit build arguments. The URL must be
`https://social.biz-box.io/api/source/<revision>.tar.gz`, bound to the same source
revision. The recipe verifies the archive checksum and rejects any other URL.
The integrated `SourceController` implements this endpoint; its signed-in
Nest HTTP/download checks pass, while actual production nginx/full-service
startup and authenticated source readback remain release gates.
Record the resulting new immutable full-app image;
inspect compiled server/client output for fixture URLs. Never reuse the localhost
review `.next`, or treat the upstream toolchain digest as the new release image.
The recipe starts only the three package-level PM2 scripts plus nginx; it does
not invoke the root script that pushes the schema. This recipe has not been built
or started for this task.

Before release, compare the entire generated schema to fresh read-only Live
metadata (types, defaults and indexes as well as field presence). Rehearse nginx,
frontend, backend, orchestrator, email and patch-preserving rollback on an isolated
test stack with synthetic data, outbound sending disabled and no connection to
the live queue. These focused tests do not establish full database compatibility
or startup readiness.

Publish and read back BizBox #480's owner Social destination first. The accepted
PR3 operator handoff governs backup/cutover/rollback: preserve the original
container/image, active LinkedIn provider and `.bak-20261016`, root-only env,
channels, mounts, data and queue state. Restore the patched app snapshot on
rollback. Reconcile the existing release card with the final source/image; do
not create another card. Release HOLD remains until the compatible combined
source, production image, isolated startup and destination prerequisites pass
independent review. No live deployment, DB write, OAuth or public post ran here.
