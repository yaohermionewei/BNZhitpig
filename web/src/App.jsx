import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { getDefaultSong } from "./game/songs.js";
import { getStartTheme, setStartTheme, START_THEMES } from "./utils/start-theme.js";
import StageShell from "./screens/StageShell.jsx";
import StartScreen from "./screens/StartScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";
import ResultScreen from "./screens/ResultScreen.jsx";
import {
  unlockAudioForUserGesture,
} from "./game/AudioControllerWeb.js";
import { resultVoiceClips } from "./game/resultVoiceClips.js";
import {
  playResultVoiceClip,
  stopResultVoicePlayback,
} from "./game/resultVoicePlayback.js";
import { LOADING_COPY } from "./utils/loading-copy.js";
import { trackEvent, trackPageView } from "./utils/analytics.js";

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
const RESULT_VOICE_DELAY_MS = 1000;
const RESULT_VOICE_UNLOCK_EVENTS = ["pointerdown", "touchstart", "click", "keydown"];

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

function getDebugResultVoiceAmbientEnabled() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("debugBgm") !== "0";
}

function getAmbientBgmArea(screen, debugLoadingMode, debugEndingMode, debugResultVoicesMode) {
  if (debugResultVoicesMode) {
    return getDebugResultVoiceAmbientEnabled() ? "result" : "off";
  }
  if (debugLoadingMode || debugEndingMode) return "off";
  return screen === "start" || screen === "result" ? screen : "off";
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

export default function App() {
  const debugLoadingMode = getLoadingShimmerDebugPreviewMode();
  const debugEndingMode = getEndingOverlayDebugPreviewMode();
  const debugResultVoicesMode = getResultVoiceDebugPreviewMode();
  const [screen, setScreen] = useState("start");
  const [startTheme, setThemeState] = useState(() => getStartTheme());
  const [selectedSong, setSelectedSong] = useState(() => getDefaultSong());
  const [resultSummary, setResultSummary] = useState(null);
  const [gameRunId, setGameRunId] = useState(0);
  const [gameInputMode, setGameInputMode] = useState("touch");
  const [resultVoicePlayId, setResultVoicePlayId] = useState(0);
  const [startLoadingText, setStartLoadingText] = useState(LOADING_COPY.enterWorld);
  const pageViewKeyRef = useRef("");
  const resultFinishTrackedKeyRef = useRef("");
  const song = selectedSong || getDefaultSong();
  useAmbientBgm(getAmbientBgmArea(screen, debugLoadingMode, debugEndingMode, debugResultVoicesMode));
  useResultVoice(screen, resultVoicePlayId || null);

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

  function handleStart(options = {}) {
    setGameInputMode(normalizeGameInputMode(options?.inputMode));
    trackEvent("game_start", getSongAnalyticsParams(song, startTheme));
    unlockAudioForUserGesture();
    setStartLoadingText(LOADING_COPY.enterWorld);
    setResultSummary(null);
    setGameRunId((id) => id + 1);
    setScreen("game");
  }

  function handleFinish(summary) {
    setResultSummary(summary);
    setResultVoicePlayId((id) => id + 1);
    setScreen("result");
  }

  function handleReplay() {
    trackEvent("game_replay", getSongAnalyticsParams(song, startTheme));
    setResultSummary(null);
    setGameRunId((id) => id + 1);
    setScreen("game");
  }

  function handleHome() {
    trackEvent("game_home", {
      ...getSongAnalyticsParams(song, startTheme),
      source_screen: screen,
    });
    setStartLoadingText(LOADING_COPY.returnWorld);
    setScreen("start");
  }

  function handleShareGenerate(details = {}) {
    trackEvent("result_share_generate", {
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
        <Suspense fallback={<div className="screen" />}>
          <ResultVoiceDebugPreview startTheme={startTheme} />
        </Suspense>
      ) : debugEndingMode && EndingOverlayDebugPreview ? (
        <Suspense fallback={<div className="screen" />}>
          <EndingOverlayDebugPreview startTheme={startTheme} />
        </Suspense>
      ) : debugLoadingMode && LoadingShimmerDebugPreview ? (
        <Suspense fallback={<div className="screen" />}>
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
              onSelectSong={setSelectedSong}
              onStart={handleStart}
              loadingText={startLoadingText}
            />
          )}
          {screen === "game" && (
            <GameScreen
              key={`${song.id}-${startTheme}-${gameRunId}`}
              song={song}
              startTheme={startTheme}
              inputMode={gameInputMode}
              onFinish={handleFinish}
              onHome={handleHome}
            />
          )}
          {screen === "result" && (
            <ResultScreen
              summary={resultSummary}
              startTheme={startTheme}
              onReplay={handleReplay}
              onHome={handleHome}
              onShareGenerate={handleShareGenerate}
              onShareSave={handleShareSave}
            />
          )}
        </>
      )}
    </StageShell>
  );
}
