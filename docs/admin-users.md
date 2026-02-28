# Admin User Management

## Overview

The Admin User Management page (`/admin/users`) allows admins to find any registered user by email or display name, and to change their subscription tier. All tier changes are recorded in an audit log.

Only users with `role = 'admin'` can access these features.

---

## How to Search Users

1. Navigate to `/admin/users` (visible as "Admin" in the navigation bar when logged in as an admin).
2. Type all or part of a user's email or display name into the search box.
3. Press **Search** or hit Enter.
4. Results appear in a table: Email, Display Name, Role, and current Tier.
5. If the search box is empty, the most recently registered users are shown (newest first).
6. Use the **Previous / Next** buttons to page through results (25 per page).

---

## How to Change a User's Tier

1. Find the user in the search results.
2. Use the dropdown in the **Change Tier** column to select:
   - **Free** — standard access, no premium features
   - **Premium** — full premium feature access
   - **Friends & Family** — same access as Premium (handled by `hasPremiumAccess`)
3. Click **Save** next to that user's row.
4. A confirmation dialog will appear showing the user's email and the new tier.
5. Confirm to apply the change. A success toast will appear.

> Note: Admins cannot change their own tier through this page. That restriction is enforced server-side.

---

## Setting friends_family Tier

The `friends_family` tier grants exactly the same access as `premium` everywhere `hasPremiumAccess(user)` is called. To grant a user friends & family access:

1. Search for the user.
2. Set their tier to **Friends & Family**.
3. Confirm the change.

The change takes effect immediately on their next API call (no re-login required, as the tier is checked live from the database on each request).

---

## Audit Log

Every search and tier change is recorded in the `admin_audit_log` database table:

| Column | Description |
|---|---|
| `id` | Auto-incrementing primary key |
| `admin_user_id` | The admin who performed the action |
| `action` | `USER_SEARCH` or `SET_SUBSCRIPTION_TIER` |
| `target_user_id` | The affected user (null for search actions) |
| `metadata` | JSON object (e.g. `{ oldTier: "free", newTier: "friends_family" }`) |
| `created_at` | Timestamp of the action |

You can query the audit log directly from the database:

```sql
SELECT a.id, a.action, a.created_at,
       admin.username AS admin,
       target.username AS target,
       a.metadata
FROM admin_audit_log a
JOIN users admin ON admin.id = a.admin_user_id
LEFT JOIN users target ON target.id = a.target_user_id
ORDER BY a.created_at DESC
LIMIT 50;
```

---

## Privacy & Security Notes

- The user search endpoint returns only safe fields: id, email, display name, role, and tier. Passwords, tokens, and other sensitive fields are never returned.
- Admin search queries are logged (query length and result count only — not the full search string).
- Treat user data carefully and in line with GDPR obligations. Only use this tool to manage access, not to browse user data.
- The feature is completely inaccessible to non-admin users (enforced on both frontend and backend).
