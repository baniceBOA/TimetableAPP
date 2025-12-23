

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import ConstraintsEditor from "../ConstraintsEditor";


export default function ConstrainEditorModal({open, onClose,  rooms=[], subjects=[], constraints=[], addConstraint, deleteConstraint }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Day‑wide breaks</DialogTitle>
      <DialogContent dividers>
        <ConstraintsEditor
         rooms={rooms}
         subjects={subjects}
         constraints={constraints}
         addConstraint={addConstraint}
         deleteConstraint={deleteConstraint} 
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}