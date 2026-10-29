#!/usr/bin/env bash
set -euo pipefail

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY must be set}"
: "${VERIFIED_SHA:?VERIFIED_SHA must be set}"
: "${GITHUB_OUTPUT:?GITHUB_OUTPUT must be set}"

# gh is authenticated by GH_TOKEN and requests the live default-branch ref.
# Any API failure is fatal so the deployment cannot proceed on uncertainty.
latest="$(gh api "repos/$GITHUB_REPOSITORY/git/ref/heads/main" --jq '.object.sha')"

if [[ "$latest" == "$VERIFIED_SHA" ]]; then
  echo "current=true" >> "$GITHUB_OUTPUT"
  echo "::notice::Verified SHA $VERIFIED_SHA is still the latest main HEAD"
else
  echo "current=false" >> "$GITHUB_OUTPUT"
  echo "::notice::Skipping stale CI result $VERIFIED_SHA; current main HEAD is $latest"
fi
