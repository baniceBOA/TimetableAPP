import * as React from "react";
import Box from "@mui/material/Box";
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ScreenRotationIcon from '@mui/icons-material/ScreenRotation';
import Typography from '@mui/material/Typography';
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";

// DnD kit
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";

// react-window v2
import { List } from "react-window";
import DroppableSlot from './DroppableSlot';
import { DAYS, DAY_LABEL_COL_WIDTH, ROOM_LABEL_COL_WIDTH, TOTAL_COLS, START_HOUR, END_HOUR, SLOTS_PER_HOUR } from '../constants';
import { timeToCol, colToTime } from '../utils/time';

import EventCardMUI from "./EventCardMUI.jsx";
import { useConfig } from "../utils/configStore";


import { toMinutes, slotLabel, hourLabel } from "../utils/time";
import { checkTeacherTime, checkSubjectTime } from "../utils/timeConstraints";


/**
 * TimetableMUI (react-window v2) with DnD & optimized per-cell rendering.
 * Props:
 *  - events, breaks, teachers, rooms
 *  - teacherId, roomsFilter[], subjectFilter[]
 *  - onEdit(id), onDelete(id), onUpdate(id, next), onCreateFromGrid({ dayIndex, start, end })
 *  - getViolationClass?(event)
 *  - timeConstraints, limitsEnabled, constraints, teacherConstraints
 *  - rowHeight, overscan
 */
export default function TimetableMUI({
  events = [],
  breaks = [],
  teachers = [],
  rooms = [],
  teacherId = null,
  roomsFilter = [],
  subjectFilter = [],
  onEdit,
  onDelete,
  onUpdate,
  onCreateFromGrid,
  getViolationClass,
  timeConstraints,
  limitsEnabled,
  constraints,
  teacherConstraints,
  rowHeight = 64,
  overscan = 3,
}) {

  const config = useConfig();
  const { days: cfgDays, startHour, endHour, slotsPerHour } = config;
  // use reactive config where needed but keep constants for grid sizing
  const totalSlots = (endHour - startHour) * slotsPerHour;
  const minutesPerSlot = 60 / slotsPerHour;

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Header hour labels
  const hours = React.useMemo(() => Array.from({ length: totalSlots }, (_, i) => slotLabel(i)), [totalSlots]);

  // Responsive row height for small screens
  const effectiveRowHeight = isSmallScreen ? Math.max(28, Math.round(rowHeight * 0.55)) : rowHeight;

  // --- Filters ---
  const visibleEvents = React.useMemo(() => {
    return events.filter((e) => {
      if (teacherId && e.teacherId !== teacherId) return false;
      if (roomsFilter.length > 0 && !roomsFilter.includes(e.roomId)) return false;
      if (subjectFilter.length > 0) {
        const a = (e.area || "").trim();
        if (!subjectFilter.includes(a)) return false;
      }
      return true;
    });
  }, [events, teacherId, roomsFilter, subjectFilter]);

  // --- Index breaks by day (list) ---
  const breaksByDay = React.useMemo(() => {
    const map = new Map();
    for (let d = 0; d < DAYS.length; d++) map.set(d, []);
    for (const b of breaks) map.get(b.dayIndex)?.push(b);
    return map;
  }, [breaks]);

  // --- Pre-index events per day ---
  const eventsByDay = React.useMemo(() => {
    const arr = Array.from({ length: DAYS.length }, () => []);
    for (const ev of visibleEvents) {
      if (ev.dayIndex >= 0 && ev.dayIndex < DAYS.length) arr[ev.dayIndex].push(ev);
    }
    return arr;
  }, [visibleEvents]);

  // --- Teacher & Room maps (fast lookups) ---
  const teacherById = React.useMemo(() => {
    const m = new Map();
    for (const t of teachers) m.set(t.id, t);
    return m;
  }, [teachers]);

  const roomById = React.useMemo(() => {
    const m = new Map();
    for (const r of rooms) m.set(r.id, r);
    return m;
  }, [rooms]);

  // Visible rooms (respect multi-select filter if provided)
  const visibleRooms = React.useMemo(() => {
    return (roomsFilter && roomsFilter.length > 0) ? rooms.filter(r => roomsFilter.includes(r.id)) : rooms;
  }, [rooms, roomsFilter]);

  // --- O(1) cell lookups: pre-bucket events & breaks per SLOT ---
  // eventsByDaySlot[dayIdx][slotIdx] -> array of events touching that slot
  // breakByDaySlot[dayIdx][slotIdx] -> break object (first overlapping) or null
  const { eventsByDayRoomSlot, breakByDaySlot } = React.useMemo(() => {
    const dayStartMin = startHour * 60;

    const makeEventsGrid = () =>
      Array.from({ length: cfgDays.length }, () =>
        Array.from({ length: visibleRooms.length }, () =>
          Array.from({ length: totalSlots }, () => [])
        )
      );

    const makeBreaksGrid = () =>
      Array.from({ length: DAYS.length }, () =>
        Array.from({ length: totalSlots }, () => null)
      );

    const eGrid = makeEventsGrid();
    const bGrid = makeBreaksGrid();

    // room id -> index map for quick lookup
    const roomIndex = new Map(visibleRooms.map((r, i) => [r.id, i]));

    // Fill events per slot per room
    for (let d = 0; d < cfgDays.length; d++) {
      const dayEvents = eventsByDay[d];
      if (!dayEvents || dayEvents.length === 0) continue;

      for (const ev of dayEvents) {
        const rIdx = roomIndex.get(ev.roomId);
        if (typeof rIdx !== "number") continue; // skip events for rooms not visible in this view

        const evStart = toMinutes(ev.start);
        const evEnd = toMinutes(ev.end);

        // Compute slot range (clamped to day & grid bounds)
        let startSlot = Math.floor((evStart - dayStartMin) / minutesPerSlot);
        let endSlotExclusive = Math.ceil((evEnd - dayStartMin) / minutesPerSlot);

        startSlot = Math.max(0, Math.min(startSlot, totalSlots - 1));
        endSlotExclusive = Math.max(startSlot + 1, Math.min(endSlotExclusive, totalSlots));

        for (let s = startSlot; s < endSlotExclusive; s++) {
          eGrid[d][rIdx][s].push(ev);
        }
      }
    }

    // Fill breaks per slot (pick first overlapping)
    for (let d = 0; d < cfgDays.length; d++) {
      const dayBreaks = breaksByDay.get(d) || [];
      if (dayBreaks.length === 0) continue;

      for (const b of dayBreaks) {
        const bs = toMinutes(b.start);
        const be = toMinutes(b.end);

        let startSlot = Math.floor((bs - dayStartMin) / minutesPerSlot);
        let endSlotExclusive = Math.ceil((be - dayStartMin) / minutesPerSlot);

        startSlot = Math.max(0, Math.min(startSlot, totalSlots - 1));
        endSlotExclusive = Math.max(startSlot + 1, Math.min(endSlotExclusive, totalSlots));

        for (let s = startSlot; s < endSlotExclusive; s++) {
          if (!bGrid[d][s]) bGrid[d][s] = b;
        }
      }
    }

    return { eventsByDayRoomSlot: eGrid, breakByDaySlot: bGrid };
  }, [eventsByDay, breaksByDay, totalSlots, minutesPerSlot, visibleRooms]);

  // --- Violation class fallback ---
  const violationClassOf = React.useCallback(
    (ev) => {
      if (typeof getViolationClass === "function") return getViolationClass(ev);
      const tBlocked = timeConstraints && checkTeacherTime(timeConstraints, ev).blocked;
      const sBlocked = timeConstraints && checkSubjectTime(timeConstraints, ev).blocked;
      if (tBlocked && sBlocked) return "time-both-blocked";
      if (tBlocked) return "time-teacher-blocked";
      if (sBlocked) return "time-subject-blocked";
      return "";
    },
    [getViolationClass, timeConstraints]
  );

  // --- DnD setup ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const [dragId, setDragId] = React.useState(null);
  const draggedEvent = React.useMemo(
    () => visibleEvents.find((e) => e.id === dragId) || null,
    [dragId, visibleEvents]
  );

  function onDragStart(evt) {
    setDragId(evt.active.id);
  }

  // Safer bounding: keep duration, clamp within day, ensure >= 1 slot
  function onDragEnd(evt) {
    const { active, over } = evt;
    setDragId(null);
    if (!over) return;

    const ev = visibleEvents.find((e) => e.id === active.id);
    if (!ev) return;
    // Expect droppable id format: slot:<dayIndex>:<roomId>:<col>
    const parts = String(over.id).split(":");
    if (parts.length !== 4) return;
    const [, dayStr, roomId, colStr] = parts;
    const destDay = Number(dayStr);
    const destCol = Number(colStr);

    const durationMin = toMinutes(ev.end) - toMinutes(ev.start);
    const dayStartMin = startHour * 60;
    const dayEndMin = endHour * 60;

    // compute start minute from column
    let startMin = toMinutes(colToTime(destCol - 1));
    startMin = Math.max(dayStartMin, Math.min(startMin, dayEndMin - minutesPerSlot));

    let endMin = startMin + durationMin;
    if (endMin > dayEndMin) {
      const shift = endMin - dayEndMin;
      startMin = Math.max(dayStartMin, startMin - shift);
      endMin = startMin + durationMin;
      endMin = Math.min(endMin, dayEndMin);
    }
    if (endMin <= startMin) {
      endMin = Math.min(startMin + minutesPerSlot, dayEndMin);
    }

    const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

    const next = { ...ev, dayIndex: destDay, roomId: roomId || ev.roomId, start: fmt(startMin), end: fmt(endMin) };
    onUpdate?.(ev.id, next);
  }

  // --- Styles ---
  const headerCellSx = (theme) => ({
    display: "grid",
    placeItems: "center",
    fontSize: 12,
    color: theme.palette.text.secondary,
    borderBottom: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
    height: 40,
  });

  const dayLabelSx = (theme) => ({
    display: "grid",
    placeItems: "center",
    fontWeight: 600,
    color: theme.palette.text.secondary,
    borderRight: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
    height: effectiveRowHeight,
  });

  const cellSx = (theme) => ({
    borderRight: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: effectiveRowHeight,
    position: "relative",
    display: "flex",
    alignItems: "stretch",
  });

  const breakBandSx = (color) => ({
    position: "absolute",
    inset: 4,
    borderRadius: 1,
    bgcolor: color || "action.selected",
    opacity: 0.85,
    outline: "1px solid rgba(0,0,0,.08)",
    pointerEvents: "none",
    zIndex: 0,
  });

  // Simple cell container (non-droppable in room-grouped view)
  function CellBox({ children }) {
    return (
      <Box role="gridcell" sx={cellSx}>
        {children}
      </Box>
    );
  }

  // Draggable event card
  function DraggableEvent({ event }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: event.id,
    });
    const style = {
      transform: transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
      zIndex: isDragging ? 1000 : 1,
    };
    return (
      <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        <EventCardMUI
          event={event}
          teacher={teacherById.get(event.teacherId)}
          room={roomById.get(event.roomId)}
          violationClass={violationClassOf(event)}
          onEdit={() => onEdit?.(event.id)}
          onDelete={() => onDelete?.(event.id)}
        />
      </div>
    );
  }

  // --- Row component for react-window v2 ---
  // Receives index & style from List + all props passed via rowProps
  const totalRows = cfgDays.length * visibleRooms.length;

  function DayRow({ index: rowIndex, style, totalSlots, minutesPerSlot, eventsByDayRoomSlot, breakByDaySlot }) {
    const dayIndex = Math.floor(rowIndex / visibleRooms.length);
    const roomIndex = rowIndex % visibleRooms.length;
    const dayName = cfgDays[dayIndex];
    const room = visibleRooms[roomIndex];
    const bSlots = breakByDaySlot[dayIndex];

    return (
      <Box
        style={style}
        sx={{
          display: "grid",
          gridTemplateColumns: `${DAY_LABEL_COL_WIDTH}px ${ROOM_LABEL_COL_WIDTH}px repeat(${totalSlots}, 1fr)`,
          alignItems: "stretch",
        }}
      >
        {/* Day label - only render in first room row for the day */}
        <Box role="rowheader" sx={dayLabelSx}>
          {roomIndex === 0 ? dayName : null}
        </Box>

        {/* Room label */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 1, borderRight: `1px solid`, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <div>{room?.name}</div>
        </Box>

        {/* Time slot droppables for this room row */}
        {Array.from({ length: totalSlots }, (_, c) => {
          const col = c + 3; // offset after labels to match droppable ids
          const droppableId = `slot:${dayIndex}:${room?.id ?? ''}:${col}`;
          const isHour = c % SLOTS_PER_HOUR === 0;
          return <DroppableSlot key={`slot-${rowIndex}-${c}`} id={droppableId} col={col} row={1} isHour={isHour} onCreate={({ dayIndex: d, roomId, col: clickedCol }) => {
            // compute start/end from clicked column
            const start = colToTime(clickedCol - 1);
            const startMin = toMinutes(start);
            const endMin = startMin + minutesPerSlot;
            const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
            const end = fmt(endMin);
            onCreateFromGrid && onCreateFromGrid({ dayIndex: d, start, end, roomId });
          }} />;
        })}

        {/* Events for this room/day (positioned by grid columns) */}
        {(() => {
          const slots = eventsByDayRoomSlot[dayIndex]?.[roomIndex] || [];
          const flat = [].concat(...slots);
          const uniqMap = new Map(flat.map((ev) => [ev.id, ev]));
          const roomEvents = Array.from(uniqMap.values()).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

          return roomEvents.map((ev) => {
            const startCol = timeToCol(ev.start) + 1;
            const endCol = timeToCol(ev.end) + 1;
            const teacherName = Array.isArray(ev.teacherIds) && ev.teacherIds.length > 0
              ? ev.teacherIds.map(id => teacherById.get(id)?.name || id).join(', ')
              : (teacherById.get(ev.teacherId)?.name || '');
            const enriched = { ...ev, teacherName };
            return (
              <Box
                key={`evt-${ev.id}`}
                sx={{ gridColumn: `${startCol} / ${endCol}`, gridRow: 1, p: 0.25, zIndex: 2 }}
              >
                <EventCardMUI
                  event={enriched}
                  teacher={teacherById.get(ev.teacherId)}
                  room={roomById.get(ev.roomId)}
                  violationClass={violationClassOf(ev)}
                  onEdit={() => onEdit?.(ev.id)}
                  onDelete={() => onDelete?.(ev.id)}
                />
              </Box>
            );
          });
        })()}
      </Box>
    );
  }
  

  // --- react-window v2: listRef + "Today" scroll ---
  const listRef = React.useRef(null);

  const findTodayIndex = React.useCallback(() => {
    const now = new Date();
    const longName = now.toLocaleDateString(undefined, { weekday: "long" }).toLowerCase();
    const shortName = now.toLocaleDateString(undefined, { weekday: "short" }).toLowerCase();

    const byLabel = DAYS.findIndex((d) => {
      const s = String(d).toLowerCase();
      return s.startsWith(longName) || s.startsWith(shortName);
    });
    if (byLabel >= 0) return byLabel;

    // Fallback: assume Monday-first ordering
    const js = now.getDay(); // Sun=0..Sat=6
    const mondayFirst = [6, 0, 1, 2, 3, 4, 5]; // map JS => Monday-first
    return mondayFirst[js] ?? 0;
  }, []);

  const scrollToToday = React.useCallback(() => {
    const targetDay = findTodayIndex();
    const targetRow = targetDay * Math.max(1, visibleRooms.length);
    listRef.current?.scrollToRow(targetRow, { align: "center" });
  }, [findTodayIndex, visibleRooms.length]);

  const viewportHeight = Math.min(480, effectiveRowHeight * Math.min(DAYS.length, 6));

  return (
    <Box
      aria-label="Timetable"
      role="grid"
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        overflow: "hidden",
      })}
    >
      {/* Small screen hint */}
      {isSmallScreen && (
        <Alert severity="info" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScreenRotationIcon /> Rotate device for best experience (landscape).
        </Alert>
      )}

      {/* Header row: toolbar + time labels */}
      <Box
        sx={(theme) => ({
          display: "grid",
          gridTemplateColumns: `${DAY_LABEL_COL_WIDTH}px ${ROOM_LABEL_COL_WIDTH}px repeat(${totalSlots}, 1fr)`,
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 2,
          background: theme.palette.background.paper,
        })}
      >
        <Box sx={{ ...headerCellSx, display: "flex", alignItems: "center", justifyContent: "space-between", px: 1 }}>
          <span />
          <Button size="small" variant="outlined" onClick={scrollToToday}>
            Today
          </Button>
        </Box>

        <Box sx={{ ...headerCellSx }} />

        {Array.from({ length: endHour - startHour }, (_, i) => startHour + i).map((h, i) => (
          <Box
            key={`hour-${h}`}
            sx={{
              gridColumn: `${i * SLOTS_PER_HOUR + 3} / span ${SLOTS_PER_HOUR}`,
              px: 1,
              display: 'flex',
              alignItems: 'center',
              borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>{hourLabel(h)}</Typography>
          </Box>
        ))}
      </Box>

      {/* Virtualized rows + DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <List
          listRef={listRef}
          rowComponent={DayRow}
          rowCount={totalRows}
          rowHeight={effectiveRowHeight}
          overscanCount={overscan}
          rowProps={{
              totalSlots,
              minutesPerSlot,
              eventsByDayRoomSlot,
              breakByDaySlot,
            }}
          style={{ height: viewportHeight, width: "100%" }}
          defaultHeight={viewportHeight}
        />

        <DragOverlay>
          {draggedEvent ? (
            <EventCardMUI
              event={draggedEvent}
              teacher={teacherById.get(draggedEvent.teacherId)}
              room={roomById.get(draggedEvent.roomId)}
              violationClass={violationClassOf(draggedEvent)}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </Box>
  );
}