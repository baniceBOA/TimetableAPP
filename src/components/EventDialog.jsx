import * as React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function EventDialog({ open, event, onClose, onEdit, onDelete }) {
  const theme = useTheme();
  if (!event) return null;

  const fmt = (t) => t; // If your times are strings; otherwise format as needed

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {event.title || 'Event details'}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={1.25}>
          <Typography variant="body2">
            <strong>Teacher:</strong> {event.teacherName || '—'}
          </Typography>
          <Typography variant="body2">
            <strong>Room:</strong> {event.roomName || '—'}
          </Typography>
          <Typography variant="body2">
            <strong>Day:</strong> {event.dayLabel || (typeof event.dayIndex === 'number' ? event.dayIndex : '—')}
          </Typography>
          <Typography variant="body2">
            <strong>Time:</strong> {fmt(event.start)} — {fmt(event.end)}
          </Typography>

          {/* If you track area/subject */}
          {event.area && (
            <Stack direction="row" spacing={1}>
              <Chip size="small" label={event.area} color="secondary" />
            </Stack>
          )}

          {/* Violations or conflicts */}
          {event.violation && (
            <Typography variant="body2" color="warning.main">
              {event.violation}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="text">Close</Button>
        <Button onClick={() => onEdit?.(event)} variant="contained" color="primary">Edit</Button>
        <Button onClick={() => onDelete?.(event.id)} variant="outlined" color="error">Delete</Button>
      </DialogActions>
    </Dialog>
  );
}