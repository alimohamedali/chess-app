import { colors } from "./colors";

// ===== Buttons =====
export const btn = {
  base: {
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    color: colors.textPrimary,
    borderRadius: "8px",
    fontSize: "16px",
    transition: "opacity 0.2s",
  },
  primary: (bg = colors.green) => ({
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    color: colors.textPrimary,
    borderRadius: "8px",
    fontSize: "16px",
    padding: "12px 30px",
    minWidth: "200px",
    background: bg,
  }),
  small: (bg = colors.green, active = false) => ({
    padding: "6px 14px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    color: colors.textPrimary,
    background: active ? colors.green : "#333",
  }),
  nav: (bg = "#333") => ({
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    background: bg,
    color: colors.textPrimary,
    fontSize: "16px",
  }),
  action: (bg = colors.green) => ({
    padding: "10px 24px",
    fontSize: "15px",
    cursor: "pointer",
    borderRadius: "8px",
    border: "none",
    background: bg,
    color: colors.textPrimary,
    fontWeight: "bold",
  }),
};

// ===== Layout =====
export const layout = {
  page: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "12px",
    background: colors.bgPrimary,
    minHeight: "100vh",
    gap: "10px",
  },
  centered: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    gap: "20px",
    background: colors.bgPrimary,
  },
  row: {
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
};

// ===== Cards =====
export const card = {
  base: {
    background: colors.bgSecondary,
    borderRadius: "12px",
    padding: "12px",
  },
  info: {
    background: colors.bgSecondary,
    padding: "6px 16px",
    borderRadius: "8px",
    textAlign: "center",
  },
  warning: {
    background: colors.bgSecondary,
    padding: "12px 20px",
    borderRadius: "12px",
    textAlign: "center",
  },
};

// ===== Timer =====
export const timerStyle = (active) => ({
  background: active ? colors.timerActive : colors.timerIdle,
  borderRadius: "8px",
  padding: "6px 16px",
  textAlign: "center",
  transition: "background 0.3s",
});

// ===== Text =====
export const text = {
  heading: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  title: {
    color: colors.textPrimary,
    fontSize: "2.5rem",
    margin: 0,
  },
  subtitle: {
    color: colors.textSecondary,
    margin: 0,
  },
  status: {
    margin: 0,
    color: colors.textPrimary,
    textAlign: "center",
    fontSize: "15px",
  },
  statusReviewing: {
    margin: 0,
    color: colors.textSecondary,
    textAlign: "center",
    fontSize: "15px",
  },
  label: {
    color: colors.green,
    margin: "0 0 8px 0",
    fontWeight: "bold",
    textAlign: "center",
  },
  muted: {
    color: colors.textMuted,
    textAlign: "center",
    fontSize: "11px",
  },
  timerText: {
    color: colors.textPrimary,
    fontSize: "20px",
    fontWeight: "bold",
  },
  gameCode: {
    color: colors.green,
    fontSize: "20px",
  },
  warning: {
    color: colors.orange,
    margin: 0,
    fontSize: "12px",
  },
};

// ===== Input =====
export const inputStyle = {
  padding: "10px",
  fontSize: "18px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  textAlign: "center",
  width: "200px",
  letterSpacing: "4px",
  fontWeight: "bold",
};

// ===== Move History =====
export const moveHistory = {
  container: {
    background: colors.bgSecondary,
    borderRadius: "12px",
    padding: "12px",
    width: "170px",
  },
  header: {
    display: "flex",
    gap: "4px",
    marginBottom: "6px",
    borderBottom: "1px solid #333",
    paddingBottom: "4px",
  },
  list: {
    maxHeight: "320px",
    overflowY: "auto",
  },
  row: {
    display: "flex",
    gap: "4px",
    marginBottom: "3px",
    fontSize: "13px",
  },
  moveBtn: (active, isBlack = false) => ({
    color: active ? colors.moveActive : isBlack ? colors.moveBlack : colors.moveWhite,
    minWidth: isBlack ? undefined : "60px",
    cursor: "pointer",
    fontWeight: active ? "bold" : "normal",
    padding: "1px 3px",
    borderRadius: "3px",
    background: active ? colors.moveBgActive : "transparent",
  }),
};

// ===== Theme Picker =====
export const themePicker = {
  container: {
    marginTop: "10px",
  },
  dot: (bg, active) => ({
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    cursor: "pointer",
    background: bg,
    border: active ? "3px solid white" : "3px solid transparent",
  }),
};

// ===== Color Picker (Online) =====
export const colorPicker = {
  container: {
    background: colors.bgSecondary,
    padding: "16px",
    borderRadius: "12px",
    textAlign: "center",
  },
  row: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
  },
};