import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getSongById } from "../game/songs.js";
import { playUiSound } from "../game/uiSounds.js";
import { isInteractiveKeyboardTarget } from "../utils/keyboard-shortcuts.js";
import { LOADING_COPY, LOADING_FONT_SAMPLE } from "../utils/loading-copy.js";
import MagicLoadingOverlay from "./MagicLoadingOverlay.jsx";
import {
  START_CLOUDS,
  START_LOADING_MIN_DURATION_MS,
  getStartCharacterStageAnchors,
  getStartBackdropStageOffsetY,
  getPigFrameSources,
  getRabbitFrameSources,
  getStartBackdropSrc,
  getStartCriticalImageSources,
  getStartSongMarkSrc,
  getStartSongs,
  getThemeToggleIconSrc,
} from "./startScreenData.js";

const START_IMAGE_PRELOAD_PROMISES = new Map();
const START_IDLE_PRELOAD_TIMEOUT_MS = 2500;
const START_IDLE_PRELOAD_FALLBACK_MS = 320;
const START_INPUT_TOUCH = "touch";
const START_INPUT_KEYBOARD = "keyboard";
const START_KEYBOARD_CODES = new Set(["Space", "Enter"]);

function wait(durationMs) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function preloadImage(src) {
  if (!src) {
    return Promise.resolve(false);
  }

  if (START_IMAGE_PRELOAD_PROMISES.has(src)) {
    return START_IMAGE_PRELOAD_PROMISES.get(src);
  }

  const loadPromise = new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(true);
    image.onerror = () => {
      START_IMAGE_PRELOAD_PROMISES.delete(src);
      resolve(false);
    };
    image.src = src;
  });

  START_IMAGE_PRELOAD_PROMISES.set(src, loadPromise);
  return loadPromise;
}

function preloadStartImages(theme) {
  const sources = Array.from(new Set(getStartCriticalImageSources(theme)));

  return Promise.allSettled(sources.map((src) => preloadImage(src)));
}

function getAlternateStartTheme(theme) {
  return theme === "light" ? "dark" : "light";
}

function scheduleIdleStartImagePreload(theme) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const runPreload = () => {
    preloadStartImages(getAlternateStartTheme(theme));
  };

  if (typeof window.requestIdleCallback === "function") {
    const idleId = window.requestIdleCallback(runPreload, {
      timeout: START_IDLE_PRELOAD_TIMEOUT_MS,
    });
    return () => window.cancelIdleCallback?.(idleId);
  }

  const fallbackId = window.setTimeout(runPreload, START_IDLE_PRELOAD_FALLBACK_MS);
  return () => window.clearTimeout(fallbackId);
}

function waitForStartFonts() {
  if (typeof document === "undefined" || !document.fonts) {
    return Promise.resolve(false);
  }

  const fontLoads = [
    document.fonts.load('400 24px "PixelZhFusion"', LOADING_FONT_SAMPLE),
    document.fonts.ready,
  ];

  return Promise.allSettled(fontLoads).then(() => true);
}

function getMeasuredStageLayout(stageElement, heroElement) {
  if (!stageElement || !heroElement) {
    return {
      width: 402,
      height: 782,
      heroOffsetTop: 0,
    };
  }

  const stageRect = stageElement.getBoundingClientRect();
  const heroRect = heroElement.getBoundingClientRect();

  return {
    width: Math.max(1, stageRect.width),
    height: Math.max(1, stageRect.height),
    heroOffsetTop: heroRect.top - stageRect.top,
  };
}

function formatAnchorStyle(point, heroOffsetTop) {
  return {
    left: `${point.x}px`,
    top: `${point.y - heroOffsetTop}px`,
  };
}

function formatStageStyle(backdropOffsetY) {
  return {
    "--start-backdrop-offset-y": `${backdropOffsetY}px`,
  };
}

function PixelThumbIcon() {
  return (
    <svg
      className="start-support-icon"
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      <path
        d="M4 10H7L9 8V5H10V2H13V4H14V8H17V9H18V12H17V15H16V17H7V18H4V10Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="miter"
        strokeLinecap="square"
        strokeWidth="2"
      />
      <path
        d="M7 10V17"
        fill="none"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function StartScreen({
  state,
  onThemeToggle,
  onSupportOpen,
  onSelectSong,
  onStart,
  loadingText = LOADING_COPY.enterWorld,
}) {
  const { startTheme, song } = state;
  const stageRef = useRef(null);
  const heroRef = useRef(null);
  const initialReadyRef = useRef(false);
  const startInputModeRef = useRef(START_INPUT_TOUCH);
  const [pageReady, setPageReady] = useState(false);
  const [rabbitFrame, setRabbitFrame] = useState(0);
  const [pigFrame, setPigFrame] = useState(0);
  const [stageLayout, setStageLayout] = useState({
    width: 402,
    height: 782,
    heroOffsetTop: 0,
  });
  const rabbitFrameSources = useMemo(() => getRabbitFrameSources(startTheme), [startTheme]);
  const pigFrameSources = useMemo(() => getPigFrameSources(startTheme), [startTheme]);
  const startSongs = useMemo(() => getStartSongs(song?.id || "ditto"), [song?.id]);
  const characterAnchors = useMemo(
    () => getStartCharacterStageAnchors(startTheme, stageLayout),
    [startTheme, stageLayout]
  );
  const backdropOffsetY = useMemo(
    () => getStartBackdropStageOffsetY(startTheme, stageLayout),
    [startTheme, stageLayout]
  );
  const stageStyle = formatStageStyle(backdropOffsetY);
  const rabbitAnchorStyle = formatAnchorStyle(characterAnchors.rabbit, stageLayout.heroOffsetTop);
  const pigAnchorStyle = formatAnchorStyle(characterAnchors.pig, stageLayout.heroOffsetTop);
  const currentRabbitFrameSrc =
    rabbitFrameSources[rabbitFrame % rabbitFrameSources.length] || rabbitFrameSources[0];
  const currentPigFrameSrc = pigFrameSources[pigFrame % pigFrameSources.length] || pigFrameSources[0];
  const startBackdropSrc = getStartBackdropSrc(startTheme);
  const themeToggleIconSrc = getThemeToggleIconSrc(startTheme);
  const startSongMarkSrc = getStartSongMarkSrc(startTheme);

  useLayoutEffect(() => {
    let animationFrame = 0;

    function measure() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        setStageLayout((previousLayout) => {
          const nextLayout = getMeasuredStageLayout(stageRef.current, heroRef.current);
          const sameLayout =
            Math.abs(previousLayout.width - nextLayout.width) < 0.5 &&
            Math.abs(previousLayout.height - nextLayout.height) < 0.5 &&
            Math.abs(previousLayout.heroOffsetTop - nextLayout.heroOffsetTop) < 0.5;
          return sameLayout ? previousLayout : nextLayout;
        });
      });
    }

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => {
        window.cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", measure);
      };
    }

    const resizeObserver = new ResizeObserver(measure);
    if (stageRef.current) {
      resizeObserver.observe(stageRef.current);
    }
    if (heroRef.current) {
      resizeObserver.observe(heroRef.current);
    }
    window.addEventListener("resize", measure);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", measure);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let cancelIdlePreload = () => {};
    const firstLoadTasks = initialReadyRef.current
      ? []
      : [waitForStartFonts(), wait(START_LOADING_MIN_DURATION_MS)];

    Promise.allSettled([
      preloadStartImages(startTheme),
      ...firstLoadTasks,
    ]).then(() => {
      if (!cancelled) {
        if (!initialReadyRef.current) {
          initialReadyRef.current = true;
          setPageReady(true);
        }
        cancelIdlePreload = scheduleIdleStartImagePreload(startTheme);
      }
    });

    return () => {
      cancelled = true;
      cancelIdlePreload();
    };
  }, [startTheme]);

  useEffect(() => {
    const frameTimer = window.setInterval(() => {
      setRabbitFrame((frame) => (frame + 1) % rabbitFrameSources.length);
    }, 220);

    return () => {
      window.clearInterval(frameTimer);
    };
  }, [rabbitFrameSources.length]);

  useEffect(() => {
    const frameTimer = window.setInterval(() => {
      setPigFrame((frame) => (frame + 1) % pigFrameSources.length);
    }, 240);

    return () => {
      window.clearInterval(frameTimer);
    };
  }, [pigFrameSources.length]);

  useEffect(() => {
    setRabbitFrame((frame) => frame % rabbitFrameSources.length);
  }, [rabbitFrameSources.length]);

  useEffect(() => {
    setPigFrame((frame) => frame % pigFrameSources.length);
  }, [pigFrameSources.length]);

  useEffect(() => {
    function handleStartKeyDown(event) {
      if (event.repeat) return;
      if (!pageReady || isInteractiveKeyboardTarget(event.target)) return;
      if (!START_KEYBOARD_CODES.has(event.code)) return;
      event.preventDefault();
      playUiSound("confirm");
      onStart?.({ inputMode: START_INPUT_KEYBOARD });
    }

    window.addEventListener("keydown", handleStartKeyDown);
    return () => {
      window.removeEventListener("keydown", handleStartKeyDown);
    };
  }, [pageReady, onStart]);

  function handleSongSelect(item) {
    if (!item.available || item.selected) {
      return;
    }

    const nextSongId = item.defaultSongId || item.id;
    if (nextSongId === song?.id) {
      return;
    }

    const playableSong = getSongById(nextSongId);
    if (playableSong) {
      playUiSound("tap");
      onSelectSong(playableSong);
    }
  }

  function handleDifficultySelect(event, difficulty) {
    event.stopPropagation();

    if (!difficulty || !difficulty.available || difficulty.id === song?.id) {
      return;
    }

    const playableSong = getSongById(difficulty.id);
    if (playableSong) {
      playUiSound("tap");
      onSelectSong(playableSong);
    }
  }

  function handleStartTap() {
    playUiSound("confirm");
    onStart?.({ inputMode: startInputModeRef.current });
  }

  function handleSupportTap() {
    playUiSound("tap");
    onSupportOpen?.();
  }

  function handleStartPointerDown(event) {
    startInputModeRef.current =
      event.pointerType === "touch" ? START_INPUT_TOUCH : START_INPUT_KEYBOARD;
  }

  function handleStartNativeKeyDown(event) {
    if (START_KEYBOARD_CODES.has(event.code)) {
      startInputModeRef.current = START_INPUT_KEYBOARD;
    }
  }

  return (
    <div className={`screen start-screen page-${startTheme}`}>
      <div className="start-stage" ref={stageRef} style={stageStyle}>
        <img className="start-backdrop" src={startBackdropSrc} alt="" draggable="false" />
        <div className={`start-cloud-layer start-cloud-layer-${startTheme}`} aria-hidden="true">
          {START_CLOUDS.map((cloud) => (
            <div
              key={cloud.id}
              className={`start-cloud-track ${cloud.driftClass}`}
              style={cloud.trackStyle}
            >
              <div className={`start-cloud-bob ${cloud.bobClass}`} style={cloud.bobStyle}>
                <div className={`start-cloud-sway ${cloud.swayClass}`} style={cloud.swayStyle}>
                  <div className="start-cloud-code">
                    {cloud.cloudBlocks.map((block) => (
                      <div
                        key={block.id}
                        className={`start-cloud-block start-cloud-${block.tone}`}
                        style={block.style}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="start-backdrop-veil" />
        <div className="start-backdrop-bottom" />

        <div className="start-shell">
          <div className="start-top-actions">
            <button
              className="start-theme-toggle"
              type="button"
              aria-label={startTheme === "dark" ? "切换到夕阳模式" : "切换到夜晚模式"}
              onClick={onThemeToggle}
            >
              <span className={`start-theme-icon start-theme-icon-${startTheme}`}>
                <img
                  className="start-theme-icon-image"
                  src={themeToggleIconSrc}
                  alt=""
                  draggable="false"
                />
              </span>
            </button>

            <button
              className={`start-support-button start-support-button-${startTheme}`}
              type="button"
              aria-label="赞赏作者"
              onClick={handleSupportTap}
            >
              <PixelThumbIcon />
              <span className="start-support-label pixel-font-zh">赞赏作者</span>
            </button>
          </div>

          <div className="start-title-wrap">
            <div className="start-title-main">
              <div className="start-title-word start-title-word-en">
                <div className="start-title-text start-title-text-en pixel-font-en">Bunnies</div>
              </div>
              <div className="start-title-word start-title-word-cn">
                <div className="start-title-text start-title-text-cn pixel-font-zh">爆锤方猪</div>
              </div>
            </div>
          </div>

          <div className="start-hero" aria-hidden="true" ref={heroRef}>
            <div
              className="start-hero-shadow start-hero-shadow-rabbit"
              style={rabbitAnchorStyle}
            />
            <div className="start-hero-shadow start-hero-shadow-pig" style={pigAnchorStyle} />
            <div className="start-rabbit-wrap" style={rabbitAnchorStyle}>
              <div className="start-rabbit-sprite">
                <img
                  className="start-rabbit-frame"
                  src={currentRabbitFrameSrc}
                  alt=""
                  draggable="false"
                />
              </div>
            </div>
            <div className="start-pig-wrap" style={pigAnchorStyle}>
              <div className="start-pig-sprite">
                <img className="start-pig-frame" src={currentPigFrameSrc} alt="" draggable="false" />
              </div>
            </div>
          </div>

          <div className="start-controls">
            <section className="start-song-panel" aria-label="选择歌曲">
              <div className="start-song-panel-outer">
                <div className="start-song-panel-face">
                  <div className="start-song-panel-core">
                    <div className="start-song-list">
                      {startSongs.map((item) => (
                        <div
                          key={item.id}
                          className={`start-song-row ${
                            item.selected ? "start-song-row-selected" : ""
                          } ${
                            Array.isArray(item.difficulties) && item.difficulties.length > 0
                              ? "start-song-row-with-difficulties"
                              : ""
                          } ${item.available ? "" : "start-song-row-disabled"}`}
                        >
                          <button
                            className="start-song-row-fill"
                            type="button"
                            disabled={!item.available}
                            onClick={() => handleSongSelect(item)}
                          >
                            <span className="start-song-title-text">
                              {item.titleSegments.map((segment, index) => (
                                <span
                                  key={`${segment.text}-${index}`}
                                  className={`start-song-title-segment ${
                                    segment.fontType === "zh" ? "pixel-font-zh" : "pixel-font-en"
                                  } ${
                                    item.available ? "" : "start-song-title-segment-disabled"
                                  }`}
                                >
                                  {segment.text}
                                </span>
                              ))}
                            </span>
                          </button>
                          {Array.isArray(item.difficulties) && item.difficulties.length > 0 && (
                            <span
                              className="start-song-difficulty-list"
                              aria-label={`${item.title} 难度`}
                            >
                              {item.difficulties.map((difficulty) => (
                                difficulty.placeholder ? (
                                  <span
                                    key={`${item.id}-difficulty-placeholder`}
                                    className="start-song-difficulty-placeholder"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <button
                                    key={difficulty.id}
                                    className={`start-song-difficulty-button pixel-font-zh ${
                                      difficulty.selected
                                        ? "start-song-difficulty-button-selected"
                                        : ""
                                    } ${
                                      difficulty.locked
                                        ? "start-song-difficulty-button-locked"
                                        : ""
                                    }`}
                                    type="button"
                                    aria-pressed={difficulty.selected}
                                    aria-label={`选择 ${item.title} ${difficulty.label}`}
                                    onClick={(event) => handleDifficultySelect(event, difficulty)}
                                  >
                                    {difficulty.label}
                                  </button>
                                )
                              ))}
                            </span>
                          )}
                          <span className="start-song-row-mark-slot">
                            {item.selected && (
                              <span className="start-song-mark">
                                <img
                                  className="start-song-mark-image"
                                  src={startSongMarkSrc}
                                  alt=""
                                  draggable="false"
                                />
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <button
              className="start-action-wrap"
              type="button"
              onPointerDown={handleStartPointerDown}
              onKeyDown={handleStartNativeKeyDown}
              onClick={handleStartTap}
            >
              <span className="start-action-frame">
                <span className="start-action-inner">
                  <span className="start-action-label">
                    <span className="start-action-text start-action-text-face pixel-font-zh">
                      开始
                    </span>
                  </span>
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {!pageReady && (
        <MagicLoadingOverlay
          theme={startTheme}
          text={loadingText}
          className="start-loading-overlay"
        />
      )}
    </div>
  );
}
