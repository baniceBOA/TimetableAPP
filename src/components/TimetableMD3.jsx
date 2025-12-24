// components/TimetableMD3.jsx
import * as React from 'react';
import { useLayoutEffect, useRef, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Toolbar from '@mui/material/Toolbar';
import { useTheme } from '@mui/material/styles';

import {
  DndContext,
  useSensors,
  useSensor,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  pointerWithin,
} from '@dnd-kit/core';

import DroppableSlot from './DroppableSlot';
import EventItem from './EventItem';

import {
  DAYS, START_HOUR, END_HOUR, SLOTS_PER_HOUR, TOTAL_COLS,
  ROW_HEIGHT, DAY_LABEL_COL_WIDTH, ROOM_LABEL_COL_WIDTH, TIME_HEADER_HEIGHT
} from '../constants';
import { hourLabel, overlaps, timeToCol, colToTime } from '../utils/time';

export default function Timetable({
  events, onEdit, onDelete, onUpdate,
  teachers = [], rooms = [],
  onCreate,
  activeTeacherId = null, // unused here but preserved
  roomFilters = [],
  subjectFilters = [],
  breaks = [],
  getViolationClass = () => "",
}) {
  const theme = useTheme();

  const teacherById = useMemo(()=> new Map(teachers.map(t=>[t.id,t])), [teachers]);
  const roomById = useMemo(()=> new Map(rooms.map(r=>[r.id,r])), [rooms]);

  const visibleRooms = useMemo(()=> {
    if (!roomFilters || roomFilters.length === 0) return rooms;
    const sel = new Set(roomFilters);
    return rooms.filter(r => sel.has(r.id));
  }, [rooms, roomFilters]);

  const subjectOk = (ev) => {
    if (!subjectFilters || subjectFilters.length===0) return true;
    const a=(ev.area||'').trim();
    return subjectFilters.includes(a);
  };

  const totalRows = DAYS.length * visibleRooms.length;
  function rowIndexFor(dayIndex, roomId) {
    const idx = Math.max(0, visibleRooms.findIndex(r=> r.id===roomId));
    return dayIndex * visibleRooms.length + idx + 1;
  }
  function daySpanStart(dayIndex) { return dayIndex * visibleRooms.length + 1; }

  // Compute conflicts (unchanged)
  const teacherConflicts = new Set(); const roomConflicts = new Set();
  for (let day=0; day<DAYS.length; day++) {
    const perDay = events.filter(e => e.dayIndex===day && visibleRooms.some(r=> r.id===e.roomId) && subjectOk(e));
    const byTeacher = new Map(); perDay.forEach(e=>{ if (!e.teacherId) return; const k=e.teacherId; if(!byTeacher.has(k)) byTeacher.set(k,[]); byTeacher.get(k).push(e); });
    for (const [,list] of byTeacher) for (let i=0;i<list.length;i++) for (let j=i+1;j<list.length;j++) if (overlaps(list[i], list[j])) { teacherConflicts.add(list[i].id); teacherConflicts.add(list[j].id); }
    const byRoom = new Map(); perDay.forEach(e=>{ if (!e.roomId) return; const k=e.roomId; if(!byRoom.has(k)) byRoom.set(k,[]); byRoom.get(k).push(e); });
    for (const [,list] of byRoom) for (let i=0;i<list.length;i++) for (let j=i+1;j<list.length;j++) if (overlaps(list[i], list[j])) { roomConflicts.add(list[i].id); roomConflicts.add(list[j].id); }
  }

  // Measurements
  const gridRef = useRef(null);
  const [colWidth, setColWidth] = useState(null);

  useLayoutEffect(() => {
    function measure() {
      const el = gridRef.current;
      if(!el) return;
      const rect = el.getBoundingClientRect();
      const usable = rect.width - DAY_LABEL_COL_WIDTH - ROOM_LABEL_COL_WIDTH;
      setColWidth(usable / TOTAL_COLS);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Create-selection logic (unchanged)
  const [selection, setSelection] = useState(null);
  const creatingRef = useRef(null);
  const earliestCol = 3;
  const latestCol = 3 + TOTAL_COLS;

  function startCreate(e){
    // Don't start if clicking on an event surface
    const el = e.target;
    if (el.closest('.event-wrapper') || el.closest('.event')) return;
    if(!gridRef.current||!colWidth) return;

    const rect=gridRef.current.getBoundingClientRect();
    const x=e.clientX-rect.left;
    const y=e.clientY-rect.top;

    let rowIdx0=Math.floor(y/ROW_HEIGHT);
    rowIdx0=Math.max(0, Math.min(totalRows-1, rowIdx0));

    const dayIndex=Math.floor(rowIdx0/visibleRooms.length);
    const roomIndex=rowIdx0%visibleRooms.length;
    const roomId=visibleRooms[roomIndex]?.id;

    const rawCol=Math.floor((x - DAY_LABEL_COL_WIDTH - ROOM_LABEL_COL_WIDTH)/colWidth);
    let startCol=earliestCol+rawCol;
    startCol=Math.max(earliestCol, Math.min(latestCol-1, startCol));

    creatingRef.current={ dayIndex, roomIndex, roomId, anchorCol:startCol, shift:e.shiftKey };
    setSelection({ dayIndex, roomIndex, roomId, startCol, endCol:startCol+1 });

    window.addEventListener('pointermove', onCreateMove);
    window.addEventListener('pointerup', onCreateEnd);
  }
  function onCreateMove(e){
    const st=creatingRef.current;
    if(!st||!gridRef.current||!colWidth) return;
    const rect=gridRef.current.getBoundingClientRect();
    const x=e.clientX-rect.left;
    const y=e.clientY-rect.top;

    st.shift=e.shiftKey;

    let rowIdx0=Math.floor(y/ROW_HEIGHT);
    rowIdx0=Math.max(0, Math.min(totalRows-1, rowIdx0));
    const dayIndex=Math.floor(rowIdx0/visibleRooms.length);
    const roomIndex=rowIdx0%visibleRooms.length;

    const rawCol=Math.floor((x - DAY_LABEL_COL_WIDTH - ROOM_LABEL_COL_WIDTH)/colWidth);
    let currCol=earliestCol+rawCol;
    currCol=Math.max(earliestCol, Math.min(latestCol, currCol));

    if(st.shift){
      const slotsPerHour=SLOTS_PER_HOUR;
      const slotIdx=currCol-3;
      currCol=3+Math.round(slotIdx/slotsPerHour)*slotsPerHour;
    }
    let startCol=Math.min(st.anchorCol, currCol);
    let endCol=Math.max(st.anchorCol+1, currCol);
    endCol=Math.min(latestCol, endCol);

    setSelection({ dayIndex, roomIndex, roomId:visibleRooms[roomIndex]?.id, startCol, endCol });
  }
  function onCreateEnd(){
    window.removeEventListener('pointermove', onCreateMove);
    window.removeEventListener('pointerup', onCreateEnd);
    const sel=selection;
    creatingRef.current=null;
    setSelection(null);
    if(!sel) return;
    const { dayIndex, roomId, startCol, endCol }=sel;
    if(endCol<=startCol) return;
    const start=colToTime(startCol-1);
    const end=colToTime(endCol-1);
    onCreate?.({ title:"", dayIndex, start, end, color:'#2d8cff', teacherId:"", area:"", roomId: roomId||"" });
  }

  // DND Kit sensors & drop handling
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  function handleDragEnd({ active, over }) {
    if (!over) return;
    const data = active.data?.current;
    if (!data || data.type !== 'move') return;

    const ev = data.event;
    // droppable id format: slot:<dayIndex>:<roomId>:<col>
    const [, dayStr, roomId, colStr] = String(over.id).split(':');
    const dayIndex = Number(dayStr);
    const startCol = Number(colStr);

    const originalStartCol = timeToCol(ev.start) + 1;
    const originalEndCol = timeToCol(ev.end) + 1;
    const durationSlots = originalEndCol - originalStartCol;

    const clampedStartCol = Math.max(earliestCol, Math.min(latestCol - durationSlots, startCol));
    const newStart = colToTime(clampedStartCol - 1);
    const newEnd = colToTime(clampedStartCol - 1 + durationSlots);

    const updated = { ...ev, dayIndex, roomId, start: newStart, end: newEnd };
    onUpdate?.(updated);
  }

  // Theme tokens
  const bgDefault = (theme.vars || theme).palette.background.default;
  const bgPaper   = (theme.vars || theme).palette.background.paper;
  const textMuted = (theme.vars || theme).palette.text.secondary;
  const divider   = (theme.vars || theme).palette.divider;
  const tertiary  = theme.custom?.tertiary?.main || '#F953C6';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Header row (sticky) */}
      <Box
        className="grid-row time-header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 4,
          display: 'grid',
          alignItems: 'center',
          gridTemplateColumns: `${DAY_LABEL_COL_WIDTH}px ${ROOM_LABEL_COL_WIDTH}px repeat(${TOTAL_COLS}, 1fr)`,
          height: TIME_HEADER_HEIGHT,
          bgcolor: bgPaper,
          borderBottom: `1px solid ${divider}`,
        }}
      >
        <Box />
        <Box />
        {Array.from({ length: END_HOUR - START_HOUR }, (_,i)=> START_HOUR+i).map((h,i)=> (
          <Box
            key={h}
            sx={{
              gridColumn: `${i * SLOTS_PER_HOUR + 3} / span ${SLOTS_PER_HOUR}`,
              px: 1,
              display: 'flex',
              alignItems: 'center',
              borderLeft: `1px solid ${divider}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: textMuted }}>
              {hourLabel(h)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Body (grid) */}
      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
        <Box
          ref={gridRef}
          className="grid-body"
          onPointerDown={startCreate}
          sx={{
            display: 'grid',
            gridTemplateColumns: `${DAY_LABEL_COL_WIDTH}px ${ROOM_LABEL_COL_WIDTH}px repeat(${TOTAL_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${totalRows}, ${ROW_HEIGHT}px)`,
            position: 'relative',
            bgcolor: bgDefault,
            border: `1px solid ${divider}`,
            borderRadius: (theme) => theme.shape.borderRadius,
            overflow: 'auto',
          }}
        >
          {/* Day labels */}
          {DAYS.map((day, dayIndex)=> (
            <Box
              key={`day-${day}`}
              sx={{
                gridColumn: 1,
                gridRow: `${daySpanStart(dayIndex)} / span ${visibleRooms.length}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                px: 1,
                borderRight: `1px solid ${divider}`,
                bgcolor: bgPaper,
              }}
            >
              <Typography variant="h6">{day}</Typography>
            </Box>
          ))}

          {/* Room labels */}
          {DAYS.map((_, dayIndex)=> visibleRooms.map((room, roomIndex)=> (
            <Box
              key={`room-${dayIndex}-${room.id}`}
              sx={{
                gridColumn: 2,
                gridRow: dayIndex * visibleRooms.length + roomIndex + 1,
                display: 'flex',
                alignItems: 'center',
                px: 1,
                borderRight: `1px solid ${divider}`,
                borderBottom: `1px solid ${divider}`,
                bgcolor: bgPaper,
              }}
            >
              <Typography variant="body2">{room.name}</Typography>
            </Box>
          )))}

          {/* Droppable time slots */}
          {Array.from({ length: TOTAL_COLS }, (_, c)=> c).map((c)=> (
            Array.from({ length: totalRows }, (_, r)=> {
              const dayIndex = Math.floor(r / visibleRooms.length);
              const roomIndex = r % visibleRooms.length;
              const roomId = visibleRooms[roomIndex]?.id;
              const col = c + 3; // offset after labels
              const droppableId = `slot:${dayIndex}:${roomId}:${col}`;
              const isHour = c % SLOTS_PER_HOUR === 0;

              return (
                <DroppableSlot
                  key={`slot-${r}-${c}`}
                  id={droppableId}
                  col={col}
                  row={r + 1}
                  isHour={isHour}
                />
              );
            })
          ))}

          {/* Break bands (MD3 chips/bands look) */}
          {DAYS.map((_, dayIndex) => breaks
            .filter(b=> b.dayIndex===dayIndex)
            .map((b)=> {
              const startCol = timeToCol(b.start) + 1;
              const endCol = timeToCol(b.end) + 1;
              const rowStart = daySpanStart(dayIndex);
              const rowSpan = visibleRooms.length;
              return (
                <Box
                  key={`break-${dayIndex}-${b.start}-${b.end}-${b.label}`}
                  sx={{
                    gridColumn: `${startCol} / ${endCol}`,
                    gridRow: `${rowStart} / span ${rowSpan}`,
                    bgcolor: b.color || (theme.vars || theme).palette.action.selected,
                    color: (theme.vars || theme).palette.text.primary,
                    borderTop: `1px dashed ${divider}`,
                    borderBottom: `1px dashed ${divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    px: 1,
                    zIndex: 0,
                  }}
                >
                  <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>
                    {b.label || 'Break'}
                  </Typography>
                </Box>
              );
            })
          )}

          {/* Events */}
          {events
            .filter(ev => visibleRooms.some(r=> r.id===ev.roomId) && subjectOk(ev))
            .map((ev)=> {
              const startCol = timeToCol(ev.start) + 1;
              const endCol = timeToCol(ev.end) + 1;
              const t = ev.teacherId ? teacherById.get(ev.teacherId) : null;
              const r = ev.roomId ? roomById.get(ev.roomId) : null;
              const enriched = { ...ev, teacherName: t?.name || '', roomName: r?.name || '' };

              const isTeacherConflict = teacherConflicts.has(ev.id);
              const isRoomConflict = roomConflicts.has(ev.id);
              const conflict =
                isTeacherConflict && isRoomConflict ? 'both' :
                isTeacherConflict ? 'teacher' :
                isRoomConflict ? 'room' : null;

              const rowIdx = rowIndexFor(ev.dayIndex, ev.roomId);

              return (
                <Box
                  key={ev.id}
                  className="event-wrapper"
                  sx={{
                    gridColumn: `${startCol} / ${endCol}`,
                    gridRow: rowIdx,
                    position: 'relative',
                    // Wrapper keeps MD3 spacing around the card if needed
                    p: 0.25,
                    zIndex: 1,
                  }}
                >
                  <EventItem
                    event={enriched}
                    startCol={startCol}
                    endCol={endCol}
                    rowIdx={rowIdx}
                    colWidth={colWidth || 1}
                    onUpdate={onUpdate}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    conflict={conflict}
                  />
                </Box>
              );
            })}

          {/* Selection preview (during create) */}
          {selection && (
            <Box
              sx={{
                gridColumn: `${selection.startCol} / ${selection.endCol}`,
                gridRow:
                  selection.dayIndex * visibleRooms.length + selection.roomIndex + 1,
                bgcolor: tertiary,
                opacity: 0.25,
                border: `1px dashed ${tertiary}`,
                borderRadius: (theme) => theme.shape.borderRadius,
                pointerEvents: 'none',
              }}
            />
          )}
        </Box>
      </DndContext>
    </Box>
  );
}