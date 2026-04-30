# Time Stone Icons

Drop three PNG files into this folder:

- `icon16.png` — 16×16 (toolbar)
- `icon48.png` — 48×48 (extensions page)
- `icon128.png` — 128×128 (Chrome Web Store + notifications)

## Suggested aesthetic

- Background: deep crimson-black (`#0a0604`) or pure black
- Subject: a stylized **Eye of Agamotto** — concentric gold rings with a glowing green/amber core
- Accent: gold (`#d4a23a`) outer ring, ember (`#ff7a1a`) or emerald (`#1fa362`) center
- Style: flat, slightly mystical, no photorealism — should read clearly at 16px

## Quick ways to generate them

1. **Figma / Illustrator** — design once at 128×128, export at all three sizes.
2. **AI** — prompt: "Eye of Agamotto, flat icon, gold concentric rings, glowing green center, dark background, vector, 128x128, centered, transparent edges."
3. **Placeholder for testing** — any solid-color PNG at the three sizes will let the extension load. Chrome will show a default puzzle-piece if these are missing.

The filenames are referenced from `manifest.json` and `background.js` — keep them exact.
