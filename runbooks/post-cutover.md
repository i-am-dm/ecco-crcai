# Post-Cutover Validation & Monitoring

Checklist:
- API Gateway resolves endpoints; 2xx/5xx ratio healthy.
- Pub/Sub DLQs empty; subscriptions consuming.
- Manifest shards up-to-date; compactor jobs succeeding.
- Rules engine alerts flowing to webhook target.
- Dashboards and alerts enabled; SLO burn-rate within budget.

Smoke tests:
- GET /v1/venture?env=prod returns items.
- GET /v1/venture/{id}?env=prod returns snapshot.

