import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

import { useChessGame } from "./hooks/useChessGame";
import { useTimer } from "./hooks/useTimer";
import { useStockfish } from "./hooks/useStockfish";

import { SoundService } from "./services/soundService";
import { GameService } from "./services/supabaseService";

import { getCheckStyle, getMoveOptions, generatePlayerId } from "./utils/chessHelpers";
import { THEMES } from "./utils/constants";

import HomeScreen from "./components/HomeScreen";
import OnlineLobby from "./components/OnlineLobby";
import MoveHistory from "./components/MoveHistory";
import GameControls from "./components/GameControls";

function formatTime(seconds) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export default function App() {
  const [mode, setMode] = useState(null);
  const [theme, setTheme] = useState(THEMES[0]);
  const [difficultyIdx, setDifficultyIdx] = useState(1);
  const [boardSize, setBoardSize] = useState(450);
  const [lobbyStatus, setLobbyStatus] = useState("");

  // Online state
  const [gameId, setGameId] = useState("");
  const [playerColor, setPlayerColor] = useState("w");
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const playerColorRef = useRef("w");
  const subscriptionRef = useRef(null);
  const waitingRef = useRef(false);

  const chess = useChessGame();
  const timer = useTimer(600);
  const stockfish = useStockfish();

  // Board size
  useEffect(() => {
    const updateSize = () => {
      setBoardSize(Math.min(window.innerWidth * 0.9, window.innerHeight * 0.72, 450));
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Mode init
  useEffect(() => {
    if (mode === "ai") {
      stockfish.init();
      setTimeout(() => {
        chess.reset();
        timer.reset(600);
        setTimeout(() => timer.start("w", handleTimeout), 200);
      }, 100);
    }
    return () => {
      stockfish.terminate();
      timer.stop();
      if (subscriptionRef.current) GameService.unsubscribe(subscriptionRef.current);
    };
  }, [mode]);

  function handleTimeout(color) {
    chess.setGameOver(true);
    chess.setStatus(color === "w" ? "White's time is up! ⏰" : "Black's time is up! ⏰");
  }

  // ===== AI Move =====
  function makeAIMove(g) {
    chess.setStatus("Engine thinking... 🤔");
    stockfish.getBestMove(g.fen(), difficultyIdx, (newGame, move) => {
      const result = chess.handleGameEnd(newGame, move);
      if (result === "checkmate") {
        chess.setStatus("Engine wins! 😢");
        timer.stop();
      } else if (result === "draw") {
        chess.setStatus("Draw! 🤝");
        timer.stop();
      } else if (result === "check") {
        chess.setStatus("Check! ⚠️ Your turn");
      } else {
        chess.setStatus("Your turn! 🎯");
      }
      chess.setGame(newGame);
      chess.recordMove(newGame, move.san);
      chess.setOptionSquares(getCheckStyle(newGame));
      timer.switchTurn(newGame.turn());
    });
  }

  // ===== Handle Move =====
  function handleMove(from, to) {
    if (chess.gameOver || chess.viewIndex !== -1) return false;
    if (mode === "online") {
      if (chess.game.turn() !== playerColorRef.current) return false;
      if (waitingRef.current) return false;
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

      if (status === "checkmate") {
        chess.setStatus("You win! 🎉");
        timer.stop();
        return true;
      }
      if (status === "draw") {
        timer.stop();
        return true;
      }
      if (status === "check") chess.setStatus("Check! ⚠️");

      chess.setOptionSquares(getCheckStyle(newGame));
      timer.switchTurn(newGame.turn());
      makeAIMove(newGame);

    } else if (mode === "online") {
      if (move.captured) SoundService.capture();
      else SoundService.move();
      chess.setGame(newGame);
      chess.recordMove(newGame, move.san);
      chess.setStatus("Opponent's turn... ⏳");
      timer.switchTurn(newGame.turn());
      GameService.updateGame(gameId, newGame.fen(), newGame.turn()).catch(console.error);
    }

    return true;
  }

  function onDrop(src, tgt) { return handleMove(src, tgt); }

  function onSquareClick(sq) {
    if (chess.gameOver || chess.viewIndex !== -1) return;
    if (mode === "online") {
      if (chess.game.turn() !== playerColorRef.current || waitingRef.current) return;
    }

    const piece = chess.game.get(sq);
    if (piece && piece.color === chess.game.turn()) {
      const options = getMoveOptions(sq, chess.game);
      if (options) {
        chess.setSelectedSquare(sq);
        chess.setOptionSquares(options);
      }
      return;
    }

    if (chess.selectedSquare) {
      if (!handleMove(chess.selectedSquare, sq)) {
        chess.clearSelection(chess.game);
      }
    }
  }

  // ===== Online =====
  async function handleCreateGame(colorChoice) {
    const pid = generatePlayerId();
    localStorage.setItem("playerId", pid);
    try {
      const data = await GameService.createGame(pid, colorChoice);
      const myColor = data.myColor;

      playerColorRef.current = myColor;
      waitingRef.current = true;
      setPlayerColor(myColor);
      setGameId(data.id);
      setWaitingForPlayer(true);
      setLobbyStatus(`Share code: ${data.id} 🔗`);
      chess.setStatus(`Waiting for opponent... Code: ${data.id}`);
      setMode("online");
      subscribeToGame(data.id, myColor);
    } catch (e) {
      setLobbyStatus("Error creating game ❌");
    }
  }

  async function handleJoinGame(joinId) {
    if (!joinId) return;
    const pid = generatePlayerId();
    localStorage.setItem("playerId", pid);
    try {
      const data = await GameService.joinGame(joinId.toUpperCase().trim(), pid);
      const myColor = data.myColor;

      playerColorRef.current = myColor;
      waitingRef.current = false;
      setPlayerColor(myColor);
      setGameId(joinId.toUpperCase().trim());
      setWaitingForPlayer(false);
      chess.setStatus("Game started! White's turn 🎯");
      setMode("online");
      subscribeToGame(joinId.toUpperCase().trim(), myColor);
      timer.start("w", handleTimeout);
    } catch (e) {
      setLobbyStatus(e.message || "Error joining game ❌");
    }
  }

  function subscribeToGame(id, color) {
    if (subscriptionRef.current) GameService.unsubscribe(subscriptionRef.current);
    const ch = GameService.subscribeToGame(id, (data) => {
      const ng = new Chess(data.fen);
      const history = ng.history();
      chess.loadFromSan(history);
      chess.setGame(ng);

      if (data.status === "playing" && waitingRef.current) {
        waitingRef.current = false;
        setWaitingForPlayer(false);
        timer.start("w", handleTimeout);
      } else if (data.status === "playing") {
        timer.switchTurn(ng.turn());
      }

      if (data.status === "playing") {
        if (ng.isCheckmate()) {
          SoundService.checkmate();
          chess.setStatus("Checkmate! 🏆");
          chess.setGameOver(true);
          timer.stop();
        } else if (ng.isDraw()) {
          SoundService.draw();
          chess.setStatus("Draw! 🤝");
          chess.setGameOver(true);
          timer.stop();
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
  }

  // ===== Reset & Home =====
  function handleReset() {
    chess.reset();
    timer.reset(600);
    setTimeout(() => timer.start("w", handleTimeout), 200);
  }

  function handleHome() {
    timer.stop();
    stockfish.terminate();
    if (subscriptionRef.current) GameService.unsubscribe(subscriptionRef.current);
    chess.reset();
    timer.reset(600);
    waitingRef.current = false;
    setMode(null);
    setGameId("");
    setPlayerColor("w");
    playerColorRef.current = "w";
    setWaitingForPlayer(false);
    setLobbyStatus("");
  }

  const isReviewing = chess.viewIndex !== -1;

  // ===== Screens =====
  if (!mode) {
    return (
      <HomeScreen
        onSelectMode={(m) => setMode(m)}
        theme={theme}
        onSelectTheme={setTheme}
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px", background: "#1a1a2e", minHeight: "100vh", gap: "10px" }}>
      <h2 style={{ margin: 0, color: "white" }}>
        ♟️ {mode === "ai" ? "Chess vs Engine" : "Chess Online"}
      </h2>

      {mode === "online" && gameId && (
        <div style={{ background: "#16213e", padding: "6px 16px", borderRadius: "8px", textAlign: "center" }}>
          <p style={{ margin: 0, color: "white", fontWeight: "bold" }}>
            Code: <span style={{ color: "#4CAF50", fontSize: "20px" }}>{gameId}</span>
          </p>
          <p style={{ margin: 0, color: "#aaa", fontSize: "12px" }}>
            You are {playerColorRef.current === "w" ? "⬜ White" : "⬛ Black"}
          </p>
          {waitingForPlayer && (
            <p style={{ margin: 0, color: "#f39c12", fontSize: "12px" }}>
              ⏳ Waiting for opponent...
            </p>
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

      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

          {/* Black Timer */}
          <div style={{
            background: !isReviewing && !chess.gameOver && chess.game.turn() === "b" ? "#c0392b" : "#16213e",
            borderRadius: "8px", padding: "6px 16px", textAlign: "center", transition: "background 0.3s"
          }}>
            <span style={{ color: "white", fontSize: "20px", fontWeight: "bold" }}>
              ⬛ {formatTime(timer.blackTime)}
            </span>
          </div>

          <Chessboard
            position={chess.getBoardFen()}
            onPieceDrop={isReviewing ? () => false : onDrop}
            onSquareClick={isReviewing ? undefined : onSquareClick}
            boardWidth={boardSize}
            arePiecesDraggable={!chess.gameOver && !waitingForPlayer && !isReviewing}
            animationDuration={200}
            customSquareStyles={isReviewing ? {} : chess.optionSquares}
            boardOrientation={mode === "online" && playerColorRef.current === "b" ? "black" : "white"}
            customDarkSquareStyle={{ backgroundColor: theme.dark }}
            customLightSquareStyle={{ backgroundColor: theme.light }}
          />

          {/* White Timer */}
          <div style={{
            background: !isReviewing && !chess.gameOver && chess.game.turn() === "w" ? "#c0392b" : "#16213e",
            borderRadius: "8px", padding: "6px 16px", textAlign: "center", transition: "background 0.3s"
          }}>
            <span style={{ color: "white", fontSize: "20px", fontWeight: "bold" }}>
              ⬜ {formatTime(timer.whiteTime)}
            </span>
          </div>

          <p style={{ margin: 0, color: isReviewing ? "#aaa" : "white", textAlign: "center", fontSize: "15px" }}>
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
