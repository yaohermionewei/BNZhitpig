export default function ResultScreen({ summary, startTheme, onReplay, onHome }) {
  if (!summary) {
    return (
      <div className={`screen result-screen screen-${startTheme}`}>
        <div className="result-card">
          <p>还没有成绩</p>
          <button className="primary-button" type="button" onClick={onHome}>
            回到首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`screen result-screen screen-${startTheme}`}>
      <div className="result-glow" />
      <div className="result-card">
        <div className="result-status">{summary.statusLabel}</div>
        <div className="result-song">
          {summary.songCoverImageSrc && <img src={summary.songCoverImageSrc} alt="" />}
          <div>
            <strong>{summary.songTitle}</strong>
            <span>{summary.songSubtitle}</span>
          </div>
        </div>
        <div className="result-score-row">
          <div>
            <span>总分</span>
            <strong>{summary.scoreDisplay}</strong>
          </div>
          <div className="result-rank">{summary.rank}</div>
        </div>
        <div className="result-stats">
          <span>PERFECT {summary.perfect}</span>
          <span>GOOD {summary.good}</span>
          <span>MISS {summary.miss}</span>
          <span>COMBO {summary.maxCombo}</span>
        </div>
        <div className="result-actions">
          <button className="secondary-button" type="button" onClick={onHome}>
            回到首页
          </button>
          <button className="primary-button" type="button" onClick={onReplay}>
            再来一遍
          </button>
        </div>
      </div>
    </div>
  );
}
