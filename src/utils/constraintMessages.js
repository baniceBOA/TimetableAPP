import { DAYS } from "../constants";
import {
  checkTeacherTime,
  checkSubjectTime,
} from "./timeConstraints";
import {
  wouldRoomExceed,
  wouldTeacherExceed,
  findRoomConstraint,
  findTeacherConstraint,
} from "./constraints";
import { conflictsForTeacher, conflictsForRoom, checkRoomCapacity } from "./conflict";

/**
 * Returns { blocked:boolean, messages:string[] } based on all rules.
 * nextEvent: { title, area, dayIndex, start, end, teacherId, roomId, classSize }
 */
export function getConstraintMessages({
  nextEvent,
  state // pack everything needed below
}) {
  const {
    limitsEnabled,
    constraints, teacherConstraints,
    rooms, teachers, events,
    timeConstraints
  } = state;

  const msgs = [];
  const hasSubject = (nextEvent.area || "").trim().length > 0;
  const dayName = DAYS[nextEvent.dayIndex] ?? `Day ${nextEvent.dayIndex + 1}`;

  // Capacity
  const cap = checkRoomCapacity({ rooms, roomId: nextEvent.roomId, requiredSize: Number(nextEvent.classSize || 0) });
  if (!cap.ok) {
    msgs.push(cap.message || "Capacity exceeded for selected room.");
  }

  // Time conflicts: handle one or more assigned teachers
  const teacherIds = Array.isArray(nextEvent.teacherIds) && nextEvent.teacherIds.length > 0
    ? nextEvent.teacherIds
    : (nextEvent.teacherId ? [nextEvent.teacherId] : []);
  for (const tid of teacherIds) {
    const tConf = conflictsForTeacher(events, tid, nextEvent.dayIndex, nextEvent.start, nextEvent.end, nextEvent.id || null);
    if (tConf.length) {
      const teacherName = teachers.find(t => t.id === tid)?.name || tid;
      msgs.push(`Teacher conflict: ${teacherName} already booked on ${dayName} ${nextEvent.start}–${nextEvent.end}.`);
    }
  }

  // Enforce teacher allowed subjects (if teacher.areas is non-empty)
  if (hasSubject) {
    for (const tid of teacherIds) {
      const teacher = (teachers || []).find(t => t.id === tid) || null;
      if (teacher && Array.isArray(teacher.areas) && teacher.areas.length > 0) {
        const allowed = teacher.areas.map(a => String(a).trim()).filter(Boolean);
        if (!allowed.includes((nextEvent.area || "").trim())) {
          const teacherName = teacher.name || tid;
          msgs.push(`Teacher ${teacherName} is not assigned to subject "${nextEvent.area}".`);
        }
      }
    }
  }
  const rConf = conflictsForRoom(events, nextEvent.roomId, nextEvent.dayIndex, nextEvent.start, nextEvent.end, nextEvent.id || null);
  if (rConf.length) {
    msgs.push(`Room conflict: already booked on ${dayName} ${nextEvent.start}–${nextEvent.end}.`);
  }

  // Time-specific constraints (teacher unavailable) - check each assigned teacher
  for (const tid of teacherIds) {
    const tmp = { ...nextEvent, teacherId: tid };
    const tBlock = checkTeacherTime(timeConstraints, tmp);
    if (tBlock.blocked) {
      const teacherName = teachers.find(t => t.id === tid)?.name || "Teacher";
      msgs.push(`${teacherName} unavailable on ${dayName} ${tBlock.rule.start}–${tBlock.rule.end}${tBlock.rule.note ? ` • ${tBlock.rule.note}` : ""}.`);
    }
  }

  // Time-specific constraints (subject windows)
  if (hasSubject) {
    const sBlock = checkSubjectTime(timeConstraints, nextEvent);
    if (sBlock.blocked) {
      if (sBlock.rule?.mode === "allow") {
        const windows = (sBlock.rule.windows || []).map(w => `${w.start}–${w.end}`).join(", ");
        msgs.push(`"${nextEvent.area}" must be scheduled within allowed windows on ${dayName}: ${windows}.`);
      } else {
        msgs.push(`"${nextEvent.area}" is forbidden on ${dayName} ${sBlock.rule.start}–${sBlock.rule.end}${sBlock.rule.note ? ` • ${sBlock.rule.note}` : ""}.`);
      }
    }
  }

  // Weekly limits
  if (limitsEnabled?.roomLimits && hasSubject && nextEvent.roomId) {
    if (wouldRoomExceed(constraints, events, nextEvent, nextEvent.id || null)) {
      const c = findRoomConstraint(constraints, nextEvent.roomId, nextEvent.area);
      const roomName = rooms.find(r => r.id === c?.roomId)?.name || c?.roomId || "Room";
      msgs.push(`Weekly room limit exceeded: ${c?.area || nextEvent.area} in ${roomName} is limited to ${c?.maxPerWeek} /week.`);
    }
  }
  if (limitsEnabled?.teacherLimits && hasSubject && teacherIds.length > 0) {
    for (const tid of teacherIds) {
      const tmp = { ...nextEvent, teacherId: tid };
      if (wouldTeacherExceed(teacherConstraints, events, tmp, nextEvent.id || null)) {
        const c = findTeacherConstraint(teacherConstraints, tid, nextEvent.area);
        const teacherName = teachers.find(t => t.id === c?.teacherId)?.name || c?.teacherId || "Teacher";
        msgs.push(`Weekly teacher limit exceeded: ${c?.area || nextEvent.area} for ${teacherName} is limited to ${c?.maxPerWeek} /week.`);
      }
    }
  }

  return { blocked: msgs.length > 0, messages: msgs };
}