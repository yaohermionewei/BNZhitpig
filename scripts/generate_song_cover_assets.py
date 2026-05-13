#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


DEFAULT_INPUT = Path("miniprogram/assets/images/ditto封面图.jpeg")
DEFAULT_SONG_ID = "ditto"
DEFAULT_STYLE = "soft"
DEFAULT_COMPRESSED_MAX = 160
DEFAULT_PIXEL_SIZE = 28
DEFAULT_SCALE = 4
DEFAULT_COLORS = 14
DEFAULT_JPEG_QUALITY = 82
DEFAULT_WORK_DIR = Path("tmp/song-cover-work")
DEFAULT_OUTPUT_DIR = Path("miniprogram/assets/images/song-covers")

STYLE_PRESETS = {
    "soft": {
        "contrast": 1.16,
        "color": 0.96,
        "brightness": 1.0,
        "sharpness": 1.26,
        "posterize_bits": 4,
    },
    "retro": {
        "contrast": 1.22,
        "color": 0.88,
        "brightness": 0.99,
        "sharpness": 1.34,
        "posterize_bits": 3,
    },
    "poster": {
        "contrast": 1.2,
        "color": 0.82,
        "brightness": 1.02,
        "sharpness": 1.18,
        "posterize_bits": 3,
    },
}


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("value must be a positive integer")
    return parsed


def sanitize_song_id(song_id: str) -> str:
    normalized = re.sub(r"[^0-9A-Za-z._-]+", "-", (song_id or "").strip())
    normalized = normalized.strip("-._")
    return normalized or DEFAULT_SONG_ID


def center_crop_square(image: Image.Image) -> Image.Image:
    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    return image.crop((left, top, left + side, top + side))


def resize_down_to_limit(image: Image.Image, max_size: int) -> Image.Image:
    if max(image.size) <= max_size:
        return image.copy()
    return image.resize((max_size, max_size), Image.Resampling.LANCZOS)


def flatten_if_needed(image: Image.Image, background_color: str = "#f5d9a2") -> Image.Image:
    if image.mode not in ("RGBA", "LA", "P"):
        return image.convert("RGB")

    rgba = image.convert("RGBA")
    background = Image.new("RGBA", rgba.size, background_color)
    return Image.alpha_composite(background, rgba).convert("RGB")


def apply_style(image: Image.Image, style_name: str) -> Image.Image:
    style = STYLE_PRESETS[style_name]
    styled = image.convert("RGB")
    styled = ImageEnhance.Contrast(styled).enhance(style["contrast"])
    styled = ImageEnhance.Color(styled).enhance(style["color"])
    styled = ImageEnhance.Brightness(styled).enhance(style["brightness"])
    styled = ImageEnhance.Sharpness(styled).enhance(style["sharpness"])
    styled = styled.filter(ImageFilter.UnsharpMask(radius=0.8, percent=150, threshold=2))
    styled = ImageOps.posterize(styled, style["posterize_bits"])
    return styled


def build_pixel_cover(
    compressed: Image.Image,
    style_name: str,
    pixel_size: int,
    scale: int,
    colors: int,
) -> Image.Image:
    styled = apply_style(compressed, style_name)
    reduced = styled.resize((pixel_size, pixel_size), Image.Resampling.BOX)
    quantized = reduced.quantize(
        colors=colors,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    )
    return quantized.resize(
        (pixel_size * scale, pixel_size * scale),
        Image.Resampling.NEAREST,
    )


def render_song_cover_assets(
    input_path: Path,
    song_id: str,
    style_name: str,
    compressed_max: int,
    pixel_size: int,
    scale: int,
    colors: int,
    work_dir: Path,
    output_dir: Path,
) -> tuple[Path, Path]:
    safe_song_id = sanitize_song_id(song_id)
    compressed_output = work_dir / f"{safe_song_id}.cover.compressed.jpg"
    pixel_output = output_dir / f"{safe_song_id}.cover.pixel.png"

    work_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(input_path) as source:
        oriented = ImageOps.exif_transpose(source)
        square = center_crop_square(flatten_if_needed(oriented))
        compressed = resize_down_to_limit(square, compressed_max)
        compressed.save(
            compressed_output,
            "JPEG",
            quality=DEFAULT_JPEG_QUALITY,
            optimize=True,
        )

        pixel_cover = build_pixel_cover(
            compressed,
            style_name=style_name,
            pixel_size=pixel_size,
            scale=scale,
            colors=colors,
        )
        pixel_cover.save(pixel_output, "PNG", optimize=True)

    return compressed_output, pixel_output


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compress and pixelate song cover art for the mini program."
    )
    parser.add_argument(
        "--input",
        default=str(DEFAULT_INPUT),
        help=f"Source cover image. Default: {DEFAULT_INPUT}",
    )
    parser.add_argument(
        "--song-id",
        default=DEFAULT_SONG_ID,
        help=f"Song id used for generated filenames. Default: {DEFAULT_SONG_ID}",
    )
    parser.add_argument(
        "--style",
        choices=sorted(STYLE_PRESETS),
        default=DEFAULT_STYLE,
        help=f"Pixel treatment preset. Default: {DEFAULT_STYLE}",
    )
    parser.add_argument(
        "--compressed-max",
        type=positive_int,
        default=DEFAULT_COMPRESSED_MAX,
        help=f"Max size for the compressed square cover. Default: {DEFAULT_COMPRESSED_MAX}",
    )
    parser.add_argument(
        "--pixel-size",
        type=positive_int,
        default=DEFAULT_PIXEL_SIZE,
        help=f"Base size before nearest-neighbor upscale. Default: {DEFAULT_PIXEL_SIZE}",
    )
    parser.add_argument(
        "--scale",
        type=positive_int,
        default=DEFAULT_SCALE,
        help=f"Nearest-neighbor upscale factor. Default: {DEFAULT_SCALE}",
    )
    parser.add_argument(
        "--colors",
        type=positive_int,
        default=DEFAULT_COLORS,
        help=f"Adaptive palette size for the pixel cover. Default: {DEFAULT_COLORS}",
    )
    parser.add_argument(
        "--work-dir",
        default=str(DEFAULT_WORK_DIR),
        help=f"Directory for compressed intermediate outputs. Default: {DEFAULT_WORK_DIR}",
    )
    parser.add_argument(
        "--output-dir",
        default=str(DEFAULT_OUTPUT_DIR),
        help=f"Directory for final pixel covers. Default: {DEFAULT_OUTPUT_DIR}",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise FileNotFoundError(f"Missing source image: {input_path}")

    compressed_output, pixel_output = render_song_cover_assets(
        input_path=input_path,
        song_id=args.song_id,
        style_name=args.style,
        compressed_max=args.compressed_max,
        pixel_size=args.pixel_size,
        scale=args.scale,
        colors=args.colors,
        work_dir=Path(args.work_dir),
        output_dir=Path(args.output_dir),
    )

    print(f"style: {args.style}")
    print(f"source: {input_path}")
    print(
        "compressed:"
        f" {compressed_output} {Image.open(compressed_output).size} {compressed_output.stat().st_size} bytes"
    )
    print(
        "pixel:"
        f" {pixel_output} {Image.open(pixel_output).size} {pixel_output.stat().st_size} bytes"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
