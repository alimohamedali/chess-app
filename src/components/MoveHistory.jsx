import { useRef, useEffect } from "react";
import { moveHistory, text } from "../styles/components";
import { colors } from "../styles/colors";

export default function MoveHistory({ movePairs, viewIndex, onGoToMove }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [movePairs]);

  return (
    <div style={moveHistory.container}>
      <p style={text.label}>📋 Move History</p>

      <div style={moveHistory.header}>
        <span style={{ color: colors.textMuted, minWidth: "22px", fontSize: "11px" }}>#</span>
        <span style={{ color: colors.textSecondary, minWidth: "60px", fontSize: "11px" }}>⬜ White</span>
        <span style={{ color: colors.textSecondary, fontSize: "11px" }}>⬛ Black</span>
      </div>

      <div ref={listRef} style={moveHistory.list}>
        {movePairs.length === 0 && (
          <p style={moveHistory.moveBtn(false)}>No moves yet</p>
        )}
        {movePairs.map(pair => (
          <div key={pair.num} style={moveHistory.row}>
            <span style={{ color: colors.textMuted, minWidth: "22px" }}>{pair.num}.</span>
            <span onClick={() => onGoToMove(pair.white.idx)} style={moveHistory.moveBtn(viewIndex === pair.white.idx)}>
              {pair.white.san}
            </span>
            {pair.black && (
              <span onClick={() => onGoToMove(pair.black.idx)} style={moveHistory.moveBtn(viewIndex === pair.black.idx, true)}>
                {pair.black.san}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}