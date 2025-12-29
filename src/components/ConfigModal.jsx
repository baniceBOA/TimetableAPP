// File: src/components/ConfigModal.jsx
// Responsive MUI modal to edit: Days, Start/End, Slots per hour OR Duration.

import * as React from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useConfig, getTotalCols } from "../utils/configStore.js";

// Suggested day names to help the user
const DAY_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ConfigModal({ open, onClose }) {
  const { config, savePartial, resetConfig } = useConfig();

  // local draft state
  const [days, setDays] = React.useState(config.days);
  const [startHour, setStartHour] = React.useState(config.startHour);
  const [endHour, setEndHour] = React.useState(config.endHour);
  const [mode, setMode] = React.useState("duration"); // 'duration' | 'slots'
  const [slotsPerHour, setSlotsPerHour] = React.useState(config.slotsPerHour);
  const [durationMin, setDurationMin] = React.useState(config.lessonDurationMin);
  const [errors, setErrors] = React.useState([]);

  React.useEffect(() => {
    if (open) {
      setDays(config.days);
      setStartHour(config.startHour);
      setEndHour(config.endHour);
      setSlotsPerHour(config.slotsPerHour);
      setDurationMin(config.lessonDurationMin);
      setMode("duration");
      setErrors([]);
    }
  }, [open, config]);

  function up(i) {
    if (i <= 0) return;
    setDays((arr) => {
      const a = arr.slice();
      [a[i - 1], a[i]] = [a[i], a[i - 1]];
      return a;
    });
  }
  function down(i) {
    setDays((arr) => {
      if (i >= arr.length - 1) return arr;
      const a = arr.slice();
      [a[i + 1], a[i]] = [a[i], a[i + 1]];
      return a;
    });
  }
  function removeAt(i) {
    setDays((arr) => arr.filter((_, idx) => idx !== i));
  }
  function addDay(name) {
    const n = String(name || "").trim();
    if (!n) return;
    setDays((arr) => (arr.includes(n) ? arr : [...arr, n]));
  }

  function validate() {
    const errs = [];
    if (!Array.isArray(days) || days.length === 0) errs.push("At least one day is required.");
    const s = clampInt(startHour, 0, 23);
    const e = clampInt(endHour, 1, 24);
    if (e <= s) errs.push("End hour must be greater than Start hour.");
    if (mode === "slots") {
      const sph = clampInt(slotsPerHour, 1, 12);
      if (sph < 1) errs.push("Slots per hour must be ≥ 1.");
    } else {
      const d = clampInt(durationMin, 5, 360);
      if (d < 5) errs.push("Lesson duration is too small.");
      if (60 % d !== 0) errs.push("Lesson duration must divide 60 evenly (e.g., 10, 12, 15, 20, 30).");
    }
    return errs;
  }

  function save() {
    const errs = validate();
    setErrors(errs);
    if (errs.length) return;

    let sph = slotsPerHour;
    let dur = durationMin;
    if (mode === "duration") {
      dur = clampInt(dur, 5, 360);
      sph = Math.max(1, Math.round(60 / dur));
      // enforce divisibility
      dur = Math.floor(60 / sph);
    } else {
      sph = clampInt(sph, 1, 12);
      dur = Math.floor(60 / sph);
    }

    savePartial({
      days: days.map(String),
      startHour: clampInt(startHour, 0, 23),
      endHour: clampInt(endHour, 1, 24),
      slotsPerHour: sph,
      lessonDurationMin: dur,
    });

    onClose?.();
  }

  const previewCols = getTotalCols({
    ...config,
    days,
    startHour,
    endHour,
    slotsPerHour: mode === "slots" ? clampInt(slotsPerHour, 1, 12) : Math.max(1, Math.round(60 / clampInt(durationMin, 5, 360))),
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 7 }}>
        Timetable settings
        <Tooltip title="Reset to defaults">
          <IconButton
            onClick={() => {
              resetConfig();
              onClose?.();
            }}
            sx={{ position: "absolute", right: 48, top: 8 }}
          >
            <RestartAltIcon />
          </IconButton>
        </Tooltip>
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {/* Days editor */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>Days</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Autocomplete
                freeSolo
                options={DAY_OPTIONS.filter(o => !days.includes(o))}
                onChange={(_, v) => addDay(v)}
                renderInput={(params) => (
                  <TextField {...params} label="Add day" placeholder="e.g., Mon" />
                )}
                sx={{ width: 220 }}
              />
              <Button startIcon={<AddIcon />} onClick={() => addDay("New Day")}>Add</Button>
            </Stack>

            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {days.map((d, i) => (
                <Stack key={`${d}-${i}`} direction="row" spacing={1} alignItems="center">
                  <Chip label={d} />
                  <IconButton size="small" onClick={() => up(i)} disabled={i === 0}><ArrowUpwardIcon fontSize="inherit" /></IconButton>
                  <IconButton size="small" onClick={() => down(i)} disabled={i === days.length - 1}><ArrowDownwardIcon fontSize="inherit" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => removeAt(i)}><DeleteIcon fontSize="inherit" /></IconButton>
                </Stack>
              ))}
              {days.length === 0 && <Typography color="text.secondary">No days defined.</Typography>}
            </Stack>
          </Box>

          <Divider />

          {/* Hours */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <TextField
              type="number"
              label="Start hour"
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              inputProps={{ min: 0, max: 23 }}
              sx={{ minWidth: 160 }}
            />
            <TextField
              type="number"
              label="End hour"
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
              inputProps={{ min: 1, max: 24 }}
              sx={{ minWidth: 160 }}
            />
          </Stack>

          {/* Granularity */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>Time granularity</Typography>
            <RadioGroup
              row
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              sx={{ mb: 1 }}
            >
              <FormControlLabel value="duration" control={<Radio />} label="Duration per lesson" />
              <FormControlLabel value="slots" control={<Radio />} label="Slots per hour" />
            </RadioGroup>

            {mode === "duration" ? (
              <TextField
                type="number"
                label="Duration per lesson (minutes)"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                inputProps={{ min: 5, step: 5 }}
                sx={{ maxWidth: 260 }}
                helperText="Must divide 60 evenly (e.g., 10, 12, 15, 20, 30)."
              />
            ) : (
              <TextField
                type="number"
                label="Slots per hour"
                value={slotsPerHour}
                onChange={(e) => setSlotsPerHour(e.target.value)}
                inputProps={{ min: 1, max: 12 }}
                sx={{ maxWidth: 260 }}
                helperText="1=60m, 2=30m, 3=20m, 4=15m, 5=12m, 6=10m…"
              />
            )}
          </Box>

          {/* Preview */}
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Preview: {days.length} day(s) · {startHour}:00 → {endHour}:00 · {mode === "duration" ? `${Math.floor(60 / Math.max(1, Math.round(60 / Math.max(5, durationMin))))} slots/hour` : `${Math.max(1, slotsPerHour)} slots/hour`} · Columns ≈ {previewCols}
            </Typography>
          </Box>

          {/* Errors */}
          {errors.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {errors.map((m, i) => (
                <Typography key={i} color="error" variant="body2">• {m}</Typography>
              ))}
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={save}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

function clampInt(n, min, max) {
  const x = Number.isFinite(+n) ? Math.floor(+n) : min;
  return Math.max(min, Math.min(max, x));
}