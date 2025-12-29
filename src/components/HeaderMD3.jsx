import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { ExportProgressContext } from "../contexts/ExportProgressContext";

function useFilledOnScroll(threshold = 4) {
  const [filled, setFilled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setFilled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return filled;
}

export default function HeaderMD3({ title = "Timetable", subtitle, onOpenNav, onOpenSearch, onOpenFilters, onAddClass, rightActions = [], centerTitle = false}) {
  const filled = useFilledOnScroll();
  const { running, percent, label, requestCancel } = React.useContext(ExportProgressContext);

  return (
    <AppBar position="sticky" color="primary" sx={{ transition: "background-color .15s ease", bgcolor: (theme) => (filled ? theme.palette.background.paper : "transparent"), borderBottom: (theme) => (filled ? `1px solid ${theme.palette.divider}` : "none") }}>
      <Toolbar disableGutters sx={{ px: 1.5, minHeight: { xs: 56, sm: 64 }, display: "grid", gridTemplateColumns: centerTitle ? "48px 1fr auto" : "48px auto 1fr", alignItems: "center", columnGap: 8 }}>
        <IconButton aria-label="Open navigation" edge="start" onClick={onOpenNav} sx={{ ml: 0.5 }}><MenuIcon /></IconButton>
        <Box sx={{ display: "grid", justifyItems: centerTitle ? "center" : "start", alignItems: "center" }}>
          <Typography variant="h6" noWrap>{title}</Typography>
          {subtitle && <Typography variant="subtitle2" noWrap sx={{ color: "text.secondary" }}>{subtitle}</Typography>}
        </Box>
        <Stack direction="row" spacing={0.5} justifyContent="end" alignItems="center">
          <IconButton aria-label="Search" onClick={onOpenSearch} disabled={running}><SearchIcon /></IconButton>
          <IconButton aria-label="Filters" onClick={(e) => onOpenFilters?.(e.currentTarget)} disabled={running}><TuneIcon /></IconButton>
          <Button
            size="small"
            variant="contained"
            color="secondary"
            onClick={onAddClass}
            disabled={running}
            sx={{ ml: 0.5, textTransform: "none", fontWeight: 600 }}
          >
            + Add class
          </Button>
          {rightActions.map((a, i) => (
            <IconButton key={i} aria-label={a.ariaLabel} onClick={a.onClick} disabled={running}>{a.icon}</IconButton>
          ))}
        </Stack>
      </Toolbar>
      {running && (
        <Box sx={{ px: 1.5, pb: 1, display: "grid", gap: 0.75 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{label || "Exporting…"}</Typography>
            <Button size="small" color="inherit" onClick={requestCancel} sx={{ textTransform: "none", opacity: 0.9 }}>Cancel</Button>
          </Box>
          <LinearProgress variant="determinate" value={percent} />
        </Box>
      )}
    </AppBar>
  );
}
