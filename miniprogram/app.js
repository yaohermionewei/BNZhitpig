const { ACTIVE_ENGLISH_PIXEL_FONT } = require("./utils/pixel-font-config");
const { RESULT_FIXED_PIXEL_FONT } = require("./utils/pixel-font-data");
const { getStartTheme } = require("./utils/start-theme");

const PIXEL_EN_FAMILY = ACTIVE_ENGLISH_PIXEL_FONT.family;
const PIXEL_EN_LABEL = ACTIVE_ENGLISH_PIXEL_FONT.label;
const PIXEL_EN_SUMMARY_KEY = `${PIXEL_EN_FAMILY} (${PIXEL_EN_LABEL})`;
const PIXEL_EN_SOURCE =
  `url("${ACTIVE_ENGLISH_PIXEL_FONT.sourceUrl}")`;
const RESULT_FIXED_FONT_FAMILY = RESULT_FIXED_PIXEL_FONT.family;
const RESULT_FIXED_FONT_SOURCE =
  `url("${RESULT_FIXED_PIXEL_FONT.dataUrl}")`;
const RESULT_VISUAL_SOURCES = Object.freeze([
  "/assets/images/透明羊皮纸完整版.runtime.png",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-1.png",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-2.png",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-3.png",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-4.png",
  "/assets/images/song-covers/ditto.cover.pixel.png",
  "/assets/images/回到魔法世界.dark.png",
  "/assets/images/回到魔法世界....png",
]);
const PIXEL_ZH_FUSION_SOURCE =
  'url("https://fusion-pixel-font.takwolf.com/fusion-pixel-10px-monospaced-zh_hans.otf.woff2")';
const PIXEL_ZH_BACKUP_SOURCE =
  'url("https://cdn.jsdelivr.net/gh/TakWolf/fusion-pixel-font@96d13e0e4ca0bac3e8ccacc956cf6b3cfd25d8b3/assets/fonts/miseki-bitmap/MisekiBitmap.ttf")';
const PIXEL_FONT_SCOPES = ["webview", "native", "skyline"];
const FONT_LOAD_TIMEOUT_MS = 2500;
const FONT_AUDIT_STORAGE_KEY = "__pixelFontAuditReports__";
const EN_FALLBACK_LABEL = "system monospace fallback";
const ZH_FALLBACK_LABEL = "system sans fallback (PingFang SC / Helvetica Neue / sans-serif)";

const FONT_AUDIT_PRESETS = Object.freeze({
  pixelEn: Object.freeze({
    strategy: `${PIXEL_EN_LABEL} -> monospace`,
    resolve(statusMap) {
      return statusMap[PIXEL_EN_FAMILY] && statusMap[PIXEL_EN_FAMILY].ok
        ? PIXEL_EN_LABEL
        : EN_FALLBACK_LABEL;
    },
  }),
  pixelZh: Object.freeze({
    strategy: 'PixelZhFusion -> PixelZhBackup -> PingFang SC -> Helvetica Neue -> sans-serif',
    resolve(statusMap) {
      if (statusMap.PixelZhFusion && statusMap.PixelZhFusion.ok) {
        return "PixelZhFusion";
      }
      if (statusMap.PixelZhBackup && statusMap.PixelZhBackup.ok) {
        return "PixelZhBackup";
      }
      return ZH_FALLBACK_LABEL;
    },
  }),
  resultPixelEn: Object.freeze({
    strategy: `${RESULT_FIXED_FONT_FAMILY} subset -> ${PIXEL_EN_LABEL} -> monospace`,
    resolve(statusMap) {
      if (statusMap[RESULT_FIXED_FONT_FAMILY] && statusMap[RESULT_FIXED_FONT_FAMILY].ok) {
        return RESULT_FIXED_FONT_FAMILY;
      }

      return statusMap[PIXEL_EN_FAMILY] && statusMap[PIXEL_EN_FAMILY].ok
        ? PIXEL_EN_LABEL
        : EN_FALLBACK_LABEL;
    },
  }),
  resultPixelZh: Object.freeze({
    strategy: `${RESULT_FIXED_FONT_FAMILY} subset -> PixelZhFusion -> PixelZhBackup -> PingFang SC -> Helvetica Neue -> sans-serif`,
    resolve(statusMap) {
      if (statusMap[RESULT_FIXED_FONT_FAMILY] && statusMap[RESULT_FIXED_FONT_FAMILY].ok) {
        return RESULT_FIXED_FONT_FAMILY;
      }
      if (statusMap.PixelZhFusion && statusMap.PixelZhFusion.ok) {
        return "PixelZhFusion";
      }
      if (statusMap.PixelZhBackup && statusMap.PixelZhBackup.ok) {
        return "PixelZhBackup";
      }
      return ZH_FALLBACK_LABEL;
    },
  }),
  spriteDigits: Object.freeze({
    strategy: "digit sprite sheet",
    resolve() {
      return "digit sprite sheet";
    },
  }),
});

function normalizeError(error) {
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

function loadFontFace({ family, source, scopes = PIXEL_FONT_SCOPES, onStatus }) {
  return new Promise((resolve) => {
    let timeoutHandle = 0;
    let settled = false;
    let timedOut = false;
    const notifyStatus = (result, meta = {}) => {
      if (typeof onStatus !== "function") {
        return;
      }

      try {
        onStatus(
          {
            family: result.family,
            ok: !!result.ok,
            reason: result.reason || "",
          },
          meta
        );
      } catch (error) {
        console.warn("Failed to handle font status update", {
          family,
          error: normalizeError(error),
        });
      }
    };
    const finish = (result, meta = {}) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutHandle);
      notifyStatus(result, meta);
      resolve(result);
    };
    if (typeof wx === "undefined" || typeof wx.loadFontFace !== "function") {
      finish({
        family,
        ok: false,
        reason: "wx.loadFontFace unavailable",
      });
      return;
    }
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      finish({
        family,
        ok: false,
        reason: `load timeout after ${FONT_LOAD_TIMEOUT_MS}ms`,
      }, {
        softTimeout: true,
      });
    }, FONT_LOAD_TIMEOUT_MS);

    wx.loadFontFace({
      family,
      source,
      global: true,
      scopes,
      success() {
        const result = {
          family,
          ok: true,
        };

        if (settled) {
          if (timedOut) {
            notifyStatus(result, {
              late: true,
              softTimeout: true,
            });
          }
          return;
        }

        finish(result);
      },
      fail(error) {
        const result = {
          family,
          ok: false,
          reason: normalizeError(error),
        };

        if (settled) {
          if (timedOut) {
            notifyStatus(result, {
              late: true,
              softTimeout: true,
            });
          }
          return;
        }

        finish(result);
      },
    });
  });
}

function buildFontStatusMap(results = []) {
  return results.reduce((map, item) => {
    map[item.family] = {
      ok: !!item.ok,
      reason: item.reason || "",
    };
    return map;
  }, {});
}

function upsertFontResult(results = [], nextResult) {
  const list = Array.isArray(results) ? results.slice() : [];
  const normalized = {
    family: nextResult.family,
    ok: !!nextResult.ok,
    reason: nextResult.reason || "",
  };
  const index = list.findIndex((item) => item.family === normalized.family);

  if (index === -1) {
    list.push(normalized);
  } else {
    list[index] = normalized;
  }

  return list;
}

function mergeFontResults(results = [], nextResults = []) {
  return nextResults.reduce(
    (list, result) => upsertFontResult(list, result),
    Array.isArray(results) ? results : []
  );
}

function derivePixelFontFlags(results = []) {
  const pixelEnLoaded = !!results.find(
    (item) => item.family === PIXEL_EN_FAMILY && item.ok
  );
  const pixelZhPrimaryLoaded = !!results.find(
    (item) => item.family === "PixelZhFusion" && item.ok
  );
  const pixelZhBackupLoaded = !!results.find(
    (item) => item.family === "PixelZhBackup" && item.ok
  );
  const pixelZhLoaded = pixelZhPrimaryLoaded || pixelZhBackupLoaded;

  return {
    pixelEnLoaded,
    pixelZhPrimaryLoaded,
    pixelZhBackupLoaded,
    loaded: pixelEnLoaded && pixelZhLoaded,
    preferredLoaded: pixelEnLoaded && pixelZhPrimaryLoaded,
  };
}

function describeFontStatus(status) {
  if (!status) {
    return "not requested";
  }

  if (status.ok) {
    return "loaded";
  }

  return status.reason ? `failed: ${status.reason}` : "failed";
}

function buildPixelFontEnsureResult(state) {
  return {
    ok: !!state.loaded,
    preferredLoaded: !!state.preferredLoaded,
    pixelEnLoaded: !!state.pixelEnLoaded,
    pixelZhPrimaryLoaded: !!state.pixelZhPrimaryLoaded,
    pixelZhBackupLoaded: !!state.pixelZhBackupLoaded,
    results: state.results || [],
  };
}

function buildPixelFontStateFromResults(results = []) {
  const normalizedResults = Array.isArray(results) ? results : [];
  return {
    ...derivePixelFontFlags(normalizedResults),
    results: normalizedResults,
  };
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
          reason: normalizeError(error),
        });
      },
    });
  });
}

App({
  globalData: {
    pixelFontsLoaded: false,
    pixelFontsPreferredLoaded: false,
    pixelFontsSettled: false,
    resultFixedFontLoaded: false,
    pixelFontResults: [],
    fontAuditReports: {},
    startTheme: "",
  },

  onLaunch() {
    getStartTheme(undefined, this);
    this.ensureResultFixedFont();
    this.ensurePixelFonts();
    this.ensureResultVisuals();
  },

  updatePixelFontState(results = []) {
    const normalizedResults = Array.isArray(results)
      ? results.map((item) => ({
          family: item.family,
          ok: !!item.ok,
          reason: item.reason || "",
        }))
      : [];
    const flags = derivePixelFontFlags(normalizedResults);

    this.globalData.pixelFontResults = normalizedResults;
    this.globalData.pixelFontsLoaded = flags.loaded;
    this.globalData.pixelFontsPreferredLoaded = flags.preferredLoaded;

    return {
      ...flags,
      results: normalizedResults,
    };
  },

  mergePixelFontResult(result, meta = {}) {
    const nextResults = upsertFontResult(this.globalData.pixelFontResults || [], result);
    const nextState = this.updatePixelFontState(nextResults);

    if (result.family === RESULT_FIXED_FONT_FAMILY) {
      this.globalData.resultFixedFontLoaded = !!result.ok;
    }

    if (meta.late) {
      console.info("Pixel font late status", {
        family: result.family,
        ok: !!result.ok,
        reason: result.reason || "",
        pixelFontsLoaded: nextState.loaded,
        pixelFontsPreferredLoaded: nextState.preferredLoaded,
      });
      this.refreshFontAuditReports();
    }

    return nextState;
  },

  refreshFontAuditReports() {
    const currentReports = this.globalData.fontAuditReports || {};
    const nextReports = {};
    const statusMap = this.getFontAuditStatusMap();
    const summary = {
      [RESULT_FIXED_FONT_FAMILY]: describeFontStatus(statusMap[RESULT_FIXED_FONT_FAMILY]),
      [PIXEL_EN_SUMMARY_KEY]: describeFontStatus(statusMap[PIXEL_EN_FAMILY]),
      PixelZhFusion: describeFontStatus(statusMap.PixelZhFusion),
      PixelZhBackup: describeFontStatus(statusMap.PixelZhBackup),
      resultFixedFontLoaded: !!this.globalData.resultFixedFontLoaded,
      pixelFontsLoaded: !!this.globalData.pixelFontsLoaded,
      pixelFontsPreferredLoaded: !!this.globalData.pixelFontsPreferredLoaded,
    };
    let changed = false;

    Object.keys(currentReports).forEach((pageName) => {
      const report = currentReports[pageName];
      const sourceEntries = Array.isArray(report && report.sourceEntries)
        ? report.sourceEntries
        : null;

      if (!sourceEntries) {
        nextReports[pageName] = report;
        return;
      }

      changed = true;
      const rows = sourceEntries.map((entry) => {
        const resolved = this.resolveFontAuditActual(entry.preset);
        return {
          location: entry.location,
          text: entry.text || "",
          strategy: resolved.strategy,
          actual: resolved.actual,
          notes: entry.notes || "",
        };
      });

      nextReports[pageName] = {
        ...report,
        generatedAt: Date.now(),
        summary,
        rows,
      };

      console.log(`[FontAudit][${pageName}] refreshed summary`, summary);
      if (typeof console.table === "function") {
        console.table(rows);
      }
    });

    if (!changed) {
      return;
    }

    this.globalData.fontAuditReports = nextReports;

    try {
      wx.setStorageSync(FONT_AUDIT_STORAGE_KEY, nextReports);
    } catch (error) {
      console.warn("Failed to refresh font audit reports", error);
    }
  },

  ensureResultFixedFont() {
    if (this.globalData.resultFixedFontLoaded) {
      return Promise.resolve({
        family: RESULT_FIXED_FONT_FAMILY,
        ok: true,
      });
    }

    if (this.resultFixedFontPromise) {
      return this.resultFixedFontPromise;
    }

    this.resultFixedFontPromise = loadFontFace({
      family: RESULT_FIXED_FONT_FAMILY,
      source: RESULT_FIXED_FONT_SOURCE,
      scopes: PIXEL_FONT_SCOPES,
      onStatus: (result, meta) => {
        this.mergePixelFontResult(result, meta);
      },
    })
      .then((result) => {
        this.globalData.resultFixedFontLoaded = !!(result && result.ok);
        if (!this.globalData.resultFixedFontLoaded) {
          this.resultFixedFontPromise = null;
        }
        return result;
      })
      .catch((error) => {
        const result = {
          family: RESULT_FIXED_FONT_FAMILY,
          ok: false,
          reason: normalizeError(error),
        };
        this.mergePixelFontResult(result);
        this.globalData.resultFixedFontLoaded = false;
        this.resultFixedFontPromise = null;
        return result;
      });

    return this.resultFixedFontPromise;
  },

  ensureResultVisuals(extraSources = []) {
    const sources = Array.from(
      new Set([...RESULT_VISUAL_SOURCES, ...extraSources].filter(Boolean))
    );
    const cacheKey = sources.join("|");

    if (this.resultVisualsPromise && this.resultVisualsCacheKey === cacheKey) {
      return this.resultVisualsPromise;
    }

    this.resultVisualsCacheKey = cacheKey;
    this.resultVisualsPromise = Promise.all(sources.map((src) => preloadImageAsset(src)))
      .then((results) => {
        const failed = results.filter((item) => !item.ok);
        if (failed.length) {
          console.warn("Result page asset preload results", failed);
        }
        return results;
      });

    return this.resultVisualsPromise;
  },

  ensurePixelFonts() {
    const currentState = buildPixelFontStateFromResults(this.globalData.pixelFontResults || []);

    if (currentState.loaded) {
      this.globalData.pixelFontsSettled = true;
      return Promise.resolve(buildPixelFontEnsureResult(currentState));
    }

    if (this.pixelFontPromise && !this.globalData.pixelFontsSettled) {
      return this.pixelFontPromise;
    }

    this.globalData.pixelFontsSettled = false;

    const tasks = [
      loadFontFace({
        family: PIXEL_EN_FAMILY,
        source: PIXEL_EN_SOURCE,
        onStatus: (result, meta) => {
          this.mergePixelFontResult(result, meta);
        },
      }),
      loadFontFace({
        family: "PixelZhFusion",
        source: PIXEL_ZH_FUSION_SOURCE,
        onStatus: (result, meta) => {
          this.mergePixelFontResult(result, meta);
        },
      }),
      loadFontFace({
        family: "PixelZhBackup",
        source: PIXEL_ZH_BACKUP_SOURCE,
        scopes: ["native", "webview"],
        onStatus: (result, meta) => {
          this.mergePixelFontResult(result, meta);
        },
      }),
    ];

    this.pixelFontPromise = Promise.all(tasks)
      .then((results) => {
        const nextResults = mergeFontResults(this.globalData.pixelFontResults || [], results);
        const nextState = this.updatePixelFontState(nextResults);
        const failedFonts = results.filter((item) => !item.ok);
        if (failedFonts.length) {
          console.warn("Pixel font load results", failedFonts);
        }
        this.globalData.pixelFontsSettled = true;
        if (!nextState.loaded) {
          this.pixelFontPromise = null;
        }
        return buildPixelFontEnsureResult(nextState);
      })
      .catch((error) => {
        const result = {
          ok: false,
          preferredLoaded: false,
          results: [
            {
              family: PIXEL_EN_FAMILY,
              ok: false,
              reason: normalizeError(error),
            },
            {
              family: "PixelZhFusion",
              ok: false,
              reason: normalizeError(error),
            },
            {
              family: "PixelZhBackup",
              ok: false,
              reason: normalizeError(error),
            },
          ],
        };
        this.updatePixelFontState(
          mergeFontResults(this.globalData.pixelFontResults || [], result.results)
        );
        this.globalData.pixelFontsSettled = true;
        this.pixelFontPromise = null;
        return result;
      });

    return this.pixelFontPromise;
  },

  getFontAuditStatusMap() {
    return buildFontStatusMap(this.globalData.pixelFontResults || []);
  },

  snapshotPixelFontLock() {
    const statusMap = this.getFontAuditStatusMap();
    const enClass =
      statusMap[PIXEL_EN_FAMILY] && statusMap[PIXEL_EN_FAMILY].ok
        ? "font-lock-en-pixel"
        : "font-lock-en-fallback";
    let zhClass = "font-lock-zh-fallback";

    if (statusMap.PixelZhFusion && statusMap.PixelZhFusion.ok) {
      zhClass = "font-lock-zh-fusion";
    } else if (statusMap.PixelZhBackup && statusMap.PixelZhBackup.ok) {
      zhClass = "font-lock-zh-backup";
    }

    return {
      enClass,
      zhClass,
    };
  },

  resolveFontAuditActual(preset) {
    const presetConfig = FONT_AUDIT_PRESETS[preset];
    if (!presetConfig) {
      return {
        strategy: preset,
        actual: preset,
      };
    }

    const statusMap = this.getFontAuditStatusMap();
    return {
      strategy: presetConfig.strategy,
      actual: presetConfig.resolve(statusMap),
    };
  },

  reportFontAudit(pageName, entries = []) {
    const statusMap = this.getFontAuditStatusMap();
    const sourceEntries = entries.map((entry) => ({
      location: entry.location,
      text: entry.text || "",
      preset: entry.preset,
      notes: entry.notes || "",
    }));
    const rows = entries.map((entry) => {
      const resolved = this.resolveFontAuditActual(entry.preset);
      return {
        location: entry.location,
        text: entry.text || "",
        strategy: resolved.strategy,
        actual: resolved.actual,
        notes: entry.notes || "",
      };
    });

    const summary = {
      [RESULT_FIXED_FONT_FAMILY]: describeFontStatus(statusMap[RESULT_FIXED_FONT_FAMILY]),
      [PIXEL_EN_SUMMARY_KEY]: describeFontStatus(statusMap[PIXEL_EN_FAMILY]),
      PixelZhFusion: describeFontStatus(statusMap.PixelZhFusion),
      PixelZhBackup: describeFontStatus(statusMap.PixelZhBackup),
      resultFixedFontLoaded: !!this.globalData.resultFixedFontLoaded,
      pixelFontsLoaded: !!this.globalData.pixelFontsLoaded,
      pixelFontsPreferredLoaded: !!this.globalData.pixelFontsPreferredLoaded,
    };

    const report = {
      pageName,
      generatedAt: Date.now(),
      summary,
      sourceEntries,
      rows,
    };

    this.globalData.fontAuditReports = {
      ...(this.globalData.fontAuditReports || {}),
      [pageName]: report,
    };

    try {
      wx.setStorageSync(FONT_AUDIT_STORAGE_KEY, this.globalData.fontAuditReports);
    } catch (error) {
      console.warn("Failed to persist font audit report", error);
    }

    console.log(`[FontAudit][${pageName}] summary`, summary);
    if (typeof console.table === "function") {
      console.table(rows);
    } else {
      rows.forEach((row) => {
        console.log(`[FontAudit][${pageName}]`, row);
      });
    }

    return report;
  },
});
