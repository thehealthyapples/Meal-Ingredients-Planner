# Canonical Food Ownership — Verification

**Status:** Investigation only. Read-only. No code, schema, data, seed, or runtime behaviour changed.
**Date:** 2026-07-13
**Branch:** `int1-intelligence-platform`
**Risk:** 🟢 GREEN (documentation only)
**Purpose:** Verify the *permanent* canonical owner of Food Identity **before** the Whole Food promotion (the 338) is implemented.

**Rollback protection (created before any work):**

| Item | Value |
|---|---|
| Tag (HEAD anchor) | `pre-canonical-food-ownership-verification` → `10b418a0c8503b877de8be00ee8dfb6b801eb30e` |
| Stash (dirty tree, non-destructive) | `stash@{0}` — `CFOV1_ROLLBACK: pre-investigation dirty-tree snapshot 2026-07-13` |
| Restore working tree | `git stash apply stash@{0}` |
| Restore committed state | `git reset --hard pre-canonical-food-ownership-verification` |
| Database rollback | **None required — zero DB writes.** |

Created with `git stash create` + `git stash store`, so the pre-existing working tree (109 modified files) was captured **without** being disturbed.

**Governing documents read (Architecture Bootstrap, `ENGINEERING_WORKFLOW.md` STEP 2):**
`docs/architecture/README.md` → `ARCHITECTURE_PRINCIPLES.md` → `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` → `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` → `NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md` → `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` → `THA_MASTER_EVOLUTION_ROADMAP.md`.

**Predecessor:** `docs/investigations/knowledge/KNOWLEDGE_WHOLE_FOOD_IMPORT_TRACE.md` (2026-07-13), which raised the question this document answers.

---

## HEADLINE

**`CANONICAL_SEED` is the owner, and the governing architecture says so in three separate places. It is not a bootstrap. The `canonical_food` table was never the source of truth, and no document has ever said it would become one.**

The apparent "fork" the Import Trace found is not a fork in the *owner* — it is the correct architecture, plus **one real violation the trace did not name**: the `canonical_food` table has **two writers**, and the second one is exactly the class of defect `KNOW2` retired six weeks ago on the knowledge half of the platform.

The promotion of the 338 is therefore **aligned with the governing architecture, not a deviation from it** — the platform's own gate already emits the precise edit it requires and refuses to seed until it exists. But it multiplies THA's one *named* identity debt by roughly five, and it carries one editorial decision that is a claim, not an identity. Both are stated in §5.

---

## 1. What is the authoritative Source of Truth for Canonical Food Identity?

### → **`CANONICAL_SEED` — `shared/canonical/foods.ts`**

The governing architecture declares this **three times, consistently**, and never declares anything else:

| Governing document | Statement | Location |
|---|---|---|
| **Source of Truth Register** (Domain 2, Canonical Food Identity) | *Authoritative Source: **WS2A Canonical Seed** (`shared/canonical/foods.ts` → DB `canonical_food`, `food_variety`, `canonical_food_alias`, `diversity_group`)* | `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md:106` |
| **NK1 — Canonical Nutrition Knowledge Platform** (Plane 1) | *Food Identity \| All foods THA knows \| `shared/canonical/foods.ts` → DB `canonical_food`, `food_variety`, `canonical_food_alias`* | `NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md:52` |
| **Food Intelligence Platform Architecture** (Plane 1 owner) | *Owner: Food Knowledge Registry … **canonical food identity (`shared/canonical/`)** … exactly as declared in the SoT Register. Unchanged by this document.* | `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md:132` |

Read the arrow correctly. **`shared/canonical/foods.ts` → DB** means *the seed is the owner and the tables are its published projection*. It does not mean the two share ownership. This is THA's standard shape, applied identically across every knowledge domain:

| Domain | Owner (code seed) | Projection (DB) |
|---|---|---|
| Food Identity | `shared/canonical/foods.ts` | `canonical_food`, `food_variety`, `canonical_food_alias` |
| Food Knowledge | `shared/knowledge/foods.ts` | `knowledge_foods` (+ link tables) |
| Diversity groups | `shared/canonical/diversity-groups.ts` | `diversity_group` |
| Restrictions | `shared/restrictions/restriction-library.ts` | — |

### The code agrees with the architecture, deliberately and in writing

`shared/canonical/resolver.ts:5-8` states the design intent explicitly:

> *"Pure and deterministic: it resolves against the editorial **SEED** (the same source the DB is seeded from), so it is usable in tests and in shadow mode with no database round-trip. Nothing here mutates state or reads production tables."*

And `KNOW2` (commit `17f1afd3`, 2026-07-09) — the most recent governing-compliant decision on this exact axis — named DB-as-authority as a **root cause**, not an option:

> *"Identity existence is now checked against `FOOD_SEED`, **not the database** — asking the DB is how the importer came to treat the published table as the authority on identity."*

That is as close to a direct ruling on this question as the record contains.

### Verified against the running code, not the documents

An independent trace of every read of `canonical_food` / `canonicalFoods` / `food_variety` / `canonical_food_alias` / `diversity_group` across `server/`, `client/`, `shared/`, `scripts/`, and `migrations/`:

| Read | Count | Where |
|---|---:|---|
| **Runtime application reads** (routes, services, handlers, assemblers) | **0** | — |
| Seed reads | 2 | `seed-canonical-food.ts:101` (FK id map), `:137-140` (row counts) |
| Test reads | 1 | `test-canonical-food.ts:154-157` (count assertions) |
| Script reads | 1 | `ws011-usda-ingestion.ts:225-227` (isolation check) |

The only runtime *occurrences* of the string `canonical_food` are provenance labels pushed into a `sources[]` array (`food-intelligence-assembler.ts:454`, `connected-food-intelligence-assembler.ts:318`, `meal-intelligence-assembler.ts:654`). They are metadata strings, **not queries** — the assembler names `canonical_food` as its source while reading the seed. That mislabelling is itself a small honesty defect worth noting.

Meanwhile `resolveCanonicalFood()` (→ `CANONICAL_SEED`) is called from **~40 runtime sites**: `routes.ts` (5 endpoints), five assemblers, the opportunity/comparison engines, the plant classifier, the food-report adapter, and the alternatives / discovery / seasonal / stories / relationship engines.

**This is unambiguous. One store resolves food identity at runtime, and it is the seed.** Three independent sources agree: this trace, `WS0X.12:176` (*"`canonical_food` table — Nothing at runtime"*), and `KNOWLEDGE_WHOLE_FOOD_IMPORT_TRACE.md:22`.

---

## 2. Is the current implementation compliant with One entity / One owner / One source of truth?

**Partially. One of the three is genuinely violated — and it is not the one the Import Trace flagged.**

### One entity — ⚠️ **NOT COMPLIANT** (pre-existing, named, governing-acknowledged debt)

Architecture Principle 1 requires *one key space per entity*. Food has **two**: the canonical slug (`tomato`) and the knowledge slug (`tomatoes`), joined by the hand-set `knowledgeFoodSlug` FK.

The governing architecture does not merely permit this — it **names it as debt, twice, unprompted**:

- `ARCHITECTURE_PRINCIPLES.md:21` — *"Dual namespaces are THA's recurring silent-defect source. The `knowledgeFoodSlug` vs canonical slug gap (WS0X.12/13) … stem from a single root cause: more than one key space for one entity."*
- `ARCHITECTURE_PRINCIPLES.md` Principle 7 — *"The `knowledgeFoodSlug` FK is a sync bridge (two owners of identity) — **it is debt**."*

This is a real non-compliance. It predates the 338 and is not created by them. It is the strongest live argument for the WS0X.13 convergence (§4).

### One owner — ❌ **VIOLATED, at the table**

`canonical_food` has **two writers**:

| Writer | Path | Source |
|---|---|---|
| The declared owner | `seed-canonical-food.ts:78` — `db.insert(canonicalFoods)` upsert | `CANONICAL_SEED` |
| **An unauthorised second writer** | `ws011-usda-ingestion.ts:211` — **raw `INSERT INTO canonical_food`** | USDA FDC pilot, bypasses the seed entirely |

The second writer also performs **runtime DDL from an application script** — `ws011-usda-ingestion.ts:196-199` issues `ALTER TABLE canonical_food ADD COLUMN IF NOT EXISTS tier / scientific_name / source_ref / confidence`. Four columns of the canonical identity table exist only because an ingestion script added them at run time. They appear in no migration.

The consequence is structural, not cosmetic:

- `seed-canonical-food.ts:78` is `onConflictDoUpdate` — **upsert-only, never delete**. The 309 WS0.11 catalogue rows therefore **survive every `npm run seed:canonical`, permanently**.
- `validateCanonicalSeed()` validates the code seed only, so it **cannot see them**.
- **The declared owner cannot reproduce its own table, and cannot detect that it can't.**

This is precisely the violation `KNOW2` found and retired on `knowledge_foods` ("*`knowledge_foods` had two writers … the declared source of truth could not reproduce its own table*"). **The identical defect was left standing on `canonical_food`.** It is invisible today only because nothing reads the table.

### One source of truth — ✅ **COMPLIANT at runtime**, ⚠️ **overstated in the Register**

At runtime, exactly one store resolves identity: `CANONICAL_SEED`. Zero competing reads. This is compliant, and it is compliant *by design*, not by accident.

But the Register's declaration — `shared/canonical/foods.ts` **→ DB `canonical_food`…** — describes a published projection that is **stale and unreproduced**: the seed declares ~312 canonical foods; the table holds **53**. `seed-canonical-food.ts` has not been re-run against this database. The Register describes a chain whose second half does not currently exist.

**Net:** the *owner* is unambiguous and correctly implemented. The *projection* is stale, doubly-written, and undetectably so.

---

## 3. Is the `canonical_food` table canonical, transitional, deprecated, or dead?

### → **None of those four cleanly. It is a non-runtime store serving two unrelated roles, and both are currently inert.**

Forcing it into one of the four labels would misrepresent it, so state it precisely:

| Rows | What they are | Status |
|---:|---|---|
| **53** (`active` / `canonical`) | A **stale published projection** of `CANONICAL_SEED` (which declares ~312) | Not canonical — *nothing reads it*. Not deprecated — *no retirement is declared anywhere*. **A projection that has fallen out of date and that nothing notices.** |
| **309** (`draft` / `catalogue`) | The **WS0.11 USDA candidate pool** — a separate, unrelated import, quarantined behind `tier='catalogue'` | **Stranded candidates.** This is Stage 1 (CANDIDATE) of `PKCA §1.1`'s "Food catalogue" row — but the pipeline that would graduate them **is never executed by anything**. |

On that second half: `shared/catalogue/promotion-readiness.ts` (a 100-point rubric) and `shared/catalogue/promotion-validator.ts` (brand / prepared-food / H1 supermarket gates) exist and are correct — and **no script anywhere flips `tier='catalogue'` → `tier='canonical'`**. The 309 foods are scored on paper and go nowhere. The `tier` column is a real quarantine axis (`shared/schema.ts:2241`) doing its job; there is simply no exit from quarantine.

**The accurate verdict:** the table is **transitional infrastructure that was never wired up** — a publication target that has not been published to since the seed grew, plus a candidate pool with no promotion path. It is **not** canonical, has **never** been the source of truth, and is **not** dead architecture in the sense of "safe to ignore" — because its second writer is actively depositing rows the declared owner cannot see.

`KNOWLEDGE_WHOLE_FOOD_IMPORT_TRACE.md:297` is correct that *"any remediation aimed at the table would have no user-visible effect"*. That is true, and it is **not** a reason to leave it: an untracked second writer into an identity table is a latent defect that becomes a live one the moment anyone makes the table load-bearing.

---

## 4. Is `CANONICAL_SEED` permanent, or a bootstrap until database convergence?

### → **Permanent. No governing document schedules a convergence of runtime identity onto the database — and the platform's most recent decision moved in the opposite direction.**

**No governing document proposes DB-as-owner.** Every one that speaks to it names the seed (§1). The Master Evolution Roadmap's only relevant line reinforces it: *"WS2 (**the static registry**) is the convergence point"* (`THA_MASTER_EVOLUTION_ROADMAP.md:238`) — the static registry is the destination, not the thing being migrated away from.

**The one document that recommended convergence was never promoted, and did not mean this.**

`WS0X.13 — Unified Food Intelligence Architecture` (2026-06-25) recommends *"Option B — gradual convergence to one canonical-keyed runtime model"*. Two facts disarm it as an objection:

1. **It is an investigation, not architecture.** It lives in `docs/investigations/`, and `docs/architecture/README.md:4` is explicit: *"Architecture documents no longer live in `docs/investigations/` — investigation files there are point-in-time analysis and history only."* It was never promoted; it appears nowhere in the architecture index. It is history, and it is **not binding**.
2. **Even taken at face value, it argues the opposite of DB-ownership.** Its convergence target is *collapsing the two slug namespaces onto the canonical key* — retiring the `knowledgeFoodSlug` bridge (Principle 1 / Principle 7 debt). It is a convergence of **key spaces**, not of **stores**. Its own architecture map (`:48-56`) records the seed as the identity spine and notes *"`canonical_food` the TABLE is read by seeds/tests/scripts only"* — as a **description of the design**, not a complaint about it.

**And the most recent decision on this axis chose the code seed, at scale.** `KNOW2` (2026-07-09) took 346 imported foods that a script had written **directly into the database**, and moved their ownership **into a code seed** (`shared/knowledge/graduated-foods.ts`, `GRADUATED_FOOD_SEED`), then **deleted the DB writer**. THA's answer to "610 foods, where does ownership live?" was given six weeks ago, and it was *the code seed*.

### The one genuine tension, stated rather than buried

**Governance Rule 6** (`ARCHITECTURE_PRINCIPLES.md:220`): *"Static client `.ts` files are not knowledge stores. Data that overlaps with DB knowledge, will grow beyond 30 entries, or will need post-launch enrichment must live in the DB."*

A seed array growing to ~650 entries deserves this rule held against it honestly. It does **not** bite, for three reasons:

1. It governs *static **client** files* — its named violation is `client/src/lib/nutrition-variety.ts`. `CANONICAL_SEED` is a `shared/` module, which **Rule 4 positively requires** (*"Server+client shared modules must live in `shared/`"*).
2. *"Must live in the DB"* is **satisfied**: the data does live in the DB. Writing it there is the seed's entire purpose. The seed is the *editorial owner*, not a substitute store.
3. The governing SoT Register and NK1 both already declare a 239–312-entry seed authoritative, with no Rule 6 objection raised.

**But the rule marks the real boundary condition, and it should be recorded now:** `CANONICAL_SEED` is permanent **for editorially-owned identity**. The day food identity needs to be **runtime-editable, per-household, user-contributed, or admin-managed without a deploy**, the DB must become the owner — and that is a **Rule 8 governance-review event**, not a drift to be discovered later. Nothing in the 338 promotion crosses that line: it is editorial identity, authored by humans, shipped in a commit.

---

## 5. Would adding the 338 to `CANONICAL_SEED` align with the architecture, or increase technical debt?

### → **It aligns. It is literally the next declared stage of the pipeline — and the platform's own gate is already asking for it.**

**It is Stage 3 of the governing Knowledge Graduation Pipeline** (`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md §1`), as implemented in `canonical-foods-gate.ts:20-23`:

```
1 CANDIDATE  docs/knowledge/canonical-foods/drafts/*.yaml   (AI-authored)
2 GATED      canonical-foods-gate.ts — writes nothing
3 PROMOTED   a human commits the emitted record into shared/   ← THE 338 ARE HERE
4 PUBLISHED  the seed runner — the one writer
```

**The gate already emits the exact edit required.** `canonical-foods-gate.ts:84-91` defines `RequiredCanonicalBinding`, emitted at `:396`, and `:281-285` states the obligation in the platform's own words:

> *"Promoting requires the canonical binding `knowledgeFoodSlug: "…"` in `shared/canonical/foods.ts`, in the same commit — or a reasoned entry in `DEFERRED_KNOWLEDGE_BINDINGS`. **`seed:canonical` refuses until one exists.**"*

The machinery does not merely permit this promotion. **It is blocked, by design, waiting for it.** Writing the 338 into the seed is the platform doing what it was built to do.

**It is not blocked by the evidence gate.** `KNOW5`'s hard stop (0 of 1,988 composition rows signed off) governs **claims**. An identity is not a claim: it asserts *this food exists and is called this*, cites nothing, and renders no health benefit. The 338 promotion is therefore **unblocked, reversible, and claim-free** — and `validateCanonicalSeed()` + `resolveKnowledgeBinding()` (KNOW3) already enforce anti-fork correctness on exactly this edge.

**On the identity axis it adds no new debt class.** But two costs must be stated plainly rather than discovered later:

**(a) It multiplies THA's one named identity debt by ~5×.** Every one of the 338 entries carries a hand-set `knowledgeFoodSlug` — the very FK Principle 7 calls *"a sync bridge (two owners of identity) — it is debt"*. Today there are ~312 such crossings; afterwards there will be ~650. The debt does not change **kind**, but it changes **magnitude**, and it makes the WS0X.13 key-space convergence *more* valuable, not less. The mitigating fact — and it is a real one — is that KNOW3's `resolveKnowledgeBinding()` and `validateCanonicalSeed()` **mechanically enforce** that edge and refuse to seed a broken one. This is **enforced debt, not silent debt**, which is the only kind THA has ever survived.

**(b) One field in the promotion *is* a claim, and must not be automated.** `diversityGroupSlug` decides whether a food counts toward the 30-plants feature. Assigning it for 338 foods is an **editorial decision with a user-visible consequence**, not a mechanical mapping — and Rule KC9 (*automation authors candidates, never publishes them*) applies to it directly. A bulk script that guesses diversity groups from category strings would be exactly the fabrication risk the gate exists to prevent. `category` / `subcategory` carry the same, milder, exposure.

**What would increase debt — and must not be done:** writing the 338 into the `canonical_food` **table**. It would achieve nothing (nothing reads it), and it would make the codebase's second unauthorised writer into a third. `KNOWLEDGE_WHOLE_FOOD_IMPORT_TRACE.md:282` is right about this.

---

## 6. Recommendation

# → **OPTION A** — `CANONICAL_SEED` is the permanent owner. Proceed with promoting the 338 into the seed.

**Option B is rejected**, and not narrowly. Converging the runtime onto the database before promoting would: contradict three governing documents (§1); invert `KNOW2`'s six-week-old decision, which moved 346 foods *out* of DB ownership after that ownership caused four named defects; act on `WS0X.13`, an unpromoted investigation whose recommendation was about **key spaces, not stores** (§4); and require building a DB read path for a table that **no runtime code has ever read** — new machinery, new failure modes, zero user-visible gain, and it would block a promotion that is currently unblocked, reversible, and claim-free.

**Option C does not apply.** No third architecture is defined. The architecture that *is* defined is the one already implemented: **editorial code seed owns; DB table is a published projection.**

### Proceed — with these four conditions

1. **Promote through the gate, never around it.** Route the 338 through `canonical-foods-gate.ts` → `RequiredCanonicalBinding` → human commit. Do not hand-append entries, and do not bulk-generate them without review. Rule KC9 is not negotiable, and the gate has already proven its worth by correctly blocking `carrot`→`carrots` and `tomato`→`tomatoes` as anti-fork aliases.
2. **Treat `diversityGroupSlug` as editorial, not mechanical** (§5b). It is the one field in this promotion that changes what a household is told. Batch it for human review; let `validateCanonicalSeed()` refuse what is unresolved.
3. **Do not write the `canonical_food` table as part of this work.** It is not the owner, and a third writer would compound §2's violation.
4. **Open the second-writer defect as its own item — do not fold it in.** `ws011-usda-ingestion.ts` writing raw SQL + runtime DDL into `canonical_food` is the same violation class `KNOW2` retired on `knowledge_foods`, and it is undetectable to `validateCanonicalSeed()` today. It is **not blocking** the 338 (nothing reads the table), and it must not be allowed to hide behind them.

### Follow-on corrections this verification surfaced (none blocking)

- **SoT Register Domain 2 is stale.** It states *"Foods covered: 239 entries"*; the seed holds ~312 and will hold ~650. (Domain 1 is stale too — *"188 foods"* against a true 610, already flagged at `KNOWLEDGE_WHOLE_FOOD_IMPORT_TRACE.md:299`.) Rule 7 requires the Register be updated at the end of the workspace that changes it — so the 338 promotion **must** update it.
- **`seed-canonical-food.ts` has never been re-run** against this database (code ~312, table 53). Harmless today; it means the projection cannot be trusted as a mirror of the seed by anyone who assumes it is one.
- **Three assemblers label their source `canonical_food` while reading the seed** (`food-intelligence-assembler.ts:454`, `connected-food-intelligence-assembler.ts:318`, `meal-intelligence-assembler.ts:654`). The provenance string names a store the code does not read. Small, but this is an explainability surface — it should name `shared/canonical/foods.ts`.

---

## 7. Answers

**1. Authoritative Source of Truth for Canonical Food Identity:** `CANONICAL_SEED` (`shared/canonical/foods.ts`), declared by the SoT Register (Domain 2), NK1 (Plane 1), and the Food Intelligence Platform Architecture; the DB tables are its published projection.

**2. Compliant with One entity / One owner / One source of truth:** **One source of truth — yes** (verified: zero runtime reads of the table). **One owner — no**: `canonical_food` has two writers, and the declared owner cannot reproduce or audit its own table. **One entity — no**: the canonical/knowledge dual slug namespace violates Principle 1, and the governing architecture already names it as debt.

**3. The `canonical_food` table:** **Transitional and unwired** — 53 rows are a stale projection of the seed, 309 are stranded USDA candidates with no promotion path. Never canonical, never the source of truth, no retirement declared, and read by no runtime code.

**4. `CANONICAL_SEED` permanent or bootstrap:** **Permanent** for editorially-owned identity. No governing document schedules DB convergence; the only document that recommended convergence was never promoted and meant key spaces, not stores; and `KNOW2` (2026-07-09) moved 346 foods *into* code-seed ownership. DB ownership becomes correct only if identity must become runtime-editable — a Rule 8 governance event, not a drift.

**5. Adding the 338 to `CANONICAL_SEED`:** **Aligns with the governing architecture.** It is Stage 3 (PROMOTED) of the declared Knowledge Graduation Pipeline; the gate already emits the required binding and `seed:canonical` refuses until it exists. It asserts no health claim and is not blocked by KNOW5. It does not add a new debt class — but it grows the named `knowledgeFoodSlug` bridge debt ~5× (enforced, not silent), and `diversityGroupSlug` must be treated as an editorial claim, not a mechanical mapping.

---

## 8. Method

- Architecture Bootstrap first (`docs/architecture/README.md`), per `ENGINEERING_WORKFLOW.md` STEP 2.
- Rollback protection created before any investigation (tag + non-destructive stash).
- Static trace of every read and write of `canonical_food` / `canonicalFoods` / `food_variety` / `canonical_food_alias` / `diversity_group` across `server/`, `client/`, `shared/`, `scripts/`, `migrations/` — separating runtime reads from seed/test/script reads.
- Call-site trace of `resolveCanonicalFood` / `CANONICAL_SEED` / `buildCanonicalIndex` across the runtime.
- Cross-read of the governing set (SoT Register, Architecture Principles, PKCA, NK1, Food Intelligence Platform Architecture, Master Evolution Roadmap) against the investigation record (`WS0X.12`, `WS0X.13`, `NK6I`, `KNOW5`, `KNOWLEDGE_WHOLE_FOOD_IMPORT_TRACE`).
- `git show 17f1afd3` — the `KNOW2` ownership-unification commit, read in full as the governing precedent.
- Runtime-read finding independently corroborated three ways: this trace, `WS0X.12:176`, and `KNOWLEDGE_WHOLE_FOOD_IMPORT_TRACE.md:22`.

**No database was queried. No code, schema, data, seed, or document outside this file was modified.**

---

**CANONICAL OWNER = `CANONICAL_SEED` (`shared/canonical/foods.ts`) — the editorial code seed, permanently; the `canonical_food` table is its published projection and is read by no runtime code path.**

**RECOMMENDED NEXT ACTION = Proceed with Option A — promote the 338 foods into `CANONICAL_SEED` through `canonical-foods-gate.ts` with human review of every `diversityGroupSlug`, write nothing to the `canonical_food` table, update SoT Register Domain 2, and raise the `ws011-usda-ingestion.ts` second-writer violation as a separate, non-blocking defect.**
