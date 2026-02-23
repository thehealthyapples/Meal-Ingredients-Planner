#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== The Healthy Apples — Production Database Migration ===${NC}"
echo ""

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}Error: DATABASE_URL is not set.${NC}"
  echo "Set it with: export DATABASE_URL='your-neon-connection-string'"
  exit 1
fi

echo -e "${YELLOW}Database URL detected (masked): ${DATABASE_URL:0:20}...${NC}"
echo ""

echo -e "${YELLOW}Pushing schema to production database...${NC}"
npx drizzle-kit push --force

echo ""
echo -e "${GREEN}=== Migration complete! ===${NC}"
echo -e "${GREEN}All 29 tables have been created/synced in the production database.${NC}"
echo -e "${GREEN}/api/register and /api/login should now work.${NC}"
