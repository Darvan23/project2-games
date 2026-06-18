const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const resetButton = document.getElementById("resetBtn");

let board;
let currentPlayer;
let selected;
let possibleMoves;
let forcedPiece;
let gameOver;

function createPiece(color) {
  return { color, king: false };
}

function setupGame() {
  board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1 && row < 3) board[row][col] = createPiece("dark");
      if ((row + col) % 2 === 1 && row > 4) board[row][col] = createPiece("light");
    }
  }
  currentPlayer = "dark";
  selected = null;
  possibleMoves = [];
  forcedPiece = null;
  gameOver = false;
  render();
}

function render() {
  boardElement.innerHTML = "";

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `cell ${(row + col) % 2 === 0 ? "light-cell" : "dark-cell"}`;
      cell.dataset.row = row;
      cell.dataset.col = col;

      if (selected && selected.row === row && selected.col === col) cell.classList.add("selected");
      if (possibleMoves.some((move) => move.to.row === row && move.to.col === col)) cell.classList.add("move-target");

      const piece = board[row][col];
      if (piece) {
        const disc = document.createElement("span");
        disc.className = `piece ${piece.color}-piece${piece.king ? " king" : ""}`;
        disc.textContent = piece.king ? "K" : "";
        cell.appendChild(disc);
      }

      cell.addEventListener("click", handleCellClick);
      boardElement.appendChild(cell);
    }
  }

  updateStatus();
}

function handleCellClick(event) {
  if (gameOver) return;

  const row = Number(event.currentTarget.dataset.row);
  const col = Number(event.currentTarget.dataset.col);
  const piece = board[row][col];
  const matchingMove = possibleMoves.find((move) => move.to.row === row && move.to.col === col);

  if (matchingMove) {
    movePiece(matchingMove);
    return;
  }

  if (piece && piece.color === currentPlayer && canSelect(row, col)) {
    selected = { row, col };
    possibleMoves = legalMovesForPiece(row, col);
  } else {
    selected = null;
    possibleMoves = [];
  }

  render();
}

function canSelect(row, col) {
  if (forcedPiece) return forcedPiece.row === row && forcedPiece.col === col;
  const captureMoves = allMoves(currentPlayer).filter((move) => move.capture);
  if (captureMoves.length === 0) return true;
  return captureMoves.some((move) => move.from.row === row && move.from.col === col);
}

function movePiece(move) {
  const piece = board[move.from.row][move.from.col];
  board[move.from.row][move.from.col] = null;
  board[move.to.row][move.to.col] = piece;

  if (move.capture) {
    board[move.capture.row][move.capture.col] = null;
  }

  if ((piece.color === "dark" && move.to.row === 7) || (piece.color === "light" && move.to.row === 0)) {
    piece.king = true;
  }

  selected = null;
  possibleMoves = [];

  const chainedCaptures = move.capture ? captureMovesForPiece(move.to.row, move.to.col) : [];
  if (chainedCaptures.length > 0) {
    forcedPiece = { row: move.to.row, col: move.to.col };
    selected = { ...forcedPiece };
    possibleMoves = chainedCaptures;
  } else {
    forcedPiece = null;
    currentPlayer = currentPlayer === "dark" ? "light" : "dark";
  }

  if (allMoves(currentPlayer).length === 0 || countPieces(currentPlayer) === 0) {
    gameOver = true;
  }

  render();
}

function allMoves(color) {
  const moves = [];
  const captures = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;
      const pieceCaptures = captureMovesForPiece(row, col);
      captures.push(...pieceCaptures);
      moves.push(...pieceCaptures, ...simpleMovesForPiece(row, col));
    }
  }

  return captures.length > 0 ? captures : moves;
}

function legalMovesForPiece(row, col) {
  const requiredCaptures = allMoves(currentPlayer).filter((move) => move.capture);
  const moves = requiredCaptures.length > 0
    ? captureMovesForPiece(row, col)
    : [...captureMovesForPiece(row, col), ...simpleMovesForPiece(row, col)];

  return moves.filter((move) => move.from.row === row && move.from.col === col);
}

function simpleMovesForPiece(row, col) {
  const piece = board[row][col];
  if (!piece) return [];

  return directions(piece).flatMap(([rowStep, colStep]) => {
    const targetRow = row + rowStep;
    const targetCol = col + colStep;
    if (!inside(targetRow, targetCol) || board[targetRow][targetCol]) return [];
    return [buildMove(row, col, targetRow, targetCol)];
  });
}

function captureMovesForPiece(row, col) {
  const piece = board[row][col];
  if (!piece) return [];

  return directions(piece).flatMap(([rowStep, colStep]) => {
    const jumpedRow = row + rowStep;
    const jumpedCol = col + colStep;
    const targetRow = row + rowStep * 2;
    const targetCol = col + colStep * 2;
    const jumped = inside(jumpedRow, jumpedCol) ? board[jumpedRow][jumpedCol] : null;

    if (
      !inside(targetRow, targetCol) ||
      board[targetRow][targetCol] ||
      !jumped ||
      jumped.color === piece.color
    ) {
      return [];
    }

    return [{ ...buildMove(row, col, targetRow, targetCol), capture: { row: jumpedRow, col: jumpedCol } }];
  });
}

function directions(piece) {
  if (piece.king) return [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  return piece.color === "dark" ? [[1, 1], [1, -1]] : [[-1, 1], [-1, -1]];
}

function buildMove(fromRow, fromCol, toRow, toCol) {
  return { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
}

function inside(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function countPieces(color) {
  return board.flat().filter((piece) => piece && piece.color === color).length;
}

function updateStatus() {
  const playerName = currentPlayer === "dark" ? "Dark" : "Light";
  if (gameOver) {
    const winner = currentPlayer === "dark" ? "Light" : "Dark";
    statusElement.textContent = `${winner} wins.`;
  } else if (forcedPiece) {
    statusElement.textContent = `${playerName} must continue the capture.`;
  } else if (allMoves(currentPlayer).some((move) => move.capture)) {
    statusElement.textContent = `${playerName} to move - capture required.`;
  } else {
    statusElement.textContent = `${playerName} to move.`;
  }
}

resetButton.addEventListener("click", setupGame);
setupGame();
