const AudioContextCtor =
  typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);

let sharedAudioContext = null;
const audioBufferCache = new Map();
const audioContextIds = new WeakMap();
let silentUnlockBuffer = null;
const AUDIO_UNLOCK_PULSE_GAIN = 0.00001;
const AUDIO_RESUME_TIMEOUT_MS = 700;
const AUDIO_CLOCK_PROBE_DELAY_MS = 160;
const AUDIO_BUFFER_LOAD_TIMEOUT_MS = 12000;
export const AUDIO_DEBUG_EVENT_NAME = "bunnies-audio-debug";
let runningContextPromise = null;
let nextAudioContextId = 1;

function isRecoverableAudioState(state) {
  return state === "suspended" || state === "interrupted";
}

function isAudioDebugEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debugAudio") === "1";
}

export function emitAudioDebug(source, detail = {}) {
  if (!isAudioDebugEnabled()) return;
  const payload = {
    source,
    at: Date.now(),
    sharedState: getSharedAudioContextState(),
    ...detail,
  };
  console.info("[audio-debug]", payload);
  if (typeof window !== "undefined" && typeof window.CustomEvent === "function") {
    window.dispatchEvent(new CustomEvent(AUDIO_DEBUG_EVENT_NAME, { detail: payload }));
  }
}

function getAudioErrorDetails(error) {
  if (!error) return {};
  return {
    errorName: error.name || "Error",
    errorMessage: error.message || String(error),
  };
}

function waitForAudioBufferTimeout(src) {
  return new Promise((_, reject) => {
    window.setTimeout(() => {
      reject(new Error(`Timed out loading audio: ${src}`));
    }, AUDIO_BUFFER_LOAD_TIMEOUT_MS);
  });
}

function waitForAudioResume(audioContext) {
  let timeoutId = 0;
  return Promise.race([
    audioContext.resume(),
    new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        const error = new Error(
          `AudioContext resume timed out after ${AUDIO_RESUME_TIMEOUT_MS}ms.`
        );
        error.name = "TimeoutError";
        reject(error);
      }, AUDIO_RESUME_TIMEOUT_MS);
    }),
  ]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function getOrCreateSharedAudioContext(source = "get-or-create") {
  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    sharedAudioContext = new AudioContextCtor();
    emitAudioDebug(source, {
      phase: "context-created",
      audio: getSharedAudioDebugSnapshot(),
    });
  }
  return sharedAudioContext;
}

function closeAudioContextQuietly(audioContext) {
  if (!audioContext || audioContext.state === "closed") return;
  try {
    audioContext.close?.().catch(() => {
      // Best-effort cleanup for stale browser-managed contexts.
    });
  } catch (error) {
    // Some browsers can throw while a context is already being torn down.
  }
}

function replaceSharedAudioContext(staleAudioContext, source) {
  emitAudioDebug(source, {
    phase: "context-replace",
    beforeState: staleAudioContext?.state || "unavailable",
  });
  if (sharedAudioContext === staleAudioContext) {
    sharedAudioContext = null;
  }
  closeAudioContextQuietly(staleAudioContext);
  return getOrCreateSharedAudioContext(source);
}

function getAudioBufferCacheKey(src, audioContext) {
  if (!audioContext) return `unknown:${src}`;
  if (!audioContextIds.has(audioContext)) {
    audioContextIds.set(audioContext, nextAudioContextId);
    nextAudioContextId += 1;
  }
  return `${audioContextIds.get(audioContext)}:${src}`;
}

function shouldReplaceAudioContext(result) {
  return (
    result?.state === "closed" ||
    result?.state === "interrupted" ||
    result?.errorName === "TimeoutError"
  );
}

function startSilentUnlockSourceSafely(audioContext, source) {
  try {
    startSilentUnlockSource(audioContext);
    return null;
  } catch (error) {
    emitAudioDebug(source, {
      phase: "unlock-pulse-failed",
      result: {
        ok: false,
        state: audioContext?.state || "unknown",
        ...getAudioErrorDetails(error),
      },
    });
    return error;
  }
}

async function tryResumeAudioContext(audioContext, source) {
  if (!audioContext) {
    return { ok: false, state: "unavailable" };
  }

  const beforeState = audioContext.state || "unknown";
  emitAudioDebug(source, {
    phase: "resume-before",
    beforeState,
    audio: getSharedAudioDebugSnapshot(audioContext),
  });

  if (beforeState === "running") {
    const result = { ok: true, state: "running" };
    emitAudioDebug(source, {
      phase: "resume-after",
      beforeState,
      afterState: audioContext.state,
      result,
      audio: getSharedAudioDebugSnapshot(audioContext),
    });
    return result;
  }

  if (beforeState === "closed") {
    const result = { ok: false, state: "closed" };
    emitAudioDebug(source, {
      phase: "resume-after",
      beforeState,
      afterState: "closed",
      result,
      audio: getSharedAudioDebugSnapshot(audioContext),
    });
    return result;
  }

  if (!isRecoverableAudioState(beforeState)) {
    const result = { ok: false, state: beforeState };
    emitAudioDebug(source, {
      phase: "resume-after",
      beforeState,
      afterState: audioContext.state || "unknown",
      result,
      audio: getSharedAudioDebugSnapshot(audioContext),
    });
    return result;
  }

  try {
    await waitForAudioResume(audioContext);
  } catch (error) {
    const result = {
      ok: false,
      state: audioContext.state || "unknown",
      ...getAudioErrorDetails(error),
    };
    emitAudioDebug(source, {
      phase: "resume-after",
      beforeState,
      afterState: audioContext.state || "unknown",
      result,
      audio: getSharedAudioDebugSnapshot(audioContext),
    });
    return result;
  }

  const result = {
    ok: audioContext.state === "running",
    state: audioContext.state || "unknown",
  };
  emitAudioDebug(source, {
    phase: "resume-after",
    beforeState,
    afterState: audioContext.state || "unknown",
    result,
    audio: getSharedAudioDebugSnapshot(audioContext),
  });
  return result;
}

async function recoverSharedAudioContext({
  source = "audio-context",
  playUnlockPulse = false,
  replaceOnFailure = true,
} = {}) {
  let audioContext = getOrCreateSharedAudioContext(source);
  let unlockPulseError = null;

  if (playUnlockPulse) {
    unlockPulseError = startSilentUnlockSourceSafely(audioContext, source);
  }

  let resumeResult = await tryResumeAudioContext(audioContext, source);
  if (resumeResult.ok) {
    if (playUnlockPulse) {
      startSilentUnlockSourceSafely(audioContext, source);
    }
    return {
      ok: true,
      state: audioContext.state,
      audioContext,
      replaced: false,
    };
  }

  if (replaceOnFailure && shouldReplaceAudioContext(resumeResult)) {
    audioContext = replaceSharedAudioContext(audioContext, source);
    if (playUnlockPulse) {
      unlockPulseError = unlockPulseError || startSilentUnlockSourceSafely(audioContext, source);
    }
    resumeResult = await tryResumeAudioContext(audioContext, `${source}:recreated`);
    if (resumeResult.ok) {
      if (playUnlockPulse) {
        startSilentUnlockSourceSafely(audioContext, source);
      }
      return {
        ok: true,
        state: audioContext.state,
        audioContext,
        replaced: true,
      };
    }
  }

  return {
    ok: false,
    state: resumeResult.state || audioContext.state || "unknown",
    ...getAudioErrorDetails(unlockPulseError),
    ...resumeResult,
    audioContext,
  };
}

async function ensureSharedAudioContextRunning(options = {}) {
  if (runningContextPromise) {
    const result = await runningContextPromise;
    if (result.ok || !options.playUnlockPulse) return result;
  }

  const promise = recoverSharedAudioContext(options);
  runningContextPromise = promise;
  try {
    return await promise;
  } finally {
    if (runningContextPromise === promise) {
      runningContextPromise = null;
    }
  }
}

function createAudioContextNotRunningError(result) {
  const error = new Error(`Audio context is not running: ${result?.state || "unknown"}`);
  error.name = result?.errorName || "AudioContextNotRunningError";
  error.audioState = result?.state || "unknown";
  if (result?.errorMessage) {
    error.resumeErrorMessage = result.errorMessage;
  }
  return error;
}

export function getSharedAudioContextState() {
  if (!AudioContextCtor) return "unavailable";
  return sharedAudioContext?.state || "uncreated";
}

export function getSharedAudioDebugSnapshot(audioContext = sharedAudioContext) {
  return {
    sharedState: getSharedAudioContextState(),
    contextState: audioContext?.state || "unavailable",
    currentTime:
      typeof audioContext?.currentTime === "number"
        ? Number(audioContext.currentTime.toFixed(4))
        : null,
    sampleRate: audioContext?.sampleRate || null,
  };
}

export async function getAudioContext(options = {}) {
  if (!AudioContextCtor) {
    throw new Error("Web Audio is not supported in this browser.");
  }

  const {
    requireRunning = true,
    source = "getAudioContext",
    playUnlockPulse = false,
    replaceOnFailure = true,
  } = options;

  let audioContext = getOrCreateSharedAudioContext(source);
  if (!requireRunning) {
    if (runningContextPromise) {
      const result = await runningContextPromise;
      audioContext = result.audioContext || getOrCreateSharedAudioContext(source);
    }
    if (audioContext.state === "interrupted") {
      audioContext = replaceSharedAudioContext(audioContext, source);
    }
    return audioContext;
  }

  const result = await ensureSharedAudioContextRunning({
    source,
    playUnlockPulse,
    replaceOnFailure,
  });
  if (!result.ok) {
    throw createAudioContextNotRunningError(result);
  }

  return result.audioContext;
}

export function unlockAudioForUserGesture() {
  if (!AudioContextCtor) return;
  primeAudioForUserGesture("unlockAudioForUserGesture").catch(() => {
    // The game screen will surface the real preload/playback error if audio
    // cannot be started in this browser.
  });
}

function getSilentUnlockBuffer(audioContext) {
  if (!silentUnlockBuffer || silentUnlockBuffer.sampleRate !== audioContext.sampleRate) {
    silentUnlockBuffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
    silentUnlockBuffer.getChannelData(0)[0] = 1;
  }
  return silentUnlockBuffer;
}

function startSilentUnlockSource(audioContext) {
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = getSilentUnlockBuffer(audioContext);
  gain.gain.value = AUDIO_UNLOCK_PULSE_GAIN;
  source.connect(gain);
  gain.connect(audioContext.destination);
  source.onended = () => {
    try {
      source.disconnect();
    } catch (error) {
      // Source may already be disconnected.
    }
    try {
      gain.disconnect();
    } catch (error) {
      // Gain may already be disconnected.
    }
  };
  source.start(0);
}

export async function primeAudioForUserGesture(source = "primeAudioForUserGesture") {
  if (!AudioContextCtor) {
    return {
      ok: false,
      state: "unavailable",
      errorName: "NotSupportedError",
      errorMessage: "Web Audio is not supported in this browser.",
    };
  }

  try {
    getOrCreateSharedAudioContext(source);
  } catch (error) {
    return {
      ok: false,
      state: "unavailable",
      ...getAudioErrorDetails(error),
    };
  }

  const result = await ensureSharedAudioContextRunning({
    source,
    playUnlockPulse: true,
    replaceOnFailure: true,
  });
  return result.ok
    ? { ok: true, state: result.state, replaced: !!result.replaced }
    : {
        ok: false,
        state: result.state,
        errorName: result.errorName,
        errorMessage: result.errorMessage,
      };
}

export async function loadAudioBuffer(src) {
  const audioContext = await getAudioContext({
    requireRunning: false,
    source: `load:${src}`,
  });
  const cacheKey = getAudioBufferCacheKey(src, audioContext);
  if (audioBufferCache.has(cacheKey)) {
    return audioBufferCache.get(cacheKey);
  }

  const loadPromise = Promise.race([
    fetch(src)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load audio: ${src}`);
        }
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer)),
    waitForAudioBufferTimeout(src),
  ]);

  audioBufferCache.set(cacheKey, loadPromise);

  try {
    return await loadPromise;
  } catch (error) {
    audioBufferCache.delete(cacheKey);
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
    this.playbackRequestId = 0;
  }

  async preloadChart(chart) {
    this.audioContext = await getAudioContext({
      requireRunning: false,
      source: "preload-chart",
    });
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
    const playbackRequestId = this.beginPlaybackRequest();
    this.destroySource();
    this.chart = chart;
    const previousAudioContext = this.audioContext;
    this.audioContext = await this.ensureReady("audio.start");
    if (!this.isPlaybackRequestCurrent(playbackRequestId)) {
      return false;
    }
    if (previousAudioContext !== this.audioContext) {
      this.buffer = null;
    }
    if (!this.buffer) {
      const buffer = await loadAudioBuffer(chart.audioSrc);
      if (!this.isPlaybackRequestCurrent(playbackRequestId)) {
        return false;
      }
      this.buffer = buffer;
    }
    const offset =
      Number.isFinite(chart.playbackStartTime) && chart.playbackStartTime >= 0
        ? chart.playbackStartTime
        : chart.audioStartTime || 0;
    return this.playFromOffset(offset, playbackRequestId);
  }

  async ensureBufferForCurrentContext(playbackRequestId = null) {
    if (!this.chart?.audioSrc) {
      throw new Error("Cannot load audio buffer before a chart is assigned.");
    }
    const buffer = await loadAudioBuffer(this.chart.audioSrc);
    if (
      playbackRequestId !== null &&
      !this.isPlaybackRequestCurrent(playbackRequestId)
    ) {
      return null;
    }
    this.buffer = buffer;
    return this.buffer;
  }

  async ensureReady(source = "audio.ensureReady") {
    this.audioContext = await getAudioContext({
      requireRunning: true,
      source,
      playUnlockPulse: true,
      replaceOnFailure: true,
    });
    return this.audioContext;
  }

  getContextState() {
    return this.audioContext?.state || sharedAudioContext?.state || "unavailable";
  }

  async playFromOffset(offset, playbackRequestId = this.beginPlaybackRequest()) {
    if (!this.buffer) {
      await this.ensureBufferForCurrentContext(playbackRequestId);
      if (!this.isPlaybackRequestCurrent(playbackRequestId)) {
        return false;
      }
      if (!this.buffer) {
        throw new Error("Cannot start playback before audio buffer is loaded.");
      }
    }
    emitAudioDebug("audio.playFromOffset", {
      phase: "before",
      requestedOffset: offset,
      controller: this.getDebugSnapshot(),
    });
    const previousAudioContext = this.audioContext;
    this.audioContext = await this.ensureReady("audio.playFromOffset");
    if (!this.isPlaybackRequestCurrent(playbackRequestId)) {
      return false;
    }
    if (previousAudioContext !== this.audioContext) {
      await this.ensureBufferForCurrentContext(playbackRequestId);
      if (!this.isPlaybackRequestCurrent(playbackRequestId)) {
        return false;
      }
    }
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
      emitAudioDebug("audio.playFromOffset", {
        phase: "after",
        requestedOffset: offset,
        controller: this.getDebugSnapshot(),
      });
      this.probeAudioClock("audio.playFromOffset");
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
      this.audioContext = await this.ensureReady("audio.effect");
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
    this.invalidatePlaybackRequests();
    if (!this.playing) return;
    this.pausedAt = this.audioContext.currentTime - this.startedAt;
    this.offset = this.pausedAt;
    this.playing = false;
    this.destroySource();
  }

  async resume() {
    if (this.playing) return true;
    if (!this.buffer && !this.chart?.audioSrc) {
      throw new Error("Cannot resume playback before an audio chart is assigned.");
    }
    emitAudioDebug("audio.resume", {
      phase: "before",
      controller: this.getDebugSnapshot(),
    });
    return this.playFromOffset(this.offset || this.pausedAt || 0);
  }

  stop() {
    this.invalidatePlaybackRequests();
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

  beginPlaybackRequest() {
    this.playbackRequestId += 1;
    return this.playbackRequestId;
  }

  invalidatePlaybackRequests() {
    this.playbackRequestId += 1;
    return this.playbackRequestId;
  }

  isPlaybackRequestCurrent(playbackRequestId) {
    return playbackRequestId === this.playbackRequestId;
  }

  getDebugSnapshot() {
    return {
      ...getSharedAudioDebugSnapshot(this.audioContext || sharedAudioContext),
      playing: !!this.playing,
      offset: Number((this.offset || 0).toFixed(4)),
      pausedAt: Number((this.pausedAt || 0).toFixed(4)),
      startedAt: Number((this.startedAt || 0).toFixed(4)),
      hasSource: !!this.source,
      hasBuffer: !!this.buffer,
      playbackRequestId: this.playbackRequestId,
      chartTime: Number(this.getCurrentChartTime().toFixed(4)),
    };
  }

  probeAudioClock(source) {
    if (!isAudioDebugEnabled() || !this.audioContext) return;
    const audioContext = this.audioContext;
    const before = audioContext.currentTime;
    window.setTimeout(() => {
      if (!audioContext || audioContext.state === "closed") return;
      const after = audioContext.currentTime;
      emitAudioDebug(source, {
        phase: "clock-probe",
        result: {
          ok: after > before,
          state: audioContext.state || "unknown",
        },
        clock: {
          before: Number(before.toFixed(4)),
          after: Number(after.toFixed(4)),
          delta: Number((after - before).toFixed(4)),
        },
        controller: this.getDebugSnapshot(),
      });
    }, AUDIO_CLOCK_PROBE_DELAY_MS);
  }
}
