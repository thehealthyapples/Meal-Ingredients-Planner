"""
Generate a single Living Home FRIDGE PRODUCT as a clean transparent-background PNG
with a short baked-in label — no flood-fill background removal (which gouged the
earlier cutouts), no baked drop-shadow (the app adds its own cool contact shadow).

gpt-image-2, 1024x1024, high, background=transparent. Key from Hermes .env, never
printed. Writes master PNG + metadata JSON (checksum-traceable to its prompt).

Usage:
  python scripts/generate-fridge-product.py --only yoghurt,milk,juice,eggs,cheddar
"""
from pathlib import Path
import argparse, base64, hashlib, json, os, time, requests

parser = argparse.ArgumentParser()
parser.add_argument("--only", default="", help="comma list of product keys to generate; empty = all")
args = parser.parse_args()

REPO = Path(r"C:\Users\Colin\The Healthy Apples\GitHub\tha-living-larder-authoritative")

# Short UPPERCASE labels render most reliably. Generic descriptors, no real brands.
# PERSPECTIVE must match the fridge camera: head-on, viewed from SLIGHTLY ABOVE.
STYLE = ("Photorealistic product photograph, single item centred and fully in frame. "
         "CAMERA/PERSPECTIVE (critical): photographed STRAIGHT FROM THE FRONT with the "
         "front face square and parallel to the camera — NOT a three-quarter view, not "
         "turned or rotated — from a slightly elevated eye-line so only a thin sliver of "
         "the top is visible, exactly as an item sitting on a refrigerator shelf just "
         "below eye level. Vertical edges stay vertical and parallel; gentle natural "
         "perspective as from a standard lens about one metre away, minimal foreshortening. "
         "Even soft neutral studio lighting, crisp focus, natural colour. Isolated on a "
         "FULLY TRANSPARENT background — no surface, no table, no reflection, NO drop "
         "shadow, no props, no text other than the label described. Clean simple label "
         "typography, correctly spelled.")
EXCLUDE = ("no three-quarter angle, not turned, not rotated, no dramatic or low angle, "
           "no wide-angle lens distortion, no tilt. no background, no floor, no shadow, "
           "no reflection, no hands, no extra objects, no watermark, no brand logos, "
           "no gibberish text, not blurry.")

PRODUCTS = {
    "yoghurt": "A tub of natural yoghurt: a white plastic pot with a paper wrap label reading \"NATURAL YOGHURT\" in clean modern type, foil lid sealed on top.",
    "milk":    "A clear glass milk bottle full of white milk, a simple paper label reading \"WHOLE MILK\", a silver foil cap.",
    "juice":   "A clear glass bottle full of orange juice, a simple paper label reading \"ORANGE JUICE\", a white screw cap. A round bottle, not a carton.",
    "eggs":    "An open cardboard carton of six brown free-range eggs, the lid label reading \"FREE RANGE EGGS\".",
    "cheddar": "A rectangular block of mature cheddar cheese in a partly-opened plastic wrapper with a label reading \"MATURE CHEDDAR\", deep yellow cheese visible.",
    "applejuice": "A clear glass bottle full of pale golden apple juice, a simple paper label reading \"APPLE JUICE\", a white screw cap. A round bottle.",
    "bbqsauce":   "A glass bottle of dark reddish-brown BBQ sauce, a label reading \"BBQ SAUCE\", a dark cap. A round bottle.",
    "jalapenos":  "A clear round glass jar of sliced green jalapeno peppers in brine, a label reading \"JALAPENOS\", a silver metal screw lid.",
    "olives":     "A clear round glass jar of whole green olives in brine, a label reading \"OLIVES\", a silver metal screw lid.",
    "cream":      "A small round plastic pot of fresh cream, a paper label reading \"SINGLE CREAM\", a sealed foil lid on top.",
}

def load_key() -> str:
    hermes = Path(os.environ.get("HERMES_HOME", Path.home() / "AppData" / "Local" / "hermes"))
    env_path = hermes / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                n, v = line.split("=", 1)
                if n.strip() == "OPENAI_API_KEY" and v.strip():
                    return v.strip()
    if os.environ.get("OPENAI_API_KEY"):
        return os.environ["OPENAI_API_KEY"].strip()
    raise SystemExit("OPENAI_API_KEY not found")

api_key = load_key()
out_dir = REPO / "artifacts" / "living-home-fridge-products"
out_dir.mkdir(parents=True, exist_ok=True)
keys = [k.strip() for k in args.only.split(",") if k.strip()] or list(PRODUCTS)

for key in keys:
    if key not in PRODUCTS:
        print(json.dumps({"key": key, "error": "unknown product"})); continue
    prompt = f"{PRODUCTS[key]}\n\n{STYLE}\n\nSTRICT EXCLUSIONS: {EXCLUDE}"
    resp = requests.post(
        "https://api.openai.com/v1/images/generations",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"model": "gpt-image-1", "prompt": prompt, "n": 1, "size": "1024x1024",
              "quality": "high", "output_format": "png", "background": "transparent"},
        timeout=600,
    )
    if resp.status_code != 200:
        try: msg = resp.json().get("error", {}).get("message", "")
        except Exception: msg = resp.text[:300]
        print(json.dumps({"key": key, "http": resp.status_code, "error": msg})); continue
    item = resp.json().get("data", [{}])[0]
    enc = item.get("b64_json")
    if not enc:
        print(json.dumps({"key": key, "error": "no image bytes"})); continue
    b = base64.b64decode(enc)
    p = out_dir / f"fridge-{key}-master.png"
    p.write_bytes(b)
    (out_dir / f"fridge-{key}-metadata.json").write_text(json.dumps({
        "key": key, "model": "gpt-image-1", "size": "1024x1024", "background": "transparent",
        "prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest(),
        "image_sha256": hashlib.sha256(b).hexdigest(), "bytes": len(b),
        "generated_unix": int(time.time()),
    }, indent=2), encoding="utf-8")
    print(json.dumps({"key": key, "path": str(p), "bytes": len(b)}))
