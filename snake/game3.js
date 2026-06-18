const gameBoard = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const statusDisplay = document.getElementById("status");
const restartButton = document.getElementById("restartBtn");
const pauseButton = document.getElementById("pauseBtn");

const boardSize = 20;
const tickSpeed = 130;
const cells = [];

let snake;
let food;
let direction;
let nextDirection;
let score;
let gameTimer;
let paused;
let gameOver;

for (let i = 0; i < boardSize * boardSize; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  gameBoard.appendChild(cell);
  cells.push(cell);
}

function startGame() {
  snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
  direction = { x: 0, y: -1 };
  nextDirection = { ...direction };
  score = 0;
  paused = false;
  gameOver = false;
  pauseButton.textContent = "Pause";
  statusDisplay.textContent = "Use the arrow keys to move.";
  placeFood();
  updateScore();
  draw();
  clearInterval(gameTimer);
  gameTimer = setInterval(gameLoop, tickSpeed);
}

function gameLoop() {
  if (paused || gameOver) return;
  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (hitWall(head) || hitSelf(head)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    updateScore();
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  cells.forEach((cell) => {
    cell.className = "cell";
  });

  snake.forEach((segment, index) => {
    const cell = cells[segment.y * boardSize + segment.x];
    if (cell) cell.classList.add(index === 0 ? "snake-head" : "snake");
  });

  cells[food.y * boardSize + food.x].classList.add("food");
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * boardSize),
      y: Math.floor(Math.random() * boardSize)
    };
  } while (snake.some((segment) => segment.x === food.x && segment.y === food.y));
}

function hitWall(point) {
  return point.x < 0 || point.x >= boardSize || point.y < 0 || point.y >= boardSize;
}

function hitSelf(point) {
  return snake.some((segment) => segment.x === point.x && segment.y === point.y);
}

function setDirection(x, y) {
  if (direction.x + x === 0 && direction.y + y === 0) return;
  nextDirection = { x, y };
}

function updateScore() {
  scoreDisplay.textContent = `Score: ${score}`;
}

function endGame() {
  gameOver = true;
  clearInterval(gameTimer);
  statusDisplay.textContent = `Game over. Final score: ${score}.`;
  pauseButton.textContent = "Pause";
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  pauseButton.textContent = paused ? "Resume" : "Pause";
  statusDisplay.textContent = paused ? "Paused." : "Use the arrow keys to move.";
}

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") setDirection(0, -1);
  if (event.key === "ArrowDown") setDirection(0, 1);
  if (event.key === "ArrowLeft") setDirection(-1, 0);
  if (event.key === "ArrowRight") setDirection(1, 0);
  if (event.key === " ") togglePause();
});

restartButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
startGame();
