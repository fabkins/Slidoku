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
            this.calculateTargetSum();
            this.initializeGame();
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
            this.renderTargetBoard();
            targetModal.style.display = 'block';
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

    calculateTargetSum() {
        // For a 4x4 magic square, the sum is always 30
        this.targetSum = 30;
        document.getElementById('targetSum').textContent = this.targetSum;
        console.log('Target sum set to:', this.targetSum);
    }

    initializeGame() {
        console.log('Initializing game...');
        this.resetGame();
        this.fixedTiles = []; // Initialize empty array first
        this.generateBoard();
        this.randomizeFixedTiles(1); // Start with 2 fixed tiles
        this.shuffleBoard(1000, true);
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


    generateBoard() {
        console.log('Generating board...');
        const MAGIC_SEEDS = [
            [
                [15, 1, 2, 12],
                [4, 10, 9, 7],
                [8, 6, 5, 11],
                [3, 13, 14, 0]
            ],
            [
                [14, 0, 3, 13],
                [1, 15, 12, 2],
                [9, 7, 10, 4],
                [6, 8, 5, 11]
            ],
            [
                [13, 3, 0, 14],
                [2, 12, 15, 1],
                [4, 10, 7, 9],
                [11, 5, 8, 6]
            ],
            [
                [11, 5, 8, 6],
                [4, 10, 7, 9],
                [2, 12, 15, 1],
                [13, 3, 0, 14]
            ],
            [
                [9, 7, 4, 10],
                [6, 8, 11, 5],
                [15, 1, 2, 12],
                [0, 14, 13, 3]
            ],

        ];
        // Base 4x4 magic square (rows/cols sum = 30 with 0–15)
        // let magicSquare = [
        //     [15, 1, 2, 12],
        //     [4, 10, 9, 7],
        //     [8, 6, 5, 11],
        //     [3, 13, 14, 0]
        // ];

        // Run routine that validates that the magic square seeds are valid, ensuring all numbers 0-15 are present
        // that each row adds up to 30 and each column adds up to 30

        const isValidMagicSquare = (square) => {
            const size = square.length;
            const magicSum = 30;

            // Check if all numbers 0-15 are present exactly once
            const numbers = new Set();
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    const num = square[i][j];
                    // Check if number is in valid range
                    if (num < 0 || num > 15) return false;
                    // Check if number is already seen
                    if (numbers.has(num)) return false;
                    numbers.add(num);
                }
            }
            // Check if all numbers 0-15 are present
            if (numbers.size !== 16) return false;

            // Check rows
            for (let i = 0; i < size; i++) {
                const rowSum = square[i].reduce((a, b) => a + b, 0);
                if (rowSum !== magicSum) return false;
            }

            // Check columns
            for (let j = 0; j < size; j++) {
                const colSum = square.reduce((a, b) => a + b[j], 0);
                if (colSum !== magicSum) return false;
            }

            return true;
        };
        for (const seed of MAGIC_SEEDS) {
            if (isValidMagicSquare(seed)) {
                console.log('Valid magic square found:', seed);
            }
            else {
                // log the invalid magic square
                console.log('Invalid magic square found:', seed);
            }
        }

        let magicSquare = MAGIC_SEEDS[Math.floor(Math.random() * MAGIC_SEEDS.length)]
            .map(row => [...row]);

        // Helper: rotate 90 degrees
        const rotate90 = (grid) => {
            const n = grid.length;
            let newGrid = Array(n).fill().map(() => Array(n).fill(0));
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    newGrid[j][n - i - 1] = grid[i][j];
                }
            }
            return newGrid;
        };

        // Helper: reflect horizontally
        const reflectH = (grid) => grid.map(row => [...row].reverse());

        // Apply random symmetries
        let r = Math.floor(Math.random() * 4); // 0–3 rotations
        for (let i = 0; i < r; i++) {
            magicSquare = rotate90(magicSquare);
        }
        if (Math.random() < 0.5) {
            magicSquare = reflectH(magicSquare);
        }

        // Random row swaps (within pairs)
        if (Math.random() < 0.5) [magicSquare[0], magicSquare[1]] = [magicSquare[1], magicSquare[0]];
        if (Math.random() < 0.5) [magicSquare[2], magicSquare[3]] = [magicSquare[3], magicSquare[2]];

        // Random column swaps (within pairs)
        if (Math.random() < 0.5) {
            for (let i = 0; i < 4; i++) {
                [magicSquare[i][0], magicSquare[i][1]] = [magicSquare[i][1], magicSquare[i][0]];
            }
        }
        if (Math.random() < 0.5) {
            for (let i = 0; i < 4; i++) {
                [magicSquare[i][2], magicSquare[i][3]] = [magicSquare[i][3], magicSquare[i][2]];
            }
        }

        // Save this as our target state first
        this.targetState = magicSquare.map(row => [...row]);

        // Then create our game board from it
        this.board = magicSquare.map(row => [...row]);

        // Find the empty tile (0)
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (magicSquare[i][j] === 0) {
                    this.emptyTile = { row: i, col: j };
                    break;
                }
            }
        }

        console.log('Target state:', this.targetState);
        console.log('Initial board:', this.board);
    }




    shuffleBoard(moves = 1000, dontShuffleOneEdge = false) {
        console.log(`Shuffling board with ${moves} random moves... ${dontShuffleOneEdge ? 'One edge preserved' : ''}`);
        let lastMoved = null; // Keep track of the last tile we moved
        
        // Determine which edge to preserve (the one without the empty tile)
        let edgeToPreserve = null;
        if (dontShuffleOneEdge) {
            if (this.emptyTile.row !== 0) edgeToPreserve = 0; // preserve top edge
            else if (this.emptyTile.row !== this.size - 1) edgeToPreserve = this.size - 1; // preserve bottom edge
            else if (this.emptyTile.col !== 0) edgeToPreserve = -1; // preserve left edge (-1 means left)
            else edgeToPreserve = -2; // preserve right edge (-2 means right)
        }

        for (let i = 0; i < moves; i++) {
            const { row, col } = this.emptyTile;

            // Find valid neighbors (tiles adjacent to empty)
            let neighbors = [];
            if (row > 0) neighbors.push([row - 1, col]); // up
            if (row < this.size - 1) neighbors.push([row + 1, col]); // down
            if (col > 0) neighbors.push([row, col - 1]); // left
            if (col < this.size - 1) neighbors.push([row, col + 1]); // right

            // Filter out any fixed tiles (cannot be moved)
            neighbors = neighbors.filter(([r, c]) =>
                !this.fixedTiles.some(fixed => fixed.row === r && fixed.col === c));

            // If dontShuffleOneEdge is true, don't allow moving tiles from the preserved edge
            if (dontShuffleOneEdge && edgeToPreserve !== null) {
                if (edgeToPreserve >= 0) { // top or bottom edge
                    neighbors = neighbors.filter(([r, c]) => r !== edgeToPreserve);
                } else if (edgeToPreserve === -1) { // left edge
                    neighbors = neighbors.filter(([r, c]) => c !== 0);
                } else { // right edge
                    neighbors = neighbors.filter(([r, c]) => c !== this.size - 1);
                }
            }

            // Filter out the last moved tile if we have other options
            if (lastMoved && neighbors.length > 1) {
                const betterNeighbors = neighbors.filter(([r, c]) =>
                    !(r === lastMoved[0] && c === lastMoved[1]));
                if (betterNeighbors.length > 0) {
                    neighbors = betterNeighbors;
                }
            }

            if (neighbors.length === 0) continue; // rare edge case

            // Pick a random valid neighbor and swap with the empty tile
            const [r2, c2] = neighbors[Math.floor(Math.random() * neighbors.length)];
            lastMoved = [row, col]; // Remember where the empty tile was
            this.swapTiles(row, col, r2, c2, false);
        }

        this.moves = 0;
        console.log("Board shuffled:", this.board);
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

    showHint() {
        console.log('ShowHint called');
        const bestMove = this.findBestMove();

        if (bestMove && bestMove.row !== undefined) {
            console.log('Moving tile at:', bestMove.row, bestMove.col);
            this.swapTiles(bestMove.row, bestMove.col, this.emptyTile.row, this.emptyTile.col);
        } else {
            console.log('No valid move found');
        }
    }

    findBestMove() {
        console.log('Finding best move. Empty tile at:', this.emptyTile);

        // Generate target state if not exists
        if (!this.targetState) {
            this.generateTargetState();
        }

        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
        let bestMove = null;
        let bestScore = -Infinity;

        // Clear move history if it's getting too large
        if (this.moveHistory.size > 20) {
            this.moveHistory.clear();
        }

        for (const [dx, dy] of directions) {
            const newRow = this.emptyTile.row + dx;
            const newCol = this.emptyTile.col + dy;

            if (newRow >= 0 && newRow < this.size &&
                newCol >= 0 && newCol < this.size &&
                !(newRow === this.fixedTile.row && newCol === this.fixedTile.col)) {

                // Check if this move would create a loop
                const moveKey = `${newRow},${newCol}`;
                if (this.moveHistory.has(moveKey)) {
                    continue;
                }

                // Try the move
                const originalValue = this.board[newRow][newCol];
                this.board[newRow][newCol] = 0;
                this.board[this.emptyTile.row][this.emptyTile.col] = originalValue;

                const score = this.calculateMoveScore(originalValue, newRow, newCol);

                // Undo the move
                this.board[this.emptyTile.row][this.emptyTile.col] = 0;
                this.board[newRow][newCol] = originalValue;

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { row: newRow, col: newCol };
                }
            }
        }

        // Add chosen move to history
        if (bestMove) {
            this.moveHistory.add(`${bestMove.row},${bestMove.col}`);
        }

        console.log('Best move found:', bestMove);
        return bestMove;
    }

    generateTargetState() {
        // Create an ideal arrangement where sums are closest to target
        let numbers = Array.from({ length: 15 }, (_, i) => i + 1).filter(n => n !== 8);
        numbers.sort((a, b) => a - b);

        this.targetState = Array(this.size).fill().map(() => Array(this.size).fill(0));
        let small = 0;
        let large = numbers.length - 1;

        // Distribute numbers to balance row and column sums
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i === this.fixedTile.row && j === this.fixedTile.col) {
                    this.targetState[i][j] = 8;
                } else if (i === this.emptyTile.row && j === this.emptyTile.col) {
                    this.targetState[i][j] = 0;
                } else {
                    // Alternate between small and large numbers to balance sums
                    this.targetState[i][j] = (i + j) % 2 === 0 ? numbers[small++] : numbers[large--];
                }
            }
        }
        console.log('Target state generated:', this.targetState);
    }

    calculateMoveScore(value, newRow, newCol) {
        let score = 0;

        // 1. Distance to target position
        if (this.targetState) {
            const targetPos = this.findTargetPosition(value);
            if (targetPos) {
                score -= (Math.abs(targetPos.row - newRow) + Math.abs(targetPos.col - newCol));
            }
        }

        // 2. Row and column sum improvements
        const rowSum = this.board[newRow].reduce((sum, val) => sum + val, 0);
        const colSum = this.board.reduce((sum, row) => sum + row[newCol], 0);
        score -= Math.abs(rowSum - this.targetSum) + Math.abs(colSum - this.targetSum);

        // 3. Penalty for recent moves to avoid loops
        const moveKey = `${newRow},${newCol}`;
        if (this.moveHistory.has(moveKey)) {
            score -= 1000;
        }

        return score;
    }

    findTargetPosition(value) {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.targetState[i][j] === value) {
                    return { row: i, col: j };
                }
            }
        }
        return null;
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
                this.initializeGame();
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
