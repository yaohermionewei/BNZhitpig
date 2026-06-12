import { useEffect, useRef, useState } from "react";
import { createPhaserGame } from "../game-phaser/createPhaserGame.js";
import { LOADING_COPY } from "../utils/loading-copy.js";
import MagicLoadingOverlay from "./MagicLoadingOverlay.jsx";

const SOUND_TOAST_COPY = "保持声音开启";
const SOUND_TOAST_DURATION_MS = 1000;

function getPhaserDebugEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debugPhaser") === "1";
}

export default function GameScreen({
  song,
  startTheme,
  inputMode = "touch",
  onFinish,
  onHome,
  showIntroSoundToast = false,
  onIntroSoundToastShown,
}) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const onFinishRef = useRef(onFinish);
  const onHomeRef = useRef(onHome);
  const onIntroSoundToastShownRef = useRef(onIntroSoundToastShown);
  const soundToastTimerRef = useRef(0);
  const hasShownSoundToastRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingStage, setLoadingStage] = useState("");
  const [debugPhaserEnabled] = useState(getPhaserDebugEnabled);
  const [soundToastVisible, setSoundToastVisible] = useState(false);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    onHomeRef.current = onHome;
  }, [onHome]);

  useEffect(() => {
    onIntroSoundToastShownRef.current = onIntroSoundToastShown;
  }, [onIntroSoundToastShown]);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return undefined;
    let cancelled = false;
    const gameHandle = createPhaserGame({
      parent,
      song,
      startTheme,
      inputMode,
      onFinish: (summary) => {
        onFinishRef.current?.({ ...summary, completedAt: Date.now() });
      },
      onHome: () => onHomeRef.current?.(),
      onLoadingChange: setLoading,
      onLoadingStage: setLoadingStage,
      onError: (prepareError) => {
        if (cancelled) return;
        console.error(prepareError);
        setError("加载失败，刷新重试");
        setLoading(false);
      },
    });
    gameRef.current = gameHandle;

    return () => {
      cancelled = true;
      window.clearTimeout(soundToastTimerRef.current);
      gameHandle.destroy();
      gameRef.current = null;
    };
  }, [song, startTheme, inputMode]);

  useEffect(() => {
    if (!showIntroSoundToast || hasShownSoundToastRef.current || loading || error) {
      setSoundToastVisible(false);
      window.clearTimeout(soundToastTimerRef.current);
      return undefined;
    }

    window.clearTimeout(soundToastTimerRef.current);
    hasShownSoundToastRef.current = true;
    setSoundToastVisible(true);
    onIntroSoundToastShownRef.current?.();
    soundToastTimerRef.current = window.setTimeout(() => {
      setSoundToastVisible(false);
    }, SOUND_TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(soundToastTimerRef.current);
    };
  }, [error, loading, showIntroSoundToast]);

  return (
    <div className={`screen game-screen screen-${startTheme}`}>
      <div ref={containerRef} className="phaser-game-container" />
      {soundToastVisible && (
        <div
          className="game-sound-toast result-share-preview-toast result-fixed-text-zh pixel-font-zh"
          role="status"
          aria-live="polite"
        >
          <span className="result-share-preview-toast-text">{SOUND_TOAST_COPY}</span>
        </div>
      )}
      {loading && (
        <MagicLoadingOverlay
          theme={startTheme}
          text={
            debugPhaserEnabled && loadingStage
              ? `${LOADING_COPY.prepareAttack} ${loadingStage}`
              : LOADING_COPY.prepareAttack
          }
          className="game-loading-overlay"
        />
      )}
      {error && <div className="error-overlay">{error}</div>}
    </div>
  );
}
