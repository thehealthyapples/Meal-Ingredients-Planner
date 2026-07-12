# PHASE5C — Ambient Intelligence

**Status:** Implementation report
**Date:** 2026-07-12
**Branch:** `int1-intelligence-platform`
**Rollback identifier:** `phase5c-ambient-intelligence-before` → `88e911753a958b77d6b3e342d99533a7aeb1c9ef`
**Governing architecture:** [`THA_DECISION_ENGINE_ARCHITECTURE.md`](../../architecture/THA_DECISION_ENGINE_ARCHITECTURE.md), [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md), [`INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`](../../architecture/INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md), [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md), [`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md)
**Predecessors:** PHASE5A (Knowledge Platform Activation), PHASE5B (Decision→Evidence loop; dormant capability retirement)

---

## 1. Summary — what this workstream actually found

PHASE5C was scoped as "surface intelligence naturally throughout the product." The
investigation that opened it found that **almost none of the work was construction.**

The Intelligence Platform is built. The Decision Engine (DEC1) is built. The
Decision→Evidence loop was closed in PHASE5B, and its four HTTP routes are live.
And the **presentation layer was already built too** — FI5 shipped
`FoodOpportunitiesPanel`, `FoodOpportunityCard` and `use-food-opportunities`;
IA2/PHASE5B shipped `LearningSignalsPanel`, `LearningSignalCard` and
`use-learning-signals`.

**Both presentation owners were imported by nothing.** `FoodOpportunitiesPanel`'s own
header comment declares it "The ONE presentation owner ... across every consuming
surface — Dashboard, Planner, Cookbook, Pantry." It was mounted on zero of them.
`LearningSignalsPanel`'s comment declares its placement as "the Household section of
Profile." `profile-page.tsx` had never heard of it.

So the household-visible consequence of the entire Intelligence Platform was, in
production: **one collapsed "gentle reminder" section on Home**, fed by the Notice
Engine, capped at two notices per moment, carrying no resolution action.

This is the gap PHASE5C closes. It is an **activation**, not a construction:

- **No new intelligence engine.** No new producer, no new capability, no new verb,
  no new opportunity generator, no new reasoning of any kind.
- **No new server engine code.** The one server change is a **documentation-string
  correction** in the Capability Registry (§7) — a stale `apiSurface` field, not behaviour.
- **One real code fix** (§4): the opportunity card silently dropped the `priority`
  field the Decision Engine computes, so the platform's only `critical` signal —
  an allergen/restriction conflict on the shopping list — rendered identically to a
  `low` "you haven't cooked your lentils yet" nudge.
- **Everything else is mounting**, plus the deletion of the duplicate surface the
  mounting made redundant.

### The honest headline

> The Decision Engine's only **safety-relevant** output — `shopping-restriction-conflict`,
> the sole member of the closed `critical` allowlist (ATTN1 invariant A2) — could reach a
> household **only** as one of at most two Notice Engine reminders on Home, where it competed
> for those two slots with a streak milestone and a seasonal highlight, carried **no
> resolution action**, and **never appeared on the shopping list where the conflicting item
> actually was.** Because it carried no resolution action, it emitted no Evidence — so the
> Decision→Evidence loop PHASE5B built was, in practice, still unfed.

---

## 2. Architecture Bootstrap — what was read before implementing

`docs/architecture/README.md` (mandatory entry point), then:

| Document | What it constrained here |
|---|---|
| `THA_DECISION_ENGINE_ARCHITECTURE.md` | §3 hard boundaries (the client may not rank, suppress or budget); §5 the sealed `DeliveryDecision` is **operator telemetry, never on the wire, never shown to a user**; §6 the ambient delivery budget; §7 producer enrolment is the *only* door for a new ambient surface |
| `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` | Knowledge is indexed, never re-owned; every read goes through the registered capability |
| `INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md` | Canonical THA pages own presentation and interaction; no fabricated presentation fields |
| `THA_EXPERIENCE_ARCHITECTURE.md` (EXP1 + EXP2 §17) | Home unharmed; calm before capability; one primary action; progressive disclosure; companion conduct; the Premium Standard |
| `THA_UI_ARCHITECTURE.md` (UIA2) | Calm Orchard; one owner per visual concern; **retire on introduction**; semantic-before-literal; colour law (status colour never the sole carrier of meaning) |
| `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` §9 + `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` | Rule KC15 — the Product Knowledge Registry is maintained **in the same change** |
| `ENGINEERING_WORKFLOW.md` | All four compliance blocks (§9–§12 below) |

**No conflict with governing architecture was found, and none of it was changed.**

---

## 3. The decision that shaped the scope: one canonical page per domain

The Decision Engine has exactly **one** registered opportunity producer
(`OPPORTUNITY_SOURCES = { "food-intelligence": … }`), emitting exactly **three**
opportunity types across exactly **three** owning domains:

| Type | Owning domain | Attention |
|---|---|---|
| `planner-empty-day` | `planner` | `high` if ≥50% of the week is empty, else `medium` |
| `pantry-item-unused-in-plan` | `pantry` | `low` |
| `shopping-restriction-conflict` | `shopping` | **`critical`** (the sole allowlisted `critical` emitter) |

That is the complete inventory of ambient opportunity intelligence THA can honestly
deliver today. Every surfacing decision below follows from it.

**Each domain surfaces on exactly one canonical page, plus Home as the one sanctioned
aggregate.** This is Experience Principle 6 (one canonical place for everything) applied
directly:

| Domain | Canonical page | Rationale |
|---|---|---|
| `planner` | Planner | the day the opportunity names is *on this page* |
| `pantry` | Pantry | the item the opportunity names is *on this page* |
| `shopping` | Shopping workspace | the conflicting product is *on this page* — and this is the safety-critical one |
| *(all)* | Home | Home is the emotional centre and the one place that answers "how are we doing today?" (EXP1 §4) |

**FI5's own header comment names Cookbook as a consuming surface. We deliberately did not
mount it there,** and this is a considered deviation, recorded rather than silently taken:
no opportunity type is owned by the meals domain, so a Cookbook panel could only show
*another page's* opportunities. Showing the Pantry's "you haven't cooked your lentils"
card on the Cookbook, where it also appears on the Pantry, is precisely the repetition
Companion Conduct forbids and the second owner of a presentation concern that UI Principle
5 forbids. Cookbook already carries real, live, native intelligence — the per-meal
`CookbookMealIntelligenceStrip` — and it keeps it, unchanged.

---

## 4. The one real defect fixed: attention was computed and then thrown away

`FoodOpportunityCard` received `opportunity.priority` — the `AttentionLevel` the entire
ATTN1/DEC1 pipeline exists to compute and rank by — and **never read it.** Every
opportunity rendered as the same calm `Sparkles` card.

The platform's `critical` allowlist has exactly one member, and it is a **food-safety
signal**: a product on the household's shopping list that conflicts with a stored hard
restriction (an allergen, for a named member of that household). It rendered identically
to a low-priority pantry nudge, with the same two buttons — "Helpful" and "Not now".

This is the change that is *not* a mounting change. `FoodOpportunityCard` now presents
attention faithfully:

- **`critical`** — destructive-toned surface, `ShieldAlert` icon, an explicit
  **"Check before you buy"** eyebrow, and the accept action relabelled from the
  breezy "Helpful" to **"Reviewed"**. It is never rendered inside a collapsed
  strip: a critical opportunity forces its own panel open (§5).
- **`high`** — a quiet emphasis, no alarm colour.
- **`medium` / `low`** — unchanged from today's calm default.

Compliance notes on this fix:

- **Colour is never the sole carrier of meaning** (UI colour law): the critical
  treatment is icon **+** text label **+** tone, all three.
- **The client does not re-derive attention.** It reads `priority` verbatim from the
  bundle and maps it to a presentation token. DEC1 §3.3 forbids re-deriving attention;
  this reads it.
- **Surfacing never changes acting** (DEC1 §3.4 / ATTN1 A7). The critical card's buttons
  post to exactly the same `review`/`approve`/`delete` verbs at exactly the same
  `strong` ConfirmationTier as every other card. Nothing was softened, and nothing new
  is executed on the household's behalf.
- The attention → presentation mapping lives in `intelligence-tokens.ts`, which is
  already the declared single source of truth for the look of intelligence. **No second
  owner of a visual concern was created.**

---

## 5. What was built (all of it presentation)

### 5.1 `AmbientIntelligence` — the one ambient surface

`client/src/components/intelligence/AmbientIntelligence.tsx` — a thin composition over
the existing `FoodOpportunitiesPanel`, giving every page the identical ambient contract:

- Collapsed by default (**calm before capability**) — a single quiet row.
- **Except when a `critical` opportunity is present**, in which case it opens itself.
  A household may not have to click to discover an allergen conflict. This is the one
  deliberate exception to "collapsed by default", and it is a *presentation* decision
  driven by an attention level the engine already assigned — not a new rule.
- Nothing to show → renders `null`. Never a placeholder, never a fabricated card.
- Expansion state persists per-surface to `sessionStorage`, mirroring
  `PlannerIntelligenceStrip`'s established idiom.

It owns no intelligence, fetches nothing of its own, and re-ranks nothing: it renders
the server's already-ordered bundle in the server's order.

### 5.2 Mounted, per page

| Page | File | Mounted |
|---|---|---|
| Home | `home-experience-page.tsx` | `AmbientIntelligence` (all domains) + `LearningSignalsPanel` |
| Dashboard | `dashboard.tsx` | `AmbientIntelligence` (all domains) |
| Planner | `weekly-planner-page.tsx` | `AmbientIntelligence domains={["planner"]}` |
| Shopping workspace | `shopping-workspace-page.tsx` | `AmbientIntelligence domains={["shopping"]}` ← **closes the safety gap** |
| Pantry | `pantry-page.tsx` | `AmbientIntelligence domains={["pantry"]}` |
| Profile | `profile-page.tsx` | `LearningSignalsPanel` (its own declared canonical home) |

### 5.3 "Why this?" — activated, not built

The disclosure was already built and already correct. `IntelligenceCard` has carried a
keyboard-accessible, `aria-expanded`/`aria-controls`-wired `details` toggle since WX2_5;
`FoodOpportunityCard` already passed `opportunity.evidence[]` into it under
`detailsLabel="Why"`. Mounting the panel is what turned it on.

Every "Why" a household can now open is a real `{source, detail}` **evidence citation**
from a named owner (`planner-week`, `pantry-items`, `shopping-list`, `household-eaters`)
— Rule E1, no citation, no card. Nothing is rephrased client-side, and nothing is invented.

**The sealed `DeliveryDecision` is NOT surfaced.** It is the far richer "why did *this*
surface and why did the rest not" record — suppression accounting, ordering basis,
learning influence, a deterministic operator reasoning trail. DEC1 §5 states it is
operator telemetry, "never serialised onto the wire result, never shown to a user, and
nothing reads it back." It remains stripped at the route, exactly as PHASE5B left it.
Surfacing it would have been the single most tempting thing in this workstream and it is
explicitly forbidden; the sanctioned read path is the admin Observation Workbench.

### 5.4 Household Learning feedback — closing the loop for real

`LearningSignalsPanel` is mounted on Profile (Household) and Home. It renders only
Patterns that have already cleared EL1's evidence bar (`MIN_EVIDENCE_COUNT = 3`,
`MIN_CONSISTENCY = 0.7`) and are `pending_confirmation`, each with its own `rationale`
verbatim from the engine. Confirm → Confirmed Understanding, which is the only thing
LEARN1 reads back to re-weight `prioritiseAndGroup`. Decline is equally terminal and
equally recorded.

With the opportunity cards now mounted and resolvable, accept/dismiss finally emits
Evidence in production, which is what makes a Pattern reachable at all. **The loop closes
end to end for the first time.**

---

## 6. Retired in this same change (UI Principle 5 — retire on introduction)

- **`PlannerIntelligenceCompanion.tsx` — deleted.** Superseded by
  `PlannerIntelligenceStrip` (whose own comment says it "replaces" it), which now sits
  beside `AmbientIntelligence`. It was a dormant second owner of the planner's
  intelligence presentation. No dormant predecessor is left behind.

---

## 7. Server change — one stale string, no behaviour

`server/intelligence/capability-registry.ts`: the `opportunity-delivery` and
`evidence-learning` capability descriptors both declared

> `apiSurface: "(platform-internal only — no dedicated HTTP route; consumed via the registered capability, not a private route)"`

PHASE5B added four HTTP routes to each. The descriptor has been stale since. The registry
is a *derived projection of the live route table* (its own header comment), so a stale
`apiSurface` is a defect in that projection. Both strings now name the routes that exist.

**This changes no behaviour.** `apiSurface` is descriptive metadata; nothing branches on it.

---

## 8. Honest gaps — what PHASE5C did NOT deliver, and why

These are stated as gaps rather than filled with decoration, per Core Principle 6.

| Requested | Status | Why |
|---|---|---|
| **Diary intelligence** | **GAP** | No registered opportunity producer owns the `diary` domain. Delivering "Diary intelligence" would have required writing a new opportunity generator — a **new intelligence engine**, explicitly out of scope. The diary keeps its existing local trend copy. |
| **Analyser intelligence** | **Already native; no ambient layer** | The Analyser already carries real native intelligence — Apple Score, "Why this score", UPF classification. It has no opportunity domain, so there is nothing ambient to add without inventing one. |
| **Cookbook intelligence** | **Already native; deliberately not given a panel** | Live per-meal `CookbookMealIntelligenceStrip`. A page-level panel could only repeat another page's opportunities — see §3. |
| Capability Enrichment (INT41) on pages | **Deliberately declined** | The registry holds static, evergreen per-capability tips ("Log as you go", "Build your own cookbook"). Pinning static tips permanently onto pages is **noise, not intelligence** — it fails "calm before capability" and is exactly what EXP2 §17 calls decoration: *"if the household would not feel the care, it is decoration."* Declined on purpose, recorded here so it is not silently rediscovered (Rule KC12). |
| `metadata.learning.influenced` | Not surfaced | The bundle computes which opportunity ids the household's confirmed Pattern actually moved; the route does not return it. Surfacing "we moved this up because you told us so" is a genuinely good idea and a **PHASE5D candidate** — it needs a route change, which was out of scope here. |

### The one thing PHASE5D must do first

Diary, Analyser and Cookbook do not need a UI. **They need a producer.** DEC1 §7 names
the door exactly, and it is one line:

> A producer enrols by adding one entry to `OPPORTUNITY_SOURCES`: a capability id, the
> verb to call, and an `adapt()`. It inherits eligibility, muting, lifecycle suppression,
> learning re-weight, rank, budget, surface routing, the sealed decision, and the
> Decision→Evidence feedback edge — with **zero** new suppress/rank/budget code.

Every one of those three pages then becomes ambient **for free**, through the component
this workstream just mounted. That is the correct shape of PHASE5D, and PHASE5C was
deliberately built so that it is.

---

## 9. ARCHITECTURE COMPLIANCE CHECKLIST

```
☑ One canonical identity
  Opportunities keyed `${capabilityId}:${producerOpportunityId}` (framework.ts) —
  unchanged. Learning signals keyed by their DB id. No new key space is introduced.

☑ One owner per fact
  Every value rendered is read verbatim from its single owner: explanation, evidence,
  suggestedAction, priority, domain from the opportunity-delivery bundle; rationale,
  confidence, evidenceCount from evidence-learning. The client stores none of them.

☑ No duplicate entities
  No new entity. AmbientIntelligence is a composition over the existing
  FoodOpportunitiesPanel; it introduces no type, store, route or capability.

☑ No duplicate ownership
  The attention → presentation mapping is added to intelligence-tokens.ts, the already-
  declared single owner of the look of intelligence. No second owner of any visual concern.

☑ No duplicate state
  Every surface shares the one TanStack query key ["/api/intelligence/food-opportunities"],
  so the bundle is fetched once and deduped. Only sessionStorage expansion state is local,
  and it is presentation state, not user state.

☑ Extends existing architecture
  Extends FI5's presentation system and DEC1's delivery bundle. Adds no pattern beside them.

☑ Progressive enrichment where appropriate
  Not a knowledge entity; no enrichment added. Cards render null when a field is absent.

☑ Knowledge domain compliance
  Introduces no knowledge domain. Touches PRODUCT KNOWLEDGE (what THA is) — the Product
  Registry Compliance block below is completed, and four registry entries are updated.

☑ Honest gaps over fabricated information
  §8 states four gaps rather than filling them. Every card renders null when it has
  nothing validated to say. `trust.resolved === false` renders as absence, never as an
  empty success.

☑ No permanent synchronisation bridge
  None. The client holds one read-through cache of a server projection.

☑ Evolution over replacement
  PlannerIntelligenceCompanion is named, superseded and DELETED in this same change (§6).
```

## 10. AI ARCHITECTURE COMPLIANCE

```
✓ Uses the canonical Intelligence Platform — every read/write goes through
    intelligencePlatform.handle() via the PHASE5B routes. No client path touches the
    Decision Engine's framework or store.
✓ Uses the Capability Registry — opportunity-delivery and evidence-learning, both
    already registered and bound.
✓ Uses the Intent Engine — report / review / approve / delete and search / approve /
    delete, the existing closed verb taxonomy. No verb was invented.
✓ Reuses existing business services — no business service was touched at all.
✓ Does not create another assistant — no conversational surface, no proactive coaching,
    no second Companion. Explicitly out of scope and not built.
✓ Does not duplicate conversation state — no conversation state is read or written.
✓ Uses registered capabilities only — no direct storage read anywhere in this change.
✓ Uses permission-aware access — every route is req.isAuthenticated()-gated and
    ownership-scoped server-side; the client sends no household or user id.
✓ Produces honest gaps rather than fabricated knowledge — §8, and the null-render
    contract on every card.

DECISION ENGINE BOUNDARIES (DEC1 §3) — none absorbed:
✓ Selection    — the client picks nothing; it renders the bundle in the server's order.
✓ Evidence     — the gate runs upstream; the client displays citations, never mints one.
✓ Attention    — read verbatim from `priority`; never re-derived client-side.
✓ Acting       — same verbs, same `strong` ConfirmationTier. Surfacing did not soften acting.
✓ DeliveryDecision — remains operator telemetry. NOT serialised, NOT shown (DEC1 §5).
```

## 11. EXPERIENCE & UI GOVERNANCE COMPLIANCE

```
✓ UX Governance Checklist (EXP §18, incl. Premium Standard §17) — completed:
  · Home unharmed — the additions answer "how are we doing today?" and nothing else.
  · Progressive disclosure — collapsed by default; "Why" reveals evidence on intent.
  · Calm before capability — quiet by default, no banner, no badge, no interruption.
    The single exception is a `critical` allergen conflict, which opens itself — a
    deliberate, documented exception (§5.1), not an accident.
  · One primary action — each card has one primary ("Helpful" / "Reviewed"); dismiss
    is styled secondary; the panel adds no competing primary to any page.
  · Canonical ownership respected — every value from its single owner; no entity is
    re-presented or edited inside an intelligence card.
  · Navigation integrity — no route, no nav change.
  · Companion conduct — invited, dismissible, honest about limits; dismissal is
    terminal and the opportunity does not return.
  · Honest content — nothing fabricated; every score/claim explains itself via evidence.
  · Language — plain, warm, non-judgmental; all copy is the engine's own, verbatim.

✓ UI Governance Checklist (UI §18) — completed:
  · One visual language — Calm Orchard, via the existing intelligence-tokens.
  · Canonical ownership — IntelligenceCard is the one card owner; nothing hand-rolled.
  · Retire on introduction — PlannerIntelligenceCompanion migrated and DELETED (§6).
  · Semantic before literal — all tokens semantic; zero raw values in surfaces.
  · Colour law — the critical treatment pairs colour with an icon AND a text label;
    colour is never the sole carrier of meaning.

✓ Conflict resolution — none arose.
✓ Nothing owns a fact at the presentation layer — confirmed above.
✓ Predecessor retired in this same change — PlannerIntelligenceCompanion.
```

## 12. PRODUCT REGISTRY COMPLIANCE

```
✓ Registry impact assessed — "what is THA?" now answers differently: intelligence is
    visible on Home, Planner, Pantry, Shopping and Profile where before it was not.
✓ Entries updated in this same change (Rule KC15):
    · cap-planner, cap-pantry, cap-shopping — each now surfaces ambient opportunities
      on its own page
    · cap-diary, cap-analyser, cap-meals — corrected to state honestly that they carry
      no ambient opportunity layer, and why
    · cap-opportunity-delivery, cap-evidence-learning — CREATED (both capabilities were
      household-visible for the first time and had no registry entry at all)
✓ Every entry names a human owner — Colin Clapson.
✓ Every entry declares a visibility — `household`, chosen deliberately: these surfaces
    are visible to any signed-in household member, and to no one else.
✓ Visibility keys on ROLE, never on subscription tier — no tier gate exists here.
✓ The registry labels; server/lib/access.ts authorises — no registry value is read at
    runtime by this change.
✓ Permission filtering happens BEFORE composition — no prompt composition in this change.
```

---

## 13. Files changed

**Client — new (1)**
- `client/src/components/intelligence/AmbientIntelligence.tsx`

**Client — modified (8)**
- `client/src/components/intelligence/intelligence-tokens.ts` — attention → presentation tokens
- `client/src/components/intelligence/FoodOpportunityCard.tsx` — attention-aware presentation (§4)
- `client/src/components/intelligence/index.ts` — export the ambient surface
- `client/src/pages/home-experience-page.tsx` — mount ambient + learning
- `client/src/pages/dashboard.tsx` — mount ambient
- `client/src/pages/weekly-planner-page.tsx` — mount ambient (planner)
- `client/src/pages/shopping-workspace-page.tsx` — mount ambient (shopping)
- `client/src/pages/pantry-page.tsx` — mount ambient (pantry)
- `client/src/pages/profile-page.tsx` — mount learning signals

**Client — deleted (1)**
- `client/src/components/PlannerIntelligenceCompanion.tsx` — retired (§6)

**Server — modified (1)**
- `server/intelligence/capability-registry.ts` — two stale `apiSurface` strings (§7)

**Docs (this file + registry entries)**
- `docs/implementation/intelligence/PHASE5C_AMBIENT_INTELLIGENCE.md`
- `docs/product/intelligence/intelligence-capabilities/` — entries updated/created (§12)

---

## 14. Validation performed

_(completed at implementation — see §16)_

---

## 15. Rollback plan

| | |
|---|---|
| Rollback identifier | `phase5c-ambient-intelligence-before` → `88e911753a958b77d6b3e342d99533a7aeb1c9ef` |
| Scope | Client presentation + one server documentation string. **No migration. No schema change. No data change. No engine change.** |
| Rollback command | `git reset --hard phase5c-ambient-intelligence-before` |
| Partial rollback | Every mount is a single JSX element; removing it returns that page to its pre-PHASE5C state with no other effect. |
| Blast radius if wrong | A household sees intelligence it did not see before. No data is written except the opportunity-resolution and pattern-decision records the household explicitly creates by clicking. |

---

## 16. Outcome

_(completed at implementation)_
