#!/usr/bin/env bash
# Копирует веб-часть «Библейского космоса» в assets Android-приложения
# и кладёт рядом three.js, чтобы 3D работало без интернета.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
web="$here/.."
assets="$here/app/src/main/assets"
rm -rf "$assets"
mkdir -p "$assets/vendor"
cp "$web/index.html" "$web/app.js" "$web/sky.js" "$web/bible-import.js" "$assets/"
cp -r "$web/data" "$assets/data"
cp "$web/vendor/anthropic-sdk.js" "$assets/vendor/anthropic-sdk.js"
tmp="$(mktemp -d)"
(cd "$tmp" && npm pack three@0.160.0 --silent >/dev/null && tar -xzf three-0.160.0.tgz)
cp "$tmp/package/build/three.module.js" "$assets/vendor/three.module.js"
(cd "$tmp" && npm pack jszip@3.10.1 --silent >/dev/null && mkdir -p jz && tar -xzf jszip-3.10.1.tgz -C jz)
cp "$tmp/jz/package/dist/jszip.min.js" "$assets/vendor/jszip.min.js"
rm -rf "$tmp"
echo "assets ready: $(du -sh "$assets" | cut -f1)"
