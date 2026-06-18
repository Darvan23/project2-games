const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const resetButton = document.getElementById("resetBtn");

const rows = 6;
const cols = 7;
let board;
let currentPlayer;
let gameOver;

function setupGame() {
  board = Array.from({ length: rows }, () => Array(cols).fill(null));
  currentPlayer = "red";
  gameOver = false;
  render();
}

function render() {
  boardElement.innerHTML = "";

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "slot";
      cell.dataset.col = col;
      cell.setAttribute("aria-label", `Column ${col + 1}`);

      const disc = document.createElement("span");
      disc.className = `disc ${board[row][col] || ""}`;
      cell.appendChild(disc);

      cell.addEventListener("click", () => dropDisc(col));
      boardElement.appendChild(cell);
    }
  }
}

function dropDisc(col) {
  if (gameOver) return;

  const row = lowestOpenRow(col);
  if (row === -1) return;

  board[row][col] = currentPlayer;
  const win = winningCells(row, col);
  if (win) {
    gameOver = true;
    statusElement.textContent = `${capitalize(currentPlayer)} wins.`;
    render();
    markWinningCells(win);
    return;
  }

  if (board.flat().every(Boolean)) {
    gameOver = true;
    statusElement.textContent = "Draw.";
    render();
    return;
  }

  currentPlayer = currentPlayer === "red" ? "yellow" : "red";
  statusElement.textContent = `${capitalize(currentPlayer)} to move.`;
  render();
}

function lowestOpenRow(col) {
  for (let row = rows - 1; row >= 0; row--) {
    if (!board[row][col]) return row;
  }
  return -1;
}

function winningCells(row, col) {
  const player = board[row][col];
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  for (const [rowStep, colStep] of directions) {
    const line = [
      ...collect(row, col, -rowStep, -colStep, player).reverse(),
      { row, col },
      ...collect(row, col, rowStep, colStep, player)
    ];
    if (line.length >= 4) return line.slice(0, 4);
  }

  return null;
}

function collect(row, col, rowStep, colStep, player) {
  const cells = [];
  let nextRow = row + rowStep;
  let nextCol = col + colStep;

  while (
    nextRow >= 0 &&
    nextRow < rows &&
    nextCol >= 0 &&
    nextCol < cols &&
    board[nextRow][nextCol] === player
  ) {
    cells.push({ row: nextRow, col: nextCol });
    nextRow += rowStep;
    nextCol += colStep;
  }

  return cells;
}

function markWinningCells(cells) {
  cells.forEach(({ row, col }) => {
    const index = row * cols + col;
    boardElement.children[index].classList.add("winner");
  });
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

resetButton.addEventListener("click", setupGame);
setupGame();
