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
  $0 [--watch] [--rebuild] [--detached] [--services <list>] [--project <id>] [--bucket <name>] [--cred <path>]
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
  --bucket NAME     Set DATA_BUCKET for api-edge/services (default: ecco-studio-platform-data).
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
NO_DOWN=false
KILL_PORTS=false
PORTS=(8080 8081 8082 8083 8084)
SERVICES=""
PROJECT=""
BUCKET=""
CRED=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch) WATCH=true; shift ;;
    --rebuild) REBUILD=true; shift ;;
    --detached) DETACHED=true; shift ;;
    --services) SERVICES="$2"; shift 2 ;;
    --project) PROJECT="$2"; shift 2 ;;
    --bucket) BUCKET="$2"; shift 2 ;;
    --cred) CRED="$2"; shift 2 ;;
    --down) DO_DOWN=true; shift ;;
    --no-down) NO_DOWN=true; shift ;;
    --kill-ports) KILL_PORTS=true; shift ;;
    --logs) DO_LOGS=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

# Env wiring
if [[ -n "$PROJECT" ]]; then
  export GOOGLE_CLOUD_PROJECT="$PROJECT"
fi
if [[ -n "$BUCKET" ]]; then
  export DATA_BUCKET="$BUCKET"
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

# Ensure local data root exists for fs-backed services (api-edge)
if [[ -z "${LOCAL_DATA_DIR:-}" ]]; then
  export LOCAL_DATA_DIR="${PWD}/tools/local-harness/bucket"
fi
mkdir -p "${LOCAL_DATA_DIR}"
if [[ ! -e "${LOCAL_DATA_DIR}/env" ]]; then
  echo "Priming local bucket at ${LOCAL_DATA_DIR} from docs/examples..."
  if command -v rsync >/dev/null 2>&1; then
    rsync -a "${PWD}/docs/examples/" "${LOCAL_DATA_DIR}/" >/dev/null
  else
    cp -R "${PWD}/docs/examples/." "${LOCAL_DATA_DIR}/"
  fi
fi

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-$(basename "$PWD")}"
export COMPOSE_HTTP_TIMEOUT="${COMPOSE_HTTP_TIMEOUT:-600}"
export PNPM_YES="${PNPM_YES:-1}"

if [[ "$DO_DOWN" == true ]]; then
  exec ${COMPOSE_CMD} -f "${COMPOSE_FILE}" down --remove-orphans
fi

# Always stop existing project containers unless explicitly skipped
if [[ "$NO_DOWN" != true ]]; then
  ${COMPOSE_CMD} -f "${COMPOSE_FILE}" down --remove-orphans >/dev/null 2>&1 || true
fi

# Optionally free ports by killing host processes (outside of Docker)
if [[ "$KILL_PORTS" == true ]]; then
  for p in "${PORTS[@]}"; do
    if command -v lsof >/dev/null 2>&1; then
      PIDS=$(lsof -ti tcp:"$p" || true)
      if [[ -n "$PIDS" ]]; then
        echo "Killing processes on port $p: $PIDS"
        kill -9 $PIDS || true
      fi
    fi
  done
fi

if [[ -z "$SERVICES" ]]; then
  if [[ "$WATCH" == true ]]; then
    SERVICES="libs-ts-watch,snapshot-builder-watch,manifest-writer-watch,index-writer-watch,rules-engine-watch,api-edge-watch,ui-watch"
  else
    SERVICES="snapshot-builder,manifest-writer,index-writer,rules-engine,api-edge,ui"
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
