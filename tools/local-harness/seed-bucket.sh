#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <bucket> [env=dev]" >&2
  exit 1
fi

BUCKET="$1"
ENV_NAME="${2:-dev}"

# Build write-cli if needed
ROOT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$ROOT_DIR"

echo "Building write-cli..."
npm run -s build -w apps/write-cli >/dev/null

ROOT="$ROOT_DIR/apps/write-cli/samples/seed"
echo "Seeding $BUCKET (env=$ENV_NAME) from $ROOT ..."

node apps/write-cli/dist/index.js seed-dir --bucket "$BUCKET" --env "$ENV_NAME" --root "$ROOT" --snapshots true
echo "Done."

