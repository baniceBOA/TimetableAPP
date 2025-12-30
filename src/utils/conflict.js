import { toMinutes } from "./time";
function rangesOverlap(startA, endA, startB, endB) {
  const aStart = toMinutes(startA), aEnd = toMinutes(endA);
  const bStart = toMinutes(startB), bEnd = toMinutes(endB);
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}
export function conflictsForTeacher(events, teacherId, dayIndex, start, end, ignoreEventId) {
  if (!teacherId) return [];
  return events.filter(e => e.teacherId===teacherId && e.dayIndex===dayIndex && e.id!==ignoreEventId && rangesOverlap(start, end, e.start, e.end));
}
export function conflictsForRoom(events, roomId, dayIndex, start, end, ignoreEventId) {
  if (!roomId) return [];
  return events.filter(e => e.roomId===roomId && e.dayIndex===dayIndex && e.id!==ignoreEventId && rangesOverlap(start, end, e.start, e.end));
}
export function conflictsWithBreaks(breaks = [], dayIndex, start, end) {
  if (!breaks || breaks.length === 0) return [];
  return breaks.filter(b => typeof b.dayIndex === 'number' && b.dayIndex === dayIndex && rangesOverlap(start, end, b.start, b.end));
}
export function checkRoomCapacity({ rooms = [], roomId, requiredSize }) {
  if (!roomId || !Number.isFinite(requiredSize)) return { ok: true, message: "" };
  const room = rooms.find(r => r.id === roomId);
  if (!room || typeof room.capacity !== "number") {
    return { ok: true, message: "" };
  }
  if (requiredSize <= room.capacity) return { ok: true, message: "" };
  return { ok: false, message: `Capacity exceeded: ${requiredSize} required, room allows ${room.capacity}.` };
}
