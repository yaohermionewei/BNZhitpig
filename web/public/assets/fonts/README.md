# Bunnies Web Fonts

The React web build self-hosts small WOFF2 fonts for the pixel UI:

- `bunnies-pixel-en.woff2`: Cubic 11, subset to Latin UI characters.
- `bunnies-pixel-zh-ui.woff2`: Cubic 11, subset to the Chinese UI copy currently used by the game.
- `bunnies-pixel-zh-ui.subset.txt`: the source character list used to build the Chinese subset.

If new Chinese UI copy is added, regenerate `bunnies-pixel-zh-ui.subset.txt` and `bunnies-pixel-zh-ui.woff2`; otherwise new characters may fall back to the system font.

Licenses:

- Cubic 11: SIL Open Font License 1.1. See `CUBIC11_OFL.txt`.
