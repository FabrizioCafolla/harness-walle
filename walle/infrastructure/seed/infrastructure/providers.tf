# Consumer-owned provider versions (walle SEED): created once, never overwritten.
# Pin all provider versions here to prevent unexpected upgrades.
# See: https://developer.hashicorp.com/terraform/language/providers/requirements

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    # Uncomment and configure the providers you need:
    #
    # aws = {
    #   source  = "hashicorp/aws"
    #   version = "~> 5.0"
    # }
    #
    # google = {
    #   source  = "hashicorp/google"
    #   version = "~> 5.0"
    # }
    #
    # azurerm = {
    #   source  = "hashicorp/azurerm"
    #   version = "~> 3.0"
    # }
  }
}
