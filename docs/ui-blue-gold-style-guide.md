# Deprecated: Blue-Gold UI Style Guide

## Status

This document is no longer the active design-system baseline for the project.

The live product now uses the **Castle Stage Pixel Design System / 城堡舞台像素设计系统** as its primary language, and that system is currently a **Light / Dark dual-theme** UI:

- `dark`: night blue-gray castle theme
- `light`: sunset parchment castle theme

Current source of truth:

- [`docs/castle-stage-pixel-design-system.zh-CN.md`](/Users/yaohermione/Desktop/rhythm%20game/docs/castle-stage-pixel-design-system.zh-CN.md)
- [`docs/ui-design-system-summary.zh-CN.md`](/Users/yaohermione/Desktop/rhythm%20game/docs/ui-design-system-summary.zh-CN.md)
- [`docs/ui-design-system-summary.png`](/Users/yaohermione/Desktop/rhythm%20game/docs/ui-design-system-summary.png)
- live implementation in:
  - [`miniprogram/utils/start-theme.js`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/utils/start-theme.js)
  - [`miniprogram/pages/start/start.wxss`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/pages/start/start.wxss)
  - [`miniprogram/pages/result/result.wxss`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/pages/result/result.wxss)
  - [`miniprogram/game/render/renderer.js`](/Users/yaohermione/Desktop/rhythm%20game/miniprogram/game/render/renderer.js)

## Historical Note

The old blue-gold system was useful during an earlier phase when the game UI was primarily framed as:

- deep blue dialog surfaces
- antique gold trim and title text
- pixel-cut panels for pause dialogs and lightweight overlays

That framing is deprecated as a default page language. New UI should not start from a generic deep-blue modal or an antique-gold trim kit.

Important nuance: blue-gray and deep blue are **not completely banned**. They have been absorbed into the current `dark` theme and battle-layer language:

- `#6f86aa` is the current dark page and loading background.
- `#17233d` is the current dark deep panel / spinner / pause icon color.
- `#4f668a` is the current dark frame and cloud body color.
- `#325389` is the current dark start CTA face.
- `#9fe4ff` and `#4db7ff` are current dark portal magic colors.

So the deprecated part is not “all blue.” The deprecated part is using the old Blue-Gold document as the main UI grammar.

## Migration Guidance

When updating or creating UI:

1. Start from the Castle Stage Pixel Design System.
2. Treat `dark` and `light` as first-class themes, not as historical variants.
3. Keep `startTheme` continuous across `start -> game -> result -> start`.
4. Use night blue-gray only inside the `dark` theme, battle scene, loading state, portal magic, and theme-aware pause controls.
5. Use sunset parchment, deep brown, and orange-gold for the `light` theme and primary actions.
6. Keep Perfect / Good / Miss colors scoped to gameplay feedback.
7. Do not create new screens from the old “deep blue panel + antique gold border” modal recipe.
