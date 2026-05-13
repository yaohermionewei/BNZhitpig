const RESULT_SCORE_VALUES = Object.freeze({
  perfect: 4400,
});

const RESULT_NOTE_SCORE_WEIGHTS = Object.freeze({
  tap: 1,
  direction: 1.5,
  hold: 1.5,
});

function formatScoreDisplay(score) {
  return String(Math.max(0, Math.round(score))).padStart(5, "0");
}

function getResultNoteScoreWeight(note) {
  if (!note) return RESULT_NOTE_SCORE_WEIGHTS.tap;
  if (note.kind === "hold") return RESULT_NOTE_SCORE_WEIGHTS.hold;
  if (note.direction === "left" || note.direction === "right") {
    return RESULT_NOTE_SCORE_WEIGHTS.direction;
  }
  return RESULT_NOTE_SCORE_WEIGHTS.tap;
}

function getChartMaxPerfectScore(notes) {
  if (!Array.isArray(notes) || !notes.length) return RESULT_SCORE_VALUES.perfect;
  return Math.max(
    1,
    notes.reduce((total, note) => {
      if (note && note.skipped) return total;
      return total + Math.round(RESULT_SCORE_VALUES.perfect * getResultNoteScoreWeight(note));
    }, 0)
  );
}

function getResultRank(rankRate) {
  if (rankRate >= 90) return "SSS";
  if (rankRate >= 85) return "SS";
  if (rankRate >= 80) return "S";
  if (rankRate >= 60) return "A";
  return "B";
}

function getResultStatus(state) {
  if (state.failed) return "FAILED";
  const { hits } = state;
  if (hits.miss === 0 && hits.good === 0) return "ALL PERFECT";
  if (hits.miss === 0) return "FULL COMBO";
  return "COMPLETED";
}

export function buildResultSummary(song, state, startTheme) {
  const totalNotes = Array.isArray(state.notes)
    ? state.notes.filter((note) => !note.skipped).length
    : 0;
  const maxPerfectScore = getChartMaxPerfectScore(state.notes);
  const rankRate = (Math.max(0, Number(state.score) || 0) / maxPerfectScore) * 100;

  return {
    songId: song.id,
    songTitle: song.title,
    songSubtitle: song.subtitle || "",
    songCoverImageSrc: song.coverImageSrc || "",
    statusLabel: getResultStatus(state),
    rank: getResultRank(rankRate),
    failed: !!state.failed,
    scoreDisplay: formatScoreDisplay(state.score),
    accuracyDisplay: `${rankRate.toFixed(1)}%`,
    totalNotes,
    perfect: state.hits.perfect,
    good: state.hits.good,
    miss: state.hits.miss,
    maxCombo: state.bestCombo,
    startTheme,
  };
}
