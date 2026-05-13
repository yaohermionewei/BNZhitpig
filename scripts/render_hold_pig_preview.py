#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PIG_HEAD = ROOT / "miniprogram/assets/images/characters/pig-front-cropped.png"
OUTPUT = ROOT / "tmp/hold-pig-preview.png"

PIG_BASE_HEIGHT = 48
PIG_FRONT_DRAW_SCALE = 0.93
HOLD_TAIL_BASE_HEIGHT = 24
HOLD_TAIL_DRAW_SCALE = 0.92
HOLD_BODY_SEGMENT_BASE = 7


def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def lerp(start: float, end: float, amount: float) -> float:
    return start + (end - start) * amount


def fill_rect(draw: ImageDraw.ImageDraw, x: int, y: int, width: int, height: int, color: str) -> None:
    if width <= 0 or height <= 0:
        return
    draw.rectangle([x, y, x + width - 1, y + height - 1], fill=color)


def draw_shadow(draw: ImageDraw.ImageDraw, center_x: float, center_y: float, radius_x: float, radius_y: float, color: str) -> None:
    draw.ellipse(
        [
            center_x - radius_x,
            center_y - radius_y,
            center_x + radius_x,
            center_y + radius_y,
        ],
        fill=color,
    )


def draw_hold_tail_end(draw: ImageDraw.ImageDraw, center_x: int, top_y: int, scale: float, active: bool) -> None:
    draw_scale = scale * HOLD_TAIL_DRAW_SCALE
    height = HOLD_TAIL_BASE_HEIGHT * draw_scale
    width = height * 1.44
    top = round(top_y - height * 0.38)
    fill = "#E9C3C3"
    side_shade = "#D1818C"
    seam = "rgba(209,129,140,82)"
    shine = "rgba(255,244,244,62)" if active else "rgba(255,244,244,30)"
    cap_top = top + round(height * 0.08)
    cap_bottom = top + round(height * 0.96)
    row_height = max(1, round(height * 0.13))

    draw_shadow(
        draw,
        center_x,
        top_y - height * 0.12 + height * 0.34,
        width * 0.26,
        max(3, height * 0.07),
        "rgba(5,8,18,50)",
    )

    for y in range(cap_top, cap_bottom + 1, row_height):
        progress = clamp((y - cap_top) / max(1, cap_bottom - cap_top), 0, 1)
        if progress < 0.3:
            row_width = lerp(width * 0.62, width * 0.98, progress / 0.3)
        else:
            row_width = lerp(width * 0.98, width * 1.1, (progress - 0.3) / 0.7)
        row_width_rounded = max(6, round(row_width))
        row_height_clamped = min(row_height, cap_bottom - y + 1)
        left = round(center_x - row_width_rounded / 2)
        row_top = round(y)
        edge_width = max(1, round(row_width_rounded * 0.07))
        highlight_width = max(4, round(row_width_rounded * 0.22))
        highlight_left = round(center_x - highlight_width / 2)

        fill_rect(draw, left, row_top, row_width_rounded, row_height_clamped, fill)
        fill_rect(draw, left, row_top, edge_width, row_height_clamped, side_shade)
        fill_rect(
            draw,
            left + row_width_rounded - edge_width,
            row_top,
            edge_width,
            row_height_clamped,
            side_shade,
        )

        if progress < 0.76:
            fill_rect(
                draw,
                highlight_left,
                row_top + 1,
                highlight_width,
                max(1, row_height_clamped - 2),
                shine,
            )

    fill_rect(draw, round(center_x) - 1, top + round(height * 0.32), 2, round(height * 0.24), seam)
    fill_rect(draw, round(center_x) - 1, top + round(height * 0.58), 2, max(2, round(height * 0.12)), seam)

    tail_base_x = round(center_x + width * 0.1)
    tail_base_y = top + round(height * 0.02)
    tail_thickness = max(3, round(height * 0.14))
    tail_height = max(3, round(height * 0.2))
    fill_rect(draw, tail_base_x, tail_base_y, tail_thickness, tail_height, side_shade)
    fill_rect(draw, tail_base_x + tail_thickness - 1, tail_base_y - 2, 3, 3, side_shade)
    fill_rect(draw, tail_base_x + tail_thickness + 1, tail_base_y - 4, 3, 3, side_shade)
    fill_rect(draw, tail_base_x + tail_thickness + 3, tail_base_y - 1, 2, 2, side_shade)


def draw_hold_body(draw: ImageDraw.ImageDraw, center_x: int, body_top_y: int, body_bottom_y: int, head_scale: float, tail_scale: float, active: bool) -> None:
    if body_bottom_y <= body_top_y:
        return

    top_width = max(24, tail_scale * 31)
    bottom_width = max(34, head_scale * 42)
    segment_height = max(6, round(((head_scale + tail_scale) * 0.5) * (HOLD_BODY_SEGMENT_BASE + 2)))
    fill = "#E9C3C3"
    side_shade = "#D1818C"
    seam_shade = "rgba(209,129,140,30)"
    highlight = "rgba(255,244,244,56)" if active else "rgba(255,244,244,30)"

    for y in range(body_top_y, body_bottom_y + 1, segment_height):
        progress = clamp((y - body_top_y) / max(1, body_bottom_y - body_top_y), 0, 1)
        segment_width = round(lerp(top_width, bottom_width, progress))
        segment_height_clamped = min(segment_height, body_bottom_y - y + 1)
        left = round(center_x - segment_width / 2)
        top = round(y)
        inner_width = max(8, round(segment_width * 0.42))
        inner_left = round(center_x - inner_width / 2)
        edge_width = max(1, round(segment_width * 0.07))

        fill_rect(draw, left, top, segment_width, segment_height_clamped, fill)
        fill_rect(draw, left, top, edge_width, segment_height_clamped, side_shade)
        fill_rect(draw, left + segment_width - edge_width, top, edge_width, segment_height_clamped, side_shade)
        fill_rect(draw, inner_left, top + 1, inner_width, max(1, segment_height_clamped - 2), highlight)

        if y > body_top_y:
            fill_rect(draw, left + edge_width, top, max(2, segment_width - edge_width * 2), 1, seam_shade)


def render_preview(output_path: Path, scale_up: int, active: bool) -> Path:
    head = Image.open(PIG_HEAD).convert("RGBA")

    canvas = Image.new("RGBA", (180, 300), (15, 20, 33, 255))
    draw = ImageDraw.Draw(canvas, "RGBA")

    center_x = canvas.width // 2
    head_scale = 1.04
    tail_scale = 0.62

    head_height = PIG_BASE_HEIGHT * head_scale * PIG_FRONT_DRAW_SCALE
    head_width = head_height * (head.width / head.height)
    head_left = round(center_x - head_width / 2)
    head_top = 224

    top_y = 44
    bottom_y = head_top + round(head_height * 0.45)
    body_top_y = top_y + max(2, tail_scale * 4)
    body_bottom_y = bottom_y - max(18, head_scale * 20)

    draw.rounded_rectangle([12, 12, canvas.width - 12, canvas.height - 12], radius=18, fill=(21, 27, 43, 255))
    draw_shadow(draw, center_x, head_top + head_height * 0.78, head_width * 0.26, max(3, head_height * 0.07), "rgba(5,8,18,56)")

    draw_hold_body(draw, center_x, round(body_top_y), round(body_bottom_y), head_scale, tail_scale, active)
    draw_hold_tail_end(draw, center_x, top_y, tail_scale, active)

    if active:
        draw.ellipse(
            [
                center_x - head_width * 0.52,
                head_top - head_height * 0.46,
                center_x + head_width * 0.52,
                head_top + head_height * 0.38,
            ],
            fill=(255, 239, 183, 44),
        )

    resized_head = head.resize((round(head_width), round(head_height)), resample=Image.Resampling.NEAREST)
    canvas.alpha_composite(resized_head, (head_left, head_top))

    if scale_up > 1:
        canvas = canvas.resize((canvas.width * scale_up, canvas.height * scale_up), resample=Image.Resampling.NEAREST)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path)
    return output_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render a standalone preview of the hold pig note.")
    parser.add_argument("--output", type=Path, default=OUTPUT, help="Where to save the rendered PNG preview.")
    parser.add_argument("--scale-up", type=int, default=4, help="Integer upscale for easier inspection. Default: 4.")
    parser.add_argument("--active", action="store_true", help="Render the hold pig in active/pressed state.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    output = render_preview(args.output.resolve(), max(1, args.scale_up), args.active)
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
