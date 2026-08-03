/**
 * Living Larder — shared food-group bundle model.
 * The room's six shelves + fruit/cold areas, their %-anchors on the canonical
 * room image, and the classifier that places the household's real staples.
 * Shared by the room (plaques) and the zoomed category page.
 */
export interface PantryItem {
  id: number; ingredientKey: string; displayName: string | null;
  category: string; needQuantityValue: number | null; needUnit: string | null;
}
export const nameOf = (i: PantryItem) => i.displayName || i.ingredientKey;
export const isLow = (i: PantryItem) => i.needQuantityValue !== null;

export interface Bundle {
  id: string; name: string; keywords: string[];
  x: number; y: number;                                    // plaque anchor (% of room)
  shelf?: { l: number; t: number; w: number; h: number };  // shelf region (% of room) — used to zoom
  stub?: boolean;                                          // area the room doesn't depict yet
}

export const FOOD_GROUPS: Bundle[] = [
  { id: "grains", name: "Grains & Flour", x: 32.9, y: 21.9, shelf: { l: 19, t: 6, w: 27, h: 19 },
    keywords: ["oat","flour","rice","pasta","penne","fusilli","spaghetti","macaroni","couscous","quinoa","barley","bread","cereal","granola","bulgur","polenta"] },
  { id: "pulses", name: "Pulses & Beans", x: 58.7, y: 22.6, shelf: { l: 45, t: 6, w: 29, h: 20 },
    keywords: ["lentil","bean","chickpea","pea","dhal","dal","pulse","hummus"] },
  { id: "canned", name: "Canned Goods", x: 30.9, y: 37.5, shelf: { l: 19, t: 27, w: 26, h: 15 },
    keywords: ["tin","canned","tomato","sweetcorn","soup","preserve","jam","chutney","pickle","olive","paste","sauce"] },
  { id: "herbs", name: "Herbs & Spices", x: 57.8, y: 37.5, shelf: { l: 44, t: 27, w: 30, h: 16 },
    keywords: ["basil","thyme","rosemary","mint","parsley","coriander","oregano","sage","dill","spice","pepper","salt","cumin","paprika","turmeric","cinnamon","herb"] },
  { id: "dried", name: "Dried Fruits & Nuts", x: 31.1, y: 53.6, shelf: { l: 19, t: 46, w: 27, h: 17 },
    keywords: ["nut","almond","walnut","cashew","pecan","hazelnut","raisin","sultana","apricot","date","fig","prune","seed","dried"] },
  { id: "teas", name: "Teas, Drinks & Oils", x: 57.8, y: 53.6, shelf: { l: 44, t: 45, w: 30, h: 18 },
    keywords: ["tea","coffee","oil","vinegar","honey","syrup","juice","cocoa","drink","stock"] },
  { id: "fruit", name: "Fruit & Veg", x: 80, y: 60, shelf: { l: 68, t: 50, w: 30, h: 22 }, keywords: [] },
  { id: "fridge", name: "Fridge", x: 30, y: 90, stub: true, keywords: [] },
  { id: "freezer", name: "Freezer", x: 46, y: 90, stub: true, keywords: [] },
];

export const bundleById = (id: string) => FOOD_GROUPS.find(g => g.id === id) ?? null;

export function bundleOf(item: PantryItem): string | null {
  if (item.category === "fruit") return "fruit";
  if (item.category === "fridge") return "fridge";
  if (item.category === "freezer") return "freezer";
  const hay = `${item.ingredientKey} ${item.displayName ?? ""}`.toLowerCase();
  for (const g of FOOD_GROUPS) {
    if (g.stub || g.id === "fruit") continue;
    if (g.keywords.some(k => hay.includes(k))) return g.id;
  }
  return null;
}
