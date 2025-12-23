import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { md3Theme } from "./theme/md3Theme";
import { ExportProgressProvider } from "./contexts/ExportProgressContext.jsx";
import "./styles.css";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={md3Theme}>
      <CssBaseline />
      <ExportProgressProvider>
        <App />
      </ExportProgressProvider>
    </ThemeProvider>
  </React.StrictMode>
);
