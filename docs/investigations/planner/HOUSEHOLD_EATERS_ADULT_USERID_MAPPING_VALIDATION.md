# Household Eaters — Adult userId Mapping Validation

**Date:** 2026-06-12  
**Type:** Read-only validation. No code changes. No database changes. No fixes applied.

---

## Rollback Point

**Tag:** `rollback/pre-household-eater-userid-validation`  
**HEAD at tag:** `43fbdda` — checkpoint: pre-nutrition-boost-provenance rollback point  

**Git status at validation time:** NOT CLEAN  
5 modified files, 17 untracked files in the working tree at the time the tag was created.  
The tag captures HEAD (last clean commit), not the working tree state.

Modified tracked files:
- `client/src/components/MealUpliftPanel.tsx`
- `client/src/pages/profile-page.tsx`
- `client/src/pages/weekly-planner-page.tsx`
- `server/lib/household-meal-matcher.ts`
- `server/routes.ts`

---

## Database: Raw Query Results

### Q1 — User rows for both accounts

```sql
SELECT id, username, diet_pattern, diet_restrictions
FROM users
WHERE username IN ('colinclapson@outlook.com', 'colinclapson@hotmail.co.uk')
ORDER BY id;
```

| id | username | diet_pattern | diet_restrictions |
|----|----------|--------------|-------------------|
| 1 | colinclapson@hotmail.co.uk | Keto | `{}` (empty) |
| 38 | colinclapson@outlook.com | Keto | `{Gluten-Free}` |

Both accounts exist. Both have `diet_pattern = 'Keto'`. Only the outlook account has `diet_restrictions`.

---

### user_preferences.diet_types for both accounts

```sql
SELECT up.user_id, u.username, up.diet_types
FROM user_preferences up
JOIN users u ON u.id = up.user_id
WHERE up.user_id IN (1, 38);
```

| user_id | username | diet_types |
|---------|----------|------------|
| 1 | colinclapson@hotmail.co.uk | `{style:family-friendly, style:whole-foods, keto}` |
| 38 | colinclapson@outlook.com | `{gluten-free, upf-free, keto}` |

Both have non-empty `diet_types`. Neither is empty. The enrichment fallback to `users.diet_pattern` would not be needed.

---

### Q2 — household_eaters rows for the outlook user's active household

Outlook user (ID=38) has one active membership: **household_id = 44**.

```sql
SELECT he.id, he.household_id, he.display_name, he.user_id,
       u.username, u.diet_pattern, u.diet_restrictions,
       he.default_diet_types, he.hard_restrictions
FROM household_eaters he
LEFT JOIN users u ON u.id = he.user_id
WHERE he.household_id = 44
ORDER BY he.id;
```

| id | household_id | display_name | user_id | username | diet_pattern | diet_restrictions | default_diet_types | hard_restrictions |
|----|-------------|--------------|---------|----------|--------------|-------------------|--------------------|-------------------|
| 1 | 44 | colinclapson@hotmail.co.uk | 1 | colinclapson@hotmail.co.uk | Keto | `{}` | `{}` | `{}` |
| 2 | 44 | colinclapson@outlook.com | 38 | colinclapson@outlook.com | Keto | `{Gluten-Free}` | `{}` | `{}` |
| 3 | 44 | Lilly | NULL | — | — | — | `{Vegetarian}` | `{Gluten-Free,Nuts,Dairy-Free,Eggs,Shellfish,Soy}` |
| 4 | 44 | Daisy | NULL | — | — | — | `{Mediterranean}` | `{Dairy-Free,Eggs}` |

**Key observations:**

- The userId → displayName mapping is **correct**. hotmail user (ID=1) maps to the hotmail display name. Outlook user (ID=38) maps to the outlook display name. No mismatch.
- Both adult rows have `default_diet_types = {}` and `hard_restrictions = {}` stored in the DB. This is by design — adult rows are meant to be enriched at read time from the users table, not stored directly.
- Lilly and Daisy are child eaters (userId = NULL) with diet data stored directly in the DB row. This is correct.

---

### Q3 — Duplicate household_eaters rows (same household_id + user_id)

```sql
SELECT household_id, user_id, COUNT(*) as row_count
FROM household_eaters
GROUP BY household_id, user_id
HAVING COUNT(*) > 1;
```

| household_id | user_id | row_count |
|-------------|---------|-----------|
| 44 | NULL | 2 |

**Not a real duplicate.** The two rows with `user_id = NULL` in household 44 are Lilly (ID=3) and Daisy (ID=4) — two separate named child eaters, not duplicate rows for the same person. PostgreSQL's `GROUP BY` treats all NULLs as equal. No duplicate adult userId rows exist anywhere.

---

### Q4 — Orphaned null-userId rows that look like adults

```sql
SELECT id, household_id, display_name, user_id
FROM household_eaters
WHERE household_id = 44 AND user_id IS NULL;
```

| id | household_id | display_name | user_id |
|----|-------------|--------------|---------|
| 3 | 44 | Lilly | NULL |
| 4 | 44 | Daisy | NULL |

Both are named children with diet data explicitly stored. Neither is a stale adult row. No orphaned rows.

---

### Q5 — Are both adult accounts members of the same household?

```sql
SELECT hm.household_id, hm.user_id, u.username, hm.status, hm.role
FROM household_members hm
JOIN users u ON u.id = hm.user_id
WHERE u.username IN ('colinclapson@outlook.com', 'colinclapson@hotmail.co.uk')
ORDER BY hm.household_id, hm.user_id;
```

| household_id | user_id | username | status | role |
|-------------|---------|----------|--------|------|
| 44 | 1 | colinclapson@hotmail.co.uk | active | owner |
| 44 | 38 | colinclapson@outlook.com | active | member |

**Yes.** Both accounts are active members of household 44. Hotmail is the owner; outlook joined as a member.

---

### Q6 — Does colinclapson@outlook.com have multiple active household memberships?

```sql
SELECT household_id, user_id, username, status, role
FROM household_members hm
JOIN users u ON u.id = hm.user_id
WHERE hm.user_id = 38
ORDER BY hm.household_id;
```

| household_id | user_id | username | status | role |
|-------------|---------|----------|--------|------|
| 44 | 38 | colinclapson@outlook.com | active | member |
| 47 | 38 | colinclapson@outlook.com | **left** | owner |

**No multiple active memberships.** The outlook account has exactly **one active membership** (household 44). Household 47 was the auto-created household when the account was registered; the user left it (status = `left`).

`getHouseholdForUser(38)` with `findFirst WHERE status = 'active'` will always and deterministically return household 44. The previously identified latent bug (non-deterministic `findFirst` without `orderBy`) does **not** affect this user because there is only one active row.

---

## Q7 — Final Verdict

### A — Phase 1 API enrichment is not running

**Confirmed root cause.**

The committed version of `GET /api/household/eaters` (routes.ts:7944 in HEAD) is:

```typescript
res.json(rows.map(dbEaterToHouseholdEater));
```

This returns raw DB values directly. Both adult rows have `default_diet_types = {}` and `hard_restrictions = {}` stored in the DB — correct by design, since adult rows are meant to be enriched at read time. Without enrichment running, the API returns empty arrays for both adult rows, so no chips render.

The enrichment code — which calls `storage.getUser(eater.userId)` and `storage.getUserPreferences(eater.userId)` per adult row — exists **only in the working tree** (uncommitted changes to `server/routes.ts`). It has not been committed or deployed.

Confirmed via `git diff HEAD -- server/routes.ts`:

```diff
+      // Enrich adult rows with profile-derived dietary data at read time.
+      const enriched = await Promise.all(eaters.map(async (eater) => {
+        if (eater.userId == null) return eater;
+          storage.getUser(eater.userId),
+          storage.getUserPreferences(eater.userId),
+        ...
+        return { ...eater, defaultDietTypes, hardRestrictions };
+      res.json(enriched);
```

And confirmed via `git show HEAD:server/routes.ts` — committed route body ends at:

```typescript
res.json(rows.map(dbEaterToHouseholdEater));
```

**All other verdicts are ruled out:**

| Verdict | Status | Evidence |
|---------|--------|----------|
| B — userId mismatch | **Ruled out** | household_eaters.user_id = 1 → hotmail, user_id = 38 → outlook. Exact match. |
| C — Duplicate/stale eater rows | **Ruled out** | No duplicate adult userId rows. The NULL duplicate is Lilly + Daisy (children). |
| D — Profile data on different account | **Ruled out** | Both accounts have Keto in diet_pattern. Outlook (38) has Gluten-Free restriction. UserIds are correctly mapped. |
| E — Wrong household selected | **Ruled out** | Outlook user has exactly one active membership (H44). `findFirst` is deterministic here. |

---

## Additional Findings

**1. Frontend chip rendering also changed in working tree**

`git diff HEAD -- client/src/pages/profile-page.tsx` shows the committed version renders chips as a flat joined string:
```
{[...eater.defaultDietTypes, ...eater.hardRestrictions].join(", ")}
```
The working tree version renders individual styled chip spans. Both versions produce no visible output when the arrays are empty — consistent with the screenshot.

**2. If enrichment were running, expected output would be:**

| Eater | defaultDietTypes | hardRestrictions |
|-------|-----------------|-----------------|
| colinclapson@hotmail.co.uk | `['style:family-friendly', 'style:whole-foods', 'keto']` | `[]` |
| colinclapson@outlook.com | `['gluten-free', 'upf-free', 'keto']` | `['Gluten-Free']` |

The hotmail row would display three diet chips including non-standard `style:*` values. Whether those should display as chips or be filtered is a separate product decision.

**3. Latent bug in `getHouseholdForUser` still present**

`findFirst` without `orderBy` (household.ts:18) remains a latent risk if a user ever has two active memberships. Currently harmless for this user, but worth fixing before household joining/switching is expanded.

**4. `syncMembersAsEaters` never updates displayNames**

The sync is INSERT-only. If a user changes their username (email), their eater row still shows the old email as displayName. Not causing any current issue but will cause confusing display over time.

---

## Q8 — Safest Next Step

**Do not fix yet.**

The implementation decision required before writing any code:

**Decide whether to commit the working tree enrichment code as-is, or review it first.**

The working tree enrichment passes `user_preferences.diet_types` through directly as `defaultDietTypes`. For the hotmail account this would surface `style:family-friendly` and `style:whole-foods` as visible chips in the UI. These are non-standard internal tags, not display-friendly values.

Before committing, decide:

1. **Should `style:*` prefixed diet_types values be filtered out** before they become visible eater chips? They appear to be internal preference tags, not human-readable diet labels.
2. **Should the enrichment use `users.diet_pattern` only** (the canonical, bounded profile field) rather than the raw `user_preferences.diet_types` array which can contain arbitrary tags?
3. **Should the two sources be merged or kept separate** — `diet_pattern` drives the eater chip, `diet_types` handles preference filtering internally?

Answering these questions determines what the enrichment fallback chain should be, which in turn determines what is safe to commit.
