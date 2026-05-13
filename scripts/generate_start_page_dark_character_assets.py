#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MINIPROGRAM_IMAGES = ROOT / "miniprogram" / "assets" / "images"
DARK_BLUE = (0x12, 0x2B, 0x52)
TINT_STRENGTH = 0.22

FRAME_SETS = (
    (
        MINIPROGRAM_IMAGES / "title-rabbit-frames-v2",
        MINIPROGRAM_IMAGES / "title-rabbit-frames-dark-v2",
        "rabbit-frame-*.png",
    ),
    (
        MINIPROGRAM_IMAGES / "title-pig-frames-v2",
        MINIPROGRAM_IMAGES / "title-pig-frames-dark-v2",
        "pig-frame-*.png",
    ),
)


def blend_channel(value: int, tint: int) -> int:
    return max(0, min(255, round(value * (1 - TINT_STRENGTH) + tint * TINT_STRENGTH)))


def apply_dark_tint(image: Image.Image) -> Image.Image:
    tinted = image.convert("RGBA")
    pixels = tinted.load()
    width, height = tinted.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                pixels[x, y] = (0, 0, 0, 0)
                continue

            pixels[x, y] = (
                blend_channel(r, DARK_BLUE[0]),
                blend_channel(g, DARK_BLUE[1]),
                blend_channel(b, DARK_BLUE[2]),
                a,
            )

    return tinted


def render_frame_set(source_dir: Path, output_dir: Path, pattern: str) -> list[Path]:
    source_paths = sorted(source_dir.glob(pattern))
    if not source_paths:
        raise FileNotFoundError(f"No source frames matched {source_dir / pattern}")

    output_dir.mkdir(parents=True, exist_ok=True)
    for stale in output_dir.glob("*.png"):
        stale.unlink()

    written_paths: list[Path] = []
    for source_path in source_paths:
        with Image.open(source_path) as image:
            output_path = output_dir / source_path.name
            apply_dark_tint(image).save(output_path, "PNG", optimize=True)
            written_paths.append(output_path)

    return written_paths


def main() -> int:
    written_paths: list[Path] = []
    for source_dir, output_dir, pattern in FRAME_SETS:
        written_paths.extend(render_frame_set(source_dir, output_dir, pattern))

    for path in written_paths:
        print(f"{path.relative_to(ROOT)} ({path.stat().st_size} bytes)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
