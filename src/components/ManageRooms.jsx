import { useState } from "react";
export default function ManageRooms({ rooms, addRoom, updateRoom, deleteRoom }) {
  const [form, setForm] = useState({ name: "", capacity: "" });
  const [editing, setEditing] = useState(null);
  function reset(){ setForm({ name:"", capacity:"" }); setEditing(null); }
  function submit(e){ e.preventDefault(); const payload = { name: form.name.trim(), capacity: form.capacity? Number(form.capacity): undefined }; if(!payload.name) return; if(editing) updateRoom(editing.id, payload); else addRoom(payload); reset(); }
  function startEdit(r){ setEditing(r); setForm({ name:r.name, capacity:r.capacity ?? "" }); }
  return (
    <section className="panel">
      <h2>Manage Rooms</h2>
      <form className="form" onSubmit={submit} style={{ marginBottom: 16 }}>
        <div className="row">
          <label className="flex">Room name<input value={form.name} onChange={(e)=> setForm(f=> ({...f, name: e.target.value}))} placeholder="e.g., Room A2" required /></label>
          <label className="flex">Capacity (optional)<input type="number" min="0" step="1" value={form.capacity} onChange={(e)=> setForm(f=> ({...f, capacity: e.target.value}))} placeholder="e.g., 40" /></label>
        </div>
        <div className="actions">{editing && <button type="button" onClick={reset}>Cancel edit</button>}<button className="primary" type="submit">{editing? 'Save' : 'Add room'}</button></div>
      </form>
      <div className="list">
        {rooms.map((r)=> (
          <div key={r.id} className="list-item">
            <div className="grow"><div className="title">{r.name}</div>{typeof r.capacity==='number' && <div className="muted small">Capacity: {r.capacity}</div>}</div>
            <div className="actions"><button onClick={()=> startEdit(r)}>Edit</button><button className="danger" onClick={()=> deleteRoom(r.id)}>Delete</button></div>
          </div>
        ))}
        {rooms.length===0 && <div className="muted">No rooms yet.</div>}
      </div>
    </section>
  );
}
