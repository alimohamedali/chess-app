import { THEMES } from "../utils/constants";
import { layout, btn, text, card, themePicker } from "../styles/components";
import { colors } from "../styles/colors";

export default function HomeScreen({ onSelectMode, theme, onSelectTheme, savedGame, onResumeGame }) {
  return (
    <div style={layout.centered}>
      <h1 style={text.title}>♟️ Chess App</h1>

      {savedGame && (
        <div style={card.warning}>
          <p style={{ color: colors.orange, margin: "0 0 8px 0", fontWeight: "bold" }}>
            🔄 Unfinished game found!
          </p>
          <p style={{ ...text.subtitle, margin: "0 0 10px 0", fontSize: "13px" }}>
            Code: {savedGame.gameId} | You are {savedGame.playerColor === "w" ? "⬜ White" : "⬛ Black"}
          </p>
          <button onClick={onResumeGame} style={btn.primary(colors.orange)}>
            ▶ Resume Game
          </button>
        </div>
      )}

      <button onClick={() => onSelectMode("ai")} style={btn.primary(colors.green)}>
        🤖 Play vs Engine
      </button>

      <button onClick={() => onSelectMode("online")} style={btn.primary(colors.blue)}>
        🌐 Play Online
      </button>

      <div style={themePicker.container}>
        <p style={{ ...text.subtitle, textAlign: "center", marginBottom: "10px" }}>
          🎨 Board Theme
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          {THEMES.map(t => (
            <div
              key={t.name}
              onClick={() => onSelectTheme(t)}
              title={t.name}
              style={themePicker.dot(t.dark, theme.name === t.name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}