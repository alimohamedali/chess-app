import { useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { GameService } from "../services/supabaseService";
import { SoundService } from "../services/soundService";
import { generatePlayerId, saveGameToStorage, clearGameFromStorage } from "../utils/helpers";

export function useOnlineGame({
  chess, timer, onGameStart, onOpponentJoined, onTimeout,
}) {
  const subscriptionRef = useRef(null);
  const playerColorRef = useRef("w");
  const playerIdRef = useRef("");
  const waitingRef = useRef(false);
  const gameIdRef = useRef("");

  const cleanup = useCallback(() => {
    // Unsubscribe from current channel
    if (subscriptionRef.current) {
      GameService.unsubscribe(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    // Also clean up any lingering channels
    GameService.unsubscribeAll();
  }, []);

  const subscribeToGame = useCallback((id, color) => {
    // Always cleanup before subscribing
    cleanup();

    const ch = GameService.subscribeToGame(id, (data) => {
      const ng = new Chess(data.fen);
      chess.loadFromSan(ng.history());
      chess.setGame(ng);

      if (data.status === "playing" && waitingRef.current) {
        waitingRef.current = false;
        timer.start("w", onTimeout);
        onOpponentJoined?.();
      } else if (data.status === "playing") {
        timer.switchTurn(ng.turn());
      }

      if (data.status === "playing") {
        if (ng.isCheckmate()) {
          SoundService.checkmate();
          chess.setStatus("Checkmate! 🏆");
          chess.setGameOver(true);
          timer.stop();
          clearGameFromStorage();
        } else if (ng.isDraw()) {
          SoundService.draw();
          chess.setStatus("Draw! 🤝");
          chess.setGameOver(true);
          timer.stop();
          clearGameFromStorage();
        } else if (ng.inCheck()) {
          SoundService.check();
          chess.setStatus(ng.turn() === color ? "Check! Your turn ⚠️" : "Check on opponent ⚠️");
        } else {
          SoundService.move();
          chess.setStatus(ng.turn() === color ? "Your turn! 🎯" : "Opponent's turn... ⏳");
        }
      }

      chess.setOptionSquares({});
      chess.setViewIndex(-1);
    });

    subscriptionRef.current = ch;
  }, [chess, timer, cleanup, onTimeout, onOpponentJoined]);

  const createGame = useCallback(async (colorChoice) => {
    const pid = generatePlayerId();
    playerIdRef.current = pid;
    const data = await GameService.createGame(pid, colorChoice);
    const myColor = data.myColor;

    playerColorRef.current = myColor;
    gameIdRef.current = data.id;
    waitingRef.current = true;

    saveGameToStorage(data.id, myColor, pid);
    chess.setStatus(`Waiting for opponent... Code: ${data.id}`);
    subscribeToGame(data.id, myColor);
    onGameStart?.(data.id, myColor, true);

    return { gameId: data.id, myColor };
  }, [chess, subscribeToGame, onGameStart]);

  const joinGame = useCallback(async (joinId) => {
    const pid = generatePlayerId();
    playerIdRef.current = pid;
    const id = joinId.toUpperCase().trim();
    const data = await GameService.joinGame(id, pid);
    const myColor = data.myColor;

    playerColorRef.current = myColor;
    gameIdRef.current = id;
    waitingRef.current = false;

    saveGameToStorage(id, myColor, pid);
    chess.setStatus("Game started! White's turn 🎯");
    subscribeToGame(id, myColor);
    timer.start("w", onTimeout);
    onGameStart?.(id, myColor, false);

    return { gameId: id, myColor };
  }, [chess, timer, subscribeToGame, onGameStart, onTimeout]);

  const rejoinGame = useCallback(async (gameId, playerColor, playerId) => {
    playerIdRef.current = playerId;
    const data = await GameService.rejoinGame(gameId, playerId);
    const myColor = data.myColor;

    playerColorRef.current = myColor;
    gameIdRef.current = gameId;
    waitingRef.current = data.status === "waiting";

    const ng = new Chess(data.fen);
    chess.loadFromSan(ng.history());
    chess.setGame(ng);

    subscribeToGame(gameId, myColor);

    if (data.status === "playing") {
      timer.start(ng.turn(), onTimeout);
      chess.setStatus(ng.turn() === myColor ? "Your turn! 🎯" : "Opponent's turn... ⏳");
    } else {
      chess.setStatus(`Waiting for opponent... Code: ${gameId}`);
    }

    onGameStart?.(gameId, myColor, data.status === "waiting");
    return { gameId, myColor, status: data.status };
  }, [chess, timer, subscribeToGame, onGameStart, onTimeout]);

  const makeMove = useCallback(async (gameId, fen, turn) => {
    await GameService.updateGame(gameId, fen, turn);
  }, []);

  return {
    cleanup,
    createGame,
    joinGame,
    rejoinGame,
    makeMove,
    playerColorRef,
    waitingRef,
    gameIdRef,
  };
}