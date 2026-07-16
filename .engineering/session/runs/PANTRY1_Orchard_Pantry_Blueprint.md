# Session: PANTRY1_Orchard_Pantry_Blueprint

| Field | Value |
|---|---|
| **Session ID** | `PANTRY1_Orchard_Pantry_Blueprint` |
| **Rollback ID** | `rollback/PANTRY1-orchard-pantry-blueprint-20260716` → `7d1dd2ce` |
| **Start time** | 2026-07-16T00:00:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Define the Pantry as **the household larder**, in principles, from the existing Experience architecture + the Orchard Blueprint. Eight deliverables: philosophy · feeling · how food is understood rather than stored · how household knowledge naturally grows · how seasonal living appears · Companion participation · moments of delight · anti-patterns. **No screens. No implementation.** Investigation only.

## Files being modified
- `docs/investigations/ux/PANTRY1_ORCHARD_PANTRY_BLUEPRINT.md` — the deliverable (new)
- `.engineering/session/CURRENT.md` + this run file — session recovery bookkeeping

**One deviation, reported in the deliverable § 0.1:**
1. **Filing** — mission specified `docs/investigations/` (root). That path violates `REPOSITORY_CONVENTIONS.md:47` and `docs/investigations/README.md:11`, and fails `repo-structure-verify.sh`. Filed under `ux/` — same as `PLAN1`/`COOK1`/`ORCH1`. **No competing folder existed** (there is no `pantry/` workstream), so this was simpler than COOK1's call. Gate re-run: **PASS**.

**One noun narrowing, reported § 0.2** — mission says *"larder"*; the canon says *"the household **pantry** — what is in the house right now, **honestly told**"* (`BLUEPRINT:148`). "Larder" imports a *store-of-provisions* model; the canon's room is a *truthful account* — *"its whole grace is honesty without guilt"* (`OLB:85`). Canon's noun kept.

No other file touched. All governing docs byte-untouched (7 Experience docs, PKCA, ARCHITECTURE_PRINCIPLES, SoT Register). `docs/architecture/README.md` untouched. No code, no schema, no UI.

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [x] Architecture Bootstrap read (`docs/architecture/README.md`)
- [x] Git status confirmed; rollback tag created → `7d1dd2ce`; session registered
- [x] `COOK1` read as the direct sibling precedent — shape, NORTH2 gate method, and filing decision inherited
- [x] **NORTH2 gate applied to all 8 deliverables — 6 owned with no remainder.** Deliverable is composition + citation, not law
- [x] **HEADLINE — the room whose only virtue is honesty is the only room that invents its contents.** `seedDefaultFoodPantryItems` (`storage.ts:2224-2374`, list `:2232-2353`, ~122 foods) + `seedDefaultHouseholdItems` (`:2187-2222`, list `:2195-2202`, 19 items) = **~141 items asserted into an empty pantry**, incl. Pink Lady apples, passion fruit, gooseberries, garam masala, bleach. Against `ARCHITECTURE_PRINCIPLES.md:74` Principle 6 — *"No fabricated knowledge"*, rationale *"Trust is the product… non-negotiable"* (`:83`)
- [x] **The honest signal is computed, shipped to the browser, and discarded.** `isDefault` on the row (`schema.ts:1018`), set true by both seeds (`:2214`, `:2365`), declared on the client type at `pantry-page.tsx:58` — **referenced once, never used.** No badge, no caveat, no filter
- [x] **A `GET` writes it** (`routes.ts:7788-7799`) — opening the page performs the seed. Also fires from the shopping list (`shopping-list-page.tsx:1588`), which then marks Milk/Eggs/Butter as *"staples you already have"* (`:1763-1766`)
- [x] **The Living Detail is sourced from a fact that does not exist.** `BLUEPRINT:314` — *"Freshness, honestly told | Pantry | **Item freshness data**"*. **No `expiry`/`bestBefore`/`useBy`/`openedAt`/`purchasedAt` on `user_pantry_items`** (`schema.ts:1010-1025`). THA knows **one bit** per food: does a row exist. Worse than COOK1 § 13.2's *"Cook/plan counts"* — there is no slash and no fallback
- [x] **The canon names an action the platform lacks** — `EXPLANG:427` *"one easy motion at a time (**mark used**, add an item)"*. **No `consumed`/`usedAt`/`depleted` anywhere.** `savingsEvents.'pantry_used'` declared `schema.ts:1351`, **no producer, always zero** (`storage.ts:3722`). *The room can be filled and never emptied*
- [x] **`needQuantityValue` is shopping intent, not stock** — and *"In Pantry"* is literally defined as `needQuantityValue === null` (`pantry-page.tsx:470`). **Flagging a need removes the item from "In Pantry" in the UI while every consumer still counts it present**
- [x] **EXPECTED FINDING INVERTED (§ 12.1) — the Pantry PASSES what the Cookbook failed.** `user_pantry_items.householdId` exists (`schema.ts:1013`); **all** reads/writes scope to it (`storage.ts:2134/2145/2164/2174`). Deliberate migration with the reasoning left in the comment (`runner.ts:820-822`). *"You" is honestly plural in this room* — the only audited room where that is true
- [x] **Knowledge growth: `pantry_ingredient_knowledge` skips Stage 3 entirely** — AI authors (`routes.ts:7893`) → real gate (wording firewall, `openai-enrichment.ts:43-58`) → **published straight to households** (`:7895`). **Violates PKCA KC1 · KC2 · KC3 · KC9.** Client never receives provenance. **`isLocked` is a lock with no key** — defaults false (`schema.ts:1390`), nothing anywhere sets it true
- [x] **The precedent is in-repo, twice, unapplied** — `ingredient_classifications` (20 lines away, `schema.ts:1400`) has candidate/gate/confirm/reject + admin surface (`classification-store.ts:62`; `routes.ts:10878-10947`); **`canonical-foods-gate.ts:5-26` fixed *this exact defect* elsewhere and cites Rule KC9 in its header**
- [x] **`PKCA:139` refuses the mission's word** — household knowledge does **not** grow "naturally": *"a pattern below Confirmed Understanding… **is not yet a fact at all**."* Platform says it in its own voice (`routes.ts:11763-11764`). EL1/EL2 gates verified real (`framework.ts:53/56/150/156`)
- [x] **WS10 Stories has no row in any PKCA table** (§ 6.4) — household knowledge, threshold-promoted, rendered unconfirmed. Collision visible 20 lines apart in one handler (`routes.ts:11743-11748` vs `:11763-11764`). Counter-argument (recollection ≠ inference) stated, not resolved — `PKCA:139` hands the question forward
- [x] **`PKCA § 6.1:265` is STALE** (§ 12.3) — *"currently zero of either"* is false; reporter (`opportunity-delivery/framework.ts:364`) and consumer (`:369`) both wired. Recorded, not fixed — governance decision
- [x] **FOUR PASSes recorded** (§ 11.3, § 11.9, § 8.1, § 5.1): **no scoreboard** in the room where a scold is most natural (plant counter exists at `PlannerIntelligenceStrip.tsx:175` and is **not imported** by any Pantry file); the single `?? 0` is **provably unreachable** (server returns `null`, `routes.ts:5672-5679`); **stillest room audited** — zero framer-motion in all three files, `AmbientIntelligence` uses `initial={false}`; **Companion in the right chair** — `surfaceKey="pantry"` titled *"Ways to use what you have"* = `OLB:87`'s own sentence in production
- [x] **Arrival near-clean — ONE unconditional element** (`pantry-page.tsx:1154`), a micro-insight rotating on **day-of-month** (`:1095`), generic, undismissable, **owned by no intelligence system**. Planner=5, Cookbook=0, **Pantry=1**
- [x] **The Knowledge Hub breaks its own stated rule** — header `:29` *"Empty sections are silent (never 'nothing yet')"* vs `"Nothing to show here yet."` at `:604`, `:620`, `:628`
- [x] **`COOK1 § 12.5` confirmed from this side** — `/api/pantry/stories` (`routes.ts:11453`) + `.slice(0,2)` (`PantryKnowledgeHub.tsx:828`) are **the Pantry's code**. Seconded COOK1's fix and added the caution: the stories should **leave, not multiply** (E2 density + `BLUEPRINT § 12.1 r4`)
- [x] **The canon's anti-pattern was aimed at illustrators and hit a seed function** (§ 10.1) — three docs forbid *"fake fullness"* / *"invented fullness"* (`OLB:89`; `OHDB:256`; `TRANSLATION1:271`), all read as visual rules. `storage.ts:2232` achieves it without drawing anything
- [x] Deliverable written: `docs/investigations/ux/PANTRY1_ORCHARD_PANTRY_BLUEPRINT.md` (15 sections)
- [x] **Gate re-run:** `repo-structure-verify.sh` → `docs/investigations/ has no loose files` **PASS**. Pre-existing unrelated FAIL on `.glibcheck.txt`/`.libdirs_uxhome.txt` persists (untracked before this session; also noted by ORCH1/PLAN1/COOK1)

## Next action
None — delivered, awaiting review. Recommends (§ 14, by dependency):
1. **Stop inventing the household's pantry** (`routes.ts:7788-7799`; `storage.ts:2232-2353`) — needs a decision an investigation may not make (seed → confirmed candidate list, or gone). `isDefault` is already in the browser, so telling the truth today is an afternoon; deciding the shape is the workstream.
2. **Stop asserting possession when someone types a list** (`shopping-list-page.tsx:1787`) — or #1 gets undone by the list.
3. **Give `pantry_ingredient_knowledge` a confirm stage** — unapplied in-repo precedent ×2.
4. **Ask governance two questions**: is WS10 inside PKCA (§ 6.4)? PKCA § 6.1:265 is stale (§ 12.3).
5. **Audit the other 8 Living Details against their named data sources** (2 of 10 now confirmed sourced from absent facts).
6. **Retire the micro-insight or give it an owner.**

**Not recommended:** any Pantry visual prototype (EXP5-P1 Home has not run); a freshness/expiry feature *yet* (it is the room's Living Detail and the most likely thing to be built next and built wrong — and it cannot be honest until #1 lands); a stock-level/check-in model (`EXPLANG:427` forbids bookkeeping by name).
