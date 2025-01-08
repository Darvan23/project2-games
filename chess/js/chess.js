document.addEventListener("DOMContentLoaded", () => {
  const chessboard = document.querySelector("#chessboard");
  const turnMessage = document.querySelector("#turnMessage");

  // ----------------------------------
  //         INITIAL BOARD SETUP
  // ----------------------------------
  const initialBoardSetup = [
    ["rookblack", "knightblack", "bishopblack", "queenblack", "kingblack", "bishopblack", "knightblack", "rookblack"],
    ["pawnblack", "pawnblack", "pawnblack", "pawnblack", "pawnblack", "pawnblack", "pawnblack", "pawnblack"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["pawn", "pawn", "pawn", "pawn", "pawn", "pawn", "pawn", "pawn"],
    ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"]
  ];

  // Current board state
  const boardState = JSON.parse(JSON.stringify(initialBoardSetup));
  let currentTurn = "white"; // White moves first
  let gameOver = false;

  // Tracking if rooks/kings have moved (needed for castling)
  // We'll store boolean flags like hasMoved["king_7_4"] = true if the King at (7,4) has moved.
  const hasMoved = {};

  // Tracking en passant (the last move that was a double-step pawn move)
  // We'll reset this each turn if no new double-step move is made.
  let enPassant = {
    row: null,
    col: null,
    color: null
  };

  // ----------------------------------
  //         CREATE BOARD
  // ----------------------------------
  function createChessBoard() {
    chessboard.innerHTML = "";

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("div");
        square.classList.add("square");
        square.dataset.row = row;
        square.dataset.col = col;

        // Light / Dark squares
        if ((row + col) % 2 === 0) {
          square.classList.add("light");
        } else {
          square.classList.add("dark");
        }

        // If there's a piece in boardState
        const piece = boardState[row][col];
        if (piece) {
          const pieceImg = document.createElement("img");
          pieceImg.src = `img/${piece}.webp`;
          pieceImg.alt = piece;
          pieceImg.classList.add("piece");
          pieceImg.draggable = true;
          square.appendChild(pieceImg);
        }

        chessboard.appendChild(square);
      }
    }

    enableDragAndDrop();
  }

  // ----------------------------------
  //     DRAG AND DROP HANDLERS
  // ----------------------------------
  function enableDragAndDrop() {
    const pieces = document.querySelectorAll(".piece");
    let draggedPiece = null;
    let originSquare = null;

    pieces.forEach((piece) => {
      piece.addEventListener("dragstart", (e) => {
        if (gameOver) {
          e.preventDefault();
          return;
        }

        draggedPiece = e.target;
        originSquare = e.target.parentElement;

        // Check if it's your turn
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

      piece.addEventListener("dragend", () => {
        draggedPiece = null;
        originSquare = null;
        clearHighlights();
      });
    });

    // Dropping on squares
    const squares = document.querySelectorAll(".square");
    squares.forEach((square) => {
      square.addEventListener("dragover", (e) => e.preventDefault());

      square.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!draggedPiece || !originSquare) return;

        // If we drop on the same square, no move
        if (square === originSquare) return;

        const originRow = parseInt(originSquare.dataset.row);
        const originCol = parseInt(originSquare.dataset.col);
        const targetRow = parseInt(square.dataset.row);
        const targetCol = parseInt(square.dataset.col);

        const piece = boardState[originRow][originCol];

        // Validate & finalize
        if (validateMove(piece, originRow, originCol, targetRow, targetCol)) {
          // Move piece in the DOM
          square.innerHTML = "";
          square.appendChild(draggedPiece);

          // Update board state
          boardState[targetRow][targetCol] = piece;
          boardState[originRow][originCol] = null;

          // Handle promotion, castling, en passant updates, etc.
          handlePostMove(piece, originRow, originCol, targetRow, targetCol);

          // Check for checkmate or stalemate on the opponent
          const opponentColor = currentTurn === "white" ? "black" : "white";
          if (isCheckmate(opponentColor)) {
            turnMessage.textContent = `${currentTurn} wins by checkmate!`;
            gameOver = true;
            clearHighlights();
            return;
          } else if (isStalemate(opponentColor)) {
            turnMessage.textContent = `Stalemate! It's a draw.`;
            gameOver = true;
            clearHighlights();
            return;
          }

          // Switch turns
          currentTurn = opponentColor;
          turnMessage.textContent = `Turn: ${currentTurn}`;

          // Re-render board
          createChessBoard();
        } else {
          // INVALID move => REVERT visually
          originSquare.appendChild(draggedPiece);
        }
      });
    });
  }

  // ----------------------------------
  //  POST-MOVE HANDLING (promotion, castling, en passant, etc.)
  // ----------------------------------
  function handlePostMove(piece, originRow, originCol, targetRow, targetCol) {
    const isBlack = piece.includes("black");
    const color = isBlack ? "black" : "white";

    // Pawn promotion
    if (piece === "pawn" && targetRow === 0) {
      boardState[targetRow][targetCol] = "queen";
    }
    if (piece === "pawnblack" && targetRow === 7) {
      boardState[targetRow][targetCol] = "queenblack";
    }

    // Castling move => if the king just moved two squares, move the rook
    if (piece.includes("king") && Math.abs(originCol - targetCol) === 2) {
      // King moved 2 squares to the right => short castle
      if (targetCol === originCol + 2) {
        boardState[targetRow][5] = boardState[targetRow][7];
        boardState[targetRow][7] = null;
      } 
      // King moved 2 squares to the left => long castle
      else if (targetCol === originCol - 2) {
        boardState[targetRow][3] = boardState[targetRow][0];
        boardState[targetRow][0] = null;
      }
    }

    // En passant capture: if a pawn moves diagonally to an empty square
    // and we have a stored enPassant from the opponent's two-square move.
    const movedPawnIsWhite = (piece === "pawn");
    const movedPawnIsBlack = (piece === "pawnblack");
    if ((movedPawnIsWhite || movedPawnIsBlack) &&
        Math.abs(targetCol - originCol) === 1 &&
        enPassant.row !== null &&
        enPassant.col !== null) {
      // If the target square is exactly the enPassant square (row+direction, col) 
      // then we remove the captured pawn behind it.
      if (targetRow === enPassant.row + (movedPawnIsWhite ? 1 : -1) &&
          targetCol === enPassant.col) {
        boardState[enPassant.row][enPassant.col] = null;
      }
    }

    // Update enPassant info:
    // If a pawn just moved two steps, record it. Otherwise clear.
    if ((movedPawnIsWhite || movedPawnIsBlack) && Math.abs(targetRow - originRow) === 2) {
      enPassant = { row: targetRow, col: targetCol, color: color };
    } else {
      enPassant = { row: null, col: null, color: null };
    }

    // Mark piece as moved to prevent future castling with that piece if it's a rook or king
    hasMoved[`${piece}_${originRow}_${originCol}`] = true;
  }

  // ----------------------------------
  //        HIGHLIGHT MOVES
  // ----------------------------------
  function highlightValidMoves(piece, originRow, originCol) {
    const squares = document.querySelectorAll(".square");
    squares.forEach((sq) => {
      const targetRow = parseInt(sq.dataset.row);
      const targetCol = parseInt(sq.dataset.col);
      if (validateMove(piece, originRow, originCol, targetRow, targetCol)) {
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
  //         VALIDATE MOVES
  // ----------------------------------
  function validateMove(piece, originRow, originCol, targetRow, targetCol) {
    if (gameOver) return false;

    const targetPiece = boardState[targetRow][targetCol];
    const color = piece.includes("black") ? "black" : "white";

    // 1) Can't land on your own color
    if (targetPiece && targetPiece.includes(color)) {
      return false;
    }

    // 2) Must follow piece movement pattern (including castling & en passant logic)
    if (!isValidPieceMovement(piece, originRow, originCol, targetRow, targetCol)) {
      return false;
    }

    // 3) Simulate the move to ensure your king is not left in check
    const savedOrigin = boardState[originRow][originCol];
    const savedTarget = boardState[targetRow][targetCol];

    // Potential en passant capture
    let capturedEnPassant = null;
    if ((piece === "pawn" || piece === "pawnblack") &&
        Math.abs(originCol - targetCol) === 1 && !savedTarget) {
      // means it might be an en passant capture
      if (
        targetRow === enPassant.row + (piece === "pawn" ? 1 : -1) &&
        targetCol === enPassant.col &&
        enPassant.color !== color
      ) {
        capturedEnPassant = {
          row: enPassant.row,
          col: enPassant.col,
          p: boardState[enPassant.row][enPassant.col]
        };
        boardState[enPassant.row][enPassant.col] = null; 
      }
    }

    // Move in boardState
    boardState[targetRow][targetCol] = savedOrigin;
    boardState[originRow][originCol] = null;

    // If castling, move the rook as well
    if (piece.includes("king") && Math.abs(originCol - targetCol) === 2) {
      // Right side short castle
      if (targetCol > originCol) {
        boardState[targetRow][5] = boardState[targetRow][7];
        boardState[targetRow][7] = null;
      } else {
        // Left side long castle
        boardState[targetRow][3] = boardState[targetRow][0];
        boardState[targetRow][0] = null;
      }
    }

    // Now check if king is in check
    const kingStillInCheck = isKingInCheck(color);

    // Revert all changes
    boardState[originRow][originCol] = savedOrigin;
    boardState[targetRow][targetCol] = savedTarget;

    if (capturedEnPassant) {
      boardState[capturedEnPassant.row][capturedEnPassant.col] = capturedEnPassant.p;
    }

    // Revert castling changes
    if (piece.includes("king") && Math.abs(originCol - targetCol) === 2) {
      if (targetCol > originCol) {
        boardState[targetRow][7] = boardState[targetRow][5];
        boardState[targetRow][5] = null;
      } else {
        boardState[targetRow][0] = boardState[targetRow][3];
        boardState[targetRow][3] = null;
      }
    }

    // If king is still in check, move is invalid
    if (kingStillInCheck) return false;

    return true;
  }

  // Decide which piece-specific move check to call
  function isValidPieceMovement(piece, originRow, originCol, targetRow, targetCol) {
    if (piece.toLowerCase().includes("pawn")) {
      return validatePawnMove(piece, originRow, originCol, targetRow, targetCol);
    } else if (piece.toLowerCase().includes("rook")) {
      return validateRookMove(originRow, originCol, targetRow, targetCol);
    } else if (piece.toLowerCase().includes("knight")) {
      return validateKnightMove(originRow, originCol, targetRow, targetCol);
    } else if (piece.toLowerCase().includes("bishop")) {
      return validateBishopMove(originRow, originCol, targetRow, targetCol);
    } else if (piece.toLowerCase().includes("queen")) {
      return validateQueenMove(originRow, originCol, targetRow, targetCol);
    } else if (piece.toLowerCase().includes("king")) {
      return validateKingMove(piece, originRow, originCol, targetRow, targetCol);
    }
    return false;
  }

  // ----------------------------------
  //   PIECE-SPECIFIC MOVEMENTS
  // ----------------------------------
  function validatePawnMove(piece, originRow, originCol, targetRow, targetCol) {
    const isBlack = piece.includes("black");
    const direction = isBlack ? 1 : -1;  // black pawns move down, white move up
    const startRow = isBlack ? 1 : 6;

    const targetPiece = boardState[targetRow][targetCol];
    const isCapture = targetPiece && targetPiece.includes(isBlack ? "white" : "black");

    // EN PASSANT possibility (handled in full in validateMove, but we check basic feasibility here)
    // If diagonal move and no direct capture, might be en passant. We'll allow if it lines up with enPassant.
    if (Math.abs(originCol - targetCol) === 1 && !isCapture) {
      const epRow = enPassant.row;
      const epCol = enPassant.col;
      const epColor = enPassant.color;
      // If the target matches the enPassant spot, assume possible. Actual check is in validateMove.
      if (
        epRow !== null && epCol !== null && epColor !== (isBlack ? "black" : "white") &&
        targetRow === epRow + (isBlack ? 1 : -1) &&
        targetCol === epCol
      ) {
        return true;
      }
    }

    // Normal forward move (not capturing)
    if (originCol === targetCol && !isCapture) {
      // single step
      if (targetRow === originRow + direction) {
        return !boardState[targetRow][targetCol];
      }
      // double step from start row
      if (originRow === startRow && targetRow === originRow + 2 * direction) {
        const stepRow = originRow + direction;
        if (!boardState[stepRow][originCol] && !boardState[targetRow][targetCol]) {
          return true;
        }
      }
    }

    // Diagonal capture
    if (
      Math.abs(originCol - targetCol) === 1 &&
      targetRow === originRow + direction &&
      isCapture
    ) {
      return true;
    }

    return false;
  }

  function validateRookMove(originRow, originCol, targetRow, targetCol) {
    // Rook must move in the same row OR the same column
    if (originRow !== targetRow && originCol !== targetCol) {
      return false;
    }
    return isPathClear(originRow, originCol, targetRow, targetCol);
  }

  function validateKnightMove(originRow, originCol, targetRow, targetCol) {
    const rowDiff = Math.abs(targetRow - originRow);
    const colDiff = Math.abs(targetCol - originCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  }

  function validateBishopMove(originRow, originCol, targetRow, targetCol) {
    // Bishop moves diagonally
    if (Math.abs(targetRow - originRow) !== Math.abs(targetCol - originCol)) {
      return false;
    }
    return isPathClear(originRow, originCol, targetRow, targetCol);
  }

  function validateQueenMove(originRow, originCol, targetRow, targetCol) {
    // Queen = Rook or Bishop movement
    const sameLine = (originRow === targetRow) || (originCol === targetCol);
    const diagonal = Math.abs(targetRow - originRow) === Math.abs(targetCol - originCol);
    if (!sameLine && !diagonal) return false;
    return isPathClear(originRow, originCol, targetRow, targetCol);
  }

  function validateKingMove(piece, originRow, originCol, targetRow, targetCol) {
    const rowDiff = Math.abs(targetRow - originRow);
    const colDiff = Math.abs(targetCol - originCol);

    // Normal king move: 1 step in any direction
    if (rowDiff <= 1 && colDiff <= 1) {
      return true;
    }

    // Castling check: king moves 2 squares left or right
    // - Must not have moved king or the rook involved
    // - Path must be clear
    // - King cannot be in check or pass through check
    if (rowDiff === 0 && Math.abs(colDiff) === 2) {
      const color = piece.includes("black") ? "black" : "white";
      const row = originRow;
      // short castle => targetCol = originCol + 2
      if (targetCol > originCol) {
        // Check rook in (row, 7) hasn't moved, and king hasn't moved
        if (!hasMoved[`${piece}_${originRow}_${originCol}`] && 
            boardState[row][7] && boardState[row][7].includes("rook") && 
            !hasMoved[`${boardState[row][7]}_${row}_7`]) {
          // Path between (row, originCol+1) and (row, 6) must be clear
          if (boardState[row][originCol+1] === null &&
              boardState[row][originCol+2] === null) {
            // Additionally, the king cannot be in check on origin, pass-through, or final
            if (!wouldBeInCheck(color, originRow, originCol) &&
                !wouldBeInCheckAfterMove(color, originRow, originCol, row, originCol+1) &&
                !wouldBeInCheckAfterMove(color, originRow, originCol, targetRow, targetCol)) {
              return true;
            }
          }
        }
      } 
      // long castle => targetCol = originCol - 2
      else {
        // Check rook in (row, 0) hasn't moved, and king hasn't moved
        if (!hasMoved[`${piece}_${originRow}_${originCol}`] && 
            boardState[row][0] && boardState[row][0].includes("rook") && 
            !hasMoved[`${boardState[row][0]}_${row}_0`]) {
          // Path between (row, originCol-1) to (row, 1) must be clear
          if (boardState[row][originCol-1] === null &&
              boardState[row][originCol-2] === null &&
              boardState[row][originCol-3] === null) {
            // King cannot be in check on origin, pass-through, or final
            if (!wouldBeInCheck(color, originRow, originCol) &&
                !wouldBeInCheckAfterMove(color, originRow, originCol, row, originCol-1) &&
                !wouldBeInCheckAfterMove(color, originRow, originCol, targetRow, targetCol)) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  // Helper to check if after a hypothetical single-step move, the king would be in check
  function wouldBeInCheckAfterMove(color, originRow, originCol, targetRow, targetCol) {
    const savedOrigin = boardState[originRow][originCol];
    const savedTarget = boardState[targetRow][targetCol];
    boardState[targetRow][targetCol] = savedOrigin;
    boardState[originRow][originCol] = null;

    const inCheck = isKingInCheck(color);

    // revert
    boardState[originRow][originCol] = savedOrigin;
    boardState[targetRow][targetCol] = savedTarget;
    return inCheck;
  }

  // We'll use isKingInCheck(color) in multiple places, including castling checks
  // so we define a separate helper for that one-step check above.
  function wouldBeInCheck(color, kingRow, kingCol) {
    // Temporarily, let's just see if the board is in check from the existing state
    // ignoring that we pass the exact square. Because if the king is currently in check,
    // there's no valid move that can keep it that way. We'll rely on isKingInCheck.
    return isKingInCheck(color);
  }

  // ----------------------------------
  //      CHECK / CHECKMATE / ETC.
  // ----------------------------------
  function isKingInCheck(color) {
    // Find king of "color"
    let kingPos = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.includes("king") && piece.includes(color)) {
          kingPos = { row: r, col: c };
          break;
        }
      }
      if (kingPos) break;
    }
    if (!kingPos) return false; // If no king found, unusual, but let's say no check.

    // Check if any opponent piece can attack that square
    const opponent = color === "white" ? "black" : "white";
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = boardState[r][c];
        if (p && p.includes(opponent)) {
          // Temporarily ignore that the square is "occupied by the king"
          // Because if it can move there, that means the king is in check.
          if (canAttackSquare(p, r, c, kingPos.row, kingPos.col)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function canAttackSquare(piece, originRow, originCol, targetRow, targetCol) {
    // Temporarily remove piece from origin and see if isValidPieceMovement says it's valid
    const savedOrigin = boardState[originRow][originCol];
    const savedTarget = boardState[targetRow][targetCol];
    boardState[originRow][originCol] = null;
    boardState[targetRow][targetCol] = null;

    const result = isValidPieceMovement(piece, originRow, originCol, targetRow, targetCol);

    // revert
    boardState[originRow][originCol] = savedOrigin;
    boardState[targetRow][targetCol] = savedTarget;

    return result;
  }

  function isCheckmate(color) {
    // If king not in check => cannot be checkmate
    if (!isKingInCheck(color)) return false;

    // If in check, see if any move of that color can resolve it
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.includes(color)) {
          for (let tr = 0; tr < 8; tr++) {
            for (let tc = 0; tc < 8; tc++) {
              if (validateMove(piece, r, c, tr, tc)) {
                // If we find a valid move that stops the check => not mate
                return false;
              }
            }
          }
        }
      }
    }
    return true; // No move can resolve check => checkmate
  }

  function isStalemate(color) {
    // Stalemate occurs if the king is not in check, but no legal move is available
    if (isKingInCheck(color)) return false; // then it's not stalemate, it could be check/checkmate

    // If no piece of 'color' can move anywhere, it's stalemate
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece && piece.includes(color)) {
          for (let tr = 0; tr < 8; tr++) {
            for (let tc = 0; tc < 8; tc++) {
              if (validateMove(piece, r, c, tr, tc)) {
                return false; // found a valid move
              }
            }
          }
        }
      }
    }
    return true;
  }

  // ----------------------------------
  //   SLIDING PIECES: PATH IS CLEAR
  // ----------------------------------
  function isPathClear(originRow, originCol, targetRow, targetCol) {
    // same row
    if (originRow === targetRow) {
      const step = originCol < targetCol ? 1 : -1;
      for (let col = originCol + step; col !== targetCol; col += step) {
        if (boardState[originRow][col] !== null) {
          return false;
        }
      }
      return true;
    }
    // same col
    if (originCol === targetCol) {
      const step = originRow < targetRow ? 1 : -1;
      for (let row = originRow + step; row !== targetRow; row += step) {
        if (boardState[row][originCol] !== null) {
          return false;
        }
      }
      return true;
    }
    // diagonal
    const rowDiff = targetRow - originRow;
    const colDiff = targetCol - originCol;
    if (Math.abs(rowDiff) === Math.abs(colDiff)) {
      const rowStep = rowDiff > 0 ? 1 : -1;
      const colStep = colDiff > 0 ? 1 : -1;
      let r = originRow + rowStep;
      let c = originCol + colStep;
      while (r !== targetRow && c !== targetCol) {
        if (boardState[r][c] !== null) {
          return false;
        }
        r += rowStep;
        c += colStep;
      }
      return true;
    }
    return false;
  }

  // ----------------------------------
  //          START GAME
  // ----------------------------------
  createChessBoard();
  turnMessage.textContent = `Turn: ${currentTurn}`;
});
