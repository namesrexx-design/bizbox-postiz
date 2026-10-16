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
   known-good release as the rollback target. Preserve the existing secrets,
   uploads/config mounts, network, databases, Redis and Temporal state.
5. The lead releases only the application service using its established compose
   procedure after review and readiness checks. Keep the saved old image and all
   overlays. No datastore restart or migration is needed for these changes.

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
with the same preserved env, networks and mounts. Do not restore databases or
remove uploads. Verify the previous login/calendar health. Rolling back restores
the previous assistant behavior too; do not mistake a frontend-only rollback for
restoring backend behavior. Leave the new release artifact and logs intact.

The destination fix in BizBox #480 can remain independently: normal room visits
still use the saved room. If it also must be reverted, use a separate reviewed
source revert and the normal site publish procedure after removing the Postiz
entry point. No database rollback is involved.

## Validation status

The 18 focused checks pass, including production provider methods, real scope
validation, admin/member navigation, three redirect routes, native server sanitizer
loading and actual Nest HTTP disabled responses. Vite production build and 34
navigation/owner-access/room API tests pass for the companion destination change;
its 390 x 844 Chromium and WebKit browser checks also pass.

The complete backend compile passes with the matching client generated offline
from the candidate schema. The older cached generated client lacked main's
`customName`/`batchId` fields. Compare the production schema before release;
this work performs no migrations.

The source-map-enabled frontend hit its 6 GiB container memory cap. The no-maps
review profile passed webpack and TypeScript, then page-data collection exposed
jsdom's missing bundled `browser/default-stylesheet.css`. The app now configures
native Node loading of `isomorphic-dompurify` and `jsdom`; the sanitizer still
passes its unsafe-HTML check. A full retry and calendar/editor/channel smoke are
pending the coordinator's next slot after web-app. Keep the earlier failed gates
until that run and the independent check pass.

Exact public build configuration and compiler scripts are in
`deploy/lyfe-social/REVIEW-BUILD.md`. All settings and source must accompany the
final candidate; the review profile disables source maps and limits compiler
workers to one. No deployment or OAuth test has occurred.
