import { useMemo, useState } from 'react';
export default function ConstraintsEditor({ rooms=[], subjects=[], constraints=[], addConstraint, deleteConstraint }){
  const [form, setForm] = useState({ roomId: rooms[0]?.id || '', area: '', maxPerWeek: 5 });
  const roomOptions = useMemo(()=> rooms.map(r=> ({ value:r.id, label:r.name })), [rooms]);
  const subjectOptions = useMemo(()=> subjects.map(s=> ({ value:s, label:s })), [subjects]);
  function submit(e){ e.preventDefault(); const roomId=String(form.roomId||'').trim(); const area=String(form.area||'').trim(); const maxPerWeek=Number(form.maxPerWeek||0); if(!roomId||!area||maxPerWeek<=0) return; addConstraint?.({ roomId, area, maxPerWeek }); }
  return (
    <div style={{ display:'grid', gap:8 }}>
      <strong>Weekly Lesson Limits (Room × Subject)</strong>
      <form onSubmit={submit} style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <label>Room
          <select value={form.roomId} onChange={(e)=> setForm(f=> ({...f, roomId: e.target.value}))} style={{ marginLeft:6 }}>
            {roomOptions.map(r=> <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>
        <label>Subject
          <input list="subjects-list-room" value={form.area} onChange={(e)=> setForm(f=> ({...f, area: e.target.value}))} placeholder="e.g., Mathematics" />
          <datalist id="subjects-list-room">{subjectOptions.map(s=> <option key={s.value} value={s.value}>{s.label}</option>)}</datalist>
        </label>
        <label>Max/week <input type="number" min="1" step="1" value={form.maxPerWeek} onChange={(e)=> setForm(f=> ({...f, maxPerWeek: e.target.value}))} style={{ width:90 }} /></label>
        <button className="primary" type="submit">+ Add limit</button>
      </form>
      <div style={{ display:'grid', gap:6 }}>
        {constraints.map(c=> (
          <div key={`${c.roomId}-${c.area}`} style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ flex:1 }}><strong>{rooms.find(r=> r.id===c.roomId)?.name || c.roomId}</strong> • {c.area} → Max/week: {c.maxPerWeek}</div>
            <button className="danger" onClick={()=> deleteConstraint?.(c.roomId, c.area)}>Delete</button>
          </div>
        ))}
        {constraints.length===0 && <div className="muted small">No limits set yet.</div>}
      </div>
    </div>
  );
}
