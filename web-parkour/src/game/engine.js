const NOTE_SCORES = Object.freeze({
  perfect: 1000,
  good: 700,
});

const NOTE_SCORE_WEIGHTS = Object.freeze({
  tap: 1,
  hold: 1.5,
});

const DEFAULT_WINDOWS = Object.freeze({
  perfect: 0.07,
  good: 0.14,
  miss: 0.18,
});

const COLLECT_LOOKAHEAD = 0.024;
const HOLD_OFF_LANE_GRACE = 0.1;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getWindows(chart) {
  return {
    perfect: chart.windows?.perfect || DEFAULT_WINDOWS.perfect,
    good: Math.max(chart.windows?.good || DEFAULT_WINDOWS.good, DEFAULT_WINDOWS.good),
    miss: Math.max(chart.windows?.miss || DEFAULT_WINDOWS.miss, DEFAULT_WINDOWS.miss),
  };
}

function cloneNotes(chart) {
  return (chart.notes || []).map((note) => ({
    ...note,
    judged: false,
    hit: false,
    result: null,
    holding: false,
    collectStartedAt: null,
    missedAt: null,
    holdHeadQuality: null,
    offLaneTime: 0,
  }));
}

function getNoteScore(note, quality) {
  const base = NOTE_SCORES[quality] || 0;
  const weight = NOTE_SCORE_WEIGHTS[note?.kind || "tap"] || 1;
  return Math.round(base * weight);
}

function addEffect(state, effect) {
  state.effects.push(effect);
}

function createPigLaunch(noteId = 0, lane = 1) {
  const direction = lane === 0 ? -1 : lane === 2 ? 1 : noteId % 2 === 0 ? -1 : 1;
  return {
    direction,
    spin: direction * 3.8,
    drift: 150,
    lift: 96,
    drop: 54,
  };
}

function queueAudioCue(state, cue) {
  state.audioCues.push(cue);
}

function addScore(state, note, quality) {
  state.score = Math.max(0, state.score + getNoteScore(note, quality));
}

function registerCollect(state, note, quality, currentTime) {
  if (note.judged) return;
  note.judged = true;
  note.hit = true;
  note.result = quality;
  note.holding = false;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.hits[quality] += 1;
  state.judgementText = quality === "perfect" ? "Perfect" : "Good";
  addScore(state, note, quality);
  queueAudioCue(state, "hit");
  const pigLaunch = createPigLaunch(note.id ?? 0, note.lane);
  addEffect(state, {
    kind: "collect",
    lane: note.lane,
    quality,
    noteId: note.id,
    age: 0,
    duration: quality === "perfect" ? 0.42 : 0.34,
  });
  addEffect(state, {
    kind: "pigLaunch",
    lane: note.lane,
    noteId: note.id,
    direction: pigLaunch.direction,
    age: 0,
    duration: 0.72,
    launch: pigLaunch,
  });
  addEffect(state, {
    kind: "floatText",
    lane: note.lane,
    quality,
    age: 0,
    duration: 0.62,
    startedAt: currentTime,
  });
}

function registerMiss(state, note, currentTime) {
  if (note.judged) return;
  note.judged = true;
  note.hit = false;
  note.result = "miss";
  note.missedAt = currentTime;
  note.holding = false;
  state.combo = 0;
  state.hits.miss += 1;
  state.judgementText = "Miss";
  addEffect(state, {
    kind: "missGhost",
    lane: note.lane,
    noteId: note.id,
    age: 0,
    duration: 0.42,
    missedAt: currentTime,
  });
}

function finishIfReady(state, currentTime) {
  if (state.ended) return;
  const allJudged = state.notes.every((note) => note.judged);
  const duration = Number(state.chart.duration) || 0;
  if (allJudged && currentTime >= duration - 0.45) {
    state.ended = true;
  }
}

export function createParkourState(chart) {
  return {
    chart,
    notes: cloneNotes(chart),
    currentTime: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    ended: false,
    failed: false,
    playerLane: 1,
    targetLane: 1,
    playerLanePosition: 1,
    dragActive: false,
    judgementText: "Ready",
    hits: {
      perfect: 0,
      good: 0,
      miss: 0,
    },
    effects: [],
    audioCues: [],
  };
}

export function setPlayerDragX(state, x, laneMetrics) {
  if (!laneMetrics) return state;
  const bottomLeft = laneMetrics.centerX - laneMetrics.bottomWidth / 2;
  const laneWidth = laneMetrics.bottomWidth / 3;
  const nextLane = clamp(Math.floor((x - bottomLeft) / Math.max(1, laneWidth)), 0, 2);
  state.targetLane = nextLane;
  state.playerLane = nextLane;
  return state;
}

export function updateParkourState(state, currentTime, dt, playerLane) {
  if (state.ended) return state;

  state.currentTime = currentTime;
  state.playerLane = clamp(playerLane, 0, 2);
  state.playerLanePosition +=
    (state.playerLane - state.playerLanePosition) * clamp(dt * 16, 0, 1);

  const windows = getWindows(state.chart);

  state.notes.forEach((note) => {
    if (note.judged) return;

    const sameLane = state.playerLane === note.lane;

    if (note.kind === "hold") {
      if (!note.holding && note.collectStartedAt === null) {
        const canStart =
          currentTime >= note.time - COLLECT_LOOKAHEAD &&
          currentTime - note.time <= windows.good;
        if (canStart && sameLane) {
          const diff = Math.abs(currentTime - note.time);
          note.holding = true;
          note.collectStartedAt = currentTime;
          note.holdHeadQuality = diff <= windows.perfect ? "perfect" : "good";
          note.offLaneTime = 0;
          addEffect(state, {
            kind: "holdStart",
            lane: note.lane,
            quality: note.holdHeadQuality,
            noteId: note.id,
            age: 0,
            duration: 0.28,
          });
        } else if (currentTime - note.time > windows.good) {
          registerMiss(state, note, currentTime);
        }
        return;
      }

      if (note.holding) {
        if (currentTime >= note.time && currentTime <= note.endTime && !sameLane) {
          note.offLaneTime += dt;
        } else if (sameLane) {
          note.offLaneTime = Math.max(0, note.offLaneTime - dt * 0.8);
        }

        if (note.offLaneTime > HOLD_OFF_LANE_GRACE) {
          registerMiss(state, note, currentTime);
          return;
        }

        if (currentTime >= note.endTime - COLLECT_LOOKAHEAD) {
          const tailDiff = Math.abs(currentTime - note.endTime);
          const quality =
            note.holdHeadQuality === "perfect" && tailDiff <= windows.perfect
              ? "perfect"
              : "good";
          registerCollect(state, note, quality, currentTime);
        }
      }
      return;
    }

    const canCollect =
      currentTime >= note.time - COLLECT_LOOKAHEAD &&
      currentTime - note.time <= windows.good;
    if (canCollect && sameLane) {
      const diff = Math.abs(currentTime - note.time);
      registerCollect(state, note, diff <= windows.perfect ? "perfect" : "good", currentTime);
      return;
    }

    if (currentTime - note.time > windows.miss) {
      registerMiss(state, note, currentTime);
    }
  });

  state.effects = state.effects
    .map((effect) => ({ ...effect, age: effect.age + dt }))
    .filter((effect) => effect.age < effect.duration);

  finishIfReady(state, currentTime);
  return state;
}

export function getMaxPerfectScore(notes) {
  return Math.max(
    1,
    (notes || []).reduce((total, note) => total + getNoteScore(note, "perfect"), 0)
  );
}
