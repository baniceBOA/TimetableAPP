import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

/**
 * Shows a list of violating events and lets the user remove/snooze/fix them.
 * We implement 'Remove excess' as a simple example.
 */
export default function LimitsAutofixModal({
  open,
  onClose,
  violatingEvents = [],  // array of { id, title, dayIndex, start, end, area, roomId, teacherId }
  onRemoveSelected,      // (ids[]) => void
}) {
  const [selectedIds, setSelectedIds] = React.useState([]);

  React.useEffect(() => {
    if (open) setSelectedIds(violatingEvents.map(v => v.id));
  }, [open, violatingEvents]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Auto-fix weekly limit violations</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
          The following events exceed weekly limits. You can remove the selected ones now,
          or close and fix them manually later.
        </Typography>
        <List dense sx={{ maxHeight: 320, overflow: "auto" }}>
          {violatingEvents.map(ev => (
            <ListItem key={ev.id} onClick={() => {
              setSelectedIds(ids => ids.includes(ev.id) ? ids.filter(x => x!==ev.id) : [...ids, ev.id]);
            }} sx={{ cursor: 'pointer' }}>
              <ListItemText
                primary={`${ev.title || '(untitled)'} • ${ev.area || '—'}`}
                secondary={`Day ${ev.dayIndex+1} ${ev.start}-${ev.end}`}
              />
              <input type="checkbox" readOnly checked={selectedIds.includes(ev.id)} />
            </ListItem>
          ))}
          {violatingEvents.length === 0 && (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              No violations found.
            </Typography>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          color="error"
          disabled={selectedIds.length === 0}
          onClick={() => onRemoveSelected?.(selectedIds)}
        >
          Remove selected
        </Button>
      </DialogActions>
    </Dialog>
  );
}