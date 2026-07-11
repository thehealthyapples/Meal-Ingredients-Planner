# EPIC 1.5 — Promote Capability Cards into Canonical Architecture — Implementation

**Status:** COMPLETE
**Date:** 2026-06-30
**Branch:** `int1-intelligence-platform`
**Workstream:** EPIC 1.5

> **Scope note.** This workstream is a documentation promotion only. It moves the six completed Capability Cards from the INT11 implementation report into permanent, canonical architecture documents. No Capability Card was redesigned, no ownership changed, no executable intents changed, no open governance decision was resolved, no code was written, no bindings were created, no runtime file was modified.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `epic1.5-pre-capability-architecture-promotion` → `a5294f80265a245d4120e6786a170775eeecbeb9` (current `HEAD` at the time this workstream began) |
| Filesystem backup | `docs/architecture/` was already untracked (created by prior GOV-AI1/GOV-AI2 work, not yet committed) — a full copy was taken to `/tmp/claude-1000/-home-runner-workspace/d172666f-f990-4b1c-9ed0-743bc72232a4/scratchpad/epic1.5-backup/architecture/` before any edit, since a git tag alone does not protect uncommitted/untracked content |
| Code modified | None |
| Bindings created | None |
| Runtime modified | None |
| Schema modified | None |
| Files created | `docs/architecture/capabilities/{profile,household,partners,meals,templates,analyser}.md`, this report |
| Files modified | `docs/architecture/README.md`, `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` |

To restore committed history: `git checkout epic1.5-pre-capability-architecture-promotion`. To restore the pre-edit state of the (untracked) `docs/architecture/` directory: copy back from the scratchpad backup path above.

---

## ARCHITECTURE BOOTSTRAP (gate)

- [x] Read `docs/architecture/README.md` — no conflicts found. The README already named `INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` as implementation guidance and explicitly stated the Developer Capability Registry "is planning documentation only" and "not a runtime source of truth" — consistent with this workstream's instruction to keep it as an index rather than a duplicate definition.
- [x] Read `docs/implementation/governance/INT11_CAPABILITY_CARDS_SPECIFICATION.md` in full — confirmed all six Capability Cards are `STATUS: COMPLETE`, each grounded in file:line evidence, each with its own "OPEN DECISION" lines that this workstream must carry forward unresolved.
- [x] Read `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` in full — confirmed the existing "Phase 2 — Capability Cards (INT11 / EPIC 1)" section contained the full condensed card content for all six capabilities (the duplication this workstream removes).

**Gate result: PASS — no conflicts with governing architecture.**

---

## ARCHITECTURE COMPLIANCE

| Check | Result |
|---|---|
| One canonical Capability Card per capability | ✅ Pass — each of the six cards now exists in exactly one place: `docs/architecture/capabilities/<id>.md` |
| No duplicate capability definitions | ✅ Pass — the full card text was removed from `INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` and replaced with a six-row index table (status, binding status, executable intents, owner, link) |
| Developer Registry becomes an index | ✅ Pass — "Phase 2 — Capability Cards (INT11 / EPIC 1)" renamed to "Phase 2 — Capability Index (canonical cards promoted to governing architecture, EPIC 1.5)" and reduced to a link table |
| Capability documents become the canonical architecture | ✅ Pass — `docs/architecture/capabilities/*.md` added to `docs/architecture/README.md` under a new "Architecture → Capabilities" section, marked governing |
| No runtime changes | ✅ Pass — `server/intelligence/capability-registry.ts` and all binding/handler/port files untouched |
| No schema changes | ✅ Pass — no `shared/schema.ts` change |
| No implementation changes | ✅ Pass — no code file touched |
| No technical meaning altered | ✅ Pass — every card was copied verbatim (byte-for-byte field content) from `INT11_CAPABILITY_CARDS_SPECIFICATION.md`; nothing was reworded, corrected, or extended |
| No open decisions resolved | ✅ Pass — every "OPEN DECISION" line in every card was carried forward unchanged |
| No capability behaviour introduced | ✅ Pass — `executableIntents`, owner, scopes, gaps, trust rules all copied as-is |

**Gate result: PASS**

---

## WHAT WAS DONE

### 1. Created `docs/architecture/capabilities/`

Six new canonical documents, one per capability, each containing:
- A short header (capability ID, classification, status, promotion provenance)
- A pointer to the Developer Capability Registry (index, not duplicate) and to the original INT11 investigation report (evidence/methodology)
- The **complete, verbatim** Capability Card from `INT11_CAPABILITY_CARDS_SPECIFICATION.md` — owner service, source of truth, access scope, supported/executable intents, allowed scopes, honest gaps, permission model, port methods, handler responsibilities (including every "OPEN DECISION" line), binding registration, tests required, documentation updates, data impact, and trust rules

| File | Capability ID |
|---|---|
| `docs/architecture/capabilities/profile.md` | `profile` |
| `docs/architecture/capabilities/household.md` | `household` |
| `docs/architecture/capabilities/partners.md` | `partners` |
| `docs/architecture/capabilities/meals.md` | `meals` |
| `docs/architecture/capabilities/templates.md` | `templates` |
| `docs/architecture/capabilities/analyser.md` | `analyser` |

Each card's field content was diffed by eye against the source spec during authoring; no field was reworded, summarized, or reordered.

### 2. Updated `docs/architecture/README.md`

Added a new **"Architecture → Capabilities"** section (placed before "Implementation Guidance", since these are now governing definitions, not implementation guidance) listing all six capability documents and stating they are governing architecture. Updated the "Implementation Guidance" section's Developer Capability Registry description to point at the new section and clarify the registry indexes rather than restates the cards.

### 3. Updated `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md`

Replaced the "Phase 2 — Capability Cards (INT11 / EPIC 1)" section (six full condensed-card subsections, ~135 lines) with "Phase 2 — Capability Index (canonical cards promoted to governing architecture, EPIC 1.5)" — a single six-row table carrying only: capability, implementation status, binding status, executable intents, owner service (short form), and a link to the canonical document. Updated the "Scope Lock" section's bullet about the six INT11 cards to note the promotion and point at `docs/architecture/capabilities/`.

The original `docs/implementation/governance/INT11_CAPABILITY_CARDS_SPECIFICATION.md` report was **not modified** — it remains as the historical investigation record (evidence + methodology), per the "preserve all existing evidence" instruction. It is no longer the canonical source for the card content itself; the registry and README now point readers to the canonical documents instead.

---

## ARCHITECTURE COMPLIANCE — DUPLICATION CHECK

Verified by direct search after the edit: the string "Capability Card" and the full field blocks (`Owner service:`, `Allowed scopes:`, `Honest gaps:`, etc.) for any of the six capabilities now appear in exactly one file each — the corresponding `docs/architecture/capabilities/<id>.md`. The registry retains only short-form summary fields (status, owner service in one line, executable intents, link) that do not reproduce the card's evidence or open-decision text.

---

## DATA IMPACT

| | |
|---|---|
| Reads existing data | ❌ No — documentation only |
| Writes new data | ❌ No |
| Changes meaning of existing data | ❌ No |
| Schema changes | ❌ None |
| Code modified | ❌ None |
| Bindings created | ❌ None |
| Runtime behaviour changed | ❌ None |

---

## TRUST CHECK

| Rule | Verified |
|---|---|
| No technical meaning altered | ✅ Every card field copied verbatim from the INT11 source |
| No open decision resolved | ✅ Every "OPEN DECISION" line preserved unchanged in the canonical document |
| No new capability behaviour introduced | ✅ `executableIntents`, scopes, gaps, and trust rules are identical to the source |
| All existing evidence preserved | ✅ `INT11_CAPABILITY_CARDS_SPECIFICATION.md` left untouched as historical record |
| One canonical Capability Card per capability | ✅ Verified by search — no duplicate full-card text remains anywhere |

---

## FILES CREATED / MODIFIED

| File | Action |
|---|---|
| `docs/architecture/capabilities/profile.md` | **Created** |
| `docs/architecture/capabilities/household.md` | **Created** |
| `docs/architecture/capabilities/partners.md` | **Created** |
| `docs/architecture/capabilities/meals.md` | **Created** |
| `docs/architecture/capabilities/templates.md` | **Created** |
| `docs/architecture/capabilities/analyser.md` | **Created** |
| `docs/architecture/README.md` | **Modified** — added "Architecture → Capabilities" section |
| `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` | **Modified** — Capability Cards section converted to an index |
| `docs/implementation/governance/EPIC_1_5_CAPABILITY_ARCHITECTURE_PROMOTION_IMPLEMENTATION.md` | **Created** — this report |

---

## DEFINITION OF DONE

- [x] `docs/architecture/capabilities/` created
- [x] Six capability documents created (profile, household, partners, meals, templates, analyser)
- [x] `docs/architecture/README.md` updated with an "Architecture → Capabilities" section
- [x] `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` converted into an index (capability, status, binding status, executable intents, owner, link)
- [x] No duplicated capability definitions remain (verified by search)
- [x] Implementation report created
- [x] Rollback tag created, plus a filesystem backup of the untracked `docs/architecture/` directory, before any file was modified
- [x] No code, schema, bindings, or runtime behaviour changed
- [x] No open governance decision resolved; no technical meaning altered
