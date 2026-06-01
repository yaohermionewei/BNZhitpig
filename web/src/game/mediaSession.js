const MEDIA_SESSION_TITLE = "BNZ Hit Pig";

const MEDIA_SESSION_ARTWORK = Object.freeze([
  {
    src: "/icons/icon-192.png",
    sizes: "192x192",
    type: "image/png",
  },
  {
    src: "/icons/icon-512.png",
    sizes: "512x512",
    type: "image/png",
  },
  {
    src: "/assets/images/icon1024newnew.png",
    sizes: "1024x1024",
    type: "image/png",
  },
]);

function getAbsoluteArtworkSrc(src) {
  if (typeof window === "undefined") return src;

  try {
    return new URL(src, window.location.origin).href;
  } catch {
    return src;
  }
}

export function setBunniesMediaSessionMetadata() {
  if (typeof navigator === "undefined" || !navigator.mediaSession) {
    return false;
  }
  if (typeof window === "undefined" || typeof window.MediaMetadata !== "function") {
    return false;
  }

  try {
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: MEDIA_SESSION_TITLE,
      artwork: MEDIA_SESSION_ARTWORK.map((artwork) => ({
        ...artwork,
        src: getAbsoluteArtworkSrc(artwork.src),
      })),
    });
    return true;
  } catch {
    return false;
  }
}
