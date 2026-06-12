import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene.js";
import { isLikelyMobileDevice } from "../utils/device.js";

const DESKTOP_DPR_MAX = 2;
const MOBILE_DPR_MAX = 1.5;

function getResolution() {
  const maxDpr = isLikelyMobileDevice() ? MOBILE_DPR_MAX : DESKTOP_DPR_MAX;
  return Math.min(maxDpr, window.devicePixelRatio || 1);
}

export function createPhaserGame(options) {
  options.onLoadingStage?.("phaser:create");
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: options.parent,
    width: Math.max(1, Math.round(options.parent.clientWidth || window.innerWidth || 1)),
    height: Math.max(1, Math.round(options.parent.clientHeight || window.innerHeight || 1)),
    backgroundColor: "#2d2430",
    pixelArt: true,
    antialias: false,
    resolution: getResolution(),
    scale: {
      mode: Phaser.Scale.RESIZE,
      parent: options.parent,
      width: "100%",
      height: "100%",
    },
    input: {
      activePointers: 3,
    },
    scene: {
      create() {
        options.onLoadingStage?.("phaser:booted");
        this.scene.add("GameScene", GameScene, false);
        this.scene.start("GameScene", options);
      },
    },
  });

  return {
    destroy() {
      game.destroy(true);
    },
  };
}
