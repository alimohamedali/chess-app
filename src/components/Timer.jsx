import { formatTime } from "../utils/chessHelpers";

export default function Timer({ whiteTime, blackTime, currentTurn, gameOver, isReviewing }) {
  const activeColor = !isReviewing && !gameOver ? currentTurn : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
      {/* Black Timer */}
      <div style={{
        background: activeColor === "b" ? "#c0392b" : "#16213e",
        borderRadius: "8px",
        padding: "6px 16px",
        textAlign: "center",
        transition: "background 0.3s",
      }}>
        <span style={{ color: "white", fontSize: "20px", fontWeight: "bold" }}>
          ⬛ {formatTime(blackTime)}
        </span>
      </div>

      {/* White Timer */}
      <div style={{
        background: activeColor === "w" ? "#c0392b" : "#16213e",
        borderRadius: "8px",
        padding: "6px 16px",
        textAlign: "center",
        transition: "background 0.3s",
      }}>
        <span style={{ color: "white", fontSize: "20px", fontWeight: "bold" }}>
          ⬜ {formatTime(whiteTime)}
        </span>
      </div>
    </div>
  );
}