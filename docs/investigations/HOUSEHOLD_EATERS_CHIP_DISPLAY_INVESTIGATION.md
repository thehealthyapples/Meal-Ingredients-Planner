# Household Eaters — No Chips for Adult Rows

**Date:** 2026-06-12  
**Symptom:** Profile shows Keto + Gluten-Free for colinclapson@outlook.com. Household Eaters section shows two adult rows (hotmail + outlook) but neither displays diet/restriction chips.

---

## Code path traced

`GET /api/household/eaters` (routes.ts:7936):

```
getHouseholdForUser(req.user!.id)
  └─ findFirst on householdMembers WHERE userId = req.user.id AND status = 'active'
     ⚠️  NO orderBy — non-deterministic when user has multiple household memberships

syncMembersAsEaters(householdId)
  └─ INSERT-only: checks existingUserIds (by userId), never updates existing rows
     ⚠️  displayNames in existing rows are NEVER updated after initial creation

getHouseholdEaters(householdId)
  └─ SELECT all rows for householdId, ordered by id

dbEaterToHouseholdEater(row)
  └─ kind = "user" if row.userId != null, else "child"
  └─ userId: row.userId ?? undefined

Enrichment loop (per adult eater):
  storage.getUser(eater.userId)       ← fetches by stored userId
  storage.getUserPreferences(eater.userId)
  prefs.dietTypes   → defaultDietTypes (primary)
  userRow.dietPattern → mapped to 'keto' etc. (fallback)
  userRow.dietRestrictions → hardRestrictions
```

---

## Answers to each investigation question

**Q1. Which adult household_eaters row has which userId?**

Cannot be answered without a DB query, but the code in `syncMembersAsEaters` sets `displayName = users.displayName || users.username` **at insertion time and never again**. If either user's username changed after the row was created, the displayed email no longer matches the userId stored in that row.

**Q2. Which users table row has diet_pattern = Keto?**

The profile page (`GET /api/profile`) reads from `storage.getUser(req.user!.id)` — the currently authenticated session user. Since the profile shows Keto for the outlook account, the **outlook user's row in `users` has `diet_pattern = 'Keto'`** and `diet_restrictions = ['Gluten-Free']` (or similar).

**Q3. Does the enriched API attach Keto to either adult row?**

The enrichment code is syntactically correct: it fetches `getUser(eater.userId)` and falls through `prefs.dietTypes → users.dietPattern → DIET_PATTERN_TO_DIET_TYPE`. Since chips appear on **neither** row, one of two things is true:
- The `eater.userId` for the "outlook" display row doesn't match the outlook user's actual `id`
- OR that row's userId belongs to a user with no diet data

**Q4. Is req.user the same userId as the "outlook" eater row's userId?**

**Not necessarily.** This is the critical finding. `syncMembersAsEaters` creates eater rows at join time using `users.displayName || users.username`. If the outlook user's account display name was different when they joined the household, their row could show the old email. A second user registering with the same email later would create a NEW eater row with a DIFFERENT userId — but `household_eaters` has **no UNIQUE constraint on `(householdId, userId)`**, so duplicates are possible if the sync runs under a race or under stale state.

**Q5. Is there a stale/duplicate adult household member row from an old account?**

Very likely yes. The two rows visible (hotmail + outlook) could represent:
- Row A: `displayName = "colinclapson@hotmail.co.uk"` — userId = user who has NO Keto
- Row B: `displayName = "colinclapson@outlook.com"` — userId = ALSO a user with no Keto (perhaps a stale/old account, or the hotmail userId placed in the wrong row)

The logged-in outlook user's actual userId may not appear in either row, or may appear only in the row showing the hotmail email.

**Q6. Is GET /api/household/eaters enriching by userId correctly?**

The enrichment code itself is correct — it uses `eater.userId` per row, not the authenticated user's ID. But it's only as correct as the `userId` values stored in the DB rows. `storage.getUser()` is a straightforward `SELECT ... WHERE id = ?`.

**Q7. Could `storage.getUser()` be returning the authenticated user?**

No — `storage.getUser(eater.userId)` takes the eater's userId as a parameter and queries the `users` table directly by that ID (storage.ts:394-397). There is no fallback to `req.user`.

---

## Root Cause Verdict

**B — userId mismatch**, likely combined with **C — stale/duplicate adult row**.

The most probable scenario:

1. The "colinclapson@hotmail.co.uk" account registered first; its eater row was created with `userId = hotmail_id`.
2. The "colinclapson@outlook.com" account registered separately; `syncMembersAsEaters` created a second row with `userId = outlook_id`.
3. At some later point, either:
   - The outlook user's eater row has its `displayName` from the time they first joined (which might still be "colinclapson@outlook.com" — correct visually), but the **stored userId points to the wrong user** due to a stale sync or data migration
   - OR the outlook eater row's userId was nulled by a `DELETE SET NULL` cascade (if the account was briefly deleted/recreated), and a fresh sync re-created the row with a new account's ID that has no diet data

**Secondary latent bug:** `getHouseholdForUser` uses Drizzle's `findFirst` with **no `orderBy`** (household.ts:18). If the outlook user has two active household memberships (their own auto-created household H2 and the shared H1), PostgreSQL may return H2. In that case, `getHouseholdEaters(H2)` would show only the outlook user — which contradicts the two rows visible. So this specific bug isn't the chip cause here, but it is a real latent bug that could cause the wrong household's eaters to show under different conditions.

---

## Diagnostic queries to run

```sql
-- 1. Which userId maps to which account?
SELECT id, username, diet_pattern, diet_restrictions
FROM users
WHERE username IN ('colinclapson@outlook.com', 'colinclapson@hotmail.co.uk');

-- 2. What is actually stored in the eater rows for this household?
SELECT he.id, he.display_name, he.user_id, u.username, u.diet_pattern, u.diet_restrictions
FROM household_eaters he
LEFT JOIN users u ON u.id = he.user_id
WHERE he.household_id = (
  SELECT hm.household_id FROM household_members hm
  JOIN users uu ON uu.id = hm.user_id
  WHERE uu.username = 'colinclapson@outlook.com' AND hm.status = 'active'
  LIMIT 1
);

-- 3. Check for duplicate or orphaned eater rows
SELECT household_id, user_id, COUNT(*)
FROM household_eaters
GROUP BY household_id, user_id
HAVING COUNT(*) > 1;

-- 4. Check all household memberships for both accounts
SELECT hm.household_id, hm.user_id, u.username, hm.status
FROM household_members hm
JOIN users u ON u.id = hm.user_id
WHERE u.username IN ('colinclapson@outlook.com', 'colinclapson@hotmail.co.uk');
```

---

## Two code fixes needed regardless of root cause

**Fix 1 — `syncMembersAsEaters` should upsert displayName** (storage.ts:2710)

The current INSERT-only logic leaves stale display names forever. The displayName column should be updated on each sync so that the displayed email always reflects the current username.

**Fix 2 — `getHouseholdForUser` needs an `orderBy`** (server/lib/household.ts:18)

`findFirst` without ordering is non-deterministic when a user has multiple active household memberships. Should prefer the household the user created (highest-role membership, or lowest household id as a proxy for "original").

---

Run the diagnostic queries above — the result of query 2 will conclusively identify which of B/C/D is the actual root cause.
