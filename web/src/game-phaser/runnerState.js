// Shared runner-state factories and constants extracted from the legacy
// GameRunner (now dead code on dev). The Phaser GameScene feeds these state
// objects into the original `renderFrame`. Tier 2 will extend this module with
// the per-frame update functions (updateCrowdMotion / updateRabbitWandAnimation).

export const RABBIT_WAND_SWING_VARIANT = 2;
export const RABBIT_WAND_SWING_FRAME_COUNT = 9;
export const RABBIT_WAND_SWING_DURATION = 0.18;
export const RABBIT_WAND_RETRIGGER_FRAME = 2;
export const RABBIT_WAND_PEAK_FRAME = 4;
export const RABBIT_WAND_MIN_PHASE_DURATION = 0.04;
export const RABBIT_WAND_TAP_SEQUENCE = Object.freeze([0, 1, 2, 3, 4, 3, 2, 1, 0]);
export const RABBIT_WAND_HOLD_FORWARD_SEQUENCE = Object.freeze([0, 1, 2, 3, 4]);

export const CROWD_MEMBER_COUNT = 5;
export const CROWD_EVENT_DELAY_RANGE = Object.freeze([2.8, 5.2]);
export const CROWD_FRONT_HOLD_RANGE = Object.freeze([0.72, 1.28]);
export const CROWD_TURN_DURATION_RANGE = Object.freeze([0.1, 0.16]);

export function randomBetween(min, max) {
  if (max <= min) return min;
  return min + Math.random() * (max - min);
}

export function createRabbitWandAnimationState() {
  return {
    active: false,
    elapsed: 0,
    frameIndex: 0,
    frameCount: RABBIT_WAND_SWING_FRAME_COUNT,
    mode: "idle",
    duration: RABBIT_WAND_SWING_DURATION,
    sequence: RABBIT_WAND_TAP_SEQUENCE,
  };
}

export function createCrowdMember(index) {
  return {
    id: index + 1,
    facingFront: false,
    turnFromFront: false,
    turnToFront: false,
    turnStartedAt: null,
    turnDuration: CROWD_TURN_DURATION_RANGE[0],
    holdUntil: null,
  };
}

export function createCrowdMotionState() {
  return {
    members: Array.from({ length: CROWD_MEMBER_COUNT }, (_, index) => createCrowdMember(index)),
    nextEventAt: randomBetween(CROWD_EVENT_DELAY_RANGE[0], CROWD_EVENT_DELAY_RANGE[1]),
  };
}
