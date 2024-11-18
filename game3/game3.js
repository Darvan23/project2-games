//board
let blockSize = 25;
let rows = 25;
let cols = 25;
let board;
let context;

//snake head
const snakeX = blockSize = 30;
const snakeY = blockSize = 30;


window.onload = function() {
    board = document.querySelector("#board");
    board.height = rows * blockSize;
    board.width = cols * blockSize;
    context = board.getContext("2d");

    update();

}

function update() {
    context.fillStyle = "black";
    context.fillRect(0, 0, board.width, board.height);

    context.fillStyle="lime";
    context.fillRect(snakeX, snakeY , blockSize , blockSize);

}