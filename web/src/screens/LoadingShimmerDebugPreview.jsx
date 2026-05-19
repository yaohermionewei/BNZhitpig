import { LOADING_COPY } from "../utils/loading-copy.js";
import MagicLoadingOverlay from "./MagicLoadingOverlay.jsx";

const LOADING_DEBUG_TEXTS = Object.freeze([
  LOADING_COPY.enterWorld,
  LOADING_COPY.prepareAttack,
  LOADING_COPY.reportOutput,
  LOADING_COPY.returnWorld,
]);

function LoadingShimmerColumn({ theme, title }) {
  return (
    <section className={`loading-shimmer-preview-panel loading-shimmer-preview-panel-${theme}`}>
      <div className="loading-shimmer-preview-panel-title pixel-font-en">{title}</div>
      <div className="loading-shimmer-preview-list">
        {LOADING_DEBUG_TEXTS.map((text) => (
          <div className="loading-shimmer-preview-tile" key={`${theme}-${text}`}>
            <MagicLoadingOverlay
              theme={theme}
              text={text}
              className="loading-shimmer-preview-overlay"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LoadingShimmerDebugPreview() {
  return (
    <main className="loading-shimmer-preview">
      <div className="loading-shimmer-preview-header">
        <div className="loading-shimmer-preview-kicker pixel-font-en">Loading shimmer preview</div>
        <div className="loading-shimmer-preview-title pixel-font-zh">扫光文案预览</div>
      </div>

      <div className="loading-shimmer-preview-grid">
        <LoadingShimmerColumn theme="dark" title="Dark" />
        <LoadingShimmerColumn theme="light" title="Light" />
      </div>
    </main>
  );
}
