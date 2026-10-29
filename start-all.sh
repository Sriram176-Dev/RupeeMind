#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
echo "Starting Rupee Mind with the required ML service."
echo "Ensure MongoDB is running and rupeemind-ml/.venv is installed."
exec npm run dev
