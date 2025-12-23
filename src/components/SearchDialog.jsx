import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { countEventsBySubject } from "../utils/stats"

/**
 * Generic search dialog for Teachers, Rooms, and Subjects.
 * props:
 *  - open, onClose
 *  - teachers: [{id, name, areas?[]}]
 *  - rooms:    [{id, name, capacity?}]
 *  - subjects: [string]
 *  - onPickTeacher(id), onPickRoom(id), onPickSubject(subject)
 */
export default function SearchDialog({
  open,
  onClose,
  teachers = [],
  rooms = [],
  subjects = [],
  events,
  onPickTeacher,
  onPickRoom,
  onPickSubject,
}) {
  const [tab, setTab] = React.useState(0); // 0=Teachers, 1=Rooms, 2=Subjects
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setTab(0);
      setQuery("");
    }
  }, [open]);

  // simple case-insensitive contains; trims spaces
  function match(text, q) {
    const t = String(text || "").toLowerCase();
    const s = String(q || "").trim().toLowerCase();
    if (!s) return true;
    return t.includes(s);
  }

  const teacherResults = teachers
    .filter(t => match(t.name, query) || (t.areas || []).some(a => match(a, query)))
    .slice(0, 50);

  const roomResults = rooms
    .filter(r => match(r.name, query))
    .slice(0, 50);

  const subjectResults = subjects
    .filter(s => match(s, query))
    .slice(0, 100);

  const countsMap = React.useMemo(() => countEventsBySubject(events || []), [events]);

  function renderTeachers() {
    if (teacherResults.length === 0) {
      return <Typography variant="body2" sx={{ color: "text.secondary" }}>No teachers found.</Typography>;
    }
    return (
      <List dense sx={{ mt: 1 }}>
        {teacherResults.map(t => (
          <ListItem key={t.id} disablePadding>
            <ListItemButton
              onClick={() => { onPickTeacher?.(t.id); onClose?.(); }}
            >
              <ListItemText
                primary={t.name}
                secondary={(t.areas || []).join(" • ") || "—"}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    );
  }

  function renderRooms() {
    if (roomResults.length === 0) {
      return <Typography variant="body2" sx={{ color: "text.secondary" }}>No rooms found.</Typography>;
    }
    return (
      <List dense sx={{ mt: 1 }}>
        {roomResults.map(r => (
          <ListItem key={r.id} disablePadding>
            <ListItemButton
              onClick={() => { onPickRoom?.(r.id); onClose?.(); }}
            >
              <ListItemText
                primary={r.name}
                secondary={typeof r.capacity === "number" ? `Capacity: ${r.capacity}` : undefined}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    );
  }

  function renderSubjects() {
  if (subjectResults.length === 0) {
    return <Typography variant="body2" sx={{ color: "text.secondary" }}>No subjects found.</Typography>;
  }
  return (
    <List dense sx={{ mt: 1 }}>
      {subjectResults.map(s => {
        const count = countsMap.get(s) || 0;
        return (
          <ListItem key={s} disablePadding>
            <ListItemButton
              onClick={() => { onPickSubject?.(s); onClose?.(); }}
            >
              <ListItemText
                primary={s}
                secondary={`Events: ${count}`}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Search</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "grid", gap: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            aria-label="Search categories"
            variant="fullWidth"
          >
            <Tab label="Teachers" />
            <Tab label="Rooms" />
            <Tab label="Subjects" />
          </Tabs>

          <TextField
            size="small"
            placeholder={tab === 0 ? "Search teachers or their subjects…" :
                         tab === 1 ? "Search rooms…" :
                                     "Search subjects…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {tab === 0 && renderTeachers()}
          {tab === 1 && renderRooms()}
          {tab === 2 && renderSubjects()}
        </Box>
      </DialogContent>
    </Dialog>
  );
}