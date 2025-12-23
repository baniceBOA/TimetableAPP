import { useEffect, useState } from "react";
function fileToDataUrl(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
export default function BrandingModal({ open, onClose, value, onSave }){
  const [schoolName, setSchoolName] = useState(value.schoolName || "School Timetable");
  const [logoDataUrl, setLogoDataUrl] = useState(value.logoDataUrl || "");
  useEffect(()=>{ if(!open) return; setSchoolName(value.schoolName||"School Timetable"); setLogoDataUrl(value.logoDataUrl||""); },[open, value]);
  if(!open) return null;
  return (
    <div className="print-modal-overlay" onMouseDown={(e)=>{ if(e.target.classList.contains('print-modal-overlay')) onClose?.(); }}>
      <div className="print-modal-card" onMouseDown={(e)=> e.stopPropagation()}>
        <header className="print-modal-header"><h3 style={{ margin:0 }}>Branding</h3><div className="controls"><button onClick={onClose}>Close</button></div></header>
        <div style={{ padding:16, display:'grid', gap:12 }}>
          <label className="flex">School name<input value={schoolName} onChange={(e)=> setSchoolName(e.target.value)} placeholder="e.g., Mandera High School" /></label>
          <div style={{ display:'grid', gap:8 }}>
            <label>School logo (PNG/JPG)</label>
            <input type="file" accept="image/png,image/jpeg" onChange={async (e)=>{ const f=e.target.files?.[0]; if(!f) return; if(!/image\/(png|jpe?g)/i.test(f.type)){ alert('Choose PNG/JPG'); return; } const d=await fileToDataUrl(f); setLogoDataUrl(d); }} />
            {logoDataUrl ? (<div style={{ display:'flex', alignItems:'center', gap:12 }}><img src={logoDataUrl} alt="Logo" style={{ height:48, width:'auto', background:'#fff', padding:6, borderRadius:6 }} /><button className="danger" onClick={()=> setLogoDataUrl('')}>Remove logo</button></div>) : <div className="muted small">No logo set</div>}
          </div>
          <div className="actions" style={{ justifyContent:'flex-end', display:'flex', gap:8 }}><button onClick={onClose}>Cancel</button><button className="primary" onClick={()=> onSave({ schoolName: schoolName.trim()||'School Timetable', logoDataUrl })}>Save</button></div>
        </div>
      </div>
    </div>
  );
}
