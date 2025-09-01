class SlidokuPuzzleGenerator {
    static generatePuzzle(options = {dontShuffleOneEdge: false, numberOfFixedTiles: 2, allowReavealing: false}) {
        const size = 4;
        const board = this.generateBoard(size);
        const fixedTiles = this.randomizeFixedTiles(board, options.numberOfFixedTiles);
        const shuffledBoard = this.shuffleBoard(board, fixedTiles, 1000, options.dontShuffleOneEdge);
        
        // Create the puzzle object
        return {
            size: size,
            initialBoard: shuffledBoard.board,
            targetBoard: board.targetState,
            fixedTiles: fixedTiles,
            emptyTile: shuffledBoard.emptyTile,
            allowRevealing: options.allowRevealing,
            targetSum: 30
        };
    }

    static generateBoard(size) {
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
            ]
        ];

        let magicSquare = MAGIC_SEEDS[Math.floor(Math.random() * MAGIC_SEEDS.length)]
            .map(row => [...row]);

        // Apply random transformations
        magicSquare = this.applyRandomTransformations(magicSquare);

        // Find empty tile position
        let emptyTile = { row: 0, col: 0 };
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (magicSquare[i][j] === 0) {
                    emptyTile = { row: i, col: j };
                    break;
                }
            }
        }

        return {
            targetState: magicSquare.map(row => [...row]),
            board: magicSquare.map(row => [...row]),
            emptyTile
        };
    }

    static applyRandomTransformations(grid) {
        const rotate90 = (g) => {
            const n = g.length;
            let newGrid = Array(n).fill().map(() => Array(n).fill(0));
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    newGrid[j][n - i - 1] = g[i][j];
                }
            }
            return newGrid;
        };

        const reflectH = (g) => g.map(row => [...row].reverse());

        // Apply random rotations
        let r = Math.floor(Math.random() * 4);
        for (let i = 0; i < r; i++) {
            grid = rotate90(grid);
        }

        // Random reflection
        if (Math.random() < 0.5) {
            grid = reflectH(grid);
        }

        // Random row swaps (within pairs)
        if (Math.random() < 0.5) [grid[0], grid[1]] = [grid[1], grid[0]];
        if (Math.random() < 0.5) [grid[2], grid[3]] = [grid[3], grid[2]];

        // Random column swaps (within pairs)
        if (Math.random() < 0.5) {
            for (let i = 0; i < 4; i++) {
                [grid[i][0], grid[i][1]] = [grid[i][1], grid[i][0]];
            }
        }
        if (Math.random() < 0.5) {
            for (let i = 0; i < 4; i++) {
                [grid[i][2], grid[i][3]] = [grid[i][3], grid[i][2]];
            }
        }

        return grid;
    }

    static randomizeFixedTiles(boardState, numFixedTiles = 2) {
        const centerPositions = [
            { row: 1, col: 1 },
            { row: 1, col: 2 },
            { row: 2, col: 1 },
            { row: 2, col: 2 }
        ];

        // Filter out the position with the empty tile (0)
        const validPositions = centerPositions.filter(pos =>
            boardState.board[pos.row][pos.col] !== 0);

        const fixedTiles = [];
        while (fixedTiles.length < numFixedTiles && validPositions.length > 0) {
            const randomIndex = Math.floor(Math.random() * validPositions.length);
            fixedTiles.push(validPositions.splice(randomIndex, 1)[0]);
        }

        return fixedTiles;
    }

    static shuffleBoard(boardState, fixedTiles, moves = 1000, dontShuffleOneEdge = false) {
        const board = boardState.board.map(row => [...row]);
        let emptyTile = { ...boardState.emptyTile };

        // Helper function to check if a tile is fixed
        const isFixed = (row, col) => 
            fixedTiles.some(tile => tile.row === row && tile.col === col);

        // Determine which edge to preserve (the one without the empty tile)
        let edgeToPreserve = null;
        if (dontShuffleOneEdge) {
            if (emptyTile.row !== 0) edgeToPreserve = 0; // preserve top edge
            else if (emptyTile.row !== board.length - 1) edgeToPreserve = board.length - 1; // preserve bottom edge
            else if (emptyTile.col !== 0) edgeToPreserve = -1; // preserve left edge (-1 means left)
            else edgeToPreserve = -2; // preserve right edge (-2 means right)
        }

        let lastMoved = null;
        for (let i = 0; i < moves; i++) {
            const { row, col } = emptyTile;
            let neighbors = [];

            // Get valid neighbors
            if (row > 0) neighbors.push([row - 1, col]);
            if (row < board.length - 1) neighbors.push([row + 1, col]);
            if (col > 0) neighbors.push([row, col - 1]);
            if (col < board[0].length - 1) neighbors.push([row, col + 1]);

            // Filter out fixed tiles
            neighbors = neighbors.filter(([r, c]) => !isFixed(r, c));

            // Filter out tiles from preserved edge if dontShuffleOneEdge is true
            if (dontShuffleOneEdge && edgeToPreserve !== null) {
                if (edgeToPreserve >= 0) { // top or bottom edge
                    neighbors = neighbors.filter(([r, c]) => r !== edgeToPreserve);
                } else if (edgeToPreserve === -1) { // left edge
                    neighbors = neighbors.filter(([r, c]) => c !== 0);
                } else { // right edge
                    neighbors = neighbors.filter(([r, c]) => c !== board.length - 1);
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

            if (neighbors.length === 0) continue;

            // Perform swap
            const [r2, c2] = neighbors[Math.floor(Math.random() * neighbors.length)];
            lastMoved = [row, col];
            [board[row][col], board[r2][c2]] = [board[r2][c2], board[row][col]];
            emptyTile = { row: r2, col: c2 };
        }

        return { board, emptyTile };
    }
}

// For browser
if (typeof window !== 'undefined') {
    window.SlidokuPuzzleGenerator = SlidokuPuzzleGenerator;
}

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SlidokuPuzzleGenerator;
}
