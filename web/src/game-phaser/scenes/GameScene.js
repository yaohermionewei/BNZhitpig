import Phaser from "phaser";
import {
  createGameState,
  judgeDirection,
  judgeTap,
  peekBestNote,
  releaseHold,
  updateGameState,
} from "../../game/engine.js";
import { AudioControllerWeb, loadAudioBuffer } from "../../game/AudioControllerWeb.js";
import {
  EFFECT_AUDIO_POOL_SIZES,
  loadCharacterSprites,
  loadImage,
  preloadResultAssets,
} from "../../game/assets.js";
import { buildResultSummary } from "../../game/result.js";
import { playUiSound, playVictoryFanfare } from "../../game/uiSounds.js";
import { setBunniesMediaSessionMetadata } from "../../game/mediaSession.js";
import { getStartThemeLoadingColors, normalizeStartTheme } from "../../utils/start-theme.js";
import { renderFrame as drawGameFrame, getControlRects } from "../../game/renderer.js";
import {
  RABBIT_WAND_SWING_VARIANT,
  createCrowdMotionState,
  createRabbitWandAnimationState,
} from "../runnerState.js";

const INTRO_DURATION = 0.82;
const ENDING_SEQUENCE_DURATION = 1.5;
const PREPARE_RESOURCE_TIMEOUT_MS = 20000;
const MAIN_AUDIO_PRELOAD_TIMEOUT_MS = 16000;
const DIRECTION_GESTURE_MIN_DISTANCE = 28;
const DIRECTION_GESTURE_AXIS_RATIO = 1.15;
const NOTE_HIT_EFFECT_VOLUME = 3.6;
const NOTE_MISS_EFFECT_VOLUME = 1.8;
const GAME_OVER_EFFECT_SOURCE = "/assets/audio/miss.wav";
const FRAME_TEXTURE_KEY = "phaserGameFrame";
const MAX_DEVICE_PIXEL_RATIO = 2;
const KEYBOARD_TAP_CODES = Object.freeze(["Space", "KeyJ", "KeyK", "KeyF", "KeyD"]);
const KEYBOARD_TAP_CODE_SET = new Set(KEYBOARD_TAP_CODES);
const KEYBOARD_DIRECTION_BY_CODE = Object.freeze({
  ArrowLeft: "left",
  ArrowRight: "right",
});

function withTimeout(promise, timeoutMs, message) {
  let timeoutId = 0;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function normalizeInputMode(inputMode) {
  return inputMode === "keyboard" ? "keyboard" : "touch";
}

function getBrowserSafeAssetSource(src) {
  if (!src) return "";
  try {
    return encodeURI(src);
  } catch (error) {
    return src;
  }
}

function pointHitsRect(point, rect) {
  return (
    point &&
    rect &&
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
    this.options = null;
    this.audio = null;
    this.state = null;
    this.inputMode = "touch";
    this.startTheme = "dark";
    this.started = false;
    this.isPaused = false;
    this.pauseReason = null;
    this.introActive = false;
    this.introElapsed = 0;
    this.startingAudio = false;
    this.failureSequence = { active: false, elapsed: 0, duration: ENDING_SEQUENCE_DURATION, kind: "failed" };
    this.resultPending = false;
    this.pendingHoldPointerId = null;
    this.keyboardHoldCode = null;
    this.inputGesture = null;
    // Visual state fed into the original canvas renderer via renderFrame.
    this.characterSprites = {};
    this.songCoverImage = null;
    this.crowdMotion = null;
    this.rabbitWandAnimation = null;
    this.magicVisualTime = 0;
    this.viewport = null;
    this.controlRects = null;
    this.frameCanvas = null;
    this.frameCtx = null;
    this.frameTexture = null;
    this.frameImage = null;
    this.lastJudgementResult = null;
    this.lastJudgementAt = -99;
    this.disposed = false;
    this.inputEventsInstalled = false;
    this.lifecycleEventsInstalled = false;
  }

  init(options) {
    this.disposed = false;
    this.inputEventsInstalled = false;
    this.lifecycleEventsInstalled = false;
    this.options = options;
    this.options.onLoadingStage?.("scene:init");
    this.song = options.song;
    this.startTheme = normalizeStartTheme(options.startTheme);
    this.inputMode = normalizeInputMode(options.inputMode);
    this.audio = new AudioControllerWeb();
    this.state = createGameState(this.song.chart);
    this.resetInputGesture();
  }

  preload() {
    this.options.onLoadingStage?.("scene:preload");
    // Resource loading is handled in prepareAndStart so React loading cannot
    // get stuck behind Phaser Loader failures.
  }

  create() {
    this.options.onLoadingStage?.("scene:create");
    this.prepareAndStart();
  }

  async prepareAndStart() {
    try {
      this.options.onLoadingStage?.("prepare:start");
      this.options.onLoadingChange?.(true);
      await withTimeout(
        this.prepareResources(),
        PREPARE_RESOURCE_TIMEOUT_MS,
        "Phaser game resources timed out while preparing."
      );
      if (this.disposed) return;
      this.createDisplay();
      if (this.disposed) return;
      this.installLifecycleEvents();
      this.installInputEvents();
      if (this.disposed) return;
      this.options.onLoadingChange?.(false);
      this.startRun();
    } catch (error) {
      if (this.disposed) return;
      this.options.onError?.(error);
    }
  }

  async prepareResources() {
    this.options.onLoadingStage?.("prepare:sprites");
    // The canvas renderer (renderFrame) needs raw HTMLImage sprites, not Phaser
    // textures. loadCharacterSprites returns the full bag (background, rabbit,
    // pig variants, the five-sisters crowd, glasses, …) and is cached per theme.
    const [sprites, coverImage] = await Promise.all([
      loadCharacterSprites(this.startTheme),
      loadImage(getBrowserSafeAssetSource(this.song.coverImageSrc)),
    ]);
    if (this.disposed) return;
    this.characterSprites = sprites || {};
    this.songCoverImage = coverImage || null;
    this.options.onLoadingStage?.("prepare:audio-main");
    await withTimeout(
      this.audio.preloadChart(this.song.chart),
      MAIN_AUDIO_PRELOAD_TIMEOUT_MS,
      "Main audio timed out while preparing."
    );
    if (this.disposed) return;
    this.options.onLoadingStage?.("prepare:display");
    this.preloadDeferredAssets();
  }

  preloadDeferredAssets() {
    const audio = this.audio;
    Promise.all(
      Object.keys(EFFECT_AUDIO_POOL_SIZES).map(async (src) => [src, await loadAudioBuffer(src)])
    ).then((entries) => {
      if (this.disposed || this.audio !== audio) return;
      entries.forEach(([src, buffer]) => {
        if (!audio.effectBuffers.has(src)) {
          audio.effectBuffers.set(src, buffer);
        }
      });
    }).catch((error) => {
      if (this.disposed || this.audio !== audio) return;
      console.warn("effect audio preload failed", error);
    });
    preloadResultAssets(this.startTheme).catch((error) => {
      if (this.disposed) return;
      console.warn("result assets preload failed", error);
    });
  }

  createDisplay() {
    this.cameras.main.setBackgroundColor(this.startTheme === "light" ? "#f1c56d" : "#252435");
    // Route B: the original canvas renderer owns every pixel. We draw it into an
    // offscreen canvas and blit that canvas into Phaser as a full-screen texture.
    this.frameCanvas = document.createElement("canvas");
    this.frameCanvas.width = 1;
    this.frameCanvas.height = 1;
    this.frameCtx = this.frameCanvas.getContext("2d", { alpha: false });
    this.frameTexture = this.textures.addCanvas(FRAME_TEXTURE_KEY, this.frameCanvas);
    this.frameImage = this.add.image(0, 0, FRAME_TEXTURE_KEY).setOrigin(0, 0);
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdown, this);
    this.handleResize();
  }

  handleResize() {
    const width = Math.max(1, Math.round(this.scale.width));
    const height = Math.max(1, Math.round(this.scale.height));
    const dpr = Math.min(MAX_DEVICE_PIXEL_RATIO, window.devicePixelRatio || 1);
    this.viewport = { width, height, dpr };
    this.controlRects = getControlRects(this.viewport);
    this.resizeFrameCanvas(width, height, dpr);
  }

  resizeFrameCanvas(width, height, dpr) {
    if (!this.frameCanvas || !this.frameImage) return;
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (this.frameCanvas.width !== pixelWidth || this.frameCanvas.height !== pixelHeight) {
      this.frameCanvas.width = pixelWidth;
      this.frameCanvas.height = pixelHeight;
      // CanvasTexture caches its dimensions, so recreate it after a resize.
      if (this.textures.exists(FRAME_TEXTURE_KEY)) {
        this.textures.remove(FRAME_TEXTURE_KEY);
      }
      this.frameTexture = this.textures.addCanvas(FRAME_TEXTURE_KEY, this.frameCanvas);
      this.frameImage.setTexture(FRAME_TEXTURE_KEY);
    }
    // Assigning canvas.width resets the 2D transform; re-apply the dpr scale so
    // renderFrame can draw in CSS-pixel coordinates (matches the legacy runner).
    this.frameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.frameCtx.imageSmoothingEnabled = false;
    this.frameImage.setPosition(0, 0).setOrigin(0, 0).setDisplaySize(width, height);
  }

  startRun() {
    this.audio.stop();
    this.state = createGameState(this.song.chart);
    this.started = true;
    this.isPaused = false;
    this.pauseReason = null;
    this.introActive = true;
    this.introElapsed = 0;
    this.startingAudio = false;
    this.failureSequence = { active: false, elapsed: 0, duration: ENDING_SEQUENCE_DURATION, kind: "failed" };
    this.resultPending = false;
    this.pendingHoldPointerId = null;
    this.keyboardHoldCode = null;
    this.resetInputGesture();
    this.lastJudgementResult = null;
    this.lastJudgementAt = -99;
    this.crowdMotion = createCrowdMotionState();
    this.rabbitWandAnimation = createRabbitWandAnimationState();
    this.magicVisualTime = 0;
  }

  update(_time, deltaMs) {
    if (this.disposed) return;
    const dt = Math.min(0.05, Math.max(0, deltaMs / 1000));
    // The magic-impact-zone shimmer advances on its own clock even while paused
    // or during the intro, matching the legacy renderer feel.
    this.magicVisualTime += dt;
    if (!this.started || this.resultPending || this.isPaused) {
      this.drawFrame();
      return;
    }
    if (this.introActive) {
      this.updateIntro(dt);
    } else if (!this.failureSequence.active) {
      const currentTime = this.audio.getCurrentChartTime();
      updateGameState(this.state, currentTime, dt);
      this.flushAudioCues();
      if (this.state.failed) {
        this.startFailureSequence("failed");
      }
    }
    const finished = this.updateFailureSequence(dt);
    if (this.state.ended && !this.introActive) {
      if (!this.failureSequence.active) {
        this.startFailureSequence(this.state.failed ? "failed" : "completed");
      } else if (finished) {
        this.finishRun();
      }
    }
    this.drawFrame();
  }

  async updateIntro(dt) {
    if (this.disposed) return;
    if (this.startingAudio) return;
    this.introElapsed = Math.min(INTRO_DURATION, this.introElapsed + dt);
    if (this.introElapsed < INTRO_DURATION) return;
    this.startingAudio = true;
    try {
      setBunniesMediaSessionMetadata();
      await this.audio.start(this.song.chart);
      if (this.disposed) return;
      if (this.scene?.isActive() && !this.resultPending && !this.isPaused) {
        this.introActive = false;
      } else {
        this.audio.pause();
      }
    } catch (error) {
      if (this.disposed) return;
      this.options.onError?.(error);
    } finally {
      this.startingAudio = false;
    }
  }

  drawFrame() {
    if (!this.viewport || !this.frameCtx || !this.state) return;
    try {
      drawGameFrame(this.frameCtx, this.viewport, this.state, this.buildUiState());
    } catch (error) {
      console.error("render frame failed", error);
      return;
    }
    this.frameTexture?.refresh();
  }

  buildUiState() {
    const introProgress = this.introActive ? this.introElapsed / INTRO_DURATION : 1;
    const sceneTime = this.started
      ? this.introActive
        ? this.introElapsed
        : this.state.currentTime
      : 0;
    const failure = this.failureSequence;
    return {
      paused: this.isPaused,
      useDomPauseOverlay: false,
      gameOverOverlayActive: !!failure?.active,
      gameOverOverlayProgress: failure?.active
        ? failure.elapsed / Math.max(0.001, failure.duration)
        : 0,
      gameOverOverlayKind: failure?.kind || "failed",
      selectedSongId: this.song.id,
      songTitle: this.song.title,
      songDifficultyLabel: this.song.difficultyLabel || "",
      songCoverImage: this.songCoverImage,
      characterSprites: this.characterSprites,
      crowdMotion: this.crowdMotion,
      audioDebugText: "",
      introProgress,
      sceneTime,
      magicVisualTime: this.magicVisualTime,
      showLaneBase: false,
      gameplayActive: this.started && !this.introActive,
      // Tier 2 will drive these from real state machines; static defaults keep
      // the scene rendering correctly without animating yet.
      showTutorialHints: false,
      rabbitWandAnimation: this.rabbitWandAnimation,
      rabbitWandSwingVariant: RABBIT_WAND_SWING_VARIANT,
      startTheme: this.startTheme,
      inputMode: this.inputMode,
      loadingColors: getStartThemeLoadingColors(this.startTheme),
      sceneOnly: false,
    };
  }

  installInputEvents() {
    if (this.inputEventsInstalled) return;
    this.input.on("pointerdown", this.handlePointerDown, this);
    this.input.on("pointermove", this.handlePointerMove, this);
    this.input.on("pointerup", this.handlePointerUp, this);
    this.input.on("pointercancel", this.handlePointerUp, this);
    this.input.keyboard?.on("keydown", this.handleKeyDown, this);
    this.input.keyboard?.on("keyup", this.handleKeyUp, this);
    this.inputEventsInstalled = true;
  }

  removeInputEvents() {
    if (!this.inputEventsInstalled) return;
    this.input.off("pointerdown", this.handlePointerDown, this);
    this.input.off("pointermove", this.handlePointerMove, this);
    this.input.off("pointerup", this.handlePointerUp, this);
    this.input.off("pointercancel", this.handlePointerUp, this);
    this.input.keyboard?.off("keydown", this.handleKeyDown, this);
    this.input.keyboard?.off("keyup", this.handleKeyUp, this);
    this.inputEventsInstalled = false;
  }

  installLifecycleEvents() {
    if (this.lifecycleEventsInstalled) return;
    this.handleVisibilityChange = () => {
      if (document.hidden) {
        this.pauseGame("system");
      }
    };
    this.handlePageHide = () => this.pauseGame("system");
    this.handleWindowBlur = () => this.pauseGame("system");
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("pagehide", this.handlePageHide);
    window.addEventListener("blur", this.handleWindowBlur);
    this.lifecycleEventsInstalled = true;
  }

  removeLifecycleEvents() {
    if (!this.lifecycleEventsInstalled) return;
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener("pagehide", this.handlePageHide);
    window.removeEventListener("blur", this.handleWindowBlur);
    this.lifecycleEventsInstalled = false;
  }

  isGameplayActive() {
    return this.started && !this.introActive && !this.isPaused && !this.failureSequence.active && !this.resultPending;
  }

  handlePointerDown(pointer) {
    pointer.event?.preventDefault?.();
    const point = { x: pointer.x, y: pointer.y };
    if (this.isPaused) {
      this.handlePauseMenuPointer(point);
      return;
    }
    if (!this.isGameplayActive()) return;
    if (pointHitsRect(point, this.controlRects?.pause)) {
      playUiSound("tap");
      this.pauseGame("user");
      return;
    }
    const preview = peekBestNote(this.state, this.audio.getCurrentChartTime());
    if (!preview.note?.direction) {
      const result = judgeTap(this.state, this.audio.getCurrentChartTime());
      if (result?.type === "holdStart") {
        this.pendingHoldPointerId = pointer.id;
      }
      this.recordJudge(result);
      return;
    }
    this.inputGesture = {
      active: true,
      resolved: false,
      pointerId: pointer.id,
      startX: pointer.x,
      startY: pointer.y,
      lastX: pointer.x,
      lastY: pointer.y,
    };
  }

  handlePointerMove(pointer) {
    if (!this.inputGesture?.active || this.inputGesture.pointerId !== pointer.id || this.inputGesture.resolved) return;
    this.inputGesture.lastX = pointer.x;
    this.inputGesture.lastY = pointer.y;
    const dx = pointer.x - this.inputGesture.startX;
    const dy = pointer.y - this.inputGesture.startY;
    if (
      Math.abs(dx) >= DIRECTION_GESTURE_MIN_DISTANCE &&
      Math.abs(dx) >= Math.abs(dy) * DIRECTION_GESTURE_AXIS_RATIO
    ) {
      this.inputGesture.resolved = true;
      this.recordJudge(judgeDirection(this.state, this.audio.getCurrentChartTime(), dx < 0 ? "left" : "right"));
    }
  }

  handlePointerUp(pointer) {
    pointer.event?.preventDefault?.();
    if (this.pendingHoldPointerId === pointer.id) {
      this.pendingHoldPointerId = null;
      this.resetInputGesture();
      if (this.isGameplayActive()) {
        this.recordJudge(releaseHold(this.state, this.audio.getCurrentChartTime()));
      }
      return;
    }
    if (!this.inputGesture?.active || this.inputGesture.pointerId !== pointer.id) return;
    const wasResolved = this.inputGesture.resolved;
    this.resetInputGesture();
    if (!this.isGameplayActive()) return;
    if (!wasResolved) return;
  }

  handlePauseMenuPointer(point) {
    if (pointHitsRect(point, this.controlRects?.pauseHome)) {
      playUiSound("back");
      this.goHome();
      return;
    }
    if (pointHitsRect(point, this.controlRects?.pauseRestart)) {
      playUiSound("confirm");
      this.startRun();
      return;
    }
    if (pointHitsRect(point, this.controlRects?.resume)) {
      this.resumeGame();
    }
  }

  handleKeyDown(event) {
    const code = event.code;
    if (this.started && this.isPaused) {
      if (code === "Escape" || code === "Enter") {
        event.preventDefault();
        if (!event.repeat) this.resumeGame();
        return;
      }
      if (code === "KeyR") {
        event.preventDefault();
        if (!event.repeat) this.startRun();
        return;
      }
    }
    if (!this.isGameplayActive()) return;
    if (code === "Escape") {
      event.preventDefault();
      if (!event.repeat) this.pauseGame("user");
      return;
    }
    const direction = KEYBOARD_DIRECTION_BY_CODE[code];
    if (direction) {
      event.preventDefault();
      if (!event.repeat) this.recordJudge(judgeDirection(this.state, this.audio.getCurrentChartTime(), direction));
      return;
    }
    if (!KEYBOARD_TAP_CODE_SET.has(code)) return;
    event.preventDefault();
    if (event.repeat) return;
    const result = judgeTap(this.state, this.audio.getCurrentChartTime());
    if (result?.type === "holdStart") {
      this.keyboardHoldCode = code;
    }
    this.recordJudge(result);
  }

  handleKeyUp(event) {
    if (!this.keyboardHoldCode || event.code !== this.keyboardHoldCode) return;
    event.preventDefault();
    this.keyboardHoldCode = null;
    this.recordJudge(releaseHold(this.state, this.audio.getCurrentChartTime()));
  }

  recordJudge(result) {
    this.lastJudgementResult = result;
    this.lastJudgementAt = this.state.currentTime;
    this.flushAudioCues();
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

  pauseGame(reason = "user") {
    if (!this.started || this.resultPending || this.failureSequence.active || this.isPaused) return;
    this.isPaused = true;
    this.pauseReason = reason;
    this.audio.pause();
  }

  async resumeGame() {
    if (!this.isPaused) return;
    playUiSound("resume");
    if (this.introActive) {
      this.isPaused = false;
      this.pauseReason = null;
      return;
    }
    try {
      await this.audio.resume();
      if (this.disposed) return;
      this.isPaused = false;
      this.pauseReason = null;
    } catch (error) {
      if (this.disposed) return;
      this.options.onError?.(error);
    }
  }

  goHome() {
    if (this.resultPending) return;
    this.resultPending = true;
    this.audio.stop();
    this.options.onHome?.();
  }

  startFailureSequence(kind = "failed") {
    if (this.failureSequence.active) return;
    this.failureSequence = { active: true, elapsed: 0, duration: ENDING_SEQUENCE_DURATION, kind };
    this.resetInputGesture();
    this.keyboardHoldCode = null;
    this.pendingHoldPointerId = null;
    if (kind === "failed") {
      this.audio.pause();
      this.audio.playEffect(GAME_OVER_EFFECT_SOURCE, {
        playbackRate: 0.76,
        volume: NOTE_MISS_EFFECT_VOLUME,
      });
    } else {
      playVictoryFanfare();
    }
  }

  updateFailureSequence(dt) {
    if (!this.failureSequence.active) return false;
    this.failureSequence.elapsed = Math.min(this.failureSequence.duration, this.failureSequence.elapsed + dt);
    return this.failureSequence.elapsed >= this.failureSequence.duration;
  }

  finishRun() {
    if (this.resultPending) return;
    this.resultPending = true;
    this.audio.stop();
    const summary = buildResultSummary(this.song, this.state, this.startTheme);
    this.options.onFinish?.(summary);
  }

  shutdown() {
    if (this.disposed) return;
    this.disposed = true;
    this.scale?.off("resize", this.handleResize, this);
    this.removeInputEvents();
    this.removeLifecycleEvents();
    if (this.textures?.exists(FRAME_TEXTURE_KEY)) {
      this.textures.remove(FRAME_TEXTURE_KEY);
    }
    this.frameTexture = null;
    this.frameImage = null;
    this.frameCtx = null;
    this.frameCanvas = null;
    this.audio?.destroy();
  }
}
