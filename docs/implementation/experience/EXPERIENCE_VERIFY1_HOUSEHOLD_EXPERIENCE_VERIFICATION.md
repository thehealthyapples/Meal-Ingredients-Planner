# EXPERIENCE_VERIFY1 — Household Experience Verification

**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Risk:** 💡 Premium Reasoning
**Reason:** Restore end-to-end browser verification and prove the household experience works before any further product implementation.

---

## ROLLBACK PROTECTION

| | |
|---|---|
| **Rollback identifier** | `rollback/EXPERIENCE_VERIFY1-household-experience-verification-20260718` |
| **Commit** | `8e25c195` — HOUSE_ACT3 completion |

**Rollback command:**
```
git reset --hard rollback/EXPERIENCE_VERIFY1-household-experience-verification-20260718
```

The tree at tagging held uncommitted work from concurrent **PROD3/PROD4** sessions across `client/`, `server/` and `package.json`. **None was captured** — this programme authors no commit on their behalf.

> **Filing note.** The mission specified `docs/implementation/EXPERIENCE_VERIFY1_….md`, a loose path at a tree root that `repo-structure-verify.sh` already fails on (13 loose files pre-exist there). No subfolder owns *experience verification* — the closest, `platform/`, is not a clear fit. The explicit instruction was followed and the tension is recorded here rather than resolved silently. **The failure is pre-existing and unchanged in count-of-kind by this report.**

---

## THE HEADLINE

> **Browser verification is restored, and it was an environment problem, not a code problem.**

PROD2 recorded *"No browser verification possible (Playwright Chromium cannot launch: `libglib-2.0.so.0`)"* and shipped without visual evidence. Reproduced exactly:

```
[pid=81925][err] .../chrome-headless-shell: error while loading shared libraries:
libglib-2.0.so.0: cannot open shared object file: No such file or directory
```

Playwright's bundled Chromium is a generic Linux binary; this Ubuntu 24.04 Replit image lacks the system libraries it links against. The fix required **no package installation, no root, and no code change**: the nix store already contains a fully-wired `playwright-browsers-chromium`, so the two bundled binaries under `.cache/ms-playwright` (**gitignored** — not repository content) were pointed at it.

**The result: `chromium.launch()` works unmodified, so all ~28 pre-existing capture scripts are unblocked without editing one of them.** Proven by running an existing script, untouched — `scripts/capture-north2-rooms.ts` captured 5 rooms successfully.

---

## 1. ENVIRONMENT FIX

| | |
|---|---|
| **Symptom** | `chrome-headless-shell` exit 127 — `libglib-2.0.so.0` missing |
| **Cause** | Generic-Linux Playwright binary; host lacks GTK/glib runtime |
| **Fix** | `.cache/ms-playwright/{chromium-1223,chromium_headless_shell-1223}/…` → symlink to `/nix/store/…-playwright-browsers-chromium/chromium-1080/chrome-linux/chrome` |
| **Originals** | preserved in place as `*.unusable` — nothing deleted |
| **Repo impact** | **none.** `.cache/` is gitignored (`/etc/.gitignore:7`) |
| **Verified** | `headless=true` **OK** · `headless=false` **OK** · Chromium `123.0.6312.105` |

Two approaches were rejected: assembling `LD_LIBRARY_PATH` by hand (~30 libraries, fragile) and editing 28 scripts to pass `executablePath` (scope creep, and the mission forbids refactoring). Redirecting the binary fixes the environment **once**, where the defect actually is.

⚠️ **This fix is machine-local and not durable.** It lives in a gitignored cache and depends on a `/nix/store` path that a garbage collection could remove. It restores verification **today**; it does not guarantee CI. See recommendation R1.

---

## 2. BROWSER VERIFICATION RESULTS

Harness: `scripts/experience-verify1-capture-rooms.ts` — follows the conventions the existing scripts already set (port 5000, dev-world login, 1440×900 @2×, `fonts.ready` + settle). It observes and never fixes.

Dev server started (`tsx server/index.ts`), login `200`.

| Room | Path | Status | HTTP | Console | Page errors |
|---|---|---|---|---|---|
| Home | `/home` | ✅ PASS | 0 | 0 | 0 |
| Planner | `/planner` | ⚠️ PASS* | 0 | **1** | 0 |
| Pantry | `/pantry` | ✅ PASS | 0 | 0 | 0 |
| Shopping | `/shopping-workspace` | ✅ PASS | 0 | 0 | 0 |
| Nutrition | `/plant-diversity` | ✅ PASS | 0 | 0 | 0 |
| Diary | `/my-diary` | ✅ PASS | 0 | 0 | 0 |
| Companion | `/home` (overlay) | ✅ PASS | 0 | 0 | 0 |

**7/7 rooms render. Zero HTTP errors, zero uncaught page errors across the whole house.** \*Planner carries one React console warning — D1 below.

### 🔴 The harness lied first, and that is worth recording

The first run reported **Companion PASS**. It was false. `verify-companion.png` was **byte-identical (MD5 `07213eb…`) to `verify-home.png`** — the selector `[data-testid*="companion"]` had matched Home's static **Companion card**, clicked it, and nothing opened.

Corrected to click `button-open-assistant` and then **assert `assistant-panel` becomes visible**. The screenshots now differ (`c2b7a2f…`), and the Companion is genuinely verified.

*A click that changes nothing is not evidence.* This is recorded because the same false-pass shape is what makes a green suite untrustworthy, and it was caught only by comparing checksums rather than believing the word PASS.

---

## 3. SCREENSHOTS CAPTURED

All at 1440×900, `deviceScaleFactor: 2`, in `docs/ui-audit/experience-verify1/`:

| File | Room |
|---|---|
| `verify-home.png` | Home — orchard window, *"Welcome home, Chloe"*, Companion card, Today at a glance |
| `verify-planner.png` | Planner — Week 1, 14/28 meals planned, boost ideas per meal |
| `verify-pantry.png` | Pantry — Larder inventory + Household column |
| `verify-shopping.png` | Shopping — Add mode |
| `verify-nutrition.png` | Nutrition — plant diversity, 75 ingredients |
| `verify-diary.png` | Diary — daily log, health snapshot, daily signals |
| `verify-companion.png` | Companion — panel open over Home |
| `verify-results.json` | machine-readable per-room result record |

**What the screenshots show is a genuinely good product.** Home is calm and warm; the greeting is in the signature hand; the Companion card carries *real* pantry-derived suggestions (*"Plan a meal that uses chickpeas from your pantry"*); the Companion panel closes with the honest line *"Apple can suggest a few actions — nothing changes until you confirm."* The nav is consistent across all seven rooms. Home's *"Your planner isn't linked to the calendar yet"* is **correct behaviour**, not a defect — it is the CONV1 P8 honest-absence for an unanchored planner week (`HT7`).

---

## 4. UX DEFECTS RECORDED

| # | Room | Defect | Severity |
|---|---|---|---|
| **D1** | Planner | React warning: *"Each child in a list should have a unique `key` prop… Check the render method of `WeeklyPlannerPage`"*. Reproducible on every load. Console-only, no visible symptom. **Not located** — the deepest stack frame is `WeeklyPlannerPage` itself, and two static scans (6-line and 22-line windows over every `.map(`) found only data transforms, no unkeyed JSX | Minor |
| **D2** | Shopping | The Add textarea's placeholder (*"milk, eggs / oven chips / bananas, yoghurt"*) is pale grey italic **over the orchard backdrop image** — very low contrast, likely below WCAG AA | Medium (a11y) |
| **D3** | Shopping | Below the Add card the room is a **large empty void** — no empty state, no guidance. Home says *"Nothing to fetch — the cupboards are as you left them"*; the Shopping room itself says nothing | Medium |
| **D4** | Shell | **Home shows a small mark; every other room shows the large full logo.** Home is the odd one out, against the Blueprint's *"the application shell is constant"* | Minor (consistency) |
| **D5** | Nutrition | **1/30 plants · 1 plant category** while the same week shows **75 ingredients**, and the Planner is full of chickpeas, lentils, spinach, tomato, cabbage. Only *Black Pepper* is categorised Plant Based | **Needs investigation** |
| **D6** | Pantry | Inner scroll containers clip rows mid-height (*"garlic"*, *"Fabric conditioner"* cut in half), reading as broken rather than scrollable | Minor |
| **D7** | Planner | Two insight strings truncate mid-word — *"Looking ahead to autumn, you may en…"*, *"At its best in the UK summer — a lo…"* | Minor |

### On D5 — stated carefully, not overclaimed

This *looks* like severe under-counting, but the Diary for this household is **entirely empty** (all five slots), so if plant diversity counts what was *eaten* rather than *planned*, `1/30` may be an honest answer. Against that, the same panel reports *"75 ingredients this week"* and *"3 meals"* for Black Pepper, which suggests it is reading planner meals after all — in which case ~74 ingredients failed to resolve to canonical plant foods.

**Both readings are consistent with what is on screen, and the screenshot cannot settle it.** Resolving it means tracing the plant-diversity source — a data/architecture question, explicitly outside this scope. Recorded as the highest-value recommendation rather than asserted as a bug.

---

## 5. MINOR FIXES COMPLETED

**One, and it is in the harness, not the product:** the false-pass Companion check (§2) was found and corrected before any result was reported.

**No product-code fix was made, deliberately.** Each candidate was assessed and declined for a stated reason:

| Candidate | Why not fixed |
|---|---|
| D1 (React key) | **Could not be located.** Fixing it would mean adding a speculative `key` to a list I have not proven is the offender — a change that could silently mask the real one. Reported with full evidence instead |
| D2 (contrast) | Choosing a contrast treatment over a backdrop image is a **design decision** (UIA owns colour), not a mechanical fix |
| D3 (empty void) | Adding an empty state means **authoring a household-facing string and choosing a surface** — Experience Architecture territory |
| D4 (logo) | Which header is correct is a **brand/shell decision** (UIA § 10) |
| D5 | Data/architecture — see above |
| D6, D7 | Layout and truncation rules are **UI-owned**; both need a design call, not a nudge |

The mission permits fixing *"only minor issues that do not require architectural decisions."* Every product defect found needed one. **Reporting seven real defects accurately is the deliverable; manufacturing a fix to look productive would have been the failure.**

*(Verified-not-assumed: the fragment "I want to support…" on Diary looked truncated and is not — it is an intentional widget label in `nutrition-insights-panel.tsx:59` with a proper ellipsis. Checked before reporting.)*

---

## ARCHITECTURE COMPLIANCE CHECKLIST

- ☑ **One canonical identity** — no entity touched. No product code changed at all.
- ☑ **One owner per fact** — none. The harness reads rendered pages; it owns no fact.
- ☑ **No duplicate entities** — none created.
- ☑ **No duplicate ownership** — none. The harness reuses the login and viewport conventions the existing capture scripts already established rather than inventing rivals.
- ☑ **No duplicate state** — none.
- ☑ **Extends existing architecture** — the environment fix makes the **existing** suite work; the new script follows `capture-north2-rooms.ts`'s established shape.
- ☑ **Progressive enrichment** — N/A.
- ☑ **Knowledge domain compliance** — N/A; no knowledge domain touched.
- ☑ **Honest gaps over fabricated information** — **load-bearing here.** D5 is reported with both readings rather than asserted; the false Companion PASS was retracted rather than kept; "no product fixes" is stated plainly rather than padded.
- ☑ **No permanent synchronisation bridge** — none.
- ☑ **Evolution over replacement** — nothing replaced; the original binaries are preserved as `*.unusable`.

## AI ARCHITECTURE COMPLIANCE

- ✓ **Uses the canonical Intelligence Platform** — no intelligence code touched. The Companion was **exercised**, not modified.
- ✓ **Uses the Capability Registry** — unchanged; no descriptor read or edited.
- ✓ **Uses the Intent Engine** — untouched.
- ✓ **Reuses existing business services** — none modified.
- ✓ **Does not create another assistant** — **none.** The harness opens the existing `FloatingAssistant` and screenshots it; it sends no utterance and adds no conversational surface.
- ✓ **Does not duplicate conversation state** — none touched. No `/conversation/turn` call was made.
- ✓ **Uses registered capabilities only** — none invoked directly.
- ✓ **Uses permission-aware access** — the harness authenticates as an ordinary dev-world household user through `/api/login` and sees exactly what that household sees. No admin route, no elevation.
- ✓ **Produces honest gaps rather than fabricated knowledge** — see D5 and §5.

---

## DEFINITION OF DONE

**What success looks like:** Playwright launches on this machine; the pre-existing capture suite runs unmodified; all seven named rooms are visited, screenshotted and assessed; every defect is recorded with evidence.

**What must not break:** the repository (no tracked file changed by the environment fix), the existing capture scripts, and the product itself — no product code was touched.

**Manual test steps:** §Manual Verification below.

## VALIDATION PERFORMED

| Command | Outcome |
|---|---|
| `chromium.launch()` **before** fix | 🔴 FAILED — `libglib-2.0.so.0`, exit 127 |
| `chromium.launch()` **after** fix, headless | 🟢 **OK** — 123.0.6312.105 |
| `chromium.launch()` **after** fix, headed | 🟢 **OK** |
| `npx tsx scripts/experience-verify1-capture-rooms.ts` | 🟢 **7/7 rooms**, 0 HTTP errors, 0 page errors |
| `npx tsx scripts/capture-north2-rooms.ts` *(pre-existing, unmodified)* | 🟢 **5/5 captured** — proves the fix generalises |
| `md5sum` home vs companion | 🟢 differ after correction (was identical — the false pass) |
| `git status` on `.cache/` | 🟢 no repository change (gitignored) |

**Not run:** `npm test`, typecheck and build — **no product source was modified**, so there is nothing for them to newly assess; the last measurements stand from HOUSE_ACT3 (build 🟢, tsc 94 unchanged, adoption 82/0/0). Mobile viewports, dark mode, and the six rooms outside the mission's seven were **not** verified.

## MANUAL VERIFICATION

**1 — Browser verification runs at all**
- *Start:* repository root, dev server running on 5000
- *Action:* `npx tsx scripts/experience-verify1-capture-rooms.ts verify`
- *Expected:* `login ok (200)` then seven rooms, ending `7/7 rooms clean`
- *Success:* eight files appear in `docs/ui-audit/experience-verify1/`
- *Regression:* `npx tsx scripts/capture-north2-rooms.ts <label>` still captures five rooms — the fix must not be specific to the new script

**2 — The Companion check cannot silently pass**
- *Action:* `md5sum docs/ui-audit/experience-verify1/verify-home.png verify-companion.png`
- *Expected:* the two hashes **differ**
- *Success:* identical hashes mean the panel did not open and the PASS is false, regardless of what the harness printed

**3 — Each room, by eye**
- *Action:* open each of the seven PNGs
- *Expected:* correct room, populated content, consistent bottom navigation, no error state
- *Success:* D1–D7 are the complete defect list; anything further is a new finding

## USER ACCEPTANCE EVIDENCE

**Captured — the first in this sequence of programmes to have any.**

Seven screenshots of a real authenticated household session (`price.single.parent.owner@dev.thehealthyapples.dev`), each reviewed by eye, listed in §3, with a machine-readable record in `verify-results.json`. HOUSE_ACT1, HOUSE_ACT2 and HOUSE_ACT3 all closed with *"no acceptance evidence captured"* because the browser could not start. **That gap is now closed for the seven rooms named.**

**What this evidence does not cover, stated plainly:** desktop 1440×900 light mode only — no mobile viewport, no dark mode, no Cookbook/Analyser/Profile/Admin/food/meal pages, and **no interaction beyond opening the Companion.** Nothing was created, edited or deleted through the UI, so no write path is proven. The three HOUSE_ACT programmes' own manual steps (basket link, room-scoped learning panels, meal uplift) remain **unexecuted** — see R2.

---

## DATA IMPACT

- **Reads existing data:** YES — read-only page loads as one dev-world household.
- **Writes new data:** NO. No form submitted, no mutation triggered; the Companion panel was opened but **no utterance sent**.
- **Changes meaning of existing data:** NO.
- **Requires backfill:** NO.

No schema, migration, route, store or product source was touched.

## TRUST CHECK

- **Could this mislead the user?** No product change was made, so nothing a household sees has changed.
- **Could this fabricate certainty?** This is the programme's main risk and it was actively managed: the first Companion result was a **false PASS**, caught by checksum and retracted; D5 is reported as **two possible readings** rather than a bug; and §5 states plainly that **no product fix was made**.
- **Is anything guessed but shown as real?** No. Every row in §2 comes from a recorded run; every defect in §4 from a screenshot or a captured console message. D1 is explicitly marked **not located**.
- **What happens if the system is wrong?** If the symlinked Chromium diverges from the bundled version, screenshots could differ from production rendering — Chromium 123 vs Playwright 1.60's expected build. Disclosed in R1; adequate for layout/route verification, not for pixel-exact regression.
- **No architectural duplication introduced:** YES.
- **No new source of truth created:** YES.
- **No runtime behaviour altered:** YES — **no product code was modified.**
- **Every "verified" claim backed by a command that ran:** YES; unbacked areas are marked **not run** or **not covered**.

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/EXPERIENCE_VERIFY1-household-experience-verification-20260718` → `8e25c195`
- **Files added:** `scripts/experience-verify1-capture-rooms.ts`, this report, `docs/ui-audit/experience-verify1/*` (8 files, ~4 MB). **No file modified, none deleted.**
- **Rollback command:** `git reset --hard rollback/EXPERIENCE_VERIFY1-…-20260718`
- **To undo the environment fix** (independent of git, since `.cache/` is gitignored):
  ```
  cd .cache/ms-playwright/chromium-1223/chrome-linux64
  rm chrome && mv chrome.unusable chrome
  cd ../../chromium_headless_shell-1223/chrome-headless-shell-linux64
  rm chrome-headless-shell && mv chrome-headless-shell.unusable chrome-headless-shell
  ```
  This restores the original (non-launching) binaries exactly.
- **Verification after rollback:** `chromium.launch()` fails again with `libglib-2.0.so.0` — the pre-existing state.

## SCOPE LOCK

**Implemented:** the environment fix; the verification harness; execution against seven rooms; seven screenshots; seven recorded defects; one harness fix.

**Explicitly excluded — NOT done:**
- Any product-code fix — every candidate needed a design or architecture decision (§5)
- New features, architecture, or AI capabilities
- Community, Partner or Commercial functionality
- Any refactoring
- Mobile viewports, dark mode, and rooms outside the seven named
- Any write/mutation path through the UI
- Investigating D5's plant-diversity source
- CI wiring for browser verification

**Suggestions observed outside scope (not implemented):**
- The harness hardcodes the dev-world credential, as every existing capture script already does — a shared login helper would remove ~28 copies, but that is refactoring
- `docs/ui-audit/` holds ~490 MB of untracked screenshots (flagged in HOUSE_ACT1); this programme added ~4 MB and the directory still has no retention policy

---

## REMAINING UX RECOMMENDATIONS — PRIORITISED

| # | Recommendation | Value | Cost |
|---|---|---|---|
| **R1** | **Make the browser fix durable.** Today's fix is a symlink into `/nix/store` inside a gitignored cache — it survives neither a fresh clone nor a nix GC, so **CI still cannot verify**. Declare the browser dependency properly (`.replit` packages or a documented bootstrap script) | 🔴 High | S |
| **R2** | **Execute the three HOUSE_ACT programmes' manual steps** now that a browser exists — the basket link (ACT1), room-scoped learning panels (ACT2), meal uplift suggestions (ACT3). All three shipped with **no acceptance evidence**; the blocker is gone | 🔴 High | S |
| **R3** | **Resolve D5** — trace whether plant diversity reads planner or diary, and why 74 of 75 ingredients do not resolve to canonical plant foods. If real, the Nutrition room is under-reporting the household's actual variety, which is close to THA's core promise | 🔴 High | M |
| **R4** | **Fix D2 + D3 together** — the Shopping room is the weakest of the seven: an unreadable placeholder above a large void. One design pass fixes both | 🟠 Med-High | S |
| **R5** | **Locate and fix D1** with React DevTools or a keyed-list audit of `WeeklyPlannerPage` | 🟠 Med | S |
| **R6** | **Settle D4** — decide whether Home or the other six rooms carry the correct header mark, then make all seven agree | 🟠 Med | S |
| **R7** | **Extend verification** to mobile viewport, dark mode, the remaining rooms, and at least one write path (add a pantry item, plan a meal) | 🟠 Med | M |
| **R8** | D6, D7 — pantry row clipping and planner insight truncation | 🟡 Low | S |

### Suggested follow-on programme

**`EXPERIENCE_VERIFY2 — Durable Verification`** — R1, R2 and R7 together: make the browser dependency declarable, discharge the three outstanding acceptance debts, and widen coverage to mobile, dark mode and one write path. **R1 first: until the browser survives a fresh clone, every future programme is one environment away from shipping blind again.**

---

## OUTCOME

**The house was looked at, and it holds up.** Seven rooms render with **zero HTTP errors and zero uncaught page errors**; Home is calm and genuinely welcoming; the Companion opens, offers real pantry-derived suggestions, and promises that nothing changes until the household confirms.

The blocker PROD2 hit was **environmental, not architectural** — and fixing it at the environment layer unblocked all ~28 existing capture scripts without editing one line of them.

Seven UX defects are recorded, none critical. **No product fix was made, because every defect found needed a design or architecture decision** the mission placed out of bounds — and saying so is more useful than a change made to look busy.

The most important caution is that the fix is **not durable**: it lives in a gitignored cache pointing at a nix path. Verification works on this machine today. Until R1 lands, it does not work in CI, and the next programme could just as easily ship blind.
