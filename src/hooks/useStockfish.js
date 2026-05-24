import { useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { DIFFICULTIES } from "../utils/constants";

export function useStockfish() {
  const workerRef = useRef(null);

  const init = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    // Use dedicated worker file
    const worker = new Worker("/stockfish.js");
    worker.postMessage("uci");
    worker.postMessage("isready");
    workerRef.current = worker;
  }, []);

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  const getBestMove = useCallback((fen, difficultyIdx, onMove) => {
    if (!workerRef.current) return;
    const { depth, moveTime } = DIFFICULTIES[difficultyIdx];

    workerRef.current.onmessage = (e) => {
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

    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage(`go depth ${depth}`);
  }, []);

  return { init, terminate, getBestMove };
}