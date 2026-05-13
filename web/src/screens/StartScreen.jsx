import { songs } from "../game/songs.js";

const RABBIT_FRAME = "/assets/images/title-rabbit-frames-v2/rabbit-frame-1.png";
const PIG_FRAME = "/assets/images/title-pig-frames-v2/pig-frame-1.png";

export default function StartScreen({ state, onThemeToggle, onSelectSong, onStart }) {
  const { startTheme, song } = state;
  const backdrop =
    startTheme === "light"
      ? "/assets/images/首页夕阳版.runtime.jpg"
      : "/assets/images/首页夜晚版.runtime.jpg";

  return (
    <div className={`screen start-screen screen-${startTheme}`}>
      <img className="start-backdrop" src={backdrop} alt="" draggable="false" />
      <div className="screen-veil" />
      <button className="theme-button" type="button" onClick={onThemeToggle}>
        {startTheme === "light" ? "夜" : "日"}
      </button>

      <div className="start-content">
        <header className="start-title">
          <span className="start-title-en">Bunnies</span>
          <span className="start-title-cn">爆锤方猪</span>
        </header>

        <div className="hero-sprites" aria-hidden="true">
          <img className="hero-rabbit" src={RABBIT_FRAME} alt="" draggable="false" />
          <img className="hero-pig" src={PIG_FRAME} alt="" draggable="false" />
        </div>

        <section className="song-panel" aria-label="选择歌曲">
          {songs.map((item) => (
            <button
              key={item.id}
              className={`song-row ${item.id === song.id ? "song-row-selected" : ""}`}
              type="button"
              onClick={() => onSelectSong(item)}
            >
              <span>{item.title}</span>
              <small>{item.badge}</small>
            </button>
          ))}
        </section>

        <button className="primary-button" type="button" onClick={onStart}>
          开始
        </button>
      </div>
    </div>
  );
}
