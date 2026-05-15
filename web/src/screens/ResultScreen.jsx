import { useEffect, useMemo, useRef, useState } from "react";

const RABBIT_FRAME_SOURCES = Object.freeze([
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-1.png",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-2.png",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-3.png",
  "/assets/images/title-rabbit-frames-v2/rabbit-frame-4.png",
]);

const RESULT_LEAVING_SUBTITLE_IMAGE_SOURCES = Object.freeze({
  dark: "/assets/images/回到魔法世界.dark.png",
  light: "/assets/images/回到魔法世界....png",
});

const PARCHMENT_BACKGROUND_SRC = "/assets/images/透明羊皮纸完整版.runtime.png";
const RESULT_CERTIFICATE_BACKGROUND_SRC = "/assets/images/结算页新dark.png";
const DEFAULT_SONG_COVER_SRC = "/assets/images/song-covers/ditto.cover.pixel.png";
const HOME_TRANSITION_ROUTE_DELAY_MS = 120;
const DEFAULT_RESULT_TONE = "sky";

const RANK_TONE_BY_RANK = Object.freeze({
  SSS: "prism",
  SS: "mint",
  S: "mint",
  A: "sky",
  B: "sky",
  C: "sky",
});

const RESULT_RANK_COPY_BY_RANK = Object.freeze({
  SSS: Object.freeze({
    title: "NJZ终极守护神",
    subtitle: "战斗力天花板 让方猪烟消云散",
  }),
  SS: Object.freeze({
    title: "方猪终结者",
    subtitle: "魔法部特级奥罗 正义必达",
  }),
  S: Object.freeze({
    title: "方猪粉碎专家",
    subtitle: "粉碎咒专家 让方猪四分五裂",
  }),
  A: Object.freeze({
    title: "除猪武器大师",
    subtitle: "精准施法 bnz中的超强战力",
  }),
  B: Object.freeze({
    title: "锤猪门面担当",
    subtitle: "火力全开 方猪昏昏倒地",
  }),
  C: Object.freeze({
    title: "魔力在觉醒的兔宝",
    subtitle: "愤怒的眼神足以让方猪破防",
  }),
});

const RESULT_RANK_IMAGE_SOURCES = Object.freeze({
  SSS: "/assets/images/rank/sss.png",
  SS: "/assets/images/rank/s's.png",
  S: "/assets/images/rank/s.png",
  A: "/assets/images/rank/a.png",
  B: "/assets/images/rank/b.png",
  C: "/assets/images/rank/c.png",
});

const RESULT_DIGIT_SPRITES = Object.freeze({
  0: Object.freeze([
    ".ffffff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ffffff.",
  ]),
  1: Object.freeze([
    "..ffff..",
    "...ff...",
    "...ff...",
    "...ff...",
    "...ff...",
    "...ff...",
    "...ff...",
    "...ff...",
    ".ffffff.",
  ]),
  2: Object.freeze([
    ".ffffff.",
    ".....ff.",
    ".....ff.",
    "...fff..",
    "..fff...",
    ".ff.....",
    ".ff.....",
    ".ff.....",
    ".ffffff.",
  ]),
  3: Object.freeze([
    ".ffffff.",
    ".....ff.",
    ".....ff.",
    "..ffff..",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".ffffff.",
  ]),
  4: Object.freeze([
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ffffff.",
    "....ff..",
    "....ff..",
    "....ff..",
    "....ff..",
    "....ff..",
  ]),
  5: Object.freeze([
    ".ffffff.",
    ".ff.....",
    ".ff.....",
    ".fffff..",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".ffffff.",
  ]),
  6: Object.freeze([
    ".ffffff.",
    ".ff.....",
    ".ff.....",
    ".fffff..",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ffffff.",
  ]),
  7: Object.freeze([
    ".ffffff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
  ]),
  8: Object.freeze([
    ".ffffff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ffffff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ffffff.",
  ]),
  9: Object.freeze([
    ".ffffff.",
    ".ff..ff.",
    ".ff..ff.",
    ".ffffff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".....ff.",
    ".ffffff.",
  ]),
  ".": Object.freeze([
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
    "...ff...",
    "...ff...",
    "........",
  ]),
  ",": Object.freeze([
    "........",
    "........",
    "........",
    "........",
    "........",
    "...ff...",
    "...ff...",
    "..ff....",
    ".ff.....",
  ]),
  "%": Object.freeze([
    "ff....ff",
    "ff....ff",
    "..f..f..",
    "...ff...",
    "..f..f..",
    ".f..f...",
    "ff....ff",
    "ff....ff",
    "........",
  ]),
});

const SPARKS = Object.freeze([
  ["left-a", "sm", "core"],
  ["left-b", "md", "core", true],
  ["left-c", "sm", "mid"],
  ["left-d", "md", "accent"],
  ["left-e", "sm", "core", true],
  ["left-f", "sm", "accent"],
  ["right-a", "sm", "mid"],
  ["right-b", "sm", "accent", true],
  ["right-c", "md", "core"],
  ["right-d", "sm", "core"],
  ["right-e", "md", "accent", true],
  ["right-f", "sm", "mid"],
]);

function getSafeStartTheme(theme) {
  return theme === "light" ? "light" : "dark";
}

function getSafeResultTone(summary) {
  const explicitTone = summary?.rankTone;
  if (["prism", "mint", "sky", "violet", "rose"].includes(explicitTone)) {
    return explicitTone;
  }
  return RANK_TONE_BY_RANK[summary?.rank] || DEFAULT_RESULT_TONE;
}

function formatResultScoreDisplay(scoreDisplay) {
  const digitsOnly = String(scoreDisplay == null ? "" : scoreDisplay).replace(/[^\d]/g, "");
  const numericScore = digitsOnly ? Number(digitsOnly) : 0;
  if (!Number.isFinite(numericScore)) return "0";
  return String(Math.max(0, Math.round(numericScore)));
}

function getStatusLengthClass(statusLabel) {
  const length = String(statusLabel || "").length;
  if (length >= 11) return "result-status-text-long";
  if (length >= 9) return "result-status-text-medium";
  return "result-status-text-short";
}

function getRankLengthClass(rank) {
  const length = String(rank || "").length;
  if (length >= 3) return "result-rank-text-ultra-compact";
  if (length === 2) return "result-rank-text-compact";
  return "result-rank-text-standard";
}

function getRankCopy(rank) {
  return RESULT_RANK_COPY_BY_RANK[rank] || RESULT_RANK_COPY_BY_RANK.C;
}

function getRankImageSrc(rank) {
  return RESULT_RANK_IMAGE_SOURCES[rank] || RESULT_RANK_IMAGE_SOURCES.C;
}

function isZhFontCodePoint(codePoint) {
  return (
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0x3000 && codePoint <= 0x303f) ||
    (codePoint >= 0xff00 && codePoint <= 0xffef) ||
    (codePoint >= 0x2e80 && codePoint <= 0x2fdf) ||
    (codePoint >= 0x31c0 && codePoint <= 0x31ef)
  );
}

function getFontTypeForChar(char, previousType = "en") {
  if (!char || /\s/.test(char)) return previousType;
  return isZhFontCodePoint(char.codePointAt(0)) ? "zh" : "en";
}

function buildFontSegments(value) {
  const text = value == null ? "" : String(value);
  const segments = [];
  let currentSegment = null;
  let previousType = "en";

  Array.from(text).forEach((char) => {
    const fontType = getFontTypeForChar(char, previousType);
    previousType = fontType;
    if (!currentSegment || currentSegment.fontType !== fontType) {
      currentSegment = { text: char, fontType };
      segments.push(currentSegment);
      return;
    }
    currentSegment.text += char;
  });

  return segments;
}

function createEmptyDigitRows() {
  return RESULT_DIGIT_SPRITES[0].map((row, rowIndex) => ({
    id: `empty-${rowIndex}`,
    pixels: Array.from(row).map((_, columnIndex) => ({
      id: `empty-${rowIndex}-${columnIndex}`,
      filled: false,
    })),
  }));
}

function buildDigitGlyphs(value) {
  const text = String(value == null || value === "" ? "0" : value);
  const glyphs = [];

  Array.from(text).forEach((char, glyphIndex) => {
    const sprite = RESULT_DIGIT_SPRITES[char];
    if (!sprite) return;

    glyphs.push({
      id: `${glyphIndex}-${char}`,
      char,
      rows: sprite.map((row, rowIndex) => ({
        id: `${glyphIndex}-${rowIndex}`,
        pixels: Array.from(row).map((cell, columnIndex) => ({
          id: `${glyphIndex}-${rowIndex}-${columnIndex}`,
          filled: cell === "f",
        })),
      })),
    });
  });

  if (glyphs.length > 0) return glyphs;
  return [{ id: "empty", char: "", rows: createEmptyDigitRows() }];
}

function buildStatItem(key, label, value) {
  const displayValue = String(value ?? 0);
  return {
    key,
    label,
    value: displayValue,
    digitGlyphs: buildDigitGlyphs(displayValue),
  };
}

function decorateSummary(summary) {
  const hitCount = Number(summary?.perfect || 0) + Number(summary?.good || 0);
  const displayStatusLabel = `爆锤方猪${Math.max(0, hitCount)}次`;
  const resultTone = getSafeResultTone(summary);
  const displayScore = formatResultScoreDisplay(summary?.scoreDisplay);
  const rank = summary?.rank || "B";
  const rankCopy = getRankCopy(rank);

  return {
    ...summary,
    rank,
    rankTitle: summary?.rankTitle || rankCopy.title,
    rankSubtitle: summary?.rankSubtitle || rankCopy.subtitle,
    rankImageSrc: getRankImageSrc(rank),
    rankTone: resultTone,
    pageToneClass: `result-page-tone-${resultTone}`,
    rankToneClass: `result-rank-tone-${resultTone}`,
    rankLengthClass: getRankLengthClass(rank),
    statusLengthClass: getStatusLengthClass(displayStatusLabel),
    displayStatusLabel,
    displayStatusHitCount: String(Math.max(0, hitCount)),
    displayStatusPrefixSegments: buildFontSegments("爆锤方猪"),
    displayStatusSuffixSegments: buildFontSegments("次"),
    displayScore,
    scoreDigitGlyphs: buildDigitGlyphs(displayScore),
    songTitleSegments: buildFontSegments(summary?.songTitle || "Ditto"),
    songCoverImageSrc: summary?.songCoverImageSrc || DEFAULT_SONG_COVER_SRC,
    stats: [
      buildStatItem("perfect", "完美爆锤", summary?.perfect),
      buildStatItem("good", "优秀爆锤", summary?.good),
      buildStatItem("miss", "爆锤落空", summary?.miss),
      buildStatItem("combo", "最高连击", summary?.maxCombo),
    ],
  };
}

function FontSegments({ segments, className = "" }) {
  return segments.map((segment, index) => (
    <span
      key={`${segment.text}-${index}`}
      className={`${className} ${
        segment.fontType === "zh"
          ? "result-fixed-text-zh pixel-font-zh"
          : "result-fixed-text-en pixel-font-en"
      }`}
    >
      {segment.text}
    </span>
  ));
}

function DigitRun({ glyphs, label, className }) {
  return (
    <div className={`result-digit-run ${className}`} aria-label={label}>
      {glyphs.map((glyph) => (
        <div className="result-digit-glyph" key={glyph.id}>
          {glyph.rows.map((row) => (
            <div className="result-digit-row" key={row.id}>
              {row.pixels.map((pixel) => (
                <span
                  aria-hidden="true"
                  className={`result-digit-pixel ${
                    pixel.filled ? "result-digit-pixel-filled" : ""
                  }`}
                  key={pixel.id}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ResultSparkles() {
  return (
    <div className="result-sparkles" aria-hidden="true">
      {SPARKS.map(([position, tier, color, hasTrail]) => (
        <div
          className={`result-spark result-portal-spark result-spark-${position} result-spark-tier-${tier} result-spark-color-${color} ${
            hasTrail ? "result-spark-has-trail" : ""
          }`}
          key={position}
        >
          <span className="result-spark-glow" />
          <span className="result-spark-outer" />
          <span className="result-spark-core" />
          {hasTrail && <span className="result-spark-trail" />}
        </div>
      ))}
    </div>
  );
}

function ResultButton({ kind, children, onClick }) {
  const isPrimary = kind === "primary";
  const prefix = isPrimary ? "result-primary" : "result-secondary";

  return (
    <button className={`${prefix}-wrap`} type="button" onClick={onClick}>
      <span className={`${prefix}-shadow`} />
      <span className={`${prefix}-frame`}>
        <span className={`${prefix}-face`}>
          <span className={isPrimary ? "result-primary-inner" : "result-secondary-core"}>
            <span
              className={`result-text-block result-button-text ${
                isPrimary ? "result-replay-button-text" : "result-home-button-text"
              } result-fixed-text-zh pixel-font-zh`}
            >
              {children}
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}

function ResultCertificateButton({ children, onClick }) {
  return (
    <button className="result-certificate-button" type="button" onClick={onClick}>
      <span className="result-certificate-button-shadow" />
      <span className="result-certificate-button-frame">
        <span className="result-certificate-button-face">
          <span className="result-text-block result-certificate-button-text result-fixed-text-zh pixel-font-zh">
            {children}
          </span>
        </span>
      </span>
    </button>
  );
}

function ResultCertificateScreen({ summary, onReplay, onHome }) {
  return (
    <>
      <img
        className="result-certificate-background"
        src={RESULT_CERTIFICATE_BACKGROUND_SRC}
        alt=""
        draggable="false"
      />

      <div className="result-certificate-artboard">
        <section className="result-certificate-paper" aria-label="结算成绩">
          <h1 className="result-text-block result-certificate-rank-title result-fixed-text-zh pixel-font-zh">
            {summary.rankTitle}
          </h1>
          <p className="result-text-block result-certificate-rank-subtitle result-fixed-text-zh pixel-font-zh">
            {summary.rankSubtitle}
          </p>

          <div className="result-certificate-divider" aria-hidden="true">
            <span className="result-certificate-divider-line" />
            <span className="result-certificate-divider-star" />
            <span className="result-certificate-divider-line" />
          </div>

          <div className="result-certificate-song">
            <img
              className="result-certificate-song-cover"
              src={summary.songCoverImageSrc}
              alt=""
              draggable="false"
            />
            <div className="result-certificate-song-title result-text-segments">
              <FontSegments
                segments={summary.songTitleSegments}
                className="result-certificate-song-title-segment"
              />
            </div>
          </div>

          <img
            className={`result-certificate-rank-image result-certificate-rank-image-${summary.rank.toLowerCase()}`}
            src={summary.rankImageSrc}
            alt={summary.rank}
            draggable="false"
          />

          <div className="result-certificate-hit-count">
            <div className="result-text-block result-certificate-metric-label result-fixed-text-zh pixel-font-zh">
              暴击方猪
            </div>
            <div className="result-certificate-metric-value-line">
              <span className="result-text-block result-certificate-large-value result-fixed-text-en pixel-font-en">
                {summary.displayStatusHitCount}
              </span>
              <span className="result-text-block result-certificate-unit result-fixed-text-zh pixel-font-zh">
                次
              </span>
            </div>
          </div>

          <div className="result-certificate-score">
            <div className="result-text-block result-certificate-metric-label result-fixed-text-zh pixel-font-zh">
              总分
            </div>
            <div className="result-text-block result-certificate-large-value result-fixed-text-en pixel-font-en">
              {summary.displayScore}
            </div>
          </div>

          <div className="result-certificate-stats">
            {summary.stats.map((item) => (
              <div className="result-certificate-stat-row" key={item.key}>
                <span className="result-text-block result-certificate-stat-label result-fixed-text-zh pixel-font-zh">
                  {item.label}
                </span>
                <span className="result-text-block result-certificate-stat-value result-fixed-text-en pixel-font-en">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <button
          className="result-certificate-share"
          type="button"
          disabled
          aria-label="分享战报暂不可用"
        >
          <span className="result-text-block result-certificate-share-text result-fixed-text-zh pixel-font-zh">
            分享战报
          </span>
          <span className="result-certificate-share-plane" aria-hidden="true" />
        </button>

        <div className="result-certificate-actions">
          <ResultCertificateButton onClick={onHome}>回首页</ResultCertificateButton>
          <ResultCertificateButton onClick={onReplay}>再来一局</ResultCertificateButton>
        </div>
      </div>
    </>
  );
}

function ResultBackground({ startTheme, summary }) {
  const pageToneClass = summary?.pageToneClass || `result-page-tone-${DEFAULT_RESULT_TONE}`;
  return (
    <>
      <div className="result-bg-base" />
      <div className="result-bg-glow" />
      <div className="result-bg-veil" />
      <div className="result-bg-vignette" />
      <img
        className="result-parchment-bg"
        src={PARCHMENT_BACKGROUND_SRC}
        alt=""
        draggable="false"
      />
      {startTheme === "dark" && <div className={`result-dark-blue-overlay ${pageToneClass}`} />}
    </>
  );
}

function LeavingOverlay({ startTheme }) {
  const subtitleImage =
    RESULT_LEAVING_SUBTITLE_IMAGE_SOURCES[startTheme] ||
    RESULT_LEAVING_SUBTITLE_IMAGE_SOURCES.dark;

  return (
    <div className={`result-leaving-overlay result-leaving-overlay-${startTheme}`}>
      <div className="result-leaving-spinner" />
      <div className="result-leaving-copy">
        <img
          className="result-leaving-subtitle-image"
          src={subtitleImage}
          alt="回到魔法世界"
          draggable="false"
        />
      </div>
    </div>
  );
}

export default function ResultScreen({ summary, startTheme, onReplay, onHome }) {
  const normalizedStartTheme = getSafeStartTheme(startTheme);
  const decoratedSummary = useMemo(
    () => (summary ? decorateSummary(summary) : null),
    [summary]
  );
  const [currentRabbitFrame, setCurrentRabbitFrame] = useState(0);
  const [isLeavingHome, setIsLeavingHome] = useState(false);
  const homeTimerRef = useRef(0);

  useEffect(() => {
    if (isLeavingHome) return undefined;
    const timer = window.setInterval(() => {
      setCurrentRabbitFrame((frame) => (frame + 1) % RABBIT_FRAME_SOURCES.length);
    }, 220);
    return () => window.clearInterval(timer);
  }, [isLeavingHome]);

  useEffect(
    () => () => {
      window.clearTimeout(homeTimerRef.current);
    },
    []
  );

  function handleHomeTap() {
    if (isLeavingHome) return;
    setIsLeavingHome(true);
    window.clearTimeout(homeTimerRef.current);
    homeTimerRef.current = window.setTimeout(() => {
      onHome?.();
    }, HOME_TRANSITION_ROUTE_DELAY_MS);
  }

  const pageClasses = [
    "screen",
    "result-screen",
    "result-bg-parchment",
    `screen-${normalizedStartTheme}`,
    `page-${normalizedStartTheme}`,
    decoratedSummary?.pageToneClass || `result-page-tone-${DEFAULT_RESULT_TONE}`,
    decoratedSummary?.failed ? "result-page-failed" : "result-page-complete",
  ].join(" ");

  if (!decoratedSummary) {
    return (
      <div className={pageClasses}>
        <ResultBackground startTheme={normalizedStartTheme} summary={decoratedSummary} />
        <div className="result-shell result-empty-shell">
          <div className="result-empty-panel result-panel-outer">
            <div className="result-panel-face">
              <div className="result-panel-core result-empty-panel-core">
                <div className="result-text-block result-empty-title result-fixed-text-zh pixel-font-zh">
                  还没有成绩
                </div>
              </div>
            </div>
          </div>
          <div className="result-actions result-empty-actions">
            <ResultButton kind="secondary" onClick={handleHomeTap}>
              回到首页
            </ResultButton>
          </div>
        </div>
        {isLeavingHome && <LeavingOverlay startTheme={normalizedStartTheme} />}
      </div>
    );
  }

  if (normalizedStartTheme === "dark") {
    return (
      <div className={`${pageClasses} result-certificate-page`}>
        <ResultCertificateScreen
          summary={decoratedSummary}
          onReplay={onReplay}
          onHome={handleHomeTap}
        />
        {isLeavingHome && <LeavingOverlay startTheme={normalizedStartTheme} />}
      </div>
    );
  }

  return (
    <div className={pageClasses}>
      <ResultBackground startTheme={normalizedStartTheme} summary={decoratedSummary} />

      <div className="result-shell">
        <div className="result-stage">
          <ResultSparkles />

          <div className="result-hero" aria-hidden="true">
            <div className="result-hero-shadow" />
            <div className="result-rabbit-wrap">
              <div className="result-rabbit-sprite">
                <img
                  className="result-rabbit-frame"
                  src={RABBIT_FRAME_SOURCES[currentRabbitFrame]}
                  alt=""
                  draggable="false"
                />
              </div>
            </div>
          </div>

          <div className="result-status-row">
            <div
              className={`result-status-ribbon ${
                decoratedSummary.failed ? "result-status-ribbon-failed" : ""
              }`}
            >
              <div className="result-status-ribbon-face">
                <div
                  className={`result-text-block result-status-text ${decoratedSummary.statusLengthClass} result-text-segments`}
                >
                  <FontSegments
                    segments={decoratedSummary.displayStatusPrefixSegments}
                    className="result-text-segment"
                  />
                  <span className="result-text-segment result-status-count result-fixed-text-en pixel-font-en">
                    {decoratedSummary.displayStatusHitCount}
                  </span>
                  <FontSegments
                    segments={decoratedSummary.displayStatusSuffixSegments}
                    className="result-text-segment"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="result-panel-wrap">
            <div className="result-panel-outer">
              <div className="result-panel-face">
                <div className="result-panel-core">
                  <div className="result-song-strip">
                    <div className="result-song-header">
                      <div className="result-song-cover-shell">
                        {decoratedSummary.songCoverImageSrc ? (
                          <img
                            className="result-song-cover-image"
                            src={decoratedSummary.songCoverImageSrc}
                            alt=""
                            draggable="false"
                          />
                        ) : (
                          <div className="result-song-strip-cover-fallback" />
                        )}
                      </div>

                      <div className="result-song-copy">
                        <div className="result-song-title-ellipsis">
                          <FontSegments
                            segments={decoratedSummary.songTitleSegments}
                            className="result-song-title-segment"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="result-divider" aria-hidden="true">
                    <div className="result-divider-line" />
                    <div className="result-divider-star" />
                    <div className="result-divider-line" />
                  </div>

                  <div className="result-main-row">
                    <div className="result-score-stack">
                      <div className="result-text-block result-score-label-text result-fixed-text-zh pixel-font-zh">
                        总分
                      </div>

                      <div className="result-score-rank-row">
                        <div className="result-score-value-wrap">
                          <DigitRun
                            glyphs={decoratedSummary.scoreDigitGlyphs}
                            label={decoratedSummary.displayScore}
                            className="result-score-digit-run"
                          />
                        </div>

                        <div
                          className={`result-rank-block ${decoratedSummary.rankToneClass}`}
                        >
                          <div className="result-rank-face">
                            <div
                              className={`result-text-block result-rank-text ${decoratedSummary.rankLengthClass} result-fixed-text-en pixel-font-en`}
                            >
                              {decoratedSummary.rank}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="result-stats-grid">
                    {decoratedSummary.stats.map((item) => (
                      <div
                        className={`result-stat-card result-stat-card-${item.key}`}
                        key={item.key}
                      >
                        <div className="result-text-block result-stat-label-text result-fixed-text-zh pixel-font-zh">
                          {item.label}
                        </div>
                        <DigitRun
                          glyphs={item.digitGlyphs}
                          label={item.value}
                          className="result-stat-digit-run"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="result-actions">
          <ResultButton kind="secondary" onClick={handleHomeTap}>
            回到首页
          </ResultButton>
          <ResultButton kind="primary" onClick={onReplay}>
            再来一遍
          </ResultButton>
        </div>
      </div>

      {isLeavingHome && <LeavingOverlay startTheme={normalizedStartTheme} />}
    </div>
  );
}
