import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { songs } from "../game/songs.js";
import { playUiSound } from "../game/uiSounds.js";
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

function wait(durationMs) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function preloadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(false);
      return;
    }

    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });
}

function preloadStartImages() {
  const sources = Array.from(
    new Set([
      ...getStartCriticalImageSources("dark"),
      ...getStartCriticalImageSources("light"),
    ])
  );

  return Promise.allSettled(sources.map((src) => preloadImage(src)));
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

export default function StartScreen({ state, onThemeToggle, onSelectSong, onStart }) {
  const { startTheme, song } = state;
  const stageRef = useRef(null);
  const heroRef = useRef(null);
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

    Promise.allSettled([
      preloadStartImages(),
      waitForStartFonts(),
      wait(START_LOADING_MIN_DURATION_MS),
    ]).then(() => {
      if (!cancelled) {
        setPageReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

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

  function handleSongSelect(item) {
    if (!item.available || item.id === song?.id) {
      return;
    }

    const playableSong = songs.find((candidate) => candidate.id === item.id);
    if (playableSong) {
      onSelectSong(playableSong);
    }
  }

  function handleStartTap() {
    playUiSound("confirm");
    onStart?.();
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
                        <button
                          key={item.id}
                          className={`start-song-row ${
                            item.selected ? "start-song-row-selected" : ""
                          } ${item.available ? "" : "start-song-row-disabled"}`}
                          type="button"
                          disabled={!item.available}
                          onClick={() => handleSongSelect(item)}
                        >
                          <span className="start-song-row-fill">
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
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <button className="start-action-wrap" type="button" onClick={handleStartTap}>
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
          text={LOADING_COPY.enterWorld}
          className="start-loading-overlay"
        />
      )}
    </div>
  );
}
