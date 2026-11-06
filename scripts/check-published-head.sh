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
    for asset in workbench/opamp-course.html workbench/ee-opamp-course.css workbench/12_opamp_slew_rate/01_slew_rate.html workbench/12_opamp_slew_rate/02_step_response.html workbench/12_opamp_slew_rate/03_sine_fpbw.html workbench/12_opamp_slew_rate/04_gbw_vs_slew.html workbench/12_opamp_slew_rate/05_settling_time.html workbench/12_opamp_slew_rate/06_datasheet_selection.html \
      index.html middle.html advanced.html advanced-models.js \
      workbench/opamp-step.html workbench/opamp-sine.html workbench/ee-opamp.js workbench/ee-opamp.css workbench/12_opamp_slew_rate/assets/opamp.js workbench/12_opamp_slew_rate/assets/opamp.css workbench/adc.html workbench/ee-adc.js workbench/index.html workbench/topology.html workbench/ee-host.js \
      workbench/ee-topology-entry.js workbench/assets/learning/workspace-topology-ui.js \
      workbench/assets/learning/model-contracts-v1.json workbench/source-manifest.json workbench/applications.html workbench/ee-applications-entry.js workbench/ee-applications-contract.js workbench/ee-applications.css workbench/assets/learning/topology-application-ui.js workbench/17_power_topology_control/app.js workbench/17_power_topology_control/style.css; do
      curl --fail --location --silent --show-error --connect-timeout 5 --max-time 12 \
        "$base/$asset?verified=$VERIFIED_SHA" -o /dev/null
    done
    echo "::notice::Public Pages artifact and course/workbench assets verified for $VERIFIED_SHA"
    exit 0
  fi
  sleep "$delay"
done
echo "::error::Public Pages release-sha.txt is absent or not the verified SHA ($VERIFIED_SHA)" >&2
exit 1
