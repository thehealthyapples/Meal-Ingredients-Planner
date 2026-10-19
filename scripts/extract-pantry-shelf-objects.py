"""Create transparent pantry-shelf jar layers from the approved populated master."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "client/public/images/living-home/room/pantry-shelves-populated-labelled-v2.png"
OUT = ROOT / "client/public/images/living-home/room/pantry-shelves-master"

# Tight boxes/polygons measured against the 1536x1024 populated shelf master.
ITEMS = {
    "plain-flour": ((86, 58, 214, 292), [(96, 275), (96, 104), (112, 67), (188, 67), (205, 104), (205, 275)]),
    "granola": ((226, 86, 348, 291), [(238, 273), (238, 127), (252, 96), (329, 96), (340, 127), (340, 273)]),
    "brown-rice": ((355, 55, 480, 292), [(365, 275), (365, 104), (380, 65), (455, 65), (470, 104), (470, 275)]),
    "white-penne": ((490, 92, 610, 292), [(500, 274), (500, 136), (514, 105), (586, 105), (600, 136), (600, 274)]),
    "rolled-oats": ((623, 42, 750, 292), [(633, 275), (633, 91), (648, 52), (724, 52), (740, 91), (740, 275)]),
    "chickpeas": ((759, 70, 885, 292), [(769, 275), (769, 113), (785, 80), (860, 80), (875, 113), (875, 275)]),
    "cannellini-beans": ((895, 74, 1020, 292), [(905, 275), (905, 116), (920, 84), (995, 84), (1010, 116), (1010, 275)]),
    "wholemeal-penne": ((1032, 82, 1167, 292), [(1042, 275), (1042, 123), (1057, 92), (1142, 92), (1157, 123), (1157, 275)]),
    "olive-oil": ((1175, 73, 1245, 292), [(1183, 275), (1183, 112), (1195, 83), (1228, 83), (1238, 112), (1238, 275)]),
    "vinegar": ((1250, 62, 1322, 292), [(1258, 275), (1258, 99), (1270, 71), (1304, 71), (1314, 99), (1314, 275)]),
    "white-beans": ((78, 330, 215, 585), [(88, 568), (88, 378), (105, 342), (187, 342), (205, 378), (205, 568)]),
    "red-lentils": ((218, 320, 350, 585), [(228, 568), (228, 370), (244, 333), (325, 333), (342, 370), (342, 568)]),
    "green-lentils": ((365, 335, 500, 585), [(375, 568), (375, 386), (390, 348), (475, 348), (490, 386), (490, 568)]),
    "sugar": ((515, 318, 650, 585), [(525, 568), (525, 363), (541, 330), (625, 330), (640, 363), (640, 568)]),
    "pearl-barley": ((670, 340, 805, 585), [(680, 568), (680, 388), (696, 352), (780, 352), (795, 388), (795, 568)]),
    "white-rice": ((820, 337, 950, 585), [(830, 568), (830, 383), (846, 348), (925, 348), (940, 383), (940, 568)]),
    "wholemeal-fusilli": ((1070, 336, 1202, 585), [(1080, 568), (1080, 384), (1095, 347), (1177, 347), (1192, 384), (1192, 568)]),
    "white-fusilli": ((1218, 335, 1353, 585), [(1228, 568), (1228, 382), (1244, 347), (1320, 347), (1343, 382), (1343, 568)]),
    "plain-flour-lower": ((385, 650, 510, 900), [(395, 885), (395, 705), (410, 665), (485, 665), (500, 705), (500, 885)]),
    "brown-rice-lower": ((520, 642, 650, 900), [(530, 885), (530, 697), (546, 657), (625, 657), (640, 697), (640, 885)]),
    "granola-lower": ((660, 650, 785, 900), [(670, 885), (670, 705), (686, 665), (760, 665), (775, 705), (775, 885)]),
    "white-rice-lower": ((800, 645, 925, 900), [(810, 885), (810, 700), (826, 660), (900, 660), (915, 700), (915, 885)]),
    "rolled-oats-lower": ((940, 640, 1065, 900), [(950, 885), (950, 695), (966, 655), (1040, 655), (1055, 695), (1055, 885)]),
    "granola-cereal": ((1080, 633, 1220, 900), [(1090, 885), (1090, 690), (1106, 648), (1190, 648), (1210, 690), (1210, 885)]),
}

# The runtime target rectangles are the authoritative position of each visible
# jar in the current 1536x1024 shelf master.  Keeping extraction tied to those
# rectangles prevents a cutout from accidentally borrowing pixels from the jar
# beside it as the shelf artwork evolves.
ITEM_PERCENTAGES = {
    "plain-flour": (9.8, 5.7, 8.3, 22.9), "granola": (18.7, 8.4, 7.9, 20.0),
    "brown-rice": (27.2, 5.4, 8.1, 23.1), "white-penne": (35.8, 9.0, 7.8, 19.5),
    "rolled-oats": (44.7, 4.1, 8.3, 24.4), "chickpeas": (53.5, 6.8, 8.2, 21.7),
    "cannellini-beans": (62.4, 7.2, 8.1, 21.3), "wholemeal-penne": (71.6, 8.0, 8.8, 20.5),
    "white-beans": (9.5, 32.2, 8.9, 25.0), "red-lentils": (18.5, 31.2, 8.6, 25.9),
    "green-lentils": (28.2, 32.7, 8.8, 24.4), "sugar": (38.0, 31.1, 8.8, 26.1),
    "pearl-barley": (48.1, 33.2, 8.8, 23.9), "white-rice": (57.7, 32.9, 8.5, 24.3),
    "wholemeal-fusilli": (73.7, 32.8, 8.6, 24.3), "white-fusilli": (83.5, 32.7, 8.8, 24.7),
    "plain-flour-lower": (29.1, 63.5, 8.1, 24.4), "brown-rice-lower": (38.1, 62.7, 8.5, 25.2),
    "granola-lower": (47.1, 63.5, 8.1, 24.4), "white-rice-lower": (56.2, 63.0, 8.1, 24.9),
    "rolled-oats-lower": (65.3, 62.5, 8.1, 25.4), "granola-cereal": (74.9, 61.8, 9.1, 26.1),
}

# Label centres are measured directly from the rendered master and therefore
# give a more exact horizontal jar centre than the deliberately generous hit
# targets used by the UI.
ITEM_CENTRES = {
    "plain-flour": 10.77, "granola": 19.92, "brown-rice": 29.52, "white-penne": 38.90,
    "rolled-oats": 47.40, "chickpeas": 56.80, "cannellini-beans": 65.85, "wholemeal-penne": 76.89,
    "white-beans": 7.75, "red-lentils": 16.24, "green-lentils": 29.52, "sugar": 38.87,
    "pearl-barley": 48.40, "white-rice": 57.65, "wholemeal-fusilli": 67.48, "white-fusilli": 84.18,
    "plain-flour-lower": 28.55, "brown-rice-lower": 37.14, "granola-lower": 44.50,
    "white-rice-lower": 52.44, "rolled-oats-lower": 62.30, "granola-cereal": 70.80,
}

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGB")
    manifest = {"source": str(SOURCE), "items": {}}
    for item_id, (box, polygon) in ITEMS.items():
        if item_id not in ITEM_PERCENTAGES:
            continue
        px, py, pw, ph = ITEM_PERCENTAGES[item_id]
        px = ITEM_CENTRES[item_id]
        box = (
            round(source.width * (px - pw / 2) / 100), round(source.height * py / 100),
            round(source.width * (px + pw / 2) / 100), round(source.height * (py + ph) / 100),
        )
        x1, y1, x2, y2 = box
        layer = source.crop(box).convert("RGBA")
        # Build the mask from this jar's measured silhouette.  The previous
        # six-point polygons left triangular pieces of wall around the lid and
        # shoulders, which became obvious as soon as the jar moved.
        left, right = 4, layer.width - 4
        top, bottom = 3, layer.height - 3
        width, height = right - left, bottom - top
        silhouette = [
            (left + width * .20, bottom),
            (left + width * .12, bottom - height * .04),
            (left + width * .10, top + height * .27),
            (left + width * .16, top + height * .21),
            (left + width * .25, top + height * .18),
            (left + width * .27, top + height * .07),
            (left + width * .35, top),
            (left + width * .65, top),
            (left + width * .73, top + height * .07),
            (left + width * .75, top + height * .18),
            (left + width * .84, top + height * .21),
            (left + width * .90, top + height * .27),
            (left + width * .88, bottom - height * .04),
            (left + width * .80, bottom),
        ]
        mask = Image.new("L", layer.size, 0)
        ImageDraw.Draw(mask).polygon(silhouette, fill=255)
        layer.putalpha(mask.filter(ImageFilter.GaussianBlur(0.35)))
        layer.save(OUT / f"{item_id}.png")
        manifest["items"][item_id] = {"box": box}
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote {len(ITEMS)} shelf jar layers to {OUT}")

if __name__ == "__main__":
    main()
