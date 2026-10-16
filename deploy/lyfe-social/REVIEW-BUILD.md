# Combined review build

Review setup for the PR2 + PR3 candidate. This is not a deployment command.
The script records the selected candidate revision in the source offer. These
public setup files reproduce its compiler configuration and command and are
included on the combined candidate branch. A final release source offer
must point to its complete selected source, including the build setup.

`next.review.config.js` is the app's Next configuration with compiler workers
limited to one, webpack memory optimizations enabled, and browser/server/Sentry
source maps disabled. The server loads `isomorphic-dompurify` and `jsdom` through native Node package
resolution so their filesystem assets remain available. No authentication,
routing, endpoint, provider, sanitizer or editor implementation is substituted. The default source-map-enabled build exceeded its 6 GiB
container cap; the review profile's result is reported separately in PR3.

Set `POSTIZ_REVIEW_SRC` and `POSTIZ_REVIEW_OUT` to the candidate source and a fresh
output directory. The defaults name the actual Production paths used for this
check. The cached build image is `bizbox-postiz:candidate-345426c-v2.25.0`; its
pnpm lock matches the fork. No production env or keys are passed into these jobs.

Pre-create writable output directories and the ignored `.next`, `next-env.d.ts`
and backend `dist` mountpoints. Seed `next-env.d.ts` from the same cached Next
16.3.1 toolchain. Run the code-generation script with `--network=none`: it only
writes Prisma Client 6.5.0 for the candidate schema. It cannot run a migration or
connect to a database. The placeholder DATABASE_URL is deliberately unreachable.
Mount the generated client at `/app/node_modules/.prisma/client` in both builds.

`compile-backend.review.sh` runs the full backend check with the same cached image with source mounts read-only,
network disabled, a fresh writable backend `dist`, 2 CPUs, a 4 GiB memory cap and
`NODE_OPTIONS=--max-old-space-size=3072`:

```sh
../../node_modules/.bin/tsc --project tsconfig.build.json
```

It exits 0 after regenerating the client; the stale cached client failed on
`customName` and `batchId`. Compare the live runtime/schema before any release.
This work does not apply schema changes.

Run the frontend script only after the preceding compiler exits and when the
coordinator gives it the next slot. For exclusive serial execution, acquire all
three shared slots in order; the generic `flock /run/lyfe-heavy.lock` wrapper is
a three-slot shim and does not reserve the whole host:

```sh
/usr/bin/flock -o /run/lyfe-heavy.slot1 \
  /usr/bin/flock -o /run/lyfe-heavy.slot2 \
  /usr/bin/flock -o /run/lyfe-heavy.slot3 \
  nice -n 10 bash deploy/lyfe-social/build-combined-frontend.review.sh
```

The frontend command uses 2 CPUs pinned to cores 0/1, a 3 GiB V8 heap and a 5 GiB
container limit after the shared-memory budget was measured. The immutable source offer is set by the build to the selected
candidate revision. No application service or datastore starts. The build emits
only the review frontend and logs. The isolated preview and its synthetic API
fixture are separate; its writes are blocked. Release/rollback order remains in
`docs/social-lyfe/linkedin-agent-release.md`.

The measured retry may lower its container budget without changing application
code: `POSTIZ_REVIEW_MEMORY_LIMIT=4608m POSTIZ_REVIEW_HEAP_MB=3072` selects a
4.5 GiB cap and 3 GiB heap. The private launch guard requires another 512 MiB
of host headroom before starting. A 5 GiB-cap launch was skipped when only
5.19 GiB was available; no compiler started for that gated attempt.

## Next 16.3.1 Google font URL guard

A later compile failed in Next's Google font loader when its final-extension
regex returned null. The isolated real loader succeeds for both existing Jakarta
font configurations; no replacement font or mocked font response is used.
`build-tools/patch-next-font.cjs` guards the exact installed Next 16.3.1 loader
expression inside the disposable container. The helper parses filename extensions
from the URL pathname and detects WOFF/WOFF2 signatures for extensionless query
URLs. Unknown payloads still fail with their source URL. The downloaded bytes
and font appearance are preserved; Next's installed MIT licence remains intact.
The exact patch and helper are included here with the corresponding build setup.
