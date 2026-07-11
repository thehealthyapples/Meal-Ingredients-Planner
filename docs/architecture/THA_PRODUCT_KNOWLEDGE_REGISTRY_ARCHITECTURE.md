# THA Product Knowledge Registry Architecture

**Status:** GOVERNING ARCHITECTURE — established by workstream `PKR1`, 2026-07-11. No code, schema, runtime, or API changes. The registry itself is **defined here and populated nowhere** — population is future work.
**Enhanced:** 2026-07-11 (`PKR2`) — Permission-Aware Product Knowledge (§11), The Registry as Companion Knowledge (§12), and Engineering Governance (§16). **`PKR2` amends the `PKR1` boundary that forbade any runtime read of the registry — see §3.3, which records what changed and why.**
**Placed under the platform-wide law:** 2026-07-11 (`PKR3`) — [`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`](./PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md) §9 admits **Product Knowledge** as a first-class platform knowledge domain and names **this registry its canonical owner**. `PKR3` adds no rule to this document and restates none of it (§4.1).
**Classification:** Platform Governance (canonical, cross-cutting — applies to every product surface, capability, and message THA ships)
**Governing documents:** [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md), [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](./THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md), [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md), [`REPOSITORY_CONVENTIONS.md`](./REPOSITORY_CONVENTIONS.md)
**Peers:** [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](./THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (Intelligence), [`THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`](./THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md) (Grounding), [`THA_COMPANION_PLATFORM_ARCHITECTURE.md`](./THA_COMPANION_PLATFORM_ARCHITECTURE.md) (Companion), [`THA_EXPERIENCE_ARCHITECTURE.md`](./THA_EXPERIENCE_ARCHITECTURE.md) (Experience), [`THA_UI_ARCHITECTURE.md`](./THA_UI_ARCHITECTURE.md) (UI)
**Rollback:** `rollback/PKR1-product-knowledge-registry-20260711` → `a432400`

---

## 0. MANDATE

**THA knows a great deal about food, and almost nothing about itself. Every fact about the product — every page, journey, capability, dialog, notification, integration, benefit, claim, and screenshot — must have exactly one owner, in exactly one place, kept current as a condition of Definition of Done. That place is the Product Knowledge Registry. It is the single source of truth for what THA is; the Intelligence Platform queries it; and what any person is shown from it depends on who they are.**

---

## 1. WHAT THIS DOCUMENT IS

This document is the governing architecture for **the product's knowledge of itself**.

THA has rigorous, enforced governance for knowledge *about the world*: the Source of Truth Register names one owner per data domain; the Platform Knowledge Completion Architecture names one adapter per knowledge type; NK1 and NK2 govern nutrition knowledge; the Intelligence Platform governs what the model may read. Every fact about food has a home.

No equivalent exists for knowledge *about The Healthy Apples*. Today, the answer to "what pages does THA have?", "what does the Companion actually do?", "what do we claim in marketing?", "which journeys exist?", or "what is this dialog for?" is reconstructed — every time it is asked — by reading code, grepping routes, and searching 380+ investigation files. The answer is rediscovered, never retained. Two people asking the same question in the same week get different answers, and neither is wrong, because there is nothing to be right against.

More consequentially: **the Companion cannot answer a single question about THA.** It can explain a nutrient and plan a week, but asked "how do I add a family member?" or "what does Plant Diversity actually count?" it has nothing to read, because the product has never written itself down. The knowledge it would need does not exist in any form it can consume.

This document establishes the **Product Knowledge Registry** as the single canonical owner of that knowledge, fixes the rules that keep it true, and defines how the Intelligence Platform reads it — permission-aware, so that what a person is told about THA depends on who they are.

It is deliberately **not**:

- **a feature roadmap** — the roadmap is [`THA_MASTER_EVOLUTION_ROADMAP.md`](./THA_MASTER_EVOLUTION_ROADMAP.md); the registry records what *is*, not what is *planned*;
- **a second source of truth for data** — the Source of Truth Register owns which store owns which fact, and remains the senior rule (§4.2);
- **a permission system** — it *classifies* what may be shown to whom; it never *decides* who anyone is. `server/lib/access.ts` remains the sole authority on identity and role (§11.4). This distinction is the safety property the whole of §11 rests on;
- **a design or behaviour specification** — the Experience and UI Architectures own how THA behaves and looks; the registry records *that a surface exists and what it is for*, never *how it should be designed*;
- **an investigation archive** — investigations are point-in-time analysis and stay where they are (§5);
- **a code index** — it points *at* code, and never restates it.

> **What this document is.** The governing definition of the Product Knowledge Registry: its purpose, scope, sections, ownership rules, permission model, Companion integration, governance, lifecycle, and the folder structure it will occupy. Every future statement THA makes about itself — to a person, to an admin, or through the Companion — is made under this document. A document, claim, or inventory that conflicts with the registry must **STOP, explain why, and not continue until approved** — and the resolution is always to correct one of them, never to let both stand.

**This document creates no registry content.** It does not create `docs/product/`. It does not populate a single entry. It builds no query path and registers no capability. It defines the architecture that future investigations will fill and future implementations will maintain.

---

## 2. PURPOSE

The registry exists to make six things true that are not true today.

| # | Purpose | The failure it ends |
|---|---|---|
| P1 | **THA can state what it is** — completely, currently, and in one place | Product scope is reconstructed from code on every ask, and the reconstruction is never the same twice |
| P2 | **Every product concept has exactly one owner** | A page, a capability, or a claim is described in four documents that quietly disagree |
| P3 | **Product knowledge survives its author** | What a hidden admin surface is for lives only in the memory of whoever built it |
| P4 | **The product can be read by machine** | No agent, test, audit, or release process can enumerate THA's surfaces without guessing |
| P5 | **The Companion can explain THA** | Asked how THA works, the Companion has nothing to read — so it either says nothing useful or invents an answer |
| P6 | **Product truth stays current by construction** | Documentation decays because nothing makes updating it a condition of finishing |

P6 is the load-bearing one, and `PKR2` raises its stakes considerably. Every rule in §13–§16 exists to make the registry expensive to leave stale and cheap to keep true. Under `PKR1` a stale entry misled a *reader*. Under `PKR2` it misleads a *household*, in the Companion's voice, with the product's authority behind it (§12.5).

---

## 3. SCOPE

### 3.1 In scope — what the registry owns

The registry owns **every fact about The Healthy Apples as a product**: what surfaces exist, what they are for, who they serve, what they are called, what they claim, what they connect to, who may be told about them, and who owns each of those answers.

The canonical sections are fixed in §8. Nothing outside them is registry content; nothing inside them is owned anywhere else.

### 3.2 Out of scope — what the registry never owns

| The registry does not own | Its owner |
|---|---|
| Which store owns a business fact | [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](./THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md) |
| **Who a user is, and what role they hold** | **`server/lib/access.ts` — `isAdmin()`, `getTier()`, `hasPremiumAccess()`, `assertAdmin()`** |
| Runtime capability metadata, intents, permissions | `server/intelligence/capability-registry.ts` (Runtime Capability Registry) |
| What the model reads as grounding | [`THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`](./THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md) (INT17) |
| How a surface should behave, feel, or be sequenced | [`THA_EXPERIENCE_ARCHITECTURE.md`](./THA_EXPERIENCE_ARCHITECTURE.md) |
| How a surface should look | [`THA_UI_ARCHITECTURE.md`](./THA_UI_ARCHITECTURE.md) |
| What the platform is planning to build | [`THA_MASTER_EVOLUTION_ROADMAP.md`](./THA_MASTER_EVOLUTION_ROADMAP.md) |
| Point-in-time analysis and history | `docs/investigations/` |
| What was built, when, and how to roll it back | `docs/implementation/` |
| Nutrition, food, or any domain knowledge | NK1, NK2, Food Intelligence, the Knowledge Registry |
| How the codebase is built | `.engineering/` |

> **The registry describes the product, not the codebase and not the world.** If a fact is true about *food*, it belongs to a knowledge domain. If it is true about *how we work*, it belongs to `.engineering/`. If it is true about *what THA is*, it belongs here.

### 3.3 The hard boundary — **amended by `PKR2`**

**This section replaces the `PKR1` boundary, which read: *"The registry is a description, never a dependency. No runtime code may read the registry. No API may serve it."* That is no longer true, and this document does not pretend otherwise.**

`PKR2` makes the registry queryable by the Intelligence Platform (§11) and readable by the Companion (§12). The `PKR1` prohibition was written to protect one property, and that property is worth restating, because everything below is built to preserve it:

> *A description that becomes a dependency stops being safe to correct — and a registry that is not safe to correct will not be corrected.*

That reasoning was sound and remains so. What `PKR1` got wrong was the conclusion: it protected correctability by forbidding **all** reads, when what actually threatens correctability is not *reading* — it is **depending**. A registry that code *reads for knowledge* stays safe to fix. A registry that code *branches on for behaviour* does not, because every correction becomes a behaviour change and every fix becomes a risk.

The boundary is therefore redrawn along the line that was always the real one:

> **Rule PKR19 — The registry is read, never obeyed.** The Intelligence Platform may **read** the registry to answer questions about THA. **No code may branch on it.** It is never a feature flag, never a routing table, never an authorisation source, never a control-flow input. It supplies **knowledge**, never **decisions**. If a value must be *enforced* at runtime, its owner is a runtime store; the registry **cites** that store and never becomes it.

Three consequences follow, and they are not negotiable:

- **The registry is read-only, always.** No runtime path writes to it. It is authored by humans (§10) and generated at build time. There is no write API and never will be.
- **Correcting an entry can never break the product.** If a correction to a registry entry could change behaviour, something has branched on it, and that is the defect — not the correction.
- **The registry never grants access.** It *labels* what each audience may be shown (§11). It does not decide who anyone is. Authorisation remains entirely with `server/lib/access.ts`, unchanged and unshared. This is the single most important line in `PKR2`, and §11.4 exists to hold it.

---

## 4. RELATIONSHIP TO THE GOVERNING ARCHITECTURE

THA is governed by architectures that each own one question. The registry owns a question none of them answers.

| Architecture | The question it owns |
|---|---|
| **Platform** (Principles, Repository Conventions, Quality, Knowledge Completion) | How is THA built and governed? |
| **Data** (Source of Truth Register) | Which store owns which fact? |
| **Intelligence** (Intelligence Platform, engines, capability cards) | How does THA reason, and what may it read? |
| **Experience** (Experience Architecture) | How does a person encounter THA? |
| **UI** (UI Architecture) | How does THA look? |
| **Product Knowledge Registry** (**this document**) | **What is THA?** |

None of the five can answer the sixth. The Experience Architecture governs how a page should behave but does not enumerate the pages. The SoT Register names the store behind a capability but not the capability. The UI Architecture governs how a dialog looks but keeps no list of dialogs. The product has been describing its parts without ever holding the list.

### 4.1 Relationship to Platform Architecture — **amended by `PKR3`**

The registry is **subordinate to Platform Governance**. It obeys the Core Architecture Principles without exception, and it lives where the Repository Conventions say it lives (§18). It adds no new governance scheme; it applies the existing one — one canonical owner, no parallel stores, retire on introduction — to a class of knowledge that has never had it.

**`PKR3` (2026-07-11) makes that subordination specific.** [`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`](./PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md) — the platform's law for how *every* knowledge domain grows — admits **Product Knowledge** as a first-class knowledge domain alongside Food, Nutrition, Recipes and Household Knowledge (its §9), and names **this registry as that domain's canonical owner**.

This document therefore stands to Product Knowledge exactly as NK1/NK2 stand to Nutrition and FS1/FS2 stand to Recipes: **the domain's own architecture, subordinate to the platform-wide one.** Where the two conflict, the Platform Knowledge Completion Architecture is the senior rule and this document is corrected.

Four of its rules bind this registry directly, and none of them is new law — each is an existing platform rule applied to a domain that never had one:

| Rule | What it binds here |
|---|---|
| **KC12** | A discovery judged *not* to be product knowledge is **recorded as declined** — otherwise every future audit rediscovers it and re-asks the same question forever (this is Rule PKR3's discipline, given a terminal state) |
| **KC13** | `visibility` is part of the **Minimum Viable Fact** bar and **fails closed** — making it the one field whose absence is a *security* defect, exactly as §7 and Rule PKR22 already require |
| **KC14** | For a **self-describing** domain, **currency is the evidence standard** — `last_verified` and a named owner accountable for it being true *now* (§15.3). The registry cannot fabricate the product's existence; it can only go stale, and staleness is invisible to a reader |
| **KC15** | **Maintenance is the work, not a follow-up** — the domain-level reason the Definition of Done obligation in §16 exists at all |

**Why the platform-wide law was the right home for this, and a sixth governing scheme was not:** Product Knowledge did not need a new way of being governed. It needed *the existing way*, applied to it. The registry's own rules (PKR1–PKR29) are the domain's mechanisms; PKCA §9 is the law that says those mechanisms are the same shape as every other knowledge domain's — and the proof is that Product Knowledge invented no lifecycle, taking its Gate from the Food row and its Confirmation from the Household row of PKCA §1.1.

### 4.2 Relationship to Data Architecture (Source of Truth Register)

**The SoT Register is the senior rule, and the registry never contradicts it.**

The two answer adjacent questions and must not be confused:

- **The SoT Register answers:** *which store owns a fact about the world.* `knowledge_foods` owns nutrition facts. `planner_entries` owns planner state.
- **The registry answers:** *which document owns a fact about the product.* The Planner Domain entry owns what the Planner **is**.

Where they meet, the registry **cites** the SoT Register and restates nothing. A registry entry for the Planner domain names `planner_weeks`/`planner_days`/`planner_entries` as its data owner by reference; it does not describe the schema, and it is never the place a schema change is recorded.

> **Rule PKR1 — The registry cites data ownership; it never declares it.** Every registry entry that touches data names its owning store *by pointer to the SoT Register*. If a registry entry and the SoT Register disagree about which store owns a fact, the SoT Register is right and the registry entry is a defect.

When the registry becomes a queryable knowledge source (§11), the SoT Register gains one new row — **Product Knowledge**, owned by `docs/product/` — and loses none.

### 4.3 Relationship to Intelligence Architecture — **amended by `PKR2`**

The Intelligence Platform owns *how* THA reasons; the registry owns *what intelligence THA ships*. The three intelligence-facing sections — **Intelligence Capabilities**, **Companion Capabilities**, **Knowledge Capabilities** — are product-level descriptions of capabilities whose architecture is owned elsewhere.

Each such registry entry is a **pointer with product meaning**: it names the capability, states what the household gets from it, and cites its Capability Card in `docs/architecture/capabilities/` and its runtime entry in the Runtime Capability Registry. It restates neither.

> **Rule PKR2 — The registry never becomes a second Capability Registry.** A capability's architecture lives in its Capability Card; its runtime metadata lives in `server/intelligence/capability-registry.ts`. The Product Knowledge Registry holds exactly one thing neither of those holds: **what this capability means to the person using THA.** Nothing else.

**`PKR1` said the registry is "deliberately not grounding data" and withheld any licence for it to become so.** `PKR2` grants that licence — but not as an exception, and not through a back door. The registry enters the Intelligence Platform through the front door that already exists, and is bound by every rule that governs everything else that comes through it:

> **Rule PKR20 — Product Knowledge enters the platform as a registered capability, or not at all.** The registry is surfaced to Intelligence as a **Knowledge Capability** with a Capability Card, registered intents, and permission-aware access — exactly like Meals, Household, or Analyser. It gets no bespoke path, no privileged read, and no exemption from the Capability Registry. The Context Composition Engine (INT17) remains the **single owner of every byte the model reads**, and Product Knowledge reaches the prompt as a **Context View** composed by INT17 — never by reading a file, never by a direct query from the Companion (§12.2).

This keeps three existing ownerships wholly intact. INT17 still owns grounding. The Runtime Capability Registry still owns capability metadata and permissions. `server/lib/access.ts` still owns identity. The registry supplies knowledge into a machine that already knows how to carry it safely, rather than building a second machine beside it.

### 4.4 Relationship to Experience Architecture

The Experience Architecture governs *how* a person encounters THA. The registry records *what they encounter*.

The registry's **Pages**, **Journeys**, **Dialogs**, **Drawers**, **Wizards**, and **Notifications** sections are the enumeration the Experience Architecture has always assumed and never had. Experience Principle 6 — *one canonical place for everything* — is unenforceable without a list of the places. The registry is that list.

> **The Experience Architecture is the law. The registry is the census.** Experience says every entity has one canonical page; the registry is what makes it checkable. Where they conflict, Experience wins and the registry entry is corrected.

### 4.5 Relationship to UI Architecture

The UI Architecture governs presentation; the registry records existence and purpose. A registry Page entry says *the Planner page exists, it is at `/planner`, it serves the weekly planning journey, and it is owned by this document*. It says nothing about spacing, colour, hierarchy, or component choice — that is UI Architecture's and it is not restated here.

The **Screenshot Library** is the one place the two touch closely, and the boundary is explicit: the registry owns *which screenshots exist, what each depicts, and which surface each is the canonical image of*. It does not own whether the screenshot is well designed.

### 4.6 Precedence

Where this document conflicts with any of Platform, Data, Intelligence, Experience, or UI Architecture, **those documents win and the registry is corrected**. The registry has no authority to change ownership, behaviour, presentation, or access control. It has exactly two authorities: to be the single place the product is described, and to declare which audience each description is for.

---

## 5. DISCOVERY VERSUS OWNERSHIP

This is the distinction the entire architecture rests on.

> **Investigations discover. The Product Knowledge Registry owns.**

An investigation is a point-in-time act of finding out. It reads the code, interviews the surfaces, and reports what it found on the day it looked. It is history the moment it is written, and it is never wrong — it is only *dated*. `UIA1` discovered the UI architecture in July 2026; that is what UIA1 will always say, and it must never be edited to stay current.

Ownership is the opposite act. An owned fact is one that is *maintained* — it carries an owner who is accountable for it being true **now**, and it is corrected rather than superseded.

The registry converts the first into the second.

| | Investigation | Registry entry |
|---|---|---|
| Answers | What did we find? | What is true? |
| Tense | Past — as of the date it ran | Present — as of now |
| When reality changes | It stays as written; it becomes history | It is **updated**; staleness is a defect |
| Correction model | A new investigation supersedes it | The same entry is edited in place |
| Lifespan | Frozen at publication | Lives as long as the thing it describes |
| Authority | Recommends | **Declares** |
| Owner | The workstream that ran it | The **named owner** of the entry (§9) |
| Read by | People, when they go looking | People **and the Companion**, continuously (§12) |

> **Rule PKR3 — Discovery is not ownership.** An investigation may *populate* a registry entry, but it never *becomes* one. The registry entry is a new artefact in `docs/product/`, carries its own owner, and cites the investigation as its source. The investigation stays at its path in `docs/investigations/`, unedited, forever.

> **Rule PKR4 — A registry entry is never superseded, only corrected.** There is no "PKR Registry v2 of the Planner page". The Planner page has one entry; when the Planner changes, that entry changes. History lives in git and in implementation reports — never in a parallel entry.

This is the exact inverse of the promotion model in the Repository Conventions, and deliberately so. Promotion copies an investigation into `docs/architecture/` *and freezes it as governance*. Registry population copies findings into `docs/product/` *and takes on the obligation to keep them current*. Promotion produces law. Population produces truth-with-an-owner.

The last row of that table is `PKR2`'s addition, and it changes what the distinction *costs*. An investigation nobody reads is harmless. A registry entry nobody maintains is now read aloud to households by the Companion.

---

## 6. CANONICAL OWNERSHIP RULES

The registry's whole value is that a question has one answer. These rules produce that, and nothing else in this document may weaken them.

> **Rule PKR5 — One owner per product concept.** Every concept the product has — a domain, a feature, a term, a benefit — appears in exactly one registry entry, in exactly one section. Two entries describing one concept is a defect, not a redundancy, however differently they are phrased.

> **Rule PKR6 — One owner per capability.** Every capability — Intelligence, Companion, or Knowledge — has exactly one registry entry, which cites (and never restates) its Capability Card and its runtime registration.

> **Rule PKR7 — One owner per page.** Every page has exactly one entry, keyed by its canonical route. A page that appears under two routes has one entry and names the alias; it does not get two.

> **Rule PKR8 — One owner per journey.** Every journey has exactly one entry, which names its start, its surfaces in order, and its completion. A surface may appear in many journeys; a journey appears once.

> **Rule PKR9 — One owner per marketing message.** Every claim THA makes about itself — in-product, on the site, in a store listing, or in a release note — traces to exactly one Marketing Message entry. Two teams making the same claim in two voices is the failure this rule exists to end.

> **Rule PKR10 — One owner per screenshot.** Every screenshot has exactly one entry naming what it depicts, which surface it is the canonical image of, and when it was captured. A surface has one canonical screenshot; alternates are explicitly marked as such and are never used interchangeably.

> **Rule PKR11 — One owner per inventory record.** Every record in the machine-readable inventory maps to exactly one human-readable entry, and every human-readable entry maps to exactly one inventory record. The mapping is total and bijective. An inventory record without a document is an orphan; a document without a record is invisible.

> **Rule PKR12 — Every entry names a human owner.** Not a team, not a workstream, not "the platform". An entry whose owner cannot be named has no owner, and an entry with no owner will be stale within a quarter.

> **Rule PKR13 — No parallel product descriptions.** Once a concept has a registry entry, no other document may describe it authoritatively. Other documents *link* to the entry. A README, a slide, or an investigation that restates a registry entry has created a second owner and must be reduced to a pointer.

> **Rule PKR14 — Retire on introduction.** When a surface, capability, or message is replaced, its registry entry is retired **in the same change that introduces the successor**. A registry with two live entries for one concept is worse than no registry, because it is trusted. (This is UI Principle 5, applied to product knowledge.)

> **Rule PKR15 — The registry is corrected, never defended.** When the registry and reality disagree, reality is right. The entry is a defect and is fixed. No exception, no matter how recently the entry was reviewed.

---

## 7. WHAT EVERY REGISTRY ENTRY CONTAINS

Every entry, in every section, carries the same spine. Sections add fields; none may remove these.

| Field | Meaning |
|---|---|
| `id` | Stable, unique, permanent. Never reused, never renumbered, never reissued after retirement. |
| `name` | The canonical name — the one THA uses, in the product, everywhere. |
| `section` | One of the 28 canonical sections in §8. Exactly one. |
| `status` | `live` · `hidden` · `internal` · `deprecated` · `retired` |
| **`visibility`** | **`public` · `household` · `admin` · `developer` — the lowest audience permitted to be told this (§11). Mandatory. Fails closed (Rule PKR22).** |
| `purpose` | What it is for, in one sentence, in the household's terms — not the engineer's. |
| `owner` | A named human (Rule PKR12). |
| `sources` | Pointers to code, route, table, Capability Card, or SoT Register domain. Pointers only. |
| `related` | Other registry ids. The graph of the product. |
| `last_verified` | The date a human last confirmed this is still true (§15.3). |
| `version` | The registry-entry version (§17). |

`purpose` is the field that makes the registry worth having. A list of routes is a grep. A list of routes *with a sentence each on why they exist for the person using them* is product knowledge, and it exists nowhere in THA today.

`visibility` is the field that makes it safe to query. It is added by `PKR2` and is the only field whose absence is a **security** defect rather than a documentation one.

---

## 8. THE CANONICAL SECTIONS

The registry has exactly these 28 sections. Adding a section is a governance decision (§13.3), not a filing convenience.

### Structure

| # | Section | Owns | Keyed by |
|---|---|---|---|
| 1 | **Domains** | The top-level areas THA is made of — Planner, Cookbook, Pantry, Shopping, Diary, Analyser, Companion, Admin | Domain id |
| 2 | **Pages** | Every page a person can reach, live or hidden | Canonical route |
| 3 | **Routes** | Every URL the product answers, and the page each resolves to (incl. aliases, redirects, deep links) | Path |
| 4 | **Journeys** | Every multi-surface path a household takes to an outcome | Journey id |
| 5 | **Features** | Discrete units of product function within a domain | Feature id |
| 6 | **Capabilities** | What THA can *do* for a household, independent of where it is surfaced | Capability id |

### Intelligence

| # | Section | Owns | Boundary |
|---|---|---|---|
| 7 | **Intelligence Capabilities** | Product meaning of each registered Intelligence capability | Cites the Capability Card; restates nothing (Rule PKR2) |
| 8 | **Companion Capabilities** | What the Companion can do, and what it will never do | Cites the Companion Platform Architecture |
| 9 | **Knowledge Capabilities** | What THA knows and can explain — nutrition, food, additives, diversity, **and, under `PKR2`, THA itself** | Cites NK1/NK2 and the Knowledge Registry; holds no domain knowledge itself. Product Knowledge becomes an entry in *this* section — the registry appears in its own registry, as a registered capability (Rule PKR20). |

### Surfaces

| # | Section | Owns |
|---|---|---|
| 10 | **Admin Experiences** | Every admin surface, who may reach it, and what it is for. Default visibility: `admin`. |
| 11 | **Hidden Experiences** | Every surface that exists but is not linked — feature-flagged, unlaunched, deliberately unlisted. **This section is the reason the registry exists.** Hidden surfaces are the fastest-decaying knowledge in any product, and the only record of them is usually the memory of whoever built them. Default visibility: `admin` — and see Rule PKR24, because *mentioning* a hidden surface to a household is itself a disclosure. |
| 12 | **Developer Experiences** | Every developer-facing surface, tool, or diagnostic that ships in the application. Default visibility: `developer`. |
| 13 | **Notifications** | Every message THA can send unprompted, its trigger, and its surface |
| 14 | **Dialogs** | Every modal, its trigger, and its purpose |
| 15 | **Drawers** | Every drawer/sheet, its trigger, and its purpose |
| 16 | **Wizards** | Every multi-step flow, its steps, and its completion state |

### Connections

| # | Section | Owns |
|---|---|---|
| 17 | **Integrations** | Every external system THA connects to, what it is used for, and what breaks without it |
| 18 | **APIs** | Every endpoint the product exposes, its purpose, and its consumers. Default visibility: `developer`. |
| 19 | **Product Settings** | Every setting a person can change, its default, and where it lives |

### Narrative

| # | Section | Owns | Boundary |
|---|---|---|---|
| 20 | **Marketing Messages** | Every claim THA makes about itself, anywhere (Rule PKR9) | Every message cites the product truth that substantiates it. **A claim with no citable entry is not a message — it is a fabrication, and it does not enter the registry.** |
| 21 | **Product Benefits** | What a household actually gets from THA, in their terms | Traceable to capabilities |
| 22 | **Competitive Advantages** | What THA does that alternatives do not | Each must cite the capability that delivers it — or it is an aspiration, not an advantage. Default visibility: `admin` — this is positioning, not product guidance, and the Companion has no business reciting it to a household (§12.4). |
| 23 | **Help & Documentation** | Every help artefact, what it explains, and which surface it serves. Default visibility: `public` — this is the section the Companion answers most questions from. |

### Assets

| # | Section | Owns |
|---|---|---|
| 24 | **Screenshot Library** | Every screenshot, what it depicts, its canonical surface, and its capture date (Rule PKR10) |
| 25 | **Product Assets** | Logos, icons, illustrations, brand assets — what each is, and where it is canonical |
| 26 | **Product Glossary** | Every term THA uses, its one definition, and its approved usage. **The glossary is the registry's vocabulary and therefore governs the language of every other section** — including the Companion's, which must speak THA's own words back to the household (§12.3). If the glossary and a page's copy disagree, one of them is wrong, and the glossary says which. |

### Machine-readable

| # | Section | Owns |
|---|---|---|
| 27 | **Machine-readable Inventory (JSON)** | The complete registry as JSON — one record per entry (§10) |
| 28 | **Machine-readable Inventory (YAML)** | The same registry as YAML — the authored form (§10) |

Sections 27 and 28 are **not a 28th and 29th body of knowledge.** They are the same knowledge in a second and third form, and §10 governs how that is kept honest. Under `PKR2` they are also the **only** form the Intelligence Platform ever reads (Rule PKR21).

---

## 9. OWNERSHIP MODEL

### 9.1 One owner, named

Every entry names a **person**. The owner is accountable for exactly one thing: **that the entry is true today.** Not for the surface's design, not for its code, not for its roadmap — for the *accuracy of its description*.

Ownership is not authorship. The person who wrote the entry and the person who owns it may differ; only the owner is on the hook.

Under `PKR2`, the owner is accountable for one thing more: **that the entry's `visibility` is correct.** That is a materially heavier duty than accuracy, because an inaccurate entry misinforms and a mislabelled entry discloses.

### 9.2 Ownership follows the product, not the org

An owner who leaves, changes team, or stops working on the surface must hand the entry over **in the same change that ends their involvement**. An entry whose owner is no longer reachable is stale by definition, whatever its `last_verified` date claims.

### 9.3 The owner is not a bottleneck

Anyone may correct any entry. The owner is not a gate on changes — they are the person who is *asked* when the entry is wrong, and the person the governance review names when it is stale. A registry where only owners may edit becomes a registry no one edits.

> **Rule PKR16 — Anyone may correct; one person is accountable.** Correction is open. Accountability is singular. These are not in tension: the first keeps the registry current, the second keeps it owned.

**One exception, added by `PKR2`: `visibility` is not open.** Anyone may fix a wrong sentence; **loosening** an entry's visibility — moving it toward `public` — is a disclosure decision and requires the entry's owner (§11.5). Tightening it needs no one's permission and never has.

---

## 10. THE TWO FORMS

The registry exists in two forms, and both are canonical for different readers.

### 10.1 Human-readable documentation principles

The prose form is what a person reads to understand THA.

- **Write for the household, not the engineer.** `purpose` is what the person gets, not what the code does. "Plan the week's meals around who is eating" — not "CRUD interface over `planner_entries`".
- **One entry, one file, one concept.** No omnibus documents. A file describing three pages has three owners and therefore none.
- **Cite; never restate.** Every fact owned elsewhere is a pointer. A registry entry that explains the planner schema has duplicated the SoT Register and will diverge from it.
- **Plain, current, and dated.** Present tense. If it is no longer true, it is not "historical context" — it is a defect (Rule PKR15).
- **Length is not thoroughness.** An entry that cannot say what a surface is for in one sentence has not understood the surface.
- **Write it as though the Companion will read it aloud** — because under `PKR2` it will. An entry written in engineer's shorthand becomes a household hearing engineer's shorthand.

### 10.2 Machine-readable inventory principles

The structured form is what an agent, a test, an audit, a release process, and — under `PKR2` — the **Intelligence Platform** reads.

- **The inventory is derived, never authored twice.** YAML is the authored form; JSON is generated from it. There is one act of authorship, and Rule PKR11's bijection is a mechanical property, not a discipline.
- **The JSON is a build artefact.** It is never hand-edited. A hand-edited JSON inventory is a second source of truth that lies about being one.
- **The schema is versioned and validated.** An entry that fails schema validation does not enter the registry. Under `PKR2`, an entry with a missing or invalid `visibility` fails validation — it does not default to `public`, ever (Rule PKR22).
- **Structure is not prose.** The inventory carries the spine (§7) and identifiers. It does not carry the explanation — that is what the prose entry is for, and the inventory points at it.
- **Enumerable by design.** The point of the machine form is that "list every hidden experience", "list every claim with no substantiating capability", "list every entry not verified in 90 days", and "list everything a free household can be told" become one query rather than one investigation.

> **Rule PKR17 — Two forms, one truth, one act of authorship.** The prose entry and the inventory record describe the same thing and are generated from a single edit. Where they disagree, the build is broken — not the reader's understanding.

> **Rule PKR21 — Intelligence reads the inventory, never the prose.** The Intelligence Platform's read path is the **generated, validated, permission-labelled inventory** — never the Markdown, never the filesystem, never a document. Prose is for people. Structure is for machines. A model that reads the prose directly has bypassed the schema that carries the `visibility` label, and with it every guarantee in §11.

---

## 11. PERMISSION-AWARE PRODUCT KNOWLEDGE

**Added by `PKR2`.**

The registry is the single source of truth for what THA is. It does not follow that everyone may be told all of it.

Product knowledge is not uniformly safe. "How do I add a family member?" is help. "Here is every admin diagnostic surface and what it exposes" is not, and "here is the unlaunched feature behind flag X" is not, and neither is "here is how we position ourselves against competitors". These are all facts about THA, all owned by the registry, and all addressed to different audiences.

> **The registry has one truth and four audiences. It does not have four truths.**

This distinction matters more than it first appears. Permission-aware knowledge is **not** four registries, and it is **not** a public copy plus a private copy. It is one entry, with one owner, carrying one label that says who may be told. A second copy of anything is a second owner (Rule PKR13), and the moment product knowledge exists in a "public version" and an "internal version" they begin to disagree — and the one the household hears will be the one nobody maintains.

### 11.1 The four tiers

| Tier | Audience | Sees | Typical sections |
|---|---|---|---|
| **`public`** | Anyone. No authentication. | **Help, onboarding, FAQs, feature guidance.** What THA is and how to use it. | Help & Documentation, Product Glossary, Product Benefits, Marketing Messages, public Pages |
| **`household`** | Any authenticated user, any subscription tier. | **User-facing product guidance relevant to their experience.** Everything `public` sees, plus how their own surfaces, settings, and journeys work. | Domains, Pages, Journeys, Features, Dialogs, Drawers, Wizards, Notifications, Product Settings, Companion Capabilities |
| **`admin`** | `users.role === 'admin'`. | **Product inventory, capabilities, journeys, diagnostics, screenshots.** The operator's view: what exists, everywhere, including what households cannot see. | Everything above, plus Admin Experiences, Hidden Experiences, Screenshot Library, Competitive Advantages, Integrations, Capabilities in full |
| **`developer`** | Engineering. | **Internal architecture, implementation mappings, technical metadata and governance.** How it is actually built. | Everything above, plus Developer Experiences, APIs, `sources` pointers, ownership metadata, governance state |

### 11.2 Visibility is cumulative, and that is a rule

> **Rule PKR23 — Visibility is monotonic.** `developer` ⊇ `admin` ⊇ `household` ⊇ `public`. A higher tier sees everything every lower tier sees. There is no fact that an admin may not be told but a household may.

An entry's `visibility` field names the **lowest** tier permitted to be told it. `visibility: household` means *households and above*. It never means *households only*.

This is what stops the registry becoming four registries. Non-monotonic visibility — "the household sees this, but the admin sees something different" — would require two versions of one fact, and two versions of one fact is the exact failure this entire architecture exists to end. If an admin and a household need genuinely different information about the same surface, that is two entries about two things, not one entry told two ways.

### 11.3 Subscription tier gates features, not knowledge

THA holds role and subscription tier as independent concepts (`docs/roles-and-subscriptions.md`): `users.role` controls permission, `users.subscription_tier` controls feature access.

**Registry visibility keys on `role` — never on `subscription_tier`.**

> **Rule PKR24 — Knowing about a feature is not access to it.** A `free` household may be told, fully and accurately, what a premium capability does. They simply cannot use it. Feature access is enforced by `hasPremiumAccess()` at the point of use; it is not, and must never become, a filter on product knowledge.

The alternative is indefensible: a product that will not explain what it sells. Marketing Messages, Product Benefits, and every "here is what you would get" surface depend on a free household being able to learn about premium features. Hiding them would make the registry useless to the very people it most needs to persuade — and would put the Companion in the position of pretending capabilities do not exist.

### 11.4 The registry labels; it never decides — **the safety property**

This is the line on which everything in `PKR2` rests, and it is worth being blunt about the failure it prevents.

> **Rule PKR25 — The registry classifies. `access.ts` authorises.** The registry declares *what tier a fact belongs to*. It never determines *what tier a user belongs to*. Identity and role are resolved **exclusively** by `server/lib/access.ts` (`isAdmin()`, `getTier()`, `hasPremiumAccess()`, `assertAdmin()`), unchanged, unshared, and unduplicated. The registry is an **input** to a filtering decision, never the **maker** of one.

The failure this prevents: if registry visibility were itself the authorisation decision, then a Markdown edit would be a privilege escalation, and a documentation defect would be a security incident. A person correcting a typo could open an admin surface to the public. The registry is authored by humans, in prose, reviewed as documentation — it must **never** hold the power to grant anything, because it is not reviewed as though it does.

Two mechanical consequences:

> **Rule PKR22 — Visibility fails closed.** An entry with no `visibility`, an unrecognised value, or a value the schema rejects is treated as **`developer`** — the most restrictive tier — and is served to no one. It never defaults to `public`. **Absence of a label is never permission.** Schema validation rejects it at build time, so this state should never reach runtime; the fail-closed default exists for the case where it does.

> **Rule PKR26 — Filtering happens before composition, never in the model.** The permission filter is applied when the Context View is built — by deterministic code, against the tier `access.ts` resolved. Content above the user's tier is **never placed in the prompt**. The model is never asked to keep a secret it has been shown. A prompt that contains admin content and an instruction not to reveal it has already leaked, and no amount of instruction-following makes it not have leaked.

### 11.5 Changing visibility

| Change | Requires |
|---|---|
| **Tightening** (toward `developer`) | Nothing. Anyone, any time, no approval. Over-restriction is a documentation inconvenience. |
| **Loosening** (toward `public`) | The entry's **owner** (§9.3). This is a disclosure decision, and it is the one edit in the registry that is not open. |
| Loosening anything in **Hidden Experiences** | The owner, **and** confirmation the surface is actually launched — because the visibility label is not what makes a hidden feature public; shipping it is. |

The asymmetry is deliberate and is the correct direction for the mistake to fall. Wrongly hiding a fact costs a reader an answer. Wrongly exposing one cannot be undone.

---

## 12. THE REGISTRY AS COMPANION KNOWLEDGE

**Added by `PKR2`.**

The Companion is the reason the registry is worth building rather than merely worth having. A registry that only people read is documentation with better governance. A registry the Companion reads is a product that can explain itself.

### 12.1 The Companion must query, never duplicate

> **Rule PKR27 — The Companion queries the registry; it never duplicates product knowledge.** No product knowledge may be written into a system prompt, a prompt template, a hard-coded string, a fallback answer, a fine-tune, or a capability's own code. If the Companion needs to know something about THA, it reads the registry. There is no second copy, however small, however convenient, however temporary.

This rule is the whole of TIP's founding principle — *"TIP does not own knowledge; it owns an index of pointers into the existing owners"* — applied to the one knowledge domain TIP never had an owner to point at. It had no choice but to know nothing about THA, because nothing owned that knowledge. Now something does.

The temptation this rule exists to kill is small and specific: a single helpful sentence about THA, dropped into a system prompt, because it is faster than adding a registry entry. That sentence is a second owner of a product fact (Rule PKR13). It will not be updated when the product changes, because nothing will point at it. It will be wrong within a quarter, and it will be wrong *in the Companion's voice* — which is the most authoritative voice THA has.

**Corollary: the Companion's own capabilities are registry entries too.** Section 8 of §8 — Companion Capabilities — is what the Companion reads to answer "what can you do?". A Companion that describes itself from a prompt string rather than the registry has duplicated product knowledge about *itself*, which is the most embarrassing possible instance of this failure and, on current evidence, the most likely.

### 12.2 How it reaches the model

The registry does not hand text to the Companion. It enters through the platform's existing machinery, and every existing owner keeps what it owns:

```
Product Knowledge Registry  (docs/product/ — the truth; §3.1)
        │  authored as YAML, generated to JSON, schema-validated (§10.2)
        ▼
Machine-readable inventory  (the only thing Intelligence ever reads — Rule PKR21)
        │
        ▼
Product Knowledge Capability  (a registered Knowledge Capability — Rule PKR20)
        │  registered in server/intelligence/capability-registry.ts, like every other
        ▼
Permission filter  ◄──── access.ts resolves the user's role (Rule PKR25)
        │  entries above the user's tier are DROPPED here, before composition (Rule PKR26)
        ▼
Context Composition Engine  (INT17 — the single owner of every byte the model reads)
        │  composes the permitted subset into the CONTEXT DATA block, as a Context View
        ▼
Companion  ── answers, and cites the entry it answered from (§12.3)
```

Four ownerships survive this intact, and that is the point of routing it this way rather than any shorter way:

- **INT17** still owns every byte the model reads. Product Knowledge is a Context View like any other — it does not serialise itself into a prompt, does not manage its own budget, and does not truncate itself.
- **The Runtime Capability Registry** still owns capability metadata and permission-aware access. Product Knowledge is registered, not privileged.
- **`access.ts`** still owns identity. The registry is consulted about *facts*; it is never consulted about *people*.
- **The registry** still owns nothing but the knowledge — no transport, no filtering logic, no prompt.

### 12.3 What the Companion may say

- **It answers from the registry, and cites the entry.** A Companion answer about THA traces to a registry `id`. An answer that cannot cite one was invented, and inventing facts about the product is exactly as serious as inventing facts about nutrition — arguably worse, because a household has no way to check it.
- **It speaks THA's own words.** The Product Glossary (§8, section 26) governs the Companion's product vocabulary. If the glossary says "Plant Diversity", the Companion does not say "plant variety score". A product that calls the same thing two names in two places has a UI defect; a Companion that does it has a credibility defect.
- **It says "I don't know" honestly.** If the registry has no entry, the Companion has no answer. This is the platform's existing *honest gaps over fabricated knowledge* rule, and product knowledge gets no exemption from it. The registry being incomplete (§23: it is entirely incomplete) must produce silence, never improvisation.

### 12.4 What the Companion must never do

> **Rule PKR28 — Companion responses respect permission-aware visibility, absolutely.** The Companion may only speak from entries at or below the requesting user's tier, as resolved by `access.ts` and filtered before composition (Rule PKR26). There is no exception for a persuasive question, an insistent user, a "hypothetically", or an admin asking on a household's behalf.

And one failure mode that is subtle enough to name explicitly, because it is the way permission-aware systems usually leak:

> **Rule PKR29 — Absence is never explained.** When content is filtered out, the Companion does not say *"there is an admin feature I can't tell you about"*, or *"that's an unlaunched capability"*, or *"I'm not permitted to discuss that surface"*. **The existence of a hidden or admin surface is itself `admin`-tier knowledge.** Acknowledging that something exists but is withheld discloses precisely the fact the tier was protecting. To a filtered user, filtered content does not exist, and the Companion's honest answer is that it does not know — which is true, because at that tier, it does not.

This is the rule most likely to be violated by a well-meaning implementation trying to be transparent with the user. Transparency about *what you don't know* is a virtue. Transparency about *what you are hiding* is a leak.

### 12.5 What this costs

`PKR2` moves the registry from documentation to a runtime knowledge source, and the cost lands entirely on staleness.

| | Under `PKR1` | Under `PKR2` |
|---|---|---|
| A stale entry | misleads a reader who went looking for it | **is read aloud to a household, in the Companion's voice, with the product's authority** |
| A mislabelled entry | is a filing error | **is a disclosure** |
| An unmaintained registry | is unhelpful | **actively lies, at scale, to people who trust it** |

This is not an argument against `PKR2`. It is the reason §16 is not optional and §15.3's verification cadence is not decorative. A registry that feeds the Companion must be maintained to the standard of a runtime store, and the only mechanism that will achieve that is making its update a condition of finishing — which is what §16 does.

**The honest statement of risk:** the Companion will be more convincing than the registry is accurate. That is true of every grounded assistant, and it is why grounding must be governed rather than merely enabled.

---

## 13. REGISTRY GOVERNANCE

### 13.1 What governs the registry

The registry is governed by this document, and by nothing else. It obeys the Core Architecture Principles, the Repository Conventions (for location), and the Engineering Workflow (for the process by which it changes).

### 13.2 What a change to the registry requires

| Change | Requires |
|---|---|
| Correcting an entry (it was wrong) | Nothing but the correction. Corrections are always welcome and never gated. |
| **Tightening** an entry's visibility | Nothing. Anyone. |
| **Loosening** an entry's visibility | The entry's **owner** — this is a disclosure decision (§11.5) |
| Updating an entry (reality changed) | The implementation that changed reality (§16) |
| Adding an entry (a new thing exists) | The implementation that created it, or the investigation that discovered it |
| Retiring an entry (the thing is gone) | The implementation that removed it, in the same change (Rule PKR14) |
| Changing an entry's **owner** | The new owner's acceptance |
| Adding a **section** | An architecture decision amending §8 of this document |
| Changing an **ownership or visibility rule** | An architecture decision amending §6 or §11 of this document |

The gradient is deliberate. Fixing a fact is free. Exposing one is not. Changing the shape of the registry is an architecture change and is treated as one.

### 13.3 Sections are fixed

The 28 sections of §8 are the registry's structure, and they are fixed by this document. A 29th section is an amendment to this architecture, reviewed as such. "This does not fit anywhere" is nearly always a sign the entry is in the wrong section — not that a section is missing.

### 13.4 The registry has no drafts

An entry is in the registry or it is not. There is no `draft/`, no `proposed/`, no `wip/`. Things that do not exist yet belong to the roadmap; things that exist but are not launched are **Hidden Experiences** (§8, section 11) and are recorded as such, with `status: hidden` and `visibility: admin`. A draft tier is where registries go to become fiction — and under `PKR2`, fiction that the Companion will read.

---

## 14. UPDATE RESPONSIBILITIES

| Actor | Responsibility |
|---|---|
| **The implementation that changes the product** | Update every affected entry, in the same change. This is Definition of Done (§16) — not follow-up work. |
| **The investigation that discovers product truth** | Populate or correct the entries it touches (§15.1) |
| **The entry owner** | Confirm the entry is true when asked; approve any loosening of its visibility; hand it over when they leave it |
| **Anyone who spots a lie** | Fix it (Rule PKR16) |
| **Anyone who spots an over-exposed entry** | Tighten it immediately, without approval (§11.5) |
| **The governance review** | Find what everyone above missed (§15.3) |

> **Rule PKR18 — The person who changes the product updates the registry.** Not a documentation pass. Not a later ticket. Not someone else. The change that makes an entry false is the change that must make it true again — because it is the only moment at which someone knows exactly what changed.

---

## 15. LIFECYCLE

### 15.1 Population — how investigations fill the registry

The registry is populated by investigation, and only by investigation. An investigation that touches a registry section must, at its conclusion, do four things:

1. **State which registry entries its findings create, correct, or retire.** By id if they exist; by name if they do not yet.
2. **Produce the entries** in `docs/product/` — as a distinct artefact, not as a section of the investigation itself (Rule PKR3).
3. **Name an owner for each.** An investigation that produces an unowned entry has produced a document, not a registry entry.
4. **Assign a `visibility` to each, and justify anything set to `public` or `household`.** Restrictive labels need no defence; permissive ones do.

The investigation itself stays where it is, unedited, as history. It is cited by the entries it produced.

**Population is expected to take several investigations.** The 28 sections are not filled in one pass and must not be. The correct order is coverage-first — Domains, Pages, Routes, Journeys — because those are what everything else hangs off, and because they are the sections whose absence is felt on every single question anyone asks about THA. Marketing Messages, Competitive Advantages, and the Screenshot Library come last, because they are claims *about* product truth and cannot be substantiated before it exists.

**The Companion read path (§12.2) must not be built before the registry has content worth reading.** A grounded assistant pointed at an empty knowledge source is worse than an ungrounded one: it has been given permission to speak about a subject on which it knows nothing.

**Nothing in this document authorises any of that.** Each is a future workstream.

### 15.2 Maintenance — how implementations keep it current

Every implementation that changes what THA *is* — not merely how it works — updates the affected entries as a condition of Definition of Done (§16).

The test for "does this touch the registry?" is one question:

> **Would a person's answer to "what is THA?" be different after this change?**

If yes, the registry is stale until updated. Adding a page, adding a dialog, adding a capability, changing a route, changing what a surface is *for*, hiding a surface, retiring a surface, adding an integration, making a new claim — all yes. Fixing a bug, refactoring, changing a query, adjusting spacing — all no.

### 15.3 Verification — how staleness is found

Entries carry `last_verified` (§7). An entry not verified within **90 days** is **presumed stale** and reported as such by the governance review. Presumed stale is not the same as wrong — it means no one has looked, and the registry does not get credit for facts no one has checked.

Verification is cheap by design: the owner confirms the entry is still true, or fixes it. It is one question, not an audit.

Once the Companion reads the registry (§12), `last_verified` stops being a documentation-hygiene metric and becomes a **trust metric**. The oldest `last_verified` date in the registry is the age of the least-checked thing the Companion is willing to tell a household — and that is a number worth watching.

### 15.4 Retirement

When a thing is removed from the product, its entry is **retired, not deleted**: `status: retired`, with the date and the implementation that removed it. Retired entries stay in the registry.

They stay because "we used to have that, and here is why we removed it" is one of the most expensive facts to reconstruct and one of the cheapest to keep. Deletion is how a registry loses the only knowledge that cannot be recovered from the code — the code no longer has it either.

**Retired entries are never composed into the Companion's context.** They are `admin`/`developer` history, not product guidance. A retired entry read aloud to a household is the Companion describing a feature that no longer exists, which is a fabrication with a paper trail.

Retired ids are **never reused** (§7).

---

## 16. ENGINEERING GOVERNANCE — THE DEFINITION OF DONE OBLIGATION

**This section is normative and binds every future implementation. Strengthened by `PKR2`.**

An implementation that changes what THA is, is **not done** until:

```
□ Every affected registry entry has been updated, added, or retired
     — in this change, not a follow-up.

□ Every new surface, capability, route, dialog, drawer, wizard,
     notification, integration, API, or setting it introduces has a
     registry entry, with a named owner AND a declared visibility.

□ Every new entry's visibility has been deliberately chosen — not
     defaulted, not copied from a neighbour. Anything set to `public`
     or `household` is justified in the implementation report.

□ Every surface it removed has its entry RETIRED (status + date +
     this implementation), not deleted.

□ Every replacement retired its predecessor's entry in the same
     change (Rule PKR14).

□ Every claim it enables has a Marketing Message entry, and that
     entry cites the product truth substantiating it.

□ No product knowledge has been written into a prompt, a template,
     a fallback string, or a capability's code (Rule PKR27).

□ The machine-readable inventory regenerates cleanly and validates,
     including every visibility label.

□ No entry it touched now describes something that is no longer true.

□ The implementation report names the registry entries it changed.
```

If any check fails: **STOP, explain why, do not continue until approved.**

### 16.1 Where this is enforced

`PKR2` wires this obligation into the engineering process, so that it binds every implementation rather than only those that happen to have read this document:

| Enforcement point | What was added |
|---|---|
| [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md) STEP 5 | **Product Registry Impact** is now a mandatory section in every implementation document — the seventh, alongside Architecture Compliance, Definition of Done, Data Impact, Trust Check, Rollback Plan, and Scope Lock. |
| [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md) — **Product Registry Compliance** block | A mandatory checklist for every user-facing implementation, standing beside the Architecture Compliance Checklist and the AI Architecture Compliance block. **If any check fails: STOP.** |
| [`ENGINEERING_WORKFLOW.md`](./ENGINEERING_WORKFLOW.md) STEP 9 — Completion Gate | No user-facing task is complete until its registry entries are updated and named in the report. |
| [`.engineering/templates/IMPLEMENTATION_TEMPLATE.md`](../../.engineering/templates/IMPLEMENTATION_TEMPLATE.md) | A **Product Registry Impact** section, so every report is born with the question in it. |

### 16.2 Why this is the rule that matters

> **This is the rule that makes the registry survive.** Every other rule in this document describes what a good registry looks like. This one is the only mechanism that keeps it that way — because it makes the registry a *condition of finishing*, and every artefact that is a condition of finishing stays true, while every artefact that is a nice-to-have does not. Documentation that can be skipped, is.

Under `PKR1` that argument was about documentation quality. Under `PKR2` it is about whether the Companion tells households the truth (§12.5). The registry now sits on the far side of a runtime read path, and an unmaintained knowledge source behind a confident assistant is not a documentation problem — it is a trust failure with a user-facing voice.

This checklist stands beside the Architecture Compliance Checklist in `ENGINEERING_WORKFLOW.md`, the AI Architecture Compliance block, the UX Governance Checklist in the Experience Architecture (§18), and the UI Governance Checklist in the UI Architecture (§18). It does not replace any of them.

---

## 17. VERSIONING PRINCIPLES

- **Entries are versioned; the registry is not.** There is no "Registry v2". The registry is a living present-tense description, and a version number on the whole would only ever describe a moment it no longer occupies.
- **An entry's version increments when its *meaning* changes** — what the surface is, does, or is for. Not when a typo is fixed, not when a link is corrected.
- **A `visibility` change always increments the version**, even though it changes no prose. It changes who is told, which is a change in what the entry *is for*, and it must be visible in history.
- **The `id` never changes.** A page that is renamed keeps its id and changes its `name`. An id that changes breaks every citation for cosmetic gain — the same reason the Repository Conventions forbid renaming existing documents. Under `PKR2` it also breaks every Companion answer that cited it.
- **The inventory schema is versioned independently** of the entries it carries, because consumers of the machine form must be able to detect a shape change.
- **History lives in git and in implementation reports.** The registry holds the present. Asking it to hold the past is what turns a registry into an archive, and archives are not maintained.

---

## 18. RECOMMENDED FOLDER STRUCTURE

The registry will live beneath `docs/product/`. **This document does not create it.** The structure below is the specification a future population workstream implements.

```
docs/product/
├── README.md                       # Registry index + how to use it. Entry point.
├── OWNERS.md                       # Every entry id → its named owner. One table.
├── VISIBILITY.md                   # Every entry id → its tier. One table. The disclosure surface.
│
├── structure/
│   ├── domains/                    # 1.  One file per domain
│   ├── pages/                      # 2.  One file per page
│   ├── routes/                     # 3.  Route → page map
│   ├── journeys/                   # 4.  One file per journey
│   ├── features/                   # 5.  One file per feature
│   └── capabilities/               # 6.  One file per capability
│
├── intelligence/
│   ├── intelligence-capabilities/  # 7.  Cites docs/architecture/capabilities/
│   ├── companion-capabilities/     # 8.  What the Companion reads to describe ITSELF (§12.1)
│   └── knowledge-capabilities/     # 9.  Incl. Product Knowledge itself (Rule PKR20)
│
├── surfaces/
│   ├── admin/                      # 10.  Default visibility: admin
│   ├── hidden/                     # 11.  Default visibility: admin — see Rule PKR29
│   ├── developer/                  # 12.  Default visibility: developer
│   ├── notifications/              # 13.
│   ├── dialogs/                    # 14.
│   ├── drawers/                    # 15.
│   └── wizards/                    # 16.
│
├── connections/
│   ├── integrations/               # 17.
│   ├── apis/                       # 18.  Default visibility: developer
│   └── settings/                   # 19.
│
├── narrative/
│   ├── marketing-messages/         # 20.
│   ├── benefits/                   # 21.
│   ├── competitive-advantages/     # 22.  Default visibility: admin
│   └── help/                       # 23.  Default visibility: public — the Companion's main source
│
├── assets/
│   ├── screenshots/                # 24.  Index + metadata. Images live with the app.
│   ├── product-assets/             # 25.  Index + metadata. Same rule.
│   └── glossary.md                 # 26.  One file. The vocabulary is not divisible.
│
└── inventory/
    ├── schema/                     # The inventory schema, versioned. Validates visibility (§10.2)
    ├── product.yaml                # 28.  AUTHORED. The single act of authorship.
    └── product.json                # 27.  GENERATED. Never hand-edited. What Intelligence reads.
```

Four properties of this structure are load-bearing:

- **`OWNERS.md` is a single flat table**, not ownership scattered through 28 folders. "Who owns what, and is anything unowned?" must be answerable in one read, or Rule PKR12 is unenforceable in practice.
- **`VISIBILITY.md` is the same idea for disclosure**, and is added by `PKR2`. "What can a household be told? What is public?" must be answerable in one read, by a person, without running anything. A permission model spread across 28 folders is a permission model nobody has ever seen whole — and one nobody has seen whole is one nobody has checked.
- **`glossary.md` is one file.** A vocabulary split across files is a vocabulary that develops dialects — and under `PKR2` those dialects reach households in the Companion's voice.
- **`inventory/product.json` is generated.** It sits beside its source so that a hand-edit is visible in the diff as the defect it is. It is the only artefact in this tree the Intelligence Platform ever reads (Rule PKR21).

Screenshots and product assets are indexed here, not stored here. The registry owns *what each image is and which surface it is canonical for*; the binaries stay where the application keeps them.

---

## 19. PRODUCT REGISTRY GOVERNANCE CHECKLIST

Every implementation that changes what THA is must pass this checklist. It stands beside the Architecture Compliance Checklist in `ENGINEERING_WORKFLOW.md`, the AI Architecture Compliance block, the UX Governance Checklist, and the UI Governance Checklist; **if any check fails: STOP, explain why, do not continue until approved.**

```
□ Registry impact assessed
    Would a person's answer to "what is THA?" be different after this
    change? If yes, the registry is affected. If you are unsure, it is.

□ One owner preserved
    Has this change created a second description of anything the registry
    already owns — in a README, a report, a slide, or a comment? If so, it
    is now a pointer, not a description (Rule PKR13).

□ Every new thing is registered
    Every page, route, journey, feature, capability, dialog, drawer,
    wizard, notification, integration, API, and setting introduced by this
    change has an entry, in the right section, with a named human owner.

□ Every entry declares a visibility
    public / household / admin / developer — chosen deliberately, never
    defaulted or copied. Anything set to public or household is justified
    in the report. Absence of a label is never permission (Rule PKR22).

  ── PERMISSION-AWARE KNOWLEDGE (§11) ────────────────────────────────────

□ Visibility keys on role, never on subscription tier
    A free household may still be TOLD what premium does. Knowing about a
    feature is not access to it (Rule PKR24). Feature gating stays with
    hasPremiumAccess() at the point of use.

□ The registry labels; access.ts decides
    Nothing in this change lets a registry value determine who a user IS,
    or grant access to anything. Authorisation is unchanged and unshared
    (Rule PKR25).

□ Filtering happens before composition
    Content above the user's tier is dropped before the prompt is built —
    never placed in context with an instruction to withhold it (Rule PKR26).

  ── COMPANION KNOWLEDGE (§12) ───────────────────────────────────────────

□ No product knowledge in prompts
    Not one sentence about THA has been written into a system prompt, a
    template, a fallback string, a fine-tune, or a capability's code. If
    the Companion must know it, the registry owns it (Rule PKR27).

□ The Companion cites what it says
    Any product answer traces to a registry id. An answer that cannot cite
    one was invented.

□ Absence is never explained
    Filtered content does not exist, as far as the user is told. The
    Companion never says "there is something here I can't show you" —
    that discloses the very fact the tier protected (Rule PKR29).

  ── INTEGRITY ───────────────────────────────────────────────────────────

□ Every retired thing is retired
    Every surface, capability, or message this change removes or replaces
    has its entry retired IN THIS CHANGE, with a date and a pointer here
    (Rule PKR14). No dormant predecessors. Retired entries are never
    composed into Companion context (§15.4).

□ Hidden means recorded
    Anything shipped-but-unlinked — feature-flagged, unlaunched,
    deliberately unlisted — is in Hidden Experiences with status: hidden
    and visibility: admin. An unrecorded hidden surface is knowledge that
    dies with its author; a mislabelled one is a disclosure.

□ Claims are substantiated
    Every marketing message, benefit, or competitive advantage this change
    enables cites the product truth that makes it true. A claim that cannot
    cite one is not a claim we may make.

□ Citations, not copies
    Does any entry restate data ownership (SoT Register), capability
    architecture (Capability Cards), behaviour (Experience), presentation
    (UI), or authorisation (access.ts)? It must cite them and restate none.

□ Both forms agree
    The machine-readable inventory regenerates cleanly, validates against
    its schema including every visibility label, and maps one-to-one with
    the prose entries (Rule PKR11).

□ Nothing left false
    No entry this change touched now describes something that is no longer
    true. The registry is corrected, never defended (Rule PKR15).

□ The report names the entries
    The implementation report lists every registry entry created, updated,
    or retired — with its visibility.
```

---

## 20. DEFINITION OF DONE — THIS DOCUMENT

**What success looks like:**
- The Product Knowledge Registry is defined as governing architecture, with purpose, scope, sections, ownership rules, permission model, Companion integration, governance, lifecycle, versioning, and folder structure fixed.
- Discovery and ownership are separated, permanently and explicitly (§5).
- Product knowledge is permission-aware by construction, and the registry classifies without ever authorising (§11.4).
- The Companion has a single, governed source of product knowledge, and no licence to duplicate it (§12).
- Every future user-facing implementation has a registry obligation in its Definition of Done — **enforced in `ENGINEERING_WORKFLOW.md` and the implementation template, not merely asserted here** (§16.1).
- `docs/architecture/README.md` lists this document under Platform Governance.

**What must not break:**
- No code, schema, route, runtime, or API behaviour — none is touched.
- No existing ownership. The SoT Register, the Runtime Capability Registry, the Context Composition Engine, `server/lib/access.ts`, the Experience Architecture, and the UI Architecture keep every boundary they had.
- No authorisation path changes. `access.ts` is neither modified nor bypassed nor duplicated.

**Manual verification:**
- `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` exists and is indexed in `docs/architecture/README.md`.
- `ENGINEERING_WORKFLOW.md` contains the Product Registry Compliance block and lists Product Registry Impact as a mandatory section.
- `.engineering/templates/IMPLEMENTATION_TEMPLATE.md` contains a Product Registry Impact section.
- `docs/product/` **does not exist** — this document defines it and does not create it.
- No registry entry has been populated, no capability registered, no query path built.

---

## 21. DATA IMPACT

- Reads existing data: **NO**
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**
- Creates a new source of truth for *data*: **NO** — the SoT Register remains the sole owner of data ownership (Rule PKR1)
- Creates a new source of truth for *authorisation*: **NO** — `server/lib/access.ts` remains the sole authority, unchanged and unshared (Rule PKR25)
- Creates a new source of truth for *product knowledge*: **YES** — that is the entire point of this document, and no such owner existed before it
- Changes what the model reads as grounding: **NOT YET** — `PKR2` defines the path (§12.2) and authorises none of it. INT17 remains the single owner of every byte the model reads, and Product Knowledge will reach it as a Context View like any other.

---

## 22. TRUST CHECK

- **Could this mislead the user?** Not yet — nothing is populated and no query path exists. But `PKR2` creates the *conditions* under which it could, and this document is explicit about that rather than quiet: §12.5 states plainly that a stale entry now reaches households in the Companion's voice, and that **the Companion will be more convincing than the registry is accurate.**
- **Could this fabricate certainty?** The registry's one dangerous failure mode is being *trusted while stale*, and `PKR2` sharpens it from a documentation risk into a user-facing one. Rules PKR15 (corrected, never defended), PKR18 (the changer updates it), §15.3 (90-day presumed-stale, now a trust metric), and §16 (Definition of Done, now enforced in the workflow) exist for exactly this. §12.3 requires the Companion to cite the entry it answered from and to say "I don't know" where the registry is silent — which, today, is everywhere.
- **Could this disclose something it should not?** This is the new risk `PKR2` introduces, and it is answered structurally rather than by care: visibility fails closed to `developer` (Rule PKR22); filtering happens in deterministic code before composition, never by asking the model to keep a secret (Rule PKR26); the registry classifies but never authorises, so a Markdown edit can never become a privilege escalation (Rule PKR25); loosening visibility requires the owner while tightening requires no one (§11.5); and the Companion never explains an absence, because acknowledging withheld content discloses the fact it was withholding (Rule PKR29).
- **Is anything guessed but shown as real?** No. This document defines the registry, the permission model, and the Companion path — and populates, registers, and builds none of them (§20). §23 states convergence honestly as 0%.
- **What happens if the system is wrong?** Nothing at runtime today — nothing reads the registry, because nothing exists to read. Once it does: a wrong entry misinforms; a mislabelled entry discloses. Rule PKR19 guarantees the first can always be fixed without breaking the product, because no code may branch on the registry. The second is guarded by the five structural controls above, not by diligence.
- **Honest gap:** THA has **no `developer` role** today — `users.role` is `user` or `admin` (`docs/roles-and-subscriptions.md`). The `developer` tier is therefore defined here with no runtime role behind it. It fails closed: until such a role exists, `developer`-visibility content is served to **no runtime consumer at all**, and is reachable only by reading `docs/product/` directly. This is stated rather than papered over, and creating that role is not authorised by this document.
- **No architectural duplication introduced:** **YES** — the registry cites Data, Intelligence, Experience, UI, and authorisation ownership and restates none of it. It enters Intelligence as a registered capability through INT17, not through a bespoke path (Rule PKR20).
- **No runtime behaviour altered:** **YES**.

---

## 23. ARCHITECTURE CONVERGENCE STATUS

```
Domain                        Product Knowledge (knowledge about THA itself)
Current Canonical Owner       Product Knowledge Registry (defined by this document, PKR1/PKR2)
Current Runtime Consumer(s)   None. PKR2 DEFINES the Intelligence read path (§12.2) and
                              AUTHORISES none of it. No capability is registered, no query
                              path is built, no byte reaches a prompt.
Duplicate Owners Remaining    Every existing description of the product: 380+ investigations,
                              174+ implementation reports, docs/SMP-Features.md, docs/ui-audit/,
                              README fragments, and code comments. None is authoritative;
                              collectively they are the condition this registry ends.
                              Plus: any product knowledge currently embedded in Companion
                              prompts or capability code — unaudited, and forbidden under
                              Rule PKR27 once the registry exists.
Current Convergence           0%  — the registry is defined; no section is populated
Target Convergence            100% — every one of the 28 sections owned, current, verified
                              within 90 days, and correctly classified for visibility
Next Planned Milestone        A coverage-first population workstream: Domains, Pages, Routes,
                              Journeys (§15.1). Not authorised by this document.
                              The Companion read path (§12.2) comes AFTER content exists —
                              a grounded assistant pointed at an empty knowledge source is
                              worse than an ungrounded one.
Remaining Architectural Risks 1. Population is never started, and this document becomes an
                                 architecture for a registry that does not exist.
                              2. Population is started and never maintained — §16's Definition
                                 of Done obligation is the sole defence. PKR2 wires it into
                                 ENGINEERING_WORKFLOW.md and the implementation template so it
                                 binds by default rather than by memory, but it is still only
                                 as strong as its enforcement in review.
                              3. The Companion path is built before the registry has content,
                                 and THA ships an assistant confidently grounded in nothing.
                              4. A visibility label is set wrong and something admin-tier
                                 reaches a household. Guarded by fail-closed defaults (PKR22),
                                 pre-composition filtering (PKR26), owner-gated loosening
                                 (§11.5), and VISIBILITY.md as a single reviewable surface —
                                 but it remains the highest-severity failure mode PKR2 creates.
                              5. Product knowledge leaks back into prompts because adding one
                                 sentence to a system prompt is faster than adding a registry
                                 entry (Rule PKR27). This is the likeliest rule to be broken
                                 and the hardest to detect after the fact.
```

---

## 24. SCOPE LOCK

**Implemented scope (`PKR1`):** the governing architecture for the Product Knowledge Registry: mandate (§0); purpose (§2); scope (§3); its relationship to Platform, Data, Intelligence, Experience, and UI Architecture, and its precedence beneath all five (§4); the Discovery-vs-Ownership distinction (§5); the ownership rules `PKR1`–`PKR18` (§6, §9, §10, §14); the entry spine (§7); the 28 canonical sections (§8); the ownership model (§9); human- and machine-readable principles (§10); registry governance (§13); update responsibilities (§14); the lifecycle (§15); the Definition of Done obligation (§16); versioning principles (§17); the recommended folder structure beneath `docs/product/` (§18); and the Product Registry Governance Checklist (§19).

**Implemented scope (`PKR2`, this enhancement):** exactly three additions and one amendment. **(1) Permission-Aware Product Knowledge** (§11) — the four tiers `public`/`household`/`admin`/`developer`, the mandatory `visibility` field (§7), monotonic cumulative visibility (Rule PKR23), role-not-subscription keying (Rule PKR24), the classify-never-authorise safety property (Rule PKR25), fail-closed defaults (Rule PKR22), pre-composition filtering (Rule PKR26), and the asymmetric change gate on loosening vs tightening (§11.5). **(2) The Registry as Companion Knowledge** (§12) — query-never-duplicate (Rule PKR27), entry into the platform as a registered Knowledge Capability through INT17 rather than by any bespoke path (Rule PKR20, §12.2), inventory-not-prose as the machine read path (Rule PKR21), absolute permission-aware responses (Rule PKR28), and never-explain-an-absence (Rule PKR29). **(3) Engineering Governance** (§16) — the Definition of Done obligation wired into `ENGINEERING_WORKFLOW.md` (mandatory Product Registry Impact section, Product Registry Compliance block, Completion Gate) and `.engineering/templates/IMPLEMENTATION_TEMPLATE.md`. **(4) The amendment:** `PKR1` §3.3 forbade any runtime read of the registry; `PKR2` replaces that prohibition with Rule PKR19 — *read, never obeyed* — and §3.3 records what changed and why rather than silently overwriting it.

**Explicitly excluded (out of scope — not implemented by `PKR1` or `PKR2`):** any code, schema, route, validator, or runtime change; **the creation of `docs/product/` or any folder beneath it**; **the population of any registry section, entry, or inventory record**; the authoring of the inventory schema; **the registration of the Product Knowledge capability in `server/intelligence/capability-registry.ts`**; **the construction of any query path, permission filter, or Context View**; **any change to `server/lib/access.ts`**; **the creation of a `developer` role**; any change to the Source of Truth Register, the Context Composition Engine, the Runtime or Developer Capability Registries, the Experience Architecture, the UI Architecture, the Intelligence Platform Architecture, the Companion Platform Architecture, or any Capability Card; any audit or removal of product knowledge currently embedded in prompts; any change to an existing investigation or implementation report; and any commit, push, or deployment.

---

*Architecture only. No code was changed in the production of this document. No registry content was created, no capability registered, no query path built.*
*Subordinate to Platform, Data, Intelligence, Experience, and UI Architecture: it describes what THA is; it may not change what THA owns, how it behaves, how it looks, or who may access it, and it yields to all five in any conflict.*
*Rollback: `rollback/PKR1-product-knowledge-registry-20260711` → `a432400`.*
