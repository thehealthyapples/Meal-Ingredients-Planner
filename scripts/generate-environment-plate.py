"""
Generate a Living Home Environment Plate from a governed spec file.

Adapted, unchanged in method, from the v2 shell pipeline
(generate-openai-larder-shell.py): gpt-image-2, 1536x1024, high, opaque PNG.
Reads the OpenAI key from the Hermes .env (the machine's canonical location),
falling back to the process OPENAI_API_KEY. The key is never printed or logged.

Each candidate writes a master PNG + a metadata JSON (prompt/image sha256, usage)
so every asset is checksum-traceable to its prompt for the Life/House Register.

Usage:
  python scripts/generate-environment-plate.py --spec docs/asset-specs/ARRIVAL_PLATE_GENERATION_SPEC.md --name arrival --start 1 --count 1
"""
from pathlib import Path
import argparse
import base64
import hashlib
import json
import os
import time
import requests

parser = argparse.ArgumentParser()
parser.add_argument("--spec", required=True, help="path to the generation spec markdown")
parser.add_argument("--name", required=True, help="plate name, e.g. arrival | shelf")
parser.add_argument("--start", type=int, default=1)
parser.add_argument("--count", type=int, default=1)
parser.add_argument("--edit-from", default=None,
                    help="base image to refine via images/edits (preserves composition); omit for text-to-image")
args = parser.parse_args()

REPO = Path(r"C:\Users\Colin\The Healthy Apples\GitHub\tha-living-larder-authoritative")


def load_key() -> str:
    # Primary: the Hermes .env, the machine's canonical key store (never printed).
    hermes = Path(os.environ.get("HERMES_HOME", Path.home() / "AppData" / "Local" / "hermes"))
    env_path = hermes / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                name, value = line.split("=", 1)
                if name.strip() == "OPENAI_API_KEY" and value.strip():
                    return value.strip()
    # Fallback: process env.
    if os.environ.get("OPENAI_API_KEY"):
        return os.environ["OPENAI_API_KEY"].strip()
    raise SystemExit("OPENAI_API_KEY not found (Hermes .env or process env)")


api_key = load_key()

spec_path = Path(args.spec)
if not spec_path.is_absolute():
    spec_path = REPO / spec_path
spec = spec_path.read_text(encoding="utf-8")
positive = spec.split("## Canonical prompt", 1)[1].split("## Negative constraints", 1)[0].strip()
negative = spec.split("## Negative constraints", 1)[1].split("## Candidate strategy", 1)[0].strip()
prompt = positive + "\n\nSTRICT EXCLUSIONS:\n" + negative
prompt_hash = hashlib.sha256(prompt.encode("utf-8")).hexdigest()

out_dir = REPO / "artifacts" / "living-home-environment-plates" / args.name
out_dir.mkdir(parents=True, exist_ok=True)

base_path = None
if args.edit_from:
    base_path = Path(args.edit_from)
    if not base_path.is_absolute():
        base_path = REPO / base_path
    if not base_path.exists():
        raise SystemExit(f"--edit-from base image not found: {base_path}")

for index in range(args.start, args.start + args.count):
    if base_path is not None:
        # Refine an existing plate: images/edits with the base image, no mask —
        # the model preserves composition/camera and applies the prompt's changes.
        with base_path.open("rb") as base_file:
            response = requests.post(
                "https://api.openai.com/v1/images/edits",
                headers={"Authorization": f"Bearer {api_key}"},
                files={"image": (base_path.name, base_file, "image/png")},
                data={
                    "model": "gpt-image-2",
                    "prompt": prompt,
                    "n": "1",
                    "size": "1536x1024",
                    "quality": "high",
                    "output_format": "png",
                },
                timeout=600,
            )
    else:
        payload = {
            "model": "gpt-image-2",
            "prompt": prompt,
            "n": 1,
            "size": "1536x1024",
            "quality": "high",
            "output_format": "png",
            "background": "opaque",
        }
        response = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=600,
        )
    if response.status_code != 200:
        try:
            message = response.json().get("error", {}).get("message", "")
        except Exception:
            message = response.text[:500]
        raise SystemExit(f"{args.name} candidate {index} failed: HTTP {response.status_code}: {message}")
    result = response.json()
    item = result.get("data", [{}])[0]
    encoded = item.get("b64_json")
    if not encoded:
        raise SystemExit(f"{args.name} candidate {index} returned no image bytes")
    image_bytes = base64.b64decode(encoded)
    image_path = out_dir / f"{args.name}-candidate-{index:02d}-master.png"
    image_path.write_bytes(image_bytes)
    safe_result = {k: v for k, v in result.items() if k != "data"}
    safe_item = {k: v for k, v in item.items() if k != "b64_json"}
    metadata = {
        "plate": args.name,
        "candidate": index,
        "model": "gpt-image-2",
        "size_requested": "1536x1024",
        "quality": "high",
        "output_format": "png",
        "operation": "edit" if base_path is not None else "generate",
        "edit_base": str(base_path) if base_path is not None else None,
        "prompt_sha256": prompt_hash,
        "prompt_spec": str(spec_path),
        "image_sha256": hashlib.sha256(image_bytes).hexdigest(),
        "bytes": len(image_bytes),
        "response": safe_result,
        "item": safe_item,
        "generated_unix": int(time.time()),
    }
    (out_dir / f"{args.name}-candidate-{index:02d}-metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )
    usage = safe_result.get("usage", {})
    print(json.dumps({
        "plate": args.name,
        "candidate": index,
        "path": str(image_path),
        "bytes": len(image_bytes),
        "image_sha256": metadata["image_sha256"],
        "output_tokens": usage.get("output_tokens"),
        "total_tokens": usage.get("total_tokens"),
    }))
