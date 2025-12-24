import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { DAYS } from "../../constants";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import {  filterSuggestionsByTime } from "../../utils/timeConstraints";
import { suggestFreeSlots } from "../../utils/freeSlots";
import Alert from "@mui/material/Alert";
import ConstraintErrorBar from "../ConstraintErrorBar.jsx";
import { getConstraintMessages } from "../../utils/constraintMessages";


export default function AddClassModal({
  open,
  onClose,
  onSave,
  teachers = [],
  rooms = [],
  events = [],
  // optional constraints (if you want to block weekly limits here too)
  constraints = [],
  teacherConstraints = [],
  limitsEnabled = { teacherLimits: true, roomLimits: true },
  freeSlotsEnabled = true,
  timeConstraints = { teacherUnavailable: [], subjectWindows: [] },
}) {
  const [form, setForm] = React.useState({
    title: "",
    area: "",
    dayIndex: 0,
    start: "09:00",
    end: "10:00",
    teacherId: teachers[0]?.id || "",
    roomId: rooms[0]?.id || "",
    classSize: "",
  });
  const [suggestions, setSuggestions] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(!!freeSlotsEnabled);
  const [errors, setErrors] = React.useState([]);
  const [showBar, setShowBar] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm({
        title: "",
        area: "",
        dayIndex: 0,
        start: "09:00",
        end: "10:00",
        teacherId: teachers[0]?.id || "",
        roomId: rooms[0]?.id || "",
        classSize: "",
      });
      setSuggestions([]);
      setShowSuggestions(!!freeSlotsEnabled);
    }
  }, [open, teachers, rooms, freeSlotsEnabled]);

  // Refresh suggestions whenever relevant inputs change
  React.useEffect(() => {
    if (!showSuggestions) {
      setSuggestions([]);
      return;
    }
    const lenMinutes =
      (parseInt(form.end.slice(0, 2), 10) * 60 + parseInt(form.end.slice(3, 5), 10)) -
      (parseInt(form.start.slice(0, 2), 10) * 60 + parseInt(form.start.slice(3, 5), 10));

    const raw = suggestFreeSlots({
      events,
      teacherId: form.teacherId || null,
      roomId: form.roomId || null,
      dayIndex: form.dayIndex,
      classLenMins: Math.max(30, lenMinutes),
      limit: 10,
    });
    const filtered = filterSuggestionsByTime(timeConstraints, (form.area || "").trim(), form.teacherId, form.dayIndex, raw);
   setSuggestions(filtered.slice(0, 10));
  }, [form.dayIndex, form.teacherId, form.roomId, form.start, form.end, freeSlotsEnabled, showSuggestions, events,timeConstraints]);

  function save() {
    const title = form.title.trim();
    if (!title) {
      setErrors(["Title is required."]); setShowBar(true);
      return;
    }
    if (!form.start || !form.end || form.start >= form.end) {
      
      setErrors(["Invalid time range (Start must be before End)."]); setShowBar(true);
      return;
    }

    const next = {
      title,
      area: (form.area || "").trim(),
      dayIndex: Number(form.dayIndex),
      start: form.start,
      end: form.end,
      teacherId: form.teacherId || "",
      roomId: form.roomId || "",
      classSize: Number(form.classSize || 0),
    };
    
   // Aggregate all constraint messages
  const { blocked, messages } = getConstraintMessages({
         nextEvent: next,
     state: { limitsEnabled, constraints, teacherConstraints, rooms, teachers, events, timeConstraints }
  });
  if (blocked) {
    setErrors(messages);
    setShowBar(true);
     return;
  }
    


    onSave?.(next);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {errors.length > 0 && (
     <Alert severity="error" sx={{ mb: 1 }}>
       <ul style={{ margin: 0, paddingLeft: 18 }}>
         {errors.map((m, i) => <li key={i}>{m}</li>)}
       </ul>
     </Alert>
   )}
      <DialogTitle>Add class</DialogTitle>
      <DialogContent>
        <Stack spacing={1.25} sx={{ mt: 0.5 }}>

          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Subject"
            value={form.area}
            onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            fullWidth
          />

          <Stack direction="row" spacing={1.25}>
            <TextField
              select
              label="Day"
              value={form.dayIndex}
              onChange={(e) => setForm((f) => ({ ...f, dayIndex: Number(e.target.value) }))}
              sx={{ minWidth: 160 }}
            >
              {DAYS.map((d, i) => (
                <MenuItem key={d} value={i}>
                  {d}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="time"
              label="Start"
              value={form.start}
              onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
            />
            <TextField
              type="time"
              label="End"
              value={form.end}
              onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
            />
          </Stack>

          <Stack direction="row" spacing={1.25}>
            <TextField
              select
              label="Teacher"
              value={form.teacherId}
              onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
              sx={{ minWidth: 220 }}
            >
              {teachers.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Room"
              value={form.roomId}
              onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
              sx={{ minWidth: 220 }}
            >
              {rooms.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField
            type="number"
            label="Class size (optional)"
            value={form.classSize}
            onChange={(e) => setForm((f) => ({ ...f, classSize: e.target.value }))}
            sx={{ maxWidth: 180 }}
          />
          {/* NEW: in-modal switch to show/hide suggestions */}
          <FormControlLabel
            control={
              <Switch
                checked={showSuggestions}
               onChange={(e) => setShowSuggestions(e.target.checked)}
              />
            }
            label="Show free slot suggestions"
          />

          {/* Suggestions panel (only when enabled and available) */}
          {showSuggestions && suggestions.length > 0 &&  (
            <div className="panel" style={{ marginTop: 8 }}>
              <strong>Suggested free slots</strong>
              <div className="list" style={{ marginTop: 8 }}>
                {suggestions.map((s, idx) => (
                  <div key={idx} className="list-item" style={{ justifyContent: "space-between" }}>
                    <div className="muted small">
                      {DAYS[s.dayIndex]} • {s.start}–{s.end}
                    </div>
                    <button
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          dayIndex: s.dayIndex,
                          start: s.start,
                          end: s.end,
                        }))
                      }
                    >
                      Use
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>
          Save
        </Button>
      </DialogActions>
      <ConstraintErrorBar open={showBar} onClose={() => setShowBar(false)} messages={errors} />
    </Dialog>
  );
}