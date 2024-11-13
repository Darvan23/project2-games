const chessboard = document.querySelector('#chessboard');

// Initial positions of the pieces on the board
const initialBoardSetup = [
    ['rookblack', 'knightblack', 'bishopblack', 'queenblack', 'kingblack', 'bishopblack', 'knightblack', 'rookblack'],
    ['pawnblack', 'pawnblack', 'pawnblack', 'pawnblack', 'pawnblack', 'pawnblack', 'pawnblack', 'pawnblack'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'],
    ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
];

// Function to create the chessboard
function createChessBoard() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            // Create each square
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            
            // Place piece if present in initialBoardSetup
            const piece = initialBoardSetup[row][col];
            if (piece) {
                const pieceImg = document.createElement('img');
                pieceImg.src = `../img/${piece}.webp`;
                pieceImg.alt = piece;
                pieceImg.classList.add('piece');
                square.appendChild(pieceImg);
            }

            chessboard.appendChild(square);
        }
    }
}

// Initialize the board
createChessBoard();
