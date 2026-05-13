#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MINIPROGRAM_IMAGES = ROOT / "miniprogram" / "assets" / "images"
DARK_TEXT_COLOR = (0x17, 0x23, 0x3D)

ASSETS = (
    (
        MINIPROGRAM_IMAGES / "进入魔法世界....png",
        MINIPROGRAM_IMAGES / "进入魔法世界.dark.png",
    ),
    (
        MINIPROGRAM_IMAGES / "回到魔法世界....png",
        MINIPROGRAM_IMAGES / "回到魔法世界.dark.png",
    ),
)


def create_dark_text_image(source_path: Path) -> Image.Image:
    image = Image.open(source_path).convert("RGBA")
    pixels = image.load()
    width, height = image.size

    for y in range(height):
        for x in range(width):
            _r, _g, _b, alpha = pixels[x, y]
            if alpha == 0:
                pixels[x, y] = (0, 0, 0, 0)
                continue

            pixels[x, y] = (*DARK_TEXT_COLOR, alpha)

    return image


def main() -> int:
    written_paths: list[Path] = []

    for source_path, output_path in ASSETS:
        if not source_path.exists():
            raise FileNotFoundError(f"Missing source loading text image: {source_path}")

        dark_image = create_dark_text_image(source_path)
        dark_image.save(output_path, "PNG", optimize=True)
        written_paths.append(output_path)

    for path in written_paths:
        print(f"{path.relative_to(ROOT)} ({path.stat().st_size} bytes)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
