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
        // Calculate sum excluding the value 8 (which will be the fixed tile)
        const numbers = Array.from({length: 15}, (_, i) => i + 1).filter(n => n !== 8);
        const totalSum = numbers.reduce((a, b) => a + b, 0) + 8; // Add back the fixed tile value
        this.targetSum = Math.floor(totalSum / this.size);
        document.getElementById('targetSum').textContent = this.targetSum;
        console.log('Target sum calculated:', this.targetSum);
    }

    initializeGame() {
        console.log('Initializing game...');
        this.generateBoard();
        this.renderBoard();
        this.updateSums();
    }

    generateBoard() {
        console.log('Generating board...');
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
                } else if (index < numbers.length) {
                    this.board[i][j] = numbers[index++];
                }
            }
        }
        console.log('Board generated:', this.board);
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

    swapTiles(row1, col1, row2, col2) {
        console.log('Attempting to swap tiles:', row1, col1, 'with', row2, col2);
        if (this.isAdjacent(row1, col1, row2, col2)) {
            // Don't allow moving the fixed tile
            if ((row1 === this.fixedTile.row && col1 === this.fixedTile.col) ||
                (row2 === this.fixedTile.row && col2 === this.fixedTile.col)) {
                console.log('Cannot move fixed tile');
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

            console.log('Swap successful, updating display');
            this.renderBoard();
            this.updateSums();
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
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
        let bestMove = null;
        let bestImprovement = -Infinity;

        for (const [dx, dy] of directions) {
            const newRow = this.emptyTile.row + dx;
            const newCol = this.emptyTile.col + dy;

            if (newRow >= 0 && newRow < this.size && 
                newCol >= 0 && newCol < this.size &&
                !(newRow === this.fixedTile.row && newCol === this.fixedTile.col)) {
                
                // Try the move
                const originalValue = this.board[newRow][newCol];
                this.board[newRow][newCol] = 0;
                this.board[this.emptyTile.row][this.emptyTile.col] = originalValue;

                const newFitness = this.calculateBoardFitness();

                // Undo the move
                this.board[this.emptyTile.row][this.emptyTile.col] = 0;
                this.board[newRow][newCol] = originalValue;

                if (newFitness > bestImprovement) {
                    bestImprovement = newFitness;
                    bestMove = { row: newRow, col: newCol };
                }
            }
        }

        console.log('Best move found:', bestMove);
        return bestMove;
    }

    calculateBoardFitness() {
        let fitness = 0;
        
        // Calculate row fitness
        for (let i = 0; i < this.size; i++) {
            const rowSum = this.board[i].reduce((sum, val) => sum + val, 0);
            fitness -= Math.abs(rowSum - this.targetSum);
        }
        
        // Calculate column fitness
        for (let j = 0; j < this.size; j++) {
            const colSum = this.board.reduce((sum, row) => sum + row[j], 0);
            fitness -= Math.abs(colSum - this.targetSum);
        }
        
        return fitness;
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

            const row = parseInt(tile.dataset.row);
            const col = parseInt(tile.dataset.col);
            this.swapTiles(row, col, this.emptyTile.row, this.emptyTile.col);
        });

        const newGameButton = document.getElementById('newGame');
        const hintButton = document.getElementById('hint');

        if (newGameButton) {
            newGameButton.addEventListener('click', () => {
                console.log('New game clicked');
                this.initializeGame();
            });
        } else {
            console.error('New game button not found');
        }

        if (hintButton) {
            hintButton.addEventListener('click', () => {
                console.log('Hint button clicked');
                this.showHint();
            });
        } else {
            console.error('Hint button not found');
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
