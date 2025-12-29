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
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

import AddSubjectModal from "./AddSubjectModal.jsx";
import { useSubjects } from "../utils/subjectsStore";
import { stableColorFromString, randomNiceColor } from "../utils/colors";

export default function ManageTeachers({ teachers, addTeacher, updateTeacher, deleteTeacher }) {
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));

  // Shared subjects store
  const [subjects] = useSubjects();

  // Modals
  const [openTeacher, setOpenTeacher] = React.useState(false);
  const [openSubjects, setOpenSubjects] = React.useState(false);

  // Editing state
  const [editing, setEditing] = React.useState(null); // teacher object or null
  const [form, setForm] = React.useState({ name: "", color: "#2d8cff", areas: [] });
  const [errors, setErrors] = React.useState({});

  const nameRef = React.useRef(null);

  // Open Add Teacher modal
  const openAddTeacher = React.useCallback(() => {
    setEditing(null);
    setForm({ name: "", color: "#2d8cff", areas: [] });
    setErrors({});
    setOpenTeacher(true);
  }, []);

  // Open Edit Teacher modal
  const openEditTeacher = React.useCallback((t) => {
    setEditing(t);
    setForm({
      name: t.name ?? "",
      color: t.color ?? "#2d8cff",
      areas: Array.isArray(t.areas) ? t.areas : [],
    });
    setErrors({});
    setOpenTeacher(true);
  }, []);

  const closeTeacher = React.useCallback(() => {
    setOpenTeacher(false);
    setEditing(null);
    setForm({ name: "", color: "#2d8cff", areas: [] });
    setErrors({});
  }, []);

  const validate = React.useCallback((draft) => {
    const next = {};
    if (!draft.name || !draft.name.trim()) next.name = "Name is required.";
    // areas optional: can be empty
    return next;
  }, []);

  const handleSaveTeacher = React.useCallback(
    (e) => {
      e?.preventDefault?.();
      const payload = {
        name: (form.name || "").trim(),
        color:
          (form.name || "").trim()
            ? stableColorFromString((form.name || "").trim())
            : randomNiceColor(),
        areas: Array.isArray(form.areas)
          ? Array.from(new Set(form.areas.map((a) => a.trim()).filter(Boolean)))
          : [],
      };

      const v = validate(payload);
      setErrors(v);
      if (Object.keys(v).length > 0) {
        if (v.name) nameRef.current?.focus();
        return;
      }

      if (editing) {
        updateTeacher?.(editing.id, payload);
      } else {
        addTeacher?.(payload);
      }
      closeTeacher();
    },
    [form, editing, validate, addTeacher, updateTeacher, closeTeacher]
  );

  // Delete teacher
  const handleDeleteTeacher = React.useCallback((id) => deleteTeacher?.(id), [deleteTeacher]);

  // Keyboard save
  const onKeyDown = React.useCallback(
    (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        handleSaveTeacher(e);
      }
    },
    [handleSaveTeacher]
  );

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" component="h2">Manage Teachers</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => setOpenSubjects(true)}>
            Manage subjects
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddTeacher}>
            Add teacher
          </Button>
        </Stack>
      </Stack>

      {/* Responsive list */}
      {isSmUp ? (
        <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
          <Table size="small" aria-label="Teachers">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Subjects</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }} width={140}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teachers.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 12, height: 12, borderRadius: "50%", background: t.color }} />
                      <Typography>{t.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {Array.isArray(t.areas) && t.areas.length > 0 ? (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {t.areas.map((a) => (
                          <Chip key={a} label={a} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </Stack>
                    ) : (
                      <Typography color="text.secondary">No subjects set</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEditTeacher(t)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDeleteTeacher(t.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {teachers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography color="text.secondary">No teachers yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <List sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
          {teachers.map((t, idx) => (
            <React.Fragment key={t.id}>
              <ListItem
                secondaryAction={
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => openEditTeacher(t)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteTeacher(t.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 12, height: 12, borderRadius: "50%", background: t.color }} />
                      <Typography>{t.name}</Typography>
                    </Stack>
                  }
                  secondary={
                    Array.isArray(t.areas) && t.areas.length > 0
                      ? t.areas.join(" • ")
                      : <Typography component="span" color="text.secondary">No subjects set</Typography>
                  }
                />
              </ListItem>
              {idx < teachers.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
          {teachers.length === 0 && (
            <ListItem>
              <ListItemText primary={<Typography color="text.secondary">No teachers yet.</Typography>} />
            </ListItem>
          )}
        </List>
      )}

      {/* --------- Add/Edit Teacher Modal --------- */}
      <Dialog
        open={openTeacher}
        onClose={closeTeacher}
        fullWidth
        maxWidth="sm"
        onKeyDown={onKeyDown}
      >
        <DialogTitle sx={{ pr: 6 }}>
          {editing ? "Edit teacher" : "Add teacher"}
          <IconButton aria-label="close" onClick={closeTeacher} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              inputRef={nameRef}
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Ms. Ahmed"
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name}
            />

            {/* Auto color preview (computed on save); optional keep editable or disabled */}
            <TextField
              label="(Auto) Color"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              type="color"
              disabled
              InputLabelProps={{ shrink: true }}
              helperText="Colors are auto-assigned from name"
            />

            {/* Subjects selection from localStorage store */}
            <Autocomplete
              multiple
              options={subjects}
              value={form.areas}
              onChange={(_, value) => setForm((f) => ({ ...f, areas: value }))}
              freeSolo={false}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Subjects"
                  placeholder={subjects.length ? "Select subjects" : "No subjects yet — add some"}
                />
              )}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenSubjects(true)}>Manage subjects</Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={closeTeacher}>Close</Button>
          <Button variant="contained" onClick={handleSaveTeacher}>
            {editing ? "Save" : "Add teacher"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --------- Manage Subjects Modal --------- */}
      <AddSubjectModal open={openSubjects} onClose={() => setOpenSubjects(false)} />
    </Box>
  );
}