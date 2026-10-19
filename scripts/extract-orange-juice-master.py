"""Create the first exact master-composite interaction proof.

The source image is the supplied filled-fridge composite. The orange juice
layer contains only pixels copied from that image; it is not regenerated.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFilter

SOURCE = Path(r"C:\Users\Colin\.codex\generated_images\019fec69-6ed9-77b0-8c5b-84b847bf7560\exec-ab6decf9-a77e-4bb9-b5ec-ef5a1d5e4f83.png")
EMPTY_REFERENCE = Path(r"C:\Users\Colin\.codex\generated_images\019fec69-6ed9-77b0-8c5b-84b847bf7560\exec-f250868a-6f29-4cad-ae2e-400f79bd7be4.png")
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "client/public/images/living-home/room/fridge-orange-master"

# Tight polygon around the orange bottle in the supplied master composite.
BOX = (582, 512, 650, 664)
POLYGON = [(588, 662), (588, 555), (592, 546), (595, 523), (629, 523), (632, 544), (644, 555), (646, 662)]


def main():
    image = Image.open(SOURCE).convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)
    image.save(OUT / "full-plate.png", optimize=True)

    x1, y1, x2, y2 = BOX
    layer = image.crop(BOX).convert("RGBA")
    mask = Image.new("L", layer.size, 0)
    ImageDraw.Draw(mask).polygon([(x - x1, y - y1) for x, y in POLYGON], fill=255)
    layer.putalpha(mask.filter(ImageFilter.GaussianBlur(0.45)))
    layer.save(OUT / "orange-juice.png")

    # The supplied empty companion is the same camera/geometry. Borrow only
    # the corresponding blank pixels for the removed footprint; every other
    # pixel remains from the filled master composite.
    empty = image.copy()
    blank = Image.open(EMPTY_REFERENCE).convert("RGB")
    patch = blank.crop(BOX)
    empty.paste(patch, (x1, y1), mask)
    empty.save(OUT / "empty-plate.png", optimize=True)
    (OUT / "manifest.json").write_text(json.dumps({"source": str(SOURCE), "box": BOX, "polygon": POLYGON}, indent=2), encoding="utf-8")
    print(f"Wrote master composite, orange juice layer and matching empty plate to {OUT}")


if __name__ == "__main__":
    main()
