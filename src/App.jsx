import { useState, useEffect, useRef } from "react";

import { useChessGame } from "./hooks/useChessGame";
import { useTimer } from "./hooks/useTimer";
import { useStockfish } from "./hooks/useStockfish";
import { useOnlineGame } from "./hooks/useOnlineGame";

import { getCheckStyle, getMoveOptions, loadGameFromStorage, clearGameFromStorage } from "./utils/helpers";
import { THEMES, INITIAL_TIME } from "./utils/constants";

import HomeScreen from "./components/HomeScreen";
import OnlineLobby from "./components/OnlineLobby";
import ChessBoard from "./components/ChessBoard";
import MoveHistory from "./components/MoveHistory";
import GameControls from "./components/GameControls";
import Timer from "./components/Timer";

import { layout, card, text } from "./styles/components";
import { colors } from "./styles/colors";

export default function App() {
  const [mode, setMode] = useState(null);
  const [theme, setTheme] = useState(THEMES[0]);
  const [difficultyIdx, setDifficultyIdx] = useState(1);
  const [boardSize, setBoardSize] = useState(450);
  const [lobbyStatus, setLobbyStatus] = useState("");
  const [gameId, setGameId] = useState("");
  const [myColor, setMyColor] = useState("w");
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [savedGame, setSavedGame] = useState(null);

  const chess = useChessGame();
  const timer = useTimer(INITIAL_TIME);
  const stockfish = useStockfish();

  function handleTimeout(color) {
    chess.setGameOver(true);
    chess.setStatus(color === "w" ? "White's time is up! ⏰" : "Black's time is up! ⏰");
    timer.stop();
    clearGameFromStorage();
  }

  const online = useOnlineGame({
    chess,
    timer,
    onTimeout: handleTimeout,
    onOpponentJoined: () => setWaitingForPlayer(false),
    onGameStart: (id, color, waiting) => {
      setGameId(id);
      setMyColor(color);
      setWaitingForPlayer(waiting);
      setMode("online");
    },
  });

  useEffect(() => {
    const updateSize = () => {
      setBoardSize(Math.min(window.innerWidth * 0.9, window.innerHeight * 0.72, 450));
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const saved = loadGameFromStorage();
    if (saved) setSavedGame(saved);
  }, []);

  useEffect(() => {
    if (mode === "ai") {
      stockfish.init();
      chess.reset();
      timer.reset(INITIAL_TIME);
      setTimeout(() => timer.start("w", handleTimeout), 300);
    }
    return () => {
      if (mode === "ai") {
        stockfish.terminate();
        timer.stop();
      }
    };
  }, [mode]);

  async function handleResumeGame() {
    if (!savedGame) return;
    try {
      await online.rejoinGame(savedGame.gameId, savedGame.playerColor, savedGame.playerId);
      setSavedGame(null);
    } catch (e) {
      clearGameFromStorage();
      setSavedGame(null);
      setLobbyStatus("Could not resume game ❌");
    }
  }

  function makeAIMove(g) {
    chess.setStatus("Engine thinking... 🤔");
    stockfish.getBestMove(g.fen(), difficultyIdx, (newGame, move) => {
      const result = chess.handleGameEnd(newGame, move);
      chess.setGame(newGame);
      chess.recordMove(newGame, move.san);
      chess.setOptionSquares(getCheckStyle(newGame));
      timer.switchTurn(newGame.turn());

      if (result === "checkmate") { chess.setStatus("Engine wins! 😢"); timer.stop(); }
      else if (result === "draw") { chess.setStatus("Draw! 🤝"); timer.stop(); }
      else if (result === "check") chess.setStatus("Check! ⚠️ Your turn");
      else chess.setStatus("Your turn! 🎯");
    });
  }

  function handleMove(from, to) {
    if (chess.gameOver || chess.viewIndex !== -1) return false;
    if (mode === "online") {
      if (chess.game.turn() !== online.playerColorRef.current) return false;
      if (online.waitingRef.current) return false;
    }

    const result = chess.applyMove(from, to, chess.game);
    if (!result) return false;

    const { newGame, move } = result;
    chess.setSelectedSquare(null);
    chess.setOptionSquares({});

    if (mode === "ai") {
      const status = chess.handleGameEnd(newGame, move);
      chess.setGame(newGame);
      chess.recordMove(newGame, move.san);

      if (status === "checkmate") { chess.setStatus("You win! 🎉"); timer.stop(); return true; }
      if (status === "draw") { chess.setStatus("Draw! 🤝"); timer.stop(); return true; }
      if (status === "check") chess.setStatus("Check! ⚠️");

      chess.setOptionSquares(getCheckStyle(newGame));
      timer.switchTurn(newGame.turn());
      makeAIMove(newGame);

    } else if (mode === "online") {
      chess.setGame(newGame);
      chess.recordMove(newGame, move.san);
      chess.setStatus("Opponent's turn... ⏳");
      timer.switchTurn(newGame.turn());
      online.makeMove(gameId, newGame.fen(), newGame.turn()).catch(console.error);
    }

    return true;
  }

  function onDrop(src, tgt) { return handleMove(src, tgt); }

  function onSquareClick(sq) {
    if (chess.gameOver || chess.viewIndex !== -1) return;
    if (mode === "online") {
      if (chess.game.turn() !== online.playerColorRef.current || online.waitingRef.current) return;
    }

    const piece = chess.game.get(sq);
    if (piece && piece.color === chess.game.turn()) {
      const options = getMoveOptions(sq, chess.game);
      if (options) { chess.setSelectedSquare(sq); chess.setOptionSquares(options); }
      return;
    }

    if (chess.selectedSquare) {
      if (!handleMove(chess.selectedSquare, sq)) chess.clearSelection(chess.game);
    }
  }

  async function handleCreateGame(colorChoice) {
    setLobbyStatus("");
    try {
      await online.createGame(colorChoice);
    } catch (e) {
      setLobbyStatus("Error creating game ❌");
    }
  }

  async function handleJoinGame(joinId) {
    if (!joinId) return;
    setLobbyStatus("");
    try {
      await online.joinGame(joinId);
    } catch (e) {
      setLobbyStatus(e.message || "Error joining game ❌");
    }
  }

  function handleReset() {
    chess.reset();
    timer.reset(INITIAL_TIME);
    setTimeout(() => timer.start("w", handleTimeout), 200);
  }

  function handleHome() {
    timer.stop();
    stockfish.terminate();
    online.cleanup();
    chess.reset();
    timer.reset(INITIAL_TIME);
    setMode(null);
    setGameId("");
    setMyColor("w");
    setWaitingForPlayer(false);
    setLobbyStatus("");
    const saved = loadGameFromStorage();
    if (saved) setSavedGame(saved);
  }

  const isReviewing = chess.viewIndex !== -1;
  const currentMyColor = mode === "online" ? online.playerColorRef.current : "w";
  const opponentColor = currentMyColor === "w" ? "b" : "w";

  if (!mode) {
    return (
      <HomeScreen
        onSelectMode={setMode}
        theme={theme}
        onSelectTheme={setTheme}
        savedGame={savedGame}
        onResumeGame={handleResumeGame}
      />
    );
  }

  if (mode === "online" && !gameId) {
    return (
      <OnlineLobby
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
        onBack={handleHome}
        status={lobbyStatus}
      />
    );
  }

  return (
    <div style={layout.page}>
      <h2 style={text.heading}>
        ♟️ {mode === "ai" ? "Chess vs Engine" : "Chess Online"}
      </h2>

      {mode === "online" && gameId && (
        <div style={card.info}>
          <p style={{ margin: 0, color: colors.textPrimary, fontWeight: "bold" }}>
            Code: <span style={text.gameCode}>{gameId}</span>
          </p>
          <p style={{ margin: 0, color: colors.textSecondary, fontSize: "12px" }}>
            You are {currentMyColor === "w" ? "⬜ White" : "⬛ Black"}
          </p>
          {waitingForPlayer && (
            <p style={text.warning}>⏳ Waiting for opponent...</p>
          )}
        </div>
      )}

      <GameControls
        mode={mode}
        difficultyIdx={difficultyIdx}
        onSetDifficulty={(i) => { setDifficultyIdx(i); handleReset(); }}
        onReset={handleReset}
        onHome={handleHome}
        sanHistory={chess.sanHistory}
        viewIndex={chess.viewIndex}
        onGoToMove={chess.goToMove}
        onLive={() => { chess.setViewIndex(-1); chess.setOptionSquares({}); }}
        isReviewing={isReviewing}
      />

      <div style={layout.row}>
        <div style={layout.column}>

          <Timer
            topColor={opponentColor}
            bottomColor={currentMyColor}
            whiteTime={timer.whiteTime}
            blackTime={timer.blackTime}
            currentTurn={chess.game.turn()}
            gameOver={chess.gameOver}
            isReviewing={isReviewing}
          />

          <ChessBoard
            position={chess.getBoardFen(chess.viewIndex, chess.fenHistory, chess.game)}
            onDrop={isReviewing ? () => false : onDrop}
            onSquareClick={isReviewing ? undefined : onSquareClick}
            boardSize={boardSize}
            arePiecesDraggable={!chess.gameOver && !waitingForPlayer && !isReviewing}
            customSquareStyles={isReviewing ? {} : chess.optionSquares}
            boardOrientation={mode === "online" && currentMyColor === "b" ? "black" : "white"}
            theme={theme}
          />

          <p style={isReviewing ? text.statusReviewing : text.status}>
            {isReviewing
              ? `📖 Reviewing move ${chess.viewIndex} / ${chess.sanHistory.length}`
              : chess.status}
          </p>
        </div>

        <MoveHistory
          movePairs={chess.movePairs}
          viewIndex={chess.viewIndex}
          onGoToMove={chess.goToMove}
        />
      </div>
    </div>
  );
}