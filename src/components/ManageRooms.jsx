import * as React from "react";
import {
  Box,
  Button,
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

// Props:
// - rooms: [{id, name, capacity?}]
// - addRoom(payload: {name, capacity?})
// - updateRoom(id, payload)
// - deleteRoom(id)
export default function ManageRooms({ rooms, addRoom, updateRoom, deleteRoom }) {
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));

  // Modal state
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null); // room object when editing, null for add
  const [form, setForm] = React.useState({ name: "", capacity: "" });
  const [errors, setErrors] = React.useState({});
  const [confirmDelete, setConfirmDelete] = React.useState({ open: false, roomId: null });

  const nameRef = React.useRef(null);

  // Open modal in Add mode
  const handleOpenAdd = React.useCallback(() => {
    setEditing(null);
    setForm({ name: "", capacity: "" });
    setErrors({});
    setOpen(true);
  }, []);

  // Open modal in Edit mode
  const handleOpenEdit = React.useCallback((room) => {
    setEditing(room);
    setForm({ name: room.name ?? "", capacity: room.capacity ?? "" });
    setErrors({});
    setOpen(true);
  }, []);

  const handleClose = React.useCallback(() => {
    setOpen(false);
    setEditing(null);
    setForm({ name: "", capacity: "" });
    setErrors({});
  }, []);

  // Basic validation
  const validate = React.useCallback((draft) => {
    const next = {};
    if (!draft.name || !draft.name.trim()) next.name = "Room name is required.";
    if (draft.capacity !== "" && (isNaN(Number(draft.capacity)) || Number(draft.capacity) < 0)) {
      next.capacity = "Capacity must be a non-negative number.";
    }
    return next;
  }, []);

  const handleSave = React.useCallback(
    (e) => {
      e?.preventDefault?.();

      const trimmed = {
        name: (form.name || "").trim(),
        capacity: form.capacity === "" ? undefined : Number(form.capacity),
      };

      const v = validate(trimmed);
      setErrors(v);
      if (Object.keys(v).length > 0) {
        if (v.name) nameRef.current?.focus();
        return;
      }

      if (editing) {
        updateRoom?.(editing.id, trimmed);
      } else {
        addRoom?.(trimmed);
      }
      handleClose();
    },
    [form, editing, validate, addRoom, updateRoom, handleClose]
  );

  // Delete with confirm
  const requestDelete = React.useCallback(
    (roomId) => setConfirmDelete({ open: true, roomId }),
    []
  );
  const cancelDelete = React.useCallback(
    () => setConfirmDelete({ open: false, roomId: null }),
    []
  );
  const confirmDeleteNow = React.useCallback(() => {
    if (confirmDelete.roomId != null) {
      deleteRoom?.(confirmDelete.roomId);
    }
    setConfirmDelete({ open: false, roomId: null });
  }, [confirmDelete, deleteRoom]);

  // Keyboard: allow ⌘/Ctrl+Enter to save
  const onKeyDown = React.useCallback(
    (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        handleSave(e);
      }
    },
    [handleSave]
  );

  // ---------- Layout ----------
  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" component="h2">
          Manage Rooms
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
        >
          Add room
        </Button>
      </Stack>

      {/* Rooms list: table on sm+, list on xs */}
      {isSmUp ? (
        <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
          <Table size="small" aria-label="Rooms">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }} width={160}>
                  Capacity
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }} width={140}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography variant="body1">{r.name}</Typography>
                  </TableCell>
                  <TableCell>
                    {typeof r.capacity === "number" ? r.capacity : <Typography color="text.secondary">—</Typography>}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenEdit(r)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => requestDelete(r.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {rooms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography color="text.secondary">No rooms yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <List sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
          {rooms.map((r, idx) => (
            <React.Fragment key={r.id}>
              <ListItem
                secondaryAction={
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => handleOpenEdit(r)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => requestDelete(r.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemText
                  primary={r.name}
                  secondary={
                    typeof r.capacity === "number" ? (
                      `Capacity: ${r.capacity}`
                    ) : (
                      <Typography component="span" color="text.secondary">
                        No capacity set
                      </Typography>
                    )
                  }
                />
              </ListItem>
              {idx < rooms.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
          {rooms.length === 0 && (
            <ListItem>
              <ListItemText
                primary={<Typography color="text.secondary">No rooms yet.</Typography>}
              />
            </ListItem>
          )}
        </List>
      )}

      {/* --------- Add/Edit Modal --------- */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        onKeyDown={onKeyDown}
      >
        <DialogTitle sx={{ pr: 6 }}>
          {editing ? "Edit room" : "Add room"}
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (t) => t.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              inputRef={nameRef}
              label="Room name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Room A2"
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name}
            />

            <TextField
              label="Capacity (optional)"
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              placeholder="e.g., 40"
              fullWidth
              error={!!errors.capacity}
              helperText={errors.capacity}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          {editing && (
            <Button color="inherit" onClick={() => {
              // Reset back to add mode inside the same modal (optional)
              setEditing(null);
              setForm({ name: "", capacity: "" });
              setErrors({});
              setTimeout(() => nameRef.current?.focus(), 0);
            }}>
              Cancel edit
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleClose}>Close</Button>
          <Button variant="contained" onClick={handleSave}>
            {editing ? "Save" : "Add room"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --------- Delete confirmation --------- */}
      <Dialog
        open={confirmDelete.open}
        onClose={cancelDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete room?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This action can’t be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDeleteNow}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}