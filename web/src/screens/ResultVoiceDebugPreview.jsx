import { useEffect, useMemo, useRef, useState } from "react";
import { createGameState } from "../game/engine.js";
import { buildResultSummary } from "../game/result.js";
import { resultVoiceClips } from "../game/resultVoiceClips.js";
import {
  getResultVoiceClipVolume,
  playResultVoiceClip,
  stopResultVoicePlayback,
} from "../game/resultVoicePlayback.js";
import { getDefaultSong } from "../game/songs.js";
import { unlockAudioForUserGesture } from "../game/AudioControllerWeb.js";
import ResultScreen from "./ResultScreen.jsx";

function clampVoiceIndex(index) {
  if (!resultVoiceClips.length) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.min(resultVoiceClips.length - 1, Math.max(0, Math.round(index)));
}

function getInitialVoiceIndex() {
  if (typeof window === "undefined") return 0;
  const value = Number(new URLSearchParams(window.location.search).get("voice"));
  return clampVoiceIndex(value);
}

function getClipDisplayName(clip, index) {
  const fileName = String(clip?.src || "")
    .split("/")
    .filter(Boolean)
    .pop();
  const decodedName = (() => {
    try {
      return decodeURIComponent(fileName || "");
    } catch (error) {
      return fileName || "";
    }
  })();
  return decodedName.replace(/\.(mp3|m4a|aac|wav|ogg)$/i, "") || `Voice ${index + 1}`;
}

function buildDebugResultSummary(startTheme) {
  const song = getDefaultSong();
  const state = createGameState(song.chart);
  state.score = 123450;
  state.combo = 88;
  state.bestCombo = 88;
  state.hits.perfect = 88;
  state.hits.good = 6;
  state.hits.miss = 1;
  state.ended = true;
  state.failed = false;

  return {
    ...buildResultSummary(song, state, startTheme),
    completedAt: "debug-result-voices",
  };
}

const panelStyle = {
  position: "absolute",
  left: 12,
  right: 12,
  bottom: 12,
  zIndex: 80,
  display: "grid",
  gap: 10,
  maxHeight: "44%",
  padding: 12,
  overflowY: "auto",
  color: "#f8f1dd",
  background: "rgba(17, 26, 46, 0.88)",
  border: "1px solid rgba(255, 239, 194, 0.42)",
  borderRadius: 8,
  boxShadow: "0 14px 36px rgba(0, 0, 0, 0.36)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 10,
};

const titleStyle = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.25,
};

const hintStyle = {
  margin: "3px 0 0",
  color: "rgba(248, 241, 221, 0.74)",
  fontSize: 11,
  lineHeight: 1.35,
};

const badgeStyle = {
  flex: "0 0 auto",
  padding: "4px 6px",
  borderRadius: 6,
  color: "#15203a",
  background: "#ffdd7a",
  fontFamily: "PixelEnPrimary, monospace",
  fontSize: 11,
  lineHeight: 1,
};

const listStyle = {
  display: "grid",
  gap: 6,
};

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: 8,
  minHeight: 38,
  padding: 7,
  border: "1px solid rgba(255, 255, 255, 0.14)",
  borderRadius: 6,
  background: "rgba(255, 255, 255, 0.07)",
};

const selectedRowStyle = {
  border: "1px solid rgba(255, 221, 122, 0.78)",
  background: "rgba(255, 221, 122, 0.16)",
};

const clipNameStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: 12,
  lineHeight: 1.25,
};

const clipMetaStyle = {
  marginTop: 2,
  color: "rgba(248, 241, 221, 0.62)",
  fontFamily: "PixelEnPrimary, monospace",
  fontSize: 10,
};

const controlsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 6,
};

const buttonStyle = {
  minHeight: 34,
  padding: "8px 8px",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  borderRadius: 6,
  color: "#f8f1dd",
  background: "rgba(255, 255, 255, 0.11)",
  fontSize: 12,
  lineHeight: 1.1,
};

const primaryButtonStyle = {
  ...buttonStyle,
  color: "#15203a",
  background: "#ffdd7a",
  border: "1px solid rgba(255, 221, 122, 0.92)",
};

const statusStyle = {
  minHeight: 16,
  color: "rgba(248, 241, 221, 0.74)",
  fontSize: 11,
  lineHeight: 1.3,
};

export default function ResultVoiceDebugPreview({ startTheme }) {
  const [selectedIndex, setSelectedIndex] = useState(getInitialVoiceIndex);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [status, setStatus] = useState("选择任意一条试听");
  const playbackRef = useRef(null);
  const playRequestIdRef = useRef(0);
  const summary = useMemo(() => buildDebugResultSummary(startTheme), [startTheme]);
  const selectedClip = resultVoiceClips[selectedIndex] || null;

  useEffect(
    () => () => {
      playRequestIdRef.current += 1;
      stopResultVoicePlayback(playbackRef.current);
      playbackRef.current = null;
    },
    []
  );

  function stopCurrentVoice(nextStatus = "已停止") {
    playRequestIdRef.current += 1;
    stopResultVoicePlayback(playbackRef.current);
    playbackRef.current = null;
    setPlayingIndex(null);
    setStatus(nextStatus);
  }

  function prepareUserAudioGesture() {
    unlockAudioForUserGesture();
  }

  async function playVoice(index) {
    const nextIndex = clampVoiceIndex(index);
    const clip = resultVoiceClips[nextIndex];
    if (!clip?.src) {
      stopCurrentVoice("没有找到这条语音");
      return;
    }

    const requestId = playRequestIdRef.current + 1;
    playRequestIdRef.current = requestId;
    prepareUserAudioGesture();
    stopResultVoicePlayback(playbackRef.current);
    playbackRef.current = null;
    setPlayingIndex(null);
    setStatus("正在加载...");
    setSelectedIndex(nextIndex);

    try {
      const playback = await playResultVoiceClip(clip, (endedPlayback) => {
        if (playbackRef.current !== endedPlayback) return;
        playbackRef.current = null;
        setPlayingIndex(null);
        setStatus(`第 ${nextIndex + 1} 条播放结束`);
      });

      if (playRequestIdRef.current !== requestId) {
        stopResultVoicePlayback(playback);
        return;
      }

      if (!playback) {
        setStatus("浏览器还没放行声音，请再点一次播放");
        return;
      }

      playbackRef.current = playback;
      setPlayingIndex(nextIndex);
      setStatus(`正在播放第 ${nextIndex + 1} 条`);
    } catch (error) {
      if (playRequestIdRef.current === requestId) {
        setStatus("播放失败或加载超时，请再点一次试试");
      }
    }
  }

  function playPrevious() {
    const nextIndex =
      selectedIndex <= 0 ? resultVoiceClips.length - 1 : selectedIndex - 1;
    playVoice(nextIndex);
  }

  function playNext() {
    const nextIndex =
      selectedIndex >= resultVoiceClips.length - 1 ? 0 : selectedIndex + 1;
    playVoice(nextIndex);
  }

  return (
    <div className="screen" style={{ background: "#17233d" }}>
      <ResultScreen
        summary={summary}
        startTheme={startTheme}
        onReplay={() => setStatus("调试页不会真的重开，点下面按钮逐条试听")}
        onHome={() => setStatus("调试页不会回首页，去掉 URL 参数即可")}
      />

      <aside style={panelStyle} aria-label="结果页感谢语音调试面板">
        <div style={headerStyle}>
          <div>
            <h1 className="pixel-font-zh" style={titleStyle}>
              结果页语音逐条验收
            </h1>
            <p style={hintStyle}>
              默认保留结果页 BGM；需要单听语音可加 debugBgm=0。
            </p>
          </div>
          <span style={badgeStyle}>{resultVoiceClips.length} CLIPS</span>
        </div>

        <div style={controlsStyle}>
          <button
            type="button"
            style={buttonStyle}
            onPointerDown={prepareUserAudioGesture}
            onClick={playPrevious}
          >
            上一条
          </button>
          <button
            type="button"
            style={primaryButtonStyle}
            onPointerDown={prepareUserAudioGesture}
            onClick={() => playVoice(selectedIndex)}
          >
            播放当前
          </button>
          <button
            type="button"
            style={buttonStyle}
            onPointerDown={prepareUserAudioGesture}
            onClick={playNext}
          >
            下一条
          </button>
        </div>

        <div style={listStyle}>
          {resultVoiceClips.map((clip, index) => {
            const isSelected = index === selectedIndex;
            const isPlaying = index === playingIndex;
            return (
              <button
                key={clip.src}
                type="button"
                style={{
	                  ...rowStyle,
	                  ...(isSelected ? selectedRowStyle : null),
	                }}
                onPointerDown={prepareUserAudioGesture}
                onClick={() => playVoice(index)}
              >
                <span style={{ minWidth: 0, textAlign: "left" }}>
                  <span style={clipNameStyle}>
                    {index + 1}. {getClipDisplayName(clip, index)}
                  </span>
                  <span style={clipMetaStyle}>
                    volume {getResultVoiceClipVolume(clip).toFixed(1)}x
                  </span>
                </span>
                <span style={badgeStyle}>{isPlaying ? "PLAY" : "TEST"}</span>
              </button>
            );
          })}
        </div>

        <div style={controlsStyle}>
          <button
            type="button"
            style={buttonStyle}
            onPointerDown={prepareUserAudioGesture}
            onClick={() => stopCurrentVoice("已停止当前语音")}
          >
            停止
          </button>
          <button type="button" style={buttonStyle} onClick={() => setSelectedIndex(0)}>
            选第 1 条
          </button>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => setSelectedIndex(resultVoiceClips.length - 1)}
          >
            选最后
          </button>
        </div>

        <div style={statusStyle} role="status" aria-live="polite">
          {status}
          {selectedClip?.src ? ` · 当前第 ${selectedIndex + 1} 条` : ""}
        </div>
      </aside>
    </div>
  );
}
