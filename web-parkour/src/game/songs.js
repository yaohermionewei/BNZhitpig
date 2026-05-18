import dittoChart from "../../../web/src/game/ditto.editable.chart.js";

export const songs = [
  {
    id: "ditto",
    title: "Ditto",
    subtitle: "Parkour mix",
    badge: "Run",
    coverImageSrc: "/assets/images/song-covers/ditto.cover.pixel.png",
    chart: dittoChart,
  },
];

export function getDefaultSong() {
  return songs[0] || null;
}
