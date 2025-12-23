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
import { conflictsForTeacher, conflictsForRoom, checkRoomCapacity } from "../../utils/conflict";

export default function AddClassModal({
  open,
  onClose,
  onSave,    // (newEvent) => void
  limitsEnabled,        
  teachers = [],
  rooms = [],
  events = [],
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
    }
  }, [open, teachers, rooms]);

  function save() {
    const title = form.title.trim();
    if (!title) { alert("Title is required."); return; }
    if (!form.start || !form.end || form.start >= form.end) { alert("Invalid time range."); return; }

    // Conflicts
    const tConf = conflictsForTeacher(events, form.teacherId, form.dayIndex, form.start, form.end, null);
    if (tConf.length) { alert("Teacher has a time conflict."); return; }

    const rConf = conflictsForRoom(events, form.roomId, form.dayIndex, form.start, form.end, null);
    if (rConf.length) { alert("Room is already booked."); return; }

    // Capacity
    const size = Number(form.classSize || 0);
    const cap = checkRoomCapacity({ rooms, roomId: form.roomId, requiredSize: size });
    if (!cap.ok) { alert(cap.message); return; }

    onSave?.({
      title,
      area: (form.area || "").trim(),
      dayIndex: Number(form.dayIndex),
      start: form.start,
      end: form.end,
      teacherId: form.teacherId || "",
      roomId: form.roomId || "",
      classSize: size,
      color: "#2d8cff", // will be overwritten by your random color, if desired
    });
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add class</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Subject"
            value={form.area}
            onChange={(e) => setForm(f => ({ ...f, area: e.target.value }))}
            fullWidth
          />

          <Stack direction="row" spacing={1.5}>
            <TextField
              select
              label="Day"
              value={form.dayIndex}
              onChange={(e) => setForm(f => ({ ...f, dayIndex: Number(e.target.value) }))}
              sx={{ minWidth: 160 }}
            >
              {DAYS.map((d, i) => <MenuItem key={d} value={i}>{d}</MenuItem>)}
            </TextField>
            <TextField
              type="time"
              label="Start"
              value={form.start}
              onChange={(e) => setForm(f => ({ ...f, start: e.target.value }))}
            />
            <TextField
              type="time"
              label="End"
              value={form.end}
              onChange={(e) => setForm(f => ({ ...f, end: e.target.value }))}
            />
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <TextField
              select
              label="Teacher"
              value={form.teacherId}
              onChange={(e) => setForm(f => ({ ...f, teacherId: e.target.value }))}
              sx={{ minWidth: 220 }}
            >
              {teachers.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </TextField>
            <TextField
              select
              label="Room"
              value={form.roomId}
              onChange={(e) => setForm(f => ({ ...f, roomId: e.target.value }))}
              sx={{ minWidth: 220 }}
            >
              {rooms.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
            </TextField>
          </Stack>

          <TextField
            type="number"
            label="Class size (optional)"
            value={form.classSize}
            onChange={(e) => setForm(f => ({ ...f, classSize: e.target.value }))}
            sx={{ maxWidth: 180 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}