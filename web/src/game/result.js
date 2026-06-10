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

const RESULT_RANKS = Object.freeze([
  Object.freeze({
    rank: "SSS",
    minRate: 90,
    title: "NJZ终极守护神",
    subtitle: "战斗力天花板 让方猪烟消云散",
  }),
  Object.freeze({
    rank: "SS",
    minRate: 75,
    title: "方猪终结者",
    subtitle: "魔法部特级奥罗 正义必达",
  }),
  Object.freeze({
    rank: "S",
    minRate: 60,
    title: "方猪粉碎专家",
    subtitle: "粉碎咒专家 让方猪四分五裂",
  }),
  Object.freeze({
    rank: "A",
    minRate: 45,
    title: "除猪武器大师",
    subtitle: "精准施法 bnz中的超强战力",
  }),
  Object.freeze({
    rank: "B",
    minRate: 30,
    title: "锤猪门面担当",
    subtitle: "火力全开 方猪昏昏倒地",
  }),
  Object.freeze({
    rank: "C",
    minRate: Number.NEGATIVE_INFINITY,
    title: "魔力觉醒的兔宝",
    subtitle: "愤怒的眼神足以让方猪破防",
  }),
]);

function getResultRankConfig(rankRate) {
  return (
    RESULT_RANKS.find((item) => rankRate >= item.minRate) ||
    RESULT_RANKS[RESULT_RANKS.length - 1]
  );
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
  const rankConfig = getResultRankConfig(rankRate);

  return {
    songId: song.id,
    songTitle: song.title,
    songSubtitle: song.subtitle || "",
    songDifficultyLabel: song.difficultyLabel || "",
    songCoverImageSrc: song.coverImageSrc || "",
    statusLabel: getResultStatus(state),
    rank: rankConfig.rank,
    rankTitle: rankConfig.title,
    rankSubtitle: rankConfig.subtitle,
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
