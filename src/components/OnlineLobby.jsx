import { useState } from "react";
import { layout, btn, text, card, colorPicker, inputStyle } from "../styles/components";
import { colors } from "../styles/colors";

export default function OnlineLobby({ onCreateGame, onJoinGame, onBack, status }) {
  const [joinId, setJoinId] = useState("");
  const [selectedColor, setSelectedColor] = useState("w");

  return (
    <div style={layout.centered}>
      <h2 style={text.heading}>🌐 Online Play</h2>

      <div style={colorPicker.container}>
        <p style={{ ...text.subtitle, margin: "0 0 10px 0" }}>Choose your color:</p>
        <div style={colorPicker.row}>
          {[
            { value: "w", label: "⬜ White" },
            { value: "b", label: "⬛ Black" },
            { value: "r", label: "🎲 Random" },
          ].map(c => (
            <button
              key={c.value}
              onClick={() => setSelectedColor(c.value)}
              style={btn.small(colors.green, selectedColor === c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => onCreateGame(selectedColor)} style={btn.primary(colors.green)}>
        ➕ Create New Game
      </button>

      <p style={text.subtitle}>or</p>

      <input
        placeholder="Enter game code"
        value={joinId}
        onChange={e => setJoinId(e.target.value.toUpperCase())}
        style={inputStyle}
      />

      <button onClick={() => onJoinGame(joinId)} style={btn.primary(colors.blue)}>
        🔗 Join Game
      </button>

      {status && (
        <p style={{ color: colors.green, fontWeight: "bold", fontSize: "16px" }}>{status}</p>
      )}

      <button onClick={onBack} style={btn.primary("#555")}>
        🏠 Back
      </button>
    </div>
  );
}