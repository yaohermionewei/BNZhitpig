import { AudioController } from "./AudioController.js";
import { createParkourChart } from "./chart.js";
import {
  createParkourState,
  setPlayerDragX,
  updateParkourState,
} from "./engine.js";
import { EFFECT_SOURCES, loadParkourSprites } from "./assets.js";
import {
  getControlRects,
  getLaneMetrics,
  pointHitsRect,
  renderParkourFrame,
} from "./renderer.js";
import { buildParkourResultSummary } from "./result.js";

const INTRO_DURATION = 0.72;
const CRITICAL_FONT_LOAD_TIMEOUT_MS = 1200;

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
    document.fonts.load('700 24px "PixelEnPrimary"', "PARKOUR"),
    document.fonts.load('400 24px "PixelZhFusion"', "兔子滑行"),
  ];
  const timeout = new Promise((resolve) => {
    window.setTimeout(() => resolve(false), CRITICAL_FONT_LOAD_TIMEOUT_MS);
  });

  return Promise.race([Promise.allSettled(fontLoads).then(() => true), timeout]);
}

export class ParkourRunner {
  constructor({ canvas, song, onFinish, onHome, onLoadingChange }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.song = song;
    this.chart = createParkourChart(song.chart);
    this.state = createParkourState(this.chart);
    this.audio = new AudioController();
    this.onFinish = onFinish;
    this.onHome = onHome;
    this.onLoadingChange = onLoadingChange;
    this.sprites = {};
    this.viewport = { width: 1, height: 1, dpr: 1 };
    this.frameHandle = 0;
    this.lastTimestamp = 0;
    this.started = false;
    this.isPaused = false;
    this.introActive = false;
    this.introElapsed = 0;
    this.resultPending = false;
    this.pointerId = null;
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
      waitForCriticalPixelFonts(),
      this.audio.preloadChart(this.chart),
      this.audio.preloadEffects([EFFECT_SOURCES.hit]),
      loadParkourSprites(this.song).then((sprites) => {
        this.sprites = sprites;
      }),
    ]);
    this.onLoadingChange?.(false);
    this.renderCurrentFrame();
  }

  start() {
    this.chart = createParkourChart(this.song.chart);
    this.state = createParkourState(this.chart);
    this.pointerId = null;
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
    this.ctx.fillStyle = "#101827";
    this.ctx.fillRect(0, 0, this.viewport.width, this.viewport.height);
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
      if (!this.disposed && !this.resultPending) {
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
        await this.audio.start(this.chart);
      }
      return;
    }

    const currentTime = this.audio.getCurrentChartTime();
    updateParkourState(this.state, currentTime, dt, this.state.playerLane);
    this.flushAudioCues();
    if (this.state.ended) {
      this.finishRun();
    }
  }

  flushAudioCues() {
    if (!this.state.audioCues.length) return;
    const cues = this.state.audioCues.slice();
    this.state.audioCues.length = 0;
    cues.forEach((cue) => {
      if (cue === "hit") {
        this.audio.playEffect(EFFECT_SOURCES.hit, { volume: 0.82 });
      }
    });
  }

  renderCurrentFrame() {
    if (!this.ctx || !this.viewport || !this.state) return;
    try {
      renderParkourFrame(this.ctx, this.viewport, this.state, {
        paused: this.isPaused,
        gameplayActive: this.started && !this.introActive,
        sceneTime: this.started
          ? this.introActive
            ? this.introElapsed
            : this.state.currentTime
          : performance.now() / 1000,
        sprites: this.sprites,
      });
    } catch (error) {
      console.error("parkour render failed", error);
      this.drawWarmupFrame();
    }
  }

  handlePointerDown(event) {
    event.preventDefault();
    this.canvas.setPointerCapture?.(event.pointerId);
    const point = getCanvasPoint(event, this.canvas);
    const rects = getControlRects(this.viewport);

    if (this.isPaused) {
      if (pointHitsRect(point, rects.pauseHome)) {
        this.goHome();
        return;
      }
      if (pointHitsRect(point, rects.pauseRestart)) {
        this.start();
        return;
      }
      if (pointHitsRect(point, rects.resume)) {
        this.resume();
        return;
      }
      return;
    }

    if (
      this.started &&
      !this.introActive &&
      pointHitsRect(point, rects.pause)
    ) {
      this.pause();
      return;
    }

    if (!this.started || this.introActive) return;
    this.pointerId = event.pointerId;
    this.state.dragActive = true;
    setPlayerDragX(this.state, point.x, getLaneMetrics(this.viewport));
  }

  handlePointerMove(event) {
    event.preventDefault();
    if (
      !this.started ||
      this.isPaused ||
      this.introActive ||
      this.pointerId !== event.pointerId
    ) {
      return;
    }
    const point = getCanvasPoint(event, this.canvas);
    setPlayerDragX(this.state, point.x, getLaneMetrics(this.viewport));
  }

  handlePointerUp(event) {
    event.preventDefault();
    if (this.pointerId === event.pointerId) {
      this.pointerId = null;
      this.state.dragActive = false;
    }
  }

  pause() {
    if (!this.started || this.isPaused) return;
    this.isPaused = true;
    this.audio.pause();
    this.renderCurrentFrame();
  }

  resume() {
    if (!this.started || !this.isPaused) return;
    this.isPaused = false;
    this.audio.resume();
    this.lastTimestamp = 0;
    this.startLoop();
  }

  goHome() {
    this.audio.stop();
    this.started = false;
    this.stopLoop();
    this.onHome?.();
  }

  finishRun() {
    if (this.resultPending) return;
    this.resultPending = true;
    this.audio.stop();
    this.stopLoop();
    this.onFinish?.(buildParkourResultSummary(this.song, this.state));
  }

  dispose() {
    this.disposed = true;
    this.stopLoop();
    this.audio.destroy();
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas.removeEventListener("pointercancel", this.handlePointerUp);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.resizeFallbackInstalled) {
      window.removeEventListener("resize", this.handleResize);
      this.resizeFallbackInstalled = false;
    }
  }
}
