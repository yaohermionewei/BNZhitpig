const AudioContextCtor =
  typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);

let sharedAudioContext = null;
const audioBufferCache = new Map();

function isRecoverableAudioState(state) {
  return state === "suspended" || state === "interrupted";
}

export async function getAudioContext() {
  if (!AudioContextCtor) {
    throw new Error("Web Audio is not supported in this browser.");
  }

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextCtor();
  }

  if (isRecoverableAudioState(sharedAudioContext.state)) {
    await sharedAudioContext.resume();
  }

  return sharedAudioContext;
}

export function unlockAudioForUserGesture() {
  if (!AudioContextCtor) return;

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextCtor();
  }

  if (isRecoverableAudioState(sharedAudioContext.state)) {
    sharedAudioContext.resume().catch(() => {
      // The game screen will surface the real preload/playback error if audio
      // cannot be started in this browser.
    });
  }
}

export async function loadAudioBuffer(src) {
  if (audioBufferCache.has(src)) {
    return audioBufferCache.get(src);
  }

  const audioContext = await getAudioContext();
  const loadPromise = fetch(src)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load audio: ${src}`);
      }
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer));

  audioBufferCache.set(src, loadPromise);

  try {
    return await loadPromise;
  } catch (error) {
    audioBufferCache.delete(src);
    throw error;
  }
}

export class AudioControllerWeb {
  constructor() {
    this.audioContext = null;
    this.chart = null;
    this.buffer = null;
    this.source = null;
    this.startedAt = 0;
    this.offset = 0;
    this.pausedAt = 0;
    this.playing = false;
    this.endedHandler = null;
    this.errorHandler = null;
    this.effectBuffers = new Map();
  }

  async preloadChart(chart) {
    this.audioContext = await this.ensureReady();
    this.buffer = await loadAudioBuffer(chart.audioSrc);
  }

  async preloadEffects(sources) {
    await Promise.all(
      sources.map(async (src) => {
        if (!this.effectBuffers.has(src)) {
          this.effectBuffers.set(src, await loadAudioBuffer(src));
        }
      })
    );
  }

  async start(chart) {
    this.destroySource();
    this.chart = chart;
    this.audioContext = await this.ensureReady();
    if (!this.buffer) {
      this.buffer = await loadAudioBuffer(chart.audioSrc);
    }
    const offset =
      Number.isFinite(chart.playbackStartTime) && chart.playbackStartTime >= 0
        ? chart.playbackStartTime
        : chart.audioStartTime || 0;
    return this.playFromOffset(offset);
  }

  async ensureReady() {
    this.audioContext = await getAudioContext();
    if (isRecoverableAudioState(this.audioContext.state)) {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  getContextState() {
    return this.audioContext?.state || sharedAudioContext?.state || "unavailable";
  }

  async playFromOffset(offset) {
    if (!this.buffer) {
      throw new Error("Cannot start playback before audio buffer is loaded.");
    }
    this.audioContext = await this.ensureReady();
    if (!this.audioContext || this.audioContext.state !== "running") {
      throw new Error(`Audio context is not running: ${this.getContextState()}`);
    }
    this.destroySource();
    const source = this.audioContext.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.audioContext.destination);
    source.onended = () => {
      if (!this.playing) return;
      this.playing = false;
      if (typeof this.endedHandler === "function") {
        this.endedHandler();
      }
    };
    this.offset = Math.max(0, offset || 0);
    this.startedAt = this.audioContext.currentTime - this.offset;
    this.pausedAt = 0;
    this.playing = true;
    this.source = source;
    try {
      source.start(0, this.offset);
      return true;
    } catch (error) {
      this.playing = false;
      this.source = null;
      if (typeof this.errorHandler === "function") {
        this.errorHandler(error);
      }
      throw error;
    }
  }

  getCurrentChartTime() {
    if (!this.audioContext || !this.chart) return 0;
    const audioTime = this.playing
      ? this.audioContext.currentTime - this.startedAt
      : this.pausedAt || this.offset || 0;
    return Math.max(0, audioTime - (this.chart.audioStartTime || 0));
  }

  async playEffect(src, options = {}) {
    const buffer = this.effectBuffers.get(src);
    if (!this.audioContext || !buffer) return;
    try {
      this.audioContext = await this.ensureReady();
      if (this.audioContext.state !== "running") return;
      const source = this.audioContext.createBufferSource();
      const gain = this.audioContext.createGain();
      source.buffer = buffer;
      source.playbackRate.value =
        typeof options.playbackRate === "number" && options.playbackRate > 0
          ? options.playbackRate
          : 1;
      gain.gain.value = typeof options.volume === "number" ? options.volume : 1;
      source.connect(gain);
      gain.connect(this.audioContext.destination);
      source.start(0);
    } catch (error) {
      // Effects are disposable; the main music resume path handles recoverable
      // audio failures with a paused game state.
    }
  }

  onEnded(handler) {
    this.endedHandler = handler;
  }

  onError(handler) {
    this.errorHandler = handler;
  }

  pause() {
    if (!this.playing) return;
    this.pausedAt = this.audioContext.currentTime - this.startedAt;
    this.offset = this.pausedAt;
    this.playing = false;
    this.destroySource();
  }

  async resume() {
    if (this.playing || !this.buffer) return;
    return this.playFromOffset(this.offset || this.pausedAt || 0);
  }

  stop() {
    this.playing = false;
    this.pausedAt = 0;
    this.offset = 0;
    this.destroySource();
  }

  destroySource() {
    if (!this.source) return;
    try {
      this.source.onended = null;
      this.source.stop();
    } catch (error) {
      // Source may already have ended.
    }
    this.source = null;
  }

  destroy() {
    this.stop();
    this.chart = null;
    this.buffer = null;
  }
}
