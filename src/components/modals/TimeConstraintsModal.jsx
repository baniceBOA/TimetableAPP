import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import Autocomplete from '@mui/material/Autocomplete';
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import Typography from "@mui/material/Typography";
import { DAYS } from "../../constants";
import { nanoid } from "nanoid";
import { useSubjects } from "../../utils/subjectsStore";

export default function TimeConstraintsModal({
  open,
  onClose,
  teachers = [],
  value = { teacherUnavailable: [], subjectWindows: [] },
  onSave
}) {
  const [tab, setTab] = React.useState(0);
  const [data, setData] = React.useState(value);

  React.useEffect(() => {
    if (open) setData(value || { teacherUnavailable: [], subjectWindows: [] });
  }, [open, value]);

  // Forms
  const [tForm, setTForm] = React.useState({
    teacherId: teachers[0]?.id || "",
    dayIndex: 0,
    start: "14:00",
    end: "16:00",
    note: ""
  });

  const [sForm, setSForm] = React.useState({
    area: "",
    dayIndex: 0,
    start: "08:00",
    end: "13:00",
    mode: "allow",
    note: ""
  });
  const [storeSubjects, subjectsApi] = useSubjects();

  function addTeacherUnavailable() {
    if (!tForm.teacherId || tForm.start >= tForm.end) return;
    const row = { id: nanoid(), ...tForm, dayIndex: Number(tForm.dayIndex) };
    setData(d => ({ ...d, teacherUnavailable: [...(d.teacherUnavailable || []), row] }));
  }
  function delTeacherUnavailable(id) {
    setData(d => ({ ...d, teacherUnavailable: (d.teacherUnavailable || []).filter(x => x.id !== id) }));
  }

  function addSubjectWindow() {
    if (!sForm.area.trim() || sForm.start >= sForm.end) return;
    const row = { id: nanoid(), ...sForm, area: sForm.area.trim(), dayIndex: Number(sForm.dayIndex) };
    setData(d => ({ ...d, subjectWindows: [...(d.subjectWindows || []), row] }));
    // ensure subject exists in global subjects store
    try {
      if (subjectsApi && sForm.area && !storeSubjects.includes(sForm.area.trim())) subjectsApi.add(sForm.area.trim());
    } catch (e) { /* ignore */ }
  }
  function delSubjectWindow(id) {
    setData(d => ({ ...d, subjectWindows: (d.subjectWindows || []).filter(x => x.id !== id) }));
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Time constraints</DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Teacher unavailability" />
          <Tab label="Subject time windows" />
        </Tabs>

        {tab === 0 && (
          <>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
              Add time ranges when a teacher cannot teach.
            </Typography>
            <Stack direction="row" spacing={1.25} sx={{ mb: 1.5, flexWrap: "wrap" }}>
              <TextField
                select label="Teacher" sx={{ minWidth: 220 }}
                value={tForm.teacherId}
                onChange={(e) => setTForm(f => ({ ...f, teacherId: e.target.value }))}
              >
                {teachers.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
              </TextField>
              <TextField
                select label="Day" sx={{ minWidth: 160 }}
                value={tForm.dayIndex}
                onChange={(e) => setTForm(f => ({ ...f, dayIndex: Number(e.target.value) }))}
              >
                {DAYS.map((d, i) => <MenuItem key={d} value={i}>{d}</MenuItem>)}
              </TextField>
              <TextField type="time" label="Start" value={tForm.start} onChange={(e) => setTForm(f => ({ ...f, start: e.target.value }))} />
              <TextField type="time" label="End"   value={tForm.end}   onChange={(e) => setTForm(f => ({ ...f, end: e.target.value }))} />
              <TextField label="Note" value={tForm.note} onChange={(e) => setTForm(f => ({ ...f, note: e.target.value }))} sx={{ minWidth: 220 }} />
              <Button variant="contained" onClick={addTeacherUnavailable}>Add</Button>
            </Stack>

            <List dense>
              {(data.teacherUnavailable || []).map(r => (
                <ListItem
                  key={r.id}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => delTeacherUnavailable(r.id)}><DeleteIcon /></IconButton>
                  }
                >
                  <ListItemText
                    primary={`${DAYS[r.dayIndex]} • ${r.start}–${r.end}`}
                    secondary={`Teacher: ${teachers.find(t => t.id === r.teacherId)?.name || r.teacherId}${r.note ? ` • ${r.note}` : ""}`}
                  />
                </ListItem>
              ))}
              {(data.teacherUnavailable || []).length === 0 && (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>No entries yet.</Typography>
              )}
            </List>
          </>
        )}

        {tab === 1 && (
          <>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
              Add windows when a subject is <b>allowed</b> or explicitly <b>forbidden</b>.
              If any <em>allow</em> windows exist for a day, lessons must fit fully inside one of them.
            </Typography>
            <Stack direction="row" spacing={1.25} sx={{ mb: 1.5, flexWrap: "wrap" }}>
              <Autocomplete
                freeSolo
                options={storeSubjects}
                value={sForm.area}
                onChange={(_, v) => setSForm(f => ({ ...f, area: v || "" }))}
                renderInput={(params) => (
                  <TextField {...params} label="Subject" placeholder={storeSubjects.length ? "Select or type a subject" : "Type a subject"} sx={{ minWidth: 200 }} />
                )}
              />
              <TextField select label="Day" sx={{ minWidth: 160 }} value={sForm.dayIndex} onChange={(e) => setSForm(f => ({ ...f, dayIndex: Number(e.target.value) }))}>
                {DAYS.map((d, i) => <MenuItem key={d} value={i}>{d}</MenuItem>)}
              </TextField>
              <TextField type="time" label="Start" value={sForm.start} onChange={(e) => setSForm(f => ({ ...f, start: e.target.value }))} />
              <TextField type="time" label="End"   value={sForm.end}   onChange={(e) => setSForm(f => ({ ...f, end: e.target.value }))} />
              <TextField select label="Mode" sx={{ minWidth: 160 }} value={sForm.mode} onChange={(e) => setSForm(f => ({ ...f, mode: e.target.value }))}>
                <MenuItem value="allow">Allow only within</MenuItem>
                <MenuItem value="forbid">Forbid (blackout)</MenuItem>
              </TextField>
              <TextField label="Note" value={sForm.note} onChange={(e) => setSForm(f => ({ ...f, note: e.target.value }))} sx={{ minWidth: 220 }} />
              <Button variant="contained" onClick={addSubjectWindow}>Add</Button>
            </Stack>

            <List dense>
              {(data.subjectWindows || []).map(r => (
                <ListItem
                  key={r.id}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => delSubjectWindow(r.id)}><DeleteIcon /></IconButton>
                  }
                >
                  <ListItemText
                    primary={`${r.mode.toUpperCase()} • ${r.area} • ${DAYS[r.dayIndex]} • ${r.start}–${r.end}`}
                    secondary={r.note || ""}
                  />
                </ListItem>
              ))}
              {(data.subjectWindows || []).length === 0 && (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>No entries yet.</Typography>
              )}
            </List>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={() => onSave?.(data)}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}