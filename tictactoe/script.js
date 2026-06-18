const cells = [...document.querySelectorAll("[data-cell]")];
const winnerMessage = document.querySelector("#winner-message");
const restartButton = document.querySelector("#restart-button");
const playerOIndicator = document.querySelector("#player-o");
const playerXIndicator = document.querySelector("#player-x");
const scoreO = document.querySelector("#score-o");
const scoreX = document.querySelector("#score-x");
const scoreDraw = document.querySelector("#score-draw");

let currentPlayer = "O";
let gameActive = true;
let scores = { O: 0, X: 0, draws: 0 };

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
  if (!gameActive || cell.classList.contains("taken")) return;

  cell.textContent = currentPlayer;
  cell.classList.add("taken", currentPlayer.toLowerCase());

  const win = winningLine();
  if (win) {
    win.forEach((index) => cells[index].classList.add("winner"));
    scores[currentPlayer]++;
    updateScores();
    winnerMessage.textContent = `${currentPlayer} wins.`;
    gameActive = false;
    return;
  }

  if (isDraw()) {
    scores.draws++;
    updateScores();
    winnerMessage.textContent = "Draw.";
    gameActive = false;
    return;
  }

  togglePlayer();
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
  winnerMessage.textContent = "O starts.";
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.className = "cell";
  });
  playerOIndicator.className = "player active";
  playerXIndicator.className = "player inactive";
}

function updateScores() {
  scoreO.textContent = `O: ${scores.O}`;
  scoreX.textContent = `X: ${scores.X}`;
  scoreDraw.textContent = `Draws: ${scores.draws}`;
}

cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
restartButton.addEventListener("click", restartGame);
updateScores();
