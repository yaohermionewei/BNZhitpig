import {
  createGameState,
  judgeDirection,
  judgeTap,
  peekBestNote,
  releaseHold,
  updateGameState,
} from "./engine.js";
import { renderFrame, getControlRects } from "./renderer.js";
import { AudioControllerWeb, emitAudioDebug } from "./AudioControllerWeb.js";
import { playUiSound, playVictoryFanfare } from "./uiSounds.js";
import {
  EFFECT_AUDIO_POOL_SIZES,
  loadImage,
  loadCharacterSprites,
  preloadResultAssets,
} from "./assets.js";
import { buildResultSummary } from "./result.js";
import { setBunniesMediaSessionMetadata } from "./mediaSession.js";
import { normalizeStartTheme, getStartThemeLoadingColors } from "../utils/start-theme.js";
import { LOADING_FONT_SAMPLE } from "../utils/loading-copy.js";

const INTRO_DURATION = 0.82;
const ENDING_SEQUENCE_DURATION = 1.5;
const DIRECTION_GESTURE_MIN_DISTANCE = 28;
const DIRECTION_GESTURE_AXIS_RATIO = 1.15;
const RABBIT_WAND_SWING_VARIANT = 2;
const RABBIT_WAND_SWING_FRAME_COUNT = 9;
const RABBIT_WAND_SWING_DURATION = 0.18;
const RABBIT_WAND_RETRIGGER_FRAME = 2;
const RABBIT_WAND_PEAK_FRAME = 4;
const RABBIT_WAND_MIN_PHASE_DURATION = 0.04;
const RABBIT_WAND_TAP_SEQUENCE = Object.freeze([0, 1, 2, 3, 4, 3, 2, 1, 0]);
const RABBIT_WAND_HOLD_FORWARD_SEQUENCE = Object.freeze([0, 1, 2, 3, 4]);
const CROWD_MEMBER_COUNT = 5;
const CROWD_EVENT_DELAY_RANGE = Object.freeze([2.8, 5.2]);
const CROWD_FRONT_HOLD_RANGE = Object.freeze([0.72, 1.28]);
const CROWD_TURN_DURATION_RANGE = Object.freeze([0.1, 0.16]);
const GAME_OVER_EFFECT_SOURCE = "/assets/audio/miss.wav";
const NOTE_HIT_EFFECT_VOLUME = 3.6;
const NOTE_MISS_EFFECT_VOLUME = 1.8;
const CRITICAL_FONT_LOAD_TIMEOUT_MS = 1200;
const PREPARE_RESOURCE_TIMEOUT_MS = 12000;
const TUTORIAL_BATTLE_START_COUNT_STORAGE_KEY = "bunniesTutorialBattleStartCountV1";
const TUTORIAL_HINT_VISIBLE_BATTLE_LIMIT = 3;
const KEYBOARD_TAP_CODES = Object.freeze(["Space", "KeyJ", "KeyK", "KeyF", "KeyD"]);
const KEYBOARD_TAP_CODE_SET = new Set(KEYBOARD_TAP_CODES);
const KEYBOARD_DIRECTION_BY_CODE = Object.freeze({
  ArrowLeft: "left",
  ArrowRight: "right",
});

function normalizeInputMode(inputMode) {
  return inputMode === "keyboard" ? "keyboard" : "touch";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  if (max <= min) return min;
  return min + Math.random() * (max - min);
}

function createFailureSequenceState() {
  return { active: false, elapsed: 0, duration: 1, kind: "failed" };
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

function getRabbitWandSequenceStep(elapsed, duration, stepCount) {
  const safeStepCount = Math.max(1, stepCount);
  const safeDuration = Math.max(0.001, duration);
  const progress = clamp(elapsed / safeDuration, 0, 0.999999);
  return Math.min(safeStepCount - 1, Math.floor(progress * safeStepCount));
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

function getCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    id: event.pointerId ?? 0,
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function waitForCriticalPixelFonts() {
  if (typeof document === "undefined" || !document.fonts) {
    return Promise.resolve(false);
  }

  const fontLoads = [
    document.fonts.load('400 24px "PixelEnPrimary"', "Bunnies PERFECT START"),
    document.fonts.load('400 24px "PixelZhFusion"', `爆锤方猪开始${LOADING_FONT_SAMPLE}`),
  ];
  const timeout = new Promise((resolve) => {
    window.setTimeout(() => resolve(false), CRITICAL_FONT_LOAD_TIMEOUT_MS);
  });

  return Promise.race([
    Promise.allSettled(fontLoads).then(() => true),
    timeout,
  ]);
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId = 0;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function isValidTutorialBattleStartCount(value) {
  return Number.isInteger(value) && value >= 0;
}

function incrementTutorialBattleStartCount() {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return 1;
    }

    const storedValue = window.localStorage.getItem(TUTORIAL_BATTLE_START_COUNT_STORAGE_KEY);
    const parsedValue = storedValue === null ? 0 : Number(storedValue);
    const currentCount = isValidTutorialBattleStartCount(parsedValue) ? parsedValue : 0;
    const nextCount = currentCount + 1;
    window.localStorage.setItem(TUTORIAL_BATTLE_START_COUNT_STORAGE_KEY, String(nextCount));
    return nextCount;
  } catch (error) {
    console.warn("Failed to persist tutorial battle count", error);
    return 1;
  }
}

function shouldShowTutorialHintsForBattleStart() {
  return incrementTutorialBattleStartCount() <= TUTORIAL_HINT_VISIBLE_BATTLE_LIMIT;
}

export class GameRunner {
  constructor({ canvas, song, startTheme, inputMode = "touch", onFinish, onHome, onLoadingChange }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.song = song;
    this.startTheme = normalizeStartTheme(startTheme);
    this.inputMode = normalizeInputMode(inputMode);
    this.onFinish = onFinish;
    this.onHome = onHome;
    this.onLoadingChange = onLoadingChange;
    this.audio = new AudioControllerWeb();
    this.state = createGameState(song.chart);
    this.characterSprites = {};
    this.songCoverImage = null;
    this.viewport = { width: 1, height: 1, dpr: 1 };
    this.frameHandle = 0;
    this.lastTimestamp = 0;
    this.started = false;
    this.isPaused = false;
    this.pauseReason = null;
    this.introActive = false;
    this.introElapsed = 0;
    this.magicVisualTime = 0;
    this.startingAudio = false;
    this.pendingAudioStart = false;
    this.audioStartToken = 0;
    this.failureSequence = createFailureSequenceState();
    this.crowdMotion = createCrowdMotionState();
    this.rabbitWandAnimation = createRabbitWandAnimationState();
    this.inputGesture = null;
    this.keyboardHoldCode = null;
    this.showTutorialHints = true;
    this.resultPending = false;
    this.resultAssetsPromise = null;
    this.disposed = false;
    this.resizeObserver = null;
    this.resizeFallbackInstalled = false;
    this.handleResize = this.handleResize.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handlePageHide = this.handlePageHide.bind(this);
    this.handlePageShow = this.handlePageShow.bind(this);
    this.handleFreeze = this.handleFreeze.bind(this);
    this.handleResumeEvent = this.handleResumeEvent.bind(this);
    this.handleWindowBlur = this.handleWindowBlur.bind(this);
    this.handleWindowFocus = this.handleWindowFocus.bind(this);
  }

  async prepare() {
    this.onLoadingChange?.(true);
    this.installEvents();
    this.installLifecycleEvents();
    this.installResizeObserver();
    this.resizeCanvas();
    this.drawWarmupFrame();
    await withTimeout(
      Promise.all([
        waitForCriticalPixelFonts(),
        this.audio.preloadChart(this.song.chart),
        this.audio.preloadEffects(Object.keys(EFFECT_AUDIO_POOL_SIZES)),
        loadImage(this.song.coverImageSrc).then((image) => {
          this.songCoverImage = image;
        }),
        loadCharacterSprites(this.startTheme).then((sprites) => {
          this.characterSprites = sprites;
        }),
      ]),
      PREPARE_RESOURCE_TIMEOUT_MS,
      "Game resources timed out while preparing."
    );
    this.onLoadingChange?.(false);
    this.preloadResultAssets();
    this.renderCurrentFrame();
  }

  start() {
    this.emitDebug("runner.start:before");
    this.audio.stop();
    this.preloadResultAssets();
    this.state = createGameState(this.song.chart);
    this.showTutorialHints = shouldShowTutorialHintsForBattleStart();
    this.failureSequence = createFailureSequenceState();
    this.crowdMotion = createCrowdMotionState();
    this.rabbitWandAnimation = createRabbitWandAnimationState();
    this.resetInputGesture();
    this.resetKeyboardInput();
    this.started = true;
    this.isPaused = false;
    this.pauseReason = null;
    this.introActive = true;
    this.introElapsed = 0;
    this.magicVisualTime = 0;
    this.startingAudio = false;
    this.pendingAudioStart = false;
    this.audioStartToken += 1;
    this.resultPending = false;
    this.lastTimestamp = 0;
    this.stopLoop();
    this.startLoop();
    this.emitDebug("runner.start:after");
  }

  installEvents() {
    this.canvas.addEventListener("pointerdown", this.handlePointerDown, { passive: false });
    this.canvas.addEventListener("pointermove", this.handlePointerMove, { passive: false });
    this.canvas.addEventListener("pointerup", this.handlePointerUp, { passive: false });
    this.canvas.addEventListener("pointercancel", this.handlePointerUp, { passive: false });
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
  }

  installLifecycleEvents() {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
      document.addEventListener("freeze", this.handleFreeze);
      document.addEventListener("resume", this.handleResumeEvent);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", this.handlePageHide);
      window.addEventListener("pageshow", this.handlePageShow);
      window.addEventListener("blur", this.handleWindowBlur);
      window.addEventListener("focus", this.handleWindowFocus);
    }
  }

  removeLifecycleEvents() {
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      document.removeEventListener("freeze", this.handleFreeze);
      document.removeEventListener("resume", this.handleResumeEvent);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("pagehide", this.handlePageHide);
      window.removeEventListener("pageshow", this.handlePageShow);
      window.removeEventListener("blur", this.handleWindowBlur);
      window.removeEventListener("focus", this.handleWindowFocus);
    }
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.handleLifecyclePause("visibility");
    } else {
      this.handleLifecycleReturn();
    }
  }

  handlePageHide() {
    this.handleLifecyclePause("pagehide");
  }

  handlePageShow() {
    this.handleLifecycleReturn();
  }

  handleFreeze() {
    this.handleLifecyclePause("freeze");
  }

  handleResumeEvent() {
    this.handleLifecycleReturn();
  }

  handleWindowBlur() {
    this.handleLifecyclePause("blur");
  }

  handleWindowFocus() {
    this.handleLifecycleReturn();
  }

  handleLifecyclePause() {
    if (!this.started || this.resultPending || this.failureSequence.active) return;
    this.emitDebug("runner.lifecycle-pause:before");
    this.pause({ reason: "system" });
    this.emitDebug("runner.lifecycle-pause:after");
  }

  handleLifecycleReturn() {
    if (!this.started || this.resultPending || this.disposed) return;
    this.emitDebug("runner.lifecycle-return:before");
    this.lastTimestamp = 0;
    this.resizeCanvas();
    if (this.pauseReason === "system") {
      this.renderCurrentFrame();
    }
    this.emitDebug("runner.lifecycle-return:after");
  }

  installResizeObserver() {
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", this.handleResize);
      this.resizeFallbackInstalled = true;
      return;
    }
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.canvas);
  }

  handleResize() {
    this.resizeCanvas();
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = false;
    }
    this.viewport = { width, height, dpr };
    this.renderCurrentFrame();
  }

  drawWarmupFrame() {
    const { width, height } = this.viewport;
    const colors = getStartThemeLoadingColors(this.startTheme);
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = colors.background;
    this.ctx.fillRect(0, 0, width, height);
  }

  startLoop() {
    if (this.frameHandle) return;
    const tick = (timestamp) => {
      this.frameHandle = 0;
      if (this.disposed) return;
      if (!this.lastTimestamp) this.lastTimestamp = timestamp || performance.now();
      const now = timestamp || performance.now();
      const dt = Math.min(0.05, (now - this.lastTimestamp) / 1000);
      this.lastTimestamp = now;
      if (this.started && !this.isPaused) {
        this.magicVisualTime += dt;
      }
      const updateResult = this.update(dt);
      if (updateResult && typeof updateResult.catch === "function") {
        updateResult.catch((error) => this.handleUpdateError(error));
      }
      this.renderCurrentFrame();
      if (!this.isPaused && !this.disposed && !this.resultPending) {
        this.frameHandle = requestAnimationFrame(tick);
      }
    };
    this.frameHandle = requestAnimationFrame(tick);
  }

  stopLoop() {
    if (!this.frameHandle) return;
    cancelAnimationFrame(this.frameHandle);
    this.frameHandle = 0;
  }

  preloadResultAssets() {
    if (!this.resultAssetsPromise) {
      this.resultAssetsPromise = preloadResultAssets(this.startTheme).catch((error) => {
        console.warn("result assets preload failed", error);
        return [];
      });
    }
    return this.resultAssetsPromise;
  }

  async update(dt) {
    if (!this.started || this.isPaused) return;

    if (this.introActive) {
      if (this.startingAudio) return;
      this.introElapsed = Math.min(INTRO_DURATION, this.introElapsed + dt);
      if (this.introElapsed >= INTRO_DURATION) {
        this.startingAudio = true;
        this.pendingAudioStart = true;
        const audioStartToken = ++this.audioStartToken;
        this.emitDebug("runner.intro-audio-start:before");
        setBunniesMediaSessionMetadata();
        await this.audio.start(this.song.chart);
        this.emitDebug("runner.intro-audio-start:after");
        if (audioStartToken !== this.audioStartToken) {
          this.emitDebug("runner.intro-audio-start:stale");
          return;
        }
        if (this.disposed || this.resultPending || this.isPaused || !this.started) {
          this.audio.pause();
          this.startingAudio = false;
          this.emitDebug("runner.intro-audio-start:cancelled");
          return;
        }
        this.startingAudio = false;
        this.pendingAudioStart = false;
        this.introActive = false;
        this.emitDebug("runner.intro-audio-start:ready");
      }
    } else if (!this.failureSequence.active) {
      const currentTime = this.audio.getCurrentChartTime();
      updateGameState(this.state, currentTime, dt);
      this.updateCrowdMotion(currentTime);
      this.updateRabbitWandAnimation(dt);
      this.flushAudioCues();
      if (this.state.failed && !this.failureSequence.active) {
        this.startFailureSequence();
      }
    }

    const failureSequenceFinished = this.updateFailureSequence(dt);
    if (this.state.ended && !this.introActive) {
      if (this.state.failed) {
        if (!this.failureSequence.active) {
          this.startFailureSequence();
        } else if (failureSequenceFinished) {
          this.finishRun();
        }
      } else {
        if (!this.failureSequence.active) {
          this.startFailureSequence("completed");
        } else if (failureSequenceFinished) {
          this.finishRun();
        }
      }
    }
  }

  handleUpdateError(error) {
    if (this.disposed || this.resultPending) return;
    console.error("game update failed", error);
    this.emitDebug("runner.update-error", {
      error: this.formatDebugError(error),
    });
    this.startingAudio = false;
    this.pendingAudioStart = this.introActive && this.introElapsed >= INTRO_DURATION;
    this.pause({ reason: "system", pauseAudio: false });
  }

  renderCurrentFrame() {
    if (!this.ctx || !this.viewport || !this.state) return;
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
        gameOverOverlayKind: this.failureSequence?.kind || "failed",
        selectedSongId: this.song.id,
        songTitle: this.song.title,
        songCoverImage: this.songCoverImage,
        characterSprites: this.characterSprites,
        crowdMotion: this.crowdMotion,
        audioDebugText: "",
        introProgress,
        sceneTime,
        magicVisualTime: this.magicVisualTime,
        showLaneBase: false,
        gameplayActive: this.started && !this.introActive,
        showTutorialHints: this.showTutorialHints,
        rabbitWandAnimation: this.rabbitWandAnimation,
        rabbitWandSwingVariant: RABBIT_WAND_SWING_VARIANT,
        startTheme: this.startTheme,
        inputMode: this.inputMode,
        loadingColors: getStartThemeLoadingColors(this.startTheme),
      });
    } catch (error) {
      console.error("render frame failed", error);
      this.drawWarmupFrame();
    }
  }

  updateCrowdMotion(sceneTime) {
    const members = this.crowdMotion.members;
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
    const crowdBusy = members.some((member) => member.facingFront || member.turnStartedAt !== null);
    if (!crowdBusy && sceneTime >= this.crowdMotion.nextEventAt) {
      const nextMember = members[Math.floor(Math.random() * members.length)];
      this.startCrowdTurn(nextMember, true, sceneTime);
      this.crowdMotion.nextEventAt =
        sceneTime + randomBetween(CROWD_EVENT_DELAY_RANGE[0], CROWD_EVENT_DELAY_RANGE[1]);
    }
  }

  startCrowdTurn(member, toFront, sceneTime) {
    if (!member || member.turnStartedAt !== null) return;
    member.turnFromFront = !!member.facingFront;
    member.turnToFront = !!toFront;
    member.turnStartedAt = sceneTime;
    member.turnDuration = randomBetween(CROWD_TURN_DURATION_RANGE[0], CROWD_TURN_DURATION_RANGE[1]);
    member.holdUntil = toFront
      ? sceneTime + member.turnDuration + randomBetween(CROWD_FRONT_HOLD_RANGE[0], CROWD_FRONT_HOLD_RANGE[1])
      : null;
  }

  startRabbitWandAnimation(mode, sequence, duration) {
    this.rabbitWandAnimation.active = true;
    this.rabbitWandAnimation.mode = mode;
    this.rabbitWandAnimation.sequence = sequence?.length ? sequence.slice() : [0];
    this.rabbitWandAnimation.duration = Math.max(0.001, duration || RABBIT_WAND_SWING_DURATION);
    this.rabbitWandAnimation.elapsed = 0;
    this.rabbitWandAnimation.frameIndex = this.rabbitWandAnimation.sequence[0];
  }

  resetRabbitWandAnimation() {
    this.rabbitWandAnimation = createRabbitWandAnimationState();
  }

  updateRabbitWandAnimation(dt) {
    const animation = this.rabbitWandAnimation;
    if (!animation.active || animation.mode === "idle") {
      this.resetRabbitWandAnimation();
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
    }
  }

  handleRabbitWandAnimationResult(result) {
    if (shouldStartRabbitWandHoldAnimation(result)) {
      this.startRabbitWandAnimation(
        "holdForward",
        RABBIT_WAND_HOLD_FORWARD_SEQUENCE,
        getRabbitWandDurationForSequence(RABBIT_WAND_HOLD_FORWARD_SEQUENCE.length)
      );
      return;
    }
    if (!shouldTriggerRabbitWandTapAnimation(result)) return;
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
    animation.elapsed =
      currentStep >= RABBIT_WAND_PEAK_FRAME
        ? retriggerElapsed
        : Math.max(animation.elapsed, retriggerElapsed);
  }

  releaseRabbitWandHoldAnimation() {
    const animation = this.rabbitWandAnimation;
    if (animation.mode !== "holdForward" && animation.mode !== "holdPeak") return;
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
  }

  startFailureSequence(kind = "failed") {
    if (this.failureSequence.active) return;
    this.failureSequence.active = true;
    this.failureSequence.elapsed = 0;
    this.failureSequence.duration = ENDING_SEQUENCE_DURATION;
    this.failureSequence.kind = kind;
    this.resetInputGesture();
    this.resetKeyboardInput();
    if (kind === "failed") {
      this.audioStartToken += 1;
      this.audio.pause();
      this.audio.playEffect(GAME_OVER_EFFECT_SOURCE, {
        playbackRate: 0.76,
        volume: NOTE_MISS_EFFECT_VOLUME,
      });
    } else if (kind === "completed") {
      playVictoryFanfare();
    }
  }

  updateFailureSequence(dt) {
    if (!this.failureSequence.active) return false;
    this.failureSequence.elapsed = Math.min(
      this.failureSequence.duration,
      this.failureSequence.elapsed + dt
    );
    return this.failureSequence.elapsed >= this.failureSequence.duration;
  }

  flushAudioCues() {
    if (!this.state.audioCues?.length) return;
    const cues = this.state.audioCues.slice();
    this.state.audioCues.length = 0;
    cues.forEach((cue) => {
      if (cue === "hit") {
        this.audio.playEffect("/assets/audio/hit.wav", { volume: NOTE_HIT_EFFECT_VOLUME });
      }
      if (cue === "miss") {
        this.audio.playEffect("/assets/audio/miss.wav", { volume: NOTE_MISS_EFFECT_VOLUME });
      }
    });
  }

  resetInputGesture() {
    this.inputGesture = {
      active: false,
      resolved: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
    };
  }

  resetKeyboardInput() {
    this.keyboardHoldCode = null;
  }

  isKeyboardGameplayActive() {
    return (
      this.started &&
      !this.introActive &&
      !this.isPaused &&
      !this.failureSequence.active &&
      !this.resultPending
    );
  }

  judgeKeyboardTap(code) {
    const currentTime = this.audio.getCurrentChartTime();
    const result = judgeTap(this.state, currentTime);
    if (result?.type === "holdStart") {
      this.keyboardHoldCode = code;
    }
    this.handleRabbitWandAnimationResult(result);
    this.flushAudioCues();
    this.finishRunIfNeeded();
  }

  judgeKeyboardDirection(direction) {
    const result = judgeDirection(this.state, this.audio.getCurrentChartTime(), direction);
    this.handleRabbitWandAnimationResult(result);
    this.flushAudioCues();
    this.finishRunIfNeeded();
  }

  releaseKeyboardHold(code) {
    if (!this.keyboardHoldCode || code !== this.keyboardHoldCode) return;
    this.keyboardHoldCode = null;
    releaseHold(this.state, this.audio.getCurrentChartTime());
    this.releaseRabbitWandHoldAnimation();
    this.flushAudioCues();
    this.finishRunIfNeeded();
  }

  handleKeyDown(event) {
    const code = event.code;

    if (this.started && this.isPaused && !this.resultPending && this.pauseReason !== "system") {
      if (code === "Escape" || code === "Enter") {
        event.preventDefault();
        if (event.repeat) return;
        playUiSound("resume");
        this.resume();
        return;
      }
      if (code === "KeyR") {
        event.preventDefault();
        if (event.repeat) return;
        playUiSound("confirm");
        this.start();
        return;
      }
    }

    if (!this.isKeyboardGameplayActive()) return;

    if (code === "Escape") {
      event.preventDefault();
      if (event.repeat) return;
      playUiSound("tap");
      this.pause();
      return;
    }

    const direction = KEYBOARD_DIRECTION_BY_CODE[code];
    if (direction) {
      event.preventDefault();
      if (event.repeat) return;
      this.judgeKeyboardDirection(direction);
      return;
    }

    if (!KEYBOARD_TAP_CODE_SET.has(code)) return;

    event.preventDefault();
    if (event.repeat) return;
    this.judgeKeyboardTap(code);
  }

  handleKeyUp(event) {
    if (!KEYBOARD_TAP_CODE_SET.has(event.code)) return;

    if (this.keyboardHoldCode === event.code) {
      event.preventDefault();
    }

    if (!this.isKeyboardGameplayActive()) {
      if (this.keyboardHoldCode === event.code) {
        this.keyboardHoldCode = null;
      }
      return;
    }

    this.releaseKeyboardHold(event.code);
  }

  handlePointerDown(event) {
    event.preventDefault();
    this.canvas.setPointerCapture?.(event.pointerId);
    const point = getCanvasPoint(event, this.canvas);
    if (this.failureSequence.active) return;

    const rects = getControlRects(this.viewport);
    if (this.started && !this.introActive && !this.isPaused) {
      if (
        point.x >= rects.pause.left &&
        point.x <= rects.pause.right &&
        point.y >= rects.pause.top &&
        point.y <= rects.pause.bottom
      ) {
        playUiSound("tap");
        this.pause();
        return;
      }
    }

    if (this.isPaused) {
      if (this.pointHitsRect(point, rects.pauseHome)) {
        playUiSound("back");
        this.goHome();
        return;
      }
      if (this.pointHitsRect(point, rects.pauseRestart)) {
        playUiSound("confirm");
        this.emitDebug("runner.pause-menu-restart");
        this.start();
        return;
      }
      if (this.pointHitsRect(point, rects.resume)) {
        playUiSound("resume");
        this.emitDebug("runner.pause-menu-resume");
        this.resume();
        return;
      }
      return;
    }

    if (!this.started || this.introActive) return;

    const currentTime = this.audio.getCurrentChartTime();
    const preview = peekBestNote(this.state, currentTime);
    if (preview.note && preview.note.direction) {
      this.inputGesture = {
        active: true,
        resolved: false,
        pointerId: event.pointerId,
        startX: point.x,
        startY: point.y,
        lastX: point.x,
        lastY: point.y,
      };
      return;
    }

    const result = judgeTap(this.state, currentTime);
    this.handleRabbitWandAnimationResult(result);
    this.flushAudioCues();
    this.finishRunIfNeeded();
  }

  handlePointerMove(event) {
    event.preventDefault();
    if (!this.started || this.isPaused || this.failureSequence.active || this.introActive) return;
    const result = this.resolveDirectionGesture(event, false);
    this.handleRabbitWandAnimationResult(result);
    this.finishRunIfNeeded();
  }

  handlePointerUp(event) {
    event.preventDefault();
    if (!this.started || this.isPaused || this.failureSequence.active || this.introActive) return;
    const result = this.resolveDirectionGesture(event, true);
    this.handleRabbitWandAnimationResult(result);
    releaseHold(this.state, this.audio.getCurrentChartTime());
    this.releaseRabbitWandHoldAnimation();
    this.flushAudioCues();
    this.finishRunIfNeeded();
  }

  resolveDirectionGesture(event, finalize = false) {
    if (!this.inputGesture.active || this.inputGesture.resolved) return null;
    if (event.pointerId !== this.inputGesture.pointerId) return null;
    const point = getCanvasPoint(event, this.canvas);
    const deltaX = point.x - this.inputGesture.startX;
    const deltaY = point.y - this.inputGesture.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (absX < DIRECTION_GESTURE_MIN_DISTANCE || absX < absY * DIRECTION_GESTURE_AXIS_RATIO) {
      if (finalize) this.resetInputGesture();
      return null;
    }
    const direction = deltaX < 0 ? "left" : "right";
    const result = judgeDirection(this.state, this.audio.getCurrentChartTime(), direction);
    this.flushAudioCues();
    this.inputGesture.resolved = true;
    this.inputGesture.active = false;
    return result;
  }

  pointHitsRect(point, rect) {
    return (
      point &&
      rect &&
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom
    );
  }

  pause(options = {}) {
    if (!this.started || this.isPaused) return;
    this.emitDebug("runner.pause:before", {
      reason: options.reason === "system" ? "system" : "user",
      pauseAudio: options.pauseAudio !== false,
    });
    const reason = options.reason === "system" ? "system" : "user";
    this.isPaused = true;
    this.pauseReason = reason;
    this.audioStartToken += 1;
    this.startingAudio = false;
    this.pendingAudioStart = this.pendingAudioStart || (
      this.introActive && this.introElapsed >= INTRO_DURATION
    );
    this.lastTimestamp = 0;
    this.resetInputGesture();
    this.resetKeyboardInput();
    if (options.pauseAudio !== false) {
      this.audio.pause();
    }
    this.stopLoop();
    this.renderCurrentFrame();
    this.emitDebug("runner.pause:after");
  }

  async resume() {
    if (!this.isPaused || this.startingAudio) {
      this.emitDebug("runner.resume:ignored", {
        ignoredBecause: !this.isPaused ? "not-paused" : "starting-audio",
      });
      return;
    }
    const audioStartToken = ++this.audioStartToken;
    this.startingAudio = true;
    this.resetInputGesture();
    this.resetKeyboardInput();
    this.lastTimestamp = 0;
    this.emitDebug("runner.resume:before");
    try {
      if (this.pendingAudioStart) {
        this.emitDebug("runner.resume-audio-start:before");
        setBunniesMediaSessionMetadata();
        await this.audio.start(this.song.chart);
        this.emitDebug("runner.resume-audio-start:after");
      } else if (!this.introActive) {
        this.emitDebug("runner.resume-audio-resume:before");
        setBunniesMediaSessionMetadata();
        await this.audio.resume();
        this.emitDebug("runner.resume-audio-resume:after");
      }
      if (
        audioStartToken !== this.audioStartToken ||
        this.disposed ||
        this.resultPending ||
        !this.started
      ) {
        if (audioStartToken !== this.audioStartToken) {
          this.emitDebug("runner.resume:stale");
          return;
        }
        this.audio.pause();
        this.emitDebug("runner.resume:cancelled");
        return;
      }
      this.isPaused = false;
      this.pauseReason = null;
      if (this.pendingAudioStart) {
        this.pendingAudioStart = false;
        this.introActive = false;
      }
      this.startLoop();
      this.emitDebug("runner.resume:after");
    } catch (error) {
      console.error("game audio resume failed", error);
      this.emitDebug("runner.resume:error", {
        error: this.formatDebugError(error),
      });
      this.isPaused = true;
      this.pauseReason = "system";
      this.renderCurrentFrame();
    } finally {
      if (audioStartToken === this.audioStartToken) {
        this.startingAudio = false;
        this.emitDebug("runner.resume:finally");
      }
    }
  }

  goHome() {
    if (this.resultPending) return;
    this.emitDebug("runner.go-home");
    this.audioStartToken += 1;
    this.startingAudio = false;
    this.pendingAudioStart = false;
    this.resultPending = true;
    this.started = false;
    this.isPaused = false;
    this.pauseReason = null;
    this.lastTimestamp = 0;
    this.resetInputGesture();
    this.resetKeyboardInput();
    this.stopLoop();
    this.audio.destroy();
    this.onHome?.();
  }

  finishRunIfNeeded() {
    if (this.started && this.state?.ended) {
      if (this.state.failed) {
        if (!this.failureSequence.active) this.startFailureSequence();
        return false;
      }
      if (!this.failureSequence.active) {
        this.startFailureSequence("completed");
        return false;
      }
      this.finishRun();
      return true;
    }
    return false;
  }

  finishRun() {
    if (this.resultPending) return;
    this.emitDebug("runner.finish");
    this.audioStartToken += 1;
    this.startingAudio = false;
    this.pendingAudioStart = false;
    this.resultPending = true;
    this.started = false;
    this.isPaused = true;
    this.pauseReason = null;
    this.resetInputGesture();
    this.resetKeyboardInput();
    this.stopLoop();
    this.audio.destroy();
    this.preloadResultAssets();
    const summary = buildResultSummary(this.song, this.state, this.startTheme);
    this.onFinish?.(summary);
  }

  dispose() {
    this.emitDebug("runner.dispose");
    this.disposed = true;
    this.stopLoop();
    this.audio.destroy();
    this.removeLifecycleEvents();
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas.removeEventListener("pointercancel", this.handlePointerUp);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    this.resizeObserver?.disconnect();
    if (this.resizeFallbackInstalled) {
      window.removeEventListener("resize", this.handleResize);
    }
  }

  getDebugSnapshot() {
    return {
      started: !!this.started,
      isPaused: !!this.isPaused,
      pauseReason: this.pauseReason || null,
      startingAudio: !!this.startingAudio,
      pendingAudioStart: !!this.pendingAudioStart,
      introActive: !!this.introActive,
      introElapsed: Number((this.introElapsed || 0).toFixed(4)),
      resultPending: !!this.resultPending,
      failureSequenceActive: !!this.failureSequence?.active,
      frameHandle: this.frameHandle || 0,
      lastTimestamp: Number((this.lastTimestamp || 0).toFixed(2)),
      audioStartToken: this.audioStartToken,
      stateTime: Number((this.state?.currentTime || 0).toFixed(4)),
      magicVisualTime: Number((this.magicVisualTime || 0).toFixed(4)),
      audio: this.audio.getDebugSnapshot(),
    };
  }

  formatDebugError(error) {
    if (!error) return null;
    return {
      name: error.name || "Error",
      message: error.message || String(error),
      audioState: error.audioState || null,
      resumeErrorMessage: error.resumeErrorMessage || null,
    };
  }

  emitDebug(source, detail = {}) {
    emitAudioDebug(source, {
      runner: this.getDebugSnapshot(),
      ...detail,
    });
  }
}
