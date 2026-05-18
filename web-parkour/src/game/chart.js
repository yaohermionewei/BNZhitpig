const LANES = Object.freeze([0, 1, 2]);
const CENTER_LANE = 1;
const FAST_CLUSTER_GAP = 0.34;
const SHORT_MOVE_GAP = 0.52;
const PHRASE_GAP = 0.84;
const MIN_MOVE_INTERVAL = 0.42;

function clampLane(lane) {
  return Math.max(0, Math.min(2, Math.round(lane)));
}

function pickAdjacentLane(currentLane, directionHint, phraseIndex) {
  if (directionHint === "left") {
    return clampLane(currentLane - 1);
  }
  if (directionHint === "right") {
    return clampLane(currentLane + 1);
  }

  const sweep = phraseIndex % 4;
  if (sweep === 0) return clampLane(currentLane + 1);
  if (sweep === 1) return clampLane(currentLane - 1);
  if (sweep === 2) return currentLane === 1 ? 0 : 1;
  return currentLane === 1 ? 2 : 1;
}

function shouldMoveForNote(note, gap, timeSinceMove, phraseStarted) {
  if (timeSinceMove < MIN_MOVE_INTERVAL) return false;
  if (note.direction === "left" || note.direction === "right") return gap >= FAST_CLUSTER_GAP;
  if (phraseStarted) return true;
  if (gap < SHORT_MOVE_GAP) return false;
  if (note.accent) return true;
  return gap >= PHRASE_GAP;
}

export function createParkourChart(baseChart) {
  let currentLane = CENTER_LANE;
  let phraseIndex = 0;
  let lastNoteTime = -Infinity;
  let lastMoveTime = -Infinity;

  const notes = (baseChart.notes || []).map((sourceNote, index) => {
    const kind = sourceNote.kind === "hold" ? "hold" : "tap";
    const gap = Number.isFinite(lastNoteTime) ? sourceNote.time - lastNoteTime : Infinity;
    const phraseStarted = gap >= PHRASE_GAP;

    if (phraseStarted && index > 0) {
      phraseIndex += 1;
    }

    if (kind !== "hold") {
      const timeSinceMove = sourceNote.time - lastMoveTime;
      if (shouldMoveForNote(sourceNote, gap, timeSinceMove, phraseStarted)) {
        const nextLane = pickAdjacentLane(currentLane, sourceNote.direction, phraseIndex);
        if (nextLane !== currentLane) {
          currentLane = nextLane;
          lastMoveTime = sourceNote.time;
        }
      }
    }

    const note = {
      id: index,
      time: sourceNote.time,
      endTime: sourceNote.endTime || sourceNote.time,
      kind,
      lane: currentLane,
      size: sourceNote.size || 1,
      accent: !!sourceNote.accent,
      direction:
        sourceNote.direction === "left" || sourceNote.direction === "right"
          ? sourceNote.direction
          : null,
    };
    lastNoteTime = sourceNote.time;
    return note;
  });

  return {
    ...baseChart,
    mode: "parkour",
    lanes: LANES,
    notes,
  };
}
