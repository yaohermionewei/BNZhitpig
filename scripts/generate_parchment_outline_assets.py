#!/usr/bin/env python3
from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageColor, ImageFilter


DEFAULT_INPUT = Path("miniprogram/assets/images/羊皮纸透明.png")
DEFAULT_OUTPUT_DIR = Path("miniprogram/assets/images")
DEFAULT_TRIMMED_NAME = "羊皮纸透明.trimmed.png"
DEFAULT_BORDER_NAME = "羊皮纸透明.border.png"
DEFAULT_MAX_WIDTH = 1280
DEFAULT_BORDER_WIDTH = 14
DEFAULT_BORDER_COLOR = ""
DEFAULT_BORDER_OPACITY = 1
DEFAULT_FEATHER_RADIUS = 1.2
DEFAULT_PNG_COLORS = 256
OUTLINE_LAYER_STOPS = (
    (0.25, "#7D5228", 0.68),
    (0.625, "#875625", 0.48),
    (1, "#A46F33", 0.28),
)


def non_negative_int(value: str) -> int:
    parsed = int(value)
    if parsed < 0:
        raise argparse.ArgumentTypeError("value must be 0 or greater")
    return parsed


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("value must be a positive integer")
    return parsed


def bounded_float(value: str) -> float:
    parsed = float(value)
    if parsed < 0 or parsed > 1:
        raise argparse.ArgumentTypeError("value must be between 0 and 1")
    return parsed


def parse_rgb(color: str) -> tuple[int, int, int]:
    parsed = ImageColor.getrgb(color)
    if len(parsed) == 4:
        return parsed[:3]
    return parsed


def get_alpha_bbox(image: Image.Image, threshold: int) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    if threshold <= 0:
        bbox = alpha.getbbox()
    else:
        mask = alpha.point(lambda value: 255 if value > threshold else 0)
        bbox = mask.getbbox()

    if bbox is None:
        raise ValueError("Source image has no visible alpha pixels.")

    return bbox


def crop_to_alpha(image: Image.Image, threshold: int) -> Image.Image:
    return image.crop(get_alpha_bbox(image, threshold))


def resolve_input_path(input_path: Path, output_dir: Path, trimmed_name: str) -> tuple[Path, bool]:
    if input_path.exists():
        return input_path, False

    fallback_input = output_dir / trimmed_name
    if input_path == DEFAULT_INPUT and fallback_input.exists():
        print(f"source missing, using existing trimmed input: {fallback_input}")
        return fallback_input, True

    raise FileNotFoundError(f"Missing source image: {input_path}")


def dilate_alpha(alpha: Image.Image, radius: int) -> Image.Image:
    if radius <= 0:
        return alpha

    return alpha.filter(ImageFilter.MaxFilter(radius * 2 + 1))


def build_outline_layer_specs(
    border_width: int,
    border_color: str,
    opacity_multiplier: float,
) -> list[tuple[int, int, tuple[int, int, int], float]]:
    if border_width <= 0:
        return []

    previous_radius = 0
    specs = []
    for radius_ratio, default_color, default_opacity in OUTLINE_LAYER_STOPS:
        outer_radius = min(border_width, max(previous_radius + 1, round(border_width * radius_ratio)))
        if outer_radius <= previous_radius:
            continue

        color = parse_rgb(border_color) if border_color else parse_rgb(default_color)
        opacity = min(1, default_opacity * opacity_multiplier)
        specs.append((previous_radius, outer_radius, color, opacity))
        previous_radius = outer_radius

        if previous_radius >= border_width:
            break

    return specs


def add_outline(
    image: Image.Image,
    border_width: int,
    border_color: str,
    border_opacity: float,
    feather_radius: float,
) -> Image.Image:
    outline_specs = build_outline_layer_specs(
        border_width=border_width,
        border_color=border_color.strip(),
        opacity_multiplier=border_opacity,
    )
    if not outline_specs:
        return image.copy()

    blur_pad = int(math.ceil(feather_radius * 4))
    pad = border_width + blur_pad + 2
    canvas = Image.new(
        "RGBA",
        (image.width + pad * 2, image.height + pad * 2),
        (0, 0, 0, 0),
    )
    canvas.alpha_composite(image, (pad, pad))

    source_alpha = canvas.getchannel("A")
    outline = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    for inner_radius, outer_radius, color, opacity in reversed(outline_specs):
        outer_alpha = dilate_alpha(source_alpha, outer_radius)
        inner_alpha = dilate_alpha(source_alpha, inner_radius)
        ring_alpha = ImageChops.subtract(outer_alpha, inner_alpha)

        if feather_radius > 0:
            ring_alpha = ring_alpha.filter(ImageFilter.GaussianBlur(feather_radius))

        ring_alpha = ring_alpha.point(lambda value, alpha=opacity: round(value * alpha))
        ring_layer = Image.new("RGBA", canvas.size, (*color, 0))
        ring_layer.putalpha(ring_alpha)
        outline = Image.alpha_composite(outline, ring_layer)

    outlined = Image.alpha_composite(outline, canvas)
    return crop_to_alpha(outlined, threshold=0)


def resize_by_scale(image: Image.Image, scale: float) -> Image.Image:
    if scale >= 1:
        return image.copy()

    size = (
        max(1, round(image.width * scale)),
        max(1, round(image.height * scale)),
    )
    return image.resize(size, Image.Resampling.LANCZOS)


def get_shared_output_scale(images: tuple[Image.Image, ...], max_width: int | None) -> float:
    if not max_width:
        return 1

    widest = max(image.width for image in images)
    if widest <= max_width:
        return 1

    return max_width / widest


def quantize_png(image: Image.Image, colors: int) -> Image.Image:
    if colors <= 0:
        return image.convert("RGBA")

    return image.convert("RGBA").quantize(
        colors=colors,
        method=Image.Quantize.FASTOCTREE,
        dither=Image.Dither.NONE,
    )


def save_png(image: Image.Image, path: Path, colors: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    output = quantize_png(crop_to_alpha(image.convert("RGBA"), threshold=0), colors)
    output_rgba = output.convert("RGBA")
    output_bbox = output_rgba.getchannel("A").getbbox()
    if output_bbox and output_bbox != (0, 0, output.width, output.height):
        output = quantize_png(output_rgba.crop(output_bbox), colors)
    output.save(path, "PNG", optimize=True)


def render_parchment_assets(
    input_path: Path,
    output_dir: Path,
    trimmed_name: str,
    border_name: str,
    alpha_threshold: int,
    max_width: int | None,
    border_width: int,
    border_color: str,
    border_opacity: float,
    feather_radius: float,
    png_colors: int,
) -> tuple[Path, Path]:
    source_path, using_trimmed_fallback = resolve_input_path(input_path, output_dir, trimmed_name)

    with Image.open(source_path) as source:
        rgba = source.convert("RGBA")
        trimmed = crop_to_alpha(rgba, alpha_threshold)
        outlined = add_outline(
            trimmed,
            border_width=border_width,
            border_color=border_color,
            border_opacity=border_opacity,
            feather_radius=feather_radius,
        )

    trimmed_output = output_dir / trimmed_name
    border_output = output_dir / border_name
    output_scale = get_shared_output_scale((trimmed, outlined), max_width)
    if using_trimmed_fallback:
        print(f"trimmed fallback preserved: {trimmed_output} ({trimmed_output.stat().st_size} bytes)")
    else:
        save_png(resize_by_scale(trimmed, output_scale), trimmed_output, png_colors)
    save_png(resize_by_scale(outlined, output_scale), border_output, png_colors)
    return trimmed_output, border_output


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Crop transparent parchment padding and generate an alpha-following brown outline."
    )
    parser.add_argument(
        "--input",
        default=str(DEFAULT_INPUT),
        help=f"Source transparent parchment PNG. Default: {DEFAULT_INPUT}",
    )
    parser.add_argument(
        "--output-dir",
        default=str(DEFAULT_OUTPUT_DIR),
        help=f"Directory for generated PNG assets. Default: {DEFAULT_OUTPUT_DIR}",
    )
    parser.add_argument(
        "--trimmed-name",
        default=DEFAULT_TRIMMED_NAME,
        help=f"Trimmed output filename. Default: {DEFAULT_TRIMMED_NAME}",
    )
    parser.add_argument(
        "--border-name",
        default=DEFAULT_BORDER_NAME,
        help=f"Outlined output filename. Default: {DEFAULT_BORDER_NAME}",
    )
    parser.add_argument(
        "--alpha-threshold",
        type=non_negative_int,
        default=0,
        help="Alpha threshold for finding visible pixels. Default: 0 keeps antialiasing.",
    )
    parser.add_argument(
        "--max-width",
        type=non_negative_int,
        default=DEFAULT_MAX_WIDTH,
        help=f"Resize outputs down to this width. Use 0 to keep source size. Default: {DEFAULT_MAX_WIDTH}",
    )
    parser.add_argument(
        "--border-width",
        type=non_negative_int,
        default=DEFAULT_BORDER_WIDTH,
        help=f"Outline width in source pixels before resizing. Default: {DEFAULT_BORDER_WIDTH}",
    )
    parser.add_argument(
        "--border-color",
        default=DEFAULT_BORDER_COLOR,
        help="Optional single-color outline override. Default uses layered runtime-inspired browns.",
    )
    parser.add_argument(
        "--border-opacity",
        type=bounded_float,
        default=DEFAULT_BORDER_OPACITY,
        help=f"Outline opacity multiplier from 0 to 1. Default: {DEFAULT_BORDER_OPACITY}",
    )
    parser.add_argument(
        "--feather-radius",
        type=float,
        default=DEFAULT_FEATHER_RADIUS,
        help=f"Subtle blur applied to the outline alpha. Default: {DEFAULT_FEATHER_RADIUS}",
    )
    parser.add_argument(
        "--png-colors",
        type=positive_int,
        default=DEFAULT_PNG_COLORS,
        help=f"Palette size for optimized PNG output. Default: {DEFAULT_PNG_COLORS}",
    )
    args = parser.parse_args()

    max_width = args.max_width or None
    trimmed_output, border_output = render_parchment_assets(
        input_path=Path(args.input),
        output_dir=Path(args.output_dir),
        trimmed_name=args.trimmed_name,
        border_name=args.border_name,
        alpha_threshold=args.alpha_threshold,
        max_width=max_width,
        border_width=args.border_width,
        border_color=args.border_color,
        border_opacity=args.border_opacity,
        feather_radius=args.feather_radius,
        png_colors=args.png_colors,
    )

    print(f"trimmed -> {trimmed_output} ({trimmed_output.stat().st_size} bytes)")
    print(f"border  -> {border_output} ({border_output.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
