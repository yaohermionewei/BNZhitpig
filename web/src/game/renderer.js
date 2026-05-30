import { ACTIVE_ENGLISH_PIXEL_FONT } from "../utils/pixel-font-config.js";
import { normalizeStartTheme } from "../utils/start-theme.js";

function createWebOffscreenCanvas({ width = 1, height = 1 } = {}) {
  const safeWidth = Math.max(1, Math.ceil(width));
  const safeHeight = Math.max(1, Math.ceil(height));

  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(safeWidth, safeHeight);
  }

  if (typeof document === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = safeWidth;
  canvas.height = safeHeight;
  return canvas;
}

const TARGET_RATIO = 0.78;
const DAMAGE_TINT_BASE = "rgba(255, 74, 98, 1)";
const DAMAGE_GLOW_BASE = "rgba(255, 180, 190, 1)";
const PIG_BASE_HEIGHT = 48;
const PIG_FRONT_DRAW_SCALE = 0.93;
const PIG_SIDE_DRAW_SCALE = 0.98;
const PIG_GLASSES_LAUNCH_WIDTH_RATIO = 1.15;
const SWIPE_PIG_ARROW_FILL = "#ffdc73";
const SWIPE_PIG_ARROW_HIGHLIGHT = "#fff2a8";
const SWIPE_PIG_ARROW_SHADOW = "rgba(55, 32, 12, 0.38)";
const SWIPE_PIG_ARROW_MASK = Object.freeze([
  "....X....",
  "....XX...",
  "....XXX..",
  "XXXXXXXX.",
  "XXXXXXXXX",
  "XXXXXXXX.",
  "....XXX..",
  "....XX...",
  "....X....",
]);
const HOLD_TAIL_BASE_HEIGHT = 24;
const HOLD_TAIL_DRAW_SCALE = 0.92;
const HOLD_BODY_SEGMENT_BASE = 7;
const MISS_RABBIT_CROSS_ALPHA = 0.78;
const RABBIT_DAMAGE_ALPHA_FACTOR = 0.62;
const RABBIT_WAND_VARIANTS = Object.freeze({
  1: Object.freeze({
    spriteKey: "rabbitBackWandSwing1Sheet",
    bodyCenterRatio: 171 / 382,
  }),
  2: Object.freeze({
    spriteKey: "rabbitBackWandSwing2Sheet",
    bodyCenterRatio: 170 / 372,
  }),
});
const RABBIT_HIT_SHEET = Object.freeze({
  spriteKey: "rabbitBackHitSheet",
  frameCount: 7,
  bodyCenterRatio: 170 / 372,
  duration: 0.18,
});
const RABBIT_IDLE_PIXEL_BOB_PATTERN = Object.freeze([0, -1, -2, -1, 0, 1, 0, 0]);
const RABBIT_IDLE_PIXEL_BOB_SPEED = 5.4;
const RABBIT_IDLE_PIXEL_BOB_PHASE = 0.7;
const NOTE_ENTRY_Y = 183;
const NOTE_FALL_SPEED_MULTIPLIER = 1.1;
const STAGE_CARPET_TOP = 205;
const LANE_HIT_FLASH_CALIBRATION_BASE_WIDTH = 402;
const LANE_HIT_FLASH_CALIBRATION_BASE_HEIGHT = 782;
const LANE_HIT_FLASH_CALIBRATION = Object.freeze({
  // Legacy viewport ratios from the 402px-wide calibration pass. These remain as
  // a fallback for the loading path where the scene background is not available.
  topLeftRatio: 161 / LANE_HIT_FLASH_CALIBRATION_BASE_WIDTH,
  topRightRatio: 245 / LANE_HIT_FLASH_CALIBRATION_BASE_WIDTH,
  bottomLeftRatio: 75 / LANE_HIT_FLASH_CALIBRATION_BASE_WIDTH,
  bottomRightRatio: 332 / LANE_HIT_FLASH_CALIBRATION_BASE_WIDTH,
});
const LANE_HIT_FLASH_SOURCE_BASE_WIDTH = 1024;
const LANE_HIT_FLASH_SOURCE_BASE_HEIGHT = 1840;
const LANE_HIT_FLASH_SOURCE_ANCHORS = Object.freeze({
  topLeft: Object.freeze({ x: 414.04, y: 584.16 }),
  topRight: Object.freeze({ x: 611.25, y: 584.16 }),
  bottomLeft: Object.freeze({ x: 211.76, y: 1840 }),
  bottomRight: Object.freeze({ x: 816.47, y: 1840 }),
});
const IMPACT_ZONE_EDGE_PADDING = 6;
const IMPACT_ZONE_CARPET_WIDTH_BASELINE = 328.06;
const IMPACT_ZONE_ELLIPSE_TO_CARPET_RATIO = 209.4 / IMPACT_ZONE_CARPET_WIDTH_BASELINE;
const IMPACT_ZONE_LINE_TO_CARPET_RATIO = 182.2 / IMPACT_ZONE_CARPET_WIDTH_BASELINE;
const IMPACT_ZONE_ELLIPSE_Y_OFFSET = 2;
const IMPACT_ZONE_INNER_ELLIPSE_Y_OFFSET = 2;
const IMPACT_ZONE_HIGHLIGHT_Y_OFFSET = 1;
const IMPACT_ZONE_MAGIC_DUST_SEEDS = Object.freeze([
  Object.freeze({ x: 0.04, phase: 0.07, size: 2, speed: 0.82, drift: -1.2 }),
  Object.freeze({ x: 0.1, phase: 0.29, size: 1, speed: 0.96, drift: 0.8 }),
  Object.freeze({ x: 0.17, phase: 0.42, size: 1, speed: 0.74, drift: -0.7 }),
  Object.freeze({ x: 0.24, phase: 0.73, size: 1, speed: 0.9, drift: 1.1 }),
  Object.freeze({ x: 0.31, phase: 0.18, size: 2, speed: 0.78, drift: -0.5 }),
  Object.freeze({ x: 0.39, phase: 0.91, size: 1, speed: 0.88, drift: 1.4 }),
  Object.freeze({ x: 0.47, phase: 0.64, size: 1, speed: 1.02, drift: -1 }),
  Object.freeze({ x: 0.55, phase: 0.48, size: 1, speed: 0.84, drift: 0.7 }),
  Object.freeze({ x: 0.59, phase: 0.31, size: 2, speed: 0.76, drift: -1.3 }),
  Object.freeze({ x: 0.66, phase: 0.11, size: 1, speed: 0.94, drift: 1 }),
  Object.freeze({ x: 0.73, phase: 0.82, size: 1, speed: 0.8, drift: -0.8 }),
  Object.freeze({ x: 0.8, phase: 0.69, size: 1, speed: 0.98, drift: 1.2 }),
  Object.freeze({ x: 0.88, phase: 0.53, size: 2, speed: 0.72, drift: -0.9 }),
  Object.freeze({ x: 0.93, phase: 0.36, size: 1, speed: 0.92, drift: 0.6 }),
  Object.freeze({ x: 0.97, phase: 0.24, size: 1, speed: 0.86, drift: -0.4 }),
]);
const IMPACT_ZONE_RING_DUST_SEEDS = Object.freeze([
  Object.freeze({ angle: 0.06, phase: 0.12, size: 1, speed: 0.66, drift: -0.8 }),
  Object.freeze({ angle: 0.18, phase: 0.58, size: 1, speed: 0.72, drift: 0.5 }),
  Object.freeze({ angle: 0.31, phase: 0.34, size: 2, speed: 0.62, drift: -0.3 }),
  Object.freeze({ angle: 0.43, phase: 0.81, size: 1, speed: 0.78, drift: 0.9 }),
  Object.freeze({ angle: 0.58, phase: 0.22, size: 1, speed: 0.68, drift: -0.6 }),
  Object.freeze({ angle: 0.71, phase: 0.67, size: 2, speed: 0.64, drift: 0.4 }),
  Object.freeze({ angle: 0.84, phase: 0.45, size: 1, speed: 0.74, drift: -0.7 }),
  Object.freeze({ angle: 0.94, phase: 0.06, size: 1, speed: 0.7, drift: 0.6 }),
  Object.freeze({ angle: 0.12, phase: 0.76, size: 1, speed: 0.69, drift: 0.8 }),
  Object.freeze({ angle: 0.37, phase: 0.18, size: 1, speed: 0.73, drift: -0.5 }),
  Object.freeze({ angle: 0.64, phase: 0.92, size: 1, speed: 0.67, drift: 0.7 }),
  Object.freeze({ angle: 0.9, phase: 0.31, size: 1, speed: 0.75, drift: -0.6 }),
  Object.freeze({ angle: 0.25, phase: 0.04, size: 2, speed: 0.71, drift: 0.5 }),
  Object.freeze({ angle: 0.5, phase: 0.44, size: 1, speed: 0.76, drift: -0.8 }),
  Object.freeze({ angle: 0.77, phase: 0.86, size: 2, speed: 0.65, drift: 0.6 }),
]);
const NOTE_ENTRY_FADE_DISTANCE = 22;
const NOTE_ENTRY_SOFT_FADE_DISTANCE = 42;
const RABBIT_OCCLUSION_SOFT_FADE_DISTANCE = 28;
const BACKDROP_LOADING_BACKGROUND = "#6f86aa";
const BACKDROP_LOADING_SPINNER = "#17233d";
const BACKDROP_LOADING_SPINNER_TRACK = "rgba(23, 35, 61, 0.22)";
const BACKDROP_TORCH_ANCHOR_BASE_WIDTH = 846;
const BACKDROP_TORCH_ANCHOR_BASE_HEIGHT = 1516;
const BACKDROP_TORCH_ANCHORS = Object.freeze([
  Object.freeze({ x: 38, y: 378, glowRadius: 22, emberRise: 26, emberCount: 5, spreadScale: 1, sizeScale: 1, phase: 0.06 }),
  Object.freeze({ x: 103, y: 348, glowRadius: 18, emberRise: 21, emberCount: 4, spreadScale: 0.82, sizeScale: 0.82, phase: 0.22 }),
  Object.freeze({ x: 157, y: 326, glowRadius: 15, emberRise: 17, emberCount: 3, spreadScale: 0.64, sizeScale: 0.68, phase: 0.38 }),
  Object.freeze({ x: 667, y: 318, glowRadius: 15, emberRise: 17, emberCount: 3, spreadScale: 0.64, sizeScale: 0.68, phase: 0.52 }),
  Object.freeze({ x: 724, y: 344, glowRadius: 18, emberRise: 21, emberCount: 4, spreadScale: 0.82, sizeScale: 0.82, phase: 0.7 }),
  Object.freeze({ x: 804, y: 372, glowRadius: 22, emberRise: 26, emberCount: 5, spreadScale: 1, sizeScale: 1, phase: 0.88 }),
]);
const PORTAL_MAGIC_STAR_BASE_WIDTH = 1024;
const PORTAL_MAGIC_STAR_BASE_HEIGHT = 1840;
// Calibrated from devtools taps on a 402x782 viewport:
// top center (201, 113) maps near source (508, 266), while the lower
// portal edge remains near source y 485. Keep stars spread across this
// full vertical range instead of clustering around the old y 386-482 band.
const PORTAL_MAGIC_STAR_TIERS = Object.freeze({
  md: Object.freeze({ size: 6, glowRadius: 13, alpha: 0.58, twinkleMin: 0.22, twinkleMax: 0.96 }),
  sm: Object.freeze({ size: 3, glowRadius: 7, alpha: 0.42, twinkleMin: 0.18, twinkleMax: 0.84 }),
});
const PORTAL_MAGIC_STAR_PALETTES = Object.freeze({
  light: Object.freeze({
    colors: Object.freeze({
      core: "#fff2b8",
      mid: "#ffd56f",
      accent: "#ffb24b",
    }),
    coreColor: "#fff2b8",
    defaultOuterColor: "#ffb24b",
    trailColor: "#ffcf79",
    glowInnerRgb: "255, 242, 184",
    glowMidRgb: "255, 207, 121",
    glowOuterRgb: "255, 178, 75",
  }),
  dark: Object.freeze({
    colors: Object.freeze({
      core: "#f3fbff",
      mid: "#9fe4ff",
      accent: "#4db7ff",
    }),
    coreColor: "#f3fbff",
    defaultOuterColor: "#67cfff",
    trailColor: "#b9ecff",
    glowInnerRgb: "240, 250, 255",
    glowMidRgb: "112, 210, 255",
    glowOuterRgb: "42, 126, 255",
  }),
});
const PORTAL_MAGIC_STAR_ANCHORS = Object.freeze([
  Object.freeze({ x: 508, y: 276, tier: "sm", phase: 0.04, speed: 1.34, colorKey: "core" }),
  Object.freeze({ x: 518, y: 298, tier: "md", phase: 0.68, speed: 1.52, colorKey: "core" }),
  Object.freeze({ x: 529, y: 315, tier: "sm", phase: 0.83, speed: 1.18, colorKey: "mid" }),
  Object.freeze({ x: 476, y: 337, tier: "sm", phase: 0.91, speed: 1.12, colorKey: "core" }),
  Object.freeze({ x: 542, y: 341, tier: "sm", phase: 0.27, speed: 1.38, colorKey: "accent" }),
  Object.freeze({ x: 493, y: 352, tier: "sm", phase: 0.58, speed: 1.28, colorKey: "mid" }),
  Object.freeze({ x: 525, y: 356, tier: "md", phase: 0.13, speed: 1.58, colorKey: "core" }),
  Object.freeze({ x: 552, y: 371, tier: "sm", phase: 0.33, speed: 1.44, colorKey: "mid" }),
  Object.freeze({ x: 482, y: 381, tier: "md", phase: 0.7, speed: 1.62, colorKey: "accent" }),
  Object.freeze({ x: 455, y: 402, tier: "sm", phase: 0.88, speed: 1.24, colorKey: "core" }),
  Object.freeze({ x: 502, y: 408, tier: "md", phase: 0.24, speed: 1.56, colorKey: "core" }),
  Object.freeze({ x: 562, y: 414, tier: "sm", phase: 0.61, speed: 1.1, colorKey: "accent" }),
  Object.freeze({ x: 474, y: 421, tier: "sm", phase: 0.41, speed: 1.36, colorKey: "mid" }),
  Object.freeze({ x: 448, y: 436, tier: "sm", phase: 0.29, speed: 1.14, colorKey: "core" }),
  Object.freeze({ x: 515, y: 441, tier: "md", phase: 0.81, speed: 1.42, colorKey: "accent" }),
  Object.freeze({ x: 487, y: 455, tier: "sm", phase: 0.64, speed: 1.3, colorKey: "mid" }),
  Object.freeze({ x: 462, y: 463, tier: "sm", phase: 0.38, speed: 1.18, colorKey: "accent" }),
  Object.freeze({ x: 527, y: 466, tier: "sm", phase: 0.72, speed: 1.34, colorKey: "core" }),
  Object.freeze({ x: 499, y: 474, tier: "md", phase: 0.55, speed: 1.48, colorKey: "core" }),
  Object.freeze({ x: 540, y: 480, tier: "sm", phase: 0.87, speed: 1.28, colorKey: "accent" }),
  Object.freeze({ x: 452, y: 484, tier: "sm", phase: 0.78, speed: 1.16, colorKey: "core" }),
]);
const HUD_PLATE_FILL = "rgba(0, 0, 0, 0.3)";
const HUD_PLATE_SHADOW = "rgba(4, 8, 16, 0.12)";
const PIXEL_FONT_EN_FAMILY = ACTIVE_ENGLISH_PIXEL_FONT.stack;
const HUD_CARD_TOP = 46;
const HUD_LABEL_OFFSET_Y = 5;
const HUD_VALUE_OFFSET_Y = 28;
const HUD_LABEL_FONT_SIZE = 19;
const HUD_LABEL_FONT_WEIGHT = "400";
const HUD_LABEL_TRACKING = 0.6;
const HUD_LABEL_GLYPH_PADDING_X = 0;
const CLEAN_DIGIT_FONT_WEIGHT = "400";
const HUD_CLEAN_DIGIT_FONT_SIZE = 30;
const HUD_SCORE_FONT_SIZE = 35;
const HUD_SCORE_FONT_VISUAL_HEIGHT_RATIO = 0.58;
const HUD_SPRITE_DIGIT_SCALE = 2.2;
const HUD_SPRITE_DIGIT_GAP = 0;
const HUD_SPRITE_DIGIT_SHADOW_OFFSET_X = 2;
const HUD_SPRITE_DIGIT_SHADOW_OFFSET_Y = 2;
const HUD_SCORE_SLOT_TEXT = "0000000";
const HUD_SCORE_PLACEHOLDER_COLOR = "rgba(247, 244, 232, 0.5)";
const HUD_SCORE_PLACEHOLDER_SHADOW_COLOR = "rgba(65, 49, 18, 0.36)";
const HUD_COMBO_SHADOW_COLOR = "rgba(92, 64, 31, 0.78)";
const HUD_TIMELINE_TRACK_ALPHA = 0.16;
const HUD_TIMELINE_PROGRESS_ALPHA = 0.42;
const HUD_SONG_COVER_SIZE = 44;
const HUD_SONG_COVER_GAP = 8;
const HUD_SONG_TITLE_FONT_SIZE = 19;
const HUD_SONG_TITLE_TRACKING = 0.2;
const HUD_TOP_Y = 25;
const HUD_SCORE_PAUSE_GAP = 14;
const HUD_SCORE_RIGHT_SAFE_GAP = 12;
const HUD_LIFE_COLUMN_LEFT = 26;
const HUD_LIFE_COLUMN_SAFE_MARGIN = 24;
const HUD_LIFE_BAR_WIDTH = 16;
const HUD_LIFE_BAR_HEIGHT_MIN = 116;
const HUD_LIFE_BAR_HEIGHT_MAX = 158;
const HUD_LIFE_BAR_HEIGHT_RATIO = 0.18;
const HUD_LIFE_BAR_BORDER_COLOR = "#FFD0DC";
const HUD_LIFE_BAR_SHADOW_COLOR = "rgba(34, 16, 24, 0.44)";
const HUD_LIFE_BAR_EMPTY_COLOR = "rgba(38, 24, 34, 0.62)";
const HUD_LIFE_BAR_INNER_BORDER_COLOR = "rgba(34, 16, 24, 0.86)";
const HUD_LIFE_BAR_FILL_COLOR = "#EF6A7D";
const HUD_LIFE_BAR_FILL_HIGHLIGHT = "#FFB0BA";
const HUD_LIFE_BAR_TICK_COLOR = "rgba(255, 208, 220, 0.22)";
const HUD_COVER_BORDER_COLOR = "rgba(247, 244, 232, 0.72)";
const HUD_COVER_INNER_BORDER_COLOR = "rgba(65, 49, 18, 0.34)";
const HUD_COVER_SHADOW_COLOR = "rgba(4, 8, 16, 0.08)";
const HUD_SCORE_GROUP_GAP = 4;
const CENTER_COMBO_NUMBER_MIN_SIZE = 56;
const CENTER_COMBO_NUMBER_MAX_SIZE = 64;
const CENTER_COMBO_NUMBER_WIDTH_RATIO = 0.145;
const CENTER_COMBO_LABEL_MIN_SIZE = 18;
const CENTER_COMBO_LABEL_MAX_SIZE = 22;
const CENTER_COMBO_LABEL_WIDTH_RATIO = 0.052;
const CENTER_COMBO_OFFSET_MIN = 224;
const CENTER_COMBO_OFFSET_MAX = 276;
const CENTER_COMBO_OFFSET_RATIO = 0.29;
const CENTER_COMBO_LABEL_OFFSET_RATIO = 0.58;
const CENTER_COMBO_PULSE_PEAK_SCALE = 1.55;
const CENTER_COMBO_MILESTONE_PULSE_PEAK_SCALE = 1.75;
const CENTER_COMBO_PULSE_SETTLE_DIP_SCALE = 0.98;
const CENTER_COMBO_GHOST_MAX_ALPHA = 0.22;
const CENTER_COMBO_MILESTONE_GHOST_MAX_ALPHA = 0.28;
const CENTER_COMBO_GHOST_SCALE_BOOST = 0.12;
const FEEDBACK_TEXT_MIN_OFFSET = 104;
const FEEDBACK_TEXT_MAX_OFFSET = 140;
const FEEDBACK_TEXT_OFFSET_RATIO = 0.135;
const FEEDBACK_TEXT_TRACKING = 0.4;
const GAME_OVER_TEXT_TRACKING = 1.6;
const ENDING_OVERLAY_ZH_FONT_FAMILY = `"PixelZhFusion", "PingFang SC", "Helvetica Neue", sans-serif`;
const ENDING_OVERLAY_TITLE_TRACKING = 0.8;
const ENDING_OVERLAY_SUBTITLE_TRACKING = 1.1;
const ENDING_OVERLAY_COMPLETED_GOLD = "#FAE18A";
const ENDING_OVERLAY_COMPLETED_SHADOW = "rgba(105, 63, 24, 0.92)";
const ENDING_OVERLAY_FAILED_SHADOW = "rgba(34, 16, 24, 0.68)";
const TUTORIAL_HINT_NOTE_COUNT = 11;
const TUTORIAL_HINT_LEAD_TIME = 1;
const TUTORIAL_HINT_TEXT_COLOR = "#FAEEC2";
const TUTORIAL_HINT_SHADOW_COLOR = "rgba(0, 0, 0, 0.72)";
const TUTORIAL_HINT_GOLD = "#D69A3B";
const TUTORIAL_HINT_GOLD_BRIGHT = "#FFF0B8";
const TUTORIAL_HINT_GOLD_DARK = "rgba(90, 54, 16, 0.62)";
const TUTORIAL_HINT_FONT_FAMILY = ENDING_OVERLAY_ZH_FONT_FAMILY;
const TUTORIAL_HINT_TEXT_TRACKING = 0;
const TUTORIAL_HINT_LINE_HEIGHT = 1.26;
const TUTORIAL_INPUT_MODE_TOUCH = "touch";
const TUTORIAL_INPUT_MODE_KEYBOARD = "keyboard";
const TUTORIAL_TYPE_HINT_COPY_BY_INPUT_MODE = Object.freeze({
  [TUTORIAL_INPUT_MODE_TOUCH]: Object.freeze({
    hold: Object.freeze(["长条猪", "长按屏幕攻击"]),
    normal: Object.freeze(["普通猪", "点屏幕攻击"]),
    left: Object.freeze(["左转猪", "左滑攻击"]),
    right: Object.freeze(["右转猪", "右滑攻击"]),
  }),
  [TUTORIAL_INPUT_MODE_KEYBOARD]: Object.freeze({
    hold: Object.freeze(["长条猪", "按住 空格 攻击"]),
    normal: Object.freeze(["普通猪", "按 空格 攻击"]),
    left: Object.freeze(["左转猪", "按 ← 攻击"]),
    right: Object.freeze(["右转猪", "按 → 攻击"]),
  }),
});
const TUTORIAL_ARROW_MASK = Object.freeze([
  ".......XX",
  "......XXX",
  ".....XXXX",
  "XXXXXXXXX",
  "XXXXXXXXX",
  ".....XXXX",
  "......XXX",
  ".......XX",
]);
const PERFECT_FEEDBACK_MAIN = "#6EDE7D";
const GOOD_FEEDBACK_MAIN = "#8BDDFF";
const MISS_FEEDBACK_MAIN = "#FF7F90";
const PAUSE_OVERLAY_PALETTES = Object.freeze({
  dark: Object.freeze({
    outerColor: "#17233d",
    faceColor: "#6f86aa",
    iconColor: "#17233d",
    shadowColor: "rgba(23, 35, 61, 0.24)",
  }),
  light: Object.freeze({
    outerColor: "#582f28",
    faceColor: "#ecd2a6",
    iconColor: "#582f28",
    shadowColor: "rgba(88, 47, 40, 0.18)",
  }),
});
// Debug switch: bypass the offscreen-canvas pixel text rasterization pipeline
// so we can inspect the underlying font shapes directly.
const DEBUG_DISABLE_PIXEL_TEXT_RASTERIZATION = true;
const STAGE_CARPET_EDGE_PROFILE = Object.freeze([
  Object.freeze({ progress: 0, left: 0.3705, right: 0.6205 }),
  Object.freeze({ progress: 0.1, left: 0.3348, right: 0.6607 }),
  Object.freeze({ progress: 0.2, left: 0.3036, right: 0.692 }),
  Object.freeze({ progress: 0.3, left: 0.2723, right: 0.7232 }),
  Object.freeze({ progress: 0.4, left: 0.2411, right: 0.7545 }),
  Object.freeze({ progress: 0.5, left: 0.2098, right: 0.7857 }),
  Object.freeze({ progress: 0.6, left: 0.1741, right: 0.8214 }),
  Object.freeze({ progress: 0.7, left: 0.1384, right: 0.8571 }),
  Object.freeze({ progress: 0.8, left: 0.1027, right: 0.8884 }),
  Object.freeze({ progress: 0.9, left: 0.0714, right: 0.9241 }),
  Object.freeze({ progress: 1, left: 0.0089, right: 0.9866 }),
]);
const pixelTextCanvasCache = new Map();
let noteSoftFadeBuffer = null;
const TITLE_RABBIT_SPRITES = Object.freeze({
  idle: Object.freeze([
    "...................",
    "...ooo........ooo..",
    "..owwwo......owwwo.",
    ".owwwwwo....owwwwwo",
    ".owwwwwo....owwwwwo",
    ".owwwwwo....owwwwwo",
    ".owwwwwwoooowwwwwwo",
    ".owwwwwwwwwwwwwwwwo",
    ".owwwwwwwwwwwwwwwwo",
    ".owwwwwwwwwwwwwwwwo",
    ".owwweewwwwwweewwwo",
    ".owwweewwwwwweewwwo",
    "..owwwwwwwwwwwwwwo.",
    "..owwwwwwwwwwwwwwo.",
    "...owwwwwwwwwwwwo..",
    ".....oowwwwwwoo....",
    "......ooooooooo....",
  ]),
  blink: Object.freeze([
    "...................",
    "...ooo........ooo..",
    "..owwwo......owwwo.",
    ".owwwwwo....owwwwwo",
    ".owwwwwo....owwwwwo",
    ".owwwwwo....owwwwwo",
    ".owwwwwwoooowwwwwwo",
    ".owwwwwwwwwwwwwwwwo",
    ".owwwwwwwwwwwwwwwwo",
    ".owwwwwwwwwwwwwwwwo",
    ".owwwwwwwwwwwwwwwwo",
    ".owwweeewwwweeewwwo",
    "..owwwwwwwwwwwwwwo.",
    "..owwwwwwwwwwwwwwo.",
    "...owwwwwwwwwwwwo..",
    ".....oowwwwwwoo....",
    "......ooooooooo....",
  ]),
  twitch: Object.freeze([
    "...................",
    "...oooo......oooo..",
    "..owwwwo....owwwwo.",
    ".owwwwwwo..owwwwwwo",
    ".owwwwwwo..owwwwwwo",
    ".owwwwwo....owwwwwo",
    ".owwwwwwoooowwwwwwo",
    ".owwwwwwwwwwwwwwwwo",
    ".owwwwwwwwwwwwwwwwo",
    ".owwwwwwwwwwwwwwwwo",
    ".owwweewwwwwweewwwo",
    ".owwweewwwwwweewwwo",
    "..owwwwwwwwwwwwwwo.",
    "..owwwwwwwwwwwwwwo.",
    "...owwwwwwwwwwwwo..",
    ".....oowwwwwwoo....",
    "......ooooooooo....",
  ]),
});
const TITLE_PIG_SPRITES = Object.freeze({
  idle: Object.freeze([
    "...oo......oo...",
    "..owwo....owwo..",
    "..owhhwwwwhhwo..",
    ".owwwwwwwwwwwwo.",
    ".owwwwwwwwwwwwo.",
    ".owwwee..eewwwo.",
    ".owwwwsssswwwwo.",
    ".owwwwwnnwwwwwo.",
    ".owwwwwwwwwwwwo.",
    ".owwwswwwwswwwo.",
    "..owwwwwwwwwwo..",
    "..owwwoooowwwo..",
    "...oo......oo...",
    "................",
  ]),
  blink: Object.freeze([
    "...oo......oo...",
    "..owwo....owwo..",
    "..owhhwwwwhhwo..",
    ".owwwwwwwwwwwwo.",
    ".owwwwwwwwwwwwo.",
    ".owwwwo..owwwwo.",
    ".owwwwsssswwwwo.",
    ".owwwwwnnwwwwwo.",
    ".owwwwwwwwwwwwo.",
    ".owwwswwwwswwwo.",
    "..owwwwwwwwwwo..",
    "..owwwoooowwwo..",
    "...oo......oo...",
    "................",
  ]),
  squash: Object.freeze([
    "................",
    "...oo......oo...",
    "..owwo....owwo..",
    ".owhhwwwwwwhhwo.",
    ".owwwwwwwwwwwwo.",
    ".owwwwewwewwwwo.",
    ".owwwwsssswwwwo.",
    ".owwwwwnnwwwwwo.",
    ".owwwwwwwwwwwwo.",
    ".owwwswwwwswwwo.",
    ".owwwwwwwwwwwwo.",
    "..owwwoooowwwo..",
    "...oo......oo...",
    "................",
  ]),
});
const UI_PANEL_BLUE = "#27344D";
const UI_PANEL_DEEP = "#202A3C";
const UI_GOLD_OUTER = "#9D8451";
const UI_GOLD_INNER = "#C6B07A";
const UI_GOLD_TEXT = "#E5D39A";
const UI_BRIGHT_TEXT = "#F7F4E8";
const UI_WARM_SHADOW = "rgba(65, 49, 18, 0.72)";
const UI_PANEL_SHADOW = "rgba(4, 8, 16, 0.68)";
const UI_PANEL_DROP = "rgba(4, 8, 16, 0.34)";
const HUD_HEART_OUTLINE_COLOR = "#FFD0DC";
const HUD_HEART_FILLED_SPRITE = Object.freeze([
  "..oo..oo..",
  ".offooffo.",
  "offffffffo",
  "offffffffo",
  ".offffffo.",
  "..offffo..",
  "...offo...",
  "....oo....",
]);
const HUD_HEART_EMPTY_SPRITE = Object.freeze([
  "..oo..oo..",
  ".o..oo..o.",
  "o........o",
  "o........o",
  ".o......o.",
  "..o....o..",
  "...o..o...",
  "....oo....",
]);
const HUD_DIGIT_SPRITES = Object.freeze({
  0: Object.freeze([
    ".ffffff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ffffff.",
  ]),
  1: Object.freeze([
    "..ffff..",
    "...ff...",
    "...ff...",
    "...ff...",
    "...ff...",
    "...ff...",
    "...ff...",
    "...ff...",
    ".ffffff.",
  ]),
  2: Object.freeze([
    ".ffffff.",
    ".....ff.",
    ".....ff.",
    "...fff..",
    "..fff...",
    ".ff.....",
    ".ff.....",
    ".ff.....",
    ".ffffff.",
  ]),
  3: Object.freeze([
    ".ffffff.",
    ".....ff.",
    ".....ff.",
    "..ffff..",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".ffffff.",
  ]),
  4: Object.freeze([
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ffffff.",
    "....ff..",
    "....ff..",
    "....ff..",
    "....ff..",
    "....ff..",
  ]),
  5: Object.freeze([
    ".ffffff.",
    ".ff.....",
    ".ff.....",
    ".fffff..",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".ffffff.",
  ]),
  6: Object.freeze([
    ".ffffff.",
    ".ff.....",
    ".ff.....",
    ".fffff..",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ffffff.",
  ]),
  7: Object.freeze([
    ".ffffff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
  ]),
  8: Object.freeze([
    ".ffffff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ffffff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ffffff.",
  ]),
  9: Object.freeze([
    ".ffffff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ffffff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".ffffff.",
  ]),
  ".": Object.freeze([
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
    "...ff...",
    "...ff...",
    "........",
  ]),
  "%": Object.freeze([
    "ff....ff",
    "ff....ff",
    "..f..f..",
    "...ff...",
    "..f..f..",
    ".f..f...",
    "ff....ff",
    "ff....ff",
    "........",
  ]),
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function snapToGrid(value, grid = 4) {
  return Math.round(value / grid) * grid;
}

function toRgba(rgb, alpha) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function easeInOutSine(value) {
  return -(Math.cos(Math.PI * value) - 1) / 2;
}

function triangleWave(value) {
  const normalized = ((value % 1) + 1) % 1;
  return 1 - Math.abs(normalized * 2 - 1);
}

function getMagicDustLife(sceneTime, seed) {
  return (sceneTime * (seed.speed || 0.8) + seed.phase) % 1;
}

function getMagicDustAlpha(life) {
  if (life < 0.15) {
    return easeOutCubic(life / 0.15);
  }

  if (life < 0.54) {
    return 1;
  }

  return 1 - easeInOutSine((life - 0.54) / 0.46);
}

function getMagicDustSize(seed, life) {
  const baseSize = seed.size || 1;

  if (life < 0.18) {
    return Math.max(1, baseSize);
  }

  if (life < 0.46) {
    return Math.min(3, baseSize + 1);
  }

  if (life > 0.84) {
    return 1;
  }

  return baseSize;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function drawPixelCutRect(ctx, x, y, width, height, cut = 8, step = 4) {
  const safeCut = Math.min(cut, width / 2, height / 2);
  const safeStep = Math.min(step, safeCut);
  const left = snapToGrid(x, 1);
  const top = snapToGrid(y, 1);
  const right = left + snapToGrid(width, 1);
  const bottom = top + snapToGrid(height, 1);

  ctx.beginPath();
  ctx.moveTo(left + safeCut, top);
  ctx.lineTo(right - safeCut, top);
  ctx.lineTo(right - safeCut, top + safeStep);
  ctx.lineTo(right - safeStep, top + safeStep);
  ctx.lineTo(right - safeStep, top + safeCut);
  ctx.lineTo(right, top + safeCut);
  ctx.lineTo(right, bottom - safeCut);
  ctx.lineTo(right - safeStep, bottom - safeCut);
  ctx.lineTo(right - safeStep, bottom - safeStep);
  ctx.lineTo(right - safeCut, bottom - safeStep);
  ctx.lineTo(right - safeCut, bottom);
  ctx.lineTo(left + safeCut, bottom);
  ctx.lineTo(left + safeCut, bottom - safeStep);
  ctx.lineTo(left + safeStep, bottom - safeStep);
  ctx.lineTo(left + safeStep, bottom - safeCut);
  ctx.lineTo(left, bottom - safeCut);
  ctx.lineTo(left, top + safeCut);
  ctx.lineTo(left + safeStep, top + safeCut);
  ctx.lineTo(left + safeStep, top + safeStep);
  ctx.lineTo(left + safeCut, top + safeStep);
  ctx.closePath();
}

function createPixelTextSprite(text, options = {}) {
  if (DEBUG_DISABLE_PIXEL_TEXT_RASTERIZATION) {
    return null;
  }

  if (typeof createWebOffscreenCanvas !== "function") {
    return null;
  }

  const fontSize = options.fontSize || 8;
  const fontFamily = options.fontFamily || "sans-serif";
  const fontWeight = options.fontWeight || "700";
  const color = options.color || "#ffffff";
  const paddingX = options.paddingX === undefined ? 2 : options.paddingX;
  const paddingY = options.paddingY === undefined ? 2 : options.paddingY;
  const cacheKey = JSON.stringify({
    text,
    fontSize,
    fontFamily,
    fontWeight,
    color,
    paddingX,
    paddingY,
  });

  if (pixelTextCanvasCache.has(cacheKey)) {
    return pixelTextCanvasCache.get(cacheKey);
  }

  const measureCanvas = createWebOffscreenCanvas({
    type: "2d",
    width: 1,
    height: 1,
  });
  const measureCtx = measureCanvas.getContext("2d");
  measureCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

  const width = Math.max(1, Math.ceil(measureCtx.measureText(text).width) + paddingX * 2);
  const height = Math.max(1, Math.ceil(fontSize * 1.45) + paddingY * 2);
  const canvas = createWebOffscreenCanvas({
    type: "2d",
    width,
    height,
  });
  const offCtx = canvas.getContext("2d");
  offCtx.clearRect(0, 0, width, height);
  offCtx.imageSmoothingEnabled = false;
  offCtx.fillStyle = color;
  offCtx.textAlign = "center";
  offCtx.textBaseline = "middle";
  offCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  offCtx.fillText(text, width / 2, height / 2 + 0.5);

  const sprite = {
    canvas,
    width,
    height,
  };
  pixelTextCanvasCache.set(cacheKey, sprite);
  return sprite;
}

function drawPixelText(ctx, text, x, y, options = {}) {
  const align = options.align || "left";
  const valign = options.valign || "top";
  const scale = options.scale || 3;
  const color = options.color || "#ffffff";
  const shadowColor = options.shadowColor || "rgba(0, 0, 0, 0.34)";
  const shadowOffsetX = options.shadowOffsetX === undefined ? scale : options.shadowOffsetX;
  const shadowOffsetY = options.shadowOffsetY === undefined ? scale : options.shadowOffsetY;
  const sprite = createPixelTextSprite(text, {
    fontSize: options.fontSize || 8,
    fontFamily: options.fontFamily || "sans-serif",
    fontWeight: options.fontWeight || "700",
    color,
    paddingX: options.paddingX,
    paddingY: options.paddingY,
  });

  if (!sprite) {
    ctx.save();
    ctx.textAlign = align;
    ctx.textBaseline = valign === "middle" ? "middle" : valign === "bottom" ? "bottom" : "top";
    ctx.font = `${options.fontWeight || "700"} ${(options.fontSize || 8) * scale}px ${
      options.fontFamily || "sans-serif"
    }`;
    if (shadowColor) {
      ctx.fillStyle = shadowColor;
      ctx.fillText(text, snapToGrid(x + shadowOffsetX, 1), snapToGrid(y + shadowOffsetY, 1));
    }
    ctx.fillStyle = color;
    ctx.fillText(text, snapToGrid(x, 1), snapToGrid(y, 1));
    ctx.restore();
    return;
  }

  const drawWidth = sprite.width * scale;
  const drawHeight = sprite.height * scale;
  let drawX = x;
  let drawY = y;

  if (align === "center") {
    drawX -= drawWidth / 2;
  } else if (align === "right") {
    drawX -= drawWidth;
  }

  if (valign === "middle") {
    drawY -= drawHeight / 2;
  } else if (valign === "bottom") {
    drawY -= drawHeight;
  }

  drawX = snapToGrid(drawX, 1);
  drawY = snapToGrid(drawY, 1);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (shadowColor) {
    const shadowSprite = createPixelTextSprite(text, {
      fontSize: options.fontSize || 8,
      fontFamily: options.fontFamily || "sans-serif",
      fontWeight: options.fontWeight || "700",
      color: shadowColor,
      paddingX: options.paddingX,
      paddingY: options.paddingY,
    });
    if (shadowSprite) {
      ctx.drawImage(
        shadowSprite.canvas,
        drawX + shadowOffsetX,
        drawY + shadowOffsetY,
        drawWidth,
        drawHeight
      );
    }
  }
  ctx.drawImage(sprite.canvas, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
}

function drawCleanText(ctx, text, x, y, options = {}) {
  const content = String(text || "");
  if (!content) {
    return;
  }

  const align = options.align || "left";
  const valign = options.valign || "top";
  const fontSize = options.fontSize || 8;
  const fontFamily = options.fontFamily || "sans-serif";
  const fontWeight = options.fontWeight || "400";
  const color = options.color || "#ffffff";
  const shadowColor = options.shadowColor || null;
  const shadowOffsetX = options.shadowOffsetX === undefined ? 0 : options.shadowOffsetX;
  const shadowOffsetY = options.shadowOffsetY === undefined ? 0 : options.shadowOffsetY;

  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = valign === "middle" ? "middle" : valign === "bottom" ? "bottom" : "top";
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  if (shadowColor && (shadowOffsetX !== 0 || shadowOffsetY !== 0)) {
    ctx.fillStyle = shadowColor;
    ctx.fillText(content, snapToGrid(x + shadowOffsetX, 1), snapToGrid(y + shadowOffsetY, 1));
  }
  ctx.fillStyle = color;
  ctx.fillText(content, snapToGrid(x, 1), snapToGrid(y, 1));
  ctx.restore();
}

function drawCleanTrackedText(ctx, text, x, y, options = {}) {
  const content = String(text || "");
  if (!content) {
    return;
  }

  const chars = Array.from(content);
  const tracking = options.tracking === undefined ? 0 : options.tracking;
  const align = options.align || "left";
  const valign = options.valign || "top";
  const fontSize = options.fontSize || 8;
  const fontFamily = options.fontFamily || "sans-serif";
  const fontWeight = options.fontWeight || "400";
  const color = options.color || "#ffffff";
  const shadowColor = options.shadowColor || null;
  const shadowOffsetX = options.shadowOffsetX === undefined ? 0 : options.shadowOffsetX;
  const shadowOffsetY = options.shadowOffsetY === undefined ? 0 : options.shadowOffsetY;

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

  const charWidths = chars.map((char) => ctx.measureText(char).width);
  const totalWidth =
    charWidths.reduce((sum, width) => sum + width, 0) + tracking * Math.max(0, chars.length - 1);
  let drawX = x;
  let drawY = y;

  if (align === "center") {
    drawX -= totalWidth / 2;
  } else if (align === "right") {
    drawX -= totalWidth;
  }

  if (valign === "middle") {
    drawY -= fontSize * 0.5;
  } else if (valign === "bottom") {
    drawY -= fontSize;
  }

  let cursorX = snapToGrid(drawX, 1);
  const baselineY = snapToGrid(drawY, 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  chars.forEach((char, index) => {
    if (shadowColor) {
      ctx.fillStyle = shadowColor;
      ctx.fillText(char, cursorX + shadowOffsetX, baselineY + shadowOffsetY);
    }
    ctx.fillStyle = color;
    ctx.fillText(char, cursorX, baselineY);
    cursorX += charWidths[index] + tracking;
  });

  ctx.restore();
}

function drawSegmentedTrackedText(ctx, segments, x, y, options = {}) {
  const normalizedSegments = segments
    .map((segment) => ({
      text: segment?.text === undefined || segment?.text === null ? "" : String(segment.text),
      color: segment?.color || options.color || "#ffffff",
    }))
    .filter((segment) => segment.text);

  if (normalizedSegments.length === 0) {
    return;
  }

  const tracking = options.tracking === undefined ? 0 : options.tracking;
  const align = options.align || "left";
  const valign = options.valign || "top";
  const fontSize = options.fontSize || 8;
  const fontFamily = options.fontFamily || "sans-serif";
  const fontWeight = options.fontWeight || "400";
  const shadowColor = options.shadowColor || null;
  const shadowOffsetX = options.shadowOffsetX === undefined ? 0 : options.shadowOffsetX;
  const shadowOffsetY = options.shadowOffsetY === undefined ? 0 : options.shadowOffsetY;
  const glyphs = [];

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

  normalizedSegments.forEach((segment) => {
    Array.from(segment.text).forEach((char) => {
      glyphs.push({
        char,
        color: segment.color,
        width: ctx.measureText(char).width,
      });
    });
  });

  const totalWidth =
    glyphs.reduce((sum, glyph) => sum + glyph.width, 0) + tracking * Math.max(0, glyphs.length - 1);
  let drawX = x;
  let drawY = y;

  if (align === "center") {
    drawX -= totalWidth / 2;
  } else if (align === "right") {
    drawX -= totalWidth;
  }

  if (valign === "middle") {
    drawY -= fontSize * 0.5;
  } else if (valign === "bottom") {
    drawY -= fontSize;
  }

  let cursorX = snapToGrid(drawX, 1);
  const baselineY = snapToGrid(drawY, 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  glyphs.forEach((glyph) => {
    if (shadowColor) {
      ctx.fillStyle = shadowColor;
      ctx.fillText(glyph.char, cursorX + shadowOffsetX, baselineY + shadowOffsetY);
    }
    ctx.fillStyle = glyph.color;
    ctx.fillText(glyph.char, cursorX, baselineY);
    cursorX += glyph.width + tracking;
  });

  ctx.restore();
}

function getTrackedTextWidth(ctx, text, options = {}) {
  const content = String(text || "");
  if (!content) {
    return 0;
  }

  const chars = Array.from(content);
  const tracking = options.tracking === undefined ? 0 : options.tracking;
  const fontSize = options.fontSize || 8;
  const fontFamily = options.fontFamily || "sans-serif";
  const fontWeight = options.fontWeight || "400";

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const width =
    chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0) +
    tracking * Math.max(0, chars.length - 1);
  ctx.restore();
  return width;
}

function fitTextToWidth(ctx, text, maxWidth, options = {}) {
  const content = String(text || "");
  if (!content || getTrackedTextWidth(ctx, content, options) <= maxWidth) {
    return content;
  }

  const chars = Array.from(content);
  for (let count = chars.length - 1; count > 0; count -= 1) {
    const candidate = `${chars.slice(0, count).join("")}...`;
    if (getTrackedTextWidth(ctx, candidate, options) <= maxWidth) {
      return candidate;
    }
  }

  return "";
}

function getPixelTextSize(text, options = {}) {
  const scale = options.scale || 3;
  if (DEBUG_DISABLE_PIXEL_TEXT_RASTERIZATION) {
    if (typeof createWebOffscreenCanvas === "function") {
      const measureCanvas = createWebOffscreenCanvas({
        type: "2d",
        width: 1,
        height: 1,
      });
      const measureCtx = measureCanvas.getContext("2d");
      const fontSize = (options.fontSize || 8) * scale;
      measureCtx.font = `${options.fontWeight || "700"} ${fontSize}px ${
        options.fontFamily || "sans-serif"
      }`;
      return {
        width: Math.max(1, Math.ceil(measureCtx.measureText(text).width)),
        height: Math.max(1, Math.ceil(fontSize * 1.2)),
      };
    }

    return {
      width: text.length * (options.fontSize || 8) * scale * 0.72,
      height: (options.fontSize || 8) * scale * 1.2,
    };
  }

  const sprite = createPixelTextSprite(text, {
    fontSize: options.fontSize || 8,
    fontFamily: options.fontFamily || "sans-serif",
    fontWeight: options.fontWeight || "700",
    color: options.color || "#ffffff",
    paddingX: options.paddingX,
    paddingY: options.paddingY,
  });

  if (!sprite) {
    return {
      width: text.length * (options.fontSize || 8) * scale * 0.72,
      height: (options.fontSize || 8) * scale * 1.45,
    };
  }

  return {
    width: sprite.width * scale,
    height: sprite.height * scale,
  };
}

function drawPixelTrackedText(ctx, text, x, y, options = {}) {
  const tracking = options.tracking === undefined ? 0 : options.tracking;
  const chars = String(text || "").split("");

  if (tracking === 0 || chars.length <= 1) {
    drawPixelText(ctx, text, x, y, options);
    return;
  }

  const charSizes = chars.map((char) => getPixelTextSize(char, options));
  const totalWidth =
    charSizes.reduce((sum, size) => sum + size.width, 0) + tracking * (chars.length - 1);
  const maxHeight = charSizes.reduce(
    (maxHeightValue, size) => Math.max(maxHeightValue, size.height),
    0
  );
  let drawX = x;
  let drawY = y;

  if (options.align === "center") {
    drawX -= totalWidth / 2;
  } else if (options.align === "right") {
    drawX -= totalWidth;
  }

  if (options.valign === "middle") {
    drawY -= maxHeight / 2;
  } else if (options.valign === "bottom") {
    drawY -= maxHeight;
  }

  chars.forEach((char, index) => {
    drawPixelText(ctx, char, drawX, drawY, {
      ...options,
      align: "left",
      valign: "top",
    });
    drawX += charSizes[index].width + tracking;
  });
}

function drawPixelFilledText(ctx, text, x, y, options = {}) {
  const fillExpandX = options.fillExpandX === undefined ? 0 : options.fillExpandX;
  const fillExpandY = options.fillExpandY === undefined ? 0 : options.fillExpandY;
  const baseOptions = {
    ...options,
    shadowColor: null,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  };

  if (fillExpandX > 0) {
    drawPixelTrackedText(ctx, text, x - fillExpandX, y, baseOptions);
    drawPixelTrackedText(ctx, text, x + fillExpandX, y, baseOptions);
  }

  if (fillExpandY > 0) {
    drawPixelTrackedText(ctx, text, x, y - fillExpandY, baseOptions);
    drawPixelTrackedText(ctx, text, x, y + fillExpandY, baseOptions);
  }

  drawPixelTrackedText(ctx, text, x, y, baseOptions);
}

function drawPixelOutlinedText(ctx, text, x, y, options = {}) {
  const outlineStep = options.outlineStep === undefined ? 3 : options.outlineStep;
  const shadeOffsetY = options.shadeOffsetY === undefined ? outlineStep : options.shadeOffsetY;
  const fillExpandX = options.fillExpandX === undefined ? 0 : options.fillExpandX;
  const fillExpandY = options.fillExpandY === undefined ? 0 : options.fillExpandY;
  const baseOptions = {
    align: options.align || "center",
    valign: options.valign || "middle",
    scale: options.scale || 3,
    fontSize: options.fontSize || 8,
    fontFamily: options.fontFamily || "serif",
    fontWeight: options.fontWeight || "700",
    paddingX: options.paddingX,
    paddingY: options.paddingY,
    shadowColor: null,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  };
  const outlineColor = options.outlineColor || "rgba(14, 18, 26, 0.92)";
  const shadeColor = options.shadeColor || null;
  const outlineOffsets = [
    [-outlineStep, 0],
    [outlineStep, 0],
    [0, -outlineStep],
    [0, outlineStep],
    [-outlineStep, -outlineStep],
    [outlineStep, -outlineStep],
    [-outlineStep, outlineStep],
    [outlineStep, outlineStep],
  ];

  outlineOffsets.forEach(([offsetX, offsetY]) => {
    drawPixelText(ctx, text, x + offsetX, y + offsetY, {
      ...baseOptions,
      color: outlineColor,
    });
  });

  if (shadeColor) {
    drawPixelText(ctx, text, x, y + shadeOffsetY, {
      ...baseOptions,
      color: shadeColor,
    });
  }

  if (fillExpandX > 0) {
    drawPixelText(ctx, text, x - fillExpandX, y, {
      ...baseOptions,
      color: options.color || "#ffffff",
      shadowColor: null,
    });
    drawPixelText(ctx, text, x + fillExpandX, y, {
      ...baseOptions,
      color: options.color || "#ffffff",
      shadowColor: null,
    });
  }

  if (fillExpandY > 0) {
    drawPixelText(ctx, text, x, y - fillExpandY, {
      ...baseOptions,
      color: options.color || "#ffffff",
      shadowColor: null,
    });
    drawPixelText(ctx, text, x, y + fillExpandY, {
      ...baseOptions,
      color: options.color || "#ffffff",
      shadowColor: null,
    });
  }

  drawPixelText(ctx, text, x, y, {
    ...baseOptions,
    color: options.color || "#ffffff",
    shadowColor: options.shadowColor || null,
    shadowOffsetX: options.shadowOffsetX,
    shadowOffsetY: options.shadowOffsetY,
  });
}

function drawPixelTrackedOutlinedText(ctx, text, x, y, options = {}) {
  const tracking = options.tracking === undefined ? 0 : options.tracking;
  const chars = String(text || "").split("");

  if (tracking === 0 || chars.length <= 1) {
    drawPixelOutlinedText(ctx, text, x, y, options);
    return;
  }

  const charSizes = chars.map((char) => getPixelTextSize(char, options));
  const totalWidth =
    charSizes.reduce((sum, size) => sum + size.width, 0) + tracking * (chars.length - 1);
  const maxHeight = charSizes.reduce(
    (maxHeightValue, size) => Math.max(maxHeightValue, size.height),
    0
  );
  let drawX = x;
  let drawY = y;

  if (options.align === "center") {
    drawX -= totalWidth / 2;
  } else if (options.align === "right") {
    drawX -= totalWidth;
  }

  if (options.valign === "middle") {
    drawY -= maxHeight / 2;
  } else if (options.valign === "bottom") {
    drawY -= maxHeight;
  }

  chars.forEach((char, index) => {
    drawPixelOutlinedText(ctx, char, drawX, drawY, {
      ...options,
      align: "left",
      valign: "top",
    });
    drawX += charSizes[index].width + tracking;
  });
}

function drawPixelJudgementText(ctx, text, x, y, options = {}) {
  const highlightOffsetY = options.highlightOffsetY === undefined ? -2 : options.highlightOffsetY;
  const darkOffsetY = options.darkOffsetY === undefined ? 1 : options.darkOffsetY;
  const darkOffsetX = options.darkOffsetX === undefined ? 1 : options.darkOffsetX;
  const deepOffsetY = options.deepOffsetY === undefined ? darkOffsetY + 1 : options.deepOffsetY;
  const deepOffsetX = options.deepOffsetX === undefined ? darkOffsetX + 1 : options.deepOffsetX;
  const baseOptions = {
    align: options.align || "center",
    valign: options.valign || "middle",
    scale: options.scale || 3,
    fontSize: options.fontSize || 8,
    fontFamily: options.fontFamily || "sans-serif",
    fontWeight: options.fontWeight || "900",
    paddingX: options.paddingX,
    paddingY: options.paddingY,
    shadowColor: null,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    tracking: options.tracking === undefined ? 0 : options.tracking,
  };

  if (options.highlightColor) {
    drawPixelTrackedText(ctx, text, x, y + highlightOffsetY, {
      ...baseOptions,
      color: options.highlightColor,
    });
  }

  if (options.outlineColor) {
    drawPixelTrackedText(ctx, text, x + darkOffsetX, y, {
      ...baseOptions,
      color: options.outlineColor,
    });
    drawPixelTrackedText(ctx, text, x + darkOffsetX, y + darkOffsetY, {
      ...baseOptions,
      color: options.outlineColor,
    });
    drawPixelTrackedText(ctx, text, x, y + darkOffsetY, {
      ...baseOptions,
      color: options.outlineColor,
    });
  }

  if (options.deepColor) {
    drawPixelTrackedText(ctx, text, x + darkOffsetX, y + deepOffsetY, {
      ...baseOptions,
      color: options.deepColor,
    });
    drawPixelTrackedText(ctx, text, x + deepOffsetX, y + darkOffsetY, {
      ...baseOptions,
      color: options.deepColor,
    });
  }

  drawPixelTrackedText(ctx, text, x, y, {
    ...baseOptions,
    color: options.color || "#ffffff",
  });
}

function drawHudSoftPlate(ctx, x, y, width, height, options = {}) {
  const left = snapToGrid(x, 1);
  const top = snapToGrid(y, 1);
  const plateWidth = snapToGrid(width, 1);
  const plateHeight = snapToGrid(height, 1);
  const radius = options.radius === undefined ? 10 : options.radius;

  ctx.save();
  ctx.fillStyle = options.shadowColor || "rgba(4, 8, 16, 0.12)";
  drawRoundedRect(ctx, left, top + 2, plateWidth, plateHeight, radius);
  ctx.fill();

  ctx.fillStyle = options.fillColor || "rgba(39, 52, 77, 0.35)";
  drawRoundedRect(ctx, left, top, plateWidth, plateHeight, radius);
  ctx.fill();
  ctx.restore();
}

function drawPixelDiamond(ctx, x, y, radius, color, alpha = 1) {
  const centerX = snapToGrid(x, 1);
  const centerY = snapToGrid(y, 1);
  const safeRadius = Math.max(1, Math.round(radius));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;

  for (let row = -safeRadius; row <= safeRadius; row += 1) {
    const span = safeRadius - Math.abs(row);
    ctx.fillRect(centerX - span, centerY + row, span * 2 + 1, 1);
  }

  ctx.restore();
}

function drawPixelSpark(ctx, x, y, size, outerColor, innerColor, alpha = 1) {
  const centerX = snapToGrid(x, 1);
  const centerY = snapToGrid(y, 1);
  const arm = Math.max(2, Math.round(size));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = outerColor;
  ctx.fillRect(centerX - arm, centerY, arm * 2 + 1, 1);
  ctx.fillRect(centerX, centerY - arm, 1, arm * 2 + 1);
  drawPixelDiamond(ctx, centerX, centerY, Math.max(1, arm - 1), innerColor, alpha);
  ctx.restore();
}

function drawChunkyPixelSpark(ctx, x, y, size, outerColor, innerColor, alpha = 1) {
  const centerX = snapToGrid(x, 1);
  const centerY = snapToGrid(y, 1);
  const arm = Math.max(3, Math.round(size));
  const band = arm >= 6 ? 4 : arm >= 4 ? 3 : 2;
  const halfBand = Math.floor(band / 2);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = outerColor;
  ctx.fillRect(centerX - arm, centerY - halfBand, arm * 2 + 1, band);
  ctx.fillRect(centerX - halfBand, centerY - arm, band, arm * 2 + 1);
  drawPixelDiamond(ctx, centerX, centerY, Math.max(2, arm - 1), innerColor, alpha);
  ctx.restore();
}

function drawPixelDivider(ctx, centerX, y, width, outerColor, innerColor, alpha = 1) {
  const totalWidth = snapToGrid(width, 1);
  const halfWidth = totalWidth / 2;
  const diamondGap = 18;
  const lineY = snapToGrid(y, 1);
  const leftStart = snapToGrid(centerX - halfWidth, 1);
  const leftEnd = snapToGrid(centerX - diamondGap, 1);
  const rightStart = snapToGrid(centerX + diamondGap, 1);
  const rightEnd = snapToGrid(centerX + halfWidth, 1);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = outerColor;
  ctx.fillRect(leftStart, lineY, leftEnd - leftStart, 2);
  ctx.fillRect(rightStart, lineY, rightEnd - rightStart, 2);
  ctx.fillRect(leftStart + 10, lineY - 4, 18, 2);
  ctx.fillRect(rightEnd - 28, lineY - 4, 18, 2);
  ctx.fillRect(leftStart + 2, lineY + 4, 12, 2);
  ctx.fillRect(rightEnd - 14, lineY + 4, 12, 2);
  drawPixelDiamond(ctx, centerX, lineY + 1, 8, outerColor, alpha);
  drawPixelDiamond(ctx, centerX, lineY + 1, 5, innerColor, alpha);
  drawPixelSpark(ctx, leftStart + 2, lineY + 1, 3, outerColor, innerColor, alpha * 0.92);
  drawPixelSpark(ctx, rightEnd - 2, lineY + 1, 3, outerColor, innerColor, alpha * 0.92);
  ctx.restore();
}

function getPixelSpriteMatrixSize(spriteRows = [], scale = 1) {
  const width = spriteRows.reduce((maxWidth, row) => Math.max(maxWidth, row.length), 0);
  return {
    width: width * scale,
    height: spriteRows.length * scale,
  };
}

function drawPixelSpriteMatrix(ctx, spriteRows, x, y, scale, palette, alpha = 1) {
  const drawX = snapToGrid(x, 1);
  const drawY = snapToGrid(y, 1);
  const pixelSize = Math.max(1, Math.round(scale));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;

  spriteRows.forEach((row, rowIndex) => {
    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const key = row[columnIndex];
      const color = palette[key];
      if (!color) {
        continue;
      }
      ctx.fillStyle = color;
      ctx.fillRect(
        drawX + columnIndex * pixelSize,
        drawY + rowIndex * pixelSize,
        pixelSize,
        pixelSize
      );
    }
  });

  ctx.restore();
}

function drawScaledPixelSpriteMatrix(ctx, spriteRows, x, y, scale, palette, alpha = 1) {
  const drawX = snapToGrid(x, 1);
  const drawY = snapToGrid(y, 1);
  const pixelSize = Math.max(1, scale);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;

  spriteRows.forEach((row, rowIndex) => {
    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const key = row[columnIndex];
      const color = palette[key];
      if (!color) {
        continue;
      }
      const left = snapToGrid(drawX + columnIndex * pixelSize, 1);
      const top = snapToGrid(drawY + rowIndex * pixelSize, 1);
      const right = snapToGrid(drawX + (columnIndex + 1) * pixelSize, 1);
      const bottom = snapToGrid(drawY + (rowIndex + 1) * pixelSize, 1);
      ctx.fillStyle = color;
      ctx.fillRect(left, top, Math.max(1, right - left), Math.max(1, bottom - top));
    }
  });

  ctx.restore();
}

function drawPixelOvalShadow(ctx, centerX, centerY, radiusX, radiusY, color, alpha = 1) {
  const baseX = snapToGrid(centerX, 1);
  const baseY = snapToGrid(centerY, 1);
  const safeRadiusX = Math.max(1, Math.round(radiusX));
  const safeRadiusY = Math.max(1, Math.round(radiusY));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;

  for (let row = -safeRadiusY; row <= safeRadiusY; row += 1) {
    const normalized = 1 - Math.abs(row) / (safeRadiusY + 0.001);
    const span = Math.max(1, Math.round(safeRadiusX * Math.sqrt(Math.max(0, normalized))));
    ctx.fillRect(baseX - span, baseY + row, span * 2 + 1, 1);
  }

  ctx.restore();
}

function drawPixelEllipseFill(ctx, centerX, centerY, radiusX, radiusY, color, alpha = 1) {
  const baseX = snapToGrid(centerX, 1);
  const baseY = snapToGrid(centerY, 1);
  const safeRadiusX = Math.max(1, Math.round(radiusX));
  const safeRadiusY = Math.max(1, Math.round(radiusY));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = color;

  for (let row = -safeRadiusY; row <= safeRadiusY; row += 1) {
    const ratio = 1 - (row * row) / (safeRadiusY * safeRadiusY || 1);
    if (ratio < 0) {
      continue;
    }
    const span = Math.max(1, Math.round(safeRadiusX * Math.sqrt(ratio)));
    ctx.fillRect(baseX - span, baseY + row, span * 2 + 1, 1);
  }

  ctx.restore();
}

function drawPixelEllipseStroke(ctx, centerX, centerY, radiusX, radiusY, thickness, color, alpha = 1) {
  const baseX = snapToGrid(centerX, 1);
  const baseY = snapToGrid(centerY, 1);
  const safeRadiusX = Math.max(2, Math.round(radiusX));
  const safeRadiusY = Math.max(2, Math.round(radiusY));
  const safeThickness = Math.max(1, Math.round(thickness));
  const innerRadiusX = Math.max(1, safeRadiusX - safeThickness);
  const innerRadiusY = Math.max(1, safeRadiusY - safeThickness);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = color;

  for (let row = -safeRadiusY; row <= safeRadiusY; row += 1) {
    const outerRatio = 1 - (row * row) / (safeRadiusY * safeRadiusY || 1);
    if (outerRatio < 0) {
      continue;
    }

    const outerSpan = Math.max(1, Math.round(safeRadiusX * Math.sqrt(outerRatio)));
    const innerRatio = 1 - (row * row) / (innerRadiusY * innerRadiusY || 1);
    const innerSpan = innerRatio > 0 ? Math.round(innerRadiusX * Math.sqrt(innerRatio)) : 0;
    const y = baseY + row;

    if (innerSpan <= 0) {
      ctx.fillRect(baseX - outerSpan, y, outerSpan * 2 + 1, 1);
      continue;
    }

    const bandWidth = Math.max(1, outerSpan - innerSpan);
    ctx.fillRect(baseX - outerSpan, y, bandWidth, 1);
    ctx.fillRect(baseX + innerSpan + 1, y, bandWidth, 1);
  }

  ctx.restore();
}

function drawPixelStampRing(
  ctx,
  centerX,
  centerY,
  radiusX,
  radiusY,
  stampSize,
  color,
  alpha = 1,
  stepCount = 16,
  startAngle = 0
) {
  const safeRadiusX = Math.max(1, Math.round(radiusX));
  const safeRadiusY = Math.max(1, Math.round(radiusY));
  const safeStampSize = Math.max(1, Math.round(stampSize));
  const halfStamp = Math.floor(safeStampSize / 2);
  const visited = new Set();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = color;

  for (let index = 0; index < stepCount; index += 1) {
    const angle = startAngle + (index / stepCount) * Math.PI * 2;
    const drawX = snapToGrid(centerX + Math.cos(angle) * safeRadiusX, 1);
    const drawY = snapToGrid(centerY + Math.sin(angle) * safeRadiusY, 1);
    const key = `${drawX}:${drawY}`;

    if (visited.has(key)) {
      continue;
    }
    visited.add(key);
    ctx.fillRect(drawX - halfStamp, drawY - halfStamp, safeStampSize, safeStampSize);
  }

  ctx.restore();
}

function drawMagicEllipseBorder(ctx, centerX, centerY, radiusX, radiusY, pulse) {
  const borderPulse = 0.9 + pulse * 0.1;

  drawPixelEllipseStroke(
    ctx,
    centerX,
    centerY,
    radiusX + 3,
    radiusY + 2,
    2,
    "#EAB14A",
    0.28 * borderPulse
  );
  drawPixelEllipseStroke(
    ctx,
    centerX,
    centerY,
    radiusX + 1,
    radiusY,
    1,
    "#FFF0B0",
    0.18 * borderPulse
  );
  drawPixelEllipseStroke(
    ctx,
    centerX,
    centerY,
    radiusX - 2,
    Math.max(4, radiusY - 2),
    1,
    "#C9832F",
    0.12 * borderPulse
  );
}

function drawMagicEllipseSweep(ctx, centerX, centerY, radiusX, radiusY, sceneTime) {
  const safeRadiusX = Math.max(2, Math.round(radiusX + 3));
  const safeRadiusY = Math.max(2, Math.round(radiusY + 2));
  const cycle = (sceneTime / 4.8) % 1;
  const sweepCenter = cycle * Math.PI * 2;
  const sweepArc = Math.PI * 2 * 0.09;
  const stepCount = 18;
  const visited = new Set();

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  for (let index = 0; index <= stepCount; index += 1) {
    const localProgress = index / stepCount;
    const localOffset = (localProgress - 0.5) * sweepArc;
    const angle = sweepCenter + localOffset;
    const edgeFade = 1 - Math.abs(localProgress - 0.5) * 2;
    const alpha = easeInOutSine(Math.max(0, edgeFade)) * 0.42;
    const drawX = snapToGrid(centerX + Math.cos(angle) * safeRadiusX, 1);
    const drawY = snapToGrid(centerY + Math.sin(angle) * safeRadiusY, 1);
    const key = `${drawX}:${drawY}`;

    if (visited.has(key) || alpha <= 0.03) {
      continue;
    }
    visited.add(key);

    ctx.globalAlpha = alpha * 0.48;
    ctx.fillStyle = "#FFE08A";
    ctx.fillRect(drawX - 1, drawY, 3, 1);
    ctx.fillRect(drawX, drawY - 1, 1, 3);

    ctx.globalAlpha = alpha * 0.78;
    ctx.fillStyle = "#FFF9D6";
    ctx.fillRect(drawX, drawY, 1, 1);
  }

  ctx.restore();
}

function drawMagicEnergyLine(ctx, options) {
  const {
    left,
    y,
    width,
    sceneTime,
    pulse,
  } = options;
  const lineLeft = snapToGrid(left, 1);
  const lineY = snapToGrid(y, 1);
  const lineWidth = Math.max(1, snapToGrid(width, 1));
  const centerY = lineY + 3;
  const diamondLeft = lineLeft;
  const diamondRight = lineLeft + lineWidth;
  const holdPastNode = 12;
  const taperLength = 26;
  const taperSteps = 7;
  const fullLeft = snapToGrid(diamondLeft - holdPastNode, 1);
  const fullRight = snapToGrid(diamondRight + holdPastNode, 1);
  const coreLeft = snapToGrid(fullLeft - taperLength, 1);
  const coreRight = snapToGrid(fullRight + taperLength, 1);
  const coreWidth = Math.max(8, coreRight - coreLeft);
  const shimmerCycle = (sceneTime / 2.05) % 1;
  const shimmerEase = easeInOutSine(shimmerCycle);
  const shimmerAlpha = triangleWave(shimmerCycle) * 0.16;
  const shimmerWidth = Math.max(10, Math.round(lineWidth * 0.08));
  const shimmerX = snapToGrid(
    coreLeft - shimmerWidth + (coreWidth + shimmerWidth * 2) * shimmerEase,
    1
  );

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  ctx.globalAlpha = 0.13 + pulse * 0.03;
  ctx.fillStyle = "#5A3515";
  ctx.fillRect(fullLeft - 2, centerY + 5, fullRight - fullLeft + 4, 1);

  const glowSegments = [
    { row: -4, inset: 5, step: 25, width: 15, height: 1, alpha: 0.14, offset: 0 },
    { row: -3, inset: 4, step: 17, width: 13, height: 1, alpha: 0.24, offset: 7 },
    { row: -2, inset: 3, step: 12, width: 11, height: 1, alpha: 0.38, offset: 2 },
    { row: -1, inset: 2, step: 11, width: 12, height: 1, alpha: 0.42, offset: 5 },
    { row: 2, inset: 2, step: 11, width: 12, height: 1, alpha: 0.42, offset: 1 },
    { row: 3, inset: 3, step: 13, width: 12, height: 1, alpha: 0.34, offset: 8 },
    { row: 4, inset: 5, step: 19, width: 14, height: 1, alpha: 0.22, offset: 3 },
    { row: 5, inset: 7, step: 28, width: 14, height: 1, alpha: 0.12, offset: 12 },
  ];

  glowSegments.forEach((segment) => {
    ctx.globalAlpha = segment.alpha * (0.92 + pulse * 0.16);
    ctx.fillStyle = Math.abs(segment.row) <= 2 ? "#FFE08A" : "#D69A3B";

    for (
      let x = fullLeft + segment.inset + segment.offset;
      x < fullRight - segment.inset;
      x += segment.step
    ) {
      const distanceFromCenter = Math.abs(x + segment.width / 2 - (lineLeft + lineWidth / 2));
      const centerFalloff = 1 - clamp(distanceFromCenter / (lineWidth / 2), 0, 1) * 0.25;
      ctx.globalAlpha = segment.alpha * centerFalloff * (0.92 + pulse * 0.16);
      ctx.fillRect(snapToGrid(x, 1), centerY + segment.row, segment.width, segment.height);
    }
  });

  const drawTaperedEnergyLayer = (segment) => {
    const bodyLeft = fullLeft + segment.inset;
    const bodyRight = fullRight - segment.inset;
    const bodyWidth = Math.max(1, bodyRight - bodyLeft);
    const sideTaperLength = Math.max(4, Math.round(taperLength * (segment.taperScale || 1)));
    const stepCount = segment.taperSteps || taperSteps;
    const stepWidth = Math.max(2, Math.ceil(sideTaperLength / stepCount));
    const minAlphaRatio = segment.minAlphaRatio === undefined ? 0.08 : segment.minAlphaRatio;
    const minHeight = segment.minHeight === undefined ? 0 : segment.minHeight;

    ctx.fillStyle = segment.color;
    ctx.globalAlpha = segment.alpha;
    ctx.fillRect(bodyLeft, centerY + segment.yOffset, bodyWidth, segment.height);

    for (let step = 0; step < stepCount; step += 1) {
      const progress = (step + 0.5) / stepCount;
      const easedProgress = easeInOutSine(progress);
      const alpha = segment.alpha * lerp(0.78, minAlphaRatio, easedProgress);
      let segmentHeight = segment.height;

      if (alpha <= 0.025) {
        continue;
      }

      if (segment.height > minHeight && progress > 0.52) {
        segmentHeight = Math.max(minHeight, segment.height - 1);
      }

      if (segmentHeight <= 0) {
        continue;
      }

      const taperY =
        centerY + segment.yOffset + Math.max(0, Math.floor((segment.height - segmentHeight) / 2));
      const leftX = bodyLeft - stepWidth * (step + 1);
      const rightX = bodyRight + stepWidth * step;

      ctx.globalAlpha = alpha;
      ctx.fillRect(leftX, taperY, stepWidth, segmentHeight);
      ctx.fillRect(rightX, taperY, stepWidth, segmentHeight);
    }
  };

  [
    {
      inset: 0,
      alpha: 0.98,
      color: "#FFF3BE",
      yOffset: 0,
      height: 2,
      minHeight: 1,
      minAlphaRatio: 0.16,
      taperScale: 1,
    },
    {
      inset: 1,
      alpha: 0.82,
      color: "#FFE08A",
      yOffset: -1,
      height: 1,
      minHeight: 1,
      minAlphaRatio: 0.1,
      taperScale: 0.88,
    },
    {
      inset: 1,
      alpha: 0.72,
      color: "#FFE08A",
      yOffset: 2,
      height: 1,
      minHeight: 1,
      minAlphaRatio: 0.1,
      taperScale: 0.88,
    },
    {
      inset: 4,
      alpha: 0.42,
      color: "#F3B54E",
      yOffset: -2,
      height: 1,
      minHeight: 0,
      minAlphaRatio: 0.05,
      taperScale: 0.66,
    },
    {
      inset: 5,
      alpha: 0.34,
      color: "#F3B54E",
      yOffset: 3,
      height: 1,
      minHeight: 0,
      minAlphaRatio: 0.04,
      taperScale: 0.58,
    },
  ].forEach(drawTaperedEnergyLayer);

  if (shimmerAlpha > 0.015) {
    ctx.beginPath();
    ctx.rect(coreLeft - 2, centerY - 3, coreWidth + 4, 7);
    ctx.clip();
    ctx.globalAlpha = shimmerAlpha;
    ctx.fillStyle = "#FFF9DA";
    ctx.fillRect(shimmerX, centerY - 1, shimmerWidth, 3);
    ctx.globalAlpha = shimmerAlpha * 0.68;
    ctx.fillStyle = "#FFE79A";
    ctx.fillRect(shimmerX + 2, centerY - 2, Math.max(4, shimmerWidth - 4), 1);
    ctx.fillRect(shimmerX + 3, centerY + 2, Math.max(3, shimmerWidth - 6), 1);
    ctx.globalAlpha = shimmerAlpha * 0.24;
    ctx.fillStyle = "#FFF0B0";
    ctx.fillRect(shimmerX - 4, centerY - 3, shimmerWidth + 8, 1);
    ctx.fillRect(shimmerX - 3, centerY + 3, shimmerWidth + 6, 1);
  }

  ctx.restore();
}

function drawPixelPanelSurface(ctx, x, y, width, height, options = {}) {
  const left = snapToGrid(x, 1);
  const top = snapToGrid(y, 1);
  const panelWidth = snapToGrid(width, 1);
  const panelHeight = snapToGrid(height, 1);
  const cut = options.cut === undefined ? 8 : options.cut;
  const step = options.step === undefined ? 2 : options.step;
  const shadowOffset = options.shadowOffset === undefined ? 4 : options.shadowOffset;
  const outerInset = options.outerInset === undefined ? 2 : options.outerInset;
  const innerInset = options.innerInset === undefined ? 4 : options.innerInset;
  const contentInset = options.contentInset === undefined ? 6 : options.contentInset;

  ctx.save();

  if (shadowOffset > 0) {
    drawPixelCutRect(
      ctx,
      left + shadowOffset,
      top + shadowOffset,
      panelWidth,
      panelHeight,
      cut,
      step
    );
    ctx.fillStyle = options.shadowColor || UI_PANEL_DROP;
    ctx.fill();
  }

  drawPixelCutRect(ctx, left, top, panelWidth, panelHeight, cut, step);
  ctx.fillStyle = options.outerColor || UI_GOLD_OUTER;
  ctx.fill();

  if (outerInset > 0) {
    drawPixelCutRect(
      ctx,
      left + outerInset,
      top + outerInset,
      panelWidth - outerInset * 2,
      panelHeight - outerInset * 2,
      Math.max(4, cut - 2),
      step
    );
    ctx.fillStyle = options.faceColor || UI_PANEL_BLUE;
    ctx.fill();
  }

  if (innerInset > 0) {
    drawPixelCutRect(
      ctx,
      left + innerInset,
      top + innerInset,
      panelWidth - innerInset * 2,
      panelHeight - innerInset * 2,
      Math.max(4, cut - 4),
      step
    );
    ctx.fillStyle = options.innerColor || UI_GOLD_INNER;
    ctx.fill();
  }

  if (contentInset > 0) {
    drawPixelCutRect(
      ctx,
      left + contentInset,
      top + contentInset,
      panelWidth - contentInset * 2,
      panelHeight - contentInset * 2,
      Math.max(2, cut - 4),
      step
    );
    ctx.fillStyle = options.contentColor || UI_PANEL_DEEP;
    ctx.fill();
  }

  ctx.restore();
}

function drawPixelHeart(ctx, x, y, filled, scale = 3, alpha = 1) {
  drawScaledPixelSpriteMatrix(
    ctx,
    filled ? HUD_HEART_FILLED_SPRITE : HUD_HEART_EMPTY_SPRITE,
    x,
    y,
    scale,
    filled
      ? {
          o: HUD_HEART_OUTLINE_COLOR,
          f: "#ef6a7d",
        }
      : {
          o: HUD_HEART_OUTLINE_COLOR,
        },
    alpha
  );
}

function getHudDigitSprite(char) {
  return HUD_DIGIT_SPRITES[char] || null;
}

function getHudDigitTextMetrics(text, scale = HUD_SPRITE_DIGIT_SCALE, gap = HUD_SPRITE_DIGIT_GAP) {
  const content = String(text || "");
  let width = 0;
  let height = 0;

  for (let index = 0; index < content.length; index += 1) {
    const sprite = getHudDigitSprite(content[index]);
    if (!sprite) {
      continue;
    }

    const size = getPixelSpriteMatrixSize(sprite, scale);
    width += size.width;
    height = Math.max(height, size.height);

    if (index < content.length - 1) {
      width += gap;
    }
  }

  return {
    width,
    height,
  };
}

function drawHudDigitSprites(ctx, text, x, y, options = {}) {
  const content = String(text || "");
  if (!content) {
    return;
  }

  const align = options.align || "left";
  const valign = options.valign || "top";
  const scale = options.scale || HUD_SPRITE_DIGIT_SCALE;
  const gap = options.gap === undefined ? HUD_SPRITE_DIGIT_GAP : options.gap;
  const color = options.color || UI_BRIGHT_TEXT;
  const shadowColor = options.shadowColor || UI_WARM_SHADOW;
  const shadowOffsetX =
    options.shadowOffsetX === undefined
      ? HUD_SPRITE_DIGIT_SHADOW_OFFSET_X
      : options.shadowOffsetX;
  const shadowOffsetY =
    options.shadowOffsetY === undefined
      ? HUD_SPRITE_DIGIT_SHADOW_OFFSET_Y
      : options.shadowOffsetY;
  const metrics = getHudDigitTextMetrics(content, scale, gap);
  let drawX = snapToGrid(x, 1);
  let drawY = snapToGrid(y, 1);

  if (align === "center") {
    drawX -= Math.round(metrics.width / 2);
  } else if (align === "right") {
    drawX -= metrics.width;
  }

  if (valign === "middle") {
    drawY -= Math.round(metrics.height / 2);
  } else if (valign === "bottom") {
    drawY -= metrics.height;
  }

  let cursorX = drawX;
  for (let index = 0; index < content.length; index += 1) {
    const sprite = getHudDigitSprite(content[index]);
    if (!sprite) {
      continue;
    }

    const size = getPixelSpriteMatrixSize(sprite, scale);
    if (shadowColor && (shadowOffsetX !== 0 || shadowOffsetY !== 0)) {
      drawPixelSpriteMatrix(
        ctx,
        sprite,
        cursorX + shadowOffsetX,
        drawY + shadowOffsetY,
        scale,
        { f: shadowColor }
      );
    }
    drawPixelSpriteMatrix(ctx, sprite, cursorX, drawY, scale, { f: color });
    cursorX += size.width + gap;
  }
}

function drawHudDigitText(ctx, text, x, y, options = {}) {
  const content = String(text || "");
  if (options.useSpriteDigits) {
    drawHudDigitSprites(ctx, content, x, y, options);
    return;
  }
  const align = options.align || "left";
  const valign = options.valign || "top";
  const fillColor = options.color || UI_BRIGHT_TEXT;
  const fontSize = options.fontSize || HUD_CLEAN_DIGIT_FONT_SIZE;
  const fontFamily = options.fontFamily || PIXEL_FONT_EN_FAMILY;
  const fontWeight = options.fontWeight || CLEAN_DIGIT_FONT_WEIGHT;
  const shadowColor = options.shadowColor || null;
  const shadowOffsetX = options.shadowOffsetX === undefined ? 0 : options.shadowOffsetX;
  const shadowOffsetY = options.shadowOffsetY === undefined ? 0 : options.shadowOffsetY;

  drawCleanText(ctx, content, x, y, {
    align,
    valign,
    fontSize,
    fontFamily,
    fontWeight,
    color: fillColor,
    shadowColor,
    shadowOffsetX,
    shadowOffsetY,
  });
}

function getHudFontDigitTextMetrics(ctx, text, options = {}) {
  const content = String(text || "");
  const fontSize = options.fontSize || HUD_SCORE_FONT_SIZE;
  const fontFamily = options.fontFamily || PIXEL_FONT_EN_FAMILY;
  const fontWeight = options.fontWeight || CLEAN_DIGIT_FONT_WEIGHT;

  if (!content) {
    return {
      width: 0,
      height: Math.max(1, Math.ceil(fontSize * HUD_SCORE_FONT_VISUAL_HEIGHT_RATIO)),
      ascent: Math.max(1, Math.ceil(fontSize * HUD_SCORE_FONT_VISUAL_HEIGHT_RATIO)),
      descent: 0,
    };
  }

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(content);
  ctx.restore();

  const measuredHeight =
    Number.isFinite(metrics.actualBoundingBoxAscent) &&
    Number.isFinite(metrics.actualBoundingBoxDescent) &&
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent > 0
      ? metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
      : fontSize * HUD_SCORE_FONT_VISUAL_HEIGHT_RATIO;
  const ascent =
    Number.isFinite(metrics.actualBoundingBoxAscent) && metrics.actualBoundingBoxAscent > 0
      ? metrics.actualBoundingBoxAscent
      : measuredHeight;
  const descent =
    Number.isFinite(metrics.actualBoundingBoxDescent) && metrics.actualBoundingBoxDescent > 0
      ? metrics.actualBoundingBoxDescent
      : 0;

  return {
    width: metrics.width || 0,
    height: Math.max(1, Math.ceil(measuredHeight)),
    ascent,
    descent,
  };
}

function drawHudFontDigitText(ctx, text, x, y, options = {}) {
  const content = String(text || "");
  if (!content) {
    return;
  }

  const align = options.align || "left";
  const valign = options.valign || "top";
  const fontSize = options.fontSize || HUD_SCORE_FONT_SIZE;
  const fontFamily = options.fontFamily || PIXEL_FONT_EN_FAMILY;
  const fontWeight = options.fontWeight || CLEAN_DIGIT_FONT_WEIGHT;
  const color = options.color || UI_BRIGHT_TEXT;
  const shadowColor = options.shadowColor || null;
  const shadowOffsetX =
    options.shadowOffsetX === undefined ? HUD_SPRITE_DIGIT_SHADOW_OFFSET_X : options.shadowOffsetX;
  const shadowOffsetY =
    options.shadowOffsetY === undefined ? HUD_SPRITE_DIGIT_SHADOW_OFFSET_Y : options.shadowOffsetY;
  const metrics = getHudFontDigitTextMetrics(ctx, content, {
    fontSize,
    fontFamily,
    fontWeight,
  });
  let drawX = x;
  let drawY = y;

  if (align === "center") {
    drawX -= metrics.width / 2;
  } else if (align === "right") {
    drawX -= metrics.width;
  }

  if (valign === "middle") {
    drawY -= metrics.height / 2;
  } else if (valign === "bottom") {
    drawY -= metrics.height;
  }

  const baselineX = snapToGrid(drawX, 1);
  const baselineY = snapToGrid(drawY + metrics.ascent, 1);

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  if (shadowColor && (shadowOffsetX !== 0 || shadowOffsetY !== 0)) {
    ctx.fillStyle = shadowColor;
    ctx.fillText(content, baselineX + shadowOffsetX, baselineY + shadowOffsetY);
  }
  ctx.fillStyle = color;
  ctx.fillText(content, baselineX, baselineY);
  ctx.restore();
}

function drawHudScoreValue(ctx, score, x, y, options = {}) {
  const numericScore = Math.max(0, Math.round(Number(score) || 0));
  const scoreText = String(numericScore);
  const fontSize = options.fontSize || HUD_SCORE_FONT_SIZE;
  const fontFamily = options.fontFamily || PIXEL_FONT_EN_FAMILY;
  const fontWeight = options.fontWeight || CLEAN_DIGIT_FONT_WEIGHT;

  if (scoreText.length >= HUD_SCORE_SLOT_TEXT.length) {
    drawHudFontDigitText(ctx, scoreText, x, y, {
      ...options,
      fontSize,
      fontFamily,
      fontWeight,
      color: options.color || UI_BRIGHT_TEXT,
      shadowColor: options.shadowColor || UI_WARM_SHADOW,
    });
    return;
  }

  const slotText =
    numericScore <= 0
      ? HUD_SCORE_SLOT_TEXT
      : HUD_SCORE_SLOT_TEXT.slice(0, HUD_SCORE_SLOT_TEXT.length - scoreText.length);
  const slotMetrics = getHudFontDigitTextMetrics(ctx, HUD_SCORE_SLOT_TEXT, {
    fontSize,
    fontFamily,
    fontWeight,
  });
  const scoreMetrics =
    numericScore > 0
      ? getHudFontDigitTextMetrics(ctx, scoreText, {
          fontSize,
          fontFamily,
          fontWeight,
        })
      : { width: 0 };
  let slotX = snapToGrid(x, 1);

  if (options.align === "center") {
    slotX -= Math.round(slotMetrics.width / 2);
  } else if (options.align === "right") {
    slotX -= slotMetrics.width;
  }

  drawHudFontDigitText(ctx, slotText, slotX, y, {
    ...options,
    align: "left",
    fontSize,
    fontFamily,
    fontWeight,
    color: HUD_SCORE_PLACEHOLDER_COLOR,
    shadowColor: HUD_SCORE_PLACEHOLDER_SHADOW_COLOR,
  });

  if (numericScore <= 0) {
    return;
  }

  drawHudFontDigitText(ctx, scoreText, slotX + slotMetrics.width - scoreMetrics.width, y, {
    ...options,
    align: "left",
    fontSize,
    fontFamily,
    fontWeight,
    color: options.color || UI_BRIGHT_TEXT,
    shadowColor: options.shadowColor || UI_WARM_SHADOW,
  });
}

function drawHudComboValue(ctx, combo, x, y, options = {}) {
  const numericCombo = Math.max(0, Math.round(Number(combo) || 0));
  const comboText = String(numericCombo);

  drawHudDigitText(ctx, comboText, x, y, {
    ...options,
    useSpriteDigits: true,
    color: numericCombo > 0 ? options.color || UI_BRIGHT_TEXT : HUD_SCORE_PLACEHOLDER_COLOR,
    shadowColor:
      numericCombo > 0
        ? options.shadowColor
        : HUD_SCORE_PLACEHOLDER_SHADOW_COLOR,
  });
}

function drawImageCover(ctx, image, x, y, width, height, options = {}) {
  if (!image) {
    return false;
  }

  const sourceWidth = Math.max(1, image.width || 1);
  const sourceHeight = Math.max(1, image.height || 1);
  const targetWidth = Math.max(1, width);
  const targetHeight = Math.max(1, height);
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const cropWidth = targetWidth / scale;
  const cropHeight = targetHeight / scale;
  const sourceX = Math.max(0, (sourceWidth - cropWidth) / 2);
  const sourceY = Math.max(0, (sourceHeight - cropHeight) / 2);
  const drawX = snapToGrid(x, 1);
  const drawY = snapToGrid(y, 1);

  ctx.save();
  if (options.alpha !== undefined) {
    ctx.globalAlpha = options.alpha;
  }
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    Math.min(sourceWidth, cropWidth),
    Math.min(sourceHeight, cropHeight),
    drawX,
    drawY,
    targetWidth,
    targetHeight
  );
  ctx.restore();
  return true;
}

function drawPixelHudPlate(ctx, x, y, width, height, options = {}) {
  const left = snapToGrid(x, 1);
  const top = snapToGrid(y, 1);
  const panelWidth = snapToGrid(width, 1);
  const panelHeight = snapToGrid(height, 1);
  const cut = options.cut === undefined ? 6 : options.cut;
  const step = options.step === undefined ? 2 : options.step;
  const shadowOffset = options.shadowOffset === undefined ? 3 : options.shadowOffset;

  ctx.save();
  drawPixelCutRect(ctx, left + shadowOffset, top + shadowOffset, panelWidth, panelHeight, cut, step);
  ctx.fillStyle = options.shadowColor || "rgba(4, 8, 16, 0.3)";
  ctx.fill();

  drawPixelCutRect(ctx, left, top, panelWidth, panelHeight, cut, step);
  ctx.fillStyle = options.fillColor || UI_PANEL_BLUE;
  ctx.fill();
  ctx.restore();
}

function isPointInsidePolygon(pointX, pointY, polygon) {
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const current = polygon[index];
    const prior = polygon[previous];
    const intersects =
      current.y > pointY !== prior.y > pointY &&
      pointX <
        ((prior.x - current.x) * (pointY - current.y)) / Math.max(0.0001, prior.y - current.y) +
          current.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function drawPixelPolygonShape(ctx, polygon, cellSize, colors, alpha, shadeResolver) {
  const cell = Math.max(2, Math.round(cellSize));
  const minX = Math.floor(Math.min(...polygon.map((point) => point.x)) / cell) * cell - cell;
  const maxX = Math.ceil(Math.max(...polygon.map((point) => point.x)) / cell) * cell + cell;
  const minY = Math.floor(Math.min(...polygon.map((point) => point.y)) / cell) * cell - cell;
  const maxY = Math.ceil(Math.max(...polygon.map((point) => point.y)) / cell) * cell + cell;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;

  if (colors.shadow) {
    ctx.fillStyle = colors.shadow;
    for (let x = minX; x <= maxX; x += cell) {
      for (let y = minY; y <= maxY; y += cell) {
        if (!isPointInsidePolygon(x + cell / 2, y + cell / 2, polygon)) {
          continue;
        }
        ctx.fillRect(x + cell, y + cell, cell, cell);
      }
    }
  }

  for (let x = minX; x <= maxX; x += cell) {
    for (let y = minY; y <= maxY; y += cell) {
      const sampleX = x + cell / 2;
      const sampleY = y + cell / 2;
      if (!isPointInsidePolygon(sampleX, sampleY, polygon)) {
        continue;
      }
      const tone = shadeResolver(sampleX, sampleY);
      ctx.fillStyle = colors[tone] || colors.core;
      ctx.fillRect(x, y, cell, cell);
    }
  }

  ctx.restore();
}

const PIXEL_IMPACT_BAR_SPRITE_CACHE = new Map();

function trimPixelSpriteRows(spriteRows = []) {
  let top = 0;
  let bottom = spriteRows.length - 1;

  while (top <= bottom && !/[hco]/.test(spriteRows[top])) {
    top += 1;
  }

  while (bottom >= top && !/[hco]/.test(spriteRows[bottom])) {
    bottom -= 1;
  }

  if (top > bottom) {
    return Object.freeze(["."]);
  }

  let left = Infinity;
  let right = -1;

  for (let rowIndex = top; rowIndex <= bottom; rowIndex += 1) {
    const row = spriteRows[rowIndex];
    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      if (!/[hco]/.test(row[columnIndex])) {
        continue;
      }
      left = Math.min(left, columnIndex);
      right = Math.max(right, columnIndex);
    }
  }

  return Object.freeze(
    spriteRows.slice(top, bottom + 1).map((row) => row.slice(left, right + 1))
  );
}

function createPixelImpactBarSprite(lengthUnits, thicknessUnits, angleDegrees) {
  const cacheKey = `${Math.round(lengthUnits)}:${Math.round(thicknessUnits)}:${Math.round(angleDegrees)}`;
  const cachedSprite = PIXEL_IMPACT_BAR_SPRITE_CACHE.get(cacheKey);
  if (cachedSprite) {
    return cachedSprite;
  }

  const length = Math.max(6, Math.round(lengthUnits));
  const thickness = Math.max(3, Math.round(thicknessUnits));
  const radians = (angleDegrees * Math.PI) / 180;
  const axisX = Math.cos(radians);
  const axisY = Math.sin(radians);
  const normalX = -axisY;
  const normalY = axisX;
  const safeWidth = Math.ceil(Math.abs(axisX) * length + Math.abs(normalX) * thickness) + 6;
  const safeHeight = Math.ceil(Math.abs(axisY) * length + Math.abs(normalY) * thickness) + 6;
  const centerX = (safeWidth - 1) / 2;
  const centerY = (safeHeight - 1) / 2;
  const halfLength = length / 2;
  const halfThickness = thickness / 2;
  const rows = [];

  for (let rowIndex = 0; rowIndex < safeHeight; rowIndex += 1) {
    let row = "";
    for (let columnIndex = 0; columnIndex < safeWidth; columnIndex += 1) {
      const dx = columnIndex - centerX;
      const dy = rowIndex - centerY;
      const localLong = dx * axisX + dy * axisY;
      const localShort = dx * normalX + dy * normalY;
      const insideLong = Math.abs(localLong) <= halfLength;
      const insideShort = Math.abs(localShort) <= halfThickness;

      if (!insideLong || !insideShort) {
        row += ".";
        continue;
      }

      const edgeDistance = Math.min(halfLength - Math.abs(localLong), halfThickness - Math.abs(localShort));
      if (edgeDistance <= 0.82) {
        row += dx + dy <= 0 ? "h" : "o";
      } else {
        row += "c";
      }
    }
    rows.push(row);
  }

  const trimmedSprite = trimPixelSpriteRows(rows);
  PIXEL_IMPACT_BAR_SPRITE_CACHE.set(cacheKey, trimmedSprite);
  return trimmedSprite;
}

function drawCenteredPixelSprite(ctx, spriteRows, centerX, centerY, scale, palette, alpha = 1) {
  const spriteSize = getPixelSpriteMatrixSize(spriteRows, scale);
  const left = snapToGrid(centerX - spriteSize.width / 2, 1);
  const top = snapToGrid(centerY - spriteSize.height / 2, 1);
  drawPixelSpriteMatrix(ctx, spriteRows, left, top, scale, palette, alpha);
}

function drawPixelImpactStar(ctx, centerX, centerY, cellSize, colors, alpha = 1) {
  const armSize = Math.max(3, Math.round(cellSize));
  const outlineColor = colors.outline || colors.core;
  const coreColor = colors.core;
  const highlightColor = colors.highlight || colors.core;

  drawPixelSpark(ctx, centerX, centerY, armSize, outlineColor, coreColor, alpha);
  drawPixelSpark(ctx, centerX, centerY, Math.max(2, armSize - 1), coreColor, highlightColor, alpha * 0.96);
  drawPixelDiamond(ctx, centerX, centerY, Math.max(1, armSize - 2), highlightColor, alpha);
}

function drawPixelImpactSlash(ctx, centerX, centerY, length, cellSize, angleDegrees, colors, alpha = 1) {
  const palette = {
    o: colors.outline || colors.core,
    c: colors.core,
    h: colors.highlight || colors.core,
  };
  const scale = Math.max(2, Math.round(cellSize) - 1);
  const spriteRows = createPixelImpactBarSprite(length / scale, 4, angleDegrees);
  drawCenteredPixelSprite(ctx, spriteRows, centerX, centerY, scale, palette, alpha);
}

function drawPixelImpactStrip(
  ctx,
  centerX,
  centerY,
  length,
  thicknessUnits,
  angleDegrees,
  colors,
  scale = 1,
  alpha = 1
) {
  const palette = {
    o: colors.outline || colors.core,
    c: colors.core,
    h: colors.highlight || colors.core,
  };
  const spriteRows = createPixelImpactBarSprite(length / Math.max(1, scale), thicknessUnits, angleDegrees);
  drawCenteredPixelSprite(ctx, spriteRows, centerX, centerY, Math.max(1, scale), palette, alpha);
}

function drawTitleRabbitBeam(ctx, startX, startY, endX, endY, alpha = 1) {
  const beamAngle = (Math.atan2(endY - startY, endX - startX) * 180) / Math.PI;
  const beamLength = Math.hypot(endX - startX, endY - startY);
  const centerX = snapToGrid((startX + endX) / 2, 1);
  const centerY = snapToGrid((startY + endY) / 2, 1);
  drawPixelImpactStrip(
    ctx,
    centerX,
    centerY,
    Math.max(10, beamLength),
    1,
    beamAngle,
    {
      outline: "#0d5b41",
      core: "#39df7d",
      highlight: "#c9ffdb",
    },
    1,
    alpha
  );
}

function drawTitleBeamImpact(ctx, centerX, centerY, progress = 0, alpha = 1) {
  const eased = easeOutCubic(clamp(progress, 0, 1));
  const colors = {
    outline: "#0d5b41",
    core: "#4df08b",
    highlight: "#effff4",
  };
  const spread = Math.round(lerp(0, 8, eased));
  const lift = Math.round(lerp(0, 3, eased));
  const hitX = snapToGrid(centerX, 1);
  const hitY = snapToGrid(centerY - lift, 1);

  drawPixelImpactStar(ctx, hitX, hitY, 4, colors, alpha);
  drawPixelImpactStar(ctx, hitX - 10 - spread * 0.3, hitY - 9, 3, colors, alpha * 0.86);
  drawPixelImpactStar(ctx, hitX - 8 - spread * 0.2, hitY + 9, 3, colors, alpha * 0.82);

  drawPixelImpactStrip(ctx, hitX - 14 - spread * 0.45, hitY - 9, 10, 1, 160, colors, 1, alpha * 0.92);
  drawPixelImpactStrip(ctx, hitX - 18 - spread * 0.55, hitY, 15, 1, 180, colors, 1, alpha * 0.98);
  drawPixelImpactStrip(ctx, hitX - 14 - spread * 0.45, hitY + 9, 10, 1, 200, colors, 1, alpha * 0.92);
  drawPixelImpactStrip(ctx, hitX - 6 - spread * 0.18, hitY - 13, 7, 1, 145, colors, 1, alpha * 0.76);
  drawPixelImpactStrip(ctx, hitX - 6 - spread * 0.18, hitY + 13, 7, 1, 215, colors, 1, alpha * 0.76);
}

function drawTitlePigXEyesOverlay(ctx, left, top, width, height, alpha = 1) {
  const eyeY = snapToGrid(top + height * 0.41, 1);
  const leftEyeX = snapToGrid(left + width * 0.39, 1);
  const rightEyeX = snapToGrid(left + width * 0.62, 1);
  const stroke = Math.max(2, Math.round(Math.min(width, height) * 0.042));
  const dark = "#2f1723";
  const light = "#ffdfe8";

  const drawCross = (cx, cy) => {
    drawPixelImpactSlash(
      ctx,
      cx,
      cy,
      stroke * 5,
      stroke + 1,
      45,
      { outline: dark, core: dark, highlight: light },
      alpha
    );
    drawPixelImpactSlash(
      ctx,
      cx,
      cy,
      stroke * 5,
      stroke + 1,
      -45,
      { outline: dark, core: dark, highlight: light },
      alpha
    );
  };

  drawCross(leftEyeX, eyeY);
  drawCross(rightEyeX, eyeY);
}

function drawTitleMascots(ctx, viewport, rects, time, palette = {}, characterSprites = {}) {
  const frameIndex = Math.floor(time * 5) % 16;
  const rabbitFrame = Math.floor(time * 6) % 24;
  const rabbitVariant =
    rabbitFrame === 15 || rabbitFrame === 16
      ? TITLE_RABBIT_SPRITES.blink
      : rabbitFrame === 4 || rabbitFrame === 5 || rabbitFrame === 6 || rabbitFrame === 7
        ? TITLE_RABBIT_SPRITES.twitch
        : TITLE_RABBIT_SPRITES.idle;
  const pigVariant =
    frameIndex === 7 || frameIndex === 8
      ? TITLE_PIG_SPRITES.blink
      : frameIndex === 2 || frameIndex === 3
        ? TITLE_PIG_SPRITES.squash
        : TITLE_PIG_SPRITES.idle;
  const scale = viewport.width >= 380 ? 4 : 3;
  const titleRabbitSprite = characterSprites.titleRabbit || null;
  const titlePigSprite = characterSprites.titlePig || null;

  if (titleRabbitSprite && titlePigSprite) {
    const rabbitHeight = snapToGrid(
      Math.min(viewport.height * 0.24, Math.max(112, viewport.width * 0.34)),
      1
    );
    const rabbitWidth = snapToGrid(rabbitHeight * getSpriteAspect(titleRabbitSprite, 1), 1);
    const pigHeight = snapToGrid(rabbitHeight * 0.58, 1);
    const pigWidth = snapToGrid(pigHeight * getSpriteAspect(titlePigSprite, 1.45), 1);
    const gap = snapToGrid(Math.max(28, viewport.width * 0.08), 1);
    const groupWidth = rabbitWidth + gap + pigWidth;
    const groupLeft = snapToGrid(rects.centerX - groupWidth / 2, 1);
    const rabbitLeft = groupLeft;
    const pigLeft = snapToGrid(groupLeft + rabbitWidth + gap, 1);
    const feetY = snapToGrid(rects.mascotY + rabbitHeight * 0.46, 1);
    const rabbitBob = Math.sin(time * 2.4) * 3 + Math.sin(time * 5.4) * 0.7;
    const pigBob = Math.sin(time * 2.05 + 0.7) * 2.2;
    const rabbitTilt = Math.sin(time * 2.2) * 0.03;
    const pigTilt = Math.sin(time * 1.9 + 0.5) * 0.018;
    const rabbitTop = snapToGrid(feetY - rabbitHeight + rabbitBob, 1);
    const pigTop = snapToGrid(feetY - pigHeight + pigBob + rabbitHeight * 0.12, 1);
    const rabbitCenterX = snapToGrid(rabbitLeft + rabbitWidth / 2, 1);
    const pigCenterX = snapToGrid(pigLeft + pigWidth / 2, 1);
    const wandX = snapToGrid(rabbitLeft + rabbitWidth * 0.83, 1);
    const wandY = snapToGrid(rabbitTop + rabbitHeight * 0.44, 1);
    const wandGlow = 0.58 + ((Math.sin(time * 4.2) + 1) / 2) * 0.3;

    drawPixelOvalShadow(
      ctx,
      rabbitCenterX,
      rabbitTop + rabbitHeight + 7,
      rabbitWidth * 0.24,
      3,
      "rgba(7, 11, 20, 0.38)",
      0.9
    );
    drawPixelOvalShadow(
      ctx,
      pigCenterX,
      pigTop + pigHeight + 7,
      pigWidth * 0.28,
      3,
      "rgba(7, 11, 20, 0.34)",
      0.88
    );

    drawSpriteFrame(ctx, titleRabbitSprite, rabbitLeft, rabbitTop, rabbitWidth, rabbitHeight, {
      rotation: rabbitTilt,
      shadowColor: "rgba(110, 255, 160, 0.18)",
      shadowBlur: 6,
    });
    drawSpriteFrame(ctx, titlePigSprite, pigLeft, pigTop, pigWidth, pigHeight, {
      rotation: pigTilt,
      shadowColor: "rgba(255, 191, 206, 0.16)",
      shadowBlur: 6,
    });

    drawPixelImpactStar(
      ctx,
      wandX,
      wandY,
      3,
      {
        outline: "#0d5b41",
        core: "#4df08b",
        highlight: "#effff4",
      },
      wandGlow
    );
    drawPixelImpactStrip(
      ctx,
      snapToGrid(wandX + 10, 1),
      snapToGrid(wandY - 8, 1),
      7,
      1,
      78,
      {
        outline: "#0d5b41",
        core: "#4df08b",
        highlight: "#effff4",
      },
      1,
      wandGlow * 0.82
    );
    drawPixelImpactStrip(
      ctx,
      snapToGrid(wandX + 12, 1),
      snapToGrid(wandY + 9, 1),
      6,
      1,
      102,
      {
        outline: "#0d5b41",
        core: "#4df08b",
        highlight: "#effff4",
      },
      1,
      wandGlow * 0.76
    );
    return;
  }

  const rabbitSize = getPixelSpriteMatrixSize(rabbitVariant, scale);
  const pigSize = getPixelSpriteMatrixSize(pigVariant, scale);
  const pigBaseSprite = titlePigSprite || characterSprites.pigFront || characterSprites.pigFrontLaunch || null;
  const pigHitSprite = titlePigSprite || characterSprites.pigFrontLaunch || pigBaseSprite;
  const pigReferenceSprite = pigBaseSprite || pigHitSprite;
  const rabbitDrawHeight = titleRabbitSprite
    ? snapToGrid(Math.min(viewport.height * 0.24, Math.max(96, viewport.width * 0.31)), 1)
    : rabbitSize.height;
  const rabbitDrawWidth = titleRabbitSprite
    ? snapToGrid(rabbitDrawHeight * getSpriteAspect(titleRabbitSprite, 1), 1)
    : rabbitSize.width;
  const pigDrawHeight = pigReferenceSprite
    ? snapToGrid(rabbitDrawHeight * (titlePigSprite ? 0.8 : 0.92), 1)
    : pigSize.height;
  const pigDrawWidth = pigReferenceSprite
    ? snapToGrid(pigDrawHeight * getSpriteAspect(pigReferenceSprite, titlePigSprite ? 1.45 : 1.14), 1)
    : pigSize.width;
  const mascotCenterY = rects.mascotY;
  const chaseGap = snapToGrid(Math.max(16, viewport.width * 0.042) * 2, 1);
  const travelPadding = snapToGrid(Math.max(20, viewport.width * 0.038), 1);
  const pairWidth = snapToGrid(rabbitDrawWidth + chaseGap + pigDrawWidth, 1);
  const homeRabbitLeft = snapToGrid(rects.centerX - pairWidth / 2, 1);
  const leftStopRabbitLeft = snapToGrid(Math.max(14, viewport.width * 0.08), 1);
  const rightStopRabbitLeft = snapToGrid(
    Math.min(
      viewport.width - pairWidth - Math.max(14, viewport.width * 0.05),
      homeRabbitLeft + viewport.width * 0.24
    ),
    1
  );
  const offRightRabbitLeft = snapToGrid(viewport.width + travelPadding, 1);
  const offLeftRabbitLeft = snapToGrid(-pairWidth - travelPadding, 1);
  const phaseDurations = {
    homeHold: 2.0,
    homeToRight: 0.95,
    rightHold: 2.0,
    rightToExit: 0.42,
    leftEntry: 0.72,
    leftHold: 2.0,
    leftToHome: 0.82,
  };
  const loopDuration = Object.values(phaseDurations).reduce((sum, duration) => sum + duration, 0);
  let phaseTime = time % loopDuration;
  let rabbitLeft = homeRabbitLeft;
  let movementPhase = "homeHold";

  if (phaseTime < phaseDurations.homeHold) {
    movementPhase = "homeHold";
    rabbitLeft = homeRabbitLeft;
  } else {
    phaseTime -= phaseDurations.homeHold;
    if (phaseTime < phaseDurations.homeToRight) {
      movementPhase = "homeToRight";
      rabbitLeft = snapToGrid(
        lerp(homeRabbitLeft, rightStopRabbitLeft, easeOutCubic(phaseTime / phaseDurations.homeToRight)),
        1
      );
    } else {
      phaseTime -= phaseDurations.homeToRight;
      if (phaseTime < phaseDurations.rightHold) {
        movementPhase = "rightHold";
        rabbitLeft = rightStopRabbitLeft;
      } else {
        phaseTime -= phaseDurations.rightHold;
        if (phaseTime < phaseDurations.rightToExit) {
          movementPhase = "rightToExit";
          rabbitLeft = snapToGrid(
            lerp(rightStopRabbitLeft, offRightRabbitLeft, easeInOutSine(phaseTime / phaseDurations.rightToExit)),
            1
          );
        } else {
          phaseTime -= phaseDurations.rightToExit;
          if (phaseTime < phaseDurations.leftEntry) {
            movementPhase = "leftEntry";
            rabbitLeft = snapToGrid(
              lerp(offLeftRabbitLeft, leftStopRabbitLeft, easeOutCubic(phaseTime / phaseDurations.leftEntry)),
              1
            );
          } else {
            phaseTime -= phaseDurations.leftEntry;
            if (phaseTime < phaseDurations.leftHold) {
              movementPhase = "leftHold";
              rabbitLeft = leftStopRabbitLeft;
            } else {
              phaseTime -= phaseDurations.leftHold;
              movementPhase = "leftToHome";
              rabbitLeft = snapToGrid(
                lerp(leftStopRabbitLeft, homeRabbitLeft, easeOutCubic(phaseTime / phaseDurations.leftToHome)),
                1
              );
            }
          }
        }
      }
    }
  }

  const localPhaseTime = phaseTime;
  const attackConfig =
    movementPhase === "homeHold"
      ? { start: 0.72, beamDuration: 0.26, hitDuration: 0.68 }
      : movementPhase === "leftHold"
        ? { start: 0.64, beamDuration: 0.24, hitDuration: 0.62 }
        : null;
  const attackElapsed = attackConfig ? localPhaseTime - attackConfig.start : -1;
  const beamActive = !!attackConfig && attackElapsed >= 0 && attackElapsed < attackConfig.beamDuration;
  const pigHitActive = !!attackConfig && attackElapsed >= 0 && attackElapsed < attackConfig.hitDuration;
  const beamAlpha = beamActive
    ? 0.72 + Math.sin((attackElapsed / attackConfig.beamDuration) * Math.PI) * 0.28
    : 0;
  const pigHitAlpha = pigHitActive
    ? lerp(
        1,
        0.58,
        clamp(
          (attackElapsed - attackConfig.beamDuration * 0.42) /
            Math.max(0.001, attackConfig.hitDuration - attackConfig.beamDuration * 0.42),
          0,
          1
        )
      )
    : 0;
  const pigHitProgress = pigHitActive
    ? clamp(attackElapsed / Math.max(0.001, attackConfig.hitDuration), 0, 1)
    : 0;
  const isRunning =
    movementPhase === "homeToRight" ||
    movementPhase === "rightToExit" ||
    movementPhase === "leftEntry" ||
    movementPhase === "leftToHome";
  const pigRollProgress = pigHitActive ? easeInOutSine(pigHitProgress) : 0;
  const pigIdleWobble = titlePigSprite
    ? (isRunning ? Math.sin(time * 10.5 + 0.4) * 0.045 : Math.sin(time * 2.2 + 0.4) * 0.02)
    : 0;
  const pigRotation = pigHitActive ? pigRollProgress * Math.PI * 2 : pigIdleWobble;
  const pigHitLift = pigHitActive ? Math.sin(pigHitProgress * Math.PI) * -6 : 0;
  const pigSprite = pigHitActive ? pigHitSprite : pigBaseSprite;
  const pigLeft = snapToGrid(rabbitLeft + rabbitDrawWidth + chaseGap, 1);
  const rabbitCenterX = snapToGrid(rabbitLeft + rabbitDrawWidth / 2, 1);
  const pigCenterX = snapToGrid(pigLeft + pigDrawWidth / 2, 1);
  const idleBobPattern = [0, -1, 0, 1, 0, -1, 0, 1];
  const runBobPattern = [0, -2, -1, 1, 2, 1, -1, 0];
  const rabbitBobPattern = isRunning ? runBobPattern : idleBobPattern;
  const pigBobPattern = isRunning ? [1, -1, -2, 0, 2, 1, -1, 0] : idleBobPattern;
  const bobFrame = Math.floor(time * (isRunning ? 12 : 8)) % 8;
  const rabbitBob = rabbitBobPattern[bobFrame];
  const pigBob = pigBobPattern[(bobFrame + 2) % 8];
  const rabbitIdleTilt = titleRabbitSprite
    ? (isRunning ? Math.sin(time * 10.5) * 0.05 - 0.03 : Math.sin(time * 2.8) * 0.028)
    : 0;
  const rabbitTop = snapToGrid(mascotCenterY - rabbitDrawHeight / 2 + rabbitBob, 1);
  const pigTop = snapToGrid(mascotCenterY - pigDrawHeight / 2 + pigBob + pigHitLift, 1);
  const rabbitPalette = {
    o: "#2b2330",
    p: "#d8a2b7",
    w: "#f5f0e6",
    h: "#fffaf1",
    e: "#1a2030",
    n: "#c28699",
    g: palette.goldInner || "#cbb37b",
  };
  const pigPalette = {
    o: "#47263a",
    w: "#e19eab",
    h: "#f4c2cb",
    e: "#271521",
    s: "#b96f7d",
    n: "#8f4254",
  };

  drawPixelOvalShadow(
    ctx,
    rabbitCenterX,
    rabbitTop + rabbitDrawHeight + 7,
    rabbitDrawWidth * 0.28,
    3,
    "rgba(7, 11, 20, 0.42)",
    0.92
  );
  if (titleRabbitSprite) {
    drawSpriteFrame(ctx, titleRabbitSprite, rabbitLeft, rabbitTop, rabbitDrawWidth, rabbitDrawHeight, {
      shadowColor: "rgba(120, 255, 170, 0.18)",
      shadowBlur: beamActive ? 10 : 4,
      rotation: rabbitIdleTilt,
    });
  } else {
    drawPixelSpriteMatrix(ctx, rabbitVariant, rabbitLeft, rabbitTop, scale, rabbitPalette);
  }
  const beamStartX = snapToGrid(
    rabbitLeft + rabbitDrawWidth * (titleRabbitSprite ? 0.84 : 0.84),
    1
  );
  const beamStartY = snapToGrid(
    rabbitTop + rabbitDrawHeight * (titleRabbitSprite ? 0.43 : 0.46),
    1
  );
  const beamEndX = snapToGrid(pigLeft + pigDrawWidth * 0.24, 1);
  const beamEndY = snapToGrid(pigTop + pigDrawHeight * 0.43, 1);
  if (beamActive) {
    drawTitleRabbitBeam(ctx, beamStartX, beamStartY, beamEndX, beamEndY, beamAlpha);
  }
  if (pigSprite) {
    const pigHeight = pigDrawHeight;
    const pigWidth = pigDrawWidth;
    const pigSpriteTop = pigTop;
    const pigSpriteLeft = pigLeft;
    drawPixelOvalShadow(
      ctx,
      pigCenterX,
      pigSpriteTop + pigHeight + 7,
      pigWidth * 0.28,
      3,
      "rgba(7, 11, 20, 0.42)",
      0.92
    );
    drawSpriteFrame(ctx, pigSprite, pigSpriteLeft, pigSpriteTop, pigWidth, pigHeight, {
      shadowColor: "rgba(255, 191, 206, 0.22)",
      shadowBlur: 8,
      rotation: pigRotation,
    });
    if (pigHitActive && pigSprite === pigBaseSprite && !titlePigSprite) {
      drawTitlePigXEyesOverlay(ctx, pigSpriteLeft, pigSpriteTop, pigWidth, pigHeight, pigHitAlpha);
    }
  } else {
    drawPixelOvalShadow(
      ctx,
      pigCenterX,
      pigTop + pigSize.height + 7,
      pigSize.width * 0.28,
      3,
      "rgba(7, 11, 20, 0.42)",
      0.92
    );
    drawPixelSpriteMatrix(ctx, pigVariant, pigLeft, pigTop, scale, pigPalette);
    if (pigHitActive) {
      drawTitlePigXEyesOverlay(ctx, pigLeft, pigTop, pigSize.width, pigSize.height, pigHitAlpha);
    }
  }

  if (pigHitActive) {
    drawTitleBeamImpact(
      ctx,
      beamEndX,
      beamEndY,
      pigHitProgress,
      Math.max(beamAlpha, pigHitAlpha * 0.9)
    );
  } else {
    const impactAlpha = 0.32 + ((Math.sin(time * 2.4 + 1.2) + 1) / 2) * 0.24;
    const sparkX = snapToGrid(
      lerp(rabbitLeft + rabbitDrawWidth * 0.74, pigLeft + pigDrawWidth * 0.22, 0.52),
      1
    );
    const sparkY = snapToGrid(
      mascotCenterY - rabbitDrawHeight * 0.24 + (rabbitBob + pigBob) * 0.5,
      1
    );
    drawPixelSpark(
      ctx,
      sparkX,
      sparkY,
      2,
      "#f0c59b",
      "#fff3d6",
      impactAlpha
    );
  }
}

function drawLaneShape(ctx, lane, topWidth = lane.topWidth, bottomWidth = lane.bottomWidth) {
  ctx.beginPath();
  ctx.moveTo(lane.centerX - topWidth / 2, lane.top);
  ctx.lineTo(lane.centerX + topWidth / 2, lane.top);
  ctx.lineTo(lane.centerX + bottomWidth / 2, lane.bottom);
  ctx.lineTo(lane.centerX - bottomWidth / 2, lane.bottom);
  ctx.closePath();
}

function getSceneTransition(introProgress = 1) {
  const raw = clamp(introProgress, 0, 1);
  const cameraProgress = easeOutCubic(raw);
  const rabbitTurnProgress = easeInOutSine(raw);

  return {
    raw,
    cameraProgress,
    rabbitTurnProgress,
    introAmount: 1 - cameraProgress,
  };
}

function getLaneMetrics(viewport, introProgress = 1) {
  const transition = getSceneTransition(introProgress);
  const centerX = viewport.width / 2;
  const bottomWidth = Math.min(viewport.width * lerp(0.44, 0.48, transition.cameraProgress), 248);
  const topWidth = Math.max(88, bottomWidth * lerp(0.88, 0.56, transition.cameraProgress));
  const top = viewport.height * lerp(0.2, 0.06, transition.cameraProgress);
  const bottom = viewport.height * lerp(0.92, 0.98, transition.cameraProgress);
  const targetY = viewport.height * lerp(0.845, TARGET_RATIO, transition.cameraProgress);
  const targetProgress = clamp((targetY - top) / (bottom - top), 0, 1);

  return {
    centerX,
    laneWidth: bottomWidth,
    topWidth,
    bottomWidth,
    targetWidth: lerp(topWidth, bottomWidth, targetProgress),
    left: centerX - bottomWidth / 2,
    right: centerX + bottomWidth / 2,
    top,
    bottom,
    noteEntryY: NOTE_ENTRY_Y,
    targetY,
    pixelsPerSecond:
      viewport.height * lerp(0.34, 0.42, transition.cameraProgress) * NOTE_FALL_SPEED_MULTIPLIER,
    cameraProgress: transition.cameraProgress,
    rabbitTurnProgress: transition.rabbitTurnProgress,
    introAmount: transition.introAmount,
  };
}

function drawBackground(ctx, viewport, currentTime, lane, loadingColors = {}) {
  const { width, height } = viewport;
  const spinnerRadius = Math.max(16, Math.min(width, height) * 0.05);
  const spinnerLineWidth = Math.max(5, spinnerRadius * 0.3);
  const rotation = currentTime * Math.PI * 2 * 1.25;

  ctx.fillStyle = loadingColors.background || BACKDROP_LOADING_BACKGROUND;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = spinnerLineWidth;
  ctx.strokeStyle = loadingColors.spinnerTrack || BACKDROP_LOADING_SPINNER_TRACK;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, spinnerRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = loadingColors.spinner || BACKDROP_LOADING_SPINNER;
  ctx.beginPath();
  ctx.arc(
    width / 2,
    height / 2,
    spinnerRadius,
    rotation - Math.PI * 0.52,
    rotation + Math.PI * 0.18
  );
  ctx.stroke();
  ctx.restore();
}

function getCoverBackdropLayout(viewport, image) {
  if (!image) {
    return null;
  }

  const scale = Math.max(
    viewport.width / Math.max(1, image.width),
    viewport.height / Math.max(1, image.height)
  );
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const drawX = Math.round((viewport.width - drawWidth) / 2);
  const drawY = Math.round((viewport.height - drawHeight) / 2);

  return {
    x: drawX,
    y: drawY,
    width: drawWidth,
    height: drawHeight,
    scale,
  };
}

function drawCoverBackdrop(ctx, viewport, image) {
  const layout = getCoverBackdropLayout(viewport, image);
  if (!layout) {
    return false;
  }

  const previousSmoothing = ctx.imageSmoothingEnabled;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, layout.x, layout.y, layout.width, layout.height);
  ctx.imageSmoothingEnabled = previousSmoothing;
  ctx.restore();

  return true;
}

function drawBackdropTorchEmbers(ctx, viewport, currentTime, image) {
  const layout = getCoverBackdropLayout(viewport, image);
  if (!layout) {
    return;
  }

  const anchorBaseWidth = Math.max(1, BACKDROP_TORCH_ANCHOR_BASE_WIDTH);
  const anchorBaseHeight = Math.max(1, BACKDROP_TORCH_ANCHOR_BASE_HEIGHT);
  const effectScale = layout.height / anchorBaseHeight;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  BACKDROP_TORCH_ANCHORS.forEach((torch, torchIndex) => {
    const baseX = layout.x + (torch.x / anchorBaseWidth) * layout.width;
    const baseY = layout.y + (torch.y / anchorBaseHeight) * layout.height;
    const spreadScale = torch.spreadScale === undefined ? 1 : torch.spreadScale;
    const sizeScale = torch.sizeScale === undefined ? 1 : torch.sizeScale;
    const emberCount = torch.emberCount || 5;
    const flicker = 0.92 + (Math.sin(currentTime * 7.8 + torch.phase * 11) + 1) * 0.07;
    const glowRadius = torch.glowRadius * effectScale * flicker;
    const glow = ctx.createRadialGradient(baseX, baseY + 2 * effectScale, 0, baseX, baseY + 2 * effectScale, glowRadius);
    glow.addColorStop(0, `rgba(255, 236, 167, ${0.14 * flicker})`);
    glow.addColorStop(0.36, `rgba(255, 180, 84, ${0.09 * flicker})`);
    glow.addColorStop(1, "rgba(255, 180, 84, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(baseX, baseY + 1, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    for (let emberIndex = 0; emberIndex < emberCount; emberIndex += 1) {
      const cycle = (currentTime * (0.92 + torchIndex * 0.02) + torch.phase + emberIndex * 0.23) % 1;
      const travel = easeOutCubic(cycle);
      const spawnOffsetX =
        Math.sin(torch.phase * 13 + emberIndex * 1.4) *
        effectScale *
        (2.2 + (emberIndex % 2) * 1.3) *
        spreadScale;
      const spawnOffsetY = effectScale * lerp(4.5, 3.2, 1 - spreadScale);
      const scatterX =
        Math.cos(torch.phase * 9 + emberIndex * 1.7) *
          effectScale *
          (6 + emberIndex * 1.6) *
          spreadScale *
          travel +
        Math.sin(currentTime * 3.2 + emberIndex * 1.4) * effectScale * 1.1 * spreadScale;
      const rise = lerp(effectScale * (1.5 + (1 - spreadScale) * 0.4), torch.emberRise * effectScale * 0.72, travel);
      const emberX = baseX + spawnOffsetX + scatterX;
      const emberY = baseY + spawnOffsetY - rise;
      const emberAlpha = Math.sin(cycle * Math.PI) * 0.82;
      const largeRadius = Math.max(2, Math.round(3 * sizeScale));
      const mediumRadius = Math.max(1, Math.round(2 * sizeScale));
      const emberRadius = cycle < 0.22 ? largeRadius : cycle < 0.58 ? mediumRadius : 1;

      drawPixelDiamond(ctx, emberX, emberY, emberRadius, "#ffb24b", emberAlpha * 0.8);
      drawPixelDiamond(ctx, emberX, emberY, 1, "#fff2b8", emberAlpha * 0.96);

      ctx.save();
      ctx.globalAlpha = emberAlpha * 0.45;
      ctx.fillStyle = "#ffcf79";
      const trailHeight = Math.max(1, Math.round((emberRadius + 1) * sizeScale));
      ctx.fillRect(
        snapToGrid(emberX, 1),
        snapToGrid(emberY + emberRadius + 1, 1),
        1,
        trailHeight
      );
      ctx.restore();
    }
  });

  ctx.restore();
}

function drawPortalMagicStarGlow(ctx, x, y, radius, alpha, palette) {
  if (alpha <= 0.001 || radius <= 0) {
    return;
  }

  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, `rgba(${palette.glowInnerRgb}, ${alpha * 0.18})`);
  glow.addColorStop(0.44, `rgba(${palette.glowMidRgb}, ${alpha * 0.12})`);
  glow.addColorStop(0.78, `rgba(${palette.glowOuterRgb}, ${alpha * 0.05})`);
  glow.addColorStop(1, `rgba(${palette.glowOuterRgb}, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawPortalMagicStars(ctx, viewport, currentTime, image, theme) {
  const palette = PORTAL_MAGIC_STAR_PALETTES[theme];
  if (!palette) {
    return;
  }

  const layout = getCoverBackdropLayout(viewport, image);
  if (!layout) {
    return;
  }

  const anchorBaseWidth = Math.max(1, PORTAL_MAGIC_STAR_BASE_WIDTH);
  const anchorBaseHeight = Math.max(1, PORTAL_MAGIC_STAR_BASE_HEIGHT);
  const effectScale = layout.height / anchorBaseHeight;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = "lighter";

  PORTAL_MAGIC_STAR_ANCHORS.forEach((star, index) => {
    const tier = PORTAL_MAGIC_STAR_TIERS[star.tier] || PORTAL_MAGIC_STAR_TIERS.sm;
    const baseX = layout.x + (star.x / anchorBaseWidth) * layout.width;
    const baseY = layout.y + (star.y / anchorBaseHeight) * layout.height;
    const twinkleCycle = (Math.sin(currentTime * star.speed * Math.PI * 2 + star.phase * Math.PI * 2) + 1) / 2;
    const twinkle = lerp(tier.twinkleMin, tier.twinkleMax, easeInOutSine(twinkleCycle));
    const driftX = Math.sin(currentTime * 1.08 + star.phase * 13 + index) * effectScale * 0.55;
    const driftY = Math.cos(currentTime * 0.86 + star.phase * 17 + index * 0.4) * effectScale * 0.35;
    const starX = baseX + driftX;
    const starY = baseY + driftY;
    const starSize = Math.max(1, tier.size * effectScale * (0.9 + twinkle * 0.25));
    const glowRadius = tier.glowRadius * effectScale * (0.82 + twinkle * 0.28);
    const starAlpha = tier.alpha * twinkle;
    const keyedColor = palette.colors[star.colorKey] || palette.defaultOuterColor;
    const outerColor = star.colorKey === "core" ? palette.defaultOuterColor : keyedColor;
    const outerRadius = Math.max(1, starSize);
    const coreRadius = star.tier === "md" ? Math.max(1, starSize * 0.38) : 1;

    drawPortalMagicStarGlow(ctx, starX, starY, glowRadius, starAlpha, palette);
    drawPixelDiamond(ctx, starX, starY, outerRadius, outerColor, starAlpha * 0.74);
    drawPixelDiamond(ctx, starX, starY, coreRadius, palette.coreColor, starAlpha * 0.96);

    if ((index + Math.round(star.phase * 100)) % 5 === 0 && twinkle > 0.56) {
      ctx.save();
      ctx.globalAlpha = starAlpha * 0.28;
      ctx.fillStyle = palette.trailColor;
      ctx.fillRect(
        snapToGrid(starX, 1),
        snapToGrid(starY + outerRadius + 1, 1),
        1,
        Math.max(1, Math.round(outerRadius * 0.75))
      );
      ctx.restore();
    }
  });

  ctx.restore();
}

function getStageCarpetLayout(viewport, lane, image) {
  if (!image) {
    return null;
  }

  const desiredWidth = Math.min(
    viewport.width - 20,
    viewport.width * lerp(0.82, 0.84, lane.cameraProgress)
  );
  const scale = desiredWidth / Math.max(1, image.width);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;

  return {
    x: Math.round((viewport.width - drawWidth) / 2),
    y: STAGE_CARPET_TOP,
    width: drawWidth,
    height: drawHeight,
  };
}

function getStageCarpetEdgeRatio(progress, side) {
  const safeProgress = clamp(progress, 0, 1);
  const safeSide = side === "left" ? "left" : "right";
  const profile = STAGE_CARPET_EDGE_PROFILE;

  if (safeProgress <= profile[0].progress) {
    return profile[0][safeSide];
  }

  for (let index = 1; index < profile.length; index += 1) {
    const previous = profile[index - 1];
    const next = profile[index];
    if (safeProgress <= next.progress) {
      const localProgress =
        (safeProgress - previous.progress) / Math.max(0.0001, next.progress - previous.progress);
      return lerp(previous[safeSide], next[safeSide], localProgress);
    }
  }

  return profile[profile.length - 1][safeSide];
}

function getStageCarpetEdgeX(layout, screenY, side) {
  if (!layout) {
    return null;
  }

  const carpetProgress = clamp((screenY - layout.y) / Math.max(1, layout.height), 0, 1);
  const ratio = getStageCarpetEdgeRatio(carpetProgress, side);
  return layout.x + layout.width * ratio;
}

function getProjectedStageCarpetEdgeRatio(progress, side) {
  const safeSide = side === "left" ? "left" : "right";

  if (progress <= 1) {
    return getStageCarpetEdgeRatio(progress, safeSide);
  }

  const profile = STAGE_CARPET_EDGE_PROFILE;
  const last = profile[profile.length - 1];
  const previous = profile[profile.length - 2];
  const slope =
    (last[safeSide] - previous[safeSide]) /
    Math.max(0.0001, last.progress - previous.progress);
  const projectedRatio = last[safeSide] + slope * (progress - last.progress);

  if (safeSide === "left") {
    return Math.max(-0.14, projectedRatio);
  }

  return Math.min(1.14, projectedRatio);
}

function getProjectedStageCarpetEdgeX(layout, screenY, side) {
  if (!layout) {
    return null;
  }

  const carpetProgress = (screenY - layout.y) / Math.max(1, layout.height);
  const ratio = getProjectedStageCarpetEdgeRatio(carpetProgress, side);
  return layout.x + layout.width * ratio;
}

function drawStageCarpet(ctx, viewport, lane, image) {
  const layout = getStageCarpetLayout(viewport, lane, image);
  if (!layout) {
    return false;
  }

  const previousSmoothing = ctx.imageSmoothingEnabled;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, layout.x, layout.y, layout.width, layout.height);
  ctx.imageSmoothingEnabled = previousSmoothing;
  ctx.restore();

  return true;
}

function getLaneFlashPalette(quality) {
  if (quality === "perfect") {
    return {
      core: [159, 245, 199],
      edge: [92, 233, 169],
    };
  }

  if (quality === "hold") {
    return {
      core: [255, 225, 120],
      edge: [255, 188, 94],
    };
  }

  return {
    core: [139, 221, 255],
    edge: [92, 184, 255],
  };
}

function mapLaneHitFlashSourceAnchor(layout, anchor) {
  return {
    x: layout.x + (anchor.x / LANE_HIT_FLASH_SOURCE_BASE_WIDTH) * layout.width,
    y: layout.y + (anchor.y / LANE_HIT_FLASH_SOURCE_BASE_HEIGHT) * layout.height,
  };
}

function getLaneHitFlashGeometry(viewport, lane, stageCarpetImage, sceneBackgroundImage) {
  const carpetLayout = getStageCarpetLayout(viewport, lane, stageCarpetImage);
  const backdropLayout = getCoverBackdropLayout(viewport, sceneBackgroundImage);

  if (backdropLayout) {
    const topLeft = mapLaneHitFlashSourceAnchor(
      backdropLayout,
      LANE_HIT_FLASH_SOURCE_ANCHORS.topLeft
    );
    const topRight = mapLaneHitFlashSourceAnchor(
      backdropLayout,
      LANE_HIT_FLASH_SOURCE_ANCHORS.topRight
    );
    const bottomLeft = mapLaneHitFlashSourceAnchor(
      backdropLayout,
      LANE_HIT_FLASH_SOURCE_ANCHORS.bottomLeft
    );
    const bottomRight = mapLaneHitFlashSourceAnchor(
      backdropLayout,
      LANE_HIT_FLASH_SOURCE_ANCHORS.bottomRight
    );

    return {
      flashTopY: topLeft.y,
      flashBottomY: Math.max(topLeft.y + 1, bottomLeft.y),
      flashTopTargetLeftX: topLeft.x,
      flashTopTargetRightX: topRight.x,
      flashBottomTargetLeftX: bottomLeft.x,
      flashBottomTargetRightX: bottomRight.x,
    };
  }

  return {
    flashTopY: carpetLayout
      ? clamp(
          lane.top + (lane.bottom - lane.top) * 0.28,
          carpetLayout.y + 8,
          carpetLayout.y + carpetLayout.height - 28
        )
      : lane.top + (lane.bottom - lane.top) * 0.28,
    flashBottomY: viewport.height,
    flashTopTargetLeftX: viewport.width * LANE_HIT_FLASH_CALIBRATION.topLeftRatio,
    flashTopTargetRightX: viewport.width * LANE_HIT_FLASH_CALIBRATION.topRightRatio,
    flashBottomTargetLeftX: viewport.width * LANE_HIT_FLASH_CALIBRATION.bottomLeftRatio,
    flashBottomTargetRightX: viewport.width * LANE_HIT_FLASH_CALIBRATION.bottomRightRatio,
  };
}

function drawLaneHitFlash(ctx, viewport, lane, effect, stageCarpetImage, sceneBackgroundImage) {
  const progress = effect.age / effect.duration;
  const intensity = Math.pow(1 - progress, 1.35);
  const flashAlphaBottom = 0.54;
  const flashAlphaNear = 0.34;
  const flashAlphaMid = 0.16;
  const flashStopNear = 0.18;
  const flashStopMid = 0.46;

  if (intensity <= 0.01) {
    return;
  }

  const palette = getLaneFlashPalette(effect.quality);
  const {
    flashTopY,
    flashBottomY,
    flashTopTargetLeftX,
    flashTopTargetRightX,
    flashBottomTargetLeftX,
    flashBottomTargetRightX,
  } = getLaneHitFlashGeometry(viewport, lane, stageCarpetImage, sceneBackgroundImage);

  ctx.save();
  const laneGradient = ctx.createLinearGradient(0, flashBottomY, 0, flashTopY);
  laneGradient.addColorStop(0, toRgba(palette.core, intensity * flashAlphaBottom));
  laneGradient.addColorStop(flashStopNear, toRgba(palette.core, intensity * flashAlphaNear));
  laneGradient.addColorStop(flashStopMid, toRgba(palette.edge, intensity * flashAlphaMid));
  laneGradient.addColorStop(1, toRgba(palette.edge, 0));
  ctx.fillStyle = laneGradient;
  ctx.beginPath();
  const pathSteps = 10;
  for (let step = 0; step <= pathSteps; step += 1) {
    const t = step / pathSteps;
    const y = lerp(flashTopY, flashBottomY, t);
    const x = lerp(flashTopTargetLeftX, flashBottomTargetLeftX, t);
    if (step === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  for (let step = pathSteps; step >= 0; step -= 1) {
    const t = step / pathSteps;
    const y = lerp(flashTopY, flashBottomY, t);
    const x = lerp(flashTopTargetRightX, flashBottomTargetRightX, t);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLaneBase(ctx, lane) {
  const laneGradient = ctx.createLinearGradient(0, lane.top, 0, lane.bottom);
  laneGradient.addColorStop(0, `rgba(255, 255, 255, ${lerp(0.06, 0.03, lane.cameraProgress)})`);
  laneGradient.addColorStop(0.55, "rgba(255, 255, 255, 0.06)");
  laneGradient.addColorStop(1, "rgba(255, 255, 255, 0.11)");
  ctx.fillStyle = laneGradient;
  drawLaneShape(ctx, lane);
  ctx.fill();

  ctx.strokeStyle = "rgba(160, 214, 255, 0.26)";
  ctx.lineWidth = 2;
  drawLaneShape(ctx, lane);
  ctx.stroke();

  ctx.fillStyle = "rgba(140, 205, 255, 0.08)";
  drawLaneShape(ctx, lane, lane.topWidth * 0.22, lane.bottomWidth * 0.24);
  ctx.fill();

  ctx.strokeStyle = "rgba(213, 241, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(lane.centerX, lane.top + 12);
  ctx.lineTo(lane.centerX, lane.bottom - 12);
  ctx.stroke();
}

function drawLane(ctx, viewport, lane, effects = [], characterSprites = {}, options = {}) {
  const drewCarpet = drawStageCarpet(ctx, viewport, lane, characterSprites.stageCarpet);
  const showLaneBase = options.showLaneBase !== false;

  if (!drewCarpet && showLaneBase) {
    drawLaneBase(ctx, lane);
  }

  effects.forEach((effect) => {
    if (effect.kind === "laneFlash") {
      drawLaneHitFlash(
        ctx,
        viewport,
        lane,
        effect,
        characterSprites.stageCarpet,
        characterSprites.sceneBackground
      );
    }
  });
}

function getBackdropCarpetEdgeX(backdropLayout, screenY, side) {
  if (!backdropLayout) {
    return null;
  }

  const sourceY =
    ((screenY - backdropLayout.y) / Math.max(1, backdropLayout.height)) *
    LANE_HIT_FLASH_SOURCE_BASE_HEIGHT;
  const carpetProgress = clamp(
    (sourceY - STAGE_CARPET_TOP) /
      Math.max(1, LANE_HIT_FLASH_SOURCE_BASE_HEIGHT - STAGE_CARPET_TOP),
    0,
    1
  );
  const ratio = getStageCarpetEdgeRatio(carpetProgress, side);
  return backdropLayout.x + backdropLayout.width * ratio;
}

function getBackdropCrowdCarpetEdgeX(backdropLayout, screenY, side) {
  if (!backdropLayout) {
    return null;
  }

  const topAnchor =
    side === "left" ? LANE_HIT_FLASH_SOURCE_ANCHORS.topLeft : LANE_HIT_FLASH_SOURCE_ANCHORS.topRight;
  const bottomAnchor =
    side === "left"
      ? LANE_HIT_FLASH_SOURCE_ANCHORS.bottomLeft
      : LANE_HIT_FLASH_SOURCE_ANCHORS.bottomRight;
  const sourceY =
    ((screenY - backdropLayout.y) / Math.max(1, backdropLayout.height)) *
    LANE_HIT_FLASH_SOURCE_BASE_HEIGHT;
  const edgeProgress = clamp(
    (sourceY - topAnchor.y) / Math.max(1, bottomAnchor.y - topAnchor.y),
    0,
    1
  );
  const sourceX = lerp(topAnchor.x, bottomAnchor.x, edgeProgress);

  return backdropLayout.x + (sourceX / LANE_HIT_FLASH_SOURCE_BASE_WIDTH) * backdropLayout.width;
}

function getImpactZoneVisualMetrics(viewport, lane, sceneBackgroundImage) {
  const fallbackZoneRadiusX = lane.targetWidth * 0.6;
  const fallbackLineWidth = fallbackZoneRadiusX * 1.74;
  const backdropLayout = getCoverBackdropLayout(viewport, sceneBackgroundImage);

  if (!backdropLayout) {
    return {
      zoneRadiusX: fallbackZoneRadiusX,
      lineWidth: fallbackLineWidth,
    };
  }

  const leftEdgeX = getBackdropCarpetEdgeX(backdropLayout, lane.targetY, "left");
  const rightEdgeX = getBackdropCarpetEdgeX(backdropLayout, lane.targetY, "right");
  if (leftEdgeX === null || rightEdgeX === null || rightEdgeX <= leftEdgeX) {
    return {
      zoneRadiusX: fallbackZoneRadiusX,
      lineWidth: fallbackLineWidth,
    };
  }

  const availableWidth = Math.max(1, rightEdgeX - leftEdgeX - IMPACT_ZONE_EDGE_PADDING * 2);
  const maxZoneRadiusX = Math.max(
    12,
    (availableWidth * IMPACT_ZONE_ELLIPSE_TO_CARPET_RATIO) / 2
  );
  const maxLineWidth = Math.max(8, availableWidth * IMPACT_ZONE_LINE_TO_CARPET_RATIO);

  return {
    zoneRadiusX: Math.min(fallbackZoneRadiusX, maxZoneRadiusX),
    lineWidth: Math.min(fallbackLineWidth, maxLineWidth),
  };
}

function drawImpactZone(ctx, viewport, lane, sceneBackgroundImage, sceneTime = 0, magicVisualTime = sceneTime) {
  const zoneY =
    lane.targetY + lerp(8, -4, lane.cameraProgress) + IMPACT_ZONE_ELLIPSE_Y_OFFSET;
  const { zoneRadiusX, lineWidth } = getImpactZoneVisualMetrics(
    viewport,
    lane,
    sceneBackgroundImage
  );
  const zoneRadiusY = lerp(18, 24, lane.cameraProgress);
  const innerRadiusX = Math.max(12, zoneRadiusX - 5);
  const innerRadiusY = Math.max(8, zoneRadiusY - 5);
  const highlightRadiusX = Math.max(10, zoneRadiusX * 0.68);
  const highlightRadiusY = Math.max(5, zoneRadiusY * 0.42);
  const barLeft = snapToGrid(lane.centerX - lineWidth / 2, 1);
  const barY = snapToGrid(lane.targetY - 2, 1);
  const barWidth = snapToGrid(lineWidth, 1);
  const magicPulse = 0.5 + Math.sin(sceneTime * 2.2) * 0.5;
  const anchorAlpha = 0.78 + magicPulse * 0.14;
  const energyLeft = barLeft + 7;
  const energyRight = barLeft + barWidth - 7;
  const energyWidth = Math.max(8, energyRight - energyLeft);

  ctx.save();
  drawPixelEllipseFill(ctx, lane.centerX, zoneY + 3, zoneRadiusX + 4, zoneRadiusY + 3, UI_PANEL_SHADOW, 0.14);
  drawPixelEllipseFill(ctx, lane.centerX, zoneY, zoneRadiusX, zoneRadiusY, "#B89043", 0.14 + magicPulse * 0.03);
  drawPixelEllipseFill(
    ctx,
    lane.centerX,
    zoneY + IMPACT_ZONE_INNER_ELLIPSE_Y_OFFSET,
    innerRadiusX,
    innerRadiusY,
    "#7C5D2F",
    0.1 + magicPulse * 0.025
  );
  drawPixelEllipseFill(
    ctx,
    lane.centerX,
    zoneY + IMPACT_ZONE_HIGHLIGHT_Y_OFFSET,
    highlightRadiusX,
    highlightRadiusY,
    "#FFE8A6",
    0.06 + magicPulse * 0.02
  );
  drawMagicEllipseBorder(ctx, lane.centerX, zoneY, zoneRadiusX, zoneRadiusY, magicPulse);
  drawMagicEllipseSweep(ctx, lane.centerX, zoneY, zoneRadiusX, zoneRadiusY, magicVisualTime);

  drawMagicEnergyLine(ctx, {
    left: energyLeft,
    y: barY,
    width: energyWidth,
    sceneTime,
    pulse: magicPulse,
  });

  drawPixelDiamond(ctx, barLeft + 7, barY + 2, 5, "#6E431A", 0.18 + magicPulse * 0.08);
  drawPixelDiamond(ctx, barLeft + 7, barY + 2, 4, "#D69A3B", anchorAlpha);
  drawPixelDiamond(ctx, barLeft + 7, barY + 2, 2, "#FFF0B8", 0.78 + magicPulse * 0.16);
  drawPixelDiamond(ctx, barLeft + barWidth - 7, barY + 2, 5, "#6E431A", 0.18 + magicPulse * 0.08);
  drawPixelDiamond(ctx, barLeft + barWidth - 7, barY + 2, 4, "#D69A3B", anchorAlpha);
  drawPixelDiamond(ctx, barLeft + barWidth - 7, barY + 2, 2, "#FFF0B8", 0.78 + magicPulse * 0.16);

  IMPACT_ZONE_MAGIC_DUST_SEEDS.forEach((seed, index) => {
    const life = getMagicDustLife(sceneTime, seed);
    const rise = easeOutCubic(life);
    const sway = Math.sin(sceneTime * 1.35 + seed.phase * Math.PI * 2 + index * 0.5);
    const dustX = barLeft + barWidth * seed.x + sway * (1.8 + Math.abs(seed.drift || 0));
    const dustY = barY + 3 - rise * (18 + (index % 4) * 3);
    const dustAlpha = getMagicDustAlpha(life) * (0.34 + seed.size * 0.12);
    const dustSize = getMagicDustSize(seed, life);

    if (dustAlpha > 0.04) {
      drawPixelSpark(
        ctx,
        dustX,
        dustY,
        dustSize,
        "#D69A3B",
        dustSize > 1 ? "#FFF0B8" : "#FFE08A",
        dustAlpha
      );
    }
  });

  IMPACT_ZONE_RING_DUST_SEEDS.forEach((seed, index) => {
    const angle = seed.angle * Math.PI * 2 + sceneTime * 0.08;
    const life = getMagicDustLife(sceneTime, seed);
    const rise = easeOutCubic(life);
    const sway = Math.sin(sceneTime * 1.1 + index * 0.8) * (seed.drift || 0);
    const ringX = lane.centerX + Math.cos(angle) * (zoneRadiusX + 4);
    const ringY = zoneY + Math.sin(angle) * (zoneRadiusY + 3) - rise * (14 + (index % 3) * 5);
    const ringAlpha = getMagicDustAlpha(life) * (0.78 + seed.size * 0.08);
    const ringSize = getMagicDustSize(seed, life);

    if (ringAlpha > 0.04) {
      drawPixelSpark(
        ctx,
        ringX + sway,
        ringY,
        ringSize,
        "#D69A3B",
        "#FFF0B8",
        ringAlpha
      );
    }
  });
  ctx.restore();
}

function getCharacterDamageAlpha(effects = []) {
  return effects.reduce((maxAlpha, effect) => {
    if (effect.kind !== "damage") {
      return maxAlpha;
    }

    const duration = Math.max(0.001, effect.duration || 0.42);
    const maxDamageAlpha = effect.maxAlpha === undefined ? 0.72 : effect.maxAlpha;
    const fadeTail = Math.max(0, effect.fadeTail || 0);
    let alpha = 0;

    if (fadeTail > 0 && duration > fadeTail) {
      const sustainUntil = duration - fadeTail;
      if (effect.age <= sustainUntil) {
        alpha = maxDamageAlpha;
      } else {
        const fadeProgress = (effect.age - sustainUntil) / fadeTail;
        alpha = maxDamageAlpha * (1 - clamp(fadeProgress, 0, 1));
      }
    } else {
      const progress = effect.age / duration;
      alpha = maxDamageAlpha * (1 - progress);
    }

    return Math.max(maxAlpha, alpha);
  }, 0);
}

function getSpriteAspect(sprite, fallback = 1, sourceRect = null) {
  if (sourceRect && sourceRect.width && sourceRect.height) {
    return sourceRect.width / sourceRect.height;
  }

  if (!sprite || !sprite.width || !sprite.height) {
    return fallback;
  }

  return sprite.width / sprite.height;
}

function drawSpriteShadow(ctx, centerX, centerY, radiusX, radiusY, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
}

function getTintBuffer(width, height) {
  const safeWidth = Math.max(1, Math.ceil(width));
  const safeHeight = Math.max(1, Math.ceil(height));

  if (typeof createWebOffscreenCanvas !== "function") {
    return null;
  }

  let canvas = null;
  let context = null;

  try {
    canvas = createWebOffscreenCanvas({
      type: "2d",
      width: safeWidth,
      height: safeHeight,
    });
    context = canvas.getContext("2d");
  } catch (error) {
    return null;
  }

  if (!context) {
    return null;
  }

  canvas.width = safeWidth;
  canvas.height = safeHeight;
  return {
    canvas,
    context,
    width: safeWidth,
    height: safeHeight,
  };
}

function normalizeSourceRect(sprite, sourceRect = null) {
  if (!sprite || !sourceRect) {
    return null;
  }

  const spriteWidth = Math.max(1, Math.round(sprite.width || 0));
  const spriteHeight = Math.max(1, Math.round(sprite.height || 0));
  const x = Math.max(0, Math.min(spriteWidth - 1, Math.round(sourceRect.x || 0)));
  const y = Math.max(0, Math.min(spriteHeight - 1, Math.round(sourceRect.y || 0)));
  const width = Math.max(
    1,
    Math.min(spriteWidth - x, Math.round(sourceRect.width || spriteWidth))
  );
  const height = Math.max(
    1,
    Math.min(spriteHeight - y, Math.round(sourceRect.height || spriteHeight))
  );

  return { x, y, width, height };
}

function drawSpriteImage(ctx, sprite, x, y, width, height, sourceRect = null) {
  const rect = normalizeSourceRect(sprite, sourceRect);

  if (rect) {
    ctx.drawImage(sprite, rect.x, rect.y, rect.width, rect.height, x, y, width, height);
    return;
  }

  ctx.drawImage(sprite, x, y, width, height);
}

function drawTintedOverlay(ctx, sprite, x, y, width, height, alpha, fillStyle, sourceRect = null) {
  const buffer = getTintBuffer(width, height);

  if (!buffer) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.75;
    ctx.shadowColor = fillStyle;
    ctx.shadowBlur = Math.max(8, width * 0.12);
    ctx.globalCompositeOperation = "lighter";
    drawSpriteImage(ctx, sprite, x, y, width, height, sourceRect);
    ctx.restore();
    return;
  }

  buffer.context.clearRect(0, 0, buffer.width, buffer.height);
  buffer.context.imageSmoothingEnabled = false;
  drawSpriteImage(buffer.context, sprite, 0, 0, buffer.width, buffer.height, sourceRect);
  buffer.context.globalCompositeOperation = "source-atop";
  buffer.context.fillStyle = fillStyle;
  buffer.context.fillRect(0, 0, buffer.width, buffer.height);
  buffer.context.globalCompositeOperation = "source-over";

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(buffer.canvas, x, y, width, height);
  ctx.restore();
}

function drawPixelSprite(ctx, sprite, x, y, width, height, options = {}) {
  if (!sprite) {
    return;
  }

  const resolvedOptions =
    typeof options === "number"
      ? { damageAlpha: options }
      : options || {};
  const damageAlpha = resolvedOptions.damageAlpha || 0;
  const baseAlpha = resolvedOptions.baseAlpha === undefined ? 1 : resolvedOptions.baseAlpha;
  const damageTintAlpha =
    resolvedOptions.damageTintAlpha === undefined
      ? damageAlpha * 0.82
      : resolvedOptions.damageTintAlpha;
  const damageGlowAlpha =
    resolvedOptions.damageGlowAlpha === undefined
      ? damageAlpha * 0.26
      : resolvedOptions.damageGlowAlpha;
  const sourceRect = resolvedOptions.sourceRect || null;

  ctx.save();
  const previousSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = baseAlpha;
  drawSpriteImage(ctx, sprite, x, y, width, height, sourceRect);
  ctx.globalAlpha = 1;

  if (damageAlpha > 0.01) {
    drawTintedOverlay(
      ctx,
      sprite,
      x,
      y,
      width,
      height,
      damageTintAlpha,
      DAMAGE_TINT_BASE,
      sourceRect
    );
    if (damageGlowAlpha > 0.001) {
      drawTintedOverlay(
        ctx,
        sprite,
        x,
        y,
        width,
        height,
        damageGlowAlpha,
        DAMAGE_GLOW_BASE,
        sourceRect
      );
    }
  }

  ctx.imageSmoothingEnabled = previousSmoothing;
  ctx.restore();
}

function drawSpriteFrame(ctx, sprite, x, y, width, height, options = {}) {
  if (!sprite) {
    return;
  }

  const alpha = options.alpha === undefined ? 1 : options.alpha;
  const mirrorX = !!options.mirrorX;
  const rotation = options.rotation || 0;
  const shadowColor = options.shadowColor || null;
  const shadowBlur = options.shadowBlur || 0;
  const sourceRect = options.sourceRect || null;

  ctx.save();
  const previousSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  if (shadowColor && shadowBlur > 0) {
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
  }

  if (mirrorX || rotation) {
    ctx.translate(x + width / 2, y + height / 2);
    if (rotation) {
      ctx.rotate(rotation);
    }
    if (mirrorX) {
      ctx.scale(-1, 1);
    }
    drawSpriteImage(ctx, sprite, -width / 2, -height / 2, width, height, sourceRect);
  } else {
    drawSpriteImage(ctx, sprite, x, y, width, height, sourceRect);
  }

  ctx.imageSmoothingEnabled = previousSmoothing;
  ctx.restore();
}

function getStageCompanionBobOffset(options = {}) {
  const pixelBobPattern = Array.isArray(options.pixelBobPattern)
    ? options.pixelBobPattern
    : null;
  if (pixelBobPattern && pixelBobPattern.length > 0) {
    const speed = Math.max(0.001, options.pixelBobSpeed || 1);
    const phase = options.phase || 0;
    const frameIndex = Math.floor((options.currentTime * speed + phase) % pixelBobPattern.length);
    return Math.round(pixelBobPattern[frameIndex] || 0);
  }

  return options.bobAmount
    ? Math.sin(options.phase + options.currentTime * options.bobSpeed) * options.bobAmount
    : 0;
}

function getStageCompanionLayout(sprite, centerX, feetY, targetHeight, options = {}) {
  if (!sprite) {
    return null;
  }

  const aspect = getSpriteAspect(sprite, options.fallbackAspect || 0.75);
  const bobOffset = getStageCompanionBobOffset(options);
  const height = targetHeight;
  const widthScale = options.widthScale === undefined ? 1 : Math.max(0.12, options.widthScale);
  const width = height * aspect * widthScale;
  const x = centerX - width / 2 + (options.xOffset ?? 0);
  const y = feetY - height + bobOffset + (options.yOffset ?? 0);
  const shadowY =
    feetY +
    bobOffset * (options.shadowFollowBob === undefined ? 0.8 : options.shadowFollowBob) +
    (options.shadowOffsetY === undefined ? -1 : options.shadowOffsetY);

  return {
    centerX,
    height,
    width,
    x,
    y,
    shadowY,
  };
}

function drawStageCompanionShadow(ctx, layout, options = {}, turnBlend = 0) {
  if (!layout) {
    return;
  }

  const clampedTurnBlend = clamp(turnBlend, 0, 1);
  const shadowWidthScale = lerp(1, 0.88, clampedTurnBlend);
  const shadowHeightScale = lerp(1, 0.92, clampedTurnBlend);
  const shadowFill =
    options.shadowFill || `rgba(3, 7, 16, ${lerp(0.28, 0.22, clampedTurnBlend).toFixed(3)})`;

  drawSpriteShadow(
    ctx,
    layout.centerX,
    layout.shadowY,
    layout.width * (options.shadowScaleX || 0.25) * shadowWidthScale,
    Math.max(4, layout.height * (options.shadowScaleY || 0.05) * shadowHeightScale),
    shadowFill
  );

  if (options.glowFill) {
    drawSpriteShadow(
      ctx,
      layout.centerX,
      layout.shadowY - 1,
      layout.width * (options.glowScaleX || 0.18) * shadowWidthScale,
      Math.max(3, layout.height * (options.glowScaleY || 0.034) * shadowHeightScale),
      options.glowFill
    );
  }
}

function drawStageCompanion(ctx, sprite, centerX, feetY, targetHeight, options = {}) {
  const layout = getStageCompanionLayout(sprite, centerX, feetY, targetHeight, options);
  if (!layout) {
    return;
  }

  drawStageCompanionShadow(ctx, layout, options, options.turnBlend || 0);
  drawPixelSprite(ctx, sprite, layout.x, layout.y, layout.width, layout.height, options);
}

function drawStageCompanionPose(
  ctx,
  frontSprite,
  sideSprite,
  centerX,
  feetY,
  targetHeight,
  pose,
  options = {}
) {
  if (!pose || !pose.turning || !frontSprite || !sideSprite) {
    const sprite =
      pose && pose.facingFront ? frontSprite || sideSprite : sideSprite || frontSprite;
    drawStageCompanion(ctx, sprite, centerX, feetY, targetHeight, options);
    return;
  }

  const turnBlend = clamp(pose.turnBlend || 0, 0, 1);
  const layerOffset = clamp(targetHeight * 0.026, 1, 2) * turnBlend;
  const shadowSprite =
    pose.frontAlpha >= pose.sideAlpha ? frontSprite || sideSprite : sideSprite || frontSprite;
  const shadowLayout = getStageCompanionLayout(
    shadowSprite,
    centerX,
    feetY,
    targetHeight,
    options
  );

  drawStageCompanionShadow(ctx, shadowLayout, options, turnBlend);

  [
    { sprite: frontSprite, alpha: pose.frontAlpha, xOffset: -layerOffset },
    { sprite: sideSprite, alpha: pose.sideAlpha, xOffset: layerOffset },
  ].forEach((layer) => {
    if (!layer.sprite || layer.alpha <= 0.001) {
      return;
    }

    const layerLayout = getStageCompanionLayout(
      layer.sprite,
      centerX + layer.xOffset,
      feetY,
      targetHeight,
      options
    );
    if (!layerLayout) {
      return;
    }

    drawPixelSprite(
      ctx,
      layer.sprite,
      layerLayout.x,
      layerLayout.y,
      layerLayout.width,
      layerLayout.height,
      {
        ...options,
        baseAlpha: layer.alpha,
      }
    );
  });
}

function getRabbitWandSpriteData(
  characterSprites = {},
  rabbitAnimation = null,
  rabbitFacingBack = false,
  rabbitWandSwingVariant = 1
) {
  if (!rabbitFacingBack || !rabbitAnimation || !rabbitAnimation.active) {
    return null;
  }

  const variantConfig =
    RABBIT_WAND_VARIANTS[rabbitWandSwingVariant] || RABBIT_WAND_VARIANTS[1];
  const sprite = characterSprites[variantConfig.spriteKey];
  if (!sprite || !sprite.width || !sprite.height) {
    return null;
  }

  const frameCount = Math.max(1, rabbitAnimation.frameCount || 1);
  const frameIndex = clamp(
    Math.round(rabbitAnimation.frameIndex || 0),
    0,
    frameCount - 1
  );
  const frameWidth = Math.max(1, Math.floor(sprite.width / frameCount));

  return {
    sprite,
    bodyCenterRatio: variantConfig.bodyCenterRatio,
    sourceRect: {
      x: frameIndex * frameWidth,
      y: 0,
      width: frameWidth,
      height: sprite.height,
    },
  };
}

function getActiveRabbitDamageEffect(effects = []) {
  return effects.reduce((activeEffect, effect) => {
    if (!effect || effect.kind !== "damage") {
      return activeEffect;
    }

    const age = Math.max(0, effect.age || 0);
    if (age >= RABBIT_HIT_SHEET.duration) {
      return activeEffect;
    }

    if (!activeEffect) {
      return effect;
    }

    const activeAge = Math.max(0, activeEffect.age || 0);
    return age <= activeAge ? effect : activeEffect;
  }, null);
}

function getRabbitHitSpriteData(
  characterSprites = {},
  effects = [],
  rabbitFacingBack = false
) {
  if (!rabbitFacingBack) {
    return null;
  }

  const damageEffect = getActiveRabbitDamageEffect(effects);
  if (!damageEffect) {
    return null;
  }

  const animationDuration = RABBIT_HIT_SHEET.duration;
  const age = Math.max(0, damageEffect.age || 0);
  if (age >= animationDuration) {
    return null;
  }

  const sprite = characterSprites[RABBIT_HIT_SHEET.spriteKey];
  if (!sprite || !sprite.width || !sprite.height) {
    return null;
  }

  const frameCount = Math.max(1, RABBIT_HIT_SHEET.frameCount || 1);
  const frameProgress = clamp(age / animationDuration, 0, 0.999999);
  const frameIndex = Math.min(
    frameCount - 1,
    Math.floor(frameProgress * frameCount)
  );
  const frameWidth = Math.max(1, Math.floor(sprite.width / frameCount));

  return {
    sprite,
    bodyCenterRatio: RABBIT_HIT_SHEET.bodyCenterRatio,
    sourceRect: {
      x: frameIndex * frameWidth,
      y: 0,
      width: frameWidth,
      height: sprite.height,
    },
  };
}

function getRabbitSceneLayout(
  viewport,
  lane,
  characterSprites = {},
  currentTime = 0,
  rabbitAnimation = null,
  rabbitWandSwingVariant = 1,
  effects = []
) {
  const sprites = characterSprites || {};
  const rabbitHeight = clamp(viewport.height * 0.15, 112, 156);
  const rabbitTurnProgress = lane.rabbitTurnProgress;
  const rabbitFacingBack = rabbitTurnProgress >= 0.5;
  const frontRender = {
    sprite: sprites.rabbitFront,
    bodyCenterRatio: 0.5,
    sourceRect: null,
  };
  const backRender =
    getRabbitHitSpriteData(
      sprites,
      effects,
      true
    ) ||
    getRabbitWandSpriteData(
      sprites,
      rabbitAnimation,
      true,
      rabbitWandSwingVariant
    ) || {
      sprite: sprites.rabbitBack,
      bodyCenterRatio: 0.5,
      sourceRect: null,
    };
  const rabbitRender = rabbitFacingBack ? backRender : frontRender;
  const rabbitFeetY = lerp(
    Math.min(viewport.height - 28, lane.bottom - rabbitHeight * 0.08),
    Math.min(viewport.height - 18, lane.bottom - 8),
    lane.cameraProgress
  );
  const rabbitPadY = rabbitFeetY - rabbitHeight * 0.2;
  const easedRabbitTurn = easeInOutSine(rabbitTurnProgress);
  const rabbitTurnBlend = Math.sin(easedRabbitTurn * Math.PI);
  const rabbitWidthScale = lerp(1, RABBIT_TURN_MIN_WIDTH_SCALE, rabbitTurnBlend);
  const rabbitBaseAspect = getSpriteAspect(
    rabbitRender.sprite,
    0.98,
    rabbitRender.sourceRect
  );
  const rabbitWidth = rabbitHeight * rabbitBaseAspect * rabbitWidthScale;
  const rabbitAnchorOffsetX =
    rabbitRender.sourceRect && rabbitFacingBack
      ? (0.5 - rabbitRender.bodyCenterRatio) * rabbitWidth
      : 0;
  const rabbitBobOffset = getStageCompanionBobOffset({
    currentTime,
    phase: RABBIT_IDLE_PIXEL_BOB_PHASE,
    pixelBobPattern: RABBIT_IDLE_PIXEL_BOB_PATTERN,
    pixelBobSpeed: RABBIT_IDLE_PIXEL_BOB_SPEED,
  });
  const rabbitX = lane.centerX - rabbitWidth / 2 + rabbitAnchorOffsetX;
  const rabbitY = rabbitFeetY - rabbitHeight + rabbitBobOffset;
  const getLayerLayout = (render, alpha, xOffset = 0) => {
    if (!render || !render.sprite || alpha <= 0.001) {
      return null;
    }

    const layerAspect = getSpriteAspect(render.sprite, 0.98, render.sourceRect);
    const layerWidth = rabbitHeight * layerAspect * rabbitWidthScale;
    const layerFacingBack = render === backRender;
    const layerAnchorOffsetX =
      render.sourceRect && layerFacingBack
        ? (0.5 - render.bodyCenterRatio) * layerWidth
        : 0;
    const layerX = lane.centerX - layerWidth / 2 + layerAnchorOffsetX + xOffset;
    const layerY = rabbitFeetY - rabbitHeight + rabbitBobOffset;

    return {
      sprite: render.sprite,
      sourceRect: render.sourceRect,
      alpha,
      x: layerX,
      y: layerY,
      width: layerWidth,
      height: rabbitHeight,
    };
  };
  const rabbitLayerOffset = clamp(rabbitHeight * 0.014, 1, 2) * rabbitTurnBlend;
  const rabbitLayers = [];
  const frontLayer = getLayerLayout(
    frontRender,
    1 - easedRabbitTurn,
    -rabbitLayerOffset
  );
  const backLayer = getLayerLayout(
    backRender,
    easedRabbitTurn,
    rabbitLayerOffset
  );

  if (frontLayer) {
    rabbitLayers.push(frontLayer);
  }
  if (backLayer) {
    rabbitLayers.push(backLayer);
  }

  return {
    sprite: rabbitRender.sprite,
    sourceRect: rabbitRender.sourceRect,
    x: rabbitX,
    y: rabbitY,
    width: rabbitWidth,
    height: rabbitHeight,
    feetY: rabbitFeetY,
    padY: rabbitPadY,
    facingBack: rabbitFacingBack,
    turnProgress: rabbitTurnProgress,
    turnBlend: rabbitTurnBlend,
    layers: rabbitLayers.length > 1 ? rabbitLayers : null,
  };
}

function drawTeleportPad(ctx, centerX, centerY, radiusX, radiusY, currentTime, active) {
  const pulse = active ? 1 + Math.sin(currentTime * 6.2) * 0.06 : 0.96;
  const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radiusX * 1.22);
  glow.addColorStop(0, active ? "rgba(218, 248, 255, 0.18)" : "rgba(218, 248, 255, 0.08)");
  glow.addColorStop(0.55, active ? "rgba(132, 230, 255, 0.1)" : "rgba(132, 230, 255, 0.05)");
  glow.addColorStop(1, "rgba(132, 230, 255, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX * 1.22, radiusY * 1.6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = active ? "rgba(236, 249, 255, 0.86)" : "rgba(218, 241, 255, 0.52)";
  ctx.lineWidth = active ? 3 : 2;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX * pulse, radiusY * pulse, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = active ? "rgba(220, 248, 255, 0.12)" : "rgba(220, 248, 255, 0.06)";
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX * 0.68, radiusY * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
}

function getLaneYAtProgress(lane, progress) {
  return lerp(lane.top, lane.bottom, progress);
}

function getLaneWidthAtProgress(lane, progress) {
  return lerp(lane.topWidth, lane.bottomWidth, progress);
}

function getLaneSideXAtProgress(lane, progress, side) {
  const width = getLaneWidthAtProgress(lane, progress);
  const direction = side === "right" ? 1 : -1;
  return lane.centerX + direction * width * 0.5;
}

const CROWD_PLACEMENTS = Object.freeze([
  {
    id: 4,
    side: "left",
    lineProgress: 0.44,
    depth: 0.16,
    edgeGapRatio: 0.1,
    phase: 0.4,
  },
  {
    id: 1,
    side: "right",
    lineProgress: 0.38,
    depth: 0.08,
    edgeGapRatio: 0.096,
    phase: 1.3,
  },
  {
    id: 2,
    side: "right",
    lineProgress: 0.53,
    depth: 0.3,
    edgeGapRatio: 0.108,
    phase: 2.2,
  },
  {
    id: 5,
    side: "left",
    lineProgress: 0.61,
    depth: 0.44,
    edgeGapRatio: 0.114,
    phase: 3.4,
  },
  {
    id: 3,
    side: "right",
    lineProgress: 0.68,
    depth: 0.58,
    edgeGapRatio: 0.12,
    phase: 4.1,
  },
]);

const CROWD_TARGET_HEIGHT_BY_ID = Object.freeze({
  1: 57,
  2: 61,
  3: 63.5,
  4: 58,
  5: 62,
});
const CROWD_GAP_REFERENCE_ID = 2;
const CROWD_IDLE_PIXEL_BOB_PATTERN = Object.freeze([0, -1, -2, -1, 0, 1, 0, 0]);
const CROWD_IDLE_PIXEL_BOB_SPEED = 5.4;
const CROWD_TURN_MIN_WIDTH_SCALE = 0.94;
const RABBIT_TURN_MIN_WIDTH_SCALE = 0.94;

function getCrowdStageEdgeX(lane, carpetLayout, backdropLayout, progress, screenY, side) {
  const backdropEdgeX = getBackdropCrowdCarpetEdgeX(backdropLayout, screenY, side);
  if (backdropEdgeX !== null) {
    return backdropEdgeX;
  }

  const carpetEdgeX = getStageCarpetEdgeX(carpetLayout, screenY, side);
  if (carpetEdgeX !== null) {
    return carpetEdgeX;
  }

  return getLaneSideXAtProgress(lane, progress, side);
}

function getCrowdReferencePlacement() {
  return CROWD_PLACEMENTS.find((placement) => placement.id === CROWD_GAP_REFERENCE_ID) || null;
}

function getCrowdStageWidthAtY(lane, carpetLayout, screenY) {
  if (carpetLayout) {
    const leftEdgeX = getStageCarpetEdgeX(carpetLayout, screenY, "left");
    const rightEdgeX = getStageCarpetEdgeX(carpetLayout, screenY, "right");
    return Math.max(1, rightEdgeX - leftEdgeX);
  }

  const progress = clamp(
    (screenY - lane.top) / Math.max(1, lane.bottom - lane.top),
    0,
    1
  );
  return getLaneWidthAtProgress(lane, progress);
}

function getCrowdEdgeGap(lane, carpetLayout, screenY, placement, targetHeight, depthProgress) {
  const stageWidth = getCrowdStageWidthAtY(lane, carpetLayout, screenY);
  const edgeGapRatio =
    placement.edgeGapRatio === undefined
      ? lerp(0.096, 0.12, depthProgress)
      : placement.edgeGapRatio;
  const edgeGapBias = placement.edgeGapBias || 0;
  const edgeGap = stageWidth * edgeGapRatio + edgeGapBias;

  return clamp(edgeGap, targetHeight * 0.22, targetHeight * 0.4);
}

function getLegacyCrowdCenterX(lane, carpetLayout, placement, targetFeetY, targetHeight, depthProgress) {
  const laneEdgeX = getLaneSideXAtProgress(lane, placement.lineProgress, placement.side);
  const carpetEdgeX = getStageCarpetEdgeX(carpetLayout, targetFeetY, placement.side);
  const stageEdgeX = carpetEdgeX === null ? laneEdgeX : carpetEdgeX;
  const edgeGap = getCrowdEdgeGap(
    lane,
    carpetLayout,
    targetFeetY,
    placement,
    targetHeight,
    depthProgress
  );

  return stageEdgeX + (placement.side === "right" ? edgeGap : -edgeGap);
}

function getCrowdTargetHeight(viewport, placement, depthProgress) {
  const fixedHeight = CROWD_TARGET_HEIGHT_BY_ID[placement.id];
  if (Number.isFinite(fixedHeight)) {
    return fixedHeight;
  }

  const farHeight = clamp(viewport.height * 0.072, 52, 58);
  const nearHeight = clamp(viewport.height * 0.09, 62, 68);
  return lerp(farHeight, nearHeight, depthProgress);
}

function getCrowdReferenceLayout(viewport, lane, carpetLayout, backdropLayout) {
  const referencePlacement = getCrowdReferencePlacement();
  if (!referencePlacement) {
    return null;
  }

  const depthProgress = clamp(
    referencePlacement.depth === undefined
      ? referencePlacement.lineProgress
      : referencePlacement.depth,
    0,
    1
  );
  const targetHeight = getCrowdTargetHeight(viewport, referencePlacement, depthProgress);
  const targetFeetY = getLaneYAtProgress(lane, referencePlacement.lineProgress);
  const legacyCenterX = getLegacyCrowdCenterX(
    lane,
    carpetLayout,
    referencePlacement,
    targetFeetY,
    targetHeight,
    depthProgress
  );
  const referenceEdgeX = getCrowdStageEdgeX(
    lane,
    carpetLayout,
    backdropLayout,
    referencePlacement.lineProgress,
    targetFeetY,
    referencePlacement.side
  );

  return {
    centerX: legacyCenterX,
    edgeX: referenceEdgeX,
    lineProgress: referencePlacement.lineProgress,
    side: referencePlacement.side,
  };
}

function getStaticCrowdPose(facingFront) {
  return {
    facingFront: !!facingFront,
    frontAlpha: facingFront ? 1 : 0,
    sideAlpha: facingFront ? 0 : 1,
    widthScale: 1,
    turnBlend: 0,
    turning: false,
  };
}

function getCrowdTurnPose(fromFront, toFront, progress) {
  const clampedProgress = clamp(progress, 0, 1);
  if (fromFront === toFront || clampedProgress <= 0) {
    return getStaticCrowdPose(fromFront);
  }
  if (clampedProgress >= 1) {
    return getStaticCrowdPose(toFront);
  }

  const easedProgress = easeInOutSine(clampedProgress);
  const frontAlpha = fromFront ? 1 - easedProgress : easedProgress;
  const sideAlpha = 1 - frontAlpha;
  const turnBlend = Math.sin(easedProgress * Math.PI);

  return {
    facingFront: frontAlpha >= sideAlpha,
    frontAlpha,
    sideAlpha,
    widthScale: lerp(1, CROWD_TURN_MIN_WIDTH_SCALE, turnBlend),
    turnBlend,
    turning: true,
  };
}

function getCrowdFacingState(member, lane, currentTime, gameplayActive) {
  if (!gameplayActive) {
    const turnProgress = lane.rabbitTurnProgress;
    return getCrowdTurnPose(true, false, turnProgress);
  }

  if (!member) {
    return getStaticCrowdPose(false);
  }

  if (member.turnStartedAt !== null) {
    const turnProgress = clamp(
      (currentTime - member.turnStartedAt) / Math.max(0.001, member.turnDuration || 0.28),
      0,
      1
    );
    return getCrowdTurnPose(!!member.turnFromFront, !!member.turnToFront, turnProgress);
  }

  return getStaticCrowdPose(!!member.facingFront);
}

function drawCharacterScene(
  ctx,
  viewport,
  lane,
  characterSprites = {},
  effects = [],
  currentTime = 0,
  rabbitLayout = null,
  crowdMotion = null,
  gameplayActive = true,
  rabbitAnimation = null
) {
  if (!characterSprites) {
    return;
  }

  const settle = lane.cameraProgress;
  const crowdMembers =
    crowdMotion && Array.isArray(crowdMotion.members) ? crowdMotion.members : [];
  const carpetLayout = getStageCarpetLayout(viewport, lane, characterSprites.stageCarpet);
  const backdropLayout = getCoverBackdropLayout(viewport, characterSprites.sceneBackground);
  const crowdReferenceLayout = getCrowdReferenceLayout(
    viewport,
    lane,
    carpetLayout,
    backdropLayout
  );

  CROWD_PLACEMENTS.forEach((placement, index) => {
    const frontSprite = characterSprites[`char${placement.id}Front`];
    const sideSprite = characterSprites[`char${placement.id}Side`];
    const depthProgress = clamp(
      placement.depth === undefined ? placement.lineProgress : placement.depth,
      0,
      1
    );
    const targetHeight = getCrowdTargetHeight(viewport, placement, depthProgress);
    const targetFeetY = getLaneYAtProgress(lane, placement.lineProgress);
    const stageEdgeX = getCrowdStageEdgeX(
      lane,
      carpetLayout,
      backdropLayout,
      placement.lineProgress,
      targetFeetY,
      placement.side
    );
    const legacyCenterX = getLegacyCrowdCenterX(
      lane,
      carpetLayout,
      placement,
      targetFeetY,
      targetHeight,
      depthProgress
    );
    const referenceGap = crowdReferenceLayout
      ? Math.abs(crowdReferenceLayout.centerX - crowdReferenceLayout.edgeX)
      : null;
    const targetCenterX = referenceGap === null
      ? legacyCenterX
      : stageEdgeX + (placement.side === "right" ? referenceGap : -referenceGap);
    const animatedCenterX = lerp(
      lane.centerX + (targetCenterX - lane.centerX) * 0.42,
      targetCenterX,
      settle
    );
    const animatedFeetY = lerp(
      targetFeetY + targetHeight * 0.15,
      targetFeetY,
      settle
    );
    const animatedHeight = lerp(targetHeight * 1.08, targetHeight, settle);
    const facing = getCrowdFacingState(
      crowdMembers[index],
      lane,
      currentTime,
      gameplayActive
    );
    drawStageCompanionPose(
      ctx,
      frontSprite,
      sideSprite,
      animatedCenterX,
      animatedFeetY,
      animatedHeight,
      facing,
      {
        currentTime,
        phase: placement.phase || 0,
        pixelBobPattern: CROWD_IDLE_PIXEL_BOB_PATTERN,
        pixelBobSpeed: CROWD_IDLE_PIXEL_BOB_SPEED,
        widthScale: facing.widthScale,
        shadowOffsetY: -animatedHeight * 0.028,
        shadowFollowBob: 0.45,
        shadowScaleX: 0.28,
        shadowScaleY: 0.062,
        glowFill: "rgba(90, 214, 255, 0.04)",
      }
    );
  });

  const resolvedRabbit =
    rabbitLayout ||
    getRabbitSceneLayout(
      viewport,
      lane,
      characterSprites,
      currentTime,
      rabbitAnimation,
      1,
      effects
    );
  const rabbitDamageAlpha = getCharacterDamageAlpha(effects);
  const rabbitTurnBlend = clamp(resolvedRabbit.turnBlend || 0, 0, 1);

  drawSpriteShadow(
    ctx,
    lane.centerX,
    resolvedRabbit.feetY + 5,
    resolvedRabbit.height * 0.28 * lerp(1, 0.9, rabbitTurnBlend),
    Math.max(8, resolvedRabbit.height * 0.08 * lerp(1, 0.94, rabbitTurnBlend)),
    `rgba(3, 7, 16, ${lerp(0.34, 0.28, rabbitTurnBlend).toFixed(3)})`
  );

  const rabbitLayers =
    Array.isArray(resolvedRabbit.layers) && resolvedRabbit.layers.length > 0
      ? resolvedRabbit.layers
      : [resolvedRabbit];

  rabbitLayers.forEach((layer) => {
    if (!layer || !layer.sprite || layer.width <= 2) {
      return;
    }

    const layerAlpha = clamp(layer.alpha === undefined ? 1 : layer.alpha, 0, 1);
    if (layerAlpha <= 0.001) {
      return;
    }

    drawPixelSprite(
      ctx,
      layer.sprite,
      layer.x,
      layer.y,
      layer.width,
      layer.height,
      {
        sourceRect: layer.sourceRect,
        damageAlpha: rabbitDamageAlpha,
        baseAlpha: layerAlpha * (1 - rabbitDamageAlpha * RABBIT_DAMAGE_ALPHA_FACTOR),
        damageTintAlpha: rabbitDamageAlpha * 0.98 * layerAlpha,
        damageGlowAlpha: 0,
      }
    );
  });
}

function getPigSpriteAsset(characterSprites = {}, direction = null, options = {}) {
  if (direction === "left") {
    if (characterSprites.pigLeft) {
      return {
        sprite: characterSprites.pigLeft,
        mirrorX: false,
      };
    }

    return {
      sprite: characterSprites.pigRight,
      mirrorX: true,
    };
  }

  if (direction === "right") {
    return {
      sprite: characterSprites.pigRight,
      mirrorX: false,
    };
  }

  if (options.useLaunchFront && characterSprites.pigFrontLaunch) {
    return {
      sprite: characterSprites.pigFrontLaunch,
      mirrorX: false,
    };
  }

  return {
    sprite: characterSprites.pigFront,
    mirrorX: false,
  };
}

function getPigDrawScale(direction = null) {
  return direction === "left" || direction === "right"
    ? PIG_SIDE_DRAW_SCALE
    : PIG_FRONT_DRAW_SCALE;
}

function drawPigShadow(ctx, x, y, width, height, alpha = 1) {
  const feetY = y + height * 0.5;
  const shadowY = feetY + height * 0.112;
  drawSpriteShadow(
    ctx,
    x,
    shadowY,
    width * 0.36,
    Math.max(4, height * 0.088),
    `rgba(5, 8, 18, ${0.28 * alpha})`
  );
}

function drawSwipePigDirectionArrow(ctx, x, y, direction, width, height, alpha = 1) {
  if (direction !== "left" && direction !== "right") {
    return;
  }

  const sign = direction === "right" ? 1 : -1;
  const mask = SWIPE_PIG_ARROW_MASK;
  const maskRows = mask.length;
  const maskColumns = mask[0]?.length || 1;
  const targetArrowHeight = snapToGrid(clamp(height * 0.62, 23, 34), 1);
  const blockSize = Math.max(2, Math.round(targetArrowHeight / maskRows));
  const arrowWidth = blockSize * maskColumns;
  const arrowHeight = blockSize * maskRows;
  const centerX = snapToGrid(x + sign * (width * 0.58 + arrowWidth * 0.36), 1);
  const centerY = snapToGrid(y - height * 0.04, 1);
  const left = snapToGrid(centerX - arrowWidth / 2, 1);
  const top = snapToGrid(centerY - arrowHeight / 2, 1);
  const shadowOffsetX = snapToGrid(sign * 2, 1);
  const shadowOffsetY = 3;
  const shouldMirror = direction === "left";
  const drawMask = (offsetX, offsetY, fillStyle, filterBlock) => {
    ctx.fillStyle = fillStyle;
    mask.forEach((row, rowIndex) => {
      for (let columnIndex = 0; columnIndex < maskColumns; columnIndex += 1) {
        const sourceColumnIndex = shouldMirror ? maskColumns - 1 - columnIndex : columnIndex;
        if (row[sourceColumnIndex] !== "X") {
          continue;
        }

        if (filterBlock && !filterBlock(rowIndex, columnIndex, sourceColumnIndex)) {
          continue;
        }

        ctx.fillRect(
          snapToGrid(left + columnIndex * blockSize + offsetX, 1),
          snapToGrid(top + rowIndex * blockSize + offsetY, 1),
          blockSize,
          blockSize
        );
      }
    });
  };

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.imageSmoothingEnabled = false;

  drawMask(shadowOffsetX, shadowOffsetY, SWIPE_PIG_ARROW_SHADOW);
  drawMask(0, 0, SWIPE_PIG_ARROW_FILL);
  drawMask(0, 0, SWIPE_PIG_ARROW_HIGHLIGHT, (rowIndex, columnIndex) => {
    return rowIndex <= 3 && columnIndex <= Math.floor(maskColumns * 0.62);
  });

  ctx.restore();
}

function drawPig(ctx, characterSprites, x, y, scale, direction = null, options = {}) {
  const { sprite, mirrorX } = getPigSpriteAsset(characterSprites, direction, options);
  if (!sprite) {
    return;
  }

  const showShadow = options.showShadow !== false;
  const drawScale = scale * getPigDrawScale(direction);
  const height = PIG_BASE_HEIGHT * drawScale;
  const width = height * getSpriteAspect(sprite, 1.25);
  const left = x - width / 2;
  const top = y - height / 2;

  if (showShadow) {
    drawPigShadow(ctx, x, y, width, height, 1);
  }
  if (showShadow) {
    drawSwipePigDirectionArrow(ctx, x, y, direction, width, height, options.arrowAlpha ?? 1);
  }
  drawSpriteFrame(ctx, sprite, left, top, width, height, {
    mirrorX,
    shadowColor: "rgba(255, 191, 206, 0.28)",
    shadowBlur: Math.max(6, scale * 4),
  });
}

function drawPigLaunch(ctx, centerX, centerY, effect, progress, characterSprites = {}) {
  const launch = effect.launch || {
    direction: 1,
    spin: 3.2,
    drift: 140,
    lift: 64,
    drop: 88,
  };
  const driftX = launch.direction * launch.drift * progress;
  const arcLift = -Math.sin(progress * Math.PI * 0.94) * launch.lift;
  const fall = progress * progress * launch.drop;
  const x = centerX + driftX;
  const y = centerY - 18 + arcLift + fall;
  const rotation = launch.spin * progress * Math.PI;
  const scale = lerp(1.06, 0.9, progress);
  const alpha = 1 - progress * 0.88;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgba(255, 184, 205, 0.34)";
  ctx.shadowBlur = lerp(18, 8, progress);
  drawPig(
    ctx,
    characterSprites,
    0,
    0,
    scale,
    effect.direction || null,
    {
      showShadow: false,
      useLaunchFront: !effect.direction,
    }
  );
  ctx.restore();

  const glassesSprite = characterSprites.pigGlasses;
  if (glassesSprite) {
    const glassesDriftX = launch.direction * launch.drift * 1.08 * progress;
    const glassesArcLift = -Math.sin(progress * Math.PI * 0.96) * launch.lift * 1.45;
    const glassesFall = progress * progress * launch.drop * 0.62;
    const glassesX = centerX + glassesDriftX;
    const glassesY = centerY - 38 + glassesArcLift + glassesFall;
    const glassesRotation =
      launch.spin * progress * Math.PI * 1.35 + launch.direction * 0.24;
    const glassesWidth = PIG_BASE_HEIGHT * scale * PIG_GLASSES_LAUNCH_WIDTH_RATIO;
    const glassesHeight = glassesWidth / getSpriteAspect(glassesSprite, 5.1);
    const glassesAlpha = Math.max(0, 1 - progress * 0.78);

    ctx.save();
    ctx.translate(glassesX, glassesY);
    ctx.rotate(glassesRotation);
    ctx.globalAlpha = glassesAlpha;
    ctx.shadowColor = "rgba(255, 242, 205, 0.25)";
    ctx.shadowBlur = lerp(10, 3, progress);
    drawSpriteFrame(
      ctx,
      glassesSprite,
      -glassesWidth / 2,
      -glassesHeight / 2,
      glassesWidth,
      glassesHeight
    );
    ctx.restore();
  }

  ctx.globalAlpha = 1;
}

function drawHoldPigTailEnd(ctx, centerX, topY, scale, active) {
  const drawScale = scale * HOLD_TAIL_DRAW_SCALE;
  const height = HOLD_TAIL_BASE_HEIGHT * drawScale;
  const width = height * 1.44;
  const top = Math.round(topY - height * 0.38);
  const fill = "#E9C3C3";
  const sideShade = "#D1818C";
  const seam = "rgba(209, 129, 140, 0.32)";
  const shine = active ? "rgba(255, 244, 244, 0.24)" : "rgba(255, 244, 244, 0.12)";
  const capTop = top + Math.round(height * 0.08);
  const capBottom = top + Math.round(height * 0.96);
  const rowHeight = Math.max(1, Math.round(height * 0.13));

  ctx.save();
  if (active) {
    ctx.shadowColor = "rgba(255, 224, 143, 0.34)";
    ctx.shadowBlur = Math.max(8, scale * 6);
  }
  drawPigShadow(ctx, centerX, topY - height * 0.12, width, height, 0.9);

  for (let y = capTop; y <= capBottom; y += rowHeight) {
    const progress = clamp((y - capTop) / Math.max(1, capBottom - capTop), 0, 1);
    const rowWidth =
      progress < 0.3
        ? lerp(width * 0.62, width * 0.98, progress / 0.3)
        : lerp(width * 0.98, width * 1.1, (progress - 0.3) / 0.7);
    const rowWidthRounded = Math.max(6, Math.round(rowWidth));
    const rowHeightClamped = Math.min(rowHeight, capBottom - y + 1);
    const left = Math.round(centerX - rowWidthRounded / 2);
    const rowTop = Math.round(y);
    const edgeWidth = Math.max(1, Math.round(rowWidthRounded * 0.07));
    const highlightWidth = Math.max(4, Math.round(rowWidthRounded * 0.22));
    const highlightLeft = Math.round(centerX - highlightWidth / 2);

    ctx.fillStyle = fill;
    ctx.fillRect(left, rowTop, rowWidthRounded, rowHeightClamped);

    ctx.fillStyle = sideShade;
    ctx.fillRect(left, rowTop, edgeWidth, rowHeightClamped);
    ctx.fillRect(left + rowWidthRounded - edgeWidth, rowTop, edgeWidth, rowHeightClamped);

    if (progress < 0.76) {
      ctx.fillStyle = shine;
      ctx.fillRect(highlightLeft, rowTop + 1, highlightWidth, Math.max(1, rowHeightClamped - 2));
    }
  }

  ctx.fillStyle = seam;
  ctx.fillRect(Math.round(centerX) - 1, top + Math.round(height * 0.32), 2, Math.round(height * 0.24));
  ctx.fillRect(Math.round(centerX) - 1, top + Math.round(height * 0.58), 2, Math.max(2, Math.round(height * 0.12)));

  const tailBaseX = Math.round(centerX + width * 0.1);
  const tailBaseY = top + Math.round(height * 0.02);
  const tailThickness = Math.max(3, Math.round(height * 0.14));
  const tailHeight = Math.max(3, Math.round(height * 0.2));
  ctx.fillStyle = sideShade;
  ctx.fillRect(tailBaseX, tailBaseY, tailThickness, tailHeight);
  ctx.fillRect(tailBaseX + tailThickness - 1, tailBaseY - 2, 3, 3);
  ctx.fillRect(tailBaseX + tailThickness + 1, tailBaseY - 4, 3, 3);
  ctx.fillRect(tailBaseX + tailThickness + 3, tailBaseY - 1, 2, 2);
  ctx.restore();
}

function getNoteVisualAtY(lane, y) {
  const entryTop = lane.noteEntryY === undefined ? lane.top : lane.noteEntryY;
  const perspective = clamp((y - entryTop) / Math.max(1, lane.targetY - entryTop), 0, 1);

  return {
    perspective,
    scale: lerp(0.52, 1.04, perspective),
    glow: lerp(6, 18, perspective),
  };
}

function drawHoldTail(ctx, lane, headY, tailY, headScale, tailScale, active, currentTime) {
  const topY = Math.min(headY, tailY);
  const bottomY = Math.max(headY, tailY);
  const tailJoinOffset = Math.max(
    6,
    Math.round(HOLD_TAIL_BASE_HEIGHT * HOLD_TAIL_DRAW_SCALE * tailScale * 0.54)
  );
  const bodyTopY = topY + tailJoinOffset;
  // Let the hold body tuck further under the pig head so the two parts read as one sprite.
  const bodyBottomY = bottomY - Math.max(10, Math.round(headScale * 13));

  if (bodyBottomY <= bodyTopY) {
    return;
  }

  const topWidth = Math.max(24, tailScale * 31);
  const bottomWidth = Math.max(34, headScale * 42);
  const segmentHeight = Math.max(6, Math.round(((headScale + tailScale) * 0.5) * (HOLD_BODY_SEGMENT_BASE + 2)));
  const fill = "#E9C3C3";
  const sideShade = "#D1818C";
  const seamShade = "rgba(209, 129, 140, 0.12)";
  const highlight = active ? "rgba(255, 244, 244, 0.22)" : "rgba(255, 244, 244, 0.12)";

  ctx.save();
  if (active) {
    ctx.shadowColor = "rgba(255, 213, 98, 0.54)";
    ctx.shadowBlur = 24;
  }

  for (let y = bodyTopY; y <= bodyBottomY; y += segmentHeight) {
    const progress = clamp((y - bodyTopY) / Math.max(1, bodyBottomY - bodyTopY), 0, 1);
    const segmentWidth = Math.round(lerp(topWidth, bottomWidth, progress));
    const segmentHeightClamped = Math.min(segmentHeight, bodyBottomY - y + 1);
    const left = Math.round(lane.centerX - segmentWidth / 2);
    const top = Math.round(y);
    const innerWidth = Math.max(8, Math.round(segmentWidth * 0.42));
    const innerLeft = Math.round(lane.centerX - innerWidth / 2);
    const edgeWidth = Math.max(1, Math.round(segmentWidth * 0.07));

    ctx.fillStyle = fill;
    ctx.fillRect(left, top, segmentWidth, segmentHeightClamped);

    ctx.fillStyle = sideShade;
    ctx.fillRect(left, top, edgeWidth, segmentHeightClamped);
    ctx.fillRect(left + segmentWidth - edgeWidth, top, edgeWidth, segmentHeightClamped);

    ctx.fillStyle = highlight;
    ctx.fillRect(innerLeft, top + 1, innerWidth, Math.max(1, segmentHeightClamped - 2));

    if (y > bodyTopY) {
      ctx.fillStyle = seamShade;
      ctx.fillRect(left + edgeWidth, top, Math.max(2, segmentWidth - edgeWidth * 2), 1);
    }
  }

  ctx.shadowBlur = 0;
  drawHoldPigTailEnd(ctx, lane.centerX, topY, tailScale, active);
  ctx.restore();
}

function drawSparkStar(ctx, x, y, size, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1.6, size * 0.2);

  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();

  ctx.lineWidth = Math.max(1, size * 0.12);
  ctx.beginPath();
  ctx.moveTo(x - size * 0.7, y - size * 0.7);
  ctx.lineTo(x + size * 0.7, y + size * 0.7);
  ctx.moveTo(x + size * 0.7, y - size * 0.7);
  ctx.lineTo(x - size * 0.7, y + size * 0.7);
  ctx.stroke();
  ctx.restore();
}

function drawHoldFocusEffect(ctx, x, y, currentTime) {
  ctx.save();

  const pulse = 0.96 + (Math.sin(currentTime * 5.6) + 1) * 0.035;
  const glowRadius = 27 + pulse * 3;
  const glow = ctx.createRadialGradient(x, y - 2, 0, x, y - 2, glowRadius);
  glow.addColorStop(0, "rgba(255, 238, 170, 0.14)");
  glow.addColorStop(0.42, "rgba(255, 226, 130, 0.065)");
  glow.addColorStop(1, "rgba(255, 226, 130, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - 2, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  const starAngles = [-2.7, -2.2, -1.58, -0.98, -0.45];
  for (let index = 0; index < starAngles.length; index += 1) {
    const cycle = (currentTime * 2.35 + index * 0.19) % 1;
    const radius = lerp(22, 58, cycle);
    const starSize = lerp(6.8, 3.2, cycle);
    const alpha = lerp(0.88, 0.24, cycle);
    const angle = starAngles[index] + Math.sin(currentTime * 1.35 + index * 0.7) * 0.08;
    const starX = x + Math.cos(angle) * radius;
    const starY = y - 3 + Math.sin(angle) * radius * 0.92;

    drawChunkyPixelSpark(ctx, starX, starY, starSize, "#efc34b", "#fff4c8", alpha);
  }

  ctx.restore();
}

function drawDamageVignette(ctx, viewport, progress) {
  const intensity = Math.pow(1 - progress, 1.22);

  if (intensity <= 0.01) {
    return;
  }

  const edgeWidth = Math.max(72, viewport.width * 0.18);
  const edgeHeight = Math.max(80, viewport.height * 0.18);

  ctx.save();

  ctx.fillStyle = `rgba(56, 0, 10, ${intensity * 0.045})`;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const left = ctx.createLinearGradient(0, 0, edgeWidth, 0);
  left.addColorStop(0, `rgba(255, 62, 94, ${intensity * 0.44})`);
  left.addColorStop(0.34, `rgba(255, 84, 110, ${intensity * 0.18})`);
  left.addColorStop(1, "rgba(255, 84, 110, 0)");
  ctx.fillStyle = left;
  ctx.fillRect(0, 0, edgeWidth, viewport.height);

  const right = ctx.createLinearGradient(viewport.width, 0, viewport.width - edgeWidth, 0);
  right.addColorStop(0, `rgba(255, 62, 94, ${intensity * 0.44})`);
  right.addColorStop(0.34, `rgba(255, 84, 110, ${intensity * 0.18})`);
  right.addColorStop(1, "rgba(255, 84, 110, 0)");
  ctx.fillStyle = right;
  ctx.fillRect(viewport.width - edgeWidth, 0, edgeWidth, viewport.height);

  const top = ctx.createLinearGradient(0, 0, 0, edgeHeight);
  top.addColorStop(0, `rgba(255, 74, 98, ${intensity * 0.28})`);
  top.addColorStop(0.5, `rgba(255, 94, 122, ${intensity * 0.11})`);
  top.addColorStop(1, "rgba(255, 94, 122, 0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, viewport.width, edgeHeight);

  const bottom = ctx.createLinearGradient(0, viewport.height, 0, viewport.height - edgeHeight);
  bottom.addColorStop(0, `rgba(255, 74, 98, ${intensity * 0.26})`);
  bottom.addColorStop(0.5, `rgba(255, 94, 122, ${intensity * 0.1})`);
  bottom.addColorStop(1, "rgba(255, 94, 122, 0)");
  ctx.fillStyle = bottom;
  ctx.fillRect(0, viewport.height - edgeHeight, viewport.width, edgeHeight);

  const cornerRadius = Math.max(viewport.width, viewport.height) * 0.28;
  [
    [0, 0],
    [viewport.width, 0],
    [0, viewport.height],
    [viewport.width, viewport.height],
  ].forEach(([cornerX, cornerY]) => {
    const cornerGlow = ctx.createRadialGradient(cornerX, cornerY, 0, cornerX, cornerY, cornerRadius);
    cornerGlow.addColorStop(0, `rgba(255, 68, 98, ${intensity * 0.22})`);
    cornerGlow.addColorStop(0.45, `rgba(255, 92, 116, ${intensity * 0.08})`);
    cornerGlow.addColorStop(1, "rgba(255, 92, 116, 0)");
    ctx.fillStyle = cornerGlow;
    ctx.fillRect(cornerX - cornerRadius, cornerY - cornerRadius, cornerRadius * 2, cornerRadius * 2);
  });

  ctx.restore();
}

function getPixelImpactPalette(quality) {
  if (quality === "perfect") {
    return {
      primary: "#6EDE7D",
      secondary: "#AEFAB8",
      outline: "#4AA44E",
      shadow: "#34783A",
      highlight: "#AEFAB8",
    };
  }

  if (quality === "good") {
    return {
      primary: "#68B8FF",
      secondary: "#B7E1FF",
      outline: "#4384D9",
      shadow: "#305B9A",
      highlight: "#B7E1FF",
    };
  }

  if (quality === "hold") {
    return {
      primary: "#ffd85d",
      secondary: "#47dfcf",
      outline: "#9b63d7",
      shadow: "#593676",
      highlight: "#fff4d8",
    };
  }

  return {
    primary: "#ff8b98",
    secondary: "#ffd86e",
    outline: "#9f5ed8",
    shadow: "#5f2d7e",
    highlight: "#fff0f2",
  };
}

function drawPixelImpactBurst(ctx, centerX, centerY, progress, quality) {
  const alpha = Math.max(0, 1 - progress);
  if (alpha <= 0.01) {
    return;
  }

  const palette = getPixelImpactPalette(quality);
  const burstColors = {
    core: palette.primary,
    outline: palette.outline,
    highlight: palette.secondary,
  };
  const eased = easeOutCubic(progress);
  const burstScale = quality === "perfect" ? 1.08 : quality === "good" ? 1.02 : 1;
  const spread = Math.round(lerp(10, 34, eased) * burstScale);
  const centerXPx = snapToGrid(centerX, 1);
  const centerYPx = snapToGrid(centerY - 38, 1);
  const lift = Math.round(lerp(0, 16, eased));
  const outerStarOffset = 86 * burstScale + spread * 0.56;
  const outerBarOffset = 68 * burstScale + spread * 0.48;
  const midBarOffset = 46 * burstScale + spread * 0.34;
  const innerBarOffset = 18 * burstScale + spread * 0.18;
  const sideStarSize = quality === "perfect" ? 7 : 6;
  const centerStarSize = quality === "perfect" ? 10 : 8;
  const leftBarAngle = 65;
  const rightBarAngle = 115;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(centerXPx * 2, 0);
  ctx.scale(-1, 1);
  drawPixelImpactStar(
    ctx,
    centerXPx - outerStarOffset,
    centerYPx - 6 - lift * 0.16,
    sideStarSize,
    burstColors,
    alpha * 0.96
  );
  drawPixelImpactSlash(
    ctx,
    centerXPx - outerBarOffset,
    centerYPx + 14 - lift * 0.05,
    14,
    3,
    leftBarAngle,
    burstColors,
    alpha * 0.8
  );
  drawPixelImpactSlash(
    ctx,
    centerXPx - midBarOffset,
    centerYPx + 2 - lift * 0.1,
    28,
    3,
    leftBarAngle,
    burstColors,
    alpha * 0.96
  );
  drawPixelImpactSlash(
    ctx,
    centerXPx - innerBarOffset,
    centerYPx + 4 - lift * 0.14,
    10,
    3,
    leftBarAngle,
    burstColors,
    alpha * 0.94
  );
  drawPixelImpactStar(
    ctx,
    centerXPx,
    centerYPx - 16 - lift * 0.1,
    centerStarSize,
    burstColors,
    alpha
  );
  drawPixelImpactSlash(
    ctx,
    centerXPx + innerBarOffset,
    centerYPx + 4 - lift * 0.14,
    10,
    3,
    rightBarAngle,
    burstColors,
    alpha * 0.94
  );
  drawPixelImpactSlash(
    ctx,
    centerXPx + midBarOffset,
    centerYPx + 2 - lift * 0.1,
    28,
    3,
    rightBarAngle,
    burstColors,
    alpha * 0.96
  );
  drawPixelImpactStar(
    ctx,
    centerXPx + outerStarOffset,
    centerYPx - 6 - lift * 0.16,
    sideStarSize,
    burstColors,
    alpha * 0.96
  );
  drawPixelImpactSlash(
    ctx,
    centerXPx + outerBarOffset,
    centerYPx + 14 - lift * 0.05,
    14,
    3,
    rightBarAngle,
    burstColors,
    alpha * 0.84
  );

  ctx.restore();
}

function drawImpactBurst(ctx, centerX, centerY, progress, quality) {
  drawPixelImpactBurst(ctx, centerX, centerY, progress, quality);
}

function drawEffects(ctx, viewport, lane, effects, characterSprites = {}) {
  const centerX = lane.centerX;
  const centerY = lane.targetY;
  const feedbackOffset = clamp(
    viewport.height * FEEDBACK_TEXT_OFFSET_RATIO,
    FEEDBACK_TEXT_MIN_OFFSET,
    FEEDBACK_TEXT_MAX_OFFSET
  );
  const feedbackY = lane.targetY - feedbackOffset;

  effects.forEach((effect) => {
    const progress = effect.age / effect.duration;

    if (effect.kind === "pigLaunch") {
      drawPigLaunch(ctx, centerX, centerY, effect, progress, characterSprites);
      return;
    }

    if (effect.kind === "feedbackText") {
      const alpha = 1 - progress;
      const rise = progress * 24;
      const scale = 1 + (1 - progress) * 0.16;
      const isPerfect = effect.quality === "perfect";
      const isGood = effect.quality === "good";
      const isMiss = effect.quality === "miss";
      const text =
        isPerfect
          ? "PERFECT"
          : isGood
            ? "GOOD"
            : "MISS";
      const color =
        isPerfect
          ? PERFECT_FEEDBACK_MAIN
          : isGood
            ? GOOD_FEEDBACK_MAIN
            : MISS_FEEDBACK_MAIN;
      const shadowColor =
        isPerfect
          ? "rgba(18, 28, 20, 0.56)"
          : isGood
            ? "rgba(16, 24, 34, 0.56)"
            : "rgba(34, 16, 24, 0.56)";
      const size = 48;

      ctx.save();
      ctx.translate(centerX, feedbackY - rise);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      drawCleanTrackedText(ctx, text, 0, 0, {
        align: "center",
        valign: "middle",
        fontSize: size,
        fontFamily: PIXEL_FONT_EN_FAMILY,
        fontWeight: "400",
        color,
        shadowColor,
        shadowOffsetX: 1,
        shadowOffsetY: 1,
        tracking: FEEDBACK_TEXT_TRACKING,
      });
      ctx.restore();
      return;
    }

    if (effect.kind === "laneFlash") {
      return;
    }

    if (effect.kind === "comboPulse") {
      return;
    }

    if (effect.kind === "damage") {
      drawDamageVignette(ctx, viewport, progress);
      return;
    }

    drawImpactBurst(ctx, centerX, centerY, progress, effect.quality);
  });
}

function drawSongProgressTimeline(ctx, viewport, state) {
  const duration = Math.max(0.001, Number(state.chart?.duration) || 0);
  const progress = clamp((Number(state.currentTime) || 0) / duration, 0, 1);
  const trackHeight = 3;

  ctx.save();
  ctx.globalAlpha = HUD_TIMELINE_TRACK_ALPHA;
  ctx.fillStyle = UI_BRIGHT_TEXT;
  ctx.fillRect(0, 0, viewport.width, trackHeight);
  ctx.globalAlpha = HUD_TIMELINE_PROGRESS_ALPHA;
  ctx.fillRect(0, 0, Math.round(viewport.width * progress), trackHeight);
  ctx.restore();
}

function getTopHudLayout(viewport, state) {
  const maxLives = state.maxLives || 3;
  const pauseRect = getControlRects(viewport).pause;
  const topY = HUD_TOP_Y;
  const lifeBarHeight = clamp(
    viewport.height * HUD_LIFE_BAR_HEIGHT_RATIO,
    HUD_LIFE_BAR_HEIGHT_MIN,
    HUD_LIFE_BAR_HEIGHT_MAX
  );
  const lifeBarTop = clamp(
    viewport.height / 2 - lifeBarHeight / 2,
    HUD_LIFE_COLUMN_SAFE_MARGIN,
    viewport.height - lifeBarHeight - HUD_LIFE_COLUMN_SAFE_MARGIN
  );

  return {
    pauseRect,
    topY,
    maxLives,
    lifeBarLeft: HUD_LIFE_COLUMN_LEFT,
    lifeBarTop,
    lifeBarWidth: HUD_LIFE_BAR_WIDTH,
    lifeBarHeight,
  };
}

function drawPixelCoverFrame(ctx, x, y, width, height) {
  const left = snapToGrid(x, 1);
  const top = snapToGrid(y, 1);
  const frameWidth = snapToGrid(width, 1);
  const frameHeight = snapToGrid(height, 1);

  ctx.save();
  ctx.fillStyle = HUD_COVER_SHADOW_COLOR;
  ctx.fillRect(left + 2, top + 2, frameWidth, frameHeight);
  ctx.fillStyle = HUD_COVER_BORDER_COLOR;
  ctx.fillRect(left - 1, top - 1, frameWidth + 2, frameHeight + 2);
  ctx.fillStyle = HUD_COVER_INNER_BORDER_COLOR;
  ctx.fillRect(left, top, frameWidth, frameHeight);
  ctx.restore();
}

function drawSongInfoHud(ctx, viewport, uiState = {}, hudLayout = null) {
  const coverSize = Math.min(HUD_SONG_COVER_SIZE, Math.max(38, viewport.width * 0.11));
  const topLayout = hudLayout || { topY: HUD_CARD_TOP };
  const coverLeft = 16;
  const coverTop = topLayout.topY;
  const titleLeft = coverLeft + coverSize + HUD_SONG_COVER_GAP;
  const titleMaxWidth = Math.max(24, viewport.width * 0.46 - titleLeft);
  const songTitle = fitTextToWidth(ctx, uiState.songTitle || "Ditto", titleMaxWidth, {
    fontSize: HUD_SONG_TITLE_FONT_SIZE,
    fontFamily: PIXEL_FONT_EN_FAMILY,
    fontWeight: HUD_LABEL_FONT_WEIGHT,
    tracking: HUD_SONG_TITLE_TRACKING,
  });

  ctx.save();
  drawPixelCoverFrame(ctx, coverLeft, coverTop, coverSize, coverSize);
  if (!drawImageCover(ctx, uiState.songCoverImage, coverLeft, coverTop, coverSize, coverSize)) {
    ctx.fillStyle = "rgba(247, 244, 232, 0.18)";
    ctx.fillRect(coverLeft, coverTop, coverSize, coverSize);
  }

  drawCleanTrackedText(ctx, songTitle, titleLeft, coverTop + coverSize / 2, {
    align: "left",
    valign: "middle",
    fontSize: HUD_SONG_TITLE_FONT_SIZE,
    fontFamily: PIXEL_FONT_EN_FAMILY,
    fontWeight: HUD_LABEL_FONT_WEIGHT,
    color: UI_BRIGHT_TEXT,
    shadowColor: UI_WARM_SHADOW,
    shadowOffsetX: 1,
    shadowOffsetY: 1,
    tracking: HUD_SONG_TITLE_TRACKING,
    paddingX: HUD_LABEL_GLYPH_PADDING_X,
  });
  ctx.restore();
}

function drawScorePauseHud(ctx, viewport, state, hudLayout = null) {
  const scoreText = String(Math.max(0, Math.round(Number(state.score) || 0)));
  const { pauseRect, topY } = hudLayout || getTopHudLayout(viewport, state);
  const scoreRight = pauseRect.left - HUD_SCORE_PAUSE_GAP;
  const labelTop = topY;
  const valueTop = labelTop + HUD_LABEL_FONT_SIZE + HUD_SCORE_GROUP_GAP;
  const scoreSlotWidth = getHudFontDigitTextMetrics(ctx, HUD_SCORE_SLOT_TEXT, {
    fontSize: HUD_SCORE_FONT_SIZE,
    fontFamily: PIXEL_FONT_EN_FAMILY,
    fontWeight: CLEAN_DIGIT_FONT_WEIGHT,
  }).width;
  const minLeft = Math.max(16, viewport.width * 0.46);
  const availableWidth = Math.max(36, scoreRight - HUD_SCORE_RIGHT_SAFE_GAP - minLeft);
  const scoreScale = Math.min(1, availableWidth / Math.max(1, scoreSlotWidth));
  const scoreFontSize = Math.max(22, Math.round(HUD_SCORE_FONT_SIZE * scoreScale));

  ctx.save();
  drawCleanTrackedText(ctx, "SCORE", scoreRight, labelTop, {
    align: "right",
    valign: "top",
    fontSize: HUD_LABEL_FONT_SIZE,
    fontFamily: PIXEL_FONT_EN_FAMILY,
    fontWeight: HUD_LABEL_FONT_WEIGHT,
    color: UI_GOLD_TEXT,
    tracking: HUD_LABEL_TRACKING,
    paddingX: HUD_LABEL_GLYPH_PADDING_X,
  });

  drawHudScoreValue(ctx, scoreText, scoreRight, valueTop, {
    align: "right",
    valign: "top",
    fontSize: scoreFontSize,
    fontFamily: PIXEL_FONT_EN_FAMILY,
    fontWeight: CLEAN_DIGIT_FONT_WEIGHT,
    color: UI_BRIGHT_TEXT,
  });
  ctx.restore();
}

function drawPauseButtonHud(ctx, viewport, state, hudLayout = null) {
  const { pauseRect } = hudLayout || getTopHudLayout(viewport, state);

  ctx.save();
  drawPixelHudPlate(
    ctx,
    pauseRect.left,
    pauseRect.top,
    pauseRect.right - pauseRect.left,
    pauseRect.bottom - pauseRect.top,
    {
      cut: 6,
      step: 2,
      shadowOffset: 2,
      shadowColor: HUD_PLATE_SHADOW,
      fillColor: HUD_PLATE_FILL,
    }
  );
  ctx.fillStyle = UI_BRIGHT_TEXT;
  ctx.fillRect(pauseRect.left + 8, pauseRect.top + 7, 2, 11);
  ctx.fillRect(pauseRect.left + 15, pauseRect.top + 7, 2, 11);
  ctx.restore();
}

function drawLifeHud(ctx, viewport, state, hudLayout = null) {
  const {
    maxLives,
    lifeBarLeft,
    lifeBarTop,
    lifeBarWidth,
    lifeBarHeight,
  } = hudLayout || getTopHudLayout(viewport, state);
  const lives = clamp(Number(state.lives) || 0, 0, maxLives);
  const fillRatio = maxLives > 0 ? clamp(lives / maxLives, 0, 1) : 0;
  const outerLeft = snapToGrid(lifeBarLeft, 1);
  const outerTop = snapToGrid(lifeBarTop, 1);
  const outerWidth = snapToGrid(lifeBarWidth, 1);
  const outerHeight = snapToGrid(lifeBarHeight, 1);
  const innerInset = 4;
  const innerLeft = outerLeft + innerInset;
  const innerTop = outerTop + innerInset;
  const innerWidth = Math.max(1, outerWidth - innerInset * 2);
  const innerHeight = Math.max(1, outerHeight - innerInset * 2);
  const fillHeight = Math.round(innerHeight * fillRatio);
  const fillTop = innerTop + innerHeight - fillHeight;
  const tickGap = Math.max(12, Math.round(innerHeight / 6));

  ctx.save();
  drawPixelCutRect(ctx, outerLeft + 2, outerTop + 2, outerWidth, outerHeight, 4, 2);
  ctx.fillStyle = HUD_LIFE_BAR_SHADOW_COLOR;
  ctx.fill();
  drawPixelCutRect(ctx, outerLeft, outerTop, outerWidth, outerHeight, 4, 2);
  ctx.fillStyle = HUD_LIFE_BAR_BORDER_COLOR;
  ctx.fill();
  drawPixelCutRect(ctx, outerLeft + 2, outerTop + 2, outerWidth - 4, outerHeight - 4, 3, 2);
  ctx.fillStyle = HUD_LIFE_BAR_INNER_BORDER_COLOR;
  ctx.fill();
  ctx.fillStyle = HUD_LIFE_BAR_EMPTY_COLOR;
  ctx.fillRect(innerLeft, innerTop, innerWidth, innerHeight);

  if (fillHeight > 0) {
    ctx.fillStyle = HUD_LIFE_BAR_FILL_COLOR;
    ctx.fillRect(innerLeft, fillTop, innerWidth, fillHeight);

    if (innerWidth >= 4) {
      ctx.fillStyle = HUD_LIFE_BAR_FILL_HIGHLIGHT;
      ctx.fillRect(innerLeft + 1, fillTop + 1, 1, Math.max(0, fillHeight - 2));
    }
  }

  ctx.fillStyle = "rgba(247, 244, 232, 0.28)";
  ctx.fillRect(innerLeft, innerTop, innerWidth, 1);
  ctx.fillStyle = HUD_LIFE_BAR_TICK_COLOR;
  for (let y = innerTop + tickGap; y < innerTop + innerHeight; y += tickGap) {
    ctx.fillRect(innerLeft, y, innerWidth, 1);
  }
  ctx.restore();
}

function drawSongCoverScoreHud(ctx, viewport, state, uiState = {}, hudLayout = null) {
  drawSongInfoHud(ctx, viewport, uiState, hudLayout);
  drawScorePauseHud(ctx, viewport, state, hudLayout);
}

function drawLifePauseHud(ctx, viewport, state, hudLayout = null) {
  drawLifeHud(ctx, viewport, state, hudLayout);
  drawPauseButtonHud(ctx, viewport, state, hudLayout);
}

function getTutorialHintEndTime(state) {
  const notes = state?.notes || [];
  const endNote = notes[TUTORIAL_HINT_NOTE_COUNT - 1];
  if (!endNote) {
    return -Infinity;
  }
  const missWindow = Number(state?.chart?.windows?.miss) || 0;
  return Number(endNote.endTime || endNote.time) + missWindow;
}

function getActiveTutorialNote(state, currentTime) {
  const notes = (state?.notes || []).slice(0, TUTORIAL_HINT_NOTE_COUNT);
  const missWindow = Number(state?.chart?.windows?.miss) || 0;
  const activeNotes = notes.filter((note) => {
    const noteTime = Number(note?.time);
    const endTime = note?.kind === "hold" ? Number(note?.endTime || noteTime) : noteTime;
    return (
      Number.isFinite(noteTime) &&
      currentTime >= noteTime - TUTORIAL_HINT_LEAD_TIME &&
      currentTime <= endTime + missWindow
    );
  });
  return (
    activeNotes.find((note) => note.direction === "left" || note.direction === "right") ||
    activeNotes.find((note) => note.kind === "hold") ||
    activeNotes[0] ||
    null
  );
}

function getTutorialInputMode(inputMode) {
  return inputMode === TUTORIAL_INPUT_MODE_KEYBOARD
    ? TUTORIAL_INPUT_MODE_KEYBOARD
    : TUTORIAL_INPUT_MODE_TOUCH;
}

function getTutorialCopySet(inputMode) {
  return TUTORIAL_TYPE_HINT_COPY_BY_INPUT_MODE[getTutorialInputMode(inputMode)];
}

function getTutorialCopyLines(inputMode) {
  const copySet = getTutorialCopySet(inputMode);
  return [
    ...copySet.hold,
    ...copySet.normal,
    ...copySet.left,
    ...copySet.right,
  ];
}

function getTutorialNoteCopy(note, inputMode) {
  if (!note) {
    return null;
  }

  const copySet = getTutorialCopySet(inputMode);
  if (note.kind === "hold") {
    return copySet.hold;
  }

  if (note.direction === "left") {
    return copySet.left;
  }

  if (note.direction === "right") {
    return copySet.right;
  }

  return copySet.normal;
}

function drawTutorialHintLines(ctx, lines, x, y, options = {}) {
  const fontSize = options.fontSize || 18;
  const lineHeight = options.lineHeight || fontSize * TUTORIAL_HINT_LINE_HEIGHT;
  const align = options.align || "left";
  const alpha = options.alpha === undefined ? 1 : options.alpha;

  ctx.save();
  ctx.globalAlpha *= alpha;
  lines.forEach((line, index) => {
    drawCleanTrackedText(ctx, line, x, y + lineHeight * index, {
      align,
      valign: "top",
      fontSize,
      fontFamily: TUTORIAL_HINT_FONT_FAMILY,
      fontWeight: "400",
      color: TUTORIAL_HINT_TEXT_COLOR,
      shadowColor: TUTORIAL_HINT_SHADOW_COLOR,
      shadowOffsetX: 1,
      shadowOffsetY: 1,
      tracking: TUTORIAL_HINT_TEXT_TRACKING,
    });
  });
  ctx.restore();
}

function getTutorialHintLinesWidth(ctx, lines, fontSize) {
  return lines.reduce(
    (maxWidth, line) =>
      Math.max(
        maxWidth,
        getTrackedTextWidth(ctx, line, {
          fontSize,
          fontFamily: TUTORIAL_HINT_FONT_FAMILY,
          fontWeight: "400",
          tracking: TUTORIAL_HINT_TEXT_TRACKING,
        })
      ),
    0
  );
}

function fitTutorialHintFontSize(ctx, lines, maxWidth, preferredFontSize) {
  if (maxWidth <= 0) {
    return 15;
  }

  let fontSize = preferredFontSize;
  while (
    fontSize > 15 &&
    getTutorialHintLinesWidth(ctx, lines, fontSize) > maxWidth
  ) {
    fontSize -= 1;
  }
  return fontSize;
}

function drawPixelTutorialArrowSprite(ctx, x, y, scale, alpha = 1) {
  const cell = Math.max(2, Math.round(scale));
  const rows = TUTORIAL_ARROW_MASK.length;
  const columns = TUTORIAL_ARROW_MASK[0].length;
  const width = columns * cell;
  const height = rows * cell;
  const left = snapToGrid(x - width / 2, 1);
  const top = snapToGrid(y - height / 2, 1);

  ctx.save();
  ctx.globalAlpha *= alpha;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (TUTORIAL_ARROW_MASK[row][column] !== "X") {
        continue;
      }
      const px = left + column * cell;
      const py = top + row * cell;
      ctx.fillStyle = TUTORIAL_HINT_GOLD_DARK;
      ctx.fillRect(px + cell, py + cell, cell, cell);
      ctx.fillStyle =
        row <= 1 || column >= columns - 2 ? TUTORIAL_HINT_GOLD_BRIGHT : TUTORIAL_HINT_GOLD;
      ctx.fillRect(px, py, cell, cell);
    }
  }
  ctx.restore();
}

function drawTutorialArrow(ctx, startX, startY, endX, endY, sceneTime, alpha = 1) {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.hypot(dx, dy);
  if (length < 1) {
    return;
  }

  const unitX = dx / length;
  const unitY = dy / length;
  const normalX = -unitY;
  const normalY = unitX;
  const pulse = Math.sin(sceneTime * 5.4);
  const travel = pulse * 5;
  const shimmer = 0.78 + (pulse + 1) * 0.11;
  const headX = endX - unitX * (18 - travel);
  const headY = endY - unitY * (18 - travel);
  const tailX = startX + unitX * travel;
  const tailY = startY + unitY * travel;
  const angle = Math.atan2(dy, dx);
  const segmentCount = 8;

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineCap = "butt";
  for (let index = 0; index < segmentCount; index += 1) {
    const t = (index + 0.5) / segmentCount;
    const blockX = lerp(tailX, headX, t);
    const blockY = lerp(tailY, headY, t);
    const blockSize = index % 2 === 0 ? 4 : 3;
    const blockAlpha = shimmer * (0.46 + t * 0.42);
    ctx.fillStyle = TUTORIAL_HINT_GOLD_DARK;
    ctx.fillRect(
      snapToGrid(blockX + normalX * 2 + 1, 1),
      snapToGrid(blockY + normalY * 2 + 1, 1),
      blockSize,
      blockSize
    );
    ctx.globalAlpha *= blockAlpha;
    ctx.fillStyle = index > segmentCount - 3 ? TUTORIAL_HINT_GOLD_BRIGHT : TUTORIAL_HINT_GOLD;
    ctx.fillRect(
      snapToGrid(blockX + normalX * 2, 1),
      snapToGrid(blockY + normalY * 2, 1),
      blockSize,
      blockSize
    );
    ctx.globalAlpha /= blockAlpha;
  }
  ctx.translate(headX, headY);
  ctx.rotate(angle);
  drawPixelTutorialArrowSprite(ctx, 0, 0, 3, shimmer);
  ctx.restore();
}

function drawTutorialHints(ctx, viewport, lane, state, uiState = {}, topHudLayout = null) {
  if (!lane || !uiState.gameplayActive || uiState.paused || uiState.gameOverOverlayActive) {
    return;
  }

  const currentTime = Number(state?.currentTime) || 0;
  const tutorialEndTime = getTutorialHintEndTime(state);
  if (!Number.isFinite(tutorialEndTime) || currentTime > tutorialEndTime) {
    return;
  }

  const hudLayout = topHudLayout || getTopHudLayout(viewport, state);
  const fontSize = clamp(viewport.width * 0.045, 17, 24);
  const lineHeight = fontSize * TUTORIAL_HINT_LINE_HEIGHT;
  const commonX = snapToGrid(hudLayout.lifeBarLeft, 1);
  const commonY = snapToGrid(
    Math.min(
      lane.targetY - lineHeight * 2.5,
      hudLayout.lifeBarTop + hudLayout.lifeBarHeight + Math.max(16, viewport.height * 0.028)
    ),
    1
  );
  const activeNote = getActiveTutorialNote(state, currentTime);
  const noteCopy = getTutorialNoteCopy(activeNote, uiState.inputMode);
  const impactMetrics = getImpactZoneVisualMetrics(
    viewport,
    lane,
    uiState.characterSprites?.sceneBackground
  );
  const typeMinX = snapToGrid(lane.centerX + impactMetrics.zoneRadiusX + 14, 1);
  const typeMaxWidth = Math.max(0, viewport.width - typeMinX - 14);
  const typeFontSize = noteCopy
    ? fitTutorialHintFontSize(ctx, getTutorialCopyLines(uiState.inputMode), typeMaxWidth, fontSize)
    : fontSize;
  const typeLineHeight = typeFontSize * TUTORIAL_HINT_LINE_HEIGHT;
  const typeX = typeMinX;
  const typeY = snapToGrid(
    Math.min(viewport.height - typeLineHeight * 2 - 18, lane.targetY - typeLineHeight),
    1
  );
  const arrowStartX = commonX + Math.max(74, viewport.width * 0.2);
  const arrowStartY = commonY + lineHeight * 1.6;
  const arrowEndX = lane.centerX - Math.max(18, lane.targetWidth * 0.42);
  const arrowEndY = lane.targetY + 1;

  ctx.save();
  drawTutorialHintLines(ctx, ["猪落圈内时", "可发动攻击"], commonX, commonY, {
    fontSize,
    lineHeight,
  });
  drawTutorialArrow(ctx, arrowStartX, arrowStartY, arrowEndX, arrowEndY, currentTime, 0.96);
  if (noteCopy) {
    drawTutorialHintLines(ctx, noteCopy, typeX, typeY, {
      fontSize: typeFontSize,
      lineHeight: typeLineHeight,
      align: "left",
    });
  }
  ctx.restore();
}

function getLatestComboPulse(effects = []) {
  for (let index = effects.length - 1; index >= 0; index -= 1) {
    const effect = effects[index];
    if (effect.kind === "comboPulse") {
      return effect;
    }
  }
  return null;
}

function getComboPulseScale(progress, peakScale = CENTER_COMBO_PULSE_PEAK_SCALE) {
  const clamped = clamp(progress, 0, 1);

  if (clamped < 0.16) {
    return lerp(1, peakScale, easeOutCubic(clamped / 0.16));
  }

  if (clamped < 0.52) {
    return lerp(
      peakScale,
      CENTER_COMBO_PULSE_SETTLE_DIP_SCALE,
      easeOutCubic((clamped - 0.16) / 0.36)
    );
  }

  return lerp(CENTER_COMBO_PULSE_SETTLE_DIP_SCALE, 1, easeOutCubic((clamped - 0.52) / 0.48));
}

function drawCenterComboHud(ctx, viewport, lane, state) {
  const comboValue = Math.max(0, Math.round(Number(state.combo) || 0));
  const comboText = String(comboValue);
  const numberSize = clamp(
    viewport.width * CENTER_COMBO_NUMBER_WIDTH_RATIO,
    CENTER_COMBO_NUMBER_MIN_SIZE,
    CENTER_COMBO_NUMBER_MAX_SIZE
  );
  const labelSize = clamp(
    viewport.width * CENTER_COMBO_LABEL_WIDTH_RATIO,
    CENTER_COMBO_LABEL_MIN_SIZE,
    CENTER_COMBO_LABEL_MAX_SIZE
  );
  const comboOffset = clamp(
    viewport.height * CENTER_COMBO_OFFSET_RATIO,
    CENTER_COMBO_OFFSET_MIN,
    CENTER_COMBO_OFFSET_MAX
  );
  const centerX = lane.centerX;
  const numberY = lane.targetY - comboOffset;
  const labelY = numberY + numberSize * CENTER_COMBO_LABEL_OFFSET_RATIO;
  const comboPulse = getLatestComboPulse(state.effects);
  const pulseProgress = comboPulse
    ? clamp(comboPulse.age / Math.max(0.001, comboPulse.duration), 0, 1)
    : 1;
  const isMilestonePulse = !!comboPulse?.milestone;
  const pulsePeakScale = isMilestonePulse
    ? CENTER_COMBO_MILESTONE_PULSE_PEAK_SCALE
    : CENTER_COMBO_PULSE_PEAK_SCALE;
  const ghostMaxAlpha = isMilestonePulse
    ? CENTER_COMBO_MILESTONE_GHOST_MAX_ALPHA
    : CENTER_COMBO_GHOST_MAX_ALPHA;
  const pulseScale = comboPulse ? getComboPulseScale(pulseProgress, pulsePeakScale) : 1;
  const ghostAlpha = comboPulse
    ? ghostMaxAlpha * Math.pow(Math.max(0, 1 - pulseProgress / 0.3), 1.35)
    : 0;
  const comboAlpha = comboValue > 0 ? 0.96 : 0.34;
  const textColor = comboValue > 0 ? UI_BRIGHT_TEXT : HUD_SCORE_PLACEHOLDER_COLOR;
  const shadowColor = comboValue > 0 ? HUD_COMBO_SHADOW_COLOR : HUD_SCORE_PLACEHOLDER_SHADOW_COLOR;

  ctx.save();
  ctx.globalAlpha = comboAlpha;
  if (ghostAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = ghostAlpha;
    ctx.translate(centerX, numberY);
    ctx.scale(pulseScale + CENTER_COMBO_GHOST_SCALE_BOOST, pulseScale + CENTER_COMBO_GHOST_SCALE_BOOST);
    drawHudDigitText(ctx, comboText, 0, 0, {
      align: "center",
      valign: "middle",
      useSpriteDigits: false,
      fontSize: numberSize,
      fontFamily: PIXEL_FONT_EN_FAMILY,
      fontWeight: CLEAN_DIGIT_FONT_WEIGHT,
      color: UI_BRIGHT_TEXT,
    });
    ctx.restore();
  }
  ctx.save();
  ctx.translate(centerX, numberY);
  ctx.scale(pulseScale, pulseScale);
  drawHudDigitText(ctx, comboText, 0, 0, {
    align: "center",
    valign: "middle",
    useSpriteDigits: false,
    fontSize: numberSize,
    fontFamily: PIXEL_FONT_EN_FAMILY,
    fontWeight: CLEAN_DIGIT_FONT_WEIGHT,
    color: textColor,
    shadowColor,
    shadowOffsetX: 1,
    shadowOffsetY: 1,
  });
  ctx.restore();
  drawCleanTrackedText(ctx, "COMBO", centerX, labelY, {
    align: "center",
    valign: "top",
    fontSize: labelSize,
    fontFamily: PIXEL_FONT_EN_FAMILY,
    fontWeight: HUD_LABEL_FONT_WEIGHT,
    color: comboValue > 0 ? UI_BRIGHT_TEXT : HUD_SCORE_PLACEHOLDER_COLOR,
    shadowColor,
    shadowOffsetX: 1,
    shadowOffsetY: 1,
    tracking: 0.35,
  });
  ctx.restore();
}

function drawHud(ctx, viewport, state, uiState = {}, lane = null) {
  ctx.save();
  const topHudLayout = getTopHudLayout(viewport, state);
  drawSongProgressTimeline(ctx, viewport, state);
  drawSongCoverScoreHud(ctx, viewport, state, uiState, topHudLayout);
  drawLifePauseHud(ctx, viewport, state, topHudLayout);
  if (lane) {
    drawCenterComboHud(ctx, viewport, lane, state);
    drawTutorialHints(ctx, viewport, lane, state, uiState, topHudLayout);
  }
  ctx.restore();
  ctx.textAlign = "left";
}

function getControlRects(viewport) {
  const centerX = snapToGrid(viewport.width / 2);
  const centerY = snapToGrid(viewport.height / 2);
  const buttonSize = snapToGrid(Math.min(56, Math.max(50, viewport.width * 0.145)), 1);
  const buttonGap = 18;
  const rowWidth = buttonSize * 3 + buttonGap * 2;
  const rowLeft = snapToGrid(centerX - rowWidth / 2, 1);
  const buttonTop = snapToGrid(centerY - buttonSize / 2, 1);
  const secondLeft = rowLeft + buttonSize + buttonGap;
  const thirdLeft = secondLeft + buttonSize + buttonGap;
  const pauseSize = 26;
  const songCoverSize = Math.min(HUD_SONG_COVER_SIZE, Math.max(38, viewport.width * 0.11));
  const pauseTop = snapToGrid(HUD_TOP_Y + songCoverSize / 2 - pauseSize / 2, 1);

  return {
    pause: {
      left: viewport.width - 44,
      top: pauseTop,
      right: viewport.width - 18,
      bottom: pauseTop + pauseSize,
    },
    pauseHome: {
      left: rowLeft,
      top: buttonTop,
      right: rowLeft + buttonSize,
      bottom: buttonTop + buttonSize,
    },
    pauseRestart: {
      left: secondLeft,
      top: buttonTop,
      right: secondLeft + buttonSize,
      bottom: buttonTop + buttonSize,
    },
    resume: {
      left: thirdLeft,
      top: buttonTop,
      right: thirdLeft + buttonSize,
      bottom: buttonTop + buttonSize,
    },
  };
}

function getPauseOverlayLayout(viewport) {
  const rects = getControlRects(viewport);
  const panelPaddingX = 18;
  const panelPaddingY = 16;

  return {
    panel: {
      left: rects.pauseHome.left - panelPaddingX,
      top: rects.pauseHome.top - panelPaddingY,
      right: rects.resume.right + panelPaddingX,
      bottom: rects.pauseHome.bottom + panelPaddingY,
    },
    pauseRestart: rects.pauseRestart,
    resume: rects.resume,
    pauseHome: rects.pauseHome,
  };
}

function getMissRabbitOcclusion(note, noteTop, noteBottom, rabbitLayout) {
  if (
    !rabbitLayout ||
    note.result !== "miss" ||
    !rabbitLayout.sprite
  ) {
    return null;
  }
  const crossoverY = rabbitLayout.y + rabbitLayout.height * 0.54;

  if (noteBottom <= crossoverY) {
    return {
      mode: "phase",
      phase: "behind",
    };
  }

  if (noteTop >= crossoverY) {
    return {
      mode: "phase",
      phase: "front",
    };
  }

  return {
    mode: "split",
    splitY: crossoverY,
  };
}

function clipToVerticalBand(ctx, viewport, top, bottom) {
  if (bottom <= top) {
    return false;
  }

  ctx.beginPath();
  ctx.rect(0, top, viewport.width, bottom - top);
  ctx.clip();
  return true;
}

function getNoteSoftFadeBuffer(viewport) {
  const safeWidth = Math.max(1, Math.ceil(viewport.width));
  const safeHeight = Math.max(1, Math.ceil(viewport.height));

  if (typeof createWebOffscreenCanvas !== "function") {
    return null;
  }

  if (
    noteSoftFadeBuffer &&
    noteSoftFadeBuffer.width === safeWidth &&
    noteSoftFadeBuffer.height === safeHeight
  ) {
    return noteSoftFadeBuffer;
  }

  let canvas = null;
  let context = null;

  try {
    canvas = createWebOffscreenCanvas({
      type: "2d",
      width: safeWidth,
      height: safeHeight,
    });
    context = canvas.getContext("2d");
  } catch (error) {
    noteSoftFadeBuffer = null;
    return null;
  }

  if (!context) {
    noteSoftFadeBuffer = null;
    return null;
  }

  canvas.width = safeWidth;
  canvas.height = safeHeight;
  noteSoftFadeBuffer = {
    canvas,
    context,
    width: safeWidth,
    height: safeHeight,
  };

  return noteSoftFadeBuffer;
}

function applyNoteSoftFadeMask(bufferCtx, width, top, height, mask) {
  if (!mask || !mask.edge || typeof mask.y !== "number") {
    return;
  }

  const distance = Math.max(1, mask.distance || NOTE_ENTRY_SOFT_FADE_DISTANCE);
  const fadeStart = mask.edge === "bottom" ? mask.y - distance : mask.y;
  const fadeEnd = mask.edge === "bottom" ? mask.y : mask.y + distance;
  const fadeMask = bufferCtx.createLinearGradient(0, fadeStart, 0, fadeEnd);

  if (mask.edge === "bottom") {
    fadeMask.addColorStop(0, "rgba(0, 0, 0, 1)");
    fadeMask.addColorStop(0.32, "rgba(0, 0, 0, 0.88)");
    fadeMask.addColorStop(0.72, "rgba(0, 0, 0, 0.34)");
    fadeMask.addColorStop(1, "rgba(0, 0, 0, 0)");
  } else {
    fadeMask.addColorStop(0, "rgba(0, 0, 0, 0)");
    fadeMask.addColorStop(0.28, "rgba(0, 0, 0, 0.34)");
    fadeMask.addColorStop(0.68, "rgba(0, 0, 0, 0.88)");
    fadeMask.addColorStop(1, "rgba(0, 0, 0, 1)");
  }

  bufferCtx.globalAlpha = 1;
  bufferCtx.globalCompositeOperation = "destination-in";
  bufferCtx.fillStyle = fadeMask;
  bufferCtx.fillRect(0, top, width, height);
  bufferCtx.globalCompositeOperation = "source-over";
}

function renderNoteWithSoftFade(ctx, viewport, top, bottom, render, masks = []) {
  const clipTop = Math.max(0, top);
  const clipBottom = Math.min(viewport.height, bottom);

  if (clipBottom <= clipTop) {
    return;
  }

  const renderClipped = (targetCtx) => {
    targetCtx.save();
    if (clipToVerticalBand(targetCtx, viewport, clipTop, clipBottom)) {
      render(targetCtx);
    }
    targetCtx.restore();
  };
  const activeMasks = masks.filter((mask) => mask && mask.edge && typeof mask.y === "number");
  const buffer = getNoteSoftFadeBuffer(viewport);

  if (!buffer || activeMasks.length === 0) {
    renderClipped(ctx);
    return;
  }

  const bufferCtx = buffer.context;
  const copyTop = Math.max(0, Math.floor(clipTop));
  const copyBottom = Math.min(buffer.height, Math.ceil(clipBottom));
  const copyHeight = copyBottom - copyTop;

  if (copyHeight <= 0) {
    return;
  }

  if (typeof bufferCtx.setTransform === "function") {
    bufferCtx.setTransform(1, 0, 0, 1, 0, 0);
  }
  bufferCtx.globalAlpha = 1;
  bufferCtx.globalCompositeOperation = "source-over";
  bufferCtx.shadowBlur = 0;
  bufferCtx.clearRect(0, copyTop, buffer.width, copyHeight);

  renderClipped(bufferCtx);

  activeMasks.forEach((mask) => {
    applyNoteSoftFadeMask(bufferCtx, buffer.width, copyTop, copyHeight, mask);
  });

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(
    buffer.canvas,
    0,
    copyTop,
    buffer.width,
    copyHeight,
    0,
    copyTop,
    buffer.width,
    copyHeight
  );
  ctx.restore();
}

function getOcclusionAlphaMultiplier(note, occlusion) {
  if (!occlusion || note.result !== "miss") {
    return 1;
  }

  return MISS_RABBIT_CROSS_ALPHA;
}

function renderNoteVisual(
  ctx,
  lane,
  state,
  note,
  headY,
  tailY,
  headVisual,
  tailVisual,
  characterSprites = {},
  renderOptions = {}
) {
  const isMiss = note.result === "miss";
  const alphaMultiplier =
    renderOptions.alphaMultiplier === undefined ? 1 : renderOptions.alphaMultiplier;
  const noteAlpha = (note.holding ? 1 : lerp(0.5, 1, headVisual.perspective)) * alphaMultiplier;

  ctx.globalAlpha = noteAlpha;
  if (note.kind === "hold") {
    drawHoldTail(
      ctx,
      lane,
      headY,
      Math.min(headY - 8, tailY),
      note.holding ? 1.02 : headVisual.scale,
      tailVisual.scale,
      note.holding,
      state.currentTime
    );
  }

  ctx.shadowColor = note.holding
    ? "rgba(255, 219, 126, 0.58)"
    : "rgba(255, 184, 205, 0.3)";
  ctx.shadowBlur = note.holding ? 22 : headVisual.glow;
  drawPig(
    ctx,
    characterSprites,
    lane.centerX,
    headY,
    note.holding ? 1.04 : headVisual.scale,
    note.direction
  );

  if (note.kind === "hold" && !isMiss) {
    if (note.holding) {
      drawHoldFocusEffect(ctx, lane.centerX, headY, state.currentTime);
    }
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawNotes(ctx, viewport, lane, state, options = {}) {
  const pixelsPerSecond = lane.pixelsPerSecond;
  const layer = options.layer || "all";
  const rabbitLayout = options.rabbitLayout || null;
  const characterSprites = options.characterSprites || {};
  const noteEntryY = lane.noteEntryY === undefined ? lane.top : lane.noteEntryY;

  state.notes.forEach((note) => {
    if (note.judged && note.result !== "miss") {
      return;
    }

    const headY = note.holding
      ? lane.targetY + Math.sin(state.currentTime * 18) * 1.5
      : lane.targetY - (note.time - state.currentTime) * pixelsPerSecond;
    const tailY =
      note.kind === "hold"
        ? lane.targetY - (note.endTime - state.currentTime) * pixelsPerSecond
        : headY;
    const minY = Math.min(headY, tailY);
    const maxY = Math.max(headY, tailY);
    const noteTop = minY - (note.kind === "hold" ? 26 : 34);
    const noteBottom = maxY + (note.kind === "hold" ? 34 : 34);

    if (noteBottom < noteEntryY || minY > viewport.height + 120) {
      return;
    }

    const headVisual = getNoteVisualAtY(lane, note.holding ? lane.targetY : headY);
    const tailVisual = getNoteVisualAtY(lane, tailY);
    const occlusion = getMissRabbitOcclusion(note, noteTop, noteBottom, rabbitLayout);
    const alphaMultiplier = getOcclusionAlphaMultiplier(note, occlusion);
    const entryFadeAlpha = easeOutCubic(
      clamp((noteBottom - noteEntryY) / NOTE_ENTRY_FADE_DISTANCE, 0, 1)
    );
    const combinedAlphaMultiplier = alphaMultiplier * entryFadeAlpha;
    const renderVisibleNote = (visibleTop, visibleBottom, extraMasks = []) => {
      renderNoteWithSoftFade(
        ctx,
        viewport,
        Math.max(noteEntryY, visibleTop),
        visibleBottom,
        (targetCtx) => {
          renderNoteVisual(
            targetCtx,
            lane,
            state,
            note,
            headY,
            tailY,
            headVisual,
            tailVisual,
            characterSprites,
            {
              alphaMultiplier: combinedAlphaMultiplier,
            }
          );
        },
        [
          {
            edge: "top",
            y: noteEntryY,
            distance: NOTE_ENTRY_SOFT_FADE_DISTANCE,
          },
          ...extraMasks,
        ]
      );
    };

    if (layer === "behindRabbit") {
      if (!occlusion) {
        return;
      }

      if (occlusion.mode === "split") {
        renderVisibleNote(noteTop, Math.min(noteBottom, occlusion.splitY), [
          {
            edge: "bottom",
            y: occlusion.splitY,
            distance: RABBIT_OCCLUSION_SOFT_FADE_DISTANCE,
          },
        ]);
        return;
      }

      if (occlusion.phase !== "behind") {
        return;
      }
      renderVisibleNote(noteEntryY, viewport.height);
      return;
    }

    if (layer === "front" && occlusion) {
      if (occlusion.mode === "split") {
        renderVisibleNote(Math.max(noteTop, occlusion.splitY), noteBottom, [
          {
            edge: "top",
            y: occlusion.splitY,
            distance: RABBIT_OCCLUSION_SOFT_FADE_DISTANCE,
          },
        ]);
        return;
      }

      if (occlusion.phase !== "front") {
        return;
      }
      renderVisibleNote(noteEntryY, viewport.height);
      return;
    }

    renderVisibleNote(noteEntryY, viewport.height);
  });
}

function fillPixelCutRect(ctx, left, top, width, height, cut, step, fillStyle) {
  drawPixelCutRect(ctx, left, top, width, height, cut, step);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function drawWarmPixelShell(ctx, rect, options = {}) {
  const shadowOffset = options.shadowOffset === undefined ? 4 : options.shadowOffset;
  const outerColor = options.outerColor || "#582f28";
  const faceColor = options.faceColor || "#e7c394";
  const coreColor = options.coreColor || "#d2a36f";
  const shadowColor = options.shadowColor || "rgba(88, 47, 40, 0.22)";
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;

  fillPixelCutRect(
    ctx,
    rect.left + shadowOffset,
    rect.top + shadowOffset,
    width,
    height,
    10,
    2,
    shadowColor
  );
  fillPixelCutRect(ctx, rect.left, rect.top, width, height, 10, 2, outerColor);
  fillPixelCutRect(ctx, rect.left + 4, rect.top + 4, width - 8, height - 8, 8, 2, faceColor);
  fillPixelCutRect(ctx, rect.left + 8, rect.top + 8, width - 16, height - 16, 6, 2, coreColor);

  return {
    left: rect.left + 14,
    top: rect.top + 14,
    right: rect.right - 14,
    bottom: rect.bottom - 14,
  };
}

function getPauseOverlayPalette(theme) {
  const normalizedTheme = normalizeStartTheme(theme);
  return PAUSE_OVERLAY_PALETTES[normalizedTheme] || PAUSE_OVERLAY_PALETTES.dark;
}

function drawWarmPixelLineButtonShell(ctx, rect, palette = PAUSE_OVERLAY_PALETTES.light) {
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  const shadowColor = palette.shadowColor || PAUSE_OVERLAY_PALETTES.light.shadowColor;
  const outerColor = palette.outerColor || PAUSE_OVERLAY_PALETTES.light.outerColor;
  const faceColor = palette.faceColor || PAUSE_OVERLAY_PALETTES.light.faceColor;

  fillPixelCutRect(ctx, rect.left + 4, rect.top + 4, width, height, 8, 2, shadowColor);
  fillPixelCutRect(ctx, rect.left, rect.top, width, height, 8, 2, outerColor);
  fillPixelCutRect(ctx, rect.left + 4, rect.top + 4, width - 8, height - 8, 6, 2, faceColor);
}

function drawPauseHomeIcon(ctx, rect, color = PAUSE_OVERLAY_PALETTES.light.iconColor) {
  const centerX = rect.left + (rect.right - rect.left) / 2;
  const centerY = rect.top + (rect.bottom - rect.top) / 2;
  const roofHalf = 12;
  const roofTop = centerY - 13;
  const roofBaseY = centerY - 1;
  const bodyWidth = 18;
  const bodyHeight = 14;
  const bodyLeft = snapToGrid(centerX - bodyWidth / 2, 1);
  const bodyTop = snapToGrid(centerY - 1, 1);
  const bodyRadius = 3.5;
  const roofRadius = 3;
  const leftRoofX = centerX - roofHalf;
  const rightRoofX = centerX + roofHalf;
  const bodyRight = bodyLeft + bodyWidth;
  const bodyBottom = bodyTop + bodyHeight;

  ctx.save();
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(bodyLeft, bodyBottom - bodyRadius);
  ctx.quadraticCurveTo(bodyLeft, bodyBottom, bodyLeft + bodyRadius, bodyBottom);
  ctx.lineTo(bodyRight - bodyRadius, bodyBottom);
  ctx.quadraticCurveTo(bodyRight, bodyBottom, bodyRight, bodyBottom - bodyRadius);
  ctx.lineTo(bodyRight, roofBaseY + 2);
  ctx.lineTo(rightRoofX + roofRadius * 0.2, roofBaseY + 2);
  ctx.quadraticCurveTo(rightRoofX, roofBaseY + 2, rightRoofX - roofRadius * 0.8, roofBaseY - roofRadius * 0.2);
  ctx.lineTo(centerX + roofRadius * 0.8, roofTop + roofRadius * 0.9);
  ctx.quadraticCurveTo(centerX, roofTop - roofRadius * 0.4, centerX - roofRadius * 0.8, roofTop + roofRadius * 0.9);
  ctx.lineTo(leftRoofX + roofRadius * 0.8, roofBaseY - roofRadius * 0.2);
  ctx.quadraticCurveTo(leftRoofX, roofBaseY + 2, leftRoofX - roofRadius * 0.2, roofBaseY + 2);
  ctx.lineTo(bodyLeft, roofBaseY + 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPauseReplayIcon(ctx, rect, color = PAUSE_OVERLAY_PALETTES.light.iconColor) {
  const centerX = rect.left + (rect.right - rect.left) / 2;
  const centerY = rect.top + (rect.bottom - rect.top) / 2;
  const radius = 12;
  const arcStartAngle = Math.PI * 0.04;
  const arcEndAngle = Math.PI * 1.54;
  const arrowTipAngle = -Math.PI * 0.34;
  const arrowOffsetX = 4;
  const arrowOffsetY = -1;
  const tipX = centerX + Math.cos(arrowTipAngle) * radius + arrowOffsetX;
  const tipY = centerY + Math.sin(arrowTipAngle) * radius + arrowOffsetY;
  const arrowLength = 10;
  const arrowHalfHeight = 5;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, arcStartAngle, arcEndAngle, false);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - arrowLength, tipY - arrowHalfHeight);
  ctx.lineTo(tipX - arrowLength, tipY + arrowHalfHeight);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPausePlayIcon(ctx, rect, color = PAUSE_OVERLAY_PALETTES.light.iconColor) {
  const centerX = rect.left + (rect.right - rect.left) / 2;
  const centerY = rect.top + (rect.bottom - rect.top) / 2;
  const leftX = centerX - 7;
  const rightX = centerX + 11;
  const topY = centerY - 11;
  const bottomY = centerY + 11;
  const radius = 4;
  const noseRadius = 4;

  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(leftX, topY + radius);
  ctx.quadraticCurveTo(leftX, topY, leftX + radius, topY);
  ctx.lineTo(rightX - noseRadius, centerY - noseRadius * 0.7);
  ctx.quadraticCurveTo(rightX + noseRadius * 0.8, centerY, rightX - noseRadius, centerY + noseRadius * 0.7);
  ctx.lineTo(leftX + radius, bottomY);
  ctx.quadraticCurveTo(leftX, bottomY, leftX, bottomY - radius);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPauseIconButton(ctx, rect, iconType, palette = PAUSE_OVERLAY_PALETTES.light) {
  const iconColor = palette.iconColor || PAUSE_OVERLAY_PALETTES.light.iconColor;

  drawWarmPixelLineButtonShell(ctx, rect, palette);

  if (iconType === "home") {
    drawPauseHomeIcon(ctx, rect, iconColor);
    return;
  }

  if (iconType === "restart") {
    drawPauseReplayIcon(ctx, rect, iconColor);
    return;
  }

  drawPausePlayIcon(ctx, rect, iconColor);
}

function drawPauseOverlay(ctx, viewport, options = {}) {
  const rects = getControlRects(viewport);
  const palette = getPauseOverlayPalette(options.startTheme);

  ctx.save();
  ctx.fillStyle = "rgba(10, 9, 15, 0.64)";
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  drawPauseIconButton(ctx, rects.pauseHome, "home", palette);
  drawPauseIconButton(ctx, rects.pauseRestart, "restart", palette);
  drawPauseIconButton(ctx, rects.resume, "play", palette);
  ctx.restore();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function getEndingOverlayHitCount(state) {
  return Math.max(
    0,
    Math.round(Number(state?.hits?.perfect || 0) + Number(state?.hits?.good || 0))
  );
}

function getEndingTitleScale(progress) {
  const clamped = clamp(progress, 0, 1);
  return lerp(0.8, 1.2, easeOutCubic(clamped));
}

function getEndingOverlayVeilAlpha(kind, progress) {
  const clamped = clamp(progress, 0, 1);

  if (kind === "completed") {
    return 0.36 + easeOutCubic(clamped) * 0.32;
  }

  return 0.18 + clamped * 0.4;
}

function drawCompletedEndingSparkles(ctx, centerX, centerY, progress, scale = 1) {
  const clamped = clamp(progress, 0, 1);
  const twinkleA = 0.72 + Math.sin(clamped * Math.PI * 8) * 0.24;
  const twinkleB = 0.68 + Math.sin(clamped * Math.PI * 8 + Math.PI * 0.58) * 0.22;
  const twinkleC = 0.62 + Math.sin(clamped * Math.PI * 8 + Math.PI * 1.12) * 0.2;
  const starScaleA = (0.98 + Math.sin(clamped * Math.PI * 8 + Math.PI * 0.2) * 0.1) * scale;
  const starScaleB = (0.92 + Math.sin(clamped * Math.PI * 8 + Math.PI * 0.82) * 0.08) * scale;
  const colors = {
    outline: "#b46d22",
    core: "#ffd75f",
    highlight: "#fff7ca",
  };

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  drawPixelImpactStar(ctx, centerX - 120 * scale, centerY - 22 * scale, 5.4 * starScaleA, colors, twinkleA);
  drawPixelImpactStar(ctx, centerX + 118 * scale, centerY - 19 * scale, 5.4 * starScaleB, colors, twinkleB);
  drawPixelImpactStar(ctx, centerX - 82 * scale, centerY + 31 * scale, 4.4 * starScaleB, colors, twinkleC);
  drawPixelImpactStar(ctx, centerX + 84 * scale, centerY + 30 * scale, 4.4 * starScaleA, colors, twinkleA * 0.86);
  drawPixelImpactStar(ctx, centerX - 151 * scale, centerY + 6 * scale, 3.4 * starScaleB, colors, twinkleB * 0.72);
  drawPixelImpactStar(ctx, centerX + 151 * scale, centerY + 4 * scale, 3.4 * starScaleA, colors, twinkleC * 0.74);
  ctx.restore();
}

function drawEndingOverlay(ctx, viewport, state, options = {}) {
  const progress = options.progress === undefined ? 1 : options.progress;
  const kind = options.kind === "completed" ? "completed" : "failed";
  const clamped = clamp(progress, 0, 1);
  const veilAlpha = getEndingOverlayVeilAlpha(kind, clamped);
  const titleScale = getEndingTitleScale(clamped);
  const centerX = viewport.width / 2;
  const centerY = snapToGrid(viewport.height * 0.47 - clamped * 5, 1);
  const shadowColor =
    kind === "completed" ? ENDING_OVERLAY_COMPLETED_SHADOW : ENDING_OVERLAY_FAILED_SHADOW;

  ctx.save();
  ctx.fillStyle = `rgba(8, 7, 10, ${veilAlpha.toFixed(3)})`;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  if (kind === "completed") {
    drawCompletedEndingSparkles(ctx, centerX, centerY, clamped, titleScale);
    drawCleanTrackedText(ctx, "爆锤圆满结束！", centerX, centerY, {
      align: "center",
      valign: "middle",
      fontSize: 27 * titleScale,
      fontFamily: ENDING_OVERLAY_ZH_FONT_FAMILY,
      fontWeight: "400",
      color: ENDING_OVERLAY_COMPLETED_GOLD,
      shadowColor,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      tracking: ENDING_OVERLAY_TITLE_TRACKING,
    });
  } else {
    const hitCount = getEndingOverlayHitCount(state);
    drawSegmentedTrackedText(ctx, [
      { text: "爆锤方猪", color: MISS_FEEDBACK_MAIN },
      { text: hitCount, color: UI_BRIGHT_TEXT },
      { text: "次", color: MISS_FEEDBACK_MAIN },
    ], centerX, centerY - 20, {
      align: "center",
      valign: "middle",
      fontSize: 27 * titleScale,
      fontFamily: ENDING_OVERLAY_ZH_FONT_FAMILY,
      fontWeight: "400",
      shadowColor,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      tracking: ENDING_OVERLAY_TITLE_TRACKING,
    });
    drawCleanTrackedText(ctx, "未完待续", centerX, centerY + 25, {
      align: "center",
      valign: "middle",
      fontSize: 22 * titleScale,
      fontFamily: ENDING_OVERLAY_ZH_FONT_FAMILY,
      fontWeight: "400",
      color: MISS_FEEDBACK_MAIN,
      shadowColor,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      tracking: ENDING_OVERLAY_SUBTITLE_TRACKING,
    });
  }

  ctx.restore();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function renderFrame(ctx, viewport, state, uiState = {}) {
  const lane = getLaneMetrics(viewport, uiState.introProgress);
  const sceneTime =
    typeof uiState.sceneTime === "number" ? uiState.sceneTime : state.currentTime;
  const magicVisualTime =
    typeof uiState.magicVisualTime === "number" ? uiState.magicVisualTime : sceneTime;
  const startTheme = normalizeStartTheme(uiState.startTheme);
  const gameplayActive = !!uiState.gameplayActive;
  const showLaneBase = uiState.showLaneBase !== false;
  const sceneBackground = uiState.characterSprites?.sceneBackground;
  const rabbitLayout = getRabbitSceneLayout(
    viewport,
    lane,
    uiState.characterSprites,
    sceneTime,
    uiState.rabbitWandAnimation,
    uiState.rabbitWandSwingVariant,
    state.effects
  );
  ctx.clearRect(0, 0, viewport.width, viewport.height);
  const usedBackdrop = drawCoverBackdrop(ctx, viewport, sceneBackground);
  if (!usedBackdrop) {
    drawBackground(ctx, viewport, sceneTime, lane, uiState.loadingColors);
  } else {
    drawBackdropTorchEmbers(ctx, viewport, sceneTime, sceneBackground);
    if (PORTAL_MAGIC_STAR_PALETTES[startTheme]) {
      drawPortalMagicStars(ctx, viewport, sceneTime, sceneBackground, startTheme);
    }
  }
  drawLane(ctx, viewport, lane, state.effects, uiState.characterSprites, {
    showLaneBase,
  });
  drawImpactZone(ctx, viewport, lane, sceneBackground, sceneTime, magicVisualTime);
  if (gameplayActive) {
    drawNotes(ctx, viewport, lane, state, {
      characterSprites: uiState.characterSprites,
      rabbitLayout,
      layer: "behindRabbit",
    });
  }
  drawCharacterScene(
    ctx,
    viewport,
    lane,
    uiState.characterSprites,
    state.effects,
    sceneTime,
    rabbitLayout,
    uiState.crowdMotion,
    gameplayActive,
    uiState.rabbitWandAnimation
  );
  if (gameplayActive) {
    drawNotes(ctx, viewport, lane, state, {
      characterSprites: uiState.characterSprites,
      rabbitLayout,
      layer: "front",
    });
    drawEffects(ctx, viewport, lane, state.effects, uiState.characterSprites);
  }
  if (!uiState.gameOverOverlayActive) {
    drawHud(ctx, viewport, state, uiState, lane);
  }
  if (uiState.gameOverOverlayActive) {
    drawEndingOverlay(ctx, viewport, state, {
      progress: uiState.gameOverOverlayProgress || 0,
      kind: uiState.gameOverOverlayKind,
    });
  } else if (uiState.paused && !uiState.useDomPauseOverlay) {
    drawPauseOverlay(ctx, viewport, {
      startTheme: uiState.startTheme,
    });
  }
}

export { renderFrame, drawPauseOverlay, getControlRects, getPauseOverlayLayout, createPixelTextSprite };
