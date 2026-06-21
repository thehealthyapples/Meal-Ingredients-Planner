#!/usr/bin/env python3
"""
WS0.11 — USDA snapshot builder (data-acquisition stage).

Reads the USDA FoodData Central bulk JSON downloads (Foundation + SR Legacy),
applies the WS0.11 STRICT FILTERS, selects a 500-food ingredient-level pilot set,
and writes a slim, reproducible snapshot mapped to the WS0.10 `USDAFood` shape.

Source files (bulk download, zero API rate limits, fully reproducible):
  Foundation: FoodData_Central_foundation_food_json_2025-04-24.zip
  SR Legacy : FoodData_Central_sr_legacy_food_json_2021-10-28.zip
  https://fdc.nal.usda.gov/download-datasets.html

Output: ws011-usda-500.json  (slim USDAFood[] — only the fields the pipeline reads)
"""
import json, sys, re
from collections import Counter

FOUNDATION = sys.argv[1]
SR_LEGACY = sys.argv[2]
OUT = sys.argv[3]
TARGET = 500

# Key nutrient ids the WS0.10 pipeline reads (energy, protein, fat, carbs, fibre).
KEY_NUTRIENT_IDS = {1008, 1003, 1004, 1005, 1079}

# Ingredient-level categories we KEEP. Everything else is prepared / composite / non-food.
KEEP_CATEGORIES = {
    "Vegetables and Vegetable Products",
    "Fruits and Fruit Juices",
    "Legumes and Legume Products",
    "Nut and Seed Products",
    "Finfish and Shellfish Products",
    "Cereal Grains and Pasta",
    "Spices and Herbs",
    "Dairy and Egg Products",
    "Poultry Products",
    "Beef Products",
    "Pork Products",
    "Lamb, Veal, and Game Products",
    "Fats and Oils",
}

# Categories explicitly skipped (prepared meals, infant foods, composites, drinks).
SKIP_CATEGORIES = {
    "Baby Foods", "Fast Foods", "Meals, Entrees, and Side Dishes",
    "Soups, Sauces, and Gravies", "Restaurant Foods", "Snacks", "Sweets",
    "Beverages", "Baked Products", "Breakfast Cereals",
    "Sausages and Luncheon Meats", "American Indian/Alaska Native Foods",
}

# Description tokens that signal branded / prepared / infant / supplement items.
SKIP_TOKENS = [
    "baby food", "babyfood", "infant", "formula", "supplement", "commercial",
    "restaurant", "fast food", "mcdonald", "burger king", "kfc", "pizza hut",
    "taco bell", "wendy", "subway", "denny", "pillsbury", "kellogg", "heinz",
    "kraft", "nestle", "campbell", "general mills", "post ", "quaker",
    "condensed", "fortified", "meal replacement", "protein powder",
    "candies", "candy", "fast foods", "frozen novelties", "puree, junior",
    "puree, strained", "reduced fat, with added", "low sodium, ready-to-serve",
]

# Brand-style proper-noun heuristic: trademark / registered marks.
BRAND_MARKS = ["®", "™", "©"]


def comma_segments(desc):
    return [s.strip() for s in desc.split(",")]


def is_excessively_qualified(desc):
    # >4 comma-separated qualifiers (5+ segments) = overly specific preparation.
    return len(comma_segments(desc)) > 4


def looks_branded_or_prepared(desc):
    low = desc.lower()
    if any(m in desc for m in BRAND_MARKS):
        return True
    if any(t in low for t in SKIP_TOKENS):
        return True
    # A capitalised multi-word proper noun before the first comma often = brand
    head = comma_segments(desc)[0]
    words = head.split()
    if len(words) >= 2 and sum(1 for w in words if w[:1].isupper()) >= 2 and any(
        w.isupper() or (w[:1].isupper() and not w.islower()) for w in words[1:]
    ):
        # e.g. "Pillsbury Golden Layer Buttermilk Biscuits"
        # keep simple "Beef, ..." style (head is a single word) — already handled
        if len(words) >= 3:
            return True
    return False


def slim_nutrients(food):
    out = []
    for fn in food.get("foodNutrients", []):
        nut = fn.get("nutrient") or {}
        nid = nut.get("id")
        amt = fn.get("amount")
        if nid in KEY_NUTRIENT_IDS and amt is not None:
            out.append({
                "nutrient": {"id": nid, "name": nut.get("name"), "unitName": nut.get("unitName")},
                "amount": amt,
            })
    return out


def map_food(food):
    cat = (food.get("foodCategory") or {}).get("description")
    return {
        "fdcId": food.get("fdcId"),
        "description": food.get("description"),
        "dataType": food.get("dataType"),
        "foodCategory": {"description": cat} if cat else None,
        "scientificName": food.get("scientificName"),
        "foodNutrients": slim_nutrients(food),
    }


def passes_filters(food, audit):
    desc = food.get("description") or ""
    cat = (food.get("foodCategory") or {}).get("description")
    if cat in SKIP_CATEGORIES:
        audit["skip_category"] += 1
        return False
    if cat not in KEEP_CATEGORIES:
        audit["skip_non_ingredient_category"] += 1
        return False
    if looks_branded_or_prepared(desc):
        audit["skip_branded_prepared"] += 1
        return False
    if is_excessively_qualified(desc):
        audit["skip_excessive_qualifiers"] += 1
        return False
    return True


def load(path, key):
    with open(path) as f:
        return json.load(f)[key]


def main():
    foundation = load(FOUNDATION, "FoundationFoods")
    sr = load(SR_LEGACY, "SRLegacyFoods")
    audit = Counter()

    selected = []
    seen_desc = set()

    # Pass 1: Foundation (highest quality, full categories) — take all that pass.
    for f in foundation:
        if passes_filters(f, audit):
            d = (f.get("description") or "").lower()
            if d in seen_desc:
                audit["skip_dupe_desc"] += 1
                continue
            seen_desc.add(d)
            selected.append(map_food(f))
    foundation_kept = len(selected)

    # Pass 2: SR Legacy — fill to TARGET, prioritising foods that have key nutrients
    # and simple (<=2 segment) descriptions for cleaner ingredient-level entries.
    sr_candidates = []
    for f in sr:
        if not passes_filters(f, audit):
            continue
        d = (f.get("description") or "").lower()
        if d in seen_desc:
            audit["skip_dupe_desc"] += 1
            continue
        mapped = map_food(f)
        n_key = len(mapped["foodNutrients"])
        n_seg = len(comma_segments(f["description"]))
        # sort key: more key nutrients first, then simpler descriptions
        sr_candidates.append((-n_key, n_seg, f["description"], mapped, d))

    sr_candidates.sort(key=lambda x: (x[0], x[1], x[2]))
    for _, _, _, mapped, d in sr_candidates:
        if len(selected) >= TARGET:
            break
        if d in seen_desc:
            continue
        seen_desc.add(d)
        selected.append(mapped)
    sr_kept = len(selected) - foundation_kept

    snapshot = {
        "meta": {
            "workstream": "WS0.11",
            "target": TARGET,
            "selected": len(selected),
            "foundation_selected": foundation_kept,
            "sr_legacy_selected": sr_kept,
            "sources": {
                "foundation": "FoodData_Central_foundation_food_json_2025-04-24",
                "sr_legacy": "FoodData_Central_sr_legacy_food_json_2021-10-28",
            },
            "filter_audit": dict(audit),
            "foundation_total": len(foundation),
            "sr_legacy_total": len(sr),
        },
        "foods": selected,
    }
    with open(OUT, "w") as f:
        json.dump(snapshot, f, indent=1)

    print(f"Foundation total: {len(foundation)}  kept: {foundation_kept}")
    print(f"SR Legacy total : {len(sr)}  kept: {sr_kept}")
    print(f"Selected        : {len(selected)} / {TARGET}")
    print("Filter audit:")
    for k, v in audit.most_common():
        print(f"   {v:6d}  {k}")
    print(f"Snapshot written: {OUT}")


if __name__ == "__main__":
    main()
