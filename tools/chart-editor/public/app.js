// Keep the song a bit lower in the editor so hit cues are easier to judge by ear.
const EDITOR_MONITOR_VOLUME = 0.28;
const GAME_HIT_EFFECT_VOLUME = 3.6;
const HIT_CUE_SRC = "/assets/audio/hit-lab/freesound-517744-punch-short.wav";
const HOLD_NOTE_HEAD_SIZE = 32;
const HOLD_NOTE_HEAD_RADIUS = HOLD_NOTE_HEAD_SIZE / 2;
const EMPTY_SELECTION_TEXT = "先点一个 note，或者双击时间线加一个。";
const DRAG_THRESHOLD_PX = 6;
const DEFAULT_TIMELINE_ZOOM = 120;
const MIN_TIMELINE_ZOOM = 60;
const MAX_TIMELINE_ZOOM = 280;
const TIMELINE_START_PADDING_PX = 88;
const DEFAULT_NOTE_FALL_SPEED_MULTIPLIER = 1.1;
const MIN_NOTE_FALL_SPEED_MULTIPLIER = 0.5;
const MAX_NOTE_FALL_SPEED_MULTIPLIER = 1.3;
const DEFAULT_MUSIC_VOLUME = 1;
const MIN_MUSIC_VOLUME = 0;
const MAX_MUSIC_VOLUME = 1.2;
const LAST_SELECTED_CHART_STORAGE_KEY = "rhythm-chart-editor:last-selected-chart-id";
const TIMELINE_ZOOM_STORAGE_KEY = "rhythm-chart-editor:timeline-zoom";

const state = {
  chartCatalog: [],
  selectedChartId: null,
  chart: null,
  notes: [],
  nextNoteId: 1,
  selectedId: null,
  selectedIds: [],
  pxPerSecond: DEFAULT_TIMELINE_ZOOM,
  followPlayhead: true,
  dirty: false,
  saveStatus: "加载中...",
  drag: null,
  playheadTime: 0,
  pendingAudioTime: null,
  lastCueChartTime: 0,
  hitCueContext: null,
  hitCueBuffer: null,
  hitCueBufferPromise: null,
  history: [],
  historyIndex: -1,
  savedHistoryIndex: -1,
  historyLimit: 240,
  rafId: 0,
  suppressClick: false,
};

const dom = {
  audio: document.querySelector("#audio"),
  addHoldAtPlayhead: document.querySelector("#addHoldAtPlayhead"),
  addLeftAtPlayhead: document.querySelector("#addLeftAtPlayhead"),
  addRightAtPlayhead: document.querySelector("#addRightAtPlayhead"),
  addTapAtPlayhead: document.querySelector("#addTapAtPlayhead"),
  chartMeta: document.querySelector("#chartMeta"),
  chartTitle: document.querySelector("#chartTitle"),
  deleteButton: document.querySelector("#deleteButton"),
  difficultySelect: document.querySelector("#difficultySelect"),
  duplicateButton: document.querySelector("#duplicateButton"),
  emptyState: document.querySelector("#emptyState"),
  followToggle: document.querySelector("#followToggle"),
  bulkNoteForm: document.querySelector("#bulkNoteForm"),
  bulkNoteKind: document.querySelector("#bulkNoteKind"),
  bulkSelectedSummary: document.querySelector("#bulkSelectedSummary"),
  applyBulkNoteKind: document.querySelector("#applyBulkNoteKind"),
  noteAccent: document.querySelector("#noteAccent"),
  noteEndTime: document.querySelector("#noteEndTime"),
  noteEndWrap: document.querySelector("#noteEndWrap"),
  noteForm: document.querySelector("#noteForm"),
  noteKind: document.querySelector("#noteKind"),
  noteLabel: document.querySelector("#noteLabel"),
  noteSize: document.querySelector("#noteSize"),
  noteTime: document.querySelector("#noteTime"),
  notesLayer: document.querySelector("#notesLayer"),
  playbackTime: document.querySelector("#playbackTime"),
  playhead: document.querySelector("#playhead"),
  playToggle: document.querySelector("#playToggle"),
  rulerLayer: document.querySelector("#rulerLayer"),
  saveButton: document.querySelector("#saveButton"),
  saveStatus: document.querySelector("#saveStatus"),
  selectionBox: document.querySelector("#selectionBox"),
  seekRange: document.querySelector("#seekRange"),
  seekToSelection: document.querySelector("#seekToSelection"),
  selectedSummary: document.querySelector("#selectedSummary"),
  fallSpeedInput: document.querySelector("#fallSpeedInput"),
  fallSpeedRange: document.querySelector("#fallSpeedRange"),
  fallSpeedValue: document.querySelector("#fallSpeedValue"),
  musicVolumeInput: document.querySelector("#musicVolumeInput"),
  musicVolumeRange: document.querySelector("#musicVolumeRange"),
  musicVolumeValue: document.querySelector("#musicVolumeValue"),
  snapSelectionToPlayhead: document.querySelector("#snapSelectionToPlayhead"),
  songSelect: document.querySelector("#songSelect"),
  stopButton: document.querySelector("#stopButton"),
  timelineContent: document.querySelector("#timelineContent"),
  timelineScroll: document.querySelector("#timelineScroll"),
  trackLayer: document.querySelector("#trackLayer"),
  undoButton: document.querySelector("#undoButton"),
  redoButton: document.querySelector("#redoButton"),
  zoomRange: document.querySelector("#zoomRange"),
};

const EDITOR_NOTE_TYPES = Object.freeze({
  TAP: "tap",
  HOLD: "hold",
  LEFT: "tap-left",
  RIGHT: "tap-right",
});

function normalizeNoteDirection(direction) {
  return direction === "left" || direction === "right" ? direction : null;
}

function formatClock(timeInSeconds) {
  const totalCentiseconds = Math.max(0, Math.floor(timeInSeconds * 100));
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centiseconds = totalCentiseconds % 100;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(
    centiseconds
  ).padStart(2, "0")}`;
}

function roundTime(value) {
  return Number(Number(value).toFixed(3));
}

function normalizeNoteFallSpeedMultiplier(value, fallback = DEFAULT_NOTE_FALL_SPEED_MULTIPLIER) {
  const numericValue = Number(value);
  const numericFallback = Number(fallback);
  const safeFallback = Number.isFinite(numericFallback)
    ? numericFallback
    : DEFAULT_NOTE_FALL_SPEED_MULTIPLIER;
  const nextValue = Number.isFinite(numericValue) ? numericValue : safeFallback;

  return Number(
    Math.max(
      MIN_NOTE_FALL_SPEED_MULTIPLIER,
      Math.min(MAX_NOTE_FALL_SPEED_MULTIPLIER, nextValue)
    ).toFixed(2)
  );
}

function normalizeMusicVolume(value, fallback = DEFAULT_MUSIC_VOLUME) {
  const numericValue = Number(value);
  const numericFallback = Number(fallback);
  const safeFallback =
    Number.isFinite(numericFallback) && numericFallback >= MIN_MUSIC_VOLUME
      ? numericFallback
      : DEFAULT_MUSIC_VOLUME;
  const nextValue = Number.isFinite(numericValue) ? numericValue : safeFallback;

  return Number(Math.max(MIN_MUSIC_VOLUME, Math.min(MAX_MUSIC_VOLUME, nextValue)).toFixed(2));
}

function chartTimeToAudioTime(chartTime) {
  return Math.max(0, chartTime + (state.chart?.audioStartTime || 0));
}

function audioTimeToChartTime(audioTime) {
  return Math.max(0, audioTime - (state.chart?.audioStartTime || 0));
}

function getSelectedNoteIds() {
  const ids = Array.isArray(state.selectedIds) ? state.selectedIds : [];
  const validIds = ids.filter((id) => state.notes.some((note) => note._id === id));

  if (validIds.length) {
    return validIds;
  }

  return state.selectedId !== null && state.notes.some((note) => note._id === state.selectedId)
    ? [state.selectedId]
    : [];
}

function getPrimarySelectedId() {
  const selectedIds = getSelectedNoteIds();
  if (!selectedIds.length) {
    return null;
  }

  return selectedIds.includes(state.selectedId) ? state.selectedId : selectedIds[selectedIds.length - 1];
}

function getSelectedNote() {
  const selectedIds = getSelectedNoteIds();
  if (selectedIds.length !== 1) {
    return null;
  }

  return state.notes.find((note) => note._id === selectedIds[0]) || null;
}

function getSelectedNotes() {
  const selectedIds = new Set(getSelectedNoteIds());
  return state.notes.filter((note) => selectedIds.has(note._id));
}

function isNoteSelected(noteId) {
  return getSelectedNoteIds().includes(noteId);
}

function setSelectedNotes(noteIds, primaryId = null, options = {}) {
  const validIds = Array.from(
    new Set(noteIds.filter((id) => state.notes.some((note) => note._id === id)))
  );

  state.selectedIds = validIds;
  state.selectedId = validIds.length
    ? validIds.includes(primaryId)
      ? primaryId
      : validIds[validIds.length - 1]
    : null;

  if (!options.silent) {
    renderNotes();
  }
}

function getNoteEndTime(note) {
  return note.kind === "hold" ? note.endTime : note.time;
}

function getEditorNoteType(note) {
  if (note.kind === "hold") {
    return EDITOR_NOTE_TYPES.HOLD;
  }

  if (note.direction === "left") {
    return EDITOR_NOTE_TYPES.LEFT;
  }

  if (note.direction === "right") {
    return EDITOR_NOTE_TYPES.RIGHT;
  }

  return EDITOR_NOTE_TYPES.TAP;
}

function getNoteTypeLabel(note) {
  const noteType = getEditorNoteType(note);

  if (noteType === EDITOR_NOTE_TYPES.HOLD) {
    return "长按";
  }

  if (noteType === EDITOR_NOTE_TYPES.LEFT) {
    return "左方向猪";
  }

  if (noteType === EDITOR_NOTE_TYPES.RIGHT) {
    return "右方向猪";
  }

  return "点按";
}

function getNoteSelectionKey(note) {
  return `${getEditorNoteType(note)}:${note.time.toFixed(3)}:${getNoteEndTime(note).toFixed(3)}`;
}

function getSelectedChartEntry() {
  return state.chartCatalog.find((entry) => entry.id === state.selectedChartId) || null;
}

function loadStoredChartId() {
  try {
    return window.localStorage.getItem(LAST_SELECTED_CHART_STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function persistSelectedChartId(chartId) {
  if (!chartId) {
    return;
  }

  try {
    window.localStorage.setItem(LAST_SELECTED_CHART_STORAGE_KEY, chartId);
  } catch (error) {
    // Ignore storage failures so the editor still works in restricted contexts.
  }
}

function sanitizeTimelineZoom(value) {
  const numericValue = Number(value);
  if (
    !Number.isFinite(numericValue) ||
    numericValue < MIN_TIMELINE_ZOOM ||
    numericValue > MAX_TIMELINE_ZOOM
  ) {
    return DEFAULT_TIMELINE_ZOOM;
  }

  return numericValue;
}

function loadStoredTimelineZoom() {
  try {
    const rawValue = window.localStorage.getItem(TIMELINE_ZOOM_STORAGE_KEY);
    if (rawValue === null) {
      return DEFAULT_TIMELINE_ZOOM;
    }

    const zoomValue = sanitizeTimelineZoom(rawValue);
    if (String(zoomValue) !== rawValue) {
      window.localStorage.setItem(TIMELINE_ZOOM_STORAGE_KEY, String(zoomValue));
    }
    return zoomValue;
  } catch (error) {
    return DEFAULT_TIMELINE_ZOOM;
  }
}

function persistTimelineZoom(zoomValue) {
  const safeZoomValue = sanitizeTimelineZoom(zoomValue);

  try {
    window.localStorage.setItem(TIMELINE_ZOOM_STORAGE_KEY, String(safeZoomValue));
  } catch (error) {
    // Ignore storage failures so the editor still works in restricted contexts.
  }

  return safeZoomValue;
}

function getSongEntries() {
  const seen = new Set();
  return state.chartCatalog.filter((entry) => {
    if (seen.has(entry.songId)) {
      return false;
    }
    seen.add(entry.songId);
    return true;
  });
}

function getDifficultyEntries(songId) {
  return state.chartCatalog.filter((entry) => entry.songId === songId);
}

function findChartEntry(chartId) {
  return state.chartCatalog.find((entry) => entry.id === chartId) || null;
}

function renderChartPicker() {
  const selectedEntry = getSelectedChartEntry();
  const songEntries = getSongEntries();
  const selectedSongId = selectedEntry?.songId || songEntries[0]?.songId || "";
  const difficultyEntries = getDifficultyEntries(selectedSongId);

  dom.songSelect.innerHTML = songEntries
    .map(
      (entry) =>
        `<option value="${entry.songId}" ${
          entry.songId === selectedSongId ? "selected" : ""
        }>${entry.songTitle}</option>`
    )
    .join("");
  dom.songSelect.disabled = songEntries.length <= 1;

  dom.difficultySelect.innerHTML = difficultyEntries
    .map(
      (entry) =>
        `<option value="${entry.id}" ${
          entry.id === state.selectedChartId ? "selected" : ""
        }>${entry.difficultyLabel}</option>`
    )
    .join("");
  dom.difficultySelect.disabled = difficultyEntries.length <= 1;

  if (dom.chartTitle) {
    dom.chartTitle.textContent = selectedEntry?.editorTitle || "谱面编辑器";
  }
}

async function switchChart(chartId) {
  const nextEntry = findChartEntry(chartId);
  if (!nextEntry || nextEntry.id === state.selectedChartId) {
    renderChartPicker();
    return;
  }

  if (state.dirty && !window.confirm("当前谱面还没保存，确定切换吗？")) {
    renderChartPicker();
    return;
  }

  dom.audio.pause();
  state.selectedChartId = nextEntry.id;
  persistSelectedChartId(nextEntry.id);
  renderChartPicker();
  await loadChart(nextEntry.id);
}

function applyNoteTypeValue(note, noteType) {
  if (noteType === EDITOR_NOTE_TYPES.HOLD) {
    note.kind = "hold";
    note.direction = null;
    return;
  }

  note.kind = "tap";
  note.direction =
    noteType === EDITOR_NOTE_TYPES.LEFT
      ? "left"
      : noteType === EDITOR_NOTE_TYPES.RIGHT
        ? "right"
        : null;
}

function getTimelineDuration() {
  if (!state.chart) {
    return 0;
  }

  const maxNoteEnd = state.notes.length
    ? Math.max(...state.notes.map((note) => getNoteEndTime(note)))
    : 0;

  return Math.max(state.chart.duration || 0, roundTime(maxNoteEnd + 2.8));
}

function getChartTime() {
  if (!dom.audio.paused) {
    return audioTimeToChartTime(dom.audio.currentTime || 0);
  }

  return state.playheadTime || 0;
}

function getOrCreateHitCueContext() {
  if (state.hitCueContext && state.hitCueContext.state !== "closed") {
    return state.hitCueContext;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  state.hitCueContext = new AudioContextClass();
  state.hitCueBuffer = null;
  state.hitCueBufferPromise = null;
  return state.hitCueContext;
}

function resetCueTracking(chartTime = state.playheadTime || 0) {
  state.lastCueChartTime = chartTime;
}

async function ensureHitCueBuffer() {
  if (state.hitCueBuffer) {
    return state.hitCueBuffer;
  }

  const context = getOrCreateHitCueContext();
  if (!context) {
    return null;
  }

  if (!state.hitCueBufferPromise) {
    state.hitCueBufferPromise = fetch(HIT_CUE_SRC)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load hit cue: ${HIT_CUE_SRC}`);
        }
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
      .then((buffer) => {
        state.hitCueBuffer = buffer;
        return buffer;
      })
      .catch((error) => {
        state.hitCueBufferPromise = null;
        throw error;
      });
  }

  return state.hitCueBufferPromise;
}

async function resumeHitCueContext() {
  const context = getOrCreateHitCueContext();
  if (!context) {
    return null;
  }

  if (context.state === "suspended") {
    await context.resume();
  }

  return context;
}

async function prepareHitCuePreview() {
  try {
    await resumeHitCueContext();
    await ensureHitCueBuffer();
  } catch (error) {
    console.error("Hit cue prepare error", error);
  }
}

function playHitCue() {
  const context = state.hitCueContext;
  const buffer = state.hitCueBuffer;

  if (!context || context.state !== "running" || !buffer) {
    prepareHitCuePreview();
    return;
  }

  try {
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = GAME_HIT_EFFECT_VOLUME * EDITOR_MONITOR_VOLUME;
    source.connect(gain);
    gain.connect(context.destination);
    source.start(0);
    source.onended = () => {
      try {
        source.disconnect();
        gain.disconnect();
      } catch (error) {
        // Preview cues are disposable.
      }
    };
  } catch (error) {
    console.error("Hit cue preview error", error);
  }
}

function playCrossedNoteCues(previousTime, currentTime) {
  if (dom.audio.paused || currentTime <= previousTime) {
    return;
  }

  const epsilon = 0.001;
  state.notes.forEach((note) => {
    if (note.time > previousTime + epsilon && note.time <= currentTime + epsilon) {
      playHitCue();
    }
  });
}

function setSaveStatus(message, isMuted = false) {
  state.saveStatus = message;
  dom.saveStatus.textContent = message;
  dom.saveStatus.classList.toggle("chip-muted", isMuted);
}

function markDirty() {
  refreshDirtyState();
}

function clearDirty(message = "已保存") {
  state.savedHistoryIndex = state.historyIndex;
  refreshDirtyState(message);
}

function getTimeFromClientX(clientX) {
  const rect = dom.trackLayer.getBoundingClientRect();
  const x = clientX - rect.left - TIMELINE_START_PADDING_PX;
  const time = x / state.pxPerSecond;
  return roundTime(Math.max(0, Math.min(getTimelineDuration(), time)));
}

function getTrackPointerPosition(clientX, clientY) {
  const rect = dom.trackLayer.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function hideSelectionBox() {
  dom.selectionBox.classList.add("hidden");
}

function updateSelectionBox(startClientX, startClientY, currentClientX, currentClientY) {
  const start = getTrackPointerPosition(startClientX, startClientY);
  const current = getTrackPointerPosition(currentClientX, currentClientY);
  const left = Math.max(0, Math.min(start.x, current.x));
  const top = Math.max(0, Math.min(start.y, current.y));
  const right = Math.min(start.width, Math.max(start.x, current.x));
  const bottom = Math.min(start.height, Math.max(start.y, current.y));

  dom.selectionBox.style.left = `${left}px`;
  dom.selectionBox.style.top = `${top}px`;
  dom.selectionBox.style.width = `${Math.max(0, right - left)}px`;
  dom.selectionBox.style.height = `${Math.max(0, bottom - top)}px`;
  dom.selectionBox.classList.remove("hidden");

  return {
    left,
    top,
    right,
    bottom,
  };
}

function rectsIntersect(a, b) {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}

function getSelectionHitRect(noteElement) {
  const target = noteElement.querySelector(".note-hold, .note-tap") || noteElement;
  const noteRect = target.getBoundingClientRect();
  const trackRect = dom.trackLayer.getBoundingClientRect();

  return {
    left: noteRect.left - trackRect.left,
    top: noteRect.top - trackRect.top,
    right: noteRect.right - trackRect.left,
    bottom: noteRect.bottom - trackRect.top,
  };
}

function chartTimeToTimelineX(chartTime) {
  return TIMELINE_START_PADDING_PX + chartTime * state.pxPerSecond;
}

function getNotesInsideSelection(selectionRect) {
  return Array.from(dom.notesLayer.querySelectorAll(".note"))
    .filter((element) => rectsIntersect(getSelectionHitRect(element), selectionRect))
    .map((element) => Number(element.dataset.noteId));
}

function sortNotes() {
  state.notes.sort((left, right) => {
    if (left.time !== right.time) {
      return left.time - right.time;
    }
    const leftEnd = getNoteEndTime(left);
    const rightEnd = getNoteEndTime(right);
    if (leftEnd !== rightEnd) {
      return leftEnd - rightEnd;
    }
    return left._id - right._id;
  });
}

function createLocalNote(rawNote) {
  const kind = rawNote.kind === "hold" ? "hold" : "tap";
  return {
    _id: state.nextNoteId++,
    time: roundTime(rawNote.time || 0),
    kind,
    direction: kind === "tap" ? normalizeNoteDirection(rawNote.direction) : null,
    endTime:
      kind === "hold"
        ? roundTime(Math.max((rawNote.time || 0) + 0.05, rawNote.endTime || 0))
        : undefined,
    size: Number.isFinite(Number(rawNote.size)) ? Number(Number(rawNote.size).toFixed(2)) : 1,
    accent: !!rawNote.accent,
    label: typeof rawNote.label === "string" ? rawNote.label : "",
  };
}

function cloneLocalNote(note) {
  const kind = note.kind === "hold" ? "hold" : "tap";
  return {
    _id: note._id,
    time: roundTime(note.time),
    kind,
    direction: kind === "tap" ? normalizeNoteDirection(note.direction) : null,
    endTime: kind === "hold" ? roundTime(note.endTime) : undefined,
    size: Number.isFinite(Number(note.size)) ? Number(Number(note.size).toFixed(2)) : 1,
    accent: !!note.accent,
    label: typeof note.label === "string" ? note.label : "",
  };
}

function getCurrentNoteFallSpeedMultiplier() {
  return normalizeNoteFallSpeedMultiplier(state.chart?.noteFallSpeedMultiplier);
}

function getCurrentMusicVolume() {
  return normalizeMusicVolume(state.chart?.musicVolume);
}

function applyEditorAudioVolume() {
  dom.audio.volume = EDITOR_MONITOR_VOLUME * getCurrentMusicVolume();
}

function setChartFallSpeedMultiplier(value, options = {}) {
  if (!state.chart) {
    return;
  }

  const nextValue = normalizeNoteFallSpeedMultiplier(value, getCurrentNoteFallSpeedMultiplier());
  state.chart.noteFallSpeedMultiplier = nextValue;
  renderFallSpeedControl();

  if (!options.silent) {
    pushHistory();
  }
}

function setChartMusicVolume(value, options = {}) {
  if (!state.chart) {
    return;
  }

  const nextValue = normalizeMusicVolume(value, getCurrentMusicVolume());
  state.chart.musicVolume = nextValue;
  applyEditorAudioVolume();
  renderMusicVolumeControl();

  if (!options.silent) {
    pushHistory();
  }
}

function createHistorySnapshot() {
  return {
    noteFallSpeedMultiplier: getCurrentNoteFallSpeedMultiplier(),
    musicVolume: getCurrentMusicVolume(),
    notes: state.notes.map((note) => cloneLocalNote(note)),
    selectedId: state.selectedId,
    selectedIds: getSelectedNoteIds(),
    nextNoteId: state.nextNoteId,
  };
}

function snapshotToKey(snapshot) {
  return JSON.stringify(snapshot);
}

function updateHistoryButtons() {
  if (dom.undoButton) {
    dom.undoButton.disabled = state.historyIndex <= 0;
  }

  if (dom.redoButton) {
    dom.redoButton.disabled = state.historyIndex >= state.history.length - 1;
  }
}

function refreshDirtyState(cleanMessage = "已保存") {
  state.dirty = state.historyIndex !== state.savedHistoryIndex;
  if (state.dirty) {
    setSaveStatus("有未保存修改", true);
  } else {
    setSaveStatus(cleanMessage, true);
  }
  renderMeta();
  updateHistoryButtons();
}

function resetHistory() {
  const snapshot = createHistorySnapshot();
  state.history = [
    {
      key: snapshotToKey(snapshot),
      snapshot,
    },
  ];
  state.historyIndex = 0;
  state.savedHistoryIndex = 0;
  updateHistoryButtons();
}

function pushHistory() {
  const snapshot = createHistorySnapshot();
  const key = snapshotToKey(snapshot);
  const current = state.history[state.historyIndex];

  if (current && current.key === key) {
    refreshDirtyState();
    return;
  }

  if (state.historyIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyIndex + 1);
  }

  state.history.push({
    key,
    snapshot,
  });
  state.historyIndex = state.history.length - 1;

  if (state.history.length > state.historyLimit) {
    const overflow = state.history.length - state.historyLimit;
    state.history.splice(0, overflow);
    state.historyIndex = Math.max(0, state.historyIndex - overflow);
    state.savedHistoryIndex = Math.max(-1, state.savedHistoryIndex - overflow);
  }

  refreshDirtyState();
}

function applyHistorySnapshot(snapshot) {
  if (state.chart && snapshot.noteFallSpeedMultiplier !== undefined) {
    state.chart.noteFallSpeedMultiplier = normalizeNoteFallSpeedMultiplier(
      snapshot.noteFallSpeedMultiplier
    );
  }
  if (state.chart && snapshot.musicVolume !== undefined) {
    state.chart.musicVolume = normalizeMusicVolume(snapshot.musicVolume);
    applyEditorAudioVolume();
  }
  state.notes = snapshot.notes.map((note) => cloneLocalNote(note));
  state.selectedId = snapshot.selectedId;
  state.selectedIds = Array.isArray(snapshot.selectedIds) ? [...snapshot.selectedIds] : [];
  state.nextNoteId = snapshot.nextNoteId;
  sortNotes();
  renderAll();
}

function undoHistory() {
  if (state.historyIndex <= 0) {
    return;
  }

  state.historyIndex -= 1;
  applyHistorySnapshot(state.history[state.historyIndex].snapshot);
  refreshDirtyState("已回到保存状态");
}

function redoHistory() {
  if (state.historyIndex >= state.history.length - 1) {
    return;
  }

  state.historyIndex += 1;
  applyHistorySnapshot(state.history[state.historyIndex].snapshot);
  refreshDirtyState();
}

function serializeNotes() {
  return state.notes.map((note) => {
    const nextNote = {
      time: roundTime(note.time),
      size: Number(note.size),
      accent: !!note.accent,
    };

    if (note.kind === "hold") {
      nextNote.kind = "hold";
      nextNote.endTime = roundTime(note.endTime);
    }

    if (note.kind !== "hold" && note.direction) {
      nextNote.direction = note.direction;
    }

    if (note.label && note.label.trim()) {
      nextNote.label = note.label.trim();
    }

    return nextNote;
  });
}

function loadNoteForm(note) {
  dom.emptyState.classList.add("hidden");
  dom.noteForm.classList.remove("hidden");
  dom.noteKind.value = getEditorNoteType(note);
  dom.noteTime.value = note.time.toFixed(3);
  dom.noteEndTime.value = note.kind === "hold" ? note.endTime.toFixed(3) : "";
  dom.noteEndWrap.classList.toggle("hidden", note.kind !== "hold");
  dom.noteSize.value = Number(note.size).toFixed(2);
  dom.noteAccent.checked = !!note.accent;
  dom.noteLabel.value = note.label || "";
  dom.selectedSummary.textContent =
    note.kind === "hold"
      ? `${formatClock(note.time)} -> ${formatClock(note.endTime)}`
      : `${formatClock(note.time)} ${getNoteTypeLabel(note)}`;
}

function renderInspector() {
  const selectedNotes = getSelectedNotes();

  if (!selectedNotes.length) {
    dom.emptyState.textContent = EMPTY_SELECTION_TEXT;
    dom.emptyState.classList.remove("hidden");
    dom.bulkNoteForm.classList.add("hidden");
    dom.noteForm.classList.add("hidden");
    return;
  }

  if (selectedNotes.length > 1) {
    const firstTime = Math.min(...selectedNotes.map((note) => note.time));
    const lastTime = Math.max(...selectedNotes.map((note) => getNoteEndTime(note)));
    dom.bulkSelectedSummary.textContent = `已选 ${selectedNotes.length} 个 note · ${formatClock(
      firstTime
    )} -> ${formatClock(lastTime)}。可以直接拖动任意一个已选 note 一起移动；Delete 可整组删除。`;
    dom.bulkNoteKind.value = getEditorNoteType(selectedNotes[0]);
    dom.emptyState.classList.add("hidden");
    dom.bulkNoteForm.classList.remove("hidden");
    dom.noteForm.classList.add("hidden");
    return;
  }

  dom.bulkNoteForm.classList.add("hidden");
  loadNoteForm(selectedNotes[0]);
}

function renderMeta() {
  if (!state.chart) {
    dom.chartMeta.textContent = "读取中...";
    return;
  }

  const holdCount = state.notes.filter((note) => note.kind === "hold").length;
  const fallSpeed = getCurrentNoteFallSpeedMultiplier();
  const musicVolume = getCurrentMusicVolume();
  const dirtyTag = state.dirty ? " · 未保存" : "";
  dom.chartMeta.textContent = `${state.chart.title} · ${state.notes.length} notes · ${holdCount} holds · 偏移 ${(
    state.chart.audioStartTime || 0
  ).toFixed(3)}s · 下落 ${fallSpeed.toFixed(2)}x · 歌曲 ${musicVolume.toFixed(2)}x${dirtyTag}`;
}

function renderFallSpeedControl() {
  if (!dom.fallSpeedRange || !dom.fallSpeedInput || !dom.fallSpeedValue) {
    return;
  }

  const fallSpeed = getCurrentNoteFallSpeedMultiplier();
  dom.fallSpeedRange.value = fallSpeed.toFixed(2);
  dom.fallSpeedInput.value = fallSpeed.toFixed(2);
  dom.fallSpeedValue.textContent = `${fallSpeed.toFixed(2)}x`;
}

function renderMusicVolumeControl() {
  if (!dom.musicVolumeRange || !dom.musicVolumeInput || !dom.musicVolumeValue) {
    return;
  }

  const musicVolume = getCurrentMusicVolume();
  dom.musicVolumeRange.value = musicVolume.toFixed(2);
  dom.musicVolumeInput.value = musicVolume.toFixed(2);
  dom.musicVolumeValue.textContent = `${musicVolume.toFixed(2)}x`;
}

function renderPlaybackTime() {
  const chartTime = getChartTime();
  dom.playbackTime.textContent = formatClock(chartTime);
  dom.seekRange.max = String(Math.max(getTimelineDuration(), 0.001));
  dom.seekRange.value = String(Math.min(chartTime, getTimelineDuration()));
}

function renderRuler() {
  const duration = getTimelineDuration();
  const width = Math.max(1200, chartTimeToTimelineX(duration) + 80);
  dom.timelineContent.style.width = `${width}px`;

  const seconds = Math.ceil(duration);
  let html = "";

  for (let second = 0; second <= seconds; second += 1) {
    const left = chartTimeToTimelineX(second);
    const isMajor = second % 5 === 0;
    html += `<div class="ruler-tick ${isMajor ? "ruler-tick-major" : "ruler-tick-minor"}" style="left:${left}px"></div>`;
    if (isMajor || second === 0) {
      html += `<div class="ruler-label" style="left:${left}px">${formatClock(second)}</div>`;
    }
  }

  dom.rulerLayer.innerHTML = html;
}

function createNoteElement(note, noteOrder) {
  const x = chartTimeToTimelineX(note.time);
  const wrapper = document.createElement("div");
  wrapper.className = `note ${isNoteSelected(note._id) ? "note-selected" : ""}`;
  wrapper.dataset.noteId = String(note._id);

  if (note.kind === "hold") {
    const holdDurationPx = Math.max(0, (note.endTime - note.time) * state.pxPerSecond);
    wrapper.style.left = `${x}px`;
    wrapper.style.transform = `translate(-${HOLD_NOTE_HEAD_RADIUS}px, -50%)`;

    const body = document.createElement("div");
    body.className = "note-hold";
    body.style.width = `${HOLD_NOTE_HEAD_SIZE + holdDurationPx}px`;

    const headAnchor = document.createElement("div");
    headAnchor.className = "note-hold-anchor note-hold-anchor-head";
    body.appendChild(headAnchor);

    const tailAnchor = document.createElement("div");
    tailAnchor.className = "note-hold-anchor note-hold-anchor-tail";
    body.appendChild(tailAnchor);

    wrapper.appendChild(body);

    const handle = document.createElement("div");
    handle.className = "note-hold-handle";
    handle.dataset.dragMode = "resize";
    wrapper.appendChild(handle);
  } else {
    wrapper.style.left = `${x}px`;
    wrapper.style.transform = "translate(-50%, -50%)";

    const body = document.createElement("div");
    body.className = `note-tap ${note.accent ? "note-accent" : ""}`;
    if (note.direction) {
      body.classList.add("note-direction", `note-direction-${note.direction}`);
      const marker = document.createElement("span");
      marker.className = "note-direction-marker";
      marker.textContent = note.direction === "left" ? "←" : "→";
      body.appendChild(marker);
    }
    wrapper.appendChild(body);
  }

  if (note.label) {
    const caption = document.createElement("div");
    caption.className = "note-caption";
    caption.textContent = note.label;
    wrapper.appendChild(caption);
  }

  const index = document.createElement("div");
  index.className = `note-index ${note.kind === "hold" ? "note-index-head" : ""}`;
  index.textContent = String(noteOrder);
  wrapper.appendChild(index);

  return wrapper;
}

function renderNotes() {
  sortNotes();
  dom.notesLayer.innerHTML = "";

  state.notes.forEach((note, index) => {
    dom.notesLayer.appendChild(createNoteElement(note, index + 1));
  });

  renderInspector();
  renderMeta();
}

function renderPlayhead() {
  const left = chartTimeToTimelineX(getChartTime());
  dom.playhead.style.left = `${left}px`;

  if (state.followPlayhead && !state.drag && !dom.audio.paused) {
    const viewWidth = dom.timelineScroll.clientWidth;
    const target = Math.max(0, left - viewWidth * 0.38);
    dom.timelineScroll.scrollLeft += (target - dom.timelineScroll.scrollLeft) * 0.15;
  }
}

function renderAll() {
  renderRuler();
  renderNotes();
  renderFallSpeedControl();
  renderMusicVolumeControl();
  renderPlaybackTime();
  renderPlayhead();
}

function setSelectedNote(noteId) {
  setSelectedNotes(noteId === null ? [] : [noteId], noteId);
}

function seekToChartTime(chartTime) {
  const bounded = Math.max(0, Math.min(getTimelineDuration(), chartTime));
  const audioTime = chartTimeToAudioTime(bounded);
  state.playheadTime = bounded;
  resetCueTracking(bounded);

  try {
    if (dom.audio.readyState >= 1) {
      dom.audio.currentTime = audioTime;
      state.pendingAudioTime = null;
    } else {
      state.pendingAudioTime = audioTime;
    }
  } catch (error) {
    state.pendingAudioTime = audioTime;
  }

  renderPlaybackTime();
  renderPlayhead();
}

function scrollTimelineToStart() {
  dom.timelineScroll.scrollLeft = 0;
}

function addNoteAtTime(chartTime, noteType = EDITOR_NOTE_TYPES.TAP) {
  const kind = noteType === EDITOR_NOTE_TYPES.HOLD ? "hold" : "tap";
  const note = createLocalNote({
    time: chartTime,
    kind,
    endTime: kind === "hold" ? chartTime + 0.448 : undefined,
    direction:
      noteType === EDITOR_NOTE_TYPES.LEFT
        ? "left"
        : noteType === EDITOR_NOTE_TYPES.RIGHT
          ? "right"
          : null,
    accent: false,
    size: kind === "hold" ? 1.08 : 0.94,
  });
  state.notes.push(note);
  sortNotes();
  setSelectedNote(note._id);
  pushHistory();
}

function removeSelectedNote() {
  const selectedIds = new Set(getSelectedNoteIds());
  if (!selectedIds.size) {
    return;
  }

  state.notes = state.notes.filter((note) => !selectedIds.has(note._id));
  state.selectedId = null;
  state.selectedIds = [];
  renderNotes();
  pushHistory();
}

function duplicateSelectedNote() {
  const selectedNotes = getSelectedNotes();
  if (!selectedNotes.length) {
    return;
  }

  const offset = 0.224;
  const duplicates = selectedNotes.map((note) =>
    createLocalNote({
      ...note,
      time: roundTime(note.time + offset),
      endTime: note.kind === "hold" ? roundTime(note.endTime + offset) : undefined,
    })
  );

  state.notes.push(...duplicates);
  sortNotes();
  setSelectedNotes(
    duplicates.map((note) => note._id),
    duplicates[duplicates.length - 1]?._id || null
  );
  pushHistory();
}

function updateSelectedNote(mutator) {
  const note = getSelectedNote();
  if (!note) {
    return;
  }

  mutator(note);
  sortNotes();
  renderNotes();
  pushHistory();
}

function beginEmptyAreaInteraction(clientX, clientY) {
  if (getSelectedNoteIds().length) {
    setSelectedNotes([]);
  }
  startMarquee(clientX, clientY);
}

function syncSelectionToPlayhead() {
  const selectedNotes = getSelectedNotes();
  if (!selectedNotes.length) {
    return;
  }

  const playheadTime = getChartTime();
  const earliestTime = Math.min(...selectedNotes.map((note) => note.time));
  const delta = roundTime(playheadTime - earliestTime);

  selectedNotes.forEach((note) => {
    note.time = roundTime(Math.max(0, note.time + delta));
    if (note.kind === "hold") {
      note.endTime = roundTime(Math.max(note.time + 0.05, note.endTime + delta));
    }
  });

  sortNotes();
  renderNotes();
  pushHistory();
}

function startMarquee(clientX, clientY) {
  state.drag = {
    mode: "marquee",
    startClientX: clientX,
    startClientY: clientY,
    changed: false,
  };
  hideSelectionBox();
}

function startDrag(noteId, mode, clientX, clientY) {
  const note = state.notes.find((item) => item._id === noteId);
  if (!note) {
    return;
  }

  const selectedIds =
    mode === "move" && isNoteSelected(noteId) ? getSelectedNoteIds() : [noteId];

  if (mode === "resize" || !isNoteSelected(noteId)) {
    setSelectedNotes([noteId], noteId);
  } else if (selectedIds.length) {
    setSelectedNotes(selectedIds, noteId);
  }

  const dragNotes = state.notes
    .filter((item) => selectedIds.includes(item._id))
    .map((item) => ({
      noteId: item._id,
      startTime: item.time,
      startEndTime: item.endTime,
      duration: item.kind === "hold" ? item.endTime - item.time : 0,
    }));

  const minStartTime = dragNotes.length
    ? Math.min(...dragNotes.map((item) => item.startTime))
    : note.time;

  state.drag = {
    mode,
    noteId,
    startClientX: clientX,
    startClientY: clientY,
    startTime: note.time,
    startEndTime: note.endTime,
    changed: false,
    noteIds: dragNotes.map((item) => item.noteId),
    notes: dragNotes,
    minStartTime,
  };
}

function handleMarqueeMove(clientX, clientY) {
  if (!state.drag || state.drag.mode !== "marquee") {
    return;
  }

  const movedEnough =
    Math.abs(clientX - state.drag.startClientX) >= DRAG_THRESHOLD_PX ||
    Math.abs(clientY - state.drag.startClientY) >= DRAG_THRESHOLD_PX;

  if (!movedEnough) {
    return;
  }

  state.drag.changed = true;
  const selectionRect = updateSelectionBox(
    state.drag.startClientX,
    state.drag.startClientY,
    clientX,
    clientY
  );
  const noteIds = getNotesInsideSelection(selectionRect);
  setSelectedNotes(noteIds, noteIds[noteIds.length - 1] || null);
}

function handleDragMove(clientX, clientY) {
  if (!state.drag) {
    return;
  }

  if (state.drag.mode === "marquee") {
    handleMarqueeMove(clientX, clientY);
    return;
  }

  const deltaTime = roundTime((clientX - state.drag.startClientX) / state.pxPerSecond);

  if (state.drag.mode === "move") {
    const boundedDelta = roundTime(Math.max(-state.drag.minStartTime, deltaTime));
    state.drag.notes.forEach((anchor) => {
      const note = state.notes.find((item) => item._id === anchor.noteId);
      if (!note) {
        return;
      }

      note.time = roundTime(Math.max(0, anchor.startTime + boundedDelta));
      if (note.kind === "hold") {
        note.endTime = roundTime(Math.max(note.time + 0.05, anchor.startEndTime + boundedDelta));
      }
    });
    state.drag.changed = boundedDelta !== 0;
  } else if (state.drag.mode === "resize") {
    const note = state.notes.find((item) => item._id === state.drag.noteId);
    if (!note || note.kind !== "hold") {
      return;
    }

    note.endTime = roundTime(
      Math.max(note.time + 0.05, (state.drag.startEndTime || note.endTime) + deltaTime)
    );
    state.drag.changed = note.endTime !== state.drag.startEndTime;
  }

  sortNotes();
  renderNotes();
}

function stopDrag() {
  if (!state.drag) {
    return;
  }

  if (state.drag.mode === "marquee") {
    if (!state.drag.changed) {
      setSelectedNotes([]);
    } else {
      state.suppressClick = true;
    }
    hideSelectionBox();
  } else if (state.drag.changed) {
    pushHistory();
    state.suppressClick = true;
  } else {
    if (state.drag.noteId !== undefined && state.drag.noteId !== null) {
      setSelectedNotes([state.drag.noteId], state.drag.noteId);
    }
    refreshDirtyState();
  }

  state.drag = null;
}

function updatePlayToggle() {
  const isPaused = dom.audio.paused;
  dom.playToggle.dataset.state = isPaused ? "play" : "pause";
  dom.playToggle.setAttribute("aria-label", isPaused ? "播放" : "暂停");
  dom.playToggle.title = isPaused ? "播放" : "暂停";
}

async function playFromCurrentPlayhead() {
  const startChartTime = roundTime(Math.max(0, state.playheadTime || 0));
  seekToChartTime(startChartTime);
  resetCueTracking(startChartTime);
  await prepareHitCuePreview();

  try {
    const result = dom.audio.play();
    if (result && typeof result.catch === "function") {
      await result;
    }
  } catch (error) {
    console.error("Audio play error", error);
  }
}

function syncPendingAudioTime() {
  if (state.pendingAudioTime === null) {
    return;
  }

  try {
    dom.audio.currentTime = state.pendingAudioTime;
    state.pendingAudioTime = null;
  } catch (error) {
    console.error("Audio seek sync error", error);
  }
}

function buildPayloadChart() {
  return {
    ...state.chart,
    notes: serializeNotes(),
  };
}

async function saveChart() {
  try {
    setSaveStatus("保存中...", true);
    const chartId = state.selectedChartId || "";
    const response = await fetch(`/api/chart?chartId=${encodeURIComponent(chartId)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chart: buildPayloadChart(),
      }),
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "保存失败");
    }

    hydrateChart(payload.chart);
    clearDirty(`已保存 ${new Date(payload.savedAt).toLocaleTimeString("zh-CN", { hour12: false })}`);
  } catch (error) {
    console.error(error);
    setSaveStatus(`保存失败: ${error.message}`, false);
  }
}

function hydrateChart(chart) {
  const previousSelectionKeys = getSelectedNotes().map((note) => getNoteSelectionKey(note));
  const previousPrimaryId = getPrimarySelectedId();
  const previousPrimary = previousPrimaryId
    ? state.notes.find((note) => note._id === previousPrimaryId) || null
    : null;
  const previousPrimaryKey = previousPrimary ? getNoteSelectionKey(previousPrimary) : "";
  const currentAudioSrc = dom.audio.getAttribute("src") || "";

  state.chart = chart;
  state.nextNoteId = 1;
  state.playheadTime = 0;
  state.pendingAudioTime = chartTimeToAudioTime(0);
  resetCueTracking(0);
  state.notes = chart.notes.map((note) => createLocalNote(note));
  state.selectedId = null;
  state.selectedIds = [];
  sortNotes();

  if (previousSelectionKeys.length) {
    const nextSelectedIds = state.notes
      .filter((note) => {
        const key = getNoteSelectionKey(note);
        return previousSelectionKeys.includes(key);
      })
      .map((note) => note._id);
    const primaryMatch = state.notes.find((note) => {
      const key = getNoteSelectionKey(note);
      return key === previousPrimaryKey;
    });
    state.selectedIds = nextSelectedIds;
    state.selectedId = primaryMatch?._id || nextSelectedIds[nextSelectedIds.length - 1] || null;
  }

  if (currentAudioSrc !== chart.audioSrc) {
    dom.audio.src = chart.audioSrc;
    applyEditorAudioVolume();
    dom.audio.load();
  } else {
    applyEditorAudioVolume();
    syncPendingAudioTime();
  }

  renderAll();
  resetHistory();
}

async function loadChart() {
  try {
    const chartId = state.selectedChartId || "";
    const response = await fetch(`/api/chart?chartId=${encodeURIComponent(chartId)}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "加载失败");
    }
    state.selectedChartId = payload.chartId || state.selectedChartId;
    persistSelectedChartId(state.selectedChartId);
    renderChartPicker();
    hydrateChart(payload.chart);
    clearDirty("谱面已载入");
  } catch (error) {
    console.error(error);
    setSaveStatus(`加载失败: ${error.message}`, false);
  }
}

async function loadChartCatalog() {
  const response = await fetch("/api/charts");
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "谱面列表加载失败");
  }

  state.chartCatalog = Array.isArray(payload.charts) ? payload.charts : [];
  const storedChartId = loadStoredChartId();
  state.selectedChartId =
    findChartEntry(storedChartId)?.id ||
    findChartEntry(payload.defaultChartId)?.id ||
    state.chartCatalog[0]?.id ||
    null;
  persistSelectedChartId(state.selectedChartId);
  renderChartPicker();
}

function handleNoteFormChange() {
  const note = getSelectedNote();
  if (!note) {
    return;
  }

  applyNoteTypeValue(note, dom.noteKind.value);
  note.time = roundTime(Math.max(0, Number(dom.noteTime.value) || 0));
  note.size = Number(Number(dom.noteSize.value || note.size).toFixed(2));
  note.accent = dom.noteAccent.checked;
  note.label = dom.noteLabel.value.trim();

  if (note.kind === "hold") {
    note.endTime = roundTime(
      Math.max(note.time + 0.05, Number(dom.noteEndTime.value) || note.time + 0.448)
    );
  } else {
    delete note.endTime;
  }

  sortNotes();
  renderNotes();
  pushHistory();
}

function applyBulkNoteTypeChange() {
  const selectedNotes = getSelectedNotes();
  if (selectedNotes.length <= 1) {
    return;
  }

  const nextType = dom.bulkNoteKind.value;
  let changed = false;

  selectedNotes.forEach((note) => {
    const previousType = getEditorNoteType(note);
    if (previousType === nextType) {
      return;
    }

    applyNoteTypeValue(note, nextType);
    if (note.kind === "hold") {
      note.endTime = roundTime(
        Math.max(note.time + 0.05, Number(note.endTime) || note.time + 0.448)
      );
    } else {
      delete note.endTime;
    }
    changed = true;
  });

  if (!changed) {
    renderInspector();
    return;
  }

  sortNotes();
  renderNotes();
  pushHistory();
}

function onTimelinePointerDown(event) {
  if (event.button !== 0) {
    return;
  }

  event.stopPropagation();
  const noteElement = event.target.closest(".note");
  if (!noteElement) {
    beginEmptyAreaInteraction(event.clientX, event.clientY);
    return;
  }

  event.preventDefault();
  const noteId = Number(noteElement.dataset.noteId);
  const mode = event.target.dataset.dragMode === "resize" ? "resize" : "move";
  startDrag(noteId, mode, event.clientX, event.clientY);
}

function onTimelineClick(event) {
  event.stopPropagation();
  if (state.suppressClick) {
    state.suppressClick = false;
    return;
  }

  const noteElement = event.target.closest(".note");
  if (noteElement) {
    const noteId = Number(noteElement.dataset.noteId);
    const note = state.notes.find((item) => item._id === noteId);
    setSelectedNote(noteId);
    if (note) {
      seekToChartTime(note.time);
    }
    return;
  }

  setSelectedNotes([]);
  seekToChartTime(getTimeFromClientX(event.clientX));
}

function onTimelineContentPointerDown(event) {
  if (event.button !== 0) {
    return;
  }

  if (event.target.closest("#trackLayer") || event.target.closest("#rulerLayer")) {
    return;
  }

  beginEmptyAreaInteraction(event.clientX, event.clientY);
}

function onTimelineContentClick(event) {
  if (state.suppressClick) {
    state.suppressClick = false;
    return;
  }

  if (event.target.closest("#trackLayer") || event.target.closest("#rulerLayer")) {
    return;
  }

  setSelectedNotes([]);
  seekToChartTime(getTimeFromClientX(event.clientX));
}

function onTimelineDoubleClick(event) {
  event.stopPropagation();
  if (event.target.closest(".note")) {
    return;
  }

  const chartTime = getTimeFromClientX(event.clientX);
  addNoteAtTime(chartTime, event.shiftKey ? "hold" : "tap");
}

function animationFrame() {
  const previousChartTime = state.lastCueChartTime;
  if (!dom.audio.paused) {
    state.playheadTime = audioTimeToChartTime(dom.audio.currentTime || 0);
    playCrossedNoteCues(previousChartTime, state.playheadTime);
    state.lastCueChartTime = state.playheadTime;
  } else {
    state.lastCueChartTime = state.playheadTime;
  }
  renderPlaybackTime();
  renderPlayhead();
  updatePlayToggle();
  state.rafId = requestAnimationFrame(animationFrame);
}

function bindEvents() {
  dom.playToggle.addEventListener("click", async () => {
    if (dom.audio.paused) {
      await playFromCurrentPlayhead();
    } else {
      dom.audio.pause();
    }
    updatePlayToggle();
  });

  dom.stopButton.addEventListener("click", () => {
    dom.audio.pause();
    seekToChartTime(0);
    scrollTimelineToStart();
    updatePlayToggle();
  });

  dom.saveButton.addEventListener("click", saveChart);
  dom.undoButton.addEventListener("click", undoHistory);
  dom.redoButton.addEventListener("click", redoHistory);
  dom.zoomRange.addEventListener("input", () => {
    state.pxPerSecond = persistTimelineZoom(dom.zoomRange.value);
    dom.zoomRange.value = String(state.pxPerSecond);
    renderAll();
  });
  dom.followToggle.addEventListener("change", () => {
    state.followPlayhead = dom.followToggle.checked;
  });

  dom.fallSpeedRange?.addEventListener("input", () => {
    setChartFallSpeedMultiplier(dom.fallSpeedRange.value);
  });

  dom.fallSpeedInput?.addEventListener("change", () => {
    setChartFallSpeedMultiplier(dom.fallSpeedInput.value);
  });

  dom.musicVolumeRange?.addEventListener("input", () => {
    setChartMusicVolume(dom.musicVolumeRange.value);
  });

  dom.musicVolumeInput?.addEventListener("change", () => {
    setChartMusicVolume(dom.musicVolumeInput.value);
  });

  dom.songSelect.addEventListener("change", () => {
    const nextSongId = dom.songSelect.value;
    const selectedEntry = getSelectedChartEntry();
    const nextEntry =
      getDifficultyEntries(nextSongId).find((entry) => entry.difficultyId === selectedEntry?.difficultyId) ||
      getDifficultyEntries(nextSongId)[0];

    if (nextEntry) {
      switchChart(nextEntry.id);
    }
  });

  dom.difficultySelect.addEventListener("change", () => {
    switchChart(dom.difficultySelect.value);
  });

  dom.addTapAtPlayhead.addEventListener("click", () => {
    addNoteAtTime(getChartTime(), EDITOR_NOTE_TYPES.TAP);
  });

  dom.addHoldAtPlayhead.addEventListener("click", () => {
    addNoteAtTime(getChartTime(), EDITOR_NOTE_TYPES.HOLD);
  });

  dom.addLeftAtPlayhead.addEventListener("click", () => {
    addNoteAtTime(getChartTime(), EDITOR_NOTE_TYPES.LEFT);
  });

  dom.addRightAtPlayhead.addEventListener("click", () => {
    addNoteAtTime(getChartTime(), EDITOR_NOTE_TYPES.RIGHT);
  });

  dom.seekRange.addEventListener("input", () => {
    seekToChartTime(Number(dom.seekRange.value));
  });

  dom.seekToSelection.addEventListener("click", () => {
    const selectedNotes = getSelectedNotes();
    if (selectedNotes.length) {
      seekToChartTime(Math.min(...selectedNotes.map((note) => note.time)));
    }
  });

  dom.snapSelectionToPlayhead.addEventListener("click", syncSelectionToPlayhead);
  dom.applyBulkNoteKind?.addEventListener("click", applyBulkNoteTypeChange);
  dom.deleteButton.addEventListener("click", removeSelectedNote);
  dom.duplicateButton.addEventListener("click", duplicateSelectedNote);

  [
    dom.noteKind,
    dom.noteTime,
    dom.noteEndTime,
    dom.noteSize,
    dom.noteAccent,
    dom.noteLabel,
  ].forEach((element) => {
    element.addEventListener("input", handleNoteFormChange);
    element.addEventListener("change", handleNoteFormChange);
  });

  dom.trackLayer.addEventListener("pointerdown", onTimelinePointerDown);
  dom.trackLayer.addEventListener("click", onTimelineClick);
  dom.trackLayer.addEventListener("dblclick", onTimelineDoubleClick);
  dom.timelineContent.addEventListener("pointerdown", onTimelineContentPointerDown);
  dom.timelineContent.addEventListener("click", onTimelineContentClick);
  dom.rulerLayer.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    seekToChartTime(getTimeFromClientX(event.clientX));
  });

  window.addEventListener("pointermove", (event) => {
    handleDragMove(event.clientX, event.clientY);
  });

  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);

  window.addEventListener("keydown", (event) => {
    const activeTag = document.activeElement && document.activeElement.tagName;
    const inTextField = activeTag === "INPUT" || activeTag === "SELECT" || activeTag === "TEXTAREA";

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveChart();
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        redoHistory();
      } else {
        undoHistory();
      }
      return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redoHistory();
      return;
    }

    if (inTextField) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      dom.playToggle.click();
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      removeSelectedNote();
      return;
    }

    if (event.key.toLowerCase() === "h") {
      event.preventDefault();
      updateSelectedNote((note) => {
        note.kind = "hold";
        note.endTime = roundTime(Math.max(note.time + 0.05, note.endTime || note.time + 0.448));
      });
      return;
    }

    if (event.key.toLowerCase() === "t") {
      event.preventDefault();
      updateSelectedNote((note) => {
        note.kind = "tap";
        delete note.endTime;
      });
    }
  });

  dom.audio.addEventListener("ended", updatePlayToggle);
  dom.audio.addEventListener("loadedmetadata", syncPendingAudioTime);
  dom.audio.addEventListener("canplay", syncPendingAudioTime);
  dom.audio.addEventListener("error", () => {
    const src = state.chart?.audioSrc || dom.audio.getAttribute("src") || "当前音频";
    setSaveStatus(`音频未找到或无法播放: ${src}`, false);
    updatePlayToggle();
  });
  dom.audio.addEventListener("seeked", () => {
    state.playheadTime = audioTimeToChartTime(dom.audio.currentTime || 0);
    resetCueTracking(state.playheadTime);
  });
  dom.audio.addEventListener("pause", () => {
    state.playheadTime = audioTimeToChartTime(dom.audio.currentTime || 0);
    resetCueTracking(state.playheadTime);
    updatePlayToggle();
  });
  dom.audio.addEventListener("play", () => {
    resetCueTracking(state.playheadTime);
    updatePlayToggle();
  });
}

async function init() {
  state.pxPerSecond = loadStoredTimelineZoom();
  if (dom.zoomRange) {
    dom.zoomRange.value = String(state.pxPerSecond);
  }

  bindEvents();
  try {
    await loadChartCatalog();
    await loadChart();
  } catch (error) {
    console.error(error);
    setSaveStatus(`加载失败: ${error.message}`, false);
  }
  updatePlayToggle();
  animationFrame();
}

init();
