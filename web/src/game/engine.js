const NOTE_SCORES = Object.freeze({
  perfect: 4400,
  good: 3080,
});
const NOTE_SCORE_WEIGHTS = Object.freeze({
  tap: 1,
  direction: 1.5,
  hold: 1.5,
});
const DEFAULT_MAX_LIVES = 5;
const END_RUN_ON_ZERO_LIVES = true;

function cloneNotes(chart) {
  return chart.notes.map((note, index) => ({
    id: index,
    time: note.time,
    endTime: note.endTime || note.time,
    kind: note.kind === "hold" ? "hold" : "tap",
    direction:
      note.kind !== "hold" && (note.direction === "left" || note.direction === "right")
        ? note.direction
        : null,
    label: note.label || "",
    size: note.size || 1,
    judged: false,
    hit: false,
    result: null,
    holding: false,
    holdStartedAt: null,
    holdHeadQuality: null,
    holdTailQuality: null,
    holdBroken: false,
    tailReleasedAt: null,
  }));
}

function createPigLaunch(noteId, launchDirection = null) {
  const direction =
    launchDirection === "left"
      ? -1
      : launchDirection === "right"
        ? 1
        : noteId % 2 === 0
          ? -1
          : 1;

  return {
    direction,
    spin: direction * 3.8,
    drift: 196,
    lift: 148,
    drop: 46,
  };
}

function addScore(state, delta) {
  state.score = Math.max(0, state.score + delta);
}

function getNoteScoreWeight(note) {
  if (!note) {
    return NOTE_SCORE_WEIGHTS.tap;
  }

  if (note.kind === "hold") {
    return NOTE_SCORE_WEIGHTS.hold;
  }

  if (note.direction) {
    return NOTE_SCORE_WEIGHTS.direction;
  }

  return NOTE_SCORE_WEIGHTS.tap;
}

function getNoteScore(note, kind) {
  const baseScore = NOTE_SCORES[kind] || 0;
  return Math.round(baseScore * getNoteScoreWeight(note));
}

function addEffect(state, effect) {
  state.effects.push(effect);
}

function queueAudioCue(state, cue) {
  state.audioCues.push(cue);
}

function createGameState(chart) {
  return {
    chart,
    notes: cloneNotes(chart),
    activeHoldId: null,
    currentTime: 0,
    combo: 0,
    bestCombo: 0,
    score: 0,
    maxLives: DEFAULT_MAX_LIVES,
    lives: DEFAULT_MAX_LIVES,
    judgementText: "准备开砸",
    ended: false,
    failed: false,
    hits: {
      perfect: 0,
      good: 0,
      miss: 0,
      empty: 0,
    },
    effects: [],
    audioCues: [],
  };
}

function pushBurst(state, kind, noteId = 0, options = {}) {
  if (kind !== "miss") {
    addEffect(state, {
      kind: "impact",
      quality: kind,
      age: 0,
      duration: 0.32,
    });
    addEffect(state, {
      kind: "laneFlash",
      quality: kind,
      age: 0,
      duration: kind === "perfect" ? 0.34 : 0.28,
    });
  }

  addEffect(state, {
    kind: "feedbackText",
    quality: kind,
    age: 0,
    duration: 0.5,
  });

  if (kind !== "miss") {
    queueAudioCue(state, "hit");
    addEffect(state, {
      kind: "pigLaunch",
      direction: options.direction || null,
      age: 0,
      duration: 0.66,
      launch: createPigLaunch(noteId, options.launchDirection || options.direction || null),
    });
  } else {
    addEffect(state, {
      kind: "damage",
      age: 0,
      duration: options.damageDuration || 0.42,
      fadeTail: options.damageFadeTail,
      maxAlpha: options.damageMaxAlpha,
    });
  }
}

function getActiveHold(state) {
  if (state.activeHoldId === null || state.activeHoldId === undefined) {
    return null;
  }

  return state.notes[state.activeHoldId] || null;
}

function applySuccess(state, note, kind, diff, options = {}) {
  note.judged = true;
  note.hit = true;
  note.holding = false;
  note.result = kind;
  note.holdStartedAt = null;
  note.holdHeadQuality = null;
  note.holdTailQuality = null;
  note.holdBroken = false;
  note.tailReleasedAt = null;
  state.activeHoldId = null;

  if (kind === "perfect") {
    state.hits.perfect += 1;
    state.combo += 1;
    addScore(state, getNoteScore(note, kind));
    state.judgementText = "Perfect";
  } else {
    state.hits.good += 1;
    state.combo += 1;
    addScore(state, getNoteScore(note, kind));
    state.judgementText = "Good";
  }

  pushBurst(state, kind, note.id, {
    direction: options.direction || note.direction,
    launchDirection: options.launchDirection || options.direction || note.direction,
  });
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  return { type: kind, diff, note };
}

function registerMiss(state, note, currentTime = note.time) {
  if (note.judged) {
    return;
  }

  const missTime = Math.max(note.time, currentTime);
  const remainingHoldTime =
    note.kind === "hold" ? Math.max(0, note.endTime - missTime) : 0;

  note.holding = false;
  note.judged = true;
  note.hit = false;
  note.result = "miss";
  note.holdStartedAt = null;
  note.holdHeadQuality = null;
  note.holdBroken = false;
  note.holdTailQuality = null;
  note.tailReleasedAt = null;
  state.activeHoldId = null;
  state.combo = 0;
  state.hits.miss += 1;
  state.lives = Math.max(0, (state.lives || 0) - 1);
  if (END_RUN_ON_ZERO_LIVES && state.lives <= 0) {
    state.failed = true;
    state.ended = true;
  }
  state.judgementText = "Miss";
  queueAudioCue(state, "miss");
  pushBurst(state, "miss", note.id, {
    damageDuration:
      remainingHoldTime > 0
        ? Math.max(0.42, remainingHoldTime + 0.22)
        : 0.42,
    damageFadeTail: remainingHoldTime > 0 ? 0.22 : undefined,
    damageMaxAlpha: note.kind === "hold" ? 0.78 : 0.72,
  });
}

function finalizeHold(state, note, currentTime) {
  if (!note || note.judged) {
    return { type: "idle" };
  }

  if (note.holdStartedAt === null || note.holdBroken || !note.holdHeadQuality) {
    registerMiss(state, note, Math.max(currentTime, note.endTime));
    return { type: "miss", note };
  }

  const tailQuality = note.holdTailQuality;
  if (!tailQuality) {
    registerMiss(state, note, Math.max(currentTime, note.endTime));
    return { type: "miss", note };
  }

  const kind =
    note.holdHeadQuality === "perfect" && tailQuality === "perfect"
      ? "perfect"
      : "good";
  const diff = Math.abs((note.tailReleasedAt ?? note.endTime) - note.endTime);

  return applySuccess(state, note, kind, diff);
}

function updateGameState(state, currentTime, dt) {
  if (state.ended) {
    return state;
  }

  state.currentTime = currentTime;
  const missWindow = state.chart.windows.miss;
  const goodWindow = state.chart.windows.good;

  state.notes.forEach((note) => {
    if (note.judged) {
      return;
    }

    if (note.kind === "hold") {
      if (note.holdStartedAt === null && currentTime - note.time > missWindow) {
        registerMiss(state, note, currentTime);
        return;
      }

      if (note.holdStartedAt !== null && currentTime - note.endTime > goodWindow) {
        registerMiss(state, note, currentTime);
      }
      return;
    }

    if (currentTime - note.time > missWindow) {
      registerMiss(state, note, currentTime);
    }
  });

  state.effects = state.effects
    .map((effect) => ({
      ...effect,
      age: effect.age + dt,
    }))
    .filter((effect) => effect.age < effect.duration);

  const finished = state.notes.every((note) => note.judged);
  if (finished && currentTime > state.chart.duration - 0.8) {
    state.ended = true;
  }

  return state;
}

function findBestNote(state, currentTime, predicate = null) {
  const missWindow = state.chart.windows.miss;
  const goodWindow = state.chart.windows.good;

  let bestNote = null;
  let bestDiff = Infinity;

  state.notes.forEach((note) => {
    if (note.judged || note.holding || (note.kind === "hold" && note.holdStartedAt !== null)) {
      return;
    }

    if (predicate && !predicate(note)) {
      return;
    }

    const delta = currentTime - note.time;
    const diff = Math.abs(delta);
    const inEarlyHitWindow = delta <= 0 && diff <= goodWindow;
    const inLateJudgeWindow = delta > 0 && diff <= missWindow;

    if ((inEarlyHitWindow || inLateJudgeWindow) && diff < bestDiff) {
      bestDiff = diff;
      bestNote = note;
    }
  });

  return {
    note: bestNote,
    diff: bestDiff,
    missWindow,
    goodWindow,
  };
}

function createEmptyJudgeResult(state) {
  state.hits.empty += 1;
  state.judgementText = "挥空";
  return { type: "empty" };
}

function resolveMatchedNote(state, note, diff, currentTime, options = {}) {
  const perfectWindow = state.chart.windows.perfect;
  const goodWindow = state.chart.windows.good;

  if (note.kind === "hold" && diff <= goodWindow) {
    note.holding = true;
    note.holdStartedAt = currentTime;
    note.holdHeadQuality = diff <= perfectWindow ? "perfect" : "good";
    note.holdTailQuality = null;
    note.holdBroken = false;
    note.tailReleasedAt = null;
    state.activeHoldId = note.id;
    return { type: "holdStart", diff, note };
  }

  if (diff <= perfectWindow) {
    return applySuccess(state, note, "perfect", diff, options);
  }

  if (diff <= goodWindow) {
    return applySuccess(state, note, "good", diff, options);
  }

  registerMiss(state, note, currentTime);
  return { type: "miss", diff, note };
}

function peekBestNote(state, currentTime) {
  return findBestNote(state, currentTime);
}

function judgeTap(state, currentTime) {
  if (state.ended) {
    return { type: "ended" };
  }

  if (getActiveHold(state)) {
    return { type: "holding" };
  }

  const { note: bestNote, diff: bestDiff } = findBestNote(
    state,
    currentTime,
    (note) => !note.direction
  );

  if (!bestNote) {
    return createEmptyJudgeResult(state);
  }

  return resolveMatchedNote(state, bestNote, bestDiff, currentTime);
}

function judgeDirection(state, currentTime, direction) {
  if (state.ended) {
    return { type: "ended" };
  }

  if (getActiveHold(state)) {
    return { type: "holding" };
  }

  const normalizedDirection =
    direction === "left" || direction === "right" ? direction : null;
  if (!normalizedDirection) {
    return createEmptyJudgeResult(state);
  }

  const overall = findBestNote(state, currentTime);
  if (!overall.note) {
    return createEmptyJudgeResult(state);
  }

  if (overall.note.direction && overall.note.direction !== normalizedDirection) {
    registerMiss(state, overall.note, currentTime);
    return {
      type: "wrongDirection",
      diff: overall.diff,
      note: overall.note,
      direction: normalizedDirection,
    };
  }

  const { note: bestNote, diff: bestDiff } = findBestNote(
    state,
    currentTime,
    (note) => !note.direction || note.direction === normalizedDirection
  );

  if (!bestNote) {
    return createEmptyJudgeResult(state);
  }

  return resolveMatchedNote(state, bestNote, bestDiff, currentTime, {
    direction: normalizedDirection,
    launchDirection: normalizedDirection,
  });
}

function releaseHold(state, currentTime) {
  const note = getActiveHold(state);

  if (!note || note.judged) {
    return { type: "idle" };
  }

  const tailPerfectWindow = state.chart.windows.perfect;
  const tailGoodWindow = state.chart.windows.good;
  const tailDiff = Math.abs(currentTime - note.endTime);
  note.holding = false;
  note.tailReleasedAt = currentTime;
  state.activeHoldId = null;

  if (tailDiff > tailGoodWindow) {
    registerMiss(state, note, currentTime);
    return { type: "holdMiss", diff: tailDiff, note };
  }

  note.holdTailQuality = tailDiff <= tailPerfectWindow ? "perfect" : "good";
  return finalizeHold(state, note, currentTime);
}

function buildResultText(state) {
  return `Perfect ${state.hits.perfect} / Good ${state.hits.good} / Miss ${state.hits.miss}\n最高连击 ${state.bestCombo} · 得分 ${state.score}`;
}

export {
  createGameState,
  updateGameState,
  peekBestNote,
  judgeTap,
  judgeDirection,
  releaseHold,
  buildResultText,
};
