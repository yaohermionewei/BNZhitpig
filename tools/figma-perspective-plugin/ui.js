const PREVIEW_WIDTH = 500;
const PREVIEW_HEIGHT = 680;
const HANDLE_RADIUS = 8;
const HANDLE_HIT_RADIUS = 14;
const OUTPUT_PADDING = 4;

const dom = {
  canvas: document.getElementById("editorCanvas"),
  reloadButton: document.getElementById("reloadButton"),
  insertButton: document.getElementById("insertButton"),
  rotateLeftButton: document.getElementById("rotateLeftButton"),
  rotateRightButton: document.getElementById("rotateRightButton"),
  leftPresetButton: document.getElementById("leftPresetButton"),
  rightPresetButton: document.getElementById("rightPresetButton"),
  resetQuadButton: document.getElementById("resetQuadButton"),
  closeButton: document.getElementById("closeButton"),
  mirrorCheckbox: document.getElementById("mirrorCheckbox"),
  exportScale: document.getElementById("exportScale"),
  selectionMeta: document.getElementById("selectionMeta"),
  resultMeta: document.getElementById("resultMeta"),
  statusText: document.getElementById("statusText"),
};

const state = {
  sourceBytes: null,
  sourceImage: null,
  sourceName: "",
  sourceBounds: null,
  exportScale: 1,
  rotation: "ccw",
  mirrorX: false,
  quad: null,
  draggingHandle: null,
};

const ctx = dom.canvas.getContext("2d");

function postToPlugin(message) {
  parent.postMessage({ pluginMessage: message }, "*");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(left, right) {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function lerpPoint(left, right, progress) {
  return {
    x: left.x + (right.x - left.x) * progress,
    y: left.y + (right.y - left.y) * progress,
  };
}

function getLeftPresetQuad() {
  return [
    { x: PREVIEW_WIDTH * 0.37, y: PREVIEW_HEIGHT * 0.05 },
    { x: PREVIEW_WIDTH * 0.46, y: PREVIEW_HEIGHT * 0.05 },
    { x: PREVIEW_WIDTH * 0.65, y: PREVIEW_HEIGHT * 0.95 },
    { x: PREVIEW_WIDTH * 0.5, y: PREVIEW_HEIGHT * 0.95 },
  ];
}

function getRightPresetQuad() {
  return [
    { x: PREVIEW_WIDTH * 0.54, y: PREVIEW_HEIGHT * 0.05 },
    { x: PREVIEW_WIDTH * 0.63, y: PREVIEW_HEIGHT * 0.05 },
    { x: PREVIEW_WIDTH * 0.5, y: PREVIEW_HEIGHT * 0.95 },
    { x: PREVIEW_WIDTH * 0.35, y: PREVIEW_HEIGHT * 0.95 },
  ];
}

function getStraightQuad() {
  const width = PREVIEW_WIDTH * 0.18;
  const left = (PREVIEW_WIDTH - width) / 2;
  const right = left + width;
  return [
    { x: left, y: PREVIEW_HEIGHT * 0.06 },
    { x: right, y: PREVIEW_HEIGHT * 0.06 },
    { x: right, y: PREVIEW_HEIGHT * 0.94 },
    { x: left, y: PREVIEW_HEIGHT * 0.94 },
  ];
}

function applyPreset(presetName) {
  if (presetName === "left") {
    state.rotation = "ccw";
    state.quad = getLeftPresetQuad();
    updateStatus("已切到左边条预设：底部对应原文本左侧。");
    renderPreview();
    return;
  }

  if (presetName === "right") {
    state.rotation = "cw";
    state.quad = getRightPresetQuad();
    updateStatus("已切到右边条预设：顶部对应原文本左侧。");
    renderPreview();
  }
}

function updateStatus(text) {
  dom.statusText.textContent = text;
}

function updateSelectionMeta() {
  if (!state.sourceImage) {
    dom.selectionMeta.textContent = "等待选区";
    return;
  }

  dom.selectionMeta.textContent = `${state.sourceName} · ${state.sourceImage.width}×${state.sourceImage.height}`;
}

function updateResultMeta(width = null, height = null) {
  if (!width || !height) {
    dom.resultMeta.textContent = "输出未生成";
    return;
  }

  dom.resultMeta.textContent = `预计输出 ${width}×${height}`;
}

function drawEditorBackdrop() {
  ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

  ctx.fillStyle = "#09101c";
  ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

  ctx.strokeStyle = "rgba(126, 188, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 20; x < PREVIEW_WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, PREVIEW_HEIGHT);
    ctx.stroke();
  }
  for (let y = 20; y < PREVIEW_HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(PREVIEW_WIDTH, y);
    ctx.stroke();
  }
}

function buildOrientedCanvas() {
  if (!state.sourceImage) {
    return null;
  }

  const image = state.sourceImage;
  const output = document.createElement("canvas");
  const outCtx = output.getContext("2d");
  outCtx.imageSmoothingEnabled = false;

  if (state.rotation === "original") {
    output.width = image.width;
    output.height = image.height;
    outCtx.drawImage(image, 0, 0);
  } else if (state.rotation === "cw") {
    output.width = image.height;
    output.height = image.width;
    outCtx.translate(output.width, 0);
    outCtx.rotate(Math.PI / 2);
    outCtx.drawImage(image, 0, 0);
  } else {
    output.width = image.height;
    output.height = image.width;
    outCtx.translate(0, output.height);
    outCtx.rotate(-Math.PI / 2);
    outCtx.drawImage(image, 0, 0);
  }

  if (!state.mirrorX) {
    return output;
  }

  const mirrored = document.createElement("canvas");
  mirrored.width = output.width;
  mirrored.height = output.height;
  const mirroredCtx = mirrored.getContext("2d");
  mirroredCtx.imageSmoothingEnabled = false;
  mirroredCtx.translate(mirrored.width, 0);
  mirroredCtx.scale(-1, 1);
  mirroredCtx.drawImage(output, 0, 0);
  return mirrored;
}

function computeTransformMatrix(sourceTriangle, destinationTriangle) {
  const [s1, s2, s3] = sourceTriangle;
  const [d1, d2, d3] = destinationTriangle;
  const denominator =
    s1.x * (s2.y - s3.y) +
    s2.x * (s3.y - s1.y) +
    s3.x * (s1.y - s2.y);

  if (Math.abs(denominator) < 0.00001) {
    return null;
  }

  return {
    a:
      (d1.x * (s2.y - s3.y) +
        d2.x * (s3.y - s1.y) +
        d3.x * (s1.y - s2.y)) /
      denominator,
    b:
      (d1.y * (s2.y - s3.y) +
        d2.y * (s3.y - s1.y) +
        d3.y * (s1.y - s2.y)) /
      denominator,
    c:
      (d1.x * (s3.x - s2.x) +
        d2.x * (s1.x - s3.x) +
        d3.x * (s2.x - s1.x)) /
      denominator,
    d:
      (d1.y * (s3.x - s2.x) +
        d2.y * (s1.x - s3.x) +
        d3.y * (s2.x - s1.x)) /
      denominator,
    e:
      (d1.x * (s2.x * s3.y - s3.x * s2.y) +
        d2.x * (s3.x * s1.y - s1.x * s3.y) +
        d3.x * (s1.x * s2.y - s2.x * s1.y)) /
      denominator,
    f:
      (d1.y * (s2.x * s3.y - s3.x * s2.y) +
        d2.y * (s3.x * s1.y - s1.x * s3.y) +
        d3.y * (s1.x * s2.y - s2.x * s1.y)) /
      denominator,
  };
}

function drawTriangleMappedImage(context, image, sourceTriangle, destinationTriangle) {
  const matrix = computeTransformMatrix(sourceTriangle, destinationTriangle);
  if (!matrix) {
    return;
  }

  context.save();
  context.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
  context.beginPath();
  context.moveTo(sourceTriangle[0].x, sourceTriangle[0].y);
  context.lineTo(sourceTriangle[1].x, sourceTriangle[1].y);
  context.lineTo(sourceTriangle[2].x, sourceTriangle[2].y);
  context.closePath();
  context.clip();
  context.drawImage(image, 0, 0);
  context.restore();
}

function renderWarpToCanvas(targetCanvas, image, quad, slices) {
  const renderContext = targetCanvas.getContext("2d");
  renderContext.imageSmoothingEnabled = false;
  renderContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

  const safeSlices = Math.max(8, slices);

  for (let index = 0; index < safeSlices; index += 1) {
    const topRatio = index / safeSlices;
    const bottomRatio = (index + 1) / safeSlices;
    const sourceTop = image.height * topRatio;
    const sourceBottom = image.height * bottomRatio;

    const topLeft = lerpPoint(quad[0], quad[3], topRatio);
    const topRight = lerpPoint(quad[1], quad[2], topRatio);
    const bottomLeft = lerpPoint(quad[0], quad[3], bottomRatio);
    const bottomRight = lerpPoint(quad[1], quad[2], bottomRatio);

    const sourceTopLeft = { x: 0, y: sourceTop };
    const sourceTopRight = { x: image.width, y: sourceTop };
    const sourceBottomRight = { x: image.width, y: sourceBottom };
    const sourceBottomLeft = { x: 0, y: sourceBottom };

    drawTriangleMappedImage(
      renderContext,
      image,
      [sourceTopLeft, sourceTopRight, sourceBottomRight],
      [topLeft, topRight, bottomRight]
    );
    drawTriangleMappedImage(
      renderContext,
      image,
      [sourceTopLeft, sourceBottomRight, sourceBottomLeft],
      [topLeft, bottomRight, bottomLeft]
    );
  }
}

function getQuadBounds(quad) {
  const xs = quad.map((point) => point.x);
  const ys = quad.map((point) => point.y);
  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
  };
}

function getEstimatedOutputMeta(image) {
  if (!image || !state.quad) {
    return null;
  }

  const leftHeight = distance(state.quad[0], state.quad[3]);
  const rightHeight = distance(state.quad[1], state.quad[2]);
  const averageHeight = Math.max(1, (leftHeight + rightHeight) / 2);
  const scale = image.height / averageHeight;
  const scaledQuad = state.quad.map((point) => ({
    x: point.x * scale,
    y: point.y * scale,
  }));
  const bounds = getQuadBounds(scaledQuad);
  return {
    scale,
    scaledQuad,
    width: Math.ceil(bounds.right - bounds.left + OUTPUT_PADDING * 2),
    height: Math.ceil(bounds.bottom - bounds.top + OUTPUT_PADDING * 2),
    offsetX: -bounds.left + OUTPUT_PADDING,
    offsetY: -bounds.top + OUTPUT_PADDING,
  };
}

function renderPreview() {
  drawEditorBackdrop();

  const image = buildOrientedCanvas();
  if (!image) {
    updateSelectionMeta();
    updateResultMeta();
    return;
  }

  if (!state.quad) {
    state.quad = getLeftPresetQuad();
  }

  renderWarpToCanvas(
    dom.canvas,
    image,
    state.quad,
    Math.max(32, Math.min(140, Math.round(image.height / 12)))
  );

  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(241, 192, 109, 0.92)";
  ctx.fillStyle = "rgba(241, 192, 109, 0.14)";
  ctx.beginPath();
  ctx.moveTo(state.quad[0].x, state.quad[0].y);
  ctx.lineTo(state.quad[1].x, state.quad[1].y);
  ctx.lineTo(state.quad[2].x, state.quad[2].y);
  ctx.lineTo(state.quad[3].x, state.quad[3].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  state.quad.forEach((point, index) => {
    ctx.save();
    ctx.fillStyle = "#82d7ff";
    ctx.strokeStyle = "#07111c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#07111c";
    ctx.font = '700 11px Inter, "PingFang SC", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(String(index + 1), point.x, point.y + 4);
    ctx.restore();
  });

  updateSelectionMeta();
  const outputMeta = getEstimatedOutputMeta(image);
  if (outputMeta) {
    updateResultMeta(outputMeta.width, outputMeta.height);
  }
}

function handleSelectionImage(message) {
  const bytes = new Uint8Array(message.bytes || []);
  state.sourceBytes = bytes;
  state.sourceName = message.name || "Selection";
  state.sourceBounds = message.sourceBounds || null;
  state.exportScale = message.exportScale || 1;
  dom.exportScale.value = String(state.exportScale);

  const blob = new Blob([bytes], { type: "image/png" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.onload = () => {
    state.sourceImage = image;
    if (!state.quad) {
      state.quad = getLeftPresetQuad();
    }
    updateStatus("选区已读取。先点左右边条预设，再拖四个角点微调。");
    renderPreview();
    URL.revokeObjectURL(url);
  };
  image.onerror = () => {
    updateStatus("选区图片读取失败，请重新选择节点后再试。");
    URL.revokeObjectURL(url);
  };
  image.src = url;
}

function pointerToCanvasPoint(event) {
  const rect = dom.canvas.getBoundingClientRect();
  const scaleX = PREVIEW_WIDTH / rect.width;
  const scaleY = PREVIEW_HEIGHT / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function findHandleIndex(point) {
  if (!state.quad) {
    return -1;
  }

  for (let index = 0; index < state.quad.length; index += 1) {
    if (distance(point, state.quad[index]) <= HANDLE_HIT_RADIUS) {
      return index;
    }
  }
  return -1;
}

async function buildOutputBlob() {
  const image = buildOrientedCanvas();
  if (!image || !state.quad) {
    throw new Error("当前没有可输出的透视结果。");
  }

  const outputMeta = getEstimatedOutputMeta(image);
  if (!outputMeta) {
    throw new Error("透视边界无效，请先调整四角。");
  }

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputMeta.width;
  outputCanvas.height = outputMeta.height;

  const shiftedQuad = outputMeta.scaledQuad.map((point) => ({
    x: point.x + outputMeta.offsetX,
    y: point.y + outputMeta.offsetY,
  }));

  renderWarpToCanvas(
    outputCanvas,
    image,
    shiftedQuad,
    Math.max(64, Math.min(320, Math.round(image.height / 6)))
  );

  return new Promise((resolve, reject) => {
    outputCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("PNG 导出失败。"));
        return;
      }
      resolve({
        blob,
        width: outputCanvas.width,
        height: outputCanvas.height,
      });
    }, "image/png");
  });
}

async function insertIntoFigma() {
  if (!state.sourceImage) {
    updateStatus("还没有读取到选区。先回到 Figma 选中 1 个节点。");
    return;
  }

  updateStatus("正在生成透明 PNG 并插回 Figma...");
  const output = await buildOutputBlob();
  const bytes = new Uint8Array(await output.blob.arrayBuffer());

  postToPlugin({
    type: "insert-warped-image",
    bytes: Array.from(bytes),
    width: output.width,
    height: output.height,
    name: state.sourceName,
  });

  updateStatus("结果已发送到 Figma。你可以继续微调后再插一次。");
}

function requestSelectionRefresh() {
  const exportScale = Number(dom.exportScale.value) || 1;
  postToPlugin({
    type: "request-selection",
    exportScale,
  });
}

dom.reloadButton.addEventListener("click", requestSelectionRefresh);
dom.rotateLeftButton.addEventListener("click", () => {
  state.rotation = state.rotation === "ccw" ? "original" : "ccw";
  renderPreview();
});
dom.rotateRightButton.addEventListener("click", () => {
  state.rotation = state.rotation === "cw" ? "original" : "cw";
  renderPreview();
});
dom.mirrorCheckbox.addEventListener("change", () => {
  state.mirrorX = !!dom.mirrorCheckbox.checked;
  renderPreview();
});
dom.leftPresetButton.addEventListener("click", () => {
  applyPreset("left");
});
dom.rightPresetButton.addEventListener("click", () => {
  applyPreset("right");
});
dom.resetQuadButton.addEventListener("click", () => {
  state.quad = getStraightQuad();
  renderPreview();
});
dom.insertButton.addEventListener("click", () => {
  insertIntoFigma().catch((error) => {
    updateStatus(error && error.message ? error.message : String(error));
  });
});
dom.closeButton.addEventListener("click", () => {
  postToPlugin({ type: "close-plugin" });
});

dom.canvas.addEventListener("pointerdown", (event) => {
  const point = pointerToCanvasPoint(event);
  const index = findHandleIndex(point);
  if (index < 0) {
    return;
  }
  state.draggingHandle = index;
  dom.canvas.setPointerCapture(event.pointerId);
});

dom.canvas.addEventListener("pointermove", (event) => {
  if (state.draggingHandle === null || !state.quad) {
    return;
  }

  const point = pointerToCanvasPoint(event);
  state.quad[state.draggingHandle] = {
    x: clamp(point.x, 8, PREVIEW_WIDTH - 8),
    y: clamp(point.y, 8, PREVIEW_HEIGHT - 8),
  };
  renderPreview();
});

function stopDragging(event) {
  if (state.draggingHandle === null) {
    return;
  }
  if (event && dom.canvas.hasPointerCapture(event.pointerId)) {
    dom.canvas.releasePointerCapture(event.pointerId);
  }
  state.draggingHandle = null;
}

dom.canvas.addEventListener("pointerup", stopDragging);
dom.canvas.addEventListener("pointercancel", stopDragging);

window.onmessage = (event) => {
  const message = event.data.pluginMessage;
  if (!message || !message.type) {
    return;
  }

  if (message.type === "selection-image") {
    handleSelectionImage(message);
    return;
  }

  if (message.type === "selection-error") {
    updateStatus(message.message || "读取选区失败。");
  }
};

requestSelectionRefresh();
renderPreview();
