import { formatTime } from "../utils/formatters";
import { timerStyle, text } from "../styles/components";

export default function Timer({
  topColor, bottomColor,
  whiteTime, blackTime,
  currentTurn, gameOver, isReviewing,
}) {
  const isActive = (color) => !isReviewing && !gameOver && currentTurn === color;
  const topTime = topColor === "w" ? whiteTime : blackTime;
  const bottomTime = bottomColor === "w" ? whiteTime : blackTime;

  return (
    <>
      <div style={timerStyle(isActive(topColor))}>
        <span style={text.timerText}>
          {topColor === "w" ? "⬜" : "⬛"} {formatTime(topTime)}
        </span>
      </div>

      <div style={timerStyle(isActive(bottomColor))}>
        <span style={text.timerText}>
          {bottomColor === "w" ? "⬜" : "⬛"} {formatTime(bottomTime)}
        </span>
      </div>
    </>
  );
}