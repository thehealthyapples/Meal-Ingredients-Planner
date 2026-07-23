# THA Living Larder Asset Specification Library

**Document ID:** `ASSET1`
**Date:** 2026-07-23
**Status:** GOVERNING — the canonical asset specification library for the Living Larder · specifications only, no artwork created
**Rollback identifier:** `rollback/living-larder-asset-library-20260723` → `a8b22162`
**Author of record:** Colin Clapson (owner) · drafted by Claude under the Engineering Workflow
**Classification:** Experience Architecture — the physical asset specification library (subordinate to the Larder canon)
**Governing documents:** [`LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md`](./LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md) · [`LIVING_LARDER_INTERIOR_ARCHITECTURE.md`](./LIVING_LARDER_INTERIOR_ARCHITECTURE.md) · [`LIVING_LARDER_INTERACTION_CONSTITUTION.md`](./LIVING_LARDER_INTERACTION_CONSTITUTION.md) · [`LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md`](./LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md) · [`THA_CRAFTSMANSHIP_CONSTITUTION.md`](./THA_CRAFTSMANSHIP_CONSTITUTION.md) · [`THA_KEPT_ROOM_TRANSLATION.md`](./THA_KEPT_ROOM_TRANSLATION.md)

---

## Purpose

The Living Larder should no longer rely on CSS approximations of furniture. Every shelf, jar, basket, and drawer used within the room must be drawn from a permanent library of beautifully crafted assets — a canonical source of truth from which artwork will later be generated, never re-drawn or improvised.

This document defines **the specification for every asset**, not the artwork itself. These specifications become the permanent foundation. They are:

- **Not artwork:** The document creates no images, no SVG, no illustrations. It creates the canonical *description* from which artwork will be generated.
- **Not implementation:** It does not modify application code, create components, or build the room. It specifies what exists inside the room.
- **The permanent source of truth:** Once an asset is specified here, every future rendering — SVG, PNG, 3D, animation, React component, AI-generated — draws from this specification, never redraws it.

---

## The Asset Library Principle

Think like Pixar. Think like LEGO. Think like a furniture maker.

**The implementation should compose existing assets. It should never redraw them.** Every shelf in THA should be the same shelf. Every jar should be the same jar. Every basket should be the same basket. This requires a *canonical library* — one place where every asset is specified completely, one time, and reused forever.

This is why the library exists: to retire the ad-hoc, CSS-approximated, context-specific versions of "a shelf" or "a jar" and replace them with **one shelf, one jar, one basket** — specified once, reused everywhere.

---

## For Every Asset — The Specification Frame

Every asset in this library is specified across **twenty-one dimensions**, in this order:

| Dimension | Purpose |
|---|---|
| **1. Name** | The canonical, singular name the asset is known by — *"the tall storage jar,"* not *"jar (large)."* |
| **2. Purpose** | Why this asset exists in the Larder — the rhythm of family life it serves. |
| **3. Category** | The asset class it belongs to — joinery, storage, cold appliance, etc. |
| **4. Construction** | How it is built — materials, joinery, structural system. |
| **5. Materials** | The physical substances that compose it — wood, ceramic, glass, metal. |
| **6. Finish** | Surface treatment — natural, waxed, painted, glazed. |
| **7. Colour palette** | The colour range and reasoning — never a specific hex, always the *why*. |
| **8. Scale** | Physical dimensions, proportions, and the reasoning that produced them. |
| **9. Perspective** | How it is seen — from what angle, at what eye level, against what. |
| **10. Lighting behaviour** | How light falls on it — reflection, shadow, translucency. |
| **11. Shadow behaviour** | The shadow it casts and holds — depth, softness, shape. |
| **12. Texture** | Surface quality — grain, glaze, patina, wear. |
| **13. Wear** | How time is visible on it — wear patterns, aging, patina development. |
| **14. Variants** | Sizes, materials, or versions of this asset — always within one specification. |
| **15. Relationship to neighbours** | How this asset relates to adjacent objects — spacing, alignment, visual continuity. |
| **16. Accessibility** | How this asset serves all users — reach heights, legibility, operability. |
| **17. Animation** | How this asset behaves when acted upon — opening, sliding, lifting. |
| **18. Future extensibility** | How this asset grows or changes — additional shelves, expanded storage. |
| **19. Canonical owner** | Who owns this asset — who maintains the specification and approves changes. |
| **20. Rendering guidance** | Direction for future renderers — style, realism level, medium compatibility. |
| **21. Quality standard** | The craftsmanship bar this asset must clear. |

No asset may ship without all twenty-one dimensions specified.

---

## Asset Quality — The Feeling Standard

Every asset should feel:

- **Hand crafted** — made with intention, care, and skill visible in detail
- **Timeless** — will not feel dated in five years, or fifty
- **Warm** — inviting, lived-in, not austere or clinical
- **Natural** — real materials, honest joinery, no fakery
- **Real** — never cartoon, never icon, never illustration
- **Beautiful** — restrained beauty, not ornate
- **Restrained** — quiet, not demanding attention
- **Quiet** — supporting the room, not competing with life
- **Domestic** — made for a home, not a shop or a museum
- **Lived in** — showing the patina of use and time

### Explicitly avoided in every asset:

- Icons or symbol-based imagery
- Clip art or stock illustration
- Cartoon styling or exaggeration
- UI symbolism or app-like appearance
- Skeuomorphic gimmicks or false depth
- Cheap, trendy, or fashionable materials
- Anything designed to draw attention to itself
- Ornament for its own sake

---

## The Canonical Style

The visual language is inspired by — but does not copy — these sources:

- **deVOL Kitchens:** Timeless, handmade, British craftsmanship; honest joinery and natural materials
- **Neptune:** Calm, restrained palette; furniture as background to life, not statement pieces
- **Plain English Kitchens:** Simplicity, natural finishes, oak and stone; understated quality
- **Garden Trading:** Functional beauty; materials and forms earned by use
- **Aesop:** Restraint and craft in every detail; colour and material chosen with intention
- **The White Company:** Warmth through simplicity; natural fibres, neutral palette
- **Traditional British pantry craftsmanship:** The pantry as a room of real keeping, not storage theatre

The direction is **capture their feeling, not copy their look.** Every asset carries the sensibility of these makers — honest materials, visible care, the quiet confidence of things made well — without borrowing their specific palette or forms.

---

## Asset Categories — The Library Structure

The library is organized into eight categories, each containing the specific assets the Living Larder holds:

### **A. JOINERY — Storage Furniture**

The permanent architectural elements — the shelves, cupboards, drawers, and surfaces that form the room's bones.

#### A1 — Open Shelving (the dominant surface)

**Single Shelf**
- **Purpose:** The ordered stratum for viewing and reaching provisions at one level
- **Category:** Shelving
- **Construction:** Solid timber shelf, bearing directly on fixed end supports or a frame
- **Materials:** Oak, ash, or walnut — wood chosen for grain and colour warmth
- **Finish:** Natural oil finish or waxed, never painted; the grain is visible
- **Colour palette:** Warm honey, warm grey, pale blonde — the timber's own colour range, never stained artificial
- **Scale:** 750mm deep (to receive jars and packets without overhang); width variable by bay (800mm to 1800mm); thickness 30mm or greater to show solidity
- **Perspective:** Seen from standing height, at eye level when reaching; shelves descend from most-used (at hand) to less-used (higher/lower)
- **Lighting behaviour:** Light falls across the shelf and reads the texture of grain; no hidden shadows under the shelf edge
- **Shadow behaviour:** A soft shadow falls beneath the shelf, depth enough to read the shelf's thickness; shadow increases in warmth near the wall
- **Texture:** Grain visible and tactile; the shelf feels like wood, not lacquer
- **Wear:** The shelf top shows the patina of handling — dust, light scratches from jars, the warmth of wear; this is honest aging, never artificial distressing
- **Variants:** 800mm, 1000mm, 1200mm, 1600mm widths; one thickness standard (30mm) to maintain visual weight
- **Relationship to neighbours:** Evenly spaced vertically (375mm to 450mm between shelves); the air between them is as important as the shelves themselves; alignment with adjacent runs is exact
- **Accessibility:** Lowest shelf 450mm from floor (bend-able reach); highest reach shelf 1750mm (stretch-able reach); the most-used reach (eye level to waist) reserved for daily staples
- **Animation:** Shelves are static; motion belongs to the objects on them, not the furniture
- **Future extensibility:** Shelves may be added between existing supports without alteration to the room's structure (reserved bays); spacing remains consistent
- **Canonical owner:** Home Owner (aesthetic approval); Designer (specification custody)
- **Rendering guidance:** Grain direction consistent within a run; wood tone warm and true; the surface shows both grain and the flatness of milled timber
- **Quality standard:** The shelf must look like a shelf a furniture maker would build — solid, honest, made to last
---

**Double Shelf** (two shelves in one visual unit, separated by structural support)
- **Purpose:** To create visual rhythm and break up a run of shelving into smaller units that feel composed rather than industrial
- **Category:** Shelving
- **Construction:** Two single shelves mounted in a frame or on shared end supports; the visual "frame" between them is minimal
- **Materials:** Oak, ash, or walnut; materials matching single shelves
- **Finish:** Natural oil or wax; grain visible
- **Colour palette:** As single shelf
- **Scale:** Top shelf 750mm deep, 800–1200mm wide; bottom shelf matching; 600mm separation between shelves
- **Perspective:** Read as two distinct levels, not as one unified surface; the space between is legible
- **Lighting behaviour:** Light falls independently on each shelf; the space between reads as air, not shadow
- **Shadow behaviour:** Shadow beneath top shelf; softer, warmer shadow between the shelves (depth without heaviness); shadow beneath bottom shelf adds grounding
- **Texture:** Grain visible on both shelves; grain direction may differ subtly to show the shelves as separate pieces
- **Wear:** Both shelves show honest patina; wear patterns independent (the top shelf shows different reach marks than the bottom)
- **Variants:** Top-and-bottom stacking; left-and-right pairing (where a vertical support appears between two runs)
- **Relationship to neighbours:** Aligns exactly with adjacent double shelves; the frame between the two shelves is visual punctuation, not structure
- **Accessibility:** Ensures both shelves are in the 450mm–1750mm human reach range
- **Animation:** Static
- **Future extensibility:** May be added or replaced within a bay without altering the room
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** The shelves are two pieces, visually distinct but compositionally unified; the space between is the thing that makes them "double"
- **Quality standard:** A double shelf reads as two separate things arranged as one, not as a built-in unit
---

**Corner Shelf**
- **Purpose:** To make use of the corner where two walls meet and maximize the storage of the highest-reach area
- **Category:** Shelving
- **Construction:** A single shelf angled 45° to the corner, or two shelves meeting at the corner line, supported on end brackets
- **Materials:** Oak, ash, or walnut
- **Finish:** Natural oil or wax
- **Colour palette:** As single shelf; corner shelf may be slightly darker (shadow of the corner) or lighter (the corner receives light)
- **Scale:** 600mm × 600mm from corner point, or two 450mm-deep shelves meeting; depth sufficient for jars and boxes
- **Perspective:** Seen from the room, not deep into the corner; the shelf reads as accessible, not hidden
- **Lighting behaviour:** The corner catches light differently — often softer, sometimes sharper depending on window and facing wall; the shelf's finish responds honestly to this light
- **Shadow behaviour:** The corner naturally casts a shadow; the shelf's shadow is subtle enough not to hide its contents
- **Texture:** Grain visible; the corner shelf is not treated differently than straight shelves
- **Wear:** Wear is lighter (corners are less-reached areas) but visible where it does occur
- **Variants:** 45° single shelf; two perpendicular shelves meeting; deep corner (900mm × 900mm) for rarely-used storage
- **Relationship to neighbours:** The corner shelf connects two runs of shelving; alignment is precise at the corner line; no visual gap or overlap
- **Accessibility:** Corner shelves are typically higher (800mm+) and serve occasional-reach items
- **Animation:** Static
- **Future extensibility:** May be added to empty corners as the room grows
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** The corner shelf shows the corner's architecture (it does not hide behind a false front); the wood grain reads naturally through the angle
- **Quality standard:** A corner shelf is not awkward or cramped; it is a natural use of a corner, not a workaround

---

#### A2 — Cupboards (enclosed keeping)

**Single Cupboard**
- **Purpose:** Enclosed storage for what does not want to be on show; a door you open to reveal what you already know is there
- **Category:** Joinery
- **Construction:** Frame and panel; a single door (full-overlay or inset) on solid supports; interior shelf or open cavity
- **Materials:** Oak frame; panel may be solid wood or a simple timber frame with a painted centre panel
- **Finish:** Door may be natural wood (matching shelves) or painted (soft, muted colour); no high-gloss; finish must feel like it belongs to the room
- **Colour palette:** If natural, as shelves; if painted, a warm neutral (soft grey, pale cream, warm taupe) — no bold colour
- **Scale:** 600–1000mm wide; 800–1200mm tall; 350–450mm deep (inset storage, not building out into the room)
- **Perspective:** The door is seen from standing height; the interior is revealed only when opened
- **Lighting behaviour:** The door's finish reads the room's light; it is not shiny or reflective
- **Shadow behaviour:** The door casts a soft shadow from the frame; opening reveals shadow inside
- **Texture:** Paint or wood finish is smooth to the touch; hardware is simple, visible, and honest
- **Wear:** The door edge (where hands grip) shows light wear; the finish is robust enough to age well
- **Variants:** Single door inset or overlay; side-hinged or top-hinged
- **Relationship to neighbours:** The cupboard is flush with surrounding shelving or integrated into a bay; no protruding handles
- **Accessibility:** Door is operable at one-handed pull; interior is reachable for a standing adult
- **Animation:** The door opens and closes; it is smooth, without bounce or slam; the motion is calm
- **Future extensibility:** May be replaced with open shelving or a different cupboard type without altering adjacent furniture
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** The cupboard is a simple, honest door — no decoration, no surprise; the interior is either shadow (empty) or shelves (holding)
- **Quality standard:** A cupboard is built like furniture, not like cabinetry; it fits into the room as a piece, not as a built-in fixture

---

**Double Cupboard**
- **Purpose:** Larger enclosed storage, often for the overflow of the dry store or bulk items
- **Category:** Joinery
- **Construction:** Two single cupboards side by side, sharing a central support, or one cupboard with double doors
- **Materials:** Oak; doors may be natural wood or painted
- **Finish:** As single cupboard
- **Colour palette:** As single cupboard
- **Scale:** 1200–1600mm wide; 800–1200mm tall; 350–450mm deep
- **Perspective:** The doors are the room's focus; opening reveals an organized interior
- **Lighting behaviour:** Symmetrical light reading across both doors
- **Shadow behaviour:** Central shadow (the support between doors) adds visual weight; shadows inside reveal the cupboard's depth
- **Texture:** As single cupboard
- **Wear:** Wear is symmetrical across both doors (they are opened equally)
- **Variants:** Two single-door cupboards; one double-door cupboard; mixed (one door natural, one painted)
- **Relationship to neighbours:** Occupies a full bay width; flanked by open shelving or other cupboards
- **Accessibility:** Both doors operable; interior is fully reachable
- **Animation:** Doors open independently or together; motion is smooth and calm
- **Future extensibility:** May be subdivided into two single cupboards or replaced with open shelving
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** The double cupboard is visually unified, not two separate pieces; the central support is visible and structural
- **Quality standard:** A double cupboard is well-proportioned and balanced; it does not feel institutional or over-built

---

**Tall Pantry Cupboard**
- **Purpose:** Full-height storage for bulk dry goods, seasonal items, and overflow — the pantry's "deep cupboard"
- **Category:** Joinery
- **Construction:** Tall frame, single or double door, with adjustable or fixed interior shelves
- **Materials:** Oak frame; painted door (soft colour); interior shelves may be timber or simple wire
- **Finish:** Painted door (soft, warm neutral); interior left simple
- **Colour palette:** Door colour: warm grey, pale cream, or soft sage — a colour that recedes into the room
- **Scale:** 600–800mm wide; 1800–2200mm tall (full reach height); 350–450mm deep
- **Perspective:** Rises above eye level; the top shelves are reached by standing or a step stool; the door is the main visual element
- **Lighting behaviour:** The painted door reads the room's light softly; no shine
- **Shadow behaviour:** Strong shadow beneath the cupboard (it rises from floor); softer shadow inside when opened
- **Texture:** The paint is smooth; the door is simple and unfussy
- **Wear:** The door handles show wear; the paint ages gracefully
- **Variants:** Single door; double door (tall, narrow doors); painted or natural wood
- **Relationship to neighbours:** The tall cupboard "anchors" a corner or the end of a run; it is a visual weight in the room, placed with intention
- **Accessibility:** Upper shelves require a step or reaching; lower shelves are accessible without assistance
- **Animation:** The door opens easily; opening requires slightly more effort (the weight is honest)
- **Future extensibility:** Shelves may be adjusted; the cupboard may be removed and the space opened
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** The tall cupboard is a focal point; it should feel solid, trustworthy, and not flimsy or tall-and-thin
- **Quality standard:** A tall cupboard is proportioned so it feels present but not dominating; it belongs in the room, not towers over it

---

#### A3 — Deep Drawers (for the low, heavy, and loose)

**Single Deep Drawer**
- **Purpose:** Storage for bags of flour and rice, loose vegetables, the odds and ends; contents are seen from above when the drawer is pulled
- **Category:** Joinery
- **Construction:** Timber frame on runners; a deep interior (300–400mm); the drawer front is simple timber or painted panel
- **Materials:** Oak or beech inside; oak outside; painted front is optional
- **Finish:** Drawer front may be natural or painted; interior left simple; runners are smooth and strong
- **Colour palette:** Front as cupboard (natural or soft paint); interior neutral
- **Scale:** 600–1000mm wide; 300–400mm deep; 200–300mm tall (enough to see all contents at once)
- **Perspective:** The drawer is pulled toward you, contents seen from above; when closed, only the front is visible
- **Lighting behaviour:** When open, light enters the drawer from above; the interior is brightly lit
- **Shadow behaviour:** The open drawer casts a shadow beneath; the interior shadow is minimal (well-lit)
- **Texture:** The drawer front is smooth; the inside is simple and unfinished (or painted a practical colour)
- **Wear:** The top edge of the drawer front shows hand wear; the runners show the patina of use
- **Variants:** Single drawer (600–800mm), double width (1000–1200mm), stackable (two shallow drawers instead of one deep)
- **Relationship to neighbours:** Drawers sit below open shelving or within a cupboard; they are functional, not decorative
- **Accessibility:** The drawer is opened and closed by one hand; contents are reached without removing the drawer
- **Animation:** The drawer slides smoothly; it does not bounce back or require two hands to close
- **Future extensibility:** Drawers may be added below existing shelving or replaced
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** The drawer front is simple and honest; the interior is not decorated or over-finished
- **Quality standard:** A drawer slides like a real drawer (not a cheap, stiff mechanism); it lasts decades of daily use

---

#### A4 — Working Surface (warm oak, the still point)

**Kitchen Counter / Baking Surface**
- **Purpose:** The one place in the Larder that is a working surface before it is storage; where baking happens, where provisions are laid out, the still point
- **Category:** Joinery
- **Construction:** A solid oak top on a simple frame or leg structure; edge is finished cleanly (no sharp corners)
- **Materials:** Solid oak (light to warm honey tone); the grain runs horizontally (the direction of work)
- **Finish:** Oil-finished, never sealed or poly'd; the wood can be lightly sanded and re-oiled over time
- **Colour palette:** Warm honey, pale blonde, or warm grey-oak — no stain; the timber's own colour
- **Scale:** 1000–1200mm wide; 600–750mm deep; 750–850mm high (standing work height); substantial thickness (40mm+ of visible edge)
- **Perspective:** Seen from standing position; it is a human-scaled working surface, not a counter in a commercial kitchen
- **Lighting behaviour:** Light falls across the work surface; the grain is clearly visible
- **Shadow behaviour:** The shadow beneath the counter shows its depth; the shadow is warm, not harsh
- **Texture:** The oak is tactile and warm to the touch; the grain is visible and varied
- **Wear:** The surface shows the patina of use — flour dust, moisture rings, the marks of rolling pins, the warmth of handling
- **Variants:** With or without storage shelves beneath; moveable or fixed
- **Relationship to neighbours:** The counter sits at the heart of the room or at the junction of wings; it is the organizing point
- **Accessibility:** Counter height is standard work height (750–850mm); overhang beneath allows a seated person to work
- **Animation:** The counter is static; motion (and life) happens on it, not to it
- **Future extensibility:** The counter may be extended or replaced; it is a removable element, not built-in
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** The counter is beautiful because it is honest wood, properly proportioned, and well-finished — not because of ornament
- **Quality standard:** A counter should feel like a furniture-maker's work surface, not a kitchen showroom; it is made for real use

---

### **B. COLD STORAGE — Refrigeration**

#### B1 — The Fridge (the most-opened door)

**Standard Refrigerator**
- **Purpose:** Cold keeping for dairy, proteins, opened jars, leftovers, fresh herbs, salads
- **Category:** Cold appliance
- **Construction:** Cabinet with interior shelves, drawers, and compartments; a sealed cold interior; an insulated door
- **Materials:** Exterior is typically painted (soft, warm neutral matching the room) or stainless steel; interior is simple metal or plastic; seals are rubber
- **Finish:** Painted exterior should be a warm, muted colour (soft grey, pale cream, warm taupe); stainless steel is acceptable but should be brushed, not mirror-polished; the exterior reflects the room, not a showroom
- **Colour palette:** Exterior: warm neutral (soft, not trendy); interior: neutral and simple
- **Scale:** Standard fridge width (600–700mm); standard depth (600–650mm); standard height (1700–1800mm); proportioned to fit without dominating the room
- **Perspective:** The fridge is seen from the room; the door is the main visible surface; opening reveals the organized interior
- **Lighting behaviour:** The fridge exterior reads the room's ambient light; the door is not reflective; interior light is soft and even
- **Shadow behaviour:** The fridge casts a soft shadow at its base; the shadow grounds it in the room
- **Texture:** The door is smooth to the touch; hardware (handle, hinges) is simple and visible; no unnecessary ornamentation
- **Wear:** The door edge shows light wear from handling; the exterior shows dust and fingerprints as normal life; this is honest wear
- **Variants:** Standard depth or shallow (for smaller rooms); single door (smaller households) or double door (larger households); with or without ice dispenser
- **Relationship to neighbours:** The fridge occupies its own section of the cool wing; it may be flanked by open shelving or a freezer
- **Accessibility:** Interior shelves are within standard reach; door opens easily and stays open without help
- **Animation:** The door opens and closes smoothly; the interior reveals without surprise; the light comes on (honest automation)
- **Future extensibility:** The fridge may be replaced with a newer model without altering the room
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** The fridge should feel like an honest appliance in the room, not a showroom display; it is clean but lived-in
- **Quality standard:** A fridge works reliably; its appearance supports the room's calm, not distracts from it

---

#### B2 — The Freezer (the deep reserve)

**Standard Freezer (chest or upright)**
- **Purpose:** Long cold keeping for frozen vegetables, fish, meat, bread, batch-cooked meals — the household's deep reserve
- **Category:** Cold appliance
- **Construction:** Cabinet with interior compartments or drawers; a sealed, heavily insulated cold interior
- **Materials:** Exterior painted (soft, warm neutral) or stainless steel (brushed); interior is simple metal or plastic
- **Finish:** As fridge; paint is matte or soft satin, never gloss
- **Colour palette:** As fridge
- **Scale:** Smaller than fridge (often 500–600mm wide); depths vary; height may be chest-style (bending reach) or upright (standing reach)
- **Perspective:** The freezer occupies a low or tucked position in the cool wing; it is accessed deliberately, not daily
- **Lighting behaviour:** The freezer exterior reads the room's light; interior is dark until opened
- **Shadow behaviour:** The freezer casts a ground shadow; the interior shadow is cold and still
- **Texture:** Simple, clean finish; hardware is minimal
- **Wear:** Wear is light (less-used than fridge); the exterior is clean and kept
- **Variants:** Chest-style (opens from top) or upright (opens from front); paired with fridge or standalone
- **Relationship to neighbours:** The freezer sits beneath or beside the fridge in the cool wing; it is a visual unit with the fridge
- **Accessibility:** Interior is reachable for a standing adult; drawers are accessible without removing items
- **Animation:** The door or lid opens and closes; interior light is minimal (no light inside freezers by standard)
- **Future extensibility:** The freezer may be replaced without altering the room
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** The freezer is calm and quiet in appearance; it does not compete with the fridge visually
- **Quality standard:** A freezer is reliable and unobtrusive; it belongs in the room, not calls attention to itself

---

### **C. GLASS — Storage for what is kept dry**

#### C1 — Tall Storage Jar

**Purpose:** The signature object of the Larder — flour, rice, pasta, grains; read by fullness
- **Category:** Glass storage
- **Construction:** Borosilicate glass or soda-lime glass; a simple cylindrical or slightly tapered body; an airtight lid (cork, ceramic knob, or glass stopper); the lid may have a rubber or silicone seal
- **Materials:** Clear or frosted glass body; cork, ceramic, or glass lid; metal or timber bands (optional, for decoration)
- **Finish:** Glass is clear (transparency is the point); the lid is a natural material (cork, ceramic, timber)
- **Colour palette:** Clear glass is neutral; the contents are the colour; the lid is warm neutral (cork, ceramic cream, timber natural)
- **Scale:** 1.5–2.5L capacity (fills a shelf-height without towering); height 250–350mm; diameter 100–150mm; proportioned as a cylinder, not a squat jar
- **Perspective:** The jar sits on a shelf at eye level or above; it is read by looking at its level of fullness
- **Lighting behaviour:** Light passes through the glass, revealing the contents; the glass itself is nearly invisible (the contents are the visual)
- **Shadow behaviour:** The jar casts a soft shadow on the shelf; the contents create internal shadows (air space at the top reads as darkness)
- **Texture:** The glass is smooth and slightly cool to the touch; the lid is warm (cork or ceramic)
- **Wear:** The glass will cloud slightly with age and mineral deposits (honest wear, never hidden); the seal may require occasional replacement
- **Variants:** 1.5L, 2L, 2.5L (standard Larder jars); one identical form across all sizes (only height varies with volume)
- **Relationship to neighbours:** Jars sit in a row, aligned at the mouth level; the row is unified despite different fill levels
- **Accessibility:** Jars are stored within reach (450mm–1750mm); the lid comes off easily; the mouth is wide enough to spoon from
- **Animation:** The jar is lifted, set down, opened, closed; the motion is handled by the household, not the jar itself
- **Future extensibility:** Jars may be added to a collection; they are always identical in form
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** The jar is honest glass and a simple lid; the beauty is in the fullness of grain, the clarity of glass, the warm tone of cork
- **Quality standard:** A jar is a simple, perfect object — made of clear glass, proportioned to a human hand, lasting decades

---

#### C2 — Medium Storage Jar

**Purpose:** Spices, tea, smaller dry goods; a more compact version of the tall jar
- **Category:** Glass storage
- **Construction:** As tall jar, smaller scale
- **Materials:** As tall jar
- **Finish:** As tall jar
- **Colour palette:** As tall jar
- **Scale:** 500ml–1L capacity; height 150–200mm; diameter 80–120mm
- **Perspective:** Sits on a spice rack or a shelf at work height; read by presence and fullness
- **Lighting behaviour:** As tall jar; the glass is clear
- **Shadow behaviour:** Casts a small shadow; the contents are visible
- **Texture:** As tall jar
- **Wear:** As tall jar
- **Variants:** 500ml, 750ml, 1L (standard variants)
- **Relationship to neighbours:** Medium jars sit closely (spice rack); they are densely arranged, unified by identical form
- **Accessibility:** At work height (750–850mm) or eye level; operable by one hand
- **Animation:** Lifted and set down; lid removed easily
- **Future extensibility:** Jars are added to the spice collection; form stays identical
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** As tall jar, but at a smaller, more intimate scale
- **Quality standard:** A perfect small jar — proportioned to fit a hand, to sit on a spice rack, to show its contents fully

---

#### C3 — Short Storage Jar

**Purpose:** Salt, sugar, cocoa, preserves; the flattest jar
- **Category:** Glass storage
- **Construction:** Borosilicate glass; a short, wide form; airtight lid
- **Materials:** Glass; cork, ceramic, or timber lid
- **Finish:** As tall jar
- **Colour palette:** As tall jar
- **Scale:** 300–500ml capacity; height 100–130mm; diameter 100–130mm (nearly as wide as tall)
- **Perspective:** Sits on a shelf or at work height; the wide mouth is prominent
- **Lighting behaviour:** Light reveals the contents; the glass is nearly invisible
- **Shadow behaviour:** A shallow shadow on the shelf; the contents dominate
- **Texture:** Smooth glass; warm lid
- **Wear:** As tall jar
- **Variants:** 300ml, 400ml, 500ml
- **Relationship to neighbours:** Short jars sit in a row or a compact group; they are unified by form despite different contents
- **Accessibility:** At work height; one-handed operation; the wide mouth is easy to spoon from
- **Animation:** Lifted and closed; the motion is quick and easy
- **Future extensibility:** Jars are added to the baking or preserves shelf
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A short, wide jar — honest in form, perfect for its purpose
- **Quality standard:** A short jar is proportioned so it sits stable and is easy to use daily

---

#### C4 — Spice Jar (small, on the rack)

**Purpose:** Individual spices and herbs, each in its own jar on the spice rack
- **Category:** Glass storage
- **Construction:** Small glass cylinder or square form; cork or ceramic stopper; may have a paper label
- **Materials:** Glass; cork stopper; timber or ceramic knob; optional paper label (the spice name, hand-written or printed)
- **Finish:** Clear glass; natural stopper
- **Colour palette:** Neutral glass; the spice is the colour
- **Scale:** 50–100ml capacity; height 60–100mm; small enough to hold in one hand
- **Perspective:** On a spice rack at eye level, by the hob; read by position (the jar is always in the same spot)
- **Lighting behaviour:** Light shows the spice inside; the glass is clear
- **Shadow behaviour:** Minimal shadow; the spice dominates
- **Texture:** Smooth glass; natural stopper
- **Wear:** The label may fade; the glass may cloud; the stopper may dry out (honest use)
- **Variants:** One standard size (a "spice jar" is always this size)
- **Relationship to neighbours:** Spice jars sit on a rack in a row or arrangement; they are a unified collection
- **Accessibility:** At work height, eye level; one-hand grasp; the stopper comes out easily
- **Animation:** Lifted, unstopped, shaken if needed, stopped, replaced; rapid, single-handed motion
- **Future extensibility:** New spices are added in identical jars
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A small, simple jar — honest glass, natural stopper, the spice itself as the decoration
- **Quality standard:** A spice jar is perfect at its small scale — easy to use, durable, beautiful in a collection

---

#### C5 — Oil Bottle

**Purpose:** Cooking oils, vinegars, the daily-pour bottles; standing upright, read by level
- **Category:** Glass storage
- **Construction:** Glass bottle with a pouring spout or a simple neck; may have a cork or pour-spout cap; a label (brand or handwritten)
- **Materials:** Glass; cork or fitted cap; optional wire foil or paper label
- **Finish:** Clear glass (the oil or vinegar is the colour); cork or simple cap
- **Colour palette:** The contents (golden oil, dark vinegar, amber honey) are the colour
- **Scale:** 250–500ml capacity (a weekly pour, not a bulk bottle); height 200–250mm; tapers to a neck (pouring spout)
- **Perspective:** Standing upright on a shelf or beside the counter; read by the level of liquid remaining
- **Lighting behaviour:** Light shines through the oil, creating warmth and colour
- **Shadow behaviour:** The bottle casts a soft shadow; the liquid inside creates internal light and shadow
- **Texture:** Smooth glass; cork or cap is simple
- **Wear:** The label wears; the cork may age; the bottle may darken slightly with age (honest patina)
- **Variants:** Standard pour-spout bottle; cork-stoppered; with or without a label
- **Relationship to neighbours:** Oil bottles sit in a run beside the counter or on a shelf at work height; they are within reach without moving other things
- **Accessibility:** At work height; one-handed operation; the pour is controlled
- **Animation:** The bottle is lifted, poured, set down; the motion is deliberate and controlled
- **Future extensibility:** Bottles are replaced as they empty
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** An honest bottle of oil — clear glass showing the liquid, natural cork or cap, a simple label
- **Quality standard:** A bottle pours steadily; the glass is robust; it becomes more beautiful as it ages

---

#### C6 — Vinegar Bottle (as oil bottle, darker, more elegant)

**Purpose:** Vinegars used for dressing and cooking; a bottle similar to oil but with darker, richer colour
- **Category:** Glass storage
- **Construction:** As oil bottle, same form but the contents are darker and richer
- **Materials:** Glass; cork or cap
- **Finish:** Clear glass
- **Colour palette:** Dark amber, deep brown, or black (the vinegar itself); cork or metal cap
- **Scale:** As oil bottle, 250–500ml
- **Perspective:** Standing with oils, at work height
- **Lighting behaviour:** Light creates depth in the dark liquid; the glass shows the colour richly
- **Shadow behaviour:** Deeper shadow than oil bottle (the liquid is darker)
- **Texture:** Smooth glass
- **Wear:** Label wears; cork ages
- **Variants:** Standard pour-spout or cork-topped
- **Relationship to neighbours:** Sits beside oil bottles; the darker colour reads as a distinct object
- **Accessibility:** At work height; one-handed
- **Animation:** Lifted and poured; deliberate motion
- **Future extensibility:** Replaced as emptied
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A bottle of vinegar is richer and deeper in colour than oil; the glass shows this richness
- **Quality standard:** The vinegar bottle is as simple as the oil bottle, but its colour tells you what it is

---

#### C7 — Milk Bottle (glass with a stopper or cap)

**Purpose:** Milk kept on the fridge door or shelf; a bottle with a familiar, household form
- **Category:** Glass storage
- **Construction:** Glass bottle with a flared or tapered neck; a ceramic or plastic cap; may have measurement marks (pints or litres)
- **Materials:** Glass; ceramic or plastic cap; optional string or wire collar
- **Finish:** Clear glass; cap is simple
- **Colour palette:** Clear glass; white or cream cap; the milk is the colour
- **Scale:** 500ml–1L capacity (one day's milk); height 180–220mm; a shape the hand knows
- **Perspective:** In the fridge door or on a shelf; read by looking at the remaining level
- **Lighting behaviour:** Light shows the milk level; the glass is warm
- **Shadow behaviour:** Soft shadow on the fridge shelf; interior light shows the contents
- **Texture:** Smooth glass; cap is warm ceramic or simple plastic
- **Wear:** The cap may stain; the bottle may cloud slightly; the shape becomes familiar
- **Variants:** Standard one-pint / one-litre bottles; glass is clear, always
- **Relationship to neighbours:** Milk sits on the fridge door alongside other liquids (juice, water)
- **Accessibility:** At chest height in the fridge; one-handed grasp; cap comes off easily
- **Animation:** Lifted, opened, poured, closed, replaced; quick domestic motion
- **Future extensibility:** Bottles are replaced daily or several times weekly
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A milk bottle is a familiar, homely object — clear glass, simple cap, the milk itself as the colour
- **Quality standard:** A milk bottle works for its everyday use; it is durable and honest

---

#### C8 — Preserving Jar (for jam, chutney, honey; often a branded shape)

**Purpose:** Jams, chutneys, marmalades, preserves, honey — kept on a shelf or in a cupboard; designed for long keeping
- **Category:** Glass storage
- **Construction:** Glass jar with a screw-top lid (often with a rubber seal) or clip-top lid; the form is traditional to preserving
- **Materials:** Thick glass (borosilicate preferred); metal screw-top or ceramic clip-top; rubber seal
- **Finish:** Clear or slightly frosted glass; lid is metal or ceramic
- **Colour palette:** Clear glass; the preserve is the colour (jewel-like reds, golds, deep yellows); metal or ceramic lid is neutral
- **Scale:** 200ml–500ml capacity (standard jam jar size); height 80–150mm; squat and wide
- **Perspective:** On a shelf or in a cupboard; often in rows, a collection
- **Lighting behaviour:** Light shines through the preserve, creating jewel-like colour
- **Shadow behaviour:** Each jar casts a small shadow; the row creates a rhythm
- **Texture:** Smooth thick glass; metal or ceramic lid is simple
- **Wear:** The lid may rust slightly (honest aging); the glass may cloud; the label may fade
- **Variants:** 200ml (small), 300ml (standard), 500ml (large); screw-top or clip-top
- **Relationship to neighbours:** Preserves sit in rows on a shelf; they are a unified collection, varied by colour
- **Accessibility:** At eye level or above; one-handed grasp; lid comes off with a slight turn or clip
- **Animation:** Lifted, opened, a spoon dipped in, closed, replaced; gentle, careful motion
- **Future extensibility:** New preserves are added; old jars are reused; the collection grows
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** Preserving jars are jewel-like when full — the colour of the preserve is the beauty; the glass and lid are simple
- **Quality standard:** A preserve jar lasts decades of reuse; the seal is reliable; the glass shows the preserve beautifully

---

### **D. CERAMICS — Crocks, Bowls, Containers**

#### D1 — Flour Crock (a ceramic vessel with a lid)

**Purpose:** Flour, sugar, or other dry goods in a ceramic vessel with a lid and sometimes a spoon rest
- **Category:** Ceramics
- **Construction:** Hand-thrown or slip-cast ceramic; thick walls; a fitted lid (glazed ceramic or wood); interior is glazed
- **Materials:** Terracotta, stoneware, or porcelain (depending on the crock); wooden or ceramic lid; may have a bone finial on the lid
- **Finish:** Glazed exterior and interior (often a single colour or pattern); matte or soft gloss, never high-shine; the glaze is honest, showing the potter's hand
- **Colour palette:** Warm clay tones (cream, pale grey, soft taupe, warm buff), or soft glazed colours (pale blue, soft sage, warm grey); no bright primary colours
- **Scale:** 1–2L capacity; height 150–200mm; diameter 120–180mm; substantial enough to feel real, not delicate
- **Perspective:** On a shelf at eye level or above; the lid is a focal point; the crock is often decorative as well as functional
- **Lighting behaviour:** The glaze reads the room's light; it may be slightly reflective (soft gloss) or matte; the finish is warm
- **Shadow behaviour:** The crock casts a soft shadow; the lid creates a visual break
- **Texture:** The ceramic is cool and smooth; the glaze may have a subtle texture (brushstrokes, thrown marks)
- **Wear:** The glaze may chip slightly (honest wear, never hidden); the interior may darken with use; the crock becomes more beautiful with time
- **Variants:** Tall and narrow, or squat and wide; lid may be ceramic or wood; may have a companion spoon rest
- **Relationship to neighbours:** The flour crock sits with other crocks on a shelf; they are unified by form even if colours vary
- **Accessibility:** At work height or eye level; the lid comes off easily; spoon rests may sit beside the crock
- **Animation:** Lifted gently, lid removed, flour scooped, lid replaced; careful, purposeful motion
- **Future extensibility:** Crocks may be added to the collection; new ones follow the same aesthetic
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A crock is handmade in feeling, even if industrial-made; the glaze is visible and honest; it should look like something a household would treasure
- **Quality standard:** A flour crock is beautiful enough to display; it is durable and warm; it ages well

---

#### D2 — Salt Crock (small, with a lid)

**Purpose:** Salt, kept accessible at work height; smaller than flour crock, often with a spoon
- **Category:** Ceramics
- **Construction:** Hand-thrown ceramic; smaller, more delicate than flour crock; fitted ceramic lid; often has a small spoon
- **Materials:** Stoneware or porcelain; ceramic lid; the spoon may be ceramic or metal
- **Finish:** Glazed, matte or soft satin; the glaze is even and honest
- **Colour palette:** Warm clay (cream, pale buff, soft grey), or soft glaze colours matching crocks; consistent with flour and sugar crocks
- **Scale:** 200–400ml capacity; height 80–120mm; diameter 80–120mm; small enough to sit on the counter beside the cooking area
- **Perspective:** At work height, by the hob; the crock is accessed during cooking; it is a working object
- **Lighting behaviour:** The glaze is warm and inviting; light falls across the lid
- **Shadow behaviour:** Minimal shadow (small object); the interior shadow when open shows the salt
- **Texture:** Smooth ceramic; the glaze may show the potter's brushwork
- **Wear:** The spoon may darken the interior (salt-staining); the glaze may chip slightly; this is honest patina
- **Variants:** One standard salt crock size; the spoon may be ceramic or metal
- **Relationship to neighbours:** Salt sits with flour and sugar crocks; it is the smallest, emphasizing the family
- **Accessibility:** At work height; one-handed operation; the spoon is always there
- **Animation:** The crock is pinched for salt during cooking; lid is replaced between uses; daily motion
- **Future extensibility:** The crock is replaced if broken; new ones match the old
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A salt crock is intimate and worn — the spoon stains the glaze, the crock ages quickly, it is loved by use
- **Quality standard:** A salt crock works perfectly; it is small and sturdy; it becomes more beautiful with age

---

#### D3 — Sugar Crock (medium, with a lid)

**Purpose:** Sugar, kept at work height or eye level; medium size, between salt and flour
- **Category:** Ceramics
- **Construction:** Hand-thrown ceramic; fitted lid; proportioned between salt and flour crocks
- **Materials:** Stoneware or porcelain; ceramic lid
- **Finish:** Glazed, matching flour and salt crocks
- **Colour palette:** As flour and salt crocks
- **Scale:** 400–600ml capacity; height 100–140mm; diameter 100–140mm
- **Perspective:** At eye level or work height; part of the crock family
- **Lighting behaviour:** As flour crock
- **Shadow behaviour:** Soft shadow; the lid is a focal point
- **Texture:** Smooth ceramic; glaze shows the hand
- **Wear:** Glaze may chip; interior darkens with use
- **Variants:** Standard sugar crock; lid is ceramic
- **Relationship to neighbours:** Sits between salt and flour crocks; together they read as a family of vessels
- **Accessibility:** At work height; one-handed grasp; lid comes off easily
- **Animation:** Lifted, opened, sugar taken with a spoon, closed, replaced; daily use
- **Future extensibility:** Crocks are added to the family; new ones match
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** Sugar crock is elegant and functional — between the intimate salt and the large flour, it is the daily workhorse
- **Quality standard:** Perfect at its middle scale; durable; warm

---

#### D4 — Tea Caddy (for loose tea, often metal or ceramic with a lid)

**Purpose:** Loose tea, kept at the tea and coffee station; smaller, more refined than crocks
- **Category:** Ceramics or metal
- **Construction:** Ceramic or metal box with a fitted lid; interior is tight (to keep tea fresh); may have a spoon
- **Materials:** Ceramic, pewter, or tin; ceramic lid; the spoon is ceramic or metal
- **Finish:** Glazed ceramic or brushed metal; matte, never shiny
- **Colour palette:** Warm neutral (cream, soft grey, warm taupe, soft blue); consistent with crocks and the room
- **Scale:** 100–200ml capacity; height 60–100mm; small, contained
- **Perspective:** At eye level on the tea shelf; part of the tea station family (with coffee, sugar, cups)
- **Lighting behaviour:** The glaze or metal reads soft light; not reflective
- **Shadow behaviour:** Minimal shadow (small scale); interior shadow when open
- **Texture:** Smooth ceramic or brushed metal; refined in finish
- **Wear:** The interior may stain from tea (honest wear); the exterior ages softly
- **Variants:** Ceramic or metal; with or without a matching spoon
- **Relationship to neighbours:** Tea caddy sits with coffee, sugar, and cups at the tea station; it is part of a refined family
- **Accessibility:** At eye level; one-handed grasp; lid comes off easily; the spoon is always present
- **Animation:** Lifted gently, lid removed, tea is scooped with the spoon, lid replaced; refined, careful motion
- **Future extensibility:** Caddies are replaced if broken or when the tea changes
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A tea caddy is refined and purposeful — the glaze or metal is quiet; the interior is kept; it holds a precious thing (tea)
- **Quality standard:** A tea caddy is beautiful enough to sit on display; it is durable and keeps its contents well

---

#### D5 — Coffee Jar (large, for beans or ground; ceramic or glass)

**Purpose:** Coffee beans or ground coffee, kept at the tea and coffee station; larger than the tea caddy
- **Category:** Ceramics or glass
- **Construction:** Ceramic crock or glass jar (similar to tall storage jar); a fitted lid; airtight seal
- **Materials:** Ceramic, stoneware, or glass; ceramic or cork lid
- **Finish:** Glazed ceramic (matching crocks) or clear glass
- **Colour palette:** Warm ceramic (cream, pale grey, soft taupe) or clear glass showing dark coffee
- **Scale:** 500ml–1L capacity; height 130–180mm; substantial at the station
- **Perspective:** At eye level on the tea shelf; a focal point; the coffee is visible
- **Lighting behaviour:** Glass shows the dark coffee richly; ceramic glaze is warm
- **Shadow behaviour:** Soft shadow; the interior creates visual depth
- **Texture:** Smooth ceramic or glass; lid is ceramic or cork
- **Wear:** Ceramic may chip; glass may cloud; both age beautifully
- **Variants:** Ceramic crock or glass jar; the form is substantial and visible
- **Relationship to neighbours:** Coffee sits with tea, sugar, and cups; together they form the tea station ritual
- **Accessibility:** At eye level; one-handed grasp; lid comes off easily
- **Animation:** Lifted, opened, coffee scooped or poured, lid replaced; morning ritual motion
- **Future extensibility:** Jars or crocks are replaced as coffee runs out
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A coffee jar is warm and inviting — the dark coffee inside is beautiful; the ceramic or glass glows
- **Quality standard:** Perfect at its size and purpose; robust; it becomes more beautiful as it holds coffee

---

#### D6 — Serving Bowl (substantial ceramic for family meals)

**Purpose:** Bowls for salads, vegetables, pasta, fruit at the table or on the counter; substantial and used
- **Category:** Ceramics
- **Construction:** Wheel-thrown ceramic; substantial walls; glazed interior and exterior; may have a rim or simple lip
- **Materials:** Stoneware or porcelain; glazed; interior glaze is food-safe and durable
- **Finish:** Glazed, matte or soft satin; the glaze is warm and inviting
- **Colour palette:** Warm glazed colours (cream, soft grey, pale blue, warm taupe, soft brown); subtle pattern or solid colour; no bright primary colours
- **Scale:** 2–4L capacity (family-serving size); diameter 250–350mm; height 100–150mm; substantial enough to hold a pasta or salad for 4–6
- **Perspective:** On a shelf, at the counter, or at the table; a focal point when food is served
- **Lighting behaviour:** The glaze is warm; light reads the surface; the interior is bright and welcoming
- **Shadow behaviour:** Interior shadow when filled, showing the food
- **Texture:** Smooth glaze; the hand knows the rim
- **Wear:** The glaze wears beautifully — subtle marks from spoons, slight darkening inside, a lived-in patina
- **Variants:** Several sizes (2L, 3L, 4L); same form at different scales
- **Relationship to neighbours:** Bowls sit on shelves with other serving pieces; they are part of a family of dishes
- **Accessibility:** On a shelf or at the table; one-handed grasp; large enough to serve from
- **Animation:** Lifted from shelf, carried to table, filled, set on table, used, cleared; daily serving motion
- **Future extensibility:** Bowls are added to the family; new pieces match the old
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A serving bowl is warm and functional — the glaze shows the potter's hand; when full of food, it is the centre of the meal
- **Quality standard:** A bowl is durable and beautiful; it improves with use; it becomes a cherished object

---

#### D7 — Mixing Bowl (ceramic, for kitchen work)

**Purpose:** Mixing, beating, kneading in the kitchen; a bowl for work, not serving
- **Category:** Ceramics
- **Construction:** Ceramic bowl, often with a slight spout for pouring; glazed or unglazed interior; may have a footring
- **Materials:** Stoneware; glazed or raw ceramic; interior may be unglazed for grip
- **Finish:** Exterior is glazed (matching crocks); interior may be unglazed (for grip and heat retention)
- **Colour palette:** Warm ceramic exterior; interior is natural clay (if unglazed) or soft glaze
- **Scale:** 2–3L capacity; diameter 200–280mm; height 80–120mm; comfortable for two-handed work
- **Perspective:** On a shelf or at the work counter; part of the working kitchen
- **Lighting behaviour:** Glaze is warm; interior shows the work
- **Shadow behaviour:** Interior shadow when filled; exterior shadow is soft
- **Texture:** The exterior is smooth glaze; the interior may have a tactile, grippy surface
- **Wear:** The interior wears from whisks and wooden spoons — this is honest work wear; the glaze chips lightly (never hidden)
- **Variants:** One standard size; the bowl is proportioned for two hands
- **Relationship to neighbours:** Mixing bowls sit with the working kitchen — spoons, scales, the baking area
- **Accessibility:** At work height; two-handed grasp; easy to pour from the spout
- **Animation:** Lifted, filled, mixed or beaten, poured out, set down; vigorous kitchen work
- **Future extensibility:** Bowls are replaced if broken; new ones match
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A mixing bowl is honest and working — the glaze is warm but the interior shows use; it is a tool that is also beautiful
- **Quality standard:** A mixing bowl is robust; it survives vigorous work; it ages beautifully

---

#### D8 — Fruit Bowl (decorative and functional, on a table or side shelf)

**Purpose:** Fresh fruit displayed on a shelf or table; a bowl that is both beautiful and used
- **Category:** Ceramics
- **Construction:** Wheel-thrown or slip-cast ceramic; wider and shallower than a serving bowl; glazed
- **Materials:** Stoneware or porcelain; glazed interior and exterior
- **Finish:** Glazed, matte or soft satin; the glaze is warm and inviting; may have a subtle pattern
- **Colour palette:** Warm glazed colours; subtle pattern (brushwork, glaze variation); never garish
- **Scale:** 1.5–2.5L capacity; diameter 280–350mm; height 70–100mm (wide and shallow); substantial
- **Perspective:** On a shelf at eye level or on a side table; a focal point when filled with fruit
- **Lighting behaviour:** The glaze is warm; light reads the interior colour when filled
- **Shadow behaviour:** Soft shadow beneath; interior shadow shows the fruit
- **Texture:** Smooth glaze; the rim is finished cleanly
- **Wear:** The glaze wears softly; the interior darkens from fruit (honest patina); the exterior may stain slightly
- **Variants:** One or two sizes; proportioned for home display
- **Relationship to neighbours:** The fruit bowl sits on a shelf or table; it may be near the cool wing (produce baskets) or at the front of the kitchen
- **Accessibility:** At eye level or sitting height; one-handed grasp; easy to reach into
- **Animation:** Carried to the table, filled with fruit, set down; fruit is reached into and taken; clearing is easy
- **Future extensibility:** Bowls are replaced if broken; new ones match the household's style
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A fruit bowl is beautiful when empty and more beautiful when full — the glaze is warm, the fruit is the colour, together they are the decoration
- **Quality standard:** A fruit bowl works as both a display and a function; it is handsome enough to leave out

---

### **E. BASKETS — Soft Storage for What Breathes**

#### E1 — Produce Basket (for loose fruit and vegetables)

**Purpose:** The household's real fruit and vegetables, stored in a cool, airy place; the most alive image in the room
- **Category:** Baskets
- **Construction:** Woven wicker, willow, or rattan; open sides (no lid); a flat bottom and sides that slope outward
- **Materials:** Natural woven fibres (willow, rattan, seagrass); may have a rim of twisted cane or wood
- **Finish:** Natural woven finish; no paint or stain; may be slightly aged or sun-bleached
- **Colour palette:** Warm naturals (honey, pale tan, grey-tan); the colours of natural fibres
- **Scale:** Large enough to hold a week of loose produce (20–30L capacity); diameter 400–500mm; height 200–250mm
- **Perspective:** At eye level in the cool wing; a focal point; the fruit and vegetables are the visual interest
- **Lighting behaviour:** Light shows the weave; the contents are clearly visible
- **Shadow behaviour:** Soft shadow beneath the basket; interior shadow shows the produce
- **Texture:** The weave is tactile and warm; the rim may be smooth wood or twisted cane
- **Wear:** The basket may darken or lighten with age and sun; the weave may loosen slightly (honest aging)
- **Variants:** One standard size; the form is proportioned to show produce attractively
- **Relationship to neighbours:** The produce basket sits in the cool wing, often with other baskets (bread, potatoes, onions)
- **Accessibility:** At eye level; one-handed or two-handed grasp; easy to reach into
- **Animation:** The household reaches into the basket and takes produce; the basket stays in place; the produce moves, not the basket
- **Future extensibility:** Baskets may be added as the household grows more produce storage
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A produce basket is most beautiful when full of the household's own fruit and vegetables — the colours and shapes are the decoration, the basket is the frame
- **Quality standard:** The basket is well-woven and robust; it lasts decades; it becomes softer and more beautiful with time

---

#### E2 — Bread Basket (smaller, for fresh bread)

**Purpose:** Fresh bread, kept on a shelf or brought to the table; a smaller basket than produce
- **Category:** Baskets
- **Construction:** Woven wicker or rattan; open, with a flat or slightly rounded bottom
- **Materials:** Natural woven fibres; may have a linen cloth insert (optional)
- **Finish:** Natural weave; may have a subtle patina
- **Colour palette:** Warm naturals; if a cloth is included, it is linen (cream, soft grey, natural white)
- **Scale:** Small enough for a few loaves (5–10L capacity); diameter 300–400mm; height 150–180mm
- **Perspective:** On a shelf or at the table; part of the hospitality or daily rhythm
- **Lighting behaviour:** Light shows the weave; the bread is the focal point
- **Shadow behaviour:** Soft shadow beneath; interior shows the bread
- **Texture:** Smooth weave; tactile and warm
- **Wear:** The basket may darken with age and bread crumbs
- **Variants:** With or without a linen cloth; one standard size
- **Relationship to neighbours:** The bread basket sits on a shelf with other baskets or on the table during a meal
- **Accessibility:** At eye level or sitting height; one-handed grasp; easy to reach into
- **Animation:** Bread is placed in the basket, carried to the table, bread is taken, the basket is cleared
- **Future extensibility:** Baskets may be added if more bread storage is needed
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A bread basket is at its most beautiful with fresh bread inside — the warmth of the bread, the weave of the basket, the linen cloth if present
- **Quality standard:** A bread basket is well-made and robust; it ages beautifully; it becomes a cherished object

---

#### E3 — Potato Basket (larger, sturdy for root vegetables)

**Purpose:** Potatoes and other root vegetables that prefer cool, dark storage; a sturdy, opaque basket
- **Category:** Baskets
- **Construction:** Woven wicker or rattan; may have slightly thicker weave than produce basket; open sides; a sturdy bottom
- **Materials:** Natural woven fibres; sturdy construction for weight
- **Finish:** Natural weave; may be slightly darker or more rustic than finer baskets
- **Colour palette:** Warm naturals; may show darker patina (potato starch, soil) — this is honest wear
- **Scale:** Large enough for several kilos of potatoes (20–30L capacity); diameter 350–450mm; height 200–250mm; slightly deeper than wide
- **Perspective:** On a lower shelf in the cool wing; not a focal point but a working storage
- **Lighting behaviour:** Light shows the weave and contents
- **Shadow behaviour:** Soft shadow; interior shadow is deeper (potatoes are dark)
- **Texture:** Sturdy weave; the bottom is reinforced
- **Wear:** The basket darkens from potato starch and soil — this is honest work wear, never hidden
- **Variants:** One sturdy size; the form is proportioned for weight
- **Relationship to neighbours:** The potato basket sits with other vegetable storage (onions, garlic); together they form the root-vegetable station
- **Accessibility:** On a lower shelf; one-handed or two-handed grasp; easy to reach into
- **Animation:** Potatoes are placed in and taken from the basket; the basket stays in place
- **Future extensibility:** Baskets may be replaced if worn; new ones follow the same sturdy pattern
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A potato basket is honest and working — the starch-stain is beautiful, the weave is strong, the contents are humble
- **Quality standard:** A potato basket is robust and enduring; it carries weight; it becomes more characterful with time

---

#### E4 — Onion Basket (for stored onions and garlic, open and accessible)

**Purpose:** Onions and garlic, stored in a cool place where air circulates; open and visible
- **Category:** Baskets
- **Construction:** Woven wicker or rattan; very open weave (for air circulation); may be slightly flatter than potato basket
- **Materials:** Natural woven fibres; open construction
- **Finish:** Natural weave; may be lighter in tone than other baskets (frequent air circulation keeps them light)
- **Colour palette:** Light warm naturals
- **Scale:** Moderate size (10–15L capacity); diameter 350–420mm; height 150–180mm (flatter than tall)
- **Perspective:** At eye level in the cool wing; the onions and garlic are visible through the open weave
- **Lighting behaviour:** Light passes through the open weave; the contents are clearly visible
- **Shadow behaviour:** Soft shadow; interior is bright
- **Texture:** Open, airy weave; the rim is smooth
- **Wear:** Onion skin fragments may be visible in the weave (honest wear); the basket may darken slightly from the oils
- **Variants:** Open weave is consistent; one size standard
- **Relationship to neighbours:** Onion basket sits with potato and garlic baskets; together they form the root-storage family
- **Accessibility:** At eye level; one-handed grasp; easy to reach into and select an onion
- **Animation:** Onions are selected and taken; the basket stays in place; the household chooses individual onions
- **Future extensibility:** Baskets are replaced if worn; the open weave is maintained for air circulation
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** An onion basket is beautiful because it is open and honest — the onions are visible, the weave is clear, the form is simple
- **Quality standard:** The basket is well-woven and open; it lasts; the air circulation keeps the onions healthy

---

#### E5 — Garlic Basket (for stored garlic heads, open and accessible)

**Purpose:** Garlic heads, stored in a cool place where air circulates; similar to onion basket but often smaller
- **Category:** Baskets
- **Construction:** Woven wicker or rattan; open weave; a small, neat form
- **Materials:** Natural woven fibres; open construction
- **Finish:** Natural weave; light tone
- **Colour palette:** Light warm naturals
- **Scale:** Small (5–8L capacity); diameter 250–300mm; height 120–150mm
- **Perspective:** At eye level or just above, in the cool wing; part of the storage family
- **Lighting behaviour:** Light passes through; contents are visible
- **Shadow behaviour:** Minimal shadow (small object); interior is bright
- **Texture:** Open weave; smooth rim
- **Wear:** Honest patina; garlic skin fragments may be visible
- **Variants:** One small size; open weave is consistent
- **Relationship to neighbours:** Garlic basket sits with onion and potato baskets; together they are the aromatic storage family
- **Accessibility:** At eye level; one-handed grasp; easy to select individual garlic heads
- **Animation:** Garlic heads are selected and taken; the basket stays in place
- **Future extensibility:** Baskets are replaced if worn
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A garlic basket is intimate and neat — small enough to be tidy, open enough to show what is there
- **Quality standard:** The basket is well-made and open; it ages gracefully; the garlic keeps well

---

#### E6 — Shopping Basket (portable, for carrying shopping and bringing into the Larder)

**Purpose:** A basket used to carry shopping, bring it into the kitchen, and place it in the Larder while items are put away; a working basket
- **Category:** Baskets
- **Construction:** Woven wicker or rattan; handles for carrying; a sturdy bottom and sides
- **Materials:** Natural woven fibres; sturdy handles (twisted cane or wood)
- **Finish:** Natural weave; handles are smooth and well-finished
- **Colour palette:** Warm naturals
- **Scale:** Large enough for a shop (20–30L capacity); diameter 350–450mm; height 200–250mm; comfortable handles
- **Perspective:** Carried by hand or sitting on a surface; a working object
- **Lighting behaviour:** Light shows the weave; contents are visible
- **Shadow behaviour:** Soft shadow beneath; interior shadow shows what's inside
- **Texture:** Sturdy weave; handles are smooth and warm
- **Wear:** The handles darken from handling; the bottom may show starch or soil; this is honest work wear
- **Variants:** One working size; sturdy construction is consistent
- **Relationship to neighbours:** The shopping basket moves in and out of the Larder; it is a connection between shopping and home
- **Accessibility:** Designed for two-handed carry; handles are ergonomic
- **Animation:** The basket is carried from the shop, set in the Larder, items are taken out and put away; then it is cleared and ready for the next shop
- **Future extensibility:** Baskets are replaced if worn; new ones follow the same working pattern
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A shopping basket is beautiful in its function — the weave is strong, the handles are warm and smooth, the wear is honest
- **Quality standard:** The basket carries weight and lasts; the handles are comfortable; it becomes more beautiful with use

---

#### E7 — Harvest Basket (large, for seasonal bounty or batch cooking)

**Purpose:** Used seasonally for harvest time, preserving time, or batch cooking; a large, beautiful storage basket
- **Category:** Baskets
- **Construction:** Large woven basket; may be deeper than wide; sturdy construction
- **Materials:** Natural woven fibres (willow, rattan); sturdy handles or rope
- **Finish:** Natural weave; may have a patina of age
- **Colour palette:** Warm naturals; may show darker tones from use
- **Scale:** Very large (30–40L capacity); diameter 400–550mm; height 250–350mm; substantial
- **Perspective:** On the floor or a low shelf; a focal point when in use, recedes when empty
- **Lighting behaviour:** Light shows the weave and contents
- **Shadow behaviour:** Deep shadow beneath and inside; interior is cool
- **Texture:** Sturdy weave; strong handles or rope
- **Wear:** The basket may darken from preserving ingredients, fruit stains, soil; this aging is beautiful
- **Variants:** One large harvest size; sturdy construction is consistent
- **Relationship to neighbours:** The harvest basket sits in the seasonal wing or is brought out for specific occasions
- **Accessibility:** Large enough to reach into with both hands; heavy when full (requires care in placement)
- **Animation:** Used only seasonally; placed, filled with produce or jars, emptied, stored away
- **Future extensibility:** Baskets are cherished and kept for decades; replacement is rare
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A harvest basket is most beautiful when full and in use — the colours and shapes of the season are the decoration
- **Quality standard:** The basket is built to last centuries; it becomes a family treasure

---

### **F. FOOD STORAGE — Packages & Containers**

#### F1 — Paper Flour Bag

**Purpose:** Flour purchased in bulk or transferred to a paper bag for storage
- **Category:** Food storage
- **Construction:** Kraft paper bag with a fold-top and often a paper clip or tie
- **Materials:** Kraft paper (off-white or cream); paper clip or twine
- **Finish:** Uncoated kraft paper; the finish is rough and tactile
- **Colour palette:** Warm cream or off-white; the paper colour is natural
- **Scale:** 500g–2kg bags; height 200–300mm; width 100–150mm
- **Perspective:** Behind glass jars in the larder; the paper is visible and readable
- **Lighting behaviour:** Light shows the paper texture
- **Shadow behaviour:** Soft shadow; the contents are hidden (inside the paper)
- **Texture:** Rough kraft paper; tactile and honest
- **Wear:** The bag creases and darkens; flour dust clings; this is honest use wear
- **Variants:** Various sizes from small to bulk
- **Relationship to neighbours:** Paper bags sit behind or beside jars; the contrast (transparent glass, opaque paper) is visual rhythm
- **Accessibility:** Reached easily; the fold-top opens simply
- **Animation:** The bag is reached, opened, flour scooped or poured, folded and clipped; daily use
- **Future extensibility:** Bags are replaced as flour runs out; the form stays consistent
- **Canonical owner:** Home Owner; Designer (the form is determined by the flour maker, not the Larder; the Larder receives the form as given)
- **Rendering guidance:** A flour bag is humble and honest — kraft paper, visible contents, the wear of use
- **Quality standard:** The bag is functional and simple; it becomes more beautiful as it is used

---

#### F2 — Paper Sugar Bag (as flour bag, for sugar)

**Purpose:** Sugar purchased in bulk or transferred to paper bag
- **Category:** Food storage
- **Construction:** Kraft paper bag with fold-top and clip
- **Materials:** Kraft paper
- **Finish:** Uncoated kraft
- **Colour palette:** Warm cream
- **Scale:** Similar to flour bag, 500g–2kg
- **Perspective:** Behind or beside jars in the Dry Store
- **Lighting behaviour:** As flour bag
- **Shadow behaviour:** As flour bag
- **Texture:** Kraft paper, tactile
- **Wear:** Darkens from humidity and dust; becomes more characterful
- **Variants:** Various sizes
- **Relationship to neighbours:** Sits with flour and other dry goods in paper
- **Accessibility:** One-handed grasp; fold opens simply
- **Animation:** Reached, opened, spooned from, closed; daily use
- **Future extensibility:** Replaced as sugar runs out
- **Canonical owner:** Sugar maker / Home Owner (the Larder receives the form given)
- **Rendering guidance:** A sugar bag is warm kraft paper — honest and humble
- **Quality standard:** Simple and functional; ages well

---

#### F3 — Oats Packet (cardboard box with measurement info)

**Purpose:** Oats, kept in a packet or transferred to a jar; a familiar cardboard form
- **Category:** Food storage
- **Construction:** Cardboard box, typically with a paper interior bag; designed for pouring
- **Materials:** Cardboard; paper interior
- **Finish:** Uncoated cardboard
- **Colour palette:** Cream, off-white, soft brown; the design is simple and readable
- **Scale:** Standard oat box (500g–1kg); height 200–250mm; width 100–150mm
- **Perspective:** On a shelf, visible behind glass jars; the label and design are readable
- **Lighting behaviour:** Light shows the cardboard texture and print
- **Shadow behaviour:** Soft shadow
- **Texture:** Cardboard, slightly soft; the interior paper is familiar
- **Wear:** The box softens and creases; the corners show wear; this is honest aging
- **Variants:** Various brands and sizes
- **Relationship to neighbours:** Oats sit with cereals and breakfast items; the paper packets are grouped with glass jars
- **Accessibility:** Reached easily; the box pours
- **Animation:** The box is reached, opened or the paper inner bag is opened, oats are poured into a bowl or jar; daily morning use
- **Future extensibility:** Boxes are replaced as oats run out; many households transfer to jars
- **Canonical owner:** Oat maker / Home Owner (the form is given by the maker)
- **Rendering guidance:** An oat box is a familiar, humble object — cardboard, a paper bag inside, a simple label
- **Quality standard:** Simple and functional; the design is readable

---

#### F4 — Rice Bag (paper or plastic, varied packaging)

**Purpose:** Rice, stored as purchased or in a paper bag; a staple grain
- **Category:** Food storage
- **Construction:** Varies by producer; typically plastic or paper with a sealed top
- **Materials:** Paper, plastic, or kraft; sealed or fold-top
- **Finish:** As various; uncoated is preferred
- **Colour palette:** Cream, off-white, natural paper or plastic tone; the rice colour may be visible through transparent packaging
- **Scale:** 500g–5kg bags; varied sizes
- **Perspective:** Behind glass jars or in a cupboard; may be transferred to a jar
- **Lighting behaviour:** If transparent, shows the rice; if opaque, shows the packaging
- **Shadow behaviour:** Soft shadow
- **Texture:** Paper or plastic, depending on packaging
- **Wear:** Paper creases and darkens; plastic crinkles and fades
- **Variants:** Multiple sizes and packaging types
- **Relationship to neighbours:** Rice sits with other grains and staples
- **Accessibility:** Reached easily; pours or opens
- **Animation:** Reached, opened, rice scooped or poured into a jar or pot; regular use
- **Future extensibility:** Replaced as rice runs out; often transferred to jars for household storage
- **Canonical owner:** Rice maker / Home Owner
- **Rendering guidance:** Rice packaging is varied and honest — paper or plastic, the rice visible or hidden, simple labels
- **Quality standard:** Functional; protects the rice

---

#### F5 — Pasta Container (cardboard box or bag, varied packaging)

**Purpose:** Dried pasta, stored as purchased or transferred to a jar; a staple in the Larder
- **Category:** Food storage
- **Construction:** Cardboard box (most common), plastic bag, or paper packet; designed for keeping and pouring
- **Materials:** Cardboard or paper; typically uncoated
- **Finish:** Uncoated
- **Colour palette:** Cream, off-white, soft brown; label shows the pasta type and maker
- **Scale:** 500g–1kg boxes; height 200–300mm; width 80–120mm
- **Perspective:** On the Dry Store shelf, visible; the label and form are readable
- **Lighting behaviour:** Light shows the cardboard and label
- **Shadow behaviour:** Soft shadow
- **Texture:** Cardboard, slightly soft; the interior may contain paper packets for individual pastas
- **Wear:** The box softens and creases; the label fades; edges wear from handling
- **Variants:** Many brands, shapes, and sizes
- **Relationship to neighbours:** Pasta sits with rice and grains in the Dry Store; many households transfer to jars
- **Accessibility:** Reached easily; designed to pour
- **Animation:** The box is reached, opened, pasta poured into a pot or jar; regular cooking use
- **Future extensibility:** Replaced as pasta runs out; often transferred to jars
- **Canonical owner:** Pasta maker / Home Owner
- **Rendering guidance:** Pasta packaging is honest and varied — cardboard, readable labels, simple and functional
- **Quality standard:** Simple; protects the pasta; the design is readable

---

#### F6 — Tin (canned goods: tomatoes, beans, fish, coconut milk)

**Purpose:** Tinned goods, stored as purchased; the household's reserve
- **Category:** Food storage
- **Construction:** Metal tin with a sealed top and label; designed to be stacked and kept
- **Materials:** Steel or tin-plated steel; paper label; lid is crimped and sealed
- **Finish:** Painted or printed metal exterior
- **Colour palette:** Varied by contents and maker; the label shows the contents and brand; colours are warm, readable, not garish
- **Scale:** Standard tin sizes (400ml–800ml); height 100–150mm; diameter 60–90mm
- **Perspective:** Stacked on the Tinned Shelf; the label is the focal point
- **Lighting behaviour:** The tin finish reflects soft light; the label is readable
- **Shadow behaviour:** Soft shadow beneath; stacked tins create a rhythm of shadows
- **Texture:** Smooth metal; the label is paper with matte finish
- **Wear:** The tin may dent lightly (honest shipping and use); the label may fade; edges may rust slightly (honest aging)
- **Variants:** Multiple sizes and contents
- **Relationship to neighbours:** Tins are stacked with other tins; the labels create visual rhythm; similar tins are grouped together
- **Accessibility:** Reached easily; one-handed grasp
- **Animation:** The tin is taken from the shelf, opened (with a tin opener), poured into a dish; cooking use
- **Future extensibility:** Replaced as tins run out; the form stays consistent
- **Canonical owner:** Food maker / Home Owner
- **Rendering guidance:** A tin is honest and industrial — metal, printed label, stacked utility
- **Quality standard:** The tin is durable and sealed; it protects the contents; it lasts

---

#### F7 — Glass Bottle (sauces, oils, condiments; purchased, not home-stored)

**Purpose:** Store-bought bottles of sauce, oil, specialty condiments; kept as purchased
- **Category:** Food storage
- **Construction:** Glass bottle with a cap (plastic, cork, or metal); often with a label
- **Materials:** Glass; cap is varied; label is paper or foil
- **Finish:** Clear glass; cap and label are simple
- **Colour palette:** The contents are the colour (dark soy, golden oil, red sauce, clear vinegar); cap and label are neutral
- **Scale:** 250ml–500ml; height 150–250mm; proportion varies
- **Perspective:** On a shelf at work height or in the fridge; accessible
- **Lighting behaviour:** Light shows the contents through the glass
- **Shadow behaviour:** Soft shadow
- **Texture:** Smooth glass; cap is varied
- **Wear:** The label may fade; the glass may cloud slightly
- **Variants:** Many sizes and shapes
- **Relationship to neighbours:** Bottles sit with other condiments, often on a shelf or in a cupboard
- **Accessibility:** Reached easily; one-handed grasp
- **Animation:** The bottle is lifted, the cap unscrewed, contents poured or spooned, cap replaced; cooking use
- **Future extensibility:** Replaced as contents run out
- **Canonical owner:** Food maker / Home Owner
- **Rendering guidance:** A bottle of sauce is clear glass showing the contents — the colour and clarity of the liquid is the beauty
- **Quality standard:** The glass is durable; the cap seals; the label is readable

---

#### F8 — Cardboard Carton (milk, juice, stock, cream; purchased)

**Purpose:** Dairy and beverages purchased in cartons; stored as purchased
- **Category:** Food storage
- **Construction:** Cardboard carton with a foil/plastic interior; a pouring spout or opening; a label
- **Materials:** Cardboard exterior; foil/plastic interior; paper label
- **Finish:** Uncoated cardboard
- **Colour palette:** Cream or white exterior; label shows the contents and maker
- **Scale:** Standard sizes (250ml–1L); height 150–200mm; width 75–100mm
- **Perspective:** In the fridge or on a shelf; the label is readable
- **Lighting behaviour:** Light shows the cardboard and label
- **Shadow behaviour:** Soft shadow
- **Texture:** Cardboard, smooth finish
- **Wear:** The carton may crease and darken; the opening softens; spill traces may show on the exterior
- **Variants:** Various beverages and sizes
- **Relationship to neighbours:** Cartons sit in the fridge or on a shelf with other beverages
- **Accessibility:** Reached easily; one-handed grasp if not full
- **Animation:** The carton is lifted, opened (spout opened or top unfolded), poured, closed; regular use
- **Future extensibility:** Replaced as contents run out; the form stays consistent
- **Canonical owner:** Maker / Home Owner
- **Rendering guidance:** A carton is honest cardboard — the label is readable, the contents are described, the spout is functional
- **Quality standard:** Simple and functional; the carton is sealed and keeps its contents

---

#### F9 — Egg Carton (cardboard or plastic, as purchased)

**Purpose:** Eggs, stored as purchased in their carton; a familiar form
- **Category:** Food storage
- **Construction:** Cardboard or plastic carton with 6 or 12 egg compartments; a closing lid
- **Materials:** Cardboard or recycled plastic; egg compartments are molded to hold eggs
- **Finish:** Uncoated
- **Colour palette:** Cream or off-white (cardboard) or natural plastic tone; label shows contents and maker
- **Scale:** Standard sizes (6-egg or 12-egg); height 70–100mm; width 100–150mm
- **Perspective:** In the fridge or on a shelf; the carton is visible
- **Lighting behaviour:** Light shows the carton and visible eggs
- **Shadow behaviour:** Minimal shadow
- **Texture:** Cardboard or plastic, relatively rough (protective)
- **Wear:** Carton may crease; empty compartments show where eggs have been taken; stains may appear
- **Variants:** 6-egg, 12-egg; cardboard or plastic
- **Relationship to neighbours:** Egg carton sits in the fridge with other foods
- **Accessibility:** At hand in the fridge; one-handed grasp; easy to open and take an egg
- **Animation:** The carton is taken from the fridge, opened, an egg removed, closed, replaced
- **Future extensibility:** Replaced as eggs run out; the carton is usually recycled or reused
- **Canonical owner:** Egg maker / Home Owner
- **Rendering guidance:** An egg carton is humble and functional — cardboard or plastic, the eggs visible in compartments, the label simple
- **Quality standard:** Simple and protective; it does its job

---

#### F10 — Wooden Crate (for storage of produce, bulk goods, or display; often used for citrus or root vegetables)

**Purpose:** Bulk storage of seasonal produce, display of fruit, or organized storage of goods
- **Category:** Food storage / Joinery
- **Construction:** Wooden slats nailed or screwed to a frame; open sides (air circulation); a flat bottom
- **Materials:** Pine or similar softwood (warm tone); natural finish or stained lightly
- **Finish:** Natural wood, lightly oiled or left raw; the grain and nail heads are visible
- **Colour palette:** Warm honey, pale tan, or soft grey (natural wood ageing)
- **Scale:** Variable, 30cm–60cm wide; 20cm–40cm deep; 20cm–40cm tall
- **Perspective:** On the floor, on a shelf, or in a corner; holds bulk goods or displays produce
- **Lighting behaviour:** Light shows the wood grain and the contents
- **Shadow behaviour:** Soft shadow beneath; slats create a rhythm of light and shadow inside
- **Texture:** Rough wood; tactile; splinters possible (honest wood)
- **Wear:** The wood darkens and weathers; splinters appear; handles become smooth from use
- **Variants:** Multiple sizes and configurations
- **Relationship to neighbours:** Crates sit with other storage in the Seasonal & Growing Room or in bulk storage areas
- **Accessibility:** One or two-handed grasp; easy to empty or fill
- **Animation:** Carried or pushed into place, filled with produce, stored; seasonal use
- **Future extensibility:** Crates may be stacked, added, or repurposed
- **Canonical owner:** Maker / Home Owner
- **Rendering guidance:** A wooden crate is honest and rustic — natural wood, visible construction, the contents are the focal point
- **Quality standard:** The crate is sturdy and built to hold weight; it ages beautifully

---

### **G. HOUSEHOLD — Non-Food Provisions**

#### G1 — Cleaning Basket (for supplies and tools)

**Purpose:** Cleaning supplies, brushes, cloths, and implements; organized storage
- **Category:** Household storage
- **Construction:** Woven or wooden basket, open or with handles; a working container
- **Materials:** Wicker, willow, or wood; sturdy construction
- **Finish:** Natural weave or wood
- **Colour palette:** Warm naturals
- **Scale:** Large enough to hold cleaning supplies (10–15L); diameter 300–350mm; height 150–200mm
- **Perspective:** In a cupboard, under a shelf, or on a lower shelf
- **Lighting behaviour:** Light shows the contents and weave
- **Shadow behaviour:** Soft shadow
- **Texture:** Woven or wood, sturdy and tactile
- **Wear:** May have stains from cleaning products (honest work wear); edges may soften
- **Variants:** One working size
- **Relationship to neighbours:** Sits with other household storage in the Working House wing
- **Accessibility:** One or two-handed grasp; easy to reach into and pull out items
- **Animation:** The basket is carried to where cleaning is happening, items are retrieved and returned; regular use
- **Future extensibility:** Replaced if worn; the form stays consistent
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A cleaning basket is honest and working — no decoration, just function
- **Quality standard:** Sturdy and durable; it carries weight and lasts

---

#### G2 — Pet Food Container (for dry pet food; ceramic crock, bin, or bag storage)

**Purpose:** Pet food, stored as purchased or in a container; accessible and fresh
- **Category:** Household storage
- **Construction:** Plastic bin with a lid, ceramic crock, metal container, or storage in original packaging
- **Materials:** Food-grade plastic, ceramic, metal, or paper/plastic
- **Finish:** Simple, unadorned; the focus is function
- **Colour palette:** Neutral (cream, soft grey, soft brown); no bright colours
- **Scale:** Sized for the amount of food the household keeps (1–5kg capacity); varied sizes
- **Perspective:** In the Pet Corner or in a cupboard; accessible
- **Lighting behaviour:** Light shows the container and may show the food inside (if transparent)
- **Shadow behaviour:** Soft shadow
- **Texture:** Smooth plastic, ceramic, or metal; simple and clean
- **Wear:** Honest wear from handling and pet contact; may show scratches or indentations
- **Variants:** Multiple container types (bin, crock, bag storage)
- **Relationship to neighbours:** Pet food sits in the Pet Corner, apart from human food but still organized
- **Accessibility:** Easy to reach and open; one-handed operation
- **Animation:** The container is opened, food is scooped into a pet bowl, container is closed; daily use
- **Future extensibility:** Containers are replaced as needed
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A pet food container is simple and honest — it protects the food, keeps it fresh, is easy to use
- **Quality standard:** Functional and durable; it is a working part of the household

---

#### G3 — Pet Bowl (ceramic or stainless steel for food and water)

**Purpose:** Feeding a household pet; a working bowl
- **Category:** Household
- **Construction:** Ceramic or stainless steel bowl; sturdy enough for daily use; may have a non-slip base
- **Materials:** Ceramic or stainless steel; may have a rubber base
- **Finish:** Smooth glaze (ceramic) or brushed metal (stainless); simple and clean
- **Colour palette:** Warm ceramic (cream, soft grey) or brushed steel
- **Scale:** Sized for the pet (small for a cat, larger for a dog); diameter 150–250mm; depth 50–80mm
- **Perspective:** On the floor in the Pet Corner or at a feeding station
- **Lighting behaviour:** Light shows the bowl and contents
- **Shadow behaviour:** Soft shadow beneath; interior shadow if empty
- **Texture:** Smooth ceramic or metal; tactile and warm
- **Wear:** The bowl may stain from food; the glaze may chip slightly; metal may dull
- **Variants:** Multiple sizes and materials
- **Relationship to neighbours:** Pet bowls sit in the Pet Corner with pet food storage
- **Accessibility:** At pet height; easy to fill and clean
- **Animation:** Filled with food or water, consumed, emptied, cleaned; multiple daily uses
- **Future extensibility:** Replaced if broken or worn; new bowls follow the same simple aesthetic
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A pet bowl is humble and working — ceramic or metal, simple and functional, the focus on serving the pet
- **Quality standard:** The bowl is durable and easy to clean; it lasts years of daily use

---

### **H. LIGHTING & DECORATION — Illumination and Finishing**

#### H1 — Pendant Light (hanging light above the counter or working surface)

**Purpose:** Task lighting above the working surface and counter; illumination and a design element
- **Category:** Lighting
- **Construction:** A shade suspended by a chain or rod from a ceiling fixture; the internals house a light bulb
- **Materials:** The shade is ceramic, metal, glass, or fabric; the fixture is metal; the cord or chain is cloth or metal
- **Finish:** The shade may be glazed ceramic, painted metal, clear or frosted glass; the finish is matte or soft satin, never gloss
- **Colour palette:** Warm neutral (cream, soft grey, soft taupe, natural wood) or soft glaze colours; the light is warm (not bright or cool)
- **Scale:** The shade is large enough to direct light without dominating (diameter 200–350mm); the height above the counter is 600–800mm
- **Perspective:** Hung above the counter at work height; the light reaches the working surface directly
- **Lighting behaviour:** The light is warm and focused; it does not cast harsh shadows; the shade diffuses the light gently
- **Shadow behaviour:** The pendant casts a soft shadow on the counter; the light beneath is bright and warm
- **Texture:** The shade material is tactile (ceramic glaze, fabric, or brushed metal); the finish is warm
- **Wear:** The shade may darken slightly from dust; the interior may show dust or spider webs (honest aging)
- **Variants:** One standard pendant size for the counter; multiple lights may be hung in a row if the counter is long
- **Relationship to neighbours:** The pendant hangs above the counter in the Dry Store or working area
- **Accessibility:** Light switch is accessible; bulb replacement is possible (design considers maintenance)
- **Animation:** The light turns on and off; the shade casts a shadow on the counter that changes with the household's movement
- **Future extensibility:** Pendants may be added if more work surfaces are created
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A pendant is a simple, honest light — the shade is warm and the light is gentle; it is made for work, not decoration
- **Quality standard:** The light is functional and beautiful; it lasts decades; the shade can be replaced if needed

---

#### H2 — Under-Shelf Lighting (discreet lighting beneath upper shelves, lighting the shelf below)

**Purpose:** Gentle task lighting for shelves below, especially where natural light is low
- **Category:** Lighting
- **Construction:** Simple light strips or small bulbs mounted beneath a shelf; very discreet
- **Materials:** LED strips or small bulbs; minimal visible hardware; wiring hidden
- **Finish:** The light source is nearly invisible; the focus is on the light itself, not the fixture
- **Colour palette:** Warm light (not cool or bright); the light colour is consistent with the room's morning light
- **Scale:** The lighting is subtle and does not dominate; a gentle glow on the shelf below
- **Perspective:** Beneath upper shelves, lighting the shelf contents
- **Lighting behaviour:** The light is gentle and warm; it does not cast harsh shadows; it simply makes the shelf contents visible
- **Shadow behaviour:** Minimal shadow (the light is from above the shelf)
- **Texture:** The light source is hidden; the focus is on the lit objects
- **Wear:** The light is durable and long-lasting (LED); no visible aging
- **Variants:** Strips or individual small lights; the installation is discreet
- **Relationship to neighbours:** Under-shelf lighting works with natural light and the pendant light to create a layered illumination
- **Accessibility:** Light switch is accessible; the installation is hidden so it doesn't interfere with objects on the shelf
- **Animation:** The light turns on and off; its presence is quiet
- **Future extensibility:** Additional lighting may be added to other shelves as needed
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** Under-shelf lighting is nearly invisible — the focus is on the illuminated objects, not the light source
- **Quality standard:** The lighting is warm and subtle; it improves visibility without drawing attention

---

#### H3 — Wall Hooks (for hanging tools, cloths, aprons, herbs)

**Purpose:** Hanging storage for tools, kitchen linens, and occasional items; functional and visible
- **Category:** Hardware
- **Construction:** Simple metal or wooden hooks mounted to the wall; sturdy and direct
- **Materials:** Brass, iron, or wood; the hook is simple and functional
- **Finish:** Natural metal (slightly aged) or painted wood; matte, never shiny
- **Colour palette:** Warm metal tones (brass, copper, iron grey) or warm wood (cream, pale grey)
- **Scale:** Individual hooks are small (50–80mm wide); they are spaced to hold items without crowding
- **Perspective:** On the wall beside the working surface or counter; visible and accessible
- **Lighting behaviour:** The metal or wood reflects warm light; the finish is matte
- **Shadow behaviour:** Minimal shadow (small fixtures)
- **Texture:** The hook is smooth and warm to the touch
- **Wear:** The hook may darken with age and handling; this is honest patina
- **Variants:** Individual hooks, hook rails with multiple hooks, or decorative hook arrangements
- **Relationship to neighbours:** Hooks sit on the wall near the working surface, functional and unadorned
- **Accessibility:** At arm height; easy to reach and hang items on
- **Animation:** Items are hung and removed; the hook is silent and steady
- **Future extensibility:** Additional hooks may be added as the need arises
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A wall hook is simple and honest — metal or wood, functional, no decoration
- **Quality standard:** The hook is sturdy and lasting; it holds weight; it becomes more beautiful with use and age

---

#### H4 — Herb Pot (small ceramic or terracotta pot for growing herbs on a shelf or window)

**Purpose:** Fresh herbs grown in a pot; a living thing in the room
- **Category:** Decorative / Living
- **Construction:** Ceramic or terracotta pot with a drainage hole; a saucer to catch water
- **Materials:** Ceramic, terracotta, or stoneware; glazed or raw; a simple pot
- **Finish:** Glazed ceramic (warm glaze colour) or natural terracotta (sun-weathered orange)
- **Colour palette:** Warm ceramic (cream, soft taupe, natural terracotta) or soft glaze colours
- **Scale:** Small enough for a window sill or a corner (diameter 100–200mm); height 100–150mm
- **Perspective:** On a shelf or window; the living herbs are the focal point
- **Lighting behaviour:** The pot reflects soft light; the herbs are illuminated
- **Shadow behaviour:** Soft shadow beneath; the plants create internal shadow
- **Texture:** The ceramic or terracotta is tactile and warm
- **Wear:** The pot will darken from water and time; this is honest aging
- **Variants:** One simple pot size; shape is traditional
- **Relationship to neighbours:** Herb pots sit on a shelf near the working surface, bringing life to the kitchen
- **Accessibility:** At eye level or above; one-handed grasp; easy to reach and harvest
- **Animation:** The herbs grow; water is given; leaves are pinched for cooking; the plant moves with the household
- **Future extensibility:** Additional herb pots may be added as the household's needs grow
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** An herb pot is most beautiful when growing — the green leaves, the simple pot, the life in the kitchen
- **Quality standard:** The pot is simple and holds its plant well; it ages beautifully

---

#### H5 — Chalk Board (for notes, lists, daily reminders)

**Purpose:** A surface for writing notes, meal ideas, shopping lists, or daily reminders
- **Category:** Decorative / Functional
- **Construction:** A slate or painted board with a wooden frame; mounted to the wall
- **Materials:** Slate or hardboard painted with chalkboard paint; wooden frame (oak or natural)
- **Finish:** The board is matte (chalk-friendly); the frame is natural wood finish
- **Colour palette:** The board is dark (charcoal or black); the frame is warm wood (cream, pale grey, honey)
- **Scale:** Large enough to write lists (300mm × 400mm to 600mm × 800mm); mounted at eye level
- **Perspective:** On the wall; a focal point; meant to be read and written on
- **Lighting behaviour:** Light shows the slate or board surface; chalk markings are visible
- **Shadow behaviour:** Soft shadow; the board surface is clearly visible
- **Texture:** The slate or board is slightly rough (for chalk grip); the frame is smooth wood
- **Wear:** Chalk dust settles and creates marks; the surface darkens slightly; the frame may show handling wear
- **Variants:** Small or large; slate or painted board; with or without a frame
- **Relationship to neighbours:** The chalk board sits on the wall in a visible location, functional and simple
- **Accessibility:** At eye level; one hand is free to write; chalk and eraser are kept nearby
- **Animation:** Writing appears and is erased; the surface is active with household life
- **Future extensibility:** Boards may be added if more writing surfaces are needed
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A chalk board is honest and working — dark surface, white chalk, the writing is the life it holds
- **Quality standard:** The board is durable; chalk marks stay legible; it serves the household's daily needs

---

#### H6 — Wooden Labels (for labeling shelves, jars, or storage areas; etched or painted)

**Purpose:** Labels for jars, storage areas, or shelves; gentle guidance for the household
- **Category:** Decorative / Functional
- **Construction:** Small wooden plaques with etched or painted names; hung or mounted with a small nail
- **Materials:** Natural wood (oak or beech); etched text or hand-painted letters
- **Finish:** Natural wood (oiled) or painted (soft colour)
- **Colour palette:** Warm natural wood or soft paint colour (cream, pale grey)
- **Scale:** Small (50mm × 80mm to 100mm × 150mm); readable at a glance
- **Perspective:** Mounted on shelves, above areas, or beside jars; visible but not dominant
- **Lighting behaviour:** Light shows the wood and text
- **Shadow behaviour:** Minimal shadow
- **Texture:** The wood is warm and tactile; text is incised or hand-painted
- **Wear:** The wood darkens; text may wear slightly (honest aging)
- **Variants:** Multiple sizes; individual labels for different areas
- **Relationship to neighbours:** Labels are scattered throughout the Larder, gently guiding the eye
- **Accessibility:** At eye level or above; they are read, not handled frequently
- **Animation:** Labels are still and steady; they support the room's organization
- **Future extensibility:** New labels are added as new areas are created
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A wooden label is gentle and honest — natural wood, hand-painted text, unobtrusive
- **Quality standard:** The label is legible and beautiful; it supports the room without commanding attention

---

#### H7 — Linen Cloth (tea towels, kitchen linens; draped or stored for use and decoration)

**Purpose:** Kitchen linens — tea towels, cloths for drying, decoration with gentle living detail
- **Category:** Textiles
- **Construction:** Simple linen fabric, woven; may have a stripe or simple pattern
- **Materials:** Natural linen (flax); natural dyes or soft colours
- **Finish:** Unbleached or soft-dyed; the weave is visible
- **Colour palette:** Cream, soft grey, pale blue, soft taupe, warm natural linen tones; stripes are subtle (not bold)
- **Scale:** Standard tea towel size (40cm × 60cm); kitchen cloth size (30cm × 40cm)
- **Perspective:** Draped over a hook or rail; visible but not calling attention
- **Lighting behaviour:** Light shows the linen weave and natural colour
- **Shadow behaviour:** Soft shadow where the cloth hangs
- **Texture:** Linen is tactile and warm; the weave is visible
- **Wear:** Linen softens and becomes more beautiful with washing; subtle stains from use are honest
- **Variants:** Tea towel, small cloth, apron; all in simple linen
- **Relationship to neighbours:** Linens hang near the counter, integrated into the working area
- **Accessibility:** Easy to reach and grab; one-handed grasp
- **Animation:** Linens are used constantly; they dry hands and dishes, wipe surfaces, drape as decoration
- **Future extensibility:** Additional linens are added as the household grows
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A linen cloth is simple and warm — natural fabric, visible weave, soft colours
- **Quality standard:** Linen is durable and becomes softer with age; it lasts years; it is beautiful in its function

---

#### H8 — Seasonal Flowers (fresh seasonal flowers in a simple vase or as cut stems in a jar)

**Purpose:** Fresh seasonal flowers; a gentle mark of the passing year, never a fabricated or permanent decoration
- **Category:** Living detail
- **Construction:** Cut flowers from the season, arranged simply in a vase or a glass jar; minimal arranging
- **Materials:** Living flowers (what the household or season provides); a simple glass container
- **Finish:** Flowers are fresh; the container is clear glass or simple ceramic
- **Colour palette:** The season's own colours (spring pastels, summer brights, autumn warm tones, winter berries)
- **Scale:** A simple arrangement, visible but not dominant (diameter 100–200mm)
- **Perspective:** On a shelf, a windowsill, or the counter; a focal point briefly while the flowers last
- **Lighting behaviour:** Light shows the flowers and water; the container is nearly invisible
- **Shadow behaviour:** Soft shadow beneath; the arrangement creates gentle internal shadows
- **Texture:** The flowers are living and tactile
- **Wear:** Flowers fade and drop; this is the point of them (honest presence of the season, not permanence)
- **Variants:** Varied by season and household choice; the form is always simple
- **Relationship to neighbours:** Seasonal flowers sit on a shelf or window, a quiet mark of time
- **Accessibility:** At eye level; viewed, not touched frequently; water is refreshed
- **Animation:** Flowers slowly fade and are eventually replaced; the cycles mark the passing year
- **Future extensibility:** New flowers arrive with the season; the practice continues through the years
- **Canonical owner:** Home Owner; Household (the choice of flowers is the household's own, never designed or curated)
- **Rendering guidance:** Seasonal flowers are most beautiful as they are — simple stems in clear water, the season's own colours and forms
- **Quality standard:** The arrangement is honest and brief; flowers are fresh and allowed to fade naturally; they are a mark of the moment

---

### **I. ENVIRONMENTAL — The Room Itself**

#### I1 — Oak Flooring (the floor plane)

**Purpose:** The ground plane of the Larder; warm, durable, honest
- **Category:** Architecture / Materials
- **Construction:** Solid oak boards, tongue-and-groove joinery, laid in a simple pattern
- **Materials:** Solid oak (honey or pale blonde tone); natural wood
- **Finish:** Oil-finished, allowing the grain to show; not sealed or poly'd (allows patina)
- **Colour palette:** Warm honey, pale blonde, or soft grey-oak (natural wood colours)
- **Scale:** Standard plank width (80–120mm); the boards run lengthwise through the room
- **Perspective:** The floor is walked on; its warmth is felt underfoot
- **Lighting behaviour:** Light shows the grain and natural colour; the floor glows
- **Shadow behaviour:** The floor grounds everything above it; the warm tone is visible
- **Texture:** The wood is smooth but not slippery; the grain is tactile
- **Wear:** The floor shows the patina of use — foot traffic, scratches from furniture, the darkening of time
- **Variants:** One flooring type throughout; no transition between areas
- **Relationship to neighbours:** The floor anchors the entire room; it is the ground everything stands on
- **Accessibility:** The floor is level and safe; no trips or obstacles
- **Animation:** The floor is walked on; shadows move across it as the day passes
- **Future extensibility:** The floor is permanent; it does not change
- **Canonical owner:** Home Owner; Architect
- **Rendering guidance:** Oak flooring is warm and honest — the grain is visible, the colour is natural, the wear shows the life of the household
- **Quality standard:** The floor is beautiful and durable; it lasts generations; it becomes more beautiful with age

---

#### I2 — Plaster Wall (the vertical planes)

**Purpose:** The walls; warm, textured surfaces that hold the room
- **Category:** Architecture / Materials
- **Construction:** Lime plaster or gypsum plaster over timber lath or modern substrate; finished with a trowel
- **Materials:** Plaster (lime or gypsum), pigment (earth tones), water
- **Finish:** The plaster is troweled smooth but not perfectly flat; the hand of the plasterer is visible
- **Colour palette:** Warm cream, soft white, pale taupe, soft grey — the plaster's own colour, not painted
- **Scale:** The walls are full height (2.3m–2.8m); they define the vertical planes of the room
- **Perspective:** The walls are seen; they frame the room
- **Lighting behaviour:** Light falls across the plaster, showing its texture; shadows are soft
- **Shadow behaviour:** The walls hold soft shadow; corners are warm and enclosed
- **Texture:** The plaster has a subtle texture (not perfectly smooth); the finish is matte
- **Wear:** The plaster may darken slightly from dust and age; marks from furniture or objects are visible (honest wear, never hidden)
- **Variants:** One wall finish throughout; no wallpaper or paint variation
- **Relationship to neighbours:** The walls support the shelves; the finishes and colours are unified
- **Accessibility:** The walls are at all heights; no obstacles
- **Animation:** Light moves across the walls throughout the day; shadows change; the walls are constant
- **Future extensibility:** The walls are permanent; they do not change
- **Canonical owner:** Home Owner; Architect
- **Rendering guidance:** Plaster walls are warm and honest — troweled by hand, the texture visible, the colour natural
- **Quality standard:** The walls are well-finished; they improve with age; they become softer and warmer over time

---

#### I3 — Timber Shelving Finish (the warm wood tone of the open shelves)

**Purpose:** The material finish of the open shelving; consistent throughout the room
- **Category:** Materials / Joinery
- **Construction:** Solid oak or ash timber, sanded smooth, finished with a natural oil or wax
- **Materials:** Solid wood (oak, ash, walnut); natural finish (oil or wax)
- **Finish:** Oil or wax finish, allowing the grain to show; the finish is matte or soft satin
- **Colour palette:** Warm honey, pale blonde, or natural grey-oak; the wood's own colour
- **Scale:** Applies to all shelving in the room; the finish is consistent
- **Perspective:** Seen at eye level and above; the shelves are the dominant wood surface
- **Lighting behaviour:** Light shows the grain and natural colour; the finish glows warmly
- **Shadow behaviour:** The underside of each shelf is slightly darker; the shadow adds depth
- **Texture:** The wood is smooth and warm to the touch; the grain is visible
- **Wear:** The shelves darken from dust and handling; this is honest patina
- **Variants:** One consistent finish throughout; no variation between shelves
- **Relationship to neighbours:** The shelving finish is the warmest, most visible material in the room
- **Accessibility:** The finish is sealed enough to withstand use but open enough to show the wood
- **Animation:** The finish ages and warms as the room is used; it becomes more beautiful over time
- **Future extensibility:** New shelves follow the same finish
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** Timber shelving is warm and honest — the grain is visible, the colour is natural, the finish is simple
- **Quality standard:** The finish lasts decades; it improves with age; regular maintenance keeps it warm

---

#### I4 — Stone Worktop (the working surface material)

**Purpose:** The counter and working surface; durable, warm, beautiful
- **Category:** Materials
- **Construction:** Natural stone (slate, limestone, or marble) or a stone-like material; mounted on timber support
- **Materials:** Natural stone or high-quality composite; no plastic or laminate
- **Finish:** Slightly textured (not polished to a mirror); the stone's natural finish is visible
- **Colour palette:** Warm naturals (pale limestone grey, warm slate, marble cream) — the stone's own colour
- **Scale:** The stone is substantial (40–50mm thick); the edge is finished cleanly
- **Perspective:** Seen from standing work height; the surface is horizontal and primary
- **Lighting behaviour:** Light shows the stone texture and colour; the surface glows
- **Shadow behaviour:** The shadow beneath the worktop shows its depth and solidity
- **Texture:** The stone is slightly rough (not slippery), warm to the touch
- **Wear:** The stone ages beautifully — patina of use, light staining, the marks of time (never hidden)
- **Variants:** One stone type throughout; consistent material
- **Relationship to neighbours:** The worktop is the warmest, most-used surface in the room
- **Accessibility:** The surface is at standing work height; it is level and stable
- **Animation:** The surface is used constantly; flour dust settles, water is spilled, hands press; the marks are honest
- **Future extensibility:** The worktop is permanent; it does not change
- **Canonical owner:** Home Owner; Designer
- **Rendering guidance:** A stone worktop is beautiful in its honesty — the natural colour and texture, the patina of use
- **Quality standard:** The stone is durable and ageless; it lasts forever; it becomes more beautiful with age

---

#### I5 — Wall Shadow (the shadow cast by the room's constant morning light)

**Purpose:** The soft shadow that defines depth and warmth in the corners and against the wall
- **Category:** Lighting / Atmosphere
- **Construction:** No construction; the shadow is cast by the room's architecture and the direction of light
- **Materials:** The absence of light; shadow is the canvas upon which the room is drawn
- **Finish:** Shadow is soft and diffuse, never harsh
- **Colour palette:** Warm shadow (grey-brown, soft taupe); the shadow is part of the room's warmth, not a cold black
- **Scale:** Shadows fall at variable depths; the deepest shadow is in the corners (100–300mm deep)
- **Perspective:** Shadow is seen at all heights; it defines the depth of the room
- **Lighting behaviour:** As described; shadow is the absence of direct light
- **Shadow behaviour:** As described; shadow is the thing itself
- **Texture:** Shadow is textured by the objects within it (the texture of a shelf in shadow, the jar in shadow)
- **Wear:** Shadow deepens with age and dust; this is natural aging
- **Variants:** Shadow changes throughout the day and the seasons; the morning shadow is the room's constant
- **Relationship to neighbours:** Shadow gives dimension to every object; without shadow the room would be flat and cold
- **Accessibility:** Shadow is not an obstacle; it is a design element
- **Animation:** Shadow moves slowly throughout the day; it changes with the seasons but returns to the same pattern
- **Future extensibility:** As the room grows, shadows grow with it; the shadow is always the same depth relative to the room
- **Canonical owner:** Architect; Home Owner
- **Rendering guidance:** Shadow in the Larder is never black or harsh; it is warm grey, diffuse, revealing rather than hiding
- **Quality standard:** The shadow should feel like the inside of a well-kept home — safe, warm, calm

---

#### I6 — Morning Sunlight (the one sun, the one hour)

**Purpose:** The directional morning light that enters the room, consistent across all rooms of the Living Home
- **Category:** Lighting / Atmosphere
- **Construction:** No construction; light enters through windows at the room's upper-left (from the sun's eastern rise)
- **Materials:** Natural sunlight; unobstructed by shutters or shades (always open)
- **Finish:** The light is warm and clear (no filtering materials that would cool it)
- **Colour palette:** Warm gold, pale honey — the colour of morning light in a northern temperate climate
- **Scale:** The light enters at an angle (roughly 45° from horizontal at 9 AM) and falls across the upper third of the room
- **Perspective:** The light is seen entering through windows, falling across shelves and objects, creating a clear shadow line
- **Lighting behaviour:** The light is directional and clear; it shows the grain of wood, the transparency of glass, the contents of jars
- **Shadow behaviour:** The shadow line is clear and moves as the earth turns (but the room sees only the morning hour)
- **Texture:** The light is transparent; it shows texture without harsh contrast
- **Wear:** The light creates patina — the sun's warmth accelerates subtle aging on exposed wood (this is desired, not hidden)
- **Variants:** The light is constant across all rooms; it does not vary from room to room, only the objects in the light change
- **Relationship to neighbours:** Morning light is the unifying principle; every room receives the same light, so the same feelings are present everywhere
- **Accessibility:** The light is never in anyone's eyes; windows are positioned to light work surfaces, not to blind
- **Animation:** The light moves slightly as the seasons change the sun's angle, but the same hour (9 AM–10 AM) is always the "morning" in the Living Home
- **Future extensibility:** As rooms are added, they receive the same morning light; the light is unified
- **Canonical owner:** Architect; Home Owner
- **Rendering guidance:** Morning light is warm, clear, and directional; it is the light that makes the Larder feel like a home, not a shop
- **Quality standard:** The light should feel like stepping into a room where someone has already made tea and opened the windows

---

#### I7 — Evening Warmth (the lingering warmth of the day, felt in the room as afternoon wanes)

**Purpose:** The warmth and colour shifts as the day ends; a different emotional quality from morning
- **Category:** Lighting / Atmosphere
- **Construction:** No construction; the room's absorption of the day's warmth, visible in the light's colour shift
- **Materials:** Natural light (indirectly through reflection and atmospheric changes); the room's own materials releasing warmth
- **Finish:** The light is softer and warmer than morning; it is diffuse, not directional
- **Colour palette:** Deep gold, amber, soft orange — the colour of afternoon and evening light
- **Scale:** The light is all-pervasive; it fills the room (less directional than morning)
- **Perspective:** The light is seen as a glow, not a direction; the room feels held by warmth
- **Lighting behaviour:** The light is warm and soft; it reveals the patina on wood, the depth in shadows
- **Shadow behaviour:** Shadows are deeper and warmer in evening light; corners feel enclosed and safe
- **Texture:** The light is soft and diffuse; texture is revealed by contrast more subtly than in morning
- **Wear:** The evening light shows the marks of the day — dust patterns, the settling of objects, the traces of the household
- **Variants:** Evening warmth deepens into twilight (but the Larder, without outside windows facing west, experiences evening warmth indirectly)
- **Relationship to neighbours:** Evening warmth is the room's own warmth; it is the feeling of the space itself, not external light
- **Accessibility:** The warmth is comfortable and not harsh
- **Animation:** The warmth increases through the afternoon and lingers into evening
- **Future extensibility:** As the room is used through the seasons, evening warmth is experienced at different clock times (earlier in winter, later in summer) but the feeling is the same
- **Canonical owner:** Architect; Home Owner
- **Rendering guidance:** Evening warmth is the room's own feeling, not a visual lighting effect; it is felt as much as seen
- **Quality standard:** The room should feel like a place where time has passed, where the household has lived, where warmth has accumulated

---

#### I8 — Window Light (the light that comes through windows, showing the orchard beyond)

**Purpose:** Light and view to the outside world; the Larder is a room with windows onto the orchard
- **Category:** Lighting / Architecture
- **Construction:** Window openings on the room's perimeter; glass panes; frames in natural wood (oak or similar)
- **Materials:** Natural light; glass (clear, not tinted); timber frames
- **Finish:** The glass is clear; the frames are oiled or painted to match the room (natural wood or soft colour)
- **Colour palette:** The light is warm and clear; the frames are warm naturals
- **Scale:** Windows are standard domestic size (600–900mm wide × 1200–1800mm tall); multiple windows allow light and view
- **Perspective:** Looked out of; the orchard is seen through the glass
- **Lighting behaviour:** Light passes through the glass without significant loss; the view is clear
- **Shadow behaviour:** Window frames cast soft shadow patterns on the walls and shelves; these patterns move through the day
- **Texture:** The glass is transparent; the frames are warm wood
- **Wear:** The glass may cloud slightly with age; frames age gracefully (paint or oil worn by weather)
- **Variants:** Window size and placement varies by wall; the principle is constant (windows face the orchard, not the street)
- **Relationship to neighbours:** Windows are the connection between the inside room and the outside orchard
- **Accessibility:** Windows can be opened for air; they are operable and maintainable
- **Animation:** Light patterns move across the shelves throughout the day; the view beyond changes with season and weather
- **Future extensibility:** Windows are permanent; they do not change
- **Canonical owner:** Architect; Home Owner
- **Rendering guidance:** Window light is clear and honest — glass shows what is beyond, the frames are warm, the view is the decoration
- **Quality standard:** Windows allow the household to remember they are in a house with an orchard beyond, not in a closed storage room

---

#### I9 — Ambient Room Shadow (the soft shadow present throughout the room, the accumulated stillness)

**Purpose:** The baseline shadow in which the room dwells; not darkness, but calm and depth
- **Category:** Lighting / Atmosphere
- **Construction:** No construction; shadow is created by the room's architecture, the depth of shelves, and the filtering of light
- **Materials:** The absence of direct light; the accumulation of warm-toned surfaces absorbing light
- **Finish:** Shadow is soft and diffuse; it is never harsh or black
- **Colour palette:** Warm grey, soft taupe, warm brown — the colour of calm shadow
- **Scale:** Ambient shadow permeates the entire room; it is the baseline from which highlights emerge
- **Perspective:** Shadow is felt throughout; the whole room is half-lit, never bright
- **Lighting behaviour:** Ambient shadow is the opposite of glare; it is restful and calm
- **Shadow behaviour:** As described; shadow is the thing itself
- **Texture:** Ambient shadow reveals texture (the grain of wood, the weave of a basket) without harsh definition
- **Wear:** Ambient shadow deepens with dust and age; this is the accumulation of living
- **Variants:** Ambient shadow is consistent; it does not vary
- **Relationship to neighbours:** Ambient shadow is the foundation; every object sits in this gentle darkness
- **Accessibility:** The shadow is not an obstacle; it is comfort
- **Animation:** Ambient shadow changes only with the seasons and the years; it is the room's constant breath
- **Future extensibility:** As the room grows, ambient shadow remains; it is the room's own colour
- **Canonical owner:** Architect; Home Owner
- **Rendering guidance:** Ambient shadow is never the colour of a dungeon (black, cool); it is always warm and welcoming
- **Quality standard:** A room's ambient shadow should make you feel held, safe, and calm — never isolated or dark

---

## The Full Picture: Twenty-One Dimensions Completed

Every asset in this library is now specified across all twenty-one dimensions. No asset is incomplete; no dimension is left undefined. This is the permanent source of truth from which all future renderings — SVG, PNG, 3D, animation, React component — will be generated.

---

## How This Library Is Used

1. **For SVG or PNG rendering:** An artist uses these specifications to create digital artwork. The artist does not invent new details; they render what is specified here.

2. **For 3D modeling:** A 3D artist creates models based on these specifications. Scale, materials, lighting behaviour, and wear patterns are all predefined.

3. **For React components:** A component developer builds interactive elements based on these specifications. The behaviour (animation, interaction) is specified; the component realizes it.

4. **For AI-generated imagery:** The specification is precise enough to feed into an image generation model, allowing consistent, authentic results.

5. **For future rooms:** If another room is added to the Living Home, its assets are specified in the same framework and added to this library. The Larder's assets are never re-drawn; they are reused.

---

## The Permanent Promise

This library is written to last. Every asset specified here will be rendered consistently for as long as THA exists. The first rendering may be SVG; the next may be 3D; the next may be something not yet invented. The specification remains the same.

**No asset is ever redraw. Every shelf, jar, basket, and bowl specified here is drawn once and reused forever.**

---

*This library creates no artwork, no code, no components. It creates specifications — the permanent truth from which all future renderings flow. The Larder is no longer approximated in CSS. It is now built from a canonical library of beautiful, well-crafted assets, each specified completely, each reused forever.*

---

**Document status: DECLARED, NOT BUILT**

The asset library is complete. Artwork creation begins in the next phase, guided entirely by these specifications. No artist will re-imagine an asset; every rendering will be faithful to the specification from which it was drawn.

---

*Rollback identifier: `rollback/living-larder-asset-library-20260723` → `a8b22162`*
*Author of record: Colin Clapson (owner) · drafted by Claude under the Engineering Workflow*
*Classification: Experience Architecture — the physical asset specification library for the Living Larder (subordinate to the Larder canon)*
*Date: 2026-07-23*
*Document ID: `ASSET1`*
