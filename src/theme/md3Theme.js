import { createTheme } from "@mui/material/styles";
const md3Palette = {
  primary: { main: "#2D8CFF", contrastText: "#FFFFFF" },
  secondary: { main: "#59C173", contrastText: "#0B1220" },
  tertiary: { main: "#F953C6", contrastText: "#0B1220" },
  background: { default: "#0F172A", paper: "#0B1220" },
  text: { primary: "#E5E7EB", secondary: "#94A3B8" },
};
const md3Typography = { h6: { fontSize: "1.125rem", fontWeight: 600 }, subtitle2: { fontSize: "0.875rem", fontWeight: 500, opacity: 0.85 }, body2: { fontSize: "0.875rem" } };
export const md3Theme = createTheme({
  palette: md3Palette,
  typography: md3Typography,
  components: {
    MuiAppBar: { styleOverrides: { root: { boxShadow: "none", backgroundImage: "none" }, colorPrimary: { backgroundColor: md3Palette.background.paper } } },
    MuiToolbar: { styleOverrides: { root: { minHeight: 56, "@media (min-width:600px)": { minHeight: 64 }, paddingLeft: 12, paddingRight: 12 } } },
    MuiIconButton: { styleOverrides: { root: { color: md3Palette.text.primary } } },
    MuiTypography: { styleOverrides: { root: { color: md3Palette.text.primary } } },
  },
});
