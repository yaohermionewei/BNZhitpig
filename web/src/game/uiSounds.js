import { getAudioContext, unlockAudioForUserGesture } from "./AudioControllerWeb.js";

const SOUND_RECIPES = Object.freeze({
  tap: Object.freeze([
    Object.freeze({
      type: "square",
      startFrequency: 1180,
      endFrequency: 920,
      duration: 0.055,
      peakGain: 0.045,
      filterFrequency: 3600,
    }),
  ]),
  confirm: Object.freeze([
    Object.freeze({
      type: "square",
      startFrequency: 760,
      endFrequency: 940,
      duration: 0.055,
      peakGain: 0.052,
      filterFrequency: 4200,
    }),
    Object.freeze({
      type: "triangle",
      startOffset: 0.045,
      startFrequency: 1120,
      endFrequency: 1420,
      duration: 0.07,
      peakGain: 0.05,
      filterFrequency: 5000,
    }),
  ]),
  back: Object.freeze([
    Object.freeze({
      type: "square",
      startFrequency: 880,
      endFrequency: 560,
      duration: 0.085,
      peakGain: 0.052,
      filterFrequency: 3800,
    }),
  ]),
  resume: Object.freeze([
    Object.freeze({
      type: "triangle",
      startFrequency: 620,
      endFrequency: 720,
      duration: 0.05,
      peakGain: 0.046,
      filterFrequency: 4300,
    }),
    Object.freeze({
      type: "square",
      startOffset: 0.038,
      startFrequency: 930,
      endFrequency: 1040,
      duration: 0.06,
      peakGain: 0.04,
      filterFrequency: 4600,
    }),
  ]),
});

const VICTORY_FANFARE_NOTES = Object.freeze([
  Object.freeze({ frequency: 523.25, startOffset: 0, duration: 0.12, peakGain: 0.085 }),
  Object.freeze({ frequency: 659.25, startOffset: 0.11, duration: 0.12, peakGain: 0.085 }),
  Object.freeze({ frequency: 783.99, startOffset: 0.22, duration: 0.13, peakGain: 0.09 }),
  Object.freeze({ frequency: 1046.5, startOffset: 0.35, duration: 0.26, peakGain: 0.1 }),
]);

const VICTORY_FANFARE_SPARKLES = Object.freeze([
  Object.freeze({ frequency: 1567.98, startOffset: 0.58, duration: 0.07, peakGain: 0.035 }),
  Object.freeze({ frequency: 2093, startOffset: 0.66, duration: 0.08, peakGain: 0.032 }),
]);
const VICTORY_FANFARE_VOLUME_MULTIPLIER = 1.5;

function scheduleTone(audioContext, tone) {
  const startAt = audioContext.currentTime + (tone.startOffset || 0);
  const endAt = startAt + tone.duration;
  const attackEndAt = startAt + Math.min(0.012, tone.duration * 0.35);
  const oscillator = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();

  oscillator.type = tone.type;
  oscillator.frequency.setValueAtTime(tone.startFrequency, startAt);
  oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, endAt);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(tone.filterFrequency, startAt);
  filter.Q.setValueAtTime(0.7, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(tone.peakGain, attackEndAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.onended = () => {
    oscillator.disconnect();
    filter.disconnect();
    gain.disconnect();
  };

  oscillator.start(startAt);
  oscillator.stop(endAt + 0.02);
}

function scheduleVictoryTone(audioContext, note) {
  scheduleTone(audioContext, {
    type: "square",
    startFrequency: note.frequency,
    endFrequency: note.frequency * 1.01,
    startOffset: note.startOffset,
    duration: note.duration,
    peakGain: note.peakGain * VICTORY_FANFARE_VOLUME_MULTIPLIER,
    filterFrequency: 5200,
  });
  scheduleTone(audioContext, {
    type: "triangle",
    startFrequency: note.frequency * 0.5,
    endFrequency: note.frequency * 0.505,
    startOffset: note.startOffset,
    duration: note.duration + 0.04,
    peakGain: note.peakGain * 0.36 * VICTORY_FANFARE_VOLUME_MULTIPLIER,
    filterFrequency: 3600,
  });
}

async function playVictoryFanfareAsync() {
  unlockAudioForUserGesture();
  const audioContext = await getAudioContext();
  if (!audioContext || audioContext.state !== "running") return false;
  VICTORY_FANFARE_NOTES.forEach((note) => scheduleVictoryTone(audioContext, note));
  VICTORY_FANFARE_SPARKLES.forEach((sparkle) => {
    scheduleTone(audioContext, {
      type: "triangle",
      startFrequency: sparkle.frequency,
      endFrequency: sparkle.frequency * 1.08,
      startOffset: sparkle.startOffset,
      duration: sparkle.duration,
      peakGain: sparkle.peakGain * VICTORY_FANFARE_VOLUME_MULTIPLIER,
      filterFrequency: 6400,
    });
  });
  return true;
}

async function playUiSoundAsync(kind) {
  const recipe = SOUND_RECIPES[kind] || SOUND_RECIPES.tap;
  unlockAudioForUserGesture();
  const audioContext = await getAudioContext();
  if (!audioContext || audioContext.state !== "running") return;
  recipe.forEach((tone) => scheduleTone(audioContext, tone));
}

export function playUiSound(kind = "tap") {
  playUiSoundAsync(kind).catch(() => {
    // UI sounds are disposable feedback; button behavior should never depend on them.
  });
}

export function playVictoryFanfare() {
  return playVictoryFanfareAsync().catch(() => {
    // The ending overlay should still proceed if a decorative fanfare cannot play.
    return false;
  });
}
