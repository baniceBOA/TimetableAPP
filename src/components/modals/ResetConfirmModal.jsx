import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export default function ResetConfirmModal({ open, onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Reset app?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color:'text.secondary' }}>
          This will clear your local data (teachers, rooms, events, breaks, limits, filters, branding, export defaults)
          and restore initial sample data. This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm}>Reset</Button>
      </DialogActions>
    </Dialog>
  );
}