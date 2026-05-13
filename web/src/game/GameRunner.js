import {
  createGameState,
  judgeDirection,
  judgeTap,
  peekBestNote,
  releaseHold,
  updateGameState,
} from "./engine.js";
import { renderFrame, getControlRects } from "./renderer.js";
import { AudioControllerWeb } from "./AudioControllerWeb.js";
import { EFFECT_AUDIO_POOL_SIZES, loadCharacterSprites } from "./assets.js";
import { buildResultSummary } from "./result.js";
import { normalizeStartTheme, getStartThemeLoadingColors } from "../utils/start-theme.js";

const INTRO_DURATION = 0.82;
const FAILURE_SEQUENCE_DURATION = 0.46;
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  if (max <= min) return min;
  return min + Math.random() * (max - min);
}

function createFailureSequenceState() {
  return { active: false, elapsed: 0, duration: 1 };
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

export class GameRunner {
  constructor({ canvas, song, startTheme, onFinish, onLoadingChange }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.song = song;
    this.startTheme = normalizeStartTheme(startTheme);
    this.onFinish = onFinish;
    this.onLoadingChange = onLoadingChange;
    this.audio = new AudioControllerWeb();
    this.state = createGameState(song.chart);
    this.characterSprites = {};
    this.viewport = { width: 1, height: 1, dpr: 1 };
    this.frameHandle = 0;
    this.lastTimestamp = 0;
    this.started = false;
    this.isPaused = false;
    this.introActive = false;
    this.introElapsed = 0;
    this.failureSequence = createFailureSequenceState();
    this.crowdMotion = createCrowdMotionState();
    this.rabbitWandAnimation = createRabbitWandAnimationState();
    this.inputGesture = null;
    this.resultPending = false;
    this.disposed = false;
    this.resizeObserver = null;
    this.resizeFallbackInstalled = false;
    this.handleResize = this.handleResize.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
  }

  async prepare() {
    this.onLoadingChange?.(true);
    this.installEvents();
    this.installResizeObserver();
    this.resizeCanvas();
    this.drawWarmupFrame();
    await Promise.all([
      this.audio.preloadChart(this.song.chart),
      this.audio.preloadEffects(Object.keys(EFFECT_AUDIO_POOL_SIZES)),
      loadCharacterSprites(this.startTheme).then((sprites) => {
        this.characterSprites = sprites;
      }),
    ]);
    this.onLoadingChange?.(false);
    this.renderCurrentFrame();
  }

  start() {
    this.state = createGameState(this.song.chart);
    this.failureSequence = createFailureSequenceState();
    this.crowdMotion = createCrowdMotionState();
    this.rabbitWandAnimation = createRabbitWandAnimationState();
    this.resetInputGesture();
    this.started = true;
    this.isPaused = false;
    this.introActive = true;
    this.introElapsed = 0;
    this.resultPending = false;
    this.lastTimestamp = 0;
    this.stopLoop();
    this.startLoop();
  }

  installEvents() {
    this.canvas.addEventListener("pointerdown", this.handlePointerDown, { passive: false });
    this.canvas.addEventListener("pointermove", this.handlePointerMove, { passive: false });
    this.canvas.addEventListener("pointerup", this.handlePointerUp, { passive: false });
    this.canvas.addEventListener("pointercancel", this.handlePointerUp, { passive: false });
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
      this.update(dt);
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

  async update(dt) {
    if (!this.started || this.isPaused) return;

    if (this.introActive) {
      this.introElapsed = Math.min(INTRO_DURATION, this.introElapsed + dt);
      if (this.introElapsed >= INTRO_DURATION) {
        this.introActive = false;
        await this.audio.start(this.song.chart);
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
        this.finishRun();
      }
    }
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
        selectedSongId: this.song.id,
        characterSprites: this.characterSprites,
        crowdMotion: this.crowdMotion,
        audioDebugText: "",
        introProgress,
        sceneTime,
        showLaneBase: false,
        gameplayActive: this.started && !this.introActive,
        rabbitWandAnimation: this.rabbitWandAnimation,
        rabbitWandSwingVariant: RABBIT_WAND_SWING_VARIANT,
        startTheme: this.startTheme,
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

  startFailureSequence() {
    if (this.failureSequence.active) return;
    this.failureSequence.active = true;
    this.failureSequence.elapsed = 0;
    this.failureSequence.duration = FAILURE_SEQUENCE_DURATION;
    this.resetInputGesture();
    this.audio.pause();
    this.audio.playEffect(GAME_OVER_EFFECT_SOURCE, { playbackRate: 0.76, volume: 1 });
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
      if (cue === "hit") this.audio.playEffect("/assets/audio/hit.wav");
      if (cue === "miss") this.audio.playEffect("/assets/audio/miss.wav");
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
        this.pause();
        return;
      }
    }

    if (this.isPaused) {
      if (this.pointHitsRect(point, rects.pauseRestart)) {
        this.start();
        return;
      }
      if (this.pointHitsRect(point, rects.resume)) {
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

  pause() {
    if (!this.started || this.isPaused) return;
    this.isPaused = true;
    this.lastTimestamp = 0;
    this.resetInputGesture();
    this.audio.pause();
    this.stopLoop();
    this.renderCurrentFrame();
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTimestamp = 0;
    this.resetInputGesture();
    this.audio.resume();
    this.startLoop();
  }

  finishRunIfNeeded() {
    if (this.started && this.state?.ended) {
      if (this.state.failed) {
        if (!this.failureSequence.active) this.startFailureSequence();
        return false;
      }
      this.finishRun();
      return true;
    }
    return false;
  }

  finishRun() {
    if (this.resultPending) return;
    this.resultPending = true;
    this.started = false;
    this.isPaused = true;
    this.stopLoop();
    this.audio.destroy();
    const summary = buildResultSummary(this.song, this.state, this.startTheme);
    this.onFinish?.(summary);
  }

  dispose() {
    this.disposed = true;
    this.stopLoop();
    this.audio.destroy();
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas.removeEventListener("pointercancel", this.handlePointerUp);
    this.resizeObserver?.disconnect();
    if (this.resizeFallbackInstalled) {
      window.removeEventListener("resize", this.handleResize);
    }
  }
}
