#!/usr/bin/env bash
# Post-deploy verification: the published Pages artifact itself must declare
# the exact CI-tested main SHA and expose the static course entry points.
set -euo pipefail
: "${PAGES_URL:?PAGES_URL must be set}"
: "${VERIFIED_SHA:?VERIFIED_SHA must be set}"
base="${PAGES_URL%/}"
tries="${VERIFY_ATTEMPTS:-20}"
delay="${VERIFY_DELAY_SECONDS:-3}"
for (( i=1; i<=tries; i++ )); do
  observed="$(curl --fail --location --silent --show-error --connect-timeout 5 --max-time 12 \
    "$base/release-sha.txt?verified=$VERIFIED_SHA&attempt=$i" 2>/dev/null || true)"
  if [[ "$observed" == "$VERIFIED_SHA" ]]; then
    for asset in index.html middle.html advanced.html advanced-models.js; do
      curl --fail --location --silent --show-error --connect-timeout 5 --max-time 12 \
        "$base/$asset?verified=$VERIFIED_SHA" -o /dev/null
    done
    echo "::notice::Public Pages artifact and four core assets verified for $VERIFIED_SHA"
    exit 0
  fi
  sleep "$delay"
done
echo "::error::Public Pages release-sha.txt is absent or not the verified SHA ($VERIFIED_SHA)" >&2
exit 1
