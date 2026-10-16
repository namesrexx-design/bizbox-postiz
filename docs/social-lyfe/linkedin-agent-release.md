# LinkedIn and Agent Room release — tasks 2519/2551

Do not merge or deploy until the assigned reviewer passes both PRs and the lead
schedules the release. This change does not authorize OAuth, connecting accounts,
publishing posts, secret changes, migrations, or publishing the BizBox site.

## Release order

1. Review and release [BizBox #480](https://github.com/namesrexx-design/bizbox/pull/480)
   first. Its destination selects `social-media` before the first state request,
   overrides saved Main, permits later manual room changes, and remembers only
   catalogued rooms. The existing owner sign-in gate and server pass are required.
   The release owner handles the normal site publish. Verify the owner Social
   deep link before releasing its Postiz entry point.
2. Assemble the approved branding changes from
   [Postiz #2](https://github.com/namesrexx-design/bizbox-postiz/pull/2) and this
   provider/Agent change from
   [Postiz #3](https://github.com/namesrexx-design/bizbox-postiz/pull/3).
   They were built on fresh fork `origin/main`; production is currently v2.25.0.
   Confirm that the final source, frontend, backend, dependency lock and runtime
   are compatible before selecting a release image. Do not assume a frontend
   overlay onto the existing v2.25.0 backend installs this fix.
3. On Production, build an immutable candidate containing **both backend and
   frontend** from that final source. Run builds serially through
   `flock /run/lyfe-heavy.lock nice -n 10`. Keep the public AGPL source offer
   pointing to the exact deployed source. This patch changes no schema. Do not
   run `prisma-db-push`, reset a database, or use an entrypoint that invokes it.
4. Before changing Live Studio, the lead records the current immutable image,
   compose inputs and frontend/backend artifact paths. Preserve that complete
   known-good release as the rollback target. A temporary LinkedIn patch may be
   present in the live container but absent from its image: record and preserve
   the exact patched provider artifact and its matching source separately, without
   copying secrets. A stock image alone does not capture that patch. Preserve the existing secrets,
   uploads/config mounts, network, databases, Redis and Temporal state.
5. The lead releases only the application service using the concrete operator
   handoff after compatibility, image/startup, destination and approval gates
   pass. Keep the original container, complete private snapshot and all overlays.
   No datastore restart or schema write is authorized by this task.

## Candidate checks

- Run `node --test tests/social/*.test.cjs` with the repository dependencies.
  The production provider and real scope-check implementation run with mocked
  LinkedIn responses; Nest serves the actual Copilot controller over HTTP.
- Run the complete frontend and backend builds for the final combined source.
- At 390 x 844 on Chromium and WebKit, open the menu, inspect Agent Room's exact
  destination, and follow it into the owner's Social room with Main pre-saved.
  Verify an ordinary subsequent Main tap remains selected and an unknown room
  falls back to Main. Reject requests lacking the owner pass.
- Confirm legacy `/agents` and `/agents/new` redirect to the same owner URL.
- Using an authenticated application test session, POST `/copilot/chat` and
  `/copilot/agent`; each returns JSON HTTP 503 promptly regardless of key
  presence. Thread-history routes also return 503. `/copilot/credits` still
  serves media-credit lookups. Confirm no embedded popup or suggestion network
  request is present while composing or editing signatures.
- Generate and inspect the personal authorization URL without following it:
  exactly `openid profile w_member_social`, the personal callback and state.
  Confirm the separate Page provider still requests its organization scopes.
  Login/refresh fixtures must use `/v2/userinfo`, preserve `sub` as channel ID,
  and make no `/v2/me` request. Missing picture and absent vanity name are valid.
- Do not complete OAuth, reconnect real channels, change app products/permissions,
  or create/schedule/publish a post as a release smoke check.

## Rollback

If startup, login, composing, room navigation or the disabled endpoint check
fails, the lead restores the complete previous application image and its matching
frontend/backend overlays together, then recreates only that application service
with the same preserved env, networks and mounts. If the previous service used
an authorized temporary LinkedIn patch, the lead restores that recorded provider
artifact too; verify its reduced personal scopes/userinfo behavior without OAuth.
Do not silently revert the owner to the old broad-scope provider. Do not restore databases or
remove uploads. Verify the previous login/calendar health. Rolling back restores
the previous assistant behavior too; do not mistake a frontend-only rollback for
restoring backend behavior. Leave the new release artifact and logs intact.

The destination fix in BizBox #480 can remain independently: normal room visits
still use the saved room. If it also must be reverted, use a separate reviewed
source revert and the normal site publish procedure after removing the Postiz
entry point. No database rollback is involved.

## Validation status (2026-10-16)

The exact combined source is
[`7ddf86821b6e0ac2b42731d7d15f3e72dce5cfe3`](https://github.com/namesrexx-design/bizbox-postiz/tree/7ddf86821b6e0ac2b42731d7d15f3e72dce5cfe3).
All 21 focused tests pass in the public pinned toolchain with network disabled.
The complete backend TypeScript compile and complete production Next review build
both exit 0. The frontend used one worker, 2 CPUs, a 4.5 GiB container cap,
3 GiB V8 heap and disabled source maps. Earlier default-profile memory, jsdom
asset and font-loader failures are retained as failure history; the repaired
review build passes webpack, TypeScript, page-data and static generation.

Independent 390 × 844 Chromium/WebKit phone review is **PASS**, covering login,
calendar, menu/source and exact Agent destination, channel chooser and editor.
Builder browser smoke also passes both engines, including typing in the editor,
the Agent link into the isolated owner fixture, legacy redirects, no Copilot
requests, no API writes and no page errors. These checks use synthetic users,
channels and an owner pass; API writes are blocked. They establish no real OAuth,
connected-account or publication behavior. The companion BizBox #480 has 34
passing tests, successful CI and independent phone PASS; it remains unmerged.

**Release HOLD:** read-only inspection of all 85 candidate models against Live
column metadata found `Integration.customName` and `Post.batchId` absent. The
preview embeds `http://127.0.0.1:4027/api` in server output. Neither generating a
client nor passing the preview makes this artifact production compatible.
No full release image or frontend/backend/orchestrator startup check exists.
No extra compiler, migration, deployment or OAuth was run. The existing approval
card `appr_mvabgkmsa61a518f` is **approved**, confirmed by fresh signed readback
on 2026-10-16. Owner approval alone cannot clear these technical gates.
The later compatible integrated candidate passes fresh schema metadata comparison;
see [current release prerequisites](release-prerequisites-7636.md) for its exact
source, production URL requirements and still-open #480/image/startup gates.

The authoritative concrete operator instructions are in
[`operator-handoff-2519.md`](operator-handoff-2519.md). They supersede the generic
release/rollback steps above and PR2's stock-only rollback. The tested combined
source remains frozen; this documentation update does not claim a new build.

## Temporary LinkedIn patch snapshot and recovery

Read-only inspection on 2026-10-16 confirms both files in the running `postiz`
container:

```
/app/apps/backend/dist/libraries/nestjs-libraries/src/integrations/social/linkedin.provider.js
/app/apps/backend/dist/libraries/nestjs-libraries/src/integrations/social/linkedin.provider.js.bak-20261016
```

The first file is the current provider; the `.bak-20261016` is the pre-patch
backup. The release lead must preserve both before recreation, together with the
current image/compose/overlay snapshot and the matching temporary patch source.
These commands are release instructions only and were not executed by this task:

```sh
# Use a new release-owned rollback directory; do not copy env or credentials.
docker cp postiz:/app/apps/backend/dist/libraries/nestjs-libraries/src/integrations/social/linkedin.provider.js "$ROLLBACK_DIR/linkedin.provider.current.js"
docker cp postiz:/app/apps/backend/dist/libraries/nestjs-libraries/src/integrations/social/linkedin.provider.js.bak-20261016 "$ROLLBACK_DIR/linkedin.provider.js.bak-20261016"
```

Recovery order: restore the previous complete image and matching overlays into a
stopped app container using the saved compose inputs, copy
`linkedin.provider.current.js` back to the exact current-provider path, preserve
the `.bak-20261016` beside it, then start only that app service. Do not copy the
pre-patch backup over the current provider. Preserve data/env/networks/mounts.
Verify the restored personal provider requests only `openid profile w_member_social`
and uses `/v2/userinfo` for member mapping. Verify the durable replacement does the
same before switching over. No OAuth, account reconnect, migration or publishing
is needed for those static/fixture checks. A plain stock-image rollback alone
would lose the temporary running-container patch.
