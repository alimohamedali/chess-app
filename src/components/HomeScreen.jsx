import { THEMES } from "../utils/constants";

export default function HomeScreen({ onSelectMode, theme, onSelectTheme }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100vh", gap: "20px", background: "#1a1a2e"
    }}>
      <h1 style={{ color: "white", fontSize: "2.5rem" }}>♟️ Chess App</h1>

      <button onClick={() => onSelectMode("ai")} style={btnStyle("#4CAF50")}>
        🤖 Play vs Engine
      </button>

      <button onClick={() => onSelectMode("online")} style={btnStyle("#2196F3")}>
        🌐 Play Online
      </button>

      <div style={{ marginTop: "10px" }}>
        <p style={{ color: "#aaa", textAlign: "center", marginBottom: "10px" }}>
          🎨 Board Theme
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          {THEMES.map(t => (
            <div
              key={t.name}
              onClick={() => onSelectTheme(t)}
              title={t.name}
              style={{
                width: "40px", height: "40px", borderRadius: "8px",
                cursor: "pointer", background: t.dark,
                border: theme.name === t.name ? "3px solid white" : "3px solid transparent",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function btnStyle(bg) {
  return {
    padding: "12px 30px", fontSize: "16px", cursor: "pointer",
    borderRadius: "8px", border: "none", background: bg,
    color: "white", fontWeight: "bold", minWidth: "200px",
  };
}