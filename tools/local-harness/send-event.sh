#!/usr/bin/env bash
set -euo pipefail

# Simple helper to POST a Pub/Sub push-style event to a local service.
#
# Usage:
#   bash tools/local-harness/send-event.sh --service snapshot-builder \
#     --bucket ecco-studio-platform-data \
#     --name env/dev/ideas/IDEA-001/history/2025/11/06/example.json
#
# or specify a port directly:
#   bash tools/local-harness/send-event.sh --port 8081 --bucket ... --name ...

PORT=""
SERVICE=""
BUCKET=""
NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)
      PORT="$2"; shift 2;;
    --service)
      SERVICE="$2"; shift 2;;
    --bucket)
      BUCKET="$2"; shift 2;;
    --name)
      NAME="$2"; shift 2;;
    -h|--help)
      cat <<EOF
Usage:
  $0 --service <snapshot-builder|manifest-writer|index-writer|rules-engine> \
     --bucket <bucket> --name <objectName>
  or
  $0 --port <8081|8082|8083|8084> --bucket <bucket> --name <objectName>
EOF
      exit 0;;
    *)
      echo "Unknown arg: $1" >&2; exit 1;;
  esac
done

if [[ -n "$SERVICE" && -z "$PORT" ]]; then
  case "$SERVICE" in
    snapshot-builder) PORT=8081;;
    manifest-writer)  PORT=8082;;
    index-writer)     PORT=8083;;
    rules-engine)     PORT=8084;;
    *) echo "Unknown service: $SERVICE" >&2; exit 1;;
  esac
fi

if [[ -z "$PORT" || -z "$BUCKET" || -z "$NAME" ]]; then
  echo "Missing required args. See --help." >&2
  exit 1
fi

EVENT_JSON=$(printf '{"bucket":"%s","name":"%s"}' "$BUCKET" "$NAME")
B64=$(printf '%s' "$EVENT_JSON" | base64 | tr -d '\n')
PAYLOAD=$(printf '{"message":{"data":"%s"}}' "$B64")

echo "POST http://localhost:${PORT}/pubsub/push"
curl -sS "http://localhost:${PORT}/pubsub/push" \
  -H 'content-type: application/json' \
  -d "$PAYLOAD"
echo

