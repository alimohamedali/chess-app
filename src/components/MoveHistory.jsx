import { useRef, useEffect } from "react";

export default function MoveHistory({ movePairs, viewIndex, onGoToMove }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [movePairs]);

  return (
    <div style={{ background: "#16213e", borderRadius: "12px", padding: "12px", width: "170px" }}>
      <p style={{ color: "#4CAF50", margin: "0 0 8px 0", fontWeight: "bold", textAlign: "center" }}>
        📋 Move History
      </p>

      <div style={{ display: "flex", gap: "4px", marginBottom: "6px", borderBottom: "1px solid #333", paddingBottom: "4px" }}>
        <span style={{ color: "#555", minWidth: "22px", fontSize: "11px" }}>#</span>
        <span style={{ color: "#aaa", minWidth: "60px", fontSize: "11px" }}>⬜ White</span>
        <span style={{ color: "#aaa", fontSize: "11px" }}>⬛ Black</span>
      </div>

      <div ref={listRef} style={{ maxHeight: "320px", overflowY: "auto" }}>
        {movePairs.length === 0 && (
          <p style={{ color: "#555", textAlign: "center", fontSize: "12px" }}>No moves yet</p>
        )}
        {movePairs.map(pair => (
          <div key={pair.num} style={{ display: "flex", gap: "4px", marginBottom: "3px", fontSize: "13px" }}>
            <span style={{ color: "#555", minWidth: "22px" }}>{pair.num}.</span>
            <span
              onClick={() => onGoToMove(pair.white.idx)}
              style={{
                color: viewIndex === pair.white.idx ? "#4CAF50" : "white",
                minWidth: "60px",
                cursor: "pointer",
                fontWeight: viewIndex === pair.white.idx ? "bold" : "normal",
                padding: "1px 3px",
                borderRadius: "3px",
                background: viewIndex === pair.white.idx ? "#1a3a1a" : "transparent",
              }}
            >
              {pair.white.san}
            </span>
            {pair.black && (
              <span
                onClick={() => onGoToMove(pair.black.idx)}
                style={{
                  color: viewIndex === pair.black.idx ? "#4CAF50" : "#ccc",
                  cursor: "pointer",
                  fontWeight: viewIndex === pair.black.idx ? "bold" : "normal",
                  padding: "1px 3px",
                  borderRadius: "3px",
                  background: viewIndex === pair.black.idx ? "#1a3a1a" : "transparent",
                }}
              >
                {pair.black.san}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}