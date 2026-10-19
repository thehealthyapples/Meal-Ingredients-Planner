import importlib.util
for name in ("PIL", "numpy", "cv2", "rembg", "scipy"):
    print(name, bool(importlib.util.find_spec(name)))
