// Shared source-filter / label / sort helpers for the Basket and Shop View.
// Approved source values (final): planner | quick_list | pantry | household | manual | null (legacy)

export type Source =
  | "planner"
  | "quick_list"
  | "pantry"
  | "household"
  | "manual"
  | null;

export type SourceFilter = "all" | "planned" | "extras" | "home";

interface ItemLike {
  source?: Source | string | null;
  basketLabel?: string | null;
}

// Returns the explicit source value if present and recognised, otherwise null.
export function getEffectiveSource(item: ItemLike): Source {
  const s = (item.source ?? null) as Source;
  if (
    s === "planner" ||
    s === "quick_list" ||
    s === "pantry" ||
    s === "household" ||
    s === "manual"
  ) {
    return s;
  }
  return null;
}

// Predicate used by both Basket and Shop View. Legacy null-source rows fall
// back to the existing basketLabel-prefix logic so behaviour is unchanged for
// pre-source-column rows.
export function matchesSourceFilter(item: ItemLike, filter: SourceFilter): boolean {
  if (filter === "all") return true;
  const s = getEffectiveSource(item);
  if (s !== null) {
    if (filter === "planned") return s === "planner";
    if (filter === "extras") return s === "quick_list" || s === "manual";
    if (filter === "home") return s === "pantry" || s === "household";
    return false;
  }
  // Legacy fallback (source IS NULL): preserve current behaviour using
  // basketLabel prefix logic only. Null rows have no pantry/household signal,
  // so the Home filter excludes them.
  const isQL = !!item.basketLabel?.startsWith("quick_list_");
  if (filter === "planned") return !isQL;
  if (filter === "extras") return isQL;
  if (filter === "home") return false;
  return true;
}

// Inline label rendered after the item name in both views. Returns null for
// legacy null-source rows (no label shown).
export function sourceLabel(item: ItemLike): string | null {
  const s = getEffectiveSource(item);
  switch (s) {
    case "planner":   return "From plan";
    case "quick_list": return "Quick list";
    case "manual":    return "Added manually";
    case "pantry":    return "From pantry";
    case "household": return "Household";
    default:          return null;
  }
}

// Soft grouping order within each category.
//   1. planner
//   2. quick_list + manual (Extras)
//   3. pantry + household (Home)
//   4. legacy null
export function sourcePriority(item: ItemLike): number {
  const s = getEffectiveSource(item);
  switch (s) {
    case "planner":    return 0;
    case "quick_list": return 1;
    case "manual":     return 1;
    case "pantry":     return 2;
    case "household":  return 2;
    default:           return 3;
  }
}
