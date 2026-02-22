#!/bin/bash
set -e

cd "$(dirname "$0")/frontend"

echo "Clearing prod data..."
npx convex run seed:clearAll --prod

echo "Seeding market evidence..."
npx convex run seed:seedMarketEvidence --prod

echo "Seeding external signals..."
npx convex run externalSignals:seedExternalSignals --prod

echo "Done — prod is ready for demo."
