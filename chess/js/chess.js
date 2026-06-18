document.addEventListener("DOMContentLoaded", () => {
  const chessboard = document.querySelector("#chessboard");
  const turnMessage = document.querySelector("#turnMessage");
  const resetBtn = document.querySelector("#resetBtn");
  const aiToggle = document.querySelector("#aiToggle");

  const assets = {
    wp: "pawn.webp",
    wr: "rook.webp",
    wn: "knight.webp",
    wb: "bishop.webp",
    wq: "queen.webp",
    wk: "king.webp",
    bp: "pawnblack.webp",
    br: "rookblack.webp",
    bn: "knightblack.webp",
    bb: "bishopblack.webp",
    bq: "queenblack.webp",
    bk: "kingblack.webp"
  };

  const names = {
    p: "pawn",
    r: "rook",
    n: "knight",
    b: "bishop",
    q: "queen",
    k: "king"
  };

  let board;
  let turn;
  let selected = null;
  let legalMoves = [];
  let castlingRights;
  let enPassantTarget;
  let halfmoveClock;
  let fullmoveNumber;
  let positionCounts;
  let gameOver;
  let aiEnabled = false;
  let aiThinking = false;

  const pieceValues = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 0
  };

  function newPiece(color, type) {
    return { color, type };
  }

  function setupBoard() {
    board = [
      ["r", "n", "b", "q", "k", "b", "n", "r"].map((type) => newPiece("b", type)),
      Array.from({ length: 8 }, () => newPiece("b", "p")),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array.from({ length: 8 }, () => newPiece("w", "p")),
      ["r", "n", "b", "q", "k", "b", "n", "r"].map((type) => newPiece("w", type))
    ];
    turn = "w";
    selected = null;
    legalMoves = [];
    castlingRights = {
      w: { kingSide: true, queenSide: true },
      b: { kingSide: true, queenSide: true }
    };
    enPassantTarget = null;
    halfmoveClock = 0;
    fullmoveNumber = 1;
    positionCounts = new Map();
    gameOver = false;
    recordPosition();
    render();
  }

  function render() {
    chessboard.innerHTML = "";
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("button");
        square.type = "button";
        square.className = `square ${(row + col) % 2 === 0 ? "light" : "dark"}`;
        square.dataset.row = row;
        square.dataset.col = col;
        square.setAttribute("aria-label", `${fileName(col)}${8 - row}`);

        if (selected && selected.row === row && selected.col === col) {
          square.classList.add("selected");
        }

        const hintedMove = legalMoves.find((move) => move.to.row === row && move.to.col === col);
        if (hintedMove) {
          square.classList.add(board[row][col] ? "capture" : "highlight");
        }

        const piece = board[row][col];
        if (piece) {
          const img = document.createElement("img");
          img.src = `img/${assets[piece.color + piece.type]}`;
          img.alt = `${piece.color === "w" ? "white" : "black"} ${names[piece.type]}`;
          img.className = "piece";
          img.draggable = piece.color === turn && !gameOver && !isAiTurn();
          img.addEventListener("dragstart", handleDragStart);
          square.appendChild(img);
        }

        square.addEventListener("click", handleSquareClick);
        square.addEventListener("dragover", (event) => event.preventDefault());
        square.addEventListener("drop", handleDrop);
        chessboard.appendChild(square);
      }
    }

    updateStatus();
  }

  function handleSquareClick(event) {
    const square = event.currentTarget;
    const row = Number(square.dataset.row);
    const col = Number(square.dataset.col);
    const piece = board[row][col];

    if (gameOver || isAiTurn() || aiThinking) return;

    if (selected) {
      const move = legalMoves.find((candidate) => candidate.to.row === row && candidate.to.col === col);
      if (move) {
        makeMove(move);
        return;
      }
    }

    if (piece && piece.color === turn) {
      selected = { row, col };
      legalMoves = getLegalMovesForSquare(row, col);
    } else {
      selected = null;
      legalMoves = [];
    }
    render();
  }

  function handleDragStart(event) {
    const square = event.target.parentElement;
    const row = Number(square.dataset.row);
    const col = Number(square.dataset.col);
    const piece = board[row][col];
    if (!piece || piece.color !== turn || gameOver || isAiTurn() || aiThinking) {
      event.preventDefault();
      return;
    }

    selected = { row, col };
    legalMoves = getLegalMovesForSquare(row, col);
    event.dataTransfer.setData("text/plain", `${row},${col}`);
    render();
  }

  function handleDrop(event) {
    event.preventDefault();
    if (!selected || gameOver) return;
    const row = Number(event.currentTarget.dataset.row);
    const col = Number(event.currentTarget.dataset.col);
    const move = legalMoves.find((candidate) => candidate.to.row === row && candidate.to.col === col);
    if (move) makeMove(move);
  }

  function makeMove(move) {
    const snapshot = cloneState();
    applyMove(move);

    if (isKingInCheck(snapshot.turn)) {
      restoreState(snapshot);
      selected = null;
      legalMoves = [];
      render();
      return false;
    }

    turn = opposite(turn);
    if (turn === "w") fullmoveNumber++;
    selected = null;
    legalMoves = [];
    recordPosition();

    const available = getAllLegalMoves(turn);
    if (available.length === 0 || halfmoveClock >= 100 || isThreefoldRepetition() || isInsufficientMaterial()) {
      gameOver = true;
    }

    render();
    queueAiMove();
    return true;
  }

  function applyMove(move) {
    const piece = board[move.from.row][move.from.col];
    const target = board[move.to.row][move.to.col];
    const wasPawnMove = piece.type === "p";
    const wasCapture = Boolean(target) || move.enPassant;

    board[move.from.row][move.from.col] = null;

    if (move.enPassant) {
      board[move.from.row][move.to.col] = null;
    }

    if (move.castle) {
      const rookFromCol = move.castle === "kingSide" ? 7 : 0;
      const rookToCol = move.castle === "kingSide" ? 5 : 3;
      board[move.to.row][rookToCol] = board[move.to.row][rookFromCol];
      board[move.to.row][rookFromCol] = null;
    }

    board[move.to.row][move.to.col] = { ...piece };
    if (move.promotion) {
      board[move.to.row][move.to.col].type = move.promotion;
    }

    updateCastlingRights(piece, move, target);
    enPassantTarget = wasPawnMove && Math.abs(move.to.row - move.from.row) === 2
      ? { row: (move.from.row + move.to.row) / 2, col: move.from.col }
      : null;
    halfmoveClock = wasPawnMove || wasCapture ? 0 : halfmoveClock + 1;
  }

  function updateCastlingRights(piece, move, capturedPiece) {
    if (piece.type === "k") {
      castlingRights[piece.color].kingSide = false;
      castlingRights[piece.color].queenSide = false;
    }

    if (piece.type === "r") {
      if (move.from.row === homeRow(piece.color) && move.from.col === 0) {
        castlingRights[piece.color].queenSide = false;
      }
      if (move.from.row === homeRow(piece.color) && move.from.col === 7) {
        castlingRights[piece.color].kingSide = false;
      }
    }

    if (capturedPiece && capturedPiece.type === "r") {
      if (move.to.row === homeRow(capturedPiece.color) && move.to.col === 0) {
        castlingRights[capturedPiece.color].queenSide = false;
      }
      if (move.to.row === homeRow(capturedPiece.color) && move.to.col === 7) {
        castlingRights[capturedPiece.color].kingSide = false;
      }
    }
  }

  function getAllLegalMoves(color) {
    const moves = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color) {
          moves.push(...getLegalMovesForSquare(row, col));
        }
      }
    }
    return moves;
  }

  function getLegalMovesForSquare(row, col) {
    const piece = board[row][col];
    if (!piece) return [];
    return getPseudoMoves(row, col).filter((move) => {
      const snapshot = cloneState();
      applyMove(move);
      const legal = !isKingInCheck(piece.color);
      restoreState(snapshot);
      return legal;
    });
  }

  function getPseudoMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return [];

    if (piece.type === "p") return pawnMoves(row, col, piece);
    if (piece.type === "n") return knightMoves(row, col, piece);
    if (piece.type === "b") return slidingMoves(row, col, piece, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
    if (piece.type === "r") return slidingMoves(row, col, piece, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
    if (piece.type === "q") return slidingMoves(row, col, piece, [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]);
    if (piece.type === "k") return kingMoves(row, col, piece);
    return [];
  }

  function pawnMoves(row, col, piece) {
    const moves = [];
    const direction = piece.color === "w" ? -1 : 1;
    const startRow = piece.color === "w" ? 6 : 1;
    const promotionRow = piece.color === "w" ? 0 : 7;
    const oneStep = row + direction;

    if (inside(oneStep, col) && !board[oneStep][col]) {
      addPawnMove(moves, row, col, oneStep, col, promotionRow);
      const twoStep = row + direction * 2;
      if (row === startRow && !board[twoStep][col]) {
        moves.push(buildMove(row, col, twoStep, col));
      }
    }

    [-1, 1].forEach((offset) => {
      const targetCol = col + offset;
      if (!inside(oneStep, targetCol)) return;
      const target = board[oneStep][targetCol];
      if (target && target.color !== piece.color) {
        addPawnMove(moves, row, col, oneStep, targetCol, promotionRow);
      }
      if (enPassantTarget && enPassantTarget.row === oneStep && enPassantTarget.col === targetCol) {
        moves.push({ ...buildMove(row, col, oneStep, targetCol), enPassant: true });
      }
    });

    return moves;
  }

  function addPawnMove(moves, fromRow, fromCol, toRow, toCol, promotionRow) {
    const move = buildMove(fromRow, fromCol, toRow, toCol);
    if (toRow === promotionRow) {
      move.promotion = "q";
    }
    moves.push(move);
  }

  function knightMoves(row, col, piece) {
    return [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]
      .map(([rowStep, colStep]) => [row + rowStep, col + colStep])
      .filter(([targetRow, targetCol]) => canLand(targetRow, targetCol, piece.color))
      .map(([targetRow, targetCol]) => buildMove(row, col, targetRow, targetCol));
  }

  function slidingMoves(row, col, piece, directions) {
    const moves = [];
    directions.forEach(([rowStep, colStep]) => {
      let targetRow = row + rowStep;
      let targetCol = col + colStep;

      while (inside(targetRow, targetCol)) {
        const target = board[targetRow][targetCol];
        if (!target) {
          moves.push(buildMove(row, col, targetRow, targetCol));
        } else {
          if (target.color !== piece.color) moves.push(buildMove(row, col, targetRow, targetCol));
          break;
        }
        targetRow += rowStep;
        targetCol += colStep;
      }
    });
    return moves;
  }

  function kingMoves(row, col, piece) {
    const moves = [];
    for (let rowStep = -1; rowStep <= 1; rowStep++) {
      for (let colStep = -1; colStep <= 1; colStep++) {
        if (rowStep === 0 && colStep === 0) continue;
        const targetRow = row + rowStep;
        const targetCol = col + colStep;
        if (canLand(targetRow, targetCol, piece.color)) {
          moves.push(buildMove(row, col, targetRow, targetCol));
        }
      }
    }

    if (!isKingInCheck(piece.color)) {
      addCastleMove(moves, row, col, piece.color, "kingSide");
      addCastleMove(moves, row, col, piece.color, "queenSide");
    }

    return moves;
  }

  function addCastleMove(moves, row, col, color, side) {
    if (row !== homeRow(color) || col !== 4 || !castlingRights[color][side]) return;

    const rookCol = side === "kingSide" ? 7 : 0;
    const targetCol = side === "kingSide" ? 6 : 2;
    const between = side === "kingSide" ? [5, 6] : [1, 2, 3];
    const checked = side === "kingSide" ? [5, 6] : [3, 2];
    const rook = board[row][rookCol];

    if (!rook || rook.color !== color || rook.type !== "r") return;
    if (between.some((betweenCol) => board[row][betweenCol])) return;
    if (checked.some((checkedCol) => isSquareAttacked(row, checkedCol, opposite(color)))) return;

    moves.push({ ...buildMove(row, col, row, targetCol), castle: side });
  }

  function isKingInCheck(color) {
    const king = findKing(color);
    return king ? isSquareAttacked(king.row, king.col, opposite(color)) : true;
  }

  function isSquareAttacked(row, col, byColor) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece || piece.color !== byColor) continue;
        if (attacksSquare(r, c, row, col, piece)) return true;
      }
    }
    return false;
  }

  function attacksSquare(fromRow, fromCol, targetRow, targetCol, piece) {
    const rowDiff = targetRow - fromRow;
    const colDiff = targetCol - fromCol;
    const absRow = Math.abs(rowDiff);
    const absCol = Math.abs(colDiff);

    if (piece.type === "p") {
      const direction = piece.color === "w" ? -1 : 1;
      return rowDiff === direction && absCol === 1;
    }
    if (piece.type === "n") return (absRow === 2 && absCol === 1) || (absRow === 1 && absCol === 2);
    if (piece.type === "k") return absRow <= 1 && absCol <= 1;
    if (piece.type === "b") return absRow === absCol && clearLine(fromRow, fromCol, targetRow, targetCol);
    if (piece.type === "r") return (fromRow === targetRow || fromCol === targetCol) && clearLine(fromRow, fromCol, targetRow, targetCol);
    if (piece.type === "q") {
      const straight = fromRow === targetRow || fromCol === targetCol;
      const diagonal = absRow === absCol;
      return (straight || diagonal) && clearLine(fromRow, fromCol, targetRow, targetCol);
    }
    return false;
  }

  function clearLine(fromRow, fromCol, targetRow, targetCol) {
    const rowStep = Math.sign(targetRow - fromRow);
    const colStep = Math.sign(targetCol - fromCol);
    let row = fromRow + rowStep;
    let col = fromCol + colStep;

    while (row !== targetRow || col !== targetCol) {
      if (board[row][col]) return false;
      row += rowStep;
      col += colStep;
    }
    return true;
  }

  function findKing(color) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === color && piece.type === "k") return { row, col };
      }
    }
    return null;
  }

  function buildMove(fromRow, fromCol, toRow, toCol) {
    return {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol }
    };
  }

  function canLand(row, col, color) {
    return inside(row, col) && (!board[row][col] || board[row][col].color !== color);
  }

  function inside(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  function opposite(color) {
    return color === "w" ? "b" : "w";
  }

  function homeRow(color) {
    return color === "w" ? 7 : 0;
  }

  function fileName(col) {
    return "abcdefgh"[col];
  }

  function cloneState() {
    return {
      board: board.map((row) => row.map((piece) => piece ? { ...piece } : null)),
      turn,
      castlingRights: JSON.parse(JSON.stringify(castlingRights)),
      enPassantTarget: enPassantTarget ? { ...enPassantTarget } : null,
      halfmoveClock,
      fullmoveNumber,
      positionCounts: new Map(positionCounts)
    };
  }

  function restoreState(snapshot) {
    board = snapshot.board.map((row) => row.map((piece) => piece ? { ...piece } : null));
    turn = snapshot.turn;
    castlingRights = JSON.parse(JSON.stringify(snapshot.castlingRights));
    enPassantTarget = snapshot.enPassantTarget ? { ...snapshot.enPassantTarget } : null;
    halfmoveClock = snapshot.halfmoveClock;
    fullmoveNumber = snapshot.fullmoveNumber;
    positionCounts = new Map(snapshot.positionCounts);
  }

  function updateStatus() {
    const colorName = turn === "w" ? "White" : "Black";
    const inCheck = isKingInCheck(turn);
    const moves = getAllLegalMoves(turn);

    if (moves.length === 0 && inCheck) {
      gameOver = true;
      turnMessage.textContent = `Checkmate. ${turn === "w" ? "Black" : "White"} wins.`;
    } else if (moves.length === 0) {
      gameOver = true;
      turnMessage.textContent = "Stalemate. The game is a draw.";
    } else if (halfmoveClock >= 100) {
      gameOver = true;
      turnMessage.textContent = "Draw by the fifty-move rule.";
    } else if (isThreefoldRepetition()) {
      gameOver = true;
      turnMessage.textContent = "Draw by threefold repetition.";
    } else if (isInsufficientMaterial()) {
      gameOver = true;
      turnMessage.textContent = "Draw by insufficient material.";
    } else {
      const aiText = aiEnabled && turn === "b" ? " AI" : "";
      turnMessage.textContent = `${colorName}${aiText} to move${inCheck ? " - check" : ""}`;
    }
  }

  function isAiTurn() {
    return aiEnabled && turn === "b" && !gameOver;
  }

  function queueAiMove() {
    if (!isAiTurn() || aiThinking) return;
    aiThinking = true;
    setTimeout(() => {
      const move = chooseAiMove();
      aiThinking = false;
      if (move && isAiTurn()) makeMove(move);
    }, 450);
  }

  function chooseAiMove() {
    const moves = getAllLegalMoves("b");
    if (moves.length === 0) return null;
    const scored = moves.map((move) => ({
      move,
      score: scoreAiMove(move, "b")
    }));
    scored.sort((a, b) => b.score - a.score);

    const topGroup = scored.slice(0, Math.min(4, scored.length));
    return topGroup[Math.floor(Math.random() * topGroup.length)].move;
  }

  function scoreAiMove(move, color) {
    const movingPiece = board[move.from.row][move.from.col];
    const target = board[move.to.row][move.to.col];
    let score = Math.random() * 60;

    if (target) score += pieceValues[target.type] - pieceValues[movingPiece.type] * 0.12;
    if (move.enPassant) score += pieceValues.p;
    if (move.promotion) score += pieceValues.q - pieceValues.p;
    if (move.castle) score += 70;

    const centerDistance = Math.abs(3.5 - move.to.row) + Math.abs(3.5 - move.to.col);
    score += (7 - centerDistance) * 8;

    const snapshot = cloneState();
    applyMove(move);
    const opponentColor = opposite(color);
    const givesCheck = isKingInCheck(opponentColor);
    const opponentMoves = getAllLegalMoves(opponentColor);
    if (givesCheck) score += 90;
    if (givesCheck && opponentMoves.length === 0) score += 10000;
    if (isSquareAttacked(move.to.row, move.to.col, opponentColor)) {
      score -= pieceValues[movingPiece.type] * 0.45;
    }
    restoreState(snapshot);

    return score;
  }

  function boardKey() {
    const pieces = board.map((row) => {
      return row.map((piece) => piece ? piece.color + piece.type : "--").join("");
    }).join("/");
    const rights = ["w", "b"].map((color) => {
      return `${color}${castlingRights[color].kingSide ? "K" : ""}${castlingRights[color].queenSide ? "Q" : ""}`;
    }).join("");
    const enPassant = enPassantTarget ? `${enPassantTarget.row},${enPassantTarget.col}` : "-";
    return `${pieces} ${turn} ${rights} ${enPassant}`;
  }

  function recordPosition() {
    const key = boardKey();
    positionCounts.set(key, (positionCounts.get(key) || 0) + 1);
  }

  function isThreefoldRepetition() {
    return (positionCounts.get(boardKey()) || 0) >= 3;
  }

  function isInsufficientMaterial() {
    const pieces = [];
    board.forEach((row, rowIndex) => {
      row.forEach((piece, colIndex) => {
        if (piece) pieces.push({ ...piece, row: rowIndex, col: colIndex });
      });
    });

    const nonKings = pieces.filter((piece) => piece.type !== "k");
    if (nonKings.length === 0) return true;
    if (nonKings.length === 1 && ["b", "n"].includes(nonKings[0].type)) return true;
    if (nonKings.every((piece) => piece.type === "b")) {
      const squareColors = new Set(nonKings.map((piece) => (piece.row + piece.col) % 2));
      return squareColors.size === 1;
    }
    return false;
  }

  resetBtn.addEventListener("click", setupBoard);
  aiToggle.addEventListener("change", () => {
    aiEnabled = aiToggle.checked;
    setupBoard();
  });
  setupBoard();
});
