import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/material/styles';
import { useDraggable } from '@dnd-kit/core';

import { useState } from 'react';

export default function EventItem({
  event,
  startCol,
  endCol,
  rowIdx,
  colWidth = 1,
  onEdit,
  onDelete,
  onOpenDetails,
  conflict, // 'teacher' | 'room' | 'both' | null
}) {
  const theme = useTheme();

  // Main body drag
  const {
    attributes: bodyAttrs,
    listeners: bodyListeners,
    setNodeRef: setBodyRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `ev-${event.id}`,
    data: { type: 'move', event, startCol, endCol, rowIdx },
  });

  // Left handle (resize start)
  const {
    attributes: leftAttrs,
    listeners: leftListeners,
    setNodeRef: setLeftRef,
    isDragging: isLeftDragging,
  } = useDraggable({
    id: `ev-${event.id}-handle-start`,
    data: { type: 'resize-start', event, startCol, endCol, rowIdx },
  });

  // Right handle (resize end)
  const {
    attributes: rightAttrs,
    listeners: rightListeners,
    setNodeRef: setRightRef,
    isDragging: isRightDragging,
  } = useDraggable({
    id: `ev-${event.id}-handle-end`,
    data: { type: 'resize-end', event, startCol, endCol, rowIdx },
  });

  const divider = (theme.vars || theme).palette.divider;
  const textPrimary = (theme.vars || theme).palette.text.primary;
  const onColor = event.color ? '#fff' : textPrimary;

  const conflictBorder = conflict === 'both'
    ? `2px solid ${(theme.vars || theme).palette.error.main}`
    : conflict === 'teacher'
    ? `2px solid ${(theme.vars || theme).palette.warning.main}`
    : conflict === 'room'
    ? `2px solid ${(theme.vars || theme).palette.secondary.main}`
    : `1px solid ${divider}`;

  const styleTransform = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : null;

  const handleCommon = {
    width: 8,
    borderRadius: 2,
    bgcolor: 'rgba(255,255,255,0.65)',
    cursor: 'ew-resize',
    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
    boxShadow: 1,
  };

  return (
    <Paper
      ref={setBodyRef}
      variant="outlined"
      elevation={0}
      {...bodyListeners}
      {...bodyAttrs}
      onClick={() => onOpenDetails?.(event)}
      sx={{
        gridColumn: `${startCol} / ${endCol}`,
        gridRow: rowIdx,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        px: 1.25,
        py: 0.75,
        borderRadius: (theme) => theme.shape.borderRadius,
        border: conflictBorder,
        bgcolor: event.color || (theme.vars || theme).palette.primary.main,
        color: onColor,
        cursor: 'grab',
        ...(isDragging && { opacity: 0.9, cursor: 'grabbing' }),
        ...styleTransform,
        zIndex: isDragging ? 3 : 1,
        transition: isDragging ? undefined : 'box-shadow 120ms ease',
      }}
    >
      {/* Left resize handle */}
      <Box
        ref={setLeftRef}
        {...leftListeners}
        {...leftAttrs}
        sx={{
          position: 'absolute',
          left: 2, top: '50%', transform: 'translateY(-50%)',
          ...handleCommon,
          height: 18,
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Right resize handle */}
      <Box
        ref={setRightRef}
        {...rightListeners}
        {...rightAttrs}
        sx={{
          position: 'absolute',
          right: 2, top: '50%', transform: 'translateY(-50%)',
          ...handleCommon,
          height: 18,
        }}
        onClick={(e) => e.stopPropagation()}
      />

      <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
        {event.title || 'Untitled'}
      </Typography>

      {(event.teacherName || event.roomName) && (
        <Typography variant="caption" sx={{ opacity: 0.85 }}>
          {event.teacherName}{event.teacherName && event.roomName ? ' • ' : ''}{event.roomName}
        </Typography>
      )}

      {(onEdit || onDelete) && (
        <Box
          sx={{
            position: 'absolute',
            right: 4,
            bottom: 2,
            display: 'flex',
            gap: 0.5,
          }}
        >
          {onEdit && (
            <IconButton
              size="small"
              color="inherit"
              onClick={(e) => { e.stopPropagation(); onEdit(event); }}
            >
              <EditIcon fontSize="inherit" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              color="inherit"
              onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
            >
              <DeleteIcon fontSize="inherit" />
            </IconButton>
          )}
        </Box>
      )}
    </Paper>
  );
}