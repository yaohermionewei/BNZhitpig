import { useEffect, useRef, useState } from "react";
import { GameRunner } from "../game/GameRunner.js";
import { LOADING_COPY } from "../utils/loading-copy.js";
import MagicLoadingOverlay from "./MagicLoadingOverlay.jsx";

const SOUND_TOAST_COPY = "保持声音开启";
const SOUND_TOAST_DURATION_MS = 1000;

export default function GameScreen({
  song,
  startTheme,
  inputMode = "touch",
  onFinish,
  onHome,
}) {
  const canvasRef = useRef(null);
  const runnerRef = useRef(null);
  const onFinishRef = useRef(onFinish);
  const onHomeRef = useRef(onHome);
  const soundToastTimerRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [soundToastVisible, setSoundToastVisible] = useState(false);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    onHomeRef.current = onHome;
  }, [onHome]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;
    const runner = new GameRunner({
      canvas,
      song,
      startTheme,
      inputMode,
      onFinish: (summary) => {
        onFinishRef.current?.({ ...summary, completedAt: Date.now() });
      },
      onHome: () => onHomeRef.current?.(),
      onLoadingChange: setLoading,
    });
    runnerRef.current = runner;
    runner
      .prepare()
      .then(() => {
        if (!cancelled) runner.start();
      })
      .catch((prepareError) => {
        console.error(prepareError);
        setError("加载失败，刷新重试");
        setLoading(false);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(soundToastTimerRef.current);
      runner.dispose();
      runnerRef.current = null;
    };
  }, [song, startTheme, inputMode]);

  useEffect(() => {
    if (loading || error) {
      setSoundToastVisible(false);
      window.clearTimeout(soundToastTimerRef.current);
      return undefined;
    }

    window.clearTimeout(soundToastTimerRef.current);
    setSoundToastVisible(true);
    soundToastTimerRef.current = window.setTimeout(() => {
      setSoundToastVisible(false);
    }, SOUND_TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(soundToastTimerRef.current);
    };
  }, [error, loading]);

  return (
    <div className={`screen game-screen screen-${startTheme}`}>
      <canvas ref={canvasRef} className="game-canvas" />
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
          text={LOADING_COPY.prepareAttack}
          className="game-loading-overlay"
        />
      )}
      {error && <div className="error-overlay">{error}</div>}
    </div>
  );
}
