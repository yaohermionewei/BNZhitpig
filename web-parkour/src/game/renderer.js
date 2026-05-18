const DESIGN_WIDTH = 402;
const DESIGN_HEIGHT = 782;
const ROAD_TOP_RATIO = 0.28;
const ROAD_BOTTOM_RATIO = 0.94;
const ENTRY_DEPTH = 0.06;
const HIT_DEPTH = 0.78;
const PASS_DEPTH = 1.12;
const ROAD_VISIBLE_BOTTOM_DEPTH = 0.89;
const TARGET_PROGRESS = HIT_DEPTH;
const ENTRY_PROGRESS = ENTRY_DEPTH;
const NOTE_TRAVEL_TIME = 1.55;
const TARGET_Y_RATIO = 0.8;
const TARGET_BOTTOM_SAFE_MIN = 96;
const NOTE_PASS_MARGIN = 72;
const DEPTH_GAMMA = 1.34;
const ROAD_EDGE_ANGLE_DEG = 31.14;
const ROAD_EDGE_ANGLE_RAD = (ROAD_EDGE_ANGLE_DEG * Math.PI) / 180;
const ROAD_TOP_WIDTH_RATIO = 0.14;
const ROAD_TOP_WIDTH_MAX = 84;
const ROAD_MIN_PROJECTED_WIDTH = 24;
const BUILDING_SCALE_WIDTH_MAX = 480;
const PIXEL_STEP = 2;
const PIG_BASE_HEIGHT = 48;
const PIG_GLASSES_LAUNCH_WIDTH_RATIO = 1.15;
const COMBO_PULSE_DURATION = 0.36;

const COLORS = Object.freeze({
  skyTop: "#101827",
  skyBottom: "#293553",
  road: "#20202c",
  roadEdge: "#f4c56d",
  lane: "rgba(255, 238, 181, 0.72)",
  laneDim: "rgba(255, 238, 181, 0.32)",
  target: "#fff4bd",
  note: "#ffd45f",
  noteCore: "#fff3b0",
  hold: "#66e5c5",
  holdCore: "#e5fff8",
  perfect: "#ffe58f",
  good: "#8ff4d2",
  miss: "rgba(226, 232, 240, 0.34)",
  text: "#fff6d6",
  shadow: "rgba(4, 7, 16, 0.48)",
});

let lastComboForPulse = 0;
let comboPulseStartedAt = 0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function snap(value, step = PIXEL_STEP) {
  return Math.round(value / step) * step;
}

export function getLaneMetrics(viewport) {
  const width = viewport.width;
  const height = viewport.height;
  const centerX = width / 2;
  const top = height * ROAD_TOP_RATIO;
  const layoutBottom = height * ROAD_BOTTOM_RATIO;
  const bottom = height + NOTE_PASS_MARGIN;
  const targetY = Math.min(height - TARGET_BOTTOM_SAFE_MIN, Math.max(top + 180, height * TARGET_Y_RATIO));
  const roadPassT = Math.max(1.12, (bottom - top) / Math.max(1, targetY - top));
  const entryT = projectDepthToRoadTValue(ENTRY_DEPTH, roadPassT);
  const entryY = top + (targetY - top) * entryT;
  const entryWidth = Math.max(48, Math.min(width * ROAD_TOP_WIDTH_RATIO, ROAD_TOP_WIDTH_MAX));
  const roadSpreadPerY = 2 * Math.tan(ROAD_EDGE_ANGLE_RAD);
  const hitWidth = entryWidth + (targetY - entryY) * roadSpreadPerY;
  const visibleBottomT = projectDepthToRoadTValue(ROAD_VISIBLE_BOTTOM_DEPTH, roadPassT);
  const visibleBottomY = top + (targetY - top) * visibleBottomT;
  const visibleBottomWidth = entryWidth + (visibleBottomY - entryY) * roadSpreadPerY;
  const passWidth = entryWidth + (bottom - entryY) * roadSpreadPerY;
  const buildingScaleWidth = Math.min(hitWidth, Math.max(width * 0.86, BUILDING_SCALE_WIDTH_MAX * 0.72), BUILDING_SCALE_WIDTH_MAX);

  return {
    centerX,
    top,
    bottom,
    layoutBottom,
    topWidth: entryWidth,
    entryWidth,
    entryY,
    hitWidth,
    bottomWidth: hitWidth,
    passWidth,
    visibleBottomWidth,
    buildingScaleWidth,
    roadPassT,
    roadEdgeAngleDeg: ROAD_EDGE_ANGLE_DEG,
    roadEdgeAngleRad: ROAD_EDGE_ANGLE_RAD,
    roadSpreadPerY,
    visibleBottomT,
    visibleBottomDepth: ROAD_VISIBLE_BOTTOM_DEPTH,
    targetY,
    targetProgress: TARGET_PROGRESS,
    entryProgress: ENTRY_PROGRESS,
    hitDepth: HIT_DEPTH,
    passDepth: PASS_DEPTH,
  };
}

function projectDepthToRoadTValue(depth, roadPassT) {
  if (depth <= HIT_DEPTH) {
    return Math.pow(clamp(depth / HIT_DEPTH, 0, 1), DEPTH_GAMMA);
  }

  const passT = clamp((depth - HIT_DEPTH) / (PASS_DEPTH - HIT_DEPTH), 0, 1);
  return lerp(1, roadPassT, passT);
}

function projectDepthToRoadT(depth, laneMetrics) {
  return projectDepthToRoadTValue(depth, laneMetrics.roadPassT);
}

function projectDepthToY(laneMetrics, depth) {
  const roadT = projectDepthToRoadT(depth, laneMetrics);
  return laneMetrics.top + (laneMetrics.targetY - laneMetrics.top) * roadT;
}

function getYAtDepth(laneMetrics, depth) {
  return projectDepthToY(laneMetrics, depth);
}

function getTargetY(laneMetrics) {
  return laneMetrics.targetY;
}

function projectDepthToWidth(laneMetrics, depth) {
  const y = projectDepthToY(laneMetrics, depth);
  const width = laneMetrics.entryWidth + (y - laneMetrics.entryY) * laneMetrics.roadSpreadPerY;
  return Math.max(ROAD_MIN_PROJECTED_WIDTH, width);
}

function getWidthAtDepth(laneMetrics, depth) {
  return projectDepthToWidth(laneMetrics, depth);
}

function getRoadPointAtDepth(laneMetrics, ratio, depth) {
  const width = projectDepthToWidth(laneMetrics, depth);
  return {
    x: laneMetrics.centerX - width / 2 + width * ratio,
    y: projectDepthToY(laneMetrics, depth),
  };
}

function getRoadEdgeAtDepth(laneMetrics, side, depth) {
  return getRoadPointAtDepth(laneMetrics, side === "left" ? 0 : 1, depth);
}

export function getLaneCenterAtDepth(laneMetrics, lane, depth) {
  return getRoadPointAtDepth(laneMetrics, (lane + 0.5) / 3, depth).x;
}

function getLaneWidthAtDepth(laneMetrics, depth) {
  return getWidthAtDepth(laneMetrics, depth) / 3;
}

function timeToDepth(noteTime, currentTime) {
  return HIT_DEPTH - ((noteTime - currentTime) / NOTE_TRAVEL_TIME) *
    (HIT_DEPTH - ENTRY_DEPTH);
}

function drawPixelText(ctx, text, x, y, options = {}) {
  ctx.save();
  ctx.font = `${options.weight || 700} ${options.size || 16}px ${
    options.family || '"PixelEnPrimary", monospace'
  }`;
  ctx.textAlign = options.align || "left";
  ctx.textBaseline = options.baseline || "top";
  ctx.fillStyle = options.shadow || COLORS.shadow;
  ctx.fillText(text, snap(x + 2), snap(y + 2));
  ctx.fillStyle = options.color || COLORS.text;
  ctx.fillText(text, snap(x), snap(y));
  ctx.restore();
}

function drawBackground(ctx, viewport, sceneTime) {
  const { width, height } = viewport;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.skyTop);
  gradient.addColorStop(0.52, COLORS.skyBottom);
  gradient.addColorStop(1, "#182333");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const pixel = Math.max(2, Math.round(width / DESIGN_WIDTH) * 2);
  ctx.fillStyle = "rgba(255, 235, 166, 0.7)";
  for (let index = 0; index < 34; index += 1) {
    const x = (index * 83 + 31) % Math.max(1, width);
    const y = (index * 47 + Math.floor(sceneTime * 10)) % Math.max(1, height * 0.54);
    const size = pixel * (index % 3 === 0 ? 2 : 1);
    ctx.fillRect(snap(x, pixel), snap(y, pixel), size, size);
  }
}

function seededUnit(seed, salt = 0) {
  const value = Math.sin(seed * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function pickSeeded(list, seed, salt = 0) {
  return list[Math.floor(seededUnit(seed, salt) * list.length) % list.length];
}

const BUILDING_PALETTES = Object.freeze([
  { body: "#27445f", side: "#1b3049", roof: "#6fd0f2", window: "#d9fbff", sign: "#ff85d5" },
  { body: "#315b7a", side: "#203d61", roof: "#bfefff", window: "#ffe98f", sign: "#72f1c8" },
  { body: "#3b4d7d", side: "#27325a", roof: "#8aa7ff", window: "#e9f7ff", sign: "#f6a6ff" },
  { body: "#226879", side: "#174455", roof: "#b8fff1", window: "#fff5bc", sign: "#ffb05f" },
]);

function getPerspectiveBuilding(spawnId, side, layer) {
  const near = layer === 0;
  const lengthPick = seededUnit(spawnId, 12);
  const blockKind = lengthPick > 0.72 ? "long" : lengthPick > 0.34 ? "mid" : "short";
  const heightPick = seededUnit(spawnId, 13 + layer);
  const gapPick = seededUnit(spawnId, 14 + layer);
  return {
    spawnId,
    side,
    layer,
    palette: pickSeeded(BUILDING_PALETTES, spawnId + layer * 97 + (side === "left" ? 13 : 29)),
    depthSpan:
      blockKind === "long"
        ? lerp(0.3, 0.44, seededUnit(spawnId, 1 + layer))
        : blockKind === "mid"
          ? lerp(0.18, 0.31, seededUnit(spawnId, 1 + layer))
          : lerp(0.09, 0.18, seededUnit(spawnId, 1 + layer)),
    slotGap: gapPick > 0.78 ? lerp(0.045, 0.085, gapPick) : gapPick > 0.32 ? lerp(0.012, 0.038, gapPick) : 0,
    facadeDepthRatio: lerp(near ? 0.15 : 0.1, near ? 0.26 : 0.18, seededUnit(spawnId, 2 + layer)),
    heightRatio: lerp(
      near ? 0.58 : 0.42,
      near ? 1.45 : 1.0,
      Math.pow(heightPick, 0.72)
    ),
    setbackRatio: near ? lerp(0.028, 0.058, seededUnit(spawnId, 4)) : lerp(0.084, 0.128, seededUnit(spawnId, 4)),
    windowCols: near ? 4 + Math.floor(seededUnit(spawnId, 5) * 5) : 3 + Math.floor(seededUnit(spawnId, 5) * 4),
    windowRows: near ? 7 + Math.floor(seededUnit(spawnId, 6) * 6) : 5 + Math.floor(seededUnit(spawnId, 6) * 4),
    hasSign: near && seededUnit(spawnId, 7) > 0.58,
    signRow: 1 + Math.floor(seededUnit(spawnId, 8) * 3),
    facadeStripe: seededUnit(spawnId, 9) > 0.48,
    capHeightRatio: lerp(0.08, 0.14, seededUnit(spawnId, 10)),
    sideDepthRatio: lerp(0.28, 0.46, seededUnit(spawnId, 11)),
    topInsetRatio: lerp(0.08, 0.18, seededUnit(spawnId, 15)),
  };
}

function drawQuad(ctx, points, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.fill();
}

function lerpPoint(a, b, t) {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
  };
}

function getBuildingDepth(building, sceneTime, slotIndex) {
  const depthSpacing = building.layer === 0 ? 0.23 : 0.31;
  const speed = building.layer === 0 ? 0.35 : 0.27;
  const cycle = PASS_DEPTH + depthSpacing * 2.7;
  const slotOffset = (slotIndex || 0) * depthSpacing + building.slotGap;
  const rawDepth = ((slotOffset + sceneTime * speed) % cycle) - depthSpacing * 0.74;
  return rawDepth + ENTRY_DEPTH;
}

function makeCityBlockFrame(laneMetrics, building, nearDepth) {
  const sideSign = building.side === "left" ? -1 : 1;
  const anchorDepth = Math.min(nearDepth, ROAD_VISIBLE_BOTTOM_DEPTH + 0.06);
  const farDepth = anchorDepth - building.depthSpan;
  const nearEdge = getRoadEdgeAtDepth(laneMetrics, building.side, anchorDepth);
  const farEdge = getRoadEdgeAtDepth(laneMetrics, building.side, farDepth);
  const roadT = projectDepthToRoadT(anchorDepth, laneMetrics);
  const nearT = clamp(roadT / Math.max(1, laneMetrics.roadPassT), 0, 1);
  const layerScale = building.layer === 0 ? 1 : 0.72;
  const scale = lerp(0.6, 1.08, nearT) * layerScale;
  const buildingScaleWidth = laneMetrics.buildingScaleWidth || laneMetrics.hitWidth;
  const gap = buildingScaleWidth * building.setbackRatio * lerp(0.6, 1, nearT);
  const facadeDepth = buildingScaleWidth * building.facadeDepthRatio * scale;
  const height = buildingScaleWidth * building.heightRatio * scale;
  const sideDepth = facadeDepth * building.sideDepthRatio;
  const roofLift = Math.max(3, facadeDepth * building.capHeightRatio);
  const baseLift = lerp(2, 10, nearT) + building.layer * 7;

  const nearInner = {
    x: nearEdge.x + sideSign * gap,
    y: nearEdge.y + baseLift,
  };
  const farInner = {
    x: farEdge.x + sideSign * gap * 0.72,
    y: farEdge.y + baseLift * 0.5,
  };
  const nearOuter = {
    x: nearInner.x + sideSign * facadeDepth,
    y: nearInner.y - sideDepth * 0.14,
  };
  const farOuter = {
    x: farInner.x + sideSign * facadeDepth * lerp(0.74, 0.96, nearT),
    y: farInner.y - sideDepth * 0.24,
  };
  const nearTopInner = { x: nearInner.x, y: nearInner.y - height };
  const farTopInner = { x: farInner.x, y: farInner.y - height * 0.76 };
  const nearTopOuter = {
    x: nearOuter.x - sideSign * facadeDepth * building.topInsetRatio,
    y: nearOuter.y - height * 0.98,
  };
  const farTopOuter = {
    x: farOuter.x - sideSign * facadeDepth * building.topInsetRatio * 0.58,
    y: farOuter.y - height * 0.74,
  };
  const roofNearInner = { x: nearTopInner.x, y: nearTopInner.y - roofLift };
  const roofNearOuter = { x: nearTopOuter.x, y: nearTopOuter.y - roofLift };
  const roofFarOuter = { x: farTopOuter.x, y: farTopOuter.y - roofLift * 0.72 };
  const roofFarInner = { x: farTopInner.x, y: farTopInner.y - roofLift * 0.72 };
  const allPoints = [
    nearInner,
    farInner,
    farOuter,
    nearOuter,
    nearTopInner,
    farTopInner,
    farTopOuter,
    nearTopOuter,
    roofNearInner,
    roofNearOuter,
    roofFarOuter,
    roofFarInner,
  ];

  return {
    nearInner,
    farInner,
    farOuter,
    nearOuter,
    nearTopInner,
    farTopInner,
    farTopOuter,
    nearTopOuter,
    roofNearInner,
    roofNearOuter,
    roofFarOuter,
    roofFarInner,
    minX: Math.min(...allPoints.map((point) => point.x)),
    maxX: Math.max(...allPoints.map((point) => point.x)),
    minY: Math.min(...allPoints.map((point) => point.y)),
    maxY: Math.max(...allPoints.map((point) => point.y)),
    width: Math.abs(nearOuter.x - nearInner.x),
    height,
    nearT,
  };
}

function drawBuildingWindows(ctx, building, frame) {
  const colInset = 0.16;
  const rowInset = 0.1;
  const cellW = (1 - colInset * 2) / Math.max(1, building.windowCols);
  const cellH = (1 - rowInset * 2) / Math.max(1, building.windowRows);
  const windowW = cellW * 0.42;
  const windowH = cellH * 0.32;

  for (let row = 0; row < building.windowRows; row += 1) {
    for (let col = 0; col < building.windowCols; col += 1) {
      if (seededUnit(building.spawnId, row * 17 + col * 31 + building.layer * 43) < 0.24) continue;
      const u = colInset + col * cellW + (cellW - windowW) * 0.5;
      const v = rowInset + row * cellH + (cellH - windowH) * 0.5;
      const rowTopLeft = lerpPoint(frame.nearTopInner, frame.nearInner, v);
      const rowTopRight = lerpPoint(frame.farTopInner, frame.farInner, v);
      const rowBottomLeft = lerpPoint(frame.nearTopInner, frame.nearInner, v + windowH);
      const rowBottomRight = lerpPoint(frame.farTopInner, frame.farInner, v + windowH);
      const p1 = lerpPoint(rowTopLeft, rowTopRight, u);
      const p2 = lerpPoint(rowTopLeft, rowTopRight, u + windowW);
      const p3 = lerpPoint(rowBottomLeft, rowBottomRight, u + windowW);
      const p4 = lerpPoint(rowBottomLeft, rowBottomRight, u);
      ctx.fillStyle = building.palette.window;
      drawQuad(ctx, [p1, p2, p3, p4], building.palette.window);
    }
  }
}

function drawPerspectiveBuilding(ctx, building, nearDepth, laneMetrics, viewport) {
  if (nearDepth < ENTRY_DEPTH - 0.16 || nearDepth - building.depthSpan > PASS_DEPTH + 0.18) return;

  const frame = makeCityBlockFrame(laneMetrics, building, nearDepth);
  if (
    frame.maxY < -viewport.height * 0.34 ||
    frame.minY > viewport.height + NOTE_PASS_MARGIN ||
    frame.maxX < -viewport.width * 0.3 ||
    frame.minX > viewport.width * 1.3
  ) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = (building.layer === 0 ? 0.96 : 0.58) * lerp(0.72, 1, frame.nearT);
  drawQuad(ctx, [frame.nearTopOuter, frame.nearOuter, frame.farOuter, frame.farTopOuter], building.palette.side);
  drawQuad(ctx, [frame.nearTopInner, frame.nearInner, frame.farInner, frame.farTopInner], building.palette.body);
  drawQuad(ctx, [frame.nearInner, frame.nearOuter, frame.nearTopOuter, frame.nearTopInner], "rgba(255, 255, 255, 0.06)");
  drawQuad(ctx, [frame.farInner, frame.farOuter, frame.farTopOuter, frame.farTopInner], "rgba(4, 8, 18, 0.18)");
  drawQuad(ctx, [frame.nearTopInner, frame.nearTopOuter, frame.farTopOuter, frame.farTopInner], "rgba(255, 255, 255, 0.1)");
  drawQuad(ctx, [frame.roofNearInner, frame.roofNearOuter, frame.roofFarOuter, frame.roofFarInner], building.palette.roof);

  if (building.facadeStripe) {
    const stripeU = building.side === "left" ? 0.34 : 0.66;
    const stripeWidth = 0.045;
    const topA = lerpPoint(frame.nearTopInner, frame.farTopInner, stripeU);
    const topB = lerpPoint(frame.nearTopInner, frame.farTopInner, stripeU + stripeWidth);
    const bottomB = lerpPoint(frame.nearInner, frame.farInner, stripeU + stripeWidth);
    const bottomA = lerpPoint(frame.nearInner, frame.farInner, stripeU);
    drawQuad(ctx, [topA, topB, bottomB, bottomA], "rgba(255, 255, 255, 0.08)");
  }

  drawBuildingWindows(ctx, building, frame);

  if (building.hasSign) {
    const signV = clamp(building.signRow / building.windowRows, 0.14, 0.42);
    const signHeight = 0.052;
    const signStart = 0.22;
    const signEnd = 0.72;
    const topLeft = lerpPoint(
      lerpPoint(frame.nearTopInner, frame.nearInner, signV),
      lerpPoint(frame.farTopInner, frame.farInner, signV),
      signStart
    );
    const topRight = lerpPoint(
      lerpPoint(frame.nearTopInner, frame.nearInner, signV),
      lerpPoint(frame.farTopInner, frame.farInner, signV),
      signEnd
    );
    const bottomRight = lerpPoint(
      lerpPoint(frame.nearTopInner, frame.nearInner, signV + signHeight),
      lerpPoint(frame.farTopInner, frame.farInner, signV + signHeight),
      signEnd
    );
    const bottomLeft = lerpPoint(
      lerpPoint(frame.nearTopInner, frame.nearInner, signV + signHeight),
      lerpPoint(frame.farTopInner, frame.farInner, signV + signHeight),
      signStart
    );
    drawQuad(ctx, [topLeft, topRight, bottomRight, bottomLeft], building.palette.sign);
  }

  ctx.restore();
}

function drawCityCanyon(ctx, viewport, laneMetrics, sceneTime) {
  const buildingCount = 11;
  const buildings = [];
  for (let spawnId = 0; spawnId < buildingCount; spawnId += 1) {
    ["left", "right"].forEach((side) => {
      for (let layer = 1; layer >= 0; layer -= 1) {
        const offsetId = spawnId + (side === "left" ? 0 : 37) + layer * 73;
        const building = getPerspectiveBuilding(offsetId, side, layer);
        buildings.push({
          building,
          depth: getBuildingDepth(building, sceneTime, spawnId),
        });
      }
    });
  }

  buildings
    .sort((a, b) => a.depth - b.depth)
    .forEach(({ building, depth }) => {
      drawPerspectiveBuilding(ctx, building, depth, laneMetrics, viewport);
    });
}

function drawRoad(ctx, viewport, laneMetrics) {
  const topLeft = getRoadEdgeAtDepth(laneMetrics, "left", ENTRY_DEPTH);
  const topRight = getRoadEdgeAtDepth(laneMetrics, "right", ENTRY_DEPTH);
  const bottomRight = getRoadEdgeAtDepth(laneMetrics, "right", ROAD_VISIBLE_BOTTOM_DEPTH);
  const bottomLeft = getRoadEdgeAtDepth(laneMetrics, "left", ROAD_VISIBLE_BOTTOM_DEPTH);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(topLeft.x, topLeft.y);
  ctx.lineTo(topRight.x, topRight.y);
  ctx.lineTo(bottomRight.x, bottomRight.y);
  ctx.lineTo(bottomLeft.x, bottomLeft.y);
  ctx.closePath();
  ctx.fillStyle = COLORS.road;
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.roadEdge;
  ctx.stroke();

  for (let boundary = 1; boundary < 3; boundary += 1) {
    const top = getRoadPointAtDepth(laneMetrics, boundary / 3, ENTRY_DEPTH);
    const bottom = getRoadPointAtDepth(laneMetrics, boundary / 3, ROAD_VISIBLE_BOTTOM_DEPTH);
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = boundary === 1 ? COLORS.laneDim : COLORS.lane;
    ctx.stroke();
  }

  const targetY = getTargetY(laneMetrics);
  const targetWidth = getWidthAtDepth(laneMetrics, TARGET_PROGRESS) * 0.86;
  ctx.fillStyle = "rgba(255, 244, 189, 0.12)";
  ctx.fillRect(
    snap(laneMetrics.centerX - targetWidth / 2),
    snap(targetY - 8),
    snap(targetWidth),
    16
  );
  ctx.fillStyle = COLORS.target;
  ctx.fillRect(
    snap(laneMetrics.centerX - targetWidth / 2),
    snap(targetY - 1),
    snap(targetWidth),
    2
  );
  ctx.restore();
}

function getSpriteAspect(sprite, fallback = 1) {
  if (!sprite || !sprite.width || !sprite.height) return fallback;
  return sprite.width / sprite.height;
}

function drawSpriteFrame(ctx, sprite, x, y, width, height, options = {}) {
  if (!sprite) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (options.shadowColor) {
    ctx.shadowColor = options.shadowColor;
    ctx.shadowBlur = options.shadowBlur || 0;
  }
  if (options.alpha !== undefined) {
    ctx.globalAlpha *= options.alpha;
  }
  if (options.rotation) {
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(options.rotation);
    ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
  } else {
    ctx.drawImage(sprite, x, y, width, height);
  }
  ctx.restore();
}

function drawPigNote(ctx, sprite, x, y, height, alpha = 1, isMiss = false) {
  const width = height * getSpriteAspect(sprite, 1.27);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = isMiss ? "rgba(6, 10, 20, 0.18)" : "rgba(4, 7, 16, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + height * 0.4, width * 0.26, height * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  if (isMiss) {
    ctx.filter = "grayscale(0.45) saturate(0.75)";
  }
  drawSpriteFrame(
    ctx,
    sprite,
    x - width / 2,
    y - height / 2,
    width,
    height,
    {
      shadowColor: isMiss ? "rgba(220, 229, 242, 0.12)" : "rgba(255, 210, 120, 0.3)",
      shadowBlur: isMiss ? 2 : 6,
    }
  );
  ctx.restore();
}

function getNoteAlpha(note, depth) {
  if (note.result === "miss") {
    const passFade = clamp((PASS_DEPTH - depth) / 0.18, 0, 1);
    return Math.min(0.68, Math.max(0.2, passFade));
  }
  return 1;
}

function drawTapNote(ctx, laneMetrics, note, depth, sprites = {}) {
  const x = getLaneCenterAtDepth(laneMetrics, note.lane, depth);
  const y = note.holding ? getTargetY(laneMetrics) : getYAtDepth(laneMetrics, depth);
  const laneWidth = getLaneWidthAtDepth(laneMetrics, depth);
  const scale = lerp(0.72, 0.98, clamp(depth / HIT_DEPTH, 0, 1)) * (note.size || 1);
  const isAccent = note.accent;
  const alpha = getNoteAlpha(note, depth);
  const pigSprite = note.result === "miss" ? sprites.pigFront : sprites.pigFront;

  if (pigSprite) {
    const height = clamp(laneWidth * 0.52 * scale, 26, 58);
    drawPigNote(ctx, pigSprite, x, y, height, alpha, note.result === "miss");
    if (isAccent && note.result !== "miss") {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = COLORS.noteCore;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, height * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    return;
  }

  const radius = clamp(laneWidth * 0.16 * scale, 7, 24);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "rgba(4, 7, 16, 0.34)";
  ctx.fillRect(-radius + 2, -radius + 4, radius * 2, radius * 2);
  ctx.fillStyle = note.result === "miss" ? "rgba(226, 232, 240, 0.54)" : isAccent ? COLORS.note : COLORS.good;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  ctx.fillStyle = note.result === "miss" ? "rgba(255, 255, 255, 0.48)" : isAccent ? COLORS.noteCore : COLORS.holdCore;
  ctx.fillRect(-radius * 0.46, -radius * 0.46, radius * 0.92, radius * 0.92);
  ctx.restore();
}

function drawHoldNote(ctx, laneMetrics, note, currentTime, sprites = {}) {
  const headDepth = note.holding
    ? TARGET_PROGRESS
    : timeToDepth(note.time, currentTime);
  const tailDepth = timeToDepth(note.endTime, currentTime);
  const visibleHead = clamp(headDepth, ENTRY_PROGRESS, PASS_DEPTH);
  const visibleTail = clamp(tailDepth, ENTRY_PROGRESS, PASS_DEPTH);
  if (Math.max(headDepth, tailDepth) < ENTRY_PROGRESS - 0.04 || Math.min(headDepth, tailDepth) > PASS_DEPTH) {
    return;
  }
  const alpha = getNoteAlpha(note, Math.max(headDepth, tailDepth));

  const segments = 12;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let step = 0; step <= segments; step += 1) {
    const depth = lerp(visibleTail, visibleHead, step / segments);
    const x = getLaneCenterAtDepth(laneMetrics, note.lane, depth);
    const y = note.holding && step === segments ? getTargetY(laneMetrics) : getYAtDepth(laneMetrics, depth);
    if (step === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  const width = clamp(getLaneWidthAtDepth(laneMetrics, visibleHead) * 0.2, 8, 24);
  ctx.lineWidth = width + 5;
  ctx.strokeStyle = "rgba(4, 7, 16, 0.34)";
  ctx.stroke();
  ctx.lineWidth = width;
  ctx.strokeStyle = note.result === "miss" ? "rgba(226, 232, 240, 0.5)" : COLORS.hold;
  ctx.stroke();
  ctx.lineWidth = Math.max(3, width * 0.38);
  ctx.strokeStyle = note.result === "miss" ? "rgba(255, 255, 255, 0.38)" : COLORS.holdCore;
  ctx.stroke();
  ctx.restore();

  drawTapNote(ctx, laneMetrics, { ...note, accent: true }, visibleHead, sprites);
}

function drawNotes(ctx, viewport, laneMetrics, state, sprites = {}) {
  const currentTime = state.currentTime;
  state.notes.forEach((note) => {
    if (note.judged && note.hit) return;

    const depth = timeToDepth(note.time, currentTime);
    const tailDepth = note.kind === "hold" ? timeToDepth(note.endTime, currentTime) : depth;
    if (
      Math.max(depth, tailDepth) < ENTRY_PROGRESS - 0.04 ||
      Math.min(depth, tailDepth) > PASS_DEPTH ||
      getYAtDepth(laneMetrics, Math.min(depth, tailDepth)) > viewport.height + NOTE_PASS_MARGIN
    ) {
      return;
    }

    if (note.kind === "hold") {
      drawHoldNote(ctx, laneMetrics, note, currentTime, sprites);
    } else {
      drawTapNote(ctx, laneMetrics, note, depth, sprites);
    }
  });
}

function drawRabbit(ctx, laneMetrics, state, sprites, sceneTime) {
  const lanePosition = clamp(state.playerLanePosition, 0, 2);
  const laneA = Math.floor(lanePosition);
  const laneB = Math.min(2, laneA + 1);
  const mix = lanePosition - laneA;
  const x = lerp(
    getLaneCenterAtDepth(laneMetrics, laneA, TARGET_PROGRESS),
    getLaneCenterAtDepth(laneMetrics, laneB, TARGET_PROGRESS),
    mix
  );
  const feetY = getTargetY(laneMetrics) + 18;
  const bob = Math.sin(sceneTime * Math.PI * 6) * 2;
  const image = sprites.rabbitBack || sprites.rabbitFront;
  const height = clamp(laneMetrics.bottom - laneMetrics.top, 104, 154) * 0.18;
  const fallbackHeight = clamp((laneMetrics.bottom - laneMetrics.top) * 0.19, 104, 148);
  const drawHeight = image ? fallbackHeight : 86;
  const aspect = image ? image.width / image.height : 0.76;
  const drawWidth = drawHeight * aspect;

  ctx.save();
  ctx.fillStyle = "rgba(4, 7, 16, 0.34)";
  ctx.beginPath();
  ctx.ellipse(snap(x), snap(feetY + 2), drawWidth * 0.34, height * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  if (image) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      image,
      snap(x - drawWidth / 2),
      snap(feetY - drawHeight + bob),
      snap(drawWidth),
      snap(drawHeight)
    );
  } else {
    ctx.fillStyle = "#f7f2df";
    ctx.fillRect(snap(x - 18), snap(feetY - 72 + bob), 36, 58);
    ctx.fillRect(snap(x - 22), snap(feetY - 96 + bob), 12, 30);
    ctx.fillRect(snap(x + 10), snap(feetY - 96 + bob), 12, 30);
  }
  ctx.restore();
}

function drawPigLaunch(ctx, laneMetrics, effect, sprites = {}) {
  const sprite = sprites.pigFrontLaunch || sprites.pigFront;
  if (!sprite) return;

  const t = clamp(effect.age / Math.max(0.001, effect.duration), 0, 1);
  const launch = effect.launch || {
    direction: effect.direction || 1,
    spin: (effect.direction || 1) * 3.2,
    drift: 140,
    lift: 64,
    drop: 88,
  };
  const centerX = getLaneCenterAtDepth(laneMetrics, effect.lane ?? 1, TARGET_PROGRESS);
  const centerY = getTargetY(laneMetrics);
  const x = centerX + launch.direction * launch.drift * t;
  const y = centerY - 18 - Math.sin(t * Math.PI * 0.94) * launch.lift + t * t * launch.drop;
  const rotation = launch.spin * t * Math.PI;
  const scale = lerp(1.06, 0.86, t);
  const alpha = Math.max(0, 1 - t * 0.88);
  const height = PIG_BASE_HEIGHT * scale;
  const width = height * getSpriteAspect(sprite, 1.27);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  drawSpriteFrame(
    ctx,
    sprite,
    -width / 2,
    -height / 2,
    width,
    height,
    {
      shadowColor: "rgba(255, 184, 205, 0.34)",
      shadowBlur: lerp(12, 4, t),
    }
  );
  ctx.restore();

  const glassesSprite = sprites.pigGlasses;
  if (glassesSprite) {
    const glassesX = centerX + launch.direction * launch.drift * 1.08 * t;
    const glassesY =
      centerY -
      38 -
      Math.sin(t * Math.PI * 0.96) * launch.lift * 1.45 +
      t * t * launch.drop * 0.62;
    const glassesWidth = PIG_BASE_HEIGHT * scale * PIG_GLASSES_LAUNCH_WIDTH_RATIO;
    const glassesHeight = glassesWidth / getSpriteAspect(glassesSprite, 5.1);
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t * 0.78);
    ctx.translate(glassesX, glassesY);
    ctx.rotate(launch.spin * t * Math.PI * 1.35 + launch.direction * 0.24);
    drawSpriteFrame(
      ctx,
      glassesSprite,
      -glassesWidth / 2,
      -glassesHeight / 2,
      glassesWidth,
      glassesHeight,
      {
        shadowColor: "rgba(255, 242, 205, 0.25)",
        shadowBlur: lerp(8, 2, t),
      }
    );
    ctx.restore();
  }
}

function drawEffects(ctx, laneMetrics, state, sprites = {}) {
  state.effects.forEach((effect) => {
    const t = clamp(effect.age / Math.max(0.001, effect.duration), 0, 1);
    const x = getLaneCenterAtDepth(laneMetrics, effect.lane ?? 1, TARGET_PROGRESS);
    const y = getTargetY(laneMetrics);

    if (effect.kind === "pigLaunch") {
      drawPigLaunch(ctx, laneMetrics, effect, sprites);
      return;
    }

    if (effect.kind === "collect" || effect.kind === "holdStart") {
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = effect.quality === "perfect" ? COLORS.perfect : COLORS.good;
      ctx.lineWidth = 2;
      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8;
        const inner = 12 + t * 12;
        const outer = 22 + t * 28;
        ctx.beginPath();
        ctx.moveTo(snap(x + Math.cos(angle) * inner), snap(y + Math.sin(angle) * inner));
        ctx.lineTo(snap(x + Math.cos(angle) * outer), snap(y + Math.sin(angle) * outer));
        ctx.stroke();
      }
      ctx.restore();
    }

    if (effect.kind === "floatText") {
      drawPixelText(ctx, effect.quality === "perfect" ? "+PERFECT" : "+GOOD", x, y - 52 - t * 28, {
        align: "center",
        size: 13,
        color: effect.quality === "perfect" ? COLORS.perfect : COLORS.good,
      });
    }
  });
}

function drawComboBadge(ctx, viewport, state, uiState) {
  if (state.combo <= 0) {
    lastComboForPulse = 0;
    return;
  }

  const sceneTime = uiState.sceneTime || state.currentTime || 0;
  if (state.combo > lastComboForPulse) {
    comboPulseStartedAt = sceneTime;
    lastComboForPulse = state.combo;
  } else if (state.combo < lastComboForPulse) {
    lastComboForPulse = state.combo;
  }

  const pulseAge = clamp(sceneTime - comboPulseStartedAt, 0, COMBO_PULSE_DURATION);
  const pulseT = pulseAge / COMBO_PULSE_DURATION;
  const elastic = Math.sin((1 - pulseT) * Math.PI) * Math.pow(1 - pulseT, 0.62);
  const scale = 1 + elastic * 0.16;
  const numberSize = clamp(viewport.width * 0.15, 52, 70);
  const labelSize = clamp(viewport.width * 0.038, 13, 16);
  const centerX = viewport.width / 2;
  const centerY = clamp(viewport.height * 0.18, 118, 154);
  const badgeWidth = Math.max(118, numberSize * 1.82);
  const badgeHeight = numberSize + 28;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = "rgba(6, 10, 20, 0.24)";
  ctx.fillRect(
    snap(-badgeWidth / 2),
    snap(-badgeHeight / 2),
    snap(badgeWidth),
    snap(badgeHeight)
  );
  ctx.strokeStyle = "rgba(255, 212, 95, 0.24)";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    snap(-badgeWidth / 2 + 1),
    snap(-badgeHeight / 2 + 1),
    snap(badgeWidth - 2),
    snap(badgeHeight - 2)
  );
  drawPixelText(ctx, "COMBO", 0, -badgeHeight * 0.34, {
    align: "center",
    size: labelSize,
    color: "#f4c56d",
    shadow: "rgba(4, 7, 16, 0.62)",
  });
  drawPixelText(ctx, String(state.combo), 0, -badgeHeight * 0.12, {
    align: "center",
    size: numberSize,
    color: COLORS.text,
    shadow: "rgba(4, 7, 16, 0.72)",
  });
  ctx.restore();
}

function drawHud(ctx, viewport, state, uiState) {
  const progress = clamp(state.currentTime / Math.max(1, state.chart.duration || 1), 0, 1);
  ctx.save();
  ctx.fillStyle = "rgba(4, 7, 16, 0.42)";
  ctx.fillRect(0, 0, viewport.width, 5);
  ctx.fillStyle = "#ffd45f";
  ctx.fillRect(0, 0, snap(viewport.width * progress), 5);

  if (uiState.sprites?.songCover) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(uiState.sprites.songCover, 16, 20, 44, 44);
  } else {
    ctx.fillStyle = "rgba(255, 244, 189, 0.22)";
    ctx.fillRect(16, 20, 44, 44);
  }
  drawPixelText(ctx, "SCORE", 70, 20, { size: 10, color: "#f4c56d" });
  drawPixelText(ctx, String(Math.round(state.score)).padStart(6, "0"), 70, 36, {
    size: 18,
    color: COLORS.text,
  });

  const pause = getControlRects(viewport).pause;
  ctx.fillStyle = "rgba(4, 7, 16, 0.5)";
  ctx.fillRect(pause.left, pause.top, pause.right - pause.left, pause.bottom - pause.top);
  ctx.fillStyle = COLORS.text;
  ctx.fillRect(pause.left + 8, pause.top + 7, 3, 14);
  ctx.fillRect(pause.left + 17, pause.top + 7, 3, 14);
  ctx.restore();
}

function drawPauseOverlay(ctx, viewport) {
  ctx.save();
  ctx.fillStyle = "rgba(8, 12, 22, 0.76)";
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  drawPixelText(ctx, "PAUSED", viewport.width / 2, viewport.height * 0.34, {
    align: "center",
    size: 30,
    color: COLORS.text,
  });

  const rects = getControlRects(viewport);
  const buttons = [
    [rects.pauseHome, "HOME"],
    [rects.pauseRestart, "RETRY"],
    [rects.resume, "RUN"],
  ];

  buttons.forEach(([rect, label]) => {
    ctx.fillStyle = "#26344c";
    ctx.fillRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
    ctx.strokeStyle = "#f4c56d";
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.left + 1, rect.top + 1, rect.right - rect.left - 2, rect.bottom - rect.top - 2);
    drawPixelText(ctx, label, (rect.left + rect.right) / 2, rect.top + 18, {
      align: "center",
      size: 11,
      color: COLORS.text,
    });
  });
  ctx.restore();
}

export function getControlRects(viewport) {
  const pauseSize = 30;
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const buttonSize = Math.min(64, Math.max(52, viewport.width * 0.15));
  const gap = 14;
  const rowLeft = centerX - (buttonSize * 3 + gap * 2) / 2;
  const top = centerY - buttonSize / 2;

  return {
    pause: {
      left: viewport.width - 48,
      top: 20,
      right: viewport.width - 18,
      bottom: 50,
    },
    pauseHome: {
      left: rowLeft,
      top,
      right: rowLeft + buttonSize,
      bottom: top + buttonSize,
    },
    pauseRestart: {
      left: rowLeft + buttonSize + gap,
      top,
      right: rowLeft + buttonSize * 2 + gap,
      bottom: top + buttonSize,
    },
    resume: {
      left: rowLeft + buttonSize * 2 + gap * 2,
      top,
      right: rowLeft + buttonSize * 3 + gap * 2,
      bottom: top + buttonSize,
    },
  };
}

export function pointHitsRect(point, rect) {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

export function renderParkourFrame(ctx, viewport, state, uiState = {}) {
  const laneMetrics = getLaneMetrics(viewport);
  ctx.clearRect(0, 0, viewport.width, viewport.height);
  drawBackground(ctx, viewport, uiState.sceneTime || state.currentTime || 0);
  drawCityCanyon(ctx, viewport, laneMetrics, uiState.sceneTime || state.currentTime || 0);
  drawRoad(ctx, viewport, laneMetrics);
  if (uiState.gameplayActive) {
    drawNotes(ctx, viewport, laneMetrics, state, uiState.sprites || {});
  }
  drawRabbit(ctx, laneMetrics, state, uiState.sprites || {}, uiState.sceneTime || 0);
  if (uiState.gameplayActive) {
    drawEffects(ctx, laneMetrics, state, uiState.sprites || {});
    drawComboBadge(ctx, viewport, state, uiState);
  }
  drawHud(ctx, viewport, state, uiState);
  if (uiState.paused) {
    drawPauseOverlay(ctx, viewport);
  }
}
