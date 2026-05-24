import { useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { DIFFICULTIES } from "../utils/constants";

export function useStockfish() {
  const stockfish = useRef(null);

  const init = useCallback(() => {
    if (stockfish.current) stockfish.current.terminate();
    stockfish.current = new Worker("/stockfish.js");
    stockfish.current.postMessage("uci");
    stockfish.current.postMessage("isready");
  }, []);

  const terminate = useCallback(() => {
    if (stockfish.current) {
      stockfish.current.terminate();
      stockfish.current = null;
    }
  }, []);

  const getBestMove = useCallback((fen, difficultyIdx, onMove) => {
    if (!stockfish.current) return;

    const { depth, moveTime } = DIFFICULTIES[difficultyIdx];

    stockfish.current.onmessage = (e) => {
      const msg = e.data;
      if (msg.startsWith("bestmove")) {
        const mv = msg.split(" ")[1];
        if (!mv || mv === "(none)") return;

        setTimeout(() => {
          const ng = new Chess(fen);
          const result = ng.move({
            from: mv.slice(0, 2),
            to: mv.slice(2, 4),
            promotion: mv[4] || "q",
          });
          if (result) onMove(ng, result);
        }, moveTime);
      }
    };

    stockfish.current.postMessage(`position fen ${fen}`);
    stockfish.current.postMessage(`go depth ${depth}`);
  }, []);

  return { init, terminate, getBestMove };
}