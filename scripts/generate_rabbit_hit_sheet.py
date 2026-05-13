#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
CHARACTERS_DIR = ROOT / "miniprogram" / "assets" / "images" / "characters"
SOURCE_VIDEO = CHARACTERS_DIR / "\u5154\u5b50\u88ab\u649e\u4fee\u526a.mp4"
STATIC_RABBIT_BACK = CHARACTERS_DIR / "rabbit-back.png"
OUTPUT_SHEET = CHARACTERS_DIR / "rabbit-back-hit-sheet.png"
WORK_DIR = ROOT / "tmp" / "rabbit-hit"

FRAME_WIDTH = 372
FRAME_HEIGHT = 371
KEY_FRAME_COUNT = 5
STATIC_ENDPOINT_KEY = "rabbit-back"
SHEET_SEQUENCE = (
    STATIC_ENDPOINT_KEY,
    2,
    3,
    4,
    3,
    2,
    STATIC_ENDPOINT_KEY,
)
TARGET_SHEET_SIZE = (FRAME_WIDTH * len(SHEET_SEQUENCE), FRAME_HEIGHT)
FRAME_PADDING = 2
FORWARD_ACTION_SAMPLE_RATIOS = (0.0, 0.22, 0.5, 0.72, 1.0)


SWIFT_EXTRACTOR = r"""
import Foundation
import AVFoundation
import ImageIO
import UniformTypeIdentifiers

enum ExtractError: Error {
    case invalidArguments
    case invalidDuration
    case missingVideoTrack
    case cannotCreateDestination(String)
    case cannotFinalizeDestination(String)
}

let args = CommandLine.arguments
guard args.count == 3 else {
    throw ExtractError.invalidArguments
}

let sourceURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2], isDirectory: true)

try FileManager.default.createDirectory(
    at: outputURL,
    withIntermediateDirectories: true,
    attributes: nil
)

let asset = AVURLAsset(url: sourceURL)
let durationSeconds = CMTimeGetSeconds(asset.duration)
guard durationSeconds.isFinite && durationSeconds > 0 else {
    throw ExtractError.invalidDuration
}
guard let videoTrack = asset.tracks(withMediaType: .video).first else {
    throw ExtractError.missingVideoTrack
}

let nominalFps = Double(videoTrack.nominalFrameRate)
let fps = nominalFps.isFinite && nominalFps > 0 ? nominalFps : 24.0
let frameCount = max(1, Int(ceil(durationSeconds * fps)))
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
let tolerance = CMTime(seconds: 0.5 / fps, preferredTimescale: 600)
generator.requestedTimeToleranceBefore = tolerance
generator.requestedTimeToleranceAfter = tolerance

for index in 0..<frameCount {
    let sourceSeconds = min(
        max(0.0, Double(index) / fps),
        max(0.0, durationSeconds - 0.001)
    )
    let requestedTime = CMTime(seconds: sourceSeconds, preferredTimescale: 600)
    var actualTime = CMTime.invalid
    let image = try generator.copyCGImage(at: requestedTime, actualTime: &actualTime)
    let fileName = String(format: "source-%02d.png", index)
    let destinationURL = outputURL.appendingPathComponent(fileName)

    guard let destination = CGImageDestinationCreateWithURL(
        destinationURL as CFURL,
        UTType.png.identifier as CFString,
        1,
        nil
    ) else {
        throw ExtractError.cannotCreateDestination(destinationURL.path)
    }

    CGImageDestinationAddImage(destination, image, nil)
    guard CGImageDestinationFinalize(destination) else {
        throw ExtractError.cannotFinalizeDestination(destinationURL.path)
    }

    print(String(
        format: "source %02d request=%.4fs actual=%.4fs",
        index,
        sourceSeconds,
        CMTimeGetSeconds(actualTime)
    ))
}

print(String(format: "duration=%.4fs fps=%.2f frames=%d", durationSeconds, fps, frameCount))
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate the 9-frame transparent rabbit hit sprite sheet."
    )
    parser.add_argument("--source", type=Path, default=SOURCE_VIDEO)
    parser.add_argument("--static-endpoint", type=Path, default=STATIC_RABBIT_BACK)
    parser.add_argument("--output", type=Path, default=OUTPUT_SHEET)
    parser.add_argument("--work-dir", type=Path, default=WORK_DIR)
    parser.add_argument("--swift", default=shutil.which("swift") or "/usr/bin/swift")
    parser.add_argument("--white-min", type=int, default=230)
    parser.add_argument("--white-spread", type=int, default=42)
    parser.add_argument("--alpha-threshold", type=int, default=72)
    parser.add_argument(
        "--source-frame-indices",
        default="",
        help=(
            "Comma-separated source frame indices to use as the forward action. "
            "Overrides --action-order when provided."
        ),
    )
    parser.add_argument(
        "--action-order",
        choices=("forward", "reverse"),
        default="forward",
        help=(
            "Whether the source video already plays in the forward action order "
            "or must be read in reverse first."
        ),
    )
    parser.add_argument("--keep-raw", action="store_true")
    return parser.parse_args()


def run_swift_extractor(swift_bin: str, source: Path, raw_dir: Path) -> None:
    if not source.exists():
        raise FileNotFoundError(f"Missing source video: {source}")
    if not shutil.which(swift_bin) and not Path(swift_bin).exists():
        raise FileNotFoundError("Swift is required to decode the source video.")

    raw_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", suffix=".swift", delete=False) as helper:
        helper.write(SWIFT_EXTRACTOR)
        helper_path = Path(helper.name)

    try:
        completed = subprocess.run(
            [
                swift_bin,
                str(helper_path),
                str(source),
                str(raw_dir),
            ],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
    finally:
        helper_path.unlink(missing_ok=True)

    if completed.returncode != 0:
        if completed.stdout:
            print(completed.stdout, file=sys.stderr)
        if completed.stderr:
            print(completed.stderr, file=sys.stderr)
        raise RuntimeError("Swift video frame extraction failed.")

    if completed.stdout:
        print(completed.stdout.strip())


def is_edge_background(pixel: tuple[int, int, int, int], white_min: int, white_spread: int) -> bool:
    r, g, b, alpha = pixel
    if alpha == 0:
        return True
    return (
        r >= white_min
        and g >= white_min
        and b >= white_min
        and max(r, g, b) - min(r, g, b) <= white_spread
    )


def remove_edge_connected_white(
    image: Image.Image,
    white_min: int,
    white_spread: int,
) -> Image.Image:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def index_for(x: int, y: int) -> int:
        return y * width + x

    def enqueue_if_background(x: int, y: int) -> None:
        index = index_for(x, y)
        if visited[index]:
            return
        if not is_edge_background(pixels[x, y], white_min, white_spread):
            return
        visited[index] = 1
        queue.append((x, y))

    for x in range(width):
        enqueue_if_background(x, 0)
        enqueue_if_background(x, height - 1)
    for y in range(height):
        enqueue_if_background(0, y)
        enqueue_if_background(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x > 0:
            enqueue_if_background(x - 1, y)
        if x + 1 < width:
            enqueue_if_background(x + 1, y)
        if y > 0:
            enqueue_if_background(x, y - 1)
        if y + 1 < height:
            enqueue_if_background(x, y + 1)

    for y in range(height):
        for x in range(width):
            if visited[index_for(x, y)]:
                r, g, b, _ = pixels[x, y]
                pixels[x, y] = (r, g, b, 0)

    return rgba


def threshold_alpha(image: Image.Image, alpha_threshold: int) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A").point(
        lambda value: 255 if value >= alpha_threshold else 0
    )
    rgba.putalpha(alpha)
    return rgba


def union_bbox(images: list[Image.Image]) -> tuple[int, int, int, int]:
    boxes = [image.getbbox() for image in images]
    boxes = [box for box in boxes if box]
    if not boxes:
        raise RuntimeError("All extracted frames became transparent after background removal.")

    left = min(box[0] for box in boxes)
    top = min(box[1] for box in boxes)
    right = max(box[2] for box in boxes)
    bottom = max(box[3] for box in boxes)

    source_width, source_height = images[0].size
    return (
        max(0, left - 2),
        max(0, top - 2),
        min(source_width, right + 2),
        min(source_height, bottom + 2),
    )


def normalize_frames(
    images: list[Image.Image],
    bbox: tuple[int, int, int, int],
    alpha_threshold: int,
    label: str = "normalized",
) -> list[Image.Image]:
    crop_width = bbox[2] - bbox[0]
    crop_height = bbox[3] - bbox[1]
    max_width = FRAME_WIDTH - FRAME_PADDING * 2
    max_height = FRAME_HEIGHT - FRAME_PADDING * 2
    scale = min(max_width / crop_width, max_height / crop_height)
    target_width = max(1, round(crop_width * scale))
    target_height = max(1, round(crop_height * scale))
    paste_x = (FRAME_WIDTH - target_width) // 2
    paste_y = FRAME_HEIGHT - target_height - FRAME_PADDING

    normalized: list[Image.Image] = []
    for image in images:
        crop = image.crop(bbox)
        resized = crop.resize((target_width, target_height), Image.Resampling.LANCZOS)
        resized = threshold_alpha(resized, alpha_threshold)
        frame = Image.new("RGBA", (FRAME_WIDTH, FRAME_HEIGHT), (0, 0, 0, 0))
        frame.alpha_composite(resized, (paste_x, paste_y))
        normalized.append(frame)

    print(
        label,
        f"bbox={bbox}",
        f"scale={scale:.4f}",
        f"content={target_width}x{target_height}",
        f"paste=({paste_x},{paste_y})",
    )
    return normalized


def build_sheet(
    endpoint_frame: Image.Image,
    hit_frames: list[Image.Image],
    hit_labels: list[str],
) -> tuple[Image.Image, list[Image.Image], list[str]]:
    sheet = Image.new("RGBA", TARGET_SHEET_SIZE, (0, 0, 0, 0))
    sheet_frames: list[Image.Image] = []
    sheet_labels: list[str] = []

    for output_index, frame_key in enumerate(SHEET_SEQUENCE):
        if frame_key == STATIC_ENDPOINT_KEY:
            frame = endpoint_frame
            label = STATIC_ENDPOINT_KEY
        else:
            frame_index = int(frame_key)
            frame = hit_frames[frame_index]
            label = hit_labels[frame_index]

        sheet.alpha_composite(frame, (output_index * FRAME_WIDTH, 0))
        sheet_frames.append(frame)
        sheet_labels.append(label)

    return sheet, sheet_frames, sheet_labels


def checkerboard(size: tuple[int, int], cell: int = 16) -> Image.Image:
    width, height = size
    image = Image.new("RGBA", size, (228, 232, 238, 255))
    pixels = image.load()
    for y in range(height):
        for x in range(width):
            if ((x // cell) + (y // cell)) % 2:
                pixels[x, y] = (198, 205, 216, 255)
    return image


def parse_source_frame_indices(value: str, source_count: int) -> list[int] | None:
    if not value.strip():
        return None

    indices = [int(part.strip()) for part in value.split(",") if part.strip()]
    if len(indices) != KEY_FRAME_COUNT:
        raise ValueError(
            f"--source-frame-indices must provide exactly {KEY_FRAME_COUNT} indices."
        )

    for index in indices:
        if index < 0 or index >= source_count:
            raise ValueError(
                f"Source frame index {index} is outside the available range 0-{source_count - 1}."
            )

    return indices


def get_default_source_indices(source_count: int, action_order: str) -> list[int]:
    if source_count < 1:
        raise RuntimeError("No source frames were extracted from the video.")

    last_index = source_count - 1
    ratios = (
        FORWARD_ACTION_SAMPLE_RATIOS
        if action_order == "forward"
        else tuple(reversed(FORWARD_ACTION_SAMPLE_RATIOS))
    )
    indices: list[int] = []
    for ratio in ratios:
        index = int(round(last_index * ratio))
        index = max(0, min(last_index, index))
        if not indices or index != indices[-1]:
            indices.append(index)

    fill_range = (
        range(0, last_index + 1)
        if action_order == "forward"
        else range(last_index, -1, -1)
    )
    for index in fill_range:
        if len(indices) >= KEY_FRAME_COUNT:
            break
        if index not in indices:
            indices.append(index)

    return indices[:KEY_FRAME_COUNT]


def load_preview_font(size: int) -> ImageFont.ImageFont:
    for font_path in (
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
    ):
        try:
            return ImageFont.truetype(font_path, size)
        except OSError:
            continue

    return ImageFont.load_default()


def make_labeled_thumbnail(
    image: Image.Image,
    label: str,
    size: tuple[int, int] = (168, 168),
) -> Image.Image:
    label_height = 30
    thumbnail = Image.new("RGBA", (size[0], size[1] + label_height), (255, 255, 255, 255))
    background = checkerboard(size, 12)
    preview = image.convert("RGBA")
    preview.thumbnail((size[0] - 8, size[1] - 8), Image.Resampling.NEAREST)
    background.alpha_composite(
        preview,
        ((size[0] - preview.width) // 2, (size[1] - preview.height) // 2),
    )
    thumbnail.alpha_composite(background, (0, 0))

    draw = ImageDraw.Draw(thumbnail)
    draw.rectangle(
        (0, size[1], size[0], size[1] + label_height),
        fill=(27, 33, 48, 255),
    )
    draw.text(
        (6, size[1] + 6),
        label,
        font=load_preview_font(14),
        fill=(255, 255, 255, 255),
    )
    return thumbnail


def write_contact_sheet(
    items: list[tuple[Image.Image, str]],
    output: Path,
    columns: int = 5,
) -> None:
    if not items:
        return

    thumbnails = [make_labeled_thumbnail(image, label) for image, label in items]
    thumb_width, thumb_height = thumbnails[0].size
    rows = (len(thumbnails) + columns - 1) // columns
    sheet = Image.new(
        "RGBA",
        (columns * thumb_width, rows * thumb_height),
        (255, 255, 255, 255),
    )

    for index, thumbnail in enumerate(thumbnails):
        sheet.alpha_composite(
            thumbnail,
            ((index % columns) * thumb_width, (index // columns) * thumb_height),
        )

    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)


def write_audit_contact_sheets(
    transparent_source_frames: list[Image.Image],
    sheet_frames: list[Image.Image],
    sheet_labels: list[str],
    work_dir: Path,
) -> None:
    chronological_items = [
        (frame, f"src{index:02d}")
        for index, frame in enumerate(transparent_source_frames)
    ]
    reversed_items = [
        (frame, f"rev{reversed_index:02d} src{source_index:02d}")
        for reversed_index, (source_index, frame) in enumerate(
            reversed(list(enumerate(transparent_source_frames)))
        )
    ]
    write_contact_sheet(
        chronological_items,
        work_dir / "rabbit-back-hit-source-chronological-contact.png",
    )
    write_contact_sheet(
        reversed_items,
        work_dir / "rabbit-back-hit-source-reversed-contact.png",
    )
    write_contact_sheet(
        list(zip(sheet_frames, sheet_labels)),
        work_dir / "rabbit-back-hit-selected-palindrome-contact.png",
    )


def write_outputs(
    action_frames: list[Image.Image],
    endpoint_frame: Image.Image,
    sheet_frames: list[Image.Image],
    sheet: Image.Image,
    output: Path,
    work_dir: Path,
) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    work_dir.mkdir(parents=True, exist_ok=True)

    for stale_path in work_dir.glob("rabbit-back-hit-sheet-frame-*.png"):
        stale_path.unlink(missing_ok=True)
    for stale_path in work_dir.glob("rabbit-back-hit-forward-*.png"):
        stale_path.unlink(missing_ok=True)

    endpoint_frame.save(work_dir / "rabbit-back-hit-endpoint-rabbit-back.png")
    for index, frame in enumerate(action_frames, start=1):
        frame.save(work_dir / f"rabbit-back-hit-forward-{index:02d}.png")
    for index, frame in enumerate(sheet_frames, start=1):
        frame.save(work_dir / f"rabbit-back-hit-sheet-frame-{index:02d}.png")

    sheet.save(output)
    preview = checkerboard(sheet.size)
    preview.alpha_composite(sheet)
    preview.save(work_dir / "rabbit-back-hit-sheet-preview.png")


def load_normalized_static_endpoint(
    static_endpoint: Path,
    alpha_threshold: int,
) -> Image.Image:
    static_endpoint_frame = Image.open(static_endpoint).convert("RGBA")
    endpoint_bbox = union_bbox([static_endpoint_frame])
    return normalize_frames(
        [static_endpoint_frame],
        endpoint_bbox,
        alpha_threshold,
        "normalized static endpoint",
    )[0]


def load_existing_sheet_frames(output: Path) -> list[Image.Image]:
    if not output.exists():
        raise FileNotFoundError(
            f"Missing source video and existing sheet fallback: {output}"
        )

    sheet = Image.open(output).convert("RGBA")
    if sheet.height != FRAME_HEIGHT or sheet.width % FRAME_WIDTH != 0:
        raise RuntimeError(
            f"Existing sheet fallback has unexpected size: {sheet.size}"
        )
    frame_count = sheet.width // FRAME_WIDTH

    return [
        sheet.crop((index * FRAME_WIDTH, 0, (index + 1) * FRAME_WIDTH, FRAME_HEIGHT))
        for index in range(frame_count)
    ]


def get_existing_sheet_action_frames(
    existing_frames: list[Image.Image],
    endpoint_frame: Image.Image,
) -> tuple[list[Image.Image], list[str]]:
    if len(existing_frames) >= 9:
        return (
            existing_frames[:KEY_FRAME_COUNT],
            [f"existing-sheet-{index + 1:02d}" for index in range(KEY_FRAME_COUNT)],
        )

    if len(existing_frames) == len(SHEET_SEQUENCE):
        return (
            [
                endpoint_frame,
                existing_frames[1],
                existing_frames[1],
                existing_frames[2],
                existing_frames[3],
            ],
            [
                STATIC_ENDPOINT_KEY,
                "existing-sheet-02",
                "existing-sheet-02",
                "existing-sheet-03",
                "existing-sheet-04",
            ],
        )

    raise RuntimeError(
        "Existing sheet fallback must be the legacy 9-frame sheet "
        f"or the current {len(SHEET_SEQUENCE)}-frame sheet, got {len(existing_frames)} frames."
    )


def rebuild_from_existing_sheet(
    output: Path,
    work_dir: Path,
    endpoint_frame: Image.Image,
) -> None:
    existing_frames = load_existing_sheet_frames(output)
    action_frames, action_labels = get_existing_sheet_action_frames(
        existing_frames,
        endpoint_frame,
    )
    sheet, sheet_frames, sheet_labels = build_sheet(
        endpoint_frame,
        action_frames,
        action_labels,
    )

    print(
        "source video missing; reused existing sheet middle frames",
        ",".join(action_labels[1:]),
    )
    print("sheet frames", ",".join(sheet_labels))
    write_contact_sheet(
        list(
            zip(
                existing_frames,
                [f"existing-sheet-{index + 1:02d}" for index in range(len(existing_frames))],
            )
        ),
        work_dir / "rabbit-back-hit-source-chronological-contact.png",
    )
    write_contact_sheet(
        list(
            zip(
                reversed(existing_frames),
                [
                    f"rev-existing-{len(existing_frames) - index:02d}"
                    for index in range(len(existing_frames))
                ],
            )
        ),
        work_dir / "rabbit-back-hit-source-reversed-contact.png",
    )
    write_contact_sheet(
        list(zip(sheet_frames, sheet_labels)),
        work_dir / "rabbit-back-hit-selected-palindrome-contact.png",
    )
    write_outputs(action_frames, endpoint_frame, sheet_frames, sheet, output, work_dir)
    validate_sheet(sheet, output)


def validate_sheet(sheet: Image.Image, output: Path) -> None:
    if sheet.size != TARGET_SHEET_SIZE:
        raise RuntimeError(f"Unexpected sheet size for {output}: {sheet.size}")

    alpha_values = set(sheet.getchannel("A").getdata())
    if 0 not in alpha_values or 255 not in alpha_values:
        raise RuntimeError("Generated sheet must contain transparent and opaque pixels.")

    print(
        f"wrote {output}",
        f"size={sheet.size[0]}x{sheet.size[1]}",
        f"frame={FRAME_WIDTH}x{FRAME_HEIGHT}",
        f"frames={len(SHEET_SEQUENCE)}",
        f"alpha_values={sorted(alpha_values)}",
    )


def main() -> None:
    args = parse_args()
    source = args.source.resolve()
    static_endpoint = args.static_endpoint.resolve()
    output = args.output.resolve()
    work_dir = args.work_dir.resolve()
    raw_dir = work_dir / "raw"

    if not static_endpoint.exists():
        raise FileNotFoundError(f"Missing static endpoint image: {static_endpoint}")

    if raw_dir.exists() and not args.keep_raw:
        shutil.rmtree(raw_dir)
    raw_dir.mkdir(parents=True, exist_ok=True)
    work_dir.mkdir(parents=True, exist_ok=True)

    endpoint_frame = load_normalized_static_endpoint(
        static_endpoint,
        args.alpha_threshold,
    )
    if not source.exists():
        rebuild_from_existing_sheet(output, work_dir, endpoint_frame)
        if not args.keep_raw:
            shutil.rmtree(raw_dir, ignore_errors=True)
        return

    run_swift_extractor(args.swift, source, raw_dir)
    raw_paths = sorted(raw_dir.glob("source-*.png"))
    if not raw_paths:
        raise RuntimeError("Swift extraction completed, but no source frames were written.")

    raw_source_frames = [Image.open(path).convert("RGBA") for path in raw_paths]
    transparent_source_frames = [
        remove_edge_connected_white(frame, args.white_min, args.white_spread)
        for frame in raw_source_frames
    ]
    source_indices = parse_source_frame_indices(
        args.source_frame_indices,
        len(transparent_source_frames),
    ) or get_default_source_indices(
        len(transparent_source_frames),
        args.action_order,
    )
    selected_transparent_frames = [
        transparent_source_frames[index] for index in source_indices
    ]
    source_labels = [f"src{index:02d}" for index in source_indices]

    print(
        "selected source frames",
        ",".join(f"src{index:02d}" for index in source_indices),
        f"(source video action order: {args.action_order})",
    )

    bbox = union_bbox(selected_transparent_frames)
    normalized_frames = normalize_frames(
        selected_transparent_frames,
        bbox,
        args.alpha_threshold,
        "normalized hit frames",
    )
    sheet, sheet_frames, sheet_labels = build_sheet(
        endpoint_frame,
        normalized_frames,
        source_labels,
    )
    print("sheet frames", ",".join(sheet_labels))
    write_audit_contact_sheets(
        transparent_source_frames,
        sheet_frames,
        sheet_labels,
        work_dir,
    )
    write_outputs(normalized_frames, endpoint_frame, sheet_frames, sheet, output, work_dir)
    validate_sheet(sheet, output)

    if not args.keep_raw:
        shutil.rmtree(raw_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
