const imageCache = new Map();

export const ASSET_SOURCES = Object.freeze({
  rabbitBack: "/assets/images/characters/rabbit-back.png",
  rabbitFront: "/assets/images/characters/rabbit-front.png",
  pigFront: "/assets/images/characters/pig-front-new-cropped.png",
  pigFrontLaunch: "/assets/images/characters/pig-front-launch-v2-cropped.png",
  pigGlasses: "/assets/images/characters/glass.png",
  songCover: "/assets/images/song-covers/ditto.cover.pixel.png",
});

export const EFFECT_SOURCES = Object.freeze({
  hit: "/assets/audio/hit.wav",
});

export function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) {
    return imageCache.get(src);
  }

  const loadPromise = new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => {
      imageCache.delete(src);
      resolve(null);
    };
    image.src = src;
  });

  imageCache.set(src, loadPromise);
  return loadPromise;
}

export async function loadParkourSprites(song) {
  const entries = await Promise.all(
    Object.entries({
      rabbitBack: ASSET_SOURCES.rabbitBack,
      rabbitFront: ASSET_SOURCES.rabbitFront,
      pigFront: ASSET_SOURCES.pigFront,
      pigFrontLaunch: ASSET_SOURCES.pigFrontLaunch,
      pigGlasses: ASSET_SOURCES.pigGlasses,
      songCover: song?.coverImageSrc || ASSET_SOURCES.songCover,
    }).map(async ([key, src]) => [key, await loadImage(src)])
  );

  return entries.reduce((sprites, [key, image]) => {
    if (image) sprites[key] = image;
    return sprites;
  }, {});
}
