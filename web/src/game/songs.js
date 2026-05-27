import dittoChart from "../../../shared/charts/ditto.editable.chart.js";

export const songs = [
  {
    id: "ditto",
    title: "Ditto",
    subtitle: "Rhythm challenge",
    badge: "Main",
    coverImageSrc: "/assets/images/song-covers/ditto.cover.pixel.png",
    chart: dittoChart,
  },
];

export function getDefaultSong() {
  return songs[0] || null;
}
