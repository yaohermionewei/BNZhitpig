const START_THEME_STORAGE_KEY = "startThemeV1";
const DEFAULT_START_THEME = "dark";
const START_THEMES = Object.freeze({
  dark: "dark",
  light: "light",
});
const LEGACY_START_THEME_ALIASES = Object.freeze({
  night: START_THEMES.dark,
  sunset: START_THEMES.light,
});
const START_THEME_LOADING_COLORS = Object.freeze({
  dark: Object.freeze({
    background: "#6f86aa",
    spinner: "#17233d",
    spinnerTrack: "rgba(23, 35, 61, 0.22)",
    backgroundTextStyle: "light",
  }),
  light: Object.freeze({
    background: "#e8c08c",
    spinner: "#d6a461",
    spinnerTrack: "rgba(214, 164, 97, 0.2)",
    backgroundTextStyle: "dark",
  }),
});

function isValidStartTheme(theme) {
  return theme === START_THEMES.dark || theme === START_THEMES.light;
}

function normalizeStartTheme(theme) {
  if (isValidStartTheme(theme)) {
    return theme;
  }

  if (LEGACY_START_THEME_ALIASES[theme]) {
    return LEGACY_START_THEME_ALIASES[theme];
  }

  return DEFAULT_START_THEME;
}

function getStartThemeLoadingColors(theme) {
  const normalizedTheme = normalizeStartTheme(theme);
  return START_THEME_LOADING_COLORS[normalizedTheme] || START_THEME_LOADING_COLORS.dark;
}

function applyStartThemeNativeBackground(theme) {
  const colors = getStartThemeLoadingColors(theme);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.startTheme = normalizeStartTheme(theme);
    document.documentElement.style.backgroundColor = colors.background;
  }
  return colors;
}

function readStartTheme(app) {
  if (app && app.globalData && app.globalData.startTheme) {
    const globalTheme = normalizeStartTheme(app.globalData.startTheme);
    if (isValidStartTheme(globalTheme)) {
      app.globalData.startTheme = globalTheme;
      return globalTheme;
    }
  }

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const storedTheme = window.localStorage.getItem(START_THEME_STORAGE_KEY);
      const normalizedTheme = normalizeStartTheme(storedTheme);
      if (storedTheme && normalizedTheme !== storedTheme) {
        window.localStorage.setItem(START_THEME_STORAGE_KEY, normalizedTheme);
      }
      if (isValidStartTheme(normalizedTheme)) {
        return normalizedTheme;
      }
    }
  } catch (error) {
    console.warn("Failed to read start theme", error);
  }

  return DEFAULT_START_THEME;
}

function setStartTheme(theme, app) {
  const normalizedTheme = normalizeStartTheme(theme);

  if (app && app.globalData) {
    app.globalData.startTheme = normalizedTheme;
  }
  applyStartThemeNativeBackground(normalizedTheme);

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(START_THEME_STORAGE_KEY, normalizedTheme);
    }
  } catch (error) {
    console.warn("Failed to persist start theme", error);
  }

  return normalizedTheme;
}

function getStartTheme(preferredTheme, app) {
  const normalizedPreferredTheme = normalizeStartTheme(preferredTheme);
  if (isValidStartTheme(normalizedPreferredTheme) && preferredTheme) {
    return setStartTheme(normalizedPreferredTheme, app);
  }

  return setStartTheme(readStartTheme(app), app);
}

export {
  DEFAULT_START_THEME,
  START_THEME_STORAGE_KEY,
  START_THEMES,
  applyStartThemeNativeBackground,
  getStartTheme,
  getStartThemeLoadingColors,
  normalizeStartTheme,
  setStartTheme,
};
