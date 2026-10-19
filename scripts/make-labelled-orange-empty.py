from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\Colin\.codex\generated_images\019fec69-6ed9-77b0-8c5b-84b847bf7560\exec-04eded48-bda4-4070-9dd0-c9f95f271e6c.png")
EMPTY = Path(r"C:\Users\Colin\.codex\generated_images\019fec69-6ed9-77b0-8c5b-84b847bf7560\exec-f250868a-6f29-4cad-ae2e-400f79bd7be4.png")
OUT = ROOT / "client/public/images/living-home/room/fridge-labelled-master"
BOX = (580, 512, 657, 667)
POLYGON = [(587, 664), (587, 551), (594, 541), (596, 520), (634, 520), (638, 541), (650, 552), (651, 664)]

source = Image.open(SOURCE).convert("RGB")
blank = Image.open(EMPTY).convert("RGB")
mask = Image.new("L", source.size, 0)
ImageDraw.Draw(mask).polygon(POLYGON, fill=255)
result = source.copy()
result.paste(blank.crop(BOX), BOX[:2], mask.crop(BOX))
OUT.mkdir(parents=True, exist_ok=True)
source.save(OUT / "full-labelled.png", optimize=True)
result.save(OUT / "empty-orange-labelled.png", optimize=True)
print(OUT)
