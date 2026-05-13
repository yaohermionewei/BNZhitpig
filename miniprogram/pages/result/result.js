const songs = require("../../game/data/songs");
const {
  DEFAULT_START_THEME,
  getStartTheme,
  normalizeStartTheme,
  setStartTheme,
} = require("../../utils/start-theme");

const LATEST_RESULT_SUMMARY_STORAGE_KEY = "latestResultSummaryV1";
const DEFAULT_RESULT_SUMMARY = Object.freeze({
  songId: "ditto",
  songTitle: "Ditto",
  songCoverImageSrc: "/assets/images/song-covers/ditto.cover.pixel.png",
  statusLabel: "",
  rank: "B",
  rankTone: "sky",
  failed: false,
  scoreDisplay: "00000",
  accuracyDisplay: "0.0%",
  totalNotes: 0,
  perfect: 0,
  good: 0,
  miss: 0,
  maxCombo: 0,
  startTheme: DEFAULT_START_THEME,
});

const RABBIT_FRAME_SOURCES = Object.freeze([
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-1.png",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-2.png",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-3.png",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-4.png",
]);
const INITIAL_START_THEME = getStartTheme();
const RESULT_LEAVING_SUBTITLE_IMAGE_SOURCES = Object.freeze({
  dark: "/assets/images/回到魔法世界.dark.png",
  light: "/assets/images/回到魔法世界....png",
});

const DEFAULT_RESULT_TONE = "sky";
const PAGE_TONE_CLASS_MAP = Object.freeze({
  prism: "result-page-tone-prism",
  mint: "result-page-tone-mint",
  sky: "result-page-tone-sky",
  violet: "result-page-tone-violet",
  rose: "result-page-tone-rose",
});
const RANK_TONE_CLASS_MAP = Object.freeze({
  prism: "result-rank-tone-prism",
  mint: "result-rank-tone-mint",
  sky: "result-rank-tone-sky",
  violet: "result-rank-tone-violet",
  rose: "result-rank-tone-rose",
});
const RESULT_DIGIT_SPRITES = Object.freeze({
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
  ",": Object.freeze([
    "........",
    "........",
    "........",
    "........",
    "........",
    "...ff...",
    "...ff...",
    "..ff....",
    ".ff.....",
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

const HOME_TRANSITION_ROUTE_DELAY_MS = 48;

function getSafeResultTone(tone) {
  return PAGE_TONE_CLASS_MAP[tone] ? tone : DEFAULT_RESULT_TONE;
}

function getPageToneClass(resultTone) {
  return PAGE_TONE_CLASS_MAP[resultTone] || PAGE_TONE_CLASS_MAP[DEFAULT_RESULT_TONE];
}

function getRankToneClass(resultTone) {
  return RANK_TONE_CLASS_MAP[resultTone] || RANK_TONE_CLASS_MAP[DEFAULT_RESULT_TONE];
}

function getDisplayStatusLabel(summary) {
  const hitCount =
    Number((summary && summary.perfect) || 0) + Number((summary && summary.good) || 0);
  return `爆锤方猪${Math.max(0, hitCount)}次`;
}

function getStatusLengthClass(statusLabel) {
  const length = String(statusLabel || "").length;

  if (length >= 11) {
    return "result-status-text-long";
  }

  if (length >= 9) {
    return "result-status-text-medium";
  }

  return "result-status-text-short";
}

function getRankLengthClass(rank) {
  const length = String(rank || "").length;

  if (length >= 3) {
    return "result-rank-text-ultra-compact";
  }

  if (length === 2) {
    return "result-rank-text-compact";
  }

  return "result-rank-text-standard";
}

function getDigitSprite(char) {
  return RESULT_DIGIT_SPRITES[char] || null;
}

function createEmptyDigitRows() {
  return RESULT_DIGIT_SPRITES[0].map((row, rowIndex) => ({
    id: `empty-${rowIndex}`,
    pixels: Array.from(row).map((_, columnIndex) => ({
      id: `empty-${rowIndex}-${columnIndex}`,
      filled: false,
    })),
  }));
}

function buildDigitGlyphs(value) {
  const text = String(value == null || value === "" ? "0" : value);
  const glyphs = [];

  Array.from(text).forEach((char, glyphIndex) => {
    const sprite = getDigitSprite(char);
    if (!sprite) {
      return;
    }

    glyphs.push({
      id: `${glyphIndex}-${char}`,
      char,
      rows: sprite.map((row, rowIndex) => ({
        id: `${glyphIndex}-${rowIndex}`,
        pixels: Array.from(row).map((cell, columnIndex) => ({
          id: `${glyphIndex}-${rowIndex}-${columnIndex}`,
          filled: cell === "f",
        })),
      })),
    });
  });

  if (glyphs.length > 0) {
    return glyphs;
  }

  return [
    {
      id: "empty",
      char: "",
      rows: createEmptyDigitRows(),
    },
  ];
}

function buildStatItem(config) {
  const value = String(config.value ?? 0);
  return {
    key: config.key,
    label: config.label,
    value,
    digitGlyphs: buildDigitGlyphs(value),
  };
}

function buildStats(summary) {
  const perfect = buildStatItem({
    key: "perfect",
    label: "完美爆锤",
    value: summary.perfect,
  });
  const good = buildStatItem({
    key: "good",
    label: "优秀爆锤",
    value: summary.good,
  });
  const miss = buildStatItem({
    key: "miss",
    label: "爆锤落空",
    value: summary.miss,
  });
  const combo = buildStatItem({
    key: "combo",
    label: "最高连击",
    value: summary.maxCombo,
  });

  return [perfect, good, miss, combo];
}

function buildResultFontAuditEntries(summary) {
  const rows = [];
  const decoratedSummary = normalizeSummary(summary || DEFAULT_RESULT_SUMMARY);
  const stats = buildStats(decoratedSummary);

  (decoratedSummary.displayStatusLabelSegments || []).forEach((segment) => {
    rows.push(
      Object.freeze({
        location: "结果页状态文案",
        text: segment.text,
        preset: segment.fontType === "zh" ? "resultPixelZh" : "resultPixelEn",
      })
    );
  });

  (decoratedSummary.songTitleSegments || []).forEach((segment) => {
    rows.push(
      Object.freeze({
        location: "结果页歌名",
        text: segment.text,
        preset: segment.fontType === "zh" ? "resultPixelZh" : "resultPixelEn",
      })
    );
  });

  rows.push(
    Object.freeze({
      location: "结果页等级",
      text: decoratedSummary.rank || "",
      preset: "resultPixelEn",
    }),
    Object.freeze({
      location: "结果页分数字段标签",
      text: "总分",
      preset: "resultPixelZh",
    })
  );

  stats.forEach((item) => {
    rows.push(
      Object.freeze({
        location: `结果页统计标签 ${item.key}`,
        text: item.label,
        preset: "resultPixelZh",
      })
    );
  });

  rows.push(
    Object.freeze({
      location: "结果页按钮",
      text: "回到首页",
      preset: "resultPixelZh",
    }),
    Object.freeze({
      location: "结果页按钮",
      text: "再来一遍",
      preset: "resultPixelZh",
    }),
    Object.freeze({
      location: "结果页离场文案",
      text: "回到魔法世界",
      preset: "pixelZh",
      notes: "仅在返回首页过场时显示",
    }),
    Object.freeze({
      location: "结果页离场省略号",
      text: "...",
      preset: "pixelEn",
      notes: "仅在返回首页过场时显示",
    })
  );

  return rows;
}

function formatResultScoreDisplay(scoreDisplay) {
  const digitsOnly = String(scoreDisplay == null ? "" : scoreDisplay).replace(/[^\d]/g, "");
  const numericScore = digitsOnly ? Number(digitsOnly) : 0;

  if (!Number.isFinite(numericScore)) {
    return "0";
  }

  return String(Math.max(0, Math.round(numericScore)));
}

function isZhFontCodePoint(codePoint) {
  return (
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0x3000 && codePoint <= 0x303f) ||
    (codePoint >= 0xff00 && codePoint <= 0xffef) ||
    (codePoint >= 0x2e80 && codePoint <= 0x2fdf) ||
    (codePoint >= 0x31c0 && codePoint <= 0x31ef)
  );
}

function getFontTypeForChar(char, previousType = "en") {
  if (!char) {
    return previousType;
  }

  if (/\s/.test(char)) {
    return previousType;
  }

  const codePoint = char.codePointAt(0);
  return isZhFontCodePoint(codePoint) ? "zh" : "en";
}

function buildFontSegments(value) {
  const text = value == null ? "" : String(value);
  const segments = [];
  let currentSegment = null;
  let previousType = "en";

  Array.from(text).forEach((char) => {
    const fontType = getFontTypeForChar(char, previousType);
    previousType = fontType;

    if (!currentSegment || currentSegment.fontType !== fontType) {
      currentSegment = {
        text: char,
        fontType,
      };
      segments.push(currentSegment);
      return;
    }

    currentSegment.text += char;
  });

  return segments;
}

function decorateSummary(summary) {
  const resultTone = getSafeResultTone(summary.rankTone);
  const displayStatusLabel = getDisplayStatusLabel(summary);
  const displayScore = formatResultScoreDisplay(summary.scoreDisplay);
  const displayHitCount =
    Number((summary && summary.perfect) || 0) + Number((summary && summary.good) || 0);

  return {
    ...summary,
    rankTone: resultTone,
    pageToneClass: getPageToneClass(resultTone),
    rankToneClass: getRankToneClass(resultTone),
    rankLengthClass: getRankLengthClass(summary.rank),
    statusLengthClass: getStatusLengthClass(displayStatusLabel),
    displayStatusLabel,
    displayStatusPrefixSegments: buildFontSegments("爆锤方猪"),
    displayStatusHitCount: String(Math.max(0, displayHitCount)),
    displayStatusSuffixSegments: buildFontSegments("次"),
    displayScore,
    displayStatusLabelSegments: buildFontSegments(displayStatusLabel),
    songTitleSegments: buildFontSegments(summary.songTitle),
  };
}

function getSongMetaById(songId) {
  if (!songId) {
    return null;
  }

  return songs.find((song) => song.id === songId) || null;
}

function normalizeSummary(summary) {
  const rawSummary = summary && typeof summary === "object" ? summary : {};
  const songId = rawSummary.songId || DEFAULT_RESULT_SUMMARY.songId;
  const songMeta = getSongMetaById(songId);
  const mergedSummary = {
    ...DEFAULT_RESULT_SUMMARY,
    ...rawSummary,
  };
  const { songSubtitle: _songSubtitle, ...summaryWithoutSubtitle } = mergedSummary;

  return decorateSummary({
    ...summaryWithoutSubtitle,
    startTheme: normalizeStartTheme(rawSummary.startTheme || mergedSummary.startTheme),
    songTitle: rawSummary.songTitle || (songMeta && songMeta.title) || DEFAULT_RESULT_SUMMARY.songTitle,
    songCoverImageSrc:
      rawSummary.songCoverImageSrc ||
      (songMeta && songMeta.coverImageSrc) ||
      "",
  });
}

const DEFAULT_DECORATED_RESULT_SUMMARY = normalizeSummary(DEFAULT_RESULT_SUMMARY);

function getResultFontReady(app) {
  return !!(
    app &&
    app.globalData &&
    (app.globalData.resultFixedFontLoaded || app.globalData.pixelFontsLoaded)
  );
}

function getLeavingSubtitleImageSrc(theme) {
  const normalizedTheme = normalizeStartTheme(theme);
  return (
    RESULT_LEAVING_SUBTITLE_IMAGE_SOURCES[normalizedTheme] ||
    RESULT_LEAVING_SUBTITLE_IMAGE_SOURCES[DEFAULT_START_THEME]
  );
}

Page({
  data: {
    summary: DEFAULT_DECORATED_RESULT_SUMMARY,
    stats: buildStats(DEFAULT_DECORATED_RESULT_SUMMARY),
    scoreDigitGlyphs: buildDigitGlyphs(DEFAULT_DECORATED_RESULT_SUMMARY.displayScore),
    rabbitFrameSources: RABBIT_FRAME_SOURCES,
    currentRabbitFrame: 0,
    currentRabbitFrameSrc: RABBIT_FRAME_SOURCES[0],
    isLeavingHome: false,
    startTheme: INITIAL_START_THEME,
    summaryReady: false,
    fontReady: false,
    showResultScene: true,
    leavingSubtitleImageSrc: getLeavingSubtitleImageSrc(INITIAL_START_THEME),
  },

  onLoad() {
    this.pageDestroyed = false;

    const storedSummary = this.readLatestSummary();
    if (!storedSummary) {
      wx.reLaunch({
        url: "/pages/start/start",
      });
      return;
    }

    const app = getApp();
    const startTheme = setStartTheme(storedSummary.startTheme, app);

    if (app.ensureResultVisuals) {
      app.ensureResultVisuals([storedSummary.songCoverImageSrc]);
    }

    Promise.resolve(app.ensureResultFixedFont && app.ensureResultFixedFont())
      .catch((error) => {
        console.error("Failed to initialize result fixed font", error);
      })
      .finally(() => {
        if (this.pageDestroyed) {
          return;
        }

        this.setData({
          fontReady: getResultFontReady(app),
        });
      });

    Promise.resolve(app.ensurePixelFonts && app.ensurePixelFonts())
      .catch((error) => {
        console.error("Failed to initialize pixel fonts on result page", error);
      })
      .finally(() => {
        if (this.pageDestroyed) {
          return;
        }

        this.setData({
          fontReady: getResultFontReady(app),
        });
        app.reportFontAudit("result", buildResultFontAuditEntries(storedSummary));
      });

    this.summary = storedSummary;
    this.setData({
      summary: storedSummary,
      stats: buildStats(storedSummary),
      scoreDigitGlyphs: buildDigitGlyphs(storedSummary.displayScore),
      currentRabbitFrameSrc: RABBIT_FRAME_SOURCES[0],
      startTheme,
      summaryReady: true,
      fontReady: getResultFontReady(app),
      showResultScene: true,
      leavingSubtitleImageSrc: getLeavingSubtitleImageSrc(startTheme),
    });

    this.startRabbitFrameLoop();
  },

  onShow() {
    this.startRabbitFrameLoop();
  },

  onHide() {
    this.clearHomeNavigationTimer();
    this.stopRabbitFrameLoop();
  },

  onUnload() {
    this.pageDestroyed = true;
    this.clearHomeNavigationTimer();
    this.stopRabbitFrameLoop();
  },

  readLatestSummary() {
    try {
      const summary = wx.getStorageSync(LATEST_RESULT_SUMMARY_STORAGE_KEY);
      if (!summary || typeof summary !== "object") {
        return null;
      }
      return normalizeSummary(summary);
    } catch (error) {
      console.error("Failed to read result summary", error);
      return null;
    }
  },

  startRabbitFrameLoop() {
    if (this.rabbitFrameTimer) {
      return;
    }

    let rabbitFrame = this.data.currentRabbitFrame || 0;
    this.rabbitFrameTimer = setInterval(() => {
      rabbitFrame = (rabbitFrame + 1) % RABBIT_FRAME_SOURCES.length;
      this.setData({
        currentRabbitFrame: rabbitFrame,
        currentRabbitFrameSrc: RABBIT_FRAME_SOURCES[rabbitFrame],
      });
    }, 220);
  },

  stopRabbitFrameLoop() {
    if (!this.rabbitFrameTimer) {
      return;
    }

    clearInterval(this.rabbitFrameTimer);
    this.rabbitFrameTimer = null;
  },

  clearHomeNavigationTimer() {
    if (!this.homeNavigationTimer) {
      return;
    }

    clearTimeout(this.homeNavigationTimer);
    this.homeNavigationTimer = null;
  },

  handleReplayTap() {
    if (this.data.isLeavingHome) {
      return;
    }

    const songId = encodeURIComponent((this.summary && this.summary.songId) || "ditto");
    const startTheme = setStartTheme(
      (this.summary && this.summary.startTheme) || this.data.startTheme,
      getApp()
    );
    wx.redirectTo({
      url: `/pages/game/game?autostart=1&songId=${songId}&theme=${encodeURIComponent(startTheme)}`,
    });
  },

  restoreAfterHomeNavigationFailure() {
    this.clearHomeNavigationTimer();
    this.setData({
      isLeavingHome: false,
      showResultScene: true,
    }, () => {
      this.startRabbitFrameLoop();
    });
  },

  navigateToHomePage() {
    const startTheme = setStartTheme(
      (this.summary && this.summary.startTheme) || this.data.startTheme,
      getApp()
    );
    const startThemeParam = encodeURIComponent(startTheme);

    wx.redirectTo({
      url: `/pages/start/start?entry=result-return&theme=${startThemeParam}`,
      fail: () => {
        wx.reLaunch({
          url: `/pages/start/start?entry=result-return&theme=${startThemeParam}`,
          fail: () => {
            this.restoreAfterHomeNavigationFailure();
          },
        });
      },
    });
  },

  handleHomeTap() {
    if (this.data.isLeavingHome) {
      return;
    }

    const startTheme = normalizeStartTheme(this.data.startTheme);
    this.clearHomeNavigationTimer();
    this.stopRabbitFrameLoop();

    this.setData({
      isLeavingHome: true,
      showResultScene: false,
      startTheme,
      leavingSubtitleImageSrc: getLeavingSubtitleImageSrc(startTheme),
    }, () => {
      if (this.pageDestroyed) {
        return;
      }

      wx.nextTick(() => {
        if (this.pageDestroyed) {
          return;
        }

        this.homeNavigationTimer = setTimeout(() => {
          this.homeNavigationTimer = null;
          this.navigateToHomePage();
        }, HOME_TRANSITION_ROUTE_DELAY_MS);
      });
    });
  },
});
