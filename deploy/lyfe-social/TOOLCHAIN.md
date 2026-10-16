# Compatibility toolchain

Pinned public image:

```
ghcr.io/gitroomhq/postiz-app@sha256:7eb4a553507ce3f200deff2ec0211ab3cf834ba19eb44dd68e83ccc236509feb
```

The accepted PR3 review inspected Node 22.20.0, pnpm 10.6.1, Next 16.3.1,
TypeScript 5.5.4 and Prisma 6.5.0 in this image. Its pnpm lock matches this
source. The compatibility check uses that immutable image directly; it generates
its own client in a disposable writable layer and copies only that generated
client into a fresh output directory. Source mounts are read-only, networking is
disabled and no live env is supplied. Nothing calls db push, migrate or startup.

`tests/compatibility/run.sh` uses one CPU and a 1 GiB cap per sequential job.
It runs focused behavioral checks, not a full TypeScript/application compile.
Imported service boundaries are substituted; tested source methods, Prisma
model metadata, real Nest HTTP handling and rendered React markup are exercised.

`Dockerfile.review` is the future production full-image recipe, not a built
artifact. It carries the accepted one-worker/source-map-free Next configuration,
3 GiB heap, native jsdom loading, guarded Next font parser and offline Prisma
generation. It compiles frontend, backend and orchestrator sequentially. All
existing upstream notices remain; the application is AGPL-3.0. The font guard
changes the installed Next loader only inside the disposable image layer, retaining
its MIT notices and the existing font bytes. Its complete source is in build-tools.

See `docs/social-lyfe/schema-compatibility-2519.md` for integration dependencies,
future image resource limits, private-mirror/signed-in source offer and release gates. This toolchain image is never the
selected release image. The full image and isolated startup remain unbuilt.
