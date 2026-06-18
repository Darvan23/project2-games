const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const resetButton = document.getElementById("resetBtn");
const aiToggle = document.getElementById("aiToggle");

const rows = 6;
const cols = 7;
let board;
let currentPlayer;
let gameOver;
let aiEnabled = false;
let aiThinking = false;

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
  if (gameOver || isAiTurn() || aiThinking) return;
  playColumn(col);
}

function playColumn(col) {
  if (gameOver) return false;

  const row = lowestOpenRow(col);
  if (row === -1) return false;

  board[row][col] = currentPlayer;
  const win = winningCells(row, col);
  if (win) {
    gameOver = true;
    statusElement.textContent = `${capitalize(currentPlayer)} wins.`;
    render();
    markWinningCells(win);
    return true;
  }

  if (board.flat().every(Boolean)) {
    gameOver = true;
    statusElement.textContent = "Draw.";
    render();
    return true;
  }

  currentPlayer = currentPlayer === "red" ? "yellow" : "red";
  statusElement.textContent = `${capitalize(currentPlayer)}${isAiTurn() ? " AI" : ""} to move.`;
  render();
  queueAiMove();
  return true;
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

function isAiTurn() {
  return aiEnabled && currentPlayer === "yellow" && !gameOver;
}

function queueAiMove() {
  if (!isAiTurn() || aiThinking) return;
  aiThinking = true;
  setTimeout(() => {
    const column = chooseAiColumn();
    aiThinking = false;
    if (column !== null && isAiTurn()) playColumn(column);
  }, 360);
}

function chooseAiColumn() {
  const openColumns = availableColumns();
  if (openColumns.length === 0) return null;

  const winningColumn = openColumns.find((col) => wouldWin(col, "yellow"));
  if (winningColumn !== undefined) return winningColumn;

  const blockingColumn = openColumns.find((col) => wouldWin(col, "red"));
  if (blockingColumn !== undefined) return blockingColumn;

  const preference = [3, 2, 4, 1, 5, 0, 6];
  const usefulColumns = preference.filter((col) => openColumns.includes(col));
  return usefulColumns[Math.floor(Math.random() * Math.min(3, usefulColumns.length))];
}

function availableColumns() {
  return Array.from({ length: cols }, (_, col) => col).filter((col) => lowestOpenRow(col) !== -1);
}

function wouldWin(col, player) {
  const row = lowestOpenRow(col);
  if (row === -1) return false;
  board[row][col] = player;
  const win = Boolean(winningCells(row, col));
  board[row][col] = null;
  return win;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

resetButton.addEventListener("click", setupGame);
aiToggle.addEventListener("change", () => {
  aiEnabled = aiToggle.checked;
  setupGame();
});
setupGame();
