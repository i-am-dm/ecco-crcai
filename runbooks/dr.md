Disaster Recovery Runbook

Scope
- Restore from noncurrent object versions
- Rebuild manifests and indices
- Rotate CMEK and recover access

Prereqs
- `gcloud`, `gsutil`, `bq` installed and authenticated
- Project and bucket name known; environment prefix (`env/dev|stg|prod`)

Restore Snapshot From Previous Version
- List object versions:
  gsutil ls -a gs://$BUCKET/env/$ENV/snapshots/$SEGMENT/$ID.json
- Copy specific generation to current:
  gsutil cp gs://$BUCKET/env/$ENV/snapshots/$SEGMENT/$ID.json#${GEN} gs://$BUCKET/env/$ENV/snapshots/$SEGMENT/$ID.json

Bulk Restore (pattern)
- Export object list with generations:
  gsutil ls -a gs://$BUCKET/env/$ENV/snapshots/$SEGMENT/* > objects.txt
- For each line with `#GEN`, copy to the same path without the `#GEN` fragment.

Rebuild Manifests
- Using CLI (fast path):
  apps/write-cli: npm run build
  node apps/write-cli/dist/index.js rebuild-manifests --bucket $BUCKET --env $ENV --entity all

Rebuild Manifest Shards
- For all entities (full):
  node services/manifest-compactor/dist/index.js --bucket $BUCKET --env $ENV --entity ideas --shards 256
  node services/manifest-compactor/dist/index.js --bucket $BUCKET --env $ENV --entity ventures --shards 256
  node services/manifest-compactor/dist/index.js --bucket $BUCKET --env $ENV --entity rounds --shards 256
  node services/manifest-compactor/dist/index.js --bucket $BUCKET --env $ENV --entity cap_tables --shards 256
- For hot paths (delta since 24h):
  node services/manifest-compactor/dist/index.js --bucket $BUCKET --env $ENV --entity ventures --since 24h

CMEK Rotation
- Rotate key per policy in Terraform (`kms_key_rotation_period`), or rotate manually:
  gcloud kms keys versions create --key $KEY --keyring $RING --location $LOC
- Update bucket default KMS if changed (Terraform preferred).

Access Recovery
- Verify IAM conditions and roles; re-grant role bindings as needed:
  gsutil iam ch serviceAccount:PRINCIPAL:roles/storage.objectViewer gs://$BUCKET
- Validate access by reading a known snapshot object.

Validation
- Sample analytics query in BigQuery should return rows for the restored IDs.
- UI or downstream readers can fetch restored snapshots/manifests.
