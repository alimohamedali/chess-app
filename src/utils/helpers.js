import { Chess } from "chess.js";

export function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function generatePlayerId() {
  return Math.random().toString(36).substring(2, 15);
}

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
  sanHistory.forEach(san => { tmp.move(san); fens.push(tmp.fen()); });
  return fens;
}

export function saveGameToStorage(gameId, playerColor, playerId) {
  localStorage.setItem("chess_game_id", gameId);
  localStorage.setItem("chess_player_color", playerColor);
  localStorage.setItem("chess_player_id", playerId);
}

export function loadGameFromStorage() {
  const gameId = localStorage.getItem("chess_game_id");
  const playerColor = localStorage.getItem("chess_player_color");
  const playerId = localStorage.getItem("chess_player_id");
  if (gameId && playerColor && playerId) return { gameId, playerColor, playerId };
  return null;
}

export function clearGameFromStorage() {
  localStorage.removeItem("chess_game_id");
  localStorage.removeItem("chess_player_color");
  localStorage.removeItem("chess_player_id");
}