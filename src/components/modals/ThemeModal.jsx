// src/components/modals/ThemeModal.jsx
import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Stack from "@mui/material/Stack";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { makeTheme } from "../../theme/makeTheme";

/**
 * Theme customization modal with a built-in live preview.
 * The preview uses a temporary theme generated from the current form values.
 */
export default function ThemeModal({ open, onClose, value, onSave }) {
  const defaults = {
    mode: "dark",
    primary: "#2D8CFF",
    secondary: "#59C173",
    backgroundDefault: "#0F172A",
    backgroundPaper: "#0B1220",
    textPrimary: "#E5E7EB",
    textSecondary: "#94A3B8",
    borderRadius: 12,
    typographyScale: 1.0,
    _previewTitle: "Timetable",
    _previewSubtitle: "Weekly schedule",
  };

  const [form, setForm] = React.useState({ ...defaults, ...(value || {}) });

  React.useEffect(() => {
    if (open) setForm({ ...defaults, ...(value || {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Build a temporary preview theme based on current form values
  const previewTheme = React.useMemo(() => makeTheme(form), [form]);

  // A compact utility cell for the mini timetable preview
  function TimetableCell({ label, highlight = false }) {
    return (
      <Box
        sx={(theme) => ({
          border: `1px solid ${theme.palette.divider}`,
          display: "grid",
          placeItems: "center",
          fontSize: 12 * (form.typographyScale || 1),
          color: theme.palette.text.primary,
          bgcolor: highlight ? "primary.main" : "background.paper",
          opacity: highlight ? 0.18 : 1,
          p: 0.5,
          borderRadius: theme.shape.borderRadius / 4,
        })}
      >
        {label}
      </Box>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Theme customization</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {/* Controls */}
          <Grid item xs={12} md={6}>
            <FormGroup sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={(form.mode || "dark") === "dark"}
                    onChange={(e) => update("mode", e.target.checked ? "dark" : "light")}
                  />
                }
                label="Dark mode"
              />
            </FormGroup>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Palette
            </Typography>
            <div style={{ display: "grid", gap: 10 }}>
              <label>
                Primary color
                <input
                  type="color"
                  value={form.primary || "#2D8CFF"}
                  onChange={(e) => update("primary", e.target.value)}
                  style={{ marginLeft: 8 }}
                />
              </label>
              <label>
                Secondary color
                <input
                  type="color"
                  value={form.secondary || "#59C173"}
                  onChange={(e) => update("secondary", e.target.value)}
                  style={{ marginLeft: 8 }}
                />
              </label>
              <label>
                Background (default)
                <input
                  type="color"
                  value={
                    form.backgroundDefault ||
                    (form.mode === "light" ? "#F5F7FA" : "#0F172A")
                  }
                  onChange={(e) => update("backgroundDefault", e.target.value)}
                  style={{ marginLeft: 8 }}
                />
              </label>
              <label>
                Background (paper)
                <input
                  type="color"
                  value={
                    form.backgroundPaper ||
                    (form.mode === "light" ? "#FFFFFF" : "#0B1220")
                  }
                  onChange={(e) => update("backgroundPaper", e.target.value)}
                  style={{ marginLeft: 8 }}
                />
              </label>
              <label>
                Text (primary)
                <input
                  type="color"
                  value={
                    form.textPrimary || (form.mode === "light" ? "#0B1220" : "#E5E7EB")
                  }
                  onChange={(e) => update("textPrimary", e.target.value)}
                  style={{ marginLeft: 8 }}
                />
              </label>
              <label>
                Text (secondary)
                <input
                  type="color"
                  value={
                    form.textSecondary || (form.mode === "light" ? "#4B5563" : "#94A3B8")
                  }
                  onChange={(e) => update("textSecondary", e.target.value)}
                  style={{ marginLeft: 8 }}
                />
              </label>
            </div>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Layout & Typography
            </Typography>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <Typography variant="body2">
                  Border radius: {form.borderRadius ?? 12}px
                </Typography>
                <Slider
                  value={form.borderRadius ?? 12}
                  min={0}
                  max={20}
                  step={1}
                  onChange={(_, v) => update("borderRadius", v)}
                />
              </div>
              <div>
                <Typography variant="body2">
                  Typography scale: {form.typographyScale ?? 1.0}
                </Typography>
                <Slider
                  value={form.typographyScale ?? 1.0}
                  min={0.85}
                  max={1.3}
                  step={0.01}
                  onChange={(_, v) => update("typographyScale", Number(v))}
                />
              </div>
              <TextField
                label="Preview title"
                size="small"
                value={form._previewTitle || "Timetable"}
                onChange={(e) => update("_previewTitle", e.target.value)}
              />
              <TextField
                label="Preview subtitle"
                size="small"
                value={form._previewSubtitle || "Weekly schedule"}
                onChange={(e) => update("_previewSubtitle", e.target.value)}
              />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                (Preview values simulate how text looks in the header.)
              </Typography>
            </div>
          </Grid>

          {/* Live Preview (isolated ThemeProvider) */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Live preview
            </Typography>

            <ThemeProvider theme={previewTheme}>
              <CssBaseline />
              <Box
                sx={(theme) => ({
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  overflow: "hidden",
                  bgcolor: "background.default",
                })}
              >
                {/* Header preview */}
                <AppBar position="static" color="primary" elevation={0}>
                  <Toolbar
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      minHeight: 56,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" noWrap>
                        {form._previewTitle || "Timetable"}
                      </Typography>
                      <Typography variant="subtitle2" noWrap sx={{ opacity: 0.85 }}>
                        {form._previewSubtitle || "Weekly schedule"}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="contained" color="secondary">
                        Action
                      </Button>
                      <Button size="small" variant="outlined" color="inherit">
                        More
                      </Button>
                    </Stack>
                  </Toolbar>
                </AppBar>

                {/* Body preview */}
                <Box sx={{ p: 1.5 }}>
                  {/* Chips */}
                  <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
                    <Chip label="Mathematics" color="primary" variant="outlined" />
                    <Chip label="Biology" color="secondary" variant="outlined" />
                    <Chip label="Physics" variant="outlined" />
                  </Stack>

                  {/* Panel card */}
                  <Paper
                    variant="outlined"
                    sx={(theme) => ({
                      p: 1.25,
                      mb: 1.5,
                      borderRadius: theme.shape.borderRadius,
                    })}
                  >
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Panel preview (uses paper background & divider)
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained">Primary</Button>
                      <Button variant="outlined">Outlined</Button>
                      <Button variant="text" color="secondary">
                        Secondary
                      </Button>
                    </Stack>
                  </Paper>

                  {/* Mini timetable grid */}
                  <Typography variant="body2" sx={{ mb: 0.75 }}>
                    Mini timetable preview
                  </Typography>
                  <Box
                    sx={(theme) => ({
                      display: "grid",
                      gridTemplateColumns: "80px repeat(6, 1fr)",
                      gap: 0.5,
                      alignItems: "stretch",
                      "& .day": {
                        fontWeight: 600,
                        color: theme.palette.text.secondary,
                      },
                    })}
                  >
                    {/* Header row */}
                    <Box />
                    {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"].map((t) => (
                      <TimetableCell key={t} label={t} />
                    ))}

                    {/* A couple of days */}
                    {["Mon", "Tue"].map((d, rowIdx) => (
                      <React.Fragment key={d}>
                        <Box className="day" sx={{ display: "grid", placeItems: "center" }}>
                          {d}
                        </Box>
                        {/* Cells with a couple of highlighted slots */}
                        {[0, 1, 2, 3, 4, 5].map((c) => (
                          <TimetableCell
                            key={`${d}-${c}`}
                            label=""
                            highlight={(rowIdx === 0 && (c === 1 || c === 2)) || (rowIdx === 1 && c === 4)}
                          />
                        ))}
                      </React.Fragment>
                    ))}
                  </Box>
                </Box>
              </Box>
            </ThemeProvider>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave?.(form)}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}