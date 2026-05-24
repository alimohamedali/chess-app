import { useRef, useState, useCallback } from "react";

export function useTimer(initialTime = 600) {
  const [whiteTime, setWhiteTime] = useState(initialTime);
  const [blackTime, setBlackTime] = useState(initialTime);

  const wtRef = useRef(initialTime);
  const btRef = useRef(initialTime);
  const turnRef = useRef("w");
  const timerRef = useRef(null);
  const onTimeoutRef = useRef(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback((turn, onTimeout) => {
    stop();
    turnRef.current = turn;
    onTimeoutRef.current = onTimeout;

    timerRef.current = setInterval(() => {
      if (turnRef.current === "w") {
        wtRef.current -= 1;
        setWhiteTime(wtRef.current);
        if (wtRef.current <= 0) {
          stop();
          onTimeoutRef.current?.("w");
        }
      } else {
        btRef.current -= 1;
        setBlackTime(btRef.current);
        if (btRef.current <= 0) {
          stop();
          onTimeoutRef.current?.("b");
        }
      }
    }, 1000);
  }, [stop]);

  const switchTurn = useCallback((newTurn) => {
    turnRef.current = newTurn;
  }, []);

  const reset = useCallback((newTime = initialTime) => {
    stop();
    wtRef.current = newTime;
    btRef.current = newTime;
    turnRef.current = "w";
    setWhiteTime(newTime);
    setBlackTime(newTime);
  }, [stop, initialTime]);

  return { whiteTime, blackTime, start, stop, switchTurn, reset };
}