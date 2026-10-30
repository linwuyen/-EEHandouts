#!/usr/bin/env bash
# Build-time only: fetch a pinned PDF.js npm release, validate the COMPLETE
# tarball against its npm SHA-512 integrity, then serve PDF.js from our origin.
# The user's PDF is never sent to npm/CDN; this script runs during build.
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="4.10.38"
URL="https://registry.npmjs.org/pdfjs-dist/-/pdfjs-dist-${VERSION}.tgz"
EXPECTED_SHA512_B64="/Y3fcFrXEAsMjJXeL9J8+ZG9U01LbuWaYypvDW2ycW1jL269L3js3DVBjDJ0Up9Np1uqDXsDrRihHANhZOlwdQ=="
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

curl --fail --location --silent --show-error --retry 3 \
  --proto '=https' --proto-redir '=https' "$URL" -o "$STAGING/pdfjs.tgz"
ACTUAL_SHA512_B64="$(openssl dgst -sha512 -binary "$STAGING/pdfjs.tgz" | openssl base64 -A)"
if [[ "$ACTUAL_SHA512_B64" != "$EXPECTED_SHA512_B64" ]]; then
  echo "PDF.js ${VERSION} npm integrity mismatch; refusing to package unverified JavaScript" >&2
  exit 1
fi

tar -xzf "$STAGING/pdfjs.tgz" -C "$STAGING" \
  package/build/pdf.min.mjs package/build/pdf.worker.min.mjs package/LICENSE
mkdir -p "$ROOT/vendor/pdfjs"
install -m 0644 "$STAGING/package/build/pdf.min.mjs" "$ROOT/vendor/pdfjs/pdf.min.mjs"
install -m 0644 "$STAGING/package/build/pdf.worker.min.mjs" "$ROOT/vendor/pdfjs/pdf.worker.min.mjs"
install -m 0644 "$STAGING/package/LICENSE" "$ROOT/vendor/pdfjs/LICENSE"
test -s "$ROOT/vendor/pdfjs/pdf.min.mjs"
test -s "$ROOT/vendor/pdfjs/pdf.worker.min.mjs"
echo "Verified and staged local PDF.js ${VERSION} module/worker"
