import { Chessboard } from "react-chessboard";

export default function ChessBoard({
  position, onDrop, onSquareClick,
  boardSize, arePiecesDraggable,
  customSquareStyles, boardOrientation, theme,
}) {
  return (
    <Chessboard
      position={position}
      onPieceDrop={onDrop}
      onSquareClick={onSquareClick}
      boardWidth={boardSize}
      arePiecesDraggable={arePiecesDraggable}
      animationDuration={200}
      customSquareStyles={customSquareStyles}
      boardOrientation={boardOrientation}
      customDarkSquareStyle={{ backgroundColor: theme.dark }}
      customLightSquareStyle={{ backgroundColor: theme.light }}
    />
  );
}