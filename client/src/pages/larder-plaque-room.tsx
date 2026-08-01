/**
 * The Living Larder — running room with brass shelf-edge plaques.
 *
 * Settled visual language (2026-08-01): Option A · brass. The photoreal room
 * (concept-a "Orchard Workroom", promoted to /images/living-larder/room/) is the
 * fixed, dominant background; each food-group's identity is a brass plaque built
 * into the shelf edge — the interaction surface — never a card over the photo.
 *
 * Progressive disclosure: L1 room → L2 shelf selected (plaque warms/enlarges, the
 * shelf brightens, count + status reveal) → L3 that shelf's jars listed → L4 a jar
 * acted on. Individual jar names appear ONLY for the selected shelf, never all at
 * once. The room always wins.
 *
 * Data: the household's real staples (`/api/pantry`, Domain 30) are mapped onto the
 * room's shelves — by storage area for fruit/fridge/freezer, and by food group for
 * larder/household staples (a keyword classifier; see FOOD_GROUPS). No new owner.
 *
 * ⚠ VERIFICATION: authored without a local run (this environment has no dev server
 * / DB / auth). The %-anchors below are tuned to the room image and MUST be nudged
 * against a real render; the classifier and states need a browser pass. See the
 * implementation report LIVING_LARDER_BRASS_PLAQUE_IMPLEMENTATION.md.
 */
import "./larder-plaque-room.css";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { pageContainerClass } from "@/components/workspace-header";

interface PantryItem {
  id: number; ingredientKey: string; displayName: string | null;
  category: string; needQuantityValue: number | null; needUnit: string | null;
}
const nameOf = (i: PantryItem) => i.displayName || i.ingredientKey;
const low = (i: PantryItem) => i.needQuantityValue !== null;

// A bundle = one shelf on the canonical room, with its %-anchor (plaque centre) and
// its %-region (the produce that brightens). Order/positions match the room image.
interface Bundle {
  id: string; name: string; keywords: string[];
  x: number; y: number;                          // plaque anchor (% of room)
  shelf?: { l: number; t: number; w: number; h: number };  // brightening region (%)
  stub?: boolean;                                // area not depicted in this room yet
}
const FOOD_GROUPS: Bundle[] = [
  { id: "grains", name: "Grains & Flour", x: 32.9, y: 21.9, shelf: { l: 19, t: 8, w: 26, h: 15 },
    keywords: ["oat","flour","rice","pasta","penne","fusilli","spaghetti","macaroni","couscous","quinoa","barley","bread","cereal","granola","bulgur","polenta"] },
  { id: "pulses", name: "Pulses & Beans", x: 58.7, y: 22.6, shelf: { l: 45, t: 8, w: 28, h: 16 },
    keywords: ["lentil","bean","chickpea","pea","dhal","dal","pulse","hummus"] },
  { id: "canned", name: "Canned Goods", x: 30.9, y: 37.5, shelf: { l: 19, t: 29, w: 25, h: 11 },
    keywords: ["tin","canned","tomato","sweetcorn","soup","preserve","jam","chutney","pickle","olive","paste","sauce"] },
  { id: "herbs", name: "Herbs & Spices", x: 57.8, y: 37.5, shelf: { l: 44, t: 29, w: 29, h: 12 },
    keywords: ["basil","thyme","rosemary","mint","parsley","coriander","oregano","sage","dill","spice","pepper","salt","cumin","paprika","turmeric","cinnamon","herb"] },
  { id: "dried", name: "Dried Fruits & Nuts", x: 31.1, y: 53.6, shelf: { l: 19, t: 50, w: 26, h: 12 },
    keywords: ["nut","almond","walnut","cashew","pecan","hazelnut","raisin","sultana","apricot","date","fig","prune","seed","dried"] },
  { id: "teas", name: "Teas, Drinks & Oils", x: 57.8, y: 53.6, shelf: { l: 44, t: 49, w: 29, h: 12 },
    keywords: ["tea","coffee","oil","vinegar","honey","syrup","juice","cocoa","drink","stock"] },
  // Colin's note — fresh produce lives in a basket on the worktop:
  { id: "fruit", name: "Fruit & Veg", x: 80, y: 60, shelf: { l: 70, t: 52, w: 27, h: 18 }, keywords: [] },
  // Cold storage — this room photo shows no fridge/freezer, so these are honest
  // dimmed stubs, never faked into the photograph (need a room that depicts them):
  { id: "fridge", name: "Fridge", x: 30, y: 90, stub: true, keywords: [] },
  { id: "freezer", name: "Freezer", x: 46, y: 90, stub: true, keywords: [] },
];

function bundleOf(item: PantryItem): string | null {
  if (item.category === "fruit") return "fruit";
  if (item.category === "fridge") return "fridge";
  if (item.category === "freezer") return "freezer";
  const hay = `${item.ingredientKey} ${item.displayName ?? ""}`.toLowerCase();
  for (const g of FOOD_GROUPS) {
    if (g.stub || g.id === "fruit") continue;
    if (g.keywords.some(k => hay.includes(k))) return g.id;
  }
  return null; // unclassified larder staples aren't placed on a shelf (documented)
}

export default function LarderPlaqueRoom() {
  const { data: items = [] } = useQuery<PantryItem[]>({ queryKey: ["/api/pantry"] });
  const { toast } = useToast();
  const qc = useQueryClient();
  const [hover, setHover] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);

  const byBundle = useMemo(() => {
    const m = new Map<string, PantryItem[]>();
    for (const it of items) { const b = bundleOf(it); if (!b) continue; (m.get(b) ?? m.set(b, []).get(b)!).push(it); }
    return m;
  }, [items]);

  const addToShopping = async (it: PantryItem) => {
    try {
      await apiRequest("POST", "/api/shopping-list", {
        productName: nameOf(it), quantityValue: it.needQuantityValue ?? 1,
        unit: it.needUnit || "unit", category: it.category,
        source: it.category === "household" ? "household" : "pantry",
      });
      qc.invalidateQueries({ queryKey: ["/api/shopping-list"] });
      toast({ title: `${nameOf(it)} added to shopping`, description: "It's still in your larder — we've just noted you need more." });
    } catch { toast({ title: "Couldn't add that to your shopping", variant: "destructive" }); }
  };

  const activeBundle = active ? FOOD_GROUPS.find(g => g.id === active) ?? null : null;
  const activeItems = active ? byBundle.get(active) ?? [] : [];

  return (
    <div data-realm="pantry" className={pageContainerClass(true)}>
      <div className="lpq-room" data-testid="lpq-room" onClick={() => setActive(null)}>
        {FOOD_GROUPS.map(g => {
          const list = byBundle.get(g.id) ?? [];
          const count = list.length;
          const anyLow = list.some(low);
          const status = g.stub ? "att" : anyLow ? "low" : "well";
          const statusLabel = g.stub ? "Coming soon" : anyLow ? "Running low" : "Well stocked";
          const isHover = hover === g.id, isActive = active === g.id;
          return (
            <div key={g.id} className={`lpq-cat${isHover ? " is-hover" : ""}${isActive ? " is-active" : ""}`}>
              {g.shelf && (
                <div className="lpq-shelf" style={{ left: `${g.shelf.l}%`, top: `${g.shelf.t}%`, width: `${g.shelf.w}%`, height: `${g.shelf.h}%` }} />
              )}
              <button
                type="button"
                className={`lpq-plaque${g.stub ? " is-stub" : ""}`}
                style={{ left: `${g.x}%`, top: `${g.y}%` }}
                data-testid={`lpq-plaque-${g.id}`}
                aria-pressed={isActive}
                aria-label={`${g.name}${g.stub ? " — coming soon" : `, ${count} item${count === 1 ? "" : "s"}, ${statusLabel}`}`}
                onMouseEnter={() => setHover(g.id)} onMouseLeave={() => setHover(h => h === g.id ? null : h)}
                onFocus={() => setHover(g.id)} onBlur={() => setHover(h => h === g.id ? null : h)}
                onClick={(e) => { e.stopPropagation(); if (g.stub) return; setActive(a => a === g.id ? null : g.id); }}
              >
                <span className="lpq-plaque__name">{g.name}</span>
                <span className="lpq-plaque__meta">
                  <span className={`lpq-plaque__pip pip-${status}`} />
                  {g.stub ? "Coming soon" : `${count} item${count === 1 ? "" : "s"} · ${statusLabel}`}
                </span>
              </button>
            </div>
          );
        })}

        {/* Level 3 — only the selected shelf's jars, never all at once */}
        {activeBundle && !activeBundle.stub && (
          <div className="lpq-drawer" data-testid="lpq-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="lpq-drawer__head">
              <b>{activeBundle.name}</b>
              <small>{activeItems.length} item{activeItems.length === 1 ? "" : "s"}</small>
              <button type="button" className="lpq-drawer__close" onClick={() => setActive(null)}>Close</button>
            </div>
            {activeItems.length === 0 ? (
              <p className="lpq-empty">Nothing kept here yet.</p>
            ) : (
              <div className="lpq-jars">
                {activeItems.map(it => (
                  <button key={it.id} type="button" className={`lpq-jar${low(it) ? " is-low" : ""}`}
                    data-testid={`lpq-jar-${it.id}`} title="Add to shopping" onClick={() => addToShopping(it)}>
                    {nameOf(it)}{low(it) && " · low"}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
