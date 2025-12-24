import { useLayoutEffect, useRef, useState, useMemo } from "react";
import {
  DAYS, START_HOUR, END_HOUR, SLOTS_PER_HOUR, TOTAL_COLS,
  ROW_HEIGHT, DAY_LABEL_COL_WIDTH, ROOM_LABEL_COL_WIDTH, TIME_HEADER_HEIGHT
} from "../constants";
import { hourLabel, overlaps, timeToCol, colToTime } from "../utils/time";
import DraggableEvent from "./DraggableEvent";

// MUI
import {
  Box, Typography, Card, Button, Tooltip
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

export default function Timetable({
  events, onEdit, onDelete, onUpdate,
  teachers = [], rooms = [],
  onCreate,
  activeTeacherId = null,
  roomFilters = [],
  subjectFilters = [],
  breaks = [],
  getViolationClass = () => "",
}) {
  // Index maps
  const teacherById = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
  const roomById    = useMemo(() => new Map(rooms.map(r => [r.id, r])), [rooms]);

  const visibleRooms = useMemo(() => {
    if (!roomFilters || roomFilters.length === 0) return rooms;
    const sel = new Set(roomFilters);
    return rooms.filter(r => sel.has(r.id));
  }, [rooms, roomFilters]);

  const subjectOk = (ev) => {
    if (!subjectFilters || subjectFilters.length === 0) return true;
    const a = (ev.area || "").trim();
    return subjectFilters.includes(a);
  };

  const totalRows = DAYS.length * visibleRooms.length;
  function rowIndexFor(dayIndex, roomId) {
    const idx = Math.max(0, visibleRooms.findIndex(r => r.id === roomId));
    return dayIndex * visibleRooms.length + idx + 1;
  }
  function daySpanStart(dayIndex) {
    return dayIndex * visibleRooms.length + 1;
  }

  // Conflict detection
  const teacherConflicts = new Set();
  const roomConflicts    = new Set();
  for (let day = 0; day < DAYS.length; day++) {
    const perDay = events.filter(
      e => e.dayIndex === day &&
      visibleRooms.some(r => r.id === e.roomId) &&
      subjectOk(e)
    );

    const byTeacher = new Map();
    perDay.forEach(e => {
      if (!e.teacherId) return;
      const k = e.teacherId;
      if (!byTeacher.has(k)) byTeacher.set(k, []);
      byTeacher.get(k).push(e);
    });
    for (const [, list] of byTeacher) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          if (overlaps(list[i], list[j])) {
            teacherConflicts.add(list[i].id);
            teacherConflicts.add(list[j].id);
          }
        }
      }
    }

    const byRoom = new Map();
    perDay.forEach(e => {
      if (!e.roomId) return;
      const k = e.roomId;
      if (!byRoom.has(k)) byRoom.set(k, []);
      byRoom.get(k).push(e);
    });
    for (const [, list] of byRoom) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          if (overlaps(list[i], list[j])) {
            roomConflicts.add(list[i].id);
            roomConflicts.add(list[j].id);
          }
        }
      }
    }
  }

  // Measure column width
  const gridRef = useRef(null);
  const [colWidth, setColWidth] = useState(null);
  useLayoutEffect(() => {
    function measure() {
      const el = gridRef.current;
      if (!el) return;
      const rect   = el.getBoundingClientRect();
      const usable = rect.width - DAY_LABEL_COL_WIDTH - ROOM_LABEL_COL_WIDTH;
      setColWidth(usable / TOTAL_COLS);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Drag‑create selection
  const [selection, setSelection] = useState(null);
  const creatingRef = useRef(null);
  const earliestCol = 3;
  const latestCol   = 3 + TOTAL_COLS;

  function startCreate(e) {
    if (e.target.closest(".event-wrapper") || e.target.closest(".event")) return;
    if (!gridRef.current || !colWidth) return;

    const rect = gridRef.current.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;

    let rowIdx0 = Math.floor(y / ROW_HEIGHT);
    rowIdx0     = Math.max(0, Math.min(totalRows - 1, rowIdx0));
    const dayIndex  = Math.floor(rowIdx0 / visibleRooms.length);
    const roomIndex = rowIdx0 % visibleRooms.length;
    const roomId    = visibleRooms[roomIndex]?.id;

    const rawCol  = Math.floor((x - DAY_LABEL_COL_WIDTH - ROOM_LABEL_COL_WIDTH) / colWidth);
    let startCol  = earliestCol + rawCol;
    startCol      = Math.max(earliestCol, Math.min(latestCol - 1, startCol));

    creatingRef.current = { dayIndex, roomIndex, roomId, anchorCol: startCol, shift: e.shiftKey };
    setSelection({ dayIndex, roomIndex, roomId, startCol, endCol: startCol + 1 });

    window.addEventListener("pointermove", onCreateMove);
    window.addEventListener("pointerup",   onCreateEnd);
  }

  function onCreateMove(e) {
    const st = creatingRef.current;
    if (!st || !gridRef.current || !colWidth) return;

    const rect = gridRef.current.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;

    st.shift = e.shiftKey;

    let rowIdx0 = Math.floor(y / ROW_HEIGHT);
    rowIdx0     = Math.max(0, Math.min(totalRows - 1, rowIdx0));
    const dayIndex  = Math.floor(rowIdx0 / visibleRooms.length);
    const roomIndex = rowIdx0 % visibleRooms.length;

    const rawCol = Math.floor((x - DAY_LABEL_COL_WIDTH - ROOM_LABEL_COL_WIDTH) / colWidth);
    let currCol  = earliestCol + rawCol;
    currCol      = Math.max(earliestCol, Math.min(latestCol, currCol));

    if (st.shift) {
      const slotsPerHour = SLOTS_PER_HOUR;
      const slotIdx      = currCol - 3;
      currCol            = 3 + Math.round(slotIdx / slotsPerHour) * slotsPerHour;
    }

    let startCol = Math.min(st.anchorCol, currCol);
    let endCol   = Math.max(st.anchorCol + 1, currCol);
    endCol       = Math.min(latestCol, endCol);

    setSelection({
      dayIndex,
      roomIndex,
      roomId: visibleRooms[roomIndex]?.id,
      startCol,
      endCol
    });
  }

  function onCreateEnd() {
    window.removeEventListener("pointermove", onCreateMove);
    window.removeEventListener("pointerup",   onCreateEnd);

    const sel = selection;
    creatingRef.current = null;
    setSelection(null);
    if (!sel) return;

    const { dayIndex, roomId, startCol, endCol } = sel;
    if (endCol <= startCol) return;

    const start = colToTime(startCol - 1);
    const end   = colToTime(endCol   - 1);

    onCreate?.({
      title: "",
      dayIndex,
      start,
      end,
      color: "#2d8cff",
      teacherId: "",
      area: "",
      roomId: roomId || ""
    });
  }

  return (
    <Box sx={{ display: "grid", gap: 0.5 }}>
      {/* Header / actions */}
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
          px: 1,
          py: 0.5,
          borderRadius: 12,
          backgroundColor: (theme.vars || theme).palette.background.paper,
          border: `1px solid ${((theme.vars || theme).palette.divider) || "#1F2937"}`,
        })}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Timetable
        </Typography>

        <Tooltip title="Add class">
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => { /* optional: open a dialog */ }}
            sx={(theme) => ({
              // Use your custom tertiary token
              backgroundColor: theme.custom?.tertiary?.main || "#F953C6",
              color: theme.custom?.tertiary?.contrastText || "#0B1220",
              borderRadius: 999,
              "&:hover": {
                filter: "brightness(1.05)",
              },
            })}
          >
            New
          </Button>
        </Tooltip>
      </Box>

      {/* Time header row */}
      <Box
        className="grid-row time-header"
        sx={(theme) => ({
          display: "grid",
          gridTemplateColumns: `${DAY_LABEL_COL_WIDTH}px ${ROOM_LABEL_COL_WIDTH}px repeat(${TOTAL_COLS}, 1fr)`,
          height: TIME_HEADER_HEIGHT,
          alignItems: "center",
          backgroundColor: (theme.vars || theme).palette.background.paper,
          borderRadius: 12,
          border: `1px solid ${((theme.vars || theme).palette.divider) || "#1F2937"}`,
        })}
      >
        <Box sx={{ gridColumn: 1 }} />
        <Box sx={{ gridColumn: 2 }} />

        {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i).map((h, i) => (
          <Typography
            key={h}
            className="time-cell"
            variant="body2"
            sx={{
              gridColumn: `${i * SLOTS_PER_HOUR + 3} / span ${SLOTS_PER_HOUR}`,
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {hourLabel(h)}
          </Typography>
        ))}
      </Box>

      {/* Grid body */}
      <Box
        ref={gridRef}
        className="grid-body"
        onPointerDown={startCreate}
        sx={(theme) => ({
          display: "grid",
          gridTemplateColumns: `${DAY_LABEL_COL_WIDTH}px ${ROOM_LABEL_COL_WIDTH}px repeat(${TOTAL_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${totalRows}, ${ROW_HEIGHT}px)`,
          borderRadius: 12,
          backgroundColor: (theme.vars || theme).palette.background.default,
          border: `1px solid ${((theme.vars || theme).palette.divider) || "#1F2937"}`,
          position: "relative",
          overflow: "hidden",
        })}
      >
        {/* Day labels */}
        {DAYS.map((day, dayIndex) => (
          <Typography
            key={`day-${day}`}
            variant="subtitle2"
            sx={(theme) => ({
              gridColumn: 1,
              gridRow: `${daySpanStart(dayIndex)} / span ${visibleRooms.length}`,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              px: 1,
              color: (theme.vars || theme).palette.text.secondary,
            })}
          >
            {day}
          </Typography>
        ))}

        {/* Room labels */}
        {DAYS.map((_, dayIndex) =>
          visibleRooms.map((room, roomIndex) => (
            <Typography
              key={`room-${dayIndex}-${room.id}`}
              variant="body2"
              sx={(theme) => ({
                gridColumn: 2,
                gridRow: dayIndex * visibleRooms.length + roomIndex + 1,
                display: "flex",
                alignItems: "center",
                px: 1,
                color: (theme.vars || theme).palette.text.secondary,
              })}
            >
              {room.name}
            </Typography>
          ))
        )}

        {/* Slots (hour separators highlighted) */}
        {Array.from({ length: TOTAL_COLS }, (_, c) => c).map((c) =>
          Array.from({ length: totalRows }, (_, r) => (
            <Box
              key={`slot-${r}-${c}`}
              sx={(theme) => ({
                gridColumn: c + 3,
                gridRow: r + 1,
                borderLeft:
                  c % SLOTS_PER_HOUR === 0
                    ? `1px solid ${((theme.vars || theme).palette.divider) || "#1F2937"}`
                    : undefined,
                backgroundColor: "transparent",
              })}
            />
          ))
        )}

        {/* Break bands across visible rooms */}
        {DAYS.map((_, dayIndex) =>
          breaks
            .filter((b) => b.dayIndex === dayIndex)
            .map((b) => {
              const startCol = timeToCol(b.start) + 1;
              const endCol   = timeToCol(b.end)   + 1;
              const rowStart = daySpanStart(dayIndex);
              const rowSpan  = visibleRooms.length;

              return (
                <Card
                  key={`break-${dayIndex}-${b.start}-${b.end}-${b.label}`}
                  elevation={0}
                  sx={(theme) => ({
                    gridColumn: `${startCol} / ${endCol}`,
                    gridRow: `${rowStart} / span ${rowSpan}`,
                    borderRadius: 8,
                    px: 1,
                    py: 0.5,
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: b.color || (theme.vars || theme).palette.background.paper,
                    border: `1px dashed ${((theme.vars || theme).palette.divider) || "#1F2937"}`,
                  })}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {b.label || "Break"}
                  </Typography>
                </Card>
              );
            })
        )}

        {/* Events */}
        {events
          .filter((ev) => visibleRooms.some((r) => r.id === ev.roomId) && subjectOk(ev))
          .map((ev) => {
            const startCol = timeToCol(ev.start) + 1;
            const endCol   = timeToCol(ev.end)   + 1;
            const t        = ev.teacherId ? teacherById.get(ev.teacherId) : null;
            const r        = ev.roomId    ? roomById.get(ev.roomId)       : null;
            const enriched = { ...ev, teacherName: t?.name || "", roomName: r?.name || "" };

            const isTeacherConflict = teacherConflicts.has(ev.id);
            const isRoomConflict    = roomConflicts.has(ev.id);

            const rowIdx        = rowIndexFor(ev.dayIndex, ev.roomId);
            const violationClass= getViolationClass(ev);

            return (
              <Box
                key={ev.id}
                className={`event-wrapper ${violationClass}`}
                sx={(theme) => ({
                  gridColumn: `${startCol} / ${endCol}`,
                  gridRow: rowIdx,
                  borderRadius: 10,
                  p: 0.25,
                  transition: "transform 200ms cubic-bezier(0.05, 0.7, 0.1, 1.0)",
                  "&:hover": { transform: "translateY(-1px)" },
                  outline: isTeacherConflict && isRoomConflict
                    ? `2px solid ${(theme.vars || theme).palette.error.main}`
                    : isTeacherConflict
                    ? `2px solid ${((theme.vars || theme).palette.warning?.main) || ((theme.vars || theme).palette.error.main)}`
                    : isRoomConflict
                    ? `2px dashed ${(theme.vars || theme).palette.error.main}`
                    : undefined,
                })}
              >
                <DraggableEvent
                  event={enriched}
                  layout={{ colWidth: colWidth || 1 }}
                  onUpdate={onUpdate}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </Box>
            );
          })}
      </Box>
    </Box>
  );
}