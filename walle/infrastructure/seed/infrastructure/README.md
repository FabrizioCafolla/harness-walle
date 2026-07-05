# Infrastructure

Consumer-owned Terraform/OpenTofu scaffold — created once by `walle init` or `walle add infrastructure`, never overwritten by `walle update`.

## Files

| File           | Purpose                                             |
| -------------- | --------------------------------------------------- |
| `providers.tf` | Provider declarations and version constraints       |
| `variables.tf` | Input variables (project_name, region, environment) |
| `main.tf`      | Root module — resources go here                     |
| `outputs.tf`   | Exported values for CI or other modules             |
| `.gitignore`   | Excludes `.terraform/`, state files, and secrets    |

## Prerequisites

- Terraform ≥ 1.5.0 or [OpenTofu](https://opentofu.org/) (compatible).
- If using `tfenv` (included in the walle devcontainer): `tfenv install && tfenv use`.

## Usage

```bash
cd infrastructure/
terraform init      # download providers
terraform plan      # preview changes
terraform apply     # apply changes
```

## Customization

1. Uncomment the provider block you need in `providers.tf` and pin its version.
2. Add resources in `main.tf`.
3. Expose values for other tooling via `outputs.tf`.
4. Add variables in `variables.tf` for any value that changes between environments.

This directory is yours to extend. `walle update` never touches it.
