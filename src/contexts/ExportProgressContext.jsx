import * as React from "react";
export const ExportProgressContext = React.createContext(null);
export function ExportProgressProvider({ children }) {
  const cancelRef = React.useRef(false);
  const [state, setState] = React.useState({ running: false, label: "", percent: 0, cancelled: false });
  function start(label = "Exporting…") { cancelRef.current = false; setState({ running: true, label, percent: 0, cancelled: false }); }
  function update(percent, label) { setState((s) => ({ ...s, percent: Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : s.percent)), label: label ?? s.label })); }
  function requestCancel() { cancelRef.current = true; setState((s) => ({ ...s, cancelled: true, label: "Cancelling…" })); }
  function isCancelled() { return !!cancelRef.current; }
  function done(finalLabel = "Export finished") { const wasCancelled = cancelRef.current; setState({ running: false, label: finalLabel, percent: wasCancelled ? 0 : 100, cancelled: wasCancelled }); setTimeout(() => setState({ running: false, label: "", percent: 0, cancelled: false }), 1500); }
  const value = { ...state, start, update, requestCancel, isCancelled, done };
  return <ExportProgressContext.Provider value={value}>{children}</ExportProgressContext.Provider>;
}
