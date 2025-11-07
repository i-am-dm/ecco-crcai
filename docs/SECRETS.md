# Secrets and Environment Variables

This repo uses environment variables for local development. Production secrets should live in Google Secret Manager and Cloud Run/CI env vars.

Quick start (local)
- Copy `.env.example` → `.env` and fill in values.
- Export variables into your shell when running services locally:
  - macOS/Linux: `set -a; source .env; set +a`
  - or: `export $(grep -v '^#' .env | xargs)`
- Start a service (example): `npm run build -w services/manifest-writer && npm start -w services/manifest-writer`

Notes
- Cloud Run services read configuration from environment variables at deploy time. Use Secret Manager for sensitive data where possible.
- `GOOGLE_APPLICATION_CREDENTIALS` may be required locally to access GCS/Secret Manager with a service account JSON.
- The code prefers default ADC on GCP; locally, ensure `GCP_PROJECT/GOOGLE_CLOUD_PROJECT` and credentials are set.

Security
- `.env` is ignored by git. Never commit real secrets.
- Prefer Secret Manager in prod. The rules engine also supports `sm://SECRET_NAME` targets to fetch webhooks securely.

Fetching secrets into a local .env
- Build the helper: `npm run build -w tools/secret-pull`
- Pull by names (writes `.env.local`):
  - `node tools/secret-pull/dist/index.js --project YOUR_PROJECT --out .env.local --secrets slack_webhook:ALERTS_WEBHOOK_URL`
- You can pass full resource paths and map to env keys:
  - `node tools/secret-pull/dist/index.js --out .env.local --secrets projects/YOUR_PROJECT/secrets/slack_webhook/versions/latest:ALERTS_WEBHOOK_URL`

Comment + Slack notifications (FR-4)
- `COMMENTS_SLACK_WEBHOOK` (optional) — Incoming webhook URL used by `/v1/ideas/{id}/comments`. Falls back to `ALERTS_WEBHOOK_URL` when unset.
- Store the webhook URL in Secret Manager (e.g., `sm://slack_comment_webhook`) and resolve it into the env var during deploys.

Rules engine + secrets
- In rule files, set `action.target` to `sm://YOUR_SECRET_NAME` to resolve via Secret Manager at runtime.
