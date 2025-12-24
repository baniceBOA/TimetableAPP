import * as React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import { FixedSizeList } from "react-window";
import { List } from "react-window";

//import List from "@mui/material/List";

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

import EventCardMUI from "./EventCardMUI.jsx";
import { DAYS, START_HOUR, END_HOUR, SLOTS_PER_HOUR } from "../constants";
import { toMinutes, eventTouchesSlot, slotLabel } from "../utils/time";
import { checkTeacherTime, checkSubjectTime } from "../utils/timeConstraints";

/**
 * TimetableMUI with drag & drop and row virtualization.
 * Props:
 *  - events, breaks, teachers, rooms
 *  - teacherId, roomsFilter[], subjectFilter[]
 *  - onEdit(id), onDelete(id), onUpdate(id, next), onCreateFromGrid({ dayIndex, start, end })
 *  - getViolationClass?(event)
 *  - timeConstraints, limitsEnabled, constraints, teacherConstraints
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
  rowHeight = 64, // virtualized item size (px)
  overscan = 3,   // how many extra rows to render (performance)
}) {
  const totalSlots = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR;
  const hours = React.useMemo(
    () => Array.from({ length: totalSlots }, (_, i) => slotLabel(i)),
    []
  );

  // Apply filters
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

  // Index breaks by day
  const breaksByDay = React.useMemo(() => {
    const map = new Map();
    for (let d = 0; d < DAYS.length; d++) map.set(d, []);
    for (const b of breaks) {
      map.get(b.dayIndex)?.push(b);
    }
    return map;
  }, [breaks]);

  // Violation class fallback (if getViolationClass not provided)
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
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // small drag threshold
    })
  );

  const [dragId, setDragId] = React.useState(null);
  const draggedEvent = React.useMemo(
    () => visibleEvents.find((e) => e.id === dragId) || null,
    [dragId, visibleEvents]
  );

  function onDragStart(evt) {
    setDragId(evt.active.id);
  }

  function onDragEnd(evt) {
    const { active, over } = evt;
    setDragId(null);
    if (!over) return; // dropped outside any cell

    const ev = visibleEvents.find((e) => e.id === active.id);
    if (!ev) return;

    // Drop target id: "cell:dayIdx:slotIdx"
    const [, dayStr, slotStr] = String(over.id).split(":");
    const destDay = Number(dayStr);
    const destSlot = Number(slotStr);

    // Keep duration; snap start to destSlot; end = start + duration
    const durationMin = toMinutes(ev.end) - toMinutes(ev.start);
    const startLabel = slotLabel(destSlot);
    const startMin = toMinutes(startLabel);
    const endMin = startMin + durationMin;

    // Bound end within day
    const dayEndMin = END_HOUR * 60;
    const safeEndMin = Math.min(endMin, dayEndMin);
    const newEnd =
      `${String(Math.floor(safeEndMin / 60)).padStart(2, "0")}:${String(safeEndMin % 60).padStart(2, "0")}`;

    const next = { ...ev, dayIndex: destDay, start: startLabel, end: newEnd };

    // Let App-level onUpdate perform constraints validation (messages/snackbar)
    onUpdate?.(ev.id, next);
  }

  // --- styles ---
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
    height: rowHeight,
  });

  const cellSx = (theme) => ({
    borderRight: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: rowHeight,
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

  // Droppable cell
  function DropCell({ dayIndex, slotIndex, children }) {
    const { setNodeRef } = useDroppable({
      id: `cell:${dayIndex}:${slotIndex}`,
    });
    return (
      <Box ref={setNodeRef} role="gridcell" sx={cellSx}>
        {children}
      </Box>
    );
  }

  // Draggable event card
  function DraggableEvent({ event, teacher, room }) {
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
          teacher={teacher}
          room={room}
          violationClass={violationClassOf(event)}
          onEdit={() => onEdit?.(event.id)}
          onDelete={() => onDelete?.(event.id)}
        />
      </div>
    );
  }

  // Per-row renderer for react-window
  function DayRow({ index: dayIndex, style }) {
    const dayName = DAYS[dayIndex];
    const dayBreaks = breaksByDay.get(dayIndex) || [];

    // Pre-index events for the day (small speed-up)
    const dayEvents = visibleEvents.filter((e) => e.dayIndex === dayIndex);

    return (
      <Box style={style} sx={{ display: "grid", gridTemplateColumns: `120px repeat(${totalSlots}, 1fr)` }}>
        {/* Day label */}
        <Box role="rowheader" sx={dayLabelSx}>
          {dayName}
        </Box>

        {/* Day slots */}
        {Array.from({ length: totalSlots }, (_, s) => {
          const cellEvents = dayEvents.filter((ev) => eventTouchesSlot(ev, s));
          const breakInCell = dayBreaks.find((b) => {
            const cs = START_HOUR * 60 + s * (60 / SLOTS_PER_HOUR);
            const ce = cs + 60 / SLOTS_PER_HOUR;
            const bs = toMinutes(b.start);
            const be = toMinutes(b.end);
            return Math.max(cs, bs) < Math.min(ce, be);
          });

          const onCreateHere = () => {
            const start = slotLabel(s);
            const endMinutes = toMinutes(start) + 60 / SLOTS_PER_HOUR;
            const end =
              `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
            onCreateFromGrid && onCreateFromGrid({ dayIndex, start, end });
          };

          return (
            <DropCell key={`cell-${dayIndex}-${s}`} dayIndex={dayIndex} slotIndex={s}>
              {/* Break shading */}
              {breakInCell && (
                <Box sx={breakBandSx(breakInCell.color)} aria-label={`Break: ${breakInCell.label}`} />
              )}

              {/* Top-most event (grid style) */}
              {cellEvents.length > 0 ? (
                <Stack direction="column" spacing={0.5} sx={{ zIndex: 1, p: 0.5, width: "100%" }}>
                  <DraggableEvent
                    event={cellEvents[0]}
                    teacher={teachers.find((t) => t.id === cellEvents[0].teacherId)}
                    room={rooms.find((r) => r.id === cellEvents[0].roomId)}
                  />
                </Stack>
              ) : (
                !breakInCell && (
                  <Tooltip title="Double‑click to add a class here">
                    <IconButton
                      size="small"
                      onDoubleClick={onCreateHere}
                      sx={{
                        position: "absolute",
                        right: 4,
                        bottom: 4,
                        opacity: 0.3,
                        ":hover": { opacity: 0.8 },
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              )}
            </DropCell>
          );
        })}
      </Box>
    );
  }

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
      {/* Header row: time labels (fixed) */}
      <Box
        sx={(theme) => ({
          display: "grid",
          gridTemplateColumns: `120px repeat(${totalSlots}, 1fr)`,
        })}
      >
        <Box sx={headerCellSx} />
        {hours.map((h) => (
          <Box key={`h-${h}`} sx={headerCellSx}>
            {h}
          </Box>
        ))}
      </Box>

      {/* Virtualized day rows + DnD context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <List
          height={Math.min(480, rowHeight * Math.min(DAYS.length, 6))} // viewport height
          itemCount={DAYS.length}
          itemSize={rowHeight}
          overscanCount={overscan}
          width="100%"
        >
          {DayRow}
        </List>

        {/* Drag overlay: keeps card visible while dragging */}
        <DragOverlay>
          {draggedEvent ? (
            <EventCardMUI
              event={draggedEvent}
              teacher={teachers.find((t) => t.id === draggedEvent.teacherId)}
              room={rooms.find((r) => r.id === draggedEvent.roomId)}
              violationClass={violationClassOf(draggedEvent)}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </Box>
  );
}