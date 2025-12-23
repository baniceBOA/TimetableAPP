import { useState } from "react";
import { stableColorFromString, randomNiceColor } from "../utils/colors";
export default function ManageTeachers({ teachers, addTeacher, updateTeacher, deleteTeacher }) {
  const [form, setForm] = useState({ name: "", color: "#2d8cff", areas: "" });
  const [editing, setEditing] = useState(null);
  function reset(){ setForm({ name:"", color:"#2d8cff", areas:"" }); setEditing(null); }
  function submit(e){ e.preventDefault(); const payload = { name: form.name.trim(), color: form.name.trim()? stableColorFromString(form.name.trim()) : randomNiceColor(), areas: form.areas.split(',').map(a=>a.trim()).filter(Boolean) }; if(!payload.name) return; if(editing) updateTeacher(editing.id, payload); else addTeacher(payload); reset(); }
  function startEdit(t){ setEditing(t); setForm({ name:t.name, color:t.color||"#2d8cff", areas:(t.areas||[]).join(', ') }); }
  return (
    <section className="panel">
      <h2>Manage Teachers</h2>
      <form className="form" onSubmit={submit} style={{ marginBottom: 16 }}>
        <div className="row">
          <label className="flex">Name<input value={form.name} onChange={(e)=> setForm(f=> ({...f, name: e.target.value}))} placeholder="e.g., Ms. Ahmed" required /></label>
          <label className="flex">(Auto) Color<input type="color" value={form.color} onChange={(e)=> setForm(f=> ({...f, color: e.target.value}))} disabled title="Colors are auto-assigned" /></label>
        </div>
        <label>Subjects (comma-separated)<input value={form.areas} onChange={(e)=> setForm(f=> ({...f, areas: e.target.value}))} placeholder="e.g., Mathematics, Physics" /></label>
        <div className="actions">{editing && <button type="button" onClick={reset}>Cancel edit</button>}<button className="primary" type="submit">{editing? 'Save' : 'Add teacher'}</button></div>
      </form>
      <div className="list">
        {teachers.map((t)=> (
          <div key={t.id} className="list-item">
            <div className="chip" style={{ background: t.color }} />
            <div className="grow"><div className="title">{t.name}</div><div className="muted small">{(t.areas||[]).join(' • ') || 'No subjects set'}</div></div>
            <div className="actions"><button onClick={()=> startEdit(t)}>Edit</button><button className="danger" onClick={()=> deleteTeacher(t.id)}>Delete</button></div>
          </div>
        ))}
        {teachers.length===0 && <div className="muted">No teachers yet.</div>}
      </div>
    </section>
  );
}
