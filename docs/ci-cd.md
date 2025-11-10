# CI/CD with GitHub Actions + GCP (Cloud Run)

This repository now ships with a full CI/CD pipeline using GitHub Actions and Google Cloud. It builds/tests the monorepo, validates Dockerfiles, pushes images to Artifact Registry, and applies Terraform to deploy Cloud Run services. It also includes ChatOps to trigger deploys from PR/issue comments.

## Workflows

- `.github/workflows/ci.yml` — Build + test monorepo; validate service Dockerfiles build.
- `.github/workflows/terraform.yml` — Terraform init/validate/plan on infra changes; manual plan by env.
- `.github/workflows/deploy.yml` — Build and push service images and the unified `ecco-studio` image; Terraform apply for Cloud Run + IAM + Pub/Sub.
- `.github/workflows/chatops.yml` — `/deploy env=dev|stg|prod` comment dispatches `deploy.yml`.

## Required GitHub Secrets

Set the following repository secrets:

- `GCP_PROJECT_ID` — Target GCP project ID.
- `GCP_REGION` — GCP region (e.g., `us-central1`).
- `GAR_REPOSITORY` — Artifact Registry repo (default `services`).
 - Optional: `ECCO_STUDIO_SERVICE_NAME` — Override service name if not `ecco-studio`.
- `GCP_WORKLOAD_IDENTITY_PROVIDER` — Workload Identity Provider resource (e.g., `projects/123456789/locations/global/workloadIdentityPools/gh-pool/providers/gh-provider`).
- `GCP_SERVICE_ACCOUNT_EMAIL` — Deployer SA email (e.g., `terraform-deployer@<project>.iam.gserviceaccount.com`).
 - Optional: `API_JWT_ISSUER_SECRET_NAME` and `API_JWT_AUDIENCE_SECRET_NAME` — Secret Manager names (not values) used by API auth; passed to Terraform to wire Cloud Run env.
 - Optional (Terraform remote backend):
   - `TF_BACKEND_BUCKET` — GCS bucket for Terraform state (e.g., `crc-ai-tf-state`).
   - `TF_BACKEND_PREFIX` — Path/prefix in the bucket (e.g., `ecco-crcai/infra`).

## One‑Time GCP Setup (Workload Identity Federation)

1) Create a Workload Identity Pool + Provider for GitHub OIDC and bind to a deployer SA.

```bash
gcloud iam service-accounts create terraform-deployer \
  --display-name="Terraform Deployer"

gcloud iam workload-identity-pools create gh-pool \
  --project=${GCP_PROJECT_ID} --location=global \
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc gh-provider \
  --project=${GCP_PROJECT_ID} --location=global \
  --workload-identity-pool=gh-pool \
  --display-name="GitHub OIDC" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --issuer-uri="https://token.actions.githubusercontent.com"

gcloud iam service-accounts add-iam-policy-binding \
  terraform-deployer@${GCP_PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/gh-pool/attribute.repository:${GITHUB_OWNER}/${GITHUB_REPO}"

# Grant deployer the needed roles (narrow as appropriate)
gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} \
  --member=serviceAccount:terraform-deployer@${GCP_PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/run.admin
gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} \
  --member=serviceAccount:terraform-deployer@${GCP_PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/artifactregistry.writer
gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} \
  --member=serviceAccount:terraform-deployer@${GCP_PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/storage.admin
gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} \
  --member=serviceAccount:terraform-deployer@${GCP_PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/pubsub.admin
```

2) Add `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_SERVICE_ACCOUNT_EMAIL` to repo secrets.

3) Ensure Artifact Registry exists (Terraform module `infra/terraform/artifact_registry.tf` creates it). If not, run a one‑time `terraform apply` for infra.

## Usage

- CI runs automatically on PRs and pushes to `main`.
- Deploys:
  - Auto on push to `main` (defaults to `dev` environment). This builds/pushes the `ecco-studio` container and updates the `ecco-studio` Cloud Run service in `${GCP_REGION}`.
  - Manual: Actions → `Deploy (Cloud Run + Terraform)` → Run workflow → choose `environment`.
  - ChatOps: comment `/deploy env=stg` on a PR or issue to dispatch deploy to staging.
  - If `apply_terraform` is enabled, the workflow will attempt to import the existing `ecco-studio` Cloud Run v2 service into Terraform state before applying.
  - Plan-only: comment `/plan env=stg` to run Terraform plan for staging.

The deploy workflow builds and pushes images for these services when their directories exist: `api-edge`, `snapshot-builder`, `manifest-writer`, `index-writer`, `rules-engine`, `search-feed`, `manifest-compactor`. It then generates a tfvars with image digests and applies Terraform, wiring Cloud Run + Pub/Sub + IAM using values in `infra/terraform/*.tfvars` for the selected environment.

## Notes

- Terraform backend is local by default. For team environments, set `TF_BACKEND_BUCKET` and `TF_BACKEND_PREFIX` repo secrets; the workflows will write `infra/terraform/backend.hcl` and use it for `terraform init -reconfigure`.
- Environment protections: in GitHub → Settings → Environments, add `dev`, `stg`, `prod` and require reviewers for `stg`/`prod`. The deploy job already targets the selected environment so approvals will gate it.
- Environment protections can be enforced via GitHub Environments (`dev`, `stg`, `prod`) to require approvals for non‑dev deploys.
- Conventional commits are recommended; add a PR title linter with `amannn/action-semantic-pull-request` if desired.

## ChatGPT/Codex Agent Integration (Optional)

While “Codex” branding is deprecated, you can integrate ChatGPT Agents to work with this repo end‑to‑end:

- Connect ChatGPT to GitHub via the Model Context Protocol (MCP) GitHub server or official GitHub integration. This enables reading files, opening PRs, and reviewing changes directly from ChatGPT.
- Pair with these Actions for AI‑assisted workflows:
  - AI PR reviewer: run an OpenAI‑backed review on PRs to raise issues/summaries.
  - ChatOps: `/deploy env=..` already triggers deploys; you can add more commands like `/plan`, `/rollout`, `/revert`.
  - Guardrails: require green CI + approval before `stg`/`prod` deploys.

Tip: Give the Agent this repo’s structure (see `AGENTS.md`) and the available commands (pnpm, build, tests) so it can make precise changes and validate with CI before opening PRs.
