import * as React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { useSubjects } from "../utils/subjectsStore";

export default function AddSubjectModal({ open, onClose }) {
  const [subjects, api] = useSubjects();
  const [value, setValue] = React.useState("");

  const add = React.useCallback(() => {
    const v = value.trim();
    if (!v) return;
    api.add(v);
    setValue("");
  }, [value, api]);

  const del = React.useCallback((name) => api.remove(name), [api]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        Manage Subjects
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Subjects are shared across the app and stored in localStorage for now.
          </Typography>

          <Stack direction="row" spacing={1}>
            <TextField
              label="New subject"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g., Mathematics"
              fullWidth
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={add}>
              Add
            </Button>
          </Stack>

          <Box sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 1 }}>
            <List dense>
              {subjects.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary={<Typography color="text.secondary">No subjects yet.</Typography>}
                  />
                </ListItem>
              )}
              {subjects.map((s) => (
                <ListItem key={s} divider>
                  <ListItemText primary={s} />
                  <ListItemSecondaryAction>
                    <Tooltip title="Delete">
                      <IconButton edge="end" color="error" onClick={() => del(s)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}