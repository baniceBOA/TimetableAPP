import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import BreaksEditor from "../BreaksEditor.jsx";
import { DAYS } from "../../constants";

export default function BreaksEditorModal({
  open,
  onClose,
  breaks = [],
  addBreak,
  deleteBreak,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Day‑wide breaks</DialogTitle>
      <DialogContent dividers>
        <BreaksEditor
          days={DAYS}
          breaks={breaks}
          addBreak={addBreak}
          deleteBreak={deleteBreak}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}