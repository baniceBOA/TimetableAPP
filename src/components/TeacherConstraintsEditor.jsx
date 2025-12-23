import { useMemo, useState } from 'react';
export default function TeacherConstraintsEditor({ teachers=[], subjects=[], constraints=[], addConstraint, deleteConstraint }){
  const [form, setForm] = useState({ teacherId: teachers[0]?.id || '', area: '', maxPerWeek: 5 });
  const teacherOptions = useMemo(()=> teachers.map(t=> ({ value:t.id, label:t.name })), [teachers]);
  const subjectOptions = useMemo(()=> subjects.map(s=> ({ value:s, label:s })), [subjects]);
  function submit(e){ e.preventDefault(); const teacherId=String(form.teacherId||'').trim(); const area=String(form.area||'').trim(); const maxPerWeek=Number(form.maxPerWeek||0); if(!teacherId||!area||maxPerWeek<=0) return; addConstraint?.({ teacherId, area, maxPerWeek }); }
  return (
    <div style={{ display:'grid', gap:8 }}>
      <strong>Weekly Lesson Limits (Teacher × Subject)</strong>
      <form onSubmit={submit} style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <label>Teacher
          <select value={form.teacherId} onChange={(e)=> setForm(f=> ({...f, teacherId: e.target.value}))} style={{ marginLeft:6 }}>
            {teacherOptions.map(t=> <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label>Subject
          <input list="subjects-list-teacher" value={form.area} onChange={(e)=> setForm(f=> ({...f, area: e.target.value}))} placeholder="e.g., Mathematics" />
          <datalist id="subjects-list-teacher">{subjectOptions.map(s=> <option key={s.value} value={s.value}>{s.label}</option>)}</datalist>
        </label>
        <label>Max/week <input type="number" min="1" step="1" value={form.maxPerWeek} onChange={(e)=> setForm(f=> ({...f, maxPerWeek: e.target.value}))} style={{ width:90 }} /></label>
        <button className="primary" type="submit">+ Add limit</button>
      </form>
      <div style={{ display:'grid', gap:6 }}>
        {constraints.map(c=> (
          <div key={`${c.teacherId}-${c.area}`} style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ flex:1 }}><strong>{teachers.find(t=> t.id===c.teacherId)?.name || c.teacherId}</strong> • {c.area} → Max/week: {c.maxPerWeek}</div>
            <button className="danger" onClick={()=> deleteConstraint?.(c.teacherId, c.area)}>Delete</button>
          </div>
        ))}
        {constraints.length===0 && <div className="muted small">No limits set yet.</div>}
      </div>
    </div>
  );
}
