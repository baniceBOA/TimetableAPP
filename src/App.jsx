import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import GridOnIcon from "@mui/icons-material/GridOn";
import GroupsIcon from "@mui/icons-material/Groups";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";

import { useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { nanoid } from "nanoid";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { makeTheme } from "./theme/makeTheme";
import TimetableMUI from "./components/TimetableMUI.jsx";
//import Timetable from "./components/Timetable";
//import Timetable from "./components/TimetableMD3.jsx";
import ThemeModal from "./components/modals/ThemeModal.jsx";
import AddClassModal from "./components/modals/AddClassModal.jsx";
import BreaksEditorModal from "./components/modals/BreaksEditorModal.jsx";
import TeacherConstrainModal from "./components/modals/TeacherConstrainModal.jsx"
import ConstraintErrorBar from "./components/ConstraintErrorBar.jsx";
import PrepopulateModal from "./components/PrepopulateModal.jsx";
import EventDialog from "./components/EventDialog.jsx";
import { getConstraintMessages } from "./utils/constraintMessages.js";
import HeaderMD3 from "./components/HeaderMD3";
import SchedulePreview from "./components/SchedulePreview.jsx";

import ManageTeachers from "./components/ManageTeachers";
import ManageRooms from "./components/ManageRooms";
import BrandingModal from "./components/BrandingModal";
import ExportProgressModal from "./components/ExportProgressModal";
import BreaksEditor from "./components/BreaksEditor";
import ConstraintsEditor from "./components/ConstraintsEditor";
import TeacherConstraintsEditor from "./components/TeacherConstraintsEditor";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { getSubjects } from "./utils/subjects";
import { useSubjects } from "./utils/subjectsStore"
import { randomNiceColor } from "./utils/colors";
import { ExportProgressContext } from "./contexts/ExportProgressContext.jsx";
import SearchDialog from "./components/SearchDialog.jsx";
import { countEventsBySubject, summarizeEvents } from "./utils/stats";
import TimeConstraintsModal from "./components/modals/TimeConstraintsModal.jsx";
import { checkTeacherTime, checkSubjectTime, filterSuggestionsByTime } from "./utils/timeConstraints.js";

// setting modals 
import SettingsDialog from "./components/SettingsDialog.jsx";
import ConfigModal from "./components/ConfigModal.jsx";
import ExportOptionsModal from "./components/modals/ExportOptionsModal.jsx";
import DataBackupModal from "./components/modals/DataBackupModal.jsx";
import ResetConfirmModal from "./components/modals/ResetConfirmModal.jsx";
import LimitsToggleModal from "./components/modals/LimitsToggleModal.jsx";
import SettingsIcon from "@mui/icons-material/Settings";
import LimitsAutofixModal from "./components/modals/LimitsAutofixModal.jsx";

import {
  exportTeachersBatchPDF, exportTeachersBatchDocx,
  exportRoomsBatchPDF, exportRoomsBatchDocx,
  exportTeacherGridPDF, exportTeacherGridDocx,
  exportRoomGridPDF, exportRoomGridDocx
} from "./utils/export";
import { DAYS } from "./constants";
import {
  buildRoomLimitMap, buildTeacherLimitMap,
  findRoomConstraint, findTeacherConstraint,
  wouldRoomExceed, wouldTeacherExceed
} from "./utils/constraints";
import ConstrainEditorModal from "./components/modals/ConstrainEditorModal.jsx";
import FreeSlotsToggleModal from "./components/modals/FreeSlotsToggleModal.jsx";

const INITIAL_TEACHERS = [
  { id: "t-1", name: "Ms. Ahmed", areas: ["Mathematics", "Physics"], color: "#59c173" },
  { id: "t-2", name: "Mr. Kamau", areas: ["English", "Literature"],  color: "#2d8cff" },
  { id: "t-3", name: "Mrs. Otieno", areas: ["Chemistry", "Biology"],   color: "#f953c6" },
];
const INITIAL_ROOMS = [
  { id: "r-1", name: "Room A2", capacity: 40 },
  { id: "r-2", name: "Lab 2",   capacity: 25 },
  { id: "r-3", name: "Hall 1",  capacity: 120 },
];
const SAMPLE_EVENTS = [
  { id: nanoid(), title: "Grade 8 Algebra", dayIndex: 0, start: "09:00", end: "10:30", teacherId: "t-1", area: "Mathematics", roomId: "r-1", color: "#59c173" },
  { id: nanoid(), title: "Biology Lab",      dayIndex: 2, start: "13:00", end: "15:00", teacherId: "t-3", area: "Biology",     roomId: "r-2", color: "#f953c6" },
];
const INITIAL_BREAKS = [];
const INITIAL_CONSTRAINTS = []; // room × subject
const INITIAL_TEACHER_CONSTRAINTS = []; // teacher × subject

function ChipsFilter({ items, selected, setSelected, allLabel }) {
  const set = new Set(selected);
  const toggle = (v) => { const next=new Set(set); if(next.has(v)) next.delete(v); else next.add(v); setSelected(Array.from(next)); };
  return (
    <div className="chips-wrap">
      <button className={`chip-filter ${selected.length===0? 'chip-active':''}`} onClick={()=> setSelected([])}>{allLabel}</button>
      {items.map((it)=> (
        <button key={it.value} className={`chip-filter ${set.has(it.value)? 'chip-active':''}`} title={it.label} onClick={()=> toggle(it.value)}>{it.label}</button>
      ))}
    </div>
  );
}

export default function App(){
  const [view, setView] = useState("timetable");
  const [teachers, setTeachers] = useLocalStorage("teachers", INITIAL_TEACHERS);
  const [rooms, setRooms] = useLocalStorage("rooms", INITIAL_ROOMS);
  const [events, setEvents] = useLocalStorage("events", SAMPLE_EVENTS);
  const [breaks, setBreaks] = useLocalStorage("breaks", INITIAL_BREAKS);
  const [constraints, setConstraints] = useLocalStorage("constraints", INITIAL_CONSTRAINTS);
  const [teacherConstraints, setTeacherConstraints] = useLocalStorage("teacherConstraints", INITIAL_TEACHER_CONSTRAINTS);

  const [teacherFilter, setTeacherFilter] = useState(null);
  const [roomsFilter, setRoomsFilter] = useLocalStorage("roomsFilter", []);
  const [subjectFilter, setSubjectFilter] = useLocalStorage("subjectFilter", []);
  const [landscape, setLandscape] = useState(false);
  const [branding, setBranding] = useLocalStorage("branding", { schoolName: "School Timetable", logoDataUrl: "" });
  const [showBranding, setShowBranding] = useState(false);
  const progress = useContext(ExportProgressContext);

  const [autofixOpen, setAutofixOpen] = useState(false);
  const [autofixList, setAutofixList] = useState([]);
  // --- Add state to keep the last auto-fix snapshot ---
  const [undoBanner, setUndoBanner] = useState(null); 

  const [editErrors, setEditErrors] = useState([]);
  const [editBarOpen, setEditBarOpen] = useState(false);

  const DEFAULT_THEME_OPTIONS = {
  mode: "dark",
  primary: "#2D8CFF",
  secondary: "#59C173",
  backgroundDefault: "#0F172A",
  backgroundPaper: "#0B1220",
  textPrimary: "#E5E7EB",
  textSecondary: "#94A3B8",
  borderRadius: 12,
  typographyScale: 1.0,
};
const [themeOptions, setThemeOptions] = useLocalStorage("themeOptions", DEFAULT_THEME_OPTIONS);
const theme = makeTheme(themeOptions);

const [themeOpen, setThemeOpen] = useState(false);

  const [limitsEnabled, setLimitsEnabled] = useLocalStorage("limitsEnabled", {
  teacherLimits: true,  // toggle Teacher × Subject weekly limits
  roomLimits: true,     // toggle Room × Subject weekly limits
});
  const [timeConstraints, setTimeConstraints] = useLocalStorage("timeConstraints", {
   teacherUnavailable: [],
   subjectWindows: []
 });
  const [timeConstraintsOpen, setTimeConstraintsOpen] = useState(false);


  const [navOpen, setNavOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(true);        // Exports submenu
  const [roomsOpen, setRoomsOpen] = useState(false);   // Room filters submenu
  const [subjectsOpen, setSubjectsOpen] = useState(false); // Subject filters submenu
  const [prepopulateOpen, setPrepopulateOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);

  const [searchOpen, setSearchOpen] = useState(false);

  const [breaksModalOpen, setBreaksModalOpen] = useState(false);
  const [teacherConstrainModalOpen, setTeacherConstraintsModalOpen] = useState(false);
  const [constrainModalOpen, setconstrainModalOpen] = useState(false);


  // Settings/modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOptsOpen, setExportOptsOpen] = useState(false);
  const [limitsModalOpen, setLimitsModalOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [freeSlotsEnabled, setFreeSlotsEnabled] = useLocalStorage("freeSlotsEnabled", true);
  const [freeSlotsOpen, setFreeSlotsOpen] = useState(false);

  // Export defaults (stored)
  const [exportOptions, setExportOptions] = useLocalStorage("exportOptions", {
      landscapeDefault: false,
      fixedCells: true,
      roomSubscript: true,
      breakShading: true,
      compact: true,
    });

    // new Subject Store
    const [StoreSubjects] = useSubjects();

  function openTeacherConstrain(){setTeacherConstraintsModalOpen(true);}
  function closeTeacherConstrain(){setTeacherConstraintsModalOpen(false);}
  
  function openconstrainModal(){setconstrainModalOpen(true);}
  function closeconstrainModal(){setconstrainModalOpen(false);}

  function openBreaksModal(){ setBreaksModalOpen(true); }
  function closeBreaksModal(){ setBreaksModalOpen(false); }
  function openPrepopulate(){ setPrepopulateOpen(true); }
  function closePrepopulate(){ setPrepopulateOpen(false); }
  function openEventDialogFor(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    const teacher = teachers.find(t => t.id === ev.teacherId);
    const room = rooms.find(r => r.id === ev.roomId);
    setSelectedEvent({
      ...ev,
      teacherName: teacher?.name || "",
      roomName: room?.name || "",
      dayLabel: typeof ev.dayIndex === 'number' ? (DAYS?.[ev.dayIndex] ?? ev.dayIndex) : undefined,
    });
    setEventDialogOpen(true);
  }

  function clearUndoBanner() {
  setUndoBanner((b) => {
    if (b?.timerId) clearTimeout(b.timerId);
    return null;
  });
}


// add from Grid
  const [modalInital, setModalInitial] = useState(null)

  const handleCreateFromGrid = useCallback(({ dayIndex, start, end }) => {
    // Prefill teacher/room (optional logic)
    const defaultTeacherId = teacherFilter || teachers[0]?.id || "";
    const defaultRoomId = roomsFilter[0] || rooms[0]?.id || "";

    setModalInitial({
      title: "",
      area: "",
      dayIndex,
      start,
      end,
      teacherId: defaultTeacherId,
      teacherIds: defaultTeacherId ? [defaultTeacherId] : [],
      roomId: defaultRoomId,
      classSize: "",
    });
    setAddClassOpen(true);
  }, [teacherFilter, roomsFilter, teachers, rooms]);

  const prevLimitsRef = useRef(limitsEnabled);

  // open from header
  function openAddClass() { setAddClassOpen(true); }
  function closeAddClass() { setAddClassOpen(false); setModalInitial(null); }

  // save handler
  function saveNewClass(ev) {
    // Ensure title auto-filled from subject if empty
    const safe = { ...ev, title: (ev.title || "").trim() || ((ev.area || "").trim() || "") };
    if (editingEventId) {
      const id = editingEventId;
      setEvents(list => list.map(e => e.id === id ? { id, ...safe, color: e.color || randomNiceColor() } : e));
      setEditingEventId(null);
    } else {
      setEvents(list => [
        ...list,
        { id: nanoid(), ...safe, color: randomNiceColor() }
      ]);
    }
    setAddClassOpen(false);
    setModalInitial(null);
  }

  const orientationFrom = (check) => (check || exportOptions.landscapeDefault) ? 'landscape' : 'portrait';

  const subjectCounts = useMemo(() => countEventsBySubject(events), [events]);
  
  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => setSearchOpen(false);

  const openNav = () => setNavOpen(true);
  const closeNav = () => setNavOpen(false);
  const [filtersAnchor, setFiltersAnchor] = useState(null);
  const openFilters = (anchor) => setFiltersAnchor(anchor);
  const closeFilters = () => setFiltersAnchor(null);
  const [schedulePreview, setSchedulePreview] = useState({ open: false, type: null, id: null });

  const openSchedulePreviewForTeacher = (id) => setSchedulePreview({ open: true, type: 'teacher', id });
  const openSchedulePreviewForRoom = (id) => setSchedulePreview({ open: true, type: 'room', id });
  const closeSchedulePreview = () => setSchedulePreview({ open: false, type: null, id: null });

  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      if ((isMac ? e.altKey : e.altKey) && e.key.toLowerCase() === "m") {
        setNavOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function addBreak(b){ setBreaks(list => [...list, { id: nanoid(), ...b }]); }
  function deleteBreak(id){ setBreaks(list => list.filter(x => x.id!==id)); }

  function handleDelete(id){ setEvents(list => list.filter(e => e.id!==id)); }
  //function handleCreateFromGrid(initial){ setEvents(list => [...list, { id:nanoid(), ...initial, color: randomNiceColor() }]); }
  function handleUpdate(id, next){ 
   const { blocked, messages } = getConstraintMessages({
   nextEvent: { ...next, id },
   state: { limitsEnabled, constraints, teacherConstraints, rooms, teachers, events, timeConstraints }
 });
 if (blocked) {
   setEditErrors(messages);
   setEditBarOpen(true);
   return;
 }
    setEvents(list => list.map(e => e.id===id? next: e)); 
  }
  

  function addTeacher(t){ setTeachers(list => [...list, { ...t, id:nanoid() }]); }
  function updateTeacher(id, t){ setTeachers(list => list.map(x => x.id===id? { ...x, ...t }: x)); setEvents(list => list.map(e => e.teacherId===id? { ...e, color: t.color || e.color }: e)); }
  function deleteTeacher(id){ setTeachers(list => list.filter(x => x.id!==id)); setEvents(list => list.map(e => e.teacherId===id? { ...e, teacherId:"" }: e)); }

  function addRoom(r){ setRooms(list => [...list, { ...r, id:nanoid() }]); }
  function updateRoom(id, r){ setRooms(list => list.map(x => x.id===id? { ...x, ...r }: x)); }
  function deleteRoom(id){ setRooms(list => list.filter(x => x.id!==id)); setEvents(list => list.map(e => e.roomId===id? { ...e, roomId:"" }: e)); }

  const subjects = getSubjects(teachers, events);
  const roomItems = rooms.map(r => ({ value:r.id, label:r.name }));
  const subjectItems = subjects.map(s => ({ value:s, label:s }));

  const visibleEvents = events.filter(e => {
    if (teacherFilter && e.teacherId !== teacherFilter) return false;
    if (roomsFilter.length > 0 && !roomsFilter.includes(e.roomId)) return false;
    if (subjectFilter.length > 0) { const s=(e.area||'').trim(); if(!subjectFilter.includes(s)) return false; }
    return true;
  });

  const { total: totalEventCount }     = summarizeEvents(events);
  const { total: visibleEventCount }   = summarizeEvents(visibleEvents);

  // Per teacher (visible)
const byTeacherVisible = new Map();
for (const e of visibleEvents) {
  if (!e.teacherId) continue;
  byTeacherVisible.set(e.teacherId, (byTeacherVisible.get(e.teacherId) || 0) + 1);
}

// Per room (visible)
const byRoomVisible = new Map();
for (const e of visibleEvents) {
  if (!e.roomId) continue;
  byRoomVisible.set(e.roomId, (byRoomVisible.get(e.roomId) || 0) + 1);
}

// Per subject (visible)
const bySubjectVisible = new Map();
for (const e of visibleEvents) {
  const a = (e.area || "").trim();
  if (!a) continue;
  bySubjectVisible.set(a, (bySubjectVisible.get(a) || 0) + 1);
}

  async function handleBatchTeachersPDF(){ const opt={ orientation: landscape? 'landscape':'portrait', logoDataUrl: branding.logoDataUrl }; await exportTeachersBatchPDF(teachers, visibleEvents, rooms, branding.schoolName, opt, progress); }
  async function handleBatchTeachersDocx(){ const opt={ orientation: landscape? 'landscape':'portrait', logoDataUrl: branding.logoDataUrl }; await exportTeachersBatchDocx(teachers, visibleEvents, rooms, branding.schoolName, opt, progress); }
  async function handleBatchRoomsPDF(){ const list = roomsFilter.length? rooms.filter(r=> roomsFilter.includes(r.id)) : rooms; const opt={ orientation: landscape? 'landscape':'portrait', logoDataUrl: branding.logoDataUrl }; await exportRoomsBatchPDF(list, visibleEvents, teachers, branding.schoolName, opt, progress); }
  async function handleBatchRoomsDocx(){ const list = roomsFilter.length? rooms.filter(r=> roomsFilter.includes(r.id)) : rooms; const opt={ orientation: landscape? 'landscape':'portrait', logoDataUrl: branding.logoDataUrl }; await exportRoomsBatchDocx(list, visibleEvents, teachers, branding.schoolName, opt, progress); }
  async function handleTeacherGridDocx(){ const teacher = teachers.find(t => t.id===teacherFilter); if(!teacher) return; const opt={ orientation: landscape? 'landscape':'portrait', logoDataUrl: branding.logoDataUrl, showArea:true, showRoom:true, compact:true }; await exportTeacherGridDocx(teacher, events, rooms, branding.schoolName, opt, breaks); }
  async function handleRoomGridPDF(){ if (roomsFilter.length!==1) return; const room = rooms.find(r => r.id===roomsFilter[0]); const opt={ orientation: landscape? 'landscape':'portrait', logoDataUrl: branding.logoDataUrl, showTeacher:true, showArea:true, compact:true }; await exportRoomGridPDF(room, events, teachers, branding.schoolName, opt, breaks); }
  async function handleRoomGridDocx(){ if (roomsFilter.length!==1) return; const room = rooms.find(r => r.id===roomsFilter[0]); const opt={ orientation: landscape? 'landscape':'portrait', logoDataUrl: branding.logoDataUrl, showTeacher:true, showArea:true, compact:true }; await exportRoomGridDocx(room, events, teachers, branding.schoolName, opt, breaks); }
  
  async function handleTeacherGridPDF(){
      const teacher = teachers.find(t => t.id===teacherFilter); if(!teacher) return;
      const opt = {
        orientation: orientationFrom(landscape),
        logoDataUrl: branding.logoDataUrl,
        compact: !!exportOptions.compact,
        roomSubscript: !!exportOptions.roomSubscript,
        fixedCells:   !!exportOptions.fixedCells,
        breakShading: !!exportOptions.breakShading,
        showArea: false,   // request was to show only lesson name and room
        showRoom: true
      };
      await exportTeacherGridPDF(teacher, events, rooms, branding.schoolName, opt, breaks);
}
  
  function toggleRoomFilterValue(id) {
    setRoomsFilter((list) => {
      const set = new Set(list);
      set.has(id) ? set.delete(id) : set.add(id);
      return Array.from(set);
    });
  }
  function selectAllRooms() {
    setRoomsFilter(rooms.map(r => r.id));
  }
  function clearRooms() {
    setRoomsFilter([]);
  }

  function toggleSubjectFilterValue(area) {
    setSubjectFilter((list) => {
      const set = new Set(list);
      set.has(area) ? set.delete(area) : set.add(area);
      return Array.from(set);
    });
  }
  function selectAllSubjects() {
    setSubjectFilter(subjects);
  }
  function clearSubjects() {
    setSubjectFilter([]);
  }

  // Constraints add/delete
  function addConstraint(c){ setConstraints(list => { const idx=list.findIndex(x=> x.roomId===c.roomId && (x.area||'').trim().toLowerCase()===(c.area||'').trim().toLowerCase()); if(idx>=0){ const next=[...list]; next[idx]={ ...next[idx], maxPerWeek:Number(c.maxPerWeek) }; return next; } return [...list, { roomId:c.roomId, area:c.area, maxPerWeek:Number(c.maxPerWeek) }]; }); }
  function deleteConstraint(roomId, area){ setConstraints(list => list.filter(x=> !(x.roomId===roomId && (x.area||'').trim().toLowerCase()===(area||'').trim().toLowerCase()))); }
  function addTeacherConstraint(c){ setTeacherConstraints(list => { const idx=list.findIndex(x=> x.teacherId===c.teacherId && (x.area||'').trim().toLowerCase()===(c.area||'').trim().toLowerCase()); if(idx>=0){ const next=[...list]; next[idx]={ ...next[idx], maxPerWeek:Number(c.maxPerWeek) }; return next; } return [...list, { teacherId:c.teacherId, area:c.area, maxPerWeek:Number(c.maxPerWeek) }]; }); }
  function deleteTeacherConstraint(teacherId, area){ setTeacherConstraints(list => list.filter(x=> !(x.teacherId===teacherId && (x.area||'').trim().toLowerCase()===(area||'').trim().toLowerCase()))); }

  // Violation highlighting
  const roomLimitMap = buildRoomLimitMap(constraints);
  const teacherLimitMap = buildTeacherLimitMap(teacherConstraints);
  const weeklyRoomCounts = new Map();
  for(const e of events){ const a=(e.area||'').trim().toLowerCase(); if(!e.roomId||!a) continue; const k=`${e.roomId}::${a}`; weeklyRoomCounts.set(k, (weeklyRoomCounts.get(k)||0)+1); }
  const weeklyTeacherCounts = new Map();
  for(const e of events){ const a=(e.area||'').trim().toLowerCase(); if(!e.teacherId||!a) continue; const k=`${e.teacherId}::${a}`; weeklyTeacherCounts.set(k, (weeklyTeacherCounts.get(k)||0)+1); }
  const violatingRoomKeys = new Set(); for(const [k,count] of weeklyRoomCounts){ const limit=roomLimitMap.get(k)||0; if(limit && count>limit) violatingRoomKeys.add(k); }
  const violatingTeacherKeys = new Set(); for(const [k,count] of weeklyTeacherCounts){ const limit=teacherLimitMap.get(k)||0; if(limit && count>limit) violatingTeacherKeys.add(k); }
  function getViolationClass(ev){ 
    const a=(ev.area||'').trim().toLowerCase();
    if(!a) return ''; 
     
    const roomHit    = limitsEnabled.roomLimits    && ev.roomId    && violatingRoomKeys.has(`${ev.roomId}::${a}`);
    const teacherHit = limitsEnabled.teacherLimits && ev.teacherId && violatingTeacherKeys.has(`${ev.teacherId}::${a}`);
    if(roomHit && teacherHit) return 'limit-both-exceeded'; 
    if(roomHit) return 'limit-room-exceeded'; 
    if(teacherHit) return 'limit-teacher-exceeded'; return '';
    
   }
  const [limitsNotice, setLimitsNotice] = useState(null);

  useEffect(() => {
  // Build a quick snapshot of visible violations when toggles change
  const visRoomViolations = [];
  const visTeacherViolations = [];

  if (limitsEnabled.roomLimits) {
    for (const ev of visibleEvents) {
      const a = (ev.area || '').trim().toLowerCase();
      if (ev.roomId && a && violatingRoomKeys.has(`${ev.roomId}::${a}`)) {
        visRoomViolations.push(ev);
      }
    }
  }
  if (limitsEnabled.teacherLimits) {
    for (const ev of visibleEvents) {
      const a = (ev.area || '').trim().toLowerCase();
      if (ev.teacherId && a && violatingTeacherKeys.has(`${ev.teacherId}::${a}`)) {
        visTeacherViolations.push(ev);
      }
    }
  }

  const total = visRoomViolations.length + visTeacherViolations.length;
  if (total > 0) {
    setLimitsNotice({
      count: total,
      rooms: visRoomViolations.length,
      teachers: visTeacherViolations.length,
    });
  } else {
    setLimitsNotice(null);
  }
}, [limitsEnabled, visibleEvents, violatingRoomKeys, violatingTeacherKeys]);


// auto fix code comes here for convience
useEffect(() => {
  const prev = prevLimitsRef.current;
  const wentTeacherOn = !prev.teacherLimits && limitsEnabled.teacherLimits;
  const wentRoomOn    = !prev.roomLimits    && limitsEnabled.roomLimits;
  prevLimitsRef.current = limitsEnabled;

  if (!wentTeacherOn && !wentRoomOn) return;

  // Build violating list from ALL events (or visibleEvents if preferred)
  const list = [];
  if (limitsEnabled.teacherLimits) {
    for (const e of events) {
      const a = (e.area || '').trim().toLowerCase();
      if (e.teacherId && a && violatingTeacherKeys.has(`${e.teacherId}::${a}`)) list.push(e);
    }
  }
  if (limitsEnabled.roomLimits) {
    for (const e of events) {
      const a = (e.area || '').trim().toLowerCase();
      if (e.roomId && a && violatingRoomKeys.has(`${e.roomId}::${a}`)) list.push(e);
    }
  }
  if (list.length > 0) {
    setAutofixList(list);
    setAutofixOpen(true);
  }
}, [limitsEnabled, events, violatingTeacherKeys, violatingRoomKeys]);

function removeSelectedViolations(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    setAutofixOpen(false);
    return;
  }

  // Build snapshot of removed events (to restore on Undo)
  const removed = events.filter(e => ids.includes(e.id));

  // Apply the auto-fix (remove from events)
  setEvents(list => list.filter(e => !ids.includes(e.id)));
  setAutofixOpen(false);

  // Show Undo banner (20s timeout)
  const timeoutMs = 20000;
  const timerId = setTimeout(() => setUndoBanner(null), timeoutMs);

  setUndoBanner({
    count: removed.length,
    until: Date.now() + timeoutMs,
    timerId,
    payload: { removedEvents: removed },
  });
}
// Undo (restore removed events exactly as they were)
function undoAutoFix() {
  setUndoBanner((b) => {
    if (!b?.payload?.removedEvents?.length) return null;
    // Restore into events
    setEvents(list => [...list, ...b.payload.removedEvents]);
    // Clear banner + timer
    if (b.timerId) clearTimeout(b.timerId);
    return null;
  });
}

useEffect(() => {
  function onKey(e) {
    const isMac = navigator.platform?.toLowerCase().includes("mac");
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
    if (cmdOrCtrl && e.key.toLowerCase() === "z" && undoBanner) {
      e.preventDefault();
      undoAutoFix();
    }
  }
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [undoBanner]);
    


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
    <div className="app">
      <HeaderMD3 title={branding.schoolName || "Timetable"} onAddClass={openAddClass}  subtitle={view === 'timetable'? `Weekly schedule · ${visibleEventCount} event${visibleEventCount !== 1 ? 's' : ''}`: `${totalEventCount} event${totalEventCount !== 1 ? 's' : ''} total`} onOpenNav={openNav} onOpenSearch={openSearch} onOpenFilters={openFilters} rightActions={[ {ariaLabel: 'Settings',icon: <SettingsIcon />,onClick: () => setSettingsOpen(true)},{ ariaLabel:'Branding', icon: branding.logoDataUrl? <img src={branding.logoDataUrl} alt="logo" style={{ height:24, borderRadius:4 }} />: null, onClick:()=> setShowBranding(true) }]} />
      {/* Side navigation drawer */}
      <Drawer anchor="left" open={navOpen} onClose={closeNav}>
  <Box sx={{ width: 320 }} role="presentation">
    {/* Close the drawer when clicking a navigation-only item; 
        keep it open for toggles and nested selections */}
    <List subheader={<ListSubheader component="div">Navigation <div style={{ fontSize: 12, color: 'var(--muted)' }}>{visibleEventCount} of {totalEventCount} event{totalEventCount !== 1 ? 's' : ''} visible</div></ListSubheader>}>
      <ListItem disablePadding>
        <ListItemButton onClick={() => { setView("timetable"); closeNav(); }}>
          <ListItemText primary="Timetable" secondary="Weekly view" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton onClick={() => { setView("teachers"); closeNav(); }}>
          <ListItemText primary="Teachers" secondary="Manage teachers" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton onClick={() => { setView("rooms"); closeNav(); }}>
          <ListItemText primary="Rooms" secondary="Manage rooms" />
        </ListItemButton>
      </ListItem>
    </List>

    <Divider />

    {/* Exports submenu */}
    <List>
      <ListItem disablePadding secondaryAction={
        <IconButton edge="end" onClick={() => setExpOpen(o => !o)} aria-label="Toggle exports">
          {expOpen ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      }>
        <ListItemButton onClick={() => setExpOpen(o => !o)}>
          <ListItemText primary="Exports" secondary="PDF & DOCX" />
        </ListItemButton>
      </ListItem>
      <Collapse in={expOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{ pl: 2 }}>
          {/* Teacher Grid */}
          <ListItem disablePadding>
            <ListItemButton
              disabled={!teacherFilter || progress.running}
              onClick={async () => {
                const teacher = teachers.find(t => t.id === teacherFilter);
                if (!teacher) return;
                const opt = { orientation: landscape ? "landscape" : "portrait", logoDataUrl: branding.logoDataUrl, showArea: true, showRoom: true, compact: true };
                await exportTeacherGridPDF(teacher, events, rooms, branding.schoolName, opt, breaks);
                closeNav();
              }}
            >
              <GridOnIcon fontSize="small" style={{ marginRight: 8 }} />
              <ListItemText primary="Teacher Grid (PDF)" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              disabled={!teacherFilter || progress.running}
              onClick={async () => {
                const teacher = teachers.find(t => t.id === teacherFilter);
                if (!teacher) return;
                const opt = { orientation: landscape ? "landscape" : "portrait", logoDataUrl: branding.logoDataUrl, showArea: true, showRoom: true, compact: true };
                await exportTeacherGridDocx(teacher, events, rooms, branding.schoolName, opt, breaks);
                closeNav();
              }}
            >
              <DescriptionIcon fontSize="small" style={{ marginRight: 8 }} />
              <ListItemText primary="Teacher Grid (DOCX)" />
            </ListItemButton>
          </ListItem>

          {/* Room Grid */}
          <ListItem disablePadding>
            <ListItemButton
              disabled={roomsFilter.length !== 1 || progress.running}
              onClick={async () => {
                if (roomsFilter.length !== 1) return;
                const room = rooms.find(r => r.id === roomsFilter[0]);
                const opt = { orientation: landscape ? "landscape" : "portrait", logoDataUrl: branding.logoDataUrl, showTeacher: true, showArea: true, compact: true };
                await exportRoomGridPDF(room, events, teachers, branding.schoolName, opt, breaks);
                closeNav();
              }}
            >
              <GridOnIcon fontSize="small" style={{ marginRight: 8 }} />
              <ListItemText primary="Room Grid (PDF)" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              disabled={roomsFilter.length !== 1 || progress.running}
              onClick={async () => {
                if (roomsFilter.length !== 1) return;
                const room = rooms.find(r => r.id === roomsFilter[0]);
                const opt = { orientation: landscape ? "landscape" : "portrait", logoDataUrl: branding.logoDataUrl, showTeacher: true, showArea: true, compact: true };
                await exportRoomGridDocx(room, events, teachers, branding.schoolName, opt, breaks);
                closeNav();
              }}
            >
              <DescriptionIcon fontSize="small" style={{ marginRight: 8 }} />
              <ListItemText primary="Room Grid (DOCX)" />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ my: 1 }} />

          {/* Batch exports */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={async () => {
                const opt = { orientation: landscape ? "landscape" : "portrait", logoDataUrl: branding.logoDataUrl };
                await exportTeachersBatchPDF(teachers, events, rooms, branding.schoolName, opt, progress);
                closeNav();
              }}
            >
              <PictureAsPdfIcon fontSize="small" style={{ marginRight: 8 }} />
              <ListItemText primary="Batch: Teachers (PDF)" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={async () => {
                const opt = { orientation: landscape ? "landscape" : "portrait", logoDataUrl: branding.logoDataUrl };
                await exportTeachersBatchDocx(teachers, events, rooms, branding.schoolName, opt, progress);
                closeNav();
              }}
            >
              <DescriptionIcon fontSize="small" style={{ marginRight: 8 }} />
              <ListItemText primary="Batch: Teachers (DOCX)" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={async () => {
                const opt = { orientation: landscape ? "landscape" : "portrait", logoDataUrl: branding.logoDataUrl };
                await exportRoomsBatchPDF(rooms, events, teachers, branding.schoolName, opt, progress);
                closeNav();
              }}
            >
              <PictureAsPdfIcon fontSize="small" style={{ marginRight: 8 }} />
              <ListItemText primary="Batch: Rooms (PDF)" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={async () => {
                const opt = { orientation: landscape ? "landscape" : "portrait", logoDataUrl: branding.logoDataUrl };
                await exportRoomsBatchDocx(rooms, events, teachers, branding.schoolName, opt, progress);
                closeNav();
              }}
            >
              <DescriptionIcon fontSize="small" style={{ marginRight: 8 }} />
              <ListItemText primary="Batch: Rooms (DOCX)" />
            </ListItemButton>
          </ListItem>
        </List>
      </Collapse>
    </List>

    <Divider />

    {/* Room filters submenu */}
    <List
      subheader={<ListSubheader component="div">Filters</ListSubheader>}
    >
      <ListItem disablePadding>
        <ListItemButton onClick={() => { openBreaksModal(); closeNav(); }}>
          <CalendarTodayIcon fontSize="small" style={{ marginRight: 8 }} />
          <ListItemText
            primary="Breaks editor"
            secondary="Create or remove day‑wide breaks"
          />
        </ListItemButton>
      </ListItem>

      <ListItem disablePadding>
        <ListItemButton onClick={() => { openPrepopulate(); closeNav(); }}>
          <GridOnIcon fontSize="small" style={{ marginRight: 8 }} />
          <ListItemText
            primary="Prepopulate"
            secondary="Auto-fill multiple lessons"
          />
        </ListItemButton>
      </ListItem>
    { /* Constrain editos */}
    <ListItem disablePadding>
      <ListItemButton onClick={() => { openconstrainModal(); closeNav(); }}>
      <CalendarTodayIcon fontSize="small" style={{ marginRight: 8 }} />
      <ListItemText
        primary="Room Limits"
        secondary="Weekly lesson limits(Room x subjects)"
      />
    </ListItemButton>
    </ListItem>
    <ListItem disablePadding>
      <ListItemButton onClick={() => { openTeacherConstrain(); closeNav(); }}>
      <CalendarTodayIcon fontSize="small" style={{ marginRight: 8 }} />
      <ListItemText
        primary="Teacher Limits"
        secondary="Weekly lesson limits(Teacher x subjects)"
      />
    </ListItemButton>
    </ListItem>
      <ListItem disablePadding secondaryAction={
        <IconButton edge="end" onClick={() => setRoomsOpen(o => !o)} aria-label="Toggle room filters">
          {roomsOpen ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      }>
        <ListItemButton onClick={() => setRoomsOpen(o => !o)}>
          <MeetingRoomIcon fontSize="small" style={{ marginRight: 8 }} />
          <ListItemText primary="Rooms" secondary={`${roomsFilter.length || 0} selected`} />
        </ListItemButton>
      </ListItem>

      <Collapse in={roomsOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{ pl: 2 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={selectAllRooms}>
              <ListItemText primary="Select all" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={clearRooms}>
              <ListItemText primary="Clear all" />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 0.5 }} />
          {rooms.map(r => {
            const checked = roomsFilter.includes(r.id);
            return (
              <ListItem key={r.id} disablePadding>
                <ListItemButton onClick={() => toggleRoomFilterValue(r.id)}>
                  <Checkbox tabIndex={-1} disableRipple checked={checked} />
                  <ListItemText primary={r.name} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Collapse>

      {/* Subject filters submenu */}
      <ListItem disablePadding secondaryAction={
        <IconButton edge="end" onClick={() => setSubjectsOpen(o => !o)} aria-label="Toggle subject filters">
          {subjectsOpen ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      }>
        <ListItemButton onClick={() => setSubjectsOpen(o => !o)}>
          <GroupsIcon fontSize="small" style={{ marginRight: 8 }} />
          <ListItemText primary="Subjects" secondary={`${subjectFilter.length || 0} selected`} />
        </ListItemButton>
      </ListItem>

      <Collapse in={subjectsOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{ pl: 2 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={selectAllSubjects}>
              <ListItemText primary="Select all" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={clearSubjects}>
              <ListItemText primary="Clear all" />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 0.5 }} />
          {subjects.map(s => {
            const checked = subjectFilter.includes(s);
            const count = subjectCounts.get(s) || 0;
            return (
              <ListItem key={s} disablePadding>
                <ListItemButton onClick={() => toggleSubjectFilterValue(s)}>
                  <Checkbox tabIndex={-1} disableRipple checked={checked} />
                  <ListItemText
                    primary={s || "(unnamed)"}
                    secondary={`Events: ${count}`}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </List>
    <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--muted)' }}>
      Top subjects (visible):
      {[...bySubjectVisible.entries()].sort((a,b)=> b[1]-a[1]).slice(0,3).map(([s,c]) => (
        <div key={s}>{s}: {c}</div>
      ))}
    </div>

    <Divider />

    {/* Settings (kept from your previous Drawer) */}
    <List subheader={<ListSubheader component="div">Settings</ListSubheader>}>
      <ListItem
        secondaryAction={
          <Switch
            edge="end"
            checked={landscape}
            onChange={(e)=> setLandscape(e.target.checked)}
          />
        }
      >
        <ListItemText primary="Landscape exports" secondary="Applies to PDF/DOCX exports" />
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton onClick={() => { setShowBranding(true); }}>
          <ListItemText primary="Branding" secondary="School name & logo" />
        </ListItemButton>
      </ListItem>
    </List>
  </Box>
</Drawer>
      {/* Filters moved into header popover */}
      <Popover open={Boolean(filtersAnchor)} anchorEl={filtersAnchor} onClose={closeFilters} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Box sx={{ p: 2, maxWidth: 640 }}>
          <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Teacher
              <select value={teacherFilter || ''} onChange={(e)=> setTeacherFilter(e.target.value || null)} style={{ marginLeft:8 }}>
                <option value="">All</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {teacherFilter && (
                <button style={{ marginLeft: 6 }} onClick={() => openSchedulePreviewForTeacher(teacherFilter)}>Preview</button>
              )}
            </label>
            <div>
              Rooms <ChipsFilter items={roomItems} selected={roomsFilter} setSelected={setRoomsFilter} allLabel="All rooms" />
              {roomsFilter && roomsFilter.length === 1 && (
                <button style={{ marginLeft: 6 }} onClick={() => openSchedulePreviewForRoom(roomsFilter[0])}>Preview</button>
              )}
            </div>
            <div>Subjects <ChipsFilter items={subjectItems} selected={subjectFilter} setSelected={setSubjectFilter} allLabel="All subjects" /></div>
            <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}><input type="checkbox" checked={landscape} onChange={(e)=> setLandscape(e.target.checked)} /> Landscape</label>
          </div>
          <Divider sx={{ my: 1 }} />
          <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
            <button onClick={handleBatchTeachersPDF} disabled={progress.running}>Batch: Teachers PDF</button>
            <button onClick={handleBatchTeachersDocx} disabled={progress.running}>Batch: Teachers DOCX</button>
            <button onClick={handleBatchRoomsPDF} disabled={progress.running}>Batch: Rooms PDF</button>
            <button onClick={handleBatchRoomsDocx} disabled={progress.running}>Batch: Rooms DOCX</button>
          </div>
        </Box>
      </Popover>

      {/* Schedule preview dialog (teacher or room) */}
      <SchedulePreview
        open={schedulePreview.open}
        onClose={closeSchedulePreview}
        events={events}
        teachers={teachers}
        rooms={rooms}
        teacherId={schedulePreview.type === 'teacher' ? schedulePreview.id : null}
        roomId={schedulePreview.type === 'room' ? schedulePreview.id : null}
      />
        {view === "timetable" && undoBanner && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    margin: '8px 0',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--panel)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span>
                    Auto-fix removed {undoBanner.count} event{undoBanner.count !== 1 ? 's' : ''}.
                  </span>
                  <button className="primary" onClick={undoAutoFix} style={{ padding: '6px 10px' }}>
                    Undo
                  </button>
                  <button onClick={clearUndoBanner} style={{ padding: '6px 10px' }}>
                    Dismiss
                  </button>
                </div>
              )}
      {view === "timetable" && limitsNotice && (
        <div style={{ margin: '8px 0', fontSize: 12, color: 'var(--muted)' }}>
          Weekly limits active · {limitsNotice.count} violation{limitsNotice.count!==1?'s':''} visible
          {(limitsNotice.rooms>0 || limitsNotice.teachers>0) && (
            <> ({limitsNotice.rooms} room · {limitsNotice.teachers} teacher)</>
          )}
        </div>
      )}

      

      {/* Grid export buttons */}
      <div className="panel" style={{ marginBottom: 12 }}>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={handleTeacherGridPDF}  disabled={!teacherFilter || progress.running}>Teacher Grid PDF</button>
          <button onClick={handleTeacherGridDocx} disabled={!teacherFilter || progress.running}>Teacher Grid DOCX</button>
          <button onClick={handleRoomGridPDF}     disabled={roomsFilter.length!==1 || progress.running}>Room Grid PDF</button>
          <button onClick={handleRoomGridDocx}    disabled={roomsFilter.length!==1 || progress.running}>Room Grid DOCX</button>
        </div>
      </div>

      {view === "timetable" && (
        <>
          <div style={{ margin: '8px 0', fontSize: 12, color: 'var(--muted)' }}>
            Showing {visibleEventCount} event{visibleEventCount !== 1 ? 's' : ''} (total: {totalEventCount})
          </div>
          <TimetableMUI 
            events={events}
            breaks={breaks}
            teachers={teachers}
            rooms={rooms}
            teacherId={teacherFilter}
            roomsFilters={roomsFilter}
            subjectFilters={subjectFilter}
            onEdit={(id) => openEventDialogFor(id)}
            onDelete={(id) => handleDelete(id)}
            onUpdate={(id, next) => handleUpdate(id, next)}   // your validation runs here
            onCreateFromGrid={handleCreateFromGrid}
            getViolationClass={getViolationClass}     // keep your weekly-limit + time rules highlighting
            timeConstraints={timeConstraints}
            limitsEnabled={limitsEnabled}
            constraints={constraints}
            teacherConstraints={teacherConstraints}
            rowHeight={64}  // tune as preferred
            overscan={3}
           />
        </>
      )}

      {view === "teachers" && (<ManageTeachers teachers={teachers} addTeacher={addTeacher} updateTeacher={updateTeacher} deleteTeacher={deleteTeacher} />)}
      {view === "rooms" && (<ManageRooms rooms={rooms} addRoom={addRoom} updateRoom={updateRoom} deleteRoom={deleteRoom} />)}

      {showBranding && (<BrandingModal open={showBranding} onClose={()=> setShowBranding(false)} value={branding} onSave={(next)=> { setBranding(next); setShowBranding(false); }} />)}
      <SettingsDialog
  open={settingsOpen}
  onClose={() => setSettingsOpen(false)}
  onOpenTheme={() => setThemeOpen(true)}
  onOpenBranding={() => setShowBranding(true)}
  onOpenExportOpts={() => setExportOptsOpen(true)}
  onOpenBackup={() => setBackupOpen(true)}
  onOpenReset={() => setResetOpen(true)}
  onOpenLimits={() => setLimitsModalOpen(true)}
  onOpenFreeSlots={() => setFreeSlotsOpen(true)}
  onOpenTimeConstraints={() => setTimeConstraintsOpen(true)}
  onOpenConfig={() => setConfigOpen(true)}

/>

      <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />

<ThemeModal
  open={themeOpen}
  onClose={() => setThemeOpen(false)}
  value={themeOptions}
  onSave={(next) => { setThemeOptions(next); setThemeOpen(false); }}
/>

< FreeSlotsToggleModal
  open={freeSlotsOpen}
  onClose={() => setFreeSlotsOpen(false)}
  value={freeSlotsEnabled}
  onSave={(enabled) => { setFreeSlotsEnabled(enabled); setFreeSlotsOpen(false); }}
 />

<TimeConstraintsModal
  open={timeConstraintsOpen}
  onClose={() => setTimeConstraintsOpen(false)}
  teachers={teachers}
  value={timeConstraints}
  onSave={(next) => { setTimeConstraints(next); setTimeConstraintsOpen(false); }}
/>

{/* Export options */}
<ExportOptionsModal
  open={exportOptsOpen}
  onClose={() => setExportOptsOpen(false)}
  value={exportOptions}
  onSave={(next) => { setExportOptions(next); setExportOptsOpen(false); }}
/>

{/* Data backup */}
<DataBackupModal
  open={backupOpen}
  onClose={() => setBackupOpen(false)}
  snapshot={{
    teachers, rooms, events, breaks,
    constraints, teacherConstraints,
    branding, exportOptions,
    filters: { teacherFilter, roomsFilter, subjectFilter }
  }}
  onRestoreSnapshot={(data) => {
    try {
      if (Array.isArray(data.teachers)) setTeachers(data.teachers);
      if (Array.isArray(data.rooms)) setRooms(data.rooms);
      if (Array.isArray(data.events)) setEvents(data.events);
      if (Array.isArray(data.breaks)) setBreaks(data.breaks);
      if (Array.isArray(data.constraints)) setConstraints(data.constraints);
      if (Array.isArray(data.teacherConstraints)) setTeacherConstraints(data.teacherConstraints);
      if (data.branding) setBranding(data.branding);
      if (data.exportOptions) setExportOptions(data.exportOptions);
      if (data.filters) {
        setRoomsFilter(Array.isArray(data.filters.roomsFilter) ? data.filters.roomsFilter : []);
        setSubjectFilter(Array.isArray(data.filters.subjectFilter) ? data.filters.subjectFilter : []);
        setTeacherFilter(data.filters.teacherFilter || null);
      }
      alert("Backup restored successfully.");
      setBackupOpen(false);
    } catch {
      alert("Failed to restore backup.");
    }
  }}
/>

{/* Reset confirm */}
<ResetConfirmModal
  open={resetOpen}
  onClose={() => setResetOpen(false)}
  onConfirm={() => {
    try {
      // Clear keys used by the app
      const keys = [
        'teachers','rooms','events','breaks',
        'constraints','teacherConstraints',
        'roomsFilter','subjectFilter','branding',
        'exportOptions','view'
      ];
      keys.forEach(k => localStorage.removeItem(k));
      // Restore initial data
      setTeachers(INITIAL_TEACHERS);
      setRooms(INITIAL_ROOMS);
      setEvents(SAMPLE_EVENTS);
      setBreaks([]);
      setConstraints([]);
      setTeacherConstraints([]);
      setRoomsFilter([]);
      setSubjectFilter([]);
      setBranding({ schoolName: "School Timetable", logoDataUrl: "" });
      setExportOptions({
        landscapeDefault: false,
        fixedCells: true,
        roomSubscript: true,
        breakShading: true,
        compact: true,
      });
      alert("App reset to defaults.");
      setResetOpen(false);
    } catch {
      alert("Reset failed.");
    }
  }}
/>

  <AddClassModal
    open={addClassOpen}
    onClose={closeAddClass}
    onSave={saveNewClass}
    teachers={teachers}
    rooms={rooms}
    events={events}
    limitsEnabled={limitsEnabled}
    freeSlotsEnabled={freeSlotsEnabled}
    timeConstraints={timeConstraints}
    initialValues={modalInital}
    subjects={StoreSubjects}
  />

  <ConstraintErrorBar
  open={editBarOpen}
  onClose={() => setEditBarOpen(false)}
  messages={editErrors}
/>
      
      <SearchDialog
          open={searchOpen}
          onClose={closeSearch}
          teachers={teachers}
          rooms={rooms}
          subjects={getSubjects(teachers, events)}
          events={events} 
          onPickTeacher={(id) => {
            // Jump to teacher and filter
            setTeacherFilter(id);
            setView("timetable");
          }}
          onPickRoom={(id) => {
            // Keep multi-select semantics: show ONLY that room
            setRoomsFilter([id]);
            setView("timetable");
          }}
          onPickSubject={(s) => {
            // Show ONLY that subject
            setSubjectFilter([s]);
            setView("timetable");
          }}
        />
    <BreaksEditorModal
      open={breaksModalOpen}
      onClose={closeBreaksModal}
      breaks={breaks}
      addBreak={addBreak}
      deleteBreak={deleteBreak}
    />
    <PrepopulateModal
      open={prepopulateOpen}
      onClose={closePrepopulate}
      teachers={teachers}
      rooms={rooms}
      events={events}
      constraints={constraints}
      teacherConstraints={teacherConstraints}
      limitsEnabled={limitsEnabled}
      timeConstraints={timeConstraints}
      onRun={(accepted, rejected) => {
        if (accepted && accepted.length) {
          setEvents(list => [
            ...list,
            ...accepted.map(a => {
              const title = (a.title || "").trim() || ((a.area || "").trim() || "");
              return ({ id: nanoid(), ...a, title, color: randomNiceColor() });
            }),
          ]);
        }
        if (rejected && rejected.length) {
          // surface constraint messages
          const msgs = rejected.flatMap(r => (r.messages || []));
          setEditErrors(msgs);
          setEditBarOpen(true);
        }
      }}
    />
    <EventDialog
      open={eventDialogOpen}
      event={selectedEvent}
      onClose={() => setEventDialogOpen(false)}
      onEdit={(ev) => {
        // Close details dialog and open AddClassModal for editing
        setEventDialogOpen(false);
        setEditingEventId(ev.id);
        setModalInitial({
          title: ev.title || "",
          area: ev.area || "",
          dayIndex: ev.dayIndex,
          start: ev.start,
          end: ev.end,
          teacherId: ev.teacherId || "",
          teacherIds: Array.isArray(ev.teacherIds) && ev.teacherIds.length > 0 ? ev.teacherIds.slice() : (ev.teacherId ? [ev.teacherId] : []),
          roomId: ev.roomId || "",
          classSize: ev.classSize || "",
        });
        setAddClassOpen(true);
      }}
      onDelete={(id) => { handleDelete(id); setEventDialogOpen(false); }}
    />
    <ConstrainEditorModal open={constrainModalOpen} onClose={closeconstrainModal} rooms={rooms} subjects={getSubjects(teachers, events)} constraints={constraints} addConstraint={addConstraint} deleteConstraint={deleteConstraint} />
    <TeacherConstrainModal open={teacherConstrainModalOpen} onClose={closeTeacherConstrain} teachers={teachers} subjects={getSubjects(teachers, events)} constraints={teacherConstraints} addConstraint={addTeacherConstraint} deleteConstraint={deleteTeacherConstraint} />
    <LimitsToggleModal
      open={limitsModalOpen}
      onClose={() => setLimitsModalOpen(false)}
      value={limitsEnabled}
      onSave={(next) => { setLimitsEnabled(next); setLimitsModalOpen(false); }}
    />
    <LimitsAutofixModal
      open={autofixOpen}
      onClose={() => setAutofixOpen(false)}
      violatingEvents={autofixList}
      onRemoveSelected={removeSelectedViolations}
    />
        <ExportProgressModal />
    </div>
    </ThemeProvider>
  );
}
