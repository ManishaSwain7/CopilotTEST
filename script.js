// Game state and configuration
const GameState = {
    currentPlayer: 'X',
    gameMode: null, // 'multiplayer' or 'computer'
    playerSymbol: 'X',
    computerSymbol: 'O',
    board: Array(9).fill(''),
    gameActive: false,
    scores: { X: 0, O: 0 },
    audioUnlocked: false
};

// Audio management
class AudioManager {
    constructor() {
        this.clickSound = document.getElementById('clickSound');
        this.winSound = document.getElementById('winSound');
        this.context = null;
    }

    async unlockAudio() {
        if (GameState.audioUnlocked) return;
        
        try {
            // Create audio context and unlock
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            await this.context.resume();
            
            // Try to play silent audio to unlock
            await this.clickSound.play().catch(() => {});
            this.clickSound.pause();
            this.clickSound.currentTime = 0;
            
            GameState.audioUnlocked = true;
            console.log('Audio unlocked');
        } catch (error) {
            console.log('Audio unlock failed:', error);
            this.createBackupAudio();
        }
    }

    createBackupAudio() {
        // Create simple audio using Web Audio API as backup
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    async playClick() {
        if (!GameState.audioUnlocked) return;
        
        try {
            if (this.clickSound.readyState >= 2) {
                this.clickSound.currentTime = 0;
                await this.clickSound.play();
            } else {
                this.playBackupClick();
            }
        } catch (error) {
            this.playBackupClick();
        }
    }

    async playWin() {
        if (!GameState.audioUnlocked) return;
        
        try {
            if (this.winSound.readyState >= 2) {
                this.winSound.currentTime = 0;
                await this.winSound.play();
            } else {
                this.playBackupWin();
            }
        } catch (error) {
            this.playBackupWin();
        }
    }

    playBackupClick() {
        if (!this.context) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.frequency.setValueAtTime(800, this.context.currentTime);
        gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.1);
    }

    playBackupWin() {
        if (!this.context) return;
        
        const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.context.createOscillator();
                const gainNode = this.context.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.context.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.context.currentTime);
                gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
                
                oscillator.start(this.context.currentTime);
                oscillator.stop(this.context.currentTime + 0.3);
            }, index * 150);
        });
    }
}

// Initialize audio manager
const audioManager = new AudioManager();

// Screen management
class ScreenManager {
    static showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
}

// Game logic
class TicTacToe {
    constructor() {
        this.winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Mode selection
        document.getElementById('multiplayerBtn').addEventListener('click', () => {
            this.selectMode('multiplayer');
        });
        
        document.getElementById('computerBtn').addEventListener('click', () => {
            this.selectMode('computer');
        });

        // Symbol selection
        document.querySelectorAll('.symbol-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectSymbol(e.target.closest('.symbol-btn').dataset.symbol);
            });
        });

        // Game board
        document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                this.handleCellClick(e.target);
            });
        });

        // Navigation buttons
        document.getElementById('homeBtn').addEventListener('click', () => {
            this.goHome();
        });

        document.getElementById('homePopupBtn').addEventListener('click', () => {
            this.goHome();
        });

        document.getElementById('replayBtn').addEventListener('click', () => {
            this.replay();
        });

        // First interaction to unlock audio
        document.addEventListener('click', () => {
            audioManager.unlockAudio();
        }, { once: true });
    }

    async selectMode(mode) {
        await audioManager.unlockAudio();
        audioManager.playClick();
        
        GameState.gameMode = mode;
        ScreenManager.showScreen('symbolScreen');
    }

    selectSymbol(symbol) {
        audioManager.playClick();
        
        GameState.playerSymbol = symbol;
        GameState.computerSymbol = symbol === 'X' ? 'O' : 'X';
        GameState.currentPlayer = symbol; // Chosen symbol goes first
        
        this.updateLabels();
        this.startGame();
    }

    updateLabels() {
        const player1Label = document.getElementById('player1Label');
        const player2Label = document.getElementById('player2Label');
        
        if (GameState.gameMode === 'computer') {
            player1Label.textContent = `You (${GameState.playerSymbol})`;
            player2Label.textContent = `Computer (${GameState.computerSymbol})`;
        } else {
            player1Label.textContent = `Player ${GameState.playerSymbol}`;
            player2Label.textContent = `Player ${GameState.computerSymbol}`;
        }
    }

    startGame() {
        GameState.board = Array(9).fill('');
        GameState.gameActive = true;
        
        this.updateTurnIndicator();
        this.clearBoard();
        ScreenManager.showScreen('gameScreen');
        
        // If computer goes first
        if (GameState.gameMode === 'computer' && GameState.currentPlayer === GameState.computerSymbol) {
            setTimeout(() => this.makeComputerMove(), 500);
        }
    }

    handleCellClick(cell) {
        const index = parseInt(cell.dataset.index);
        
        if (!GameState.gameActive || GameState.board[index] !== '') {
            return;
        }

        this.makeMove(index, GameState.currentPlayer);
        
        // Check for game end
        const result = this.checkGameEnd();
        if (result) {
            this.endGame(result);
            return;
        }

        // Switch turns
        this.switchTurn();

        // Computer move in single player
        if (GameState.gameMode === 'computer' && GameState.currentPlayer === GameState.computerSymbol) {
            setTimeout(() => this.makeComputerMove(), 500);
        }
    }

    makeMove(index, player) {
        GameState.board[index] = player;
        const cell = document.querySelector(`[data-index="${index}"]`);
        
        // Create piece element with animation
        const piece = document.createElement('span');
        piece.className = 'piece';
        piece.textContent = player;
        cell.appendChild(piece);
        cell.classList.add('occupied');
        
        audioManager.playClick();
    }

    makeComputerMove() {
        if (!GameState.gameActive) return;
        
        const move = this.getBestMove();
        if (move !== -1) {
            this.makeMove(move, GameState.computerSymbol);
            
            const result = this.checkGameEnd();
            if (result) {
                this.endGame(result);
                return;
            }
            
            this.switchTurn();
        }
    }

    getBestMove() {
        // Try to win
        for (let i = 0; i < 9; i++) {
            if (GameState.board[i] === '') {
                GameState.board[i] = GameState.computerSymbol;
                if (this.checkWinner() === GameState.computerSymbol) {
                    GameState.board[i] = '';
                    return i;
                }
                GameState.board[i] = '';
            }
        }

        // Try to block player
        for (let i = 0; i < 9; i++) {
            if (GameState.board[i] === '') {
                GameState.board[i] = GameState.playerSymbol;
                if (this.checkWinner() === GameState.playerSymbol) {
                    GameState.board[i] = '';
                    return i;
                }
                GameState.board[i] = '';
            }
        }

        // Take center if available
        if (GameState.board[4] === '') {
            return 4;
        }

        // Take corners
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => GameState.board[i] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }

        // Take any available space
        const availableMoves = GameState.board
            .map((cell, index) => cell === '' ? index : null)
            .filter(index => index !== null);
        
        return availableMoves.length > 0 ? 
            availableMoves[Math.floor(Math.random() * availableMoves.length)] : -1;
    }

    switchTurn() {
        GameState.currentPlayer = GameState.currentPlayer === 'X' ? 'O' : 'X';
        this.updateTurnIndicator();
    }

    updateTurnIndicator() {
        const indicator = document.getElementById('currentTurn');
        indicator.textContent = `${GameState.currentPlayer}'s Turn`;
    }

    checkGameEnd() {
        const winner = this.checkWinner();
        if (winner) {
            return { type: 'win', winner };
        }
        
        if (GameState.board.every(cell => cell !== '')) {
            return { type: 'tie' };
        }
        
        return null;
    }

    checkWinner() {
        for (const combination of this.winningCombinations) {
            const [a, b, c] = combination;
            if (GameState.board[a] && 
                GameState.board[a] === GameState.board[b] && 
                GameState.board[a] === GameState.board[c]) {
                
                // Store winning combination for animation
                this.winningCombination = combination;
                return GameState.board[a];
            }
        }
        return null;
    }

    endGame(result) {
        GameState.gameActive = false;
        
        if (result.type === 'win') {
            this.highlightWinningCells();
            this.updateScore(result.winner);
            this.showWinPopup(result.winner);
            this.createConfetti();
            audioManager.playWin();
        } else {
            this.showTiePopup();
        }
    }

    highlightWinningCells() {
        this.winningCombination.forEach(index => {
            document.querySelector(`[data-index="${index}"]`).classList.add('winning');
        });
    }

    updateScore(winner) {
        GameState.scores[winner]++;
        document.getElementById('player1Score').textContent = GameState.scores['X'];
        document.getElementById('player2Score').textContent = GameState.scores['O'];
    }

    showWinPopup(winner) {
        const popup = document.getElementById('gamePopup');
        const title = document.getElementById('popupTitle');
        const message = document.getElementById('popupMessage');
        
        if (GameState.gameMode === 'computer') {
            if (winner === GameState.playerSymbol) {
                title.textContent = '🎉 You Win!';
                message.textContent = 'Congratulations! You beat the computer!';
            } else {
                title.textContent = '🤖 Computer Wins!';
                message.textContent = 'Better luck next time!';
            }
        } else {
            title.textContent = `🎉 Player ${winner} Wins!`;
            message.textContent = `Congratulations to Player ${winner}!`;
        }
        
        popup.classList.add('active');
    }

    showTiePopup() {
        const popup = document.getElementById('gamePopup');
        const title = document.getElementById('popupTitle');
        const message = document.getElementById('popupMessage');
        
        title.textContent = '🤝 It\'s a Tie!';
        message.textContent = 'Great game! Nobody wins this round.';
        
        popup.classList.add('active');
    }

    createConfetti() {
        const container = document.getElementById('confetti');
        container.innerHTML = '';
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            container.appendChild(confetti);
        }
        
        // Clean up confetti after animation
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }

    replay() {
        audioManager.playClick();
        document.getElementById('gamePopup').classList.remove('active');
        this.clearBoard();
        this.startGame();
    }

    goHome() {
        audioManager.playClick();
        document.getElementById('gamePopup').classList.remove('active');
        document.getElementById('confetti').innerHTML = '';
        this.clearBoard();
        ScreenManager.showScreen('homeScreen');
    }

    clearBoard() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('occupied', 'winning');
        });
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});

// Prevent context menu on long press (mobile)
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Add touch feedback for better mobile experience
document.addEventListener('touchstart', () => {}, { passive: true });