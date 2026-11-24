#!/usr/bin/env python3
"""
High-Performance Line Art Image Optimizer for Bhagavad Gita Artwork
===================================================================
Converts and aggressively optimizes 9:16 line art JPEG/PNG images into ultra-lightweight WebP files targeting < 20KB per image while preserving crisp line art quality.

Key Line-Art Optimization Techniques:
1. Pure Grayscale Conversion: Strips all redundant chroma channels from black-and-white art.
2. Background Whitening (Denoising): Snaps near-white pixels (> 228) to pure 255, eliminating JPEG DCT high-frequency ringing artifacts from the background.
3. Ink Deepening: Snaps near-black (< 35) to pure 0 while preserving anti-aliased edge gradients.
4. Target-Byte Iterative WebP Encoding: Employs cwebp with `-size 20480` and `-m 6` for optimal dictionary compression.
5. Adaptive Scale Fallback: For extraordinarily dense panoramic line art (e.g. army battlefield scenes), dynamically applies subtle high-fidelity downscaling to strictly respect the 20KB budget.

Default Source:
  assets/content/images/shrimad-bhagwad-gita-art/
Default Destination:
  assets/content/images/shrimad-bhagwad-gita-art-optimized/
"""

import os
import sys
import argparse
import subprocess
import time
from pathlib import Path
from PIL import Image
import numpy as np

# Default directories relative to repository root
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_SRC = REPO_ROOT / "assets" / "content" / "images" / "shrimad-bhagwad-gita-art"
DEFAULT_DEST = REPO_ROOT / "assets" / "content" / "images" / "shrimad-bhagwad-gita-art-optimized"


def find_cwebp():
    """Locate cwebp executable on system or homebrew."""
    candidates = [
        "/opt/homebrew/bin/cwebp",
        "/usr/local/bin/cwebp",
        "/usr/bin/cwebp",
        "cwebp"
    ]
    for c in candidates:
        try:
            res = subprocess.run([c, "-version"], capture_output=True, text=True)
            if res.returncode == 0:
                return c
        except Exception:
            continue
    return None


def clean_lineart_background(im: Image.Image, white_threshold: int = 228, black_threshold: int = 35) -> Image.Image:
    """
    Cleans background artifacts and sharpens ink contours:
    - Snaps near-white pixels to pure 255.
    - Snaps near-black pixels to pure 0.
    - Retains smooth anti-aliased transition pixels between black and white.
    """
    gray = im.convert("L")
    arr = np.array(gray)
    arr[arr > white_threshold] = 255
    arr[arr < black_threshold] = 0
    return Image.fromarray(arr)


def optimize_single_image(
    src_path: Path,
    dest_path: Path,
    cwebp_bin: str,
    target_kb: float = 20.0,
    max_w: int = 720,
    max_h: int = 1280,
    white_thresh: int = 228
) -> dict:
    """
    Optimizes a single line art image into WebP format targeting < target_kb.
    Returns a dictionary of compression statistics.
    """
    orig_bytes = src_path.stat().st_size
    target_bytes = int(target_kb * 1024)

    im = Image.open(src_path)
    orig_w, orig_h = im.size

    # 1. Clean background noise
    clean_im = clean_lineart_background(im, white_threshold=white_thresh)

    # 2. Initial clamp to max dimensions if larger
    w, h = clean_im.size
    if w > max_w or h > max_h:
        ratio = min(max_w / w, max_h / h)
        w, h = int(w * ratio), int(h * ratio)
        clean_im = clean_im.resize((w, h), Image.Resampling.LANCZOS)

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    temp_png = dest_path.with_suffix(".tmp.png")

    actual_bytes = 0
    final_w, final_h = w, h

    if cwebp_bin:
        # Pass 1: Try full resolution with target byte constraint
        clean_im.save(temp_png)
        cmd = [
            cwebp_bin,
            "-quiet",
            "-m", "6",
            "-size", str(target_bytes),
            "-pass", "6",
            str(temp_png),
            "-o", str(dest_path)
        ]
        subprocess.run(cmd)
        actual_bytes = dest_path.stat().st_size

        # Pass 2: Adaptive scale fallback for extremely dense panoramic scenes (e.g. 1-1 with 1000 soldiers)
        scale_steps = [0.85, 0.72, 0.60]
        step_idx = 0
        while actual_bytes > (target_bytes * 1.05) and step_idx < len(scale_steps):
            s = scale_steps[step_idx]
            cur_w, cur_h = int(w * s), int(h * s)
            scaled = clean_im.resize((cur_w, cur_h), Image.Resampling.LANCZOS)
            scaled.save(temp_png)
            subprocess.run([
                cwebp_bin,
                "-quiet",
                "-m", "6",
                "-size", str(target_bytes),
                "-pass", "6",
                str(temp_png),
                "-o", str(dest_path)
            ])
            actual_bytes = dest_path.stat().st_size
            final_w, final_h = cur_w, cur_h
            step_idx += 1

        if temp_png.exists():
            temp_png.unlink()
    else:
        # Fallback to Pillow native WebP if cwebp CLI is unavailable
        best_bytes = float("inf")
        # Binary search for quality
        low_q, high_q = 10, 65
        best_im = clean_im
        for _ in range(5):
            mid_q = (low_q + high_q) // 2
            clean_im.save(dest_path, "WEBP", quality=mid_q, method=6)
            sz = dest_path.stat().st_size
            if sz <= target_bytes:
                best_bytes = sz
                low_q = mid_q + 1
            else:
                high_q = mid_q - 1
                best_bytes = sz

        # If still over budget, scale down once to 0.72
        if best_bytes > target_bytes * 1.05:
            scaled = clean_im.resize((int(w * 0.72), int(h * 0.72)), Image.Resampling.LANCZOS)
            scaled.save(dest_path, "WEBP", quality=25, method=6)
            final_w, final_h = scaled.size
            actual_bytes = dest_path.stat().st_size
        else:
            actual_bytes = best_bytes

    reduction_pct = ((orig_bytes - actual_bytes) / orig_bytes) * 100 if orig_bytes else 0

    return {
        "filename": src_path.name,
        "out_filename": dest_path.name,
        "orig_bytes": orig_bytes,
        "out_bytes": actual_bytes,
        "orig_kb": orig_bytes / 1024,
        "out_kb": actual_bytes / 1024,
        "reduction_pct": reduction_pct,
        "orig_dim": f"{orig_w}x{orig_h}",
        "out_dim": f"{final_w}x{final_h}",
        "under_target": actual_bytes <= (target_bytes * 1.05)
    }


def main():
    parser = argparse.ArgumentParser(
        description="Drastically reduce size of Bhagavad Gita line art images into <20KB WebP files."
    )
    parser.add_argument(
        "--src",
        type=Path,
        default=DEFAULT_SRC,
        help=f"Source directory containing input images (default: {DEFAULT_SRC})"
    )
    parser.add_argument(
        "--dest",
        type=Path,
        default=DEFAULT_DEST,
        help=f"Destination directory for optimized WebP images (default: {DEFAULT_DEST})"
    )
    parser.add_argument(
        "--target-kb",
        type=float,
        default=20.0,
        help="Target maximum file size in kilobytes (default: 20.0 KB)"
    )
    parser.add_argument(
        "--max-width",
        type=int,
        default=720,
        help="Maximum width for 9:16 portrait images (default: 720)"
    )
    parser.add_argument(
        "--max-height",
        type=int,
        default=1280,
        help="Maximum height for 9:16 portrait images (default: 1280)"
    )
    parser.add_argument(
        "--white-threshold",
        type=int,
        default=228,
        help="Luminance threshold to snap near-white pixels to pure 255 (default: 228)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate compression without writing files"
    )

    args = parser.parse_args()

    src_dir = args.src.resolve()
    dest_dir = args.dest.resolve()

    if not src_dir.exists() or not src_dir.is_dir():
        print(f"❌ Error: Source directory does not exist: {src_dir}")
        sys.exit(1)

    cwebp_bin = find_cwebp()
    if cwebp_bin:
        print(f"⚡ Using Google cwebp encoder: {cwebp_bin}")
    else:
        print("⚠️ Warning: cwebp not found in PATH, using Pillow WebP fallback.")

    # Collect source images
    extensions = (".jpg", ".jpeg", ".png", ".webp")
    src_files = [f for f in sorted(src_dir.iterdir()) if f.is_file() and f.suffix.lower() in extensions]

    # Natural sorting by chapter and verse (e.g. 1-1, 1-2, 1-10)
    import re
    src_files.sort(key=lambda x: [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', x.name)])

    if not src_files:
        print(f"⚠️ No image files found in {src_dir}")
        sys.exit(0)

    dest_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 80)
    print(f"🖼️  Gita Line Art Image Optimization Pipeline")
    print(f"   Source Folder:       {src_dir}")
    print(f"   Destination Folder:  {dest_dir}")
    print(f"   Total Images:        {len(src_files)}")
    print(f"   Target Size Budget:  < {args.target_kb:.1f} KB per image")
    print(f"   Output Format:       WebP (High-efficiency line art)")
    print("=" * 80)

    start_time = time.time()
    results = []

    for i, src_file in enumerate(src_files, start=1):
        out_name = src_file.stem + ".webp"
        dest_file = dest_dir / out_name

        if args.dry_run:
            print(f"[{i:3d}/{len(src_files):3d}] (DRY RUN) {src_file.name} -> {out_name}")
            continue

        res = optimize_single_image(
            src_path=src_file,
            dest_path=dest_file,
            cwebp_bin=cwebp_bin,
            target_kb=args.target_kb,
            max_w=args.max_width,
            max_h=args.max_height,
            white_thresh=args.white_threshold
        )
        results.append(res)

        status_icon = "✅" if res["under_target"] else "⚠️"
        print(
            f"[{i:3d}/{len(src_files):3d}] {status_icon} {res['filename']:12s} "
            f"| Orig: {res['orig_kb']:5.1f} KB ({res['orig_dim']}) "
            f"-> WebP: {res['out_kb']:5.1f} KB ({res['out_dim']}) "
            f"| -{res['reduction_pct']:4.1f}%"
        )

    if args.dry_run:
        print("\n✨ Dry run complete. No files were written.")
        return

    duration = time.time() - start_time
    total_orig = sum(r["orig_bytes"] for r in results)
    total_out = sum(r["out_bytes"] for r in results)
    under_target_count = sum(1 for r in results if r["under_target"])
    avg_out_kb = (total_out / len(results)) / 1024 if results else 0
    overall_reduction = ((total_orig - total_out) / total_orig) * 100 if total_orig else 0

    print("=" * 80)
    print("📊 OPTIMIZATION SUMMARY REPORT")
    print("=" * 80)
    print(f"✅ Total Images Processed:       {len(results)}")
    print(f"📁 Destination Folder:           {dest_dir}")
    print(f"📦 Original Total Disk Space:    {total_orig / (1024 * 1024):.2f} MB")
    print(f"🚀 Optimized WebP Total Space:   {total_out / (1024 * 1024):.2f} MB")
    print(f"💾 Total Space Saved:            {(total_orig - total_out) / (1024 * 1024):.2f} MB")
    print(f"📉 Overall Bandwidth Reduction:  {overall_reduction:.1f}%")
    print(f"🎯 Images Meeting Target (<{args.target_kb:.0f}KB): {under_target_count}/{len(results)} ({under_target_count / len(results) * 100:.1f}%)")
    print(f"⚖️  Average Image File Size:      {avg_out_kb:.1f} KB")
    print(f"⏱️  Total Processing Time:        {duration:.2f} seconds ({duration / len(results):.2f}s per image)")
    print("=" * 80)


if __name__ == "__main__":
    main()
