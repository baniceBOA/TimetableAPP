// File: src/utils/subjectsStore.js
// Simple localStorage store + hook for subjects

const SUBJECTS_KEY = "tt_subjects";

// Load subjects array (strings)
export function loadSubjects() {
  try {
    const raw = localStorage.getItem(SUBJECTS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

// Save subjects array
export function saveSubjects(list) {
  try {
    const unique = Array.from(new Set(list.map((s) => s.trim()).filter(Boolean))).sort();
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(unique));
    return unique;
  } catch {
    return list;
  }
}

export function addSubject(name) {
  const n = String(name || "").trim();
  if (!n) return loadSubjects();
  const current = loadSubjects();
  if (current.includes(n)) return current;
  return saveSubjects([...current, n]);
}

export function removeSubject(name) {
  const current = loadSubjects();
  return saveSubjects(current.filter((s) => s !== name));
}

export function renameSubject(oldName, newName) {
  const n = String(newName || "").trim();
  const current = loadSubjects();
  const next = current.map((s) => (s === oldName ? n : s));
  return saveSubjects(next);
}

// React hook to subscribe to changes (including other tabs)
import { useEffect, useState } from "react";
export function useSubjects() {
  const [subjects, setSubjects] = useState(() => loadSubjects());

  useEffect(() => {
    // Initialize once (in case of external changes pre-boot)
    setSubjects(loadSubjects());

    const onStorage = (e) => {
      if (e.key === SUBJECTS_KEY) {
        setSubjects(loadSubjects());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const api = {
    add: (name) => setSubjects(addSubject(name)),
    remove: (name) => setSubjects(removeSubject(name)),
    rename: (oldName, newName) => setSubjects(renameSubject(oldName, newName)),
    setAll: (list) => setSubjects(saveSubjects(list)),
    refresh: () => setSubjects(loadSubjects()),
  };

  return [subjects, api];
}