from pathlib import Path
import shutil

source = Path(r"C:\Users\Colin\.codex\generated_images\019fec69-6ed9-77b0-8c5b-84b847bf7560")
target = Path(__file__).resolve().parents[1] / "client/public/images/living-home/room/fridge-orange-master"
target.mkdir(parents=True, exist_ok=True)
shutil.copyfile(source / "exec-ab6decf9-a77e-4bb9-b5ec-ef5a1d5e4f83.png", target / "full-plate.png")
shutil.copyfile(source / "exec-f250868a-6f29-4cad-ae2e-400f79bd7be4.png", target / "empty-reference.png")
print(target)
