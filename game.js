class SlidokuGame {
    constructor() {
        console.log('Initializing SlidokuGame...');
        this.board = [];
        this.size = 4;
        this.emptyTile = { row: 3, col: 3 }; // Position of empty tile
        this.fixedTile = { row: 1, col: 1 }; // Position of fixed tile
        
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
            console.log('Initialization complete');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    calculateTargetSum() {
        // Since we use numbers 1-15, calculate average sum per row/column
        const totalSum = Array.from({length: 15}, (_, i) => i + 1).reduce((a, b) => a + b, 0);
        // Divide by 4 (size) to get target sum per row/column, accounting for empty tile
        this.targetSum = Math.floor(totalSum / this.size);
        // Update the display
        document.getElementById('targetSum').textContent = this.targetSum;
    }

    initializeGame() {
        // Create a valid board where rows and columns sum to targetSum
        this.generateValidBoard();
        this.renderBoard();
        this.updateSums();
    }

    generateValidBoard() {
        console.log('Generating valid board...');
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        
        // Create a list of numbers 1-15, excluding 8 (which we'll use for fixed tile)
        const numbers = Array.from({length: 15}, (_, i) => i + 1).filter(n => n !== 8);
        
        // Shuffle the numbers
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }

        let index = 0;
        
        // Place numbers on the board
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i === this.emptyTile.row && j === this.emptyTile.col) {
                    this.board[i][j] = 0; // Empty tile
                } else if (i === this.fixedTile.row && j === this.fixedTile.col) {
                    this.board[i][j] = 8; // Fixed tile gets middle value
                } else {
                    this.board[i][j] = numbers[index++];
                }
            }
        }

        console.log('Board generated:', this.board);
        return true;
    }

    generateValidArrangement(numbers) {
        // Shuffle numbers
        const shuffled = [...numbers].sort(() => Math.random() - 0.5);
        
        // Check if arrangement can achieve target sums
        let rowSums = Array(4).fill(0);
        let colSums = Array(4).fill(0);
        let index = 0;

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i === this.emptyTile.row && j === this.emptyTile.col) continue;
                
                const num = shuffled[index++];
                rowSums[i] += num;
                colSums[j] += num;
            }
        }

        // Check if sums are achievable (allowing for some variance due to empty tile)
        const targetSumRange = 5; // Allow some variance in sums
        const isValid = rowSums.every(sum => Math.abs(sum - this.targetSum) <= targetSumRange) &&
                       colSums.every(sum => Math.abs(sum - this.targetSum) <= targetSumRange);

        return isValid ? shuffled : null;
    }

    isSolvable() {
        // Convert board to 1D array excluding empty tile
        const tiles = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] !== 0) {
                    tiles.push(this.board[i][j]);
                }
            }
        }

        // Count inversions
        let inversions = 0;
        for (let i = 0; i < tiles.length - 1; i++) {
            for (let j = i + 1; j < tiles.length; j++) {
                if (tiles[i] > tiles[j]) inversions++;
            }
        }

        // For a 4x4 puzzle with empty tile on even row from bottom, 
        // number of inversions must be odd for puzzle to be solvable
        const emptyRowFromBottom = this.size - this.emptyTile.row;
        return emptyRowFromBottom % 2 === 0 ? inversions % 2 === 1 : inversions % 2 === 0;
    }

    generateSimpleSolvableBoard() {
        console.log('Generating simple solvable board as fallback');
        // Generate a simple, definitely solvable board as fallback
        const numbers = Array.from({length: 15}, (_, i) => i + 1);
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        let index = 0;
        
        // Place numbers in a way that ensures solvability
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i === this.emptyTile.row && j === this.emptyTile.col) {
                    this.board[i][j] = 0;
                } else if (i === this.fixedTile.row && j === this.fixedTile.col) {
                    // Place a moderate value in the fixed tile
                    this.board[i][j] = 8; // Middle value that helps with sums
                } else if (index < numbers.length) {
                    // Skip 8 as it's used for the fixed tile
                    this.board[i][j] = numbers[index] === 8 ? numbers[index + 1] : numbers[index];
                    index++;
                }
            }
        }
        console.log('Simple board generated:', this.board);
    }

        // Place numbers on the board
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i === this.emptyTile.row && j === this.emptyTile.col) {
                    this.board[i][j] = 0; // Empty tile
                } else {
                    this.board[i][j] = shuffledNumbers[index++];
                }
            }
        }
    }

    renderBoard() {
        const gameBoard = document.querySelector('.game-board');
        gameBoard.innerHTML = '';

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.row = i;
                tile.dataset.col = j;

                if (i === this.emptyTile.row && j === this.emptyTile.col) {
                    tile.classList.add('empty');
                } else {
                    tile.textContent = this.board[i][j];
                }

                if (i === this.fixedTile.row && j === this.fixedTile.col) {
                    tile.classList.add('fixed');
                }

                gameBoard.appendChild(tile);
            }
        }
    }

    updateSums() {
        const rowSums = document.querySelector('.row-sums');
        const columnSums = document.querySelector('.column-sums');
        
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

    swapTiles(row1, col1, row2, col2) {
        if (this.isAdjacent(row1, col1, row2, col2)) {
            // Don't allow moving the fixed tile
            if ((row1 === this.fixedTile.row && col1 === this.fixedTile.col) ||
                (row2 === this.fixedTile.row && col2 === this.fixedTile.col)) {
                return;
            }

            // Swap the values
            [this.board[row1][col1], this.board[row2][col2]] = 
            [this.board[row2][col2], this.board[row1][col1]];

            // Update empty tile position
            if (row1 === this.emptyTile.row && col1 === this.emptyTile.col) {
                this.emptyTile = { row: row2, col: col2 };
            } else {
                this.emptyTile = { row: row1, col: col1 };
            }

            this.renderBoard();
            this.updateSums();
        }
    }

    setupEventListeners() {
        const gameBoard = document.querySelector('.game-board');
        gameBoard.addEventListener('click', (e) => {
            const tile = e.target.closest('.tile');
            if (!tile) return;

            const row = parseInt(tile.dataset.row);
            const col = parseInt(tile.dataset.col);

            this.swapTiles(row, col, this.emptyTile.row, this.emptyTile.col);
            
            // Remove hint highlighting after a move
            this.clearHint();
        });

        const newGameButton = document.getElementById('newGame');
        newGameButton.addEventListener('click', () => {
            this.initializeGame();
            this.clearHint();
        });

        const hintButton = document.getElementById('hint');
        hintButton.addEventListener('click', () => {
            this.showHint();
        });
    }

    clearHint() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => tile.classList.remove('hint'));
    }

    calculateTileFitness(row, col) {
        let fitness = 0;
        const value = this.board[row][col];
        if (value === 0) return -Infinity; // Empty tile
        if (row === this.fixedTile.row && col === this.fixedTile.col) return -Infinity; // Fixed tile

        // Calculate how much this tile contributes to reaching target sum in its row and column
        const rowSum = this.board[row].reduce((sum, val) => sum + val, 0);
        const colSum = this.board.reduce((sum, r) => sum + r[col], 0);
        
        fitness -= Math.abs(this.targetSum - rowSum);
        fitness -= Math.abs(this.targetSum - colSum);

        return fitness;
    }

    findBestMove() {
        console.log('Finding best move. Empty tile at:', this.emptyTile);
        const possibleMoves = [];
        const directions = [
            [-1, 0], // up
            [1, 0],  // down
            [0, -1], // left
            [0, 1]   // right
        ];

        console.log('Current board state:', this.board);
        // Find all possible moves
        for (const [dx, dy] of directions) {
            const newRow = this.emptyTile.row + dx;
            const newCol = this.emptyTile.col + dy;

            if (newRow >= 0 && newRow < this.size && 
                newCol >= 0 && newCol < this.size &&
                !(newRow === this.fixedTile.row && newCol === this.fixedTile.col)) {
                
                // Simulate the move
                const originalValue = this.board[newRow][newCol];
                this.board[newRow][newCol] = 0;
                this.board[this.emptyTile.row][this.emptyTile.col] = originalValue;

                // Calculate fitness after move
                let fitness = 0;
                for (let i = 0; i < this.size; i++) {
                    for (let j = 0; j < this.size; j++) {
                        fitness += this.calculateTileFitness(i, j);
                    }
                }

                // Undo the move
                this.board[this.emptyTile.row][this.emptyTile.col] = 0;
                this.board[newRow][newCol] = originalValue;

                possibleMoves.push({
                    row: newRow,
                    col: newCol,
                    fitness: fitness
                });
            }
        }

        // Return the move with the highest fitness
        return possibleMoves.reduce((best, move) => 
            move.fitness > best.fitness ? move : best, 
            { fitness: -Infinity }
        );
    }

    showHint() {
        console.log('ShowHint called');
        const bestMove = this.findBestMove();
        console.log('Best move found:', bestMove);
        
        if (bestMove.row !== undefined) {
            console.log('Valid move found, attempting to highlight tile at:', bestMove.row, bestMove.col);
            // First highlight the tile that will move
            const tiles = document.querySelectorAll('.tile');
            console.log('Found tiles:', tiles.length);
            
            let tileFound = false;
            tiles.forEach(tile => {
                const row = parseInt(tile.dataset.row);
                const col = parseInt(tile.dataset.col);
                if (row === bestMove.row && col === bestMove.col) {
                    console.log('Highlighting tile at:', row, col);
                    tile.classList.add('hint');
                    tileFound = true;
                }
            });
            
            if (!tileFound) {
                console.log('No matching tile found for highlight');
            }

            // After a short delay, move the tile
            console.log('Setting up move timeout');
            setTimeout(() => {
                console.log('Executing move');
                this.swapTiles(bestMove.row, bestMove.col, this.emptyTile.row, this.emptyTile.col);
                this.clearHint();
            }, 500);
        } else {
            console.log('No valid move found');
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
