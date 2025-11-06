# Rules Engine (Cloud Run)

Evaluates JSON-defined rules when snapshots finalize and writes alert records to `reports/alerts/`.

Rule format (example)
```json
{
  "id": "RULE-LOW-MRR",
  "entity": "rule",
  "env": "prod",
  "schema_version": "1.0.0",
  "created_at": "2025-11-01T00:00:00Z",
  "updated_at": "2025-11-01T00:00:00Z",
  "match": {
    "entity": "venture",
    "conditions": [
      {"path": "kpis.MRR", "op": "lt", "value": 10000},
      {"path": "status", "op": "eq", "value": "Pilot"}
    ]
  },
  "action": {
    "type": "alert",
    "channel": "log",
    "severity": "warn"
  },
  "description": "Alert when ventures in Pilot stage drop below 10k MRR"
}
```

Behavior
- Trigger: Pub/Sub push for snapshot OBJECT_FINALIZE events.
- Loads rules from `env/{env}/rules/*.json`.
- Evaluates conditions (eq/neq/lt/lte/gt/gte/includes/not_includes/exists/missing).
- Writes alert records to `env/{env}/reports/alerts/{ruleId}/{entityId}/{alertUlid}.json`.
- Dispatches alerts via:
  - `channel: "log"` (default) → JSON log
  - `channel: "webhook"` → POST alert payload to `action.target`
    - Secret Manager target: `sm://SECRET_NAME` or full resource path
    - Env var target: `env://ENV_VAR_NAME` (e.g., `env://ALERTS_WEBHOOK_URL`)
    - Local fallback: if `action.target` is omitted and `ALERTS_WEBHOOK_URL` is set, it will be used

Secrets
- Grant the Cloud Run service account `roles/secretmanager.secretAccessor`.
- Configure rule `action.target` as `sm://YOUR_SECRET` (secret contains webhook URL), or `env://ALERTS_WEBHOOK_URL` for local testing.
- Alternatively set `action.target` to a literal URL (e.g., Slack webhook).

Local run
- `npm i && npm run build && npm start`
- POST a base64-encoded event to `/pubsub/push` to simulate.

Deployment
- Deploy to Cloud Run with push subscription on snapshot topic.
- Grant bucket read for `rules/` and write for `reports/alerts/` to service account.
- Optionally configure Secret Manager for webhook credentials when adding external notifications.
