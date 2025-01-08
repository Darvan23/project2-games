// let board = document.getElementById("board");

// for (let i = 1; i <= 8; i++) {
//     // maak een nieuwe cell container voor elke row
//     const cellContainer = document.createElement("div");
//     cellContainer.className = "cellContainer";

//     for (let j = 1; j <= 8; j++) {
//         const cell = document.createElement("div");
//         cell.className = "cell";

//         if (i % 2 === 0) {
//             if (j % 2 === 0) {
//                 cell.style.backgroundColor = "black";
//             } else {
//                 cell.style.backgroundColor = "white";
//             }
//         } else {
//             if (j % 2 === 0) {
//                 cell.style.backgroundColor = "white";
//             } else {
//                 cell.style.backgroundColor = "black";
//             }
//         }

//         cellContainer.append(cell);
//     }

//     // append de cell container row naar de board
//     board.append(cellContainer);
// }

let board = document.getElementById("board");
let pieces = [];  // Array to store pieces and their positions
let currentPlayer = "dark";  // Start with dark player

// Create the board
for (let i = 1; i <= 8; i++) {
    const cellContainer = document.createElement("div");
    cellContainer.className = "cellContainer";

    for (let j = 1; j <= 8; j++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = i;
        cell.dataset.col = j;

        // Set up the checkerboard pattern
        if ((i + j) % 2 !== 0) {
            if (i <= 3) {
                // Place dark pieces (player 1)
                const darkPiece = document.createElement("div");
                darkPiece.className = "dark-piece";
                cell.appendChild(darkPiece);
                pieces.push({ type: "dark", row: i, col: j, element: darkPiece });
            } else if (i >= 6) {
                // Place light pieces (player 2)
                const lightPiece = document.createElement("div");
                lightPiece.className = "light-piece";
                cell.appendChild(lightPiece);
                pieces.push({ type: "light", row: i, col: j, element: lightPiece });
            }
        }

        cellContainer.append(cell);
    }

    board.append(cellContainer);
}





