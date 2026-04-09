#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
INSTANCE_DIR="test-instances/test_${TIMESTAMP}"

echo "Creating test instance: ${INSTANCE_DIR}"

mkdir -p test-instances

BRANCH=$(git rev-parse --abbrev-ref HEAD)
git clone -b "${BRANCH}" . "${INSTANCE_DIR}"

cd "${INSTANCE_DIR}/app"
npm ci

E2E_TIMEOUT=1000 npm run ci:test:e2e

echo "Tests complete. Instance kept at: ${INSTANCE_DIR}"