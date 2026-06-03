import { useEffect, useState } from "react";
import { playUiSound } from "../game/uiSounds.js";

const SUPPORT_QR_LOADING_TEXT = "赞赏码加载中...";
const SUPPORT_COPY_SAMPLE = `赞赏作者如果你喜欢爆锤方猪欢迎给我打赏微信扫码返回首页${SUPPORT_QR_LOADING_TEXT}`;
const REWARD_CODE_DESKTOP_SRC = "/assets/images/ui/support-wechat-reward-code-desktop.png";
const REWARD_CODE_MOBILE_SRC = "/assets/images/ui/support-wechat-reward-code-mobile.png";

function waitForSupportFonts() {
  if (typeof document === "undefined" || !document.fonts) {
    return;
  }

  document.fonts.load('400 30px "PixelZhFusion"', SUPPORT_COPY_SAMPLE).catch(() => {});
}

export default function SupportScreen({ startTheme, onBack, forceQrLoading = false }) {
  const normalizedTheme = startTheme === "light" ? "light" : "dark";
  const [rewardCodeLoaded, setRewardCodeLoaded] = useState(false);
  const showRewardCode = rewardCodeLoaded && !forceQrLoading;

  useEffect(() => {
    waitForSupportFonts();
  }, []);

  function handleBack() {
    playUiSound("back");
    onBack?.();
  }

  return (
    <div className={`screen support-screen page-${normalizedTheme}`}>
      <div className="support-pixel-sky" aria-hidden="true">
        <span className="support-star support-star-1" />
        <span className="support-star support-star-2" />
        <span className="support-star support-star-3" />
        <span className="support-star support-star-4" />
      </div>

      <section className="support-content" aria-labelledby="support-title">
        <h1 id="support-title" className="support-title pixel-font-zh">
          <span>如果你喜欢爆锤方猪</span>
          <span>欢迎给我打赏</span>
        </h1>

        <div className="support-qr-stage">
          <div className="support-qr-shadow" aria-hidden="true" />
          <div className="support-qr-board">
            <div className="support-qr-board-face">
              {!showRewardCode && (
                <div
                  className="support-qr-loading"
                  role="status"
                  aria-live="polite"
                  aria-label={SUPPORT_QR_LOADING_TEXT}
                >
                  <span
                    className="support-qr-loading-text magic-loading-text pixel-font-zh"
                    data-text={SUPPORT_QR_LOADING_TEXT}
                    aria-hidden="true"
                  >
                    {SUPPORT_QR_LOADING_TEXT}
                  </span>
                </div>
              )}
              <picture
                className={showRewardCode ? "support-qr-picture" : "support-qr-picture support-qr-picture-loading"}
              >
                <source media="(max-width: 560px)" srcSet={REWARD_CODE_MOBILE_SRC} />
                <img
                  className="support-qr-image"
                  src={REWARD_CODE_DESKTOP_SRC}
                  alt="微信赞赏码"
                  draggable="false"
                  onLoad={() => {
                    if (!forceQrLoading) {
                      setRewardCodeLoaded(true);
                    }
                  }}
                />
              </picture>
              {showRewardCode && (
                <p className="support-qr-caption pixel-font-zh">微信扫码给我打赏</p>
              )}
            </div>
          </div>
        </div>

        <button
          className="support-home-button start-action-wrap"
          type="button"
          onClick={handleBack}
        >
          <span className="start-action-frame">
            <span className="start-action-inner">
              <span className="start-action-label">
                <span className="start-action-text start-action-text-face pixel-font-zh">
                  返回首页
                </span>
              </span>
            </span>
          </span>
        </button>
      </section>
    </div>
  );
}
