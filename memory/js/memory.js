const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const movesElement = document.getElementById("moves");
const matchesElement = document.getElementById("matches");
const resetButton = document.getElementById("resetBtn");

const symbols = ["♜", "♞", "♝", "♛", "♚", "●", "◆", "★"];

let cards;
let firstCard;
let secondCard;
let locked;
let moves;
let matches;

function setupGame() {
  cards = shuffle([...symbols, ...symbols]).map((symbol, index) => ({
    id: index,
    symbol,
    flipped: false,
    matched: false
  }));
  firstCard = null;
  secondCard = null;
  locked = false;
  moves = 0;
  matches = 0;
  statusElement.textContent = "Find all matching pairs.";
  render();
}

function render() {
  boardElement.innerHTML = "";

  cards.forEach((card) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card";
    if (card.flipped || card.matched) button.classList.add("flipped");
    if (card.matched) button.classList.add("matched");
    button.dataset.id = card.id;
    button.setAttribute("aria-label", card.flipped || card.matched ? `Card ${card.symbol}` : "Hidden card");

    const inner = document.createElement("span");
    inner.textContent = card.flipped || card.matched ? card.symbol : "";
    button.appendChild(inner);

    button.addEventListener("click", flipCard);
    boardElement.appendChild(button);
  });

  movesElement.textContent = `Moves: ${moves}`;
  matchesElement.textContent = `Matches: ${matches} / ${symbols.length}`;
}

function flipCard(event) {
  if (locked) return;

  const card = cards.find((candidate) => candidate.id === Number(event.currentTarget.dataset.id));
  if (!card || card.flipped || card.matched) return;

  card.flipped = true;
  if (!firstCard) {
    firstCard = card;
    render();
    return;
  }

  secondCard = card;
  moves++;
  locked = true;
  render();

  if (firstCard.symbol === secondCard.symbol) {
    firstCard.matched = true;
    secondCard.matched = true;
    matches++;
    resetTurn();
    if (matches === symbols.length) {
      statusElement.textContent = `Finished in ${moves} moves.`;
    }
    render();
  } else {
    statusElement.textContent = "No match.";
    setTimeout(() => {
      firstCard.flipped = false;
      secondCard.flipped = false;
      resetTurn();
      statusElement.textContent = "Find all matching pairs.";
      render();
    }, 700);
  }
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  locked = false;
}

function shuffle(values) {
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

resetButton.addEventListener("click", setupGame);
setupGame();
