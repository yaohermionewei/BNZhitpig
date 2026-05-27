const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const ROOT = path.resolve(__dirname, "..", "..");
const PUBLIC_DIR = path.join(__dirname, "public");
const AUDIO_DIR = path.join(ROOT, "web", "public", "assets", "audio");
const CHART_SOURCE_PATH = path.join(ROOT, "shared", "charts", "ditto.editable.chart.json");
const CHART_TARGETS = [
  {
    key: "shared-esm",
    path: path.join(ROOT, "shared", "charts", "ditto.editable.chart.js"),
    format: "esm",
  },
  {
    key: "web-src",
    path: path.join(ROOT, "web", "src", "game", "ditto.editable.chart.js"),
    format: "esm",
  },
  {
    key: "web-public",
    path: path.join(ROOT, "web", "public", "assets", "charts", "ditto.editable.chart.js"),
    format: "cjs",
  },
  {
    key: "miniprogram",
    path: path.join(ROOT, "miniprogram", "assets", "charts", "ditto.editable.chart.js"),
    format: "cjs",
  },
];
const CHART_PATH = CHART_SOURCE_PATH;
const BACKUP_DIR = path.join(__dirname, "backups");
const PORT = Number(process.env.CHART_EDITOR_PORT || 4317);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendFile(request, response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";
  const cacheControl =
    extension.startsWith(".m") || extension === ".wav" ? "no-store" : "no-cache";
  const stats = fs.statSync(filePath);
  const range = request.headers.range;

  if (range && /^bytes=/.test(range)) {
    const [rawStart, rawEnd] = range.replace("bytes=", "").split("-");
    const start = Number(rawStart);
    const end = rawEnd ? Number(rawEnd) : stats.size - 1;

    if (!Number.isFinite(start) || start < 0 || start >= stats.size) {
      response.writeHead(416, {
        "Content-Range": `bytes */${stats.size}`,
      });
      response.end();
      return;
    }

    const safeEnd = Number.isFinite(end) ? Math.min(end, stats.size - 1) : stats.size - 1;
    const chunkSize = safeEnd - start + 1;

    response.writeHead(206, {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Range": `bytes ${start}-${safeEnd}/${stats.size}`,
    });
    fs.createReadStream(filePath, { start, end: safeEnd }).pipe(response);
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": cacheControl,
    "Accept-Ranges": "bytes",
    "Content-Length": stats.size,
  });
  fs.createReadStream(filePath).pipe(response);
}

function loadEditableChart() {
  return JSON.parse(fs.readFileSync(CHART_SOURCE_PATH, "utf8"));
}

function roundTime(value) {
  return Number(Number(value).toFixed(3));
}

function sanitizeNote(note, index) {
  const time = roundTime(Math.max(0, Number(note.time) || 0));
  const kind = note.kind === "hold" ? "hold" : "tap";
  const direction =
    kind === "tap" && (note.direction === "left" || note.direction === "right")
      ? note.direction
      : undefined;
  const endTime =
    kind === "hold"
      ? roundTime(Math.max(time + 0.05, Number(note.endTime) || time + 0.448))
      : undefined;
  const size = Number.isFinite(Number(note.size)) ? Number(Number(note.size).toFixed(2)) : 1;

  const nextNote = {
    time,
    size,
    accent: !!note.accent,
  };

  if (kind === "hold") {
    nextNote.kind = "hold";
    nextNote.endTime = endTime;
  }

  if (direction) {
    nextNote.direction = direction;
  }

  if (typeof note.label === "string" && note.label.trim()) {
    nextNote.label = note.label.trim();
  }

  if (note._editorOrder === undefined) {
    nextNote._editorOrder = index;
  } else {
    nextNote._editorOrder = note._editorOrder;
  }

  return nextNote;
}

function normalizeChart(rawChart) {
  const source = rawChart || {};
  const rawNotes = Array.isArray(source.notes) ? source.notes : [];
  const notes = rawNotes
    .map((note, index) => sanitizeNote(note, index))
    .sort((left, right) => {
      if (left.time !== right.time) {
        return left.time - right.time;
      }
      const leftEnd = left.endTime || left.time;
      const rightEnd = right.endTime || right.time;
      if (leftEnd !== rightEnd) {
        return leftEnd - rightEnd;
      }
      return (left._editorOrder || 0) - (right._editorOrder || 0);
    })
    .map((note) => {
      const nextNote = { ...note };
      delete nextNote._editorOrder;
      return nextNote;
    });

  const lastNoteEnd = notes.length
    ? Math.max(...notes.map((note) => (note.kind === "hold" ? note.endTime : note.time)))
    : 0;
  const duration = Math.max(
    Number(source.duration) || 0,
    roundTime(lastNoteEnd + 2.8)
  );

  const chart = {
    version: Number(source.version) || 1,
    title: typeof source.title === "string" && source.title.trim() ? source.title.trim() : "Ditto Editable Chart",
    bpmHint: Number(source.bpmHint) || 134,
    audioSrc:
      typeof source.audioSrc === "string" && source.audioSrc.trim()
        ? source.audioSrc.trim()
        : "/assets/audio/ditto.m4a",
    audioStartTime: roundTime(Math.max(0, Number(source.audioStartTime) || 0)),
    duration: roundTime(duration),
    windows: {
      perfect: Number(source.windows && source.windows.perfect) || 0.07,
      good: Number(source.windows && source.windows.good) || 0.12,
      miss: Number(source.windows && source.windows.miss) || 0.16,
    },
    notes,
    meta: {
      ...(source.meta || {}),
      noteCount: notes.length,
      authoring: "chart-editor-v1",
      updatedAt: new Date().toISOString(),
    },
  };

  chart.holdDebugMarkers = notes
    .filter((note) => note.kind === "hold")
    .map((note) => ({
      time: note.time,
      endTime: note.endTime,
      label: note.label || "",
    }));

  return chart;
}

function serializeChart(chart, format = "cjs") {
  if (format === "json") {
    return `${JSON.stringify(chart, null, 2)}\n`;
  }

  const assignment = format === "esm" ? "export default " : "module.exports = ";
  return `${assignment}${JSON.stringify(chart, null, 2)};\n`;
}

function createChartBackups() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupTargets = [
    {
      key: "source",
      path: CHART_SOURCE_PATH,
    },
    ...CHART_TARGETS,
  ];

  return backupTargets.map((target) => {
    if (!fs.existsSync(target.path)) {
      return null;
    }

    const backupName = `${target.key}.ditto.editable.chart.${timestamp}.js`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    fs.copyFileSync(target.path, backupPath);
    return path.relative(ROOT, backupPath);
  }).filter(Boolean);
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => {
      chunks.push(chunk);
    });

    request.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    request.on("error", reject);
  });
}

async function handleApi(request, response, url) {
  if (url.pathname === "/api/chart" && request.method === "GET") {
    const chart = normalizeChart(loadEditableChart());
    return sendJson(response, 200, {
      chart,
      chartPath: path.relative(ROOT, CHART_SOURCE_PATH),
      chartSourcePath: path.relative(ROOT, CHART_SOURCE_PATH),
      chartPaths: CHART_TARGETS.map((target) => path.relative(ROOT, target.path)),
      audioUrl: chart.audioSrc,
    });
  }

  if (url.pathname === "/api/chart" && request.method === "POST") {
    try {
      const rawBody = await readRequestBody(request);
      const parsed = JSON.parse(rawBody || "{}");
      const chart = normalizeChart(parsed.chart);
      const backupPaths = createChartBackups();

      fs.writeFileSync(CHART_SOURCE_PATH, serializeChart(chart, "json"));

      CHART_TARGETS.forEach((target) => {
        fs.writeFileSync(target.path, serializeChart(chart, target.format));
      });

      return sendJson(response, 200, {
        ok: true,
        chart,
        savedAt: new Date().toISOString(),
        backupPaths,
      });
    } catch (error) {
      return sendJson(response, 400, {
        ok: false,
        error: error.message,
      });
    }
  }

  return sendJson(response, 404, {
    ok: false,
    error: "API route not found",
  });
}

function resolveStaticPath(urlPath) {
  if (urlPath === "/" || urlPath === "/index.html") {
    return path.join(PUBLIC_DIR, "index.html");
  }

  if (urlPath.startsWith("/assets/audio/")) {
    const fileName = path.basename(urlPath);
    return path.join(AUDIO_DIR, fileName);
  }

  const safePath = path.normalize(urlPath.replace(/^\/+/, ""));
  const filePath = path.join(PUBLIC_DIR, safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    return null;
  }

  return filePath;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);

  if (url.pathname.startsWith("/api/")) {
    return handleApi(request, response, url);
  }

  const filePath = resolveStaticPath(url.pathname);
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Not found");
    return;
  }

  return sendFile(request, response, filePath);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Chart editor running at http://127.0.0.1:${PORT}`);
  console.log(`Editing chart source: ${path.relative(ROOT, CHART_SOURCE_PATH)}`);
  console.log(
    `Syncing charts: ${CHART_TARGETS.map((target) => path.relative(ROOT, target.path)).join(", ")}`
  );
});
