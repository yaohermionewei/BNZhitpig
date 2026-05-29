import { getAudioContext } from "./AudioControllerWeb.js";

const RESULT_VOICE_LOAD_TIMEOUT_MS = 8000;
const resultVoiceBufferCache = new Map();

function waitForResultVoiceTimeout(src) {
  return new Promise((_, reject) => {
    window.setTimeout(() => {
      reject(new Error(`Timed out loading result voice: ${src}`));
    }, RESULT_VOICE_LOAD_TIMEOUT_MS);
  });
}

async function loadResultVoiceBuffer(src, audioContext) {
  if (resultVoiceBufferCache.has(src)) {
    return resultVoiceBufferCache.get(src);
  }

  const loadPromise = Promise.race([
    fetch(src)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load result voice: ${src}`);
        }
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer)),
    waitForResultVoiceTimeout(src),
  ]);

  resultVoiceBufferCache.set(src, loadPromise);

  try {
    return await loadPromise;
  } catch (error) {
    resultVoiceBufferCache.delete(src);
    throw error;
  }
}

export function getResultVoiceClipVolume(clip) {
  return typeof clip?.volume === "number" && clip.volume > 0 ? clip.volume : 1;
}

export function stopResultVoicePlayback(playback) {
  if (!playback) return;

  if (playback.source) {
    try {
      playback.source.onended = null;
      playback.source.stop();
    } catch (error) {
      // The source may already have ended.
    }
    try {
      playback.source.disconnect();
    } catch (error) {
      // Source may already be disconnected.
    }
  }

  if (playback.gain) {
    try {
      playback.gain.disconnect();
    } catch (error) {
      // Gain may already be disconnected.
    }
  }
}

export async function playResultVoiceClip(clip, onEnded) {
  if (!clip?.src) return null;

  const audioContext = await getAudioContext();
  if (audioContext.state !== "running") {
    return null;
  }

  const buffer = await loadResultVoiceBuffer(clip.src, audioContext);
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = buffer;
  gain.gain.value = getResultVoiceClipVolume(clip);
  source.connect(gain);
  gain.connect(audioContext.destination);

  const playback = { source, gain };
  source.onended = () => {
    try {
      source.disconnect();
    } catch (error) {
      // Source may already be disconnected by cleanup.
    }
    try {
      gain.disconnect();
    } catch (error) {
      // Gain may already be disconnected by cleanup.
    }
    onEnded?.(playback);
  };

  source.start(0);
  return playback;
}
