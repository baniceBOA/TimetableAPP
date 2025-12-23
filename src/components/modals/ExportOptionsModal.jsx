import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";

export default function ExportOptionsModal({ open, onClose, value, onSave }) {
  const [form, setForm] = React.useState(value || {
    landscapeDefault: false,
    fixedCells: true,
    roomSubscript: true,
    breakShading: true,
    compact: true,
  });

  React.useEffect(() => { if (open) setForm(value || form); }, [open, value]);

  function toggle(key) {
    setForm(f => ({ ...f, [key]: !f[key] }));
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export options</DialogTitle>
      <DialogContent>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={!!form.landscapeDefault} onChange={() => toggle('landscapeDefault')} />}
            label="Default to landscape orientation"
          />
          <FormControlLabel
            control={<Checkbox checked={!!form.fixedCells} onChange={() => toggle('fixedCells')} />}
            label="Use fixed cell sizes in grid exports"
          />
          <FormControlLabel
            control={<Checkbox checked={!!form.roomSubscript} onChange={() => toggle('roomSubscript')} />}
            label="Show room as subscript under lesson name"
          />
          <FormControlLabel
            control={<Checkbox checked={!!form.breakShading} onChange={() => toggle('breakShading')} />}
            label="Shade break slots"
          />
          <FormControlLabel
            control={<Checkbox checked={!!form.compact} onChange={() => toggle('compact')} />}
            label="Compact labels"
          />
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={() => onSave?.(form)}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}