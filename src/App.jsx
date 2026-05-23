import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { supabase } from "./supabase";

function createSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === "move") {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } else if (type === "capture") {
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } else if (type === "check") {
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === "checkmate") {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(100, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(); osc.stop(ctx.currentTime + 0.6);
    }
  } catch (e) {}
}

function formatTime(s) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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
  const [theme, setTheme] = useState(THEMES[0]);
  const [fenHistory, setFenHistory] = useState([]);
  const [sanHistory, setSanHistory] = useState([]);
  const [viewIndex, setViewIndex] = useState(-1);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);

  const wtRef = useRef(600);
  const btRef = useRef(600);
  const turnRef = useRef("w");
  const gameOverRef = useRef(false);
  const timerRef = useRef(null);
  const stockfish = useRef(null);
  const subscriptionRef = useRef(null);
  const moveListRef = useRef(null);

  useEffect(() => {
    const updateSize = () => {
      setBoardSize(Math.min(window.innerWidth * 0.9, window.innerHeight * 0.72, 450));
    };
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
      stopTimer();
    };
  }, [mode]);

  useEffect(() => {
    if (mode === "ai") {
      setTimeout(() => resetGame(), 100);
    }
  }, [mode]);

  useEffect(() => {
    if (moveListRef.current) moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
  }, [sanHistory]);

  function startTimer() {
    stopTimer();
    timerRef.current = setInterval(() => {
      if (gameOverRef.current) { stopTimer(); return; }
      if (turnRef.current === "w") {
        wtRef.current -= 1;
        setWhiteTime(wtRef.current);
        if (wtRef.current <= 0) {
          stopTimer(); gameOverRef.current = true;
          setGameOver(true); setStatus("انتهى وقت الأبيض! ⏰");
        }
      } else {
        btRef.current -= 1;
        setBlackTime(btRef.current);
        if (btRef.current <= 0) {
          stopTimer(); gameOverRef.current = true;
          setGameOver(true); setStatus("انتهى وقت الأسود! ⏰");
        }
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function getKingSquare(g) {
    const board = g.board();
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === "k" && p.color === g.turn())
          return "abcdefgh"[c] + (8 - r);
      }
    return null;
  }

  function getCheckStyle(g) {
    const s = {};
    if (g.inCheck()) {
      const sq = getKingSquare(g);
      if (sq) s[sq] = { backgroundColor: "rgba(255,0,0,0.5)" };
    }
    return s;
  }

  function getMoveOptions(square, g) {
    const moves = g.moves({ square, verbose: true });
    if (!moves.length) return false;
    const sq = {};
    moves.forEach(m => {
      sq[m.to] = {
        background: g.get(m.to)
          ? "radial-gradient(circle, rgba(255,0,0,0.4) 85%, transparent 85%)"
          : "radial-gradient(circle, rgba(0,0,0,0.2) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    });
    sq[square] = { backgroundColor: "rgba(255,255,0,0.4)" };
    setOptionSquares({ ...getCheckStyle(g), ...sq });
    return true;
  }

  function recordMove(newGame, san) {
    setFenHistory(prev => [...prev, newGame.fen()]);
    setSanHistory(prev => [...prev, san]);
    turnRef.current = newGame.turn();
    setViewIndex(-1);
  }

  function handleMove(from, to) {
    if (gameOver || gameOverRef.current || viewIndex !== -1) return false;
    if (mode === "online" && (game.turn() !== playerColor || waitingForPlayer)) return false;

    const g = new Chess(game.fen());
    const move = g.move({ from, to, promotion: "q" });
    if (!move) return false;

    setSelectedSquare(null);
    setOptionSquares({});

    if (mode === "ai") {
      if (g.isCheckmate()) {
        createSound("checkmate"); setGame(g); recordMove(g, move.san);
        stopTimer(); gameOverRef.current = true; setGameOver(true); setStatus("إنت كسبت! 🎉");
        return true;
      } else if (g.isDraw()) {
        setGame(g); recordMove(g, move.san);
        stopTimer(); gameOverRef.current = true; setGameOver(true); setStatus("تعادل! 🤝");
        return true;
      }
      if (g.inCheck()) createSound("check");
      else if (move.captured) createSound("capture");
      else createSound("move");
      setGame(g);
      recordMove(g, move.san);
      setOptionSquares(getCheckStyle(g));
      setTimeout(() => makeStockfishMove(g), 400);
    } else if (mode === "online") {
      if (move.captured) createSound("capture"); else createSound("move");
      setGame(g); recordMove(g, move.san);
      makeOnlineMove(g);
      setStatus("دور الخصم... ⏳");
    }
    return true;
  }

  function onDrop(src, tgt) { return handleMove(src, tgt); }

  function onSquareClick(sq) {
    if (gameOver || gameOverRef.current || viewIndex !== -1) return;
    if (mode === "online" && (game.turn() !== playerColor || waitingForPlayer)) return;
    const piece = game.get(sq);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(sq); getMoveOptions(sq, game); return;
    }
    if (selectedSquare) {
      if (!handleMove(selectedSquare, sq)) {
        setSelectedSquare(null); setOptionSquares(getCheckStyle(game));
      }
    }
  }

  function makeStockfishMove(g) {
    setStatus("الكومبيوتر بيفكر... 🤔");
    stockfish.current.postMessage(`position fen ${g.fen()}`);
    stockfish.current.postMessage(`go depth ${difficulty}`);
    stockfish.current.onmessage = (e) => {
      const msg = e.data;
      if (msg.startsWith("bestmove")) {
        const mv = msg.split(" ")[1];
        if (!mv || mv === "(none)") return;
        setTimeout(() => {
          const ng = new Chess(g.fen());
          const result = ng.move({ from: mv.slice(0, 2), to: mv.slice(2, 4), promotion: mv[4] || "q" });
          if (!result) return;
          recordMove(ng, result.san);
          if (ng.isCheckmate()) {
            createSound("checkmate"); stopTimer(); gameOverRef.current = true;
            setStatus("الكومبيوتر كسب! 😢"); setGameOver(true);
          } else if (ng.isDraw()) {
            stopTimer(); gameOverRef.current = true; setStatus("تعادل! 🤝"); setGameOver(true);
          } else if (ng.inCheck()) { createSound("check"); setStatus("كش! ⚠️ دورك"); }
          else if (result.captured) { createSound("capture"); setStatus("دورك! 🎯"); }
          else { createSound("move"); setStatus("دورك! 🎯"); }
          setGame(ng);
          setOptionSquares(getCheckStyle(ng));
        }, 300);
      }
    };
  }

  async function createOnlineGame() {
    const id = generateGameId();
    const pid = Math.random().toString(36).substring(2);
    await supabase.from("games").insert({ id, fen: new Chess().fen(), turn: "w", status: "waiting", white_player: pid });
    setGameId(id); setPlayerColor("w"); setWaitingForPlayer(true);
    setStatus(`شارك الكود: ${id} 🔗`);
    localStorage.setItem("playerId", pid);
    subscribeToGame(id, "w");
  }

  async function joinOnlineGame() {
    const id = joinId.toUpperCase().trim();
    const pid = Math.random().toString(36).substring(2);
    const { data } = await supabase.from("games").select("*").eq("id", id).single();
    if (!data) { setStatus("كود غلط! ❌"); return; }
    await supabase.from("games").update({ black_player: pid, status: "playing" }).eq("id", id);
    const ng = new Chess(data.fen);
    setGameId(id); setPlayerColor("b"); setWaitingForPlayer(false);
    setGame(ng); setFenHistory([ng.fen()]); setSanHistory(ng.history());
    setStatus("اللعبة بدأت! دور الأبيض 🎯");
    localStorage.setItem("playerId", pid);
    subscribeToGame(id, "b");
    startTimer();
  }

  function subscribeToGame(id, color) {
    if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
    const ch = supabase.channel(`game:${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${id}` },
        (payload) => {
          const data = payload.new;
          const ng = new Chess(data.fen);
          const history = ng.history();
          setSanHistory(history);
          const fens = [new Chess().fen()];
          const tmp = new Chess();
          history.forEach(san => { tmp.move(san); fens.push(tmp.fen()); });
          setFenHistory(fens);
          turnRef.current = ng.turn();
          setGame(ng);
          setWaitingForPlayer(data.status === "waiting");
          if (data.status === "playing") {
            if (!timerRef.current) startTimer();
            if (ng.isCheckmate()) {
              createSound("checkmate"); stopTimer(); gameOverRef.current = true;
              setStatus("كش مات! 🏆"); setGameOver(true);
            } else if (ng.isDraw()) {
              stopTimer(); gameOverRef.current = true; setStatus("تعادل! 🤝"); setGameOver(true);
            } else if (ng.inCheck()) {
              createSound("check");
              setStatus(ng.turn() === color ? "كش! دورك ⚠️" : "كش على الخصم ⚠️");
            } else {
              createSound("move");
              setStatus(ng.turn() === color ? "دورك! 🎯" : "دور الخصم... ⏳");
            }
          }
          setOptionSquares({});
          setViewIndex(-1);
        }).subscribe();
    subscriptionRef.current = ch;
  }

  async function makeOnlineMove(g) {
    await supabase.from("games").update({ fen: g.fen(), turn: g.turn(), status: "playing" }).eq("id", gameId);
  }

  function resetGame() {
    stopTimer();
    gameOverRef.current = false;
    wtRef.current = 600; btRef.current = 600; turnRef.current = "w";
    const ng = new Chess();
    setGame(ng); setOptionSquares({}); setSelectedSquare(null);
    setStatus("دورك! 🎯"); setGameOver(false);
    setFenHistory([ng.fen()]); setSanHistory([]); setViewIndex(-1);
    setWhiteTime(600); setBlackTime(600);
    setTimeout(() => startTimer(), 200);
  }

  function goHome() {
    stopTimer();
    if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
    gameOverRef.current = false;
    setMode(null); setGameId(""); setJoinId(""); setWaitingForPlayer(false);
    setGameOver(false); setGame(new Chess()); setOptionSquares({});
    setSelectedSquare(null); setStatus("دورك! 🎯");
    setFenHistory([]); setSanHistory([]); setViewIndex(-1);
    wtRef.current = 600; btRef.current = 600;
    setWhiteTime(600); setBlackTime(600);
  }

  function getBoardFen() {
    if (viewIndex === -1) return game.fen();
    return fenHistory[viewIndex] ?? game.fen();
  }

  function goToMove(idx) {
    setViewIndex(idx); setOptionSquares({}); setSelectedSquare(null);
  }

  const movePairs = [];
  for (let i = 0; i < sanHistory.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: { san: sanHistory[i], idx: i + 1 },
      black: sanHistory[i + 1] ? { san: sanHistory[i + 1], idx: i + 2 } : null,
    });
  }

  const isReviewing = viewIndex !== -1;

  if (!mode) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", gap:"20px", background:"#1a1a2e" }}>
        <h1 style={{ color:"white", fontSize:"2.5rem" }}>♟️ Chess App</h1>
        <button onClick={() => setMode("ai")} style={btnStyle("#4CAF50")}>🤖 العب ضد الكومبيوتر</button>
        <button onClick={() => setMode("online")} style={btnStyle("#2196F3")}>🌐 العب أون لاين</button>
        <div style={{ marginTop:"10px" }}>
          <p style={{ color:"#aaa", textAlign:"center", marginBottom:"10px" }}>🎨 ثيم البورد</p>
          <div style={{ display:"flex", gap:"10px" }}>
            {THEMES.map(t => (
              <div key={t.name} onClick={() => setTheme(t)}
                style={{ width:"40px", height:"40px", borderRadius:"8px", cursor:"pointer", background:t.dark, border: theme.name===t.name ? "3px solid white" : "3px solid transparent" }}
                title={t.name} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (mode === "online" && !gameId) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", gap:"16px", background:"#1a1a2e" }}>
        <h2 style={{ color:"white" }}>🌐 أون لاين</h2>
        <button onClick={createOnlineGame} style={btnStyle("#4CAF50")}>➕ إنشاء لعبة جديدة</button>
        <p style={{ color:"#aaa" }}>أو</p>
        <input placeholder="أدخل كود اللعبة" value={joinId} onChange={e => setJoinId(e.target.value)}
          style={{ padding:"10px", fontSize:"18px", borderRadius:"8px", border:"1px solid #ccc", textAlign:"center", width:"200px" }} />
        <button onClick={joinOnlineGame} style={btnStyle("#2196F3")}>🔗 انضم للعبة</button>
        <button onClick={goHome} style={btnStyle("#555")}>🏠 رجوع</button>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"12px", background:"#1a1a2e", minHeight:"100vh", gap:"10px" }}>
      <h2 style={{ margin:0, color:"white" }}>♟️ {mode==="ai" ? "Chess vs AI" : "Chess Online"}</h2>

      {mode==="online" && gameId && (
        <div style={{ background:"#16213e", padding:"6px 16px", borderRadius:"8px", textAlign:"center" }}>
          <p style={{ margin:0, color:"white", fontWeight:"bold" }}>كود: <span style={{ color:"#4CAF50", fontSize:"20px" }}>{gameId}</span></p>
        </div>
      )}

      {mode==="ai" && (
        <div style={{ display:"flex", gap:"8px" }}>
          {[{label:"سهل 🟢",depth:2},{label:"متوسط 🟡",depth:6},{label:"صعب 🔴",depth:15}].map(d => (
            <button key={d.depth} onClick={() => { setDifficulty(d.depth); resetGame(); }}
              style={{ padding:"6px 14px", borderRadius:"8px", border:"none", cursor:"pointer", background: difficulty===d.depth?"#4CAF50":"#333", color:"white", fontWeight:"bold" }}>
              {d.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display:"flex", gap:"16px", alignItems:"flex-start", flexWrap:"wrap", justifyContent:"center" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>

          <div style={{ background: !isReviewing && !gameOver && game.turn()==="b" ? "#c0392b" : "#16213e", borderRadius:"8px", padding:"6px 16px", textAlign:"center", transition:"background 0.3s" }}>
            <span style={{ color:"white", fontSize:"20px", fontWeight:"bold" }}>⬛ {formatTime(blackTime)}</span>
          </div>

          <Chessboard
            position={getBoardFen()}
            onPieceDrop={isReviewing ? () => false : onDrop}
            onSquareClick={isReviewing ? undefined : onSquareClick}
            boardWidth={boardSize}
            arePiecesDraggable={!gameOver && !waitingForPlayer && !isReviewing}
            animationDuration={200}
            customSquareStyles={isReviewing ? {} : optionSquares}
            boardOrientation={mode==="online" && playerColor==="b" ? "black" : "white"}
            customDarkSquareStyle={{ backgroundColor: theme.dark }}
            customLightSquareStyle={{ backgroundColor: theme.light }}
          />

          <div style={{ background: !isReviewing && !gameOver && game.turn()==="w" ? "#c0392b" : "#16213e", borderRadius:"8px", padding:"6px 16px", textAlign:"center", transition:"background 0.3s" }}>
            <span style={{ color:"white", fontSize:"20px", fontWeight:"bold" }}>⬜ {formatTime(whiteTime)}</span>
          </div>

          <p style={{ margin:0, color: isReviewing?"#aaa":"white", textAlign:"center", fontSize:"15px" }}>
            {isReviewing ? `📖 مراجعة الحركة ${viewIndex} / ${sanHistory.length}` : status}
          </p>

          {sanHistory.length > 0 && (
            <div style={{ display:"flex", gap:"6px", justifyContent:"center" }}>
              <button onClick={() => goToMove(1)} style={navBtn()}>⏮</button>
              <button onClick={() => goToMove(Math.max(1, isReviewing ? viewIndex - 1 : sanHistory.length))} style={navBtn()}>◀</button>
              <button onClick={() => {
                if (!isReviewing) return;
                if (viewIndex >= sanHistory.length) { setViewIndex(-1); return; }
                goToMove(viewIndex + 1);
              }} style={navBtn()}>▶</button>
              <button onClick={() => { setViewIndex(-1); setOptionSquares({}); }}
                style={navBtn(isReviewing ? "#c0392b" : "#333")}>
                {isReviewing ? "🔴 مباشر" : "⏭"}
              </button>
            </div>
          )}
        </div>

        <div style={{ background:"#16213e", borderRadius:"12px", padding:"12px", width:"170px" }}>
          <p style={{ color:"#4CAF50", margin:"0 0 8px 0", fontWeight:"bold", textAlign:"center" }}>📋 سجل الحركات</p>
          <div style={{ display:"flex", gap:"4px", marginBottom:"6px", borderBottom:"1px solid #333", paddingBottom:"4px" }}>
            <span style={{ color:"#555", minWidth:"22px", fontSize:"11px" }}>#</span>
            <span style={{ color:"#aaa", minWidth:"60px", fontSize:"11px" }}>⬜ أبيض</span>
            <span style={{ color:"#aaa", fontSize:"11px" }}>⬛ أسود</span>
          </div>
          <div ref={moveListRef} style={{ maxHeight:"320px", overflowY:"auto" }}>
            {movePairs.length === 0 && <p style={{ color:"#555", textAlign:"center", fontSize:"12px" }}>لا توجد حركات</p>}
            {movePairs.map(pair => (
              <div key={pair.num} style={{ display:"flex", gap:"4px", marginBottom:"3px", fontSize:"13px" }}>
                <span style={{ color:"#555", minWidth:"22px" }}>{pair.num}.</span>
                <span onClick={() => goToMove(pair.white.idx)}
                  style={{ color: viewIndex===pair.white.idx?"#4CAF50":"white", minWidth:"60px", cursor:"pointer", fontWeight: viewIndex===pair.white.idx?"bold":"normal", padding:"1px 3px", borderRadius:"3px", background: viewIndex===pair.white.idx?"#1a3a1a":"transparent" }}>
                  {pair.white.san}
                </span>
                {pair.black && (
                  <span onClick={() => goToMove(pair.black.idx)}
                    style={{ color: viewIndex===pair.black.idx?"#4CAF50":"#ccc", cursor:"pointer", fontWeight: viewIndex===pair.black.idx?"bold":"normal", padding:"1px 3px", borderRadius:"3px", background: viewIndex===pair.black.idx?"#1a3a1a":"transparent" }}>
                    {pair.black.san}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", justifyContent:"center" }}>
        {mode==="ai" && <button onClick={resetGame} style={btnStyle("#4CAF50")}>لعبة جديدة 🔄</button>}
        <button onClick={goHome} style={btnStyle("#555")}>🏠 رجوع</button>
      </div>
    </div>
  );
}

function btnStyle(bg) {
  return { padding:"12px 30px", fontSize:"16px", cursor:"pointer", borderRadius:"8px", border:"none", background:bg, color:"white", fontWeight:"bold", minWidth:"150px" };
}

function navBtn(bg="#333") {
  return { padding:"6px 12px", borderRadius:"6px", border:"none", cursor:"pointer", background:bg, color:"white", fontSize:"16px" };
}
