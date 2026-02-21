#!/bin/bash
set -e

cd "$(dirname "$0")/frontend"

echo "Clearing data..."
npx convex run seed:clearAll

echo "Seeding market evidence..."
npx convex run seed:seedMarketEvidence

echo "Done — ready for demo."
