# INT19 — Intelligence Activation

**Session ID:** `INT19_Intelligence_Activation`
**Opened:** 2026-07-17
**Branch:** `int1-intelligence-platform`
**Type:** Implementation — ACTIVATION only. No new engines, no new capabilities, no schema change, no new behaviour.
**Risk:** 🟢→🟠 GREEN/AMBER (two client mounts of already-built components; user-facing surfaces on Home and the Shopping workspace)

---

## Rollback

| Item | Value |
|---|---|
| **Rollback identifier** | `rollback/INT19-intelligence-activation-20260717` → `10573dd20baa9497975c4ed05837b75162305410` |
| Working tree at start | **Intentionally dirty — NOT MINE.** Pre-existing uncommitted work from sibling sessions (NORTH3, NORTH4, CONV1 P10, P0 recovery). The tag protects committed state only. **Not touched, not committed, not reverted.** |
| Verification method | Any "pre-existing" claim to be proven on a **clean `git worktree` at the tag** — never by mutating the dirty tree |

---

## Stage

**Complete — awaiting review.** Report at `docs/implementation/intelligence/INT19_INTELLIGENCE_ACTIVATION.md`.

---

## The decision that shapes the session

INT19 = **activate the intelligence that already exists**; the mandate forbids new engines, capabilities, schemas, and behaviour. That mandate is the scope filter over FI18's eight surfaces:

| FI18 item | INT19 verdict | Why |
|---|---|---|
| **QW1 — Mount `<AmbientIntelligence>` on Home** | ✅ **DO** | Pure activation: existing component, existing hook (Home already fetches `useFoodOpportunities` at `home-experience-page.tsx:337` and renders none of it). Mission #1, #5. |
| **QW2 — Remount `ShoppingIntelligencePanel` on the workspace** | ✅ **DO** | The component is built and live on the legacy `/basket` dialog; the workspace's per-item surface (`WorkspaceAnalyserSheet`) lost it in the legacy→workspace move. Existing route `/api/shopping/intelligence`. Mission #3. |
| **QW3 — `usePublishCompanionContext` on Pantry/Shopping/Diary** | ⛔ **NOT ACTIONABLE in-mandate** | The pointer contract (`CompanionSurfaceHints`) has **no field** for a pantry item, a shopping item, or a diary entry. Publishing on those pages sends empty hints. Adding pointers = extending the contract = new ownership. Cookbook's meal pointer is **already published** (`meal-detail-page.tsx:102`). |
| **QW4 — resolver matcher for `recommend`/`explain`** | ⛔ **DELIBERATELY NOT DONE** | FI18's "the Domain Intelligence layer is mute" is **stale**: the resolver already routes `food-intelligence:report` (BENCH4) and `:compare` (COMP1). Emitting `recommend` needs a benefit/nutrient **slug** the resolver would have to invent — the fabrication the resolver's own rules forbid. |
| PANTRY1 second producer (NTC-P3) | ⛔ Remaining opportunity | Enrolling a producer in `OPPORTUNITY_SOURCES` **adds platform-wide noticing behaviour** — FI18 scoped it as its own gated EWO. Out of "activate, don't build". |
| `NUTRITION_CONTEXT` extension (F8) | ⛔ Remaining opportunity | **Editorial, not engineering** (600/610 foods uncitable). No mount raises it. |
| NTC-P2 convergence of the 3 ungoverned channels | ⛔ Remaining opportunity | Retiring `/api/home/intelligence` etc. is Notice-Engine convergence, a separate gated EWO. |

**One-line scope:** INT19 mounts two already-built components through two doors the architecture already opened. It writes **no** producer, verb, capability, schema, or notice category.

---

## Checkpoints

- [x] Architecture bootstrap read (`docs/architecture/README.md`)
- [x] `git status` confirmed; rollback tag created and resolved (`rollback/INT19-intelligence-activation-20260717` → `10573dd2`)
- [x] FI18 investigation + P0 recovery report read; every activation claim re-checked against current code
- [x] Run file opened
- [x] `INT19_INTELLIGENCE_ACTIVATION.md` created
- [x] QW1 — `<AmbientIntelligence surfaceKey="home">` mounted on Home (foot of room, below doors)
- [x] QW2 — `ShoppingIntelligencePanel` mounted in `WorkspaceAnalyserSheet` (top of per-item sheet)
- [x] Gates run; every failure attributed to pre-existing sibling debt on a clean worktree at the tag
  - `typecheck:ci` — **clean HEAD + my edits = 0 errors** (worktree proof); dirty tree's 27 are sibling debt, neither edited file appears
  - `adoption:check` — 2 failures (button ceiling, HNP1 orphan) **present at the tag with/without my edits**; my delta 0 raw buttons, 0 orphans
  - `verify:publication` — `🟢 Companion / Notice`; 5 reds pre-existing (4 domains), untouched
  - `repo-structure-verify` — 3 FAILs = sibling loose files; my report filed under `intelligence/`
- [x] **Client + server production build EXIT 0** (Vite: 3286 modules ✓ built) — both mounts integrate and bundle; components already run in production elsewhere. Full runtime observation of the *populated* opportunity card needs a seeded household with a live opportunity (192/195 render nothing by design)
- [x] Report written
- [ ] Owner review; inherited blocking question — is the 10-food `NUTRITION_CONTEXT` ceiling deliberate?

---

## Findings vs FI18 (current code, re-measured 2026-07-17)

- Resolver is **no longer mute**: `FOOD_INTELLIGENCE_MATCHERS` (report) + `foodComparison` (compare) both live at `pattern-intent-resolver.ts:1344+`. FI18 Finding 3's "no utterance can reach it" is stale for `report`/`compare`.
- `OPPORTUNITY_SOURCES` still holds exactly one producer (`framework.ts:286`). Unchanged.
- Home already renders **Companion notices** (`useCompanionNotices` → `/api/intelligence/companion/notices`), which gather the SAME `opportunity-delivery` producer, silence-ruled to ≤2 and phrased. So Home is not silent about opportunities — but it renders them only as phrased Companion sentences, never as the resolvable, evidence-carrying ambient cards. QW1 adds that surface (the dashboard already pairs both — `dashboard.tsx:329-340`).
