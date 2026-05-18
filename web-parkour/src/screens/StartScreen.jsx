export default function StartScreen({ song, onStart }) {
  return (
    <div className="screen start-screen">
      <div className="start-sky" aria-hidden="true">
        <span className="star star-a" />
        <span className="star star-b" />
        <span className="star star-c" />
        <span className="skyline skyline-left" />
        <span className="skyline skyline-right" />
        <span className="road-preview">
          <span className="road-preview-line line-left" />
          <span className="road-preview-line line-right" />
        </span>
      </div>
      <div className="start-content">
        <p className="start-kicker pixel-font-en">WEB PARKOUR</p>
        <h1>兔子三轨跑酷</h1>
        <div className="song-chip">
          <img src={song.coverImageSrc} alt="" />
          <span>
            <strong>{song.title}</strong>
            <small>{song.subtitle}</small>
          </span>
        </div>
        <button className="primary-button" type="button" onClick={onStart}>
          开始滑行
        </button>
      </div>
    </div>
  );
}
