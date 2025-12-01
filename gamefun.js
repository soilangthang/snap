// Game Cờ Caro với AI
class CaroGame {
    constructor() {
        this.boardSize = 15;
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'X'; // X là người chơi, O là AI
        this.gameOver = false;
        this.difficulty = 'medium';
        this.winningCells = [];
        
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
        cell.textContent = player;
        cell.classList.add('occupied', player === 'X' ? 'player' : 'ai');
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
        
        // Chặn người chơi (ngăn họ thắng)
        const blockMove = this.findWinningMove('X');
        if (blockMove) return blockMove;
        
        // Chơi ở vị trí tốt gần các quân cờ hiện có
        const strategicMove = this.findStrategicMove();
        if (strategicMove) return strategicMove;
        
        // Nếu không có nước tốt, chơi ngẫu nhiên
        return this.getRandomMove();
    }
    
    getBestMove() {
        // Ưu tiên tấn công
        const winMove = this.findWinningMove('O');
        if (winMove) return winMove;
        
        // Chặn người chơi
        const blockMove = this.findWinningMove('X');
        if (blockMove) return blockMove;
        
        // Tìm nước tốt nhất bằng minimax (đơn giản hóa)
        const bestMove = this.findBestMoveWithMinimax();
        if (bestMove) return bestMove;
        
        // Fallback
        return this.getMediumMove();
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
        // Tìm các ô gần các quân cờ hiện có
        const scores = [];
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === null) {
                    let score = 0;
                    
                    // Đếm số quân cờ gần đó
                    for (let di = -2; di <= 2; di++) {
                        for (let dj = -2; dj <= 2; dj++) {
                            if (di === 0 && dj === 0) continue;
                            
                            const ni = i + di;
                            const nj = j + dj;
                            
                            if (ni >= 0 && ni < this.boardSize && nj >= 0 && nj < this.boardSize) {
                                if (this.board[ni][nj] === 'O') {
                                    score += 3; // Ưu tiên gần quân AI
                                } else if (this.board[ni][nj] === 'X') {
                                    score += 2; // Cũng quan tâm đến quân người chơi
                                }
                            }
                        }
                    }
                    
                    // Ưu tiên vị trí trung tâm
                    const centerDist = Math.abs(i - this.boardSize / 2) + Math.abs(j - this.boardSize / 2);
                    score += (this.boardSize - centerDist) * 0.5;
                    
                    scores.push({ row: i, col: j, score: score });
                }
            }
        }
        
        if (scores.length === 0) return null;
        
        scores.sort((a, b) => b.score - a.score);
        return scores[0];
    }
    
    findBestMoveWithMinimax() {
        // Đơn giản hóa minimax - chỉ xem xét các nước gần các quân cờ hiện có
        const candidateMoves = this.getCandidateMoves();
        
        if (candidateMoves.length === 0) return this.getRandomMove();
        
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of candidateMoves) {
            this.board[move.row][move.col] = 'O';
            const score = this.evaluatePosition('O') - this.evaluatePosition('X');
            this.board[move.row][move.col] = null;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove || candidateMoves[0];
    }
    
    getCandidateMoves() {
        const candidates = [];
        const radius = 3;
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] !== null) {
                    // Thêm các ô xung quanh quân cờ
                    for (let di = -radius; di <= radius; di++) {
                        for (let dj = -radius; dj <= radius; dj++) {
                            const ni = i + di;
                            const nj = j + dj;
                            
                            if (
                                ni >= 0 && ni < this.boardSize &&
                                nj >= 0 && nj < this.boardSize &&
                                this.board[ni][nj] === null &&
                                !candidates.some(m => m.row === ni && m.col === nj)
                            ) {
                                candidates.push({ row: ni, col: nj });
                            }
                        }
                    }
                }
            }
        }
        
        // Nếu không có quân cờ nào, chơi ở giữa
        if (candidates.length === 0) {
            const center = Math.floor(this.boardSize / 2);
            return [{ row: center, col: center }];
        }
        
        return candidates;
    }
    
    evaluatePosition(player) {
        let score = 0;
        const directions = [
            [[0, 1]],   // Ngang
            [[1, 0]],   // Dọc
            [[1, 1]],   // Chéo chính
            [[1, -1]]   // Chéo phụ
        ];
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === player) {
                    for (const direction of directions) {
                        let count = 1;
                        let blocked = 0;
                        
                        for (const [dx, dy] of direction) {
                            let newRow = i + dx;
                            let newCol = j + dy;
                            
                            while (
                                newRow >= 0 && newRow < this.boardSize &&
                                newCol >= 0 && newCol < this.boardSize &&
                                this.board[newRow][newCol] === player
                            ) {
                                count++;
                                newRow += dx;
                                newCol += dy;
                            }
                            
                            // Kiểm tra bị chặn
                            if (
                                newRow < 0 || newRow >= this.boardSize ||
                                newCol < 0 || newCol >= this.boardSize ||
                                this.board[newRow][newCol] !== null
                            ) {
                                blocked++;
                            }
                        }
                        
                        // Tính điểm dựa trên số quân liên tiếp
                        if (count >= 5) {
                            score += 10000;
                        } else if (count === 4 && blocked === 0) {
                            score += 1000;
                        } else if (count === 4 && blocked === 1) {
                            score += 100;
                        } else if (count === 3 && blocked === 0) {
                            score += 50;
                        } else if (count === 3 && blocked === 1) {
                            score += 10;
                        } else if (count === 2 && blocked === 0) {
                            score += 5;
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

