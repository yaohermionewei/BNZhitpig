import { useEffect, useRef, useState } from "react";
import { playUiSound } from "../game/uiSounds.js";

const SUPPORT_QR_LOADING_TEXT = "赞赏码加载中...";
const SUPPORT_SAVE_SUCCESS_COPY = "已保存";
const SUPPORT_SAVE_TOAST_DURATION_MS = 1600;
const SUPPORT_COPY_SAMPLE = `赞赏作者如果你喜欢爆锤方猪欢迎给我打赏微信扫码返回首页回首页保存赞赏码${SUPPORT_QR_LOADING_TEXT}${SUPPORT_SAVE_SUCCESS_COPY}`;
const REWARD_CODE_DESKTOP_SRC = "/assets/images/ui/support-wechat-reward-code-desktop.png";
const REWARD_CODE_MOBILE_SRC = "/assets/images/ui/support-wechat-reward-code-mobile.png";
const REWARD_CODE_DOWNLOAD_NAME = "bnz-wechat-reward-code.png";

function createRewardCodeFile(blob) {
  if (!blob || typeof File !== "function") return null;
  return new File([blob], REWARD_CODE_DOWNLOAD_NAME, {
    type: blob.type || "image/png",
  });
}

function isLikelyMobileDevice() {
  if (typeof navigator === "undefined") return false;
  const userAgent = navigator.userAgent || "";
  const touchPoints = navigator.maxTouchPoints || 0;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent) ||
    (touchPoints > 1 && /Macintosh/i.test(userAgent))
  );
}

function canNativeShareFile(file) {
  if (
    !file ||
    typeof window === "undefined" ||
    !window.isSecureContext ||
    typeof navigator === "undefined" ||
    typeof navigator.share !== "function" ||
    typeof navigator.canShare !== "function"
  ) {
    return false;
  }

  try {
    return Boolean(navigator.canShare({ files: [file] }));
  } catch {
    return false;
  }
}

function waitForSupportFonts() {
  if (typeof document === "undefined" || !document.fonts) {
    return;
  }

  document.fonts.load('400 30px "PixelZhFusion"', SUPPORT_COPY_SAMPLE).catch(() => {});
}

function SupportActionButton({ children, variant = "primary", onClick }) {
  const variantClassName =
    variant === "secondary"
      ? "result-certificate-button-secondary"
      : "result-certificate-button-primary";

  return (
    <button
      className={`support-action-button pixel-action-button result-certificate-button ${variantClassName}`}
      type="button"
      onClick={onClick}
    >
      <span className="pixel-action-button-frame">
        <span className="pixel-action-button-inner">
          <span className="result-text-block pixel-action-button-text result-fixed-text-zh pixel-font-zh">
            {children}
          </span>
        </span>
      </span>
    </button>
  );
}

export default function SupportScreen({ startTheme, onBack, forceQrLoading = false }) {
  const normalizedTheme = startTheme === "light" ? "light" : "dark";
  const [rewardCodeLoaded, setRewardCodeLoaded] = useState(false);
  const [supportSaveToast, setSupportSaveToast] = useState("");
  const supportSaveToastTimerRef = useRef(0);
  const showRewardCode = rewardCodeLoaded && !forceQrLoading;

  useEffect(() => {
    waitForSupportFonts();
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(supportSaveToastTimerRef.current);
    };
  }, []);

  function showSupportSaveToast(text) {
    window.clearTimeout(supportSaveToastTimerRef.current);
    setSupportSaveToast(text);
    supportSaveToastTimerRef.current = window.setTimeout(() => {
      setSupportSaveToast("");
    }, SUPPORT_SAVE_TOAST_DURATION_MS);
  }

  function handleBack() {
    playUiSound("back");
    onBack?.();
  }

  async function handleSaveRewardCode() {
    playUiSound("confirm");

    try {
      const response = await fetch(REWARD_CODE_DESKTOP_SRC);
      if (!response.ok) throw new Error("Failed to fetch reward code");
      const blob = await response.blob();
      const file = createRewardCodeFile(blob);
      const isMobile = isLikelyMobileDevice();

      if (isMobile && canNativeShareFile(file)) {
        try {
          await navigator.share({
            files: [file],
          });
          showSupportSaveToast(SUPPORT_SAVE_SUCCESS_COPY);
          return;
        } catch (error) {
          if (error?.name === "AbortError") return;
          console.warn("Native reward code share failed", error);
        }
      }

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = REWARD_CODE_DOWNLOAD_NAME;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.warn("Failed to save reward code", error);
      window.open(REWARD_CODE_DESKTOP_SRC, "_blank", "noopener,noreferrer");
    }
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

        <div className="support-actions">
          <SupportActionButton variant="secondary" onClick={handleBack}>
            回首页
          </SupportActionButton>
          <SupportActionButton variant="primary" onClick={handleSaveRewardCode}>
            保存赞赏码
          </SupportActionButton>
        </div>
      </section>

      {supportSaveToast && (
        <div
          className="support-save-toast result-share-preview-toast result-fixed-text-zh pixel-font-zh"
          role="status"
          aria-live="polite"
        >
          <span className="result-share-preview-toast-text">{supportSaveToast}</span>
        </div>
      )}
    </div>
  );
}
