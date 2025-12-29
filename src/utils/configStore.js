// File: src/utils/configStore.js
// Reactive timetable config + localStorage persistence.

import React from "react";

// localStorage key
const CFG_KEY = "tt_config_v1";

// Default values (match your current constants)
export const DEFAULT_CONFIG = {
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  startHour: 8,
  endHour: 16,
  // We allow two ways to define granularity. Internally we normalize.
  slotsPerHour: 2,       // 30-minute slots
  lessonDurationMin: 30, // derived from slotsPerHour if you prefer; we keep both in sync
  // UI defaults:
  rowHeight: 36,
  dayLabelColWidth: 120,
  roomLabelColWidth: 120,
  timeHeaderHeight: 40,
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return normalizeConfig({ ...DEFAULT_CONFIG, ...parsed });
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(cfg) {
  const normalized = normalizeConfig(cfg);
  localStorage.setItem(CFG_KEY, JSON.stringify(normalized));
  return normalized;
}

function normalizeConfig(cfg) {
  let startHour = clampInt(cfg.startHour, 0, 23);
  let endHour = clampInt(cfg.endHour, 0, 24);
  if (endHour <= startHour) endHour = Math.min(24, startHour + 1);

  // Keep slotsPerHour and lessonDurationMin in sync
  let slotsPerHour = Number(cfg.slotsPerHour) > 0 ? Number(cfg.slotsPerHour) : 2;
  let lessonDurationMin = Number(cfg.lessonDurationMin) > 0 ? Number(cfg.lessonDurationMin) : Math.floor(60 / slotsPerHour);

  // If one is explicitly set, recompute the other:
  // Favor lessonDurationMin if not divisible.
  if (60 % lessonDurationMin === 0) {
    slotsPerHour = 60 / lessonDurationMin;
  } else {
    // Ensure integer slotsPerHour; recompute duration accordingly
    slotsPerHour = Math.max(1, Math.round(slotsPerHour));
    lessonDurationMin = Math.floor(60 / slotsPerHour);
  }

  const days = (cfg.days || []).map(String).filter(Boolean);
  const safeDays = days.length ? days : DEFAULT_CONFIG.days.slice();

  return {
    ...DEFAULT_CONFIG,
    ...cfg,
    days: safeDays,
    startHour,
    endHour,
    slotsPerHour,
    lessonDurationMin,
  };
}

function clampInt(n, min, max) {
  const x = Number.isFinite(n) ? Math.floor(n) : min;
  return Math.max(min, Math.min(max, x));
}

// React context
const ConfigContext = React.createContext({
  config: DEFAULT_CONFIG,
  setConfig: () => {},
  resetConfig: () => {},
  savePartial: () => {},
});

export function ConfigProvider({ children }) {
  const [config, setConfig] = React.useState(() => loadConfig());

  const savePartial = React.useCallback((partial) => {
    setConfig((prev) => saveConfig({ ...prev, ...partial }));
  }, []);

  const resetConfig = React.useCallback(() => {
    const saved = saveConfig(DEFAULT_CONFIG);
    setConfig(saved);
  }, []);

  const value = React.useMemo(() => ({ config, setConfig: (c) => setConfig(saveConfig(c)), resetConfig, savePartial }), [config, resetConfig, savePartial]);

  // sync across tabs
  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CFG_KEY) setConfig(loadConfig());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    React.createElement(ConfigContext.Provider, { value }, children)
  );
};

export function useConfig() {
  const ctx = React.useContext(ConfigContext);
  if (!ctx) return DEFAULT_CONFIG;
  // Return an object that contains the config fields at top-level
  // while preserving helper functions (`config`, `setConfig`, `savePartial`, ...)
  return Object.assign({}, ctx.config || {}, ctx);
}

// Helpers resembling the old constants:
export function getTotalCols(cfg) {
  return (cfg.endHour - cfg.startHour) * cfg.slotsPerHour;
}