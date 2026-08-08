#!/usr/bin/env python3
"""
Fill every image slot on the page from whatever is sitting in images/.

Drop your photos into images/ under any filenames, run this, and it wires the
`images` map in assets/app.js so no slot is left on a placeholder. Filenames
don't matter — assignment is by orientation and then by name order, so results
are stable across runs.

Portrait photos are preferred for the four category tiles and the editorial
slot (all 4:5, and the largest on the page); the product rails (8:9) take what
is left. With fewer photos than slots, photos are reused in order rather than
leaving gaps.

Usage:
    python3 tools/assign-images.py
    python3 tools/assign-images.py --pin editorial-workshop=maker-portrait.jpg
    python3 tools/assign-images.py --dry-run
"""

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = ROOT / "images"
APP_JS = ROOT / "assets" / "app.js"

EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}

# Portrait-leaning hero slots first, then the product rails.
FEATURE_SLOTS = ["cat-furniture", "cat-lighting", "cat-textiles", "cat-ceramics", "editorial-workshop"]
PRODUCT_SLOTS = [f"prod-{group}{n}" for group in "nbm" for n in range(1, 7)]
ALL_SLOTS = FEATURE_SLOTS + PRODUCT_SLOTS


def natural_key(path: Path):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", path.name)]


def is_portrait(path: Path) -> bool:
    """True if the image is taller than wide. Unknown formats count as portrait."""
    try:
        from PIL import Image

        with Image.open(path) as img:
            return img.height >= img.width
    except Exception:
        pass
    try:
        import subprocess

        out = subprocess.run(
            ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
            capture_output=True, text=True, check=True,
        ).stdout
        w = int(re.search(r"pixelWidth:\s*(\d+)", out).group(1))
        h = int(re.search(r"pixelHeight:\s*(\d+)", out).group(1))
        return h >= w
    except Exception:
        return True


def build_images_block(mapping: dict) -> str:
    lines = ["  var images = {"]
    for slot in ALL_SLOTS:
        if slot in mapping:
            lines.append(f"    '{slot}': 'images/{mapping[slot]}',")
    lines.append("  };")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--pin", action="append", default=[], metavar="SLOT=FILENAME",
                        help="force one slot to a specific file; repeatable")
    parser.add_argument("--dry-run", action="store_true", help="report only, write nothing")
    args = parser.parse_args()

    if not IMAGES_DIR.exists():
        sys.exit(f"error: {IMAGES_DIR} does not exist")

    photos = sorted((p for p in IMAGES_DIR.iterdir()
                     if p.is_file() and p.suffix.lower() in EXTENSIONS), key=natural_key)
    if not photos:
        sys.exit(f"error: no images found in {IMAGES_DIR}\n"
                 "       Drop your photos in there first (any filenames).")

    mapping, pinned_files = {}, set()
    for spec in args.pin:
        if "=" not in spec:
            sys.exit(f"error: --pin expects SLOT=FILENAME, got {spec!r}")
        slot, filename = spec.split("=", 1)
        if slot not in ALL_SLOTS:
            sys.exit(f"error: unknown slot {slot!r}\n       Valid: {', '.join(ALL_SLOTS)}")
        if not (IMAGES_DIR / filename).exists():
            sys.exit(f"error: images/{filename} not found")
        mapping[slot] = filename
        pinned_files.add(filename)
        print(f"  pin  {slot} -> {filename}")

    available = [p for p in photos if p.name not in pinned_files]
    portrait = [p for p in available if is_portrait(p)]
    landscape = [p for p in available if p not in portrait]
    print(f"\nFound {len(photos)} photo(s): {len(portrait)} portrait, {len(landscape)} landscape")

    # Feature slots get portraits first, then anything; products take the rest.
    queue = portrait + landscape
    for slot in FEATURE_SLOTS:
        if slot in mapping or not queue:
            continue
        mapping[slot] = queue.pop(0).name

    remaining = queue + landscape[:0]  # queue already holds the leftovers in order
    pool = remaining or available or photos
    for index, slot in enumerate(PRODUCT_SLOTS):
        if slot in mapping:
            continue
        mapping[slot] = pool[index % len(pool)].name

    reused = len(ALL_SLOTS) - len({v for v in mapping.values()})
    print(f"Filled {len(mapping)}/{len(ALL_SLOTS)} slots"
          + (f" ({reused} slot(s) reuse a photo — you have fewer photos than slots)" if reused > 0 else ""))
    for slot in ALL_SLOTS:
        print(f"  {slot:<20} {mapping.get(slot, '(empty)')}")

    block = build_images_block(mapping)
    if args.dry_run:
        print(f"\n--- assets/app.js would become ---\n{block}")
        return

    source = APP_JS.read_text(encoding="utf-8")
    updated, count = re.subn(
        r"(/\* IMAGES:START \*/\n).*?(\n  /\* IMAGES:END \*/)",
        lambda m: m.group(1) + block + m.group(2),
        source,
        flags=re.DOTALL,
    )
    if count != 1:
        sys.exit("error: could not find the IMAGES:START/END markers in assets/app.js")

    APP_JS.write_text(updated, encoding="utf-8")
    print("\nWired into assets/app.js. Reload the page.")


if __name__ == "__main__":
    main()
