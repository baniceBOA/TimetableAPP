
// File: src/utils/presetStore.js
// LocalStorage-backed "preset" for AddClassModal & PrepopulateModal

const PRESET_KEY = "tt_preset";

export function loadPreset() {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object") return null;
    return {
      teacherId: p.teacherId ?? "",
      roomId: p.roomId ?? "",
      subject: p.subject ?? "",
    };
  } catch {
    return null;
  }
}

export function savePreset({ teacherId = "", roomId = "", subject = "" }) {
  const payload = {
    teacherId: String(teacherId || ""),
    roomId: String(roomId || ""),
    subject: String(subject || ""),
  };
  localStorage.setItem(PRESET_KEY, JSON.stringify(payload));
  return payload;
}

// Hook to subscribe to preset changes (cross-tab safe)
import { useEffect, useState } from "react";
export function usePreset() {
  const [preset, setPreset] = useState(() => loadPreset());
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === PRESET_KEY) setPreset(loadPreset());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const api = {
    set: (next) => setPreset(savePreset(next)),
    refresh: () => setPreset(loadPreset()),
    clear: () => {
      localStorage.removeItem(PRESET_KEY);
      setPreset(null);
    },
  };
  return [preset, api];
}
