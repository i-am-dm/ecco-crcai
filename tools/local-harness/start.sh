#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.dev.yml"
COMPOSE_CMD="docker compose"

if ! docker compose version >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
  else
    echo "docker compose is required (Docker Desktop 2.20+)." >&2
    exit 1
  fi
fi

usage() {
  cat <<EOF
Ecco local harness

Usage:
  $0 [--watch] [--rebuild] [--detached] [--services <list>] [--project <id>] [--cred <path>]
  $0 --down
  $0 --logs [--services <list>]

Options:
  --watch           Run watch profile (tsc -w + node --watch). Mounts ./services/*/src and ./libs/ts/src.
  --rebuild         Pass --build to compose up.
  --detached        Run in background (-d).
  --services LIST   Comma-separated service names. Examples:
                    normal: snapshot-builder,manifest-writer,index-writer,rules-engine
                    watch:  libs-ts-watch,snapshot-builder-watch,manifest-writer-watch,index-writer-watch,rules-engine-watch
  --project ID      Export GOOGLE_CLOUD_PROJECT=ID for this run.
  --cred PATH       Export GOOGLE_APPLICATION_CREDENTIALS=PATH (mounted to /credentials/key.json).
  --down            Stop and remove containers.
  --logs            Follow logs for the selected services (defaults to the set implied by --watch).
  -h, --help        Show this help.

Examples:
  # Normal (non-watch) stack
  $0 --rebuild --detached

  # Watch mode (services + libs), foreground
  $0 --watch --rebuild

  # Only snapshot-builder in watch mode
  $0 --watch --services libs-ts-watch,snapshot-builder-watch
EOF
}

WATCH=false
REBUILD=false
DETACHED=false
DO_DOWN=false
DO_LOGS=false
SERVICES=""
PROJECT=""
CRED=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch) WATCH=true; shift ;;
    --rebuild) REBUILD=true; shift ;;
    --detached) DETACHED=true; shift ;;
    --services) SERVICES="$2"; shift 2 ;;
    --project) PROJECT="$2"; shift 2 ;;
    --cred) CRED="$2"; shift 2 ;;
    --down) DO_DOWN=true; shift ;;
    --logs) DO_LOGS=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

# Env wiring
if [[ -n "$PROJECT" ]]; then
  export GOOGLE_CLOUD_PROJECT="$PROJECT"
fi
if [[ -n "$CRED" ]]; then
  export GOOGLE_APPLICATION_CREDENTIALS="$CRED"
fi

# Convenience default for credentials if not set
if [[ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]]; then
  if [[ -f "${PWD}/credentials.json" ]]; then
    export GOOGLE_APPLICATION_CREDENTIALS="${PWD}/credentials.json"
    echo "Using GOOGLE_APPLICATION_CREDENTIALS=${GOOGLE_APPLICATION_CREDENTIALS}"
  else
    echo "Warning: GOOGLE_APPLICATION_CREDENTIALS not set and ./credentials.json not found. GCS/SM calls may fail." >&2
  fi
fi

if [[ "$DO_DOWN" == true ]]; then
  exec ${COMPOSE_CMD} -f "${COMPOSE_FILE}" down
fi

if [[ -z "$SERVICES" ]]; then
  if [[ "$WATCH" == true ]]; then
    SERVICES="libs-ts-watch,snapshot-builder-watch,manifest-writer-watch,index-writer-watch,rules-engine-watch"
  else
    SERVICES="snapshot-builder,manifest-writer,index-writer,rules-engine"
  fi
fi

SERVICE_ARGS=$(printf '%s' "$SERVICES" | tr ',' ' ')

BUILD_FLAG=""
[[ "$REBUILD" == true ]] && BUILD_FLAG="--build"

DETACH_FLAG=""
[[ "$DETACHED" == true ]] && DETACH_FLAG="-d"

PROFILE_FLAG=""
[[ "$WATCH" == true ]] && PROFILE_FLAG="--profile watch"

if [[ "$DO_LOGS" == true ]]; then
  # shellcheck disable=SC2086
  exec ${COMPOSE_CMD} -f "${COMPOSE_FILE}" ${PROFILE_FLAG} logs -f ${SERVICE_ARGS}
else
  # shellcheck disable=SC2086
  exec ${COMPOSE_CMD} -f "${COMPOSE_FILE}" ${PROFILE_FLAG} up ${BUILD_FLAG} ${DETACH_FLAG} ${SERVICE_ARGS}
fi
