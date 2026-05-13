#!/usr/bin/env python3
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
import shutil

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MINIPROGRAM_IMAGES = ROOT / "miniprogram" / "assets" / "images"
BACKUP_DIR = ROOT / "design-assets" / "start-source"


@dataclass(frozen=True)
class SpriteSheetConfig:
    source_name: str
    cols: int
    rows: int
    output_dir_name: str
    output_prefix: str
    output_size: tuple[int, int]
    frame_padding: tuple[int, int, int, int]
    palette_size: int
    align_bottom: bool = True
    frame_scale_overrides: dict[int, float] = field(default_factory=dict)
    apply_light_tint: bool = False
    frame_indices: tuple[int, ...] | None = None


CONFIGS = (
    SpriteSheetConfig(
        source_name="首页兔子精灵图.png",
        cols=3,
        rows=2,
        output_dir_name="title-rabbit-frames-v2",
        output_prefix="rabbit-frame",
        output_size=(320, 320),
        frame_padding=(18, 16, 18, 18),
        palette_size=128,
        align_bottom=True,
        frame_scale_overrides={1: 0.95, 6: 0.95},
        apply_light_tint=True,
        # Drop the smallest and largest rabbit frames so the title loop stays
        # closer to the pig's 4-frame cadence and reads more stable.
        frame_indices=(2, 3, 5, 6),
    ),
    SpriteSheetConfig(
        source_name="首页猪猪精灵图.png",
        cols=2,
        rows=2,
        output_dir_name="title-pig-frames-v2",
        output_prefix="pig-frame",
        output_size=(256, 208),
        frame_padding=(14, 14, 14, 16),
        palette_size=96,
        align_bottom=True,
    ),
)


def find_source_image(source_name: str) -> Path:
    runtime_source = MINIPROGRAM_IMAGES / source_name
    backup_source = BACKUP_DIR / source_name

    if runtime_source.exists():
        return runtime_source
    if backup_source.exists():
        return backup_source

    raise FileNotFoundError(f"Missing source sprite sheet: {source_name}")


def backup_source_image(source_path: Path) -> Path:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup_path = BACKUP_DIR / source_path.name
    if source_path.resolve() == backup_path.resolve():
        return backup_path
    shutil.copy2(source_path, backup_path)
    return backup_path


def quantize_rgba(image: Image.Image, colors: int) -> Image.Image:
    return image.convert("RGBA").quantize(
        colors=colors,
        method=Image.FASTOCTREE,
    ).convert("RGBA")


def iter_cells(sheet: Image.Image, cols: int, rows: int) -> list[Image.Image]:
    sheet_width, sheet_height = sheet.size
    cell_width = sheet_width // cols
    cell_height = sheet_height // rows
    cells: list[Image.Image] = []

    for row in range(rows):
        for col in range(cols):
            cells.append(
                sheet.crop(
                    (
                        col * cell_width,
                        row * cell_height,
                        (col + 1) * cell_width,
                        (row + 1) * cell_height,
                    )
                )
            )

    return cells


def get_non_empty_bbox(cell: Image.Image) -> tuple[int, int, int, int]:
    bbox = cell.convert("RGBA").getbbox()
    if bbox is None:
        raise RuntimeError("Encountered an empty sprite frame while slicing the start-page sheet.")
    return bbox


def blend_channel(base: int, overlay: int, alpha: float) -> int:
    return max(0, min(255, round(base * (1 - alpha) + overlay * alpha)))


def apply_light_tint(frame: Image.Image) -> Image.Image:
    tinted = frame.convert("RGBA")
    pixels = tinted.load()
    width, height = tinted.size
    width_denominator = max(1, width - 1)
    height_denominator = max(1, height - 1)

    for y in range(height):
        y_ratio = y / height_denominator
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue

            x_ratio = x / width_denominator
            brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
            highlight_falloff = max(0, 1 - (x_ratio * 0.82 + y_ratio * 0.96))
            rose_falloff = max(0, (x_ratio * 0.56 + y_ratio * 0.72) - 0.34)

            # Keep the black outline readable while warming the lighter body pixels.
            brightness_factor = 0.28 + brightness * 0.72
            gold_alpha = min(0.18, 0.05 + highlight_falloff * 0.18) * brightness_factor
            rose_alpha = min(0.10, rose_falloff * 0.08) * (0.35 + brightness * 0.65)

            if gold_alpha > 0:
                r = blend_channel(r, 255, gold_alpha)
                g = blend_channel(g, 196, gold_alpha)
                b = blend_channel(b, 132, gold_alpha)
            if rose_alpha > 0:
                r = blend_channel(r, 233, rose_alpha)
                g = blend_channel(g, 139, rose_alpha)
                b = blend_channel(b, 110, rose_alpha)

            pixels[x, y] = (r, g, b, a)

    return tinted


def render_frames(config: SpriteSheetConfig) -> list[Path]:
    source_path = find_source_image(config.source_name)
    backup_path = backup_source_image(source_path)
    sheet = Image.open(backup_path).convert("RGBA")
    cells = iter_cells(sheet, config.cols, config.rows)
    selected_indices = config.frame_indices or tuple(range(1, len(cells) + 1))
    selected_cells = [cells[index - 1] for index in selected_indices]
    bboxes = [get_non_empty_bbox(cell) for cell in selected_cells]

    max_content_width = max(right - left for left, top, right, bottom in bboxes)
    max_content_height = max(bottom - top for left, top, right, bottom in bboxes)

    canvas_width, canvas_height = config.output_size
    pad_left, pad_top, pad_right, pad_bottom = config.frame_padding
    available_width = canvas_width - pad_left - pad_right
    available_height = canvas_height - pad_top - pad_bottom
    scale = min(available_width / max_content_width, available_height / max_content_height)

    output_dir = MINIPROGRAM_IMAGES / config.output_dir_name
    output_dir.mkdir(parents=True, exist_ok=True)
    for stale in output_dir.glob(f"{config.output_prefix}-*.png"):
        stale.unlink()

    written_paths: list[Path] = []
    for output_index, (source_index, cell, bbox) in enumerate(
        zip(selected_indices, selected_cells, bboxes),
        start=1,
    ):
        left, top, right, bottom = bbox
        cropped = cell.crop((left, top, right, bottom))
        target_width = max(1, round((right - left) * scale))
        target_height = max(1, round((bottom - top) * scale))
        resized = cropped.resize((target_width, target_height), Image.Resampling.NEAREST)

        frame_scale_override = config.frame_scale_overrides.get(source_index)
        if frame_scale_override is not None and frame_scale_override > 0:
            overridden_width = max(1, round(target_width * frame_scale_override))
            overridden_height = max(1, round(target_height * frame_scale_override))
            resized = resized.resize((overridden_width, overridden_height), Image.Resampling.NEAREST)
            target_width = overridden_width
            target_height = overridden_height

        frame = Image.new("RGBA", config.output_size, (0, 0, 0, 0))
        paste_x = pad_left + (available_width - target_width) // 2
        if config.align_bottom:
            paste_y = canvas_height - pad_bottom - target_height
        else:
            paste_y = pad_top + (available_height - target_height) // 2
        frame.alpha_composite(resized, (paste_x, paste_y))

        if config.apply_light_tint:
            frame = apply_light_tint(frame)

        output_path = output_dir / f"{config.output_prefix}-{output_index}.png"
        quantized = quantize_rgba(frame, config.palette_size)
        quantized.save(output_path, format="PNG", optimize=True)
        written_paths.append(output_path)

    return written_paths


def main() -> int:
    all_written: list[Path] = []
    for config in CONFIGS:
        all_written.extend(render_frames(config))

    for path in all_written:
        print(f"{path.relative_to(ROOT)} ({path.stat().st_size} bytes)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
