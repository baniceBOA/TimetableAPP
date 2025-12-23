import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, WidthType, TextRun, ImageRun, AlignmentType, ShadingType } from "docx";
import { format } from "date-fns";
import { DAYS, START_HOUR, END_HOUR, SLOTS_PER_HOUR } from "../constants";
import { toMinutes } from "./time";

const DAY_COL_WIDTH_PT = 52;     // ~0.72 in
const SLOT_COL_WIDTH_PT = 30;    // ~0.42 in per slot column
const ROW_HEIGHT_PT = 22;        // fixed row height for body rows
const HEAD_ROW_HEIGHT_PT = 24;   // header row height

function drawTitleRoomCell(doc, data, title, room, isBreak) {
  const paddingX = 2;  // cellPadding is small; keep a bit of margin
  const lineYMain = data.cell.y + 9;               // main line baseline
  const lineYSub  = data.cell.y + 15;              // "subscript" line baseline (lower)
  const centerX   = data.cell.x + data.cell.width / 2;

  // Fill background handled by autotable (we still respect break shading)
  // Centered text:
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(String(title || ''), centerX, lineYMain, { align: 'center' });

  if (room) {
    doc.setFont('helvetica', 'italic'); // slight visual difference
    doc.setFontSize(6.0);
    doc.text(String(room), centerX, lineYSub, { align: 'center' });
  }

  // Optional: border is autotable; nothing else here
}

function safeName(name){ return (name||'export').replace(/[^\w\- ]/g,'_').replace(/\s+/g,'_'); }
function todayStamp(){ const d=new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${y}${m}${dd}`; }
async function dataUrlToArrayBuffer(dataUrl){ const res = await fetch(dataUrl); return await res.arrayBuffer(); }
function heading(text){ return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { after: 140 } }); }
function small(text){ return new Paragraph({ children: [new TextRun({ text, size: 18, color: '666666' })], spacing: { after: 120 } }); }
function table(headers, rows){ const headerRow=new TableRow({ children: headers.map(h=> new TableCell({ children:[new Paragraph({ text: h })] })) }); const bodyRows=rows.map(r=> new TableRow({ children: r.map(cell=> new TableCell({ children:[new Paragraph(String(cell??''))] })) })); return new Table({ width:{ size:100, type: WidthType.PERCENTAGE }, rows:[headerRow, ...bodyRows] }); }
const totalSlots = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR;
function slotLabel(slotIndex){ const mins = START_HOUR*60 + slotIndex*(60/SLOTS_PER_HOUR); const h = String(Math.floor(mins/60)).padStart(2,'0'); const m = String(mins%60).padStart(2,'0'); return `${h}:${m}`; }
function eventTouchesSlot(event, slotIndex){ const slotStart = START_HOUR*60 + slotIndex*(60/SLOTS_PER_HOUR); const slotEnd=slotStart+(60/SLOTS_PER_HOUR); const s=toMinutes(event.start), e=toMinutes(event.end); return Math.max(s,slotStart) < Math.min(e,slotEnd); }
function breakTouchesSlot(dayIndex, slotIndex, breaks){ const slotStart = START_HOUR*60 + slotIndex*(60/SLOTS_PER_HOUR); const slotEnd=slotStart+(60/SLOTS_PER_HOUR); for(const b of breaks||[]){ if(b.dayIndex!==dayIndex) continue; const s=toMinutes(b.start), e=toMinutes(b.end); if (Math.max(s,slotStart) < Math.min(e,slotEnd)) return true; } return false; }
function breakStartingHere(dayIndex, slotIndex, breaks){ const slotStart = START_HOUR*60 + slotIndex*(60/SLOTS_PER_HOUR); for(const b of breaks||[]){ if(b.dayIndex!==dayIndex) continue; if (toMinutes(b.start) === slotStart) return b; } return null; }

export async function exportTeachersBatchPDF(teachers, events, rooms, schoolName="Timetable", opts={}, progress){ if(!teachers?.length) return; const orientation = opts.orientation==='landscape'? 'landscape':'portrait'; const doc = new jsPDF({ orientation, unit:'pt', format:'a4' }); progress?.start?.('Exporting Teachers (PDF)…'); if(opts.logoDataUrl){ try{ doc.addImage(opts.logoDataUrl, 'PNG', 40,24,120,36); }catch{} } let y = 80 + (opts.logoDataUrl? 40: 0); for(let i=0;i<teachers.length;i++){ if(progress?.isCancelled?.()){ progress?.done?.('Export canceled'); return; } const t=teachers[i]; doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text(`${t.name} • Schedule`, 40, y); doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(`${schoolName} • Generated ${format(new Date(),'PPPp')}`, 40, y+16); const rows = events.filter(e=> e.teacherId===t.id).map(e=>({ dayIndex:e.dayIndex, day:DAYS[e.dayIndex], time:`${e.start}–${e.end}`, title:e.title||'', area:e.area||'', room: rooms.find(r=> r.id===e.roomId)?.name||'', startMin: toMinutes(e.start) })).sort((a,b)=> (a.dayIndex-b.dayIndex)||(a.startMin-b.startMin)).map(r=> [r.day, r.time, r.title, r.area, r.room]); autoTable(doc,{ startY: y+32, head:[["Day","Time","Class","Subject","Room"]], body: rows, styles:{ fontSize:10, cellPadding:6 }, headStyles:{ fillColor:[45,140,255] }, margin:{ left:40, right:40 } }); progress?.update?.(Math.round(((i+1)/teachers.length)*100), `Teachers PDF: ${t.name}`); if(i<teachers.length-1){ doc.addPage(); y = 80 + (opts.logoDataUrl? 40: 0); if(opts.logoDataUrl){ try{ doc.addImage(opts.logoDataUrl, 'PNG', 40,24,120,36);}catch{} } } await new Promise(r=> setTimeout(r,0)); } doc.save(`teachers_batch_${todayStamp()}.pdf`); progress?.done?.('Teachers PDF exported'); }
export async function exportTeachersBatchDocx(teachers, events, rooms, schoolName="Timetable", opts={}, progress){ if(!teachers?.length) return; const orientation = opts.orientation==='landscape'? 'landscape':'portrait'; progress?.start?.('Exporting Teachers (DOCX)…'); const sections=[]; for(let i=0;i<teachers.length;i++){ if(progress?.isCancelled?.()){ progress?.done?.('Export canceled'); return; } const t=teachers[i]; const children=[]; if(opts.logoDataUrl){ try{ const buf=await dataUrlToArrayBuffer(opts.logoDataUrl); children.push(new Paragraph({ children:[new ImageRun({ data:buf, transformation:{ width:120, height:36 } })], spacing:{ after:140 } })); }catch{} } children.push(heading(`${t.name} – Schedule`)); children.push(small(`${schoolName} • Generated ${format(new Date(),'PPPp')}`)); const rows = events.filter(e=> e.teacherId===t.id).map(e=>({ dayIndex:e.dayIndex, day:DAYS[e.dayIndex], time:`${e.start}–${e.end}`, title:e.title||'', area:e.area||'', room: rooms.find(r=> r.id===e.roomId)?.name||'', startMin: toMinutes(e.start) })).sort((a,b)=> (a.dayIndex-b.dayIndex)||(a.startMin-b.startMin)).map(r=> [r.day, r.time, r.title, r.area, r.room]); children.push(table(["Day","Time","Class","Subject","Room"], rows.length? rows : [["—","—","No classes found","—","—"]])); sections.push({ properties:{ page:{ size:{ orientation } } }, children }); progress?.update?.(Math.round(((i+1)/teachers.length)*100), `Teachers DOCX: ${t.name}`); await new Promise(r=> setTimeout(r,0)); } if(progress?.isCancelled?.()){ progress?.done?.('Export canceled'); return; } const doc = new Document({ sections }); const blob = await Packer.toBlob(doc); saveAs(blob, `teachers_batch_${todayStamp()}.docx`); progress?.done?.('Teachers DOCX exported'); }
export async function exportRoomsBatchPDF(rooms, events, teachers, schoolName="Timetable", opts={}, progress){ if(!rooms?.length) return; const orientation = opts.orientation==='landscape'? 'landscape':'portrait'; const doc = new jsPDF({ orientation, unit:'pt', format:'a4' }); progress?.start?.('Exporting Rooms (PDF)…'); if(opts.logoDataUrl){ try{ doc.addImage(opts.logoDataUrl, 'PNG', 40,24,120,36); }catch{} } let y = 80 + (opts.logoDataUrl? 40: 0); for(let i=0;i<rooms.length;i++){ if(progress?.isCancelled?.()){ progress?.done?.('Export canceled'); return; } const r=rooms[i]; doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text(`${r.name} • Room Schedule`, 40, y); doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(`${schoolName} • Generated ${format(new Date(),'PPPp')}`, 40, y+16); const rows = events.filter(e=> e.roomId===r.id).map(e=>({ dayIndex:e.dayIndex, day:DAYS[e.dayIndex], time:`${e.start}–${e.end}`, title:e.title||'', area:e.area||'', teacher: teachers.find(t=> t.id===e.teacherId)?.name||'', startMin: toMinutes(e.start) })).sort((a,b)=> (a.dayIndex-b.dayIndex)||(a.startMin-b.startMin)).map(rw=> [rw.day, rw.time, rw.title, rw.area, rw.teacher]); autoTable(doc,{ startY: y+32, head:[["Day","Time","Class","Subject","Teacher"]], body: rows, styles:{ fontSize:10, cellPadding:6 }, headStyles:{ fillColor:[245,158,11] }, margin:{ left:40, right:40 } }); progress?.update?.(Math.round(((i+1)/rooms.length)*100), `Rooms PDF: ${r.name}`); if(i<rooms.length-1){ doc.addPage(); y = 80 + (opts.logoDataUrl? 40: 0); if(opts.logoDataUrl){ try{ doc.addImage(opts.logoDataUrl, 'PNG', 40,24,120,36);}catch{} } } await new Promise(r=> setTimeout(r,0)); } doc.save(`rooms_batch_${todayStamp()}.pdf`); progress?.done?.('Rooms PDF exported'); }
export async function exportRoomsBatchDocx(rooms, events, teachers, schoolName="Timetable", opts={}, progress){ if(!rooms?.length) return; const orientation = opts.orientation==='landscape'? 'landscape':'portrait'; progress?.start?.('Exporting Rooms (DOCX)…'); const sections=[]; for(let i=0;i<rooms.length;i++){ if(progress?.isCancelled?.()){ progress?.done?.('Export canceled'); return; } const r=rooms[i]; const children=[]; if(opts.logoDataUrl){ try{ const buf=await dataUrlToArrayBuffer(opts.logoDataUrl); children.push(new Paragraph({ children:[new ImageRun({ data:buf, transformation:{ width:120, height:36 } })], spacing:{ after:140 } })); }catch{} } children.push(heading(`${r.name} – Room Schedule`)); children.push(small(`${schoolName} • Generated ${format(new Date(),'PPPp')}`)); const rows = events.filter(e=> e.roomId===r.id).map(e=>({ dayIndex:e.dayIndex, day:DAYS[e.dayIndex], time:`${e.start}–${e.end}`, title:e.title||'', area:e.area||'', teacher: teachers.find(t=> t.id===e.teacherId)?.name||'', startMin: toMinutes(e.start) })).sort((a,b)=> (a.dayIndex-b.dayIndex)||(a.startMin-b.startMin)).map(rw=> [rw.day, rw.time, rw.title, rw.area, rw.teacher]); children.push(table(["Day","Time","Class","Subject","Teacher"], rows.length? rows : [["—","—","No classes found","—","—"]])); sections.push({ properties:{ page:{ size:{ orientation } } }, children }); progress?.update?.(Math.round(((i+1)/rooms.length)*100), `Rooms DOCX: ${r.name}`); await new Promise(r=> setTimeout(r,0)); } if(progress?.isCancelled?.()){ progress?.done?.('Export canceled'); return; } const doc = new Document({ sections }); const blob = await Packer.toBlob(doc); saveAs(blob, `rooms_batch_${todayStamp()}.docx`); progress?.done?.('Rooms DOCX exported'); }

export async function exportTeacherGridPDF(teacher, events, rooms, schoolName="Timetable", opts={}, breaks=[]) {
  if (!teacher) return;
  const orientation = opts.orientation==='landscape'? 'landscape':'portrait';
  const doc = new jsPDF({ orientation, unit:'pt', format:'a4' });

  // Header/logo (unchanged)
  if (opts.logoDataUrl) { try { doc.addImage(opts.logoDataUrl, 'PNG', 40, 24, 120, 36); } catch {} }
  const titleY = 40 + (opts.logoDataUrl ? 40 : 0);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text(`${teacher.name} • Weekly Grid`, 40, titleY);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`${schoolName} • Generated ${format(new Date(),'PPPp')}`, 40, titleY+18);

  const teacherEvents = events.filter(e => e.teacherId === teacher.id);
  const roomById = new Map(rooms.map(r => [r.id, r]));

  // Build head and body matrix with minimal raw text (we’ll custom draw)
  const head = ["Day", ...Array.from({ length: totalSlots }, (_, s) => slotLabel(s))];

  const body = DAYS.map((dayName, dayIndex) => {
    const dayEvents = teacherEvents.filter(e => e.dayIndex === dayIndex);
    const row = [dayName];
    for (let s = 0; s < totalSlots; s++) {
      const isBreakSlot = breakTouchesSlot(dayIndex, s, breaks);
      const startBreak  = breakStartingHere(dayIndex, s, breaks);

      // Which events touch this slot?
      const touching = dayEvents.filter(ev => eventTouchesSlot(ev, s));
      if (touching.length === 0) {
        // Show Break label only ONCE at the first touched slot
        row.push(startBreak ? (startBreak.label || "Break") : "");
      } else {
        // Only lesson name, and room as "subscript"
        // If multiple events touch, show the first one (compact)
        const ev = touching[0];
        const title = ev.title || "";
        const roomName = ev.roomId ? (roomById.get(ev.roomId)?.name || "") : "";
        // Store structured raw so didDrawCell can paint it
        row.push({ title, sub: roomName, isBreak: isBreakSlot });
      }
    }
    return row;
  });

  autoTable(doc, {
    startY: titleY + 32,
    head: [head],
    body,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: 'center',
      valign: 'middle',
      minCellHeight: ROW_HEIGHT_PT
    },
    headStyles: {
      fillColor: [45,140,255],
      minCellHeight: HEAD_ROW_HEIGHT_PT
    },
    columnStyles: {
      0: { cellWidth: DAY_COL_WIDTH_PT },                          // day column
      ...Object.fromEntries(Array.from({ length: totalSlots }, (_, i) => [i + 1, { cellWidth: SLOT_COL_WIDTH_PT }]))
    },
    margin: { left: 24, right: 24 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index > 0) {
        const dayIndex = data.row.index;
        const slotIndex = data.column.index - 1;
        const isBreak   = breakTouchesSlot(dayIndex, slotIndex, breaks);
        const v = data.cell.raw;

        // Shade break slots
        if (isBreak) {
          data.cell.styles.fillColor = [237,239,242];
        } else if (typeof v === 'object' && v && v.title) {
          // Occupied slot shading
          data.cell.styles.fillColor = [230,240,255];
          // Clear autotable text—use didDrawCell to custom paint
          data.cell.text = [];
        } else {
          // Empty cell: leave default
        }
      }
    },
    didDrawCell: (data) => {
      // Custom paint title + room subscript
      if (data.section === 'body' && data.column.index > 0) {
        const v = data.cell.raw;
        if (typeof v === 'object' && v && v.title) {
          const isBreak = !!v.isBreak;
          drawTitleRoomCell(doc, data, v.title, v.sub, isBreak);
        }
      }
    },
  });

  doc.save(`${safeName(teacher.name)}_grid_${todayStamp()}.pdf`);
}

export async function exportRoomGridPDF(room, events, teachers, schoolName="Timetable", opts={}, breaks=[]) {
  if (!room) return;
  const orientation = opts.orientation==='landscape'? 'landscape':'portrait';
  const doc = new jsPDF({ orientation, unit:'pt', format:'a4' });

  if (opts.logoDataUrl) { try { doc.addImage(opts.logoDataUrl, 'PNG', 40, 24, 120, 36); } catch {} }
  const titleY = 40 + (opts.logoDataUrl ? 40 : 0);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text(`${room.name} • Room Weekly Grid`, 40, titleY);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`${schoolName} • Generated ${format(new Date(),'PPPp')}`, 40, titleY+18);

  const roomEvents = events.filter(e => e.roomId === room.id);

  const head = ["Day", ...Array.from({ length: totalSlots }, (_, s) => slotLabel(s))];
  const body = DAYS.map((dayName, dayIndex) => {
    const dayEvents = roomEvents.filter(e => e.dayIndex === dayIndex);
    const row = [dayName];
    for (let s = 0; s < totalSlots; s++) {
      const isBreakSlot = breakTouchesSlot(dayIndex, s, breaks);
      const startBreak  = breakStartingHere(dayIndex, s, breaks);

      const touching = dayEvents.filter(ev => eventTouchesSlot(ev, s));
      if (touching.length === 0) {
        row.push(startBreak ? (startBreak.label || "Break") : "");
      } else {
        const ev = touching[0];
        const title = ev.title || "";
        const sub   = room.name || ""; // show current room name as the subscript
        row.push({ title, sub, isBreak: isBreakSlot });
      }
    }
    return row;
  });

  autoTable(doc, {
    startY: titleY + 32,
    head: [head],
    body,
    styles: { fontSize: 8, cellPadding: 2, halign: 'center', valign: 'middle', minCellHeight: ROW_HEIGHT_PT },
    headStyles: { fillColor: [245,158,11], minCellHeight: HEAD_ROW_HEIGHT_PT },
    columnStyles: {
      0: { cellWidth: DAY_COL_WIDTH_PT },
      ...Object.fromEntries(Array.from({ length: totalSlots }, (_, i) => [i + 1, { cellWidth: SLOT_COL_WIDTH_PT }]))
    },
    margin: { left: 24, right: 24 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index > 0) {
        const dayIndex = data.row.index;
        const slotIndex = data.column.index - 1;
        const isBreak   = breakTouchesSlot(dayIndex, slotIndex, breaks);
        const v = data.cell.raw;
        if (isBreak) {
          data.cell.styles.fillColor = [237,239,242];
        } else if (typeof v === 'object' && v && v.title) {
          data.cell.styles.fillColor = [230,240,255];
          data.cell.text = [];
        }
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index > 0) {
        const v = data.cell.raw;
        if (typeof v === 'object' && v && v.title) {
          drawTitleRoomCell(doc, data, v.title, v.sub, !!v.isBreak);
        }
      }
    },
  });

  doc.save(`${safeName(room.name)}_grid_${todayStamp()}.pdf`);
}

const DAY_COL_WIDTH_TWIPS  = 1040;  // ~0.72 in
const SLOT_COL_WIDTH_TWIPS = 600;   // ~0.42 in
const ROW_HEIGHT_TWIPS     = 320;   // ~0.22 in (fits two lines)
const HEAD_ROW_HEIGHT_TWIPS= 360;

export async function exportTeacherGridDocx(teacher, events, rooms, schoolName="Timetable", opts={}, breaks=[]) {
  if (!teacher) return;
  const orientation = opts.orientation==='landscape'? 'landscape':'portrait';
  const teacherEvents = events.filter(e => e.teacherId === teacher.id);
  const roomById = new Map(rooms.map(r => [r.id, r]));

  // Build header row with fixed widths
  const headRow = new TableRow({
    height: { value: HEAD_ROW_HEIGHT_TWIPS, rule: "atLeast" },
    children: [
      new TableCell({
        width: { size: DAY_COL_WIDTH_TWIPS, type: WidthType.DXA },
        children: [ new Paragraph({ text: 'Day', alignment: AlignmentType.CENTER }) ],
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F3F4F6' }
      }),
      ...Array.from({ length: totalSlots }, (_, s) => new TableCell({
        width: { size: SLOT_COL_WIDTH_TWIPS, type: WidthType.DXA },
        children: [ new Paragraph({ text: slotLabel(s), alignment: AlignmentType.CENTER }) ],
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F3F4F6' }
      }))
    ]
  });

  const bodyRows = DAYS.map((dayName, dayIndex) => {
    const dayEvents = teacherEvents.filter(e => e.dayIndex === dayIndex);
    const cells = [
      new TableCell({
        width: { size: DAY_COL_WIDTH_TWIPS, type: WidthType.DXA },
        children: [ new Paragraph({ text: dayName, alignment: AlignmentType.CENTER }) ]
      })
    ];

    for (let s = 0; s < totalSlots; s++) {
      const touching = dayEvents.filter(ev => eventTouchesSlot(ev, s));
      const isBreak  = breakTouchesSlot(dayIndex, s, breaks);
      const startBreak = breakStartingHere(dayIndex, s, breaks);

      if (touching.length === 0) {
        cells.push(new TableCell({
          width: { size: SLOT_COL_WIDTH_TWIPS, type: WidthType.DXA },
          children: [ new Paragraph({ text: startBreak ? (startBreak.label || 'Break') : '', alignment: AlignmentType.CENTER }) ],
          shading: isBreak ? { type: ShadingType.CLEAR, color:'auto', fill:'EDEFF2' } : undefined
        }));
      } else {
        const ev = touching[0];
        const title = ev.title || '';
        const roomName = ev.roomId ? (roomById.get(ev.roomId)?.name || '') : '';

        cells.push(new TableCell({
          width: { size: SLOT_COL_WIDTH_TWIPS, type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: title }),
                roomName ? new TextRun({ text: ` ${roomName}`, subScript: true }) : undefined
              ].filter(Boolean)
            })
          ],
          shading: isBreak ? { type: ShadingType.CLEAR, color:'auto', fill:'EDEFF2' } : { type: ShadingType.CLEAR, color:'auto', fill:'E6F0FF' }
        }));
      }
    }

    return new TableRow({
      height: { value: ROW_HEIGHT_TWIPS, rule: "atLeast" },
      children: cells
    });
  });

  const children = [];
  if (opts.logoDataUrl) {
    try {
      const buf = await dataUrlToArrayBuffer(opts.logoDataUrl);
      children.push(new Paragraph({
        children: [ new ImageRun({ data: buf, transformation: { width: 120, height: 36 } }) ],
        spacing: { after: 160 }
      }));
    } catch {}
  }
  children.push(new Paragraph({ text: `${teacher.name} – Weekly Grid`, heading: HeadingLevel.HEADING_2, spacing: { after: 160 } }));
  children.push(new Paragraph({ children: [ new TextRun({ text: `${schoolName} • Generated ${format(new Date(),'PPPp')}`, size: 18, color: '666666' }) ], spacing: { after: 160 } }));
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headRow, ...bodyRows] }));

  const docx = new Document({ sections: [{ properties: { page: { size: { orientation } } }, children }] });
  const blob = await Packer.toBlob(docx);
  saveAs(blob, `${safeName(teacher.name)}_grid_${todayStamp()}.docx`);
}

export async function exportRoomGridDocx(room, events, teachers, schoolName='Timetable', opts={}, breaks=[]) {
  if (!room) return;
  const orientation = opts.orientation==='landscape'? 'landscape':'portrait';
  const roomEvents = events.filter(e => e.roomId === room.id);

  const headRow = new TableRow({
    height: { value: HEAD_ROW_HEIGHT_TWIPS, rule: "atLeast" },
    children: [
      new TableCell({
        width: { size: DAY_COL_WIDTH_TWIPS, type: WidthType.DXA },
        children: [ new Paragraph({ text:'Day', alignment: AlignmentType.CENTER }) ],
        shading: { type: ShadingType.CLEAR, color:'auto', fill:'F3F4F6' }
      }),
      ...Array.from({ length: totalSlots }, (_, s) => new TableCell({
        width: { size: SLOT_COL_WIDTH_TWIPS, type: WidthType.DXA },
        children: [ new Paragraph({ text: slotLabel(s), alignment: AlignmentType.CENTER }) ],
        shading: { type: ShadingType.CLEAR, color:'auto', fill:'F3F4F6' }
      }))
    ]
  });

  const bodyRows = DAYS.map((dayName, dayIndex) => {
    const dayEvents = roomEvents.filter(e => e.dayIndex === dayIndex);
    const cells = [
      new TableCell({ width: { size: DAY_COL_WIDTH_TWIPS, type: WidthType.DXA }, children: [ new Paragraph({ text: dayName, alignment: AlignmentType.CENTER }) ] })
    ];

    for (let s = 0; s < totalSlots; s++) {
      const touching = dayEvents.filter(ev => eventTouchesSlot(ev, s));
      const isBreak  = breakTouchesSlot(dayIndex, s, breaks);
      const startBreak = breakStartingHere(dayIndex, s, breaks);

      if (touching.length === 0) {
        cells.push(new TableCell({
          width: { size: SLOT_COL_WIDTH_TWIPS, type: WidthType.DXA },
          children: [ new Paragraph({ text: startBreak ? (startBreak.label || 'Break') : '', alignment: AlignmentType.CENTER }) ],
          shading: isBreak ? { type: ShadingType.CLEAR, color:'auto', fill:'EDEFF2' } : undefined
        }));
      } else {
        const ev = touching[0];
        const title = ev.title || '';
        const sub   = room.name || '';

        cells.push(new TableCell({
          width: { size: SLOT_COL_WIDTH_TWIPS, type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: title }),
                sub ? new TextRun({ text: ` ${sub}`, subScript: true }) : undefined
              ].filter(Boolean)
            })
          ],
          shading: isBreak ? { type: ShadingType.CLEAR, color:'auto', fill:'EDEFF2' } : { type: ShadingType.CLEAR, color:'auto', fill:'E6F0FF' }
        }));
      }
    }

    return new TableRow({ height: { value: ROW_HEIGHT_TWIPS, rule: "atLeast" }, children: cells });
  });

  const children = [];
  if (opts.logoDataUrl) {
    try {
      const buf = await dataUrlToArrayBuffer(opts.logoDataUrl);
      children.push(new Paragraph({ children: [ new ImageRun({ data: buf, transformation: { width: 120, height: 36 } }) ], spacing: { after: 160 } }));
    } catch {}
  }
  children.push(new Paragraph({ text: `${room.name} – Room Weekly Grid`, heading: HeadingLevel.HEADING_2, spacing: { after: 160 } }));
  children.push(new Paragraph({ children: [ new TextRun({ text: `${schoolName} • Generated ${format(new Date(),'PPPp')}`, size: 18, color: '666666' }) ], spacing: { after: 160 } }));
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headRow, ...bodyRows] }));

  const docx = new Document({ sections: [{ properties: { page: { size: { orientation } } }, children }] });
  const blob = await Packer.toBlob(docx);
  saveAs(blob, `${safeName(room.name)}_grid_${todayStamp()}.docx`);
}
