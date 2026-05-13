const DEFAULT_EXPORT_SCALE = 1;
const UI_SIZE = Object.freeze({
  width: 560,
  height: 840,
});

let lastExportScale = DEFAULT_EXPORT_SCALE;

figma.showUI(__html__, {
  width: UI_SIZE.width,
  height: UI_SIZE.height,
  themeColors: true,
});

function getSingleExportableSelection() {
  const selection = figma.currentPage.selection || [];
  if (selection.length !== 1) {
    return {
      error: "请先只选中 1 个节点。建议选一段 NJZ 文本、一个图片节点，或把多层内容先编组。",
      node: null,
    };
  }

  const node = selection[0];
  if (!node || typeof node.exportAsync !== "function") {
    return {
      error: "当前选中的节点不支持导出。请改选文本、图片、形状、编组或组件实例。",
      node: null,
    };
  }

  return {
    error: null,
    node,
  };
}

function getNodeBounds(node) {
  if (!node) {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
  }

  if (node.absoluteBoundingBox) {
    return {
      x: node.absoluteBoundingBox.x,
      y: node.absoluteBoundingBox.y,
      width: node.absoluteBoundingBox.width,
      height: node.absoluteBoundingBox.height,
    };
  }

  return {
    x: node.x || 0,
    y: node.y || 0,
    width: node.width || 0,
    height: node.height || 0,
  };
}

async function exportSelectionToUi(scale = DEFAULT_EXPORT_SCALE) {
  const { error, node } = getSingleExportableSelection();
  if (error || !node) {
    figma.ui.postMessage({
      type: "selection-error",
      message: error,
    });
    return;
  }

  const resolvedScale =
    Number.isFinite(scale) && scale > 0 ? Math.max(0.25, Math.min(scale, 4)) : DEFAULT_EXPORT_SCALE;
  lastExportScale = resolvedScale;

  const bytes = await node.exportAsync({
    format: "PNG",
    constraint: {
      type: "SCALE",
      value: resolvedScale,
    },
    contentsOnly: true,
    useAbsoluteBounds: false,
  });

  const bounds = getNodeBounds(node);

  figma.ui.postMessage({
    type: "selection-image",
    name: node.name || node.type || "Selection",
    bytes: Array.from(bytes),
    sourceBounds: bounds,
    exportScale: resolvedScale,
  });
}

function insertWarpedImage(message) {
  const bytes = new Uint8Array(message.bytes || []);
  const width = Math.max(1, Math.round(message.width || 1));
  const height = Math.max(1, Math.round(message.height || 1));
  const image = figma.createImage(bytes);
  const resultNode = figma.createRectangle();
  const { node: sourceNode } = getSingleExportableSelection();

  resultNode.name = `${message.name || "Perspective Warp"} / warped`;
  resultNode.resize(width, height);
  resultNode.fills = [
    {
      type: "IMAGE",
      imageHash: image.hash,
      scaleMode: "FILL",
    },
  ];

  if (sourceNode && sourceNode.parent && typeof sourceNode.parent.appendChild === "function") {
    sourceNode.parent.appendChild(resultNode);
    resultNode.x = (sourceNode.x || 0) + (sourceNode.width || 0) + 48;
    resultNode.y = sourceNode.y || 0;
  } else {
    resultNode.x = figma.viewport.center.x - width / 2;
    resultNode.y = figma.viewport.center.y - height / 2;
  }

  figma.currentPage.selection = [resultNode];
  figma.viewport.scrollAndZoomIntoView([resultNode]);
  figma.notify("透视结果已经插回画布");
}

figma.on("selectionchange", () => {
  exportSelectionToUi(lastExportScale).catch((error) => {
    figma.ui.postMessage({
      type: "selection-error",
      message: error && error.message ? error.message : String(error),
    });
  });
});

figma.ui.onmessage = async (message) => {
  try {
    if (!message || !message.type) {
      return;
    }

    if (message.type === "request-selection") {
      await exportSelectionToUi(message.exportScale);
      return;
    }

    if (message.type === "insert-warped-image") {
      insertWarpedImage(message);
      return;
    }

    if (message.type === "close-plugin") {
      figma.closePlugin();
    }
  } catch (error) {
    const text = error && error.message ? error.message : String(error);
    figma.notify(text, { error: true });
    figma.ui.postMessage({
      type: "selection-error",
      message: text,
    });
  }
};

exportSelectionToUi(DEFAULT_EXPORT_SCALE).catch((error) => {
  figma.ui.postMessage({
    type: "selection-error",
    message: error && error.message ? error.message : String(error),
  });
});
