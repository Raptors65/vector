#!/bin/bash
set -e

cd "$(dirname "$0")/frontend"

echo "Clearing data..."
npx convex run seed:clearAll

echo "Seeding market evidence..."
npx convex run seed:seedMarketEvidence

echo "Seeding external signals..."
npx convex run externalSignals:seedExternalSignals

echo "Done — ready for demo."
