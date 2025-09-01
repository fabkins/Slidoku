class SlidokuGame {
    constructor() {
        console.log('Initializing SlidokuGame...');
        this.board = [];
        this.size = 4;
        this.emptyTile = { row: 3, col: 3 }; // Position of empty tile
        this.fixedTiles = []; // Array of fixed tile positions
        this.targetState = null; // Will store our goal state
        this.moves = 0;
        this.startTime = null;
        this.timer = null;

        // Ensure DOM is loaded before proceeding
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.init();
            });
        } else {
            this.init();
        }
    }

    init() {
        console.log('Running init...');
        try {
            this.initializeGame(true);
            this.setupEventListeners();
            this.setupModal();
            console.log('Initialization complete');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    setupModal() {
        console.log('Setting up modals...');
        // Setup target modal
        const targetModal = document.getElementById('targetModal');
        const targetBtn = document.getElementById('showTarget');
        const targetSpan = targetModal.querySelector('.close');

        if (!targetModal || !targetBtn || !targetSpan) {
            console.error('Target modal elements not found');
            return;
        }

        targetBtn.onclick = () => {
            console.log('Show target clicked');
            if (this.allowRevealing === true) {

                this.renderTargetBoard();
                targetModal.style.display = 'block';
            }
        };

        targetSpan.onclick = () => {
            targetModal.style.display = 'none';
        };

        // Setup instructions modal
        const instructionsModal = document.getElementById('instructionsModal');
        const instructionsBtn = document.getElementById('showInstructions');
        const instructionsSpan = instructionsModal.querySelector('.close');

        if (!instructionsModal || !instructionsBtn || !instructionsSpan) {
            console.error('Instructions modal elements not found');
            return;
        }

        instructionsBtn.onclick = () => {
            console.log('Show instructions clicked');
            instructionsModal.style.display = 'block';
        };

        instructionsSpan.onclick = () => {
            instructionsModal.style.display = 'none';
        };

        // Close modals when clicking outside
        window.onclick = (event) => {
            if (event.target === targetModal) {
                targetModal.style.display = 'none';
            }
            if (event.target === instructionsModal) {
                instructionsModal.style.display = 'none';
            }
        };
    }

    initializeGame() {
        console.log('Initializing game...');
        this.resetGame();

        // Get a new puzzle from the generator
        const puzzle = SlidokuPuzzleGenerator.generatePuzzle("2025-09-01", "Medium" );

        // Set up the game state from the puzzle
        this.board = puzzle.initialBoard;
        this.targetState = puzzle.targetBoard;
        this.fixedTiles = puzzle.fixedTiles;
        this.emptyTile = puzzle.emptyTile;
        this.size = puzzle.size;
        this.targetSum = puzzle.targetSum;
        this.allowRevealing = puzzle.allowRevealing;
        this.gameDifficulty = puzzle.gameDifficulty;
        this.puzzleNumber = puzzle.puzzleNumber;

        // Update reveal button state based on allowRevealing
        const revealButton = document.getElementById('showTarget');
        if (revealButton) {
            revealButton.disabled = !this.allowRevealing;
        }

        // Update difficulty and puzzle number displays
        const difficultySpan = document.getElementById('gameDifficulty');
        const puzzleNumberSpan = document.getElementById('puzzleNumber');
        if (difficultySpan) {
            difficultySpan.textContent = this.gameDifficulty;
        }
        if (puzzleNumberSpan) {
            puzzleNumberSpan.textContent = this.puzzleNumber;
        }

        this.renderBoard();
        this.updateSums();
    }

    randomizeFixedTiles(numFixedTiles = 2) {
        // Center 4 positions are at (1,1), (1,2), (2,1), and (2,2)
        const centerPositions = [
            { row: 1, col: 1 },
            { row: 1, col: 2 },
            { row: 2, col: 1 },
            { row: 2, col: 2 }
        ];

        // Filter out the position with the empty tile (0)
        const validPositions = centerPositions.filter(pos =>
            this.board[pos.row][pos.col] !== 0);

        // Clear existing fixed tiles
        this.fixedTiles = [];

        // Pick random positions without replacement
        while (this.fixedTiles.length < numFixedTiles && validPositions.length > 0) {
            const randomIndex = Math.floor(Math.random() * validPositions.length);
            const position = validPositions.splice(randomIndex, 1)[0];
            this.fixedTiles.push(position);
        }

        // Re-render the board to show the new fixed tile positions
        this.renderBoard();
        console.log('Fixed tiles randomized to:', this.fixedTiles);
    }

    resetGame() {
        this.moves = 0;
        this.startTime = null;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    checkWin() {
        // Check if all rows and columns sum to 34
        for (let i = 0; i < this.size; i++) {
            const rowSum = this.board[i].reduce((sum, val) => sum + val, 0);
            const colSum = this.board.reduce((sum, row) => sum + row[i], 0);
            if (rowSum !== 30 || colSum !== 30) {
                return false;
            }
        }

        // Calculate time taken
        const endTime = new Date();
        const timeDiff = Math.floor((endTime - this.startTime) / 1000); // in seconds
        const minutes = Math.floor(timeDiff / 60);
        const seconds = timeDiff % 60;

        // Create and show completion modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            max-width: 80%;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
        `;

        content.innerHTML = `
            <h2>Congratulations!</h2>
            <p>Puzzle completed in ${this.moves} moves</p>
            <p>Time: ${minutes}m ${seconds}s</p>
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Stop the timer
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        return true;
    }

    renderBoard() {
        const gameBoard = document.querySelector('.game-board');
        if (!gameBoard) {
            console.error('Game board element not found');
            return;
        }
        gameBoard.innerHTML = '';

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.row = i;
                tile.dataset.col = j;

                tile.textContent = this.board[i][j];

                // Add classes for special tiles
                if (i === this.emptyTile.row && j === this.emptyTile.col) {
                    tile.classList.add('empty');
                    tile.classList.add('light-text');
                }

                // Check if this position is a fixed tile
                if (this.fixedTiles.some(fixed => fixed.row === i && fixed.col === j)) {
                    tile.classList.add('fixed');
                }

                // Check if tile is in correct position
                if (this.targetState && this.board[i][j] === this.targetState[i][j] &&
                    this.board[i][j] !== 0) { // Don't highlight empty tile
                    tile.classList.add('correct-position');
                }

                gameBoard.appendChild(tile);
            }
        }
    }

    updateSums() {
        const rowSums = document.querySelector('.row-sums');
        const columnSums = document.querySelector('.column-sums');

        if (!rowSums || !columnSums) {
            console.error('Sum elements not found');
            return;
        }

        rowSums.innerHTML = '';
        columnSums.innerHTML = '';

        // Calculate and display row sums
        for (let i = 0; i < this.size; i++) {
            const sum = this.board[i].reduce((acc, val) => acc + val, 0);
            const sumDiv = document.createElement('div');
            sumDiv.textContent = sum;
            rowSums.appendChild(sumDiv);
        }

        // Calculate and display column sums
        for (let j = 0; j < this.size; j++) {
            const sum = this.board.reduce((acc, row) => acc + row[j], 0);
            const sumDiv = document.createElement('div');
            sumDiv.textContent = sum;
            columnSums.appendChild(sumDiv);
        }
    }

    isAdjacent(row1, col1, row2, col2) {
        return (
            (Math.abs(row1 - row2) === 1 && col1 === col2) ||
            (Math.abs(col1 - col2) === 1 && row1 === row2)
        );
    }

    async swapTiles(row1, col1, row2, col2, PcheckWin = true) {
        console.log('Attempting to swap tiles:', row1, col1, 'with', row2, col2);
        if (this.isAdjacent(row1, col1, row2, col2)) {
            // Don't allow moving any fixed tile
            const isFixed1 = this.fixedTiles.some(fixed => fixed.row === row1 && fixed.col === col1);
            const isFixed2 = this.fixedTiles.some(fixed => fixed.row === row2 && fixed.col === col2);
            if (isFixed1 || isFixed2) {
                console.log('Cannot move fixed tile');
                return;
            }

            // Start timer on first move
            if (this.startTime === null) {
                this.startTime = new Date();
            }

            // Increment move counter
            this.moves++;

            // Get the tile elements
            const tile1 = document.querySelector(`.tile[data-row="${row1}"][data-col="${col1}"]`);
            const tile2 = document.querySelector(`.tile[data-row="${row2}"][data-col="${col2}"]`);

            // Only animate if PcheckWin is true (during gameplay, not shuffling)
            if (PcheckWin && tile1 && tile2) {
                const gameBoard = document.querySelector('.game-board');
                const gridGap = 5; // matches CSS grid-gap
                const tileSize = 80; // matches CSS tile width/height

                // Clone the tile for animation
                const clone = tile1.cloneNode(true);
                clone.classList.add('sliding');

                // Calculate the starting position
                const startX = col1 * (tileSize + gridGap);
                const startY = row1 * (tileSize + gridGap);

                // Calculate the ending position
                const endX = col2 * (tileSize + gridGap);
                const endY = row2 * (tileSize + gridGap);

                // Position the clone absolutely
                clone.style.position = 'absolute';
                clone.style.left = `${startX}px`;
                clone.style.top = `${startY}px`;
                clone.style.margin = '0';
                clone.style.zIndex = '1000';

                // Add the clone to the game board
                gameBoard.appendChild(clone);

                // Start the animation
                requestAnimationFrame(() => {
                    clone.style.transform = `translate(${endX - startX}px, ${endY - startY}px)`;
                });

                // Wait for animation to complete and remove clone
                await new Promise(resolve => setTimeout(resolve, 200));
                clone.remove();
            }

            // Swap the values in the board array
            [this.board[row1][col1], this.board[row2][col2]] =
                [this.board[row2][col2], this.board[row1][col1]];

            // Update empty tile position
            if (row1 === this.emptyTile.row && col1 === this.emptyTile.col) {
                this.emptyTile = { row: row2, col: col2 };
            } else {
                this.emptyTile = { row: row1, col: col1 };
            }

            console.log('Swap successful, updating display');
            this.renderBoard();
            this.updateSums();

            // Check for win after updating sums
            if (PcheckWin) {
                this.checkWin();
            }
        } else {
            console.log('Tiles are not adjacent');
        }
    }

    getMovableTiles(clickedRow, clickedCol) {
        const tiles = [];
        const { row: emptyRow, col: emptyCol } = this.emptyTile;

        // If not in same row or column as empty tile, return empty array
        if (clickedRow !== emptyRow && clickedCol !== emptyCol) {
            return tiles;
        }

        if (clickedRow === emptyRow) {
            // Moving horizontally
            const start = Math.min(clickedCol, emptyCol);
            const end = Math.max(clickedCol, emptyCol);

            // Check for fixed tiles in between
            for (let col = start; col <= end; col++) {
                if (this.fixedTiles.some(fixed => fixed.row === clickedRow && fixed.col === col)) {
                    return []; // Fixed tile blocks the movement
                }
                if (col !== emptyCol) {
                    tiles.push({ row: clickedRow, col: col });
                }
            }
        } else if (clickedCol === emptyCol) {
            // Moving vertically
            const start = Math.min(clickedRow, emptyRow);
            const end = Math.max(clickedRow, emptyRow);

            // Check for fixed tiles in between
            for (let row = start; row <= end; row++) {
                if (this.fixedTiles.some(fixed => fixed.row === row && fixed.col === clickedCol)) {
                    return []; // Fixed tile blocks the movement
                }
                if (row !== emptyRow) {
                    tiles.push({ row: row, col: clickedCol });
                }
            }
        }

        // Sort tiles based on distance to empty space - closest first
        return tiles.sort((a, b) => {
            const distA = Math.abs(a.row - emptyRow) + Math.abs(a.col - emptyCol);
            const distB = Math.abs(b.row - emptyRow) + Math.abs(b.col - emptyCol);
            return distA - distB; // Sort by distance to empty tile
        });
    }

    setupEventListeners() {
        const gameBoard = document.querySelector('.game-board');
        if (!gameBoard) {
            console.error('Game board element not found');
            return;
        }

        gameBoard.addEventListener('click', (e) => {
            const tile = e.target.closest('.tile');
            if (!tile) return;

            const clickedRow = parseInt(tile.dataset.row);
            const clickedCol = parseInt(tile.dataset.col);

            // Get all tiles that need to move
            const tilesToMove = this.getMovableTiles(clickedRow, clickedCol);

            if (tilesToMove.length > 0) {
                // Move tiles one by one towards the empty space
                let currentEmptyRow = this.emptyTile.row;
                let currentEmptyCol = this.emptyTile.col;

                // Use async/await to handle sequential animations
                (async () => {
                    for (const { row, col } of tilesToMove) {
                        await this.swapTiles(row, col, currentEmptyRow, currentEmptyCol);
                        currentEmptyRow = row;
                        currentEmptyCol = col;
                    }
                })();
            }
        });

        const newGameButton = document.getElementById('newGame');

        if (newGameButton) {
            newGameButton.addEventListener('click', () => {
                console.log('New game clicked');
                this.initializeGame(true); // Always preserve one edge in new games
            });
        } else {
            console.error('New game button not found');
        }
    }

    renderTargetBoard() {
        console.log('Rendering target board...');
        const targetBoard = document.querySelector('.target-board');
        if (!targetBoard || !this.targetState) {
            console.error('Target board element or target state not found');
            return;
        }

        targetBoard.innerHTML = '';

        // Find where 0 is in the target state
        let targetEmptyTile = { row: 0, col: 0 };
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.targetState[i][j] === 0) {
                    targetEmptyTile = { row: i, col: j };
                    break;
                }
            }
        }

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';

                tile.textContent = this.targetState[i][j];
                if (i === targetEmptyTile.row && j === targetEmptyTile.col) {
                    tile.classList.add('empty');
                    tile.classList.add('light-text');
                }

                // Check if this position is a fixed tile
                if (this.fixedTiles.some(fixed => fixed.row === i && fixed.col === j)) {
                    tile.classList.add('fixed');
                }

                targetBoard.appendChild(tile);
            }
        }
    }

}

// Start the game when the page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    try {
        game = new SlidokuGame();
    } catch (error) {
        console.error('Error creating game:', error);
    }
});
