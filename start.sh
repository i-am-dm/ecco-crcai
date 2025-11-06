#!/usr/bin/env bash
set -euo pipefail

# Thin wrapper to the local harness starter
exec bash tools/local-harness/start.sh "$@"

