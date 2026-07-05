#!/bin/bash

# setup-devcontainer.local.sh project-specific post-start setup
#
# This file is sourced by setup-devcontainer.sh after the base setup completes.
# It is NOT managed by the template update script customize freely.
#
# Examples:
#   # Install a project-specific Python package
#   uv pip install mypackage
#
#   # Set up a local database
#   docker compose -f docker-compose.dev.yml up -d db
#
#   # Download project data
#   aws s3 cp s3://my-bucket/data /workspace/data --recursive
