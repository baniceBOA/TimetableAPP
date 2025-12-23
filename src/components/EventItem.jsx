import React from 'react';
export default function EventItem({ event, onEdit, onDelete }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="event-item compact" onClick={() => setOpen(o => !o)}>
      <div className="event-title" title={event.title}>{event.title}</div>
      <div className="event-tooltip" role="dialog" aria-label="Event details" style={{ display: open ? 'block' : undefined }} onClick={(e) => e.stopPropagation()}>
        <div className="tip-row"><strong>Time:</strong> {event.start} – {event.end}</div>
        {event.area && <div className="tip-row"><strong>Subject:</strong> {event.area}</div>}
        {event.teacherName && <div className="tip-row"><strong>Teacher:</strong> {event.teacherName}</div>}
        {event.roomName && <div className="tip-row"><strong>Room:</strong> {event.roomName}</div>}
        <div className="tip-actions">
          <button onClick={() => onEdit(event)}>Edit</button>
          <button className="danger" onClick={() => onDelete(event.id)}>Delete</button>
        </div>
      </div>
    </div>
  );
}
