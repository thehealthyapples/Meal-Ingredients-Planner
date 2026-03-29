# 🚀 Release Process (THA)

## 🔁 Overview
- Development happens in Replit
- Code is pushed to GitHub
- Production deploys from GitHub → Render
- NEVER deploy to production directly from Replit

---

## 🗄️ Production Database (Neon)

- Production database is hosted on Neon
- This is separate from any development or Replit environment
- All production data lives here and must be treated as persistent

### Key rules

- Never assume dev DB = production DB
- Never run destructive or unreviewed schema changes
- All DB changes must be safe for existing production data
- Migrations must be compatible with live data
- Code must not assume new DB structures exist before migration runs

### Important

If a release includes DB changes:
👉 you are modifying a live Neon database

This increases risk and requires extra care

---

## ✅ Standard Release

### Before push
1. `git status` is clean
2. Run:
   ```bash
   npm run release:check