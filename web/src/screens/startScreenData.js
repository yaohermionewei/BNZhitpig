import { DEFAULT_START_THEME, START_THEMES } from "../utils/start-theme.js";

export const START_THEME_BACKDROPS = Object.freeze({
  dark: "/assets/images/首页夜晚版.runtime.webp",
  light: "/assets/images/首页夕阳版.runtime.webp",
});

const START_BACKDROP_LAYOUTS = Object.freeze({
  dark: Object.freeze({
    naturalWidth: 768,
    naturalHeight: 1514,
    objectOffsetY: 25,
    anchors: Object.freeze({
      rabbit: Object.freeze({ x: 210, y: 935 }),
      pig: Object.freeze({ x: 570, y: 910 }),
    }),
  }),
  light: Object.freeze({
    naturalWidth: 768,
    naturalHeight: 1376,
    objectOffsetY: 0,
    anchors: Object.freeze({
      rabbit: Object.freeze({ x: 245, y: 850 }),
      pig: Object.freeze({ x: 570, y: 840 }),
    }),
  }),
});

const START_CHARACTER_X_ANCHOR_THEME = START_THEMES.dark;

const RABBIT_FRAME_SOURCES = Object.freeze([
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-1.webp",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-2.webp",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-3.webp",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-4.webp",
]);

const RABBIT_DARK_FRAME_SOURCES = Object.freeze([
  "/assets/images/title-rabbit-frames-dark-v2/rabbit-frame-1.webp",
  "/assets/images/title-rabbit-frames-dark-v2/rabbit-frame-2.webp",
  "/assets/images/title-rabbit-frames-dark-v2/rabbit-frame-3.webp",
  "/assets/images/title-rabbit-frames-dark-v2/rabbit-frame-4.webp",
]);

const PIG_FRAME_SOURCES = Object.freeze([
  "/assets/images/title-pig-frames-v2/pig-frame-1.webp",
  "/assets/images/title-pig-frames-v2/pig-frame-2.webp",
  "/assets/images/title-pig-frames-v2/pig-frame-3.webp",
  "/assets/images/title-pig-frames-v2/pig-frame-4.webp",
]);

const PIG_DARK_FRAME_SOURCES = Object.freeze([
  "/assets/images/title-pig-frames-dark-v2/pig-frame-1.webp",
  "/assets/images/title-pig-frames-dark-v2/pig-frame-2.webp",
  "/assets/images/title-pig-frames-dark-v2/pig-frame-3.webp",
  "/assets/images/title-pig-frames-dark-v2/pig-frame-4.webp",
]);

const START_THEME_TOGGLE_ICON_SOURCES = Object.freeze({
  dark: "/assets/images/ui/theme-toggle-sun.png",
  light: "/assets/images/ui/theme-toggle-moon.png",
});

const START_SONG_MARK_SOURCES = Object.freeze({
  dark: "/assets/images/ui/start-song-rabbit-mark.png",
  light: "/assets/images/ui/start-song-rabbit-mark-light.png",
});

const CLOUD_TONE_BY_CHAR = Object.freeze({
  B: "body",
  H: "highlight",
  S: "shadow",
});

function buildSongs(selectedSongId) {
  return [
    {
      id: "ditto",
      title: "Ditto",
      titleSegments: [
        {
          text: "Ditto",
          fontType: "en",
        },
      ],
      selected: selectedSongId === "ditto",
      available: true,
    },
    {
      id: "more-coming-soon",
      title: "更多歌曲敬请期待",
      titleSegments: [
        {
          text: "更多歌曲敬请期待",
          fontType: "zh",
        },
      ],
      selected: false,
      available: false,
    },
  ];
}

function formatPercent(value) {
  return Number(value.toFixed(3)).toString();
}

function formatCssLength(value, unit) {
  if (typeof value === "string" && !Number.isFinite(Number(value))) {
    return value;
  }

  if (unit === "px") {
    return `${formatPercent((Number(value) / 402) * 100)}cqw`;
  }

  return `${value}${unit}`;
}

function createPixelRun(id, left, top, width, height, tone, unit) {
  return Object.freeze({
    id,
    tone,
    style: Object.freeze({
      left: formatCssLength(left, unit),
      top: formatCssLength(top, unit),
      width: formatCssLength(width, unit),
      height: formatCssLength(height, unit),
    }),
  });
}

function createCloudShapeFromRows(shapeId, rows, options = {}) {
  const rowCount = rows.length;
  const colCount = Math.max(...rows.map((row) => row.length));
  const cloudBlocks = [];
  const runs = [];
  const rowHeight = formatPercent(100 / rowCount);

  rows.forEach((rawRow, rowIndex) => {
    const row = rawRow.padEnd(colCount, ".");
    let colIndex = 0;

    while (colIndex < colCount) {
      const toneChar = row[colIndex];
      const tone = CLOUD_TONE_BY_CHAR[toneChar];

      if (!tone) {
        colIndex += 1;
        continue;
      }

      const runStart = colIndex;
      while (colIndex < colCount && row[colIndex] === toneChar) {
        colIndex += 1;
      }

      const run = Object.freeze({
        id: `${shapeId}-${rowIndex}-${runStart}`,
        rowIndex,
        colStart: runStart,
        colSpan: colIndex - runStart,
        tone,
      });
      runs.push(run);

      cloudBlocks.push(
        createPixelRun(
          run.id,
          formatPercent((runStart / colCount) * 100),
          formatPercent((run.rowIndex / rowCount) * 100),
          formatPercent((run.colSpan / colCount) * 100),
          rowHeight,
          tone,
          "%"
        )
      );
    }
  });

  return Object.freeze({
    cloudBlocks: Object.freeze(cloudBlocks),
    runs: Object.freeze(runs),
    rowCount,
    colCount,
    pixelGrid: Boolean(options.pixelGrid),
  });
}

function buildPixelGridCloudBlocks(shape, layout) {
  return Object.freeze(
    shape.runs.map((run) => {
      const left = Math.round((run.colStart / shape.colCount) * layout.width);
      const right = Math.round(
        ((run.colStart + run.colSpan) / shape.colCount) * layout.width
      );
      const top = Math.round((run.rowIndex / shape.rowCount) * layout.height);
      const bottom = Math.round(((run.rowIndex + 1) / shape.rowCount) * layout.height);

      return createPixelRun(
        `${layout.id}-${run.id}`,
        left,
        top,
        right - left,
        bottom - top,
        run.tone,
        "px"
      );
    })
  );
}

const START_CLOUD_SHAPES = Object.freeze({
  wide: createCloudShapeFromRows("wide", [
    "................................................",
    "................................................",
    "......HHHH.............HHHHH....................",
    "....HHBBBBHH.......HHHBBBBBHH..................",
    "...HBBBBBBBBH.....HBBBBBBBBBBH.................",
    "..HBBBBBBBBBBHHHHHBBBBBBBBBBBBH................",
    ".BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBH...............",
    "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..............",
    "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB.............",
    ".BBBBBBBBBBSSBBBBBBBBBBBBBBBSSSSS..............",
    "..BBBBBSSSSSBBBBBBBBBBBBBSSSSSS................",
    "...BBBSSSSSSSBBBBBBBSSSSSSS....................",
    ".....SSSSSSSSSBBBSSSSSSS.......................",
    "................................................",
    "................................................",
    "................................................",
  ]),
  medium: createCloudShapeFromRows(
    "medium",
    [
      "........................................",
      "........................................",
      ".....HHH.........HHHH...................",
      "...HHBBBHH....HHBBBBH..................",
      "..HBBBBBBBHHHHBBBBBBBBH................",
      ".HBBBBBBBBBBBBBBBBBBBBBH...............",
      "BBBBBBBBBBBBBBBBBBBBBBBBB..............",
      "BBBBBBBBBBBBBBBBBBBBBBBSS..............",
      ".BBBBBBBSSBBBBBBBBBSSSS................",
      "..BBBBSSSSBBBBBBSSSS...................",
      "....SSSSSSBBBSSSS......................",
      "........................................",
      "........................................",
      "........................................",
    ],
    { pixelGrid: true }
  ),
  small: createCloudShapeFromRows("small", [
    "..................................",
    "..................................",
    "....HHH........HHH................",
    "..HHBBBHH...HHBBBBH..............",
    ".HBBBBBBBHHHBBBBBBBH.............",
    "BBBBBBBBBBBBBBBBBBBBB............",
    "BBBBBBBSSBBBBBBBBSSS.............",
    ".BBBSSSSSBBBBBBSSSS..............",
    "..BSSSSSSBBSSSSSS................",
    "....SSSSSBBSSS...................",
    "..................................",
    "..................................",
    "..................................",
  ]),
});

const START_CLOUD_LAYOUTS = Object.freeze([
  {
    id: "cloud-large-left",
    shape: "wide",
    left: -30,
    top: 18,
    width: 196,
    height: 58,
    driftClass: "start-cloud-drift-east-slow",
    bobClass: "start-cloud-bob-soft",
    swayClass: "start-cloud-sway-wide",
    driftDuration: 31.6,
    driftDelay: -9.4,
    bobDuration: 11.2,
    bobDelay: -2.8,
    swayDuration: 14.7,
    swayDelay: -6.2,
  },
  {
    id: "cloud-medium-right",
    shape: "medium",
    left: 244,
    top: 42,
    width: 146,
    height: 49,
    driftClass: "start-cloud-drift-west-medium",
    bobClass: "start-cloud-bob-mid",
    swayClass: "start-cloud-sway-medium-clean",
    driftDuration: 28.4,
    driftDelay: -15.6,
    bobDuration: 8.8,
    bobDelay: -1.9,
    swayDuration: 11.6,
    swayDelay: -5.7,
  },
  {
    id: "cloud-small-far",
    shape: "small",
    left: 304,
    top: 72,
    width: 66,
    height: 27,
    driftClass: "start-cloud-drift-east-fast",
    bobClass: "start-cloud-bob-soft",
    swayClass: "start-cloud-sway-light",
    driftDuration: 23.8,
    driftDelay: -7.8,
    bobDuration: 7.6,
    bobDelay: -4.1,
    swayDuration: 9.4,
    swayDelay: -3.3,
  },
  {
    id: "cloud-small-mid",
    shape: "small",
    left: 122,
    top: 92,
    width: 72,
    height: 30,
    driftClass: "start-cloud-drift-west-slow",
    bobClass: "start-cloud-bob-fast",
    swayClass: "start-cloud-sway-long",
    driftDuration: 32.8,
    driftDelay: -18.2,
    bobDuration: 6.5,
    bobDelay: -3.6,
    swayDuration: 10.8,
    swayDelay: -1.7,
  },
  {
    id: "cloud-medium-left",
    shape: "medium",
    left: -10,
    top: 88,
    width: 150,
    height: 49,
    driftClass: "start-cloud-drift-east-medium",
    bobClass: "start-cloud-bob-mid",
    swayClass: "start-cloud-sway-medium-clean",
    driftDuration: 29.6,
    driftDelay: -13.4,
    bobDuration: 9.6,
    bobDelay: -5.4,
    swayDuration: 13.2,
    swayDelay: -7.1,
  },
]);

function scaledPx(value) {
  return `${formatPercent((value / 402) * 100)}cqw`;
}

function buildStartCloudTrackStyle(layout) {
  return Object.freeze({
    left: scaledPx(layout.left),
    top: scaledPx(layout.top),
    width: scaledPx(layout.width),
    height: scaledPx(layout.height),
    animationDuration: `${layout.driftDuration || 28}s`,
    animationDelay: `${layout.driftDelay || 0}s`,
  });
}

function buildStartCloudBobStyle(layout) {
  return Object.freeze({
    animationDuration: `${layout.bobDuration || 8}s`,
    animationDelay: `${layout.bobDelay || 0}s`,
  });
}

function buildStartCloudSwayStyle(layout) {
  return Object.freeze({
    animationDuration: `${layout.swayDuration || 12}s`,
    animationDelay: `${layout.swayDelay || 0}s`,
  });
}

export const START_CLOUDS = Object.freeze(
  START_CLOUD_LAYOUTS.map((layout) => {
    const shape = START_CLOUD_SHAPES[layout.shape] || START_CLOUD_SHAPES.medium;
    const cloudBlocks = shape.pixelGrid
      ? buildPixelGridCloudBlocks(shape, layout)
      : shape.cloudBlocks;

    return Object.freeze({
      ...layout,
      ...shape,
      cloudBlocks,
      trackStyle: buildStartCloudTrackStyle(layout),
      bobStyle: buildStartCloudBobStyle(layout),
      swayStyle: buildStartCloudSwayStyle(layout),
    });
  })
);

export const START_LOADING_MIN_DURATION_MS = 280;

export function getStartSongs(selectedSongId) {
  return buildSongs(selectedSongId);
}

export function getStartBackdropSrc(theme) {
  return START_THEME_BACKDROPS[theme] || START_THEME_BACKDROPS[DEFAULT_START_THEME];
}

export function getStartBackdropLayout(theme) {
  return START_BACKDROP_LAYOUTS[theme] || START_BACKDROP_LAYOUTS[DEFAULT_START_THEME];
}

export function getStartBackdropCoverMetrics(theme, stageSize) {
  const backdrop = getStartBackdropLayout(theme);
  const stageWidth = Math.max(1, stageSize.width || 1);
  const stageHeight = Math.max(1, stageSize.height || 1);
  const scale = Math.max(
    stageWidth / backdrop.naturalWidth,
    stageHeight / backdrop.naturalHeight
  );
  const renderedWidth = backdrop.naturalWidth * scale;
  const renderedHeight = backdrop.naturalHeight * scale;
  const offsetX = (stageWidth - renderedWidth) / 2;
  const centerOffsetY = (stageHeight - renderedHeight) / 2;
  const requestedObjectOffsetY = Math.max(0, backdrop.objectOffsetY || 0);
  const maxDownwardOffsetY = Math.max(0, -centerOffsetY);
  const objectOffsetY = Math.min(requestedObjectOffsetY, maxDownwardOffsetY);

  return Object.freeze({
    scale,
    renderedWidth,
    renderedHeight,
    offsetX,
    offsetY: centerOffsetY + objectOffsetY,
    objectOffsetY,
  });
}

export function getStartBackdropStageOffsetY(theme, stageSize) {
  return getStartBackdropCoverMetrics(theme, stageSize).objectOffsetY;
}

export function mapStartBackdropPointToStage(theme, stageSize, sourcePoint) {
  const metrics = getStartBackdropCoverMetrics(theme, stageSize);

  return Object.freeze({
    x: metrics.offsetX + sourcePoint.x * metrics.scale,
    y: metrics.offsetY + sourcePoint.y * metrics.scale,
  });
}

export function getStartCharacterStageAnchors(theme, stageSize) {
  const backdrop = getStartBackdropLayout(theme);
  const xAnchorBackdrop = getStartBackdropLayout(START_CHARACTER_X_ANCHOR_THEME);
  const rabbitXAnchor = mapStartBackdropPointToStage(
    START_CHARACTER_X_ANCHOR_THEME,
    stageSize,
    xAnchorBackdrop.anchors.rabbit
  );
  const pigXAnchor = mapStartBackdropPointToStage(
    START_CHARACTER_X_ANCHOR_THEME,
    stageSize,
    xAnchorBackdrop.anchors.pig
  );
  const rabbitYAnchor = mapStartBackdropPointToStage(theme, stageSize, backdrop.anchors.rabbit);
  const pigYAnchor = mapStartBackdropPointToStage(theme, stageSize, backdrop.anchors.pig);

  return Object.freeze({
    rabbit: Object.freeze({
      x: rabbitXAnchor.x,
      y: rabbitYAnchor.y,
    }),
    pig: Object.freeze({
      x: pigXAnchor.x,
      y: pigYAnchor.y,
    }),
  });
}

export function getRabbitFrameSources(theme) {
  return theme === START_THEMES.dark ? RABBIT_DARK_FRAME_SOURCES : RABBIT_FRAME_SOURCES;
}

export function getPigFrameSources(theme) {
  return theme === START_THEMES.dark ? PIG_DARK_FRAME_SOURCES : PIG_FRAME_SOURCES;
}

export function getThemeToggleIconSrc(theme) {
  return (
    START_THEME_TOGGLE_ICON_SOURCES[theme] ||
    START_THEME_TOGGLE_ICON_SOURCES[DEFAULT_START_THEME]
  );
}

export function getStartSongMarkSrc(theme) {
  return START_SONG_MARK_SOURCES[theme] || START_SONG_MARK_SOURCES[DEFAULT_START_THEME];
}

export function getStartBlockingImageSources(theme) {
  const normalizedTheme = theme === START_THEMES.light ? START_THEMES.light : START_THEMES.dark;
  const rabbitFrameSources = getRabbitFrameSources(normalizedTheme);
  const pigFrameSources = getPigFrameSources(normalizedTheme);

  return Array.from(
    new Set(
      [
        getStartBackdropSrc(normalizedTheme),
        rabbitFrameSources[0],
        pigFrameSources[0],
      ].filter(Boolean)
    )
  );
}

export function getStartDeferredImageSources(theme) {
  const normalizedTheme = theme === START_THEMES.light ? START_THEMES.light : START_THEMES.dark;
  const alternateTheme =
    normalizedTheme === START_THEMES.light ? START_THEMES.dark : START_THEMES.light;

  return Array.from(
    new Set([
      getThemeToggleIconSrc(normalizedTheme),
      getStartSongMarkSrc(normalizedTheme),
      ...getRabbitFrameSources(normalizedTheme).slice(1),
      ...getPigFrameSources(normalizedTheme).slice(1),
      ...getStartBlockingImageSources(alternateTheme),
      getThemeToggleIconSrc(alternateTheme),
      getStartSongMarkSrc(alternateTheme),
      ...getRabbitFrameSources(alternateTheme).slice(1),
      ...getPigFrameSources(alternateTheme).slice(1),
    ])
  );
}
