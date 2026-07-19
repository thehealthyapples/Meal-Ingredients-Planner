# COMM2 — Orchard Experience

**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Risk:** 🟠 AMBER
**Reason:** The first surface a household can reach that concerns other households. No new table, no migration, no new endpoint and no new capability — but COMM1's boundary stops being a structural claim and starts being something a person looks at. The amber is for the governed Blueprint amendment and a shared-shell regression (§ 9.4), not for the data.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `rollback/COMM2-orchard-experience-20260719` |
| Commit SHA | `993e1bc8e61a11c245cd35bcb40b5daae39e113f` |
| Rollback to committed state | `git checkout rollback/COMM2-orchard-experience-20260719` |

> **⚠️ The working tree was DIRTY when the tag was created, and the tag covers committed state only.** Five tracked files modified by prior sessions — `.engineering/session/CURRENT.md` and four `data/ws*-report.json` — are **not** covered. They were snapshotted out-of-repo before any edit (`scratchpad/pre-COMM2-snapshot/uncommitted-tracked.patch`, 57 lines) and were **not authored, touched or committed** by this session.

> **✅ Unlike COMM1, this tag separates cleanly.** COMM1 is committed (`be562c94`), so a rollback here discards COMM2 and nothing else.

> **✅ No migration was applied.** The live database was untouched by this workstream — confirmed at boot: `[Migrations] Up to date — no pending migrations`. This is the material difference from COMM1, whose tag could not undo its own migration.

---

## 1. SUMMARY

COMM1 built a boundary and deliberately left it unreachable. COMM2 builds the room on the far side of it, and the whole design problem was that **the interesting content is the absence of content**: a household may learn that it shares a neighbourhood, and nothing else. A social surface with nothing to disclose is either honest or empty, and the difference is entirely in how it is said.

**One room. Four parts. Zero new server surface.**

| | |
|---|---|
| New route | **1** — `/orchard` |
| New nav entries | **1** — the Orchard is a room; the Village and High Street are *inside* it |
| New client page | **1** — `client/src/pages/orchard-page.tsx` |
| New tables / migrations / endpoints / capabilities | **0 · 0 · 0 · 0** |
| Server routes still on `/api/community/*` | **9** — asserted, unchanged |
| New assertions | **91** (69 source-level + **22 DB-backed, two-household**) |
| tsc errors introduced | **0** (88 pre-existing baseline exactly restored) |
| Adoption-register failures introduced | **0** (80·1·9 → 80·1·9, byte-identical, proven against the tag) |

### The scope question, resolved before any code

The brief asked for an Orchard, Neighbourhoods, a Village and a High Street. Read as four places, that collides head-on with four governing rules, and **implementation was stopped and taken to the owner** before a line was written:

1. `THA_EXPERIENCE_BLUEPRINT.md:201` — the orchard is *"experienced through windows and subtle connections, **never walked into**."*
2. § 16 names **"the rendered world"** (*"environment inviting exploration of itself… the person is at home, not in a scene"*) and **"the theme park"** as spatial anti-patterns.
3. § 18 — *"Change enters by governance, never by shipping… A surface that quietly assumes one is a defect regardless of its quality."*
4. `App.tsx:456-461` — the twelve "partners" are **invented businesses on example.com**, withdrawn by PROD2 under Core Principle 6.

**The owner's ruling:** Community remains a single canonical room; the Orchard, Neighbourhoods, Village and High Street are the experience *inside* it, not separate destinations. That admits **one** room to the map instead of three places, and nothing is walked into. It is recorded as a Blueprint amendment (§ 4).

---

## 2. THE LOAD-BEARING DECISIONS

### 2.1 A neighbour is a presence, not a profile

`GET /api/community/:id/members` returns `{ householdId, role }`. There is no name, because `server/lib/community.ts` has no method that returns one — COMM1 § 2.3 built it that way on purpose.

The room therefore renders **"A household"**, four times, with the one that administers the place marked as *"looks after this place"*. That is not a placeholder awaiting real data. It is the disclosure, complete.

**And the room says so out loud:**

> *"THA shows you that you share this neighbourhood, and nothing else. Your neighbours cannot see your name, your household, your plans, your shopping or anyone who eats with you — and you cannot see theirs."*

The privacy boundary is the product here, so it is stated rather than merely enforced. A household that cannot tell whether it is exposed will assume it is.

### 2.2 The invitation gate — why there is no Join button in the list

`GET /api/community/invitations` deliberately strips the token (COMM1 § 5: *"a live bearer token sitting in a file is a standing grant to join a community"*). So the list can honestly report *that* something is waiting, but it **cannot hold the means to accept it**.

The token's only honest source is the link the household was sent. The room reads `?invitation=<token>`, shows the gate, and **clears the token from the URL the moment it is spent** — it is single-use, and a bearer grant has no business lingering in browser history. It is never written to `localStorage`, `sessionStorage` or a cookie (asserted).

### 2.3 There is no invite form, and that is a finding

`POST /api/community/:id/invitations` takes a numeric `householdId`. **A household has no way to learn another household's id** — deliberately, because COMM1 § 2.4 made communities probe-resistant.

Building a form for an id nobody can obtain would be a door onto a wall. It is left unbuilt and reported (§ 11.1). This is the one objective in the brief that the foundation cannot currently support, and the gap is in COMM1's invitation model, not in this room.

### 2.4 The High Street is real, because there are two different "partners"

The brief said *integrate Partners*. The repo contains two unrelated things with that name, and the distinction is the difference between shipping and refusing:

| | What it is | Used? |
|---|---|---|
| The `partners` **capability** | *Partners / Supermarkets* — nine real UK retailers via `getBasketSupermarkets()`, already live in Shopping | ✅ **Yes** |
| `client/src/data/partners.ts` | Twelve invented wellness businesses on `example.com`, route withdrawn by PROD2 under Core Principle 6 | ❌ **No** |

The High Street shows the nine real shops and **does no shopping**: Shopping owns the basket and keeps it, reached by one door. Duplicating the work here would have given one job two owners.

Asserted: the room does not import `@/data/partners`, and the string `example.com` appears nowhere in its code.

### 2.5 Exposure E2, opening to E3 when empty

The Orchard is a reflective room, not a dense working one — E2, "the window". When the household belongs to no neighbourhood it opens **one** level to E3, which is § 6.2 rule 2 used exactly as written (*"one level, never two"*).

**This is the state almost every household is in today**, so it received the most care:

> *"Your orchard is quiet. You don't belong to a neighbourhood yet. When someone invites your household to one, it will be waiting here."*

No manufactured urgency, no "get started", no invitation to go and find people. INTLANG1: a gap is spoken as a gap, and silence is a valid complete answer.

**The room renders no orchard, no village, no street, no map and no dwelling.** Its place-words are feelings to design toward, per the preamble to § 5.1. Asserted: no `<svg>`, no `background-image`, and none of the canonical orchard exports — the adoption register still reports `[orchard-environment]` adopted by exactly **3** modules, so this room did not become a sixth bypass of the owner.

---

## 3. WHAT THE TYPE SYSTEM AND THE PLATFORM CAUGHT

As with COMM1, several decisions were made by the existing architecture refusing the first attempt.

**1. `Button` requires an explicit `variant`.** Not optional — `ButtonProps` omits the default so a surface must *declare* its primary action (PX1-W4.6): *"`variant="default"` is a statement, not an accident."* Two buttons failed to compile until the room decided what its one obvious next thing was, per surface. The Village's is **Join**; the High Street's is **Go to Shopping**.

**2. `LoadError` takes `what`, not `message`** — *"what could not be loaded, **as the household would name it**"*. The component's own type forced "your orchard" and "that neighbourhood" in place of the developer-voiced strings first written.

**3. COMM1's scope lock fired, exactly as designed.** `test-comm1-community-foundation.ts:198` asserted `companionDomain === "platform"`. It is the reason this change could not be made quietly, and it is **updated, not deleted**, with the reasoning recorded in place (§ 4). A scope lock edited in silence is a scope lock that has been defeated.

**4. My own first test suite was wrong, and its failures were the useful kind.** Six assertions failed on the *comments that document the rules they assert* ("no message surface", "the port returns no name", "invented businesses on example.com") and on `LoadError message=`. Word-matching source was the wrong instrument. They were rewritten to run against **code with comments stripped**, and to test structurally — *is there anywhere to compose, and anywhere to send* — rather than lexically. That is a better test than the one originally intended.

---

## 4. THE GOVERNED CHANGES — two, both recorded

### 4.1 Blueprint § 5.1 — the Orchard admitted to the map of the house

One row added, plus an amendment note stating what was admitted (**one room, not three places**), the naming tension with § 6's orchard (this room *is not that orchard and does not draw it*), the exposure level, and what is **not** admitted — messaging, feeds, sharing, Community Intelligence, inter-household exchange.

| Domain | Place | Exposure | Light | Ground | Living Detail |
|---|---|---|---|---|---|
| **Orchard / Community** | The room that looks outward | **E2** (E3 when empty) | The same morning, arriving from further off | Ground plane; neighbours as presences on it | The neighbourhood is inhabited |

### 4.2 Community becomes a Companion room

COMM1 declared `companionDomain: COMPANION_PLATFORM` on **one stated ground** — *"there is no page to land on."* COMM2 built the page, so the ground is spent and the declaration moves with it.

Three files change together, and the test asserts that they must:

| File | Change |
|---|---|
| `server/intelligence/types.ts` | `COMPANION_ROOMS` 7 → **8** (`community`) |
| `server/intelligence/capability-registry.ts` | `companionDomain: "community"` |
| `client/.../companion-card.ts` | `DOMAIN_LANDING.community = "/orchard"` |

**Why they move together:** `domainLandingPath()` falls back to `"/"` rather than throwing, so a room admitted to the type and forgotten in `DOMAIN_LANDING` silently routes every Next Step home — structurally the same failure BEH-8 deleted the old `CAPABILITY_DOMAIN` table to prevent. The suite now asserts the invariant **for all eight rooms**, not just this one.

**Community gained a destination, not a verb.** `supportedIntents: ["read"]` and `capabilityClass: "read-only"` are unchanged and re-asserted. The Companion may route a household *to* the Orchard; it still cannot join, leave, invite, or read another household's anything.

**Deliberately NOT added to `DISCOVERY_DOMAINS`.** A discovery domain is searchable; Community exposes no searchable entity, only membership. A room may be a destination without being a search result.

---

## 5. DATA IMPACT

**New entities: none. Migrations required: none. Backfill: none.**

COMM2 is a pure consumer of COMM1. Asserted mechanically, because "we didn't add any" is the kind of claim that rots:

- still exactly **9** `/api/community/*` routes
- still exactly **3** Community tables
- `server/lib/community.ts` untouched, still declaring `COMMUNITY_READABLE_TABLES`
- the room reaches **only** four declared paths: the three COMM1 routes plus `/api/basket/supermarkets-enhanced`

**GDPR:** unchanged. COMM2 introduces no personal data category; the room renders `{householdId, role}`, which `community-membership` already covers in `server/privacy/personal-data-registry.ts`.

---

## 6. TRUST CHECK

Every row below is now backed by a **runtime, two-household** assertion (§ 9.2), not only by source inspection.

| Question | Answer |
|---|---|
| Can one household read another's data through the room? | **No.** B receives exactly `{householdId, joinedAt, role}` about A — asserted field-by-field against live Postgres |
| Does A's household *name* reach B? | **No.** Proven by absence: the fixture name carries a reserved marker, and that marker appears nowhere in what B receives |
| Can a non-member see who is in a community? | **No.** An empty list, not a filtered one |
| Can a household discover communities it is not in? | **No.** "Not yours" and "does not exist" return the identical answer |
| Can a leaked token admit the wrong household? | **No.** A third household holding B's token is refused, and no membership is left behind |
| Can a token be replayed? | **No.** Single-use, verified at runtime |
| After leaving, can a household still see the members? | **No** — and A can no longer see them either. A departure is symmetric (**the SEC1 lesson, one level up**) |
| Can a community be stranded unadministrable? | **No.** The last owner cannot leave |
| Can the Companion write to Community? | **No.** Read-only at the registry, before any handler runs |
| Does the room hold a bearer token anywhere? | **No.** Not in storage, not in a cookie, and not in the URL once spent |

### The prior decision this workstream still runs against

`LAUNCH1` rates inter-household community *"5% complete, priority Low"* and recommends **not building it for launch**, citing moderation and liability over allergy data. COMM1 recorded that disagreement as unresolved and deferred it to *"whoever builds the first capability that crosses the boundary."*

**COMM2 is that capability, so the debt is called here.** The judgement taken: LAUNCH1's risk begins at **user-generated content**, and this room contains none — no message, no post, no photo, no recipe, no profile, nothing a household types that another household reads. The only inter-household fact in the product is *"we are both in this neighbourhood."* There is no moderation surface because there is nothing to moderate.

**That remains a decision about where the risk starts, not proof it never starts.** The first feature that lets one household put *content* in front of another inherits LAUNCH1 whole, and should not treat this room as precedent.

---

## 7. CHANGES MADE

### Created (4)

| File | Purpose |
|---|---|
| `client/src/pages/orchard-page.tsx` | The room — overview, Neighbourhoods, Village, High Street |
| `server/tests/test-comm2-orchard-experience.ts` | 69 assertions |
| `server/tests/test-comm2-orchard-isolation.ts` | **22 DB-backed, two-household** assertions |
| `scripts/capture-comm2-orchard.ts` | Browser verification harness |

### Modified (10)

| File | Change |
|---|---|
| `client/src/App.tsx` | One lazy import, one route |
| `client/src/components/nav-bar.tsx` | One `NAV_ITEMS` entry, one realm tint, **`overflow-x-auto` on the nav row (§ 9.4)** |
| `client/src/components/workspace-header.tsx` | `PageRealm` += `orchard` |
| `client/src/components/conversation/FloatingAssistant.tsx` | Surface, label, quick actions |
| `client/src/components/conversation/companion-card.ts` | `DOMAIN_LANDING.community` |
| `server/intelligence/types.ts` | `COMPANION_ROOMS` += `community` |
| `server/intelligence/capability-registry.ts` | `companionDomain: "community"` |
| `server/tests/test-comm1-community-foundation.ts` | **The scope lock, updated deliberately** (§ 3.3) |
| `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` | § 5.1 row + amendment note |
| `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` | Domain 37 — first client consumer, disclosure rule, Companion room |

### Deliberately NOT built

- **Messaging, feeds, posts, recipe sharing, planner sharing, Community Intelligence, inter-household data exchange.** Scope lock. Asserted structurally: nothing to compose (`<textarea>`, `<form>`, `contentEditable` all absent) and nothing to send (the room's only two mutating calls are *answer an invitation* and *leave*).
- **An invite form** — § 2.3. The id it would need is undiscoverable by design.
- **The withdrawn wellness partners** — § 2.4.
- **A `/village` or `/high-street` route, or nav entry.** Asserted absent.
- **Marking which presence is your own household** — § 11.2.
- **Creating a neighbourhood from the UI.** `POST /api/community` exists, but a household that creates one cannot then invite anyone into it (§ 2.3), so the room would offer a dead end. Left until invitation is reachable.

---

## 8. INTEGRATION WITH THE INTELLIGENCE PLATFORM AND THE COMPANION

No new capability. Live capabilities remain **23** — none of the twenty-plus count locks needed touching, which is the correct signal for a workstream that added a surface rather than a capability.

The Companion integrates by **routing** and by **standing in the room**: `useSurface()` recognises `/orchard`, the surface is labelled, and its three quick actions are bounded by what the capability can actually answer — its three read scopes. No quick action asks about another household, because a quick action the capability must gap is a promise the room breaks.

The room publishes **no** companion context pointer. A community is not an entity the Companion can act on, and an absent pointer is always safer than a guessed one.

---

## 9. VALIDATION PERFORMED

### 9.1 Suites

| Check | Result |
|---|---|
| `npm run test:comm2-orchard-experience` | **69 passed, 0 failed** |
| `npm run test:comm2-orchard-isolation` (DB-backed) | **22 passed, 0 failed** |
| `npm run test:comm1-community-foundation` | **81 passed, 0 failed** |
| `npx tsc --noEmit` | **88 — pre-existing baseline exactly restored, 0 introduced** |
| `npm run build` | ✅ clean |
| `npm run verify:coherence` | **2 failures — unchanged.** Both pre-existing (Domain 34; `pantry-intelligence-assembler.ts`), identical to COMM1's recorded baseline |
| `npm run adoption:check` | **80 passed · 1 notice · 9 failed — byte-identical to the tag** (verified by running the gate in a clean worktree at `993e1bc8`). `[orchard-environment]` still passes at 3 modules |
| Companion & platform | `companion-card` 36/36 · `companion-guidance` 74/74 · `native-discovery` 81/81 · `intelligence-platform` 33/33 · `registry-executability` 129/129 · `mat1` 25/25 · `partners-binding` 30/30 |
| Prior work | `home2` 47/47 · **`sec1-departed-member` 17/17** · **`bus1-trust-and-compliance` 42/42** |

### 9.2 The two-household isolation test — COMM1 § 11.1, closed

COMM1 named this as the thing that *"should exist before any capability crosses the boundary."* COMM2 is that capability, so COMM2 owed it. It creates three real households, drives the real owning service, and asserts on real return values:

- ✓ a non-member reading a community gets **null**; a stranger gets null; a non-existent community gets **the same null** — the platform cannot be enumerated
- ✓ a non-member's member list is **empty**, not filtered
- ✓ a household holding **someone else's token** is refused, and leaves no membership behind
- ✓ after B joins, what B receives about A is **exactly `{householdId, joinedAt, role}`** — asserted key-by-key
- ✓ **A's household name does not appear in it** — proven by the absence of a reserved fixture marker
- ✓ the token cannot be replayed
- ✓ the last owner cannot leave
- ✓ after B leaves, **B cannot see the members and A cannot see B** — the read and the write agree about who is at the table
- ✓ **fixture rows remaining: 0** — teardown in `finally`, assertions scoped to this run's ids, never global counts (COMM1 § 9's lesson about BUS1's poisoned runs)

### 9.3 Manual verification — the room, in a browser

Driven with Playwright against the running app as a real authenticated household (`scripts/capture-comm2-orchard.ts`); captures in `docs/ui-audit/comm2-orchard/`.

- ✓ **Empty state renders for the real dev household** — which genuinely belongs to no neighbourhood. This is the true state of every household today, and it is the one that was designed hardest
- ✓ Overview, a neighbourhood, the Village and the High Street all render at desktop and mobile
- ✓ **4 presences, none nameable**, one marked as administering the place
- ✓ the privacy note is present on the neighbourhood view
- ✓ **9 retailers, real and unmocked** — served by the live `partners` capability, not by fixtures
- ✓ the **invitation gate appears** when arriving by `?invitation=<token>`, and not otherwise

> **An incident worth recording.** The first capture run reported the empty state absent and the gate absent, and both were *false negatives*: a **stale server process** was serving from before COMM1's routes existed, so `/api/community` fell through to Vite's HTML catch-all and every query errored. The room was rendering its error state correctly. Restarting the server produced the true result. Reported because the failure looked exactly like a page bug and was an environment bug — and because it is the reason `npm run dev` reported `EADDRINUSE` earlier in the session.

### 9.4 🟠 A REGRESSION I INTRODUCED, AND ONLY PARTLY FIXED

**Adding a ninth room broke the bottom nav on small screens.** Nine items at the **44px touch-target floor** need 396px; the narrowest supported viewport is 390px. The row overflowed and **clipped** — "Orchard" rendered as "Orchar", and the Cookbook/Shopping labels collided. This was found by looking at the screenshots, not by any test.

**It is not a label problem.** `min-w-[44px]` is the binding constraint, and shrinking it was refused: accessibility floors are among the shell constants Blueprint § 5.2 says may **never** vary, and a tenth room would break it again anyway.

**What was done:** `overflow-x-auto` on the nav row (mobile only; `md:` and above are byte-identical). Nothing is clipped and every room is reachable.

**What is still true, and is the honest part:** at rest on a 390px screen the row still *looks* cramped, the last item sits partly off-screen, and two labels nearly touch. **This is a shared shell, so the cost is paid by every room, for a room most households will find empty.** The nav was not like this before COMM2.

This is a product decision rather than an engineering one, and it is **left open for the owner** — options in § 11.4.

---

## 10. DEFINITION OF DONE

| Objective | Status |
|---|---|
| Orchard experience implemented | ✅ One room, `/orchard` |
| Orchard overview | ✅ Neighbourhoods, and what is waiting |
| Households represented within the Orchard | ⚠️ **Yes, as presences** — the only representation the boundary permits. Own household not distinguished (§ 11.2) |
| Neighbourhood navigation | ✅ Inside the room, as state — never routes |
| Village and High Street | ✅ Both, inside the one room |
| Partners integrated into the High Street | ⚠️ **The real capability, yes** — nine live retailers. The twelve invented partners stay withdrawn (§ 2.4) |
| Community integrated with Companion | ✅ Room, landing route, surface, bounded quick actions |
| Community Foundation reused | ✅ Zero new server surface — asserted |
| Intelligence Platform reused | ✅ No new capability; live count still 23 |
| Household privacy boundaries preserved | ✅ **Proven at runtime with two real households** (§ 9.2) |
| Manual verification completed | ✅ Browser, real session, all states (§ 9.3) — and it is how § 9.4 was found |
| Implementation report | ✅ This document |

**Architecture compliance:** one Orchard owner (`orchard-page.tsx`) · one Community owner (`server/lib/community.ts`, untouched) · one Household owner (Domain 16, untouched) · no duplicate navigation (one `NAV_ITEMS` entry, no `/village` or `/high-street`) · no duplicate Community entities (3 tables, unchanged) · household-first (membership grain untouched) · technology quiet (no scene rendered, no animation) · hospitality before productivity (the room greets before it asks; the empty state offers nothing).

---

## 11. SCOPE LOCK AND FOLLOW-ONS

**Held.** No messaging, feeds, recipe sharing, planner sharing, Community Intelligence, or inter-household data exchange — asserted structurally, not merely stated.

### Follow-ons — reported, not built

1. **🔴 A household cannot invite anyone.** The blocking gap. `inviteHousehold` needs a numeric `householdId` that no household can discover, so the invitation lifecycle is reachable only by someone with database access. Until this is solved, **the Orchard is a room almost every household will find empty**, and the empty state is doing nearly all the work. Solving it is a COMM1-side design problem — a targeted, consented, non-enumerable way for one household to name another — and it should not be solved by exposing household ids.
2. **The room cannot mark which presence is yours.** It says *"4 households here, yours among them"* — true, and the best available — but the client never learns its own `householdId` from the routes it reads. Fixable by returning it from the members route; deliberately not done here, because it is a COMM1 route change and this workstream committed to adding no server surface.
3. **No route-level integration test.** The nine routes remain asserted by source inspection and now by service-level runtime tests, but not by driving HTTP with two authenticated sessions.
4. **🟠 The bottom nav at nine items (§ 9.4).** Owner decision. Options: (a) keep the scroll — nothing is hidden, but the shell is visibly tighter for everyone; (b) render a chosen subset in the bottom nav via `roomsByHref`, as Home already does for its doors, and reach the Orchard from Home and the Apple menu — cleaner nav, but a room absent from primary navigation, and a silent-drop risk if a future room is added to `NAV_ITEMS` and forgotten; (c) revisit whether the Orchard belongs in primary navigation at all before it has anything in it.
5. **BUS1's global assertions** — still fragile, unchanged by this workstream. COMM1 § 9 has the detail.

---

## 12. THE HONEST STATE OF IT

The room is real, reachable, and behaves correctly in a browser. The privacy claim that COMM1 could only make structurally is now proven at runtime with two real households, which is the single most valuable thing in this workstream and the reason its 22 smallest assertions matter more than its 69 largest.

Four things a reviewer should weigh:

- **The Orchard is, for now, a beautifully-built empty room.** Nobody can invite anybody (§ 11.1). Every household that opens it today sees the empty state — which is the state that got the most design attention, and that is the right allocation, but it should not be mistaken for a working community feature. What has been built is the *place*; the *joining* is still only reachable by SQL.
- **I degraded a shared shell and could not fully undo it** (§ 9.4). Nine rooms do not fit a 390px viewport at an accessible touch target. The scroll is a mitigation, not a fix, and every room pays a little for this one. It is flagged rather than absorbed, and the alternatives are laid out for a decision.
- **The strongest claims are still negative ones.** Runtime proof is a real advance on COMM1's source-level assertions, but "no method could return more" remains proven by the absence of methods. SEC1 is the standing reminder of what confidence in absence is worth.
- **LAUNCH1's warning is now closer than it was.** This workstream judged that the risk begins at user-generated content and that a room with none does not trigger it. That judgement is recorded, not settled, and the next feature that puts one household's *words* in front of another inherits it whole.
