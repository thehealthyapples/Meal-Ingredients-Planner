# FI1 — Food Intelligence Platform Architecture Promotion — Implementation

**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**EWO:** EWO-FI1 (🟢 GREEN — governance & documentation promotion only. No code, schema, runtime, or API changes.)
**Risk:** 🟢 GREEN
**Reason:** Promotes the approved NUT2 future-state vision into `docs/architecture/` as the canonical Domain Intelligence architecture for Food Intelligence. No behaviour, schema, or business logic is touched.
**Companion documents:** `docs/investigations/knowledge/NUT2_FUTURE_STATE_NUTRITION_VISION.md` (the evidence base, now a pointer stub); the new governing document `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` — the canonical architecture this task introduces.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-fi1-food-intelligence-platform-promotion-20260703` → `8ae0f7e` |
| Working tree at start | Dirty with substantial prior uncommitted INT35–NUT1/FS-series/NUT2 work on this branch — pre-existing, unrelated to this task |
| This task's writes | New: `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, this file. Modified: `docs/architecture/README.md`, `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md`, `docs/investigations/knowledge/NUT2_FUTURE_STATE_NUTRITION_VISION.md` (converted to pointer stub) |
| Rollback to committed state | `git checkout rollback/before-fi1-food-intelligence-platform-promotion-20260703 -- <the files above>` then delete the new architecture doc and this file |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (the eight principles)
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Domain 1 — Food Knowledge (Nutrition), and the contested-domain backlog)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (workflow steps, governing-document template)
- [x] `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md` (§10 Post Launch, §11 Long Term Vision)
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (the platform layer this promotion sits under)
- [x] `docs/investigations/knowledge/NUT2_FUTURE_STATE_NUTRITION_VISION.md` (the approved investigation being promoted — full read)
- [x] `docs/investigations/intelligence/THA_PERSONALISED_NUTRITION_INTELLIGENCE_ARCHITECTURE.md` (source of the T0–T2, G1, P1–P3, E1–E2, GO1–GO2, LT1–LT3 rules NUT2 cites and this promotion carries forward)
- [x] `docs/implementation/governance/GOV_AI1_ARCHITECTURE_DOCUMENT_RESTRUCTURE.md` (the precedent promotion pattern — TIP1→`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_LAUNCH_ROADMAP.md`→`THA_MASTER_EVOLUTION_ROADMAP.md`), reused verbatim for this promotion's mechanics (pointer stubs, header conventions, README indexing)

---

## OBJECTIVE

EWO-NUT2 produced an approved, RED-reviewed 2029 vision for Nutrition as an investigation. EWO-FI1's job is narrower than a new design: **promote that already-approved vision into governing architecture**, using the same promotion mechanics `docs/architecture/` already established for the Intelligence Platform (GOV-AI1) and the Master Evolution Roadmap. Nothing in NUT2's approved content is re-litigated; this task's job is placement, renaming, and making one previously-implicit structural distinction explicit.

The scope named one structural requirement beyond a straight copy: **preserve and make explicit the separation between Business Domains, Domain Intelligence, and the Intelligence Platform**, and confirm Food Intelligence enriches business domains but never owns their data. That distinction did not have a named home before this task — `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` documents the platform layer, and the SoT Register documents the Business Domain layer, but nothing named the middle layer. This promotion creates that name (**Domain Intelligence**) and Food Intelligence is its first instance.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity created. Every component the new document names keys on
  identities that already exist (canonical food slug, meal id, eater id,
  household id, user id) — inherited unchanged from NUT2 and the SoT Register.

☑ One owner per fact
  Strengthened, not just preserved: the new document adds Rule FI1
  ("Enrichment, not ownership") as a permanent, testable rule stating Food
  Intelligence owns zero Business Domain facts. The four-plane model (Plane
  1-4) keeps one owner per plane exactly as NUT2 specified.

☑ No duplicate entities
  No new entity. The promotion renames a domain label (Nutrition -> Food
  Intelligence at the architecture layer) and adds one taxonomy layer
  (Domain Intelligence) to docs/architecture/README.md; it creates no
  duplicate of any existing document, table, or store.

☑ No duplicate ownership
  The promoted document explicitly states it does NOT rename the underlying
  Food Knowledge stores (shared/knowledge/, nutrition-knowledge-registry.ts,
  knowledge_* tables, uplift-rules.ts) -- those keep their existing names and
  owners per the SoT Register. Only the architecture-layer domain label
  changes.

☑ No duplicate state
  No state involved -- this is a documentation promotion. The NUT2
  investigation becomes a pointer stub (content lives in exactly one place
  going forward), matching the GOV-AI1 precedent exactly.

☑ Extends existing architecture
  Extends the docs/architecture/README.md taxonomy (adds a "Domain
  Intelligence" section alongside the existing "Platform Governance" and
  "Intelligence Governance" sections); extends the Master Evolution Roadmap's
  existing Long Term Vision table (rewires two "Source design" citations,
  adds one clarifying note, does not restructure the table).

☑ Progressive enrichment where appropriate
  N/A -- no knowledge entity or transactional store is created or modified
  by this task.

☑ Honest gaps over fabricated information
  The promoted document is explicit (Section 13, Architecture Convergence
  Status) that ZERO Domain Intelligence build-out exists yet -- no Food
  Intelligence Engine, event log, Goals capability, Signals Gateway, or
  Community capability. It does not imply anything is built that isn't.

☑ No permanent synchronisation bridge
  N/A -- no bridge introduced. The pointer stub is a one-way redirect, not a
  synchronised copy (the GOV-AI1-established pattern).

☑ Evolution over replacement
  The new governing document explicitly supersedes NUT2 and absorbs the
  T0-T2/G1/P1-P3/E1-E2/GO1-GO2/LT1-LT3 rules from
  THA_PERSONALISED_NUTRITION_INTELLIGENCE_ARCHITECTURE.md as permanent
  governing rules (Section 5 of the new document), rather than leaving them
  stranded in an investigation that future work would otherwise have to
  rediscover. Both source investigations are named and left untouched as
  historical evidence; neither is deleted.
```

**AI ARCHITECTURE COMPLIANCE:** Not an AI implementation — no assistant, capability binding, intent, or conversation state is created or altered. The promoted document governs *future* AI/capability work (the not-yet-built Food Intelligence Engine, Goals capability, Signals Gateway) but implements none of it. It confirms (§7 of the new document) that any future capability work must register through the existing Intelligence Platform Capability Registry and Intent Engine — no exception created.

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Documentation / Governance only. Names a new architecture
  taxonomy layer ("Domain Intelligence") but touches no code-owned domain.
Declared SoT: unchanged for every existing domain (per SoT Register). The
  Food Knowledge (Nutrition) domain's declared source of truth
  (shared/knowledge/ -> knowledge_* via nutrition-knowledge-registry.ts) is
  explicitly restated as unchanged in the new document (§1, §13).
New store created? NO. Five future stores are NAMED (unchanged from NUT2:
  personalisation_events, goals, signal summaries+consents, community shares,
  plus none newly introduced by this promotion) -- each must still be
  declared in the SoT Register by the workstream that creates it, per Rule 8.
Existing store extended? NO
Consumer created? NO
```

---

## WHAT THIS TASK DID

### 1. Created the canonical governing document

`docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` — promotes NUT2's approved content, restructured as governing architecture:

| NUT2 section (investigation) | New document section (governance) | Treatment |
|---|---|---|
| §1 Executive Summary, §2 2029 Vision, §3 Future UX | Absorbed into §1 (why the rename) — the narrative "2029 vision" framing is replaced with architecture statements; the UX narrative itself is not re-asserted as governing (a governing document states structure and rules, not a persona-driven day-in-the-life) | Reframed |
| §4 Translation pipeline | Implicit in §3 (enrichment map) and §4 (plane composition law) | Folded in |
| §5 Four-Plane Knowledge Model | §4 Four-Plane Knowledge Model | Promoted near-verbatim |
| §6 Domain Interaction Design | §3 "Food Intelligence enriches — it never owns" (elevated to a named rule, FI1, with the interaction table promoted as the enrichment map) | Promoted + hardened into a rule |
| §7 Future Signal Integrations | §6 Future Signal Integrations | Promoted near-verbatim |
| §8 Capability Architecture | §7 Capability Architecture | Promoted near-verbatim, relabelled "Nutrition Reasoning Engine" → "Food Intelligence Engine" |
| §9 Phased Roadmap | §8 Phased Roadmap | Promoted, condensed to a table |
| §10 Risks | §9 Risks | Promoted, added R4 (Rule FI1 violation risk — new, since Rule FI1 is new at this promotion) |
| §11–§18 (compliance, DoD, data impact, trust check, convergence, rollback, scope lock) | §10–§14 (same sections, same discipline, values updated for this task) | Re-derived for this task, not copied |
| — (not in NUT2) | §2 The Three-Layer Separation | **New at this promotion** — makes explicit the Business Domains / Domain Intelligence / Intelligence Platform layering the EWO-FI1 brief required |
| — (not in NUT2) | §5 The Governing Trust Rules | **New at this promotion** — reproduces the T0–T2/G1/P1–P3/E1–E2/GO1–GO2/LT1–LT3 rules from `THA_PERSONALISED_NUTRITION_INTELLIGENCE_ARCHITECTURE.md` (an investigation) as permanent governing rules, so future work cites governance rather than an investigation |

**The rename decision (Nutrition → Food Intelligence):** applied at the *architecture domain label* only. Concretely renamed: the document title, the "Domain Intelligence" classification, the engine name ("Nutrition Reasoning Engine" → "Food Intelligence Engine"), and the roadmap's "Nutrition Companion" → "Food Intelligence Companion" (in the Master Evolution Roadmap, see below). Concretely **not** renamed (confirmed unchanged, stated explicitly in the new document's §1 and §13): `shared/knowledge/`, `nutrition-knowledge-registry.ts`, `knowledge_*` DB tables, `uplift-rules.ts`, `restriction-library.ts`, the SoT Register's "Food Knowledge (Nutrition)" domain name, and the `NUT1_NUTRITION_CAPABILITY_ENRICHMENT.md` implementation record. Renaming any of those would be a code/schema change and is explicitly out of this task's scope.

### 2. Indexed the new document in `docs/architecture/README.md`

Added a new **Domain Intelligence** section, positioned between **Intelligence Governance** (platform-generic, unchanged) and **Architecture → Capabilities** (per-capability cards, unchanged). This is a structural addition to the README's taxonomy, not just a row in an existing table — it gives the Business Domains / Domain Intelligence / Intelligence Platform separation a permanent, visible home in the governance index, and a place for any future domain-specific reasoning layer to be indexed without conflating it with platform-generic documents. Also added one sentence to the existing **History** section recording the promotion and the rename.

### 3. Updated the Master Evolution Roadmap's forward references

`docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md`:
- §10 Post Launch, row 4: "Recommendation Engine — Stages 1–2" → "Food Intelligence Engine — Stages 1–2"; "Source design" citation repointed from `Personalised Intelligence §11` to `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §8 (Phase 1)`.
- §11 Long Term Vision: "Predictive guidance" and "Nutrition Companion" rows' "Source design" citations repointed to the new governing document; "Nutrition Companion" renamed "Food Intelligence Companion"; its hard-constraints cell gained a reference to Rule FI1.
- Added one paragraph immediately after the Long Term Vision table recording the promotion explicitly, so a reader who only sees the Roadmap (not the architecture README) still finds the new canonical document.
- No other section of the Roadmap was touched — §1–§9, §12–§13 are launch-sequencing content unrelated to Food Intelligence and were left exactly as they were.

### 4. Converted the NUT2 investigation to a pointer stub

`docs/investigations/knowledge/NUT2_FUTURE_STATE_NUTRITION_VISION.md` replaced with a five-line pointer stub, in the exact format GOV-AI1 established for `TIP1_…md` and `THA_LAUNCH_ROADMAP.md`: states the promotion, names the new canonical path, states the file is "no longer the source of truth," and directs future work to the governing document. This satisfies the scope requirement "ensure future Food Intelligence work references the new governing architecture rather than the investigation" — a reader who finds the old NUT2 path is redirected immediately rather than continuing to treat superseded content as current.

**`docs/investigations/intelligence/THA_PERSONALISED_NUTRITION_INTELLIGENCE_ARCHITECTURE.md` was deliberately left untouched.** It is not named in the EWO-FI1 deliverables, and unlike NUT2 it was never itself a promoted-architecture candidate — it is the evidentiary source NUT2 cited for the T0–T2/G1/etc. rules. Those rules now also live, restated as governing rules, in the new document's §5, so future work no longer needs to visit the investigation to find them — but the investigation itself remains as historical record, per the same "investigations are point-in-time analysis and history" principle `docs/architecture/README.md` already states for every other promoted document.

---

## DEFINITION OF DONE

**Success looks like:**
- `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` exists, is indexed in `docs/architecture/README.md`, and passes the Architecture Compliance Checklist ✅
- The domain is named Food Intelligence at the architecture layer; underlying code/schema/store names are unchanged ✅ (verified: no `git diff` outside `docs/`)
- Business Domains / Domain Intelligence / Intelligence Platform separation is explicit, diagrammed, and testable via Rule FI1 ✅
- Food Intelligence's enrich-never-own boundary is confirmed as a named rule with a per-domain enrichment map ✅
- The Master Evolution Roadmap's forward-looking Nutrition references now cite the governing document ✅
- The NUT2 investigation redirects future readers to the governing document ✅

**What must not break:** nothing can — this task touched only files under `docs/`. Verified: `git status` shows no changes outside `docs/architecture/` and `docs/investigations/` for this task's diff; no `.ts`, `.tsx`, schema, or route file was opened for writing.

**Manual test steps:**
1. `git status` shows the five files listed under ROLLBACK PROTECTION (plus this file) as this task's diff.
2. Open `docs/architecture/README.md` — a "Domain Intelligence" section appears between "Intelligence Governance" and "Architecture → Capabilities", linking to the new document.
3. Open `docs/investigations/knowledge/NUT2_FUTURE_STATE_NUTRITION_VISION.md` — it is a five-line pointer stub redirecting to `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`.
4. Open `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md` §10 row 4 and §11 — both cite the new governing document, not the old investigation names.
5. `git tag -l 'rollback/before-fi1*'` shows the rollback tag.

---

## DATA IMPACT

- Reads existing data: **NO** (documentation reads only)
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## TRUST CHECK

- **Could this mislead the user?** No user-facing output exists. The promotion is explicit everywhere that no Domain Intelligence build-out has happened yet (Convergence Status, §13 of the new document) — it does not imply Food Intelligence capability work is further along than it is.
- **Could this fabricate certainty?** No. The rename is scoped precisely (architecture-layer label only) and the document says so explicitly, twice (its own §1 and its Scope Lock), to prevent a future reader assuming code/schema also renamed.
- **Is anything guessed but shown as real?** No. Every claim about "what already exists" in the new document was carried forward from NUT2, which was itself verified against the live codebase during EWO-NUT2. This task added no new current-state claims beyond the taxonomy/naming decisions it made itself.
- **What happens if the system is wrong?** If the Domain Intelligence naming or the three-layer split proves wrong once real build work starts, it is corrected by a successor governing document — exactly the same recoverability NUT2 itself relied on.
- No architectural duplication introduced: **YES**
- No new source of truth created: **YES**
- No runtime behaviour altered: **YES**

---

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-fi1-food-intelligence-platform-promotion-20260703` → `8ae0f7e`
- Files added: `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/implementation/governance/FI1_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE_PROMOTION.md`
- Files modified: `docs/architecture/README.md`, `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md`, `docs/investigations/knowledge/NUT2_FUTURE_STATE_NUTRITION_VISION.md`
- Code rollback: `git checkout rollback/before-fi1-food-intelligence-platform-promotion-20260703 -- docs/architecture/README.md docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md docs/investigations/knowledge/NUT2_FUTURE_STATE_NUTRITION_VISION.md` then delete the two new files.
- Verification after rollback: `git status` shows only the pre-FI1 dirty set; `docs/investigations/knowledge/NUT2_FUTURE_STATE_NUTRITION_VISION.md` is restored to its full investigation content; `docs/architecture/README.md` no longer lists a Domain Intelligence section.

---

## SCOPE LOCK

**Implemented scope:**
- Reviewed the completed NUT2 investigation
- Promoted the approved vision into the governing architecture (`docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`)
- Renamed the architectural domain from Nutrition to Food Intelligence where appropriate (architecture layer only — underlying stores untouched)
- Preserved and made explicit the separation between Business Domains, Domain Intelligence, and the Intelligence Platform (new §2 of the governing document; new "Domain Intelligence" README section)
- Confirmed Food Intelligence enriches existing business domains but never owns their data (Rule FI1, §3 of the governing document, with a per-domain enrichment map)
- Created `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`
- Created `docs/implementation/governance/FI1_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE_PROMOTION.md` (this file)
- Updated architecture references and the Master Evolution Roadmap where appropriate
- Ensured future Food Intelligence work references the new governing architecture rather than the investigation (NUT2 pointer stub)
- No runtime behaviour changed; no schema changed; no business logic changed

**Explicitly excluded (out of scope — not implemented):**
- Any implementation of the Food Intelligence Engine, Personalisation Event Log, Goals capability, Signals Gateway, or Community capability (all remain future EWOs, named only)
- Any rename of code, schema, table, or file paths (`nutrition-knowledge-registry.ts`, `knowledge_*` tables, `uplift-rules.ts`, etc. all keep their existing names)
- Any change to `docs/investigations/intelligence/THA_PERSONALISED_NUTRITION_INTELLIGENCE_ARCHITECTURE.md` (left as historical evidence; its rules are now also restated as governing rules in the new document, but the investigation itself is untouched)
- Resolution of the SoT Register's contested Food Knowledge domains (M1/M2/M4) — unaffected by this promotion, tracked exactly as before in `ARCHITECTURE_PRINCIPLES.md`
- Any decision on the §6.4 regulatory posture (flagged for legal, as NUT2 already flagged it)

---

*Governance promotion only. No code was changed in the production of this document.*
*Rollback: `rollback/before-fi1-food-intelligence-platform-promotion-20260703` → `8ae0f7e`.*
