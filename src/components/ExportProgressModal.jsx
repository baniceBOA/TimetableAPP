import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { ExportProgressContext } from "../contexts/ExportProgressContext";
export default function ExportProgressModal(){
  const { running, percent, label, requestCancel } = React.useContext(ExportProgressContext);
  return (
    <Dialog open={running}>
      <DialogTitle>Export in progress</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1 }}>{label || "Exporting…"}</Typography>
        <LinearProgress variant="determinate" value={percent} />
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
          <Button onClick={requestCancel}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
