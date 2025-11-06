# Canary Deploy and Rollback

Steps (Cloud Run):
- Deploy new revision with 5% traffic using Terraform or gcloud.
- Monitor error ratio and latency (see Monitoring dashboard).
- Increase to 25% → 50% → 100% if stable.
- Rollback by shifting traffic back to previous revision if alerts fire.

gcloud example:
```
gcloud run services update-traffic api-edge --to-revisions REV_NEW=5,REV_OLD=95 --region REGION
```

