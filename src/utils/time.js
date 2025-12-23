import { format } from "date-fns";
import { START_HOUR, SLOTS_PER_HOUR } from "../constants";
export function toMinutes(hhmm) { if (!hhmm) return 0; const [H,M] = hhmm.split(":").map(Number); return H*60 + (M||0); }
export function timeToCol(hhmm) { const mins = toMinutes(hhmm); const delta = Math.max(0, mins - START_HOUR*60); return Math.round(delta / (60/SLOTS_PER_HOUR)) + 2; }
export function colToTime(col) { const slotIndex = col - 2; const m = START_HOUR*60 + slotIndex*(60/SLOTS_PER_HOUR); const h = Math.floor(m/60), mm = m%60; return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; }
export function hourLabel(h){ return format(new Date(2020,1,1,h,0), "HH:mm"); }
export function overlaps(a,b){ const as=toMinutes(a.start), ae=toMinutes(a.end), bs=toMinutes(b.start), be=toMinutes(b.end); return Math.max(as,bs) < Math.min(ae,be); }
export function slotLabel(slotIndex){ const mins = START_HOUR*60 + slotIndex*(60/SLOTS_PER_HOUR); const h = String(Math.floor(mins/60)).padStart(2,'0'); const m = String(mins%60).padStart(2,'0'); return `${h}:${m}`; }
export function eventTouchesSlot(event, slotIndex){ const slotStart = START_HOUR*60 + slotIndex*(60/SLOTS_PER_HOUR); const slotEnd=slotStart+(60/SLOTS_PER_HOUR); const s=toMinutes(event.start), e=toMinutes(event.end); return Math.max(s,slotStart) < Math.min(e,slotEnd); }
