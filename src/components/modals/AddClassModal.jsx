
// File: src/components/AddClassModal.jsx
// Updated to use shared subjects store and preset auto-fill

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import IconButton from "@mui/material/IconButton";
import AddIcon from '@mui/icons-material/Add';

//import { DAYS } from "../constants";
import { useConfig } from "../../utils/configStore.js";
import ConstraintErrorBar from "../ConstraintErrorBar.jsx";
import { filterSuggestionsByTime, checkSubjectTime } from "../../utils/timeConstraints";
import { suggestFreeSlots } from "../../utils/freeSlots";
import { getConstraintMessages } from "../../utils/constraintMessages";
import { useSubjects } from "../../utils/subjectsStore";
import { usePreset } from  "../../utils/presentStore.js";

const toMinutes = (hhmm) => {
  if (!hhmm || typeof hhmm !== "string" || !/^\d{2}:\d{2}$/.test(hhmm)) return NaN;
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  if (h < 0 || h > 23 || m < 0 || m > 59) return NaN;
  return h * 60 + m;
};
const minutesToHHMM = (mins) => {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, mins | 0));
  const h = String(Math.floor(clamped / 60)).padStart(2, "0");
  const m = String(clamped % 60).padStart(2, "0");
  return `${h}:${m}`;
};

export default function AddClassModal({
  open,
  onClose,
  onSave,
  teachers = [],
  rooms = [],
  events = [],
  constraints = [],
  teacherConstraints = [],
  limitsEnabled = { teacherLimits: true, roomLimits: true },
  freeSlotsEnabled = true,
  timeConstraints = { teacherUnavailable: [], subjectWindows: [] },
  subjects: propSubjects = null,
  initialValues,
}) {
  const [storeSubjects, subjectsApi] = useSubjects();
  const subjects = Array.isArray(propSubjects) && propSubjects.length > 0 ? propSubjects : storeSubjects;
  const [preset, presetApi] = usePreset();
  const _cfg = useConfig();
  const DAYS = (_cfg && _cfg.config && _cfg.config.days) ? _cfg.config.days : (_cfg && _cfg.days) ? _cfg.days : ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const [form, setForm] = React.useState({
    title: "",
    area: "",
    dayIndex: 0,
    start: "09:00",
    end: "10:00",
    teacherId: teachers[0]?.id || "",
    teacherIds: teachers[0]?.id ? [teachers[0].id] : [],
    roomId: rooms[0]?.id || "",
    classSize: "",
  });
  const [suggestions, setSuggestions] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(!!freeSlotsEnabled);
  const [errors, setErrors] = React.useState([]);
  const [showBar, setShowBar] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const base = {
        title: "",
        area: "",
        dayIndex: 0,
        start: "09:00",
        end: "10:00",
        teacherId: teachers[0]?.id || "",
        teacherIds: teachers[0]?.id ? [teachers[0].id] : [],
        roomId: rooms[0]?.id || "",
        classSize: "",
      };
      const init = initialValues ? { ...base, ...initialValues } : {
        ...base,
        teacherId: preset?.teacherId && teachers.some(t => t.id === preset.teacherId)
          ? preset.teacherId : base.teacherId,
        roomId: preset?.roomId && rooms.some(r => r.id === preset.roomId)
          ? preset.roomId : base.roomId,
        area: preset?.subject || "",
      };
      setForm(init);
      setSuggestions([]);
      setShowSuggestions(!!freeSlotsEnabled);
      setErrors([]);
      setShowBar(false);
    }
  }, [open, initialValues, preset, teachers, rooms, freeSlotsEnabled]);

  // Live subject time-window check
  const [subjectTimeWarning, setSubjectTimeWarning] = React.useState(null);
  React.useEffect(() => {
    if (!form || !(form.area || "").trim()) { setSubjectTimeWarning(null); return; }
    const ev = {
      area: (form.area || "").trim(),
      dayIndex: Number(form.dayIndex),
      start: form.start,
      end: form.end,
    };
    const res = checkSubjectTime(timeConstraints, ev);
    if (res && res.blocked) {
      const rule = res.rule || {};
      if (rule.mode === 'allow' && rule.windows) {
        const txt = `Subject allowed only in windows: ${rule.windows.map(w=> `${w.start}-${w.end}`).join(', ')}`;
        setSubjectTimeWarning(txt);
      } else if (rule.mode === 'forbid') {
        const txt = `Subject forbidden during ${rule.start}-${rule.end}`;
        setSubjectTimeWarning(txt);
      } else if (rule.mode === 'allow') {
        setSubjectTimeWarning('Subject has restricted allowed windows on this day.');
      } else {
        setSubjectTimeWarning('Subject has time restrictions for this day/time.');
      }
    } else {
      setSubjectTimeWarning(null);
    }
  }, [form.area, form.dayIndex, form.start, form.end, timeConstraints]);

  // Filter subjects when teachers are chosen: if selected teacher(s) have non-empty
  // `areas`, only show subjects allowed by all selected teachers (intersection).
  const filteredSubjects = React.useMemo(() => {
    const all = Array.isArray(subjects) ? subjects.slice() : [];
    const tids = Array.isArray(form.teacherIds) ? form.teacherIds : (form.teacherId ? [form.teacherId] : []);
    if (!tids || tids.length === 0) return all;
    let result = all;
    for (const tid of tids) {
      const t = (teachers || []).find(x => x.id === tid);
      if (t && Array.isArray(t.areas) && t.areas.length > 0) {
        const allowed = new Set(t.areas.map(a => String(a).trim()).filter(Boolean));
        result = result.filter(s => allowed.has(String(s)));
      }
    }
    return result;
  }, [form.teacherIds, form.teacherId, teachers, subjects]);

  const duration = React.useMemo(() => {
    const s = toMinutes(form.start);
    const e = toMinutes(form.end);
    return isNaN(s) || isNaN(e) ? NaN : e - s;
  }, [form.start, form.end]);

  React.useEffect(() => {
    if (!showSuggestions) {
      setSuggestions([]);
      return;
    }
    const len = isNaN(duration) ? 60 : Math.max(30, duration);
    const raw = suggestFreeSlots({
      events,
      teacherId: (Array.isArray(form.teacherIds) && form.teacherIds.length === 1) ? form.teacherIds[0] : (form.teacherId || null),
      roomId: form.roomId || null,
      dayIndex: form.dayIndex,
      classLenMins: len,
      limit: 10,
    });
    const filtered = filterSuggestionsByTime(
      timeConstraints,
      (form.area || "").trim(),
      form.teacherId,
      form.dayIndex,
      raw
    );
    setSuggestions(filtered.slice(0, 10));
  }, [form.dayIndex, form.teacherId, form.roomId, form.start, form.end, freeSlotsEnabled, showSuggestions, events, timeConstraints, duration, form.area]);

  function save() {
    const title = form.title.trim();
    if (!form.start || !form.end || form.start >= form.end) {
      setErrors(["Invalid time range (Start must be before End)."]); setShowBar(true); return;
    }

    const next = {
      title: title || (form.area || "").trim(),
      area: (form.area || "").trim(),
      dayIndex: Number(form.dayIndex),
      start: form.start,
      end: form.end,
      teacherId: (Array.isArray(form.teacherIds) && form.teacherIds.length > 0) ? form.teacherIds[0] : (form.teacherId || ""),
      teacherIds: Array.isArray(form.teacherIds) && form.teacherIds.length > 0 ? form.teacherIds.slice() : undefined,
      roomId: form.roomId || "",
      classSize: Number(form.classSize || 0),
    };

    const { blocked, messages } = getConstraintMessages({
      nextEvent: next,
      state: { limitsEnabled, constraints, teacherConstraints, rooms, teachers, events, timeConstraints },
    });
    if (blocked) { setErrors(messages); setShowBar(true); return; }

    // Persist preset for quick future adds
    presetApi.set({ teacherId: next.teacherId, roomId: next.roomId, subject: next.area });

    // Add subject to global store if using storeSubjects
    if ((!Array.isArray(propSubjects) || propSubjects.length === 0) && subjectsApi && next.area) {
      subjectsApi.add(next.area);
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
          <TextField label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} fullWidth />

          <Autocomplete
            options={filteredSubjects}
            value={form.area || ""}
            onChange={(_, v) => setForm((f) => ({ ...f, area: v || "" }))}
            freeSolo
            renderInput={(params) => (
              <TextField {...params} label="Subject" placeholder={subjects.length ? "Select or type a subject" : "Type a subject"} fullWidth />
            )}
          />
          {subjectTimeWarning && (
            <Alert severity="warning">{subjectTimeWarning}</Alert>
          )}

          <Stack direction="row" spacing={1.25}>
            <TextField select label="Day" value={form.dayIndex} onChange={(e) => setForm((f) => ({ ...f, dayIndex: Number(e.target.value) }))} sx={{ minWidth: 160 }}>
              {DAYS.map((d, i) => (
                <MenuItem key={d} value={i}>{d}</MenuItem>
              ))}
            </TextField>
            <TextField type="time" label="Start" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} />
            <TextField type="time" label="End" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} />
          </Stack>

          <Stack direction="row" spacing={1.25}>
            <Autocomplete
              multiple
              options={teachers}
              getOptionLabel={(t) => t.name}
              value={teachers.filter(t => (form.teacherIds || []).includes(t.id))}
              onChange={(_, v) => setForm((f) => ({ ...f, teacherIds: v.map(x => x.id), teacherId: v[0]?.id || "" }))}
              renderInput={(params) => (
                <TextField {...params} label="Teacher(s)" placeholder="Select one or more teachers" sx={{ minWidth: 220 }} />
              )}
            />
            <TextField select label="Room" value={form.roomId} onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))} sx={{ minWidth: 220 }}>
              {rooms.map((r) => (
                <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField type="number" label="Class size (optional)" value={form.classSize} onChange={(e) => setForm((f) => ({ ...f, classSize: e.target.value }))} sx={{ maxWidth: 180 }} />

          <FormControlLabel control={<Switch checked={showSuggestions} onChange={(e) => setShowSuggestions(e.target.checked)} />} label="Show free slot suggestions" />

          {showSuggestions && suggestions.length > 0 && (
            <Paper variant="outlined" sx={{ mt: 1 }}>
              <List dense subheader={<ListSubheader>Suggested free slots</ListSubheader>}>
                {suggestions.map((s, idx) => (
                  <ListItem
                    key={idx}
                    secondaryAction={
                      <IconButton edge="end" aria-label="use" onClick={() => setForm((f) => ({ ...f, dayIndex: s.dayIndex, start: s.start, end: s.end }))}>
                        <AddIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={`${DAYS[s.dayIndex]} • ${s.start}–${s.end}`}
                      secondary={s.roomId ? (rooms.find(r => r.id === s.roomId)?.name || '') : null}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>Save</Button>
      </DialogActions>
      <ConstraintErrorBar open={showBar} onClose={() => setShowBar(false)} messages={errors} />
    </Dialog>
  );
}
