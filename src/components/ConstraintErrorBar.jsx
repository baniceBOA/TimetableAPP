import * as React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

/**
 * Reusable error bar for constraint messages.
 * props:
 *  - open: boolean
 *  - onClose: fn
 *  - messages: string[]  (displayed as a stacked list)
 */
export default function ConstraintErrorBar({ open, onClose, messages = [] }) {
  const text = messages.join("\n");
  return (
    <Snackbar
      open={open}
      onClose={onClose}
      autoHideDuration={8000}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={onClose}
        severity="error"
        sx={{ whiteSpace: "pre-line", maxWidth: 800 }}
      >
        {text || "Constraint violation."}
      </Alert>
    </Snackbar>
  );
}