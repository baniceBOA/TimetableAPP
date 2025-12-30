import { createTheme } from "@mui/material/styles";

const md3Palette = {
  primary:   { main: "#2D8CFF", contrastText: "#FFFFFF" },
  secondary: { main: "#59C173", contrastText: "#0B1220" },
  // MUI doesn't have 'tertiary' built-in; we'll add it under a custom section.
  background:{ default: "#0F172A", paper: "#0B1220" },
  text:      { primary: "#E5E7EB", secondary: "#94A3B8" },
  divider:   "#1F2937", // helps slot grid lines & outlines
};

const md3Custom = {
  tertiary: { main: "#1ed2f1ff", contrastText: "#0B1220" },
  // If you later want MD3 container roles, add them here:
  // primaryContainer: "#xxxxxx", onPrimaryContainer: "#xxxxxx",
  // tertiaryContainer: "#xxxxxx", onTertiaryContainer: "#xxxxxx",
};

const md3Typography = {
  h6:       { fontSize: "1.125rem", fontWeight: 600 },
  subtitle2:{ fontSize: "0.875rem", fontWeight: 500, opacity: 0.85 },
  body2:    { fontSize: "0.875rem" },
};

export const md3Theme = createTheme({
  // Enable CSS theme variables so `theme.vars.*` is available in sx
  cssVariables: true,

  palette: md3Palette,
  typography: md3Typography,

  // Expose your custom MD3-like tokens (e.g., tertiary)
  custom: md3Custom,

  shape: { borderRadius: 3 }, // MD3-ish rounding (default 3px)

  components: {
    MuiAppBar: {
      styleOverrides: {
        root:        { boxShadow: "none", backgroundImage: "none" },
        colorPrimary:{ backgroundColor: md3Palette.background.paper },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 56,
          "@media (min-width:600px)": { minHeight: 64 },
          paddingLeft: 12,
          paddingRight: 12,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { color: md3Palette.text.primary } },
    },
    MuiTypography: {
      styleOverrides: { root: { color: md3Palette.text.primary } },
    },
    // Helpful defaults for MD3 look
    MuiCard: {
      styleOverrides: {
        root: (theme) => ({
          borderRadius: (theme?.shape?.borderRadius) ?? 3,
          backgroundColor: (theme.vars || theme).palette.background.paper,
          border: `1px solid ${((theme.vars || theme).palette.divider) || "#1F2937"}`,
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 999 },
      },
    },
  },
});