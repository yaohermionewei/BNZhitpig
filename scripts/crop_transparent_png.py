#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Crop transparent padding around PNG sprites without cutting into content."
    )
    parser.add_argument(
        "inputs",
        nargs="+",
        help="PNG files to crop.",
    )
    parser.add_argument(
        "--padding",
        type=int,
        default=4,
        help="Extra transparent pixels to keep around detected content. Default: 4.",
    )
    parser.add_argument(
        "--alpha-threshold",
        type=int,
        default=1,
        help="Pixels with alpha below this value are treated as empty. Default: 1.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Write cropped files to this directory while preserving the original filenames.",
    )
    parser.add_argument(
        "--suffix",
        default="",
        help="Optional suffix added before the .png extension. Ignored when --in-place is used.",
    )
    parser.add_argument(
        "--in-place",
        action="store_true",
        help="Replace the original files instead of writing copies.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only print the detected crop boxes, do not write files.",
    )
    return parser.parse_args()


def iter_non_empty_alpha_bbox(image: Image.Image, alpha_threshold: int) -> tuple[int, int, int, int] | None:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    if alpha_threshold <= 1:
        return alpha.getbbox()

    mask = alpha.point(lambda value: 255 if value >= alpha_threshold else 0, mode="1")
    return mask.getbbox()


def expand_bbox(
    bbox: tuple[int, int, int, int],
    image_size: tuple[int, int],
    padding: int,
) -> tuple[int, int, int, int]:
    left, top, right, bottom = bbox
    width, height = image_size
    return (
        max(0, left - padding),
        max(0, top - padding),
        min(width, right + padding),
        min(height, bottom + padding),
    )


def build_output_path(
    input_path: Path,
    output_dir: Path | None,
    suffix: str,
    in_place: bool,
) -> Path:
    if in_place:
        return input_path

    target_name = f"{input_path.stem}{suffix}{input_path.suffix}"
    if output_dir is not None:
        output_dir.mkdir(parents=True, exist_ok=True)
        return output_dir / target_name

    return input_path.with_name(target_name)


def crop_file(
    input_path: Path,
    output_path: Path,
    padding: int,
    alpha_threshold: int,
    dry_run: bool,
) -> tuple[tuple[int, int], tuple[int, int], tuple[int, int, int, int] | None]:
    image = Image.open(input_path).convert("RGBA")
    bbox = iter_non_empty_alpha_bbox(image, alpha_threshold)
    original_size = image.size

    if bbox is None:
        if not dry_run:
            image.save(output_path)
        return original_size, original_size, None

    crop_box = expand_bbox(bbox, image.size, padding)
    cropped = image.crop(crop_box)
    if not dry_run:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        cropped.save(output_path)
    return original_size, cropped.size, crop_box


def validate_inputs(inputs: Iterable[str]) -> list[Path]:
    resolved: list[Path] = []
    for raw in inputs:
        path = Path(raw).expanduser().resolve()
        if not path.exists():
            raise FileNotFoundError(f"Input file not found: {path}")
        if path.suffix.lower() != ".png":
            raise ValueError(f"Only PNG files are supported: {path}")
        resolved.append(path)
    return resolved


def main() -> int:
    args = parse_args()
    input_paths = validate_inputs(args.inputs)

    for input_path in input_paths:
        output_path = build_output_path(input_path, args.output_dir, args.suffix, args.in_place)
        original_size, cropped_size, crop_box = crop_file(
            input_path=input_path,
            output_path=output_path,
            padding=max(0, args.padding),
            alpha_threshold=max(1, args.alpha_threshold),
            dry_run=args.dry_run,
        )

        crop_label = "empty image" if crop_box is None else f"crop_box={crop_box}"
        action = "checked" if args.dry_run else "wrote"
        destination = input_path if args.in_place or args.dry_run else output_path
        print(
            f"{action}: {input_path.name} -> {destination} | "
            f"{original_size[0]}x{original_size[1]} -> {cropped_size[0]}x{cropped_size[1]} | {crop_label}"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
