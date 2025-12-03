// Game Cờ Caro với AI
class CaroGame {
    constructor() {
        this.boardSize = 15;
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'X'; // X là người chơi, O là AI
        this.gameOver = false;
        this.difficulty = 'medium';
        this.winningCells = [];
        
        // Cache cho transposition table
        this.transpositionTable = new Map();
        this.maxCacheSize = 10000;
        
        // Time limit cho AI (milliseconds) - Tăng thời gian để AI suy nghĩ sâu hơn
        this.thinkTimeLimit = {
            easy: 120,
            medium: 400,
            hard: 1500  // Tăng từ 900 lên 1500ms để AI có thời gian suy nghĩ sâu hơn
        };
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.setupEventListeners();
        this.updateStatus();
    }
    
    createBoard() {
        const boardGrid = document.getElementById('boardGrid');
        if (!boardGrid) {
            console.error('Board grid element not found!');
            return;
        }
        
        boardGrid.innerHTML = '';
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('button');
                cell.className = 'board-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                // Use arrow function to preserve 'this' context
                cell.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleCellClick(i, j);
                });
                boardGrid.appendChild(cell);
            }
        }
    }
    
    setupEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.difficulty = e.target.dataset.difficulty;
                this.reset();
            });
        });
    }
    
    handleCellClick(row, col) {
        if (this.gameOver || this.currentPlayer !== 'X' || this.board[row][col] !== null) {
            return;
        }
        
        const moveSuccess = this.makeMove(row, col, 'X');
        
        if (moveSuccess && !this.gameOver && this.currentPlayer === 'O') {
            // AI chơi sau một chút để tạo cảm giác tự nhiên
            const self = this;
            setTimeout(() => {
                if (!self.gameOver && self.currentPlayer === 'O') {
                    self.aiMove();
                }
            }, 300);
        }
    }
    
    makeMove(row, col, player) {
        if (this.board[row][col] !== null || this.gameOver) {
            return false;
        }
        
        this.board[row][col] = player;
        this.updateCell(row, col, player);
        
        const result = this.checkWinner(row, col, player);
        if (result) {
            this.gameOver = true;
            this.winningCells = result.cells;
            this.highlightWinningCells();
            this.showWinMessage(result.winner);
            return true;
        }
        
        if (this.isBoardFull()) {
            this.gameOver = true;
            this.showWinMessage('draw');
            return true;
        }
        
        this.currentPlayer = player === 'X' ? 'O' : 'X';
        this.updateStatus();
        return true;
    }
    
    updateCell(row, col, player) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        // Add animation class before updating
        cell.style.animation = 'none';
        setTimeout(() => {
            cell.textContent = player;
            cell.classList.add('occupied', player === 'X' ? 'player' : 'ai');
            // Trigger animation
            cell.style.animation = null;
        }, 10);
    }
    
    checkWinner(row, col, player) {
        const directions = [
            [[0, 1], [0, -1]],   // Ngang
            [[1, 0], [-1, 0]],   // Dọc
            [[1, 1], [-1, -1]],  // Chéo chính
            [[1, -1], [-1, 1]]   // Chéo phụ
        ];
        
        for (const direction of directions) {
            let count = 1;
            const cells = [[row, col]];
            
            for (const [dx, dy] of direction) {
                let newRow = row + dx;
                let newCol = col + dy;
                
                while (
                    newRow >= 0 && newRow < this.boardSize &&
                    newCol >= 0 && newCol < this.boardSize &&
                    this.board[newRow][newCol] === player
                ) {
                    count++;
                    cells.push([newRow, newCol]);
                    newRow += dx;
                    newCol += dy;
                }
            }
            
            if (count >= 5) {
                return { winner: player, cells: cells };
            }
        }
        
        return null;
    }
    
    highlightWinningCells() {
        this.winningCells.forEach(([row, col]) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('winning');
        });
    }
    
    isBoardFull() {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === null) {
                    return false;
                }
            }
        }
        return true;
    }
    
    aiMove() {
        // Kiểm tra điều kiện trước khi AI chơi
        if (this.gameOver || this.currentPlayer !== 'O') {
            return;
        }
        
        let move;
        
        switch (this.difficulty) {
            case 'easy':
                move = this.getRandomMove();
                break;
            case 'medium':
                move = this.getMediumMove();
                break;
            case 'hard':
                move = this.getBestMove();
                break;
            default:
                move = this.getMediumMove();
        }
        
        if (move && move.row !== undefined && move.col !== undefined) {
            const success = this.makeMove(move.row, move.col, 'O');
            if (!success) {
                console.warn('AI move failed, trying random move');
                // Fallback to random move if the calculated move failed
                const randomMove = this.getRandomMove();
                if (randomMove) {
                    this.makeMove(randomMove.row, randomMove.col, 'O');
                }
            }
        } else {
            console.warn('AI could not find a valid move');
        }
    }
    
    getRandomMove() {
        const emptyCells = [];
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === null) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }
        
        if (emptyCells.length === 0) return null;
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    
    getMediumMove() {
        // Ưu tiên tấn công (thắng nếu có thể)
        const winMove = this.findWinningMove('O');
        if (winMove) return winMove;
        
        // Chặn người chơi (ngăn họ thắng) - QUAN TRỌNG
        const blockMove = this.findWinningMove('X');
        if (blockMove) return blockMove;
        
        // Tấn công chủ động: Tạo pattern nguy hiểm cho AI trước
        const createDangerous = this.findDangerousPattern('O');
        if (createDangerous) return createDangerous;
        
        // Chặn pattern nguy hiểm của người chơi (3-3, 4-4)
        const blockDangerous = this.findDangerousPattern('X');
        if (blockDangerous) return blockDangerous;
        
        // Tấn công: Tạo 4 mở hoặc 3 mở 2 đầu
        const attackMove = this.findBestAttackMove('O');
        if (attackMove) return attackMove;
        
        // Chặn các nước tấn công của người chơi (chặn 3 mở, 4 mở)
        const blockAttack = this.findBestAttackMove('X');
        if (blockAttack) return blockAttack;
        
        // Chơi ở vị trí tốt gần các quân cờ hiện có
        const strategicMove = this.findStrategicMove();
        if (strategicMove) return strategicMove;
        
        // Nếu không có nước tốt, chơi ngẫu nhiên
        return this.getRandomMove();
    }
    
    findBestAttackMove(player) {
        // Tìm nước tạo ra pattern tấn công tốt nhất (4 mở, 3 mở 2 đầu)
        // Cải thiện: Giảm threshold và đánh giá tốt hơn
        const candidateMoves = this.getCandidateMovesOptimized();
        let bestMove = null;
        let bestScore = -1;
        
        for (const move of candidateMoves) {
            this.board[move.row][move.col] = player;
            
            // Đánh giá pattern sau nước này
            const score = this.evaluatePositionGomoku(player);
            
            // Ưu tiên các pattern tấn công
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
            
            this.board[move.row][move.col] = null;
        }
        
        // Giảm threshold từ 200 xuống 150 để AI tấn công tích cực hơn
        return bestScore > 150 ? bestMove : null;
    }
    
    getBestMove() {
        const startTime = Date.now();
        const timeLimit = this.thinkTimeLimit[this.difficulty] || 700;
        
        // Ưu tiên tấn công (thắng ngay nếu có thể)
        const winMove = this.findWinningMove('O');
        if (winMove) return winMove;
        
        // Chặn người chơi (ngăn họ thắng ngay) - QUAN TRỌNG NHẤT
        const blockMove = this.findWinningMove('X');
        if (blockMove) return blockMove;
        
        // Phát hiện double threat (2 đường tấn công cùng lúc - không thể chặn)
        const doubleThreat = this.findDoubleThreat('O');
        if (doubleThreat) return doubleThreat;
        
        // Chặn double threat của người chơi
        const blockDoubleThreat = this.findDoubleThreat('X');
        if (blockDoubleThreat) return blockDoubleThreat;
        
        // Phát hiện pattern nguy hiểm (3-3, 4-4)
        const dangerousPattern = this.findDangerousPattern('O');
        if (dangerousPattern) return dangerousPattern;
        
        // Chặn pattern nguy hiểm của người chơi
        const blockDangerous = this.findDangerousPattern('X');
        if (blockDangerous) return blockDangerous;
        
        // Sử dụng iterative deepening với minimax + alpha-beta
        let bestMove = null;
        let bestScore = -Infinity;
        const maxDepth = this.difficulty === 'hard' ? 7 : 5; // Tăng độ sâu từ 5 lên 7 cho hard mode
        
        for (let depth = 2; depth <= maxDepth; depth++) {
            const elapsed = Date.now() - startTime;
            if (elapsed >= timeLimit * 0.85) break; // Dừng sớm nếu gần hết thời gian
            
            const result = this.minimaxWithAlphaBeta(depth, -Infinity, Infinity, true, startTime, timeLimit);
            if (result && result.move) {
                bestMove = result.move;
                bestScore = result.score;
                
                // Nếu tìm thấy nước thắng chắc chắn, dừng ngay
                if (result.score > 50000) break;
            }
        }
        
        if (bestMove) return bestMove;
        
        // Fallback to strategic move
        const strategicMove = this.findStrategicMove();
        if (strategicMove) return strategicMove;
        
        return this.getRandomMove();
    }
    
    findWinningMove(player) {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === null) {
                    this.board[i][j] = player;
                    const result = this.checkWinner(i, j, player);
                    this.board[i][j] = null;
                    
                    if (result) {
                        return { row: i, col: j };
                    }
                }
            }
        }
        return null;
    }
    
    findStrategicMove() {
        // Tìm các ô tốt nhất dựa trên đánh giá heuristic
        // Cải thiện: Tăng trọng số phòng thủ và đánh giá pattern tốt hơn
        const candidateMoves = this.getCandidateMovesOptimized();
        const scores = [];
        
        for (const move of candidateMoves) {
            let score = 0;
            
            // Đánh giá nếu AI đánh ở đây (tấn công)
            this.board[move.row][move.col] = 'O';
            const aiScore = this.evaluatePositionGomoku('O');
            score += aiScore * 0.12; // Tăng từ 0.1 lên 0.12
            this.board[move.row][move.col] = null;
            
            // Đánh giá nếu người chơi đánh ở đây (phòng thủ) - ưu tiên mạnh hơn
            this.board[move.row][move.col] = 'X';
            const playerScore = this.evaluatePositionGomoku('X');
            score += playerScore * 0.35; // Tăng từ 0.25 lên 0.35 - phòng thủ quan trọng hơn nhiều
            this.board[move.row][move.col] = null;
            
            // Ưu tiên vị trí trung tâm (quan trọng hơn ở đầu game)
            const centerDist = Math.abs(move.row - this.boardSize / 2) + Math.abs(move.col - this.boardSize / 2);
            score += (this.boardSize - centerDist) * 0.15; // Tăng từ 0.1 lên 0.15
            
            // Bonus cho các nước tạo ra nhiều pattern cùng lúc
            this.board[move.row][move.col] = 'O';
            const patternCount = this.countActivePatterns('O', move.row, move.col);
            score += patternCount * 50; // Bonus cho mỗi pattern được tạo
            this.board[move.row][move.col] = null;
            
            scores.push({ row: move.row, col: move.col, score: score });
        }
        
        if (scores.length === 0) return null;
        
        scores.sort((a, b) => b.score - a.score);
        return scores[0];
    }
    
    countActivePatterns(player, row, col) {
        // Đếm số pattern đang hoạt động từ một vị trí
        let patternCount = 0;
        const directions = [
            [[0, 1], [0, -1]],   // Ngang
            [[1, 0], [-1, 0]],   // Dọc
            [[1, 1], [-1, -1]],  // Chéo chính
            [[1, -1], [-1, 1]]   // Chéo phụ
        ];
        
        for (const direction of directions) {
            let count = 1;
            let blocked = 0;
            
            for (const [dx, dy] of direction) {
                let newRow = row + dx;
                let newCol = col + dy;
                
                while (
                    newRow >= 0 && newRow < this.boardSize &&
                    newCol >= 0 && newCol < this.boardSize &&
                    this.board[newRow][newCol] === player
                ) {
                    count++;
                    newRow += dx;
                    newCol += dy;
                }
                
                if (
                    newRow < 0 || newRow >= this.boardSize ||
                    newCol < 0 || newCol >= this.boardSize ||
                    this.board[newRow][newCol] !== null
                ) {
                    blocked++;
                }
            }
            
            // Đếm các pattern có giá trị (ít nhất 2 quân)
            if (count >= 2 && blocked < 2) {
                patternCount++;
            }
        }
        
        return patternCount;
    }
    
    minimaxWithAlphaBeta(depth, alpha, beta, maximizingPlayer, startTime = null, timeLimit = null) {
        // Kiểm tra thời gian
        if (startTime && timeLimit) {
            const elapsed = Date.now() - startTime;
            if (elapsed >= timeLimit) {
                return { score: 0, move: null }; // Timeout
            }
        }
        
        // Kiểm tra kết thúc game hoặc đạt độ sâu tối đa
        if (depth === 0) {
            return { score: this.evaluateBoardGomoku(), move: null };
        }
        
        // Kiểm tra thắng/thua trước
        const aiWin = this.findWinningMove('O');
        const playerWin = this.findWinningMove('X');
        
        if (aiWin && maximizingPlayer) {
            return { score: 1000000 - depth, move: aiWin };
        }
        if (playerWin && !maximizingPlayer) {
            return { score: -1000000 + depth, move: playerWin };
        }
        
        // Lấy candidate moves (chỉ quanh các quân đã đánh)
        const candidateMoves = this.getCandidateMovesOptimized();
        if (candidateMoves.length === 0) {
            return { score: 0, move: null };
        }
        
        // Sắp xếp moves theo điểm số để alpha-beta hiệu quả hơn (move ordering)
        // Cải thiện: Đánh giá chính xác hơn bằng cách kiểm tra cả winning moves và blocking moves
        const scoredMoves = candidateMoves.map(move => {
            // Kiểm tra nếu đây là winning move
            this.board[move.row][move.col] = maximizingPlayer ? 'O' : 'X';
            const isWinning = this.checkWinner(move.row, move.col, maximizingPlayer ? 'O' : 'X');
            const score = isWinning 
                ? (maximizingPlayer ? 1000000 : -1000000)
                : this.evaluateBoardGomoku();
            this.board[move.row][move.col] = null;
            return { move, score };
        });
        
        // Sắp xếp: winning moves trước, sau đó theo điểm số
        scoredMoves.sort((a, b) => {
            if (Math.abs(a.score) > 500000) return maximizingPlayer ? -1 : 1;
            if (Math.abs(b.score) > 500000) return maximizingPlayer ? 1 : -1;
            return maximizingPlayer ? b.score - a.score : a.score - b.score;
        });
        
        let bestMove = scoredMoves[0].move;
        let bestScore = maximizingPlayer ? -Infinity : Infinity;
        
        for (const { move } of scoredMoves) {
            // Kiểm tra thời gian trong loop
            if (startTime && timeLimit) {
                const elapsed = Date.now() - startTime;
                if (elapsed >= timeLimit) break;
            }
            
            this.board[move.row][move.col] = maximizingPlayer ? 'O' : 'X';
            const result = this.minimaxWithAlphaBeta(depth - 1, alpha, beta, !maximizingPlayer, startTime, timeLimit);
            this.board[move.row][move.col] = null;
            
            if (!result) continue;
            
            if (maximizingPlayer) {
                if (result.score > bestScore) {
                    bestScore = result.score;
                    bestMove = move;
                }
                alpha = Math.max(alpha, result.score);
            } else {
                if (result.score < bestScore) {
                    bestScore = result.score;
                    bestMove = move;
                }
                beta = Math.min(beta, result.score);
            }
            
            // Alpha-beta pruning
            if (beta <= alpha) {
                break;
            }
        }
        
        return { score: bestScore, move: bestMove };
    }
    
    evaluateBoardGomoku() {
        // Đánh giá theo chuẩn Gomoku với hệ số ưu tiên phòng thủ mạnh hơn
        const aiScore = this.evaluatePositionGomoku('O');
        const playerScore = this.evaluatePositionGomoku('X');
        
        // Tăng hệ số phòng thủ từ 1.6 lên 2.0 để AI chặn người chơi mạnh hơn
        // AI sẽ ưu tiên chặn các nước nguy hiểm của người chơi hơn là tấn công
        return aiScore - playerScore * 2.0;
    }
    
    findDoubleThreat(player) {
        // Tìm các nước tạo ra 2 đường tấn công cùng lúc (không thể chặn)
        // Cải thiện: Phát hiện cả 3-3 pattern và 4-4 pattern như double threat
        const candidateMoves = this.getCandidateMoves();
        
        for (const move of candidateMoves) {
            this.board[move.row][move.col] = player;
            
            // Đếm số đường tấn công (4 quân liên tiếp, không bị chặn)
            let threatCount = 0;
            let threeCount = 0; // Đếm số đường 3 mở 2 đầu
            const directions = [
                [[0, 1], [0, -1]],   // Ngang
                [[1, 0], [-1, 0]],   // Dọc
                [[1, 1], [-1, -1]],  // Chéo chính
                [[1, -1], [-1, 1]]   // Chéo phụ
            ];
            
            for (const direction of directions) {
                let count = 1;
                let blocked = 0;
                
                for (const [dx, dy] of direction) {
                    let newRow = move.row + dx;
                    let newCol = move.col + dy;
                    
                    while (
                        newRow >= 0 && newRow < this.boardSize &&
                        newCol >= 0 && newCol < this.boardSize &&
                        this.board[newRow][newCol] === player
                    ) {
                        count++;
                        newRow += dx;
                        newCol += dy;
                    }
                    
                    if (
                        newRow < 0 || newRow >= this.boardSize ||
                        newCol < 0 || newCol >= this.boardSize ||
                        this.board[newRow][newCol] !== null
                    ) {
                        blocked++;
                    }
                }
                
                // Nếu có 4 quân liên tiếp và không bị chặn cả 2 đầu, đó là threat
                if (count >= 4 && blocked === 0) {
                    threatCount++;
                }
                // Nếu có 3 quân liên tiếp và không bị chặn cả 2 đầu, đó là 3-3 pattern
                else if (count === 3 && blocked === 0) {
                    threeCount++;
                }
            }
            
            this.board[move.row][move.col] = null;
            
            // Nếu có 2 hoặc nhiều threat (4-4), đây là double threat
            if (threatCount >= 2) {
                return move;
            }
            // Nếu có 2 hoặc nhiều đường 3 mở 2 đầu (3-3 pattern), cũng là double threat
            if (threeCount >= 2) {
                return move;
            }
            // Nếu có cả threat và 3-3 pattern, cũng là double threat
            if (threatCount >= 1 && threeCount >= 1) {
                return move;
            }
        }
        
        return null;
    }
    
    findDangerousPattern(player) {
        // Tìm các pattern nguy hiểm: 3-3 (2 đường 3 quân), 4-4 (2 đường 4 quân)
        // Cải thiện: Phát hiện cả pattern 3-4 (3 mở + 4 mở) và các pattern phức tạp hơn
        const candidateMoves = this.getCandidateMoves();
        
        for (const move of candidateMoves) {
            this.board[move.row][move.col] = player;
            
            let threeCount = 0;
            let fourCount = 0;
            let threeOneEnd = 0; // 3 quân, 1 đầu mở
            const directions = [
                [[0, 1], [0, -1]],   // Ngang
                [[1, 0], [-1, 0]],   // Dọc
                [[1, 1], [-1, -1]],  // Chéo chính
                [[1, -1], [-1, 1]]   // Chéo phụ
            ];
            
            for (const direction of directions) {
                let count = 1;
                let blocked = 0;
                
                for (const [dx, dy] of direction) {
                    let newRow = move.row + dx;
                    let newCol = move.col + dy;
                    
                    while (
                        newRow >= 0 && newRow < this.boardSize &&
                        newCol >= 0 && newCol < this.boardSize &&
                        this.board[newRow][newCol] === player
                    ) {
                        count++;
                        newRow += dx;
                        newCol += dy;
                    }
                    
                    if (
                        newRow < 0 || newRow >= this.boardSize ||
                        newCol < 0 || newCol >= this.boardSize ||
                        this.board[newRow][newCol] !== null
                    ) {
                        blocked++;
                    }
                }
                
                if (count === 3 && blocked === 0) {
                    threeCount++;
                } else if (count === 3 && blocked === 1) {
                    threeOneEnd++;
                } else if (count === 4 && blocked === 0) {
                    fourCount++;
                }
            }
            
            this.board[move.row][move.col] = null;
            
            // 4-4 pattern (rất nguy hiểm - gần như thắng chắc)
            if (fourCount >= 2) {
                return move;
            }
            
            // 3-4 pattern (3 mở + 4 mở) - rất nguy hiểm
            if (threeCount >= 1 && fourCount >= 1) {
                return move;
            }
            
            // 3-3 pattern (nguy hiểm - tạo double threat)
            if (threeCount >= 2) {
                return move;
            }
            
            // 3-3 pattern với 1 đầu mở (vẫn nguy hiểm)
            if (threeCount >= 1 && threeOneEnd >= 1) {
                return move;
            }
        }
        
        return null;
    }
    
    getCandidateMoves() {
        return this.getCandidateMovesOptimized();
    }
    
    getCandidateMovesOptimized() {
        const candidates = new Set();
        // Với mức khó, AI nhìn rộng hơn (bán kính lớn hơn) để khó đoán và khó thắng hơn
        // Tăng bán kính từ 3 lên 4 cho hard mode để AI xem xét nhiều nước đi hơn
        const radius = this.difficulty === 'hard' ? 4 : 2;
        
        // Tìm tất cả các quân đã đánh
        const occupiedCells = [];
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] !== null) {
                    occupiedCells.push({ row: i, col: j });
                }
            }
        }
        
        // Nếu chưa có quân nào, chơi ở giữa
        if (occupiedCells.length === 0) {
            const center = Math.floor(this.boardSize / 2);
            return [{ row: center, col: center }];
        }
        
        // Chỉ xem xét các ô trong bán kính quanh các quân đã đánh
        for (const cell of occupiedCells) {
            for (let di = -radius; di <= radius; di++) {
                for (let dj = -radius; dj <= radius; dj++) {
                    // Bỏ qua ô chính giữa (đã có quân)
                    if (di === 0 && dj === 0) continue;
                    
                    const ni = cell.row + di;
                    const nj = cell.col + dj;
                    
                    if (
                        ni >= 0 && ni < this.boardSize &&
                        nj >= 0 && nj < this.boardSize &&
                        this.board[ni][nj] === null
                    ) {
                        const key = `${ni},${nj}`;
                        candidates.add(key);
                    }
                }
            }
        }
        
        // Chuyển Set thành Array
        return Array.from(candidates).map(key => {
            const [row, col] = key.split(',').map(Number);
            return { row, col };
        });
    }
    
    evaluatePosition(player) {
        return this.evaluatePositionGomoku(player);
    }
    
    evaluatePositionGomoku(player) {
        let score = 0;
        const directions = [
            [[0, 1], [0, -1]],   // Ngang
            [[1, 0], [-1, 0]],   // Dọc
            [[1, 1], [-1, -1]],  // Chéo chính
            [[1, -1], [-1, 1]]   // Chéo phụ
        ];
        
        // Chỉ đánh giá khu vực có quân (tối ưu tốc độ)
        const evaluatedCells = new Set();
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === player) {
                    for (const direction of directions) {
                        const key = `${i},${j},${direction[0][0]},${direction[0][1]}`;
                        if (evaluatedCells.has(key)) continue;
                        evaluatedCells.add(key);
                        
                        let count = 1;
                        let openEnds = 0;
                        
                        // Đếm quân cờ về cả 2 phía
                        for (const [dx, dy] of direction) {
                            let newRow = i + dx;
                            let newCol = j + dy;
                            
                            // Đếm quân cùng màu
                            while (
                                newRow >= 0 && newRow < this.boardSize &&
                                newCol >= 0 && newCol < this.boardSize &&
                                this.board[newRow][newCol] === player
                            ) {
                                count++;
                                newRow += dx;
                                newCol += dy;
                            }
                            
                            // Kiểm tra đầu mở hay bị chặn
                            if (
                                newRow >= 0 && newRow < this.boardSize &&
                                newCol >= 0 && newCol < this.boardSize &&
                                this.board[newRow][newCol] === null
                            ) {
                                openEnds++;
                            }
                        }
                        
                        // Tính điểm theo chuẩn Gomoku quốc tế - Cải thiện hệ số điểm
                        if (count >= 5) {
                            score += 1000000; // Thắng - điểm cao nhất
                        } else if (count === 4) {
                            if (openEnds === 2) {
                                score += 60000; // Tăng từ 50000 lên 60000 - 4 mở 2 đầu - rất nguy hiểm, gần như thắng
                            } else if (openEnds === 1) {
                                score += 6000; // Tăng từ 5000 lên 6000 - 4 bị chặn 1 đầu - vẫn rất nguy hiểm
                            } else {
                                score += 100; // 4 bị chặn 2 đầu - không nguy hiểm
                            }
                        } else if (count === 3) {
                            if (openEnds === 2) {
                                score += 4000; // Tăng từ 3000 lên 4000 - 3 mở 2 đầu (3-3 pattern) - rất nguy hiểm
                            } else if (openEnds === 1) {
                                score += 300; // Tăng từ 200 lên 300 - 3 bị chặn 1 đầu - có tiềm năng
                            } else {
                                score += 10; // 3 bị chặn 2 đầu - ít nguy hiểm
                            }
                        } else if (count === 2) {
                            if (openEnds === 2) {
                                score += 80; // Tăng từ 50 lên 80 - 2 mở 2 đầu - có tiềm năng
                            } else if (openEnds === 1) {
                                score += 8; // Tăng từ 5 lên 8 - 2 bị chặn 1 đầu - ít giá trị
                            }
                        } else if (count === 1 && openEnds === 2) {
                            score += 2; // Tăng từ 1 lên 2 - 1 quân, 2 đầu mở - tiềm năng nhỏ
                        }
                    }
                }
            }
        }
        
        return score;
    }
    
    updateStatus() {
        const currentTurn = document.getElementById('currentTurn');
        const gameResult = document.getElementById('gameResult');
        
        // Get translations if available
        const t = (key) => {
            // Access from window object first, fallback to 'en'
            const lang = window.currentLang || 'en';
            const translations = window.translations || null;
            
            if (translations && translations[lang] && translations[lang][key]) {
                return translations[lang][key];
            }
            // Fallback to English
            if (translations && translations.en && translations.en[key]) {
                return translations.en[key];
            }
            return key;
        };
        
        if (this.gameOver) {
            currentTurn.textContent = t('gameOver');
            currentTurn.classList.remove('player-turn', 'ai-turn');
        } else {
            if (this.currentPlayer === 'X') {
                currentTurn.textContent = t('yourTurn');
                currentTurn.classList.add('player-turn');
                currentTurn.classList.remove('ai-turn');
            } else {
                currentTurn.textContent = t('aiTurn');
                currentTurn.classList.add('ai-turn');
                currentTurn.classList.remove('player-turn');
            }
        }
        
        if (!this.gameOver) {
            gameResult.textContent = t('playing');
        }
    }
    
    showWinMessage(result) {
        const winMessage = document.getElementById('winMessage');
        const gameResult = document.getElementById('gameResult');
        
        // Get translations if available
        const t = (key) => {
            // Access from window object first, fallback to 'en'
            const lang = window.currentLang || 'en';
            const translations = window.translations || null;
            
            if (translations && translations[lang] && translations[lang][key]) {
                return translations[lang][key];
            }
            // Fallback to English
            if (translations && translations.en && translations.en[key]) {
                return translations.en[key];
            }
            return key;
        };
        
        let message = '';
        if (result === 'X') {
            message = t('youWin');
            gameResult.textContent = t('youWinResult');
            gameResult.style.color = 'var(--success)';
        } else if (result === 'O') {
            message = t('aiWins');
            gameResult.textContent = t('aiWinsResult');
            gameResult.style.color = 'var(--accent)';
        } else {
            message = t('draw');
            gameResult.textContent = t('drawResult');
            gameResult.style.color = 'var(--text-secondary)';
        }
        
        winMessage.textContent = message;
        winMessage.style.display = 'block';
        this.updateStatus();
    }
    
    newGame() {
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winningCells = [];
        
        const winMessage = document.getElementById('winMessage');
        const gameResult = document.getElementById('gameResult');
        
        if (winMessage) {
            winMessage.style.display = 'none';
        }
        
        if (gameResult) {
            // Get translation for "playing"
            const t = (key) => {
                const lang = window.currentLang || 'en';
                const translations = window.translations;
                if (translations && translations[lang] && translations[lang][key]) {
                    return translations[lang][key];
                }
                if (translations && translations.en && translations.en[key]) {
                    return translations.en[key];
                }
                return key;
            };
            gameResult.textContent = t('playing');
            gameResult.style.color = '';
        }
        
        // Ensure board grid is visible before creating board
        const boardGrid = document.getElementById('boardGrid');
        if (boardGrid) {
            this.createBoard();
        } else {
            console.error('Board grid not found, retrying...');
            setTimeout(() => {
                if (document.getElementById('boardGrid')) {
                    this.createBoard();
                }
            }, 100);
        }
        
        this.updateStatus();
    }
    
    reset() {
        this.newGame();
    }
}

// Khởi tạo game khi được gọi
// Game sẽ được khởi tạo bởi hàm loadGame() trong gamefun.html

// ============================================
// MEMORY GAME
// ============================================
class MemoryGame {
    constructor() {
        this.grid = document.getElementById('memoryGrid');
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.startTime = null;
        this.timer = null;
        this.gameStarted = false;
        this.totalPairs = 8;
        this.eventsBound = false;
        
        this.init();
    }
    
    init() {
        if (!this.eventsBound) {
            this.setupEventListeners();
            this.eventsBound = true;
        }
        this.createCards();
    }
    
    setupEventListeners() {
        document.getElementById('memoryStartBtn').addEventListener('click', () => this.start());
        document.getElementById('memoryRestartBtn').addEventListener('click', () => this.restart());
    }
    
    createCards() {
        const symbols = ['🎯', '🎮', '🎨', '🎵', '🎪', '🎭', '🎬', '🎤'];
        const cardValues = [...symbols, ...symbols];
        
        // Shuffle
        for (let i = cardValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardValues[i], cardValues[j]] = [cardValues[j], cardValues[i]];
        }
        
        this.grid.innerHTML = '';
        this.cards = [];
        
        cardValues.forEach((value, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = index;
            card.dataset.value = value;
            card.style.cssText = `
                aspect-ratio: 1;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: var(--radius-md);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2rem;
                color: white;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                position: relative;
                overflow: hidden;
            `;
            card.innerHTML = '<div class="memory-card-back">?</div>';
            
            card.addEventListener('click', () => this.flipCard(index));
            this.grid.appendChild(card);
            this.cards.push({
                element: card,
                value: value,
                flipped: false,
                matched: false
            });
        });
    }
    
    start() {
        if (this.gameStarted) return;
        this.gameStarted = true;
        this.startTime = Date.now();
        this.startTimer();
        document.getElementById('memoryStartBtn').style.display = 'none';
    }
    
    restart() {
        this.stop();
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.gameStarted = false;
        this.startTime = null;
        this.updateDisplay();
        this.createCards();
        document.getElementById('memoryStartBtn').style.display = 'inline-block';
    }
    
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    startTimer() {
        this.timer = setInterval(() => {
            if (this.startTime) {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                document.getElementById('memoryTime').textContent = elapsed + 's';
            }
        }, 1000);
    }
    
    flipCard(index) {
        if (!this.gameStarted) {
            this.start();
        }
        
        const card = this.cards[index];
        if (card.flipped || card.matched || this.flippedCards.length >= 2) return;
        
        card.flipped = true;
        this.flippedCards.push(index);
        
        card.element.style.background = 'white';
        card.element.innerHTML = `<div style="font-size: 2rem;">${card.value}</div>`;
        card.element.style.transform = 'rotateY(180deg)';
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateDisplay();
            
            setTimeout(() => {
                this.checkMatch();
            }, 1000);
        }
    }
    
    checkMatch() {
        const [index1, index2] = this.flippedCards;
        const card1 = this.cards[index1];
        const card2 = this.cards[index2];
        
        if (card1.value === card2.value) {
            card1.matched = true;
            card2.matched = true;
            this.matchedPairs++;
            
            card1.element.style.opacity = '0.6';
            card2.element.style.opacity = '0.6';
            
            if (this.matchedPairs === this.totalPairs) {
                this.gameWon();
            }
        } else {
            card1.flipped = false;
            card2.flipped = false;
            
            card1.element.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            card1.element.innerHTML = '<div class="memory-card-back">?</div>';
            card1.element.style.transform = 'rotateY(0deg)';
            
            card2.element.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            card2.element.innerHTML = '<div class="memory-card-back">?</div>';
            card2.element.style.transform = 'rotateY(0deg)';
        }
        
        this.flippedCards = [];
    }
    
    updateDisplay() {
        document.getElementById('memoryMoves').textContent = this.moves;
    }
    
    gameWon() {
        this.stop();
        const t = (key) => {
            const lang = window.currentLang || 'en';
            const translations = window.translations;
            if (translations && translations[lang] && translations[lang][key]) {
                return translations[lang][key];
            }
            return translations?.en?.[key] || key;
        };
        const time = Math.floor((Date.now() - this.startTime) / 1000);
        alert(t('gameOverMemory') + '\n' + t('moves') + ': ' + this.moves + '\n' + t('time') + ': ' + time + 's');
    }
}

// 2048 game đã được gỡ bỏ theo yêu cầu
