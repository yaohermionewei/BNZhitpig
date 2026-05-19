import { useEffect, useRef, useState } from "react";
import { GameRunner } from "../game/GameRunner.js";
import { LOADING_COPY } from "../utils/loading-copy.js";
import MagicLoadingOverlay from "./MagicLoadingOverlay.jsx";

export default function GameScreen({ song, startTheme, onFinish, onHome }) {
  const canvasRef = useRef(null);
  const runnerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;
    const runner = new GameRunner({
      canvas,
      song,
      startTheme,
      onFinish: (summary) => {
        onFinish({ ...summary, completedAt: Date.now() });
      },
      onHome,
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
        setError("音频或资源加载失败，请刷新重试");
        setLoading(false);
      });

    return () => {
      cancelled = true;
      runner.dispose();
      runnerRef.current = null;
    };
  }, [song, startTheme, onFinish, onHome]);

  return (
    <div className={`screen game-screen screen-${startTheme}`}>
      <canvas ref={canvasRef} className="game-canvas" />
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
