# THA AI Experience & Conversation Architecture

**Status:** GOVERNING ARCHITECTURE — promoted from investigation `TIP3` on 2026-06-30 (GOV-AI1). No code, schema, runtime, or API changes.
**Classification:** Intelligence Governance (canonical)
**Date:** 2026-06-30
**Author:** Architecture investigation (Claude Code)
**Predecessors:** `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (the platform), `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (the registry)
**Governing documents:** `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`

> **What this document is.** TIP1 established the **platform** (one spine: Gateway, Knowledge Plane, Action Plane / Intent Engine). TIP2 established the **contract** (the Capability Registry and the closed `verb × capability` intent taxonomy). TIP3 is the **experience layer**: how a human — by typing, tapping, or speaking, on phone, desktop, or a future device — meets that one platform and feels a single coherent assistant. TIP1 = architecture. TIP2 = registry. **TIP3 = the operating experience.** It designs no new platform, no new owner, no new logic. It designs *how the existing spine is met*.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Git status at start | Working tree contained two untracked files (`docs/investigations/TIP1_...md`, `TIP2_...md`); branch `main` ahead of `origin/main` |
| HEAD commit | `d0a925260c3e8237c3ce423ff4412795ffe35c7d` (`d0a9252`) |
| **Rollback tag created** | **`rollback/TIP3-pre-investigation`** |
| Tag points to | `d0a9252` (commit `d0a925260c3e8237c3ce423ff4412795ffe35c7d`) |
| Action on rollback | `git checkout rollback/TIP3-pre-investigation` (or `git reset --hard rollback/TIP3-pre-investigation`) |
| Code modified | None — this document is the only artifact created |
| Schema modified | None |

**This is an investigation only.** No application code, database schema, services, routes, or prompts were modified. The single output is this document.

---

## ARCHITECTURE COMPLIANCE REVIEW (gate)

Per the standing mandate: *if any proposal fails these principles — STOP, explain, do not continue.* TIP3 was validated against THA's governing principles **before** the experience was designed. Because TIP3 designs *interaction* over the TIP1 spine and the TIP2 registry — introducing no new entity, owner, service, or business logic — it is structurally compliant. The gate confirms it does not drift.

| Principle / required confirmation | TIP3 compliance | Verdict |
|---|---|---|
| **One canonical assistant** | TIP3's central recommendation (Part 1) is **one assistant**, presented through many surfaces. "Planner assistant", "Shopping assistant" etc. are *contextual personas* — UI framings of the one Knowledge+Action spine — not separate agents. | ✅ Pass |
| **One conversation history** | TIP3 defines a **single canonical conversation store** (Part 3) that records *turns and references*, never business data. There is exactly one history per user, threaded by context, not one-per-feature. | ✅ Pass |
| **One Intelligence Platform** | TIP3 adds no platform. Every surface (text, voice, proactive, wearable) is an **edge adapter** in front of the unchanged TIP1 Gateway (TIP1 §11 proved voice is two adapters; TIP3 generalises that to all surfaces). | ✅ Pass |
| **One Capability Registry** | Every action TIP3 describes resolves to a registered TIP2 `(verb × capability)` pair. No surface may execute anything not in the registry. | ✅ Pass |
| **One Intent Engine** | All state changes route through the single TIP1 Intent Engine (parse → resolve → validate → confirm → invoke). Voice and proactive prompts feed the *same* engine. | ✅ Pass |
| **No duplicate interfaces** | Surfaces are *adapters*, not applications. A "Planner assistant" and the "floating assistant" are the same engine with different default context — not two codebases, not two histories. | ✅ Pass |
| **No duplicate business logic** | TIP3 introduces zero domain logic. Context resolution (Part 4) *reads* existing state via existing services; it never stores a second copy of "the active week". | ✅ Pass |
| **Extend existing architecture** | Reuses `access.ts`, the TIP1 Gateway/planes, the TIP2 registry, existing assemblers (`/api/*/intelligence`), `admin_audit_log`. Replaces nothing. | ✅ Pass |
| **Progressive enrichment** | Conversation context is *enriched read state* assembled per-turn from existing owners (TIP1 Principle 4), never a new authoritative store. | ✅ Pass |
| **Honest gaps over fabricated information** | The personality model (Part 11) makes honest uncertainty a *first-class voice behaviour*, and proactive intelligence (Part 10) is silent rather than speculative. TIP2 gaps (Order, Export) surface as honest hand-offs, never faked. | ✅ Pass |

**Gate result: PASS.** TIP3 is an experience and conversation design over the existing spine and registry. It creates no second assistant, no second history of business data, no second platform. The one place a careless implementation *could* violate the principles — letting conversation context become a second store of "the active week / selected meal / current list" — is called out explicitly in Part 4 and Risk R1 as the line to hold. The investigation continues.

---

## GROUNDING — WHAT TIP3 BUILDS ON

TIP3 is not greenfield. It composes two already-grounded layers:

- **From TIP1** — the spine: a **Gateway** (authn, role/tier via `access.ts`, audit, injection scrub), a **Knowledge Plane** (permission-filtered RAG, grounded, honest gaps), an **Action Plane / Intent Engine** (typed intent → existing service), and the proof that **voice is two adapters in front of an unchanged Gateway** (TIP1 §11). Future assistants are *profiles over one spine* (TIP1 §12).
- **From TIP2** — the contract: **13 capabilities** each with one owner; **20 canonical verbs**; the closed **`verb × capability` matrix**; the **confirmation tiers** (None / Light / Required / Strong); the **classification rules**; and the **honest-gap register** (Order, user Export, delete-week object, billing).
- **From the live system** — existing assembled read models the experience consumes but never duplicates: `/api/home/intelligence`, `/api/planner/.../intelligence`, `/api/shopping/intelligence`, `/api/pantry/intelligence`, `/api/meals/:id/intelligence`, the nutrition centre, and `nutrition-knowledge-registry.ts` with its EFSA wording firewall.

**Key framing for the whole document:** TIP3 never asks "what should the assistant *do*?" — TIP2 already answered that (the registry). TIP3 asks "**how should meeting the assistant *feel*, and where does the conversation live, across five years and every surface, without ever forking the platform?**"

---

# 1. EXECUTIVE SUMMARY

The Healthy Apples should present **one assistant** — provisionally **"Apple"** — that appears throughout the product and through voice, and that feels like a single continuous relationship regardless of where it is met. It is not a chatbot bolted onto a screen; it is the **conversational front door to the TIP1 spine and the TIP2 registry**.

Seven commitments define the TIP3 experience:

1. **One assistant, many doorways (Part 1 → Option A).** A single canonical assistant, surfaced through *contextual personas* (Planner view, Shopping view, Nutrition view…). The personas change the *default context and tone framing*, never the identity, the history, or the logic. Separate assistants (Option B) are rejected: they would fork conversation history, duplicate context, and violate "one canonical assistant" and "no duplicate interfaces."

2. **One conversation, threaded by context (Part 3).** A single canonical conversation store records **turns and references** (who said what, which intent ran, which entity was referenced) — and **never business data**. Switching from the Planner to Shopping does not start a new conversation; it shifts the *active context frame* within the same continuous history.

3. **Context is read, never stored twice (Part 4).** "Move *it* to next week", "swap *it* for chicken", "add *it* to shopping" resolve against a per-turn **Context Frame** assembled from existing owners (active planner week, selected meal, current list, household). The Context Frame is *derived read state* (TIP1 Principle 4), rebuilt each turn, never a second copy of the truth.

4. **Voice is another interface, not another application (Part 5).** STT/TTS are edge adapters in front of the unchanged Gateway (TIP1 §11). Voice inherits the *same* intents, the *same* confirmation tiers (TIP2 §5) — read back in full because there is no screen — and adds a **hands-free cooking mode** and **family/accessibility** affordances. It introduces zero new services or logic.

5. **Proactive intelligence is invited, batched, and silent by default (Part 10).** The assistant earns the right to speak. Insights are *summarised* (a daily/weekly digest), never a stream of interruptions; safety-class signals (recalls) are the only immediate exception. Silence on low confidence is a feature, not a failure.

6. **Tone is calm, educational, never judgemental, never alarmist (Part 11).** Confidence is expressed honestly; uncertainty is spoken plainly ("I'm not sure, here's what I do know"); health claims inherit the existing source-gated, EFSA-firewalled registry. Honest gaps over fabrication is a *voice behaviour*, not just a compliance rule.

7. **Delight encourages habits, never gimmicks (Part 12).** Seasonal nutrition summaries, plant-diversity celebrations, cooking milestones and "household favourites" are **projections over existing data** (the same "derived, never owned" rule as everything else) — moments that reward healthier behaviour without inventing a new store or nagging.

**Five-year arc (Part 13):** THA moves from *traditional app* → *AI-assisted app* → *conversational household assistant* → *household intelligence platform* **with no architectural rewrite**, because every step adds an adapter, a persona, or a registered intent over the same spine — never a new platform.

**Recommendation:** Adopt the one-assistant, one-history, context-threaded experience model. Build it on the TIP1 phased roadmap, leading with the read-only grounded assistant (proves grounding before any voice or proactive capability), then the typed Intent Engine, then voice, then proactive digests, then delight, then full personas — each phase shipping a coherent slice of the same assistant.

---

# 2. PART 1 — ONE ASSISTANT OR MANY?

### 2.1 The question

Should THA expose **one assistant** appearing throughout the platform (Option A), or **separate assistants** for Planner, Shopping, Nutrition, etc. (Option B)?

### 2.2 Recommendation: **Option A — one canonical assistant, surfaced as contextual personas.**

There is **one** assistant. What looks like a "Planner assistant" or a "Shopping assistant" is the *same* assistant entered through a different door, arriving pre-focused on a context. Internally there is one Gateway, one Knowledge Plane, one Intent Engine, one conversation history, one personality. The persona is a *presentation choice*, not an agent boundary.

### 2.3 Why Option B is rejected (and why this is a hard gate, not a preference)

Separate assistants would, by construction, violate the governing architecture:

| If we built separate assistants… | Violation |
|---|---|
| Each would accumulate its own conversation history | ❌ "One conversation history" |
| "Add this meal to shopping" would have to hand off between two agents, each re-resolving context | ❌ "No duplicate interfaces" + duplicate context state |
| Each would need its own context model of the active week / selected meal | ❌ "No duplicate business logic" (Part 4 line) |
| A user would learn (and trust) several personalities | ❌ "One canonical assistant"; trust fragmentation (Part 11) |
| Cross-domain intents ("plan a Mediterranean week and build the basket") would span agent boundaries | ❌ breaks the single Intent Engine pipeline |

Per the mandate, a proposal that forks the assistant **must stop**. Option B does. So Option B is not pursued. (This mirrors TIP1 §12 and TIP2 §6: future assistants are *profiles/intent-bundles over one spine*, never new platforms.)

### 2.4 What "contextual persona" precisely means

A persona is a **3-tuple of presentation state**, resolved at the Gateway, never a separate runtime:

```
Persona = ( entry surface , default Context Frame , tone framing )
```

- **Planner persona** — entered from the planner; default context = active planner week; framing = organising, forward-looking.
- **Shopping persona** — entered from the list; default context = current shopping list + retailer prefs; framing = practical, cost-aware.
- **Nutrition persona** — entered from a food/nutrition centre; default context = current food / diary; framing = educational, calm.
- **Household persona** — entered from household settings; default context = household + eaters; framing = inclusive, family-aware.
- **Floating / global persona** — entered anywhere; default context = whatever the current screen exposes; framing = neutral, helpful.

Crucially: the **same conversation history and the same identity carry across personas**. Asking the Nutrition persona "is this good for sleep?" and then opening the planner and saying "add it to Tuesday" is *one continuous conversation* — the planner persona inherits the referenced food from the prior turn (Part 4). That continuity is the entire point of Option A and is impossible under Option B.

---

# 3. PART 2 — AI ENTRY POINTS

### 3.1 The full surface inventory

Every plausible way a human reaches THA Intelligence. Each is an **adapter in front of the one Gateway** (TIP1) — none is a separate brain.

| Entry point | Surface class | Default context | Primary or contextual? |
|---|---|---|---|
| **Floating assistant** (persistent, every page) | Global | Current screen's exposed entities | **Primary** |
| **Voice** (phone, hands-free, future smart-speaker) | Global | Current task / spoken context | **Primary** (becomes co-primary over 5 yrs) |
| **Search** (the existing search box, AI-upgraded) | Global | Query intent | **Primary** |
| **Dashboard / Home** (proactive digest surface) | Global | `/api/home/intelligence` | **Primary** |
| **Planner assistant** (in-context on the planner) | Contextual persona | Active planner week | Contextual |
| **Shopping assistant** (in-context on the list) | Contextual persona | Current list + retailer prefs | Contextual |
| **Nutrition assistant** (in-context on food/nutrition centre) | Contextual persona | Current food / diary | Contextual |
| **Household assistant** (in-context in household settings) | Contextual persona | Household + eaters | Contextual |
| **Quick actions** (chips/shortcuts → pre-filled intents) | Accelerator | Inherited from host screen | Contextual |
| **Mobile** | Form factor (carries any of the above) | Per surface | Primary form factor |
| **Desktop** | Form factor (carries any of the above) | Per surface | Primary form factor |
| **Future wearable / smart display / car** | Form factor (voice-first) | Minimal, voice-driven | Future (Part 13) |

### 3.2 Primary vs contextual — the rule

- **Primary entry points** are always reachable and identity-anchored: **Floating assistant, Voice, Search, Dashboard.** These are the four doorways a user can rely on existing everywhere. They share one history and one personality.
- **Contextual entry points** are *the same assistant pre-focused* by where you opened it (the personas of Part 1). They are conveniences that set the default Context Frame; they are not separate products and must never grow their own history or logic.
- **Quick actions** are not a separate assistant at all — they are **pre-filled intents** (TIP2 `verb × capability` pairs) offered as one-tap accelerators. "Add to shopping", "Swap meal", "Plan next week" are buttons that *seed* the Intent Engine; the confirmation/execution path is identical to typing or speaking it.
- **Form factors** (mobile/desktop/wearable) carry surfaces; they do not *define* assistants. The wearable is voice-first with tighter confirmation, but it is the same Gateway.

### 3.3 Design consequence

Because all entry points feed one Gateway, **adding an entry point is adding an adapter** — never adding an assistant. A future "car mode" or "smart-display widget" is a new adapter + a tightened confirmation profile, not a new platform. This is the architectural payoff of Part 1.

---

# 4. PART 3 — CONVERSATION ARCHITECTURE

### 4.1 Canonical ownership

> **There is exactly one conversation history per user.** It is owned by a single **Conversation store** that records **turns and references** — and it **never duplicates business data.**

A turn records *what was said and what was done*, with **pointers** to the authoritative entities — never copies of them.

```
Conversation (one per user)
 └─ Thread (a context-coherent stretch: a planner session, a shopping run, a nutrition Q&A)
     └─ Turn
         ├─ role            (user | assistant | system)
         ├─ surface         (floating | voice | planner-persona | …)
         ├─ utterance       (text / transcript)
         ├─ resolved_intent (TIP2 verb × capability, or none for chit-chat/Q&A)
         ├─ context_frame_ref (the Context Frame snapshot id used this turn — Part 4)
         ├─ entity_refs[]   (POINTERS: e.g. mealId, plannerWeekId, listId — never the row)
         └─ outcome_ref     (the service result / audit id — never the mutated data itself)
```

**What the conversation store must never contain:** the planner rows, the shopping items, the meal composition, the household roster, nutrition facts. Those live with their TIP2 owners. The conversation holds *references and outcomes*, so that re-rendering a past turn **re-reads** the live entity (and shows it as it is *now*, or flags that it changed) rather than showing a stale fork. This is the single most important compliance rule of Part 3 and is restated as Risk R1.

### 4.2 Threading (not one-history-per-feature)

A naïve design gives Planner, Shopping and Nutrition each their own chat log. That **fragments history and re-creates Option B by the back door.** Instead:

- **One history, many threads.** A *thread* is a context-coherent stretch of the one conversation. Threads are created by *meaningful context shifts*, not by which screen you are on.
- **Context switching** is explicit and cheap: opening the shopping persona mid-planner-conversation does **not** sever history — the assistant carries forward referenced entities (Part 4) and simply notes the frame change ("Switching to your shopping list…"). The thread either continues (if the user is still on the same task) or forks (if the task genuinely changed), but **both live in the one conversation**.
- **Session continuity** survives surface and time: a voice turn in the kitchen and a typed turn on the sofa an hour later are the same conversation. Continuity is anchored to *identity*, not to *session* or *device*.

### 4.3 Conversation types — same store, different default frame

| Conversation type | Default Context Frame | Typical intents (TIP2) | Notes |
|---|---|---|---|
| **Planner conversations** | Active planner week | Generate / Add / Move / Replace / Delete × Planner | Multi-step common ("generate, then swap two, then build basket") |
| **Shopping conversations** | Current list + retailer prefs | Add / Delete / Generate-basket × Shopping | "Order" surfaces as honest hand-off (TIP2 gap) |
| **Household conversations** | Household + eaters | Read / Add / Delete × Household + Planner read | Shared context; multi-member (Part 9) |
| **Nutrition Q&A** | Current food / diary | Read / Explain / Analyse / Compare × Nutrition | Read-only; inherits non-fabrication firewall |
| **Follow-up / clarification** | Inherited from prior turn | (resolves a pending intent) | See §4.4 |

### 4.4 Follow-ups, multi-step, and clarification flows

- **Follow-up questions** ("and what about Friday?", "make it vegetarian instead") resolve against the **prior turn's resolved intent + Context Frame** — the conversation store's `entity_refs` and `context_frame_ref` are what make "it" / "that" / "instead" resolvable (Part 4).
- **Multi-step conversations** chain registered intents; each *state-changing* step still hits its own confirmation tier (TIP2 §5). "Generate next week, swap the two beef meals for fish, then build a Tesco basket" is three intents, each confirmed per its class — not one mega-action. The engine reports per-step success/failure honestly (TIP1 §5.3): no silent partial rollback claims.
- **Clarification flows** are first-class, not error states. Ambiguous resolution ("did you mean Beef Tacos or Fish Tacos?") is a *clarification turn* recorded in the conversation; the pending intent waits, parameters fill, then it proceeds. Clarification is how the assistant stays grounded instead of guessing.

### 4.5 Why this satisfies the principles

One store, references not copies, threads not per-feature logs. Conversation is a *log of interaction over the spine*, never a second owner of the spine's data. The moment a past turn re-renders by reading a cached copy instead of the live entity, Principle 2 is broken — so the store holds pointers only. That is the line.

---

# 5. PART 4 — CONTEXT AWARENESS

### 5.1 The problem

Natural conversation is full of deixis — "**it**", "**that**", "**Saturday**", "**next week**", "**this**". The assistant must resolve:

> "I'm talking about Saturday." · "Move it to next week." · "Swap it for chicken." · "Add it to shopping."

…**without introducing duplicate state.** The hard constraint: the assistant must *know* the active planner week, household, selected meal, selected list and current food — but it must **not store any of them**, because each already has a TIP2 owner.

### 5.2 The Context Frame — derived read state, assembled per turn

The mechanism is a **Context Frame**: a per-turn, read-only snapshot of *pointers* into existing owners, assembled at the Gateway from (a) the surface the user is on and (b) recent conversation references. It is the TIP1 "one assembled read model" pattern (Principle 4) applied to conversation.

```
Context Frame  (assembled fresh each turn, never stored as truth)
 ├─ identity            ← session / access.ts            (who)
 ├─ active surface      ← the adapter (planner page, voice, …)
 ├─ active planner week ← POINTER resolved via planner service   (/api/planner/full)
 ├─ household context   ← POINTER via household service          (/api/household)
 ├─ selected meal       ← POINTER from surface state / last entity_ref
 ├─ selected list       ← POINTER via shopping service
 ├─ current food        ← POINTER from food-detail surface / last entity_ref
 └─ temporal anchor     ← resolved date math ("Saturday", "next week")
```

Every slot is a **reference plus a freshly-read value**, not a copy held by the assistant. "The active week" is whatever the *planner service* says it is at this turn — the Context Frame asks, it does not remember.

### 5.3 Resolving the examples

| Utterance | Resolves using | Result |
|---|---|---|
| "I'm talking about **Saturday**." | temporal anchor + active planner week | sets day slot = Saturday of the active week (read from planner) |
| "**Move it** to **next week**." | `it` ← last `entity_ref` (a planner entry); `next week` ← temporal anchor relative to active week | `Move × Planner` intent, pre-filled, → confirm |
| "**Swap it** for **chicken**." | `it` ← selected meal/entry; "chicken" ← `meal-resolution-service` | `Replace × Planner` (placement) or `Replace × Meals` (composition) — disambiguated by which entity `it` points at |
| "**Add it** to shopping." | `it` ← last referenced meal/food | `Add × Shopping` intent, pre-filled, → light confirm |

The pronoun resolution chain is: **current surface selection → most recent `entity_ref` in the thread → ask for clarification.** Never guess silently when ambiguous (Part 11 honesty).

### 5.4 The non-duplication guarantee

- The Context Frame is **rebuilt every turn** and **discarded after** (only a *reference id* is recorded on the turn for replay — §4.1). It is a cache with a lifetime of one turn.
- "Active planner week" is **never written** by the conversation layer — if the user changes weeks by talking, that is a *planner-service mutation* through a registered intent, and the next turn's frame re-reads the new truth.
- This is the exact line Risk R1 guards: if the assistant ever starts *holding* "the selected meal" as its own authoritative state, it has become a second owner. It must always re-derive.

---

# 6. PART 5 — VOICE EXPERIENCE

> **Voice is another interface, not another application** (TIP1 §11). STT in front of the unchanged Gateway; the same parse → resolve → validate → confirm → invoke pipeline; TTS on the way out. Zero new services, zero new logic, zero new owners.

### 6.1 Voice maps onto the existing pipeline

| Spoken | Pipeline (unchanged from TIP1/TIP2) |
|---|---|
| "Plan next week." | `Generate × Planner` → Long-running → confirm scope aloud → invoke smart-suggest |
| "Move curry to Friday." | `Move × Planner` → resolve "curry" via meal-resolution + Context Frame → confirm aloud → invoke |
| "Add milk." | `Add × Shopping` → Light confirm → invoke |
| "What can I cook tonight?" | `Recommend × Meals` (read) → spoken answer, no confirm |
| "How healthy is bacon?" | `Explain × Nutrition` (read) → spoken, source-gated, EFSA firewall (Part 8) |

### 6.2 Confirmation flow (matters *more* in voice)

There is no screen to glance at, so confirmation is **read back in full** at the tier TIP2 §5 assigns:

- **None** — reads/advice answer immediately ("Tonight you could make…").
- **Light** — single additive write: brief spoken echo + assent ("Adding milk to your list. Okay?" → "yes").
- **Required** — Move/Replace/Generate: full spoken echo of resolved entities ("Move **Chicken Curry** from Wednesday to **Friday** this week — shall I?").
- **Strong** — Delete/Clear/Share/Export/Order: spoken irreversibility warning + itemised scope, explicit assent, **no one-word default to yes** ("That clears **all 7 meals** from next week. This can't be undone. Say *confirm clear* to proceed.").

`Order` remains a TIP2 **gap**: voice prepares the basket and hands off ("I've built your Tesco basket — open it to check out"), never claims to have ordered.

### 6.3 Interruption handling & conversational rhythm

- **Barge-in:** the user can speak over TTS; the assistant stops, listens, re-resolves. A confirmation interrupted is treated as *not confirmed* (fail-safe), never as silent yes.
- **Rhythm:** answers are short by default with an offer to expand ("…want the detail?"). Long nutrition explanations are summarised first, deepened on request — calm, unhurried, never a wall of speech.
- **Repair:** "no, the other one", "actually Thursday" edits the *pending* intent in place rather than restarting — the clarification flow of §4.4 in spoken form.
- **Timeouts:** an unconfirmed state-changing intent expires silently; nothing mutates without explicit assent.

### 6.4 Hands-free cooking mode

A purpose-built voice profile for at-the-hob use:

- **Wholly hands-free:** wake-word or single-tap start; step-by-step recipe narration paced by "next" / "repeat" / "how much?".
- **Read-mostly:** in cooking mode, write intents are minimised and always strong-confirmed (you don't want "delete" misfiring with wet hands).
- **Context-locked:** the frame is pinned to the meal being cooked, so "how long for the rice?" resolves without re-stating the dish.
- **Ambient-tolerant:** robust to kitchen noise; confirms before anything destructive; never auto-advances past a safety-relevant step.

### 6.5 Accessibility & family usage

- **Accessibility is a primary goal, not an add-on:** voice makes the whole registry reachable without fine motor control or reading; TTS pace/verbosity is adjustable; every visual confirmation has a spoken equivalent and vice-versa. This widens who can use THA, which is itself a product value.
- **Family usage:** multiple voices share a household context (Part 9). Speaker-attributed turns (where a device supports it) let "add my daughter's snacks" resolve to the right eater; un-attributed voices default to the household frame and **never** perform privileged or cross-member actions without explicit identification. Child interactions are read-only by default (Part 9).

### 6.6 The architectural proof

Voice required *nothing* below the Gateway to change. If adding voice had forced a change to planner or shopping logic, the layering would be wrong. It does not — which is the standing proof that the experience is interface-agnostic.

---

# 7. PART 6 — PLANNER EXPERIENCE

Conversational planning is the **Planner persona** (Part 1) over capability **C1** (TIP2), using only registered intents — never re-implementing placement logic.

| Spoken/typed | Intent (TIP2) | Feel |
|---|---|---|
| "Generate next week." | `Generate × Planner` (Long-running) | Confirm scope → generate → **show the result before persisting** where possible → "looks good?" |
| "Move pizza." | `Move × Planner` | Resolve "pizza" + ask "to where?" if day missing (clarification, §4.4) |
| "Replace beef." | `Replace × Meals` (composition via swap-engine) **or** `Replace × Planner` (placement) | Disambiguate which "beef" and which sense; confirm |
| "Use more Mediterranean meals." | `Optimise × Planner` (advisory) → then per-change `Replace` intents | Proposes a *set* of swaps; user accepts as a batch or item-by-item |
| "Increase plant diversity." | `Optimise × Planner` reading pantry/plant-diversity intelligence (advisory) | Explains *why* (which plants are thin), proposes additions, confirms each |

### 7.1 How planner conversations should feel

- **Propose, then commit.** Generation and optimisation are *advisory first*: the assistant shows the proposed week/swaps and persists only on assent. This respects the user's authorship of their own plan and avoids destructive surprises.
- **Reasoned, not magical.** "Increase plant diversity" explains the *current* state (read from planner + pantry intelligence) and the rationale for each suggestion — educational (Part 11), grounded, never a black-box reshuffle.
- **Reversible in feel.** Because changes are confirmed per TIP2 tier and bulk changes are strong-confirmed with itemised scope, the user is never surprised by what moved.
- **Continuous with shopping & nutrition.** "…and build the basket" or "…is this week balanced?" flows into the Shopping/Nutrition experience *in the same conversation* (Part 3) — the planner persona hands the referenced week forward, it does not bounce the user to another assistant.

---

# 8. PART 7 — SHOPPING EXPERIENCE

The **Shopping persona** over capability **C2**, honoring the **Order = GAP** boundary (TIP2 §2.4).

| Spoken/typed | Intent (TIP2) | Feel |
|---|---|---|
| "Add bananas." | `Add × Shopping` (Light) | One-line echo, instant |
| "Only Tesco." | `Profile/preferences` read+write (retailer pref) → re-read `/shopping/intelligence` | Sets retailer frame; future suggestions cost-aware for Tesco |
| "Show cheaper alternatives." | `Recommend × Partners` (R+A, advisory) | Reads price/alternatives intelligence; advisory, never auto-swaps |
| "Remove duplicates." | `Delete × Shopping` (Destructive, bulk) | **Strong confirm** with itemised list of what will be removed |
| "Why is this expensive?" | `Explain × Shopping/Partners` (read) | Grounded explanation from price intelligence; honest gap if no data |

### 8.1 Natural shopping workflows

- **Build → refine → hand off.** The natural arc is: assemble the list (from the planner or by voice), refine it (alternatives, retailer, dedupe), then **prepare a basket and hand off to checkout**. "Order" is honestly a hand-off, not a placed order (TIP2 gap) — the assistant says so plainly and never fabricates an order confirmation.
- **Cost-aware, advisory.** Cheaper-alternative and "why expensive" are *advice* (R+A): the assistant explains and proposes; the human decides. No silent substitution of someone's groceries.
- **Bulk safety.** "Remove duplicates" / "clear the list" are strong-confirmed with the exact items named — destructive shopping actions never run on a one-word yes.
- **Continuity from planner.** The most common entry is "build my shopping from next week's plan" — one conversation spanning planner → shopping, carrying the week reference forward (Part 3).

---

# 9. PART 8 — NUTRITION EXPERIENCE

The **Nutrition persona** over capability **C3** — **read-only**, and the most compliance-sensitive surface in the whole product.

| Spoken/typed | Intent (TIP2) | Boundary |
|---|---|---|
| "What foods help sleep?" | `Recommend/Explain × Nutrition` (read) | Grounded in `knowledge_*` via registry; honest gap if unsourced |
| "What should I add?" | `Recommend × Nutrition` reading diary/pantry intelligence | Advisory, personalised to *their* data, gentle |
| "Explain fermented foods." | `Explain × Nutrition` (read) | Educational; sourced |
| "How healthy is bacon?" | `Explain × Nutrition` (read) | **EFSA wording firewall**; balanced, never alarmist |
| "What nutrients am I missing?" | `Analyse/Report × Nutrition` over diary | Gaps framed constructively, not as failure |

### 9.1 Educational experience

The default mode is **teaching, not prescribing.** Explanations are calm, grounded in the source-gated knowledge registry, and *cite their basis* ("based on THA's nutrition knowledge…"). Where the knowledge store has nothing, the answer is an **honest gap** ("I don't have documented guidance on that yet"), never an invented claim — this is the single hardest line in the product and is inherited directly from TIP1 §4.3 / Principle 6.

### 9.2 Coaching experience

Personalised, *advisory*, and opt-in in tone: "what should I add?" reads the user's own diary/pantry intelligence and suggests grounded additions, framed as encouragement ("you're light on leafy greens this week — a handful of spinach would help"). Coaching **never nags, never shames, never diagnoses.**

### 9.3 Recommendation boundaries (non-negotiable)

- **No medical advice, no diagnosis, no treatment claims.** The assistant educates about foods; it does not practise medicine. Health-adjacent questions are answered within the EFSA-firewalled, source-gated registry only.
- **No fabricated nutrition facts.** Every claim flows through `nutrition-knowledge-registry.ts` with its `SourceRef` requirement (TIP1 §4.3). The assistant must not paraphrase a nutrition claim it cannot source.
- **Never alarmist.** "How healthy is bacon?" gives balanced, sourced context — not a scare. Tone rules in Part 11 are binding here.
- **Advisory, not authoritative over the body.** Recommendations are suggestions the user chooses to act on, never instructions.

---

# 10. PART 9 — HOUSEHOLD EXPERIENCE

The **Household persona** over capability **C10**, with shared context and multiple members.

| Spoken/typed | Intent (TIP2) | Feel |
|---|---|---|
| "My daughter won't eat mushrooms." | `Add × Household` (eater preference) | Records a *dislike* on the right eater; influences future planner/recommendations |
| "What can everyone eat?" | `Read/Recommend × Household` via `household-meal-matcher` | Intersects all eaters' constraints; explains exclusions |
| "Plan around holidays." | `Generate × Planner` with household + temporal context | Plans accounting for who's present |
| "Who dislikes this meal?" | `Read × Household` (read) | Names eaters with conflicts; factual, neutral |

### 10.1 Shared context & multiple users

- **One household context, many members.** The household is a *shared* Context Frame (Part 4): planner, lists and preferences are household-scoped where the data model already says so. The assistant reasons over the *whole* household ("what can everyone eat?") via the existing `household-meal-matcher` — never re-implementing the matching.
- **Member attribution.** Where the surface identifies the speaker (login, or voice attribution where supported), per-member actions resolve to the right person. Where it cannot, the assistant defaults to household scope and refuses privileged/cross-member actions without identification.

### 10.2 Family conversations, guest mode, child interactions

- **Family conversations** are inclusive and neutral: "who dislikes this?" is answered factually, never used to single out or shame a family member (Part 11).
- **Guest mode** — a constrained, read-mostly profile for someone using the household's device who is not a member: it can answer general/educational questions and read shared plans, but cannot mutate household data or read another member's private data. (If "guest mode" has no backing permission today, it is recorded as an **honest gap / governed feature request** under Rule 8 — not improvised.)
- **Child interactions** — **read-only and gentle by default.** A child voice (or a child profile) can ask "what's for dinner?" or "is this healthy?" and get age-appropriate, encouraging answers, but cannot delete the week, change subscriptions, or alter another member's data. Destructive and admin intents are never reachable from a child profile.

---

# 11. PART 10 — PROACTIVE INTELLIGENCE

> **The assistant earns the right to speak. Silence is the default; a summary is the norm; interruption is rare and reserved.**

### 11.1 When to speak, when to stay silent

| Signal | Speak immediately? | Default channel |
|---|---|---|
| **Product recall / safety** (recalled product on a list/pantry) | **Yes** — safety class, the one immediate interruption | Direct notification |
| **Low plant diversity** | No | Weekly digest |
| **Missing nutrients** | No | Weekly digest / on nutrition surface |
| **Shopping savings** available | No | Surfaced on the shopping surface / digest |
| **Forgotten staple** (recurring item absent from basket) | Gentle, in-context | Inline suggestion while shopping |
| **Planner imbalance** | No | Weekly digest / when planning |
| **Seasonal suggestion** | No | Seasonal moment / digest (Part 12) |
| **New nutrition knowledge** | No | Digest |

### 11.2 The three rules of proactivity

1. **Silent by default.** No insight is worth interrupting a person for unless it is *safety-relevant* or *explicitly invited*. Low-confidence signals stay silent (honest gaps, Part 11) rather than speculating.
2. **Notifications become summaries.** Individual nudges aggregate into a **daily/weekly digest** (the Dashboard surface, Part 2) — "here's your week" — rather than a stream of pings. This is the difference between an assistant and a nuisance. One thoughtful summary beats ten interruptions.
3. **Interruption is reserved for safety.** Product recalls are the canonical immediate interrupt. Everything else waits for the digest or for the user to be on the relevant surface.

### 11.3 How it stays compliant

Proactive insights are **reads over existing intelligence assemblers** (plant diversity, planner, shopping, nutrition) — they create no new owner and no new logic. A proactive suggestion that would *act* still goes through the Intent Engine with its normal confirmation tier; the assistant never silently mutates data because it "noticed something." Advisory always; autonomous never.

---

# 12. PART 11 — TRUST & PERSONALITY

### 12.1 Tone

**Helpful · educational · encouraging · scientific-but-warm · calm · friendly — never judgemental, never alarmist.** The assistant is a knowledgeable, kind companion, not a nutritionist with a clipboard and not a cheerful gimmick. It informs and encourages; it never shames a food choice, a missed day, or a family member's dislikes.

### 12.2 Confidence & uncertainty language

- **Confidence is graded and honest.** Sourced facts are stated plainly ("fermented foods contain…"). Advisory suggestions are framed as such ("you *could*…"). Low-confidence or unsourced territory is stated as a gap, not dressed up as fact.
- **Uncertainty is spoken, not hidden.** "I'm not certain, but here's what I do know…" / "I don't have documented guidance on that yet." This is the **honest-gaps-over-fabrication** principle expressed as *personality*, not just policy (Principle 6, TIP1 §4.3). A confident wrong answer is the worst outcome the product can produce; the assistant is built to prefer an honest "I don't know."

### 12.3 Educational philosophy & family friendliness

- **Teach the why.** Recommendations come with grounded reasons, so the user *learns*, not just complies. Over five years this is what turns the product from a tool into a habit-builder.
- **Family-safe by construction.** Language is appropriate for children present (Part 9); no alarmism around food; no body/weight judgement; neutral about preferences ("some people don't like mushrooms — that's fine, here's what works for everyone").
- **Never alarmist about health.** Nutrition answers (Part 8) are balanced and sourced; "how healthy is bacon?" is context, not a warning label.

### 12.4 Trust is architectural, not cosmetic

Trust is earned by the *system*, not the wording: grounded answers (Knowledge Plane), honest gaps, mandatory confirmations (TIP2 tiers), the user always in control of mutations, and no cross-household leakage (TIP1 §6). Personality is the surface of a trustworthy machine — it cannot substitute for one.

---

# 13. PART 12 — DELIGHT

> **Delight should reward healthier habits — never become a gimmick, never nag, never fabricate.** Every delight artifact is a **projection over existing data** (the same "derived, never owned" rule as the knowledge index and generated docs in TIP1 §10): it computes a moment from data the user already owns; it stores no new authoritative state.

### 13.1 Delight opportunities

| Opportunity | Derived from (existing data) | Why it builds healthy habits |
|---|---|---|
| **Seasonal nutrition summaries** | diary + nutrition intelligence over a season | Reflection → motivation, tied to seasonal eating |
| **Plant-diversity celebrations** | pantry/plant-diversity intelligence | Celebrates the "30 plants a week"-style goal; positive reinforcement |
| **Food achievements / milestones** | diary + planner history | Marks progress (first month, 50 home-cooked meals) without pressure |
| **"Wrapped"-style report** (seasonal/annual) | aggregate over the user's own year | Memorable, shareable, encourages reflection — *if* genuinely personal, not generic |
| **Cooking milestones** | meals cooked / planner adherence | Rewards the act of cooking, the core healthy behaviour |
| **Household trends & favourites** | planner + household history | "Your family's favourite this season" — shared, inclusive delight |
| **Recipe anniversaries** | first-cooked dates | Gentle nostalgia that nudges re-cooking good meals |

### 13.2 The line between delight and gimmick

- **Reward behaviour, don't manufacture engagement.** A plant-diversity celebration that marks a *real* achievement is delight; a daily "streak" that punishes a missed day is a gimmick (and violates "never judgemental").
- **Earned, occasional, and true.** Delight moments are *rare and genuine* — a seasonal Wrapped, a real milestone — not a constant confetti machine. Frequency is governed by the same restraint as proactivity (Part 10).
- **Personal or not at all.** A "Wrapped" report is delightful only if it reflects *this* household's real year. A generic template is a gimmick. If the data isn't there to make it genuine, the assistant doesn't fake it (honest gaps, Part 11).
- **Never a new store.** These are read projections; they do not create a new owner of "achievements" as authoritative state any more than a generated diagram owns the architecture (TIP1 §10).

---

# 14. PART 13 — FIVE-YEAR VISION

> The whole point of TIP1–TIP3 is that this evolution happens **with no architectural rewrite** — each step adds an *adapter, a persona, or a registered intent* over the same spine.

```
   Traditional application
            │   (screens + buttons; AI absent)
            ▼
   AI-assisted application
            │   add: Knowledge Plane (grounded help) + read-only assistant
            │   surface: floating assistant, AI search
            ▼
   Conversational household assistant
            │   add: Intent Engine (write actions) + voice adapter + context frame
            │   surface: voice, personas, hands-free cooking, household context
            ▼
   Household intelligence platform
            │   add: proactive digests + delight + full personas + new surfaces
            │        (wearable/display/car as adapters)
            ▼
   One assistant, everywhere, that the household trusts
```

### 14.1 Why no rewrite is ever needed

| Evolution step | What is added | What is **never** added |
|---|---|---|
| Traditional → AI-assisted | Knowledge Plane + read-only assistant (1 adapter) | new platform, new owner |
| AI-assisted → Conversational | Intent Engine + voice adapter + Context Frame | duplicate planner/shopping logic |
| Conversational → Household platform | proactive digests, delight projections, personas, new device adapters | second assistant, second history |
| Any future surface (wearable, car, display) | one more **edge adapter** + a tightened confirmation profile | a new brain |

The architecture is *interface-agnostic by construction* (TIP1 §11 proved it for voice; TIP3 generalises it). The five-year journey is a sequence of additions to one spine — **the day any step requires forking the assistant, duplicating history, or copying domain logic, the architecture has failed.** That is the line every future workstream must hold.

---

# 15. RISKS

| ID | Risk | Severity | Mitigation |
|---|---|---|---|
| **R1** | **Conversation/context becomes a second owner** — the store caches "the active week / selected meal / current list" as authoritative instead of pointing at the owner | 🔴 Critical | Conversation holds *references + outcomes only* (Part 3); Context Frame is per-turn derived read state, discarded after (Part 4); re-render re-reads the live entity; code-review gate: "no business data in the conversation store" |
| **R2** | **Assistant forks into many** — a "Planner assistant" grows its own history/logic, recreating Option B | 🔴 Critical | Personas are presentation 3-tuples over one spine (Part 1); one history, threaded (Part 3); gate rejects any second runtime/history |
| **R3** | **Fabricated nutrition/health claims** via the conversational surface | 🔴 Critical | All claims through `nutrition-knowledge-registry` + EFSA firewall + `SourceRef`; honest gap on no source (Part 8/11); inherits TIP1 R2 |
| **R4** | **Voice mis-resolves a destructive intent** (noisy kitchen, mis-hear) | 🟠 High | Strong-confirm read back in full; barge-in = not-confirmed; timeouts fail safe; cooking mode read-mostly (Part 6) |
| **R5** | **Proactive intelligence becomes nagging** | 🟠 High | Silent by default; summaries not pings; interruption reserved for safety/recalls (Part 10) |
| **R6** | **Pronoun/context misresolution** — "it" resolves to the wrong entity and mutates data | 🟠 High | Resolution chain surface→last ref→**ask** (Part 4); confirmation tiers catch it before invoke; never silent guess |
| **R7** | **Cross-member / cross-household leakage** in household & family voice | 🔴 Critical | Member attribution required for privileged/cross-member actions; un-attributed voice = household scope only; child profiles read-only (Part 9); inherits TIP1 R7 |
| **R8** | **Order/Export gap faked** — assistant claims to have ordered/exported | 🟠 High | TIP2 gaps surface as honest hand-offs; never a fabricated confirmation (Part 7/8) |
| **R9** | **Delight becomes a gimmick / streak-shaming** | 🟡 Medium | Reward real behaviour only; rare & genuine; personal-or-not-at-all; never judgemental (Part 12) |
| **R10** | **Persona tone drift** — one surface sounds different, fragmenting trust | 🟡 Medium | One personality spec (Part 11) across all personas; framing varies, identity/voice does not |
| **R11** | **Surface sprawl** — each new device tempts a bespoke assistant | 🟡 Medium | New surface = adapter + confirmation profile only (Part 2/13); gate: no new brain per device |
| **R12** | **Cost/latency** of always-on context assembly + RAG at scale | 🟡 Medium | Reuse existing assemblers/SDKs; cache embeddings; assemble Context Frame from already-served intelligence endpoints; rate-limit at Gateway (inherits TIP1 R10) |

---

# 16. RECOMMENDED PHASED ROADMAP

Aligned to the TIP1 roadmap — each phase ships a coherent slice of **the same one assistant**, proving a discipline before the next adds power. Experience capability is layered onto the platform/registry phases, never ahead of the grounding they depend on.

**Phase E0 — One assistant, one shell (read-only).**
Stand up the single floating assistant + AI search over the TIP1 Knowledge Plane (public knowledge, grounded, honest gaps). One personality spec (Part 11). One conversation store recording turns + references only (Part 3). *Proves: grounding and non-fabrication as a felt experience before any action or voice exists.* *Exit: zero ungrounded answers; one history; no business data in the conversation store.*

**Phase E1 — Context & personas (read).**
Introduce the per-turn Context Frame (Part 4) and contextual personas (Part 1) over read intents. "What's on Saturday?", "is this week balanced?" resolve via existing intelligence endpoints. *Exit: pronoun/context resolution works; personas share one history; Context Frame stores nothing.*

**Phase E2 — Conversational actions (write, on the Intent Engine).**
Wire the assistant to the TIP1 Intent Engine for additive then destructive intents (TIP2 tiers). Planner/Shopping/Nutrition/Household experiences (Parts 6–9) as conversations. Confirmation tiers enforced server-side. *Exit: every action a registered intent; tiers enforced; honest gaps (Order/Export) hand off correctly.*

**Phase E3 — Voice (adapters in front of the unchanged Gateway).**
STT/TTS adapters; full read-back confirmation; barge-in; **hands-free cooking mode**; accessibility + family voice (Part 5). *Exit: voice adds zero services/logic; destructive intents strong-confirmed aloud; cooking mode read-mostly.*

**Phase E4 — Proactive intelligence (digests).**
Daily/weekly summary on the Dashboard; safety/recall as the only immediate interrupt; silent-by-default discipline (Part 10). *Exit: no nagging; summaries not pings; proactive suggestions still route through the Intent Engine to act.*

**Phase E5 — Delight (projections over existing data).**
Seasonal summaries, plant-diversity celebrations, milestones, household favourites, "Wrapped" (Part 12). *Exit: every delight artifact a read projection; no new authoritative store; rare, genuine, never judgemental.*

**Phase E6 — Full personas & new surfaces.**
Planner/Shopping/Nutrition/Household/family personas matured; wearable/display/car as new adapters with tightened confirmation profiles (Part 13). *Exit: each new surface is an adapter only; one assistant, everywhere, one history.*

---

# 17. DELIVERABLES — INDEX

| # | Deliverable | Section |
|---|---|---|
| 1 | Executive Summary | §1 |
| 2 | Recommended Experience Architecture | §2 (Part 1) + §3 (Part 2) |
| 3 | Conversation Architecture | §4 (Part 3) |
| 4 | Context Model | §5 (Part 4) |
| 5 | Voice Experience | §6 (Part 5) |
| 6 | Planner Experience | §7 (Part 6) |
| 7 | Shopping Experience | §8 (Part 7) |
| 8 | Nutrition Experience | §9 (Part 8) |
| 9 | Household Experience | §10 (Part 9) |
| 10 | Proactive Intelligence | §11 (Part 10) |
| 11 | Trust & Personality | §12 (Part 11) |
| 12 | Delight Opportunities | §13 (Part 12) |
| 13 | Five-Year Vision | §14 (Part 13) |
| 14 | Risks | §15 |
| 15 | Recommended Phased Roadmap | §16 |

---

# 18. DEFINITION OF DONE — CHECK

| Requirement | Met by |
|---|---|
| Produce a coherent AI experience architecture | §1–§3 — one assistant, contextual personas, full entry-point map |
| Reuse the Capability Registry | Every action resolves to a TIP2 `(verb × capability)` pair (§7–§10) |
| Reuse the Intent Engine | All mutations route through the single TIP1 Intent Engine (§4.4, §6–§9) |
| Define long-term voice interaction | §6 — adapters, confirmation, cooking mode, accessibility, family |
| Define conversation ownership | §4 — one store, turns + references, never business data |
| Define context handling | §5 — per-turn Context Frame, derived read state, no duplicate state |
| Define proactive intelligence principles | §11 — silent default, summaries, safety-only interruption |
| Produce a phased implementation roadmap | §16 — E0–E6 aligned to TIP1 phases |
| One canonical assistant | §2 (Part 1, Option A) |
| One conversation history | §4 |
| No duplicate interfaces / business logic | Compliance gate; §2.3; Risks R1, R2 |
| Honest gaps over fabricated information | §9, §12, §15 (R3, R8) |
| Creates `docs/investigations/TIP3_...md` | This file |
| Rollback identifier reported before beginning | `rollback/TIP3-pre-investigation` (top of doc, reported before writing) |

---

## APPENDIX — EXPLICIT CONSTRAINTS COMPLIANCE

- ✅ No code modified ✅ No database schema modified ✅ No existing services redesigned ✅ No implementation performed
- ✅ One canonical assistant — Option A; personas are presentation over one spine (§2)
- ✅ One conversation history — single store of turns + references, never business data (§4)
- ✅ No duplicate interfaces — surfaces are adapters, not applications (§2.3, §3)
- ✅ No duplicate business logic — context is derived read state; all actions are registered intents (§4, §5)
- ✅ Always reuse the Capability Registry (TIP2) and the Intent Engine (TIP1) — every action maps to one registered intent
- ✅ Progressive enrichment — Context Frame and delight are per-turn/derived projections over existing owners
- ✅ Honest gaps over fabricated information — personality and proactivity prefer silence/uncertainty to invention (§11, §12)
- ✅ Follows all THA Architecture Principles (compliance gate, top of document)

*Investigation only. No implementation performed. Rollback: `git checkout rollback/TIP3-pre-investigation`.*
