function normalizeArea(area){ return (area||'').trim(); }
// ROOM x SUBJECT
function roomKey(roomId, area){ return `${roomId}::${normalizeArea(area).toLowerCase()}`; }
export function buildRoomLimitMap(constraints=[]){ const map=new Map(); constraints.forEach(c=> map.set(roomKey(c.roomId,c.area), Number(c.maxPerWeek)||0)); return map; }
export function findRoomConstraint(constraints=[], roomId, area){ const a=normalizeArea(area); return constraints.find(c=> c.roomId===roomId && normalizeArea(c.area)===a) || null; }
export function wouldRoomExceed(constraints=[], events=[], nextEvent, ignoreId=null){ const c=findRoomConstraint(constraints, nextEvent.roomId, nextEvent.area); if(!c||!c.maxPerWeek) return false; const base=events.filter(e=> e.id!==ignoreId && e.roomId===c.roomId && normalizeArea(e.area)===normalizeArea(c.area)).length; return base+1 > Number(c.maxPerWeek); }
// TEACHER x SUBJECT
function teacherKey(teacherId, area){ return `${teacherId}::${normalizeArea(area).toLowerCase()}`; }
export function buildTeacherLimitMap(constraints=[]){ const map=new Map(); constraints.forEach(c=> map.set(teacherKey(c.teacherId,c.area), Number(c.maxPerWeek)||0)); return map; }
export function findTeacherConstraint(constraints=[], teacherId, area){ const a=normalizeArea(area); return constraints.find(c=> c.teacherId===teacherId && normalizeArea(c.area)===a) || null; }
export function wouldTeacherExceed(constraints=[], events=[], nextEvent, ignoreId=null){ const c=findTeacherConstraint(constraints, nextEvent.teacherId, nextEvent.area); if(!c||!c.maxPerWeek) return false; const base=events.filter(e=> e.id!==ignoreId && e.teacherId===c.teacherId && normalizeArea(e.area)===normalizeArea(c.area)).length; return base+1 > Number(c.maxPerWeek); }
