const GOOGLE_FONTS_COMMIT = "47831f08ec6d6d7ad6b465f23dc9f9a890a2a04b";
const ENGLISH_PIXEL_FONT_ALIAS = "PixelEnPrimary";

const ENGLISH_PIXEL_FONT_CANDIDATES = Object.freeze({
  tiny5: Object.freeze({
    key: "tiny5",
    label: "Tiny5",
    family: ENGLISH_PIXEL_FONT_ALIAS,
    stack: `"${ENGLISH_PIXEL_FONT_ALIAS}", monospace`,
    sourceUrl: `https://cdn.jsdelivr.net/gh/google/fonts@${GOOGLE_FONTS_COMMIT}/ofl/tiny5/Tiny5-Regular.ttf`,
    notes: "Original loaded lowercase-friendly pixel font used before later experiments.",
  }),
  silkscreen: Object.freeze({
    key: "silkscreen",
    label: "Silkscreen",
    family: ENGLISH_PIXEL_FONT_ALIAS,
    stack: `"${ENGLISH_PIXEL_FONT_ALIAS}", monospace`,
    sourceUrl: `https://cdn.jsdelivr.net/gh/google/fonts@${GOOGLE_FONTS_COMMIT}/ofl/silkscreen/Silkscreen-Regular.ttf`,
    notes: "Best first replacement for Tiny5: true pixel feel, finer strokes, very small file.",
  }),
  vt323: Object.freeze({
    key: "vt323",
    label: "VT323",
    family: ENGLISH_PIXEL_FONT_ALIAS,
    stack: `"${ENGLISH_PIXEL_FONT_ALIAS}", monospace`,
    sourceUrl: `https://cdn.jsdelivr.net/gh/google/fonts@${GOOGLE_FONTS_COMMIT}/ofl/vt323/VT323-Regular.ttf`,
    notes: "Thinner and very readable, but more terminal-retro than square-pixel.",
  }),
  dotgothic16: Object.freeze({
    key: "dotgothic16",
    label: "DotGothic16",
    family: ENGLISH_PIXEL_FONT_ALIAS,
    stack: `"${ENGLISH_PIXEL_FONT_ALIAS}", monospace`,
    sourceUrl: `https://cdn.jsdelivr.net/gh/google/fonts@${GOOGLE_FONTS_COMMIT}/ofl/dotgothic16/DotGothic16-Regular.ttf`,
    notes: "Very clean and thin, but much heavier than the other options.",
  }),
  pixelifySans: Object.freeze({
    key: "pixelifySans",
    label: "Pixelify Sans",
    family: ENGLISH_PIXEL_FONT_ALIAS,
    stack: `"${ENGLISH_PIXEL_FONT_ALIAS}", monospace`,
    sourceUrl: `https://cdn.jsdelivr.net/gh/google/fonts@${GOOGLE_FONTS_COMMIT}/ofl/pixelifysans/PixelifySans%5Bwght%5D.ttf`,
    notes: "Modern and tidy, but less retro-pixel than Tiny5/Silkscreen.",
  }),
});

const ACTIVE_ENGLISH_PIXEL_FONT_KEY = "tiny5";
const ACTIVE_ENGLISH_PIXEL_FONT =
  ENGLISH_PIXEL_FONT_CANDIDATES[ACTIVE_ENGLISH_PIXEL_FONT_KEY];

module.exports = {
  ACTIVE_ENGLISH_PIXEL_FONT,
  ACTIVE_ENGLISH_PIXEL_FONT_KEY,
  ENGLISH_PIXEL_FONT_CANDIDATES,
  ENGLISH_PIXEL_FONT_ALIAS,
  GOOGLE_FONTS_COMMIT,
};
