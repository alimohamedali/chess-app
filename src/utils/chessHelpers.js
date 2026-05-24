import { Chess } from "chess.js";

export function getKingSquare(game) {
  const board = game.board();
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === "k" && p.color === game.turn())
        return "abcdefgh"[c] + (8 - r);
    }
  return null;
}

export function getCheckStyle(game) {
  const styles = {};
  if (game.inCheck()) {
    const sq = getKingSquare(game);
    if (sq) styles[sq] = { backgroundColor: "rgba(255,0,0,0.5)" };
  }
  return styles;
}

export function getMoveOptions(square, game) {
  const moves = game.moves({ square, verbose: true });
  if (!moves.length) return null;

  const squares = {};
  moves.forEach(m => {
    squares[m.to] = {
      background: game.get(m.to)
        ? "radial-gradient(circle, rgba(255,0,0,0.4) 85%, transparent 85%)"
        : "radial-gradient(circle, rgba(0,0,0,0.2) 25%, transparent 25%)",
      borderRadius: "50%",
    };
  });
  squares[square] = { backgroundColor: "rgba(255,255,0,0.4)" };
  return { ...getCheckStyle(game), ...squares };
}

export function buildFenHistory(sanHistory) {
  const fens = [new Chess().fen()];
  const tmp = new Chess();
  sanHistory.forEach(san => {
    tmp.move(san);
    fens.push(tmp.fen());
  });
  return fens;
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function generatePlayerId() {
  return Math.random().toString(36).substring(2);
}

export function getGameStatus(game, color) {
  if (game.isCheckmate()) return { type: "checkmate", sound: "checkmate" };
  if (game.isDraw()) return { type: "draw", sound: "draw" };
  if (game.inCheck()) return { type: "check", sound: "check" };
  return { type: "normal", sound: null };
}