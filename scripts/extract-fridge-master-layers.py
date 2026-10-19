"""Extract pixel layers from the canonical full fridge composite.

No new food imagery is generated here. Every RGB pixel in an item layer is
copied from work-fridge.png; the polygons only define the transparency mask.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "client/public/images/living-home/room/work-fridge.png"
OUT = ROOT / "client/public/images/living-home/room/fridge-master"

# x1, y1, x2, y2, polygon points in source-image coordinates.
ITEMS = {
    "master-milk": ((470, 505, 548, 667), [(487, 667), (487, 552), (494, 543), (498, 530), (508, 523), (525, 524), (531, 535), (540, 550), (540, 667)]),
    "master-orange-juice": ((610, 510, 686, 667), [(620, 667), (620, 544), (627, 532), (633, 516), (654, 515), (661, 532), (676, 544), (679, 667)]),
    "master-berries": ((813, 535, 882, 670), [(816, 544), (823, 537), (875, 538), (880, 545), (880, 666), (816, 666)]),
    "master-left-door-jar": ((186, 148, 277, 286), [(205, 286), (205, 174), (212, 160), (255, 159), (264, 174), (264, 286)]),
    "master-right-door-jar": ((1120, 172, 1190, 287), [(1125, 286), (1125, 196), (1133, 181), (1179, 181), (1186, 196), (1186, 286)]),
}


def make_layer(image: Image.Image, box, polygon):
    x1, y1, x2, y2 = box
    crop = image.crop(box).convert("RGBA")
    mask = Image.new("L", crop.size, 0)
    local = [(x - x1, y - y1) for x, y in polygon]
    ImageDraw.Draw(mask).polygon(local, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(0.6))
    crop.putalpha(mask)
    return crop, mask


def fill_from_neighbours(rgb, hole):
    """Small-hole inpaint using neighbouring source pixels, without new art."""
    out = rgb.astype(np.float32).copy()
    known = ~hole.copy()
    for _ in range(36):
        total = np.zeros_like(out)
        count = np.zeros(hole.shape, dtype=np.float32)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            shifted = np.roll(np.roll(out, dy, axis=0), dx, axis=1)
            shifted_known = np.roll(np.roll(known, dy, axis=0), dx, axis=1)
            total += shifted * shifted_known[..., None]
            count += shifted_known
        fillable = (~known) & (count > 0)
        out[fillable] = total[fillable] / count[fillable, None]
        known[fillable] = True
        if not np.any(~known & hole):
            break
    return Image.fromarray(np.uint8(np.clip(out, 0, 255)), "RGB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    image = Image.open(SOURCE).convert("RGB")
    hole = Image.new("L", image.size, 0)
    manifest = {"source": str(SOURCE), "imageSize": image.size, "items": {}}
    for item_id, (box, polygon) in ITEMS.items():
        layer, mask = make_layer(image, box, polygon)
        layer.save(OUT / f"{item_id}.png")
        ImageDraw.Draw(hole).polygon(polygon, fill=255)
        manifest["items"][item_id] = {"box": box, "polygon": polygon}
    empty = fill_from_neighbours(np.asarray(image), np.asarray(hole) > 0)
    empty.save(OUT / "empty-plate.png", optimize=True)
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote {len(ITEMS)} master-derived layers and matching empty plate to {OUT}")


if __name__ == "__main__":
    main()
