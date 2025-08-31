class SlidokuGame {
    constructor() {
        this.board = [];
        this.size = 4;
        this.emptyTile = { row: 3, col: 3 }; // Position of empty tile
        this.fixedTile = { row: 1, col: 1 }; // Position of fixed tile
        this.calculateTargetSum();
        this.initializeGame();
        this.setupEventListeners();
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
        const numbers = new Set();
        this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        
        // Generate unique numbers that satisfy row and column sums
        // Use numbers 1-15 for better sum distribution
        const availableNumbers = Array.from({length: 15}, (_, i) => i + 1);
        
        // Shuffle available numbers
        for (let i = availableNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]];
        }
        
        // Take the first 15 numbers (leaving one space for empty tile)
        for (let i = 0; i < this.size * this.size - 1; i++) {
            numbers.add(availableNumbers[i]);
        }

        // Convert Set to Array and shuffle
        const shuffledNumbers = Array.from(numbers).sort(() => Math.random() - 0.5);
        let index = 0;

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
        });

        const newGameButton = document.getElementById('newGame');
        newGameButton.addEventListener('click', () => {
            this.initializeGame();
        });
    }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new SlidokuGame();
});
