import { DIFFICULTIES } from "../utils/constants";
import { btn, layout } from "../styles/components";
import { colors } from "../styles/colors";

export default function GameControls({
  mode, difficultyIdx, onSetDifficulty,
  onReset, onHome, sanHistory,
  viewIndex, onGoToMove, onLive, isReviewing,
}) {
  return (
    <div style={{ ...layout.column, alignItems: "center" }}>

      {mode === "ai" && (
        <div style={{ display: "flex", gap: "8px" }}>
          {DIFFICULTIES.map((d, i) => (
            <button key={i} onClick={() => onSetDifficulty(i)}
              style={btn.small(colors.green, difficultyIdx === i)}>
              {d.label}
            </button>
          ))}
        </div>
      )}

      {sanHistory.length > 0 && (
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => onGoToMove(1)} style={btn.nav()}>⏮</button>
          <button onClick={() => onGoToMove(Math.max(1, isReviewing ? viewIndex - 1 : sanHistory.length))} style={btn.nav()}>◀</button>
          <button onClick={() => {
            if (!isReviewing) return;
            if (viewIndex >= sanHistory.length) { onLive(); return; }
            onGoToMove(viewIndex + 1);
          }} style={btn.nav()}>▶</button>
          <button onClick={onLive} style={btn.nav(isReviewing ? colors.red : "#333")}>
            {isReviewing ? "🔴 Live" : "⏭"}
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        {mode === "ai" && (
          <button onClick={onReset} style={btn.action(colors.green)}>New Game 🔄</button>
        )}
        <button onClick={onHome} style={btn.action("#555")}>🏠 Home</button>
      </div>
    </div>
  );
}