const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const blackScore = document.getElementById("blackScore");
const whiteScore = document.getElementById("whiteScore");
const resetButton = document.getElementById("resetBtn");

const size = 8;
const directions = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1]
];

let board;
let currentPlayer;
let gameOver;

function setupGame() {
  board = Array.from({ length: size }, () => Array(size).fill(null));
  board[3][3] = "white";
  board[3][4] = "black";
  board[4][3] = "black";
  board[4][4] = "white";
  currentPlayer = "black";
  gameOver = false;
  render();
}

function render() {
  boardElement.innerHTML = "";
  const validMoves = getValidMoves(currentPlayer);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.dataset.row = row;
      cell.dataset.col = col;

      const move = validMoves.find((candidate) => candidate.row === row && candidate.col === col);
      if (move) cell.classList.add("valid");

      if (board[row][col]) {
        const disc = document.createElement("span");
        disc.className = `disc ${board[row][col]}`;
        cell.appendChild(disc);
      }

      cell.addEventListener("click", handleMove);
      boardElement.appendChild(cell);
    }
  }

  updateStatus(validMoves);
}

function handleMove(event) {
  if (gameOver) return;
  const row = Number(event.currentTarget.dataset.row);
  const col = Number(event.currentTarget.dataset.col);
  const move = getValidMoves(currentPlayer).find((candidate) => candidate.row === row && candidate.col === col);
  if (!move) return;

  board[row][col] = currentPlayer;
  move.flips.forEach(({ row: flipRow, col: flipCol }) => {
    board[flipRow][flipCol] = currentPlayer;
  });

  currentPlayer = opponent(currentPlayer);
  if (getValidMoves(currentPlayer).length === 0 && getValidMoves(opponent(currentPlayer)).length > 0) {
    statusElement.textContent = `${capitalize(currentPlayer)} has no move and must pass.`;
    currentPlayer = opponent(currentPlayer);
  }

  if (getValidMoves(currentPlayer).length === 0 && getValidMoves(opponent(currentPlayer)).length === 0) {
    gameOver = true;
  }

  render();
}

function getValidMoves(player) {
  const moves = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col]) continue;
      const flips = flippedDiscs(row, col, player);
      if (flips.length > 0) moves.push({ row, col, flips });
    }
  }
  return moves;
}

function flippedDiscs(row, col, player) {
  const allFlips = [];
  for (const [rowStep, colStep] of directions) {
    const line = [];
    let nextRow = row + rowStep;
    let nextCol = col + colStep;

    while (inside(nextRow, nextCol) && board[nextRow][nextCol] === opponent(player)) {
      line.push({ row: nextRow, col: nextCol });
      nextRow += rowStep;
      nextCol += colStep;
    }

    if (line.length > 0 && inside(nextRow, nextCol) && board[nextRow][nextCol] === player) {
      allFlips.push(...line);
    }
  }
  return allFlips;
}

function updateStatus(validMoves) {
  const black = board.flat().filter((disc) => disc === "black").length;
  const white = board.flat().filter((disc) => disc === "white").length;
  blackScore.textContent = `Black: ${black}`;
  whiteScore.textContent = `White: ${white}`;

  if (gameOver) {
    if (black === white) statusElement.textContent = "Draw.";
    else statusElement.textContent = `${black > white ? "Black" : "White"} wins.`;
  } else {
    statusElement.textContent = `${capitalize(currentPlayer)} to move. ${validMoves.length} legal moves.`;
  }
}

function inside(row, col) {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function opponent(player) {
  return player === "black" ? "white" : "black";
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

resetButton.addEventListener("click", setupGame);
setupGame();
