export function countEventsBySubject(events = []) {
  const map = new Map();
  for (const e of events) {
    const a = String(e.area || "").trim();
    if (!a) continue;
    map.set(a, (map.get(a) || 0) + 1);
  }
  return map; // Map<subject, count>
}

export function summarizeEvents(events = []) {
  const total = events.length;
  // If you need breakdowns later:
  // const byDay = new Map(); events.forEach(e => byDay.set(e.dayIndex, (byDay.get(e.dayIndex)||0)+1));
  return { total };
}