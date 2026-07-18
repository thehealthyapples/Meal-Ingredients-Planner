# Session: ENGINT1_Engineering_Intelligence_Foundation

| Field | Value |
|---|---|
| **Session ID** | `ENGINT1_Engineering_Intelligence_Foundation` |
| **Rollback ID** | `rollback/ENGINT1-engineering-intelligence-foundation-20260718` |
| **Start time** | 2026-07-18 |
| **Current stage** | **Complete — committed (`bc360ba5`), awaiting owner review** |

## Rollback
| Item | Value |
|---|---|
| Tag | `rollback/ENGINT1-engineering-intelligence-foundation-20260718` → `7bfad50ca198f2b86f6501a4f82d8ae41af9260b` (annotated; == HEAD at start) |
| Working tree at start | **Dirty — NOT MINE.** 248 entries from sibling sessions (FI18, ADMIN1, AFI1–3, COMP_ACT1/2 and others), including uncommitted `package.json` script additions. The tag captures **committed state only** and does not cover any of it. |
| This session's writes | 6 new files, 3 modified, 1 implementation report — all committed in `bc360ba5`. No sibling session's file was touched. |
| Rollback of this task only | `git revert bc360ba5` (self-contained; nothing else read or wrote these files) |

## Objective
Engineering Intelligence Phase 1 (engineering knowledge indexing) and Phase 2
(cross-document reasoning), read-only, as a capability of the existing
Intelligence Platform. **No separate engineering assistant. No duplicated
knowledge. No code generation, deployment, or autonomous agents.**

## The two findings that shaped it (raised and approved before any code)

**1. The capability already existed.** `capability-registry.ts` has registered
`developer` since TIP1 — *"Architecture/workflow knowledge — isolated developer
plane only; never user plane"*, `owner: "repo + docs/ + SoT Register"`,
`availability: "never"`. Creating an `engineering-intelligence` capability beside
it would have failed Architecture Compliance on **no duplicate entities** and
**no duplicate ownership**. ENGINT1 therefore **activated the existing
declaration** and created no new capability id.

**2. §7 forbids the household Companion endpoint.**
`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §7: *"sharing an endpoint would make
boundary 2 a single misclassification away from a leak. Same architecture,
separate deployment."* §4.2 lists file paths, internal architecture, developer
investigations and the unpublished roadmap as things users must **never** see —
a precise description of everything this capability reads. Risk R1 rates a leak
🔴 Critical.

The mission's principles survive intact: §7 defines Developer Intelligence as
*"the **same plane** with the `developer` knowledge class unlocked"*. One
platform, one Companion, one registry — **instantiated twice, unlocked
differently, never joined.** Owner approved the isolated developer plane, and
live-read (mtime-invalidated) indexing over a generated artefact.

## What was built
- `server/services/engineering-knowledge-registry.ts` (896) — owner-side read surface; Phase 1 index + Phase 2 reasoning. Pointers and metadata only; excerpts read at answer time.
- `server/intelligence/handlers/engineering-knowledge-read-port.ts` (79) — read-only by construction.
- `server/intelligence/handlers/engineering-knowledge-read-handler.ts` (311) — `read`/`search`/`explain`/`report`; citations or structured gap, never both absent.
- `server/intelligence/bindings/engineering-knowledge.ts` (56) — binds the **existing** `developer` capability.
- `server/intelligence/developer-plane.ts` (111) — the §7 isolation boundary.
- `server/tests/test-intelligence-engineering-knowledge-binding.ts` (385) — isolation · non-fabrication · the eight verification questions.
- Modified: `capability-registry.ts` (descriptor extended, `search` added, `"never"` preserved + `developerPlaneSeed()`), `index.ts` (re-exports), `package.json` (test registered).

## Four isolation locks (each asserted alone)
1. **Seed** — user-facing seed keeps `developer` at `"never"`; rejected before any role check.
2. **Binding** — handler bound only to the developer-plane instance.
3. **Role** — `resolveContext()` cannot mint `developer`; the only factory that can is env-gated.
4. **Environment** — every entry point throws unless `THA_DEVELOPER_PLANE=1` (unset in production).

## Verification
- `npm run test:intelligence-engineering-knowledge-binding` — **34 passed, 0 failed** against the live repository (796 docs indexed).
- Regression green: `intelligence-registry-executability`, `intelligence-platform`, `intelligence-product-knowledge-binding`, `mat1-registry-conformance`.
- `tsc --noEmit` — no error in any ENGINT1 file; 256 pre-existing errors unchanged (all in sibling test files).
- `repo-structure-verify.sh` — 2 FAILs, **both pre-existing**, confirmed against the rollback tag.

## The headline
`roadmapPosition()` returns `completionRecorded: false` **permanently**. The
roadmap declares six workstreams (WS0–WS5) and whether each gates launch, but
records **no per-workstream completion status anywhere** — §8's emoji legend
rates production dimensions, not workstreams, and every §9 Definition-of-Done
checkbox is unchecked. So "which workstreams are complete?" returns the declared
workstreams, the unchecked items, and the reports naming each, as evidence — and
refuses the verdict it would have been trivial to derive. That refusal surfaces a
real gap in THA's engineering record.

## Next action
**Owner to review** `docs/implementation/engineering/ENGINT1_ENGINEERING_INTELLIGENCE_FOUNDATION.md`.
Open decisions, none begun:
1. Whether to give the roadmap a per-workstream status field — the one change that would make completion answerable at all.
2. Whether to stand up a developer-plane deployment target. If so, it needs a Product Knowledge Registry entry and `admin_audit_log` wiring for the capability's `audited: true` posture, both in that same change.
3. Pre-existing loose files at the `docs/implementation/` and `docs/investigations/` roots still fail the structure gate (not ENGINT1's, not fixed here).

**Out of scope and not begun:** Engineering Automation, Remote Operations,
release orchestration, commit generation, automated reporting.
