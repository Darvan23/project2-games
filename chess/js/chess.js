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
  
          // If valid, finalize. If not, REVERT in UI.
          if (validateMove(piece, originRow, originCol, targetRow, targetCol)) {
            // Move piece in DOM
            square.innerHTML = "";
            square.appendChild(draggedPiece);
  
            // Update board state
            boardState[targetRow][targetCol] = piece;
            boardState[originRow][originCol] = null;
  
            // Pawn promotion
            if (piece === "pawn" && targetRow === 0) {
              boardState[targetRow][targetCol] = "queen";
            }
            if (piece === "pawnblack" && targetRow === 7) {
              boardState[targetRow][targetCol] = "queenblack";
            }
  
            // Checkmate?
            if (isCheckmate(currentTurn === "white" ? "black" : "white")) {
              turnMessage.textContent = `${currentTurn} wins by checkmate!`;
              gameOver = true;
              clearHighlights();
              return;
            }
  
            // Switch turns
            currentTurn = currentTurn === "white" ? "black" : "white";
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
  
      // 1) Can't capture the opponent's king
      if (targetPiece && targetPiece.includes("king")) {
        return false;
      }
  
      // 2) Must follow piece movement pattern
      if (!isValidPieceMovement(piece, originRow, originCol, targetRow, targetCol)) {
        return false;
      }
  
      // 3) Simulate move, ensure your king not in check
      const savedOrigin = boardState[originRow][originCol];
      const savedTarget = boardState[targetRow][targetCol];
  
      boardState[targetRow][targetCol] = savedOrigin;
      boardState[originRow][originCol] = null;
  
      const kingStillInCheck = isKingInCheck(color);
  
      // revert
      boardState[originRow][originCol] = savedOrigin;
      boardState[targetRow][targetCol] = savedTarget;
  
      if (kingStillInCheck) return false;
  
      return true;
    }
  
    // Distilled piece movement check
    function isValidPieceMovement(piece, originRow, originCol, targetRow, targetCol) {
      const targetPiece = boardState[targetRow][targetCol];
      const myColor = piece.includes("black") ? "black" : "white";
      const isOpponentPiece =
        targetPiece && targetPiece.includes(myColor === "white" ? "black" : "white");
  
      // Can't land on your own piece
      if (targetPiece && !isOpponentPiece) return false;
  
      const lower = piece.toLowerCase();
  
      if (lower.includes("pawn")) {
        return validatePawnMove(piece, originRow, originCol, targetRow, targetCol);
      } else if (lower.includes("rook")) {
        return validateRookMove(originRow, originCol, targetRow, targetCol);
      } else if (lower.includes("knight")) {
        return validateKnightMove(originRow, originCol, targetRow, targetCol);
      } else if (lower.includes("bishop")) {
        return validateBishopMove(originRow, originCol, targetRow, targetCol);
      } else if (lower.includes("queen")) {
        return validateQueenMove(originRow, originCol, targetRow, targetCol);
      } else if (lower.includes("king")) {
        return validateKingMove(piece, originRow, originCol, targetRow, targetCol);
      }
      return false;
    }
  
    // ----------------------------------
    //   PIECE-SPECIFIC MOVEMENTS
    // ----------------------------------
    function validatePawnMove(piece, originRow, originCol, targetRow, targetCol) {
      const isBlack = piece.includes("black");
      const direction = isBlack ? 1 : -1;
      const startRow = isBlack ? 1 : 6;
  
      const targetPiece = boardState[targetRow][targetCol];
      const isCapture = targetPiece && targetPiece.includes(isBlack ? "white" : "black");
  
      // Forward (no capture)
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
      if (Math.abs(targetRow - originRow) !== Math.abs(targetCol - originCol)) {
        return false;
      }
      return isPathClear(originRow, originCol, targetRow, targetCol);
    }
  
    function validateQueenMove(originRow, originCol, targetRow, targetCol) {
      const sameLine = originRow === targetRow || originCol === targetCol;
      const diagonal = Math.abs(targetRow - originRow) === Math.abs(targetCol - originCol);
      if (!sameLine && !diagonal) return false;
      return isPathClear(originRow, originCol, targetRow, targetCol);
    }
  
    function validateKingMove(piece, originRow, originCol, targetRow, targetCol) {
      // 1 step in any direction
      const rowDiff = Math.abs(targetRow - originRow);
      const colDiff = Math.abs(targetCol - originCol);
      if (rowDiff > 1 || colDiff > 1) {
        return false;
      }
      // Additional check that we don't move into check is done in validateMove
      return true;
    }
  
    // ----------------------------------
    //      CHECK / CHECKMATE LOGIC
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
            // If this piece can "validly move" onto the king's position, king is in check
            // We skip the "can't capture king" rule for check logic since "threatening" that square = check
            if (canAttackSquare(p, r, c, kingPos.row, kingPos.col)) {
              return true;
            }
          }
        }
      }
      return false;
    }
  
    // Helper for isKingInCheck (ignores the "no capturing king" rule, since we want to see if that square is attacked)
    function canAttackSquare(piece, originRow, originCol, targetRow, targetCol) {
      const backup = boardState[targetRow][targetCol];
      boardState[targetRow][targetCol] = null; // Temporarily pretend the square is empty
      boardState[originRow][originCol] = null; // So we don't block ourselves
  
      const result = isValidPieceMovement(piece, originRow, originCol, targetRow, targetCol);
  
      // revert
      boardState[originRow][originCol] = piece;
      boardState[targetRow][targetCol] = backup;
  
      return result;
    }
  
    function isCheckmate(color) {
      // If king not in check => not checkmate
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
  