import * as React from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

/**
 * Compact event card:
 * - Main line: lesson title (centered)
 * - Subscript: room (smaller, italic)
 * - Violation outline via `violationClass` (“limit-…”, “time-…” classes mapped to sx)
 */
export default function EventCardMUI({
  event,
  teacher,
  room,
  violationClass = "",
  onEdit,
  onDelete,
}) {
  const title = event.title || "";
  const roomName = room?.name || "";
  const bg = event.color || "#E6F0FF";

  const outlineSx = (theme) => {
    // Map violationClass to outlines
    const map = {
      "limit-room-exceeded": `2px dashed ${theme.palette.error.main}`,
      "limit-teacher-exceeded": `2px dashed ${theme.palette.secondary.main}`,
      "limit-both-exceeded": `2px dashed ${theme.palette.warning.main}`,
      "time-teacher-blocked": `2px dashed ${theme.palette.error.main}`,
      "time-subject-blocked": `2px dashed ${theme.palette.info.main}`,
      "time-both-blocked": `2px dashed ${theme.palette.warning.main}`,
    };
    let outline = "none";
    for (const k of Object.keys(map)) {
      if (violationClass.includes(k)) {
        outline = map[k];
        break;
      }
    }
    return { outline };
  };

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        bgcolor: bg,
        borderRadius: 1.25,
        px: 1,
        py: 0.5,
        ...outlineSx(theme),
      })}
    >
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Stack direction="column" spacing={0} sx={{ flex: 1, textAlign: "center" }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, lineHeight: 1.2 }}
            title={title}
          >
            {title}
          </Typography>
          {roomName && (
            <Typography
              variant="caption"
              sx={{ fontStyle: "italic", opacity: 0.85 }}
              title={roomName}
            >
              {roomName}
            </Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="Edit">
            <IconButton size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={onDelete}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}