# Roles & Subscriptions

## Overview

The Healthy Apples separates two distinct concepts:

| Concept | Column | Values | Purpose |
|---|---|---|---|
| **Role** | `users.role` | `user`, `admin` | Controls permissions (admin panel, exports, imports) |
| **Subscription Tier** | `users.subscription_tier` | `free`, `premium`, `friends_family` | Controls feature access |

These are independent. An admin can be on any tier. A premium user is not necessarily an admin.

---

## Subscription Tiers

| Tier | Description |
|---|---|
| `free` | Default for all new accounts |
| `premium` | Full paid access — set manually or via future payment integration |
| `friends_family` | Same access as premium — for invited users (Lindsay, Colin, etc.) |

`hasPremiumAccess` is `true` for both `premium` and `friends_family` users.

---

## Server Helpers (`server/lib/access.ts`)

```ts
isAdmin(user)          // user.role === 'admin'
getTier(user)          // returns 'free' | 'premium' | 'friends_family'
hasPremiumAccess(user) // true for premium OR friends_family
assertAdmin(req, res, next)   // middleware → 403 if not admin
requirePremium(req, res, next) // middleware → 402 if no premium access
```

---

## Running Migrations

### Locally (Replit)
Migrations are applied automatically on every server start. Just restart the workflow and check logs for:
```
[Migrations] ✓ Applied "2026-02-28_add_roles_and_subscriptions"
```

### In Production (Render)
Migrations run automatically on each deploy as part of the server startup sequence. Check the Render deployment logs for the same message above.

If a migration fails due to permissions, the log will print the raw SQL so you can run it manually in the Neon SQL console.

---

## Promoting Admins

The script `script/promote-admins.ts` promotes two pre-configured email addresses to `role='admin'`:
- `lindsayclapson@outlook.com`
- `colinclapson@hotmail.co.uk`

### Locally (Replit Shell tab)
```bash
npx tsx script/promote-admins.ts
```

### In Production (Render Shell)
1. Go to your Render service → **Shell** tab
2. Run:
```bash
npx tsx script/promote-admins.ts
```

The script is idempotent — safe to re-run. If a user account doesn't exist yet, it logs a clear message without crashing. Re-run after the user registers.

### Recommended npm scripts (add to `package.json` manually)
```json
"db:migrate": "tsx server/migrations/runner.ts",
"admin:promote": "tsx script/promote-admins.ts"
```

---

## Environment Variables

Set these in Render → Environment tab:

| Variable | Default | Description |
|---|---|---|
| `FAMILY_PLAN_ENABLED` | `true` | Enable the 6-week family meal plan feature |
| `PREMIUM_FEATURES_ENABLED` | `true` | Enable premium feature gates |

Values of `"false"` disable the feature; anything else (including omitting the var) leaves it enabled.

---

## API Changes

### `GET /api/user`
Now includes:
```json
{
  "role": "user" | "admin",
  "subscriptionTier": "free" | "premium" | "friends_family",
  "hasPremiumAccess": false
}
```

### `GET /api/config`
Now includes:
```json
{
  "familyPlanEnabled": true,
  "premiumFeaturesEnabled": true
}
```

---

## Future Freemium Limits

The codebase has clearly marked `// TODO [PREMIUM]:` comments at three enforcement points:
- **My Meals** (`GET /api/meals`) — future limit: >3 meals for free users
- **Planner** (`PUT /api/planner/days/:dayId/entries`) — future limit: >2 days/week for free users
- **Product Analyser** (product analysis loop) — future limit: usage cap for free users

These are comment-only today and have no effect on current behavior.
