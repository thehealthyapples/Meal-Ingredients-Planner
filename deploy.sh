#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== The Healthy Apples — Deploy to Production ===${NC}"
echo ""

BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo -e "${RED}Error: You must be on the 'main' branch to deploy. Currently on '$BRANCH'.${NC}"
  exit 1
fi

echo -e "${YELLOW}Checking for changes...${NC}"
if [ -z "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}No uncommitted changes found.${NC}"
else
  echo -e "${YELLOW}Uncommitted changes detected. Staging all files...${NC}"
  git add -A

  if [ -n "$1" ]; then
    COMMIT_MSG="$1"
  else
    COMMIT_MSG="deploy: $(date '+%Y-%m-%d %H:%M:%S')"
  fi

  echo -e "${YELLOW}Committing: ${COMMIT_MSG}${NC}"
  git commit -m "$COMMIT_MSG"
fi

echo ""
echo -e "${YELLOW}Building project to verify it compiles...${NC}"
npm run build
echo -e "${GREEN}Build successful!${NC}"

echo ""
echo -e "${YELLOW}Pushing to GitHub (origin/main)...${NC}"
git push origin main

echo ""
echo -e "${GREEN}=== Deployed! ===${NC}"
echo -e "${GREEN}Render will now auto-deploy from GitHub.${NC}"
echo -e "${GREEN}Check your Render dashboard for deployment status.${NC}"
