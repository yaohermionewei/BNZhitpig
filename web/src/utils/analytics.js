const GA_MEASUREMENT_ID = String(import.meta.env.VITE_GA_MEASUREMENT_ID || "").trim();
const GA_ENABLE_IN_DEV = import.meta.env.VITE_GA_ENABLE_IN_DEV === "true";
const GTAG_SCRIPT_ID = "google-analytics-gtag";

let initialized = false;

function isAnalyticsEnabled() {
  return (
    typeof window !== "undefined" &&
    Boolean(GA_MEASUREMENT_ID) &&
    (!import.meta.env.DEV || GA_ENABLE_IN_DEV)
  );
}

function ensureGtagScript() {
  if (document.getElementById(GTAG_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = GTAG_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
    GA_MEASUREMENT_ID
  )}`;
  document.head.appendChild(script);
}

function getGtag() {
  if (!isAnalyticsEnabled()) return null;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  ensureGtagScript();

  if (!initialized) {
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: false,
    });
    initialized = true;
  }

  return window.gtag;
}

function getVirtualPagePath(screenName) {
  const { pathname, search } = window.location;
  return `${pathname}${search}#${screenName}`;
}

function getVirtualPageLocation(screenName) {
  const url = new URL(window.location.href);
  url.hash = screenName;
  return url.toString();
}

export function trackPageView(screenName, params = {}) {
  const gtag = getGtag();
  if (!gtag || !screenName) return;

  gtag("event", "page_view", {
    transport_type: "beacon",
    page_title: `BNZ Hit Pig - ${screenName}`,
    page_location: getVirtualPageLocation(screenName),
    page_path: getVirtualPagePath(screenName),
    screen_name: screenName,
    ...params,
  });
}

export function trackEvent(eventName, params = {}) {
  const gtag = getGtag();
  if (!gtag || !eventName) return;

  gtag("event", eventName, {
    transport_type: "beacon",
    ...params,
  });
}
