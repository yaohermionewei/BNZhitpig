import { getAudioContext } from "./AudioControllerWeb.js";

export const ORIGINAL_HIT_SFX_ID = "original";
export const DEFAULT_HIT_SFX_LAB_ID = "sample-freesound-847838-strong-punch";

const SAMPLED_HIT_IMPACT_SOUNDS = Object.freeze({
  "sample-freesound-517744-punch": {
    src: "/assets/audio/hit-lab/freesound-517744-punch-short.wav",
    volume: 6,
  },
  "sample-freesound-847838-strong-punch": {
    src: "/assets/audio/hit-lab/freesound-847838-strong-punch-short.wav",
    volume: 2.2,
  },
});

export const HIT_IMPACT_SOUND_OPTIONS = Object.freeze([
  {
    displayCode: "03",
    id: "original-plus-hyper-pixel",
    title: "原始+像素爆锤",
    description: "保留当前敲击，再叠像素爆锤的亮脆冲击。",
  },
  {
    displayCode: "04",
    id: "original-plus-air-burst",
    title: "原始+空气爆破",
    description: "保留当前敲击，再加一点压缩空气和短爆破。",
  },
  {
    displayCode: "20",
    id: "sample-freesound-517744-punch",
    title: "FS 517744 Punch",
    description: "Short game cut from the downloaded punch sample.",
  },
  {
    displayCode: "22",
    id: "sample-freesound-847838-strong-punch",
    title: "FS 847838 Strong Punch",
    description: "Short game cut from the first punch inside the downloaded punch pack.",
  },
]);

const HYBRID_HIT_IMPACT_SOUND_MIXES = Object.freeze({
  "original-plus-meat-slap": {
    originalVolumeScale: 0.45,
    syntheticVolume: 18,
  },
  "original-plus-hyper-pixel": {
    originalVolumeScale: 0.42,
    syntheticVolume: 22,
  },
  "original-plus-air-burst": {
    originalVolumeScale: 0.44,
    syntheticVolume: 20,
  },
  "original-plus-knockback": {
    originalVolumeScale: 0.48,
    syntheticVolume: 18,
  },
  "original-plus-compressed-heavy": {
    originalVolumeScale: 0.45,
    syntheticVolume: 19,
  },
  "original-plus-uppercut": {
    originalVolumeScale: 0.42,
    syntheticVolume: 21,
  },
});

const SYNTHETIC_HIT_IMPACT_SOUNDS = Object.freeze({
  "original-plus-meat-slap": [
    { kind: "noise", duration: 0.018, gain: 0.22, filter: "bandpass", frequency: 1120, q: 1.35, pan: -0.04, wet: 0.04 },
    { kind: "noise", delay: 0.006, duration: 0.052, gain: 0.13, filter: "bandpass", frequency: 1760, q: 1.9, pan: 0.14, wet: 0.06 },
    { kind: "osc", delay: 0.002, type: "triangle", frequency: 260, endFrequency: 118, duration: 0.074, gain: 0.12, pan: 0, wet: 0.04 },
  ],
  "original-plus-hyper-pixel": [
    { kind: "noise", duration: 0.012, gain: 0.24, filter: "highpass", frequency: 5200, q: 0.9, pan: 0.04 },
    { kind: "osc", delay: 0.002, type: "square", frequency: 960, endFrequency: 520, duration: 0.045, gain: 0.09, pan: -0.24 },
    { kind: "osc", delay: 0.01, type: "square", frequency: 480, endFrequency: 220, duration: 0.06, gain: 0.075, pan: 0.24 },
    { kind: "osc", delay: 0.016, type: "triangle", frequency: 145, endFrequency: 82, duration: 0.095, gain: 0.11, pan: 0 },
    { kind: "noise", delay: 0.026, duration: 0.075, gain: 0.052, filter: "bandpass", frequency: 3100, q: 2.8, pan: 0.5 },
  ],
  "original-plus-air-burst": [
    { kind: "noise", duration: 0.014, gain: 0.18, filter: "highpass", frequency: 2850, q: 0.8, pan: -0.08, wet: 0.08 },
    { kind: "noise", delay: 0.006, duration: 0.064, gain: 0.14, filter: "bandpass", frequency: 1480, q: 1.6, pan: 0.16, wet: 0.12 },
    { kind: "osc", delay: 0.012, type: "triangle", frequency: 310, endFrequency: 150, duration: 0.064, gain: 0.08, pan: 0, wet: 0.04 },
  ],
  "original-plus-knockback": [
    { kind: "noise", duration: 0.022, gain: 0.19, filter: "bandpass", frequency: 920, q: 1.25, pan: -0.08, wet: 0.05 },
    { kind: "osc", delay: 0.002, type: "sine", frequency: 285, endFrequency: 92, duration: 0.105, gain: 0.13, pan: 0, wet: 0.05 },
    { kind: "noise", delay: 0.042, duration: 0.07, gain: 0.075, filter: "bandpass", frequency: 620, q: 1.05, pan: 0.44, wet: 0.14 },
  ],
  "original-plus-compressed-heavy": [
    { kind: "noise", duration: 0.014, gain: 0.18, filter: "bandpass", frequency: 1320, q: 1.45, pan: 0, wet: 0.04 },
    { kind: "noise", delay: 0.004, duration: 0.048, gain: 0.14, filter: "bandpass", frequency: 720, q: 1.1, pan: -0.06, wet: 0.04 },
    { kind: "osc", delay: 0.002, type: "triangle", frequency: 230, endFrequency: 112, duration: 0.074, gain: 0.13, pan: 0.02, wet: 0.04 },
  ],
  "original-plus-uppercut": [
    { kind: "noise", duration: 0.016, gain: 0.18, filter: "bandpass", frequency: 1080, q: 1.35, pan: -0.02, wet: 0.05 },
    { kind: "osc", delay: 0.018, type: "triangle", frequency: 320, endFrequency: 430, duration: 0.07, gain: 0.09, pan: 0.22, wet: 0.08 },
    { kind: "noise", delay: 0.036, duration: 0.052, gain: 0.08, filter: "bandpass", frequency: 920, q: 1.2, pan: 0.36, wet: 0.12 },
  ],
  "air-snap": [
    { kind: "noise", duration: 0.018, gain: 0.34, filter: "highpass", frequency: 3200, q: 0.7, pan: -0.08 },
    { kind: "osc", type: "triangle", frequency: 235, endFrequency: 86, duration: 0.105, gain: 0.24, pan: 0 },
    { kind: "noise", delay: 0.004, duration: 0.085, gain: 0.16, filter: "bandpass", frequency: 1350, q: 2.2, pan: 0.12 },
    { kind: "noise", delay: 0.038, duration: 0.055, gain: 0.055, filter: "highpass", frequency: 2500, q: 0.9, pan: 0.55 },
    { kind: "osc", delay: 0.026, type: "square", frequency: 760, endFrequency: 540, duration: 0.055, gain: 0.052, pan: -0.36 },
  ],
  "elastic-pop": [
    { kind: "noise", duration: 0.014, gain: 0.27, filter: "highpass", frequency: 4200, q: 0.7, pan: 0.08 },
    { kind: "osc", type: "sine", frequency: 390, endFrequency: 120, duration: 0.13, gain: 0.25, pan: -0.02 },
    { kind: "osc", delay: 0.024, type: "triangle", frequency: 250, endFrequency: 310, duration: 0.08, gain: 0.09, pan: 0.28 },
    { kind: "osc", delay: 0.067, type: "triangle", frequency: 310, endFrequency: 230, duration: 0.07, gain: 0.055, pan: -0.28 },
    { kind: "noise", delay: 0.018, duration: 0.05, gain: 0.08, filter: "bandpass", frequency: 1800, q: 1.8, pan: 0.2 },
  ],
  "wide-bonk": [
    { kind: "noise", duration: 0.016, gain: 0.25, filter: "highpass", frequency: 4800, q: 0.8, pan: 0 },
    { kind: "osc", type: "square", frequency: 620, endFrequency: 405, duration: 0.06, gain: 0.11, pan: -0.2 },
    { kind: "osc", delay: 0.006, type: "triangle", frequency: 1240, endFrequency: 930, duration: 0.05, gain: 0.07, pan: 0.22 },
    { kind: "osc", delay: 0.018, type: "sine", frequency: 180, endFrequency: 92, duration: 0.12, gain: 0.18, pan: 0 },
    { kind: "noise", delay: 0.034, duration: 0.09, gain: 0.065, filter: "bandpass", frequency: 2600, q: 3.1, pan: 0.48 },
  ],
  "wood-smash": [
    { kind: "noise", duration: 0.022, gain: 0.31, filter: "bandpass", frequency: 1700, q: 1.45, pan: -0.05 },
    { kind: "osc", type: "triangle", frequency: 180, endFrequency: 72, duration: 0.115, gain: 0.27, pan: 0.03 },
    { kind: "osc", delay: 0.004, type: "sawtooth", frequency: 310, endFrequency: 140, duration: 0.055, gain: 0.055, pan: -0.18 },
    { kind: "noise", delay: 0.018, duration: 0.07, gain: 0.105, filter: "lowpass", frequency: 2100, q: 0.8, pan: 0.18 },
    { kind: "noise", delay: 0.042, duration: 0.045, gain: 0.045, filter: "highpass", frequency: 3000, q: 0.8, pan: -0.48 },
  ],
  "hyper-pixel": [
    { kind: "noise", duration: 0.012, gain: 0.36, filter: "highpass", frequency: 5200, q: 0.9, pan: 0.04 },
    { kind: "osc", type: "square", frequency: 960, endFrequency: 520, duration: 0.045, gain: 0.13, pan: -0.24 },
    { kind: "osc", delay: 0.01, type: "square", frequency: 480, endFrequency: 220, duration: 0.06, gain: 0.11, pan: 0.24 },
    { kind: "osc", delay: 0.016, type: "triangle", frequency: 145, endFrequency: 82, duration: 0.095, gain: 0.17, pan: 0 },
    { kind: "noise", delay: 0.026, duration: 0.075, gain: 0.075, filter: "bandpass", frequency: 3100, q: 2.8, pan: 0.5 },
  ],
  "flesh-hammer": [
    { kind: "noise", duration: 0.024, gain: 0.34, filter: "bandpass", frequency: 980, q: 1.65, pan: -0.04, wet: 0.06 },
    { kind: "osc", type: "sine", frequency: 245, endFrequency: 94, duration: 0.118, gain: 0.26, pan: 0, wet: 0.06 },
    { kind: "noise", delay: 0.006, duration: 0.074, gain: 0.16, filter: "lowpass", frequency: 1850, q: 0.72, pan: 0.12, wet: 0.08 },
    { kind: "noise", delay: 0.032, duration: 0.052, gain: 0.075, filter: "bandpass", frequency: 1350, q: 1.9, pan: 0.32, wet: 0.14 },
    { kind: "osc", delay: 0.04, type: "triangle", frequency: 310, endFrequency: 210, duration: 0.052, gain: 0.052, pan: -0.22, wet: 0.05 },
  ],
  "pork-pop": [
    { kind: "noise", duration: 0.018, gain: 0.3, filter: "bandpass", frequency: 1180, q: 1.2, pan: 0.02, wet: 0.07 },
    { kind: "osc", type: "triangle", frequency: 330, endFrequency: 132, duration: 0.1, gain: 0.21, pan: -0.04, wet: 0.05 },
    { kind: "noise", delay: 0.018, duration: 0.095, gain: 0.155, filter: "lowpass", frequency: 1500, q: 0.65, pan: 0.18, wet: 0.1 },
    { kind: "noise", delay: 0.028, duration: 0.06, gain: 0.11, filter: "bandpass", frequency: 740, q: 1.4, pan: -0.24, wet: 0.08 },
    { kind: "osc", delay: 0.052, type: "sine", frequency: 190, endFrequency: 155, duration: 0.075, gain: 0.06, pan: 0.26, wet: 0.08 },
  ],
  "knockaway-thump": [
    { kind: "noise", duration: 0.02, gain: 0.32, filter: "bandpass", frequency: 880, q: 1.55, pan: -0.1, wet: 0.06 },
    { kind: "osc", type: "sine", frequency: 275, endFrequency: 88, duration: 0.13, gain: 0.25, pan: 0, wet: 0.06 },
    { kind: "noise", delay: 0.012, duration: 0.07, gain: 0.12, filter: "lowpass", frequency: 2100, q: 0.8, pan: 0.1, wet: 0.08 },
    { kind: "noise", delay: 0.054, duration: 0.082, gain: 0.085, filter: "bandpass", frequency: 520, q: 1.05, pan: 0.48, wet: 0.16 },
    { kind: "osc", delay: 0.046, type: "triangle", frequency: 360, endFrequency: 260, duration: 0.07, gain: 0.045, pan: 0.46, wet: 0.12 },
  ],
  "compressed-body-hit": [
    { kind: "noise", duration: 0.016, gain: 0.28, filter: "bandpass", frequency: 1250, q: 1.35, pan: 0, wet: 0.05 },
    { kind: "osc", type: "triangle", frequency: 220, endFrequency: 105, duration: 0.082, gain: 0.28, pan: 0, wet: 0.04 },
    { kind: "noise", delay: 0.004, duration: 0.055, gain: 0.18, filter: "bandpass", frequency: 640, q: 1.15, pan: -0.08, wet: 0.05 },
    { kind: "noise", delay: 0.026, duration: 0.048, gain: 0.075, filter: "bandpass", frequency: 1720, q: 1.8, pan: 0.24, wet: 0.09 },
    { kind: "osc", delay: 0.018, type: "sine", frequency: 150, endFrequency: 98, duration: 0.064, gain: 0.08, pan: -0.18, wet: 0.04 },
  ],
  "comic-meat-uppercut": [
    { kind: "noise", duration: 0.018, gain: 0.31, filter: "bandpass", frequency: 1040, q: 1.45, pan: -0.02, wet: 0.06 },
    { kind: "osc", type: "sine", frequency: 260, endFrequency: 112, duration: 0.105, gain: 0.22, pan: 0, wet: 0.05 },
    { kind: "noise", delay: 0.014, duration: 0.076, gain: 0.14, filter: "lowpass", frequency: 1650, q: 0.7, pan: 0.16, wet: 0.09 },
    { kind: "osc", delay: 0.036, type: "triangle", frequency: 330, endFrequency: 430, duration: 0.072, gain: 0.075, pan: 0.28, wet: 0.08 },
    { kind: "noise", delay: 0.052, duration: 0.058, gain: 0.07, filter: "bandpass", frequency: 900, q: 1.2, pan: 0.44, wet: 0.15 },
  ],
});

let noiseBuffer = null;
let reverbBuffer = null;

function getNoiseBuffer(audioContext) {
  if (noiseBuffer && noiseBuffer.sampleRate === audioContext.sampleRate) return noiseBuffer;
  const length = Math.ceil(audioContext.sampleRate * 0.5);
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
}

function getReverbBuffer(audioContext) {
  if (reverbBuffer && reverbBuffer.sampleRate === audioContext.sampleRate) return reverbBuffer;
  const duration = 0.18;
  const decay = 7.5;
  const length = Math.ceil(audioContext.sampleRate * duration);
  const buffer = audioContext.createBuffer(2, length, audioContext.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      const t = index / length;
      data[index] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  reverbBuffer = buffer;
  return buffer;
}

function shapeGain(gainNode, time, peak, duration, attack = 0.004, volume = 1) {
  const end = time + duration;
  gainNode.gain.cancelScheduledValues(time);
  gainNode.gain.setValueAtTime(0.0001, time);
  gainNode.gain.linearRampToValueAtTime(peak * volume, time + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, end);
}

function createSpatialBus(audioContext, volume = 1) {
  const compressor = audioContext.createDynamicsCompressor();
  const master = audioContext.createGain();
  const reverb = audioContext.createConvolver();
  const reverbSend = audioContext.createGain();

  compressor.threshold.value = -18;
  compressor.knee.value = 16;
  compressor.ratio.value = 4.5;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.08;
  master.gain.value = 0.85 * volume;
  reverb.buffer = getReverbBuffer(audioContext);
  reverbSend.gain.value = 0.11;

  master.connect(compressor);
  compressor.connect(audioContext.destination);
  reverb.connect(reverbSend);
  reverbSend.connect(master);

  return { master, reverb };
}

function connectSpatial(audioContext, bus, node, panValue, wet = 0.1) {
  const pan = audioContext.createStereoPanner();
  const dry = audioContext.createGain();
  const wetGain = audioContext.createGain();
  pan.pan.value = panValue || 0;
  dry.gain.value = 1;
  wetGain.gain.value = wet;

  node.connect(pan);
  pan.connect(dry);
  dry.connect(bus.master);
  pan.connect(wetGain);
  wetGain.connect(bus.reverb);
}

function scheduleOsc(audioContext, bus, layer, startTime, volume) {
  const start = startTime + (layer.delay || 0);
  const duration = layer.duration;
  const source = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  source.type = layer.type || "triangle";
  source.frequency.setValueAtTime(layer.frequency, start);
  source.frequency.exponentialRampToValueAtTime(
    Math.max(20, layer.endFrequency || layer.frequency),
    start + duration
  );
  filter.type = "lowpass";
  filter.frequency.value = layer.filterFrequency || 5200;
  filter.Q.value = 0.75;
  shapeGain(gain, start, layer.gain, duration, layer.attack || 0.005, volume);
  source.connect(filter);
  filter.connect(gain);
  connectSpatial(audioContext, bus, gain, layer.pan || 0, layer.wet ?? 0.08);
  source.start(start);
  source.stop(start + duration + 0.025);
}

function scheduleNoise(audioContext, bus, layer, startTime, volume) {
  const start = startTime + (layer.delay || 0);
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  source.buffer = getNoiseBuffer(audioContext);
  filter.type = layer.filter || "bandpass";
  filter.frequency.setValueAtTime(layer.frequency || 1800, start);
  filter.Q.value = layer.q || 1;
  shapeGain(gain, start, layer.gain, layer.duration, layer.attack || 0.002, volume);
  source.connect(filter);
  filter.connect(gain);
  connectSpatial(audioContext, bus, gain, layer.pan || 0, layer.wet ?? 0.1);
  source.start(start, 0, layer.duration + 0.02);
}

function getSyntheticHitImpactSound(id) {
  return SYNTHETIC_HIT_IMPACT_SOUNDS[id] || null;
}

export function isSyntheticHitImpactSound(id) {
  return !!getSyntheticHitImpactSound(id);
}

export function isHybridHitImpactSound(id) {
  return !!HYBRID_HIT_IMPACT_SOUND_MIXES[id];
}

export function getHybridHitImpactMix(id) {
  return HYBRID_HIT_IMPACT_SOUND_MIXES[id] || null;
}

export function getSampledHitImpactSound(id) {
  return SAMPLED_HIT_IMPACT_SOUNDS[id] || null;
}

export function isSampledHitImpactSound(id) {
  return !!getSampledHitImpactSound(id);
}

export function getSampledHitImpactSources() {
  return Array.from(
    new Set(
      Object.values(SAMPLED_HIT_IMPACT_SOUNDS)
        .map((sound) => sound.src)
        .filter(Boolean)
    )
  );
}

export function playSyntheticHitImpact(id, options = {}) {
  const layers = getSyntheticHitImpactSound(id);
  if (!layers) return false;

  getAudioContext({ source: `hit-impact:${id}` })
    .then((audioContext) => {
      if (!audioContext || audioContext.state !== "running") return;
      const volume = Math.max(0, Number(options.volume) || 1);
      const bus = createSpatialBus(audioContext, options.masterVolume ?? 1);
      const startTime = audioContext.currentTime + 0.01;
      layers.forEach((layer) => {
        if (layer.kind === "noise") {
          scheduleNoise(audioContext, bus, layer, startTime, volume);
        } else {
          scheduleOsc(audioContext, bus, layer, startTime, volume);
        }
      });
    })
    .catch(() => {
      // Hit feedback is disposable; gameplay should never depend on this sound.
    });

  return true;
}
