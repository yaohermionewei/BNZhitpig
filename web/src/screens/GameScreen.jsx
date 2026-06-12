import { useEffect, useRef, useState } from "react";
import { GameRunner } from "../game/GameRunner.js";
import {
  HIT_IMPACT_SOUND_OPTIONS,
  ORIGINAL_HIT_SFX_ID,
} from "../game/hitImpactSounds.js";
import { LOADING_COPY } from "../utils/loading-copy.js";
import MagicLoadingOverlay from "./MagicLoadingOverlay.jsx";

const SOUND_TOAST_COPY = "保持声音开启";
const SOUND_TOAST_DURATION_MS = 1000;

export default function GameScreen({
  song,
  startTheme,
  inputMode = "touch",
  sceneOnly = false,
  onFinish,
  onHome,
  showIntroSoundToast = false,
  onIntroSoundToastShown,
  hitSfxLabEnabled = false,
  hitImpactSoundId = ORIGINAL_HIT_SFX_ID,
  onHitImpactSoundChange,
  disableLifeFailure = false,
}) {
  const canvasRef = useRef(null);
  const runnerRef = useRef(null);
  const onFinishRef = useRef(onFinish);
  const onHomeRef = useRef(onHome);
  const onIntroSoundToastShownRef = useRef(onIntroSoundToastShown);
  const soundToastTimerRef = useRef(0);
  const hasShownSoundToastRef = useRef(false);
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
    onIntroSoundToastShownRef.current = onIntroSoundToastShown;
  }, [onIntroSoundToastShown]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;
    const runner = new GameRunner({
      canvas,
      song,
      startTheme,
      inputMode,
      sceneOnly,
      hitImpactSoundId,
      preloadHitImpactSoundSamples: hitSfxLabEnabled,
      disableLifeFailure,
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
        if (!cancelled) {
          if (sceneOnly) {
            runner.startSceneOnlyPreview();
          } else {
            runner.start();
          }
        }
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
  }, [song, startTheme, inputMode, sceneOnly, hitSfxLabEnabled, disableLifeFailure]);

  useEffect(() => {
    runnerRef.current?.setHitImpactSoundId(hitImpactSoundId);
  }, [hitImpactSoundId]);

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

  const showLoadingOverlay = loading && !sceneOnly;

  return (
    <div className={`screen game-screen screen-${startTheme}`}>
      <canvas ref={canvasRef} className="game-canvas" draggable={false} />
      {!sceneOnly && soundToastVisible && (
        <div
          className="game-sound-toast result-share-preview-toast result-fixed-text-zh pixel-font-zh"
          role="status"
          aria-live="polite"
        >
          <span className="result-share-preview-toast-text">{SOUND_TOAST_COPY}</span>
        </div>
      )}
      {hitSfxLabEnabled && !loading && !error && (
        <HitSfxLabOverlay
          selectedId={hitImpactSoundId}
          onChange={onHitImpactSoundChange}
        />
      )}
      {showLoadingOverlay && (
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

function HitSfxLabOverlay({ selectedId, onChange }) {
  const selectedIndex = Math.max(
    0,
    HIT_IMPACT_SOUND_OPTIONS.findIndex((option) => option.id === selectedId)
  );
  const selectedOption = HIT_IMPACT_SOUND_OPTIONS[selectedIndex] || HIT_IMPACT_SOUND_OPTIONS[0];

  function selectByIndex(nextIndex) {
    const safeIndex =
      (nextIndex + HIT_IMPACT_SOUND_OPTIONS.length) % HIT_IMPACT_SOUND_OPTIONS.length;
    onChange?.(HIT_IMPACT_SOUND_OPTIONS[safeIndex].id);
  }

  return (
    <aside className="hit-sfx-lab-panel" aria-label="命中音效实验台">
      <div className="hit-sfx-lab-title-row">
        <div>
          <div className="hit-sfx-lab-kicker pixel-font-en">Hit SFX Lab</div>
          <div className="hit-sfx-lab-title pixel-font-zh">歌里切音效</div>
        </div>
        <div className="hit-sfx-lab-badge pixel-font-zh">不死模式</div>
      </div>
      <label className="hit-sfx-lab-select-wrap pixel-font-zh">
        <span>命中音色</span>
        <select
          className="hit-sfx-lab-select"
          value={selectedOption.id}
          onChange={(event) => onChange?.(event.target.value)}
        >
          {HIT_IMPACT_SOUND_OPTIONS.map((option, index) => (
            <option key={option.id} value={option.id}>
              {option.displayCode || String(index + 1).padStart(2, "0")} {option.title}
            </option>
          ))}
        </select>
      </label>
      <div className="hit-sfx-lab-stepper">
        <button
          className="hit-sfx-lab-button pixel-font-zh"
          type="button"
          onClick={() => selectByIndex(selectedIndex - 1)}
        >
          上一个
        </button>
        <button
          className="hit-sfx-lab-button pixel-font-zh"
          type="button"
          onClick={() => selectByIndex(selectedIndex + 1)}
        >
          下一个
        </button>
      </div>
      <p className="hit-sfx-lab-description pixel-font-zh">
        {selectedOption.description}
      </p>
    </aside>
  );
}
