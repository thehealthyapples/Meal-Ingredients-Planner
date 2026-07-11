# INTQ10 — Companion Intelligence Capability Expansion

**Status:** IMPLEMENTATION
**Workstream:** INTQ10
**Date:** 2026-07-05
**Branch:** `int1-intelligence-platform`
**Rollback tag:** `intq10-rollback` → `ce5cb57a6cc517a21c6765c8fb75a390beec775f`
  (a `git stash create` snapshot of the full working tree taken before any INTQ10 edit;
   `git stash apply intq10-rollback` restores it.)

---

## 0. Mission

Improve the Companion's ability to **discover, combine and explain** knowledge already
available within the Intelligence Platform — without creating new capabilities, duplicating
business logic, or changing the benchmark questions/scoring.

Governing reading completed: `docs/architecture/README.md` (architecture bootstrap) and
`docs/intelligence/benchmark/` (framework, scoring, automation). The one-seam invariant
(every benchmark turn runs through `conversationGateway.processUserTurn`) and the honest-gap
discipline are respected throughout.

## 1. Baseline (before)

Quick Benchmark, all ten INTQ6 Benchmark-World households (`BW01`–`BW10`), one representative
question per canonical domain, deterministic tier (judge disabled — the framework's honest
default), run through the one Companion seam:

- **Pooled headline: 76.1 / 100**, gates fired: **0**.

Per-question mean composite across the ten households (worst first) and the diagnosis that
drove this workstream:

| Q | Mean | Reached | Diagnosis |
|---|---|---|---|
| TS-091 | 65.3 | `household` | "What don't you know about my household?" routed to the household **members** read, which cannot answer a *what-is-missing* question. Benchmark expects the `profile` family (which exposes its own nulls). D4 mismatch **and** a weak non-answer. |
| PH-001 | 71.3 | `profile` | "What diet am I following?" — routed correctly (D4=4) but the answer is a terse deflection or one short clause (<40 chars) → D5=2. |
| PR-063 | 71.3 | `analyser` | "What are ultra-processed foods?" — genuine platform knowledge gap (analyser stores additives, not a UPF definition); the terse non-answer scores D5=2. |
| CB-011 | 74.3 | `meals` | Correct count answer; no entity ref possible for a scalar count (D1=2). Near its deterministic ceiling. |
| CG-083 | 74.3 | `meals` | Cross-cutting "I'm tired, what should I do?" — answered from meals; D4=2 is structural (benchmark family is the cross-cutting Companion Platform). |
| ND-053 | 76.3 | `diary-discovery` | "…logged recently" is genuinely a history *search*; `diary-discovery` is the correct capability. D4=2 is a measurement artefact we must not chase by touching scoring. |

**Root cause pattern:** the biggest recoverable loss is **D5 (Relevance & Completeness)** —
many *correct* answers are under the scorer's 40-character substantiveness floor, and several
"the specific detail isn't stored" turns collapse to a bare *"I don't have that information
right now"* instead of a substantive, evidence-grounded honest statement. This is precisely a
**discover / combine / explain** deficiency, not a data deficiency.

Honest gaps (e.g. FK-073 "benefits of salmon", 86.8) already score near the deterministic
ceiling **because** they are honest — the scorer rewards an honest gap (D2=4) above a plain
success (D2=3). INTQ10 therefore **preserves** honest-gap behaviour and never converts a gap
into a fabricated answer.

## 2. Changes (all in the grounding / orchestration layer — no new capability, no duplicated logic)

### Change A — Evidence-forward, multi-capability grounding prompt
`server/intelligence/conversation/conversation-gateway.ts` (`buildGroundedResponse`).

The system prompt's HARD RULES 1–5 (grounding, health-claim firewall, no-guess, concision,
entity-honesty) are **unchanged in force**. Added, without weakening any of them:

- **Multi-capability synthesis** — when more than one CONTEXT DATA section is present, connect
  them into one coherent answer instead of reciting each in isolation (improves multi-capability
  reasoning and explanation quality).
- **Evidence-forward** — ground each specific claim in the data provided, and prefer surfacing
  the concrete stored values the platform actually retrieved (improves evidence-backed responses).
- **Substantive honesty** — when the specific detail asked for is *not* in the context, still
  answer in a complete sentence: say what *is* recorded, or that the field isn't recorded yet,
  rather than emitting the bare deflection. This keeps the honest gap **honest** (no fabrication)
  while lifting terse non-answers over the substantiveness floor.
- **Entity-ref reinforcement** — restate that every entity present in the context should be
  returned in `entityRefs`.

This is a "changes *how*, never *what*" edit (Companion Platform Architecture CPA1 invariant):
no new fact can be produced — rules 1–3 still forbid it.

### Change B — Route household/self "what don't you know" meta-questions to the profile record
`server/intelligence/pattern-intent-resolver.ts` (`PROFILE_HOUSEHOLD_META_MATCHERS`).

Extends the existing profile-meta matcher family (which already routes "what gaps are in my
profile?", PH-009) with the sibling *household/self* phrasing ("what don't you know about my
household yet?", "what are you missing about us?"). The profile read is the record-owner that
exposes its own null/absent fields — the exact evidence the benchmark names for this question
(*"Profile/household nulls/confidence"*). No new capability; the same `profile` `read` intent
the meta family already uses. Tightly guarded by a **gap-signal** (`don't know` / `missing` /
`gaps` / `still need`) **and** a household/self phrase, so the existing regression guard
("what dietary restrictions does my household have?" must stay on the household capability)
is unaffected — that utterance carries no gap signal.

## 3. Validation

Re-ran the identical Quick Benchmark (all ten households) after the changes, plus the intent
resolver and personality-platform unit suites. Results in §4.

## 4. Results

Identical Quick Benchmark, all ten households, deterministic tier.

**Pooled headline: 76.1 → 77.8 (+1.7). Gates fired: 0 → 0. Every household improved; none
regressed. Honest-gap rate: 11/100 → 11/100 (unchanged — honest gaps preserved).**

| Household | before | after | Δ |
|---|---|---|---|
| BW01 | 75.8 | 78.1 | +2.3 |
| BW02 | 76.5 | 78.1 | +1.6 |
| BW03 | 76.5 | 78.1 | +1.6 |
| BW04 | 75.4 | 77.0 | +1.6 |
| BW05 | 77.2 | 78.1 | +0.9 |
| BW06 | 76.5 | 78.1 | +1.6 |
| BW07 | 75.8 | 78.1 | +2.3 |
| BW08 | 76.5 | 78.1 | +1.6 |
| BW09 | 76.5 | 78.1 | +1.6 |
| BW10 | 73.8 | 75.7 | +1.9 |

Per-question mean composite across the ten households:

| Q | before → after | Δ | driver |
|---|---|---|---|
| TS-091 | 65.3 → 74.3 | **+9.0** | Change B: reached `household` → `profile` (D4 2→4) **and** substantive gap answer (D5 2.1→3.0). |
| PR-063 | 71.3 → 74.3 | +3.0 | Change A: substantive honest answer instead of a bare deflection (D5 2.1→3.0). |
| PH-001 | 71.3 → 74.0 | +2.6 | Change A: complete, evidence-forward answer (D5 2.1→2.9). |
| CG-083 | 74.3 → 75.8 | +1.5 | Change A: multi-capability synthesis improved factual grounding (D1). |
| SH-035 | 79.6 → 80.3 | +0.7 | Change A: completeness (D5 2.8→3.0). |
| PA-045 | 80.7 → 81.0 | +0.3 | Change A: completeness (D5 2.9→3.0). |
| FK-073 | 86.8 → 86.8 | 0.0 | Honest gap preserved (salmon has no benefit links). |
| CB-011, ND-053, PL-023 | unchanged | 0.0 | At deterministic ceiling / genuine discovery routing. |

Unit suites: `test-intent-resolver` 151/151, `test-intelligence-personality-platform` 114/114,
`test-intelligence-fallback` 82/82, `test-intelligence-native-discovery` 81/81,
`test-intelligence-profile-binding` 50/50, `test-intelligence-companion-enrichment` 26/26 — all pass.

## 5. Remaining opportunities (honest gaps in the platform, not the Companion)

- **PR-063 / UPF definition** — the analyser owns additives only; there is no curated
  ultra-processed / NOVA *definitional* knowledge in the platform, so "what are ultra-processed
  foods?" cannot be grounded. The correct long-term fix is a curated UPF knowledge scope in the
  analyser/food-knowledge owner, not a Companion change.
- **FK-073 / food benefit links** — salmon is a known food with a rich description and nutrients
  but **no benefit links** in the relationships graph, so `explain(foodSlug)` honestly gaps.
  Populating benefit links (a Food Knowledge data task) would let the Companion explain it.
- **ND-053 / diary "recently"** — `diary-discovery` is the correct capability; the residual D4
  cost is a benchmark family-normalisation artefact and is out of scope (scoring is frozen).
- **CB-011 / scalar answers** — count answers carry no entity ref by nature; D1 is at its
  deterministic ceiling for this shape.
