const {
  DEFAULT_START_THEME,
  START_THEMES,
  getStartTheme,
  setStartTheme,
} = require("../../utils/start-theme");

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
      id: "coming-soon-1",
      title: "How Sweet 敬请期待",
      titleSegments: [
        {
          text: "How Sweet",
          fontType: "en",
        },
        {
          text: "敬请期待",
          fontType: "zh",
        },
      ],
      selected: false,
      available: false,
    },
    {
      id: "coming-soon-2",
      title: "Supernatural 敬请期待",
      titleSegments: [
        {
          text: "Supernatural",
          fontType: "en",
        },
        {
          text: "敬请期待",
          fontType: "zh",
        },
      ],
      selected: false,
      available: false,
    },
  ];
}

const RABBIT_FRAME_SOURCES = Object.freeze([
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-1.png",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-2.png",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-3.png",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-4.png",
]);

const RABBIT_DARK_FRAME_SOURCES = Object.freeze([
  "/assets/images/title-rabbit-frames-dark-v2/rabbit-frame-1.png",
  "/assets/images/title-rabbit-frames-dark-v2/rabbit-frame-2.png",
  "/assets/images/title-rabbit-frames-dark-v2/rabbit-frame-3.png",
  "/assets/images/title-rabbit-frames-dark-v2/rabbit-frame-4.png",
]);

const PIG_FRAME_SOURCES = Object.freeze([
  "/assets/images/title-pig-frames-v2/pig-frame-1.png",
  "/assets/images/title-pig-frames-v2/pig-frame-2.png",
  "/assets/images/title-pig-frames-v2/pig-frame-3.png",
  "/assets/images/title-pig-frames-v2/pig-frame-4.png",
]);

const PIG_DARK_FRAME_SOURCES = Object.freeze([
  "/assets/images/title-pig-frames-dark-v2/pig-frame-1.png",
  "/assets/images/title-pig-frames-dark-v2/pig-frame-2.png",
  "/assets/images/title-pig-frames-dark-v2/pig-frame-3.png",
  "/assets/images/title-pig-frames-dark-v2/pig-frame-4.png",
]);

const START_THEME_BACKDROPS = Object.freeze({
  dark: "/assets/images/首页夜晚版.runtime.jpg",
  light: "/assets/images/首页夕阳版.runtime.jpg",
});
const INITIAL_START_THEME = getStartTheme();

const START_THEME_TOGGLE_ICON_SOURCES = Object.freeze({
  dark: "/assets/images/ui/theme-toggle-sun.png",
  light: "/assets/images/ui/theme-toggle-moon.png",
});
const START_SONG_MARK_SOURCES = Object.freeze({
  dark: "/assets/images/ui/start-song-rabbit-mark.png",
  light: "/assets/images/ui/start-song-rabbit-mark-light.png",
});
const START_LOADING_TEXT_KEYS = Object.freeze({
  enter: "enter",
  resultReturn: "resultReturn",
});
const START_LOADING_TEXT_LABELS = Object.freeze({
  enter: "进入魔法世界",
  resultReturn: "回到魔法世界",
});
const START_LOADING_TEXT_IMAGE_SOURCES = Object.freeze({
  dark: Object.freeze({
    enter: "/assets/images/进入魔法世界.dark.png",
    resultReturn: "/assets/images/回到魔法世界.dark.png",
  }),
  light: Object.freeze({
    enter: "/assets/images/进入魔法世界....png",
    resultReturn: "/assets/images/回到魔法世界....png",
  }),
});

const CLOUD_TONE_BY_CHAR = Object.freeze({
  B: "body",
  H: "highlight",
  S: "shadow",
});

function formatPercent(value) {
  return Number(value.toFixed(3)).toString();
}

function formatCssLength(value, unit) {
  if (typeof value === "string" && !Number.isFinite(Number(value))) {
    return value;
  }

  return `${value}${unit}`;
}

function createPixelRun(id, left, top, width, height, tone, unit) {
  return Object.freeze({
    id,
    tone,
    style: [
      `left:${formatCssLength(left, unit)}`,
      `top:${formatCssLength(top, unit)}`,
      `width:${formatCssLength(width, unit)}`,
      `height:${formatCssLength(height, unit)}`,
    ].join(";") + ";",
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
          formatPercent((rowIndex / rowCount) * 100),
          formatPercent(((colIndex - runStart) / colCount) * 100),
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
      const bottom = Math.round(
        ((run.rowIndex + 1) / shape.rowCount) * layout.height
      );

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
  medium: createCloudShapeFromRows("medium", [
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
  ], { pixelGrid: true }),
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

function buildStartCloudTrackStyle(layout) {
  return [
    `left:${layout.left}px`,
    `top:${layout.top}px`,
    `width:${layout.width}px`,
    `height:${layout.height}px`,
    `animation-duration:${layout.driftDuration || 28}s`,
    `animation-delay:${layout.driftDelay || 0}s`,
  ].join(";") + ";";
}

function buildStartCloudBobStyle(layout) {
  return [
    `animation-duration:${layout.bobDuration || 8}s`,
    `animation-delay:${layout.bobDelay || 0}s`,
  ].join(";") + ";";
}

function buildStartCloudSwayStyle(layout) {
  return [
    `animation-duration:${layout.swayDuration || 12}s`,
    `animation-delay:${layout.swayDelay || 0}s`,
  ].join(";") + ";";
}

function buildStartClouds() {
  return START_CLOUD_LAYOUTS.map((layout) => {
    const shape = START_CLOUD_SHAPES[layout.shape] || START_CLOUD_SHAPES.medium;
    const cloudBlocks = shape.pixelGrid
      ? buildPixelGridCloudBlocks(shape, layout)
      : shape.cloudBlocks;

    return {
      ...layout,
      ...shape,
      cloudBlocks,
      trackStyle: buildStartCloudTrackStyle(layout),
      bobStyle: buildStartCloudBobStyle(layout),
      swayStyle: buildStartCloudSwayStyle(layout),
    };
  });
}

const START_LOADING_MIN_DURATION_MS = 280;
const START_CRITICAL_IMAGE_SOURCES = Object.freeze([
  START_THEME_BACKDROPS.dark,
  START_THEME_BACKDROPS.light,
  START_THEME_TOGGLE_ICON_SOURCES.dark,
  START_THEME_TOGGLE_ICON_SOURCES.light,
  START_SONG_MARK_SOURCES.dark,
  START_SONG_MARK_SOURCES.light,
  "/assets/images/进入魔法世界....png",
  "/assets/images/回到魔法世界....png",
  "/assets/images/进入魔法世界.dark.png",
  "/assets/images/回到魔法世界.dark.png",
  ...RABBIT_DARK_FRAME_SOURCES.slice(0, 1),
  ...PIG_DARK_FRAME_SOURCES.slice(0, 1),
  ...RABBIT_FRAME_SOURCES.slice(0, 1),
  ...PIG_FRAME_SOURCES.slice(0, 1),
]);

function getStartBackdropSrc(theme) {
  return START_THEME_BACKDROPS[theme] || START_THEME_BACKDROPS[DEFAULT_START_THEME];
}

function getRabbitFrameSources(theme) {
  return theme === START_THEMES.dark ? RABBIT_DARK_FRAME_SOURCES : RABBIT_FRAME_SOURCES;
}

function getPigFrameSources(theme) {
  return theme === START_THEMES.dark ? PIG_DARK_FRAME_SOURCES : PIG_FRAME_SOURCES;
}

function getThemeToggleIconSrc(theme) {
  return (
    START_THEME_TOGGLE_ICON_SOURCES[theme] ||
    START_THEME_TOGGLE_ICON_SOURCES[DEFAULT_START_THEME]
  );
}

function getStartSongMarkSrc(theme) {
  return START_SONG_MARK_SOURCES[theme] || START_SONG_MARK_SOURCES[DEFAULT_START_THEME];
}

function getLoadingTextKey(entry) {
  return entry === "result-return"
    ? START_LOADING_TEXT_KEYS.resultReturn
    : START_LOADING_TEXT_KEYS.enter;
}

function getLoadingSubtitle(key) {
  return START_LOADING_TEXT_LABELS[key] || START_LOADING_TEXT_LABELS.enter;
}

function getLoadingSubtitleImageSrc(theme, key) {
  const themeSources =
    START_LOADING_TEXT_IMAGE_SOURCES[theme] ||
    START_LOADING_TEXT_IMAGE_SOURCES[DEFAULT_START_THEME];
  return themeSources[key] || themeSources.enter;
}

function buildStartFontAuditEntries(songs = []) {
  const rows = [
    Object.freeze({
      location: "首页标题英文",
      text: "Bunnies",
      preset: "pixelEn",
    }),
    Object.freeze({
      location: "首页标题中文",
      text: "爆锤方猪",
      preset: "pixelZh",
    }),
    Object.freeze({
      location: "首页开始按钮",
      text: "开始",
      preset: "pixelZh",
    }),
  ];

  songs.forEach((song) => {
    (song.titleSegments || []).forEach((segment) => {
      rows.push(
        Object.freeze({
          location: `首页曲目 ${song.id}`,
          text: segment.text,
          preset: segment.fontType === "zh" ? "pixelZh" : "pixelEn",
        })
      );
    });
  });

  return rows;
}

function normalizeStartError(error) {
  if (!error) {
    return "";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error.errMsg) {
    return error.errMsg;
  }

  try {
    return JSON.stringify(error);
  } catch (jsonError) {
    return String(error);
  }
}

function wait(durationMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function preloadImageAsset(src) {
  return new Promise((resolve) => {
    if (!src || typeof wx === "undefined" || typeof wx.getImageInfo !== "function") {
      resolve({
        src,
        ok: false,
        reason: "wx.getImageInfo unavailable",
      });
      return;
    }

    wx.getImageInfo({
      src,
      success() {
        resolve({
          src,
          ok: true,
        });
      },
      fail(error) {
        resolve({
          src,
          ok: false,
          reason: normalizeStartError(error),
        });
      },
    });
  });
}

function preloadStartVisuals(extraSources = []) {
  const sources = Array.from(
    new Set([...START_CRITICAL_IMAGE_SOURCES, ...extraSources].filter(Boolean))
  );

  return Promise.all(sources.map((src) => preloadImageAsset(src))).then((results) => {
    const failed = results.filter((item) => !item.ok);
    if (failed.length) {
      console.warn("Start page asset preload results", failed);
    }
    return results;
  });
}

Page({
  data: {
    selectedSongId: "ditto",
    songs: buildSongs("ditto"),
    rabbitFrameSources: getRabbitFrameSources(INITIAL_START_THEME),
    currentRabbitFrame: 0,
    currentRabbitFrameSrc: getRabbitFrameSources(INITIAL_START_THEME)[0],
    pigFrameSources: getPigFrameSources(INITIAL_START_THEME),
    currentPigFrame: 0,
    currentPigFrameSrc: getPigFrameSources(INITIAL_START_THEME)[0],
    clouds: buildStartClouds(),
    startTheme: INITIAL_START_THEME,
    startBackdropSrc: getStartBackdropSrc(INITIAL_START_THEME),
    themeToggleIconSrc: getThemeToggleIconSrc(INITIAL_START_THEME),
    startSongMarkSrc: getStartSongMarkSrc(INITIAL_START_THEME),
    pageReady: false,
    loadingSubtitle: getLoadingSubtitle(START_LOADING_TEXT_KEYS.enter),
    loadingSubtitleImageSrc: getLoadingSubtitleImageSrc(
      INITIAL_START_THEME,
      START_LOADING_TEXT_KEYS.enter
    ),
  },

  onLoad(options = {}) {
    this.pageReadySequence = (this.pageReadySequence || 0) + 1;
    this.pageVisualsReady = false;
    this.pageMounted = false;
    this.pageDestroyed = false;
    const app = getApp();
    const startTheme = getStartTheme(options.theme, app);

    const loadingTextKey = getLoadingTextKey(options.entry);
    const loadingSubtitle = getLoadingSubtitle(loadingTextKey);
    const loadingSubtitleImageSrc = getLoadingSubtitleImageSrc(startTheme, loadingTextKey);
    const rabbitFrameSources = getRabbitFrameSources(startTheme);
    const pigFrameSources = getPigFrameSources(startTheme);

    this.setData({
      pageReady: false,
      startTheme,
      startBackdropSrc: getStartBackdropSrc(startTheme),
      themeToggleIconSrc: getThemeToggleIconSrc(startTheme),
      startSongMarkSrc: getStartSongMarkSrc(startTheme),
      rabbitFrameSources,
      currentRabbitFrame: 0,
      currentRabbitFrameSrc: rabbitFrameSources[0],
      pigFrameSources,
      currentPigFrame: 0,
      currentPigFrameSrc: pigFrameSources[0],
      loadingSubtitle,
      loadingSubtitleImageSrc,
    });

    Promise.resolve(app.ensurePixelFonts && app.ensurePixelFonts())
      .catch((error) => {
        console.error("Failed to initialize pixel fonts on start page", error);
      })
      .finally(() => {
        if (this.pageDestroyed || !app.reportFontAudit) {
          return;
        }

        app.reportFontAudit("start", buildStartFontAuditEntries(this.data.songs));
      });

    this.preparePageReady({
      sequence: this.pageReadySequence,
      extraSources: loadingSubtitleImageSrc ? [loadingSubtitleImageSrc] : [],
    });

    this.startRabbitFrameLoop();
    this.startPigFrameLoop();
  },

  onReady() {
    this.pageMounted = true;
    this.syncPageReady();
  },

  onShow() {
    this.startRabbitFrameLoop();
    this.startPigFrameLoop();
  },

  onHide() {
    this.stopRabbitFrameLoop();
    this.stopPigFrameLoop();
  },

  onUnload() {
    this.pageDestroyed = true;
    this.stopRabbitFrameLoop();
    this.stopPigFrameLoop();
  },

  preparePageReady({ sequence, extraSources = [] }) {
    Promise.allSettled([
      preloadStartVisuals(extraSources),
      wait(START_LOADING_MIN_DURATION_MS),
    ]).then(() => {
      if (this.pageDestroyed || this.pageReadySequence !== sequence) {
        return;
      }

      this.pageVisualsReady = true;
      this.syncPageReady();
    });
  },

  syncPageReady() {
    if (
      this.pageDestroyed ||
      this.data.pageReady ||
      !this.pageMounted ||
      !this.pageVisualsReady
    ) {
      return;
    }

    wx.nextTick(() => {
      if (
        this.pageDestroyed ||
        this.data.pageReady ||
        !this.pageMounted ||
        !this.pageVisualsReady
      ) {
        return;
      }

      this.setData({
        pageReady: true,
      });
    });
  },

  startRabbitFrameLoop() {
    if (this.rabbitFrameTimer) {
      return;
    }

    let rabbitFrame = this.data.currentRabbitFrame || 0;
    this.rabbitFrameTimer = setInterval(() => {
      const rabbitFrameSources =
        this.data.rabbitFrameSources || getRabbitFrameSources(this.data.startTheme);
      rabbitFrame = (rabbitFrame + 1) % rabbitFrameSources.length;
      this.setData({
        currentRabbitFrame: rabbitFrame,
        currentRabbitFrameSrc: rabbitFrameSources[rabbitFrame],
      });
    }, 220);
  },

  startPigFrameLoop() {
    if (this.pigFrameTimer) {
      return;
    }

    let pigFrame = this.data.currentPigFrame || 0;
    this.pigFrameTimer = setInterval(() => {
      const pigFrameSources =
        this.data.pigFrameSources || getPigFrameSources(this.data.startTheme);
      pigFrame = (pigFrame + 1) % pigFrameSources.length;
      this.setData({
        currentPigFrame: pigFrame,
        currentPigFrameSrc: pigFrameSources[pigFrame],
      });
    }, 240);
  },

  stopRabbitFrameLoop() {
    if (!this.rabbitFrameTimer) {
      return;
    }

    clearInterval(this.rabbitFrameTimer);
    this.rabbitFrameTimer = null;
  },

  stopPigFrameLoop() {
    if (!this.pigFrameTimer) {
      return;
    }

    clearInterval(this.pigFrameTimer);
    this.pigFrameTimer = null;
  },

  handleSongSelect(event) {
    const songId = event.currentTarget.dataset.songId;
    const song = this.data.songs.find((item) => item.id === songId);
    if (!songId || !song || !song.available || songId === this.data.selectedSongId) {
      return;
    }

    this.setData({
      selectedSongId: songId,
      songs: buildSongs(songId),
    });
  },

  handleThemeToggle() {
    const nextTheme = setStartTheme(
      this.data.startTheme === START_THEMES.dark ? START_THEMES.light : START_THEMES.dark,
      getApp()
    );
    const rabbitFrameSources = getRabbitFrameSources(nextTheme);
    const pigFrameSources = getPigFrameSources(nextTheme);
    const currentRabbitFrame =
      (this.data.currentRabbitFrame || 0) % rabbitFrameSources.length;
    const currentPigFrame = (this.data.currentPigFrame || 0) % pigFrameSources.length;

    this.setData({
      startTheme: nextTheme,
      startBackdropSrc: getStartBackdropSrc(nextTheme),
      themeToggleIconSrc: getThemeToggleIconSrc(nextTheme),
      startSongMarkSrc: getStartSongMarkSrc(nextTheme),
      rabbitFrameSources,
      currentRabbitFrame,
      currentRabbitFrameSrc: rabbitFrameSources[currentRabbitFrame],
      pigFrameSources,
      currentPigFrame,
      currentPigFrameSrc: pigFrameSources[currentPigFrame],
    });
  },

  handleStartTap() {
    const songId = encodeURIComponent(this.data.selectedSongId);
    const startTheme = encodeURIComponent(setStartTheme(this.data.startTheme, getApp()));

    wx.redirectTo({
      url: `/pages/game/game?autostart=1&songId=${songId}&theme=${startTheme}`,
    });
  },
});
