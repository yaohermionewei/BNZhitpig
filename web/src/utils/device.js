export function isLikelyMobileDevice() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const touchPoints = navigator.maxTouchPoints || 0;
  const coarsePointer =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const narrowScreen =
    typeof window !== "undefined" &&
    Math.min(window.innerWidth || 0, window.innerHeight || 0) <= 820;

  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
      userAgent
    ) ||
    (touchPoints > 1 && /Macintosh/i.test(userAgent)) ||
    (coarsePointer && narrowScreen)
  );
}
