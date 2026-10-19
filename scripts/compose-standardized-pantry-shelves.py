"""Compose the shelf preview from the exact transparent runtime products."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "client/public/images/living-home/room/pantry-shelves-standardized"

# id, product asset, centre x, shelf baseline y. Coordinates are pixels in the
# approved 1536x1024 shelf composition.
PLACEMENTS = [
    ("plain-flour", "plain-flour", 158, 326), ("granola", "granola", 307, 326),
    ("brown-rice", "brown-rice", 456, 326), ("white-penne", "penne", 605, 326),
    ("rolled-oats", "rolled-oats", 754, 326), ("chickpeas", "chickpeas", 903, 326),
    ("cannellini-beans", "cannellini-beans", 1052, 326), ("wholemeal-penne", "penne", 1201, 326),
    ("evoo", "evoo", 1328, 326), ("balsamic-vinegar", "balsamic-vinegar", 1400, 326),
    ("white-beans", "cannellini-beans", 122, 585), ("red-lentils", "red-lentils", 274, 585),
    ("green-lentils", "green-lentils", 446, 585), ("sugar", "sugar", 598, 585),
    ("pearl-barley", "pearl-barley", 750, 585), ("white-rice", "white-rice", 902, 585),
    ("wholemeal-fusilli", "fusilli", 1282, 585), ("white-fusilli", "fusilli", 1434, 585),
    ("plain-flour-lower", "plain-flour", 450, 833), ("brown-rice-lower", "brown-rice", 598, 833),
    ("granola-lower", "granola", 746, 833), ("white-rice-lower", "white-rice", 894, 833),
    ("rolled-oats-lower", "rolled-oats", 1042, 833), ("granola-cereal", "granola-cereal", 1190, 833),
]

JAR_HEIGHT = 188
BOTTLE_HEIGHT = 194


def resized_product(asset_name: str) -> Image.Image:
    product = Image.open(ASSET_DIR / f"{asset_name}.png").convert("RGBA")
    target_h = BOTTLE_HEIGHT if asset_name in {"evoo", "balsamic-vinegar"} else JAR_HEIGHT
    target_w = round(product.width * target_h / product.height)
    return product.resize((target_w, target_h), Image.Resampling.LANCZOS)


def main():
    empty = Image.open(ASSET_DIR / "empty.png").convert("RGBA")
    composed = empty.copy()
    manifest = {}
    for item_id, asset_name, centre_x, baseline_y in PLACEMENTS:
        product = resized_product(asset_name)
        left, top = round(centre_x - product.width / 2), baseline_y - product.height
        composed.alpha_composite(product, (left, top))
        manifest[item_id] = (left, top, product.width, product.height, asset_name)
    composed.convert("RGB").save(ASSET_DIR / "composed-full.png", quality=96)
    lines = [f'{item_id}|{left}|{top}|{width}|{height}|{asset}' for item_id, (left, top, width, height, asset) in manifest.items()]
    (ASSET_DIR / "placements.txt").write_text("\n".join(lines), encoding="utf-8")
    print(f"Composed {len(PLACEMENTS)} exact runtime products")


if __name__ == "__main__":
    main()
