#!/usr/bin/env python3

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Resize and compress an official home-globe Milky Way panorama into a repo-safe runtime derivative."
    )
    parser.add_argument("--source", required=True, help="Path to the downloaded official sky panorama.")
    parser.add_argument("--output", required=True, help="Path for the repo runtime derivative.")
    parser.add_argument("--width", type=int, default=4096, help="Output width in pixels.")
    parser.add_argument("--height", type=int, default=2048, help="Output height in pixels.")
    parser.add_argument("--quality", type=int, default=86, help="WebP quality setting.")
    parser.add_argument(
        "--blur-radius",
        type=float,
        default=0.0,
        help="Optional Gaussian blur radius to soften dense star noise into a calmer runtime sky dome.",
    )
    return parser.parse_args()


def sha256_for(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    args = parse_args()
    source_path = Path(args.source)
    output_path = Path(args.output)

    if not source_path.is_file():
        raise SystemExit(f"Source image not found: {source_path}")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source_path) as image:
        if image.width * args.height != image.height * args.width:
            raise SystemExit(
                "Source aspect ratio does not match the requested 2:1 runtime derivative."
            )

        rgb_image = image.convert("RGB")
        resized = rgb_image.resize((args.width, args.height), Image.Resampling.LANCZOS)
        if args.blur_radius > 0:
            resized = resized.filter(ImageFilter.GaussianBlur(radius=args.blur_radius))
        resized.save(output_path, format="WEBP", quality=args.quality, method=6)

    print(f"wrote={output_path}")
    print(f"dimensions={args.width}x{args.height}")
    print(f"bytes={output_path.stat().st_size}")
    print(f"sha256={sha256_for(output_path)}")


if __name__ == "__main__":
    main()
