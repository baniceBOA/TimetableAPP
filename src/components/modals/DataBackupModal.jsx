import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { saveAs } from "file-saver";

export default function DataBackupModal({
  open, onClose,
  // current app state:
  snapshot,             // { teachers, rooms, events, breaks, constraints, teacherConstraints, branding, exportOptions, filters }
  onRestoreSnapshot,    // (jsonObj) => void
}) {
  async function exportJSON() {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const date = new Date();
    const stamp = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
    saveAs(blob, `timetable_backup_${stamp}.json`);
  }

  async function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const obj  = JSON.parse(text);
      onRestoreSnapshot?.(obj);
    } catch (err) {
      alert("Invalid backup file.");
    } finally {
      e.target.value = ""; // reset input
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Backup data</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          Export all app data (teachers, rooms, events, breaks, limits, branding, export defaults) as a JSON file,
          or restore from a previous backup.
        </Typography>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <Button variant="contained" onClick={exportJSON}>Export JSON</Button>
          <label>
            <input type="file" accept="application/json" style={{ display:'none' }} onChange={importJSON} />
            <Button variant="outlined" component="span">Import JSON</Button>
          </label>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}