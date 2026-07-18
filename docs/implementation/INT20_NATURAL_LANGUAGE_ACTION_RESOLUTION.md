# INT20 — Natural-Language Action Resolution

**Letting a household ask the Companion, in ordinary words, to do the things the platform can already
do — by resolving conversational commands into the EXISTING capabilities COMP_ACT1 bound, with no new
capability, no new business logic, no new API and no new architecture.**

Implementation workstream. Completes the conversational half of the work COMP_ACT1 (execution) and
COMP_ACT2 (surfacing) began.

| | |
|---|---|
| **Doc ID** | `INT20` |
| **Date** | 2026-07-18 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback** | `rollback/INT20-natural-language-action-resolution-20260718` → HEAD `7bfad50c` |
| **Status** | **Implemented + verified.** All six stated commands resolve; 61/0 new assertions; verified live against real household data through the real turn pipeline. |
| **Predecessors** | `COMP_ACT1` (bound the eight write verbs), `COMP_ACT2` (surfaced them as proposals from on-screen context), `INT24` (the Canonical Intent Resolver), `INT40` (the first two write verbs) |

---

## 0. PRE-FLIGHT (as required)

- **Git status confirmed.** Branch `int1-intelligence-platform`, HEAD `7bfad50c`. The working tree
  carries a large set of uncommitted changes from prior sessions; **none were touched by this
  workstream** beyond the files listed in §5.2.
- **Rollback protection created.** Annotated tag
  **`rollback/INT20-natural-language-action-resolution-20260718`** → `7bfad50c`.
- **Rollback identifier reported:** **`rollback/INT20-natural-language-action-resolution-20260718`**.
  Undo with `git reset --hard rollback/INT20-natural-language-action-resolution-20260718`.

---

## 1. THE GAP, PRECISELY

COMP_ACT1 made eight write verbs genuinely executable. COMP_ACT2 surfaced them as one-tap proposals.
Neither gave the household a way to simply **say** what it wanted. Three facts, each verified in the
source before a line was written:

1. **The resolver emits no write intent at all.** `pattern-intent-resolver.ts` is 2,995 lines and
   contains not one `verb: "add" | "move" | "replace" | "delete"`. Every matcher it owns is a read.
2. **The gateway refused every command before resolution.** `detectWriteIntent` (`conversation-gateway.ts:225`)
   short-circuited the turn with *"the Companion is read-only today"* — a sentence that stopped being
   true at COMP_ACT1.
3. **The write handlers were waiting for exactly this.** `planner-write-handler.ts` states its own
   boundary in as many words: *"dayId / entryId / mealId / mealSlot must all be supplied as resolved
   parameters… **This handler never resolves 'today' or 'Saturday' itself.**"*

So the verbs were **live and unreachable by speech**, and the handler had already named the missing
step. INT20 is that step and nothing else: it resolves words into the parameters those handlers
already destructure, then hands the result to the confirmation flow that already exists.

---

## 2. SUPPORTED NATURAL-LANGUAGE PATTERNS

All eight COMP_ACT1 write verbs are reachable. Each row is a real resolution, verified end-to-end.

| Said | Resolves to | Parameters produced |
|---|---|---|
| "Add tuna spaghetti to Week 1 Tuesday lunch." | `planner.add` | `{ dayId, mealId, mealSlot }` |
| "Move Friday dinner to Monday." | `planner.move` | `{ entryId, dayId, mealSlot }` |
| "Replace Wednesday dinner with chilli." | `planner.replace` | `{ entryId, mealId }` |
| "Add milk to my shopping list." | `shopping.add` | `{ name }` |
| "Remove milk from my shopping list." | `shopping.delete` | `{ id }` |
| "Add bananas to my pantry." | `pantry.add` | `{ ingredient, category }` |
| "Remove bananas from my pantry." | `pantry.delete` | `{ id }` |
| "Log tonight's dinner." / "Log porridge for breakfast." | `diary.add` | `{ name, mealSlot, date }` |

**Frame variations accepted:** `add / put / stick / pop / throw`, `remove / delete / take / drop / get
rid of`, `move / shift / reschedule / switch`, `replace / swap / substitute / change`, `log / record /
note`, each with optional `please` / `can you` / `could you`.

**The destination decides the capability, never the item.** "Bananas" is a pantry item, a shopping
item or a meal depending entirely on where the household said to put it. One `add` frame serves all
three because the surface phrase (`shopping list` / `basket` / `pantry` / `larder` / `diary` / a
planner coordinate) is what routes it.

**Planner deletion is deliberately NOT matched.** `planner.delete` is not a bound verb — the planner
binding executes `add`/`move`/`replace` only — so recognising it would promise something the platform
cannot do. "Delete Monday's dinner" still reaches the unchanged read-only refusal.

### 2.1 Conversational references resolved

| Reference | Resolution |
|---|---|
| `Tuesday`, `Fri`, `Weds` | → `dayOfWeek` in the **declared key space** (`0 = Sunday`), imported from `shared/time/household-time.ts` — never redeclared |
| `Week 1` … `Week 6`, `week one` | → `weekNumber`, bounded to the six-slot rota the schema declares |
| `lunch`, `dinner`, `tea`, `supper`, `evening meal`, `brekkie` | → the canonical meal slot (British usage included) |
| `today`, `tonight`, `tomorrow`, `yesterday`, `last night`, `this morning` | → a **calendar** day offset — honoured for the diary, refused for the planner (§4.1) |
| `tonight`, `this morning`, `this afternoon` | → **both** a day offset and a meal slot ("tonight" = today + dinner) |
| `this meal`, `that meal`, `it` | → recognised as a demonstrative and left **absent**, never slugified into a fake entity name |
| the week, when unnamed | → `activePlannerWeekId`, the week the surface published — the same pointer discipline COMP_ACT2 uses |

**One vocabulary, two spellings, reconciled at the boundary.** The planner accepts `snacks` (plural)
and the diary accepts `snack` (singular). That divergence is real and is not INT20's to fix; it is
mapped per capability at the single point that builds parameters for both, so neither owner is
contradicted and the split never leaks into the language layer.

---

## 3. PARAMETER RESOLUTION BEHAVIOUR

**Every id comes from an existing capability read.** No storage call, no route, no new query.

| Needed | Resolved by | Read used |
|---|---|---|
| `dayId` | week + day-of-week → the planner's own day projection | `planner` · `read` `{ scope: "day", weekNumber\|weekId, dayOfWeek }` |
| `entryId` | the resolved day's entries, matched on `mealType` | (same read) |
| `mealId` | meal name → `meals` search | `meals` · `search` `{ query }` |
| shopping `id` | item name → the list's **extras** | `shopping` · `read` `{ scope: "list" }` |
| pantry `id` | item name → `displayName` (falling back to `ingredientKey`) | `pantry` · `read` `{ scope: "list" }` |
| diary `date` | the household's own `temporalAnchor`, shifted by whole civil days | (no read — the frame already carries it) |

**Ownership is inherited, not re-checked.** Every `mealId` that `meals`/`search` can return is by
construction either a system meal or the caller's own (the handler merges exactly those two sets) —
which is precisely the predicate `planner-write-handler.ts:100` enforces before it writes. INT20 adds
no second authorisation rule; the handler remains the enforcing authority and re-validates everything.

**`shopping.delete` targets extras only.** The same read also returns `items[]` (generated from the
plan — a different table). Matching a name there and passing its id would silently delete nothing, so
only `extras` are searched. This is called out because it is the one non-obvious trap in the contract.

**Matching is exact-first, then unique-substring.** One candidate is an answer; several is an
ambiguity the household settles (§4). Nothing is ranked, scored or best-guessed — a wrong pick writes
to real household data.

---

## 4. CLARIFICATION BEHAVIOUR

**One concise question. Never a guess.** Every clarification below was observed live.

| Situation | What the Companion asks |
|---|---|
| No meal slot named | *"Which meal slot should "tuna spaghetti" go in — breakfast, lunch or dinner?"* |
| Meal name not found | *"I couldn't find a meal called "tuna spaghetti" in your meals. What's it called exactly?"* |
| Two meals match | *"I found more than one meal like "chicken" — did you mean Chicken Curry or Chicken Soup?"* |
| Item not on the list | *"I couldn't find "milk" on your shopping list. What's it listed as?"* |
| Moving from an empty slot | *"There's nothing planned for Tuesday lunch. Which meal did you want to move?"* |
| Pantry add, no category | *"Where should "bananas" go — larder, fridge, freezer, fruit, household or pet?"* |
| Log with no food named | *"What did you have for dinner?"* |
| No week named, none on screen | *"Which planner week should I use for Tuesday?"* |

Two of these deserve their reasoning stated:

- **Pantry category.** `pantry-write-handler.ts` requires one of six categories and ordinary speech
  almost never carries one. The surface supplies it when the household is on the pantry page; off it,
  this is exactly the missing fact worth one question.
- **"Log tonight's dinner."** It names the slot but not the food. THA could read the plan and assume
  the household ate what was planned — but that is an inference about the world, not a fact it holds.
  It asks.

### 4.1 The calendar boundary — the one design decision worth reading

The **diary is calendar-shaped** (it stores `YYYY-MM-DD`), so "today", "tonight" and "tomorrow"
resolve directly against the household's own anchor.

The **planner is not.** It is a fixed six-slot rota whose `weekStartDate` is written only at creation
and never back-filled (HT7). Its own read handler says so: *"the Planner is organised by week-number
and day-of-week and owns no calendar mapping, so 'today' cannot be resolved to a planner slot."*
`household-planner-week.ts` is blunter still: *"Do not pick a week to fix it."*

So calendar language aimed at the planner earns a question, not an invention:

> **Said:** "add chilli to today's dinner"
> **Reply:** *"Your planner is organised as six numbered weeks rather than calendar dates, so I can't
> tell which slot that means. Which week and day should I use — for example 'Week 1 Tuesday'?"*

This is not a limitation INT20 introduced — it is the platform's existing honesty, finally spoken in
conversation. **Verified on real data:** the test household's six planner weeks all carry
`weekStartDate: null`, exactly as the architecture predicts for the 192-of-195 unanchored households.
A week the household *names* ("Week 1") is used as given; a week the *surface* publishes
(`activePlannerWeekId`) is used as the pointer it is.

---

## 5. IMPLEMENTATION REPORT

### 5.1 Shape — a pure half and an I/O half

```
utterance
   │
   ▼  action-language.ts        PURE. words → symbolic command. No ids, no I/O, no clock.
ActionCommand { capability, verb, subject?, target?, source? }
   │
   ▼  action-resolution.ts      I/O. symbolic → real ids, via EXISTING capability reads only.
ActionResolution
   ├── proposal      → CompanionActionProposalDraft (COMP_ACT2's own shape)
   ├── clarification → one question
   └── unresolved    → falls through to the unchanged refusal
   │
   ▼  conversation-gateway.ts   persists the draft exactly as every COMP_ACT2 proposal
POST /api/intelligence/conversation/actions/:id/confirm   ← still the ONLY executor
```

The split mirrors the discipline the codebase already uses (opportunity engine, notice gateway,
nutrition assembler): a pure core that is trivially testable, and a thin orchestrator over it.

### 5.2 Files

**New:**
- `server/intelligence/conversation/action-language.ts` — pure parser. No storage, no platform, no
  clock. Emits symbolic references only; incapable of inventing an id.
- `server/intelligence/conversation/action-resolution.ts` — parameter resolver. Reads through the
  ordinary platform seam; builds `CompanionActionProposalDraft`s; never calls `handle()` with
  `{ confirmed: true }`.
- `server/tests/test-int20-natural-language-actions.ts` — **61 assertions, 0 failures.**
- `scripts/int20-verify-resolution.ts` — developer verification harness (mirrors
  `scripts/comp-act2-verify-surfacing.ts`); drives the real turn pipeline, executes nothing.

**Modified:**
- `server/intelligence/conversation/conversation-gateway.ts` — **one** behavioural change: resolution
  now runs before the write-intent guard. ~90 lines added, none removed; the refusal path itself is
  byte-for-byte unchanged.
- `package.json` — registered `test:int20-natural-language-actions` in the test chain.
- `server/tests/test-intelligence-conversation-gateway.ts` — one stale assertion updated (§6).
- `server/tests/test-intelligence-behaviour-decision.ts` — one exit-path count updated (§6).

**No changes to:** the Capability Registry, the Intent Engine, `permissions.ts`, any handler, any
port, any binding, any route, any schema, any business service, or `companion-actions.ts`.

### 5.3 Constraint compliance

| Constraint | How met |
|---|---|
| No new capabilities | Only the four COMP_ACT1 capabilities are addressable; `canExecute` gates every proposal against the live registry |
| No new business logic | Two owner allow-lists are mirrored for **gating** only (as `companion-actions.ts` already does); the handlers re-validate and remain the authority |
| No new APIs | Zero routes added. Confirmation uses the existing endpoint |
| No new architecture | Reuses `CompanionActionProposalDraft`, the existing action store, the existing persistence step, the existing confirm flow |
| Reuse Intent Engine / Registry | All reads and all execution go through `intelligencePlatform.handle` |
| Reuse the existing confirmation flow | Tiers come from `permissions.ts` unchanged (`add`→light, `move`/`replace`→required, `delete`→strong) |
| Don't duplicate planner/shopping logic | No day is computed, no list is filtered, no meal is ranked — every fact comes from an existing capability read |
| Ask, don't guess | Eight distinct clarification paths (§4); absence is never defaulted |

### 5.4 The bug end-to-end verification caught

INT20 was first written **inside** the `if (detectWriteIntent(...))` branch — the obvious place, since
that is where the refusal lived. Unit tests passed. Driving the real turn pipeline showed that **five
of the six canonical commands never reached the resolver at all**: that guard is a coarse refusal
trigger, not an enumeration of household commands, and it does not match "remove milk from my shopping
**list**" (its remove pattern wants meal/entry/item), "log porridge for breakfast" (it has no log
pattern) or "add tuna spaghetti to Tuesday lunch" (its add pattern wants a surface word).

Resolution was hoisted to run **before** the guard, which is also the more honest ordering: understand
first, refuse only what cannot be understood. A regression assertion now fails if anyone nests it back.

Recording this because it is the substantive finding of the workstream: the unit tests were green and
the feature was, in practice, five-sixths dead.

---

## 6. TESTS AND VERIFICATION

**New:** `test-int20-natural-language-actions.ts` — **61 passed, 0 failed.** §1 the six commands and
the advisory guard · §2 reference resolution · §3 exact parameter contracts · §4 clarification · §5 the
calendar boundary · §6 executability gating and confirmation tiers · §7 non-regression + the ordering
guard. The platform is real (registry + bindings); only the read transport is stubbed, so every
parameter name and tier asserted is the production one.

**Regression sweep — all green, no new failures:**

| Suite | Result | | Suite | Result |
|---|---|---|---|---|
| conversation-gateway | 64/0 | | companion-actions | 93/0 |
| behaviour-decision | 119/0 | | COMP_ACT1 | 22/0 |
| intent-resolver | 137/0 | | personality-platform | 323/0 |
| comp2-natural-conversation | 210/0 | | registry-executability | 129/0 |
| context-composition | 166/0 | | fallback | 82/0 |
| planner/shopping/pantry/diary/meals bindings | 31/38/47/56/72, all 0 failed | | platform · timeline · discovery | 33/0 · 70/0 · 81/0 |

**Two pre-existing assertions updated (both stale, both reported rather than quietly changed):**

1. `test-intelligence-conversation-gateway.ts` asserted that "add salmon to my shopping list" produces
   the read-only refusal. That expectation became stale at COMP_ACT1 — `shopping.add` has been
   executable and proposable since then. It now asserts the property that actually matters and that
   INT20 must never break: **proposed for confirmation, or honestly refused — never silently
   executed.** The refusal itself is still covered by the block below it.
2. `test-intelligence-behaviour-decision.ts` counted the gateway's exit paths and expected five. INT20
   adds a sixth. The invariant it protects — *every* exit path seals a behaviour decision — is
   unchanged and still asserted; only the count moved.

**Live verification against real household data** (`scripts/int20-verify-resolution.ts` plus
throwaway probes, read-only throughout):

```
SAID    : "add shepherd's pie to Week 1 Tuesday lunch"
REPLY   : Add Shepherd's Pie to Tuesday lunch? Confirm below and I'll do it.
OUTCOME : confirmation_required
  → planner.add  tier=light  status=proposed  params={"dayId":3,"mealId":115,"mealSlot":"lunch"}

SAID    : "move Monday dinner to Tuesday"
REPLY   : Move Ham & Cheese Sandwich to Tuesday dinner? Confirm below and I'll do it.
  → planner.move  tier=required  params={"entryId":50,"dayId":3,"mealSlot":"dinner"}

SAID    : "replace Monday dinner with shepherd's pie"
  → planner.replace  tier=required  params={"entryId":50,"mealId":115}

SAID    : "log porridge for breakfast"
  → diary.add  tier=light  params={"name":"porridge","mealSlot":"breakfast","date":"2026-07-18"}

SAID    : "generate a meal plan for next week"
REPLY   : I can read and explain your data, but I can't create a new plan… (unchanged refusal)
```

Every id was cross-checked against the database directly: Week 1 / day-of-week 2 **is** `dayId 3`;
Monday's dinner entry **is** `entryId 50`; "shepherd's pie" **is** `mealId 115`. The apostrophe
normalises correctly. **Nothing was executed** — every proposal was left in the `proposed` state.

**Typecheck:** `tsc --noEmit` reports **zero** errors in all three touched files. The repository's
typecheck gate reports 21 regressions; **all 21 pre-date this workstream** (verified by removing the
INT20 files and re-running the gate — the same 21 appear). INT20 adds none.

---

## 7. HONEST BOUNDARIES AND FOLLOW-ONS

1. **The two new exit paths are not personality-voiced.** They emit caller-verified, closed-set
   strings — the resolver's own clarification question, or the proposal label COMP_ACT2 already shows
   on the button — never model output and never a fabricated household fact. Both declare themselves
   via `outcome: "not-voiced"` with a `notVoicedReason`, which is *precisely* the route BEH1 preserved
   for this case; `test-intelligence-behaviour-decision.ts` even says so: *"`not-voiced` is retained
   even though CP2 leaves no gateway path that emits it — it is how a future unvoiced surface is
   forced to declare itself."* INT20 is that surface. **Follow-on:** add `proposalTemplate` and
   `clarificationTemplate` to the six personalities so these speak in the household's chosen register.
2. **Confirmation UX is unchanged and out-of-band.** INT20 produces proposals; the household confirms
   through the existing endpoint. This workstream deliberately did **not** confirm a proposal against
   real data — that would write to a live household's planner without authorisation. The execution
   path itself is COMP_ACT1's, already verified there (22/0 plus its own live run).
3. **Multi-item commands are not supported.** "Add milk and bread to my list" resolves the whole
   phrase as one item. Splitting conjunctions reliably (and knowing when "salt and pepper" is one
   thing) is its own piece of work, not a regex tweak.
4. **A stale comment was found, not fixed.** `server/intelligence/food-intelligence/opportunity-engine.ts:115`
   declares *"`dayOfWeek: 0 = Monday` — the existing planner convention"* and cites two source lines
   that say nothing of the kind. The declared key space is `0 = Sunday`
   (`shared/time/household-time.ts:77`), which is what `weekly-planner-page.tsx` and INT20 both use.
   The comment appears to be wrong and its `PLANNER_DAY_NAMES` array with it — a display-only defect in
   that file, out of scope here, **reported rather than silently changed.**
5. **Filing.** The document was created at the requested path. `repo-structure-verify.sh` currently
   fails its "no loose files in `docs/implementation/`" check — it already failed before this
   workstream, on six pre-existing files including both predecessors (`COMP_ACT1`, `COMP_ACT2`). INT20
   is filed alongside them for consistency. **Follow-on:** move all of them into
   `docs/implementation/companion/` together, which is a filing decision for the owner, not a
   side-effect of this change.

---

## 8. DEFINITION OF DONE

> *A household can naturally ask the Companion to perform existing planner, shopping, pantry and diary
> actions using everyday language, with the Intent Engine resolving the request into existing THA
> capabilities without introducing new business logic.*

**Met.** All eight bound write verbs are reachable in ordinary speech; every parameter is resolved
from an existing capability read; missing facts earn one concise question rather than a guess; the
platform's own calendar honesty is preserved rather than papered over; and no capability, business
rule, API, route, schema or architectural element was added. Execution remains exactly where COMP_ACT1
and COMP_ACT2 left it — behind the household's confirmation.
