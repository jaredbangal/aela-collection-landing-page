# Aela Collection — Landing Page

Static implementation of the Claude Design project
[Aela Collection Landing Page](https://claude.ai/design/p/52f55005-a81e-4568-bf8d-276decf772e4)
(`Aela Collection Landing Page.dc.html`), built against the **Aela Jewels Design System**.

No build step. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
```

## Layout

```
index.html          markup
assets/styles.css   page styles + the DS Button/Input components as CSS
assets/app.js       content data, tabs, marquees, reveal, discount rail
images/             photography, one WebP per slot
tools/              extract-slot-images.py — restores photos from the design sidecar
                    assign-images.py — fills every slot from a folder of photos
_ds/aela-jewels-design-system-5097cf45-…/
  styles.css        entry point, imports the four token files
  tokens/           colors, fonts, typography, spacing — copied verbatim
```

`_ds/` is a byte-for-byte copy of the design system's token files. Everything in
`assets/` consumes them through CSS custom properties, so re-syncing the design
system means replacing `_ds/` and nothing else.

## How the design file was translated

The source is a `.dc.html` design-canvas file: a `<x-dc>` tree with template
directives and a `DCLogic` class. Those constructs have no runtime outside the
Claude Design canvas, so each maps to a plain-web equivalent:

| Design file | Here |
| --- | --- |
| `<helmet>` | `<head>` links and `assets/styles.css` |
| `<sc-if value="{{ … }}">` | `hidden` attribute toggled in `app.js` |
| `<sc-for list="{{ … }}">` | rendered from the `collections` / `categories` arrays |
| `<x-import …Button variant="…">` | `.ds-btn` + `.ds-btn--*` modifiers |
| `<x-import …Input on-dark>` | `.ds-field` / `.ds-field--on-dark` |
| `<image-slot id="…">` | `.slot` — see *Photography* |
| `data-props` (editor controls) | the `config` object at the top of `app.js` |
| `DCLogic.state` | DOM state (`aria-selected`, `hidden`) |

`.ds-btn` and `.ds-field` are direct CSS transcriptions of the `Button` and
`Input` React components in `_ds_bundle.js`, including every variant, hover
colour, and the focus ring — so they stay visually identical to the design
system without pulling in React.

### Editor props

`config` in [assets/app.js](assets/app.js) carries the three controls the design
exposed:

```js
tileShape:           'arch' | 'rounded' | 'circle'      // category tile mask
showAnnouncementBar: true | false
secondaryCtaStyle:   'on-dark' | 'secondary' | 'ghost'  // hero's second CTA
```

## Photography

All 23 slots are filled. The photos are 17 jewellery stock images, re-encoded as
WebP at roughly 2× their rendered size (900px short edge for category tiles,
1300px for the editorial slot, 700px for product tiles) — 1.04 MB for the set.

They were recovered from `.image-slots.state.json` in the design-project download
in `~/Downloads`. The sidecar's own copies were too small to stay sharp on a
retina display (product tiles were 347×520 against a 520×586 render), and it
reused 11 photos across 23 slots — the same portrait appeared three times,
including as a product. So each slot was matched back to its full-resolution
original by perceptual hash and re-encoded, and the product rails were
redistributed so all 17 photos are used and every rail is six distinct images.

The four category tiles and the editorial slot keep the design's own picks and
its pan/zoom framing. `editorial-workshop` is the portrait in the white top.

A slot left without a photo falls back to a placeholder: the tile's mask, a sand
gradient, and the slot's label in Cormorant italic.

### Re-running the recovery

To pull the photos again from a fresh design-project download (⋯ menu →
Download on claude.ai), point the extractor at the `.image-slots.state.json`
inside it:

```bash
python3 tools/extract-slot-images.py ~/Downloads/"Aela Collection Landing Page 2"/.image-slots.state.json
```

Note this restores the sidecar's low-resolution copies and its duplicate
assignments — the state described above was produced by re-encoding from the
full-size originals afterwards.

It decodes every slot into `images/`, reapplies the pan and zoom each photo was
framed with in the canvas, and rewrites the `images` map in `app.js` between the
`IMAGES:START` / `IMAGES:END` markers. Slots the page no longer uses are
reported and skipped; slots the sidecar lacks keep their placeholder. Add
`--dry-run` to see what it would do first.

### Filling every slot from a folder of photos

If you just have a pile of photos and want the page populated, drop them into
`images/` under any filenames and run:

```bash
python3 tools/assign-images.py
python3 tools/assign-images.py --pin editorial-workshop=maker-portrait.jpg
```

Portrait photos go to the four category tiles and the editorial slot (all 4:5,
the largest on the page); the product rails take the rest. With fewer photos
than the 23 slots, photos repeat rather than leaving gaps. `--pin` forces a
specific file into a specific slot, and `--dry-run` previews the assignment.

### Adding photography by hand

Drop files in `images/` and list them in the `images` map in `app.js`. An entry
is either a path or an object with framing:

```js
var images = {
  'cat-furniture': 'images/cat-furniture.jpg',
  'prod-n1':       { src: 'images/amble-lounge-chair.jpg', scale: 1.2, x: 0, y: -10 },
};
```

Slot ids: `cat-furniture`, `cat-lighting`, `cat-textiles`, `cat-ceramics`,
`editorial-workshop`, `prod-n1`–`n6`, `prod-b1`–`b6`, `prod-m1`–`m6`.
Anything left out keeps its placeholder, and a file that fails to load falls
back to one, so the page never shows a broken image.

## Deliberate departures from the design file

- **Hero headline sizing.** The canvas pinned `width: 842px; height: 262px` on
  the `<h1>`. Dropped in favour of the `clamp()` and `max-width: 14ch` that were
  already there, which is what makes it scale.
- **Category strip on mobile.** The design hid it below 900px along with the
  main nav, leaving no way to reach any category on a phone. It now scrolls
  horizontally instead. The main nav stays hidden as designed — its four links
  are duplicated in that strip and the footer.
- **Section headings on mobile.** `--text-h2` is a fixed 44px; clamped under
  900px so headings don't overrun narrow screens.
- **Product tiles are links.** They were inert `<div>`s in the design file. Made
  into anchors with the image-zoom hover from the design system's own
  `ProductCard`, since that is the DS pattern for this exact content.
- **Discount rail dismissal persists** for the session (`sessionStorage`) rather
  than reappearing on every page load. Hidden entirely below 900px, where it
  would sit on top of content.
- **Accessibility and no-JS.** Tabs use the ARIA tab pattern with arrow-key
  navigation; decorative SVG is `aria-hidden`; the newsletter validates and
  reports through a live region. `prefers-reduced-motion` stops the marquees,
  noise, and reveals. Without JS the reveal sections stay visible instead of
  being stuck at `opacity: 0`.

## Not wired up

The newsletter form has no backend — it validates and shows a confirmation.
Point it at a real endpoint in `initNewsletter()`. Nav, search, bag, and product
links are all `#`.
