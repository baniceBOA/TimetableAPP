import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

export default function LimitsToggleModal({ open, onClose, value, onSave }) {
  const [form, setForm] = React.useState(value || { teacherLimits: true, roomLimits: true });
  React.useEffect(() => { if (open) setForm(value || { teacherLimits: true, roomLimits: true }); }, [open, value]);

  const setSwitch = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Weekly limits</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Toggle whether weekly limits are enforced during scheduling.
        </Typography>
        <List dense>
          <ListItem
            secondaryAction={
              <Switch edge="end" checked={!!form.teacherLimits} onChange={setSwitch("teacherLimits")} />
            }
          >
            <ListItemText
              primary="Teacher × Subject limits"
              secondary="Restrict how many lessons per subject a teacher can have per week"
            />
          </ListItem>
          <Divider sx={{ my: 0.5 }} />
          <ListItem
            secondaryAction={
              <Switch edge="end" checked={!!form.roomLimits} onChange={setSwitch("roomLimits")} />
            }
          >
            <ListItemText
              primary="Room × Subject limits"
              secondary="Restrict how many lessons per subject a room can host per week"
            />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={() => onSave?.(form)}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}