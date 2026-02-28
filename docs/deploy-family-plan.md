# Deploy Checklist: Family 6-Week Meal Plan Feature

Covers the full pipeline: Replit → GitHub → Render → Neon.

---

## 1. Local / Replit

### 1a. Run migrations
Migrations run **automatically** when the server starts. No manual step needed.
To confirm they're current:
```bash
# Start the dev server and check the log line:
# [Migrations] Up to date — no pending migrations
npm run dev
```

### 1b. Seed the family plan template
The seed script is idempotent — safe to run multiple times.
```bash
npx tsx script/seed-family-plan.ts
```
Expected output:
```
Resolved 42/42 meals, 0 skipped
Upserted template: The Healthy Apples Family 6 week meal plan
Done.
```

### 1c. Smoke-test the endpoints
```bash
# Default template metadata (no auth required)
curl http://localhost:5000/api/plan-templates/default

# Expected:
# {"id":"<uuid>","name":"The Healthy Apples Family 6 week meal plan","itemCount":42,...}

# Config endpoint — check email fields appear
curl http://localhost:5000/api/config

# Expected fields:
# "supportEmail", "suggestionsEmail"

# Meal export (must be logged in as beta user — test via browser DevTools)
# GET /api/admin/meals/export?source=web&format=json
```

### 1d. Manual UI check
- [ ] Log in and go to **/weekly-planner**
- [ ] Click **Load Family 6-Week Plan** button
- [ ] Toast confirms meals loaded; all 6 week tabs populate with dinners
- [ ] Go to **/profile** → "Contact" section shows support/suggestions emails
- [ ] Desktop footer shows both email links

---

## 2. GitHub

### 2a. Push and merge
```bash
# Suggested branch name
git checkout -b feat/family-plan-seed

# Push
git push origin feat/family-plan-seed
```

- [ ] Open PR on GitHub against `main`
- [ ] PR description: "Adds family 6-week plan template, load-plan UI, contact emails, admin export endpoint"
- [ ] Merge PR → triggers Render auto-deploy if connected

---

## 3. Render

### 3a. Confirm DATABASE_URL points to Neon
In Render dashboard → **Environment**:
- [ ] `DATABASE_URL` is set and points to your Neon connection string
- [ ] Connection string uses the **pooled** Neon endpoint (port 5432, not 6543) for migrations compatibility

### 3b. Migrations in production
Migrations apply **automatically on deploy** — the `npm start` command runs `node dist/index.cjs` which calls `runMigrations()` on startup. Check Render logs for:
```
[Migrations] Up to date — no pending migrations
```
or a list of newly applied migrations.

### 3c. Seed the family plan in production
Render does not run the seed automatically. Use **Render Shell** (dashboard → your service → Shell tab):
```bash
npx tsx script/seed-family-plan.ts
```
This is idempotent — safe to re-run; it will skip already-seeded meals.

### 3d. Set contact email env vars
In Render dashboard → **Environment** → Add:

| Key | Value |
|-----|-------|
| `SUPPORT_EMAIL` | `hello@thehealthyapples.com` (or your address) |
| `SUGGESTIONS_EMAIL` | `suggestions@thehealthyapples.com` (or your address) |

Click **Save Changes** → Render triggers a redeploy automatically.

### 3e. Other required env vars (confirm these are already set)
| Key | Notes |
|-----|-------|
| `DATABASE_URL` | Neon connection string |
| `SESSION_SECRET` | Random secret for sessions |
| `SMTP_USER` | `hello@thehealthyapples.com` |
| `SMTP_PASS` | Namecheap private email password |
| `SPOONACULAR_API_KEY` | For grocery product lookup |

---

## 4. Production Verification

### 4a. Load plan button
- [ ] Log in at `https://www.thehealthyapples.com`
- [ ] Go to **/weekly-planner**
- [ ] Click **Load Family 6-Week Plan**
- [ ] Toast: "Plan loaded! X meals added to your planner"
- [ ] All 6 week tabs show dinner entries

### 4b. Planner populated
- [ ] Switch between Week 1 → Week 6 tabs
- [ ] Each week shows dinner entries on weekdays
- [ ] Meal names match expected recipes

### 4c. Contact emails visible
- [ ] Go to **/profile** → scroll to "Contact" section
- [ ] Support email shows correct address
- [ ] Suggestions email shows correct address
- [ ] On desktop: footer at bottom of every page shows both emails

### 4d. Admin export (optional)
- [ ] While logged in as a beta user, visit:
  `https://www.thehealthyapples.com/api/admin/meals/export?source=web&format=json`
- [ ] Returns a JSON array of web-imported meals with stable `id` values

---

## Rollback

If something goes wrong:
- **Template not loading**: Re-run the seed via Render Shell — idempotent, no risk
- **Migrations failed**: Check Render logs for the specific migration ID; each runs in a transaction and rolls back on failure
- **Wrong emails showing**: Update `SUPPORT_EMAIL` / `SUGGESTIONS_EMAIL` in Render env → redeploy
