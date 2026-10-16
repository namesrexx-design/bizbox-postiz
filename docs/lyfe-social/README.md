# LYFE Social branding

Task 2452. Fresh branch from this fork's `origin/main`; reuses the approved LYFEY assets from PR #1. No deployment files or historical payloads are carried forward.

The sign-in and sidebar logos, preview header, page titles, icons, sky-blue accents, logout text and transactional emails use LYFE Social. The sign-in panel uses neutral calendar copy instead of upstream customer counts and testimonials.

Postiz attribution and the upstream AGPL-3.0 LICENSE remain. The visible Source link is on the login, sidebar and root footer. `NEXT_PUBLIC_SOURCE_CODE_URL` defaults to this public PR branch (retain it until released source is pinned); a release should set it at build time to the full deployed commit URL, including any combined provider changes.

The approved artwork is reused byte-for-byte from `apps/frontend/public/social-lyfe.png`, `social-lyfe-180.png`, `favicon.png` and `favicon.ico` in PR #1. Provenance: owner-supplied `namesrexx-design/bizbox/public/media/start/lyfey-awake.png`; original SHA256 `99229f0bd4d18b910ca24e728edf895cb8af867211d88f418ee4ec82ad09701c`. No generated replacement art. Existing upstream marks remain in source for attribution and compatibility.

Email delivery keeps the existing provider, sender address, reply-to, notification preferences, queue and retry behavior. Configure `EMAIL_FROM_NAME="LYFE Social"` for the branded sender display name. Auth links and expiry behavior are unchanged; QA renders messages without sending them.

Email template tests pass. Independent reviewer w3 rendered the actual template in Chromium/WebKit on a 390px phone with no overflow or broken logo. [Phone email](email-phone-webkit.png). The image is a local test rendering; no email was sent.

The current Live sign-in before views are [WebKit](before-phone-webkit.png) and [Chromium](before-phone-chromium.png), both 390×844. Current auth after views follow the combined PR #2/#3 build. Full frontend compilation is currently held by memory failures; w2 owns the sole combined build and the auth preview handoff. Production-only build and preview; no merge or deploy is part of this task.

Tools: cached lock-matching Postiz build image, Next.js/TypeScript, Jest, Playwright Chromium/WebKit. Existing approved artwork makes generation, Blender and GPU work unnecessary.
