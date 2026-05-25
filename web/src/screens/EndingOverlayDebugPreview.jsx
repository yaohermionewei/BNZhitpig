import { useEffect, useRef, useState } from "react";
import { loadCharacterSprites } from "../game/assets.js";
import { createGameState } from "../game/engine.js";
import { renderFrame } from "../game/renderer.js";
import { getDefaultSong } from "../game/songs.js";
import { playVictoryFanfare } from "../game/uiSounds.js";
import { getStartThemeLoadingColors, normalizeStartTheme } from "../utils/start-theme.js";

const PREVIEW_WIDTH = 402;
const PREVIEW_HEIGHT = 782;
const PREVIEW_LOOP_DURATION_MS = 1500;
const DEBUG_SOUND_UNLOCK_EVENTS = ["pointerdown", "touchstart", "click", "keydown"];

function getDebugEndingMode() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return null;
  }

  const mode = new URLSearchParams(window.location.search).get("debugEnding");
  if (mode === "completed" || mode === "failed") {
    return mode;
  }

  return null;
}

function getDebugHitCount() {
  if (typeof window === "undefined") {
    return 20;
  }

  const rawHits = Number(new URLSearchParams(window.location.search).get("hits"));
  if (!Number.isFinite(rawHits)) {
    return 20;
  }

  return Math.max(0, Math.round(rawHits));
}

function shouldPlayDebugSound() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("debugSound") === "1";
}

function removeDebugSoundUnlockListeners(handler) {
  if (typeof window === "undefined") return;
  DEBUG_SOUND_UNLOCK_EVENTS.forEach((eventName) => {
    window.removeEventListener(eventName, handler);
  });
}

export function getEndingOverlayDebugMode() {
  return getDebugEndingMode();
}

export default function EndingOverlayDebugPreview({ startTheme }) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const soundPlayedRef = useRef(false);
  const mode = getDebugEndingMode() || "completed";
  const theme = normalizeStartTheme(startTheme);
  const song = getDefaultSong();

  useEffect(() => {
    let cancelled = false;
    let frameHandle = 0;
    let unlockHandler = null;

    async function playDebugVictorySound() {
      if (cancelled || soundPlayedRef.current) return;
      const didPlay = await playVictoryFanfare();
      if (!didPlay || cancelled) return;
      soundPlayedRef.current = true;
      if (!unlockHandler) return;
      removeDebugSoundUnlockListeners(unlockHandler);
      unlockHandler = null;
    }

    function bindDebugSoundUnlock() {
      if (mode !== "completed" || !shouldPlayDebugSound() || unlockHandler || soundPlayedRef.current) {
        return;
      }
      unlockHandler = playDebugVictorySound;
      DEBUG_SOUND_UNLOCK_EVENTS.forEach((eventName) => {
        window.addEventListener(eventName, unlockHandler, { once: true, passive: true });
      });
    }

    async function drawPreview() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d", { alpha: false });
      if (!canvas || !ctx || !song) {
        setStatus("failed");
        return;
      }

      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.round(PREVIEW_WIDTH * dpr);
      canvas.height = Math.round(PREVIEW_HEIGHT * dpr);
      canvas.style.width = `${PREVIEW_WIDTH}px`;
      canvas.style.height = `${PREVIEW_HEIGHT}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const fontsReady =
        typeof document !== "undefined" && document.fonts
          ? Promise.allSettled([
              document.fonts.load('400 27px "PixelZhFusion"', "爆锤圆满结束！"),
              document.fonts.load('400 27px "PixelZhFusion"', "爆锤方猪20次未完待续"),
            ])
          : Promise.resolve();
      const [characterSprites] = await Promise.all([
        loadCharacterSprites(theme),
        fontsReady,
      ]);

      if (cancelled) {
        return;
      }

      const state = createGameState(song.chart);
      const hitCount = getDebugHitCount();
      state.currentTime = Math.min(24, Number(song.chart?.duration) || 24);
      state.score = mode === "completed" ? 123450 : 80420;
      state.combo = mode === "completed" ? 88 : 0;
      state.bestCombo = mode === "completed" ? 88 : 24;
      state.hits.perfect = hitCount;
      state.hits.good = 0;
      state.hits.miss = mode === "failed" ? 5 : 0;
      state.lives = mode === "failed" ? 0 : state.maxLives;
      state.ended = true;
      state.failed = mode === "failed";

      const viewport = { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, dpr };
      const renderPreviewFrame = (overlayProgress) => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderFrame(ctx, viewport, state, {
          paused: false,
          useDomPauseOverlay: false,
          gameOverOverlayActive: true,
          gameOverOverlayProgress: overlayProgress,
          gameOverOverlayKind: mode,
          selectedSongId: song.id,
          songTitle: song.title,
          songCoverImage: null,
          characterSprites,
          crowdMotion: null,
          audioDebugText: "",
          introProgress: 1,
          sceneTime: state.currentTime,
          showLaneBase: false,
          gameplayActive: true,
          rabbitWandAnimation: null,
          rabbitWandSwingVariant: 2,
          startTheme: theme,
          loadingColors: getStartThemeLoadingColors(theme),
        });
      };

      const loopStart = performance.now();
      const tick = (timestamp) => {
        if (cancelled) {
          return;
        }

        const elapsed = (timestamp - loopStart) % PREVIEW_LOOP_DURATION_MS;
        renderPreviewFrame(elapsed / PREVIEW_LOOP_DURATION_MS);
        frameHandle = window.requestAnimationFrame(tick);
      };

      frameHandle = window.requestAnimationFrame(tick);

      setStatus("ready");
      if (mode === "completed" && shouldPlayDebugSound()) {
        playDebugVictorySound();
        bindDebugSoundUnlock();
      }
    }

    drawPreview().catch((error) => {
      console.error("ending overlay debug preview failed", error);
      if (!cancelled) {
        setStatus("failed");
      }
    });

    return () => {
      cancelled = true;
      if (frameHandle) {
        window.cancelAnimationFrame(frameHandle);
      }
      if (unlockHandler) {
        removeDebugSoundUnlockListeners(unlockHandler);
      }
    };
  }, [mode, song, theme]);

  return (
    <main className="debug-ending-preview">
      <canvas
        ref={canvasRef}
        className="debug-ending-preview-canvas"
        aria-label={`${mode} ending overlay preview`}
      />
      <div className="debug-ending-preview-caption">
        {status === "ready"
          ? `Debug ending: ${mode} loop`
          : status === "failed"
            ? "Debug ending preview failed"
            : "Loading debug ending..."}
      </div>
    </main>
  );
}
