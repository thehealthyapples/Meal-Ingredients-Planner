# Share 6 Week Plan via Link

## Overview

Users can share their saved 6-week meal plan templates via a secure public link. Recipients can preview a read-only version of the plan and import it directly into their own planner (if logged in), or are prompted to create a free account.

## How Sharing Works

1. **Save first**: A user must have at least one private template saved from their planner (via the Templates panel → "Save Current Planner").
2. **Share**: Click "Share Plan 🔗" in the planner header → select a template → "Generate Share Link".
3. **Token generated**: A UUID v4 `share_token` is stored on the template record and `visibility` is set to `shared`.
4. **Share the link**: The URL format is `https://thehealthyapples.replit.app/shared/<token>`. Copy, WhatsApp, or email it.
5. **Unshare**: Click "Stop Sharing" to revoke access. The token is cleared and the visibility returns to `private`.

## Public Shared Page (`/shared/:token`)

- Fully public — no login required to preview.
- Displays the plan name, season, meal count, and a read-only 6-week grid.
- Grid cells show B (Breakfast), L (Lunch), D (Dinner) for filled slots.
- **Logged-in users**: See an "Import into My Planner" button. Import uses `fill empty` mode — won't overwrite existing meals.
- **Unauthenticated users**: See a "Create a Free Account to Import" prompt linking to `/auth`.
- If the token is invalid or sharing has been revoked: shows a friendly "no longer shared" message.

## Access Control & Limits

| Tier | Shared plans allowed |
|---|---|
| Free | 1 at a time |
| Premium | Unlimited |
| Friends & Family | Unlimited |

- The limit is enforced server-side when generating a new share link.
- A free user can unshare one plan and share a different one at any time.
- Admins are not subject to limits.

## Security Model

- The share token is the **only access control mechanism** — anyone with the link can view the plan.
- No personal information (owner name, email, user ID) is returned in the public API response.
- Revoking sharing (unshare) immediately clears the token from the database. Existing links stop working instantly.

## Database

Two new columns on `meal_plan_templates`:

| Column | Type | Notes |
|---|---|---|
| `share_token` | TEXT NULL UNIQUE | UUID v4, set on share, cleared on unshare |
| `visibility` | TEXT NOT NULL DEFAULT 'private' | `private` or `shared` |

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/plan-templates/mine/:id/share` | Required | Generate/return share token, returns `{ shareToken, url }` |
| `POST` | `/api/plan-templates/mine/:id/unshare` | Required | Clear token, set private |
| `GET` | `/api/shared/:token` | Public | Return plan metadata + items (no owner info) |
