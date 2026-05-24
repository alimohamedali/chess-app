import { useState } from "react";

export default function OnlineLobby({ onCreateGame, onJoinGame, onBack, status }) {
  const [joinId, setJoinId] = useState("");
  const [selectedColor, setSelectedColor] = useState("w");

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100vh", gap: "16px", background: "#1a1a2e"
    }}>
      <h2 style={{ color: "white" }}>🌐 Online Play</h2>

      {/* Color Selection */}
      <div style={{ background: "#16213e", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
        <p style={{ color: "#aaa", margin: "0 0 10px 0" }}>Choose your color:</p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          {[
            { value: "w", label: "⬜ White" },
            { value: "b", label: "⬛ Black" },
            { value: "r", label: "🎲 Random" },
          ].map(c => (
            <button
              key={c.value}
              onClick={() => setSelectedColor(c.value)}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: "none",
                cursor: "pointer", fontWeight: "bold",
                background: selectedColor === c.value ? "#4CAF50" : "#333",
                color: "white",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => onCreateGame(selectedColor)} style={btnStyle("#4CAF50")}>
        ➕ Create New Game
      </button>

      <p style={{ color: "#aaa", margin: 0 }}>or</p>

      <input
        placeholder="Enter game code"
        value={joinId}
        onChange={e => setJoinId(e.target.value.toUpperCase())}
        style={{
          padding: "10px", fontSize: "18px", borderRadius: "8px",
          border: "1px solid #ccc", textAlign: "center", width: "200px",
          letterSpacing: "4px", fontWeight: "bold",
        }}
      />

      <button onClick={() => onJoinGame(joinId)} style={btnStyle("#2196F3")}>
        🔗 Join Game
      </button>

      {status && (
        <p style={{ color: "#4CAF50", fontWeight: "bold", fontSize: "16px" }}>{status}</p>
      )}

      <button onClick={onBack} style={btnStyle("#555")}>🏠 Back</button>
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