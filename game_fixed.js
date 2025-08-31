class SlidokuGame {
    constructor() {
        console.log('Initializing SlidokuGame...');
        this.board = [];
        this.size = 4;
        this.emptyTile = { row: 3, col: 3 }; // Position of empty tile
        this.fixedTile = { row: 1, col: 1 }; // Position of fixed tile
        this.moveHistory = new Set(); // Track previous positions to avoid loops
        this.targetState = null; // Will store our goal state
        
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
        console.log('Setting up modal...');
        const modal = document.getElementById('targetModal');
        const btn = document.getElementById('showTarget');
        const span = document.getElementsByClassName('close')[0];

        if (!modal || !btn || !span) {
            console.error('Modal elements not found');
            return;
        }

        btn.onclick = () => {
            console.log('Show target clicked');
            this.renderTargetBoard();
            modal.style.display = 'block';
        };

        span.onclick = () => {
            modal.style.display = 'none';
        };

        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
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
        // First, generate our target state
        this.targetState = this.generateTargetState();
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
        let numbers = Array.from({length: 15}, (_, i) => i + 1).filter(n => n !== 8);
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

    renderTargetBoard() {
        console.log('Rendering target board...');
        const targetBoard = document.querySelector('.target-board');
        if (!targetBoard || !this.targetState) {
            console.error('Target board element or target state not found');
            return;
        }

        targetBoard.innerHTML = '';
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                
                if (i === this.emptyTile.row && j === this.emptyTile.col) {
                    tile.classList.add('empty');
                } else {
                    tile.textContent = this.targetState[i][j];
                }

                if (i === this.fixedTile.row && j === this.fixedTile.col) {
                    tile.classList.add('fixed');
                }

                targetBoard.appendChild(tile);
            }
        }
    }

    generateTargetState() {
        console.log('Generating target state...');
        // Create numbers 1-15 excluding 8 (which will be our fixed tile)
        const numbers = Array.from({length: 15}, (_, i) => i + 1).filter(n => n !== 8);
        const board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        let index = 0;

        // Place numbers ensuring fixed tile is 8 and respecting sum constraints
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i === this.emptyTile.row && j === this.emptyTile.col) {
                    board[i][j] = 0;
                } else if (i === this.fixedTile.row && j === this.fixedTile.col) {
                    board[i][j] = 8;
                } else {
                    board[i][j] = numbers[index++];
                }
            }
        }

        return board;
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
