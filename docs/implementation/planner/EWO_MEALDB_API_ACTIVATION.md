# EWO — Activate Paid MealDB API — Implementation

**Date:** 2026-07-03
**Branch:** int1-intelligence-platform
**Risk:** 🟢 GREEN
**Reason:** Configuration-only change to an existing, already-registered acquisition source. No new provider, no schema change, no data change, and the new behaviour is backward-compatible (falls back to the prior hardcoded test key when the secret is unset).

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-mealdb-api-activation-20260703` → `3460519032d75c496cb14a375c7ccb3f36366a5` |
| Working tree | Intentionally dirty — pre-existing uncommitted work from other in-progress workstreams (Companion Platform / Food Intelligence UI: `client/src/components/FoodOpportunitiesPanel.tsx`, `server/intelligence/conversation/behaviour-engine.ts`, etc.). None of that work was touched by this task. |
| This task's writes | `server/lib/external-meal-service.ts`, `server/routes.ts`, `.env.example` (new), `docs/implementation/planner/EWO_MEALDB_API_ACTIVATION.md` (new) |
| Rollback to committed state | `git checkout rollback/before-mealdb-api-activation-20260703` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md` (§6 Commercial extension rule, §8 known caveats — TheMealDB supporter key)
- [x] `shared/recipe-acquisition.ts` (the canonical acquisition source register — `themealdb` entry, lines 92–103)
- [x] `server/lib/recipe-source-gate.ts` (admin enable/credential gating layer)
- [x] `docs/investigations/knowledge/FS1_THA_KNOWLEDGE_SOURCE_AND_LICENSING_AUDIT.md` (G2 — origin of this task: production use of TheMealDB's shared test key breaches TheMealDB's own published terms)
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Domain 12 — Meal Identity, unaffected: no schema/data touched)

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity identity is touched. TheMealDB remains keyed by sourceKey "themealdb"
  in server/lib/recipe-source-gate.ts and shared/recipe-acquisition.ts, unchanged.

☑ One owner per fact
  The MealDB API key has exactly one owner: the THEMEALDB_API_KEY environment
  variable, read via one function (getMealDbApiKey() in external-meal-service.ts).
  All three call sites (external-meal-service.ts, routes.ts x2) call that function
  rather than each holding their own copy.

☑ No duplicate entities
  No new provider, source key, or registry entry is created. TheMealDB's existing
  ACQUISITION_SOURCE_REGISTER entry (shared/recipe-acquisition.ts) is unmodified.

☑ No duplicate ownership
  Confirmed — the API key was previously not owned by any config surface (it was
  a hardcoded literal "1"); it now has exactly one owner (env var via one getter).

☑ No duplicate state
  No user state involved. This is a server-side outbound API credential only.

☑ Extends existing architecture
  Extends the existing recipe-source-gate / recipe-acquisition credential pattern
  already used by Edamam, API-Ninjas, BigOven and FatSecret (SOURCE_REQUIRED_CREDS
  in recipe-source-gate.ts, and process.env reads in external-meal-service.ts).

☑ Progressive enrichment where appropriate
  N/A — transactional/config state (an API credential), not a knowledge entity.

☑ Honest gaps over fabricated information
  N/A — no knowledge claims are made or altered by this change.

☑ No permanent synchronisation bridge
  N/A — no second store of this fact exists to synchronise.

☑ Evolution over replacement
  Nothing is replaced. The hardcoded test key "1" becomes the fallback default of
  the new getMealDbApiKey() function, so unconfigured environments (e.g. local dev
  without the secret) behave exactly as before.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Recipe Acquisition (TheMealDB source), not a Source-of-Truth
                  register domain — this is provider credential configuration,
                  not knowledge or transactional data.
Declared SoT: shared/recipe-acquisition.ts (ACQUISITION_SOURCE_REGISTER.themealdb)
              — entry itself unmodified by this task.
New store created? NO
Existing store extended? NO (the register entry's licenceNote / licenceState is
  unchanged — see Scope Lock: whether to flip licenceState to "licensed" is a
  follow-up decision, not part of this task, since it requires human confirmation
  that the configured key is genuinely the paid supporter key).
Consumer created? NO
```

---

## IMPLEMENTATION

### What was found

TheMealDB integration lives in one place with three call sites, all pointing at
the same hardcoded shared **test key** (`1`) in the request path
(`https://www.themealdb.com/api/json/v1/1/...`):

- `server/lib/external-meal-service.ts:234` — `searchMealDB()`, used by Smart
  Planner / Smart Suggest via `fetchExternalCandidates()`.
- `server/routes.ts:2458` and `server/routes.ts:2484` — inline MealDB search
  inside the `GET /api/search-recipes` handler (multi-keyword and single-term
  paths respectively).

This was the exact gap identified in `docs/investigations/FS1_...AUDIT.md` (G2)
and tracked as a `conditional` licence state in the acquisition register
(`shared/recipe-acquisition.ts:97`, `licenceNote` at line 101–102): TheMealDB's
terms permit the test key only for development/education, and require the paid
supporter key for production use.

### What changed

Added one function, `getMealDbApiKey()`, exported from
`server/lib/external-meal-service.ts`:

```ts
export function getMealDbApiKey(): string {
  return process.env.THEMEALDB_API_KEY || "1";
}
```

All three call sites now build the request URL with
`` `https://www.themealdb.com/api/json/v1/${getMealDbApiKey()}/search.php?...` ``
instead of the hardcoded `1`. `routes.ts` imports `getMealDbApiKey` alongside the
other functions it already imports from `external-meal-service.ts`.

- No key is hardcoded or committed anywhere.
- When `THEMEALDB_API_KEY` is unset, behaviour is unchanged (falls back to the
  test key `"1"`) — safe for local dev and any environment without the secret.
- When `THEMEALDB_API_KEY` is set to the paid supporter key, every MealDB call
  site automatically uses it.

### `.env.example`

No `.env.example` existed in the repository. Created one documenting
`THEMEALDB_API_KEY` (left blank — not a real key):

```
THEMEALDB_API_KEY=
```

### Required secret names — Replit and Render

Both platforms need one secret, same name, same value (the paid TheMealDB
supporter key):

| Platform | Where to add it | Secret name |
|---|---|---|
| Replit | Tools → Secrets (padlock icon) in the workspace | `THEMEALDB_API_KEY` |
| Render | Service → Environment → Environment Variables | `THEMEALDB_API_KEY` |

There is no `render.yaml` in this repository (Render env vars are managed in the
Render dashboard, not committed config), so no repository file needed updating
for Render beyond `.env.example` as local/developer documentation.

---

## DEFINITION OF DONE

**What success looks like**
- All three MealDB call sites read the key from `THEMEALDB_API_KEY` via
  `getMealDbApiKey()`, with no hardcoded key remaining in source.
- Behaviour is unchanged when the secret is unset (safe default).
- Behaviour picks up the configured key when the secret is set.
- `.env.example` documents the variable.
- Build and typecheck are unaffected by this change.

**What must not break**
- Recipe search (`GET /api/search-recipes`) and Smart Planner/Smart Suggest
  external candidate fetch (`fetchExternalCandidates` → `searchMealDB`).
- Every other recipe source (BBC Good Food, AllRecipes, Jamie Oliver, Serious
  Eats, Edamam, API-Ninjas, BigOven, FatSecret) — untouched.

**Manual test steps**
1. Unset `THEMEALDB_API_KEY` → call `searchMealDB({ query: "chicken" })` →
   confirm results return (test key path, `getMealDbApiKey()` returns `"1"`).
2. Set `THEMEALDB_API_KEY=1` (or the real supporter key once issued) → call
   `searchMealDB({ query: "pasta" })` → confirm results return using the env
   var value.
3. Run `npm run build` and `npm run typecheck` → confirm no new errors in the
   changed files.

---

## DATA IMPACT

- Reads existing data: NO
- Writes new data: NO
- Changes meaning of existing data: NO
- Requires backfill: NO

---

## TRUST CHECK

- Could this mislead the user? No — this is a backend credential change with no
  user-facing behaviour change beyond (once configured) improved TheMealDB
  reliability/rate limits under the supporter tier.
- Could this fabricate certainty? No.
- Is anything guessed but shown as real? No.
- What happens if the system is wrong (key invalid/misconfigured)? TheMealDB
  returns a non-OK response; existing `try/catch` and `if (!res.ok) continue`
  handling in all three call sites already fails closed (empty results for that
  source, other sources unaffected) — no new failure mode introduced.
- No architectural duplication introduced: YES
- No new source of truth created: YES
- No runtime behaviour altered (for governance-only work): N/A — this is a
  runtime change (URL/credential), by design; behaviour is unchanged when the
  secret is absent, and additive (paid tier) when present.

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/before-mealdb-api-activation-20260703` →
  `3460519032d75c496cb14a375c7ccb3f36366a5`
- **Files modified:**
  - `server/lib/external-meal-service.ts`
  - `server/routes.ts`
- **Files created:**
  - `.env.example`
  - `docs/implementation/planner/EWO_MEALDB_API_ACTIVATION.md`
- **Rollback commands:**
  ```
  git checkout rollback/before-mealdb-api-activation-20260703 -- server/lib/external-meal-service.ts server/routes.ts
  rm .env.example
  ```
- **Verification steps after rollback:** confirm the three MealDB call sites
  again read `.../v1/1/search.php...` literally, and `npm run typecheck` /
  `npm run build` pass.

---

## SCOPE LOCK

**Implemented scope**
- Replaced the hardcoded MealDB test key with `THEMEALDB_API_KEY` (env var,
  safe fallback to `"1"`) at all three call sites.
- Created `.env.example` documenting the variable.
- Confirmed the required secret name (`THEMEALDB_API_KEY`) for both Replit and
  Render.
- Verified recipe search/import still functions (live test-key smoke test +
  existing test suite: `test-ingredient-verification.ts`, 21/21 passing).
- Ran build and typecheck.

**Explicitly excluded scope**
- Did NOT change `shared/recipe-acquisition.ts`'s `licenceState` for
  `themealdb` from `"conditional"` to `"licensed"`. That register entry
  represents a legal/commercial fact (whether TheMealDB's terms are now fully
  satisfied), not a code fact — it should only flip once a human confirms the
  configured key is genuinely the paid supporter key, not merely that an env
  var is present.
- Did NOT add `themealdb` to `SOURCE_REQUIRED_CREDS` in
  `recipe-source-gate.ts` (which would make the source non-callable without
  the secret) — doing so would change current default-on behaviour for any
  environment that hasn't yet set the secret, which is a product/availability
  decision outside this task's scope, not a credential-wiring one.
- No changes to any other recipe source, the recipe-source-gate admin UI, or
  any DB schema/table.

**Suggestions (not implemented — require approval)**
- Once the supporter key is confirmed live in Replit and Render, update
  `shared/recipe-acquisition.ts`'s `themealdb.licenceState` to `"licensed"`
  and revise `licenceNote` to close out FS1 G2 — this is a one-line register
  change per the Commercial Extension Rule (`THA_RECIPE_ACQUISITION_ARCHITECTURE.md`
  §6), not an architecture change, but is a factual/legal claim best made by a
  human confirming the upgrade actually happened.

---

## ADDENDUM — Secret Propagation Investigation (2026-07-03, later same day)

**Trigger:** user added `THEMEALDB_API_KEY` to Replit Secrets and asked for
confirmation of connectivity, then (after it wasn't picked up) confirmed exact
spelling and asked for the dev server to be restarted and re-checked, and for
the URL format to be migrated to `v2` once the key was confirmed reachable.

**Verification method (no secret values printed at any point):**
1. Checked `$THEMEALDB_API_KEY` presence (not value) in the interactive shell.
2. Restarted the app process via `npm run dev:reset` (kills anything on :5000,
   re-execs `tsx server/index.ts`).
3. Re-checked presence in: a fresh shell, a fresh `tsx -e` subprocess, and the
   actual running app process's `/proc/<pid>/environ` (grepped for the key
   *name* only).

**Result — first restart:** `THEMEALDB_API_KEY` absent everywhere, while
`OPENAI_API_KEY`, `API_NINJAS_API_KEY` and `SPOONACULAR_API_KEY` were all
present in the same environment. Reported this back and asked the user to
confirm the exact secret name.

**Result — second restart (after user confirmed exact spelling):** Still
absent everywhere, including the freshly-restarted app process. Root-cause
investigation:

- No local secrets file exists on disk (checked common locations —
  `.replit`/secrets, `.env`, `.config/replit`) — Replit does not write
  secrets to the filesystem in this workspace; they are injected directly
  into the process environment.
- The container's init process (`PID 1`) start time is **2026-07-03 14:26:54
  UTC**. `OPENAI_API_KEY` and `SPOONACULAR_API_KEY` — both present — were
  therefore already configured *before* the container booted. `THEMEALDB_API_KEY`
  was added to Secrets *after* the container was already running.
- `npm run dev:reset` only kills and re-execs the `tsx server/index.ts`
  process **inside the same already-running container**; it inherits the
  container's environment as it was at boot. It does not re-fetch secrets
  from Replit's backend.

**Conclusion:** this is a Replit **secret-injection timing** issue, not a
code or wiring issue. Replit secrets are snapshotted into the environment at
container boot; a secret added to the Secrets pane while the container is
already running is not visible to any process in that container — including
a killed-and-restarted one — until the container itself is stopped and
restarted (a full Repl restart/reload, not just an in-container process
restart). This agent's shell tooling runs inside the same container as the
app, so it cannot force that container-level restart itself.

**Action required from the user:** fully stop and restart the Repl (not the
"Start application" workflow/process — the container itself), then confirm.
Once the container has rebooted with the secret present, the remaining work
(migrate all TheMealDB URLs to the `v2/${THEMEALDB_API_KEY}/` format, verify
`latest.php`, a search call, and the existing THA search/import path) is
ready to run and is otherwise unblocked — the only gap is container-level
secret propagation, confirmed by direct evidence above.

**Not done in this addendum (blocked, not skipped):**
- v1 → v2 URL migration in `server/lib/external-meal-service.ts` and
  `server/routes.ts`.
- Live `latest.php` / search verification against the v2 endpoint.
- `.env.example` still documents `THEMEALDB_API_KEY` only (v2 uses the same
  variable, no new variable needed, so no further `.env.example` change is
  anticipated once the migration proceeds).
