import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { DAYS, START_HOUR, END_HOUR, SLOTS_PER_HOUR } from '../constants';
import { toMinutes } from '../utils/time';

function minutesToHHMM(mins) {
  const total = Math.floor(mins);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

function hexToRgb(hex) {
  if (!hex) return null;
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function getContrastText(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'inherit';
  // Perceived luminance
  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return lum > 0.6 ? '#000' : '#fff';
}

function buildTimeSlots() {
  const slots = [];
  const slotMins = 60 / SLOTS_PER_HOUR;
  for (let h = START_HOUR * 60; h < END_HOUR * 60; h += slotMins) {
    slots.push(minutesToHHMM(h));
  }
  return slots;
}

export default function SchedulePreview({ open, onClose, events = [], teachers = [], rooms = [], teacherId = null, roomId = null }) {
  const slots = React.useMemo(() => buildTimeSlots(), []);

  const grid = React.useMemo(() => {
    const out = DAYS.map((d, di) => ({ day: d, row: Array(slots.length).fill(null) }));
    for (const ev of events) {
      if (typeof ev.dayIndex !== 'number') continue;
      if (teacherId && ev.teacherId !== teacherId) continue;
      if (roomId && ev.roomId !== roomId) continue;
      // place event at the first slot it starts in
      const startMin = toMinutes(ev.start);
      const slotMins = 60 / SLOTS_PER_HOUR;
      const slotIndex = Math.floor((startMin - START_HOUR * 60) / slotMins);
      if (slotIndex >= 0 && slotIndex < slots.length && ev.dayIndex >= 0 && ev.dayIndex < DAYS.length) {
        const display = ev.title || ev.area || 'Lesson';
        const cell = out[ev.dayIndex].row[slotIndex];
        if (cell) {
          const newText = `${cell.text || cell} / ${display}`;
          const color = (cell.color && cell.color === ev.color) ? ev.color : null;
          out[ev.dayIndex].row[slotIndex] = { text: newText, color };
        } else {
          out[ev.dayIndex].row[slotIndex] = { text: display, color: ev.color || null };
        }
      }
    }
    return out;
  }, [events, slots, teacherId, roomId]);

  const legend = React.useMemo(() => {
    const map = new Map();
    for (const ev of events) {
      if (teacherId && ev.teacherId !== teacherId) continue;
      if (roomId && ev.roomId !== roomId) continue;
      const color = ev.color || null;
      if (!color) continue;
      const label = ev.title || ev.area || 'Lesson';
      if (!map.has(color)) map.set(color, new Set());
      map.get(color).add(label);
    }
    return Array.from(map.entries()).map(([color, set]) => ({ color, labels: Array.from(set).slice(0,3) }));
  }, [events, teacherId, roomId]);

  const title = teacherId ? (teachers.find(t => t.id === teacherId)?.name || 'Teacher') : (roomId ? (rooms.find(r => r.id === roomId)?.name || 'Room') : 'Schedule');

  return (
    <Dialog open={!!open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: `120px repeat(${slots.length}, 1fr)`, gap: 1, alignItems: 'stretch' }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700 }}>Day / Time</Box>
            {slots.map((s, i) => (
              <Box key={i} sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'center', fontSize: 12 }}>{s}</Box>
            ))}

            {grid.map((row, rIdx) => (
              <React.Fragment key={rIdx}>
                <Box sx={{ p: 1, borderRight: '1px solid', borderColor: 'divider', fontWeight: 600 }}>{row.day}</Box>
                {row.row.map((cell, cIdx) => (
                  <Box key={cIdx} sx={{ p: 0.5, minHeight: 40, borderRight: '1px solid', borderColor: 'divider', backgroundColor: cell && cell.color ? cell.color : 'transparent' }}>
                    {cell ? (
                      <Typography variant="body2" sx={{ fontWeight: 700, color: cell && cell.color ? getContrastText(cell.color) : 'inherit' }}>{cell.text || cell}</Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </Box>
                ))}
              </React.Fragment>
            ))}
          </Box>
        </Box>
        {legend.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ mr: 1 }}>Legend:</Typography>
            {legend.map((l, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
                <Box sx={{ width: 16, height: 16, backgroundColor: l.color, borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }} />
                <Typography variant="caption">{l.labels.join(', ')}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
