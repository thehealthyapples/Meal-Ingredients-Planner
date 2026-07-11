# WS9 — Food Alternatives Engine

> **Status:** Implemented (engine + tests + worked examples). No production UX, no Pantry/Planner/Meal/Story UI, no schema/DB change.
> **Reads existing data:** YES (canonical names) · **Writes new data:** YES, additive only (curated alternative relationships in `shared/alternatives/`) · **Changes meaning of existing data:** NO · **Requires backfill:** NO
>
> Builds on the WS7 relationship graph and the WS8 discovery patterns. Follows the
> investigation `WS9_GOAL_DRIVEN_ALTERNATIVES.md` (preserved at commit `17dee8e`),
> which this implementation realises for the brief's five concrete alternative types.

---

## 0. ROLLBACK & SAFETY HEADER (mandatory first step — completed)

| Check | Result |
|---|---|
| Git status clean before work | ✅ Yes — clean working tree on `safety/preserve-since-last-prod-20260617-1613` |
| WS0.12 protected | ✅ `b47afcb` — Catalogue Normalisation & Promotion Readiness (`shared/catalogue/` present on disk) |
| WS7 protected | ✅ `a7eaef5` — Food Relationship Graph (`shared/relationships/` present on disk) |
| WS8 protected | ✅ `0a996f8` — Food Discovery Engine (`shared/discovery/` present on disk) |
| Rollback point created | ✅ Annotated tag **`ws9-rollback-point`** → `0a996f8` (the WS8 HEAD) |
| How to undo all WS9 work | `git checkout ws9-rollback-point` (then delete `shared/alternatives/`, `data/alternatives/`, the test and this doc) |

No implementation began until the rollback point was confirmed and reported.

---

## EXECUTIVE SUMMARY

**Alternatives answer a different question from Discovery, and WS9 keeps them apart in code.**

> Discovery (WS8) asks: **"What else might I enjoy?"**
> Alternatives (WS9) asks: **"What else could work *here*?"**

WS9 is a small, self-contained, **fully curated** editorial layer (`shared/alternatives/`) with a single
entry point, `alternatives(food, context?)`. Given a food it returns options that can fulfil a **similar
role** across the five types the brief specifies — dietary, meal-role, lower-UPF, cuisine, and household
adaptation — each with a friend-voice "why", an optional honesty note, and a dietary-suitability tag set.
There are **no rankings, no scores, no "healthier/better/superior"**, and the anchor food is never framed
as deficient. Alternatives are **possibilities, never obligations**.

Three load-bearing decisions:

1. **WS9 is its own editorial layer, not a re-read of WS7's graph.** The preserved investigation argued
   alternatives could be "a fourth reading of the WS7 graph." In practice the brief's five types are mostly
   **Tier-3 curated** (lower-UPF and cuisine have *no* algorithmic signal; dietary/meal-role swaps need a
   human to confirm the role is preserved) and **half the brief's anchors aren't even canonical foods**
   (bacon, pizza base, beef mince, tomato sauce, breakfast cereal are meal *components*). So WS9 carries its
   own curated seed and its own display names — it reuses WS7/WS8's *trust discipline* and the canonical
   *name index*, but not their derivation. This keeps the catalogue clean and the trust auditable.

2. **One engine, two callers.** The same dietary option pool answers an individual's request *and* each
   member of a household adaptation. The cooked-breakfast / lasagne / pizza-night cases are not a separate
   feature — they are `alternatives()` called with `context.household.eaters`.

3. **Silence is a first-class result.** Milk + "lower UPF" returns *nothing* (plant milks are usually more
   processed — the claim would be dishonest). Greek yoghurt for a vegetarian returns "already suits you, no
   change." `chicken` + `vegan & keto` (empty intersection) returns silence, not a forced compromise. The
   engine fails closed: any option whose wording trips the trust guard is dropped, never shown.

---

## DISCOVERY vs ALTERNATIVES (the distinction, enforced)

| | **Discovery (WS8)** | **Alternatives (WS9)** |
|---|---|---|
| Question | "What else might I enjoy?" | "What else could work here?" |
| Frame | Invitation to curiosity | Fulfil the same **role** |
| Ranking | Yes — familiarity first | **No** — all options equally valid, editorial order kept |
| Needs context | No (food alone is enough) | Optional — diet / lower-UPF / cuisine / household gate it |
| Example | Chicken → *broccoli* would be valid (you might enjoy it) | Chicken → *broccoli* is **rejected** (broccoli can't fill the protein role) |

The brief's warning — *Chicken → Broccoli because "high protein / supports muscle health" is Discovery, NOT
Alternatives* — is honoured structurally: WS9 never reasons from nutrients to a suggestion. Every option is
authored against a **role** ("fills the protein slot", "fills the base role", "the fresh green herb finish"),
and the trust guard bans the benefit-led vocabulary that would let a nutrition argument leak in.

---

## ARCHITECTURE

```
shared/alternatives/
  types.ts            5 alternative types, Diet gate, request/result, section titles
  trust.ts            banned vocabulary (reuses WS8 BANNED_TERMS + WS9 additions); fails closed
  alternatives-map.ts curated editorial seed — 10 anchors, 46 options, alias index
  engine.ts           alternatives(request) — the single entry point + household adaptation
  index.ts            public surface

server/tests/test-alternatives-engine.ts   8 worked examples + gates + trust gate (writes report)
data/alternatives/ws9-alternatives-report.json   preserved worked-example output
```

**Reuse, not duplication:** `trust.ts` imports WS8's `BANNED_TERMS` verbatim (guardrails authored once, per
the WS7 invariant) and extends them; `engine.ts` reuses the canonical name index pattern from WS8 to enrich
anchor names. WS9 adds no schema, no DB, no production UX.

### Data model

```ts
AlternativeType = "dietary" | "meal_role" | "lower_upf" | "cuisine" | "household"
Diet            = vegetarian | vegan | pescatarian | dairy_free | gluten_free
                | nut_free | soya_free | keto | lower_carb

AlternativeOption { slug, name, type, reason, note?, suitableFor: Diet[], cuisine?, source:"editorial" }
AlternativeContext { diets?, preferLowerUpf?, cuisine?, household?:{ eaters:[{name,diets?}] } }
AlternativesResult { anchor, sections:[{type,title,options}], adaptation? }
```

`suitableFor` lists **only** the diets an option genuinely satisfies, and is the basis of the exclusion gate.

---

## ALTERNATIVE CATEGORIES (the five, and only five)

| # | Type | Question it answers | Signal | Example |
|---|---|---|---|---|
| 1 | **Dietary** | "What fits a different dietary choice in this role?" | Curated + `suitableFor` gate | Chicken → tofu, tempeh, lentils |
| 2 | **Meal role** | "What fills the same culinary slot?" | Curated (role-preserving) | Rice → brown rice, quinoa, cauliflower rice |
| 3 | **Lower UPF** | "What's a less-processed way to fill this role?" | Curated (Tier 3 — no algorithm) | Cereal → porridge, bircher, muesli |
| 4 | **Cuisine** | "What plays this role in a different cuisine?" | Curated (Tier 3) | Basil → parsley, coriander, mint |
| 5 | **Household** | "How can one meal adapt for different eaters?" | Dietary pool, per-eater | Beef lasagne → beef (family) / Quorn (Lilly) |

---

## RELATIONSHIP DESIGN

WS9 relationships are **directional, role-scoped, and curated** — `(anchor) --[type]--> (option)` where the
edge carries the *role-preserving reason* and the option carries `suitableFor` tags. Unlike WS7's neutral
food↔food graph, WS9 edges are **goal-oriented**: they exist only because someone might want to fulfil this
role *a different way*. This is why they are authored, not derived.

- **Anchors need not be canonical.** `bacon`, `pizza-base`, `beef-mince`, `tomato-sauce`, `breakfast-cereal`
  are meal components with WS9 display names. Canonical anchors (`chicken`, `milk`, `white-rice`,
  `greek-yoghurt`, `basil`) match catalogue slugs and have names enriched from the catalogue.
- **Aliases** map natural queries to anchors: `rice → white-rice`, `pizza → pizza-base`,
  `processed-sauce / pasta-sauce / jar-sauce → tomato-sauce`, `cereal → breakfast-cereal`.
- **The household adaptation reuses the dietary pool** — no separate edge type. Per eater: keep the anchor
  if they have no constraint or it already fits; otherwise take the first dietary option that satisfies all
  their constraints; otherwise honest silence.

---

## RANKING PHILOSOPHY

**There is none, by design.** Discovery ranks by familiarity (surface what you already love first).
Alternatives must *not*, because reordering by "what you already eat" implies the other options are lesser —
the exact judgement WS9 forbids. Options are returned in **authored editorial order**. Context **filters**
(a gate), it never **ranks**. The only ordering decision is the author's, made once, reviewably, in the seed.

---

## TRUST RULES (enforced in `trust.ts`, asserted in tests)

**Never** (banned substrings, case-insensitive, fail closed): *better, healthier, healthiest, superior,
best, worse, unhealthy, superfood, optimal, upgrade, should switch, should swap, ditch the, give up, guilt,
clean eating, detox, good/bad/better for you, the right choice, real food, you should…* (full list =
WS8 `BANNED_TERMS` + `ALTERNATIVES_EXTRA_BANNED`).

**Prefer** (the authored voice throughout the seed): *"can fulfil a similar role", "a popular vegetarian
option", "often used in…", "a common dairy-free choice", "frequently chosen by…", "many households enjoy"*.

**The grammar test** (the one rule behind the list): *could a kind, knowledgeable friend say this sentence to
your face, about a food you just chose, without it sounding like a correction?* If not, it's banned. All 46
authored options pass; the test harness asserts it as a hard gate across every anchor.

**The Alternative Test** (every option satisfies at least one): can a person realistically use this *in the
same meal*, OR *for the same goal*, OR *for the same dietary need*? If no → it isn't in the seed.

---

## API DESIGN — investigated, ONE recommended

Three shapes were weighed:

| Shape | Verdict |
|---|---|
| `alternatives(food)` | **Too thin.** Can't express the exclusion gate (vegan/GF) or household adaptation — both central to the brief. |
| `alternatives(food, goal)` | **Too narrow.** A real request carries *several* things at once — a diet *and* a lower-UPF preference *and* a cuisine *and* a household of eaters. A scalar goal can't hold all four. |
| **`alternatives(food, context?)`** | **Recommended.** Mirrors WS8's `discover(request)`: one endpoint, an optional context bag, sections filtered by what's asked. **Absent context → all possibilities** (alternatives are possibilities). **Present context → the gate narrows to what fits.** |

```ts
alternatives({ food: "chicken" })                                  // all possibilities
alternatives({ food: "chicken", context: { diets: ["vegan"] } })   // gated to vegan options
alternatives({ food: "rice",    context: { diets: ["keto"] } })    // → cauliflower rice
alternatives({ food: "processed-sauce", context: { preferLowerUpf: true } })  // → passata, …
alternatives({ food: "beef-mince", context: { household: { eaters: [
  { name: "Family" }, { name: "Lilly", diets: ["vegetarian"] } ] } })          // adaptation
```

One engine, two callers: the same dietary pool answers an individual request and each household member.

---

## WORKED EXAMPLES (all eight; full output in `data/alternatives/ws9-alternatives-report.json`)

For each: the **why** is role-anchored. "Silent" entries are deliberate — the honest answer is no change.

### Chicken
- **Dietary:** tofu, tempeh, lentils, chickpeas, Quorn pieces — *all fill the protein role; tofu/tempeh/lentils/chickpeas are vegan, Quorn vegetarian.* (WHY: popular plant proteins that cook in chicken's place.)
- **Meal role:** turkey, pork — *light meats, same preparation, no method change.*
- **Lower UPF:** **silent** — chicken is already a whole food.
- **Household:** vegetarian eater → tofu/tempeh in the protein slot; everyone else shares the chicken.

### Milk
- **Dietary:** oat (closest for tea/cereal), soy (closest on protein), almond (lower protein — honesty note) — *common dairy-free choices.*
- **Meal role / Lower UPF:** **silent** — milk is minimally processed; calling a plant drink "less processed" would be dishonest (the clearest silence case).
- **Household:** dairy-free eater → soy/oat; others share the milk.

### Rice (`white-rice`)
- **Meal role:** brown rice (nuttier — note), quinoa (firmer — note), bulgur wheat, cauliflower rice (lighter, doesn't absorb sauce — note) — *all fill the starchy base role.*
- **Dietary:** rice is already vegan + GF, so dietary is **mostly silent** — except **keto**, where the gate surfaces cauliflower rice.
- **Lower UPF:** silent (plain grain). **Household:** keto eater → cauliflower rice; GF eater → drops bulgur, keeps the rest.

### Greek yoghurt
- **Meal role:** skyr, kefir (pours — note), cottage cheese (lumpier — note) — *same thick, high-protein role.*
- **Dietary:** soya yoghurt (closest on protein), coconut yoghurt (lower protein — note) — *dairy-free pots.*
- **Lower UPF:** plain Greek yoghurt vs the flavoured pots — *the honest move is within the food.*
- **Household:** a vegetarian eater → **"already suits you"** (no manufactured swap — the key affirming case).

### Bacon
- **Dietary:** meat-free rashers, tempeh, eggs — *keep the savoury fry-up role.*
- **Meal role:** sausage, mushrooms — *another savoury breakfast element.*
- **Lower UPF:** grilled fresh pork (different texture — note), eggs — *less processed than cured rashers.*
- **Household:** the brief's cooked breakfast — vegetarian eater → meat-free rashers; others share the bacon.

### Pizza base
- **Dietary / base variations:** gluten-free base (crisper — note), keto base (softer — note), wholemeal base — *so the whole household can share pizza night.*
- **Lower UPF:** homemade dough.
- **Household:** the brief's pizza night — GF eater → GF base, keto eater → keto base, others → traditional.

### Beef mince
- **Dietary:** Quorn mince (vegetarian), soya mince (vegan), lentils — *same savoury base in bolognese/chilli/lasagne.*
- **Meal role:** turkey mince, pork mince — *brown and season the same.*
- **Lower UPF:** plain mince vs ready-seasoned mixes.
- **Household:** the brief's lasagne — Lilly (vegetarian) → Quorn mince; family → beef.

### Tomato sauce (jar)
- **Lower UPF:** passata, chopped tomatoes, homemade (longer to cook — note) — *minimally processed, same sauce role, you season it.*
- **Dietary:** already plant → silent. **Meal role:** silent (the sauce *is* the role).

Plus two type-completeness anchors: **breakfast cereal** (lower-UPF → porridge / bircher / muesli) and
**basil** (cuisine → parsley = European, coriander = Asian & Latin American, mint = Middle Eastern).

---

## HOUSEHOLD ADAPTATION

> Can alternatives support **one meal → different eaters**? **Yes — it's the same engine.**

Per eater, over a shared anchor:

1. No dietary constraint, or the anchor already fits → **keep the shared dish** (`shared: true`).
2. Otherwise → the **first dietary option that satisfies all their constraints** (`shared: false`).
3. Nothing fits → **honest fallback** ("no catalogued alternative yet — a separate option may suit better").

The brief's three cases are direct test fixtures and pass:
- **Cooked breakfast:** Dad → bacon (shared); Lilly (vegetarian) → meat-free rashers.
- **Lasagne:** Family → beef mince (shared); Lilly (vegetarian) → Quorn mince.
- **Pizza night:** Parents → traditional base; Lilly (GF) → GF base; Dad (keto) → keto base.

**Can this become Planner / Meal / Household-compatibility intelligence?** Yes — the `HouseholdAdaptation`
shape (`anchor` + per-member `{eater, slug, name, shared, reason}`) is exactly a "shared base + per-member
swap" plan. A Planner can read it to build a single shopping list with per-person variations; a Meal page can
render "for the household"; a compatibility view can show who shares and who adapts. **No UI is built here**
— only the data the future consumers would read.

---

## VALIDATION (every option answers all four — else it's rejected from the seed)

1. **Would a household understand this?** — plain names, friend-voice reasons.
2. **Could they realistically cook with it?** — role-preserving; honesty notes flag texture/taste shifts.
3. **Does it preserve the spirit of the meal?** — role-anchored; cuisine/household keep the dish shareable.
4. **Does it feel helpful, not judgemental?** — trust guard + grammar test; possibilities, never obligations.

---

## TRUST CHECK — could alternatives become harmful?

| Risk | Prevented by |
|---|---|
| **Preachy** | No verdict on the anchor; possibility framing ("can", "often", "many"); no rankings. |
| **Imply guilt** | "guilt", "should switch", "clean eating", "detox" banned; the affirming "already suits you" path. |
| **Force vegetarianism** | Dietary options are *offered alongside* meat meal-role options; the gate only narrows when the household *states* a diet (pull, not push). |
| **Force low UPF** | Lower-UPF is one section among five, shown only when relevant; **silent** when a low-UPF claim would be dishonest (milk). |
| **Nutritionally misleading** | WS9 never reasons from nutrients to a suggestion (that's Discovery); reasons are role-claims, not health claims; honesty notes on every material difference. |

---

## FUTURE CONSUMERS — can WS9 power them? (data only; no UI built)

| Consumer | Yes? | How |
|---|---|---|
| **Meal Pages** | ✅ | `sections` render as "could fill a similar role" on an ingredient. |
| **Planner** | ✅ | `adaptation` is a shared-base + per-member-swap plan → one list, per-person variations. |
| **Household Compatibility** | ✅ | `adaptation.members[].shared` shows who shares vs adapts a dish. |
| **Dietary Adaptation** | ✅ | `alternatives(food,{diets})` is the per-person exclusion gate. |
| **Shopping** | ✅ | Option `slug`s map to catalogue/components for substitute purchase. |
| **Pantry Explore** | ✅ | "have X, want a lower-UPF / different-diet option?" → `alternatives(X, context)`. |

---

## RISKS

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | The word "alternative" implies the current food was deficient | High | Role-anchored, possibility framing; no verdict on the anchor; pull-not-push (context-gated). |
| R2 | A "less processed" claim that isn't honestly true (e.g. milk) | High | Lower-UPF stays **silent** where the claim doesn't hold; honesty notes elsewhere. |
| R3 | Forcing a diet the household didn't ask for | High | Dietary options sit alongside meat meal-role options; the gate only fires on a *stated* diet. |
| R4 | Cultural erasure (swapping a staple unprompted) | High | Pull, not push — alternatives surface only on request; silence is first-class. |
| R5 | Empty intersection → forced compromise | Medium | The gate returns nothing rather than a wrong swap (chicken + vegan&keto → silent). |
| R6 | Curated seed drifts into judgement language over time | Medium | Trust guard runs at read time + asserted over every option in CI test. |
| R7 | Anchor not canonical → name/identity confusion | Low | WS9 carries its own display names; canonical names enriched where the slug matches. |

---

## FINAL QUESTION

> When THA says "Alternative choices", should a household think *"That could work"* — or ideally
> *"Great. We can still enjoy this meal together"*?

**WS9 is built for the second.** The household-adaptation result is literally a plan for *one shared meal,
adapted so everyone eats together* — Dad's bacon, Lilly's meat-free rashers, over the same fry-up; the
family's beef lasagne and Lilly's Quorn one from the same recipe; one pizza night, three bases. Alternatives
are framed as possibilities that **keep the meal shareable**, never as a correction to what someone chose.
The most trustworthy answer is often *"this already suits you"* or a deliberate silence — and WS9 gives those
first-class standing alongside the suggestions.

---

## DEFINITION OF DONE — CHECKLIST

- [x] Alternatives Engine implemented (`shared/alternatives/`, single `alternatives()` API)
- [x] Five alternative types implemented (dietary, meal-role, lower-UPF, cuisine, household)
- [x] Household adaptation explored & implemented (cooked breakfast / lasagne / pizza night pass as tests)
- [x] API proposed and ONE recommended (`alternatives(food, context?)`, with rationale)
- [x] Trust rules enforced (banned vocab reused from WS8 + WS9 additions; fail closed; asserted in CI test)
- [x] Worked examples completed (all eight, with WHY; preserved JSON report)
- [x] Future consumers identified (Meal / Planner / Household / Dietary / Shopping / Pantry — data only)
- [x] No Pantry/Planner/Meal UI, no Stories, no production UX change
- [x] Reads existing data; writes only additive curated alternative relationships; no backfill

---

## SUGGESTIONS (future ideas — explicitly out of scope; no implementation)

- **SUGGESTION:** Widen the curated seed beyond the 10 anchors as households ask for more foods (the seed is
  designed to grow one reviewed anchor at a time).
- **SUGGESTION:** A `role` read derived from `meal_templates` slots, so alternatives can be queried per *slot
  in a specific meal* (e.g. "alternatives to bacon *in this carbonara*") — the investigation's role
  abstraction. Would let the same anchor return different options by context.
- **SUGGESTION:** A conservative soft-goal layer (higher-fibre / higher-protein) over the WS0 nutrition seam,
  gated by a *meaningful* delta threshold, feeding the same silence contract — kept out of v1 because the
  honest version is mostly silence.
- **SUGGESTION:** A household "declined / seen" memory so an adaptation never re-suggests a swap a member
  already turned down (anti-nagging).
- **SUGGESTION:** A "shopping substitute" surface mapping option slugs to catalogue products for in-basket
  swaps.
- **SUGGESTION:** Seasonal-availability awareness on cuisine/meal-role options (overlaps WS8 seasonal seed).

---

*End of WS9 investigation + implementation. Engine, tests and worked examples are committed; production UX is
untouched. Rollback: `git checkout ws9-rollback-point` then remove `shared/alternatives/`, `data/alternatives/`,
`server/tests/test-alternatives-engine.ts` and this doc.*
