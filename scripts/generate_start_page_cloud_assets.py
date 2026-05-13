#!/usr/bin/env python3
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "miniprogram" / "assets" / "images" / "start-clouds-v1"

LIGHT = (0xF5, 0xD4, 0x90, 0xFF)
MID = (0xE8, 0xC0, 0x80, 0xFF)
DARK = (0xD6, 0xA4, 0x61, 0xFF)
TRANSPARENT = (0, 0, 0, 0)


@dataclass(frozen=True)
class CloudFrameSpec:
    name: str
    width: int
    rows: tuple[str, ...]


def interpolate_profile(width: int, anchors: tuple[tuple[int, int], ...]) -> list[int | None]:
    if not anchors:
        raise ValueError("Profile anchors are required")

    sorted_anchors = tuple(sorted(anchors))
    values: list[int | None] = [None] * width

    for index, (start_x, start_y) in enumerate(sorted_anchors):
        if start_x < 0 or start_x >= width:
            raise ValueError(f"Anchor x={start_x} is outside width {width}")
        values[start_x] = start_y
        if index == len(sorted_anchors) - 1:
            continue

        end_x, end_y = sorted_anchors[index + 1]
        if end_x <= start_x:
            raise ValueError("Anchors must use increasing x positions")
        steps = end_x - start_x
        for step in range(1, steps):
            t = step / steps
            values[start_x + step] = round(start_y + (end_y - start_y) * t)

    return values


def rows_from_profiles(
    width: int,
    height: int,
    top_anchors: tuple[tuple[int, int], ...],
    bottom_anchors: tuple[tuple[int, int], ...],
) -> tuple[str, ...]:
    top_profile = interpolate_profile(width, top_anchors)
    bottom_profile = interpolate_profile(width, bottom_anchors)
    rows = [["." for _ in range(width)] for _ in range(height)]

    for x in range(width):
        top = top_profile[x]
        bottom = bottom_profile[x]
        if top is None or bottom is None:
            continue
        top_y = max(0, min(height - 1, top))
        bottom_y = max(0, min(height - 1, bottom))
        if bottom_y < top_y:
            top_y, bottom_y = bottom_y, top_y
        for y in range(top_y, bottom_y + 1):
            rows[y][x] = "#"

    return tuple("".join(row) for row in rows)


SPECS = (
    CloudFrameSpec(
        name="cloud-small-a",
        width=32,
        rows=rows_from_profiles(
            32,
            12,
            (
                (2, 8),
                (8, 4),
                (17, 5),
                (25, 3),
                (31, 7),
            ),
            (
                (2, 9),
                (11, 10),
                (20, 11),
                (28, 9),
                (31, 8),
            ),
        ),
    ),
    CloudFrameSpec(
        name="cloud-small-b",
        width=32,
        rows=rows_from_profiles(
            32,
            12,
            (
                (1, 9),
                (6, 3),
                (13, 6),
                (20, 4),
                (27, 6),
                (31, 8),
            ),
            (
                (1, 9),
                (7, 11),
                (15, 10),
                (23, 11),
                (29, 9),
                (31, 8),
            ),
        ),
    ),
    CloudFrameSpec(
        name="cloud-medium-a",
        width=48,
        rows=rows_from_profiles(
            48,
            14,
            (
                (2, 10),
                (11, 6),
                (23, 7),
                (35, 4),
                (47, 9),
            ),
            (
                (2, 11),
                (13, 13),
                (25, 12),
                (37, 13),
                (46, 10),
                (47, 9),
            ),
        ),
    ),
    CloudFrameSpec(
        name="cloud-medium-b",
        width=48,
        rows=rows_from_profiles(
            48,
            14,
            (
                (1, 11),
                (7, 4),
                (17, 6),
                (29, 5),
                (40, 3),
                (47, 8),
            ),
            (
                (1, 11),
                (10, 13),
                (22, 10),
                (34, 12),
                (44, 10),
                (47, 9),
            ),
        ),
    ),
    CloudFrameSpec(
        name="cloud-large-a",
        width=64,
        rows=rows_from_profiles(
            64,
            16,
            (
                (2, 12),
                (14, 8),
                (29, 9),
                (44, 5),
                (58, 8),
                (63, 10),
            ),
            (
                (2, 13),
                (16, 15),
                (31, 13),
                (47, 15),
                (60, 11),
                (63, 10),
            ),
        ),
    ),
    CloudFrameSpec(
        name="cloud-large-b",
        width=64,
        rows=rows_from_profiles(
            64,
            16,
            (
                (1, 12),
                (9, 6),
                (20, 8),
                (32, 4),
                (46, 7),
                (57, 5),
                (63, 11),
            ),
            (
                (1, 12),
                (10, 14),
                (22, 15),
                (35, 12),
                (49, 14),
                (59, 10),
                (63, 9),
            ),
        ),
    ),
)


def normalize_rows(rows: tuple[str, ...], width: int) -> list[str]:
    normalized: list[str] = []
    for row in rows:
        if len(row) > width:
            raise ValueError(f"Pattern row is wider than target width {width}: {row}")
        normalized.append(row.center(width, "."))
    return normalized


def classify_pixel(mask: list[list[bool]], x: int, y: int, width: int, height: int) -> tuple[int, int, int, int]:
    def filled(nx: int, ny: int) -> bool:
        if nx < 0 or nx >= width or ny < 0 or ny >= height:
            return False
        return mask[ny][nx]

    top_exposure = sum(
        1
        for nx, ny in ((x - 1, y), (x, y - 1), (x - 1, y - 1), (x + 1, y - 1))
        if not filled(nx, ny)
    )
    bottom_exposure = sum(
        1
        for nx, ny in ((x + 1, y), (x, y + 1), (x + 1, y + 1), (x - 1, y + 1))
        if not filled(nx, ny)
    )
    left_exposure = sum(
        1
        for nx, ny in ((x - 1, y), (x - 1, y - 1), (x - 1, y + 1))
        if not filled(nx, ny)
    )
    right_exposure = sum(
        1
        for nx, ny in ((x + 1, y), (x + 1, y - 1), (x + 1, y + 1))
        if not filled(nx, ny)
    )

    x_ratio = x / max(1, width - 1)
    y_ratio = y / max(1, height - 1)
    light_bias = (1 - x_ratio) * 0.5 + (1 - y_ratio) * 0.66
    irregularity = (((x * 11 + y * 7) % 5) - 2) * 0.03 + (((x * 3 + y * 5) % 4) - 1.5) * 0.02
    shaded_score = light_bias + irregularity

    if bottom_exposure >= 3 or (right_exposure >= 3 and y_ratio > 0.5):
        return DARK
    if top_exposure >= 2 or (left_exposure >= 2 and y_ratio < 0.74):
        return LIGHT
    if shaded_score >= 0.56:
        return LIGHT
    if shaded_score <= 0.18 or (bottom_exposure >= 2 and y_ratio > 0.68 and right_exposure >= 1):
        return DARK
    return MID


def render_cloud(spec: CloudFrameSpec) -> Image.Image:
    normalized_rows = normalize_rows(spec.rows, spec.width)
    height = len(normalized_rows)
    mask = [
        [cell != "." for cell in row]
        for row in normalized_rows
    ]
    image = Image.new("RGBA", (spec.width, height), TRANSPARENT)
    pixels = image.load()

    for y in range(height):
        for x in range(spec.width):
            if not mask[y][x]:
                continue
            pixels[x, y] = classify_pixel(mask, x, y, spec.width, height)

    return image


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for stale in OUTPUT_DIR.glob("cloud-*.png"):
        stale.unlink()

    for spec in SPECS:
        image = render_cloud(spec)
        output_path = OUTPUT_DIR / f"{spec.name}.png"
        image.save(output_path, format="PNG", optimize=True)
        print(f"{output_path.relative_to(ROOT)} ({output_path.stat().st_size} bytes)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
