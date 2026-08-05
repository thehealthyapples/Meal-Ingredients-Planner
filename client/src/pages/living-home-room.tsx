/**
 * The Living Home — reference runtime (Model B — CONCEPT LOCK · Interaction Refinement).
 *
 * ONE continuous kitchen you move around. You do not operate an application: you
 * handle real household objects. Every Living Object is PICKED UP and DRAGGED —
 * to the handwritten Shopping pad, to Apple (the Companion), or to the Kitchen
 * bin. Those three destinations live permanently in the room, styled as part of
 * the kitchen, never as software panels. Navigation between Working Positions is
 * a simple, always-present "Areas" list; the room itself never disappears.
 *
 * Ownership unchanged: Living Objects own inventory/selection/shopping intent; the
 * Shopping domain decides purchase quantity; the Companion (Apple) owns knowledge.
 * Drag is an enhancement, never the only way — every object also opens a small
 * in-place action bar (tap / keyboard).
 */
import "./living-home-room.css";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors,
  useDraggable, useDroppable, type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useAskCompanion } from "@/components/conversation/companion-context";
import { openCompanion } from "@/components/conversation/companion-open";

import imgOats from "@/assets/living-home/larder/jars/tha-larder-jar-rolled-oats.png";
import imgFlour from "@/assets/living-home/larder/jars/tha-larder-jar-plain-flour.png";
import imgRice from "@/assets/living-home/larder/jars/tha-larder-jar-white-rice.png";
import imgSugar from "@/assets/living-home/larder/jars/tha-larder-jar-sugar.png";
import imgChia from "@/assets/living-home/larder/jars/tha-larder-jar-chia-seeds.png";

// Phase 0 — the Fridge's independent Living Objects (transparent PNGs placed on
// the EMPTY fridge plate). No baked-in food, no hotspots — real movable objects.
import fMilk from "@/assets/living-home/larder/fridge/tha-fridge-milk.png";
import fJuice from "@/assets/living-home/larder/fridge/tha-fridge-juice.png";
import fKetchup from "@/assets/living-home/larder/fridge/tha-fridge-ketchup.png";
import fMustard from "@/assets/living-home/larder/fridge/tha-fridge-mustard.png";
import fMayo from "@/assets/living-home/larder/fridge/tha-fridge-mayonnaise.png";
import fPickles from "@/assets/living-home/larder/fridge/tha-fridge-pickles.png";
import fButter from "@/assets/living-home/larder/fridge/tha-fridge-butter.png";
import fCheese from "@/assets/living-home/larder/fridge/tha-fridge-cheese.png";
import fYoghurt from "@/assets/living-home/larder/fridge/tha-fridge-yoghurt.png";
import fLeftovers from "@/assets/living-home/larder/fridge/tha-fridge-leftovers.png";
import fBerries from "@/assets/living-home/larder/fridge/tha-fridge-berries.png";
import fGrapes from "@/assets/living-home/larder/fridge/tha-fridge-grapes.png";
import fTomatoes from "@/assets/living-home/larder/fridge/tha-fridge-tomatoes.png";
import fCucumber from "@/assets/living-home/larder/fridge/tha-fridge-cucumber.png";
import fPepper from "@/assets/living-home/larder/fridge/tha-fridge-pepper.png";
import fRadishes from "@/assets/living-home/larder/fridge/tha-fridge-radishes.png";
import fLettuce from "@/assets/living-home/larder/fridge/tha-fridge-lettuce.png";
import fSpringOnions from "@/assets/living-home/larder/fridge/tha-fridge-spring-onions.png";

// Each object: its canonical home on the empty fridge (x centre %, y BASE %, height %).
interface PlacedObject { name: string; src: string; x: number; y: number; h: number; reflect?: boolean; }
const FRIDGE_OBJECTS: PlacedObject[] = [
  // Geometry measured from the arrival-derived, step-closer plate.
  // door — left bins (white moulded; bases tuck behind the bin fronts)
  // Sizes rebalanced to real proportions and to counter the +1.2 step-zoom.
  { name: "Milk", src: fMilk, x: 29, y: 34, h: 13.5 }, { name: "Juice", src: fJuice, x: 29, y: 47.5, h: 12.5 },
  // door — right bins (one condiment per bin; pickles in the lowest)
  { name: "Ketchup", src: fKetchup, x: 69.5, y: 22.5, h: 12.5 }, { name: "Mustard", src: fMustard, x: 69.5, y: 33.5, h: 9.5 },
  { name: "Mayonnaise", src: fMayo, x: 69.5, y: 47.5, h: 8.5 }, { name: "Pickles", src: fPickles, x: 69.5, y: 62, h: 9 },
  // glass shelves (front edges at y≈24 and y≈34.7)
  { name: "Leftovers", src: fLeftovers, x: 41, y: 24, h: 7, reflect: true }, { name: "Yoghurt", src: fYoghurt, x: 55, y: 24, h: 7, reflect: true },
  { name: "Cheese", src: fCheese, x: 43, y: 34.5, h: 6.2, reflect: true }, { name: "Butter", src: fButter, x: 55, y: 34.5, h: 4.6, reflect: true },
  // salad crisper (left clear drawer)
  { name: "Lettuce", src: fLettuce, x: 45, y: 60, h: 7 }, { name: "Tomatoes", src: fTomatoes, x: 38, y: 59.5, h: 5.2 },
  { name: "Pepper", src: fPepper, x: 36.5, y: 61, h: 6 }, { name: "Cucumber", src: fCucumber, x: 42, y: 55.5, h: 3.8 },
  { name: "Radishes", src: fRadishes, x: 48, y: 59, h: 4.6 }, { name: "Spring onions", src: fSpringOnions, x: 41, y: 61, h: 4 },
  // fruit crisper (right clear drawer)
  { name: "Berries", src: fBerries, x: 54, y: 59.5, h: 5 }, { name: "Grapes", src: fGrapes, x: 59, y: 61, h: 6.5 },
];

interface Point { x: number; y: number; scale: number; shadowW: number; }
const POINTS: Point[] = [
  { x: 25.0, y: 40.0, scale: 1.00, shadowW: 11.0 },
  { x: 39.5, y: 40.0, scale: 0.97, shadowW: 10.7 },
  { x: 57.5, y: 40.0, scale: 1.03, shadowW: 11.4 },
  { x: 24.0, y: 61.6, scale: 1.05, shadowW: 11.9 },
  { x: 38.0, y: 61.6, scale: 0.98, shadowW: 10.9 },
  { x: 53.0, y: 61.6, scale: 1.02, shadowW: 11.4 },
];

// Pantry shelves — dry staples (drinks live at their own station).
interface Group { id: string; name: string; noun?: string; jar: string; contentBottom: number; baseHPct: number; items: string[]; }
const GROUPS: Group[] = [
  { id: "flours", name: "Flours",         noun: "flour", jar: imgFlour, contentBottom: 0.844, baseHPct: 24, items: ["Wholemeal", "White", "Strong bread", "Self-raising", "Spelt", "Rye"] },
  { id: "grains", name: "Grains",                        jar: imgOats,  contentBottom: 0.844, baseHPct: 24, items: ["Rolled oats", "Pearl barley", "Bulgur wheat", "Couscous"] },
  { id: "pulses", name: "Pulses",                        jar: imgChia,  contentBottom: 0.725, baseHPct: 20, items: ["Chickpeas", "Red lentils", "Green lentils", "Butter beans", "Kidney beans"] },
  { id: "rice",   name: "Rice & pasta",                  jar: imgRice,  contentBottom: 0.844, baseHPct: 24, items: ["White rice", "Brown rice", "Penne", "Fusilli"] },
  { id: "oils",   name: "Oils & vinegars",               jar: imgOats,  contentBottom: 0.844, baseHPct: 24, items: ["Olive oil", "Sunflower oil", "Balsamic", "White wine vinegar"] },
  { id: "baking", name: "Baking",                        jar: imgSugar, contentBottom: 0.844, baseHPct: 24, items: ["Caster sugar", "Icing sugar", "Soft brown sugar", "Bicarb of soda"] },
];
const groupById = (id: string | null) => GROUPS.find(g => g.id === id) ?? null;

// Household storage locations. A flat zone has `items`; a deeper zone (like the
// store cupboard) has `categories`, mirroring the shelves' groups→items depth.
interface ZoneCategory { id: string; name: string; items: string[]; }
interface Zone { id: string; name: string; plate: string; items?: string[]; categories?: ZoneCategory[]; }
const ZONES: Zone[] = [
  { id: "fruit-bowl", name: "Fruit bowl",      plate: "fruit",    items: ["Apples", "Bananas", "Pears", "Satsumas", "Oranges"] },
  // The worktop plate is the wide room view; its counter holds the fruit baskets.
  // Re-scoped to the produce the plate actually shows (no floating melons) — the
  // same fruit as the Fruit bowl, here seen from the wider worktop camera.
  { id: "worktop",    name: "Kitchen worktop", plate: "baskets",  items: ["Apples", "Bananas", "Oranges", "Pears"] },
  // Phase 0 REFERENCE — the Fridge is now an EMPTY plate carrying INDEPENDENT
  // Living Objects (see FRIDGE_OBJECTS). No baked-in food, no coordinate hotspots.
  { id: "fridge",     name: "Fridge",          plate: "fridge-empty" },
  { id: "freezer",    name: "Freezer",         plate: "freezer",  items: ["Frozen veg", "Frozen fruit", "Meat", "Fish", "Prepared meals"] },
  { id: "rootveg",    name: "Root veg rack",   plate: "rootveg",  items: ["Potatoes", "Sweet potatoes", "Onions", "Garlic", "Shallots"] },
  { id: "cupboard",   name: "Store cupboard",  plate: "cupboard", categories: [
    { id: "tinned-fish", name: "Tinned fish", items: ["Tuna", "Sardines", "Mackerel", "Salmon"] },
    { id: "soups",       name: "Soups",       items: ["Tomato", "Chicken & mushroom", "Chickpea & lentil", "Vegetable"] },
    { id: "beans",       name: "Beans",       items: ["Kidney beans", "Butter beans", "Chickpeas", "Cannellini", "Black beans"] },
    { id: "tomatoes",    name: "Tomatoes",    items: ["Chopped", "Plum", "Passata", "Cherry"] },
    { id: "tinned-veg",  name: "Tinned veg",  items: ["Sweetcorn", "Peas", "Carrots", "Green beans"] },
    { id: "coconut",     name: "Coconut",     items: ["Coconut milk", "Coconut cream", "Creamed coconut"] },
  ] },
  { id: "tea-coffee", name: "Tea & coffee",    plate: "tea-coffee", items: ["Black tea", "Herbal teas", "Coffee", "Hot chocolate"] },
  { id: "bread",      name: "Bread store",     plate: "bread",    items: ["Bread", "Rolls", "Bagels"] },
];
const zoneById = (id: string | null) => ZONES.find(z => z.id === id) ?? null;

const ROOM_PLATES = ["arrival", "shelf", "fridge", "fridge-empty", "freezer", "cupboard", "baskets", "rootveg", "bread", "tea-coffee", "fruit"];

// The always-present "Areas" list — the simple way to move between Working
// Positions. The whole room (Arrival) is always the first entry to step back to.
const AREAS: { id: string; name: string }[] = [
  { id: "arrival", name: "The whole room" },
  { id: "shelves", name: "Pantry shelves" },
  ...ZONES.map(z => ({ id: z.id, name: z.name })),
];

const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const seat = (p: Point, cb: number, h: number) => ({ h: h * p.scale, top: p.y - cb * h * p.scale });

// In the Pantry the Environment Plate already depicts the real food, so a Living
// Object is anchored ON its depicted food and named there — never a separate
// floating produce cut-out (which reads as staged). Fresh items are name tags on
// the food they sit on; only the pantry-shelf staples render their own jar vessel.

// ── Canonical Homes (architecture §4A) ────────────────────────────────────────
// Where the Environment Plate already depicts the food, the Living Object rests
// on it: each object is anchored over its real place in the room (x,y in stage %).
// Tuned from the calibrated Working-Position captures. Items with no depicted home
// (e.g. worktop melons the plate doesn't show) fall back to the gathered band and
// are logged as a placement/asset polish item.
const HOMES: Record<string, Record<string, { x: number; y: number }>> = {
  rootveg: {
    "Potatoes": { x: 50, y: 20 }, "Onions": { x: 36, y: 45 }, "Shallots": { x: 53, y: 46 },
    "Garlic": { x: 67, y: 46 }, "Sweet potatoes": { x: 58, y: 70 },
  },
  "tea-coffee": {
    "Black tea": { x: 31, y: 31 }, "Herbal teas": { x: 48, y: 31 },
    "Coffee": { x: 63, y: 30 }, "Hot chocolate": { x: 55, y: 31 },
  },
  fridge: {
    "Milk": { x: 37, y: 55 }, "Yoghurt": { x: 34, y: 45 }, "Cheese": { x: 61, y: 45 },
    "Butter": { x: 52, y: 45 }, "Eggs": { x: 66, y: 55 }, "Berries": { x: 57, y: 55 },
    "Leftovers": { x: 53, y: 24 },
  },
  "fruit-bowl": {
    "Apples": { x: 72, y: 54 }, "Oranges": { x: 21, y: 47 }, "Satsumas": { x: 24, y: 51 },
    "Bananas": { x: 44, y: 52 }, "Pears": { x: 58, y: 54 },
  },
  worktop: {  // the fruit baskets on the right of the wide worktop plate
    "Apples": { x: 78, y: 58 }, "Bananas": { x: 82, y: 60 }, "Oranges": { x: 87, y: 62 }, "Pears": { x: 85, y: 52 },
  },
  freezer: {  // the open freezer drawers on the left (the only frozen food shown)
    "Frozen veg": { x: 13, y: 70 }, "Frozen fruit": { x: 20, y: 73 }, "Prepared meals": { x: 15, y: 78 },
    "Meat": { x: 12, y: 86 }, "Fish": { x: 19, y: 87 },
  },
  bread: {  // the loaves, rolls and bagels on the board (right of the crock)
    "Bread": { x: 61, y: 51 }, "Rolls": { x: 57, y: 77 }, "Bagels": { x: 68, y: 81 },
  },
};
const homeFor = (zoneId: string, name: string) => HOMES[zoneId]?.[name] ?? null;

// Canonical homes for the Store Cupboard's category plaques — seated on the two
// tin shelves the plate depicts (so a category sits on its own tins).
const CAT_HOMES: Record<string, { x: number; y: number }> = {
  // Store cupboard — on the two tin shelves
  "tinned-fish": { x: 34, y: 58 }, "soups": { x: 50, y: 58 }, "beans": { x: 66, y: 58 },
  "tomatoes": { x: 34, y: 74 }, "tinned-veg": { x: 50, y: 74 }, "coconut": { x: 66, y: 74 },
  // Fridge — Salad on the crisper drawer; Condiments & Pickles on the door jars
  "salad": { x: 42, y: 73 }, "condiments": { x: 17, y: 55 }, "pickles": { x: 15, y: 74 },
};

// Lay a zone's Living Objects out as a gathered standing row "in front of you",
// wrapping to a tidy second row when there are many (fallback when no canonical home).
const bandPos = (i: number, n: number) => {
  const perRow = n <= 5 ? n : Math.ceil(n / 2);
  const rows = Math.ceil(n / perRow);
  const row = Math.floor(i / perRow);
  const inRow = Math.min(perRow, n - row * perRow);
  const col = i - row * perRow;
  const spread = Math.min(16, 76 / inRow);
  const x = 50 + (col - (inRow - 1) / 2) * spread;
  const y = rows === 1 ? 66 : row === 0 ? 58 : 74;
  return { x, y };
};

// A group's breakdown items, clustered over the group's OWN region (its plaque
// home) rather than the room centre — so a drilled sub-name never appears over
// unrelated food. Falls back to the gathered band when the group has no home.
const clusterPos = (catId: string, i: number, n: number) => {
  const base = CAT_HOMES[catId];
  if (!base) return bandPos(i, n);
  const spread = Math.min(8, 34 / Math.max(1, n));
  const x = base.x + (i - (n - 1) / 2) * spread;
  return { x: Math.max(9, Math.min(91, x)), y: base.y };
};

// ── One draggable Living Object — a real thing you pick up ─────────────────────
// The object IS the interaction. It has exactly three destinations (Shopping,
// Apple, the Bin) and NO buttons around it. Pointer/touch drag for most; the
// dnd-kit keyboard sensor (space to lift, arrows to carry) serves keyboard/switch.
type ObjVariant = "jar" | "produce" | "token" | "fridge";
function LivingObject({ id, name, product, src, variant, style, hint, reflect }: {
  id: string; name: string; product: string; src: string | null; variant: ObjVariant;
  style: React.CSSProperties; hint: boolean; reflect?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data: { name, product, src, variant } });
  return (
    <div
      ref={setNodeRef}
      className={`lh-obj lh-obj--${variant}${isDragging ? " is-dragging" : ""}${hint ? " is-hint" : ""}`}
      style={style}
      {...listeners}
      {...attributes}
      aria-label={`${name} — pick up and carry to the shopping pad, to the Companion, or to the kitchen bin`}
      data-testid={`lh-obj-${slug(name)}`}
    >
      <span className="lh-obj__catch" aria-hidden />
      {variant === "fridge" && <span className="lh-obj__seat" aria-hidden />}
      {src
        ? <img className="lh-obj__img" src={src} alt="" draggable={false} />
        : <span className="lh-obj__token">{name}</span>}
      {src && <span className="lh-obj__cap">{name}</span>}
    </div>
  );
}

// ── A permanent in-room destination you drag onto (never a software panel) ────
function DropSpot({ kind, className, dragging, title, sub, children, testid }: {
  kind: "shopping" | "companion" | "bin"; className: string; dragging: boolean;
  title: string; sub: string; children: React.ReactNode; testid: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: kind, data: { kind } });
  return (
    <div
      ref={setNodeRef}
      className={`lh-drop ${className}${isOver ? " is-over" : ""}${dragging ? " is-armed" : ""}`}
      aria-label={`${title} — ${sub}`}
      data-testid={testid}
    >
      <div className="lh-drop__art" aria-hidden>{children}</div>
      <span className="lh-drop__label"><b>{title}</b><small>{sub}</small></span>
    </div>
  );
}

export default function LivingHomeRoom() {
  type Level = "arrival" | "shelves" | "category" | "zone" | "zone-category";
  const [level, setLevel] = useState<Level>("arrival");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [zoneCatId, setZoneCatId] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());  // dragged to the bin
  const [navOpen, setNavOpen] = useState(false);                    // Areas navigator (collapsed inside a Working Position)
  const [drag, setDrag] = useState<{ name: string; src: string | null; variant: ObjVariant } | null>(null);
  const [busy, setBusy] = useState(false);

  const qc = useQueryClient();
  const { toast } = useToast();
  const askCompanion = useAskCompanion();

  const group = groupById(groupId);
  const zone = zoneById(zoneId);
  const zoneCat = zone?.categories?.find(c => c.id === zoneCatId) ?? null;
  const working = level !== "arrival";

  const currentPlate = level === "arrival" ? "arrival"
    : level === "zone" || level === "zone-category" ? (zone?.plate ?? "shelf") : "shelf";
  const currentTop = level === "arrival" ? "arrival"
    : level === "shelves" || level === "category" ? "shelves"
    : zoneId;

  // Which noun completes a leaf into a real product name (flours → "White flour").
  const noun = level === "category" ? group?.noun : undefined;
  const productOf = (item: string) => (noun ? `${item} ${noun}` : item);

  const goArrival = () => { setLevel("arrival"); };
  const goShelves = () => { setGroupId(null); setLevel("shelves"); };
  const openGroup = (id: string) => { setGroupId(id); setLevel("category"); };
  const openZone = (id: string) => { setZoneId(id); setZoneCatId(null); setLevel("zone"); };
  const openZoneCat = (id: string) => { setZoneCatId(id); setLevel("zone-category"); };
  const goToArea = (id: string) => { id === "arrival" ? goArrival() : id === "shelves" ? goShelves() : openZone(id); };

  // ── The three universal object gestures ─────────────────────────────────────
  const toShopping = async (name: string) => {
    if (busy) return;
    setBusy(true);
    try {
      // Intent only — the Shopping domain decides how much (history / pack size).
      await apiRequest("POST", "/api/shopping-list", { productName: productOf(name), source: "pantry", purchaseIntent: true });
      qc.invalidateQueries({ queryKey: ["/api/shopping-list"] });
      toast({ title: `${name} added to shopping`, description: "Still in your larder — Shopping has suggested the usual amount, which you can adjust." });
    } catch { toast({ title: "Couldn't add that to shopping", variant: "destructive" }); } finally { setBusy(false); }
  };
  const toCompanion = (name: string) => {
    askCompanion({ utterance: `Tell me about ${productOf(name)} — its nutrition, health benefits and a few recipes our household could make.`, hints: {} });
    openCompanion();
  };
  const toBin = (name: string) => {
    const key = productOf(name);
    setRemoved(s => new Set(s).add(key));
    toast({
      title: `${name} taken out`,
      description: "In the kitchen bin — still on your shelf until you decide.",
      action: <ToastAction altText="Put it back" onClick={() => setRemoved(s => { const n = new Set(s); n.delete(key); return n; })} data-testid="lh-undo-bin">Put it back</ToastAction>,
    });
  };
  const isRemoved = (name: string) => removed.has(productOf(name));

  // ── Drag orchestration (pointer + touch; keyboard/tap served by the bar) ────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),  // space to lift, arrows to carry — the non-drag path, no buttons
  );
  const onDragStart = (e: DragStartEvent) => {
    const d = e.active.data.current as { name: string; src: string | null; variant: ObjVariant } | undefined;
    if (d) setDrag({ name: d.name, src: d.src ?? null, variant: d.variant });
  };
  const onDragEnd = (e: DragEndEvent) => {
    const d = e.active.data.current as { name: string } | undefined;
    setDrag(null);
    const over = e.over?.data.current as { kind: string } | undefined;
    if (!d || !over) return;
    if (over.kind === "shopping") toShopping(d.name);
    else if (over.kind === "companion") toCompanion(d.name);
    else if (over.kind === "bin") toBin(d.name);
  };

  // A leaf's physical presence: a real object image where we hold one, else a
  // chalk object token. `jar` uses the group's vessel seated on the shelf points.
  const leafSrc = (_name: string, groupJar?: string): { src: string | null; variant: ObjVariant } =>
    groupJar ? { src: groupJar, variant: "jar" } : { src: null, variant: "token" };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDrag(null)}>
      <div data-realm="pantry" className="lh-room-page">
        <div className={`lh-stage${working ? " is-working" : ""}${drag ? " is-dragging" : ""}${level === "zone" && zone?.id === "fridge" ? " is-fridge-step" : ""}`} data-testid="lh-stage">
          {ROOM_PLATES.map(p => <div key={p} className={`lh-plate lh-plate--${p}${currentPlate === p ? " is-visible" : ""}`} />)}
          {working && <div className="lh-veil" aria-hidden />}

          {/* Areas — inside a Working Position the navigator RECEDES to a small tab
              so the room stays the primary experience; it reopens on tap/hover. */}
          {working && !navOpen ? (
            <button type="button" className="lh-areas-tab" onClick={() => setNavOpen(true)}
              onMouseEnter={() => setNavOpen(true)} aria-label="Show areas of the pantry" data-testid="lh-areas-tab">
              <span className="lh-areas-tab__grip" aria-hidden />Areas
            </button>
          ) : (
            <nav className={`lh-areas${working ? " is-floating" : ""}`} aria-label="Areas of the pantry"
              onMouseLeave={() => working && setNavOpen(false)}>
              <span className="lh-areas__head">Around the pantry</span>
              {AREAS.map(a => (
                <button key={a.id} type="button"
                  className={`lh-areas__item${currentTop === a.id ? " is-here" : ""}`}
                  aria-current={currentTop === a.id ? "true" : undefined}
                  onClick={() => { goToArea(a.id); setNavOpen(false); }} data-testid={`lh-area-${a.id}`}>
                  {a.name}
                </button>
              ))}
            </nav>
          )}

          {level === "arrival" && <span className="lh-caption">Your kitchen — pick an area, then handle what's inside</span>}

          {/* ── Pantry shelves: groups → a category's Living Objects (real jars) ── */}
          {level === "shelves" && (
            <div className="lh-layer" key="shelves">
              {GROUPS.map((g, i) => {
                const { h, top } = seat(POINTS[i], g.contentBottom, g.baseHPct);
                return (
                  <button key={g.id} className="lh-groupjar" style={{ left: `${POINTS[i].x}%`, top: `${top}%`, height: `${h}%` }}
                    onClick={() => openGroup(g.id)} aria-label={`Open ${g.name} — ${g.items.length} kinds`} data-testid={`lh-open-${slug(g.name)}`}>
                    <img src={g.jar} alt="" draggable={false} />
                    <span className="lh-groupjar__name">{g.name}<small>{g.items.length} kinds</small></span>
                  </button>
                );
              })}
            </div>
          )}
          {level === "category" && group && (
            <div className="lh-layer" key={"cat-" + group.id}>
              {group.items.filter(name => !isRemoved(name)).map((name, i) => {
                const { h, top } = seat(POINTS[i], group.contentBottom, group.baseHPct);
                const { src, variant } = leafSrc(name, group.jar);
                return (
                  <LivingObject key={name} id={`obj-${slug(name)}`} name={name} product={productOf(name)} src={src} variant={variant} hint={i === 0}
                    style={{ left: `${POINTS[i].x}%`, top: `${top}%`, height: `${h}%`, transform: "translate(-50%,0)" }} />
                );
              })}
            </div>
          )}

          {/* ── Phase 0 reference: the Fridge — INDEPENDENT Living Objects on the
               EMPTY plate. Each is a real PNG; the bin removes it (removed set). ── */}
          {level === "zone" && zone?.id === "fridge" && (
            <>
              <div className="lh-layer" key="fridge-objects">
                {FRIDGE_OBJECTS.filter(o => !isRemoved(o.name)).map(o => (
                  <LivingObject key={o.name} id={`obj-${slug(o.name)}`} name={o.name} product={o.name} src={o.src} variant="fridge" hint={false} reflect={o.reflect}
                    style={{ left: `${o.x}%`, top: `${o.y - o.h}%`, height: `${o.h}%`, transform: "translate(-50%,0)" }} />
                ))}
              </div>
              {/* FRONT layer — the SAME fridge plate, clipped to the foreground
                  furniture (crisper drawer fronts + the four door-rack front walls)
                  and drawn ABOVE the objects, so each Living Object sits INSIDE the
                  fridge, tucked behind the fronts. Door walls are masked to just the
                  bin bands so an object's body pokes above while its base tucks in. */}
              <div className="lh-front lh-front--fridge-drawers" aria-hidden />
              <div className="lh-front lh-front--fridge-shelves" aria-hidden />
              <div className="lh-front lh-front--fridge-doorL" aria-hidden />
              <div className="lh-front lh-front--fridge-doorR" aria-hidden />
            </>
          )}

          {/* ── A flat zone → objects; a deep zone (cupboard) → categories → objects ── */}
          {level === "zone" && zone && zone.items && (
            <div className="lh-layer" key={"zone-" + zone.id}>
              {zone.items.filter(name => !isRemoved(name)).map((name, i, arr) => {
                const { x, y } = homeFor(zone.id, name) ?? bandPos(i, arr.length);
                const { src, variant } = leafSrc(name);
                return (
                  <LivingObject key={name} id={`obj-${slug(name)}`} name={name} product={productOf(name)} src={src} variant={variant} hint={i === 0}
                    style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }} />
                );
              })}
            </div>
          )}
          {level === "zone" && zone && zone.categories && (
            <div className="lh-layer" key={"zonecats-" + zone.id}>
              {zone.categories.map((c, i, arr) => {
                const { x, y } = CAT_HOMES[c.id] ?? bandPos(i, arr.length);
                return (
                  <button key={c.id} className="lh-subarea" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}
                    onClick={() => openZoneCat(c.id)} aria-label={`Open ${c.name}`} data-testid={`lh-opencat-${slug(c.name)}`}>
                    {c.name}<small>{c.items.length}</small>
                  </button>
                );
              })}
            </div>
          )}
          {level === "zone-category" && zoneCat && (
            <div className="lh-layer" key={"zonecat-" + zoneCat.id}>
              {zoneCat.items.filter(name => !isRemoved(name)).map((name, i, arr) => {
                const { x, y } = clusterPos(zoneCat.id, i, arr.length);
                const { src, variant } = leafSrc(name);
                return (
                  <LivingObject key={name} id={`obj-${slug(name)}`} name={name} product={productOf(name)} src={src} variant={variant} hint={i === 0}
                    style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }} />
                );
              })}
            </div>
          )}

          {/* ── The three permanent kitchen destinations (drag an object onto them) ── */}
          <div className="lh-dock" aria-label="Where you can put things">
            <DropSpot kind="shopping" className="lh-drop--pad" dragging={!!drag}
              title="Shopping list" sub="drop to buy" testid="lh-drop-shopping">
              <span className="lh-pad">
                <span className="lh-pad__line" /><span className="lh-pad__line" /><span className="lh-pad__line" />
                <span className="lh-pad__scribble">Shopping</span>
              </span>
            </DropSpot>
            <DropSpot kind="companion" className="lh-drop--companion" dragging={!!drag}
              title="Companion" sub="drop to ask" testid="lh-drop-companion">
              {/* the canonical Companion mark — the THA apple carved into sage ceramic */}
              <span className="lh-companion-mark">
                <span className="companion-emblem" aria-hidden>
                  <i className="c-occ" /><i className="c-rim-up" /><i className="c-rim-lo" /><i className="c-face" />
                </span>
              </span>
            </DropSpot>
            <DropSpot kind="bin" className="lh-drop--bin" dragging={!!drag}
              title="Kitchen bin" sub="drop to take out" testid="lh-drop-bin">
              <span className="lh-bin"><span className="lh-bin__lid" /><span className="lh-bin__body" /></span>
            </DropSpot>
          </div>

          {/* Stepping back — the retreat mirrors the approach */}
          {level === "category" && <button className="lh-back" onClick={goShelves} data-testid="lh-back">← Back to the shelves</button>}
          {level === "zone-category" && zone && <button className="lh-back" onClick={() => openZone(zone.id)} data-testid="lh-back">← Back to the {zone.name.toLowerCase()}</button>}

          {level === "shelves" && <span className="lh-caption">Your shelves — open a group to handle the jars</span>}
          {level === "category" && group && <span className="lh-caption">{group.name} — drag a jar to shopping, to the Companion, or the bin</span>}
          {level === "zone" && zone && (
            <span className="lh-caption">
              {zone.items && zone.categories ? `${zone.name} — drag a thing, or open a group`
                : zone.categories ? `${zone.name} — open a group`
                : `${zone.name} — drag a thing to shopping, to the Companion, or the bin`}
            </span>
          )}
          {level === "zone-category" && zoneCat && <span className="lh-caption">{zoneCat.name} — drag a thing to shopping, to the Companion, or the bin</span>}
        </div>
      </div>

      {/* the lifted object follows the hand */}
      <DragOverlay dropAnimation={null}>
        {drag ? (
          <div className={`lh-ghost lh-ghost--${drag.variant}`}>
            {drag.src ? <img src={drag.src} alt="" draggable={false} /> : <span className="lh-obj__token">{drag.name}</span>}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
