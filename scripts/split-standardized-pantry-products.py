"""Split the standardized 4x4 product sheet into tight transparent assets."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "client/public/images/living-home/room/pantry-shelves-standardized"
SOURCE = ASSET_DIR / "products-transparent.png"
NAMES = [
    "plain-flour", "granola", "brown-rice", "penne",
    "rolled-oats", "chickpeas", "cannellini-beans", "red-lentils",
    "green-lentils", "sugar", "pearl-barley", "white-rice",
    "fusilli", "granola-cereal", "evoo", "balsamic-vinegar",
]


def main():
    source = Image.open(SOURCE).convert("RGBA")
    cell_w, cell_h = source.width // 4, source.height // 4
    for index, name in enumerate(NAMES):
        row, column = divmod(index, 4)
        cell = source.crop((column * cell_w, row * cell_h, (column + 1) * cell_w, (row + 1) * cell_h))
        # The two bottle caps in row four slightly cross the generated cell
        # boundary. They are unrelated fragments in row three, so exclude that
        # final strip before measuring those jars.
        if row == 2:
            clean = Image.new("RGBA", cell.size, (0, 0, 0, 0))
            clean.alpha_composite(cell.crop((0, 0, cell.width, cell.height - 24)), (0, 0))
            cell = clean
        bounds = cell.getchannel("A").getbbox()
        if not bounds:
            raise RuntimeError(f"No visible product found for {name}")
        left, top, right, bottom = bounds
        padding = 3
        bounds = (max(0, left - padding), max(0, top - padding), min(cell.width, right + padding), min(cell.height, bottom + padding))
        cell.crop(bounds).save(ASSET_DIR / f"{name}.png")
    print(f"Wrote {len(NAMES)} tight standardized pantry products to {ASSET_DIR}")


if __name__ == "__main__":
    main()
