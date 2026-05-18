import { useEffect, useRef, useState } from "react";
import { ParkourRunner } from "../game/ParkourRunner.js";

export default function GameScreen({ song, onFinish, onHome }) {
  const canvasRef = useRef(null);
  const runnerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let cancelled = false;
    const runner = new ParkourRunner({
      canvas,
      song,
      onFinish,
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
        setError("资源加载失败，请刷新重试");
        setLoading(false);
      });

    return () => {
      cancelled = true;
      runner.dispose();
      runnerRef.current = null;
    };
  }, [song, onFinish, onHome]);

  return (
    <div className="screen game-screen">
      <canvas ref={canvasRef} className="game-canvas" />
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}
      {error && <div className="error-overlay">{error}</div>}
    </div>
  );
}
