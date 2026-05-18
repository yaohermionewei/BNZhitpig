import { normalizeStartTheme } from "../utils/start-theme.js";

const BASE_CHARACTER_ASSET_SOURCES = {
  titleRabbit: "/assets/images/title-rabbit-frames-v2/rabbit-frame-1.png",
  titlePig: "/assets/images/title-pig-frames-v2/pig-frame-1.png",
  char1Front: "/assets/images/characters/五小妹正面新/1.png",
  char1Side: "/assets/images/characters/五小妹侧面新/1.png",
  char2Front: "/assets/images/characters/五小妹正面新/2.png",
  char2Side: "/assets/images/characters/五小妹侧面新/2.png",
  char3Front: "/assets/images/characters/五小妹正面新/3.png",
  char3Side: "/assets/images/characters/五小妹侧面新/3.png",
  char4Front: "/assets/images/characters/五小妹正面新/4.png",
  char4Side: "/assets/images/characters/五小妹侧面新/4.png",
  char5Front: "/assets/images/characters/五小妹正面新/5.png",
  char5Side: "/assets/images/characters/五小妹侧面新/5.png",
  pigFront: "/assets/images/characters/pig-front-new-cropped.png",
  pigFrontLaunch: "/assets/images/characters/pig-front-launch-v2-cropped.png",
  pigGlasses: "/assets/images/characters/glass.png",
  pigLeft: "/assets/images/characters/pig-left-new-cropped.png",
  pigRight: "/assets/images/characters/pig-right-new-cropped.png",
  rabbitFront: "/assets/images/characters/rabbit-front.png",
  rabbitBack: "/assets/images/characters/rabbit-back.png",
  rabbitBackHitSheet: "/assets/images/characters/rabbit-back-hit-sheet.png",
  rabbitBackWandSwing2Sheet: "/assets/images/characters/rabbit-back-wand-swing-2-sheet.png",
};

const GAME_SCENE_BACKGROUND_SOURCES = {
  dark: "/assets/images/战斗场景dark.runtime.jpg",
  light: "/assets/images/战斗场景light.runtime.jpg",
};

export const RESULT_CERTIFICATE_BACKGROUND_SOURCES = Object.freeze({
  dark: "/assets/images/结算页新dark.runtime.webp",
  light: "/assets/images/结算页新light.runtime.webp",
});

export const RESULT_LEAVING_SUBTITLE_IMAGE_SOURCES = Object.freeze({
  dark: "/assets/images/回到魔法世界.dark.png",
  light: "/assets/images/回到魔法世界....png",
});

export const DEFAULT_RESULT_SONG_COVER_SOURCE =
  "/assets/images/song-covers/ditto.cover.pixel.png";

export const RESULT_SHARE_ICON_SOURCE = "/assets/images/share.png";

export const RESULT_RANK_IMAGE_SOURCES = Object.freeze({
  SSS: "/assets/images/rank/sss.png",
  SS: "/assets/images/rank/s's.png",
  S: "/assets/images/rank/s.png",
  A: "/assets/images/rank/a.png",
  B: "/assets/images/rank/b.png",
  C: "/assets/images/rank/c.png",
});

const imageCache = new Map();
const spriteSetCache = new Map();

export const EFFECT_AUDIO_POOL_SIZES = {
  "/assets/audio/hit.wav": 6,
  "/assets/audio/miss.wav": 3,
};

export function getGameSceneBackgroundSource(theme) {
  const normalizedTheme = normalizeStartTheme(theme);
  return GAME_SCENE_BACKGROUND_SOURCES[normalizedTheme] || GAME_SCENE_BACKGROUND_SOURCES.dark;
}

export function getResultCertificateBackgroundSource(theme) {
  const normalizedTheme = normalizeStartTheme(theme);
  return RESULT_CERTIFICATE_BACKGROUND_SOURCES[normalizedTheme] || "";
}

export function getCharacterAssetSources(theme) {
  return {
    ...BASE_CHARACTER_ASSET_SOURCES,
    sceneBackground: getGameSceneBackgroundSource(theme),
  };
}

export function getResultPreloadSources(theme, extraSources = []) {
  const normalizedTheme = normalizeStartTheme(theme);
  const backgroundSource = getResultCertificateBackgroundSource(normalizedTheme);
  const subtitleSource =
    RESULT_LEAVING_SUBTITLE_IMAGE_SOURCES[normalizedTheme] ||
    RESULT_LEAVING_SUBTITLE_IMAGE_SOURCES.dark;

  return Array.from(
    new Set(
      [
        backgroundSource,
        subtitleSource,
        DEFAULT_RESULT_SONG_COVER_SOURCE,
        RESULT_SHARE_ICON_SOURCE,
        ...Object.values(RESULT_RANK_IMAGE_SOURCES),
        ...extraSources,
      ].filter(Boolean)
    )
  );
}

export function loadImage(src) {
  if (imageCache.has(src)) {
    return imageCache.get(src);
  }

  const loadPromise = new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (typeof image.decode !== "function") {
        resolve(image);
        return;
      }
      image.decode().then(
        () => resolve(image),
        () => resolve(image)
      );
    };
    image.onerror = () => {
      imageCache.delete(src);
      resolve(null);
    };
    image.src = src;
  });

  imageCache.set(src, loadPromise);
  return loadPromise;
}

export async function preloadResultAssets(theme, extraSources = []) {
  const sources = getResultPreloadSources(theme, extraSources);
  const images = await Promise.all(sources.map((src) => loadImage(src)));
  return images.map((image, index) => ({
    src: sources[index],
    image,
    ok: !!image,
  }));
}

export async function loadCharacterSprites(theme) {
  const normalizedTheme = normalizeStartTheme(theme);
  if (spriteSetCache.has(normalizedTheme)) {
    return spriteSetCache.get(normalizedTheme);
  }

  const loadPromise = Promise.all(
    Object.entries(getCharacterAssetSources(normalizedTheme)).map(async ([key, src]) => [
      key,
      await loadImage(src),
    ])
  ).then((entries) =>
    entries.reduce((sprites, [key, image]) => {
      if (image) {
        sprites[key] = image;
      }
      return sprites;
    }, {})
  );

  spriteSetCache.set(normalizedTheme, loadPromise);

  try {
    return await loadPromise;
  } catch (error) {
    spriteSetCache.delete(normalizedTheme);
    throw error;
  }
}
