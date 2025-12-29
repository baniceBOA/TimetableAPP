// File: src/constants.js
// Backward-compat shim: read from config at runtime.
// Prefer using `useConfig()` where you can for reactive data.

import { DEFAULT_CONFIG } from "./utils/configStore";

// NOTE: These exports are snapshots at module-load time.
// For reactive values inside components, call the hook: `const {config} = useConfig();`
export const DAYS = DEFAULT_CONFIG.days;
export const START_HOUR = DEFAULT_CONFIG.startHour;
export const END_HOUR = DEFAULT_CONFIG.endHour;
export const SLOTS_PER_HOUR = DEFAULT_CONFIG.slotsPerHour;
export const ROW_HEIGHT = DEFAULT_CONFIG.rowHeight;
export const DAY_LABEL_COL_WIDTH = DEFAULT_CONFIG.dayLabelColWidth;
export const ROOM_LABEL_COL_WIDTH = DEFAULT_CONFIG.roomLabelColWidth;
export const TIME_HEADER_HEIGHT = DEFAULT_CONFIG.timeHeaderHeight;
export const TOTAL_COLS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR;