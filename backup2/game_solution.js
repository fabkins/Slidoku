class SlidokuGame {
    constructor() {
        console.log('Initializing SlidokuGame...');
        this.board = [];
        this.size = 4;
        this.emptyTile = { row: 3, col: 3 }; // Position of empty tile
        this.fixedTile = { row: 1, col: 1 }; // Position of fixed tile
        this.targetSum = 30;
        this.solutionBoard = null; // Will store the solved state
        this.moveCount = 0;
        
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
            this.initializeGame();
            this.setupEventListeners();
            this.setupModal();
            console.log('Initialization complete');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    setupModal() {
        const modal = document.getElementById('targetModal');
        const btn = document.getElementById('showTarget');
        const span = document.getElementsByClassName('close')[0];

        btn.onclick = () => {
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

    generateSolvedBoard() {
        console.log('Generating solved board...');
        // Create numbers 1-15 excluding 8 (which will be our fixed tile)
        const numbers = Array.from({length: 15}, (_, i) => i + 1).filter(n => n !== 8);
        
        let attempts = 0;
        let validBoard = null;

        while (!validBoard && attempts < 100) {
            attempts++;
            // Shuffle numbers
            for (let i = numbers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
            }

            // Create a board with the shuffled numbers
            const board = Array(this.size).fill().map(() => Array(this.size).fill(0));
            let index = 0;

            // Place numbers ensuring fixed tile is 8
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

            // Check if this board satisfies our sum constraints
            if (this.isBoardValid(board)) {
                validBoard = board;
            }
        }

        if (!validBoard) {
            console.error('Could not generate valid board');
            return this.generateSimpleBoard();
        }

        return validBoard;
    }

    generateSimpleBoard() {
        // Create a simple valid board as fallback
        const board = Array(this.size).fill().map(() => Array(this.size).fill(0));
        let num = 1;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i === this.emptyTile.row && j === this.emptyTile.col) {
                    board[i][j] = 0;
                } else if (i === this.fixedTile.row && j === this.fixedTile.col) {
                    board[i][j] = 8;
                } else {
                    board[i][j] = num++;
                    if (num === 8) num++; // Skip 8 as it's used for fixed tile
                }
            }
        }
        return board;
    }

    isBoardValid(board) {
        // Check row sums
        for (let i = 0; i < this.size; i++) {
            const rowSum = board[i].reduce((sum, val) => sum + val, 0);
            if (rowSum !== this.targetSum && i !== this.emptyTile.row) {
                return false;
            }
        }

        // Check column sums
        for (let j = 0; j < this.size; j++) {
            const colSum = board.reduce((sum, row) => sum + row[j], 0);
            if (colSum !== this.targetSum && j !== this.emptyTile.col) {
                return false;
            }
        }

        return true;
    }

    initializeGame() {
        console.log('Initializing game...');
        // Generate a solved board first
        this.solutionBoard = this.generateSolvedBoard();
        console.log('Solution board:', this.solutionBoard);

        // Create initial board by making random valid moves from solution
        this.board = this.solutionBoard.map(row => [...row]);
        this.shuffleBoard();
        
        this.renderBoard();
        this.updateSums();
    }

    shuffleBoard() {
        // Make 100 random valid moves to shuffle the board
        const moves = 100;
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
        
        for (let i = 0; i < moves; i++) {
            const validMoves = [];
            
            // Find all valid moves
            for (const [dx, dy] of directions) {
                const newRow = this.emptyTile.row + dx;
                const newCol = this.emptyTile.col + dy;
                
                if (newRow >= 0 && newRow < this.size && 
                    newCol >= 0 && newCol < this.size &&
                    !(newRow === this.fixedTile.row && newCol === this.fixedTile.col)) {
                    validMoves.push({ row: newRow, col: newCol });
                }
            }
            
            if (validMoves.length > 0) {
                // Make a random valid move
                const move = validMoves[Math.floor(Math.random() * validMoves.length)];
                this.swapTiles(move.row, move.col, this.emptyTile.row, this.emptyTile.col);
            }
        }
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

    renderTargetBoard() {
        const targetBoard = document.querySelector('.target-board');
        targetBoard.innerHTML = '';

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                
                if (i === this.emptyTile.row && j === this.emptyTile.col) {
                    tile.classList.add('empty');
                } else {
                    tile.textContent = this.solutionBoard[i][j];
                }

                if (i === this.fixedTile.row && j === this.fixedTile.col) {
                    tile.classList.add('fixed');
                }

                targetBoard.appendChild(tile);
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

            // Check if puzzle is solved
            if (this.isSolved()) {
                setTimeout(() => {
                    alert('Congratulations! You solved the puzzle!');
                }, 100);
            }
        } else {
            console.log('Tiles are not adjacent');
        }
    }

    isSolved() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.board[i][j] !== this.solutionBoard[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }

    showHint() {
        console.log('ShowHint called');
        const move = this.findBestMove();
        
        if (move) {
            console.log('Moving tile at:', move.row, move.col);
            this.swapTiles(move.row, move.col, this.emptyTile.row, this.emptyTile.col);
        } else {
            console.log('No valid move found');
        }
    }

    findBestMove() {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
        let bestMove = null;
        let bestScore = -Infinity;

        for (const [dx, dy] of directions) {
            const newRow = this.emptyTile.row + dx;
            const newCol = this.emptyTile.col + dy;

            if (newRow >= 0 && newRow < this.size && 
                newCol >= 0 && newCol < this.size &&
                !(newRow === this.fixedTile.row && newCol === this.fixedTile.col)) {
                
                // Score the move based on whether it gets a number closer to its solved position
                const value = this.board[newRow][newCol];
                let score = 0;

                // Find where this number should be in the solution
                for (let i = 0; i < this.size; i++) {
                    for (let j = 0; j < this.size; j++) {
                        if (this.solutionBoard[i][j] === value) {
                            // Calculate Manhattan distance to target position
                            const currentDistance = Math.abs(newRow - i) + Math.abs(newCol - j);
                            const newDistance = Math.abs(this.emptyTile.row - i) + Math.abs(this.emptyTile.col - j);
                            score = newDistance - currentDistance;
                        }
                    }
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { row: newRow, col: newCol };
                }
            }
        }

        return bestMove;
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
