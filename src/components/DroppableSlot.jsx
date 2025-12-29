import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import { useDroppable } from '@dnd-kit/core';
import { useTheme } from '@mui/material/styles';

export default function DroppableSlot({ id, col, row, isHour, onCreate }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const theme = useTheme();
  const divider = (theme.vars || theme).palette.divider || '#1F2937';
  const hoverBg = (theme.vars || theme).palette.action?.hover || 'rgba(255,255,255,0.04)';

  const handleCreate = () => {
    if (!onCreate) return;
    try {
      const parts = String(id).split(":");
      if (parts.length >= 4) {
        const dayIndex = Number(parts[1]);
        const roomId = parts[2];
        const colNum = Number(parts[3]);
        onCreate({ dayIndex, roomId, col: colNum });
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <Box
      ref={setNodeRef}
      onDoubleClick={handleCreate}
      sx={{
        gridColumn: col,
        gridRow: row,
        // Make sure the element is “measurable” for DnD Kit
        minWidth: 1,
        minHeight: 1,
        position: 'relative',
        pointerEvents: 'auto',
        borderLeft: `1px solid ${isHour ? divider : 'transparent'}`,
        borderBottom: `1px solid ${divider}`,
        bgcolor: isOver ? hoverBg : 'transparent',
        transition: 'background-color 120ms ease-out',
        '&:hover .slot-add-btn': {
          opacity: 1,
          pointerEvents: 'auto',
        },
      }}
    >
      {onCreate && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleCreate();
          }}
          className="slot-add-btn"
          sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'background.paper', opacity: 0, transition: 'opacity 160ms ease', pointerEvents: 'none' }}
          aria-label="Add"
        >
          <AddIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}