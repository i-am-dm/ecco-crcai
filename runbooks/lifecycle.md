# Lifecycle Simulation

Objective: Confirm lifecycle rules transition history objects and prune noncurrent snapshots.

Procedure:
- Upload test objects under `env/dev/ventures/V-TEST/history/...` with dates >30d.
- Use `gsutil rewrite` or temp buckets to simulate age transitions.
- Verify `storageClass` transitions to NEARLINE at 30d and COLDLINE at 180d.
- Verify noncurrent versions of `snapshots/` pruned except last 10 and >30d old.

Commands:
```
gsutil stat gs://$BUCKET/env/dev/snapshots/ventures/V-TEST.json#<gen>
```

