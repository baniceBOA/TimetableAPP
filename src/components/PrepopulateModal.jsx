
// File: src/components/PrepopulateModal.jsx

import * as React from "react";
import {
  Autocomplete,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { DAYS, START_HOUR, END_HOUR } from "../constants";
import { toMinutes } from "../utils/time";
import { suggestFreeSlots } from "../utils/freeSlots";
import { getConstraintMessages } from "../utils/constraintMessages";
import { usePreset } from "../utils/presentStore.js";
import { useSubjects } from "../utils/subjectsStore";

function minutesToHHMM(mins) {
  const m = Math.max(0, Math.min(23 * 60 + 59, mins | 0));
  const h = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${h}:${mm}`;
}

/**
 * Props:
 * - open, onClose
 * - teachers[], rooms[], events[]
 * - onRun(accepted, rejected)
 * - constraints, teacherConstraints, limitsEnabled, timeConstraints
 */
export default function PrepopulateModal({
  open,
  onClose,
  onRun,
  teachers = [],
  rooms = [],
  events = [],
  constraints = [],
  teacherConstraints = [],
  limitsEnabled = { teacherLimits: true, roomLimits: true },
  timeConstraints = { teacherUnavailable: [], subjectWindows: [] },
}) {
  const [preset, presetApi] = usePreset();
  const [subjects] = useSubjects();

  const [strategy, setStrategy] = React.useState("fixed");
  const [teacherId, setTeacherId] = React.useState(preset?.teacherId || teachers[0]?.id || "");
  const [roomId, setRoomId] = React.useState(preset?.roomId || rooms[0]?.id || "");
  const [subject, setSubject] = React.useState(preset?.subject || "");
  const [duration, setDuration] = React.useState(60);
  const [startTime, setStartTime] = React.useState("10:00");
  const [daysPicked, setDaysPicked] = React.useState([1, 3, 5]);
  const [count, setCount] = React.useState(10);
  const [startDayIndex, setStartDayIndex] = React.useState(0);

  const reset = React.useCallback(() => {
    setStrategy("fixed");
    setTeacherId(preset?.teacherId || teachers[0]?.id || "");
    setRoomId(preset?.roomId || rooms[0]?.id || "");
    setSubject(preset?.subject || "");
    setDuration(60);
    setStartTime("10:00");
    setDaysPicked([1, 3, 5]);
    setCount(10);
    setStartDayIndex(0);
  }, [preset, teachers, rooms]);

  React.useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const toggleDay = (i) => setDaysPicked((list) => (list.includes(i) ? list.filter((d) => d !== i) : [...list, i].sort()));

  const computeCandidates = React.useCallback(() => {
    const teacher = teacherId || null;
    const room = roomId || null;
    const len = Math.max(15, Number(duration) || 60);
    const candidates = [];

    if (strategy === "fixed") {
      for (const dayIndex of daysPicked) {
        const sMin = toMinutes(startTime);
        if (isNaN(sMin)) continue;
        const eMin = sMin + len;
        const dayStart = START_HOUR * 60;
        const dayEnd = END_HOUR * 60;
        if (sMin < dayStart || eMin > dayEnd) continue;
        candidates.push({
          title: subject || "Lesson",
          area: subject || "",
          dayIndex,
          start: minutesToHHMM(sMin),
          end: minutesToHHMM(eMin),
          teacherId: teacher || "",
          roomId: room || "",
          classSize: 0,
        });
      }
    } else {
      const raw = suggestFreeSlots({
        events,
        teacherId: teacher,
        roomId: room,
        dayIndex: startDayIndex,
        classLenMins: len,
        limit: Number(count) || 10,
      });
      for (const s of raw) {
        candidates.push({
          title: subject || "Lesson",
          area: subject || "",
          dayIndex: s.dayIndex,
          start: s.start,
          end: s.end,
          teacherId: teacher || "",
          roomId: room || "",
          classSize: 0,
        });
      }
    }

    return candidates;
  }, [strategy, teacherId, roomId, subject, duration, startTime, daysPicked, events, startDayIndex]);

  const run = React.useCallback(() => {
    presetApi.set({ teacherId, roomId, subject });

    const candidates = computeCandidates();
    const accepted = [];
    const rejected = [];

    for (const nextEvent of candidates) {
      const { blocked, messages } = getConstraintMessages({
        nextEvent,
        state: { limitsEnabled, constraints, teacherConstraints, rooms, teachers, events, timeConstraints },
      });
      if (blocked) {
        rejected.push({ nextEvent, messages });
      } else {
        accepted.push(nextEvent);
      }
    }

    onRun?.(accepted, rejected);
    onClose?.();
  }, [presetApi, teacherId, roomId, subject, computeCandidates, onRun, onClose, limitsEnabled, constraints, teacherConstraints, rooms, teachers, events, timeConstraints]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        Prepopulate Timetable
        <IconButton aria-label="close" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Choose a teacher, room, and subject, then select a strategy to generate multiple lessons. Press <strong>Run</strong> to add them.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <TextField select label="Teacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} fullWidth>
              {teachers.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </TextField>

            <TextField select label="Room" value={roomId} onChange={(e) => setRoomId(e.target.value)} fullWidth>
              {rooms.map((r) => (
                <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
              ))}
            </TextField>
          </Stack>

          <Autocomplete
            options={subjects}
            value={subject || ""}
            onChange={(_, v) => setSubject(v || "")}
            freeSolo
            renderInput={(params) => (
              <TextField {...params} label="Subject" placeholder="Select or type a subject" fullWidth />
            )}
          />

          <TextField select label="Strategy" value={strategy} onChange={(e) => setStrategy(e.target.value)} sx={{ maxWidth: 240 }}>
            <MenuItem value="fixed">Fixed time (selected days)</MenuItem>
            <MenuItem value="autofill">Auto-fill next free slots</MenuItem>
          </TextField>

          {strategy === "fixed" ? (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                <TextField type="time" label="Start time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                <TextField type="number" label="Duration (min)" value={duration} onChange={(e) => setDuration(e.target.value)} inputProps={{ min: 15, step: 5 }} />
              </Stack>

              <FormGroup row sx={{ flexWrap: "wrap" }}>
                {DAYS.map((d, i) => (
                  <FormControlLabel key={d} control={<Checkbox checked={daysPicked.includes(i)} onChange={() => toggleDay(i)} />} label={d} sx={{ mr: 1 }} />
                ))}
              </FormGroup>
            </>
          ) : (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                <TextField type="number" label="How many lessons?" value={count} onChange={(e) => setCount(e.target.value)} inputProps={{ min: 1, step: 1 }} />
                <TextField type="number" label="Duration (min)" value={duration} onChange={(e) => setDuration(e.target.value)} inputProps={{ min: 15, step: 5 }} />
                <TextField select label="Start day" value={startDayIndex} onChange={(e) => setStartDayIndex(Number(e.target.value))} sx={{ minWidth: 160 }}>
                  {DAYS.map((d, i) => (
                    <MenuItem key={d} value={i}>{d}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Auto-fill uses your current events and constraints to find the next available slots.
              </Typography>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={run}>Run</Button>
      </DialogActions>
    </Dialog>
  );
}
