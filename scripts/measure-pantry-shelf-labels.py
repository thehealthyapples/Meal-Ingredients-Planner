"""Measure dark chalk labels in the current photoreal pantry shelf master."""
from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "client/public/images/living-home/room/pantry-shelves-populated-labelled-v2.png"


def main() -> None:
    image = Image.open(SOURCE).convert("RGB")
    width, height = image.size
    pixels = image.load()
    dark = {
        (x, y)
        for y in range(height)
        for x in range(width)
        if max(pixels[x, y]) < 72 and y < int(height * 0.84)
    }
    components = []
    while dark:
        start = dark.pop()
        queue = deque([start])
        points = [start]
        while queue:
            x, y = queue.popleft()
            for neighbour in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if neighbour in dark:
                    dark.remove(neighbour)
                    queue.append(neighbour)
                    points.append(neighbour)
        xs = [point[0] for point in points]
        ys = [point[1] for point in points]
        x1, x2, y1, y2 = min(xs), max(xs), min(ys), max(ys)
        box_width, box_height = x2 - x1 + 1, y2 - y1 + 1
        if 40 <= box_width <= 120 and 25 <= box_height <= 90 and len(points) > 700:
            components.append((y1, x1, x2, y2, len(points)))
    for y1, x1, x2, y2, count in sorted(components):
        print(f"label x={(x1 + x2) / 2 / width * 100:.2f} y={(y1 + y2) / 2 / height * 100:.2f} w={(x2-x1+1)/width*100:.2f} h={(y2-y1+1)/height*100:.2f} pixels={count}")


if __name__ == "__main__":
    main()
