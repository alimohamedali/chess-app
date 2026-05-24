import { DIFFICULTIES } from "../utils/constants";

export default function GameControls({
  mode, difficultyIdx, onSetDifficulty,
  onReset, onHome, sanHistory,
  viewIndex, onGoToMove, onLive, isReviewing,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>

      {/* Difficulty Buttons - AI only */}
      {mode === "ai" && (
        <div style={{ display: "flex", gap: "8px" }}>
          {DIFFICULTIES.map((d, i) => (
            <button
              key={i}
              onClick={() => onSetDifficulty(i)}
              style={{
                padding: "6px 14px", borderRadius: "8px", border: "none",
                cursor: "pointer", fontWeight: "bold", color: "white",
                background: difficultyIdx === i ? "#4CAF50" : "#333",
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {/* Replay Controls */}
      {sanHistory.length > 0 && (
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => onGoToMove(1)} style={navBtn()}>⏮</button>
          <button
            onClick={() => onGoToMove(Math.max(1, isReviewing ? viewIndex - 1 : sanHistory.length))}
            style={navBtn()}
          >◀</button>
          <button
            onClick={() => {
              if (!isReviewing) return;
              if (viewIndex >= sanHistory.length) { onLive(); return; }
              onGoToMove(viewIndex + 1);
            }}
            style={navBtn()}
          >▶</button>
          <button
            onClick={onLive}
            style={navBtn(isReviewing ? "#c0392b" : "#333")}
          >
            {isReviewing ? "🔴 Live" : "⏭"}
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        {mode === "ai" && (
          <button onClick={onReset} style={actionBtn("#4CAF50")}>
            New Game 🔄
          </button>
        )}
        <button onClick={onHome} style={actionBtn("#555")}>
          🏠 Home
        </button>
      </div>
    </div>
  );
}

function navBtn(bg = "#333") {
  return {
    padding: "6px 12px", borderRadius: "6px", border: "none",
    cursor: "pointer", background: bg, color: "white", fontSize: "16px",
  };
}

function actionBtn(bg) {
  return {
    padding: "10px 24px", fontSize: "15px", cursor: "pointer",
    borderRadius: "8px", border: "none", background: bg,
    color: "white", fontWeight: "bold",
  };
}