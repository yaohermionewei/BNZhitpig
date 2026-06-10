import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDefaultSong } from "./game/songs.js";
import { getStartTheme, setStartTheme, START_THEMES } from "./utils/start-theme.js";
import StageShell from "./screens/StageShell.jsx";
import StartScreen from "./screens/StartScreen.jsx";
import {
  AUDIO_DEBUG_EVENT_NAME,
  getSharedAudioContextState,
  primeAudioForUserGesture,
} from "./game/AudioControllerWeb.js";
import { resultVoiceClips } from "./game/resultVoiceClips.js";
import {
  playResultVoiceClip,
  stopResultVoicePlayback,
} from "./game/resultVoicePlayback.js";
import { LOADING_COPY } from "./utils/loading-copy.js";
import { trackEvent, trackPageView } from "./utils/analytics.js";
import { setBunniesMediaSessionMetadata } from "./game/mediaSession.js";

function createLazyModuleLoader(importModule) {
  let modulePromise = null;
  return function loadModule() {
    if (!modulePromise) {
      modulePromise = importModule().catch((error) => {
        modulePromise = null;
        throw error;
      });
    }
    return modulePromise;
  };
}

const loadGameScreen = createLazyModuleLoader(() => import("./screens/GameScreen.jsx"));
const loadResultScreen = createLazyModuleLoader(() => import("./screens/ResultScreen.jsx"));
const loadSupportScreen = createLazyModuleLoader(() => import("./screens/SupportScreen.jsx"));

const GameScreen = lazy(loadGameScreen);
const ResultScreen = lazy(loadResultScreen);
const SupportScreen = lazy(loadSupportScreen);

const LoadingShimmerDebugPreview = import.meta.env.DEV
  ? lazy(() => import("./screens/LoadingShimmerDebugPreview.jsx"))
  : null;
const EndingOverlayDebugPreview = import.meta.env.DEV
  ? lazy(() => import("./screens/EndingOverlayDebugPreview.jsx"))
  : null;
const ResultVoiceDebugPreview = import.meta.env.DEV
  ? lazy(() => import("./screens/ResultVoiceDebugPreview.jsx"))
  : null;
const AMBIENT_BGM_SRC = "/assets/audio/home-loop-bgm-quiet.m4a";
const AMBIENT_BGM_VOLUME = 1;
const AMBIENT_BGM_UNLOCK_EVENTS = ["pointerdown", "touchstart", "click", "keydown"];
const RESULT_VOICE_DELAY_MS = 0;
const RESULT_VOICE_UNLOCK_EVENTS = ["pointerdown", "touchstart", "click", "keydown"];
const AUDIO_DEBUG_QUERY_KEY = "debugAudio";
const AUDIO_DEBUG_ENTRY_LIMIT = 10;
const DEBUG_SUPPORT_SCREEN_KEY = "debugScreen";
const DEBUG_SUPPORT_SCREEN_VALUE = "support";
const DEBUG_SUPPORT_THEME_KEY = "debugStartTheme";
const DEBUG_SUPPORT_QR_LOADING_KEY = "debugSupportQrLoading";

function preloadModule(loadModule, label) {
  loadModule().catch((error) => {
    console.warn(`Failed to preload ${label}`, error);
  });
}

function scheduleIdlePreload(loadModule, label, timeout = 2500) {
  if (typeof window === "undefined") return undefined;
  let cancelled = false;

  function runPreload() {
    if (!cancelled) preloadModule(loadModule, label);
  }

  if (typeof window.requestIdleCallback === "function") {
    const idleId = window.requestIdleCallback(runPreload, { timeout });
    return () => {
      cancelled = true;
      window.cancelIdleCallback?.(idleId);
    };
  }

  const timerId = window.setTimeout(runPreload, Math.min(timeout, 900));
  return () => {
    cancelled = true;
    window.clearTimeout(timerId);
  };
}

function ScreenFallback({ theme }) {
  return <div className={`screen screen-${theme}`} />;
}

function getLoadingShimmerDebugPreviewMode() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("debugLoading") === "1";
}

function getEndingOverlayDebugPreviewMode() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return null;
  }

  const mode = new URLSearchParams(window.location.search).get("debugEnding");
  return mode === "completed" || mode === "failed" ? mode : null;
}

function getResultVoiceDebugPreviewMode() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("debugResultVoices") === "1";
}

function getSupportScreenDebugMode() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get(DEBUG_SUPPORT_SCREEN_KEY) === DEBUG_SUPPORT_SCREEN_VALUE;
}

function getSupportQrLoadingDebugMode() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get(DEBUG_SUPPORT_QR_LOADING_KEY) === "1";
}

function getStartThemeDebugOverride() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return null;
  }

  const theme = new URLSearchParams(window.location.search).get(DEBUG_SUPPORT_THEME_KEY);
  return theme === START_THEMES.dark || theme === START_THEMES.light ? theme : null;
}

function getDebugResultVoiceAmbientEnabled() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("debugBgm") !== "0";
}

function getAudioDebugEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(AUDIO_DEBUG_QUERY_KEY) === "1";
}

function getAudioDebugPanelEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(AUDIO_DEBUG_QUERY_KEY) === "1";
}

function getAmbientBgmArea(
  screen,
  debugLoadingMode,
  debugEndingMode,
  debugResultVoicesMode
) {
  if (debugResultVoicesMode) {
    return getDebugResultVoiceAmbientEnabled() ? "result" : "off";
  }
  if (debugLoadingMode || debugEndingMode) return "off";
  if (screen === "start" || screen === "support") return "start";
  return screen === "result" ? screen : "off";
}

function useAmbientBgm(playbackArea) {
  const audioRef = useRef(null);
  const previousPlaybackAreaRef = useRef("off");

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const shouldPlay = playbackArea !== "off";
    let cancelled = false;
    let unlockBound = false;
    const audio =
      audioRef.current ||
      Object.assign(new Audio(AMBIENT_BGM_SRC), {
        loop: true,
        preload: "auto",
        volume: AMBIENT_BGM_VOLUME,
      });
    audioRef.current = audio;

    function removeUnlockListeners() {
      if (!unlockBound) return;
      AMBIENT_BGM_UNLOCK_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserUnlock);
      });
      unlockBound = false;
    }

    function bindUnlockListeners() {
      if (unlockBound || cancelled || !shouldPlay) return;
      AMBIENT_BGM_UNLOCK_EVENTS.forEach((eventName) => {
        window.addEventListener(eventName, handleUserUnlock, { once: true, passive: true });
      });
      unlockBound = true;
    }

    function playAmbientBgm() {
      setBunniesMediaSessionMetadata();
      audio.volume = AMBIENT_BGM_VOLUME;
      const playPromise = audio.play();
      if (!playPromise || typeof playPromise.then !== "function") {
        return;
      }

      playPromise
        .then(removeUnlockListeners)
        .catch(() => {
          if (!cancelled && shouldPlay) {
            bindUnlockListeners();
          }
        });
    }

    function handleUserUnlock() {
      removeUnlockListeners();
      if (cancelled || !shouldPlay) return;
      playAmbientBgm();
    }

    if (shouldPlay) {
      if (previousPlaybackAreaRef.current !== playbackArea) {
        audio.pause();
        audio.currentTime = 0;
      }
      playAmbientBgm();
    } else {
      removeUnlockListeners();
      audio.pause();
      audio.currentTime = 0;
    }
    previousPlaybackAreaRef.current = playbackArea;

    return () => {
      cancelled = true;
      removeUnlockListeners();
    };
  }, [playbackArea]);
}

let resultVoiceClipBag = [];
let lastResultVoiceClipSrc = "";

function shuffleResultVoiceClips() {
  const bag = [...resultVoiceClips];

  for (let index = bag.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
  }

  if (bag.length > 1 && bag[0]?.src === lastResultVoiceClipSrc) {
    const swapIndex = bag.findIndex((clip) => clip?.src !== lastResultVoiceClipSrc);
    if (swapIndex > 0) {
      [bag[0], bag[swapIndex]] = [bag[swapIndex], bag[0]];
    }
  }

  return bag;
}

function getNextResultVoiceClip() {
  if (resultVoiceClips.length <= 0) return null;

  if (resultVoiceClipBag.length <= 0) {
    resultVoiceClipBag = shuffleResultVoiceClips();
  }

  const clip = resultVoiceClipBag.shift() || null;
  lastResultVoiceClipSrc = clip?.src || "";
  return clip;
}

function useResultVoice(screen, resultKey) {
  const playbackRef = useRef(null);
  const pendingClipRef = useRef(null);
  const lastPlayedKeyRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const shouldPlay = screen === "result" && resultKey;
    let cancelled = false;
    let unlockBound = false;
    let playTimer = 0;

    function removeUnlockListeners() {
      if (!unlockBound) return;
      RESULT_VOICE_UNLOCK_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserUnlock);
      });
      unlockBound = false;
    }

    function stopResultVoice() {
      window.clearTimeout(playTimer);
      removeUnlockListeners();
      pendingClipRef.current = null;
      stopResultVoicePlayback(playbackRef.current);
      playbackRef.current = null;
    }

    function bindUnlockListeners() {
      if (unlockBound || cancelled || !shouldPlay) return;
      RESULT_VOICE_UNLOCK_EVENTS.forEach((eventName) => {
        window.addEventListener(eventName, handleUserUnlock, { once: true, passive: true });
      });
      unlockBound = true;
    }

    async function playResultVoice(clip) {
      try {
        if (!clip?.src) return;
        const playback = await playResultVoiceClip(clip, (endedPlayback) => {
          if (playbackRef.current === endedPlayback) {
            playbackRef.current = null;
          }
        });
        if (cancelled || !shouldPlay) {
          stopResultVoicePlayback(playback);
          return;
        }
        if (!playback) {
          bindUnlockListeners();
          return;
        }
        stopResultVoice();
        playbackRef.current = playback;
        removeUnlockListeners();
      } catch (error) {
          if (!cancelled && shouldPlay) {
            bindUnlockListeners();
          }
      }
    }

    function handleUserUnlock() {
      removeUnlockListeners();
      if (cancelled || !shouldPlay) return;
      const clip = pendingClipRef.current;
      if (clip?.src) {
        playResultVoice(clip);
      }
    }

    if (!shouldPlay) {
      stopResultVoice();
      return () => {
        cancelled = true;
        stopResultVoice();
      };
    }

    if (lastPlayedKeyRef.current === resultKey) {
      return () => {
        cancelled = true;
        removeUnlockListeners();
      };
    }

    stopResultVoice();
    const clip = getNextResultVoiceClip();
    lastPlayedKeyRef.current = resultKey;
    if (!clip?.src) {
      return () => {
        cancelled = true;
        removeUnlockListeners();
      };
    }

    pendingClipRef.current = clip;
    playTimer = window.setTimeout(() => {
      if (!cancelled) {
        playResultVoice(clip);
      }
    }, RESULT_VOICE_DELAY_MS);

    return () => {
      cancelled = true;
      stopResultVoice();
    };
  }, [screen, resultKey]);
}

function useVisualViewportCssVars() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return undefined;
    }

    const root = document.documentElement;
    let animationFrame = 0;

    function chooseViewportSize(visualSize, fallbackSize) {
      if (visualSize >= 120 || !fallbackSize) {
        return visualSize || fallbackSize || 0;
      }

      return fallbackSize || visualSize || 0;
    }

    function readViewportMetrics() {
      const visualViewport = window.visualViewport;
      const fallbackWidth = window.innerWidth || root.clientWidth || 0;
      const fallbackHeight = window.innerHeight || root.clientHeight || 0;
      const visualWidth = visualViewport?.width || 0;
      const visualHeight = visualViewport?.height || 0;
      const width = chooseViewportSize(visualWidth, fallbackWidth);
      const height = chooseViewportSize(visualHeight, fallbackHeight);
      const offsetTop = visualViewport?.offsetTop || 0;
      const offsetLeft = visualViewport?.offsetLeft || 0;

      return {
        width: Math.max(1, width),
        height: Math.max(1, height),
        offsetTop: Math.max(0, offsetTop),
        offsetLeft: Math.max(0, offsetLeft),
      };
    }

    function updateViewportVars() {
      animationFrame = 0;
      const { width, height, offsetTop, offsetLeft } = readViewportMetrics();

      root.style.setProperty("--app-visual-width", `${width}px`);
      root.style.setProperty("--app-visual-height", `${height}px`);
      root.style.setProperty("--app-visual-vw", `${width / 100}px`);
      root.style.setProperty("--app-visual-vh", `${height / 100}px`);
      root.style.setProperty("--app-visual-offset-top", `${offsetTop}px`);
      root.style.setProperty("--app-visual-offset-left", `${offsetLeft}px`);
    }

    function scheduleViewportUpdate() {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateViewportVars);
    }

    updateViewportVars();

    window.addEventListener("resize", scheduleViewportUpdate, { passive: true });
    window.addEventListener("orientationchange", scheduleViewportUpdate, { passive: true });
    window.visualViewport?.addEventListener("resize", scheduleViewportUpdate, {
      passive: true,
    });
    window.visualViewport?.addEventListener("scroll", scheduleViewportUpdate, {
      passive: true,
    });

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener("resize", scheduleViewportUpdate);
      window.removeEventListener("orientationchange", scheduleViewportUpdate);
      window.visualViewport?.removeEventListener("resize", scheduleViewportUpdate);
      window.visualViewport?.removeEventListener("scroll", scheduleViewportUpdate);
    };
  }, []);
}

function toAnalyticsNumber(value) {
  const number =
    typeof value === "string" ? Number.parseFloat(value.replace(/,/g, "")) : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getSongAnalyticsParams(song, startTheme) {
  return {
    song_id: song?.id || "",
    song_title: song?.title || "",
    theme: startTheme || "",
  };
}

function getResultAnalyticsParams(summary) {
  if (!summary) return {};

  return {
    rank: summary.rank || "",
    failed: Boolean(summary.failed),
    score: toAnalyticsNumber(summary.scoreDisplay),
    accuracy: toAnalyticsNumber(summary.accuracyDisplay),
    perfect: toAnalyticsNumber(summary.perfect),
    good: toAnalyticsNumber(summary.good),
    miss: toAnalyticsNumber(summary.miss),
    max_combo: toAnalyticsNumber(summary.maxCombo),
    total_notes: toAnalyticsNumber(summary.totalNotes),
  };
}

function normalizeGameInputMode(inputMode) {
  return inputMode === "keyboard" ? "keyboard" : "touch";
}

function getUserActivationSnapshot() {
  if (typeof navigator === "undefined" || !navigator.userActivation) {
    return null;
  }

  return {
    isActive: navigator.userActivation.isActive,
    hasBeenActive: navigator.userActivation.hasBeenActive,
  };
}

function getBrowserAudioDebugInfo() {
  if (typeof navigator === "undefined") {
    return {
      userAgent: "",
      isWeChatLike: false,
      isWeComLike: false,
      userActivation: null,
    };
  }

  const userAgent = navigator.userAgent || "";
  return {
    userAgent,
    isWeChatLike: /MicroMessenger/i.test(userAgent),
    isWeComLike: /wxwork|WeCom/i.test(userAgent),
    userActivation: getUserActivationSnapshot(),
  };
}

function formatDebugActivation(activation) {
  if (!activation) return "n/a";
  return `${activation.isActive ? "active" : "inactive"}/${activation.hasBeenActive ? "used" : "fresh"}`;
}

function formatAudioDebugEntry(entry) {
  if (!entry) return "";

  const result = entry.result || {};
  const runner = entry.runner || {};
  const audio = entry.audio || runner.audio || {};
  const beforeActivation = formatDebugActivation(entry.before?.userActivation);
  const afterActivation = formatDebugActivation(entry.after?.userActivation);
  const errorText =
    result.errorName || result.errorMessage
      ? `\nerr: ${result.errorName || "Error"} ${result.errorMessage || ""}`.trimEnd()
      : "";
  const runnerText = entry.runner
    ? `\nrunner paused=${String(runner.isPaused)} starting=${String(runner.startingAudio)} intro=${String(runner.introActive)} pending=${String(runner.pendingAudioStart)} frame=${runner.frameHandle || 0}`
    : "";
  const audioText =
    entry.audio || runner.audio
      ? `\naudio ${audio.contextState || audio.sharedState || "unknown"} t=${audio.currentTime ?? "n/a"} playing=${String(Boolean(audio.playing))} offset=${audio.offset ?? "n/a"} pausedAt=${audio.pausedAt ?? "n/a"} source=${String(Boolean(audio.hasSource))}`
      : "";
  const phaseText = entry.phase ? `phase=${entry.phase}` : "";

  return [
    `#${entry.id} ${entry.source}`,
    [phaseText, `${entry.beforeState || entry.sharedState || "n/a"} -> ${entry.afterState || entry.sharedState || "n/a"}`]
      .filter(Boolean)
      .join(" "),
    result.ok !== undefined || result.state
      ? `ok=${String(Boolean(result.ok))} state=${result.state || "unknown"} ${entry.elapsedMs ?? ""}ms`
      : "",
    `activation ${beforeActivation} -> ${afterActivation}`,
    `wechat=${String(Boolean(entry.after?.isWeChatLike))} wecom=${String(Boolean(entry.after?.isWeComLike))}`,
    runnerText,
    audioText,
    errorText,
  ]
    .filter(Boolean)
    .join("\n");
}

function AudioDebugPanel({ entries, currentState }) {
  const latestEntry = entries[entries.length - 1] || null;
  const latestResult = latestEntry?.result || null;
  const details = entries.length
    ? entries.map(formatAudioDebugEntry).join("\n\n")
    : "No audio prime attempts yet.";

  function handleCopy() {
    const payload = JSON.stringify(entries, null, 2);
    navigator.clipboard?.writeText(payload).catch(() => {
      // Debug-only helper; the visible panel still contains the data.
    });
  }

  return (
    <aside className="audio-debug-panel" aria-label="Audio debug">
      <div className="audio-debug-title">Audio debug</div>
      <div className="audio-debug-row">
        ctx: <strong>{currentState}</strong>
      </div>
      {latestEntry && (
        <div className="audio-debug-row">
          latest: <strong>{latestEntry.source}</strong>{" "}
          {latestResult?.ok ? "ok" : "blocked"} / {latestResult?.state || "unknown"}
        </div>
      )}
      <pre className="audio-debug-log">{details}</pre>
      <button className="audio-debug-copy" type="button" onClick={handleCopy}>
        Copy
      </button>
    </aside>
  );
}

export default function App() {
  const debugLoadingMode = getLoadingShimmerDebugPreviewMode();
  const debugEndingMode = getEndingOverlayDebugPreviewMode();
  const debugResultVoicesMode = getResultVoiceDebugPreviewMode();
  const supportScreenDebugMode = getSupportScreenDebugMode();
  const supportQrLoadingDebugMode = getSupportQrLoadingDebugMode();
  const audioDebugEnabled = getAudioDebugEnabled();
  const audioDebugPanelEnabled = getAudioDebugPanelEnabled();
  const [screen, setScreen] = useState(() => (supportScreenDebugMode ? "support" : "start"));
  const [startTheme, setThemeState] = useState(() => getStartTheme(getStartThemeDebugOverride()));
  const [selectedSong, setSelectedSong] = useState(() => getDefaultSong());
  const [resultSummary, setResultSummary] = useState(null);
  const [gameRunId, setGameRunId] = useState(0);
  const [gameInputMode, setGameInputMode] = useState("touch");
  const [resultVoicePlayId, setResultVoicePlayId] = useState(0);
  const [resultVoiceReadyPlayId, setResultVoiceReadyPlayId] = useState(0);
  const [hasShownGameSoundToast, setHasShownGameSoundToast] = useState(false);
  const [showGameSoundToastForRun, setShowGameSoundToastForRun] = useState(false);
  const [startLoadingText, setStartLoadingText] = useState(LOADING_COPY.enterWorld);
  const [audioDebugEntries, setAudioDebugEntries] = useState([]);
  const pageViewKeyRef = useRef("");
  const resultFinishTrackedKeyRef = useRef("");
  const audioDebugEntryIdRef = useRef(0);
  const song = selectedSong || getDefaultSong();
  useVisualViewportCssVars();
  useAmbientBgm(getAmbientBgmArea(screen, debugLoadingMode, debugEndingMode, debugResultVoicesMode));
  useResultVoice(screen, resultVoiceReadyPlayId || null);

  useEffect(() => {
    setBunniesMediaSessionMetadata();
  }, []);

  useEffect(() => {
    if (
      debugLoadingMode ||
      debugEndingMode ||
      debugResultVoicesMode ||
      screen !== "start"
    ) {
      return undefined;
    }

    return scheduleIdlePreload(loadGameScreen, "game screen");
  }, [debugEndingMode, debugLoadingMode, debugResultVoicesMode, screen]);

  useEffect(() => {
    if (
      debugLoadingMode ||
      debugEndingMode ||
      debugResultVoicesMode ||
      screen !== "game"
    ) {
      return undefined;
    }

    return scheduleIdlePreload(loadResultScreen, "result screen", 1800);
  }, [debugEndingMode, debugLoadingMode, debugResultVoicesMode, screen]);

  useEffect(() => {
    if (!audioDebugPanelEnabled || typeof window === "undefined") return undefined;

    function handleAudioDebugEvent(event) {
      const detail = event.detail || {};
      const debugEntry = {
        id: audioDebugEntryIdRef.current + 1,
        ...detail,
      };
      audioDebugEntryIdRef.current = debugEntry.id;
      setAudioDebugEntries((entries) =>
        [...entries, debugEntry].slice(-AUDIO_DEBUG_ENTRY_LIMIT)
      );
    }

    window.addEventListener(AUDIO_DEBUG_EVENT_NAME, handleAudioDebugEvent);
    return () => {
      window.removeEventListener(AUDIO_DEBUG_EVENT_NAME, handleAudioDebugEvent);
    };
  }, [audioDebugPanelEnabled]);

  const appState = useMemo(
    () => ({
      startTheme,
      song,
    }),
    [startTheme, song]
  );

  function updateTheme(nextTheme) {
    setThemeState(setStartTheme(nextTheme));
  }

  useEffect(() => {
    if (debugLoadingMode || debugEndingMode || debugResultVoicesMode) return;

    const pageViewKey =
      screen === "game"
        ? `${screen}:${gameRunId}`
        : screen === "result"
          ? `${screen}:${resultVoicePlayId}`
          : screen;
    if (pageViewKeyRef.current === pageViewKey) return;
    pageViewKeyRef.current = pageViewKey;
    trackPageView(screen, getSongAnalyticsParams(song, startTheme));
  }, [
    debugEndingMode,
    debugLoadingMode,
    debugResultVoicesMode,
    gameRunId,
    resultVoicePlayId,
    screen,
    song,
    startTheme,
  ]);

  useEffect(() => {
    if (debugLoadingMode || debugEndingMode || debugResultVoicesMode) return;
    if (screen !== "result" || !resultSummary || !resultVoicePlayId) return;

    const resultFinishKey = `${resultVoicePlayId}:${resultSummary.completedAt || ""}`;
    if (resultFinishTrackedKeyRef.current === resultFinishKey) return;
    resultFinishTrackedKeyRef.current = resultFinishKey;

    trackEvent("game_finish", {
      ...getSongAnalyticsParams(song, startTheme),
      ...getResultAnalyticsParams(resultSummary),
      source_screen: "result",
    });
  }, [
    debugEndingMode,
    debugLoadingMode,
    debugResultVoicesMode,
    resultSummary,
    resultVoicePlayId,
    screen,
    song,
    startTheme,
  ]);

  const handlePrimeBattleAudio = useCallback(
    async (source = "unknown") => {
      const beforeState = getSharedAudioContextState();
      const browserInfoBefore = getBrowserAudioDebugInfo();
      const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
      let result;

      try {
        result = await primeAudioForUserGesture(`prime:${source}`);
      } catch (error) {
        result = {
          ok: false,
          state: getSharedAudioContextState(),
          errorName: error?.name || "Error",
          errorMessage: error?.message || String(error),
        };
      }

      if (audioDebugEnabled) {
        const finishedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
        const debugEntry = {
          id: audioDebugEntryIdRef.current + 1,
          source,
          beforeState,
          afterState: getSharedAudioContextState(),
          result,
          elapsedMs: Math.round(finishedAt - startedAt),
          before: browserInfoBefore,
          after: getBrowserAudioDebugInfo(),
        };
        audioDebugEntryIdRef.current = debugEntry.id;
        console.info("[audio-debug] battle audio prime", debugEntry);
        if (audioDebugPanelEnabled) {
          setAudioDebugEntries((entries) =>
            [...entries, debugEntry].slice(-AUDIO_DEBUG_ENTRY_LIMIT)
          );
        }
      }

      return result;
    },
    [audioDebugEnabled, audioDebugPanelEnabled]
  );

  const handleStart = useCallback((options = {}) => {
    preloadModule(loadGameScreen, "game screen");
    setGameInputMode(normalizeGameInputMode(options?.inputMode));
    trackEvent("game_start", getSongAnalyticsParams(song, startTheme));
    handlePrimeBattleAudio(options?.audioSource || "start");
    setStartLoadingText(LOADING_COPY.enterWorld);
    setResultSummary(null);
    setResultVoiceReadyPlayId(0);
    setShowGameSoundToastForRun(!hasShownGameSoundToast);
    setGameRunId((id) => id + 1);
    setScreen("game");
  }, [handlePrimeBattleAudio, hasShownGameSoundToast, song, startTheme]);

  const handleSupportOpen = useCallback(() => {
    preloadModule(loadSupportScreen, "support screen");
    trackEvent("support_open", getSongAnalyticsParams(song, startTheme));
    setScreen("support");
  }, [song, startTheme]);

  const handleFinish = useCallback((summary) => {
    preloadModule(loadResultScreen, "result screen");
    setResultSummary(summary);
    setResultVoiceReadyPlayId(0);
    setResultVoicePlayId((id) => id + 1);
    setScreen("result");
  }, []);

  const handleReplay = useCallback(() => {
    preloadModule(loadGameScreen, "game screen");
    trackEvent("game_replay", getSongAnalyticsParams(song, startTheme));
    handlePrimeBattleAudio("result-replay");
    setResultSummary(null);
    setResultVoiceReadyPlayId(0);
    setShowGameSoundToastForRun(false);
    setGameRunId((id) => id + 1);
    setScreen("game");
  }, [handlePrimeBattleAudio, song, startTheme]);

  const handleGameSoundToastShown = useCallback(() => {
    setHasShownGameSoundToast(true);
  }, []);

  const handleResultReadyForVoice = useCallback((playId) => {
    if (!playId) return;
    setResultVoiceReadyPlayId((currentPlayId) =>
      currentPlayId === playId ? currentPlayId : playId
    );
  }, []);

  const handleHome = useCallback(() => {
    trackEvent("game_home", {
      ...getSongAnalyticsParams(song, startTheme),
      source_screen: screen,
    });
    setStartLoadingText(LOADING_COPY.returnWorld);
    setScreen("start");
  }, [screen, song, startTheme]);

  const handleSupportBack = useCallback(() => {
    trackEvent("support_back", getSongAnalyticsParams(song, startTheme));
    setScreen("start");
  }, [song, startTheme]);

  function handleShareGenerate(details = {}) {
    trackEvent("result_share_generate", {
      ...getSongAnalyticsParams(song, startTheme),
      ...getResultAnalyticsParams(resultSummary),
      ...details,
    });
  }

  function handleShareSaveClick(details = {}) {
    trackEvent("result_share_save_click", {
      ...getSongAnalyticsParams(song, startTheme),
      ...getResultAnalyticsParams(resultSummary),
      ...details,
    });
  }

  function handleShareSave(details = {}) {
    trackEvent("result_share_save", {
      ...getSongAnalyticsParams(song, startTheme),
      ...getResultAnalyticsParams(resultSummary),
      ...details,
    });
  }

  return (
    <StageShell theme={startTheme}>
      {debugResultVoicesMode && ResultVoiceDebugPreview ? (
        <Suspense fallback={<ScreenFallback theme={startTheme} />}>
          <ResultVoiceDebugPreview startTheme={startTheme} />
        </Suspense>
      ) : debugEndingMode && EndingOverlayDebugPreview ? (
        <Suspense fallback={<ScreenFallback theme={startTheme} />}>
          <EndingOverlayDebugPreview startTheme={startTheme} />
        </Suspense>
      ) : debugLoadingMode && LoadingShimmerDebugPreview ? (
        <Suspense fallback={<ScreenFallback theme={startTheme} />}>
          <LoadingShimmerDebugPreview />
        </Suspense>
      ) : (
        <>
          {screen === "start" && (
            <StartScreen
              state={appState}
              onThemeToggle={() =>
                updateTheme(startTheme === START_THEMES.dark ? START_THEMES.light : START_THEMES.dark)
              }
              onSupportOpen={handleSupportOpen}
              onSelectSong={setSelectedSong}
              onStart={handleStart}
              loadingText={startLoadingText}
            />
          )}
          {screen === "support" && (
            <Suspense fallback={<ScreenFallback theme={startTheme} />}>
              <SupportScreen
                startTheme={startTheme}
                onBack={handleSupportBack}
                forceQrLoading={supportQrLoadingDebugMode}
              />
            </Suspense>
          )}
          {screen === "game" && (
            <Suspense fallback={<ScreenFallback theme={startTheme} />}>
              <GameScreen
                key={`${song.id}-${startTheme}-${gameRunId}`}
                song={song}
                startTheme={startTheme}
                inputMode={gameInputMode}
                showIntroSoundToast={showGameSoundToastForRun}
                onIntroSoundToastShown={handleGameSoundToastShown}
                onFinish={handleFinish}
                onHome={handleHome}
              />
            </Suspense>
          )}
          {screen === "result" && (
            <Suspense fallback={<ScreenFallback theme={startTheme} />}>
              <ResultScreen
                summary={resultSummary}
                startTheme={startTheme}
                resultVoicePlayId={resultVoicePlayId}
                onResultReadyForVoice={handleResultReadyForVoice}
                onReplay={handleReplay}
                onHome={handleHome}
                onShareGenerate={handleShareGenerate}
                onShareSaveClick={handleShareSaveClick}
                onShareSave={handleShareSave}
              />
            </Suspense>
          )}
        </>
      )}
      {audioDebugPanelEnabled && (
        <AudioDebugPanel
          entries={audioDebugEntries}
          currentState={getSharedAudioContextState()}
        />
      )}
    </StageShell>
  );
}
