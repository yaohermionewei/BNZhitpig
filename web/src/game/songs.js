import dittoChart from "../../../shared/charts/ditto.editable.chart.js";
import superShyEasyChart from "../../../shared/charts/supershy.easy.editable.chart.js";
import superShyNormalChart from "../../../shared/charts/supershy.normal.editable.chart.js";

export const songs = [
  {
    id: "ditto",
    title: "Ditto",
    subtitle: "Ditto · 普通",
    difficultyLabel: "普通",
    badge: "Main",
    coverImageSrc: "/assets/images/song-covers/ditto.cover.pixel.png",
    chart: dittoChart,
  },
  {
    id: "supershy-easy",
    title: "Super Shy",
    subtitle: "Super Shy · 普通",
    difficultyLabel: "普通",
    badge: "Easy",
    coverImageSrc: "/assets/images/song-covers/supershy.cover.pixel.png",
    chart: superShyEasyChart,
  },
  {
    id: "supershy-normal",
    title: "Super Shy",
    subtitle: "Super Shy · 困难",
    difficultyLabel: "困难",
    badge: "Normal",
    coverImageSrc: "/assets/images/song-covers/supershy.cover.pixel.png",
    chart: superShyNormalChart,
  },
];

export function getDefaultSong() {
  return songs[0] || null;
}

export function getSongById(songId) {
  return songs.find((song) => song.id === songId) || null;
}
