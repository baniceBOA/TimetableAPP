import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export default function FreeSlotsToggleModal({ open, onClose, value, onSave }) {
  // `value` is the current global setting (boolean), e.g., from useLocalStorage('freeSlotsEnabled', true)
  const [enabled, setEnabled] = React.useState(!!value);

  React.useEffect(() => {
    if (open) setEnabled(!!value); // reset switch to the latest global value when opened
  }, [open, value]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Free slots</DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          Enable or disable the free slots feature (suggest available times in the Add Class modal).
        </Typography>

        <List dense>
          <ListItem
            secondaryAction={
              <Switch
                edge="end"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
            }
          >
            <ListItemText
              primary="Suggest free slots"
              secondary="Show recommendations while scheduling"
            />
          </ListItem>
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={() => onSave?.(enabled)}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}