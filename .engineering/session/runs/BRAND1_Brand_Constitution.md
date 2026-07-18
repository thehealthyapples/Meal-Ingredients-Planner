# BRAND1 — Brand Constitution

**Session ID:** `BRAND1_Brand_Constitution`
**Opened:** 2026-07-17
**Branch:** `int1-intelligence-platform`
**Type:** Governing architecture document — authoring only. **No implementation. No runtime behaviour change. No new capability. No duplication of existing architecture.**
**Risk:** 🟢 GREEN (a single new Markdown document under `docs/architecture/` + README index edit; product source byte-untouched)

---

## Rollback

| Item | Value |
|---|---|
| **Rollback identifier** | `rollback/BRAND1-brand-constitution-20260717` → `7bfad50c` |
| WIP tag | `brand1-wip-snapshot-7bfad50c` |
| Working tree at start | **Intentionally dirty — NOT MINE.** Pre-existing uncommitted work from sibling sessions (NORTH3/4/5, CONV1, P0, FI18, ADMIN1, INT19, INTLANG1). The tag protects committed state only. Not touched, not committed, not reverted. |

---

## Mission

Define the enduring identity of The Healthy Apples as a governing architecture document. **Do not implement. Do not duplicate existing architecture. Reference existing governing documents where appropriate.**

Define: Why THA exists · Our Promise · Our Character · Our Responsibility · What THA will never become · The Household First Principle · The Trust Test · The One Question before every release. Finish with ten constitutional principles every future feature must satisfy. Store under `docs/architecture/`. Report rollback identifier + file location.

---

## The decision that shapes the session

A "Brand Constitution" risks becoming a second owner of concepts already owned (the Promise → Experience Language § 4A-A; the feeling → Experience Language § 3A; the vision → Experience Blueprint; the voice → TIP3; visual identity → UI Architecture "Brand Identity Architecture"; non-fabrication → Core Principle 6). It must:
- **restate no rule** — it references and cites owners;
- own only what none of them owns: **the single, enduring statement of identity** that the specialised documents each serve a face of — *why THA exists, the promise, the character, the responsibility, the lines it must never cross, and the one question before release*;
- position correctly against `ARCHITECTURE_PRINCIPLES.md` (the platform's foundational engineering law) — the Constitution governs *identity/intent*, not *engineering rule*, and must not claim to sit above the Core Principles.

---

## Checkpoints

- [x] Architecture bootstrap read (`docs/architecture/README.md`) — read this session; re-confirmed (INTLANG1 immediately prior)
- [x] `git status` confirmed; rollback branch + WIP tag created at HEAD (`7bfad50c`)
- [x] Run file opened
- [x] Upstream owners of every touched concept gathered (Explore agent) — Core Principles (esp. 2, 6), Experience Language §3/§3A/§4A/§7, Experience Blueprint §1.1/§1.4/§1.5/§17, TIP3 §11/§12, Experience Architecture §1/§4/§6/§11/§12/§17, UI §10/§14 (visual identity boundary), Kept Room §5.6
- [x] `THA_BRAND_CONSTITUTION.md` authored under `docs/architecture/` — why THA exists · Promise · Character · Responsibility · never-become · Household First Principle · Trust Test · One Question · ten Constitutional Principles
- [x] README index updated (governing document indexed at creation) — **Platform Governance** table row (identity is platform-level) + descriptive blockquote
- [x] `repo-structure-verify` run — 3 FAILs, **all pre-existing sibling debt** (stray root `.txt` files; loose files under `docs/implementation/`+`docs/investigations/`); my only changes are the new doc + README edit, both under `docs/architecture/`, no failing check touches them
- [x] CURRENT.md dashboard row added
- [ ] Owner review

---

## Stage

**Complete — awaiting review.** Governing document `docs/architecture/THA_BRAND_CONSTITUTION.md` authored and indexed. **No implementation, no duplication of existing architecture** — one new Markdown doc + README index edit. Product source byte-untouched.

## What the Constitution legitimately owns vs references (the non-duplication spine)

- **Owns** (genuinely unowned before): the titled enduring-identity document; the consolidated mission (§2); a named **Household First Principle** (§7); a named **Trust Test** (§8); the **One Question before every release** (§9); the consolidated **what THA will never become** (§6); the **ten Constitutional Principles** (§10). Each is built *from* its layer owner and cites it.
- **References, never restates:** the Promise (Experience Language §4A-A) · Premium-as-care/not-exclusivity (Exp Arch §17/§17.12) · the feelings + Emotional Palette (Exp Lang §3/§3A) · anti-patterns (§7) · non-fabrication (Core Principle 6, TIP3 §12.2) · voice (TIP3 §12.1) · vision (Blueprint §1.1/§1.4/§1.5/§17) · **visual/brand identity (UI §10/§14 — explicit boundary: enduring identity here, visual identity there)**.

## Positioning (two axes, stated in §1 and §11)

- **Engineering-law axis:** subordinate to `ARCHITECTURE_PRINCIPLES.md` (bound by Principle 2 + Principle 6) — which is *why* it references rather than restates.
- **Identity axis:** upstream of the four Experience Governance docs (states the identity they express), but overrides none — on any *rule* question the rule's owner prevails and the Constitution is corrected.

## Report

- **Rollback identifier:** `rollback/BRAND1-brand-constitution-20260717` → `7bfad50c` (WIP tag `brand1-wip-snapshot-7bfad50c`)
- **File location:** `docs/architecture/THA_BRAND_CONSTITUTION.md` (indexed in `docs/architecture/README.md`, Platform Governance)

## Next action

Owner review. Nothing else pending — self-contained governing architecture, no follow-on engineering work.
