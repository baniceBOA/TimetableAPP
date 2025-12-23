import { useState } from 'react';
import { DAYS } from '../constants';
export default function BreaksEditor({ days = DAYS, breaks = [], addBreak, deleteBreak }){
  const [form, setForm] = useState({ dayIndex: 0, start: '10:00', end: '10:30', label: 'Break', color: '#EDEFF2' });
  function submit(e){ e.preventDefault(); const { dayIndex, start, end, label, color } = form; if (!start || !end || start >= end) return; addBreak({ dayIndex: Number(dayIndex), start, end, label: label.trim(), color }); }
  return (
    <div style={{ display:'grid', gap:8 }}>
      <strong>Day-wide Breaks</strong>
      <form onSubmit={submit} style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <label>Day
          <select value={form.dayIndex} onChange={(e)=> setForm(f=> ({...f, dayIndex: e.target.value}))} style={{ marginLeft:6 }}>
            {days.map((d,i)=> <option key={d} value={i}>{d}</option>)}
          </select>
        </label>
        <label>Start <input type="time" value={form.start} onChange={(e)=> setForm(f=> ({...f, start: e.target.value}))} /></label>
        <label>End <input type="time" value={form.end} onChange={(e)=> setForm(f=> ({...f, end: e.target.value}))} /></label>
        <label>Label <input value={form.label} onChange={(e)=> setForm(f=> ({...f, label: e.target.value}))} /></label>
        <label>Color <input type="color" value={form.color} onChange={(e)=> setForm(f=> ({...f, color: e.target.value}))} /></label>
        <button className="primary" type="submit">+ Add break</button>
      </form>
      <div style={{ display:'grid', gap:6 }}>
        {breaks.map(b=> (
          <div key={`${b.dayIndex}-${b.start}-${b.end}-${b.label}`} style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ width:14, height:14, borderRadius:3, background:b.color }} />
            <div style={{ flex:1 }}>{days[b.dayIndex]} — {b.start}–{b.end} • {b.label}</div>
            <button className="danger" onClick={()=> deleteBreak(b.id || `${b.dayIndex}-${b.start}-${b.end}-${b.label}`)}>Delete</button>
          </div>
        ))}
        {breaks.length===0 && <div className="muted small">No breaks yet.</div>}
      </div>
    </div>
  );
}
