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
  getCharacterAssetSources,
  loadImage,
  preloadResultAssets,
} from "../../game/assets.js";
import { buildResultSummary } from "../../game/result.js";
import { playUiSound, playVictoryFanfare } from "../../game/uiSounds.js";
import { setBunniesMediaSessionMetadata } from "../../game/mediaSession.js";
import { normalizeStartTheme } from "../../utils/start-theme.js";

const INTRO_DURATION = 0.82;
const ENDING_SEQUENCE_DURATION = 1.5;
const PREPARE_RESOURCE_TIMEOUT_MS = 20000;
const MAIN_AUDIO_PRELOAD_TIMEOUT_MS = 16000;
const DIRECTION_GESTURE_MIN_DISTANCE = 28;
const DIRECTION_GESTURE_AXIS_RATIO = 1.15;
const NOTE_HIT_EFFECT_VOLUME = 3.6;
const NOTE_MISS_EFFECT_VOLUME = 1.8;
const TEXTURE_LOAD_TIMEOUT_MS = 2500;
const GAME_OVER_EFFECT_SOURCE = "/assets/audio/miss.wav";
const PAUSE_MENU_BUTTON_LABELS = Object.freeze({
  home: "HOME",
  restart: "RETRY",
  resume: "GO",
});
const KEYBOARD_TAP_CODES = Object.freeze(["Space", "KeyJ", "KeyK", "KeyF", "KeyD"]);
const KEYBOARD_TAP_CODE_SET = new Set(KEYBOARD_TAP_CODES);
const KEYBOARD_DIRECTION_BY_CODE = Object.freeze({
  ArrowLeft: "left",
  ArrowRight: "right",
});

const ASSET_KEYS = Object.freeze({
  background: "sceneBackground",
  rabbit: "rabbitBack",
  rabbitHit: "rabbitBackHitSheet",
  rabbitWand: "rabbitBackWandSwing2Sheet",
  pig: "pigFront",
  pigLaunch: "pigFrontLaunch",
  pigLeft: "pigLeft",
  pigRight: "pigRight",
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatScore(score) {
  return String(Math.max(0, Math.round(score))).padStart(5, "0");
}

function getNoteProgress(note, currentTime, travelTime) {
  return clamp(1 - (note.time - currentTime) / travelTime, 0, 1.22);
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
    this.layout = null;
    this.controlRects = null;
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
    this.options.onLoadingStage?.("prepare:textures");
    await this.prepareTextures();
    if (this.disposed) return;
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

  async prepareTextures() {
    const sources = getCharacterAssetSources(this.startTheme);
    const textureKeys = Array.from(new Set(Object.values(ASSET_KEYS)));
    await Promise.all(
      textureKeys.map(async (key) => {
        await this.prepareTexture(key, sources[key]);
      })
    );
    if (!this.textures.exists("songCover")) {
      await this.prepareTexture("songCover", this.song.coverImageSrc);
    }
  }

  async prepareTexture(key, src) {
    if (this.textures.exists(key)) return;
    const safeSrc = getBrowserSafeAssetSource(src);
    try {
      const image = await withTimeout(
        loadImage(safeSrc),
        TEXTURE_LOAD_TIMEOUT_MS,
        `Texture timed out: ${key}`
      );
      if (this.disposed) return;
      if (image && !this.textures.exists(key)) {
        this.textures.addImage(key, image);
        return;
      }
    } catch (error) {
      if (this.disposed) return;
      console.warn("Using fallback texture", { key, src, error });
    }
    if (this.disposed) return;
    this.createFallbackTexture(key);
  }

  createFallbackTexture(key) {
    if (this.textures.exists(key)) return;
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xff7aa8, 1);
    graphics.fillRect(0, 0, 64, 64);
    graphics.lineStyle(4, 0xfff0c8, 1);
    graphics.strokeRect(2, 2, 60, 60);
    graphics.generateTexture(key, 64, 64);
    graphics.destroy();
  }

  createDisplay() {
    this.cameras.main.setBackgroundColor(this.startTheme === "light" ? "#f1c56d" : "#252435");
    this.background = this.add.image(0, 0, ASSET_KEYS.background).setOrigin(0.5);
    this.laneBase = this.add.rectangle(0, 0, 10, 10, 0x2b2430, 0.36);
    this.hitLine = this.add.rectangle(0, 0, 10, 4, 0xfff0ad, 0.9);
    this.rabbit = this.add.image(0, 0, ASSET_KEYS.rabbit).setOrigin(0.5, 1);
    this.pig = this.add.image(0, 0, ASSET_KEYS.pig).setOrigin(0.5, 1);
    this.noteLayer = this.add.container(0, 0);
    this.effectLayer = this.add.container(0, 0);
    this.noteSprites = new Map();
    this.hud = {
      score: this.add.text(0, 0, "00000", this.getHudTextStyle(24)),
      combo: this.add.text(0, 0, "COMBO 0", this.getHudTextStyle(16)),
      lives: this.add.text(0, 0, "LIFE 10/10", this.getHudTextStyle(16)),
      judgement: this.add.text(0, 0, "准备开砸", this.getHudTextStyle(24)).setOrigin(0.5),
      hint: this.add.text(0, 0, "", this.getHudTextStyle(13)).setOrigin(0.5),
      pauseButton: this.add.text(0, 0, "II", this.getHudTextStyle(20)).setOrigin(0.5),
      overlay: this.add.rectangle(0, 0, 10, 10, 0x111018, 0).setVisible(false),
      overlayTitle: this.add.text(0, 0, "", this.getHudTextStyle(28)).setOrigin(0.5).setVisible(false),
      overlaySub: this.add.text(0, 0, "", this.getHudTextStyle(15)).setOrigin(0.5).setVisible(false),
      pauseHome: this.add.text(0, 0, PAUSE_MENU_BUTTON_LABELS.home, this.getHudTextStyle(14)).setOrigin(0.5).setVisible(false),
      pauseRestart: this.add.text(0, 0, PAUSE_MENU_BUTTON_LABELS.restart, this.getHudTextStyle(14)).setOrigin(0.5).setVisible(false),
      pauseResume: this.add.text(0, 0, PAUSE_MENU_BUTTON_LABELS.resume, this.getHudTextStyle(14)).setOrigin(0.5).setVisible(false),
    };
    this.hud.pauseButton.setInteractive({ useHandCursor: true });
    this.hud.pauseButton.on("pointerdown", (pointer) => {
      pointer.event?.preventDefault?.();
      if (this.canPauseFromButton()) {
        playUiSound("tap");
        this.pauseGame("user");
      }
    });
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdown, this);
    this.handleResize(this.scale.gameSize);
  }

  getHudTextStyle(size) {
    return {
      fontFamily: '"PixelEnPrimary", "PixelZhFusion", monospace',
      fontSize: `${size}px`,
      color: "#fff0c8",
      stroke: "#342034",
      strokeThickness: 4,
      align: "center",
    };
  }

  handleResize() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const playWidth = Math.min(width * 0.82, 520);
    const topY = height * 0.18;
    const hitY = height * 0.72;
    this.layout = {
      width,
      height,
      centerX,
      centerY,
      laneLeft: centerX - playWidth / 2,
      laneRight: centerX + playWidth / 2,
      laneTop: topY,
      hitY,
      travelTime: 2.05,
    };
    this.controlRects = this.getControlRects(width, height);
    this.background.setPosition(centerX, centerY);
    const bgScale = Math.max(width / this.background.width, height / this.background.height);
    this.background.setScale(Number.isFinite(bgScale) ? bgScale : 1);
    this.laneBase.setPosition(centerX, (topY + hitY) / 2);
    this.laneBase.setSize(playWidth, Math.max(1, hitY - topY + 90));
    this.hitLine.setPosition(centerX, hitY);
    this.hitLine.setSize(playWidth, 4);
    this.rabbit.setPosition(centerX - playWidth * 0.28, height * 0.92).setScale(clamp(height / 760, 0.42, 0.72));
    this.pig.setPosition(centerX + playWidth * 0.28, hitY + 42).setScale(clamp(height / 760, 0.28, 0.48));
    this.hud.score.setPosition(18, 16).setOrigin(0, 0);
    this.hud.combo.setPosition(18, 50).setOrigin(0, 0);
    this.hud.lives.setPosition(width - 18, 18).setOrigin(1, 0);
    this.hud.pauseButton.setPosition(width - 32, height - 34);
    this.hud.judgement.setPosition(centerX, Math.max(88, topY - 48));
    this.hud.hint.setPosition(centerX, height - 30);
    this.hud.overlay.setPosition(centerX, centerY).setSize(width, height);
    this.hud.overlayTitle.setPosition(centerX, centerY - 26);
    this.hud.overlaySub.setPosition(centerX, centerY + 24);
    this.positionPauseMenuButtons();
  }

  getControlRects(width, height) {
    const centerX = Math.round(width / 2);
    const centerY = Math.round(height / 2);
    const buttonSize = Math.round(Math.min(56, Math.max(50, width * 0.145)));
    const buttonGap = 18;
    const rowWidth = buttonSize * 3 + buttonGap * 2;
    const rowLeft = Math.round(centerX - rowWidth / 2);
    const buttonTop = Math.round(centerY - buttonSize / 2);
    const secondLeft = rowLeft + buttonSize + buttonGap;
    const thirdLeft = secondLeft + buttonSize + buttonGap;
    const pauseSize = 26;
    const songCoverSize = Math.min(52, Math.max(38, width * 0.11));
    const pauseTop = Math.round(12 + songCoverSize / 2 - pauseSize / 2);
    return {
      pause: { left: width - 44, top: pauseTop, right: width - 18, bottom: pauseTop + pauseSize },
      pauseHome: { left: rowLeft, top: buttonTop, right: rowLeft + buttonSize, bottom: buttonTop + buttonSize },
      pauseRestart: { left: secondLeft, top: buttonTop, right: secondLeft + buttonSize, bottom: buttonTop + buttonSize },
      resume: { left: thirdLeft, top: buttonTop, right: thirdLeft + buttonSize, bottom: buttonTop + buttonSize },
    };
  }

  positionPauseMenuButtons() {
    if (!this.controlRects || !this.hud) return;
    this.positionTextInRect(this.hud.pauseHome, this.controlRects.pauseHome);
    this.positionTextInRect(this.hud.pauseRestart, this.controlRects.pauseRestart);
    this.positionTextInRect(this.hud.pauseResume, this.controlRects.resume);
  }

  positionTextInRect(textObject, rect) {
    textObject.setPosition((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2);
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
    this.clearNotes();
    this.setPauseOverlay(false);
  }

  update(_time, deltaMs) {
    if (this.disposed) return;
    const dt = Math.min(0.05, Math.max(0, deltaMs / 1000));
    if (!this.started || this.resultPending || this.isPaused) {
      this.renderFrame();
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
    this.renderFrame();
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

  renderFrame() {
    if (!this.layout || !this.state) return;
    this.renderNotes();
    this.renderHud();
    this.renderEffects();
  }

  renderNotes() {
    const { laneLeft, laneRight, laneTop, hitY, travelTime } = this.layout;
    const currentTime = this.introActive ? 0 : this.state.currentTime;
    const visibleIds = new Set();
    this.state.notes.forEach((note) => {
      if (note.judged && !note.holding) return;
      const progress = getNoteProgress(note, currentTime, travelTime);
      if (progress <= 0 || progress > 1.18) return;
      visibleIds.add(note.id);
      const sprite = this.getNoteSprite(note);
      const laneRatio = note.direction === "left" ? 0.22 : note.direction === "right" ? 0.78 : 0.5;
      const x = Phaser.Math.Linear(laneLeft, laneRight, laneRatio);
      const y = Phaser.Math.Linear(laneTop, hitY, progress);
      const scale = note.kind === "hold" ? 1.14 : note.direction ? 1.08 : 1;
      sprite.container.setPosition(x, y).setScale(scale).setAlpha(note.holding ? 0.72 : 1);
      if (note.kind === "hold") {
        const holdHeight = Math.max(28, ((note.endTime - note.time) / travelTime) * (hitY - laneTop));
        sprite.body.setVisible(true).setSize(16, holdHeight).setDisplaySize(16, holdHeight).setPosition(0, -holdHeight / 2);
      } else {
        sprite.body.setVisible(false);
      }
    });
    this.noteSprites.forEach((entry, id) => {
      if (!visibleIds.has(id)) {
        entry.container.setVisible(false);
      }
    });
  }

  getNoteSprite(note) {
    const existing = this.noteSprites.get(note.id);
    if (existing) {
      existing.container.setVisible(true);
      return existing;
    }
    const color = note.kind === "hold" ? 0x91e2ff : note.direction ? 0xffd166 : 0xff7aa8;
    const body = this.add.rectangle(0, 0, 16, 40, color, 0.42).setVisible(false);
    const circle = this.add.circle(0, 0, 18 * (note.size || 1), color, 1);
    const label = note.direction
      ? this.add.text(0, -2, note.direction === "left" ? "<" : ">", this.getHudTextStyle(16)).setOrigin(0.5)
      : this.add.text(0, -1, note.kind === "hold" ? "H" : "", this.getHudTextStyle(12)).setOrigin(0.5);
    const container = this.add.container(0, 0, [body, circle, label]);
    this.noteLayer.add(container);
    const entry = { container, body, circle, label };
    this.noteSprites.set(note.id, entry);
    return entry;
  }

  renderHud() {
    const state = this.state;
    this.hud.score.setText(formatScore(state.score));
    this.hud.combo.setText(`COMBO ${state.combo}`);
    this.hud.lives.setText(`LIFE ${state.lives}/${state.maxLives}`);
    this.hud.judgement.setText(state.judgementText || "");
    const hint = this.inputMode === "keyboard"
      ? "Click or SPACE/J/K/F/D · swipe or ←/→ · ESC pause"
      : "Tap/click to hit · swipe left/right for direction · hold and release";
    this.hud.hint.setText(this.introActive ? "准备..." : hint);
    if (this.failureSequence.active) {
      this.hud.judgement.setText(this.failureSequence.kind === "completed" ? "COMPLETED" : "FAILED");
    }
  }

  renderEffects() {
    const now = this.state.currentTime;
    const fresh = this.lastJudgementResult && now - this.lastJudgementAt < 0.16;
    this.rabbit.setTexture(fresh ? ASSET_KEYS.rabbitWand : ASSET_KEYS.rabbit);
    if (fresh && this.lastJudgementResult?.type !== "miss" && this.lastJudgementResult?.type !== "empty") {
      this.pig.setTexture(ASSET_KEYS.pigLaunch);
      this.pig.rotation = Math.sin(now * 18) * 0.08;
      return;
    }
    const best = peekBestNote(this.state, this.state.currentTime).note;
    if (best?.direction === "left") {
      this.pig.setTexture(ASSET_KEYS.pigLeft);
    } else if (best?.direction === "right") {
      this.pig.setTexture(ASSET_KEYS.pigRight);
    } else {
      this.pig.setTexture(ASSET_KEYS.pig);
    }
    this.pig.rotation = 0;
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

  canPauseFromButton() {
    return this.started && !this.introActive && !this.failureSequence.active && !this.resultPending && !this.isPaused;
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
    this.setPauseOverlay(true, reason);
  }

  async resumeGame() {
    if (!this.isPaused) return;
    playUiSound("resume");
    if (this.introActive) {
      this.isPaused = false;
      this.pauseReason = null;
      this.setPauseOverlay(false);
      return;
    }
    try {
      await this.audio.resume();
      if (this.disposed) return;
      this.isPaused = false;
      this.pauseReason = null;
      this.setPauseOverlay(false);
    } catch (error) {
      if (this.disposed) return;
      this.options.onError?.(error);
    }
  }

  setPauseOverlay(visible, reason = "user") {
    this.hud.overlay.setVisible(visible).setAlpha(visible ? 0.72 : 0);
    this.hud.overlayTitle.setVisible(visible).setText(reason === "system" ? "PAUSED" : "PAUSED");
    this.hud.overlaySub.setVisible(visible).setText(reason === "system" ? "点 GO 或 Enter 继续" : "HOME · RETRY · GO");
    this.hud.pauseHome.setVisible(visible);
    this.hud.pauseRestart.setVisible(visible);
    this.hud.pauseResume.setVisible(visible);
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

  clearNotes() {
    this.noteSprites.forEach((entry) => entry.container.destroy());
    this.noteSprites.clear();
  }

  shutdown() {
    if (this.disposed) return;
    this.disposed = true;
    this.scale?.off("resize", this.handleResize, this);
    this.removeInputEvents();
    this.removeLifecycleEvents();
    this.audio?.destroy();
  }
}
