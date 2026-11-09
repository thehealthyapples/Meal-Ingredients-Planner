# THA Repository Conventions

**Status:** Governing. Established under `HOUSE2` (2026-07-10).
**Scope:** Where every file in this repository lives, and why.

This document is the **single canonical source** for repository folder ownership,
naming conventions, and the rules governing what may be written where. It is
indexed from [`README.md`](./README.md) under Platform Governance and is required
reading before creating any new document, report, or developer utility.

It governs **location**, not content. What a document must contain is governed by
[`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md).

---

## 1. The five rules

1. **The repository root contains only project configuration, application entry
   files, and standard project files.** Nothing else.
2. **Engineering tooling lives under `.engineering/`** — never in `docs/`, never
   in the root, never in the application.
3. **Application documentation lives under `docs/`.**
4. **Every document has exactly one canonical home.** No document is duplicated
   across locations. Where a pointer is genuinely needed, it points *to* the
   canonical copy and never restates it.
5. **New reports must never be written to the repository root.** A report written
   to the root is a defect, not a filing decision.

Rule 5 is enforceable: `.engineering/scripts/repo-structure-verify.sh` fails if a
non-permitted file appears at the root.

---

## 2. Folder ownership

| Path | Owns | Do not put here |
|---|---|---|
| `/` (root) | Project configuration, build/entry config, standard project files | Reports, investigations, diagnostics, ad-hoc scripts |
| `client/` | Front-end application source | Documentation, developer utilities |
| `server/` | Back-end application source | Documentation, developer utilities |
| `shared/` | Code shared by client and server | Documentation |
| `migrations/` | Database migrations | Anything else |
| `script/` | The production build script (`build.ts`) | Developer utilities |
| `scripts/` | Developer utilities, one-off tools, diagnostics, verification scripts | Application source |
| `docs/` | All application documentation | Engineering tooling |
| `docs/architecture/` | **Governing** architecture. Indexed in its `README.md` | Point-in-time analysis |
| `docs/investigations/` | Point-in-time analysis and history, filed by workstream (§4) | Governing architecture; loose files at its root |
| `docs/implementation/` | Implementation reports, filed by workstream (§4) | Investigations; loose files at its root |
| `docs/intelligence/` | Benchmark artefacts and intelligence measurement output | Reports |
| `.engineering/` | Developer tooling (session recovery, hooks, protocols) | Anything shipped |
| `.claude/` | Claude Code project settings and hook wiring | Tooling logic (put it in `.engineering/hooks/`) |

### What the root permits

Exactly these categories:

- **Build / tool configuration** — `package.json`, `package-lock.json`,
  `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`,
  `drizzle.config.ts`, `capacitor.config.ts`, `components.json`
- **Platform / environment** — `.replit`, `.gitignore`, `.env.example`, `deploy.sh`
- **Standard project documents** — `RELEASE.md`, `MIGRATIONS.md`, `replit.md`
- **Runtime data assets that must resolve from the working directory** —
  `eng.traineddata` (loaded by `tesseract.js` via `server/services/ocr.ts`;
  moving it changes OCR behaviour)

Anything not in one of those categories does not belong at the root.

---

## 3. Where new documents belong

| You are writing… | It belongs in | Example |
|---|---|---|
| An investigation, audit, assessment, or root-cause analysis | `docs/investigations/<workstream>/` | `docs/investigations/intelligence/ATTN1_ATTENTION_PRIORITY_MODEL.md` |
| An implementation report for completed work | `docs/implementation/<workstream>/` | `docs/implementation/knowledge/KNOW5_SAFE_KNOWLEDGE_EXPANSION.md` |
| Governing architecture | `docs/architecture/` **and** indexed in its `README.md` | `THA_DECISION_ENGINE_ARCHITECTURE.md` |
| A Capability Card | `docs/architecture/capabilities/` | `capabilities/meals.md` |
| A developer utility or diagnostic script | `scripts/` | `scripts/test-db-connect.ts` |
| Engineering tooling or a session protocol | `.engineering/protocols/` | `ROLLBACK_PROTECTION_PROTOCOL.md` |
| A report about the engineering tooling itself | `.engineering/reports/implementation/` | `EOM1_IMPLEMENTATION_REPORT.md` |
| An investigation into engineering practice | `.engineering/reports/investigations/` | — |
| A session record | `.engineering/session/runs/` | `<SESSION_ID>.md` |

**Investigation vs implementation.** An *investigation* analyses and recommends;
it changes nothing. An *implementation report* records what was actually built,
with a rollback identifier and verification. If the document has a Rollback
Identifier and a Changes Made section, it is an implementation report.

**Promotion.** An investigation may be *promoted* to governing architecture by
copying it into `docs/architecture/` and indexing it in that directory's
`README.md`. The source investigation stays at its original path as history. This
is the only sanctioned form of two documents sharing a subject, and they are not
duplicates: one is history, one is governing.

---

## 4. Workstream folders (both `docs/implementation/` and `docs/investigations/`)

Implementation reports **and** investigations are filed by **workstream**, not one
folder per report. The **same** workstream vocabulary governs both trees, so a
subject occupies the same-named folder whether it is an investigation or an
implementation report (`docs/investigations/knowledge/…` ↔
`docs/implementation/knowledge/…`). This was extended from `docs/implementation/`
to `docs/investigations/` under `DOCSTRUCT1` (2026-07-10, §8).

| Folder | Covers |
|---|---|
| `intelligence/` | Intelligence Platform, capability bindings, engines (observation, behaviour, decision, attention), conversation/intents, Food Intelligence runtime, nutrition-boost feature. **Not the Companion itself** — that is its own workstream (`companion/`, below). |
| `companion/` | The Companion as a surface and as intelligence: identity, presence, conversation, authority, integration, runtime behaviour, and Companion Intelligence implementation. Carved out of `intelligence/` and `ux/` under `DOCGOV2` (2026-07-18) because the Companion is a stream of work in its own right, filed loosely across both before then. |
| `house/` | The **House experience**: Home, Arrival, the North Star, the Orchard House, rooms, spatial experience, and the household interior design language. Carved out of `ux/` under `DOCGOV2` (2026-07-18). Not general UX-system work — that stays in `ux/`. |
| `knowledge/` | Canonical food & nutrition knowledge, evidence, food imports (WS0/WS0X/WS1–WS11 food-catalogue programme), plant diversity, dietary dictionaries, knowledge review workbench |
| `benchmarking/` | Benchmark framework, execution, measurement, scoring, reporting |
| `cookbook/` | Recipes and meal content, meal detail, meal shells/templates/catalogue, meal-occasion & component modelling, recipe acquisition |
| `planner/` | Weekly & smart planner, plan generation, meal–household compatibility, dietary enforcement in plans, meal discovery for planning |
| `ux/` | **General** UI/interaction system work: dialogs, density/layout, workspace/header, navigation, profile display, copy/rename, platform-wide visual language. **Not** the Companion (→ `companion/`) and **not** the House experience (→ `house/`). A Home/Arrival/North Star/Orchard-House report, or a Companion identity/presence/conversation report, does not belong here even if it touches the UI. |
| `platform/` | Platform architecture & quality, resilience, operations, release engineering, launch-readiness, platform regressions |
| `governance/` | Architecture promotions, specifications, source-of-truth and governance decisions |
| `engineering/` | Engineering workflow & process, repository structure, release/deployment mechanics, documentation rules, session/dev-status records |
| `admin/` | Admin domain shell, navigation, admin regressions |
| `development_world/` | Development World dataset, import, and admin surfaces (DEVWORLD*) |

A workstream folder is a durable home for a *stream of work*. Adding one is a
governance decision, not a filing convenience — if a report does not fit an
existing folder, place it in the closest one rather than creating a folder of one.
A workstream folder is created **only when a document needs it** (so a tree may
carry a subset of the folders above); the vocabulary is shared, the folders are
materialised on demand. `production/` was folded into `platform/` under
`DOCSTRUCT1` so both trees speak one vocabulary.

### Companion and House routing (DOCGOV2)

A **Companion** report (identity · presence · conversation · authority ·
integration · runtime behaviour · Companion Intelligence) belongs in
`companion/`. A **House** report (Home · Arrival · North Star · Orchard House ·
rooms · spatial experience · household interior design language) belongs in
`house/`. Neither may be filed loosely at a tree root (already forbidden by §1
rule 5 and enforced by check #3) nor in the **generic `ux/` folder**.
`repo-structure-verify.sh` fails on a Companion- or House-named report found
directly under `docs/implementation/ux/` or `docs/investigations/ux/`.

**Grandfathered exceptions (do not relocate).** The verifier carries a small,
documented allow-list of pre-existing `ux/` files the rule does **not** fail on,
each for a stated reason:

- **Cited by a governing architecture document** — relocating would break an
  inbound citation, which §5 forbids for a cosmetic move:
  `CP2_COMPANION_PERSONALITIES_ACTIVATION`, `EWX1_LIVING_COMPANION_EXPERIENCE`,
  `INT37_COMPANION_CARD_EXPERIENCE_IMPLEMENTATION`, `EXP5_ONE_HOME_MANY_PLACES`.
- **Unresolved `ux/`↔`architecture/` name-duplication** — the same EWO name holds
  *different* documents in both folders (a pre-existing "one canonical home"
  defect to be resolved by its owner, not by this move):
  `DESIGN1_HOME_VISUAL_DESIGN`, `HOUSE1_THE_ENTRANCE_HALL`.
- **Genuinely cross-domain** — a Home/Planner *and* Companion hybrid, or a general
  Experience-Architecture refinement, whose owning workstream is a judgment call
  left to its owner: `WX2_HOME_INTELLIGENCE_COMPANION_IMPLEMENTATION`,
  `WX3_PLANNER_INTELLIGENCE_COMPANION_IMPLEMENTATION`,
  `NORTH2_EXPERIENCE_ARCHITECTURE_REFINEMENT`.

The allow-list binds every *new* report to the rule without demanding a
citation-breaking rename of an old one. A separate set of Companion runtime
reports remains under `intelligence/` for the same citation-lock reason
(`EWO2_COMPANION_PERSONALITY_PLATFORM_IMPLEMENTATION`,
`INT35B_COMPANION_LEARNING_AND_OBSERVABILITY`,
`INT35C_GOVERNED_COMPANION_LEARNING_AND_DASHBOARD`, and the source investigations
`EWO1_COMPANION_PLATFORM_FOUNDATION`,
`THA_COMPANION_PLATFORM_ARCHITECTURE_INVESTIGATION`); `intelligence/` is a valid
workstream and is not policed by this rule. When any of these documents is next
revised through its governing owner, it should move to its workstream.

---

## 5. Naming conventions

- **Implementation reports and investigations:** `<EWO_ID>_<SUBJECT_IN_CAPS>.md`
  — e.g. `DEC1_CANONICAL_DECISION_ENGINE.md`. The EWO ID prefix is what makes a
  document findable and orderable; it is not optional.
- **Governing architecture:** `THA_<SUBJECT>_ARCHITECTURE.md`, or the promoted
  document's established name.
- **Session records:** `<SESSION_ID>.md`, where the Session ID derives from the
  EWO name — e.g. `ESR2_Engineering_Session_Recovery`.
- **Developer utilities:** lowercase kebab-case — e.g. `verify-prod.ts`.
- **Do not rename an existing document** to satisfy these conventions. A rename
  breaks every inbound citation for cosmetic gain. Conventions bind new files;
  existing names are grandfathered. (Legacy `.txt` reports in
  `docs/implementation/ux/` are grandfathered for exactly this reason.)

---

## 6. Engineering tooling

`.engineering/` is developer tooling and must never become part of the
application, be deployed, expose an API or UI, create database tables, store user
or business data, or integrate with the Intelligence Platform. Its own boundaries
are documented in [`../../.engineering/README.md`](../../.engineering/README.md)
and asserted by `.engineering/scripts/session-verify.sh`.

The distinction from `docs/`: `docs/` describes **what the product is**;
`.engineering/` describes **how the codebase is built**. A session record, a hook
script, and a recovery protocol are tooling. An architecture document and an
implementation report about a *feature* are documentation.

The entry point for every engineering session is
[`../../.engineering/README.md`](../../.engineering/README.md), and the workflow
itself is [`../../.engineering/OPERATING_MANUAL.md`](../../.engineering/OPERATING_MANUAL.md).

### Internal ownership (mirrors `docs/`)

| Path | Owns |
|---|---|
| `.engineering/OPERATING_MANUAL.md` | The 11-step engineering workflow — single source of truth |
| `.engineering/protocols/` | **How** engineering is performed: durable procedures |
| `.engineering/standards/` | The rules protocols assume: boundaries, risk and scope, verification |
| `.engineering/templates/` | Document shapes to copy |
| `.engineering/checklists/` | Per-task checklists, completed at Review |
| `.engineering/reports/implementation/` | **What** engineering was performed on the tooling |
| `.engineering/reports/investigations/` | Analysis of engineering practice |
| `.engineering/session/`, `hooks/`, `scripts/` | Session recovery machinery |

**A protocol is never a report.** `protocols/` says how engineering is performed;
`reports/` records what engineering was performed. They never share a folder —
enforced by `session-verify.sh`.

The one document spanning both governance layers is
[`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md): it is Application
Governance and owns the Architecture Compliance Checklist. The Operating Manual
says *when* to run that checklist; it does not restate it.

---

## 7. Verification

Two scripts keep these rules honest:

| Script | Asserts |
|---|---|
| `.engineering/scripts/repo-structure-verify.sh` | Root contains only permitted files; no reports at root; no duplicate reports; `docs/implementation/` **and** `docs/investigations/` have no loose files (workstream-filed; only a `README.md` index permitted at each root) |
| `.engineering/scripts/session-verify.sh` | `.engineering/` has not leaked into the application |

Run both after any structural change. Neither touches the application.

---

## 8. History

Established by `HOUSE2` (2026-07-10), which removed 22 root artefacts, relocated
20 misplaced files to canonical locations, and filed 174 implementation reports
into eight workstream folders. Before `HOUSE2`, the root held 43 report and
diagnostic files, 21 of which duplicated documents already filed under
`docs/investigations/`. See
[`../implementation/governance/REPOSITORY_HOUSEKEEPING_AND_STRUCTURE.md`](../implementation/governance/REPOSITORY_HOUSEKEEPING_AND_STRUCTURE.md).

Extended by `DOCSTRUCT1` (2026-07-10), which applied the same workstream filing to
`docs/investigations/` — 383 loose analysis files filed into ten workstream folders
— unified the workstream vocabulary across both trees (folding `production/` into
`platform/`, adding `cookbook/`, `development_world/`, and `engineering/`), added an
index `README.md` to each root, and extended `repo-structure-verify.sh` to enforce a
loose-file-free investigations root. See
[`../implementation/engineering/ENGINEERING_DOCUMENT_STRUCTURE.md`](../implementation/engineering/ENGINEERING_DOCUMENT_STRUCTURE.md).
