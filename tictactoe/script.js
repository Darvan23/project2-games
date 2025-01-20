const cells = document.querySelectorAll("[data-cell]");
const winnerMessage = document.querySelector("#winner-message");
const restartButton = document.querySelector("#restart-button");
const playerOIndicator = document.querySelector("#player-o");
const playerXIndicator = document.querySelector("#player-x");

//this code showes that player O will always start first at the start of a round.
let currentPlayer = "O";
let gameActive = true;

//winning conbinations to show which combinations wins diagonal, horizontal and vertical.
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
//this code checks to see if the game is still active if not it means a player has won or ended in a draw.
function handleCellClick(e) {
  if (!gameActive) return;

  // this code means that the cell points to the specific div class element the user clicked from the 9 squares.
  const cell = e.target;

  //this if-statement shows that you cannot click twice on a clicked square meaning its taken, when none of the winning conbinations are met it ends in a draw 
  //and if one of the conbinations is met it results in a  player winning
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