# Project Bootstrap (Terraform)

Creates a new GCP project and links billing so the platform stack can be applied.

What it does
- Creates `google_project` under an Org or Folder
- Links Billing Account
- Enables baseline APIs (Resource Manager, Billing, IAM, Service Usage)

Prereqs
- You have org-level permission to create projects and link billing
  - `roles/resourcemanager.projectCreator`
  - `roles/billing.projectManager` on the billing account
- Terraform >= 1.5 and `GOOGLE_APPLICATION_CREDENTIALS` set

Inputs
- `org_id` (string) — e.g., `123456789012` (set one of `org_id` or `folder_id`)
- `folder_id` (string, optional) — e.g., `folders/345678901234`
- `billing_account` (string) — e.g., `012345-6789AB-CDEF01`
- `project_id` (string) — globally unique
- `project_name` (string) — display name
- `labels` (map(string), optional)

Usage
```
cd infra/bootstrap
terraform init
terraform apply \
  -var org_id=123456789012 \
  -var billing_account=012345-6789AB-CDEF01 \
  -var project_id=ecco-crcai-dev \
  -var project_name="Ecco CRC AI (dev)"
```

Next steps
- Apply platform stack into the new project:
```
cd ../terraform
terraform init
terraform apply -var project_id=ecco-crcai-dev
```
