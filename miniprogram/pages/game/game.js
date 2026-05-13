const { ACTIVE_ENGLISH_PIXEL_FONT } = require("../../utils/pixel-font-config");
const {
  getStartThemeLoadingColors,
  getStartTheme,
  normalizeStartTheme,
  setStartTheme,
} = require("../../utils/start-theme");

let AudioController = null;
let songs = [];
let createGameState = null;
let updateGameState = null;
let peekBestNote = null;
let judgeTap = null;
let judgeDirection = null;
let releaseHold = null;
let renderFrame = null;
let getControlRects = null;
let getPauseOverlayLayout = null;

const BASE_CHARACTER_ASSET_SOURCES = {
  titleRabbit: "/assets/images/title-rabbit-frames-v2/rabbit-frame-1.png",
  titlePig: "/assets/images/title-pig-frames-v2/pig-frame-1.png",
  char1Front: "/assets/images/characters/五小妹正面新/1.png",
  char1Side: "/assets/images/characters/五小妹侧面新/1.png",
  char2Front: "/assets/images/characters/五小妹正面新/2.png",
  char2Side: "/assets/images/characters/五小妹侧面新/2.png",
  char3Front: "/assets/images/characters/五小妹正面新/3.png",
  char3Side: "/assets/images/characters/五小妹侧面新/3.png",
  char4Front: "/assets/images/characters/五小妹正面新/4.png",
  char4Side: "/assets/images/characters/五小妹侧面新/4.png",
  char5Front: "/assets/images/characters/五小妹正面新/5.png",
  char5Side: "/assets/images/characters/五小妹侧面新/5.png",
  pigFront: "/assets/images/characters/pig-front-new-cropped.png",
  pigFrontLaunch: "/assets/images/characters/pig-front-launch-v2-cropped.png",
  pigGlasses: "/assets/images/characters/glass.png",
  pigLeft: "/assets/images/characters/pig-left-new-cropped.png",
  pigRight: "/assets/images/characters/pig-right-new-cropped.png",
  rabbitFront: "/assets/images/characters/rabbit-front.png",
  rabbitBack: "/assets/images/characters/rabbit-back.png",
  rabbitBackHitSheet: "/assets/images/characters/rabbit-back-hit-sheet.png",
};
const GAME_SCENE_BACKGROUND_SOURCES = Object.freeze({
  dark: "/assets/images/战斗场景dark.runtime.jpg",
  light: "/assets/images/战斗场景light.runtime.jpg",
});
const RABBIT_WAND_SWING_ASSET_SOURCES = Object.freeze({
  1: "/assets/images/characters/rabbit-back-wand-swing-1-sheet.png",
  2: "/assets/images/characters/rabbit-back-wand-swing-2-sheet.png",
});
const INTRO_DURATION = 0.82;
// Temporary front-end test entry point so we can jump straight into the tricky section.
const FRONTEND_TEST_START_AT = 0;
const LATEST_RESULT_SUMMARY_STORAGE_KEY = "latestResultSummaryV1";
const RESULT_TRANSITION_ROUTE_DELAY_MS = 48;
const FAILURE_SEQUENCE_DURATION = 0.46;
const GAME_OVER_EFFECT_SOURCE = "/assets/audio/miss.wav";
const GAME_LOADING_COLORS = Object.freeze({
  dark: getStartThemeLoadingColors("dark"),
  light: getStartThemeLoadingColors("light"),
});
const INITIAL_START_THEME = getStartTheme();
const EFFECT_AUDIO_POOL_SIZES = Object.freeze({
  "/assets/audio/hit.wav": 6,
  "/assets/audio/miss.wav": 3,
});
const RABBIT_WAND_SWING_VARIANT = 2; // 1 = video 1, 2 = video 2
const DIRECTION_GESTURE_MIN_DISTANCE = 28;
const DIRECTION_GESTURE_AXIS_RATIO = 1.15;
const COORDINATE_DEBUG_ENABLED = false;
const COORDINATE_DEBUG_PLATFORMS = new Set(["devtools"]);
const CROWD_MEMBER_COUNT = 5;
const CROWD_EVENT_DELAY_RANGE = Object.freeze([2.8, 5.2]);
const CROWD_FRONT_HOLD_RANGE = Object.freeze([0.72, 1.28]);
const CROWD_TURN_DURATION_RANGE = Object.freeze([0.1, 0.16]);
const RABBIT_WAND_SWING_FRAME_COUNT = 9;
const RABBIT_WAND_SWING_DURATION = 0.18;
const RABBIT_WAND_RETRIGGER_FRAME = 2;
const RABBIT_WAND_PEAK_FRAME = 4;
const RABBIT_WAND_MIN_PHASE_DURATION = 0.04;
const RABBIT_WAND_TAP_SEQUENCE = Object.freeze([0, 1, 2, 3, 4, 3, 2, 1, 0]);
const RABBIT_WAND_HOLD_FORWARD_SEQUENCE = Object.freeze([0, 1, 2, 3, 4]);
const RESULT_SCORE_VALUES = Object.freeze({
  perfect: 4400,
});
const RESULT_NOTE_SCORE_WEIGHTS = Object.freeze({
  tap: 1,
  direction: 1.5,
  hold: 1.5,
});
const PIXEL_FONT_EN_FAMILY = ACTIVE_ENGLISH_PIXEL_FONT.stack;
const PIXEL_FONT_ZH_FAMILY = '"PixelZhFusion", "PixelZhBackup", sans-serif';

function buildGameFontAuditEntries() {
  return [
    Object.freeze({
      location: "战斗页 HUD 标签",
      text: "SCORE",
      preset: "pixelEn",
    }),
    Object.freeze({
      location: "战斗页 HUD 标签",
      text: "COMBO",
      preset: "pixelEn",
    }),
    Object.freeze({
      location: "战斗页判定反馈",
      text: "PERFECT",
      preset: "pixelEn",
    }),
    Object.freeze({
      location: "战斗页判定反馈",
      text: "GOOD",
      preset: "pixelEn",
    }),
    Object.freeze({
      location: "战斗页判定反馈",
      text: "MISS",
      preset: "pixelEn",
    }),
    Object.freeze({
      location: "战斗页结束文案",
      text: "GAME OVER",
      preset: "pixelEn",
    }),
  ];
}

function getGameLoadingColors(theme) {
  return GAME_LOADING_COLORS[normalizeStartTheme(theme)] || GAME_LOADING_COLORS.dark;
}

function getGameSceneBackgroundSource(theme) {
  const normalizedTheme = normalizeStartTheme(theme);
  return GAME_SCENE_BACKGROUND_SOURCES[normalizedTheme] || GAME_SCENE_BACKGROUND_SOURCES.dark;
}

function getCharacterAssetSources(theme) {
  const sources = {
    ...BASE_CHARACTER_ASSET_SOURCES,
    sceneBackground: getGameSceneBackgroundSource(theme),
  };
  const wandSwingSrc = RABBIT_WAND_SWING_ASSET_SOURCES[RABBIT_WAND_SWING_VARIANT];

  if (wandSwingSrc) {
    sources[`rabbitBackWandSwing${RABBIT_WAND_SWING_VARIANT}Sheet`] = wandSwingSrc;
  }

  return sources;
}

function ensureGameModulesLoaded() {
  if (
    AudioController &&
    createGameState &&
    updateGameState &&
    peekBestNote &&
    judgeTap &&
    judgeDirection &&
    releaseHold &&
    renderFrame &&
    getControlRects &&
    getPauseOverlayLayout &&
    songs.length
  ) {
    return;
  }

  AudioController = require("../../game/core/audio");
  songs = require("../../game/data/songs");
  ({
    createGameState,
    updateGameState,
    peekBestNote,
    judgeTap,
    judgeDirection,
    releaseHold,
  } = require("../../game/core/engine"));
  ({
    renderFrame,
    getControlRects,
    getPauseOverlayLayout,
  } = require("../../game/render/renderer"));
}

function getDefaultSong() {
  return songs[0] || null;
}

function buildRunChart(chart) {
  if (!(FRONTEND_TEST_START_AT > 0)) {
    return chart;
  }

  return {
    ...chart,
    playbackStartTime: FRONTEND_TEST_START_AT,
  };
}

function primeStateForRunStart(state, startTime) {
  if (!(startTime > 0) || !state || !Array.isArray(state.notes)) {
    return;
  }

  state.currentTime = startTime;
  state.notes.forEach((note) => {
    note.skipped = false;

    if (note.time < startTime) {
      note.judged = true;
      note.hit = false;
      note.result = "skipped";
      note.holding = false;
      note.holdStartedAt = null;
      note.holdHeadQuality = null;
      note.holdTailQuality = null;
      note.holdBroken = false;
      note.tailReleasedAt = null;
      note.skipped = true;
    }
  });
}

function formatScoreDisplay(score) {
  return String(Math.max(0, Math.round(score))).padStart(5, "0");
}

function randomBetween(min, max) {
  if (max <= min) {
    return min;
  }

  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createRabbitWandAnimationState() {
  return {
    active: false,
    elapsed: 0,
    frameIndex: 0,
    frameCount: RABBIT_WAND_SWING_FRAME_COUNT,
    mode: "idle",
    duration: RABBIT_WAND_SWING_DURATION,
    sequence: RABBIT_WAND_TAP_SEQUENCE,
  };
}

function getRabbitWandSequenceStep(elapsed, duration, stepCount) {
  const safeStepCount = Math.max(1, stepCount);
  const safeDuration = Math.max(0.001, duration);
  const progress = clamp(elapsed / safeDuration, 0, 0.999999);
  return Math.min(
    safeStepCount - 1,
    Math.floor(progress * safeStepCount)
  );
}

function getRabbitWandElapsedForStep(stepIndex, stepCount, duration) {
  return (
    clamp(stepIndex, 0, Math.max(0, stepCount - 1)) /
    Math.max(1, stepCount)
  ) * duration;
}

function getRabbitWandDurationForSequence(stepCount) {
  return Math.max(
    RABBIT_WAND_MIN_PHASE_DURATION,
    (Math.max(1, stepCount) / RABBIT_WAND_TAP_SEQUENCE.length) * RABBIT_WAND_SWING_DURATION
  );
}

function buildRabbitWandHoldReturnSequence(frameIndex) {
  const startFrame = clamp(Math.round(frameIndex || 0), 0, RABBIT_WAND_PEAK_FRAME);
  const sequence = [];

  for (let currentFrame = startFrame; currentFrame >= 0; currentFrame -= 1) {
    sequence.push(currentFrame);
  }

  return sequence;
}

function shouldTriggerRabbitWandTapAnimation(result) {
  return (
    !!result &&
    (result.type === "perfect" || result.type === "good") &&
    (!result.note || result.note.kind !== "hold")
  );
}

function shouldStartRabbitWandHoldAnimation(result) {
  return !!result && result.type === "holdStart";
}

function createCrowdMember(index) {
  return {
    id: index + 1,
    facingFront: false,
    turnFromFront: false,
    turnToFront: false,
    turnStartedAt: null,
    turnDuration: CROWD_TURN_DURATION_RANGE[0],
    holdUntil: null,
  };
}

function createCrowdMotionState() {
  return {
    members: Array.from({ length: CROWD_MEMBER_COUNT }, (_, index) => createCrowdMember(index)),
    nextEventAt: randomBetween(CROWD_EVENT_DELAY_RANGE[0], CROWD_EVENT_DELAY_RANGE[1]),
  };
}

function getResultNoteScoreWeight(note) {
  if (!note) {
    return RESULT_NOTE_SCORE_WEIGHTS.tap;
  }

  if (note.kind === "hold") {
    return RESULT_NOTE_SCORE_WEIGHTS.hold;
  }

  if (note.direction === "left" || note.direction === "right") {
    return RESULT_NOTE_SCORE_WEIGHTS.direction;
  }

  return RESULT_NOTE_SCORE_WEIGHTS.tap;
}

function getChartMaxPerfectScore(notes) {
  if (!Array.isArray(notes) || !notes.length) {
    return RESULT_SCORE_VALUES.perfect;
  }

  const maxScore = notes.reduce((total, note) => {
    if (note && note.skipped) {
      return total;
    }

    return total + Math.round(RESULT_SCORE_VALUES.perfect * getResultNoteScoreWeight(note));
  }, 0);

  return Math.max(1, maxScore);
}

function getResultRank(rankRate) {
  if (rankRate >= 90) {
    return { value: "SSS", tone: "prism" };
  }

  if (rankRate >= 85) {
    return { value: "SS", tone: "mint" };
  }

  if (rankRate >= 80) {
    return { value: "S", tone: "mint" };
  }

  if (rankRate >= 60) {
    return { value: "A", tone: "sky" };
  }

  return { value: "B", tone: "sky" };
}

function getResultStatus(state) {
  if (state.failed) {
    return "FAILED";
  }

  const { hits } = state;
  if (hits.miss === 0 && hits.good === 0) {
    return "ALL PERFECT";
  }

  if (hits.miss === 0) {
    return "FULL COMBO";
  }

  return "COMPLETED";
}

function buildResultSummary(song, state) {
  const totalNotes = Array.isArray(state.notes)
    ? state.notes.filter((note) => !note.skipped).length
    : 0;
  const maxPerfectScore = getChartMaxPerfectScore(state.notes);
  const rankRate = (Math.max(0, Number(state.score) || 0) / maxPerfectScore) * 100;
  const rank = getResultRank(rankRate);

  return {
    songId: song.id,
    songTitle: song.title,
    songSubtitle: song.subtitle || "",
    songCoverImageSrc: song.coverImageSrc || "",
    statusLabel: getResultStatus(state),
    rank: rank.value,
    rankTone: rank.tone,
    failed: !!state.failed,
    scoreDisplay: formatScoreDisplay(state.score),
    accuracyDisplay: `${rankRate.toFixed(1)}%`,
    totalNotes,
    perfect: state.hits.perfect,
    good: state.hits.good,
    miss: state.hits.miss,
    maxCombo: state.bestCombo,
  };
}

function createFailureSequenceState() {
  return {
    active: false,
    elapsed: 0,
    duration: 1,
  };
}

function loadCanvasImage(canvas, src) {
  return new Promise((resolve) => {
    const image = canvas.createImage();
    let settled = false;
    const finish = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutHandle);
      resolve(result);
    };
    const timeoutHandle = setTimeout(() => {
      console.warn("Canvas image load timeout", { src });
      finish(null);
    }, 1800);

    image.onload = () => finish(image);
    image.onerror = (error) => {
      console.error("Canvas image load error", { src, error });
      finish(null);
    };
    image.src = src;
  });
}

Page({
  data: {
    showPauseOverlay: false,
    showTransitionLoading: false,
    showCanvas: false,
    selectedSongId: "",
    startTheme: INITIAL_START_THEME,
    fontInitDone: false,
    pixelFontsLoaded: false,
  },

  onLoad(options = {}) {
    const app = getApp();
    const startTheme = getStartTheme(options.theme, app);
    this.setData({
      startTheme,
    });

    this.autoStart = options.autostart === "1";
    if (!this.autoStart) {
      wx.reLaunch({
        url: `/pages/start/start?theme=${encodeURIComponent(startTheme)}`,
      });
      return;
    }

    this.fontInitPromise = Promise.resolve(app.ensurePixelFonts && app.ensurePixelFonts())
      .catch((error) => {
        console.error("Failed to initialize pixel fonts on game page", error);
      })
      .finally(() => {
        const loaded = !!(app.globalData && app.globalData.pixelFontsLoaded);
        this.setData({
          fontInitDone: true,
          pixelFontsLoaded: loaded,
        });
        app.reportFontAudit("game", buildGameFontAuditEntries());
      });

    ensureGameModulesLoaded();
    const fallbackSong = getDefaultSong();
    if (!fallbackSong) {
      throw new Error("No songs available");
    }

    this.audio = null;
    this.effectPlayers = [];
    this.audioDebugText = "";
    this.audioDebugUntil = 0;
    this.characterSprites = {};
    this.failureSequence = createFailureSequenceState();
    this.currentSong = fallbackSong;
    this.runChart = null;
    this.state = createGameState(this.currentSong.chart);
    this.viewport = null;
    this.ctx = null;
    this.canvas = null;
    this.frameHandle = null;
    this.lastTimestamp = 0;
    this.started = false;
    this.isPaused = false;
    this.introActive = false;
    this.introElapsed = 0;
    this.runSessionId = 0;
    this.resultNavigationPending = false;
    this.hudSnapshot = "";
    this.crowdMotion = createCrowdMotionState();
    this.rabbitWandAnimation = createRabbitWandAnimationState();
    this.coordinateDebugEnabled = false;
    this.resetInputGesture();
    this.initializeCoordinateDebug();
    const initialSongId =
      songs.find((song) => song.id === options.songId)?.id || fallbackSong.id;
    const selectedSong = this.refreshSongSelection(initialSongId);
    this.currentSong = selectedSong;
    this.state = createGameState(selectedSong.chart);
    this.createEffectPlayers();
  },

  onReady() {
    this.loopMounted = false;
    this.debugRenderReported = false;
    if (this.autoStart) {
      this.beginRun();
    }
  },

  onUnload() {
    this.runSessionId += 1;
    this.resultNavigationPending = false;
    this.introActive = false;
    this.introElapsed = 0;
    this.stopLoop();
    this.teardownAudio();
    this.resetCrowdMotion();
    this.resetRabbitWandAnimation();
    this.resetInputGesture();
    this.failureSequence = createFailureSequenceState();
  },

  onHide() {
    this.runSessionId += 1;
    this.resultNavigationPending = false;
    this.started = false;
    this.isPaused = false;
    this.introActive = false;
    this.introElapsed = 0;
    this.stopLoop();
    this.teardownAudio();
    this.resetCrowdMotion();
    this.resetRabbitWandAnimation();
    this.resetInputGesture();
    this.failureSequence = createFailureSequenceState();
    this.setData({
      showPauseOverlay: false,
    });
  },

  resetCrowdMotion() {
    this.crowdMotion = createCrowdMotionState();
  },

  resetFailureSequence() {
    this.failureSequence = createFailureSequenceState();
  },

  startFailureSequence() {
    if (!this.failureSequence) {
      this.resetFailureSequence();
    }

    if (this.failureSequence.active) {
      return;
    }

    this.failureSequence.active = true;
    this.failureSequence.elapsed = 0;
    this.failureSequence.duration = FAILURE_SEQUENCE_DURATION;
    this.resetInputGesture();
    if (this.audio) {
      this.audio.pause();
    }
    this.teardownAudio();
    this.playGameOverEffect();
  },

  updateFailureSequence(dt) {
    if (!this.failureSequence || !this.failureSequence.active) {
      return false;
    }

    this.failureSequence.elapsed = Math.min(
      this.failureSequence.duration,
      this.failureSequence.elapsed + dt
    );
    return this.failureSequence.elapsed >= this.failureSequence.duration;
  },

  resetRabbitWandAnimation() {
    this.rabbitWandAnimation = createRabbitWandAnimationState();
  },

  startRabbitWandAnimation(mode, sequence, duration) {
    if (!this.rabbitWandAnimation) {
      this.resetRabbitWandAnimation();
    }

    const animation = this.rabbitWandAnimation;
    animation.active = true;
    animation.mode = mode;
    animation.sequence = Array.isArray(sequence) && sequence.length ? sequence.slice() : [0];
    animation.duration = Math.max(0.001, duration || RABBIT_WAND_SWING_DURATION);
    animation.elapsed = 0;
    animation.frameIndex = animation.sequence[0];
  },

  updateRabbitWandAnimation(dt) {
    if (!this.rabbitWandAnimation) {
      this.resetRabbitWandAnimation();
    }

    const animation = this.rabbitWandAnimation;
    if (!animation.active || animation.mode === "idle") {
      animation.active = false;
      animation.mode = "idle";
      animation.elapsed = 0;
      animation.frameIndex = 0;
      return;
    }

    if (animation.mode === "holdPeak") {
      animation.frameIndex = RABBIT_WAND_PEAK_FRAME;
      return;
    }

    animation.elapsed += dt;
    const currentStep = getRabbitWandSequenceStep(
      animation.elapsed,
      animation.duration,
      animation.sequence.length
    );
    animation.frameIndex = animation.sequence[currentStep];

    if (animation.elapsed >= animation.duration) {
      if (animation.mode === "holdForward") {
        animation.mode = "holdPeak";
        animation.elapsed = 0;
        animation.frameIndex = RABBIT_WAND_PEAK_FRAME;
        return;
      }

      this.resetRabbitWandAnimation();
      return;
    }
  },

  triggerRabbitWandTapAnimation(result) {
    if (!shouldTriggerRabbitWandTapAnimation(result)) {
      return;
    }

    if (!this.rabbitWandAnimation) {
      this.resetRabbitWandAnimation();
    }

    const animation = this.rabbitWandAnimation;
    if (!animation.active || animation.mode !== "tap") {
      this.startRabbitWandAnimation("tap", RABBIT_WAND_TAP_SEQUENCE, RABBIT_WAND_SWING_DURATION);
      return;
    }

    const retriggerElapsed = getRabbitWandElapsedForStep(
      RABBIT_WAND_RETRIGGER_FRAME,
      animation.sequence.length,
      animation.duration
    );
    const currentStep = getRabbitWandSequenceStep(
      animation.elapsed,
      animation.duration,
      animation.sequence.length
    );

    if (currentStep >= RABBIT_WAND_PEAK_FRAME) {
      animation.elapsed = retriggerElapsed;
    } else {
      animation.elapsed = Math.max(animation.elapsed, retriggerElapsed);
    }

    const nextStep = getRabbitWandSequenceStep(
      animation.elapsed,
      animation.duration,
      animation.sequence.length
    );
    animation.frameIndex = animation.sequence[nextStep];
  },

  startRabbitWandHoldAnimation(result) {
    if (!shouldStartRabbitWandHoldAnimation(result)) {
      return;
    }

    this.startRabbitWandAnimation(
      "holdForward",
      RABBIT_WAND_HOLD_FORWARD_SEQUENCE,
      getRabbitWandDurationForSequence(RABBIT_WAND_HOLD_FORWARD_SEQUENCE.length)
    );
  },

  releaseRabbitWandHoldAnimation() {
    if (!this.rabbitWandAnimation) {
      return;
    }

    const animation = this.rabbitWandAnimation;
    if (animation.mode !== "holdForward" && animation.mode !== "holdPeak") {
      return;
    }

    const returnSequence = buildRabbitWandHoldReturnSequence(animation.frameIndex);
    if (returnSequence.length <= 1) {
      this.resetRabbitWandAnimation();
      return;
    }

    this.startRabbitWandAnimation(
      "holdReturn",
      returnSequence,
      getRabbitWandDurationForSequence(returnSequence.length)
    );
  },

  handleRabbitWandAnimationResult(result) {
    if (shouldStartRabbitWandHoldAnimation(result)) {
      this.startRabbitWandHoldAnimation(result);
      return;
    }

    this.triggerRabbitWandTapAnimation(result);
  },

  startCrowdTurn(member, toFront, sceneTime) {
    if (!member || member.turnStartedAt !== null) {
      return;
    }

    member.turnFromFront = !!member.facingFront;
    member.turnToFront = !!toFront;
    member.turnStartedAt = sceneTime;
    member.turnDuration = randomBetween(
      CROWD_TURN_DURATION_RANGE[0],
      CROWD_TURN_DURATION_RANGE[1]
    );
    member.holdUntil = toFront
      ? sceneTime + member.turnDuration + randomBetween(CROWD_FRONT_HOLD_RANGE[0], CROWD_FRONT_HOLD_RANGE[1])
      : null;
  },

  updateCrowdMotion(sceneTime) {
    if (!this.crowdMotion || !Array.isArray(this.crowdMotion.members)) {
      this.resetCrowdMotion();
    }

    const motion = this.crowdMotion;
    const members = motion.members;

    members.forEach((member) => {
      if (member.turnStartedAt !== null) {
        const progress = (sceneTime - member.turnStartedAt) / Math.max(0.001, member.turnDuration);
        if (progress >= 1) {
          member.facingFront = !!member.turnToFront;
          member.turnStartedAt = null;
        }
      }

      if (
        member.turnStartedAt === null &&
        member.facingFront &&
        member.holdUntil !== null &&
        sceneTime >= member.holdUntil
      ) {
        this.startCrowdTurn(member, false, sceneTime);
      }
    });

    const crowdBusy = members.some(
      (member) => member.facingFront || member.turnStartedAt !== null
    );
    if (!crowdBusy && sceneTime >= motion.nextEventAt) {
      const nextMember = members[Math.floor(Math.random() * members.length)];
      this.startCrowdTurn(nextMember, true, sceneTime);
      motion.nextEventAt =
        sceneTime + randomBetween(CROWD_EVENT_DELAY_RANGE[0], CROWD_EVENT_DELAY_RANGE[1]);
    }
  },

  resetInputGesture() {
    this.inputGesture = {
      active: false,
      resolved: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      targetNoteId: null,
      targetDirection: null,
    };
  },

  getTouchPoint(touch) {
    if (!touch) {
      return null;
    }

    const x = Number.isFinite(touch.x)
      ? touch.x
      : Number.isFinite(touch.clientX)
        ? touch.clientX
        : Number(touch.pageX) || 0;
    const y = Number.isFinite(touch.y)
      ? touch.y
      : Number.isFinite(touch.clientY)
        ? touch.clientY
        : Number(touch.pageY) || 0;

    return {
      id: touch.identifier === undefined ? 0 : touch.identifier,
      x,
      y,
    };
  },

  initializeCoordinateDebug() {
    if (!COORDINATE_DEBUG_ENABLED) {
      this.coordinateDebugEnabled = false;
      return;
    }

    try {
      const systemInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {};
      const platform =
        (systemInfo && typeof systemInfo.platform === "string" && systemInfo.platform) || "";
      this.coordinateDebugEnabled = COORDINATE_DEBUG_PLATFORMS.has(platform);
    } catch (error) {
      console.error("Coordinate debug init error", error);
      this.coordinateDebugEnabled = false;
    }
  },

  getEventCanvasPoint(event) {
    if (!event) {
      return null;
    }

    const touchPoint = this.getTouchPoint(
      (event.touches && event.touches[0]) ||
        (event.changedTouches && event.changedTouches[0]) ||
        null
    );
    if (touchPoint) {
      return {
        x: touchPoint.x,
        y: touchPoint.y,
      };
    }

    const detail = event.detail || {};
    const candidates = [event, detail];
    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      if (!candidate) {
        continue;
      }

      if (typeof candidate.x === "number" && typeof candidate.y === "number") {
        return {
          x: candidate.x,
          y: candidate.y,
        };
      }

      if (typeof candidate.clientX === "number" && typeof candidate.clientY === "number") {
        return {
          x: candidate.clientX,
          y: candidate.clientY,
        };
      }
    }

    return null;
  },

  reportDebugCoordinate(event) {
    if (!this.coordinateDebugEnabled || !this.viewport) {
      return;
    }

    const point = this.getEventCanvasPoint(event);
    if (!point) {
      return;
    }

    const x = Math.round(Math.max(0, Math.min(this.viewport.width, point.x)));
    const y = Math.round(Math.max(0, Math.min(this.viewport.height, point.y)));
    const viewportWidth = Math.round(this.viewport.width);
    const viewportHeight = Math.round(this.viewport.height);
    const xRatio = x / Math.max(1, this.viewport.width);
    const yRatio = y / Math.max(1, this.viewport.height);
    const coordinateText = `(${x}, ${y}) ${viewportWidth}x${viewportHeight}`;

    console.info(
      `[canvas-coordinate] (${x}, ${y}) viewport=${viewportWidth}x${viewportHeight} xRatio=${xRatio.toFixed(6)} yRatio=${yRatio.toFixed(6)}`
    );
    wx.showToast({
      title: coordinateText,
      icon: "none",
      duration: 1200,
    });
  },

  findTrackedTouch(event) {
    if (!event) {
      return null;
    }

    const pointerId = this.inputGesture && this.inputGesture.pointerId;
    const groups = [event.touches, event.changedTouches];

    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
      const group = groups[groupIndex];
      if (!group || !group.length) {
        continue;
      }

      for (let index = 0; index < group.length; index += 1) {
        const touch = group[index];
        if (pointerId === null || pointerId === undefined || touch.identifier === pointerId) {
          return touch;
        }
      }
    }

    return null;
  },

  beginDirectionGesture(touch, note) {
    const point = this.getTouchPoint(touch);
    if (!point) {
      return;
    }

    this.inputGesture = {
      active: true,
      resolved: false,
      pointerId: point.id,
      startX: point.x,
      startY: point.y,
      lastX: point.x,
      lastY: point.y,
      targetNoteId: note ? note.id : null,
      targetDirection: note ? note.direction || null : null,
    };
  },

  resolveDirectionGesture(event, finalize = false) {
    if (!this.inputGesture || !this.inputGesture.active || this.inputGesture.resolved) {
      return null;
    }

    const trackedTouch = this.findTrackedTouch(event);
    const point = this.getTouchPoint(trackedTouch);
    if (!point) {
      if (finalize) {
        this.resetInputGesture();
      }
      return null;
    }

    this.inputGesture.lastX = point.x;
    this.inputGesture.lastY = point.y;

    const deltaX = point.x - this.inputGesture.startX;
    const deltaY = point.y - this.inputGesture.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX < DIRECTION_GESTURE_MIN_DISTANCE || absX < absY * DIRECTION_GESTURE_AXIS_RATIO) {
      if (finalize) {
        this.resetInputGesture();
      }
      return null;
    }

    const direction = deltaX < 0 ? "left" : "right";
    const result = judgeDirection(this.state, this.audio.getCurrentChartTime(), direction);
    this.flushAudioCues();
    this.inputGesture.resolved = true;
    this.inputGesture.active = false;
    this.inputGesture.lastX = point.x;
    this.inputGesture.lastY = point.y;
    return result;
  },

  createAudioController() {
    if (this.audio) {
      this.audio.destroy();
    }

    this.audio = new AudioController();
    this.audio.onEnded(() => {
      if (!this.state.ended && !this.isPaused) {
        this.finishRun();
      }
    });

    this.audio.onError((error) => {
      console.error("Audio error", error);
      wx.showToast({
        title: "音频加载失败",
        icon: "none",
      });
    });
  },

  ensureAudioController() {
    if (!this.audio) {
      this.createAudioController();
    }
  },

  teardownAudio() {
    if (this.audio) {
      this.audio.destroy();
      this.audio = null;
    }
    this.destroyEffectPlayers();
  },

  destroyEffectPlayers() {
    if (!this.effectPlayers || !this.effectPlayers.length) {
      this.effectPlayers = [];
      this.effectPools = Object.create(null);
      return;
    }

    this.effectPlayers.forEach((player) => {
      try {
        player.stop();
        player.destroy();
      } catch (error) {
        console.error("Destroy effect player error", error);
      }
    });
    this.effectPlayers = [];
    this.effectPools = Object.create(null);
  },

  createEffectPlayers() {
    this.destroyEffectPlayers();
    this.effectPools = Object.create(null);
    Object.keys(EFFECT_AUDIO_POOL_SIZES).forEach((src) => {
      this.ensureEffectPool(src);
    });
    this.audioDebugText = "";
    this.audioDebugUntil = 0;
  },

  ensureEffectPool(src) {
    if (!src) {
      return [];
    }

    if (!this.effectPools) {
      this.effectPools = Object.create(null);
    }

    if (this.effectPools[src] && this.effectPools[src].length) {
      return this.effectPools[src];
    }

    const poolSize = EFFECT_AUDIO_POOL_SIZES[src] || 1;
    const pool = [];

    for (let index = 0; index < poolSize; index += 1) {
      const player = wx.createInnerAudioContext();
      const slot = {
        busy: false,
        player,
        src,
        startedAt: 0,
      };

      player.obeyMuteSwitch = false;
      player.loop = false;
      player.src = src;
      player.volume = 1;
      player.playbackRate = 1;

      player.onEnded(() => {
        slot.busy = false;
      });

      player.onError((error) => {
        console.error("Effect player pool error", { src, error });
        slot.busy = false;
      });

      this.effectPlayers.push(player);
      pool.push(slot);
    }

    this.effectPools[src] = pool;
    return pool;
  },

  acquireEffectPlayer(src) {
    const pool = this.ensureEffectPool(src);
    if (!pool.length) {
      return null;
    }

    const idleSlot = pool.find((slot) => !slot.busy);
    if (idleSlot) {
      return idleSlot;
    }

    return pool.reduce((oldestSlot, slot) =>
      slot.startedAt < oldestSlot.startedAt ? slot : oldestSlot
    );
  },

  playEffectSource(src, debugText, options = {}) {
    const slot = this.acquireEffectPlayer(src);
    if (!slot || !slot.player) {
      return;
    }

    const player = slot.player;
    const playbackRate =
      typeof options.playbackRate === "number" && options.playbackRate > 0
        ? options.playbackRate
        : 1;
    const volume = typeof options.volume === "number" ? options.volume : 1;

    try {
      player.stop();
    } catch (error) {
      // Ignore stop errors when the pooled player is idle.
    }

    if (typeof player.seek === "function") {
      try {
        player.seek(0);
      } catch (error) {
        console.error("Effect player seek error", { src, error });
      }
    }

    player.volume = volume;
    player.playbackRate = playbackRate;
    slot.busy = true;
    slot.startedAt = Date.now();

    this.audioDebugText = debugText;
    this.audioDebugUntil = Date.now() + 1500;

    try {
      player.play();
    } catch (error) {
      console.error("Effect player play error", { src, error });
      slot.busy = false;
    }
  },

  playGameOverEffect() {
    this.playEffectSource(GAME_OVER_EFFECT_SOURCE, "SFX game over -> miss.wav", {
      playbackRate: 0.76,
      volume: 1,
    });
  },

  getAudioDebugText() {
    if (Date.now() > this.audioDebugUntil) {
      return "";
    }

    return this.audioDebugText;
  },

  flushAudioCues() {
    if (!this.state || !this.state.audioCues || !this.state.audioCues.length) {
      return;
    }

    const cues = this.state.audioCues.slice();
    this.state.audioCues.length = 0;

    cues.forEach((cue) => {
      if (cue === "hit") {
        this.playEffectSource("/assets/audio/hit.wav", "SFX hit -> hit.wav");
      }

      if (cue === "miss") {
        this.playEffectSource("/assets/audio/miss.wav", "SFX miss -> miss.wav");
      }
    });
  },

  refreshSongSelection(selectedSongId = this.data.selectedSongId || "") {
    const fallbackSong = getDefaultSong();
    if (!fallbackSong) {
      return null;
    }

    const selectedSong =
      songs.find((song) => song.id === selectedSongId) || fallbackSong;

    this.setData({
      selectedSongId: selectedSong.id,
    });

    return selectedSong;
  },

  beginRun() {
    const selectedSong = this.getSelectedSong();
    const runChart = buildRunChart(selectedSong.chart);
    const runSessionId = this.runSessionId + 1;
    this.runSessionId = runSessionId;
    this.teardownAudio();
    this.ensureAudioController();
    this.createEffectPlayers();
    this.currentSong = selectedSong;
    this.runChart = runChart;
    this.state = createGameState(runChart);
    primeStateForRunStart(this.state, FRONTEND_TEST_START_AT);
    this.resetCrowdMotion();
    this.resetRabbitWandAnimation();
    this.resetFailureSequence();
    this.started = true;
    this.isPaused = false;
    this.introActive = true;
    this.introElapsed = 0;
    this.lastTimestamp = 0;
    this.resetInputGesture();
    this.stopLoop();
    this.setData(
      {
        showPauseOverlay: false,
        showTransitionLoading: false,
        showCanvas: true,
      },
      () => {
        if (this.ctx && this.viewport) {
          this.renderCurrentFrame();
        }
      }
    );
    wx.nextTick(() => {
      this.ensureCanvasReady().then(() => {
        if (
          this.runSessionId !== runSessionId ||
          !this.started
        ) {
          return;
        }
        this.renderCurrentFrame();
        this.startLoop();
      });
    });
  },

  getSelectedSong() {
    const fallbackSong = getDefaultSong();
    return songs.find((song) => song.id === this.data.selectedSongId) || fallbackSong;
  },

  ensureCanvasReady() {
    if (this.canvas && this.ctx && this.viewport) {
      return Promise.resolve();
    }

    return this.setupCanvas();
  },

  setupCanvas(attempt = 0) {
    return new Promise((resolve) => {
      const query = wx.createSelectorQuery().in(this);
      query
        .select("#gameCanvas")
        .fields({ node: true, size: true })
        .exec((result) => {
          const info = result[0];
          if (!info || !info.node) {
            if (attempt < 6) {
              setTimeout(() => {
                this.setupCanvas(attempt + 1).then(resolve);
              }, 40);
              return;
            }

            console.error("Canvas node not ready", { attempt });
            wx.showToast({
              title: "首页画布初始化失败",
              icon: "none",
            });
            resolve();
            return;
          }

          const canvas = info.node;
          const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
          const dpr = systemInfo.pixelRatio;
          const width = info.width || systemInfo.windowWidth;
          const height = info.height || systemInfo.windowHeight;

          canvas.width = width * dpr;
          canvas.height = height * dpr;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            if (attempt < 6) {
              setTimeout(() => {
                this.setupCanvas(attempt + 1).then(resolve);
              }, 40);
              return;
            }

            console.error("Canvas context not ready", { attempt });
            wx.showToast({
              title: "Canvas 初始化失败",
              icon: "none",
            });
            resolve();
            return;
          }
          ctx.scale(dpr, dpr);

          this.canvas = canvas;
          this.ctx = ctx;
          this.viewport = {
            width,
            height,
            dpr,
          };
          this.drawCanvasWarmupFrame();
          // Keep the warmup frame visible until the scene sprites finish loading.
          // Otherwise the first render can fall back to the legacy procedural backdrop
          // for a split second on cold loads.
          this.loadCanvasAssets(canvas).then(() => {
            if (this.ctx && this.viewport && this.state) {
              this.renderCurrentFrame();
            }
            resolve();
          });
        });
    });
  },

  loadCanvasAssets(canvas) {
    return new Promise((resolve) => {
      if (!canvas || !canvas.createImage) {
        this.characterSprites = {};
        resolve();
        return;
      }

      const loadEntries = Object.entries(
        getCharacterAssetSources(this.data.startTheme)
      ).map(([key, src]) =>
        loadCanvasImage(canvas, src).then((image) => [key, image])
      );

      Promise.all(loadEntries).then((entries) => {
        this.characterSprites = entries.reduce((sprites, [key, image]) => {
          sprites[key] = image;
          return sprites;
        }, {});
        resolve();
      });
    });
  },

  startLoop() {
    if (this.frameHandle) {
      return;
    }

    const tick = (timestamp) => {
      this.frameHandle = null;

      if (!this.ctx || !this.viewport) {
        this.ensureCanvasReady().finally(() => {
          if (!this.isPaused) {
            this.scheduleNextFrame(tick);
          }
        });
        return;
      }

      if (!this.lastTimestamp) {
        this.lastTimestamp = timestamp || Date.now();
      }

      const now = timestamp || Date.now();
      const dt = Math.min(0.05, (now - this.lastTimestamp) / 1000);
      this.lastTimestamp = now;

      if (this.started && !this.isPaused) {
        if (this.introActive) {
          this.introElapsed = Math.min(INTRO_DURATION, this.introElapsed + dt);

          if (this.introElapsed >= INTRO_DURATION) {
            this.introActive = false;
            if (this.audio) {
              this.audio.start(this.runChart || this.currentSong.chart);
            }
          }
        } else if (this.failureSequence.active) {
          // Freeze gameplay for the Game Over transition.
        } else {
          if (!this.audio) {
            this.startFailureSequence();
          } else {
            const currentTime = this.audio.getCurrentChartTime();
            updateGameState(this.state, currentTime, dt);
            this.updateCrowdMotion(currentTime);
            this.updateRabbitWandAnimation(dt);
            this.flushAudioCues();
            if (this.state.failed && !this.failureSequence.active) {
              this.startFailureSequence();
            }
          }
        }
      }

      const failureSequenceFinished = this.updateFailureSequence(dt);

      this.renderCurrentFrame();
      if (
        this.started &&
        !this.isPaused &&
        !this.introActive &&
        this.state.ended
      ) {
        if (this.state.failed) {
          if (!this.failureSequence.active) {
            this.startFailureSequence();
          } else if (failureSequenceFinished) {
            this.finishRun();
          }
        } else {
          this.finishRun();
        }
      }

      if (this.isPaused) {
        return;
      }

      this.scheduleNextFrame(tick);
    };

    this.scheduleNextFrame(tick);
  },

  drawCanvasWarmupFrame() {
    if (!this.ctx || !this.viewport) {
      return;
    }

    const { ctx, viewport } = this;
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    const spinnerRadius = Math.max(16, Math.min(viewport.width, viewport.height) * 0.05);
    const spinnerLineWidth = Math.max(5, spinnerRadius * 0.3);
    const rotation = (Date.now() / 800) * Math.PI * 2;
    const loadingColors = getGameLoadingColors(this.data.startTheme);

    ctx.clearRect(0, 0, viewport.width, viewport.height);
    ctx.fillStyle = loadingColors.background;
    ctx.fillRect(0, 0, viewport.width, viewport.height);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = spinnerLineWidth;
    ctx.strokeStyle = loadingColors.spinnerTrack;
    ctx.beginPath();
    ctx.arc(centerX, centerY, spinnerRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = loadingColors.spinner;
    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      spinnerRadius,
      rotation - Math.PI * 0.52,
      rotation + Math.PI * 0.18
    );
    ctx.stroke();

    ctx.restore();
  },

  renderCurrentFrame() {
    if (!this.ctx || !this.viewport || !this.state) {
      return;
    }

    const introProgress = this.introActive ? this.introElapsed / INTRO_DURATION : 1;
    const sceneTime = this.started
      ? this.introActive
        ? this.introElapsed
        : this.state.currentTime
      : 0;

    try {
      renderFrame(this.ctx, this.viewport, this.state, {
        paused: this.isPaused,
        useDomPauseOverlay: false,
        gameOverOverlayActive: !!this.failureSequence?.active,
        gameOverOverlayProgress: this.failureSequence
          ? this.failureSequence.elapsed / Math.max(0.001, this.failureSequence.duration)
          : 0,
        selectedSongId: this.data.selectedSongId,
        characterSprites: this.characterSprites || {},
        crowdMotion: this.crowdMotion,
        audioDebugText: this.getAudioDebugText(),
        introProgress,
        sceneTime,
        showLaneBase: false,
        gameplayActive: this.started && !this.introActive,
        rabbitWandAnimation: this.rabbitWandAnimation,
        rabbitWandSwingVariant: RABBIT_WAND_SWING_VARIANT,
        startTheme: this.data.startTheme,
        loadingColors: getGameLoadingColors(this.data.startTheme),
      });
    } catch (error) {
      console.error("renderCurrentFrame failed", error);
      this.drawCanvasWarmupFrame();
    }
  },

  scheduleNextFrame(callback) {
    if (this.canvas && this.canvas.requestAnimationFrame) {
      this.frameHandle = this.canvas.requestAnimationFrame(callback);
      return;
    }

    this.frameHandle = setTimeout(() => callback(Date.now()), 16);
  },

  stopLoop() {
    if (!this.frameHandle) {
      return;
    }

    if (this.canvas && this.canvas.cancelAnimationFrame && typeof this.frameHandle === "number") {
      this.canvas.cancelAnimationFrame(this.frameHandle);
    } else {
      clearTimeout(this.frameHandle);
    }

    this.frameHandle = null;
  },

  resetRun() {
    this.runSessionId += 1;
    this.resultNavigationPending = false;
    const selectedSong = this.refreshSongSelection(this.data.selectedSongId);
    this.currentSong = selectedSong;
    this.runChart = null;
    this.teardownAudio();
    this.state = createGameState(selectedSong.chart);
    this.resetCrowdMotion();
    this.resetRabbitWandAnimation();
    this.resetFailureSequence();
    this.started = false;
    this.isPaused = false;
    this.introActive = false;
    this.introElapsed = 0;
    this.resetInputGesture();
    this.stopLoop();
    this.setData({
      showPauseOverlay: false,
      showTransitionLoading: false,
      showCanvas: false,
    });
  },

  finishRun() {
    if (!this.state || this.resultNavigationPending) {
      return;
    }

    const startTheme = normalizeStartTheme(this.data.startTheme);
    this.runSessionId += 1;
    this.resultNavigationPending = true;
    this.state.ended = true;
    this.started = false;
    this.isPaused = true;
    this.introActive = false;
    this.introElapsed = 0;
    this.resetInputGesture();
    this.runChart = null;
    const resultSummary = {
      ...buildResultSummary(this.currentSong, this.state),
      startTheme,
    };
    this.teardownAudio();
    this.resetCrowdMotion();
    this.resetRabbitWandAnimation();
    this.resetFailureSequence();
    this.stopLoop();

    try {
      wx.setStorageSync(LATEST_RESULT_SUMMARY_STORAGE_KEY, {
        ...resultSummary,
        completedAt: Date.now(),
      });
    } catch (error) {
      console.error("Failed to persist result summary", error);
    }

    const app = getApp();
    if (app.ensureResultVisuals) {
      app.ensureResultVisuals([resultSummary.songCoverImageSrc]);
    }

    const goToResultPage = () => {
      wx.redirectTo({
        url: "/pages/result/result",
        fail: (error) => {
          console.error("redirectTo result page failed", error);
          wx.reLaunch({
            url: "/pages/result/result",
          });
        },
      });
    };

    this.setData(
      {
        showPauseOverlay: false,
        showTransitionLoading: true,
        showCanvas: false,
        startTheme,
      },
      () => {
        wx.nextTick(() => {
          setTimeout(goToResultPage, RESULT_TRANSITION_ROUTE_DELAY_MS);
        });
      }
    );
  },

  selectSongById(songId) {
    const selectedSong = songs.find((song) => song.id === songId);
    if (!selectedSong || selectedSong.id === this.data.selectedSongId) {
      return false;
    }

    this.currentSong = selectedSong;
    this.teardownAudio();
    this.state = createGameState(selectedSong.chart);
    this.resetCrowdMotion();
    this.resetRabbitWandAnimation();
    this.refreshSongSelection(selectedSong.id);
    this.renderCurrentFrame();
    return true;
  },

  handleSongSelect(event) {
    const { songId } = event.currentTarget.dataset;
    this.selectSongById(songId);
  },

  handleStartTap() {
    this.beginRun();
  },

  handleRestartTap() {
    this.beginRun();
  },

  handleBackToSongSelect() {
    const startTheme = setStartTheme(this.data.startTheme, getApp());
    this.teardownAudio();
    this.stopLoop();
    this.setData(
      {
        showPauseOverlay: false,
        showTransitionLoading: true,
        showCanvas: false,
        startTheme,
      },
      () => {
        wx.nextTick(() => {
          setTimeout(() => {
            wx.redirectTo({
              url: `/pages/start/start?entry=result-return&theme=${encodeURIComponent(startTheme)}`,
              fail: () => {
                wx.reLaunch({
                  url: `/pages/start/start?entry=result-return&theme=${encodeURIComponent(startTheme)}`,
                });
              },
            });
          }, 16);
        });
      }
    );
  },

  handleQuickRestartTap() {
    this.beginRun();
  },

  handlePauseTap() {
    if (!this.started) {
      return;
    }

    if (this.isPaused) {
      this.handleResumeTap();
      return;
    }

    this.isPaused = true;
    this.lastTimestamp = 0;
    this.resetInputGesture();
    if (this.audio) {
      this.audio.pause();
    }
    this.stopLoop();
    this.renderCurrentFrame();
    this.setData(
      {
        showPauseOverlay: true,
      }
    );
  },

  handleResumeTap() {
    if (!this.isPaused) {
      return;
    }

    this.isPaused = false;
    this.lastTimestamp = 0;
    this.resetInputGesture();
    this.setData(
      {
        showPauseOverlay: false,
      },
      () => {
        this.renderCurrentFrame();
        if (this.audio) {
          this.audio.resume();
        }
        this.startLoop();
      }
    );
  },

  finishRunIfNeeded() {
    if (this.started && this.state && this.state.ended) {
      if (this.state.failed) {
        if (!this.failureSequence.active) {
          this.startFailureSequence();
        }
        return false;
      }

      this.finishRun();
      return true;
    }

    return false;
  },

  pointHitsRect(point, rect) {
    if (!point || !rect) {
      return false;
    }

    return (
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom
    );
  },

  handleActiveOverlayTap(point) {
    if (!this.viewport || !point) {
      return false;
    }

    if (this.data.showPauseOverlay) {
      const rects = getControlRects(this.viewport);
      if (this.pointHitsRect(point, rects.pauseRestart)) {
        this.handleQuickRestartTap();
        return true;
      }
      if (this.pointHitsRect(point, rects.resume)) {
        this.handleResumeTap();
        return true;
      }
      if (this.pointHitsRect(point, rects.pauseHome)) {
        this.handleBackToSongSelect();
        return true;
      }
      return true;
    }

    return false;
  },

  handleCanvasTouchStart(event) {
    this.reportDebugCoordinate(event);

    if (this.failureSequence && this.failureSequence.active) {
      return;
    }

    const overlayPoint = this.getEventCanvasPoint(event);
    if (this.handleActiveOverlayTap(overlayPoint)) {
      return;
    }

    if (!this.started || this.data.showPauseOverlay) {
      return;
    }

    const touch = event.touches && event.touches[0];
    if (!touch || !this.viewport) {
      return;
    }

    const rects = getControlRects(this.viewport);

    if (this.isPaused) {
      return;
    }

    if (
      touch.x >= rects.pause.left &&
      touch.x <= rects.pause.right &&
      touch.y >= rects.pause.top &&
      touch.y <= rects.pause.bottom
    ) {
      this.handlePauseTap();
      return;
    }

    if (this.introActive) {
      return;
    }

    const currentTime = this.audio.getCurrentChartTime();
    const preview = peekBestNote(this.state, currentTime);
    if (preview.note && preview.note.direction) {
      this.beginDirectionGesture(touch, preview.note);
      return;
    }

    const result = judgeTap(this.state, currentTime);
    this.handleRabbitWandAnimationResult(result);
    this.flushAudioCues();
    this.finishRunIfNeeded();
  },

  handleCanvasTouchMove(event) {
    if (
      !this.started ||
      this.isPaused ||
      (this.failureSequence && this.failureSequence.active) ||
      this.introActive ||
      this.data.showPauseOverlay
    ) {
      return;
    }

    const result = this.resolveDirectionGesture(event, false);
    this.handleRabbitWandAnimationResult(result);
    this.finishRunIfNeeded();
  },

  handleCanvasTouchEnd(event) {
    if (
      !this.started ||
      this.isPaused ||
      (this.failureSequence && this.failureSequence.active) ||
      this.introActive ||
      this.data.showPauseOverlay
    ) {
      return;
    }

    const result = this.resolveDirectionGesture(event, true);
    this.handleRabbitWandAnimationResult(result);
    releaseHold(this.state, this.audio.getCurrentChartTime());
    this.releaseRabbitWandHoldAnimation();
    this.flushAudioCues();
    this.finishRunIfNeeded();
  },

  handleCanvasPointerDown(event) {
    this.reportDebugCoordinate(event);
    const point = this.getEventCanvasPoint(event);

    if (this.failureSequence && this.failureSequence.active) {
      return;
    }

    this.handleActiveOverlayTap(point);
  },

  handleCanvasRenderError(event) {
    console.warn("Canvas same-layer render failed", event && event.detail ? event.detail : event);
  },

  noop() {},
});
