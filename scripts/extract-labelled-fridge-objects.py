"""Build the labelled fridge's empty plate and independent object layers."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import json, shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\Colin\.codex\generated_images\019fec69-6ed9-77b0-8c5b-84b847bf7560\exec-04eded48-bda4-4070-9dd0-c9f95f271e6c.png")
EMPTY = Path(r"C:\Users\Colin\.codex\generated_images\019fec69-6ed9-77b0-8c5b-84b847bf7560\exec-f250868a-6f29-4cad-ae2e-400f79bd7be4.png")
OUT = ROOT / "client/public/images/living-home/room/fridge-labelled-master"

# Tight source regions from the labelled master. Polygons keep the original
# pixels while removing the surrounding shelf/door pixels from each layer.
ITEMS = {
    "strawberry-jam": ((302, 137, 366, 225), [(307, 218), (307, 160), (314, 145), (354, 145), (362, 160), (362, 218)]),
    "smooth-peanut-butter": ((369, 143, 433, 226), [(374, 219), (374, 163), (381, 148), (420, 148), (427, 163), (427, 219)]),
    "dijon-mustard": ((304, 280, 372, 387), [(310, 382), (310, 300), (318, 287), (358, 287), (367, 300), (367, 382)]),
    "branston-pickle": ((376, 294, 437, 388), [(381, 383), (381, 311), (388, 299), (425, 299), (432, 311), (432, 383)]),
    "honey-mustard-dressing": ((306, 464, 369, 576), [(311, 570), (311, 488), (318, 474), (357, 474), (364, 488), (364, 570)]),
    "hot-sauce": ((374, 459, 429, 575), [(378, 570), (378, 483), (385, 468), (417, 468), (425, 483), (425, 570)]),
    "tomato-ketchup": ((302, 650, 369, 780), [(308, 775), (308, 684), (315, 662), (355, 662), (363, 684), (363, 775)]),
    "caesar-dressing": ((373, 647, 431, 780), [(378, 775), (378, 683), (385, 664), (419, 664), (426, 683), (426, 775)]),
    "beef-stew": ((513, 207, 650, 278), [(519, 266), (519, 225), (529, 214), (636, 214), (645, 225), (645, 266)]),
    "cooked-chicken": ((670, 207, 810, 278), [(676, 266), (676, 224), (686, 214), (794, 214), (804, 224), (804, 266)]),
    "whole-milk": ((500, 505, 586, 667), [(510, 664), (510, 548), (517, 530), (526, 516), (560, 516), (575, 530), (581, 549), (581, 664)]),
    "orange-juice": ((580, 512, 657, 667), [(587, 664), (587, 551), (594, 541), (596, 520), (634, 520), (638, 541), (650, 552), (651, 664)]),
    "yoghurt": ((575, 294, 660, 390), [(580, 385), (580, 316), (588, 302), (622, 302), (630, 314), (630, 343), (638, 336), (653, 344), (653, 384)]),
    "brie": ((693, 334, 802, 392), [(700, 384), (700, 348), (708, 339), (789, 339), (797, 348), (797, 384)]),
    "mature-cheddar": ((748, 427, 858, 493), [(754, 486), (754, 444), (761, 435), (846, 435), (853, 444), (853, 486)]),
    "red-leicester": ((867, 427, 976, 493), [(873, 486), (873, 444), (881, 435), (964, 435), (972, 444), (972, 486)]),
    "ketchup": ((1065, 447, 1140, 592), [(1072, 589), (1072, 492), (1078, 466), (1088, 451), (1117, 451), (1130, 468), (1135, 492), (1135, 589)]),
    "pickles": ((790, 557, 861, 665), [(797, 661), (797, 579), (804, 565), (846, 565), (855, 579), (855, 661)]),
    "tomato-juice": ((909, 557, 982, 665), [(916, 661), (916, 580), (923, 565), (966, 565), (976, 580), (976, 661)]),
    "salsa": ((1070, 138, 1134, 224), [(1075, 218), (1075, 160), (1082, 145), (1121, 145), (1129, 160), (1129, 218)]),
    "hummus": ((1140, 141, 1203, 224), [(1145, 218), (1145, 162), (1152, 148), (1191, 148), (1199, 162), (1199, 218)]),
    "door-pickles": ((1069, 281, 1134, 389), [(1075, 383), (1075, 301), (1082, 287), (1121, 287), (1129, 301), (1129, 383)]),
    "mayonnaise": ((1141, 282, 1203, 389), [(1146, 383), (1146, 302), (1153, 288), (1191, 288), (1199, 302), (1199, 383)]),
    "door-ketchup": ((1070, 447, 1140, 578), [(1076, 573), (1076, 488), (1083, 462), (1121, 462), (1133, 488), (1133, 573)]),
    "garlic-aioli": ((1144, 451, 1204, 578), [(1150, 573), (1150, 486), (1157, 464), (1191, 464), (1198, 486), (1198, 573)]),
    "real-mayonnaise": ((1071, 646, 1140, 782), [(1077, 777), (1077, 684), (1084, 660), (1122, 660), (1133, 684), (1133, 777)]),
    "english-mustard": ((1144, 657, 1204, 782), [(1150, 777), (1150, 694), (1157, 670), (1191, 670), (1198, 694), (1198, 777)]),
}


def layer(image, box, polygon):
    x1, y1, x2, y2 = box
    out = image.crop(box).convert("RGBA")
    mask = Image.new("L", out.size, 0)
    ImageDraw.Draw(mask).polygon([(x-x1, y-y1) for x, y in polygon], fill=255)
    out.putalpha(mask.filter(ImageFilter.GaussianBlur(.45)))
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGB")
    empty = Image.open(EMPTY).convert("RGB")
    shutil.copyfile(SOURCE, OUT / "full-labelled.png")
    shutil.copyfile(EMPTY, OUT / "empty-plate.png")
    manifest = {"source": str(SOURCE), "items": {}}
    for item_id, (box, polygon) in ITEMS.items():
        layer(source, box, polygon).save(OUT / f"{item_id}.png")
        x1, y1, x2, y2 = box
        manifest["items"][item_id] = {"box": box, "polygon": polygon}
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote {len(ITEMS)} labelled fridge object layers to {OUT}")


if __name__ == "__main__":
    main()
