import { getMaxPerfectScore } from "./engine.js";

const RESULT_RANKS = Object.freeze([
  { rank: "SSS", minRate: 92, title: "星路全收集", subtitle: "兔子一路滑进了节拍深处" },
  { rank: "SS", minRate: 80, title: "霓虹领跑员", subtitle: "三条轨道都被你踩亮了" },
  { rank: "S", minRate: 68, title: "顺风滑行", subtitle: "路线清楚 手感在线" },
  { rank: "A", minRate: 52, title: "稳稳前进", subtitle: "已经找到跑酷节奏了" },
  { rank: "B", minRate: 34, title: "继续热身", subtitle: "下一轮会吃到更多星光" },
  { rank: "C", minRate: Number.NEGATIVE_INFINITY, title: "初次上路", subtitle: "兔子记住了这条路" },
]);

function formatScoreDisplay(score) {
  return String(Math.max(0, Math.round(score))).padStart(6, "0");
}

function getRankConfig(rankRate) {
  return RESULT_RANKS.find((item) => rankRate >= item.minRate) || RESULT_RANKS.at(-1);
}

function getStatusLabel(state) {
  if (state.hits.miss === 0 && state.hits.good === 0) return "ALL COLLECT";
  if (state.hits.miss === 0) return "FULL ROUTE";
  return "FINISHED";
}

export function buildParkourResultSummary(song, state) {
  const totalNotes = state.notes.length;
  const maxPerfectScore = getMaxPerfectScore(state.notes);
  const rankRate = (Math.max(0, Number(state.score) || 0) / maxPerfectScore) * 100;
  const rankConfig = getRankConfig(rankRate);

  return {
    songId: song.id,
    songTitle: song.title,
    songSubtitle: song.subtitle || "",
    songCoverImageSrc: song.coverImageSrc || "",
    statusLabel: getStatusLabel(state),
    rank: rankConfig.rank,
    rankTitle: rankConfig.title,
    rankSubtitle: rankConfig.subtitle,
    failed: false,
    scoreDisplay: formatScoreDisplay(state.score),
    accuracyDisplay: `${rankRate.toFixed(1)}%`,
    totalNotes,
    perfect: state.hits.perfect,
    good: state.hits.good,
    miss: state.hits.miss,
    maxCombo: state.bestCombo,
  };
}
