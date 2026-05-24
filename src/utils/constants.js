export const THEMES = [
  { name: "Classic", light: "#f0d9b5", dark: "#b58863" },
  { name: "Blue", light: "#dee3e6", dark: "#8ca2ad" },
  { name: "Green", light: "#ffffdd", dark: "#86a666" },
  { name: "Purple", light: "#f0e6ff", dark: "#9b72cf" },
];

export const DIFFICULTIES = [
  { label: "Easy 🟢", depth: 2, moveTime: 1500 },
  { label: "Medium 🟡", depth: 6, moveTime: 2000 },
  { label: "Hard 🔴", depth: 15, moveTime: 3000 },
];

export const TIMER_OPTIONS = [
  { label: "1 min", seconds: 60 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
];

export const INITIAL_TIME = 600;