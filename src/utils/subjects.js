export function getSubjects(teachers=[], events=[]) {
  const set = new Set();
  teachers.forEach(t => (t.areas||[]).forEach(a => a && set.add(a)));
  events.forEach(e => { const a=(e.area||'').trim(); if(a) set.add(a); });
  return Array.from(set).sort((a,b)=> a.localeCompare(b));
}
