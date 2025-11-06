variable "org_id" {
  type        = string
  description = "Organization ID (set either org_id or folder_id)"
  default     = ""
}

variable "folder_id" {
  type        = string
  description = "Folder resource name (folders/NNNNN)"
  default     = ""
}

variable "billing_account" {
  type        = string
  description = "Billing account ID (e.g., 012345-6789AB-CDEF01)"
}

variable "project_id" {
  type        = string
  description = "New GCP project ID (globally unique)"
}

variable "project_name" {
  type        = string
  description = "Display name for the project"
}

variable "labels" {
  type        = map(string)
  description = "Optional project labels"
  default     = {}
}

