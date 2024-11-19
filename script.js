let selectedCell = null;
const grid = document.getElementById("sudokuGrid");
const rowNotes = document.querySelector(".row-notes");
const columnNotes = document.querySelector(".column-notes");
let initialCells = new Set();
let isNoteMode = false;
let isHighlightMode = false;
let notes = Array(81)
  .fill()
  .map(() => new Set());

// Create 9x9 grid
for (let i = 0; i < 81; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.addEventListener("click", () => selectCell(cell));
  grid.appendChild(cell);
}

// Create 1x9 row-note grid
for (let i = 0; i < 9; i++) {
  const noteCell = document.createElement("div");
  noteCell.className = "note-cell";
  const noteGrid = createNoteGrid();
  noteCell.appendChild(noteGrid);
  rowNotes.appendChild(noteCell);
}

// Create 1x9 column-note grid
for (let i = 0; i < 9; i++) {
  const noteCell = document.createElement("div");
  noteCell.className = "note-cell";
  const noteGrid = createNoteGrid();
  noteCell.appendChild(noteGrid);
  columnNotes.appendChild(noteCell);
}

function selectCell(cell) {
  const cells = Array.from(document.getElementsByClassName("cell"));
  cells.forEach((c) => {
    c.classList.remove("selected", "highlighted", "highlighted-match");
  });

  selectedCell = cell;
  cell.classList.add("selected");

  // Get cell position
  const index = cells.indexOf(cell);
  const row = Math.floor(index / 9);
  const col = index % 9;

  // Helper function to highlight row, column and box for a given cell
  const highlightRelatedCells = (cellIndex) => {
    const cellRow = Math.floor(cellIndex / 9);
    const cellCol = cellIndex % 9;

    // Highlight row
    for (let i = 0; i < 9; i++) {
      const highlightCell = cells[cellRow * 9 + i];
      if (highlightCell !== cell) {
        highlightCell.classList.add("highlighted");
      }
    }

    // Highlight column
    for (let i = 0; i < 9; i++) {
      const highlightCell = cells[i * 9 + cellCol];
      if (highlightCell !== cell) {
        highlightCell.classList.add("highlighted");
      }
    }

    // Highlight 3x3 box
    const boxStartRow = cellRow - (cellRow % 3);
    const boxStartCol = cellCol - (cellCol % 3);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const highlightCell = cells[(boxStartRow + i) * 9 + (boxStartCol + j)];
        if (highlightCell !== cell) {
          highlightCell.classList.add("highlighted");
        }
      }
    }
  };

  // Highlight row, column and box for selected cell
  highlightRelatedCells(index);

  // Highlight matching numbers and their related cells
  const selectedNumber = cell.textContent;
  if (selectedNumber && !cell.querySelector(".note-grid")) {
    cells.forEach((c, idx) => {
      if (
        c !== cell &&
        c.textContent === selectedNumber &&
        !c.querySelector(".note-grid")
      ) {
        c.classList.add("highlighted-match");
        highlightRelatedCells(idx);
      }
    });
  }
}

function checkErrors(cell) {
  const cells = Array.from(document.getElementsByClassName("cell"));
  const index = cells.indexOf(cell);
  const row = Math.floor(index / 9);
  const col = index % 9;
  const value = cell.textContent;

  console.log(`Checking cell at row ${row}, col ${col} with value ${value}`);

  // Check row
  for (let i = 0; i < 9; i++) {
    const checkCell = cells[row * 9 + i];
    // Only compare with cells that don't have note grids
    if (
      checkCell !== cell &&
      !checkCell.querySelector(".note-grid") &&
      checkCell.textContent === value
    ) {
      console.log(`Found duplicate ${value} in row ${row} at column ${i}`);
      return true;
    }
  }

  // Check column
  for (let i = 0; i < 9; i++) {
    const checkCell = cells[i * 9 + col];
    // Only compare with cells that don't have note grids
    if (
      checkCell !== cell &&
      !checkCell.querySelector(".note-grid") &&
      checkCell.textContent === value
    ) {
      console.log(`Found duplicate ${value} in column ${col} at row ${i}`);
      return true;
    }
  }

  // No errors found
  console.log(`No errors found for value ${value} at row ${row}, col ${col}`);
  return false;
}

document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "n") {
    toggleNoteMode();
    return;
  }

  if (selectedCell && !initialCells.has(selectedCell)) {
    const cells = Array.from(document.getElementsByClassName("cell"));
    const index = cells.indexOf(selectedCell);

    if (e.key === "Backspace") {
      // Clear the cell content and notes
      selectedCell.textContent = "";
      selectedCell.classList.remove("error");
      notes[index].clear();
      updateHelperCells();
      return;
    }

    if (e.key >= "1" && e.key <= "9") {
      if (isNoteMode) {
        // Handle notes
        if (
          !selectedCell.textContent ||
          selectedCell.querySelector(".note-grid")
        ) {
          const noteGrid =
            selectedCell.querySelector(".note-grid") || createNoteGrid();
          if (!selectedCell.contains(noteGrid)) {
            selectedCell.textContent = "";
            selectedCell.appendChild(noteGrid);
          }

          const number = parseInt(e.key);
          if (notes[index].has(number)) {
            notes[index].delete(number);
            noteGrid.children[number - 1].textContent = "";
          } else {
            notes[index].add(number);
            noteGrid.children[number - 1].textContent = number;
          }
        }
      } else {
        // Normal number entry
        selectedCell.textContent = e.key;
        selectedCell.classList.remove("error");
        notes[index].clear();

        if (checkErrors(selectedCell)) {
          selectedCell.classList.add("error");
        } else {
          // Clean up notes in related cells when a valid number is placed
          const cells = Array.from(document.getElementsByClassName("cell"));
          const row = Math.floor(index / 9);
          const col = index % 9;
          const boxStartRow = row - (row % 3);
          const boxStartCol = col - (col % 3);
          const placedNumber = parseInt(e.key);

          // Helper function to remove note from cell
          const removeNoteFromCell = (cellIndex, number) => {
            const cell = cells[cellIndex];
            const noteGrid = cell.querySelector(".note-grid");
            if (noteGrid) {
              notes[cellIndex].delete(number);
              noteGrid.children[number - 1].textContent = "";
            }
          };

          // Clean row
          for (let i = 0; i < 9; i++) {
            removeNoteFromCell(row * 9 + i, placedNumber);
          }

          // Clean column
          for (let i = 0; i < 9; i++) {
            removeNoteFromCell(i * 9 + col, placedNumber);
          }

          // Clean 3x3 box
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              removeNoteFromCell(
                (boxStartRow + i) * 9 + (boxStartCol + j),
                placedNumber
              );
            }
          }
        }

        updateHelperCells();
        checkVictory();
      }
    }
  }
});

function isValid(board, row, col, num) {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box
  let startRow = row - (row % 3);
  let startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
}

function solveSudoku(board) {
  let row = -1;
  let col = -1;
  let isEmpty = false;

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j] === 0) {
        row = i;
        col = j;
        isEmpty = true;
        break;
      }
    }
    if (isEmpty) break;
  }

  if (!isEmpty) return true;

  for (let num = 1; num <= 9; num++) {
    if (isValid(board, row, col, num)) {
      board[row][col] = num;
      if (solveSudoku(board)) return true;
      board[row][col] = 0;
    }
  }
  return false;
}

let remainingCells = 25;

function setDifficulty(value, text) {
  const difficultyText = document.getElementById("difficulty-text");
  difficultyText.textContent = text;
  remainingCells = Math.max(25, parseInt(value));
  console.log(`Difficulty set to ${remainingCells} cells`);
  generateSudoku(value);
  closeStartScreen();
}

function closeStartScreen() {
  const startScreen = document.querySelector(".start-screen");
  startScreen.style.display = "none";
}

function openStartScreen() {
  const startScreen = document.querySelector(".start-screen");
  startScreen.style.display = "flex";
}

function generateSudoku() {
  // Reset victory message
  const victoryMessage = document.querySelector(".victory-message");
  victoryMessage.style.display = "none";

  // Reset grid and selection
  const cells = Array.from(document.getElementsByClassName("cell"));
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.classList.remove("selected", "error", "initial", "completed");
  });
  selectedCell = null;
  initialCells.clear();
  notes = Array(81)
    .fill()
    .map(() => new Set());

  // Create empty board
  let board = Array(9)
    .fill()
    .map(() => Array(9).fill(0));

  // Fill diagonal 3x3 boxes
  for (let i = 0; i < 9; i += 3) {
    let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let row = i; row < i + 3; row++) {
      for (let col = i; col < i + 3; col++) {
        let randIndex = Math.floor(Math.random() * nums.length);
        board[row][col] = nums[randIndex];
        nums.splice(randIndex, 1);
      }
    }
  }

  // Solve the rest of the puzzle
  solveSudoku(board);

  // Create a copy of the solved board
  let solvedBoard = board.map((row) => [...row]);

  // Add timeout and attempt monitoring
  const startTime = Date.now();
  const MAX_GENERATION_TIME = 3000; // 10 seconds timeout
  const MAX_ATTEMPTS = 1000; // Maximum attempts to remove numbers
  let attempts = 0;
  let filledCells = 81;

  while (filledCells > remainingCells) {
    // Check if we're taking too long or too many attempts
    if (
      Date.now() - startTime > MAX_GENERATION_TIME ||
      attempts > MAX_ATTEMPTS
    ) {
      console.log(
        `Generation stopped: ${attempts} attempts, ${Date.now() - startTime}ms`
      );
      // If we can't achieve the desired difficulty, keep what we have
      break;
    }

    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);
    if (board[row][col] !== 0) {
      let temp = board[row][col];
      board[row][col] = 0;
      attempts++;

      // Create a copy of the board for solving attempt
      let boardCopy = board.map((row) => [...row]);

      // If puzzle becomes unsolvable, restore the number
      if (!isUniqueSolution(boardCopy)) {
        board[row][col] = temp;
        continue;
      }

      filledCells--;
    }
  }

  // Log generation statistics
  console.log(`Generated puzzle with ${81 - filledCells} empty cells`);
  console.log(
    `Generation took ${Date.now() - startTime}ms and ${attempts} attempts`
  );

  // Fill the grid with the generated puzzle
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const cell = cells[i * 9 + j];
      if (board[i][j] !== 0) {
        cell.textContent = board[i][j];
        cell.classList.add("initial");
        initialCells.add(cell);
      }
    }
  }
  updateHelperCells();
}

// Add this new function to check for unique solution
function isUniqueSolution(board) {
  let solutions = 0;

  function solve(board) {
    if (solutions > 1) return; // Stop if we found multiple solutions

    let row = -1;
    let col = -1;
    let isEmpty = false;

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) {
          row = i;
          col = j;
          isEmpty = true;
          break;
        }
      }
      if (isEmpty) break;
    }

    if (!isEmpty) {
      solutions++;
      return;
    }

    for (let num = 1; num <= 9; num++) {
      if (isValid(board, row, col, num)) {
        board[row][col] = num;
        solve(board);
        board[row][col] = 0;
      }
    }
  }

  solve(board);
  return solutions === 1;
}

function toggleTheme() {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  localStorage.setItem("darkTheme", isDarkTheme);
}

// Load theme preference on page load
document.addEventListener("DOMContentLoaded", () => {
  const isDarkTheme = localStorage.getItem("darkTheme") === "true";
  if (isDarkTheme) {
    document.body.classList.add("dark-theme");
  }
});

function toggleNoteMode() {
  isNoteMode = !isNoteMode;
  const noteButton = document.querySelector("#note-btn");
  noteButton.style.backgroundColor = isNoteMode
    ? "var(--selected-bg-light)"
    : "";
  const toggleIndicator = noteButton.querySelector(".toggle-indicator");
  toggleIndicator.textContent = isNoteMode ? "ON" : "OFF";
}

function toggleHighlights() {
  isHighlightMode = !isHighlightMode;
  const highlightButton = document.querySelector("#highlight-btn");
  highlightButton.style.backgroundColor = isHighlightMode
    ? "var(--selected-bg-light)"
    : "";
  const toggleIndicator = highlightButton.querySelector(".toggle-indicator");
  toggleIndicator.textContent = isHighlightMode ? "ON" : "OFF";
  const styleTag = document.querySelector(".highlight-css");
  if (isHighlightMode) {
    if (!styleTag) {
      const style = document.createElement("style");
      style.className = "highlight-css";
      style.textContent = `
        .highlighted {
            background-color: var(--selected-bg-light);
        }

        .highlighted-match {
            background-color: var(--selected-bg);
        }`;
      document.head.appendChild(style);
    }
  } else {
    if (styleTag) {
      styleTag.remove();
    }
  }
}

function createNoteGrid() {
  const noteGrid = document.createElement("div");
  noteGrid.className = "note-grid";
  for (let i = 0; i < 9; i++) {
    const noteCell = document.createElement("div");
    noteCell.className = "note";
    noteGrid.appendChild(noteCell);
  }
  return noteGrid;
}

// Add these new functions
function checkVictory() {
  const cells = Array.from(document.getElementsByClassName("cell"));
  // Check if all cells are filled with numbers (not notes) and no errors exist
  const isComplete = cells.every(
    (cell) =>
      cell.textContent &&
      !cell.classList.contains("error") &&
      !cell.querySelector(".note-grid") // Add this check to exclude cells with notes
  );

  if (isComplete) {
    runVictoryAnimation();
  }
}

async function runVictoryAnimation() {
  const cells = Array.from(document.getElementsByClassName("cell"));
  const grid = Array(9)
    .fill()
    .map(() => Array(9).fill(null));

  // Map cells to 2D grid
  cells.forEach((cell, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    grid[row][col] = cell;
  });

  // Get diagonals (bottom-left to top-right)
  const diagonals = [];
  for (let sum = 16; sum >= 0; sum--) {
    const diagonal = [];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (i + j === sum) {
          diagonal.push(grid[i][j]);
        }
      }
    }
    if (diagonal.length > 0) {
      diagonals.push(diagonal);
    }
  }

  // Animate each diagonal
  for (const diagonal of diagonals) {
    // Grow cells
    diagonal.forEach((cell) => cell.classList.add("grow"));
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Shrink cells and change color
    diagonal.forEach((cell) => {
      cell.classList.remove("grow");
      cell.classList.add("completed");
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  // Show victory message
  const victoryMessage = document.querySelector(".victory-message");
  victoryMessage.style.display = "flex";
}

function updateHelperCells() {
  const cells = Array.from(document.getElementsByClassName("cell"));

  // For each row
  for (let row = 0; row < 9; row++) {
    const rowNumbers = new Set();

    // Get numbers present in current row (ignoring notes)
    for (let col = 0; col < 9; col++) {
      const cell = cells[row * 9 + col];
      // Only consider cells without note-grid
      if (!cell.querySelector(".note-grid") && cell.textContent) {
        rowNumbers.add(parseInt(cell.textContent));
      }
    }

    // Get missing numbers
    const missingNumbers = new Set();
    for (let i = 1; i <= 9; i++) {
      if (!rowNumbers.has(i)) {
        missingNumbers.add(i);
      }
    }

    // Update the corresponding row note cell
    const noteCell = rowNotes.children[row];
    const noteGrid = noteCell.firstChild;

    // Clear all notes
    Array.from(noteGrid.children).forEach((note) => (note.textContent = ""));

    // Add missing numbers
    missingNumbers.forEach((num) => {
      noteGrid.children[num - 1].textContent = num;
    });
  }

  // For each column
  for (let col = 0; col < 9; col++) {
    const colNumbers = new Set();

    // Get numbers present in current column (ignoring notes)
    for (let row = 0; row < 9; row++) {
      const cell = cells[row * 9 + col];
      // Only consider cells without note-grid
      if (!cell.querySelector(".note-grid") && cell.textContent) {
        colNumbers.add(parseInt(cell.textContent));
      }
    }

    // Get missing numbers
    const missingNumbers = new Set();
    for (let i = 1; i <= 9; i++) {
      if (!colNumbers.has(i)) {
        missingNumbers.add(i);
      }
    }

    const noteCell = columnNotes.children[col];
    const noteGrid = noteCell.firstChild;

    Array.from(noteGrid.children).forEach((note) => (note.textContent = ""));

    missingNumbers.forEach((num) => {
      noteGrid.children[num - 1].textContent = num;
    });
  }
}

document.addEventListener("click", (e) => {
  // Check if click is outside the grid and its helper cells
  const gridWrapper = document.querySelector(".sudoku-grid-wrapper");
  const columnNotes = document.querySelector(".column-notes");
  if (!gridWrapper.contains(e.target) && !columnNotes.contains(e.target)) {
    // Deselect current cell
    const cells = Array.from(document.getElementsByClassName("cell"));
    cells.forEach((c) => {
      c.classList.remove("selected", "highlighted", "highlighted-match");
    });
    selectedCell = null;
  }
});

// Function to parse a puzzle string from the file format
function parsePuzzleString(puzzleString) {
  // Skip first 13 characters (12 hash + space)
  const digits = puzzleString.substring(13, 94);
  return digits.split("").map((d) => parseInt(d));
}

// Function to convert linear array to 2D board
function arrayToBoard(array) {
  const board = [];
  for (let i = 0; i < 9; i++) {
    board[i] = array.slice(i * 9, (i + 1) * 9);
  }
  return board;
}

// Function to load puzzles from file
async function loadPuzzles(difficulty) {
  const fileName = difficulty.toLowerCase() + ".txt";
  try {
    const response = await fetch(
      `sudoku-exchange-puzzle-bank-master/${fileName}`
    );
    const text = await response.text();
    const puzzles = text.split("\n").filter((line) => line.trim());
    // Get a random puzzle
    const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    return parsePuzzleString(randomPuzzle);
  } catch (error) {
    console.error("Error loading puzzles:", error);
    return null;
  }
}

async function setDifficultyNew(cells, difficultyText) {
  // Clear the grid first
  const cells2 = Array.from(document.getElementsByClassName("cell"));
  cells2.forEach((cell) => {
    cell.textContent = "";
    cell.classList.remove("initial", "error", "selected", "highlighted");
  });
  initialCells.clear();

  // Update difficulty text
  document.getElementById("difficulty-text").textContent = difficultyText;

  // Load and set up puzzle
  const puzzleArray = await loadPuzzles(difficultyText);
  if (!puzzleArray) {
    console.error("Failed to load puzzle");
    return;
  }

  const board = arrayToBoard(puzzleArray);

  // Fill the grid with the loaded puzzle
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const cell = cells2[i * 9 + j];
      if (board[i][j] !== 0) {
        cell.textContent = board[i][j];
        cell.classList.add("initial");
        initialCells.add(cell);
      }
    }
  }

  // Hide start screen and show game
  document.querySelector(".start-screen").style.display = "none";
  updateHelperCells();
}
