# SURF1B2 — Complete Canonical Dietary Restriction Knowledge

**Status:** In progress
**Branch:** `int1-intelligence-platform`
**Rollback identifier:** `rollback/SURF1B2-dietary-restriction-knowledge-completion-20260714` → `9f57680c`
**Predecessor:** SURF1B (`docs/implementation/platform/SURF1B_DIETARY_RESTRICTION_SAFETY_PATH.md`) — limitation #1.

## Mission
Close the dietary safety KNOWLEDGE gap SURF1B left open: `meat`, `fish`, `honey`
(and any other accepted value) resolve to no canonical restriction definition.

## Audit findings (complete, verified against live DB)

Accepted hard-restriction values, by door:

| Door | File | Values |
|---|---|---|
| Profile chips | `client/src/lib/diets.ts:40` `ALLERGY_INTOLERANCE_OPTIONS` | Gluten-Free, Dairy-Free, Nuts, Eggs, Shellfish, Soy, Sesame |
| Profile API (validated) | `server/routes.ts:594` `ALLOWED_DIET_RESTRICTIONS` | same 7 |
| Onboarding chips | `client/src/lib/diets.ts:91` `ALLERGY_OPTIONS` | nuts, dairy, gluten, eggs, shellfish, soy, sesame, **other (free text)** |
| Onboarding API | `server/routes.ts:5066` | `z.array(z.string())` — **unvalidated** |
| Eater POST/PATCH | `server/routes.ts:8979`, `:9005` | `z.array(z.string())` — **unvalidated** |
| Guest eaters | `server/routes.ts:9133`, `:6026`, `shared/routes.ts:202` | `z.array(z.string())` — **unvalidated** |
| Seeds / dev-world | `server/benchmark/world-fixtures.ts`, `data/development_world/` | meat, fish, honey, dairy, eggs, tree nuts, sesame, soy, gluten |

LIVE DB distinct values:
- `users.diet_restrictions`: Nuts, eggs, dairy, Soy, Gluten-Free, **honey**, **fish**, Dairy-Free, Eggs, Sesame, **meat**
- `household_eaters.hard_restrictions`: tree nuts, **fish**, eggs, **meat**, gluten, **honey**, dairy, soy, sesame

Unresolvable against the library (10 defs: gluten, dairy, peanut, tree_nut, sesame, soy,
mustard, shellfish, eggs, coconut): **meat, fish, honey**.

### Discovered, NOT fixed here (reported)
- **D5 — onboarding allergies are filed as SOFT preferences.** `onboarding-page.tsx:316`
  writes allergy chips to `user_preferences.excluded_ingredients`, never to
  `users.diet_restrictions`. A routing defect (SURF1B's domain), not a knowledge gap.
- **D6 — `dietRules` already owns MEAT/FISH keyword lists** (`shared/dietRules.ts:70,77`).
  Two owners of "what is meat". Pinned by a superset test rather than unified —
  unifying changes the Vegan/Vegetarian gate for every household, beyond this brief.
- **D7 — the pattern gate's meat list has holes**: no prosciutto/pancetta/gammon/mutton/
  gelatin. Recorded; the library definition covers them for the restriction path.

## Plan
1. `shared/restrictions/restriction-library.ts` — add `meat`, `fish`, `honey`. v4.0.0.
2. `shared/restrictions/restriction-resolver.ts` — `isEnforceableRestriction` / `unenforceableRestrictions`.
3. `server/routes.ts` — close the unvalidated write doors: THA may not store a restriction it cannot enforce.
4. `server/tests/test-surf1b2-dietary-restriction-knowledge.ts` — coverage matrix, enforcement, negative controls, superset proof, live DB.
5. `docs/implementation/platform/SURF1B2_DIETARY_RESTRICTION_KNOWLEDGE_COMPLETION.md`.

## Result
Complete. `docs/implementation/platform/SURF1B2_DIETARY_RESTRICTION_KNOWLEDGE_COMPLETION.md`

- Library v3.0.0 → v4.0.0; `meat`, `fish`, `honey` added (10 → 13 definitions).
- Five unvalidated write doors closed: accepted ≡ enforceable, by construction.
- `test:surf1b2-dietary-restriction-knowledge` — **167 passed, 0 failed** (incl. live DB).
- SURF1B's KNOWN-GAP pin fired and was inverted: 52/1 → **54 passed, 0 failed**.
- 18 regression suites green. typecheck 304 = baseline, 0 new. CPV1 unchanged (24/12).

## Next action
None — workstream complete. Follow-up (documented as limitation #1): the Vegan/Vegetarian
PATTERN gate (`dietRules.MEAT_KEYWORDS`) still has holes the restriction path no longer has
(prosciutto, pancetta, gammon, mutton, gelatine). Pinned by the superset test, not fixed.
