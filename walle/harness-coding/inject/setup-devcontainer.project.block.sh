#!/bin/bash

echo "[INFO] Enabling corepack"
corepack enable 2>/dev/null || sudo corepack enable || echo "[WARN] corepack enable failed, continuing"

echo "[INFO] Installing dependencies"
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 yarn install
