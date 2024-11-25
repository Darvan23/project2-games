const cells = document.querySelectorAll("[data-cell]");
const winnerMessage = document.getElementById("winner-message");
const restartButton = document.getElementById("restart-button");
const playerOIndicator = document.getElementById("player-o");
const playerXIndicator = document.getElementById("player-x");
 
let currentPlayer = "O"; // Start with Player O
let gameActive = true;
 
const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
 
function handleCellClick(e) {
  if (!gameActive) return;
 
  const cell = e.target;
 
  if (!cell.classList.contains("taken")) {
    cell.textContent = currentPlayer;
    cell.classList.add("taken");
 
    if (checkWin()) {
      winnerMessage.textContent = `${currentPlayer} Wins!`;
      gameActive = false;
      return;
    }
 
    if (isDraw()) {
      winnerMessage.textContent = "It's a Draw!";
      gameActive = false;
      return;
    }
 
    togglePlayer();
  }
}
 
function togglePlayer() {
  currentPlayer = currentPlayer === "O" ? "X" : "O";
 
  if (currentPlayer === "O") {
    playerOIndicator.classList.add("active");
    playerOIndicator.classList.remove("inactive");
    playerXIndicator.classList.add("inactive");
    playerXIndicator.classList.remove("active");
  } else {
    playerXIndicator.classList.add("active");
    playerXIndicator.classList.remove("inactive");
    playerOIndicator.classList.add("inactive");
    playerOIndicator.classList.remove("active");
  }
}
 
function checkWin() {
  return winningCombinations.some(combination => {
    return combination.every(index => {
      return cells[index].textContent === currentPlayer;
    });
  });
}
 
function isDraw() {
  return [...cells].every(cell => cell.classList.contains("taken"));
}
 
function restartGame() {
  currentPlayer = "O";
  gameActive = true;
  winnerMessage.textContent = "";
  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove("taken");
  });
  playerOIndicator.classList.add("active");
  playerXIndicator.classList.remove("active");
  playerOIndicator.classList.remove("inactive");
  playerXIndicator.classList.add("inactive");
}
 
cells.forEach(cell => {
  cell.addEventListener("click", handleCellClick);
});
 
restartButton.addEventListener("click", restartGame);