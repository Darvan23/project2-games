const gameBoard = document.getElementById("game-board");
const boardSize = 20;

let snakeX = 10;
let snakeY = 10;
let foodX = 5;
let foodY = 5;
let dirX = 0;
let dirY = 1;

// Maak het grid
for (let i = 0; i < boardSize * boardSize; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    gameBoard.appendChild(cell);
}

function draw() {
    // Maak het grid leeg
    const cells = document.querySelectorAll(".cell");
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        cell.classList.remove("snake", "food")
    }

    // Teken de snake
    const snakeIndex = snakeY * boardSize + snakeX;
    if (cells[snakeIndex]) {
        cells[snakeIndex].classList.add("snake");
    }

    // Teken het eten
    const foodIndex = foodY * boardSize + foodX;
    if (cells[foodIndex]) {
        cells[foodIndex].classList.add("food");
    }
}

function update() {
    // Beweeg de slang
    snakeX += dirX;
    snakeY += dirY;

    // Check of slang het eten raakt
    if (snakeX === foodX && snakeY === foodY) {
        placeFood(); // Plaats nieuw eten
    }
}

function placeFood() {
    foodX = Math.floor(Math.random() * boardSize);
    foodY = Math.floor(Math.random() * boardSize);
}

// Event listener voor beweging
window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") { 
        dirX = 0; 
        dirY = -1;
    } else if (e.key === "ArrowDown") {
        dirX = 0; 
        dirY = 1;
    } else if (e.key === "ArrowLeft") { 
        dirX = -1; 
        dirY = 0;
    } else if (e.key === "ArrowRight") { 
        dirX = 1; 
        dirY = 0; 
    }
});

function gameLoop() {
    update();
    draw();
    // roep de loop elke 200milliseconden
    setTimeout(gameLoop, 200);
}

// Start het spel
draw();
gameLoop();