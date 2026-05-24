import { useState, useCallback } from "react";
import { Chess } from "chess.js";
import { getCheckStyle, getMoveOptions, buildFenHistory } from "../utils/chessHelpers";
import { SoundService } from "../services/soundService";

export function useChessGame() {
  const [game, setGame] = useState(new Chess());
  const [optionSquares, setOptionSquares] = useState({});
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [sanHistory, setSanHistory] = useState([]);
  const [fenHistory, setFenHistory] = useState([new Chess().fen()]);
  const [viewIndex, setViewIndex] = useState(-1);
  const [status, setStatus] = useState("Your turn! 🎯");
  const [gameOver, setGameOver] = useState(false);

  const reset = useCallback(() => {
    const ng = new Chess();
    setGame(ng);
    setOptionSquares({});
    setSelectedSquare(null);
    setSanHistory([]);
    setFenHistory([ng.fen()]);
    setViewIndex(-1);
    setStatus("Your turn! 🎯");
    setGameOver(false);
  }, []);

  const recordMove = useCallback((newGame, san) => {
    setSanHistory(prev => {
      const updated = [...prev, san];
      setFenHistory(buildFenHistory(updated));
      return updated;
    });
    setViewIndex(-1);
  }, []);

  const selectSquare = useCallback((square, g) => {
    const options = getMoveOptions(square, g);
    if (options) {
      setSelectedSquare(square);
      setOptionSquares(options);
      return true;
    }
    return false;
  }, []);

  const clearSelection = useCallback((g) => {
    setSelectedSquare(null);
    setOptionSquares(getCheckStyle(g));
  }, []);

  const applyMove = useCallback((from, to, currentGame) => {
    const g = new Chess(currentGame.fen());
    const move = g.move({ from, to, promotion: "q" });
    if (!move) return null;
    return { newGame: g, move };
  }, []);

  const handleGameEnd = useCallback((g, move) => {
    if (g.isCheckmate()) {
      SoundService.checkmate();
      setStatus("Checkmate! 🏆");
      setGameOver(true);
      return "checkmate";
    }
    if (g.isDraw()) {
      SoundService.draw();
      setStatus("Draw! 🤝");
      setGameOver(true);
      return "draw";
    }
    if (g.inCheck()) {
      SoundService.check();
      return "check";
    }
    if (move?.captured) {
      SoundService.capture();
      return "capture";
    }
    SoundService.move();
    return "normal";
  }, []);

  const loadFromSan = useCallback((sanList) => {
    const tmp = new Chess();
    sanList.forEach(san => tmp.move(san));
    setGame(tmp);
    setSanHistory(sanList);
    setFenHistory(buildFenHistory(sanList));
    setViewIndex(-1);
  }, []);

  const goToMove = useCallback((idx) => {
    setViewIndex(idx);
    setOptionSquares({});
    setSelectedSquare(null);
  }, []);

  const getBoardFen = useCallback(() => {
    if (viewIndex === -1) return game.fen();
    return fenHistory[viewIndex] ?? game.fen();
  }, [viewIndex, fenHistory, game]);

  const movePairs = [];
  for (let i = 0; i < sanHistory.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: { san: sanHistory[i], idx: i + 1 },
      black: sanHistory[i + 1] ? { san: sanHistory[i + 1], idx: i + 2 } : null,
    });
  }

  return {
    game, setGame,
    optionSquares, setOptionSquares,
    selectedSquare, setSelectedSquare,
    sanHistory, setSanHistory,
    fenHistory, setFenHistory,
    viewIndex, setViewIndex,
    status, setStatus,
    gameOver, setGameOver,
    reset, recordMove, selectSquare,
    clearSelection, applyMove,
    handleGameEnd, loadFromSan,
    goToMove, getBoardFen, movePairs,
  };
}