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
        this.currentDate = null;
        this.currentDifficulty = null;
        this.bestScore = null;
        
        // Initialize storage availability flags
        this.cookiesAvailable = false;
        this.localStorageAvailable = false;

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
            this.testCookieSupport(); // Test cookie functionality first
            
            const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
            this.initializeGame(today, "Medium");
            this.setupEventListeners();
            this.setupModal();
            this.setupDebugButton(); // Set up the debug cookies button explicitly
            console.log('Initialization complete');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }
    
    testCookieSupport() {
        console.log('Testing cookie support...');
        this.cookiesAvailable = false;
        this.localStorageAvailable = false;
        
        // Test localStorage availability first
        try {
            localStorage.setItem('slidoku_ls_test', 'test');
            const testValue = localStorage.getItem('slidoku_ls_test');
            if (testValue === 'test') {
                console.log('localStorage is available');
                this.localStorageAvailable = true;
                localStorage.removeItem('slidoku_ls_test');
            }
        } catch (e) {
            console.error('localStorage not available:', e);
        }
        
        // Now test cookies
        if (!navigator.cookieEnabled) {
            console.error('CRITICAL: Browser cookies are disabled!');
            this.showStorageWarning('cookies');
        } else {
            // Try setting a test cookie
            const testKey = 'slidoku_init_test';
            const testValue = 'init_' + Date.now();
            const expires = 'expires=Fri, 31 Dec 9999 23:59:59 GMT';
            
            try {
                document.cookie = `${testKey}=${testValue}; ${expires}; path=/`;
                console.log(`Test cookie set: ${testKey}=${testValue}`);
                
                // Try to read back the cookie immediately
                const allCookies = document.cookie;
                console.log('All cookies:', allCookies);
                
                if (allCookies.indexOf(testKey) !== -1) {
                    console.log('Cookie test passed: Cookie support is working');
                    this.cookiesAvailable = true;
                    return true;
                } else {
                    console.error('Could not retrieve the test cookie!');
                    this.showStorageWarning('cookies');
                }
            } catch (e) {
                console.error('Error testing cookies:', e);
                this.showStorageWarning('cookies');
            }
        }
        
        // If we got here, cookies failed but localStorage might be available
        if (this.localStorageAvailable) {
            console.log('Using localStorage as fallback for score storage');
            this.showStorageWarning('cookiesFallback');
            return true;
        }
        
        // Both cookies and localStorage failed
        this.showStorageWarning('all');
        return false;
    }
    
    showStorageWarning(type) {
        // Create a warning element if it doesn't exist
        let warningEl = document.getElementById('storageWarning');
        if (!warningEl) {
            warningEl = document.createElement('div');
            warningEl.id = 'storageWarning';
            warningEl.style.cssText = 'background-color: #ff5722; color: white; padding: 8px; margin-top: 10px; border-radius: 5px; font-size: 14px; text-align: center;';
            
            // Find a spot to insert it (after the game-info div)
            const gameInfo = document.querySelector('.game-info');
            if (gameInfo && gameInfo.parentNode) {
                gameInfo.parentNode.insertBefore(warningEl, gameInfo.nextSibling);
            }
        }
        
        // Set the message based on the type of warning
        if (type === 'cookies') {
            warningEl.innerHTML = '⚠️ Your browser is blocking cookies. Best scores cannot be saved.';
        } else if (type === 'cookiesFallback') {
            warningEl.innerHTML = '⚠️ Using localStorage instead of cookies. Best scores will only be saved in this browser.';
        } else if (type === 'all') {
            warningEl.innerHTML = '⚠️ Your browser is blocking both cookies and localStorage. Best scores cannot be saved.';
        }
    }

    setupModal() {
        console.log('Setting up modals...');

        // Setup new game modal
        const newGameModal = document.getElementById('newGameModal');
        const newGameBtn = document.getElementById('newGame');
        const newGameSpan = newGameModal.querySelector('.close');
        const startNewGameBtn = document.getElementById('startNewGame');
        const gameDateInput = document.getElementById('gameDate');
        const difficultySelect = document.getElementById('gameDifficultySelect');

        // Set up date restrictions
        const today = new Date().toISOString().split('T')[0];
        const minDate = '2025-08-01';
        gameDateInput.setAttribute('max', today);
        gameDateInput.setAttribute('min', minDate);
        gameDateInput.value = today;

        if (newGameModal && newGameBtn && newGameSpan) {
            newGameBtn.onclick = () => {
                newGameModal.style.display = 'block';
            };

            newGameSpan.onclick = () => {
                newGameModal.style.display = 'none';
            };

            startNewGameBtn.onclick = () => {
                const selectedDate = gameDateInput.value;
                const selectedDifficulty = difficultySelect.value;
                this.initializeGame(selectedDate, selectedDifficulty);
                newGameModal.style.display = 'none';
            };
        }

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
            if (event.target === newGameModal) {
                newGameModal.style.display = 'none';
            }
        };
    }

    initializeGame(date = new Date().toISOString().split('T')[0], difficulty = "Medium") {
        console.log('Initializing game with date:', date, 'difficulty:', difficulty);
        this.resetGame();
        
        // Store current date and difficulty
        this.currentDate = date;
        this.currentDifficulty = difficulty;
        
        // Get a new puzzle from the generator
        const puzzle = SlidokuPuzzleGenerator.generatePuzzle(date, difficulty);

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
        
        // Get best score for this puzzle
        this.bestScore = this.getBestScore(date, difficulty);
        console.log(`In initializeGame: Best score loaded: ${this.bestScore}`);

        // Update reveal button state based on allowRevealing
        const revealButton = document.getElementById('showTarget');
        if (revealButton) {
            revealButton.disabled = !this.allowRevealing;
        }

        // Update difficulty, date, and puzzle number displays
        const difficultySpan = document.getElementById('gameDifficulty');
        const puzzleNumberSpan = document.getElementById('puzzleNumber');
        const gameDateSpan = document.getElementById('currentGameDate');
        
        if (difficultySpan) {
            difficultySpan.textContent = this.gameDifficulty;
        }
        if (puzzleNumberSpan) {
            puzzleNumberSpan.textContent = this.puzzleNumber;
        }
        if (gameDateSpan) {
            // Format date as "Sep 1, 2025"
            const formattedDate = new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            gameDateSpan.textContent = formattedDate;
        }

        this.renderBoard();
        this.updateSums();
        this.updateBestScoreDisplay();
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
        // Update the best score display
        this.updateBestScoreDisplay();
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
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            max-width: 400px;
            min-width: 300px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        `;
        
        // Save the score and check if it's a new best score
        console.log(`In checkWin: About to set best score for date=${this.currentDate}, difficulty=${this.currentDifficulty}, moves=${this.moves}`);
        const isNewBestScore = this.setBestScore(this.currentDate, this.currentDifficulty, this.moves);
        console.log(`In checkWin: Is new best score? ${isNewBestScore}`);
        console.log(`In checkWin: Current best score is now: ${this.bestScore}`);
        
        const bestScoreMessage = isNewBestScore ? 
            `<p style="font-size: 18px; margin: 15px 0; color: #FF5722; font-weight: bold;">New Best Score!</p>` : 
            (this.bestScore ? `<p style="font-size: 16px; margin: 15px 0; color: #666;">Best: ${this.bestScore} moves</p>` : '');

        content.innerHTML = `
            <h2 style="
                font-size: 28px;
                color: #4CAF50;
                margin-bottom: 25px;
                font-weight: bold;
            ">Congratulations!</h2>
            <p style="
                font-size: 18px;
                margin: 15px 0;
                color: #333;
            ">Puzzle completed in ${this.moves} moves</p>
            ${bestScoreMessage}
            <p style="
                font-size: 18px;
                margin: 15px 0;
                color: #333;
            ">Time: ${minutes}m ${seconds}s</p>
            <button style="
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
                margin-top: 25px;
                transition: background-color 0.3s;
            " onmouseover="this.style.backgroundColor='#45a049'"
              onmouseout="this.style.backgroundColor='#4CAF50'"
              onclick="this.parentElement.parentElement.remove()">Close</button>
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
                // Get today's date in YYYY-MM-DD format
                const today = new Date().toISOString().split('T')[0];
                // Use the default Medium difficulty
                this.initializeGame(today, "Medium");
            });
        } else {
            console.error('New game button not found');
        }

        // Debug button is now set up in a separate method: setupDebugButton()
    }

    // Score storage management (cookies with localStorage fallback)
    setBestScore(date, difficulty, moves) {
        if (!date || !difficulty) {
            console.error('Invalid parameters for setBestScore:', date, difficulty, moves);
            return false;
        }
        
        // Make sure the key is URL-friendly
        const safeDate = encodeURIComponent(date);
        const safeDifficulty = encodeURIComponent(difficulty);
        const key = `slidoku_score_${safeDate}_${safeDifficulty}`;
        
        // Get current best score
        const currentBest = this.getBestScore(date, difficulty);
        
        console.log(`Setting best score - Date: ${date}, Difficulty: ${difficulty}, Moves: ${moves}`);
        console.log(`Current best score: ${currentBest === null ? 'None' : currentBest}`);
        
        // Only update if this is a better score or if no previous score exists
        if (currentBest === null || moves < currentBest) {
            let saveSuccessful = false;
            
            // Try cookies first if they're available
            if (this.cookiesAvailable) {
                try {
                    // Set the cookie with proper formatting
                    const expires = new Date();
                    // Set expiration 10 years in the future
                    expires.setFullYear(expires.getFullYear() + 10);
                    
                    // Properly format the cookie
                    document.cookie = `${key}=${moves}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
                    console.log(`Cookie set for key: ${key}, value: ${moves}`);
                    
                    // Verify the cookie was set
                    const cookies = document.cookie;
                    if (cookies.indexOf(key) !== -1) {
                        saveSuccessful = true;
                    }
                } catch (e) {
                    console.error('Error setting cookie:', e);
                }
            }
            
            // If cookies failed or aren't available, try localStorage
            if (!saveSuccessful && this.localStorageAvailable) {
                try {
                    localStorage.setItem(key, moves.toString());
                    console.log(`Score saved to localStorage: ${key}=${moves}`);
                    saveSuccessful = true;
                } catch (e) {
                    console.error('Error saving to localStorage:', e);
                }
            }
            
            if (saveSuccessful) {
                // Update the instance variable
                this.bestScore = moves;
                return true; // Score was updated
            } else {
                console.error('Failed to save score - both cookies and localStorage failed');
                return false;
            }
        }
        
        return false; // Score was not updated (not better than previous best)
    }

    getBestScore(date, difficulty) {
        if (!date || !difficulty) {
            console.error('Invalid parameters for getBestScore:', date, difficulty);
            return null;
        }
        
        // Make sure the key is URL-friendly
        const safeDate = encodeURIComponent(date);
        const safeDifficulty = encodeURIComponent(difficulty);
        const key = `slidoku_score_${safeDate}_${safeDifficulty}`;
        
        console.log(`Getting best score - Date: ${date}, Difficulty: ${difficulty}, key: ${key}`);
        
        let score = null;
        
        // Try cookies first
        if (this.cookiesAvailable) {
            try {
                // Split all cookies and find our key
                const cookies = document.cookie.split(';');
                
                for (let cookie of cookies) {
                    cookie = cookie.trim();
                    
                    // Check if this cookie matches our key
                    if (cookie.indexOf(`${key}=`) === 0) {
                        // Get the value part
                        const value = cookie.substring(key.length + 1);
                        // Parse to integer
                        score = parseInt(value, 10);
                        
                        console.log(`Found score in cookie: ${score}`);
                        
                        if (isNaN(score)) {
                            console.warn(`Found cookie but value is not a valid number: ${value}`);
                            score = null;
                        } else {
                            break;
                        }
                    }
                }
            } catch (e) {
                console.error('Error reading cookies:', e);
            }
        }
        
        // If cookie lookup failed, try localStorage
        if (score === null && this.localStorageAvailable) {
            try {
                const value = localStorage.getItem(key);
                if (value) {
                    score = parseInt(value, 10);
                    console.log(`Found score in localStorage: ${score}`);
                    
                    if (isNaN(score)) {
                        console.warn(`Found localStorage item but value is not a valid number: ${value}`);
                        score = null;
                    }
                }
            } catch (e) {
                console.error('Error reading from localStorage:', e);
            }
        }
        
        if (score === null) {
            console.log(`No score found for key: ${key}`);
        }
        
        return score;
    }

    updateBestScoreDisplay() {
        const bestScoreElement = document.getElementById('bestScore');
        if (!bestScoreElement) {
            console.log('Best score element not found in the DOM');
            return;
        }
        
        console.log(`Updating best score display. Current best score: ${this.bestScore}`);
        console.log(`Current date: ${this.currentDate}, difficulty: ${this.currentDifficulty}`);
        
        if (this.bestScore !== null) {
            bestScoreElement.textContent = this.bestScore + ' moves';
            console.log(`Displayed best score as: ${this.bestScore} moves`);
        } else {
            bestScoreElement.textContent = '-';
            console.log('Displayed best score as: -');
        }
    }
    
    setupDebugButton() {
        console.log('Setting up debug cookies button...');
        const debugCookiesButton = document.getElementById('debugCookies');
        
        if (!debugCookiesButton) {
            console.error('Debug cookies button not found in the DOM');
            return;
        }
        
        console.log('Debug cookies button found, attaching click event');
        
        // Remove any existing event listeners (in case this is called multiple times)
        debugCookiesButton.replaceWith(debugCookiesButton.cloneNode(true));
        
        // Get the fresh button reference after replacement
        const freshButton = document.getElementById('debugCookies');
        
        // Add explicit click event with alert for visibility
        freshButton.onclick = () => {
            console.log('--- DEBUG COOKIES BUTTON CLICKED ---');
            alert('Checking cookies... See console for details.');
            
            console.log('All cookies:', document.cookie);
            
            const cookies = document.cookie.split(';');
            if (cookies.length === 0 || (cookies.length === 1 && cookies[0].trim() === '')) {
                console.log('No cookies found');
                alert('No cookies found');
            } else {
                console.log(`Found ${cookies.length} cookies:`);
                let cookiesList = `Found ${cookies.length} cookies:\n`;
                
                cookies.forEach((cookie, index) => {
                    cookie = cookie.trim();
                    console.log(`${index + 1}. ${cookie}`);
                    cookiesList += `${index + 1}. ${cookie}\n`;
                });
                
                alert(cookiesList);
            }

            // Test setting a simple cookie
            const testKey = 'slidoku_test_cookie';
            const testValue = 'test_value_' + new Date().getTime();
            document.cookie = `${testKey}=${testValue}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
            console.log(`Test cookie set: ${testKey}=${testValue}`);
            console.log('All cookies now:', document.cookie);
            
            // Check if browser accepts cookies
            if (navigator.cookieEnabled) {
                console.log('Browser cookie support: ENABLED');
            } else {
                console.log('Browser cookie support: DISABLED');
                alert('WARNING: Browser cookie support is DISABLED');
            }
        };
        
        // Make button more visible for debugging
        freshButton.style.backgroundColor = '#ff5722';
        freshButton.style.color = 'white';
        freshButton.style.fontWeight = 'bold';
        
        console.log('Debug cookies button setup complete');
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
