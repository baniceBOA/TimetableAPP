import { DAYS } from "../constants";

// --- helpers ---
function toMin(hhmm) {
  const [H, M] = String(hhmm || "00:00").split(":").map(Number);
  return (H || 0) * 60 + (M || 0);
}
function overlaps(aStart, aEnd, bStart, bEnd) {
  const as = toMin(aStart), ae = toMin(aEnd);
  const bs = toMin(bStart), be = toMin(bEnd);
  return Math.max(as, bs) < Math.min(ae, be);
}
function encloses(innerStart, innerEnd, outerStart, outerEnd) {
  const is = toMin(innerStart), ie = toMin(innerEnd);
  const os = toMin(outerStart), oe = toMin(outerEnd);
  return os <= is && ie <= oe;
}

// --- shape ---
// timeConstraints = {
//   teacherUnavailable: [{ id, teacherId, dayIndex, start, end, note? }],
//   subjectWindows:     [{ id, area, dayIndex, start, end, mode:'allow'|'forbid', note? }]
// }

// teacher time rule check
export function checkTeacherTime(timeConstraints, event) {
  const list = (timeConstraints?.teacherUnavailable || []).filter(
    r => r.teacherId === event.teacherId && r.dayIndex === event.dayIndex
  );
  for (const r of list) {
    if (overlaps(event.start, event.end, r.start, r.end)) {
      return { blocked: true, rule: r };
    }
  }
  return { blocked: false };
}

// subject time windows check
export function checkSubjectTime(timeConstraints, event) {
  const area = (event.area || "").trim();
  if (!area) return { blocked: false };
  const rules = (timeConstraints?.subjectWindows || []).filter(
    r => (r.area || "").trim() === area && r.dayIndex === event.dayIndex
  );
  if (rules.length === 0) return { blocked: false };

  const allow = rules.filter(r => r.mode === "allow");
  const forbid = rules.filter(r => r.mode === "forbid");

  // If any ALLOW windows exist for this day+subject, the event must fit fully inside at least one allow window
  if (allow.length > 0) {
    const fits = allow.some(r => encloses(event.start, event.end, r.start, r.end));
    if (!fits) {
      return { blocked: true, rule: { mode: "allow", area, windows: allow } };
    }
  }

  // It must not overlap any FORBID window
  for (const r of forbid) {
    if (overlaps(event.start, event.end, r.start, r.end)) {
      return { blocked: true, rule: r };
    }
  }

  return { blocked: false };
}

// Filter a list of suggested free slots by these time rules
export function filterSuggestionsByTime(timeConstraints, area, teacherId, dayIndex, suggestions) {
  return suggestions.filter(s => {
    const ev = {
      area,
      teacherId,
      dayIndex: s.dayIndex,
      start: s.start,
      end: s.end
    };
    if (checkTeacherTime(timeConstraints, ev).blocked) return false;
    if (checkSubjectTime(timeConstraints, ev).blocked) return false;
    return true;
  });
}