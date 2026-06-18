const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const shotsElement = document.getElementById("shots");
const remainingElement = document.getElementById("remaining");
const resetButton = document.getElementById("resetBtn");

const size = 8;
const fleetPlan = [
  { name: "Carrier", length: 5 },
  { name: "Battleship", length: 4 },
  { name: "Cruiser", length: 3 },
  { name: "Submarine", length: 3 },
  { name: "Destroyer", length: 2 }
];

let grid;
let ships;
let shots;
let gameOver;

function setupGame() {
  grid = Array.from({ length: size }, () => Array.from({ length: size }, () => ({
    shipId: null,
    shot: false
  })));
  ships = [];
  shots = 0;
  gameOver = false;
  placeFleet();
  statusElement.textContent = "Find and sink the hidden fleet.";
  render();
}

function placeFleet() {
  fleetPlan.forEach((shipInfo, index) => {
    const ship = { ...shipInfo, hits: 0, id: index };
    let placed = false;

    while (!placed) {
      const horizontal = Math.random() < 0.5;
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      const cells = shipCells(row, col, ship.length, horizontal);

      if (cells && cells.every(({ r, c }) => grid[r][c].shipId === null)) {
        cells.forEach(({ r, c }) => {
          grid[r][c].shipId = ship.id;
        });
        ships.push(ship);
        placed = true;
      }
    }
  });
}

function render() {
  boardElement.innerHTML = "";

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = grid[row][col];
      const square = document.createElement("button");
      square.type = "button";
      square.className = "cell";
      square.dataset.row = row;
      square.dataset.col = col;
      square.setAttribute("aria-label", `${String.fromCharCode(65 + row)}${col + 1}`);

      if (cell.shot && cell.shipId === null) square.classList.add("miss");
      if (cell.shot && cell.shipId !== null) {
        square.classList.add("hit");
        if (isSunk(ships[cell.shipId])) square.classList.add("sunk");
      }

      square.addEventListener("click", fireShot);
      boardElement.appendChild(square);
    }
  }

  shotsElement.textContent = `Shots: ${shots}`;
  remainingElement.textContent = `Ships: ${ships.filter((ship) => !isSunk(ship)).length}`;
}

function fireShot(event) {
  if (gameOver) return;

  const row = Number(event.currentTarget.dataset.row);
  const col = Number(event.currentTarget.dataset.col);
  const cell = grid[row][col];
  if (cell.shot) return;

  cell.shot = true;
  shots++;

  if (cell.shipId === null) {
    statusElement.textContent = "Miss.";
  } else {
    const ship = ships[cell.shipId];
    ship.hits++;
    statusElement.textContent = isSunk(ship) ? `You sank the ${ship.name}.` : "Hit.";
  }

  if (ships.every(isSunk)) {
    gameOver = true;
    statusElement.textContent = `Fleet destroyed in ${shots} shots.`;
  }

  render();
}

function shipCells(row, col, length, horizontal) {
  const cells = [];
  for (let offset = 0; offset < length; offset++) {
    const r = row + (horizontal ? 0 : offset);
    const c = col + (horizontal ? offset : 0);
    if (r >= size || c >= size) return null;
    cells.push({ r, c });
  }
  return cells;
}

function isSunk(ship) {
  return ship.hits >= ship.length;
}

resetButton.addEventListener("click", setupGame);
setupGame();
