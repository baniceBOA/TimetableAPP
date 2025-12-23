import { useRef } from "react";
import { DAYS, TOTAL_COLS, ROW_HEIGHT } from "../constants";
import { timeToCol, colToTime } from "../utils/time";
import EventItem from "./EventItem";
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
export default function DraggableEvent({ event, layout, onUpdate, onEdit, onDelete }){
  const movingRef = useRef(null);
  const resizingRef = useRef(null);
  const earliestCol = 3; const latestCol = 3 + TOTAL_COLS;
  function onPointerDownMove(e){
    if (e.target.closest('.event-tooltip')) return;
    if (e.target.closest('.event-actions')) return;
    const startCol = timeToCol(event.start) + 1;
    const endCol = timeToCol(event.end) + 1;
    movingRef.current = { startCol, endCol, dayIndex: event.dayIndex, startX: e.clientX, startY: e.clientY, dragStarted:false, t0: performance.now() };
    e.currentTarget.setPointerCapture(e.pointerId);
    window.addEventListener('pointermove', onPointerMoveMove);
    window.addEventListener('pointerup', onPointerUpMove);
  }
  function onPointerMoveMove(e){
    const st = movingRef.current; if(!st || !layout.colWidth) return;
    const dx = e.clientX - st.startX; const dy = e.clientY - st.startY;
    const dist = Math.sqrt(dx*dx + dy*dy); const elapsed = performance.now() - st.t0;
    if (!st.dragStarted && dist < 5 && elapsed < 120) return;
    st.dragStarted = true;
    const slotDelta = Math.round(dx / layout.colWidth);
    let newStartCol = clamp(st.startCol + slotDelta, earliestCol, latestCol-1);
    let newEndCol = newStartCol + (st.endCol - st.startCol);
    if (newEndCol > latestCol) { newEndCol = latestCol; newStartCol = newEndCol - (st.endCol - st.startCol); }
    const dayDelta = Math.round(dy / ROW_HEIGHT);
    const newDayIndex = clamp(st.dayIndex + dayDelta, 0, DAYS.length-1);
    onUpdate(event.id, { ...event, dayIndex: newDayIndex, start: colToTime(newStartCol - 1), end: colToTime(newEndCol - 1) });
  }
  function onPointerUpMove(e){ try{ e.target.releasePointerCapture(e.pointerId);}catch{} movingRef.current=null; window.removeEventListener('pointermove', onPointerMoveMove); window.removeEventListener('pointerup', onPointerUpMove); }
  function startResize(e, type){ e.stopPropagation(); const baseStartCol = timeToCol(event.start) + 1; const baseEndCol = timeToCol(event.end) + 1; resizingRef.current = { type, baseStartCol, baseEndCol, startX: e.clientX }; e.currentTarget.setPointerCapture(e.pointerId); window.addEventListener('pointermove', onPointerMoveResize); window.addEventListener('pointerup', onPointerUpResize); }
  function onPointerMoveResize(e){ const st = resizingRef.current; if(!st || !layout.colWidth) return; const dx = e.clientX - st.startX; const slotDelta = Math.round(dx / layout.colWidth); let newStartCol = st.baseStartCol; let newEndCol = st.baseEndCol; if (st.type==='left') newStartCol = clamp(st.baseStartCol + slotDelta, 3, st.baseEndCol - 1); else newEndCol = clamp(st.baseEndCol + slotDelta, st.baseStartCol + 1, 3 + TOTAL_COLS); onUpdate(event.id, { ...event, start: colToTime(newStartCol - 1), end: colToTime(newEndCol - 1) }); }
  function onPointerUpResize(e){ try{ e.target.releasePointerCapture(e.pointerId);}catch{} resizingRef.current=null; window.removeEventListener('pointermove', onPointerMoveResize); window.removeEventListener('pointerup', onPointerUpResize); }
  const startCol = timeToCol(event.start) + 1; const endCol = timeToCol(event.end) + 1;
  return (
    <div className="event draggable" style={{ gridColumn: `${startCol} / ${endCol}`, gridRow: event.dayIndex + 1, backgroundColor: event.color }} onPointerDown={onPointerDownMove}>
      <div className="resize-handle left" onPointerDown={(e)=> startResize(e,'left')} />
      <div className="resize-handle right" onPointerDown={(e)=> startResize(e,'right')} />
      <EventItem event={event} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}
