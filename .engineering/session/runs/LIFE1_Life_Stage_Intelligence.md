# LIFE1 — Life Stage Intelligence — Session Record

**Session ID:** `LIFE1_Life_Stage_Intelligence`
**Started:** 2026-07-16
**Branch:** `int1-intelligence-platform`
**Objective:** Investigate Life Stage Intelligence as a platform capability built on the
Household Time Architecture. Investigation only — no implementation, no application
code, no schema change.

---

## ROLLBACK

| Item | Value |
|---|---|
| **Rollback ID** | `rollback/LIFE1-7d1dd2ce-20260716` → `7d1dd2ce` |
| Working tree | Intentionally dirty — concurrent sessions (TIME3, HOME3, NORTH1/2, EXPCOMP1/2, ORCH1) hold uncommitted work. **No stash taken**: a stash would destroy concurrent sessions' trees. |
| This session's writes | **Docs only. One file created:** `docs/investigations/platform/LIFE1_LIFE_STAGE_INTELLIGENCE.md` |
| Revert | Delete that one file. Nothing else was touched. |

---

## STAGE

**Investigation Complete** → Waiting for User

---

## CHECKPOINTS

- [x] Rollback protection created + reported
- [x] Architecture bootstrap read (`docs/architecture/README.md`, `ARCHITECTURE_PRINCIPLES.md`, `REPOSITORY_CONVENTIONS.md`, `ENGINEERING_WORKFLOW.md`)
- [x] Governing docs read (Household Time Architecture **in full**, SoT Register D16/D27/Appendix A, NK1, NK2, Observation Engine § 7, Decision Engine, Context Composition, AI Experience, EXP ARCH § 12)
- [x] TIME1 + TIME2 read as history (§ 12 future capabilities, § 10 roadmap, § 13 architecture impact)
- [x] **GOVTIME1 — does not exist.** No run file, no document. Its governance function was performed by **TIME3**, which promoted `docs/architecture/THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (Phase 0). Read that instead.
- [x] Codebase reality established (member demographics, conditions, preferences, nutrition targets) — **every load-bearing citation personally verified at source, not taken on a subagent's report**
- [x] Investigation written → `docs/investigations/platform/LIFE1_LIFE_STAGE_INTELLIGENCE.md`
- [x] Indexes assessed — **no update required** (see below)
- [ ] Committed — *not committed; working tree shared with concurrent sessions*

---

## INDEX ASSESSMENT — NO UPDATE REQUIRED

- **`docs/architecture/README.md` — NO.** It indexes **governing architecture** only (line 4). LIFE1 is an investigation; adding it is the category error that line exists to prevent. Same reasoning as TIME2 § 13.1.
- **`docs/investigations/README.md` — NO.** It is a **workstream index**, not a document index (verified: it lists folders, no files). `platform/` already exists (README:27) and already covers this.
- **`repo-structure-verify.sh` — PASS** for this session's filing: *"docs/investigations/ has no loose files"* ✅. The two root FAILs (`.glibcheck.txt`, `.libdirs_uxhome.txt`) are **pre-existing untracked files from a concurrent session** — present in the session-start git status, **not LIFE1's, deliberately not touched.**

---

## DEVIATIONS FROM MISSION (reported, not silently applied)

1. **Specified path violates governing architecture.** The mission specifies
   `docs/investigations/LIFE1_LIFE_STAGE_INTELLIGENCE.md` — a loose file at the
   investigations root. `REPOSITORY_CONVENTIONS.md` §2/§4/§7 forbids this (workstream-filed
   only; root permits `README.md` alone) and `repo-structure-verify.sh:52-54` would FAIL.
   **Filed under `platform/`.** Same deviation TIME2 § 0.2 hit and resolved identically.
   Gate re-run after filing: **PASS**.
2. **"GOVTIME1 (if completed)"** — **not completed; does not exist.** Read `TIME3`'s
   promoted governing architecture in its place (see checkpoints).
3. **The mission's noun is declined.** It asks for Life Stage *"as a platform capability."*
   Per `HOME1`/`NORTH2` (a hypothesis is tested, never ratified), § 2 finds it is **not a
   capability but a vocabulary** — on TIME1 § 12.2's exact reasoning for time (*"time alone
   answers no household question"*). Reported as a finding, not silently redefined.

---

## HEADLINE FINDINGS (full detail in the investigation)

1. **`server/routes.ts:568` — `- 5 * 30`.** THA hardcodes **age 30** (and `-78`, the
   sexless midpoint of the male/female Mifflin–St Jeor constants) for **every human being**,
   and surfaces the result as a personalised calorie target. **The platform's only live
   fabrication about age.** Core Principle 6 defect.
2. **`NK1:73`, `:139`, `:535` — a false inventory.** Governing architecture states eater
   **age** is stored and **"Authoritative"**. The column does not exist
   (`shared/schema.ts:1158-1168`). **A new defect class in this canon:** not a law ahead of
   its platform (TIME1) nor a right canon wrongly rendered (NORTH2) — **a governing document
   factually wrong about the system it governs**, over-claiming authority on a
   safety-relevant field.
3. **`NK1:418` — the dangling §6.3.** The canon's **only** per-child rule (*"no inferral, no
   per-child signals"*) cites a section that **does not exist** — NK1 has no numbered
   sections at all. Recorded, **not written** (filling it would make an investigation the
   author of a governing rule).
4. **The scope defect.** `user_preferences.adultsCount/childrenCount/babiesCount`
   (`schema.ts:667-669`) is a **Domain 16 fact** (household composition) held by **Domain 27**
   at **user** scope — a domain the Register already marks *Contested*. Two adults in one home
   can disagree. **This is the split-brain `HT4` rejected for the time zone, in the same
   register domain, already live.**
5. **The severest finding.** `babiesCount` reaches the language model in **90 of 100 prompts**
   (`context-view.ts:189-192`; `profile-read-handler.ts:187-189`) and **gates nothing**; the
   infant botulism rule is a **code comment** (`restriction-library.ts:1169`) above a resolver
   taking only declared strings (`restriction-resolver.ts:490-494`) — in the file whose own
   docblock says *"**a restriction the platform cannot enforce is worse than one it never
   accepted, because the household believes it is protected**"* (`:503-506`). **SURF1B2 closed
   this exact hole for `meat`/`fish`/`honey` and left it open on composition.** Stated honestly
   as a **structural hazard, not a demonstrated harm** — the Companion currently disclaims
   (*"I don't know the ages of your children"*), so the platform is protected by the model's
   manners, not by a gate.
6. **`household-eater.ts:107` — `kind: "child"` means *has no account*.** A grandparent or
   lodger is typed `"child"`; a 15-year-old with a login is `"user"`. No production code reads
   it — **but it reaches the model**, and it is a loaded gun for the first engineer who writes
   `if (eater.kind === "child")`.

---

## THE MODEL (proposed, not built)

- **Owner:** `shared/life-stage/life-stage.ts` — pure, zero-I/O, total, deterministic,
  beside the spine. **Owns the rules, none of the data.** The class Appendix A already
  records **three times** (ATTN1 · DEC1 · TIME3).
- **Fact:** `household_eaters.birthYear` + `.birthMonth`, nullable — **Domain 16, existing
  owner extended. No new domain, no new store, no new write funnel** (HT2's shape).
- **The decisive argument (§ 9.4):** the stored fact **must be a date, never a stage**. A
  declared stage is a **stored derivation** that rots silently as the child grows — `HT3`
  forbids it, and it is **`approxDate`'s exact defect wearing a kinder name**. Month
  precision suffices for every boundary rule; day precision buys only birthdays, which is
  celebration, not safety.
- **The instrument (§ 8) — the Boundary/Curve test:** *does this rule turn on a boundary or
  a curve?* **Boundary** (honey <12mo) = step function, fails **closed**, extends Rule T0 and
  the existing resolver → **recommend**. **Curve** (how much iron does a 4-year-old need) =
  needs age-banded intakes → refused: `household-nutrition.ts:59-65` (*"inventing one would be
  fabricating certainty"*), NK2's **household-level** unit (`:179`, `:213`), Register Rule 8.
  **The cheap half is also the safety-critical half — nothing is traded away.**
- **The trust boundary (§ 10):** **declared → derived → never inferred.** Already law three
  times (`HT16`; OBS § 7; `NK1:418`). THA must never conclude a baby exists from a formula scan.
- **Placement in Household Time (§ 11):** a **T2-only consumer**, `Owns: Nothing`. **Not
  blocked by Phase 2 (zone) or Phase 4 (★ the anchor)** — it is CIVIL with a tolerance in
  months, consuming a value that errs by hours.
- **§ 11.1 — why it needed TIME3 first:** life stage is **THA's first time-derived household
  fact** — the only fact whose *meaning changes while nobody touches it*. Every other fact is
  time-invariant. A platform with no owner of *today* cannot hold it; it can only hold a label
  and watch it rot.

---

## GAPS RECORDED, NOT FILLED

1. **Children's personal data has no governing owner — the top open item.** No governing doc
   addresses minors' data, parental consent, or retention. THA requires *"legal/regulatory
   review"* for S-3 biomarkers; **a child's DOB is at least that sensitive and is asked of
   every household.** Gates Step 2 — **not the module, and not the retirements.**
2. **Pregnancy — deliberately not created.** A different fact, scope, and trust profile.
3. **Facts deliberately not created:** per-eater **sex** (the other half of `:568`'s
   fabrication), age-banded intakes, birthdays/day precision, inferred stages.

---

## ARCHITECTURE IMPACT

**One document *correction*, one register row, two domain fields — and only the correction is
due now. Nothing performed here.** `NK1` MUST be corrected (Step 0a). The SoT Register evolves
at Step 2 (D16 gains the fields; Appendix A names the owner). **Household Time is NOT amended**
— Life Stage is a consumer, and a new consumer does not amend the architecture it consumes.
**NK2 is NOT amended** — the § 8 Curve refusal exists to keep it that way. **Every Experience
document byte-untouched;** the one-morning law is not engaged (life stage aims safety and
words, never light).

---

## RECOMMENDED NEXT WORKSTREAM

> **`LIFE2` — Step 0: delete the hardcoded age (`routes.ts:568`).**
> Application code, one line, **no schema, no dependency on Household Time, blocked by nothing.**

It is the cheapest step, the **only live fabrication** the audit found, and the one thing here
that is **wrong today rather than absent today**. Its fix is a **deletion**: the honest answer
to *how old are you* is that THA does not know.

**Do not start with Step 2 (the column).** A birth date collected before the § 12.1 legal
question is answered is a minor's personal data gathered without a governing position on
minors' personal data — and unlike every other finding, **that one is not reversible by
dropping a column.**

---

## NEXT ACTION

None — investigation complete. Awaiting direction on the § 13 roadmap (recommended: `LIFE2`).
