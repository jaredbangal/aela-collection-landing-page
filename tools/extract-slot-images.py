#!/usr/bin/env python3
"""
Restore the landing page's photography from a Claude Design image-slot sidecar.

The design canvas stores dropped photos in .image-slots.state.json as base64
data URIs, keyed by slot id, alongside the pan/zoom each was framed with:

    {"cat-furniture": {"s": 1, "x": 0, "y": -10.08, "u": "data:image/webp;base64,…"}}

This decodes every entry into images/ and rewrites the `images` map between the
IMAGES:START / IMAGES:END markers in assets/app.js. Slots the page doesn't use
are skipped; slots the sidecar doesn't have keep their placeholder.

Usage:
    python3 tools/extract-slot-images.py path/to/.image-slots.state.json
    python3 tools/extract-slot-images.py path/to/.image-slots.state.json --dry-run
"""

import argparse
import base64
import json
import re
import sys
from pathlib import Path
from typing import Dict, Optional, Tuple

ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = ROOT / "images"
APP_JS = ROOT / "assets" / "app.js"

# Every slot the page renders. Anything else in the sidecar is a leftover from
# an earlier revision and is reported but not written.
KNOWN_SLOTS = (
    ["cat-furniture", "cat-lighting", "cat-textiles", "cat-ceramics", "editorial-workshop"]
    + [f"prod-{group}{n}" for group in "nbm" for n in range(1, 7)]
)

MIME_EXT = {
    "image/webp": "webp", "image/jpeg": "jpg", "image/jpg": "jpg",
    "image/png": "png", "image/avif": "avif", "image/gif": "gif",
}

DATA_URI = re.compile(r"^data:(?P<mime>[\w/+.-]+);base64,(?P<payload>.+)$", re.DOTALL)


def load_sidecar(path: Path) -> Dict:
    raw = path.read_text(encoding="utf-8")
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        sys.exit(
            f"error: {path} is not valid JSON ({exc}).\n"
            "       A truncated file will fail here — make sure you have the whole sidecar."
        )


def decode(slot: str, entry) -> Optional[Tuple[bytes, str]]:
    """Return (image bytes, extension) for a sidecar entry, or None."""
    uri = entry.get("u") if isinstance(entry, dict) else entry
    if not isinstance(uri, str):
        print(f"  skip {slot}: no image data")
        return None

    match = DATA_URI.match(uri.strip())
    if not match:
        print(f"  skip {slot}: not a base64 data URI")
        return None

    payload = match.group("payload")
    try:
        blob = base64.b64decode(payload + "=" * (-len(payload) % 4))
    except Exception as exc:  # noqa: BLE001 - report and move on
        print(f"  skip {slot}: could not decode ({exc})")
        return None

    return blob, MIME_EXT.get(match.group("mime"), "bin")


def build_images_block(entries: Dict) -> str:
    lines = ["  var images = {"]
    for slot in KNOWN_SLOTS:
        if slot not in entries:
            continue
        meta = entries[slot]
        parts = [f"src: '{meta['src']}'"]
        if meta.get("scale") not in (None, 1):
            parts.append(f"scale: {meta['scale']:g}")
        if meta.get("x"):
            parts.append(f"x: {meta['x']:g}")
        if meta.get("y"):
            parts.append(f"y: {meta['y']:g}")
        body = f"{{ {', '.join(parts)} }}" if len(parts) > 1 else f"'{meta['src']}'"
        lines.append(f"    '{slot}': {body},")
    lines.append("  };")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("sidecar", type=Path, help="path to .image-slots.state.json")
    parser.add_argument("--dry-run", action="store_true", help="report only, write nothing")
    args = parser.parse_args()

    if not args.sidecar.exists():
        sys.exit(f"error: {args.sidecar} not found")

    state = load_sidecar(args.sidecar)
    print(f"Read {len(state)} slot(s) from {args.sidecar}\n")

    written, stale = {}, []
    for slot, entry in state.items():
        if slot not in KNOWN_SLOTS:
            stale.append(slot)
            continue

        decoded = decode(slot, entry)
        if decoded is None:
            continue
        blob, ext = decoded

        target = IMAGES_DIR / f"{slot}.{ext}"
        if not args.dry_run:
            IMAGES_DIR.mkdir(exist_ok=True)
            target.write_bytes(blob)

        written[slot] = {
            "src": f"images/{target.name}",
            "scale": entry.get("s", 1) if isinstance(entry, dict) else 1,
            "x": entry.get("x", 0) if isinstance(entry, dict) else 0,
            "y": entry.get("y", 0) if isinstance(entry, dict) else 0,
        }
        print(f"  ok   {slot} -> images/{target.name} ({len(blob):,} bytes)")

    if stale:
        print(f"\nIgnored {len(stale)} slot(s) the page no longer uses: {', '.join(sorted(stale))}")

    missing = [s for s in KNOWN_SLOTS if s not in written]
    if missing:
        print(f"\nStill on placeholders ({len(missing)}): {', '.join(missing)}")

    if not written:
        print("\nNothing to wire up.")
        return

    block = build_images_block(written)
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
    print(f"\nWired {len(written)} image(s) into assets/app.js. Reload the page.")


if __name__ == "__main__":
    main()
