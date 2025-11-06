# ADR 0005: CMEK Strategy

Status: Accepted
Date: 2025-11-06

Context
- Default Google-managed encryption is sufficient to start, but CMEK may be required by compliance.

Decision
- Start with Google-managed encryption.
- Provide optional CMEK toggle in Terraform; non-disruptive cutover path documented.

Consequences
- Simpler initial setup; enable CMEK later without redesign.
- Key rotation and IAM bindings handled in Terraform when enabled.

