import * as React from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Chip from '@mui/material/Chip';
// edit/delete buttons removed per UX request

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
  onOpenDetails,
  collisionCount = 0,
  collisionDetails = [],
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
      onClick={() => onOpenDetails?.(event) || onEdit?.(event.id)}
      sx={(theme) => ({
        bgcolor: bg,
        position: 'relative',
        borderRadius: (theme?.shape?.borderRadius) ?? 3,
        px: 1,
        py: 0.5,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        ...outlineSx(theme),
      })}
    >
      {collisionCount > 0 && (
        <Tooltip
          title={
            Array.isArray(collisionDetails) && collisionDetails.length > 0
              ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {collisionDetails.map((d, i) => <div key={i}>{d}</div>)}
                </div>
              )
              : 'Collision'
          }
        >
          <Chip
            label={String(collisionCount)}
            size="small"
            color="error"
            onClick={(e) => { e.stopPropagation(); }}
            sx={{ position: 'absolute', top: 6, left: 6, height: 20, fontWeight: 700, zIndex: 6 }}
          />
        </Tooltip>
      )}
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Stack direction="column" spacing={0} sx={{ flex: 1, textAlign: "center" }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, lineHeight: 1.2 }}
            title={title}
          >
            {title.slice(0, 4)}
          </Typography>
          {/* teacher and room labels removed as requested */}
        </Stack>

        {/* edit/delete controls removed */}
      </Stack>
    </Paper>
  );
}