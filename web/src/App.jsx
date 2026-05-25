import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { getDefaultSong } from "./game/songs.js";
import { getStartTheme, setStartTheme, START_THEMES } from "./utils/start-theme.js";
import StageShell from "./screens/StageShell.jsx";
import StartScreen from "./screens/StartScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";
import ResultScreen from "./screens/ResultScreen.jsx";
import { unlockAudioForUserGesture } from "./game/AudioControllerWeb.js";
import { resultVoiceClips } from "./game/resultVoiceClips.js";

const LoadingShimmerDebugPreview = import.meta.env.DEV
  ? lazy(() => import("./screens/LoadingShimmerDebugPreview.jsx"))
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

function getAmbientBgmArea(screen, debugLoadingMode) {
  if (debugLoadingMode) return "off";
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

function getRandomResultVoiceClip() {
  if (resultVoiceClips.length <= 0) return "";
  const index = Math.floor(Math.random() * resultVoiceClips.length);
  return resultVoiceClips[index] || "";
}

function useResultVoice(screen, resultKey) {
  const audioRef = useRef(null);
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
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    function bindUnlockListeners() {
      if (unlockBound || cancelled || !shouldPlay) return;
      RESULT_VOICE_UNLOCK_EVENTS.forEach((eventName) => {
        window.addEventListener(eventName, handleUserUnlock, { once: true, passive: true });
      });
      unlockBound = true;
    }

    function playResultVoice() {
      const audio = audioRef.current;
      if (!audio) return;
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
      playResultVoice();
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
    const clipSrc = getRandomResultVoiceClip();
    lastPlayedKeyRef.current = resultKey;
    if (!clipSrc) {
      return () => {
        cancelled = true;
        removeUnlockListeners();
      };
    }

    const audio = new Audio(clipSrc);
    audio.loop = false;
    audio.preload = "auto";
    audioRef.current = audio;
    playTimer = window.setTimeout(() => {
      if (!cancelled) {
        playResultVoice();
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
  const [screen, setScreen] = useState("start");
  const [startTheme, setThemeState] = useState(() => getStartTheme());
  const [selectedSong, setSelectedSong] = useState(() => getDefaultSong());
  const [resultSummary, setResultSummary] = useState(null);
  const song = selectedSong || getDefaultSong();
  useAmbientBgm(getAmbientBgmArea(screen, debugLoadingMode));
  useResultVoice(screen, resultSummary?.completedAt || null);

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
    setScreen("game");
  }

  function handleFinish(summary) {
    setResultSummary(summary);
    setScreen("result");
  }

  function handleReplay() {
    setScreen("game");
  }

  function handleHome() {
    setScreen("start");
  }

  return (
    <StageShell theme={startTheme}>
      {debugLoadingMode && LoadingShimmerDebugPreview ? (
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
              key={`${song.id}-${startTheme}-${resultSummary?.completedAt || 0}`}
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
