import { createTheme } from "@mui/material/styles";
/**
 * Build an MUI theme from user options.
 * Options:
 *  - mode: "dark" | "light"
 *  - primary, secondary: hex colors
 *  - backgroundDefault, backgroundPaper, textPrimary, textSecondary: hex colors
 *  - borderRadius: number (px)
 *  - typographyScale: number (multiplier)
 */
export function makeTheme(opts = {}) {
  const {
    mode = "dark",
    primary = "#2D8CFF",
    secondary = "#59C173",
    backgroundDefault = mode === "dark" ? "#0F172A" : "#F5F7FA",
    backgroundPaper   = mode === "dark" ? "#0B1220" : "#FFFFFF",
    textPrimary       = mode === "dark" ? "#E5E7EB" : "#0B1220",
    textSecondary     = mode === "dark" ? "#94A3B8" : "#4B5563",
    borderRadius = 12,
    typographyScale = 1.0,
  } = opts;

  return createTheme({
    palette: {
      mode,
      primary:   { main: primary },
      secondary: { main: secondary },
      background: { default: backgroundDefault, paper: backgroundPaper },
      text: { primary: textPrimary, secondary: textSecondary },
    },
    shape: { borderRadius },
    typography: {
      h6:       { fontSize: `${1.125 * typographyScale}rem`, fontWeight: 600 },
      subtitle2:{ fontSize: `${0.875 * typographyScale}rem`, fontWeight: 500, opacity: 0.85 },
      body2:    { fontSize: `${0.875 * typographyScale}rem` },
    },
  });
}