document.addEventListener("DOMContentLoaded", () => {
  const chessboard = document.querySelector("#chessboard");
  const turnMessage = document.querySelector("#turnMessage");
  const resetBtn = document.querySelector("#resetBtn");

  //board (black pieces end with "black")
  const initialBoard = [
    ["rookblack", "knightblack", "bishopblack", "queenblack", "kingblack", "bishopblack", "knightblack", "rookblack"],
    ["pawnblack", "pawnblack", "pawnblack", "pawnblack", "pawnblack", "pawnblack", "pawnblack", "pawnblack"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["pawn", "pawn", "pawn", "pawn", "pawn", "pawn", "pawn", "pawn"],
    ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"]
  ];

  let boardState = JSON.parse(JSON.stringify(initialBoard));
  let currentTurn = "white";
  let gameOver = false;


  //       CREATE CHESSBOARD

  function createChessBoard() {
    chessboard.innerHTML = "";
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("div");
        square.classList.add("square");
        square.dataset.row = row;
        square.dataset.col = col;

        // Light/dark squares
        if ((row + col) % 2 === 0) {
          square.classList.add("light");
        } else {
          square.classList.add("dark");
        }

        const piece = boardState[row][col];
        if (piece) {
          const img = document.createElement("img");
          img.src = `img/${piece}.webp`; //  "img/pawnblack.webp"
          img.alt = piece;              //  "pawnblack" or "king"
          img.classList.add("piece");
          img.draggable = true;
          square.appendChild(img);
        }
        chessboard.appendChild(square);
      }
    }
    enableDragAndDrop();
  }


  //     DRAG & DROP + HIGHLIGHTS

  function enableDragAndDrop() {
    const pieces = document.querySelectorAll(".piece");
    let draggedPiece = null;
    let originSquare = null;

    pieces.forEach((p) => {
      p.addEventListener("dragstart", (e) => {
        if (gameOver) {
          e.preventDefault();
          return;
        }
        draggedPiece = e.target;
        originSquare = draggedPiece.parentElement;

        // Only allow moving pieces of currentTurn
        const pieceColor = draggedPiece.alt.includes("black") ? "black" : "white";
        if (pieceColor !== currentTurn) {
          e.preventDefault();
          draggedPiece = null;
          originSquare = null;
        } else {
          highlightValidMoves(
            draggedPiece.alt,
            parseInt(originSquare.dataset.row),
            parseInt(originSquare.dataset.col)
          );
        }
      });

      p.addEventListener("dragend", () => {
        draggedPiece = null;
        originSquare = null;
        clearHighlights();
      });
    });

    const squares = document.querySelectorAll(".square");
    squares.forEach((sq) => {
      sq.addEventListener("dragover", (e) => e.preventDefault());

      sq.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!draggedPiece || !originSquare) return;
        if (sq === originSquare) return;

        const originRow = parseInt(originSquare.dataset.row);
        const originCol = parseInt(originSquare.dataset.col);
        const targetRow = parseInt(sq.dataset.row);
        const targetCol = parseInt(sq.dataset.col);

        const piece = boardState[originRow][originCol];
        if (validateMove(piece, originRow, originCol, targetRow, targetCol)) {
          const targetPiece = boardState[targetRow][targetCol];

          // If capturing a king => check if it's the opponent king
          if (targetPiece && targetPiece.includes("king")) {
            const kingColor = targetPiece.includes("black") ? "black" : "white";
            // Only declare win if it's an enemy king
            if (kingColor !== currentTurn) {
              alert(`${currentTurn} wins by capturing the king!`);
              gameOver = true;
            }
          }

          // Move piece in DOM
          sq.innerHTML = "";
          sq.appendChild(draggedPiece);
          boardState[targetRow][targetCol] = piece;
          boardState[originRow][originCol] = null;

          // Pawn promotion
          if (piece === "pawn" && targetRow === 0) {
            boardState[targetRow][targetCol] = "queen";
          } else if (piece === "pawnblack" && targetRow === 7) {
            boardState[targetRow][targetCol] = "queenblack";
          }

          if (!gameOver) {
            currentTurn = (currentTurn === "white") ? "black" : "white";
            turnMessage.textContent = `Turn: ${currentTurn}`;
            createChessBoard();
          }
        } else {
          // Invalid => revert
          originSquare.appendChild(draggedPiece);
        }
      });
    });
  }


  //     VALIDATE MOVE + HIGHLIGHTS

  function validateMove(piece, r1, c1, r2, c2) {
    if (gameOver) return false;

    const color = piece.includes("black") ? "black" : "white";
    const targetPiece = boardState[r2][c2];

    // 1) Cannot land on your own piece
    if (targetPiece && targetPiece.includes(color)) {
      return false;
    }

    // 2) Specifically prevent capturing your own king

    if (targetPiece && targetPiece.includes("king")) {
      const kingColor = targetPiece.includes("black") ? "black" : "white";
      if (kingColor === color) {
        // same color king => not allowed
        return false;
      }
    }

    // 3) Must follow piece-specific movement logic
    return isValidMovement(piece, r1, c1, r2, c2);
  }

  function highlightValidMoves(piece, r1, c1) {
    const squares = document.querySelectorAll(".square");
    squares.forEach((sq) => {
      const r2 = parseInt(sq.dataset.row);
      const c2 = parseInt(sq.dataset.col);
      if (validateMove(piece, r1, c1, r2, c2)) {
        sq.classList.add("highlight");
      }
    });
  }

  function clearHighlights() {
    document.querySelectorAll(".square").forEach((sq) => {
      sq.classList.remove("highlight");
    });
  }

  // ----------------------------------
  //     PIECE MOVEMENT FUNCTIONS
  // ----------------------------------
  function isValidMovement(piece, r1, c1, r2, c2) {
    const lower = piece.toLowerCase();
    if (lower.includes("pawn")) return validatePawn(piece, r1, c1, r2, c2);
    if (lower.includes("rook")) return validateRook(r1, c1, r2, c2);
    if (lower.includes("knight")) return validateKnight(r1, c1, r2, c2);
    if (lower.includes("bishop")) return validateBishop(r1, c1, r2, c2);
    if (lower.includes("queen")) return validateQueen(r1, c1, r2, c2);
    if (lower.includes("king")) return validateKing(r1, c1, r2, c2);
    return false;
  }

  function validatePawn(piece, r1, c1, r2, c2) {
    const isBlack = piece.includes("black");
    const dir = isBlack ? 1 : -1;
    const startRow = isBlack ? 1 : 6;

    const target = boardState[r2][c2];
    const isCapture = (target && target.includes(isBlack ? "white" : "black"));

    // forward (no capture)
    if (c1 === c2 && !isCapture) {
      // single step
      if (r2 === r1 + dir && !boardState[r2][c2]) return true;
      // double step from start
      if (r1 === startRow && r2 === r1 + 2 * dir) {
        if (!boardState[r1 + dir][c1] && !boardState[r2][c2]) return true;
      }
    }
    // diagonal capture
    if (Math.abs(c2 - c1) === 1 && r2 === r1 + dir && isCapture) {
      return true;
    }
    return false;
  }

  function validateRook(r1, c1, r2, c2) {
    if (r1 !== r2 && c1 !== c2) return false;
    return isPathClear(r1, c1, r2, c2);
  }

  function validateKnight(r1, c1, r2, c2) {
    const rd = Math.abs(r2 - r1), cd = Math.abs(c2 - c1);
    return (rd === 2 && cd === 1) || (rd === 1 && cd === 2);
  }

  function validateBishop(r1, c1, r2, c2) {
    if (Math.abs(r2 - r1) !== Math.abs(c2 - c1)) return false;
    return isPathClear(r1, c1, r2, c2);
  }

  function validateQueen(r1, c1, r2, c2) {
    const sameLine = (r1 === r2 || c1 === c2);
    const diagonal = (Math.abs(r2 - r1) === Math.abs(c2 - c1));
    if (!sameLine && !diagonal) return false;
    return isPathClear(r1, c1, r2, c2);
  }

  function validateKing(r1, c1, r2, c2) {
    const rd = Math.abs(r2 - r1);
    const cd = Math.abs(c2 - c1);
    return (rd <= 1 && cd <= 1);
  }

  function isPathClear(r1, c1, r2, c2) {
    // same row
    if (r1 === r2) {
      const step = c1 < c2 ? 1 : -1;
      for (let c = c1 + step; c !== c2; c += step) {
        if (boardState[r1][c] !== null) return false;
      }
      return true;
    }
    // same col
    if (c1 === c2) {
      const step = r1 < r2 ? 1 : -1;
      for (let r = r1 + step; r !== r2; r += step) {
        if (boardState[r][c1] !== null) return false;
      }
      return true;
    }
    // diagonal
    if (Math.abs(r2 - r1) === Math.abs(c2 - c1)) {
      const rowStep = (r2 > r1) ? 1 : -1;
      const colStep = (c2 > c1) ? 1 : -1;
      let rr = r1 + rowStep;
      let cc = c1 + colStep;
      while (rr !== r2 && cc !== c2) {
        if (boardState[rr][cc] !== null) return false;
        rr += rowStep;
        cc += colStep;
      }
      return true;
    }
    return false;
  }


  //           RESET BUTTON

  resetBtn.addEventListener("click", () => {
    boardState = JSON.parse(JSON.stringify(initialBoard));
    currentTurn = "white";
    gameOver = false;
    turnMessage.textContent = `Turn: ${currentTurn}`;
    createChessBoard();
  });


  //         START GAME

  createChessBoard();
  turnMessage.textContent = `Turn: ${currentTurn}`;
});
