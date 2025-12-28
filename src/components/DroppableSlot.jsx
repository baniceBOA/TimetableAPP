import * as React from 'react';
import Box from '@mui/material/Box';
import { useDroppable } from '@dnd-kit/core';
import { useTheme } from '@mui/material/styles';

export default function DroppableSlot({ id, col, row, isHour }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const theme = useTheme();
  const divider = (theme.vars || theme).palette.divider || '#1F2937';
  const hoverBg = (theme.vars || theme).palette.action?.hover || 'rgba(255,255,255,0.04)';

  return (
    <Box
      ref={setNodeRef}
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
      }}
    />
  );
}