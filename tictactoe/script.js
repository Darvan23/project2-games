const cells = [...document.querySelectorAll("[data-cell]")];
const winnerMessage = document.querySelector("#winner-message");
const restartButton = document.querySelector("#restart-button");
const playerOIndicator = document.querySelector("#player-o");
const playerXIndicator = document.querySelector("#player-x");
const scoreO = document.querySelector("#score-o");
const scoreX = document.querySelector("#score-x");
const scoreDraw = document.querySelector("#score-draw");
const aiToggle = document.querySelector("#aiToggle");

let currentPlayer = "O";
let gameActive = true;
let scores = { O: 0, X: 0, draws: 0 };
let aiEnabled = false;
let aiThinking = false;

const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

function handleCellClick(event) {
  const cell = event.currentTarget;
  if (!gameActive || cell.classList.contains("taken") || isAiTurn() || aiThinking) return;
  playCell(cell);
}

function playCell(cell) {
  cell.textContent = currentPlayer;
  cell.classList.add("taken", currentPlayer.toLowerCase());

  const win = winningLine();
  if (win) {
    win.forEach((index) => cells[index].classList.add("winner"));
    scores[currentPlayer]++;
    updateScores();
    winnerMessage.textContent = `${currentPlayer} wins.`;
    gameActive = false;
    return true;
  }

  if (isDraw()) {
    scores.draws++;
    updateScores();
    winnerMessage.textContent = "Draw.";
    gameActive = false;
    return true;
  }

  togglePlayer();
  queueAiMove();
  return true;
}

function togglePlayer() {
  currentPlayer = currentPlayer === "O" ? "X" : "O";
  winnerMessage.textContent = `${currentPlayer} to move.`;
  playerOIndicator.classList.toggle("active", currentPlayer === "O");
  playerOIndicator.classList.toggle("inactive", currentPlayer !== "O");
  playerXIndicator.classList.toggle("active", currentPlayer === "X");
  playerXIndicator.classList.toggle("inactive", currentPlayer !== "X");
}

function winningLine() {
  return winningCombinations.find((combination) => {
    return combination.every((index) => cells[index].textContent === currentPlayer);
  });
}

function isDraw() {
  return cells.every((cell) => cell.classList.contains("taken"));
}

function restartGame() {
  currentPlayer = "O";
  gameActive = true;
  aiThinking = false;
  winnerMessage.textContent = "O starts.";
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.className = "cell";
  });
  playerOIndicator.className = "player active";
  playerXIndicator.className = "player inactive";
}

function isAiTurn() {
  return aiEnabled && currentPlayer === "X" && gameActive;
}

function queueAiMove() {
  if (!isAiTurn() || aiThinking) return;
  aiThinking = true;
  setTimeout(() => {
    const index = chooseAiCell();
    aiThinking = false;
    if (index !== null && isAiTurn()) playCell(cells[index]);
  }, 320);
}

function chooseAiCell() {
  const open = cells
    .map((cell, index) => cell.classList.contains("taken") ? null : index)
    .filter((index) => index !== null);

  return findWinningMove("X", open)
    ?? findWinningMove("O", open)
    ?? (open.includes(4) ? 4 : null)
    ?? randomAvailable([0, 2, 6, 8], open)
    ?? randomAvailable(open, open);
}

function findWinningMove(player, open) {
  return open.find((index) => {
    cells[index].textContent = player;
    const wins = winningCombinations.some((combination) => {
      return combination.every((cellIndex) => cells[cellIndex].textContent === player);
    });
    cells[index].textContent = "";
    return wins;
  });
}

function randomAvailable(candidates, open) {
  const available = candidates.filter((index) => open.includes(index));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function updateScores() {
  scoreO.textContent = `O: ${scores.O}`;
  scoreX.textContent = `X: ${scores.X}`;
  scoreDraw.textContent = `Draws: ${scores.draws}`;
}

cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
restartButton.addEventListener("click", restartGame);
aiToggle.addEventListener("change", () => {
  aiEnabled = aiToggle.checked;
  restartGame();
});
updateScores();
