import { useEffect, useMemo, useState } from "react";
import { songs } from "../game/songs.js";
import {
  START_CLOUDS,
  START_LOADING_MIN_DURATION_MS,
  getLoadingSubtitleImageSrc,
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

export default function StartScreen({ state, onThemeToggle, onSelectSong, onStart }) {
  const { startTheme, song } = state;
  const [pageReady, setPageReady] = useState(false);
  const [rabbitFrame, setRabbitFrame] = useState(0);
  const [pigFrame, setPigFrame] = useState(0);
  const rabbitFrameSources = useMemo(() => getRabbitFrameSources(startTheme), [startTheme]);
  const pigFrameSources = useMemo(() => getPigFrameSources(startTheme), [startTheme]);
  const startSongs = useMemo(() => getStartSongs(song?.id || "ditto"), [song?.id]);
  const currentRabbitFrameSrc =
    rabbitFrameSources[rabbitFrame % rabbitFrameSources.length] || rabbitFrameSources[0];
  const currentPigFrameSrc = pigFrameSources[pigFrame % pigFrameSources.length] || pigFrameSources[0];
  const startBackdropSrc = getStartBackdropSrc(startTheme);
  const themeToggleIconSrc = getThemeToggleIconSrc(startTheme);
  const startSongMarkSrc = getStartSongMarkSrc(startTheme);
  const loadingSubtitleImageSrc = getLoadingSubtitleImageSrc(startTheme);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([preloadStartImages(), wait(START_LOADING_MIN_DURATION_MS)]).then(() => {
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

  return (
    <div className={`screen start-screen page-${startTheme}`}>
      <div className="start-stage">
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

          <div className="start-hero" aria-hidden="true">
            <div className="start-hero-shadow start-hero-shadow-rabbit" />
            <div className="start-hero-shadow start-hero-shadow-pig" />
            <div className="start-rabbit-wrap">
              <div className="start-rabbit-sprite">
                <img
                  className="start-rabbit-frame"
                  src={currentRabbitFrameSrc}
                  alt=""
                  draggable="false"
                />
              </div>
            </div>
            <div className="start-pig-wrap">
              <div className="start-pig-sprite">
                <img className="start-pig-frame" src={currentPigFrameSrc} alt="" draggable="false" />
              </div>
            </div>
          </div>

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

          <button className="start-action-wrap" type="button" onClick={onStart}>
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

      {!pageReady && (
        <div className={`start-loading-overlay start-loading-overlay-${startTheme}`}>
          <div className="start-loading-spinner" />
          <div className="start-loading-copy">
            <img
              className="start-loading-subtitle-image"
              src={loadingSubtitleImageSrc}
              alt="进入魔法世界"
              draggable="false"
            />
          </div>
        </div>
      )}
    </div>
  );
}
