import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { getDefaultSong } from "./game/songs.js";
import { getStartTheme, setStartTheme, START_THEMES } from "./utils/start-theme.js";
import StageShell from "./screens/StageShell.jsx";
import StartScreen from "./screens/StartScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";
import ResultScreen from "./screens/ResultScreen.jsx";
import {
  getAudioContext,
  loadAudioBuffer,
  unlockAudioForUserGesture,
} from "./game/AudioControllerWeb.js";
import { resultVoiceClips } from "./game/resultVoiceClips.js";

const LoadingShimmerDebugPreview = import.meta.env.DEV
  ? lazy(() => import("./screens/LoadingShimmerDebugPreview.jsx"))
  : null;
const EndingOverlayDebugPreview = import.meta.env.DEV
  ? lazy(() => import("./screens/EndingOverlayDebugPreview.jsx"))
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

function getAmbientBgmArea(screen, debugLoadingMode, debugEndingMode) {
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
  const sourceRef = useRef(null);
  const gainRef = useRef(null);
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
      if (sourceRef.current) {
        try {
          sourceRef.current.onended = null;
          sourceRef.current.stop();
        } catch (error) {
          // The clip may have already ended.
        }
        try {
          sourceRef.current.disconnect();
        } catch (error) {
          // Source may already be disconnected.
        }
      }
      if (gainRef.current) {
        try {
          gainRef.current.disconnect();
        } catch (error) {
          // Gain may already be disconnected.
        }
      }
      sourceRef.current = null;
      gainRef.current = null;
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
        const audioContext = await getAudioContext();
        if (cancelled || !shouldPlay || audioContext.state !== "running") {
          bindUnlockListeners();
          return;
        }
        const buffer = await loadAudioBuffer(clip.src);
        if (cancelled || !shouldPlay) return;
        stopResultVoice();
        const source = audioContext.createBufferSource();
        const gain = audioContext.createGain();
        source.buffer = buffer;
        gain.gain.value = typeof clip.volume === "number" && clip.volume > 0 ? clip.volume : 1;
        source.connect(gain);
        gain.connect(audioContext.destination);
        source.onended = () => {
          if (sourceRef.current === source) {
            sourceRef.current = null;
          }
          if (gainRef.current === gain) {
            gainRef.current = null;
          }
          try {
            source.disconnect();
          } catch (error) {
            // Source may already be disconnected by cleanup.
          }
          try {
            gain.disconnect();
          } catch (error) {
            // Gain may already be disconnected by cleanup.
          }
        };
        sourceRef.current = source;
        gainRef.current = gain;
        source.start(0);
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

export default function App() {
  const debugLoadingMode = getLoadingShimmerDebugPreviewMode();
  const debugEndingMode = getEndingOverlayDebugPreviewMode();
  const [screen, setScreen] = useState("start");
  const [startTheme, setThemeState] = useState(() => getStartTheme());
  const [selectedSong, setSelectedSong] = useState(() => getDefaultSong());
  const [resultSummary, setResultSummary] = useState(null);
  const [gameRunId, setGameRunId] = useState(0);
  const [resultVoicePlayId, setResultVoicePlayId] = useState(0);
  const song = selectedSong || getDefaultSong();
  useAmbientBgm(getAmbientBgmArea(screen, debugLoadingMode, debugEndingMode));
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

  function handleStart() {
    unlockAudioForUserGesture();
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
    setResultSummary(null);
    setGameRunId((id) => id + 1);
    setScreen("game");
  }

  function handleHome() {
    setScreen("start");
  }

  return (
    <StageShell theme={startTheme}>
      {debugEndingMode && EndingOverlayDebugPreview ? (
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
            />
          )}
          {screen === "game" && (
            <GameScreen
              key={`${song.id}-${startTheme}-${gameRunId}`}
              song={song}
              startTheme={startTheme}
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
            />
          )}
        </>
      )}
    </StageShell>
  );
}
