# Public review toolchain provenance

The review scripts now use this public immutable image directly:

```
ghcr.io/gitroomhq/postiz-app@sha256:7eb4a553507ce3f200deff2ec0211ab3cf834ba19eb44dd68e83ccc236509feb
```

A reader with Docker can pull that digest; no Production-only tag is needed.
`Dockerfile.toolchain` is an optional alias recipe containing exactly that FROM
instruction and provenance labels. No dependency install, new tool version,
application startup or database operation is hidden in the alias.

Read-only inspection of both that digest and the earlier local
`bizbox-postiz:candidate-345426c-v2.25.0` verifies Node v22.20.0, pnpm 10.6.1,
Next 16.3.1, TypeScript 5.5.4 and Prisma 6.5.0. The root package manifest, pnpm
lock and Next/TypeScript/Prisma package manifests match byte for byte. The lock is
`a80b52413e65fc53791524120ef4fa300a2815020885961801ebed02cf9f1fee`, matching the
selected fork. Linux uses glibc 2.36.

The prior local image has inspected ID
`sha256:0d2a19db134f4e2fb308d81d67142f307494e934221acdb43ba7117e3f856391`.
Its OCI labels identify the same pinned upstream base and the public source
[345426c](https://github.com/namesrexx-design/bizbox-postiz/tree/345426c123b1109b0937155c3a8f5aafdc02d824).
The preserved historical Dockerfile removes the old frontend `.next`, copies its
built frontend and frontend source, offers complete source under `/usr/src/postiz`,
and copies the upstream licence/manifest. It contains no install or compiler
replacement step. Thus the historical application payload differs from the
upstream base while the inherited compiler/dependencies do not. The new scripts
avoid that historical application payload entirely: candidate source/output/client
mounts and the public upstream toolchain are explicit.

For a fresh candidate checkout, follow `REVIEW-BUILD.md`: pre-create the ignored
output/type-stub mountpoints, generate the candidate Prisma client offline,
compile the complete backend, and run the bounded Next review build only in its
coordinated shared slot. All containers override the inherited entrypoint and do
not start the vendor application initializer. Native dependency licences remain
in the pinned image; the candidate keeps upstream AGPL notices and the matching
source offer.

The Next 16.3.1 font-loader guard and exact helper source are in `build-tools/`.
They preserve downloaded font bytes and normal font-file extensions; query URLs
and extensionless WOFF/WOFF2 responses no longer trigger the loader's unchecked
regex. The selected Plus Jakarta Sans family, styles and weights remain those in
the application source. No replacement font files or mock font responses are used.
