echo "[INFO] Enabling corepack"
corepack enable || echo "[WARN] corepack enable failed, continuing"

echo "[INFO] Installing dependencies"
yarn install
