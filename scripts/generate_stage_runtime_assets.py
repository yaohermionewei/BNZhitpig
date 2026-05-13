#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


DEFAULT_FILES = [
    "design-assets/stage-source/城堡内.png",
    "design-assets/stage-source/地毯.png",
]

DEFAULT_JPEG_QUALITY = 72
DEFAULT_PNG_COLORS = 48
DEFAULT_OUTPUT_DIR = "miniprogram/assets/images"


def image_has_transparency(image: Image.Image) -> bool:
    if image.mode in ("RGBA", "LA"):
        alpha = image.getchannel("A")
        low, high = alpha.getextrema()
        return low < 255

    if image.mode == "P":
        return "transparency" in image.info

    return False


def cleanup_stale_outputs(dst: Path) -> None:
    for suffix in (".jpg", ".png", ".webp"):
        candidate = dst.with_suffix(suffix)
        if candidate != dst and candidate.exists():
            candidate.unlink()


def resize_image_to_fit(
    image: Image.Image,
    max_width: int | None,
    max_height: int | None,
) -> Image.Image:
    if not max_width and not max_height:
        return image

    width, height = image.size
    width_ratio = max_width / width if max_width and width > max_width else 1
    height_ratio = max_height / height if max_height and height > max_height else 1
    scale = min(width_ratio, height_ratio)

    if scale >= 1:
        return image

    target_size = (
        max(1, int(round(width * scale))),
        max(1, int(round(height * scale))),
    )
    return image.resize(target_size, Image.Resampling.LANCZOS)


def convert_image(
    src: Path,
    jpeg_quality: int,
    png_colors: int,
    output_dir: Path,
    suffix: str,
    max_width: int | None,
    max_height: int | None,
) -> Path:
    if not src.exists():
        raise FileNotFoundError(f"Missing source image: {src}")

    with Image.open(src) as image:
        has_transparency = image_has_transparency(image)
        output_dir.mkdir(parents=True, exist_ok=True)
        resized = resize_image_to_fit(image, max_width, max_height)

        if has_transparency:
            dst = output_dir / f"{src.stem}{suffix}.png"
            paletted = resized.convert("RGBA").quantize(
                colors=png_colors,
                method=Image.FASTOCTREE,
            )
            cleanup_stale_outputs(dst)
            paletted.save(dst, "PNG", optimize=True)
            return dst

        dst = output_dir / f"{src.stem}{suffix}.jpg"
        cleanup_stale_outputs(dst)
        resized.convert("RGB").save(dst, "JPEG", quality=jpeg_quality, optimize=True)

    return dst


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate device-friendly stage runtime assets for the mini program package."
    )
    parser.add_argument(
        "files",
        nargs="*",
        default=DEFAULT_FILES,
        help="Source PNG files to convert. Defaults to the current stage assets.",
    )
    parser.add_argument(
        "--jpeg-quality",
        type=int,
        default=DEFAULT_JPEG_QUALITY,
        help=f"JPEG quality for opaque runtime assets. Default: {DEFAULT_JPEG_QUALITY}",
    )
    parser.add_argument(
        "--png-colors",
        type=int,
        default=DEFAULT_PNG_COLORS,
        help=f"Palette size for transparent PNG runtime assets. Default: {DEFAULT_PNG_COLORS}",
    )
    parser.add_argument(
        "--output-dir",
        default=DEFAULT_OUTPUT_DIR,
        help=f"Directory for generated runtime assets. Default: {DEFAULT_OUTPUT_DIR}",
    )
    parser.add_argument(
        "--suffix",
        default="",
        help="Optional suffix appended to generated filenames, e.g. '.runtime'.",
    )
    parser.add_argument(
        "--max-width",
        type=int,
        default=None,
        help="Optional max width for resized runtime assets.",
    )
    parser.add_argument(
        "--max-height",
        type=int,
        default=None,
        help="Optional max height for resized runtime assets.",
    )
    args = parser.parse_args()
    output_dir = Path(args.output_dir)

    for file_name in args.files:
        src = Path(file_name)
        dst = convert_image(
            src,
            args.jpeg_quality,
            args.png_colors,
            output_dir,
            args.suffix,
            args.max_width,
            args.max_height,
        )
        print(f"{src} -> {dst} ({dst.stat().st_size} bytes)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
