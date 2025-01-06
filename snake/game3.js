const gameBoard = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const boardSize = 20;

let snake = [{ x: 10, y: 10 }]; // Snake's body parts
let foodX = 5;
let foodY = 5;
let dirX = 0;
let dirY = 1;
let score = 0;

// Initialize the grid
for (let i = 0; i < boardSize * boardSize; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    gameBoard.appendChild(cell);
}

function draw() {
    // Clear the grid
    const cells = document.querySelectorAll(".cell");
    cells.forEach(cell => cell.classList.remove("snake", "food"));

    // Draw the snake
    snake.forEach(segment => {
        const index = segment.y * boardSize + segment.x;
        if (cells[index]) cells[index].classList.add("snake");
    });

    // Draw the food
    const foodIndex = foodY * boardSize + foodX;
    if (cells[foodIndex]) cells[foodIndex].classList.add("food");
}

function update() {
    // Move the snake
    const head = { x: snake[0].x + dirX, y: snake[0].y + dirY };

    // Check for collisions
    if (
        head.x < 0 || head.x >= boardSize || 
        head.y < 0 || head.y >= boardSize || 
        snake.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
        alert(`Game Over! Your final score: ${score}`);
        resetGame();
        return;
    }

    // Add new head to the snake
    snake.unshift(head);

    // Check if the snake eats food
    if (head.x === foodX && head.y === foodY) {
        score++;
        updateScore();
        placeFood();
    } else {
        // Remove the tail if no food eaten
        snake.pop();
    }
}

function placeFood() {
    let validPosition = false;
    while (!validPosition) {
        foodX = Math.floor(Math.random() * boardSize);
        foodY = Math.floor(Math.random() * boardSize);

        // Ensure food doesn't spawn inside the snake
        validPosition = !snake.some(segment => segment.x === foodX && segment.y === foodY);
    }
}

function resetGame() {
    snake = [{ x: 10, y: 10 }];
    dirX = 0;
    dirY = 1;
    score = 0;
    updateScore();
    placeFood();
}

function updateScore() {
    scoreDisplay.textContent = `Score: ${score}`;
}

window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && dirY !== 1) {
        dirX = 0; 
        dirY = -1;
    } else if (e.key === "ArrowDown" && dirY !== -1) {
        dirX = 0; 
        dirY = 1;
    } else if (e.key === "ArrowLeft" && dirX !== 1) {
        dirX = -1; 
        dirY = 0;
    } else if (e.key === "ArrowRight" && dirX !== -1) {
        dirX = 1; 
        dirY = 0; 
    }
});

function gameLoop() {
    update();
    draw();
    setTimeout(gameLoop, 200);
}

// Start the game
placeFood();
draw();
gameLoop();
