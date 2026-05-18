const STAT_ITEMS = [
  ["PERFECT", "perfect"],
  ["GOOD", "good"],
  ["MISS", "miss"],
  ["MAX COMBO", "maxCombo"],
];

export default function ResultScreen({ summary, onReplay, onHome }) {
  const safeSummary =
    summary || {
      songTitle: "Ditto",
      songSubtitle: "Parkour mix",
      songCoverImageSrc: "/assets/images/song-covers/ditto.cover.pixel.png",
      statusLabel: "FINISHED",
      rank: "C",
      rankTitle: "初次上路",
      rankSubtitle: "兔子记住了这条路",
      scoreDisplay: "000000",
      accuracyDisplay: "0.0%",
      totalNotes: 0,
      perfect: 0,
      good: 0,
      miss: 0,
      maxCombo: 0,
    };

  return (
    <div className="screen result-screen">
      <div className="result-scenery" aria-hidden="true">
        <span className="result-road" />
        <span className="result-building result-building-a" />
        <span className="result-building result-building-b" />
      </div>
      <section className="result-content" aria-label="跑酷结果">
        <div className="result-header">
          <img src={safeSummary.songCoverImageSrc} alt="" />
          <div>
            <p className="result-status pixel-font-en">{safeSummary.statusLabel}</p>
            <h1>{safeSummary.songTitle}</h1>
            <p>{safeSummary.songSubtitle}</p>
          </div>
        </div>

        <div className="rank-row">
          <span className="rank-letter pixel-font-en">{safeSummary.rank}</span>
          <span>
            <strong>{safeSummary.rankTitle}</strong>
            <small>{safeSummary.rankSubtitle}</small>
          </span>
        </div>

        <div className="score-row">
          <span>
            <small>SCORE</small>
            <strong className="pixel-font-en">{safeSummary.scoreDisplay}</strong>
          </span>
          <span>
            <small>RATE</small>
            <strong className="pixel-font-en">{safeSummary.accuracyDisplay}</strong>
          </span>
        </div>

        <div className="result-grid">
          {STAT_ITEMS.map(([label, key]) => (
            <div className="result-stat" key={key}>
              <small>{label}</small>
              <strong className="pixel-font-en">{safeSummary[key]}</strong>
            </div>
          ))}
          <div className="result-stat result-stat-wide">
            <small>TOTAL NOTES</small>
            <strong className="pixel-font-en">{safeSummary.totalNotes}</strong>
          </div>
        </div>

        <div className="result-actions">
          <button type="button" className="secondary-button" onClick={onHome}>
            回首页
          </button>
          <button type="button" className="primary-button" onClick={onReplay}>
            再跑一次
          </button>
        </div>
      </section>
    </div>
  );
}
