document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.querySelector('#chessboard');

   
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

    
    function createChessBoard() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                
                const piece = initialBoardSetup[row][col];
                if (piece) {
                    const pieceImg = document.createElement('img');
                    pieceImg.src = `img/${piece}.webp`; 
                    pieceImg.alt = piece;
                    pieceImg.classList.add('piece');
                    square.appendChild(pieceImg);
                }

                chessboard.appendChild(square);
            }
        }
    }

   
    createChessBoard();
});