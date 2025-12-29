import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import SettingsIcon from "@mui/icons-material/Settings";
import BrushIcon from "@mui/icons-material/Brush";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import { PaddingOutlined } from "@mui/icons-material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import TuneIcon from "@mui/icons-material/Tune";
import RuleIcon from "@mui/icons-material/Rule";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

export default function SettingsDialog({
  open,
  onClose,
  onOpenTheme,
  onOpenBranding,     // fn
  onOpenExportOpts,   // fn
  onOpenBackup,       // fn
  onOpenReset,        // fn
  onOpenLimits,       // fn
  onOpenFreeSlots,    // fn
  onOpenTimeConstraints, // fn
  onOpenConfig, // fn
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display:'flex', alignItems:'center', gap: 1 }}>
        <SettingsIcon fontSize="small" /> Settings
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color:'text.secondary', mb: 1 }}>
          Configure branding and exports, back up your data, or reset the app.
        </Typography>

        <List dense>
          {/* Branding */}
          {/* Time constraints */}
          <ListItem disablePadding>
           <ListItemButton onClick={() => { onOpenTheme?.(); onClose?.(); }}>
             <AccessTimeIcon fontSize="small" style={{ marginRight: 8 }} />
             <ListItemText primary="Theme" secondary="Change the theme to your liking" />
           </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
           <ListItemButton onClick={() => { onOpenTimeConstraints?.(); onClose?.(); }}>
             <AccessTimeIcon fontSize="small" style={{ marginRight: 8 }} />
             <ListItemText primary="Time constraints" secondary="Teacher unavailability & subject time windows" />
           </ListItemButton>
          </ListItem>
          {/* Weekly limits toggles */}
         <ListItem disablePadding>
           <ListItemButton onClick={() => { onOpenLimits?.(); onClose?.(); }}>
             <RuleIcon fontSize="small" style={{ marginRight: 8 }} />
             <ListItemText
               primary="Weekly limits"
              secondary="Enable/disable Teacher × Subject and Room × Subject limits"
            />
           </ListItemButton>
         </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => { onOpenBranding?.(); onClose?.(); }}>
              <BrushIcon fontSize="small" style={{ marginRight: 8 }} />
              <ListItemText
                primary="Branding"
                secondary="School name and logo used in exports"
              />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ my: 0.5 }} />

          <ListItem disablePadding>
            <ListItemButton onClick={() => { onOpenConfig?.(); onClose?.(); }}>
              <SettingsIcon fontSize="small" style={{ marginRight: 8 }} />
              <ListItemText
                primary="Timetable settings"
                secondary="Days, hours, and slot granularity"
              />
            </ListItemButton>
          </ListItem>

          {/* Export options */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => { onOpenExportOpts?.(); onClose?.(); }}>
              <TuneIcon fontSize="small" style={{ marginRight: 8 }} />
              <ListItemText
                primary="Export options"
                secondary="Defaults for PDF/DOCX grid exports"
              />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ my: 0.5 }} />

          {/* Data backup */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => { onOpenBackup?.(); onClose?.(); }}>
              <DownloadIcon fontSize="small" style={{ marginRight: 8 }} />
              <ListItemText
                primary="Backup data"
                secondary="Export or restore app data (JSON)"
              />
            </ListItemButton>
          </ListItem>
          {/* Free Slots */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => { onOpenFreeSlots?.(); onClose?.(); }}>
              <PaddingOutlined fontSize="small" style={{ marginRight: 8 }} />
              <ListItemText
                primary="Free Slots "
                secondary="show the available space a lesson can be sloted"
              />
            </ListItemButton>
          </ListItem>

          {/* Reset */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => { onOpenReset?.(); onClose?.(); }}>
              <RestartAltIcon fontSize="small" style={{ marginRight: 8 }} />
              <ListItemText
                primary="Reset app"
                secondary="Clear local data and restore defaults"
              />
            </ListItemButton>
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
}