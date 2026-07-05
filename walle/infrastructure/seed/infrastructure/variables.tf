# Consumer-owned input variables (walle SEED). Edit freely.

variable "project_name" {
  type        = string
  description = "Name of the project."
  default     = ""
}

variable "region" {
  type        = string
  description = "Cloud region for the deployed resources."
  default     = ""
}

variable "environment" {
  type        = string
  description = "Deployment environment (e.g. staging, production)."
  default     = "production"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be 'staging' or 'production'."
  }
}
