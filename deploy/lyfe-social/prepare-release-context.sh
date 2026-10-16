#!/usr/bin/env bash
set -euo pipefail
# Packaging only: no build, database, credentials or untracked working files.
repo=$(git rev-parse --show-toplevel)
revision=$(git rev-parse --verify "${1:?Pass the reviewed commit}^{commit}")
context=${2:?Pass a new absolute context directory}
[[ "$context" = /* ]] || { echo 'Context must be absolute' >&2; exit 1; }
test ! -e "$context"
# Corresponding source includes build scripts, dependencies lock, notices/assets.
# Refuse submodules rather than silently distributing an incomplete source offer.
test -z "$(git -C "$repo" ls-tree -r "$revision" | awk '$1 == "160000"')"
mkdir -p "$context/source"
git -C "$repo" archive --format=tar "$revision" | gzip -n > "$context/source-archive.tar.gz"
tar -xzf "$context/source-archive.tar.gz" -C "$context/source"
test -s "$context/source/LICENSE"
cp "$context/source/deploy/lyfe-social/Dockerfile.review" "$context/Dockerfile"
digest=$(sha256sum "$context/source-archive.tar.gz" | cut -d ' ' -f 1)
cat > "$context/build.args" <<EOF
RELEASE_REV=$revision
RELEASE_SOURCE_SHA256=$digest
NEXT_PUBLIC_SOURCE_CODE_URL=https://social.biz-box.io/api/source/$revision.tar.gz
EOF
echo "Prepared exact source and build context for $revision; compiler not started."
