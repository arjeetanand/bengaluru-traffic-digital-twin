#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting Bengaluru Traffic Digital Twin..."
exec npm run dev -- --host 0.0.0.0 "$@"
