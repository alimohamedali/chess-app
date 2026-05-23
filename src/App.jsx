import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { supabase } from "./supabase";

function createSound(type) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  if (type === "move") {
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    oscillator.start(); oscillator.stop(ctx.currentTime + 0.1);
  } else if (type === "capture") {
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    oscillator.start(); oscillator.stop(ctx.currentTime + 0.2);
  } else if (type === "check") {
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    oscillator.start(); oscillator.stop(ctx.currentTime + 0.3);
  } else if (type === "checkmate") {
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.setValueAtTime(200, ctx.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(100, ctx.currentTime + 0.4);
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    oscillator.start(); oscillator.stop(ctx.currentTime + 0.6);
  }
}

function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const THEMES = [
  { name: "كلاسيك", light: "#f0d9b5", dark: "#b58863" },
  { name: "أزرق", light: "#dee3e6", dark: "#8ca2ad" },
  { name: "أخضر", light: "#ffffdd", dark: "#86a666" },
  { name: "بنفسجي", light: "#f0e6ff", dark: "#9b72cf" },
];

export default function App() {
  const [game, setGame] = useState(new Chess());
  const [boardSize, setBoardSize] = useState(450);
  const [status, setStatus] = useState("دورك! 🎯");
  const [optionSquares, setOptionSquares] = useState({});
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [difficulty, setDifficulty] = useState(6);
  const [gameOver, setGameOver] = useState(false);
  const [mode, setMode] = useState(null);
  const [gameId, setGameId] = useState("");
  const [joinId, setJoinId] = useState("");
  const [playerColor, setPlayerColor] = useState("w");
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [theme, setTheme] = useState(THEMES[0]);
  const stockfish = useRef(null);
  const subscriptionRef = useRef(null);
  const timerRef = useRef(null);
  const moveListRef = useRef(null);

  useEffect(() => {
    function updateSize() {
      const size = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.75, 450);
      setBoardSize(size);
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (mode === "ai") {
      stockfish.current = new Worker("/stockfish.js");
      stockfish.current.postMessage("uci");
      stockfish.current.postMessage("isready");
    }
    return () => {
      if (stockfish.current) stockfish.current.terminate();
      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
      clearInterval(timerRef.current);
    };
  }, [mode]);

  // مؤقت الوقت
  useEffect(() => {
    clearInterval(timerRef.current);
    if (!timerEnabled || gameOver || !mode || waitingForPlayer) return;

    timerRef.current = setInterval(() => {
      if (game.turn() === "w") {
        setWhiteTime((t) => {
          if (t <= 1) { clearInterval(timerRef.current); setStatus("انتهى وقت الأبيض! الأسود كسب 🏆"); setGameOver(true); return 0; }
          return t - 1;
        });
      } else {
        setBlackTime((t) => {
          if (t <= 1) { clearInterval(timerRef.current); setStatus("انتهى وقت الأسود! الأبيض كسب 🏆"); setGameOver(true); return 0; }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [game.turn(), gameOver, mode, waitingForPlayer, timerEnabled]);

  // سكرول سجل الحركات
  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [moveHistory]);

  function getKingSquare(gameCopy) {
    const board = gameCopy.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === "k" && piece.color === gameCopy.turn()) {
          return "abcdefgh"[c] + (8 - r);
        }
      }
    }
    return null;
  }

  function getCheckStyle(gameCopy) {
    const styles = {};
    if (gameCopy.inCheck()) {
      const kingSquare = getKingSquare(gameCopy);
      if (kingSquare) styles[kingSquare] = { backgroundColor: "rgba(255, 0, 0, 0.5)" };
    }
    return styles;
  }

  function getMoveOptions(square, gameCopy) {
    const moves = gameCopy.moves({ square, verbose: true });
    if (moves.length === 0) return false;
    const newSquares = {};
    moves.forEach((move) => {
      newSquares[move.to] = {
        background: gameCopy.get(move.to)
          ? "radial-gradient(circle, rgba(255,0,0,0.4) 85%, transparent 85%)"
          : "radial-gradient(circle, rgba(0,0,0,0.2) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    });
    newSquares[square] = { backgroundColor: "rgba(255, 255, 0, 0.4)" };
    setOptionSquares({ ...getCheckStyle(gameCopy), ...newSquares });
    return true;
  }

  function updateMoveHistory(gameCopy) {
    const history = gameCopy.history();
    const pairs = [];
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({ num: Math.floor(i / 2) + 1, white: history[i], black: history[i + 1] || "" });
    }
    setMoveHistory(pairs);
  }

  function handleMove(sourceSquare, targetSquare) {
    if (gameOver) return false;
    if (mode === "online") {
      if (game.turn() !== playerColor) return false;
      if (waitingForPlayer) return false;
    }

    const gameCopy = new Chess(game.fen());
    const move = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    if (move === null) return false;

    setSelectedSquare(null);
    setOptionSquares({});
    updateMoveHistory(gameCopy);

    if (mode === "ai") {
      if (gameCopy.isCheckmate()) {
        createSound("checkmate");
        setGame(gameCopy);
        setStatus("إنت كسبت! 🎉");
        setGameOver(true);
        return true;
      } else if (gameCopy.isDraw()) {
        setGame(gameCopy);
        setStatus("تعادل! 🤝");
        setGameOver(true);
        return true;
      } else if (gameCopy.inCheck()) {
        createSound("check");
      } else if (move.captured) {
        createSound("capture");
      } else {
        createSound("move");
      }
      setGame(gameCopy);
      setOptionSquares(getCheckStyle(gameCopy));
      makeStockfishMove(gameCopy);
    } else if (mode === "online") {
      if (move.captured) createSound("capture");
      else createSound("move");
      setGame(gameCopy);
      makeOnlineMove(gameCopy);
      setStatus("دور الخصم... ⏳");
    }
    return true;
  }

  function onDrop(sourceSquare, targetSquare) {
    return handleMove(sourceSquare, targetSquare);
  }

  function onSquareClick(square) {
    if (gameOver) return;
    if (mode === "online" && game.turn() !== playerColor) return;
    if (waitingForPlayer) return;

    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      getMoveOptions(square, game);
      return;
    }

    if (selectedSquare) {
      const moved = handleMove(selectedSquare, square);
      if (!moved) {
        setSelectedSquare(null);
        setOptionSquares(getCheckStyle(game));
      }
    }
  }

  function makeStockfishMove(gameCopy) {
    setStatus("الكومبيوتر بيفكر... 🤔");
    stockfish.current.postMessage(`position fen ${gameCopy.fen()}`);
    stockfish.current.postMessage(`go depth ${difficulty}`);

    stockfish.current.onmessage = (e) => {
      const msg = e.data;
      if (msg.startsWith("bestmove")) {
        const move = msg.split(" ")[1];
        if (move && move !== "(none)") {
          const newGame = new Chess(gameCopy.fen());
          const result = newGame.move({
            from: move.slice(0, 2),
            to: move.slice(2, 4),
            promotion: move[4] || "q",
          });
          updateMoveHistory(newGame);

          if (newGame.isCheckmate()) {
            createSound("checkmate");
            setStatus("الكومبيوتر كسب! 😢");
            setGameOver(true);
          } else if (newGame.isDraw()) {
            setStatus("تعادل! 🤝");
            setGameOver(true);
          } else if (newGame.inCheck()) {
            createSound("check");
            setStatus("كش! ⚠️ دورك");
          } else if (result && result.captured) {
            createSound("capture");
            setStatus("دورك! 🎯");
          } else {
            createSound("move");
            setStatus("دورك! 🎯");
          }
          setGame(newGame);
          setOptionSquares(getCheckStyle(newGame));
        }
      }
    };
  }

  async function createOnlineGame() {
    const id = generateGameId();
    const playerId = Math.random().toString(36).substring(2);
    await supabase.from("games").insert({ id, fen: new Chess().fen(), turn: "w", status: "waiting", white_player: playerId });
    setGameId(id); setPlayerColor("w"); setWaitingForPlayer(true);
    setStatus("شارك الكود: " + id + " 🔗");
    localStorage.setItem("playerId", playerId);
    subscribeToGame(id, "w");
  }

  async function joinOnlineGame() {
    const id = joinId.toUpperCase().trim();
    const playerId = Math.random().toString(36).substring(2);
    const { data } = await supabase.from("games").select("*").eq("id", id).single();
    if (!data) { setStatus("كود غلط! ❌"); return; }
    await supabase.from("games").update({ black_player: playerId, status: "playing" }).eq("id", id);
    setGameId(id); setPlayerColor("b"); setWaitingForPlayer(false);
    setGame(new Chess(data.fen));
    setStatus("اللعبة بدأت! دور الأبيض 🎯");
    localStorage.setItem("playerId", playerId);
    subscribeToGame(id, "b");
  }

  function subscribeToGame(id, color) {
    const channel = supabase.channel("game:" + id)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${id}` },
        (payload) => {
          const data = payload.new;
          const newGame = new Chess(data.fen);
          setGame(newGame);
          updateMoveHistory(newGame);
          setWaitingForPlayer(data.status === "waiting");
          if (data.status === "playing") {
            if (newGame.isCheckmate()) { createSound("checkmate"); setStatus("كش مات! 🏆"); setGameOver(true); }
            else if (newGame.isDraw()) { setStatus("تعادل! 🤝"); setGameOver(true); }
            else if (newGame.inCheck()) { createSound("check"); setStatus(newGame.turn() === color ? "كش! دورك ⚠️" : "كش على الخصم ⚠️"); }
            else { createSound("move"); setStatus(newGame.turn() === color ? "دورك! 🎯" : "دور الخصم... ⏳"); }
          }
          setOptionSquares({});
        }).subscribe();
    subscriptionRef.current = channel;
  }

  async function makeOnlineMove(gameCopy) {
    await supabase.from("games").update({ fen: gameCopy.fen(), turn: gameCopy.turn(), status: "playing" }).eq("id", gameId);
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setOptionSquares({});
    setSelectedSquare(null);
    setStatus("دورك! 🎯");
    setGameOver(false);
    setMoveHistory([]);
    setWhiteTime(600);
    setBlackTime(600);
    clearInterval(timerRef.current);
  }

  function goHome() {
    if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
    clearInterval(timerRef.current);
    setMode(null); setGameId(""); setJoinId("");
    setWaitingForPlayer(false); setGameOver(false);
    setGame(new Chess()); setOptionSquares({});
    setSelectedSquare(null); setStatus("دورك! 🎯");
    setMoveHistory([]); setWhiteTime(600); setBlackTime(600);
  }

  // شاشة الاختيار
  if (!mode) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "20px", background: "#1a1a2e" }}>
        <h1 style={{ color: "white", fontSize: "2.5rem" }}>♟️ Chess App</h1>
        <button onClick={() => setMode("ai")} style={btnStyle("#4CAF50")}>🤖 العب ضد الكومبيوتر</button>
        <button onClick={() => setMode("online")} style={btnStyle("#2196F3")}>🌐 العب أون لاين</button>
        <div style={{ marginTop: "20px" }}>
          <p style={{ color: "#aaa", textAlign: "center", marginBottom: "10px" }}>🎨 اختار ثيم البورد</p>
          <div style={{ display: "flex", gap: "10px" }}>
            {THEMES.map((t) => (
              <div key={t.name} onClick={() => setTheme(t)}
                style={{ width: "40px", height: "40px", borderRadius: "8px", cursor: "pointer", background: t.dark, border: theme.name === t.name ? "3px solid white" : "3px solid transparent" }}
                title={t.name} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // شاشة الأون لاين
  if (mode === "online" && !gameId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "16px", background: "#1a1a2e" }}>
        <h2 style={{ color: "white" }}>🌐 أون لاين</h2>
        <button onClick={createOnlineGame} style={btnStyle("#4CAF50")}>➕ إنشاء لعبة جديدة</button>
        <p style={{ color: "#aaa" }}>أو</p>
        <input placeholder="أدخل كود اللعبة" value={joinId} onChange={(e) => setJoinId(e.target.value)}
          style={{ padding: "10px", fontSize: "18px", borderRadius: "8px", border: "1px solid #ccc", textAlign: "center", width: "200px" }} />
        <button onClick={joinOnlineGame} style={btnStyle("#2196F3")}>🔗 انضم للعبة</button>
        <button onClick={goHome} style={btnStyle("#555")}>🏠 رجوع</button>
      </div>
    );
  }

  // شاشة اللعب
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px", background: "#1a1a2e", minHeight: "100vh", gap: "10px" }}>
      <h2 style={{ margin: 0, color: "white" }}>♟️ {mode === "ai" ? "Chess vs AI" : "Chess Online"}</h2>

      {/* كود الأون لاين */}
      {mode === "online" && gameId && (
        <div style={{ background: "#16213e", padding: "8px 16px", borderRadius: "8px", textAlign: "center" }}>
          <p style={{ margin: 0, color: "white", fontWeight: "bold" }}>كود: <span style={{ color: "#4CAF50", fontSize: "22px" }}>{gameId}</span></p>
        </div>
      )}

      {/* مستوى الصعوبة */}
      {mode === "ai" && (
        <div style={{ display: "flex", gap: "8px" }}>
          {[{ label: "سهل 🟢", depth: 2 }, { label: "متوسط 🟡", depth: 6 }, { label: "صعب 🔴", depth: 15 }].map((d) => (
            <button key={d.depth} onClick={() => { setDifficulty(d.depth); resetGame(); }}
              style={{ padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer", background: difficulty === d.depth ? "#4CAF50" : "#333", color: "white", fontWeight: "bold" }}>
              {d.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>
        {/* البورد + المؤقت */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

          {/* مؤقت الأسود */}
          <div style={{ background: game.turn() === "b" && !gameOver ? "#4CAF50" : "#16213e", borderRadius: "8px", padding: "8px 16px", textAlign: "center", transition: "background 0.3s" }}>
            <span style={{ color: "white", fontSize: "22px", fontWeight: "bold" }}>⬛ {formatTime(blackTime)}</span>
          </div>

          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            onSquareClick={onSquareClick}
            boardWidth={boardSize}
            arePiecesDraggable={!gameOver && !waitingForPlayer}
            animationDuration={200}
            customSquareStyles={optionSquares}
            boardOrientation={mode === "online" && playerColor === "b" ? "black" : "white"}
            customDarkSquareStyle={{ backgroundColor: theme.dark }}
            customLightSquareStyle={{ backgroundColor: theme.light }}
          />

          {/* مؤقت الأبيض */}
          <div style={{ background: game.turn() === "w" && !gameOver ? "#4CAF50" : "#16213e", borderRadius: "8px", padding: "8px 16px", textAlign: "center", transition: "background 0.3s" }}>
            <span style={{ color: "white", fontSize: "22px", fontWeight: "bold" }}>⬜ {formatTime(whiteTime)}</span>
          </div>

          <p style={{ margin: 0, color: "white", textAlign: "center", fontSize: "16px" }}>{status}</p>
        </div>

        {/* سجل الحركات */}
        <div style={{ background: "#16213e", borderRadius: "12px", padding: "12px", width: "160px", minHeight: "200px" }}>
          <p style={{ color: "#4CAF50", margin: "0 0 8px 0", fontWeight: "bold", textAlign: "center" }}>📋 الحركات</p>
          <div ref={moveListRef} style={{ maxHeight: "350px", overflowY: "auto" }}>
            {moveHistory.length === 0 && <p style={{ color: "#666", textAlign: "center", fontSize: "12px" }}>لا توجد حركات</p>}
            {moveHistory.map((pair) => (
              <div key={pair.num} style={{ display: "flex", gap: "4px", marginBottom: "4px", fontSize: "13px" }}>
                <span style={{ color: "#666", minWidth: "20px" }}>{pair.num}.</span>
                <span style={{ color: "white", minWidth: "50px" }}>{pair.white}</span>
                <span style={{ color: "#aaa" }}>{pair.black}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* الأزرار */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        {mode === "ai" && <button onClick={resetGame} style={btnStyle("#4CAF50")}>لعبة جديدة 🔄</button>}
        <button onClick={goHome} style={btnStyle("#555")}>🏠 رجوع</button>
      </div>
    </div>
  );
}

function btnStyle(bg) {
  return { padding: "12px 30px", fontSize: "16px", cursor: "pointer", borderRadius: "8px", border: "none", background: bg, color: "white", fontWeight: "bold", minWidth: "150px" };
}