#!/usr/bin/env bash
# Пересобирает vendor/anthropic-sdk.js — официальный SDK Anthropic одним файлом для браузера (нужен советнику).
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
ver="${1:-1.3.0}"
tmp="$(mktemp -d)"
cd "$tmp"
npm init -y >/dev/null
npm i "@anthropic-ai/sdk@$ver" esbuild@0.28.2 --no-audit --no-fund >/dev/null
echo "export { default } from '@anthropic-ai/sdk';" > entry.mjs
npx esbuild entry.mjs --bundle --format=esm --platform=browser --minify --legal-comments=eof --outfile=out.mjs
{ echo "/* @anthropic-ai/sdk $ver (Apache-2.0 or MIT, Copyright 2023 Anthropic, PBC) — bundled for the browser by tools/build-ai-sdk.sh. Do not edit. */"; cat out.mjs; } > "$here/vendor/anthropic-sdk.js"
cd "$here" && rm -rf "$tmp"
echo "vendor/anthropic-sdk.js: $(wc -c < vendor/anthropic-sdk.js) bytes"
